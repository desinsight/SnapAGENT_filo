import { EventEmitter } from 'events';
import winston from 'winston';

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

export class DataSyncService extends EventEmitter {
  constructor(mcpService) {
    super();
    this.mcpService = mcpService;
    this.syncQueue = [];
    this.isProcessing = false;
    this.syncStats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastSyncTime: null
    };
    
    // 캐시 관리
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분
    
    // 실시간 동기화를 위한 파일 와처
    this.watchers = new Map();
  }

  // 실시간 파일 시스템 변경 감지 및 동기화
  async startRealtimeSync(paths = []) {
    try {
      for (const watchPath of paths) {
        if (!this.watchers.has(watchPath)) {
          // 파일 시스템 와처 설정 (실제 구현에서는 chokidar 등 사용)
          const watcher = {
            path: watchPath,
            active: true,
            lastUpdate: Date.now()
          };
          
          this.watchers.set(watchPath, watcher);
          
          // HTTP 방식에서는 실시간 알림 대신 폴링 방식 사용
          // this.mcpService.client.on('message', (message) => {
          //   if (message.method === 'notifications/file_changed') {
          //     this.handleFileChanged(message.params);
          //   }
          // });
          
          logger.info(`실시간 동기화 시작: ${watchPath}`);
        }
      }
      
      this.emit('sync_started', { paths });
      return { success: true, watchedPaths: Array.from(this.watchers.keys()) };
    } catch (error) {
      logger.error('실시간 동기화 시작 실패:', error);
      throw error;
    }
  }

  async stopRealtimeSync(path) {
    try {
      if (this.watchers.has(path)) {
        const watcher = this.watchers.get(path);
        watcher.active = false;
        this.watchers.delete(path);
        
        logger.info(`실시간 동기화 중지: ${path}`);
        this.emit('sync_stopped', { path });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('실시간 동기화 중지 실패:', error);
      throw error;
    }
  }

  // 파일 변경 이벤트 처리
  async handleFileChanged(params) {
    try {
      const { path: filePath, eventType, timestamp } = params;
      
      // 캐시 무효화
      this.invalidateCache(filePath);
      
      // 동기화 큐에 추가
      await this.queueSync({
        type: 'file_changed',
        path: filePath,
        eventType,
        timestamp,
        priority: 'high'
      });
      
      // 클라이언트에 변경 알림
      this.emit('file_changed', {
        path: filePath,
        eventType,
        timestamp
      });
      
      logger.info(`파일 변경 감지: ${filePath} (${eventType})`);
    } catch (error) {
      logger.error('파일 변경 처리 실패:', error);
    }
  }

  // 동기화 작업 큐 관리
  async queueSync(operation) {
    this.syncQueue.push({
      ...operation,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    });
    
    // 큐 처리 시작
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        // 우선순위에 따른 정렬
        this.syncQueue.sort((a, b) => {
          const priorities = { high: 3, medium: 2, low: 1 };
          return (priorities[b.priority] || 1) - (priorities[a.priority] || 1);
        });
        
        const operation = this.syncQueue.shift();
        
        try {
          await this.processSyncOperation(operation);
          this.syncStats.successfulOperations++;
          
          logger.debug(`동기화 작업 완료: ${operation.type} - ${operation.path}`);
        } catch (error) {
          operation.retries++;
          
          if (operation.retries < operation.maxRetries) {
            // 재시도를 위해 큐 뒤로 이동
            this.syncQueue.push(operation);
            logger.warn(`동기화 작업 재시도 (${operation.retries}/${operation.maxRetries}): ${operation.id}`);
          } else {
            this.syncStats.failedOperations++;
            logger.error(`동기화 작업 최종 실패: ${operation.id}`, error);
            
            this.emit('sync_failed', {
              operation,
              error: error.message
            });
          }
        }
        
        this.syncStats.totalOperations++;
        
        // CPU 부하 방지를 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      this.isProcessing = false;
      this.syncStats.lastSyncTime = Date.now();
    }
  }

  async processSyncOperation(operation) {
    switch (operation.type) {
      case 'file_changed':
        return await this.syncFileChange(operation);
      case 'directory_scan':
        return await this.syncDirectoryScan(operation);
      case 'metadata_update':
        return await this.syncMetadataUpdate(operation);
      case 'cache_refresh':
        return await this.refreshCache(operation);
      default:
        throw new Error(`지원하지 않는 동기화 작업: ${operation.type}`);
    }
  }

  async syncFileChange(operation) {
    const { path: filePath, eventType } = operation;
    
    switch (eventType) {
      case 'created':
      case 'modified':
        // 파일 정보 재조회 및 캐시 업데이트
        const fileInfo = await this.mcpService.client.listFiles(filePath);
        this.updateCache(filePath, fileInfo);
        break;
        
      case 'deleted':
        // 캐시에서 제거
        this.removeFromCache(filePath);
        break;
        
      case 'moved':
        // 이동된 파일의 새 경로 정보 업데이트
        this.invalidateCache(filePath);
        break;
    }
  }

  async syncDirectoryScan(operation) {
    const { path: dirPath } = operation;
    
    try {
      const files = await this.mcpService.getEnhancedFileList(dirPath, {
        includeMetadata: true
      });
      
      // 디렉토리 전체 캐시 업데이트
      this.updateCache(dirPath, files);
      
      return files;
    } catch (error) {
      logger.error(`디렉토리 스캔 실패: ${dirPath}`, error);
      throw error;
    }
  }

  async syncMetadataUpdate(operation) {
    const { path: filePath, metadata } = operation;
    
    try {
      // 메타데이터 캐시 업데이트
      const cacheKey = `metadata:${filePath}`;
      this.cache.set(cacheKey, {
        data: metadata,
        timestamp: Date.now(),
        expiry: Date.now() + this.cacheExpiry
      });
      
      return metadata;
    } catch (error) {
      logger.error(`메타데이터 업데이트 실패: ${filePath}`, error);
      throw error;
    }
  }

  // 캐시 관리
  updateCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.cacheExpiry
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  invalidateCache(key) {
    // 경로와 관련된 모든 캐시 무효화
    const keysToRemove = [];
    
    for (const [cacheKey] of this.cache) {
      if (cacheKey.includes(key)) {
        keysToRemove.push(cacheKey);
      }
    }
    
    keysToRemove.forEach(k => this.cache.delete(k));
    
    logger.debug(`캐시 무효화: ${key} (${keysToRemove.length}개 항목)`);
  }

  removeFromCache(key) {
    this.cache.delete(key);
  }

  async refreshCache(operation) {
    const { path: cachePath } = operation;
    
    try {
      // 캐시 만료된 항목들 정리
      const now = Date.now();
      const expiredKeys = [];
      
      for (const [key, value] of this.cache) {
        if (now > value.expiry) {
          expiredKeys.push(key);
        }
      }
      
      expiredKeys.forEach(key => this.cache.delete(key));
      
      logger.info(`캐시 정리 완료: ${expiredKeys.length}개 만료 항목 제거`);
      
      return { removed: expiredKeys.length };
    } catch (error) {
      logger.error('캐시 정리 실패:', error);
      throw error;
    }
  }

  // 동기화 상태 및 통계
  getSyncStats() {
    return {
      ...this.syncStats,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: this.cache.size,
      watchedPaths: Array.from(this.watchers.keys())
    };
  }

  // 수동 동기화 강제 실행
  async forceSyncPath(path, options = {}) {
    try {
      await this.queueSync({
        type: 'directory_scan',
        path,
        priority: 'high',
        ...options
      });
      
      logger.info(`수동 동기화 요청: ${path}`);
      return { success: true };
    } catch (error) {
      logger.error(`수동 동기화 실패: ${path}`, error);
      throw error;
    }
  }

  // 서비스 종료
  async shutdown() {
    try {
      // 모든 와처 중지
      for (const path of this.watchers.keys()) {
        await this.stopRealtimeSync(path);
      }
      
      // 남은 큐 처리
      while (this.syncQueue.length > 0 && this.syncQueue.length < 10) {
        await this.processQueue();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 캐시 정리
      this.cache.clear();
      
      logger.info('데이터 동기화 서비스 종료 완료');
    } catch (error) {
      logger.error('데이터 동기화 서비스 종료 중 오류:', error);
    }
  }
}