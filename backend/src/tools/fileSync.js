import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import winston from 'winston';
import chokidar from 'chokidar';

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

export class FileSyncTools {
  constructor(options = {}) {
    this.options = {
      syncInterval: options.syncInterval || 5000,
      conflictStrategy: options.conflictStrategy || 'newer',
      excludePatterns: options.excludePatterns || [],
      ...options
    };
    
    this.syncStatus = new Map();
    this.watchers = new Map();
  }

  async startWatching(directory) {
    if (this.watchers.has(directory)) {
      return;
    }

    const watcher = chokidar.watch(directory, {
      ignored: this.options.excludePatterns,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => this.handleFileChange('add', path))
      .on('change', path => this.handleFileChange('change', path))
      .on('unlink', path => this.handleFileChange('delete', path));

    this.watchers.set(directory, watcher);
  }

  async stopWatching(directory) {
    const watcher = this.watchers.get(directory);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(directory);
    }
  }

  async handleFileChange(event, filePath) {
    try {
      const fileHash = await this.calculateFileHash(filePath);
      const syncInfo = {
        event,
        filePath,
        hash: fileHash,
        timestamp: new Date().toISOString()
      };

      this.syncStatus.set(filePath, syncInfo);
      return syncInfo;
    } catch (error) {
      logger.error('파일 변경 처리 실패:', error);
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

  async syncFiles(sourceDir, targetDir) {
    try {
      const sourceFiles = await this.getAllFiles(sourceDir);
      const targetFiles = await this.getAllFiles(targetDir);
      
      const syncOperations = [];
      
      // 새 파일 및 변경된 파일 동기화
      for (const sourceFile of sourceFiles) {
        const relativePath = path.relative(sourceDir, sourceFile);
        const targetFile = path.join(targetDir, relativePath);
        
        const sourceHash = await this.calculateFileHash(sourceFile);
        let targetHash;
        
        try {
          targetHash = await this.calculateFileHash(targetFile);
        } catch {
          targetHash = null;
        }
        
        if (sourceHash !== targetHash) {
          syncOperations.push({
            type: 'copy',
            source: sourceFile,
            target: targetFile,
            hash: sourceHash
          });
        }
      }
      
      // 삭제된 파일 처리
      for (const targetFile of targetFiles) {
        const relativePath = path.relative(targetDir, targetFile);
        const sourceFile = path.join(sourceDir, relativePath);
        
        try {
          await fs.access(sourceFile);
        } catch {
          syncOperations.push({
            type: 'delete',
            file: targetFile
          });
        }
      }
      
      // 동기화 실행
      for (const operation of syncOperations) {
        await this.executeSyncOperation(operation);
      }
      
      return {
        success: true,
        operations: syncOperations
      };
    } catch (error) {
      logger.error('파일 동기화 실패:', error);
      throw error;
    }
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

  async executeSyncOperation(operation) {
    try {
      switch (operation.type) {
        case 'copy':
          await fs.mkdir(path.dirname(operation.target), { recursive: true });
          await fs.copyFile(operation.source, operation.target);
          break;
          
        case 'delete':
          await fs.unlink(operation.file);
          break;
      }
      
      return {
        success: true,
        operation
      };
    } catch (error) {
      logger.error('동기화 작업 실행 실패:', error);
      throw error;
    }
  }

  async resolveConflict(sourceFile, targetFile) {
    try {
      const [sourceStats, targetStats] = await Promise.all([
        fs.stat(sourceFile),
        fs.stat(targetFile)
      ]);
      
      let winner;
      
      switch (this.options.conflictStrategy) {
        case 'newer':
          winner = sourceStats.mtime > targetStats.mtime ? sourceFile : targetFile;
          break;
          
        case 'source':
          winner = sourceFile;
          break;
          
        case 'target':
          winner = targetFile;
          break;
          
        default:
          throw new Error('알 수 없는 충돌 해결 전략');
      }
      
      return {
        winner,
        sourceTime: sourceStats.mtime,
        targetTime: targetStats.mtime
      };
    } catch (error) {
      logger.error('충돌 해결 실패:', error);
      throw error;
    }
  }

  getSyncStatus() {
    return Array.from(this.syncStatus.entries()).map(([filePath, info]) => ({
      filePath,
      ...info
    }));
  }

  async executeTool(toolName, params = {}) {
    try {
      console.log(`파일 동기화 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'syncFiles':
        case 'sync_files':
          return await this.syncFiles(params.sourcePath, params.targetPath, params.options);
        
        case 'startSync':
        case 'start_sync':
          return await this.startSync(params.sourcePath, params.targetPath, params.options);
        
        case 'stopSync':
        case 'stop_sync':
          return await this.stopSync(params.syncId);
        
        case 'getSyncStatus':
        case 'get_sync_status':
          return await this.getSyncStatus(params.syncId);
        
        case 'listSyncJobs':
        case 'list_sync_jobs':
          return await this.listSyncJobs();
        
        case 'resolveConflict':
        case 'resolve_conflict':
          return await this.resolveConflict(params.syncId, params.conflictId, params.resolution);
        
        case 'getSyncHistory':
        case 'get_sync_history':
          return await this.getSyncHistory(params.syncId);
        
        default:
          throw new Error(`알 수 없는 파일 동기화 도구: ${toolName}`);
      }
    } catch (error) {
      console.error(`파일 동기화 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('파일 동기화 도구 정리 완료');
  }
} 