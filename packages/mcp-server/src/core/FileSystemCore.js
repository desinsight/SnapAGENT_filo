import fs from 'fs/promises';
import path from 'path';
import { Worker } from 'worker_threads';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export class FileSystemCore {
  constructor() {
    this.workers = new Map();
    this.streams = new Map();
    this.cache = new Map();
  }

  async initialize() {
    // 워커 풀 초기화
    for (let i = 0; i < config.workerPoolSize; i++) {
      const worker = new Worker('./workers/fileWorker.js');
      this.workers.set(i, worker);
    }

    // 캐시 초기화
    this.cache.clear();
  }

  async getTools() {
    return [
      {
        name: 'list_drives',
        description: '사용 가능한 드라이브 목록을 반환합니다.',
        parameters: {},
        execute: this.listDrives.bind(this)
      },
      {
        name: 'list_files',
        description: '디렉토리 내 파일 목록을 반환합니다.',
        parameters: {
          path: { type: 'string', description: '디렉토리 경로' },
          recursive: { type: 'boolean', description: '하위 디렉토리 포함 여부' }
        },
        execute: this.listFiles.bind(this)
      },
      {
        name: 'read_file',
        description: '파일 내용을 읽습니다.',
        parameters: {
          path: { type: 'string', description: '파일 경로' },
          encoding: { type: 'string', description: '인코딩 (기본값: utf8)' }
        },
        execute: this.readFile.bind(this)
      },
      {
        name: 'write_file',
        description: '파일에 내용을 씁니다.',
        parameters: {
          path: { type: 'string', description: '파일 경로' },
          content: { type: 'string', description: '파일 내용' },
          encoding: { type: 'string', description: '인코딩 (기본값: utf8)' }
        },
        execute: this.writeFile.bind(this)
      },
      {
        name: 'copy_file',
        description: '파일을 복사합니다.',
        parameters: {
          source: { type: 'string', description: '원본 파일 경로' },
          target: { type: 'string', description: '대상 파일 경로' }
        },
        execute: this.copyFile.bind(this)
      },
      {
        name: 'move_file',
        description: '파일을 이동합니다.',
        parameters: {
          source: { type: 'string', description: '원본 파일 경로' },
          target: { type: 'string', description: '대상 파일 경로' }
        },
        execute: this.moveFile.bind(this)
      },
      {
        name: 'delete_file',
        description: '파일을 삭제합니다.',
        parameters: {
          path: { type: 'string', description: '파일 경로' }
        },
        execute: this.deleteFile.bind(this)
      },
      {
        name: 'create_directory',
        description: '디렉토리를 생성합니다.',
        parameters: {
          path: { type: 'string', description: '디렉토리 경로' },
          recursive: { type: 'boolean', description: '상위 디렉토리 자동 생성 여부' }
        },
        execute: this.createDirectory.bind(this)
      },
      {
        name: 'delete_directory',
        description: '디렉토리를 삭제합니다.',
        parameters: {
          path: { type: 'string', description: '디렉토리 경로' },
          recursive: { type: 'boolean', description: '하위 디렉토리 포함 삭제 여부' }
        },
        execute: this.deleteDirectory.bind(this)
      },
      {
        name: 'get_file_info',
        description: '파일 정보를 반환합니다.',
        parameters: {
          path: { type: 'string', description: '파일 경로' }
        },
        execute: this.getFileInfo.bind(this)
      }
    ];
  }

  async listDrives() {
    try {
      const drives = [];
      if (process.platform === 'win32') {
        for (let i = 65; i <= 90; i++) {
          const drive = String.fromCharCode(i) + ':';
          try {
            await fs.access(drive);
            const stats = await fs.statfs(drive);
            drives.push({
              name: drive,
              path: drive + '\\',
              type: 'fixed',
              freeSpace: stats.bfree * stats.bsize,
              totalSpace: stats.blocks * stats.bsize
            });
          } catch (e) {
            // 드라이브가 존재하지 않음
          }
        }
      } else {
        const stats = await fs.statfs('/');
        drives.push({
          name: '/',
          path: '/',
          type: 'fixed',
          freeSpace: stats.bfree * stats.bsize,
          totalSpace: stats.blocks * stats.bsize
        });
      }
      return drives;
    } catch (error) {
      logger.error('드라이브 목록 조회 실패:', error);
      throw error;
    }
  }

  async listFiles({ path, recursive = false }) {
    try {
      const items = [];
      const processDirectory = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          try {
            const stats = await fs.stat(fullPath);
            items.push({
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime.toISOString(),
              created: stats.birthtime.toISOString(),
              permissions: stats.mode.toString(8)
            });

            if (recursive && entry.isDirectory()) {
              await processDirectory(fullPath);
            }
          } catch (e) {
            logger.warn(`파일 정보 조회 실패: ${fullPath}`, e);
          }
        }
      };

      await processDirectory(path);
      return items;
    } catch (error) {
      logger.error('파일 목록 조회 실패:', error);
      throw error;
    }
  }

  async readFile({ path, encoding = 'utf8' }) {
    try {
      const stats = await fs.stat(path);
      if (stats.size > config.maxFileSize) {
        throw new Error(`파일이 너무 큽니다 (${stats.size} bytes > ${config.maxFileSize} bytes)`);
      }

      const content = await fs.readFile(path, encoding);
      return {
        content,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      logger.error('파일 읽기 실패:', error);
      throw error;
    }
  }

  async writeFile({ path, content, encoding = 'utf8' }) {
    try {
      await fs.writeFile(path, content, encoding);
      const stats = await fs.stat(path);
      return {
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      logger.error('파일 쓰기 실패:', error);
      throw error;
    }
  }

  async copyFile({ source, target }) {
    try {
      await fs.copyFile(source, target);
      const stats = await fs.stat(target);
      return {
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      logger.error('파일 복사 실패:', error);
      throw error;
    }
  }

  async moveFile({ source, target }) {
    try {
      await fs.rename(source, target);
      const stats = await fs.stat(target);
      return {
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      logger.error('파일 이동 실패:', error);
      throw error;
    }
  }

  async deleteFile({ path }) {
    try {
      await fs.unlink(path);
      return { success: true };
    } catch (error) {
      logger.error('파일 삭제 실패:', error);
      throw error;
    }
  }

  async createDirectory({ path, recursive = false }) {
    try {
      await fs.mkdir(path, { recursive });
      return { success: true };
    } catch (error) {
      logger.error('디렉토리 생성 실패:', error);
      throw error;
    }
  }

  async deleteDirectory({ path, recursive = false }) {
    try {
      if (recursive) {
        await fs.rm(path, { recursive: true, force: true });
      } else {
        await fs.rmdir(path);
      }
      return { success: true };
    } catch (error) {
      logger.error('디렉토리 삭제 실패:', error);
      throw error;
    }
  }

  async getFileInfo({ path }) {
    try {
      const stats = await fs.stat(path);
      const hash = await this.calculateFileHash(path);
      
      return {
        name: path.basename(path),
        path,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        permissions: stats.mode.toString(8),
        hash
      };
    } catch (error) {
      logger.error('파일 정보 조회 실패:', error);
      throw error;
    }
  }

  async calculateFileHash(path) {
    try {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(path);
      
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