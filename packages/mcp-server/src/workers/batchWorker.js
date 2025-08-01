const { parentPort, workerData } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const archiver = require('archiver');
const extract = require('extract-zip');
const logger = require('../utils/logger');

let isPaused = false;
let isCancelled = false;

parentPort.on('message', async (message) => {
    const { type, jobId, data } = message;

    if (type === 'pause') {
        isPaused = true;
        return;
    }

    if (type === 'resume') {
        isPaused = false;
        return;
    }

    if (type === 'cancel') {
        isCancelled = true;
        return;
    }

    try {
        switch (type) {
            case 'copy':
                await handleCopy(jobId, data);
                break;
            case 'move':
                await handleMove(jobId, data);
                break;
            case 'delete':
                await handleDelete(jobId, data);
                break;
            case 'compress':
                await handleCompress(jobId, data);
                break;
            case 'extract':
                await handleExtract(jobId, data);
                break;
            case 'rename':
                await handleRename(jobId, data);
                break;
            default:
                throw new Error(`Unknown job type: ${type}`);
        }
    } catch (error) {
        logger.error('Batch worker error:', error);
        parentPort.postMessage({
            type: 'error',
            jobId,
            data: { error: error.message }
        });
    }
});

async function handleCopy(jobId, { source, destination, options = {} }) {
    const {
        recursive = false,
        overwrite = false,
        preserveTimestamps = true,
        filter = '*'
    } = options;

    const stats = {
        total: 0,
        processed: 0,
        failed: 0,
        details: {
            copied: [],
            failed: []
        }
    };

    async function processFile(sourcePath, destPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const sourceStat = await fs.stat(sourcePath);
            if (!sourceStat.isFile()) return;

            if (!overwrite && await fileExists(destPath)) {
                stats.failed++;
                stats.details.failed.push({
                    source: sourcePath,
                    destination: destPath,
                    error: 'File already exists'
                });
                return;
            }

            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await copyFile(sourcePath, destPath);

            if (preserveTimestamps) {
                await fs.utimes(destPath, sourceStat.atime, sourceStat.mtime);
            }

            stats.processed++;
            stats.details.copied.push({
                source: sourcePath,
                destination: destPath,
                size: sourceStat.size
            });
        } catch (error) {
            stats.failed++;
            stats.details.failed.push({
                source: sourcePath,
                destination: destPath,
                error: error.message
            });
        }

        updateProgress(stats);
    }

    async function processDirectory(dirPath, destPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (isCancelled) return;

                const sourcePath = path.join(dirPath, entry.name);
                const targetPath = path.join(destPath, entry.name);

                if (entry.isDirectory() && recursive) {
                    await processDirectory(sourcePath, targetPath);
                } else if (entry.isFile() && matchesFilter(entry.name, filter)) {
                    await processFile(sourcePath, targetPath);
                }
            }
        } catch (error) {
            logger.error('Error processing directory:', error);
        }
    }

    await processDirectory(source, destination);
    parentPort.postMessage({
        type: 'completed',
        jobId,
        data: stats
    });
}

async function handleMove(jobId, { source, destination, options = {} }) {
    const {
        recursive = false,
        overwrite = false,
        preserveTimestamps = true,
        filter = '*'
    } = options;

    const stats = {
        total: 0,
        processed: 0,
        failed: 0,
        details: {
            moved: [],
            failed: []
        }
    };

    async function processFile(sourcePath, destPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const sourceStat = await fs.stat(sourcePath);
            if (!sourceStat.isFile()) return;

            if (!overwrite && await fileExists(destPath)) {
                stats.failed++;
                stats.details.failed.push({
                    source: sourcePath,
                    destination: destPath,
                    error: 'File already exists'
                });
                return;
            }

            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.rename(sourcePath, destPath);

            if (preserveTimestamps) {
                await fs.utimes(destPath, sourceStat.atime, sourceStat.mtime);
            }

            stats.processed++;
            stats.details.moved.push({
                source: sourcePath,
                destination: destPath,
                size: sourceStat.size
            });
        } catch (error) {
            stats.failed++;
            stats.details.failed.push({
                source: sourcePath,
                destination: destPath,
                error: error.message
            });
        }

        updateProgress(stats);
    }

    async function processDirectory(dirPath, destPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (isCancelled) return;

                const sourcePath = path.join(dirPath, entry.name);
                const targetPath = path.join(destPath, entry.name);

                if (entry.isDirectory() && recursive) {
                    await processDirectory(sourcePath, targetPath);
                } else if (entry.isFile() && matchesFilter(entry.name, filter)) {
                    await processFile(sourcePath, targetPath);
                }
            }
        } catch (error) {
            logger.error('Error processing directory:', error);
        }
    }

    await processDirectory(source, destination);
    parentPort.postMessage({
        type: 'completed',
        jobId,
        data: stats
    });
}

