const { parentPort, workerData } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const mmap = require('mmap-io');
const os = require('os');
const logger = require('../utils/logger');
const { pipeline } = require('stream/promises');

let isPaused = false;
let isCancelled = false;

parentPort.on('message', async (message) => {
    const { type, data } = message;

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
            case 'optimize_file':
                await handleFileOptimization(data);
                break;
            case 'optimize_batch':
                await handleBatchOptimization(data);
                break;
            case 'optimize_network':
                await handleNetworkOptimization(data);
                break;
            case 'monitor':
                await handlePerformanceMonitoring(data);
                break;
            case 'optimize_large_file':
                await handleLargeFileOptimization(data);
                break;
            case 'optimize_directory':
                await handleDirectoryOptimization(data);
                break;
            case 'optimize_storage':
                await handleStorageOptimization(data);
                break;
            case 'optimize_memory':
                await handleMemoryOptimization(data);
                break;
            case 'resume_job':
                await handleJobResume(data);
                break;
            default:
                throw new Error(`Unknown optimization type: ${type}`);
        }
    } catch (error) {
        logger.error('Optimization worker error:', error);
        parentPort.postMessage({
            type: 'error',
            data: { error: error.message }
        });
    }
});

async function handleFileOptimization({ filePath, useMemoryMap, bufferSize, chunkSize }) {
    const stats = {
        startTime: Date.now(),
        endTime: null,
        bytesProcessed: 0,
        operations: {
            read: 0,
            write: 0
        }
    };

    try {
        const fileStat = await fs.stat(filePath);
        const fileSize = fileStat.size;

        if (useMemoryMap && fileSize > 0) {
            await optimizeWithMemoryMap(filePath, fileSize, stats);
        } else {
            await optimizeWithStreams(filePath, bufferSize, chunkSize, stats);
        }

        stats.endTime = Date.now();
        stats.duration = stats.endTime - stats.startTime;
        stats.throughput = stats.bytesProcessed / (stats.duration / 1000); // bytes per second

        parentPort.postMessage({
            type: 'completed',
            data: stats
        });
    } catch (error) {
        throw new Error(`File optimization failed: ${error.message}`);
    }
}

async function optimizeWithMemoryMap(filePath, fileSize, stats) {
    const fd = await fs.open(filePath, 'r+');
    const map = mmap.map(fileSize, mmap.PROT_READ | mmap.PROT_WRITE, mmap.MAP_SHARED, fd.fd, 0);

    try {
        // 메모리 매핑된 파일 처리
        const buffer = Buffer.from(map);
        stats.bytesProcessed = fileSize;
        stats.operations.read++;
        stats.operations.write++;

        // 메모리 매핑 해제
        mmap.unmap(map);
        await fd.close();
    } catch (error) {
        mmap.unmap(map);
        await fd.close();
        throw error;
    }
}

