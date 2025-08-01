import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class FileOptimizerTools {
  constructor(options = {}) {
    this.options = {
      minFileSize: options.minFileSize || 1024, // 1KB
      maxFileAge: options.maxFileAge || 30 * 24 * 60 * 60 * 1000, // 30일
      compressionLevel: options.compressionLevel || 9,
      ...options
    };
  }

  async findDuplicateFiles(directory) {
    try {
      const files = await this.getAllFiles(directory);
      const fileHashes = new Map();
      const duplicates = [];
      
      for (const file of files) {
        try {
          const hash = await this.calculateFileHash(file);
          
          if (fileHashes.has(hash)) {
            duplicates.push({
              hash,
              files: [fileHashes.get(hash), file]
            });
          } else {
            fileHashes.set(hash, file);
          }
        } catch (error) {
          logger.error(`파일 해시 계산 실패 (${file}):`, error);
        }
      }
      
      return {
        success: true,
        duplicates,
        total: duplicates.length
      };
    } catch (error) {
      logger.error('중복 파일 검색 실패:', error);
      throw error;
    }
  }

  async createHardLink(sourceFile, targetFile) {
    try {
      await fs.link(sourceFile, targetFile);
      
      return {
        success: true,
        sourceFile,
        targetFile
      };
    } catch (error) {
      logger.error('하드 링크 생성 실패:', error);
      throw error;
    }
  }

  async cleanupDuplicateFiles(directory, options = {}) {
    try {
      const { keepNewest = true, moveToTrash = true } = options;
      const duplicates = await this.findDuplicateFiles(directory);
      const cleaned = [];
      
      for (const group of duplicates.duplicates) {
        const files = group.files;
        
        // 파일 정보 가져오기
        const fileInfos = await Promise.all(
          files.map(async file => ({
            file,
            stats: await fs.stat(file)
          }))
        );
        
        // 정렬 (keepNewest 옵션에 따라)
        fileInfos.sort((a, b) => {
          if (keepNewest) {
            return b.stats.mtime - a.stats.mtime;
          }
          return a.stats.mtime - b.stats.mtime;
        });
        
        // 중복 파일 처리
        const [keep, ...remove] = fileInfos;
        
        for (const { file } of remove) {
          if (moveToTrash) {
            await this.moveToTrash(file);
          } else {
            await fs.unlink(file);
          }
          
          cleaned.push({
            file,
            action: moveToTrash ? 'moved_to_trash' : 'deleted'
          });
        }
      }
      
      return {
        success: true,
        cleaned,
        total: cleaned.length
      };
    } catch (error) {
      logger.error('중복 파일 정리 실패:', error);
      throw error;
    }
  }

  async moveToTrash(file) {
    try {
      const trashDir = path.join(process.env.HOME || process.env.USERPROFILE, '.trash');
      await fs.mkdir(trashDir, { recursive: true });
      
      const fileName = path.basename(file);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const trashPath = path.join(trashDir, `${fileName}_${timestamp}`);
      
      await fs.rename(file, trashPath);
      
      return {
        success: true,
        originalPath: file,
        trashPath
      };
    } catch (error) {
      logger.error('휴지통으로 이동 실패:', error);
      throw error;
    }
  }

  async cleanupTemporaryFiles(directory) {
    try {
      const files = await this.getAllFiles(directory);
      const cleaned = [];
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          
          // 임시 파일 패턴 확인
          if (this.isTemporaryFile(file)) {
            await fs.unlink(file);
            cleaned.push({
              file,
              action: 'deleted',
              reason: 'temporary_file'
            });
            continue;
          }
          
          // 오래된 파일 확인
          const fileAge = Date.now() - stats.mtime.getTime();
          if (fileAge > this.options.maxFileAge) {
            await fs.unlink(file);
            cleaned.push({
              file,
              action: 'deleted',
              reason: 'old_file',
              age: fileAge
            });
            continue;
          }
          
          // 작은 파일 확인
          if (stats.size < this.options.minFileSize) {
            await fs.unlink(file);
            cleaned.push({
              file,
              action: 'deleted',
              reason: 'small_file',
              size: stats.size
            });
          }
        } catch (error) {
          logger.error(`파일 정리 실패 (${file}):`, error);
        }
      }
      
      return {
        success: true,
        cleaned,
        total: cleaned.length
      };
    } catch (error) {
      logger.error('임시 파일 정리 실패:', error);
      throw error;
    }
  }

  async compressFile(filePath) {
    try {
      const compressedPath = `${filePath}.gz`;
      
      await pipeline(
        createReadStream(filePath),
        createGzip({ level: this.options.compressionLevel }),
        createWriteStream(compressedPath)
      );
      
      const originalSize = (await fs.stat(filePath)).size;
      const compressedSize = (await fs.stat(compressedPath)).size;
      
      return {
        success: true,
        originalPath: filePath,
        compressedPath,
        originalSize,
        compressedSize,
        compressionRatio: (compressedSize / originalSize) * 100
      };
    } catch (error) {
      logger.error('파일 압축 실패:', error);
      throw error;
    }
  }

  async optimizeStorage(directory) {
    try {
      const files = await this.getAllFiles(directory);
      const optimized = [];
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          
          // 큰 파일 압축
          if (stats.size > this.options.minFileSize) {
            const result = await this.compressFile(file);
            optimized.push({
              file,
              action: 'compressed',
              ...result
            });
          }
        } catch (error) {
          logger.error(`파일 최적화 실패 (${file}):`, error);
        }
      }
      
      return {
        success: true,
        optimized,
        total: optimized.length
      };
    } catch (error) {
      logger.error('스토리지 최적화 실패:', error);
      throw error;
    }
  }

  async calculateFileHash(filePath) {
    try {
      const fileContent = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileContent).digest('hex');
    } catch (error) {
      logger.error('파일 해시 계산 실패:', error);
      throw error;
    }
  }

  isTemporaryFile(filePath) {
    const tempPatterns = [
      /\.tmp$/i,
      /\.temp$/i,
      /~$/,
      /\.bak$/i,
      /\.swp$/i
    ];
    
    return tempPatterns.some(pattern => pattern.test(filePath));
  }

  async getAllFiles(directory) {
    const files = [];
    
    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await scan(directory);
    return files;
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`파일 최적화 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'optimizeFile':
        case 'optimize_file':
          return await this.optimizeFile(params.filePath, params.options);
        
        case 'optimizeDirectory':
        case 'optimize_directory':
          return await this.optimizeDirectory(params.directoryPath, params.options);
        
        case 'compressFile':
        case 'compress_file':
          return await this.compressFile(params.filePath, params.compressionLevel);
        
        case 'decompressFile':
        case 'decompress_file':
          return await this.decompressFile(params.filePath);
        
        case 'analyzeOptimization':
        case 'analyze_optimization':
          return await this.analyzeOptimization(params.filePath);
        
        case 'batchOptimize':
        case 'batch_optimize':
          return await this.batchOptimize(params.fileList, params.options);
        
        default:
          throw new Error(`알 수 없는 파일 최적화 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`파일 최적화 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('파일 최적화 도구 정리 완료');
  }
} 