async function handleDelete(jobId, { paths, options = {} }) {
    const {
        recursive = false,
        force = false
    } = options;

    const stats = {
        total: paths.length,
        processed: 0,
        failed: 0,
        details: {
            deleted: [],
            failed: []
        }
    };

    async function processPath(targetPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const stat = await fs.stat(targetPath);
            if (stat.isDirectory() && recursive) {
                const entries = await fs.readdir(targetPath);
                for (const entry of entries) {
                    if (isCancelled) return;
                    await processPath(path.join(targetPath, entry));
                }
            }

            await fs.unlink(targetPath);
            stats.processed++;
            stats.details.deleted.push({
                path: targetPath,
                size: stat.size
            });
        } catch (error) {
            if (force) {
                try {
                    await fs.rm(targetPath, { recursive: true, force: true });
                    stats.processed++;
                    stats.details.deleted.push({
                        path: targetPath,
                        force: true
                    });
                } catch (rmError) {
                    stats.failed++;
                    stats.details.failed.push({
                        path: targetPath,
                        error: rmError.message
                    });
                }
            } else {
                stats.failed++;
                stats.details.failed.push({
                    path: targetPath,
                    error: error.message
                });
            }
        }

        updateProgress(stats);
    }

    for (const targetPath of paths) {
        if (isCancelled) break;
        await processPath(targetPath);
    }

    parentPort.postMessage({
        type: 'completed',
        jobId,
        data: stats
    });
}

async function handleCompress(jobId, { source, destination, options = {} }) {
    const {
        format = 'zip',
        level = 6,
        password = null
    } = options;

    const stats = {
        total: 0,
        processed: 0,
        failed: 0,
        details: {
            compressed: [],
            failed: []
        }
    };

    return new Promise((resolve, reject) => {
        const output = createWriteStream(destination);
        const archive = archiver(format, {
            zlib: { level }
        });

        output.on('close', () => {
            stats.processed++;
            stats.details.compressed.push({
                source,
                destination,
                size: archive.pointer()
            });
            parentPort.postMessage({
                type: 'completed',
                jobId,
                data: stats
            });
            resolve();
        });

        archive.on('error', (error) => {
            stats.failed++;
            stats.details.failed.push({
                source,
                destination,
                error: error.message
            });
            reject(error);
        });

        archive.on('progress', (progress) => {
            stats.total = progress.entries.total;
            stats.processed = progress.entries.processed;
            updateProgress(stats);
        });

        if (password) {
            archive.encrypt(password);
        }

        archive.pipe(output);

        if (fs.statSync(source).isDirectory()) {
            archive.directory(source, false);
        } else {
            archive.file(source, { name: path.basename(source) });
        }

        archive.finalize();
    });
}

async function handleExtract(jobId, { source, destination, options = {} }) {
    const {
        password = null,
        overwrite = false
    } = options;

    const stats = {
        total: 0,
        processed: 0,
        failed: 0,
        details: {
            extracted: [],
            failed: []
        }
    };

    try {
        await fs.mkdir(destination, { recursive: true });
        await extract(source, {
            dir: destination,
            password,
            overwrite
        });

        stats.processed++;
        stats.details.extracted.push({
            source,
            destination
        });

        parentPort.postMessage({
            type: 'completed',
            jobId,
            data: stats
        });
    } catch (error) {
        stats.failed++;
        stats.details.failed.push({
            source,
            destination,
            error: error.message
        });
        throw error;
    }
}

async function handleRename(jobId, { source, pattern, options = {} }) {
    const {
        recursive = false,
        caseSensitive = false,
        useRegex = false
    } = options;

    const stats = {
        total: 0,
        processed: 0,
        failed: 0,
        details: {
            renamed: [],
            failed: []
        }
    };

    async function processFile(filePath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const dir = path.dirname(filePath);
            const oldName = path.basename(filePath);
            let newName;

            if (useRegex) {
                const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
                newName = oldName.replace(regex, '');
            } else {
                newName = pattern.replace(/\{name\}/g, oldName);
            }

            if (newName !== oldName) {
                const newPath = path.join(dir, newName);
                await fs.rename(filePath, newPath);
                stats.processed++;
                stats.details.renamed.push({
                    oldPath: filePath,
                    newPath
                });
            }
        } catch (error) {
            stats.failed++;
            stats.details.failed.push({
                path: filePath,
                error: error.message
            });
        }

        updateProgress(stats);
    }

    async function processDirectory(dirPath) {
        if (isCancelled) return;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (isCancelled) return;

                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory() && recursive) {
                    await processDirectory(fullPath);
                } else if (entry.isFile()) {
                    await processFile(fullPath);
                }
            }
        } catch (error) {
            logger.error('Error processing directory:', error);
        }
    }

    await processDirectory(source);
    parentPort.postMessage({
        type: 'completed',
        jobId,
        data: stats
    });
}

async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

async function copyFile(source, destination) {
    return new Promise((resolve, reject) => {
        const readStream = createReadStream(source);
        const writeStream = createWriteStream(destination);

        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);

        readStream.pipe(writeStream);
    });
}

function matchesFilter(filename, pattern) {
    if (pattern === '*') return true;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
}

function updateProgress(stats) {
    const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
    parentPort.postMessage({
        type: 'progress',
        jobId: workerData.jobId,
        data: {
            progress,
            ...stats
        }
    });
} 