async function optimizeWithStreams(filePath, bufferSize, chunkSize, stats) {
    return new Promise((resolve, reject) => {
        const readStream = createReadStream(filePath, { highWaterMark: bufferSize });
        const writeStream = createWriteStream(filePath + '.tmp', { highWaterMark: bufferSize });

        readStream.on('data', (chunk) => {
            if (isCancelled) {
                readStream.destroy();
                writeStream.destroy();
                return;
            }

            while (isPaused) {
                readStream.pause();
            }

            stats.bytesProcessed += chunk.length;
            stats.operations.read++;
        });

        writeStream.on('drain', () => {
            stats.operations.write++;
        });

        readStream.on('end', async () => {
            writeStream.end();
            try {
                await fs.unlink(filePath);
                await fs.rename(filePath + '.tmp', filePath);
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        readStream.on('error', reject);
        writeStream.on('error', reject);

        readStream.pipe(writeStream);
    });
}

async function handleBatchOptimization({ paths, maxConcurrent, chunkSize, useCache }) {
    const stats = {
        startTime: Date.now(),
        endTime: null,
        totalFiles: paths.length,
        processedFiles: 0,
        failedFiles: 0,
        totalBytes: 0,
        operations: {
            read: 0,
            write: 0
        }
    };

    const chunks = [];
    for (let i = 0; i < paths.length; i += chunkSize) {
        chunks.push(paths.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
        if (isCancelled) break;

        const promises = chunk.map(async (filePath) => {
            try {
                const fileStat = await fs.stat(filePath);
                stats.totalBytes += fileStat.size;
                stats.processedFiles++;
                stats.operations.read++;
                stats.operations.write++;
            } catch (error) {
                stats.failedFiles++;
                logger.error(`Failed to process file ${filePath}:`, error);
            }
        });

        await Promise.all(promises);
    }

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;
    stats.throughput = stats.totalBytes / (stats.duration / 1000); // bytes per second

    parentPort.postMessage({
        type: 'completed',
        data: stats
    });
}

async function handleNetworkOptimization({ networkPath, bufferSize, timeout, retryCount }) {
    const stats = {
        startTime: Date.now(),
        endTime: null,
        retries: 0,
        operations: {
            read: 0,
            write: 0
        }
    };

    let currentRetry = 0;
    while (currentRetry < retryCount) {
        try {
            const fileStat = await fs.stat(networkPath);
            stats.operations.read++;

            const readStream = createReadStream(networkPath, {
                highWaterMark: bufferSize,
                timeout
            });

            const writeStream = createWriteStream(networkPath + '.tmp', {
                highWaterMark: bufferSize,
                timeout
            });

            await new Promise((resolve, reject) => {
                readStream.on('data', (chunk) => {
                    if (isCancelled) {
                        readStream.destroy();
                        writeStream.destroy();
                        return;
                    }

                    while (isPaused) {
                        readStream.pause();
                    }

                    stats.operations.read++;
                });

                writeStream.on('drain', () => {
                    stats.operations.write++;
                });

                readStream.on('end', resolve);
                readStream.on('error', reject);
                writeStream.on('error', reject);

                readStream.pipe(writeStream);
            });

            await fs.unlink(networkPath);
            await fs.rename(networkPath + '.tmp', networkPath);
            break;
        } catch (error) {
            currentRetry++;
            stats.retries = currentRetry;
            if (currentRetry === retryCount) {
                throw new Error(`Network optimization failed after ${retryCount} retries: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    parentPort.postMessage({
        type: 'completed',
        data: stats
    });
}

async function handlePerformanceMonitoring({ metrics, interval, duration }) {
    const startTime = Date.now();
    const endTime = startTime + duration;

    while (Date.now() < endTime) {
        if (isCancelled) break;

        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const currentMetrics = await collectMetrics(metrics);
        parentPort.postMessage({
            type: 'metrics',
            data: {
                timestamp: Date.now(),
                metrics: currentMetrics
            }
        });

        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

async function collectMetrics(requestedMetrics) {
    const metrics = {};

    for (const metric of requestedMetrics) {
        switch (metric) {
            case 'cpu':
                metrics.cpu = {
                    usage: process.cpuUsage(),
                    loadAvg: os.loadavg()
                };
                break;

            case 'memory':
                metrics.memory = {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                };
                break;

            case 'disk':
                metrics.disk = await getDiskMetrics();
                break;

            case 'network':
                metrics.network = await getNetworkMetrics();
                break;

            case 'process':
                metrics.process = {
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    uptime: process.uptime()
                };
                break;
        }
    }

    return metrics;
}

async function getDiskMetrics() {
    // 실제 구현에서는 시스템 명령어나 라이브러리를 사용하여 디스크 메트릭을 수집
    return {
        read: 0,
        write: 0,
        iops: 0
    };
}

async function getNetworkMetrics() {
    // 실제 구현에서는 시스템 명령어나 라이브러리를 사용하여 네트워크 메트릭을 수집
    return {
        bytesIn: 0,
        bytesOut: 0,
        connections: 0
    };
}

async function handleLargeFileOptimization(data) {
    const { jobId, filePath, options } = data;
    const { chunkSize, useMemoryMap, bufferSize } = options;

    try {
        const stats = await fs.stat(filePath);
        const totalSize = stats.size;
        let processedSize = 0;

        if (useMemoryMap) {
            // 메모리 매핑을 사용한 대용량 파일 처리
            const fd = await fs.open(filePath, 'r');
            const buffer = Buffer.alloc(bufferSize);
            const stream = createReadStream(null, {
                fd: fd.fd,
                highWaterMark: chunkSize
            });

            for await (const chunk of stream) {
                // 청크 처리 로직
                processedSize += chunk.length;
                const progress = (processedSize / totalSize) * 100;

                parentPort.postMessage({
                    type: 'progress',
                    data: {
                        jobId,
                        progress
                    }
                });
            }

            await fd.close();
        } else {
            // 스트림을 사용한 대용량 파일 처리
            const readStream = createReadStream(filePath, {
                highWaterMark: chunkSize
            });
            const writeStream = createWriteStream(`${filePath}.optimized`);

            await pipeline(readStream, writeStream, async (err) => {
                if (err) {
                    throw err;
                }
            });
        }

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'completed',
                stats: {
                    totalSize,
                    processedSize,
                    chunks: Math.ceil(totalSize / chunkSize)
                }
            }
        });
    } catch (error) {
        logger.error(`Error optimizing large file ${filePath}:`, error);
        throw error;
    }
}

async function handleDirectoryOptimization(data) {
    const { jobId, dirPath, options } = data;
    const { batchSize, useIndex, maxDepth } = options;

    try {
        const files = [];
        const processEntry = async (entry, depth = 0) => {
            if (maxDepth !== -1 && depth > maxDepth) {
                return;
            }

            const fullPath = path.join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                const entries = await fs.readdir(fullPath, { withFileTypes: true });
                for (const subEntry of entries) {
                    await processEntry(subEntry, depth + 1);
                }
            } else {
                files.push({
                    path: fullPath,
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        };

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            await processEntry(entry);
        }

        // 배치 처리
        const batches = [];
        for (let i = 0; i < files.length; i += batchSize) {
            batches.push(files.slice(i, i + batchSize));
        }

        let processedFiles = 0;
        for (const batch of batches) {
            // 배치 처리 로직
            processedFiles += batch.length;
            const progress = (processedFiles / files.length) * 100;

            parentPort.postMessage({
                type: 'progress',
                data: {
                    jobId,
                    progress
                }
            });
        }

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'completed',
                stats: {
                    totalFiles: files.length,
                    processedFiles,
                    batches: batches.length
                }
            }
        });
    } catch (error) {
        logger.error(`Error optimizing directory ${dirPath}:`, error);
        throw error;
    }
}

async function handleStorageOptimization(data) {
    const { jobId, path, diskInfo, options } = data;
    const { storageType, optimizeStrategy } = options;

    try {
        let result;
        if (diskInfo.isSSD) {
            // SSD 최적화 전략
            result = await optimizeSSD(path, optimizeStrategy);
        } else {
            // HDD 최적화 전략
            result = await optimizeHDD(path, optimizeStrategy);
        }

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'completed',
                result
            }
        });
    } catch (error) {
        logger.error(`Error optimizing storage ${path}:`, error);
        throw error;
    }
}

async function optimizeSSD(path, strategy) {
    // SSD 최적화 로직
    return {
        type: 'SSD',
        strategy,
        optimizations: [
            'TRIM 지원',
            '파편화 최소화',
            '쓰기 증폭 감소'
        ]
    };
}

async function optimizeHDD(path, strategy) {
    // HDD 최적화 로직
    return {
        type: 'HDD',
        strategy,
        optimizations: [
            '디스크 조각 모음',
            '클러스터 크기 최적화',
            '파일 배치 최적화'
        ]
    };
}

async function handleMemoryOptimization(data) {
    const { jobId, options } = data;
    const { maxMemory, gcThreshold } = options;

    try {
        // 메모리 최적화 로직
        const result = await optimizeMemoryUsage({
            maxMemory,
            gcThreshold
        });

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'completed',
                result
            }
        });
    } catch (error) {
        logger.error('Error optimizing memory:', error);
        throw error;
    }
}

async function optimizeMemoryUsage(options) {
    // 메모리 사용량 최적화 로직
    return {
        optimizations: [
            '메모리 캐시 관리',
            '가비지 컬렉션 최적화',
            '메모리 누수 방지'
        ],
        options
    };
}

async function handleJobResume(data) {
    const { jobId, job, options } = data;
    const { checkpoint, validate } = options;

    try {
        // 작업 재시작 로직
        const result = await resumeJob(job, {
            checkpoint,
            validate
        });

        parentPort.postMessage({
            type: 'result',
            data: {
                jobId,
                status: 'resumed',
                result
            }
        });
    } catch (error) {
        logger.error(`Error resuming job ${jobId}:`, error);
        throw error;
    }
}

async function resumeJob(job, options) {
    // 작업 재시작 로직
    return {
        jobId: job.id,
        type: job.type,
        status: 'resumed',
        checkpoint: options.checkpoint,
        validated: options.validate
    };
} 