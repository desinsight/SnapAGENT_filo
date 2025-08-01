const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../utils/logger');
const config = require('../config');

class FileSystemEngine extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
        this.jobs = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // 워커 풀 초기화
        const workerCount = config.worker.poolSize || 4;
        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker(path.join(__dirname, '../workers/fileSystemWorker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this, worker));
            worker.on('error', this.handleWorkerError.bind(this, worker));
            this.workers.set(worker.threadId, worker);
        }

        this.isInitialized = true;
        logger.info('File system engine initialized');
    }

    getTools() {
        return [
            {
                name: 'create_file',
                description: '파일 생성',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        content: { type: 'string', description: '파일 내용' },
                        options: {
                            type: 'object',
                            properties: {
                                encoding: { type: 'string', description: '인코딩' },
                                mode: { type: 'number', description: '파일 모드' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'read_file',
                description: '파일 읽기',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                encoding: { type: 'string', description: '인코딩' },
                                start: { type: 'number', description: '시작 위치' },
                                end: { type: 'number', description: '끝 위치' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'update_file',
                description: '파일 업데이트',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        content: { type: 'string', description: '파일 내용' },
                        options: {
                            type: 'object',
                            properties: {
                                encoding: { type: 'string', description: '인코딩' },
                                append: { type: 'boolean', description: '추가 모드' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'delete_file',
                description: '파일 삭제',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                force: { type: 'boolean', description: '강제 삭제' },
                                recursive: { type: 'boolean', description: '재귀 삭제' }
                            }
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'move_file',
                description: '파일 이동',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                overwrite: { type: 'boolean', description: '덮어쓰기' },
                                preserveTimestamps: { type: 'boolean', description: '타임스탬프 보존' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'copy_file',
                description: '파일 복사',
                parameters: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: '소스 경로' },
                        destination: { type: 'string', description: '대상 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                overwrite: { type: 'boolean', description: '덮어쓰기' },
                                preserveTimestamps: { type: 'boolean', description: '타임스탬프 보존' }
                            }
                        }
                    },
                    required: ['source', 'destination']
                }
            },
            {
                name: 'get_file_info',
                description: '파일 정보 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '파일 경로' },
                        options: {
                            type: 'object',
                            properties: {
                                followSymlinks: { type: 'boolean', description: '심볼릭 링크 따라가기' }
                            }
                        }
                    },
                    required: ['path']
                }
            }
        ];
    }

    async createFile(path, content = '', options = {}) {
        const { encoding = 'utf8', mode = 0o666 } = options;

        try {
            await fs.writeFile(path, content, { encoding, mode });
            return { status: 'created', path };
        } catch (error) {
            logger.error(`Error creating file ${path}:`, error);
            throw error;
        }
    }

    async readFile(path, options = {}) {
        const { encoding = 'utf8', start, end } = options;

        try {
            const content = await fs.readFile(path, { encoding });
            return {
                path,
                content: start !== undefined && end !== undefined
                    ? content.slice(start, end)
                    : content
            };
        } catch (error) {
            logger.error(`Error reading file ${path}:`, error);
            throw error;
        }
    }

    async updateFile(path, content, options = {}) {
        const { encoding = 'utf8', append = false } = options;

        try {
            if (append) {
                await fs.appendFile(path, content, { encoding });
            } else {
                await fs.writeFile(path, content, { encoding });
            }
            return { status: 'updated', path };
        } catch (error) {
            logger.error(`Error updating file ${path}:`, error);
            throw error;
        }
    }

    async deleteFile(path, options = {}) {
        const { force = false, recursive = false } = options;

        try {
            await fs.rm(path, { force, recursive });
            return { status: 'deleted', path };
        } catch (error) {
            logger.error(`Error deleting file ${path}:`, error);
            throw error;
        }
    }

    async moveFile(source, destination, options = {}) {
        const { overwrite = false, preserveTimestamps = true } = options;

        try {
            await fs.rename(source, destination);
            if (preserveTimestamps) {
                const stats = await fs.stat(source);
                await fs.utimes(destination, stats.atime, stats.mtime);
            }
            return { status: 'moved', source, destination };
        } catch (error) {
            logger.error(`Error moving file from ${source} to ${destination}:`, error);
            throw error;
        }
    }

    async copyFile(source, destination, options = {}) {
        const { overwrite = false, preserveTimestamps = true } = options;

        try {
            await fs.copyFile(source, destination);
            if (preserveTimestamps) {
                const stats = await fs.stat(source);
                await fs.utimes(destination, stats.atime, stats.mtime);
            }
            return { status: 'copied', source, destination };
        } catch (error) {
            logger.error(`Error copying file from ${source} to ${destination}:`, error);
            throw error;
        }
    }

    async getFileInfo(path, options = {}) {
        const { followSymlinks = true } = options;

        try {
            const stats = await fs.stat(path, { bigint: true });
            return {
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
            };
        } catch (error) {
            logger.error(`Error getting file info for ${path}:`, error);
            throw error;
        }
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

module.exports = FileSystemEngine; 