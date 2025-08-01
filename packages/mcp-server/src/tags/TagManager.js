import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

export class TagManager {
    constructor() {
        this.tagsFile = path.join(process.cwd(), 'data', 'tags.json');
        this.tags = new Map();
        this.initialize();
    }

    async initialize() {
        try {
            await fs.mkdir(path.dirname(this.tagsFile), { recursive: true });
            try {
                const data = await fs.readFile(this.tagsFile, 'utf-8');
                const tags = JSON.parse(data);
                this.tags = new Map(Object.entries(tags));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await this.saveTags();
                } else {
                    throw error;
                }
            }
        } catch (error) {
            logger.error('태그 관리자 초기화 실패:', error);
            throw error;
        }
    }

    async saveTags() {
        try {
            const data = JSON.stringify(Object.fromEntries(this.tags), null, 2);
            await fs.writeFile(this.tagsFile, data, 'utf-8');
        } catch (error) {
            logger.error('태그 저장 실패:', error);
            throw error;
        }
    }

    async addTags(filePath, tags) {
        try {
            const normalizedPath = path.normalize(filePath);
            const currentTags = this.tags.get(normalizedPath) || [];
            const newTags = [...new Set([...currentTags, ...tags])];
            this.tags.set(normalizedPath, newTags);
            await this.saveTags();
            logger.info(`태그 추가됨: ${normalizedPath} -> ${newTags.join(', ')}`);
            return newTags;
        } catch (error) {
            logger.error('태그 추가 실패:', error);
            throw error;
        }
    }

    async removeTags(filePath, tags) {
        try {
            const normalizedPath = path.normalize(filePath);
            const currentTags = this.tags.get(normalizedPath) || [];
            const newTags = currentTags.filter(tag => !tags.includes(tag));
            this.tags.set(normalizedPath, newTags);
            await this.saveTags();
            logger.info(`태그 제거됨: ${normalizedPath} -> ${newTags.join(', ')}`);
            return newTags;
        } catch (error) {
            logger.error('태그 제거 실패:', error);
            throw error;
        }
    }

    async getTags(filePath) {
        try {
            const normalizedPath = path.normalize(filePath);
            return this.tags.get(normalizedPath) || [];
        } catch (error) {
            logger.error('태그 조회 실패:', error);
            throw error;
        }
    }

    async getFilesByTag(tag) {
        try {
            const files = [];
            for (const [filePath, tags] of this.tags.entries()) {
                if (tags.includes(tag)) {
                    files.push(filePath);
                }
            }
            return files;
        } catch (error) {
            logger.error('태그로 파일 검색 실패:', error);
            throw error;
        }
    }

    async getAllTags() {
        try {
            const tags = new Set();
            for (const fileTags of this.tags.values()) {
                fileTags.forEach(tag => tags.add(tag));
            }
            return Array.from(tags);
        } catch (error) {
            logger.error('전체 태그 조회 실패:', error);
            throw error;
        }
    }

    async deleteFileTags(filePath) {
        try {
            const normalizedPath = path.normalize(filePath);
            this.tags.delete(normalizedPath);
            await this.saveTags();
            logger.info(`파일 태그 삭제됨: ${normalizedPath}`);
        } catch (error) {
            logger.error('파일 태그 삭제 실패:', error);
            throw error;
        }
    }

    async renameFileTags(oldPath, newPath) {
        try {
            const normalizedOldPath = path.normalize(oldPath);
            const normalizedNewPath = path.normalize(newPath);
            const tags = this.tags.get(normalizedOldPath);
            if (tags) {
                this.tags.delete(normalizedOldPath);
                this.tags.set(normalizedNewPath, tags);
                await this.saveTags();
                logger.info(`파일 태그 이름 변경됨: ${normalizedOldPath} -> ${normalizedNewPath}`);
            }
        } catch (error) {
            logger.error('파일 태그 이름 변경 실패:', error);
            throw error;
        }
    }
} 