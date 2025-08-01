const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs/promises');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const config = require('../config');

class TagManager extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
        this.tags = new Map();
        this.fileTags = new Map();
        this.tagIndex = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // 워커 풀 초기화
        const workerCount = config.worker.poolSize || 4;
        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker(path.join(__dirname, '../workers/tagWorker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this, worker));
            worker.on('error', this.handleWorkerError.bind(this, worker));
            this.workers.set(worker.threadId, worker);
        }

        // 태그 데이터 로드
        await this.loadTags();
        this.isInitialized = true;
        logger.info('Tag manager initialized');
    }

    getTools() {
        return [
            {
                name: 'add_tag',
                description: '태그 추가',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '태그 이름' },
                        color: { type: 'string', description: '태그 색상' },
                        description: { type: 'string', description: '태그 설명' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'remove_tag',
                description: '태그 삭제',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: '태그 이름' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'tag_file',
                description: '파일에 태그 추가',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string', description: '파일 경로' },
                        tags: { type: 'array', items: { type: 'string' }, description: '태그 목록' }
                    },
                    required: ['filePath', 'tags']
                }
            },
            {
                name: 'untag_file',
                description: '파일에서 태그 제거',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string', description: '파일 경로' },
                        tags: { type: 'array', items: { type: 'string' }, description: '태그 목록' }
                    },
                    required: ['filePath', 'tags']
                }
            },
            {
                name: 'get_file_tags',
                description: '파일의 태그 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string', description: '파일 경로' }
                    },
                    required: ['filePath']
                }
            },
            {
                name: 'get_tagged_files',
                description: '태그가 지정된 파일 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        tag: { type: 'string', description: '태그 이름' }
                    },
                    required: ['tag']
                }
            },
            {
                name: 'search_by_tags',
                description: '태그로 파일 검색',
                parameters: {
                    type: 'object',
                    properties: {
                        tags: { type: 'array', items: { type: 'string' }, description: '태그 목록' },
                        options: {
                            type: 'object',
                            properties: {
                                matchAll: { type: 'boolean', description: '모든 태그 일치' },
                                recursive: { type: 'boolean', description: '하위 폴더 포함' }
                            }
                        }
                    },
                    required: ['tags']
                }
            },
            {
                name: 'get_tag_stats',
                description: '태그 통계 조회',
                parameters: {
                    type: 'object',
                    properties: {
                        tag: { type: 'string', description: '태그 이름' }
                    }
                }
            }
        ];
    }

    async addTag(name, options = {}) {
        const { color = '#000000', description = '' } = options;

        if (this.tags.has(name)) {
            throw new Error('Tag already exists');
        }

        const tag = {
            name,
            color,
            description,
            createdAt: Date.now(),
            fileCount: 0
        };

        this.tags.set(name, tag);
        this.tagIndex.set(name, new Set());
        await this.saveTags();

        return tag;
    }

    async removeTag(name) {
        if (!this.tags.has(name)) {
            throw new Error('Tag does not exist');
        }

        // 태그가 지정된 모든 파일에서 태그 제거
        const files = this.tagIndex.get(name);
        for (const filePath of files) {
            const fileTags = this.fileTags.get(filePath);
            if (fileTags) {
                fileTags.delete(name);
                if (fileTags.size === 0) {
                    this.fileTags.delete(filePath);
                }
            }
        }

        this.tags.delete(name);
        this.tagIndex.delete(name);
        await this.saveTags();

        return { status: 'removed' };
    }

    async tagFile(filePath, tags) {
        const fileTags = this.fileTags.get(filePath) || new Set();
        const addedTags = new Set();

        for (const tag of tags) {
            if (!this.tags.has(tag)) {
                throw new Error(`Tag '${tag}' does not exist`);
            }

            if (!fileTags.has(tag)) {
                fileTags.add(tag);
                this.tagIndex.get(tag).add(filePath);
                this.tags.get(tag).fileCount++;
                addedTags.add(tag);
            }
        }

        if (fileTags.size > 0) {
            this.fileTags.set(filePath, fileTags);
        }

        await this.saveTags();
        return { addedTags: Array.from(addedTags) };
    }

    async untagFile(filePath, tags) {
        const fileTags = this.fileTags.get(filePath);
        if (!fileTags) {
            return { removedTags: [] };
        }

        const removedTags = new Set();
        for (const tag of tags) {
            if (fileTags.has(tag)) {
                fileTags.delete(tag);
                this.tagIndex.get(tag).delete(filePath);
                this.tags.get(tag).fileCount--;
                removedTags.add(tag);
            }
        }

        if (fileTags.size === 0) {
            this.fileTags.delete(filePath);
        }

        await this.saveTags();
        return { removedTags: Array.from(removedTags) };
    }

    getFileTags(filePath) {
        const fileTags = this.fileTags.get(filePath);
        if (!fileTags) {
            return [];
        }

        return Array.from(fileTags).map(tag => this.tags.get(tag));
    }

    getTaggedFiles(tag) {
        if (!this.tagIndex.has(tag)) {
            return [];
        }

        return Array.from(this.tagIndex.get(tag));
    }

    async searchByTags(tags, options = {}) {
        const { matchAll = false, recursive = false } = options;
        const results = new Set();

        if (matchAll) {
            // 모든 태그가 일치하는 파일 검색
            const firstTag = tags[0];
            if (!this.tagIndex.has(firstTag)) {
                return [];
            }

            const candidates = this.tagIndex.get(firstTag);
            for (const filePath of candidates) {
                const fileTags = this.fileTags.get(filePath);
                if (fileTags && tags.every(tag => fileTags.has(tag))) {
                    results.add(filePath);
                }
            }
        } else {
            // 하나 이상의 태그가 일치하는 파일 검색
            for (const tag of tags) {
                if (this.tagIndex.has(tag)) {
                    for (const filePath of this.tagIndex.get(tag)) {
                        results.add(filePath);
                    }
                }
            }
        }

        return Array.from(results);
    }

    getTagStats(tag) {
        if (!this.tags.has(tag)) {
            throw new Error('Tag does not exist');
        }

        const tagInfo = this.tags.get(tag);
        const files = this.tagIndex.get(tag);
        const stats = {
            name: tagInfo.name,
            color: tagInfo.color,
            description: tagInfo.description,
            fileCount: tagInfo.fileCount,
            createdAt: tagInfo.createdAt,
            lastUsed: 0,
            fileTypes: new Map(),
            totalSize: 0
        };

        for (const filePath of files) {
            try {
                const stat = fs.statSync(filePath);
                stats.totalSize += stat.size;
                stats.lastUsed = Math.max(stats.lastUsed, stat.mtime.getTime());

                const ext = path.extname(filePath).toLowerCase();
                stats.fileTypes.set(ext, (stats.fileTypes.get(ext) || 0) + 1);
            } catch (error) {
                logger.error(`Error getting stats for file ${filePath}:`, error);
            }
        }

        return {
            ...stats,
            fileTypes: Object.fromEntries(stats.fileTypes)
        };
    }

    async loadTags() {
        try {
            const tagsPath = path.join(config.data.directory, 'tags.json');
            const data = await fs.readFile(tagsPath, 'utf-8');
            const { tags, fileTags, tagIndex } = JSON.parse(data);

            this.tags = new Map(Object.entries(tags));
            this.fileTags = new Map(Object.entries(fileTags).map(([key, value]) => [key, new Set(value)]));
            this.tagIndex = new Map(Object.entries(tagIndex).map(([key, value]) => [key, new Set(value)]));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error loading tags:', error);
            }
        }
    }

    async saveTags() {
        try {
            const tagsPath = path.join(config.data.directory, 'tags.json');
            const data = {
                tags: Object.fromEntries(this.tags),
                fileTags: Object.fromEntries(
                    Array.from(this.fileTags.entries()).map(([key, value]) => [key, Array.from(value)])
                ),
                tagIndex: Object.fromEntries(
                    Array.from(this.tagIndex.entries()).map(([key, value]) => [key, Array.from(value)])
                )
            };

            await fs.writeFile(tagsPath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('Error saving tags:', error);
            throw error;
        }
    }

    handleWorkerMessage(worker, message) {
        if (message.type === 'tag_update') {
            this.emit('tagUpdate', message.data);
        }
    }

    handleWorkerError(worker, error) {
        logger.error('Worker error:', error);
    }
}

module.exports = TagManager; 