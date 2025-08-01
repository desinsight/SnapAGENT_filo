const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs/promises');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const config = require('../config');

class PerformanceOptimizer extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
        this.jobs = new Map();
        this.memoryStats = {
            total: 0,
            used: 0,
            free: 0
        };
        this.diskStats = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // 워커 풀 초기화
        const workerCount = config.worker.poolSize || 4;
        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker(path.join(__dirname, '../workers/optimizeWorker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this, worker));
            worker.on('error', this.handleWorkerError.bind(this, worker));
            this.workers.set(worker.threadId, worker);
        }

        // 디스크 정보 수집
        await this.collectDiskInfo();
        this.isInitialized = true;
        logger.info('Performance optimizer initialized');
    }

    getTools() {
        return [
            {
                name: 'optimize_large_file',
                description: '대용량 파일 처리 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string', description: '파일 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                chunkSize: { type: 'number', description: '청크 크기 (바이트)' },
                                useMemoryMap: { type: 'boolean', description: '메모리 매핑 사용' },
                                bufferSize: { type: 'number', description: '버퍼 크기 (바이트)' }
                            }
                        }
                    },
                    required: ['filePath']
                }
            },
            {
                name: 'optimize_directory',
                description: '대용량 디렉토리 처리 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        dirPath: { type: 'string', description: '디렉토리 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                batchSize: { type: 'number', description: '배치 크기' },
                                useIndex: { type: 'boolean', description: '인덱스 사용' },
                                maxDepth: { type: 'number', description: '최대 깊이' }
                            }
                        }
                    },
                    required: ['dirPath']
                }
            },
            {
                name: 'optimize_storage',
                description: '스토리지 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '경로' },
                        options: {
                            type: 'object',
                            properties: {
                                storageType: { type: 'string', description: '스토리지 타입 (SSD/HDD)' },
                                optimizeStrategy: { type: 'string', description: '최적화 전략' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'optimize_network',
                description: '네트워크 드라이브 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        networkPath: { type: 'string', description: '네트워크 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                bufferSize: { type: 'number', description: '버퍼 크기' },
                                timeout: { type: 'number', description: '타임아웃 (ms)' },
                                retryCount: { type: 'number', description: '재시도 횟수' }
                            }
                        }
                    },
                    required: ['networkPath']
                }
            },
            {
                name: 'optimize_memory',
                description: '메모리 사용량 최적화',
                parameters: {
                    type: 'object',
                    properties: {
                        options: {
                            type: 'object',
                            properties: {
                                maxMemory: { type: 'number', description: '최대 메모리 (MB)' },
                                gcThreshold: { type: 'number', description: 'GC 임계값 (MB)' }
                            }
                        }
                    }
                }
            },
            {
                name: 'resume_job',
                description: '중단된 작업 재시작',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: '작업 ID' },
                        options: {
                            type: 'object',
                            properties: {
                                checkpoint: { type: 'string', description: '체크포인트' },
                                validate: { type: 'boolean', description: '유효성 검사' }
                            }
                        }
                    },
                    required: ['jobId']
                }
            }
        ];
    }

    async optimizeLargeFile(filePath, options = {}) {
        const {
            chunkSize = 1024 * 1024, // 1MB
            useMemoryMap = false,
            bufferSize = 64 * 1024 // 64KB
        } = options;

        const jobId = `large_file_${Date.now()}`;
        const job = {
            id: jobId,
            type: 'large_file',
            filePath,
            options,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };

        this.jobs.set(jobId, job);
        this.emit('jobStarted', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'optimize_large_file', {
                jobId,
                filePath,
                options: {
                    chunkSize,
                    useMemoryMap,
                    bufferSize
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async optimizeDirectory(dirPath, options = {}) {
        const {
            batchSize = 1000,
            useIndex = true,
            maxDepth = -1
        } = options;

        const jobId = `directory_${Date.now()}`;
        const job = {
            id: jobId,
            type: 'directory',
            dirPath,
            options,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };

        this.jobs.set(jobId, job);
        this.emit('jobStarted', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'optimize_directory', {
                jobId,
                dirPath,
                options: {
                    batchSize,
                    useIndex,
                    maxDepth
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async optimizeStorage(path, options = {}) {
        const { storageType, optimizeStrategy } = options;
        const diskInfo = this.diskStats.get(path);

        if (!diskInfo) {
            throw new Error('Storage information not available');
        }

        const jobId = `storage_${Date.now()}`;
        const job = {
            id: jobId,
            type: 'storage',
            path,
            options,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };

        this.jobs.set(jobId, job);
        this.emit('jobStarted', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'optimize_storage', {
                jobId,
                path,
                diskInfo,
                options: {
                    storageType,
                    optimizeStrategy
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async optimizeNetwork(networkPath, options = {}) {
        const {
            bufferSize = 1024 * 1024, // 1MB
            timeout = 30000, // 30초
            retryCount = 3
        } = options;

        const jobId = `network_${Date.now()}`;
        const job = {
            id: jobId,
            type: 'network',
            networkPath,
            options,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };

        this.jobs.set(jobId, job);
        this.emit('jobStarted', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'optimize_network', {
                jobId,
                networkPath,
                options: {
                    bufferSize,
                    timeout,
                    retryCount
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async optimizeMemory(options = {}) {
        const {
            maxMemory = 1024, // 1GB
            gcThreshold = 768 // 768MB
        } = options;

        const jobId = `memory_${Date.now()}`;
        const job = {
            id: jobId,
            type: 'memory',
            options,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };

        this.jobs.set(jobId, job);
        this.emit('jobStarted', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'optimize_memory', {
                jobId,
                options: {
                    maxMemory,
                    gcThreshold
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async resumeJob(jobId, options = {}) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        if (job.status !== 'failed' && job.status !== 'paused') {
            throw new Error('Job cannot be resumed');
        }

        const { checkpoint, validate = true } = options;

        job.status = 'running';
        job.resumeTime = Date.now();
        this.emit('jobResumed', job);

        try {
            const worker = this.getAvailableWorker();
            const result = await this.executeWorkerTask(worker, 'resume_job', {
                jobId,
                job,
                options: {
                    checkpoint,
                    validate
                }
            });

            job.status = 'completed';
            job.result = result;
            this.emit('jobCompleted', job);

            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('jobFailed', job);
            throw error;
        }
    }

    async collectDiskInfo() {
        try {
            const drives = await this.getDrives();
            for (const drive of drives) {
                const stats = await this.getDriveStats(drive);
                this.diskStats.set(drive, stats);
            }
        } catch (error) {
            logger.error('Error collecting disk information:', error);
        }
    }

    async getDrives() {
        // 운영체제별 드라이브 목록 조회 로직
        return ['C:', 'D:', 'E:'];
    }

    async getDriveStats(drive) {
        try {
            const stats = await fs.statfs(drive);
            return {
                type: stats.type,
                total: stats.blocks * stats.bsize,
                free: stats.bfree * stats.bsize,
                used: (stats.blocks - stats.bfree) * stats.bsize,
                isSSD: await this.isSSD(drive)
            };
        } catch (error) {
            logger.error(`Error getting drive stats for ${drive}:`, error);
            return null;
        }
    }

    async isSSD(drive) {
        // SSD 여부 확인 로직
        return false;
    }

    getAvailableWorker() {
        // 사용 가능한 워커 선택 로직
        return Array.from(this.workers.values())[0];
    }

    async executeWorkerTask(worker, type, data) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker task timeout'));
            }, 30000);

            worker.once('message', (message) => {
                clearTimeout(timeout);
                if (message.type === 'error') {
                    reject(new Error(message.error));
                } else {
                    resolve(message.data);
                }
            });

            worker.postMessage({ type, data });
        });
    }

    handleWorkerMessage(worker, message) {
        if (message.type === 'progress') {
            const job = this.jobs.get(message.data.jobId);
            if (job) {
                job.progress = message.data.progress;
                this.emit('jobProgress', job);
            }
        }
    }

    handleWorkerError(worker, error) {
        logger.error('Worker error:', error);
    }
}

module.exports = PerformanceOptimizer; 