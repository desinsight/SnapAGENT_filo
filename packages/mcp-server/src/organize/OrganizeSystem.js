import fs from 'fs/promises';
import path from 'path';
import { Worker } from 'worker_threads';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export class OrganizeSystem {
  constructor() {
    this.workers = new Map();
    this.rules = new Map();
    this.cache = new Map();
  }

  async initialize() {
    // 워커 풀 초기화
    for (let i = 0; i < config.worker.poolSize; i++) {
      const worker = new Worker('./workers/organizeWorker.js');
      this.workers.set(i, worker);
    }

    // 기본 규칙 로드
    await this.loadDefaultRules();
  }

  async getTools() {
    return [
      {
        name: 'organize_by_type',
        description: '파일 타입별로 정리합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          options: { type: 'object', description: '정리 옵션' }
        },
        execute: this.organizeByType.bind(this)
      },
      {
        name: 'organize_by_date',
        description: '날짜별로 정리합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          options: { type: 'object', description: '정리 옵션' }
        },
        execute: this.organizeByDate.bind(this)
      },
      {
        name: 'clean_duplicates',
        description: '중복 파일을 정리합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          options: { type: 'object', description: '정리 옵션' }
        },
        execute: this.cleanDuplicates.bind(this)
      },
      {
        name: 'clean_temporary',
        description: '임시 파일을 정리합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          options: { type: 'object', description: '정리 옵션' }
        },
        execute: this.cleanTemporary.bind(this)
      },
      {
        name: 'archive_old',
        description: '오래된 파일을 아카이빙합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          options: { type: 'object', description: '정리 옵션' }
        },
        execute: this.archiveOld.bind(this)
      },
      {
        name: 'rename_files',
        description: '파일명을 일괄 변경합니다.',
        parameters: {
          path: { type: 'string', description: '정리할 경로' },
          pattern: { type: 'string', description: '변경 패턴' },
          options: { type: 'object', description: '변경 옵션' }
        },
        execute: this.renameFiles.bind(this)
      }
    ];
  }

  async organizeByType({ path, options = {} }) {
    try {
      const {
        recursive = true,
        createFolders = true,
        moveFiles = true,
        fileTypes = config.fileSystem.allowedExtensions
      } = options;

      const stats = {
        processed: 0,
        moved: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const ext = path.extname(filePath).toLowerCase().slice(1);
          if (!fileTypes.includes(ext)) return;

          const targetDir = path.join(path, ext.toUpperCase());
          if (createFolders) {
            await fs.mkdir(targetDir, { recursive: true });
          }

          if (moveFiles) {
            const fileName = path.basename(filePath);
            const targetPath = path.join(targetDir, fileName);
            await fs.rename(filePath, targetPath);
            stats.moved++;
          }

          stats.processed++;
        } catch (e) {
          logger.warn(`파일 정리 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('파일 타입별 정리 실패:', error);
      throw error;
    }
  }

  async organizeByDate({ path, options = {} }) {
    try {
      const {
        recursive = true,
        createFolders = true,
        moveFiles = true,
        format = 'YYYY-MM'
      } = options;

      const stats = {
        processed: 0,
        moved: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const date = new Date(stats.mtime);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          
          const targetDir = path.join(path, `${year}-${month}`);
          if (createFolders) {
            await fs.mkdir(targetDir, { recursive: true });
          }

          if (moveFiles) {
            const fileName = path.basename(filePath);
            const targetPath = path.join(targetDir, fileName);
            await fs.rename(filePath, targetPath);
            stats.moved++;
          }

          stats.processed++;
        } catch (e) {
          logger.warn(`파일 정리 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('날짜별 정리 실패:', error);
      throw error;
    }
  }

  async cleanDuplicates({ path, options = {} }) {
    try {
      const {
        recursive = true,
        minSize = 1024, // 1KB
        algorithm = 'sha256',
        keepNewest = true
      } = options;

      const stats = {
        processed: 0,
        removed: 0,
        errors: 0
      };

      const fileHashes = new Map();
      const duplicates = new Map();

      const processFile = async (filePath) => {
        try {
          const fileStats = await fs.stat(filePath);
          if (fileStats.size < minSize) return;

          const hash = await this.calculateFileHash(filePath, algorithm);
          if (fileHashes.has(hash)) {
            if (!duplicates.has(hash)) {
              duplicates.set(hash, [fileHashes.get(hash)]);
            }
            duplicates.get(hash).push(filePath);
          } else {
            fileHashes.set(hash, filePath);
          }

          stats.processed++;
        } catch (e) {
          logger.warn(`중복 파일 검색 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);

      // 중복 파일 정리
      for (const [hash, files] of duplicates.entries()) {
        if (keepNewest) {
          // 가장 최근 파일만 유지
          const sortedFiles = await Promise.all(
            files.map(async file => ({
              file,
              mtime: (await fs.stat(file)).mtime
            }))
          );
          sortedFiles.sort((a, b) => b.mtime - a.mtime);
          
          for (let i = 1; i < sortedFiles.length; i++) {
            await fs.unlink(sortedFiles[i].file);
            stats.removed++;
          }
        } else {
          // 가장 오래된 파일만 유지
          const sortedFiles = await Promise.all(
            files.map(async file => ({
              file,
              mtime: (await fs.stat(file)).mtime
            }))
          );
          sortedFiles.sort((a, b) => a.mtime - b.mtime);
          
          for (let i = 1; i < sortedFiles.length; i++) {
            await fs.unlink(sortedFiles[i].file);
            stats.removed++;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('중복 파일 정리 실패:', error);
      throw error;
    }
  }

  async cleanTemporary({ path, options = {} }) {
    try {
      const {
        recursive = true,
        patterns = [
          '*.tmp', '*.temp', '*.bak', '*.old',
          '~*', '*.swp', '*.swo', '*.log'
        ],
        minAge = 7 * 24 * 60 * 60 * 1000 // 7일
      } = options;

      const stats = {
        processed: 0,
        removed: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const age = Date.now() - stats.mtime.getTime();
          
          if (age < minAge) return;

          const fileName = path.basename(filePath);
          const shouldRemove = patterns.some(pattern => {
            if (pattern.startsWith('*')) {
              return fileName.endsWith(pattern.slice(1));
            } else if (pattern.endsWith('*')) {
              return fileName.startsWith(pattern.slice(0, -1));
            } else {
              return fileName === pattern;
            }
          });

          if (shouldRemove) {
            await fs.unlink(filePath);
            stats.removed++;
          }

          stats.processed++;
        } catch (e) {
          logger.warn(`임시 파일 정리 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('임시 파일 정리 실패:', error);
      throw error;
    }
  }

  async archiveOld({ path, options = {} }) {
    try {
      const {
        recursive = true,
        minAge = 30 * 24 * 60 * 60 * 1000, // 30일
        archiveDir = 'archive',
        compress = true
      } = options;

      const stats = {
        processed: 0,
        archived: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          const age = Date.now() - stats.mtime.getTime();
          
          if (age < minAge) return;

          const archivePath = path.join(path, archiveDir);
          await fs.mkdir(archivePath, { recursive: true });

          const fileName = path.basename(filePath);
          const targetPath = path.join(archivePath, fileName);

          if (compress) {
            // TODO: 파일 압축 구현
            await fs.rename(filePath, targetPath);
          } else {
            await fs.rename(filePath, targetPath);
          }

          stats.archived++;
          stats.processed++;
        } catch (e) {
          logger.warn(`파일 아카이빙 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('오래된 파일 아카이빙 실패:', error);
      throw error;
    }
  }

  async renameFiles({ path, pattern, options = {} }) {
    try {
      const {
        recursive = true,
        useRegex = false,
        caseSensitive = false
      } = options;

      const stats = {
        processed: 0,
        renamed: 0,
        errors: 0
      };

      const processFile = async (filePath) => {
        try {
          const fileName = path.basename(filePath);
          const dirName = path.dirname(filePath);
          
          let newName;
          if (useRegex) {
            const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
            newName = fileName.replace(regex, '');
          } else {
            newName = fileName.replace(pattern, '');
          }

          if (newName !== fileName) {
            const newPath = path.join(dirName, newName);
            await fs.rename(filePath, newPath);
            stats.renamed++;
          }

          stats.processed++;
        } catch (e) {
          logger.warn(`파일명 변경 실패: ${filePath}`, e);
          stats.errors++;
        }
      };

      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) {
              await processDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      };

      await processDirectory(path);
      return stats;
    } catch (error) {
      logger.error('파일명 일괄 변경 실패:', error);
      throw error;
    }
  }

  async loadDefaultRules() {
    // 기본 파일 타입 규칙
    this.rules.set('fileTypes', {
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'],
      documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
      archives: ['zip', 'rar', '7z', 'tar', 'gz'],
      media: ['mp3', 'mp4', 'avi', 'mov', 'wmv'],
      code: ['js', 'ts', 'py', 'java', 'cpp', 'cs']
    });

    // 기본 임시 파일 패턴
    this.rules.set('tempPatterns', [
      '*.tmp', '*.temp', '*.bak', '*.old',
      '~*', '*.swp', '*.swo', '*.log'
    ]);

    // 기본 아카이빙 규칙
    this.rules.set('archiveRules', {
      minAge: 30 * 24 * 60 * 60 * 1000, // 30일
      compress: true,
      archiveDir: 'archive'
    });
  }

  async calculateFileHash(filePath, algorithm = 'sha256') {
    try {
      const hash = createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      
      return new Promise((resolve, reject) => {
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('파일 해시 계산 실패:', error);
      throw error;
    }
  }
} 