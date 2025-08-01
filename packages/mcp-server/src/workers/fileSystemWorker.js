const { parentPort } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const logger = require('../utils/logger');

// 파일 시스템 작업 처리
parentPort.on('message', async (message) => {
    try {
        switch (message.type) {
            case 'create_file':
                await handleCreateFile(message.data);
                break;
            case 'read_file':
                await handleReadFile(message.data);
                break;
            case 'update_file':
                await handleUpdateFile(message.data);
                break;
            case 'delete_file':
                await handleDeleteFile(message.data);
                break;
            case 'move_file':
                await handleMoveFile(message.data);
                break;
            case 'copy_file':
                await handleCopyFile(message.data);
                break;
            case 'get_file_info':
                await handleGetFileInfo(message.data);
                break;
            default:
                throw new Error(`Unknown task type: ${message.type}`);
        }
    } catch (error) {
        logger.error('Error in file system worker:', error);
        parentPort.postMessage({
            type: 'error',
            error: error.message
        });
    }
});

async function handleCreateFile(data) {
    const { jobId, path, content, options } = data;
    const { encoding = 'utf8', mode = 0o666 } = options;

    try {
        await fs.writeFile(path, content, { encoding, mode });
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'created',
                path
            }
        });
    } catch (error) {
        logger.error(`Error creating file ${path}:`, error);
        throw error;
    }
}

async function handleReadFile(data) {
    const { jobId, path, options } = data;
    const { encoding = 'utf8', start, end } = options;

    try {
        const content = await fs.readFile(path, { encoding });
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                path,
                content: start !== undefined && end !== undefined
                    ? content.slice(start, end)
                    : content
            }
        });
    } catch (error) {
        logger.error(`Error reading file ${path}:`, error);
        throw error;
    }
}

async function handleUpdateFile(data) {
    const { jobId, path, content, options } = data;
    const { encoding = 'utf8', append = false } = options;

    try {
        if (append) {
            await fs.appendFile(path, content, { encoding });
        } else {
            await fs.writeFile(path, content, { encoding });
        }
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'updated',
                path
            }
        });
    } catch (error) {
        logger.error(`Error updating file ${path}:`, error);
        throw error;
    }
}

async function handleDeleteFile(data) {
    const { jobId, path, options } = data;
    const { force = false, recursive = false } = options;

    try {
        await fs.rm(path, { force, recursive });
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'deleted',
                path
            }
        });
    } catch (error) {
        logger.error(`Error deleting file ${path}:`, error);
        throw error;
    }
}

async function handleMoveFile(data) {
    const { jobId, source, destination, options } = data;
    const { overwrite = false, preserveTimestamps = true } = options;

    try {
        await fs.rename(source, destination);
        if (preserveTimestamps) {
            const stats = await fs.stat(source);
            await fs.utimes(destination, stats.atime, stats.mtime);
        }
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'moved',
                source,
                destination
            }
        });
    } catch (error) {
        logger.error(`Error moving file from ${source} to ${destination}:`, error);
        throw error;
    }
}

async function handleCopyFile(data) {
    const { jobId, source, destination, options } = data;
    const { overwrite = false, preserveTimestamps = true } = options;

    try {
        const readStream = createReadStream(source);
        const writeStream = createWriteStream(destination);

        await pipeline(readStream, writeStream);

        if (preserveTimestamps) {
            const stats = await fs.stat(source);
            await fs.utimes(destination, stats.atime, stats.mtime);
        }

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'copied',
                source,
                destination
            }
        });
    } catch (error) {
        logger.error(`Error copying file from ${source} to ${destination}:`, error);
        throw error;
    }
}

async function handleGetFileInfo(data) {
    const { jobId, path, options } = data;
    const { followSymlinks = true } = options;

    try {
        const stats = await fs.stat(path, { bigint: true });
        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                path,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                isSymbolicLink: stats.isSymbolicLink(),
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                mode: stats.mode,
                uid: stats.uid,
                gid: stats.gid
            }
        });
    } catch (error) {
        logger.error(`Error getting file info for ${path}:`, error);
        throw error;
    }
} 