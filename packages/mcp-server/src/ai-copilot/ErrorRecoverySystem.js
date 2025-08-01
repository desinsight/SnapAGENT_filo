import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';

/**
 * 에러 처리 및 복구 시스템
 * 모든 종류의 에러를 처리하고 자동 복구를 시도
 * @class ErrorRecoverySystem
 */
export class ErrorRecoverySystem extends EventEmitter {
  constructor() {
    super();
    
    this.cache = new LocalCache('error-recovery');
    this.errorHistory = [];
    this.recoveryStrategies = new Map();
    this.maxRetryAttempts = 3;
    this.retryDelays = [1000, 2000, 5000]; // 1초, 2초, 5초
    
    // 에러 타입별 복구 전략 정의
    this.initializeRecoveryStrategies();
  }

  /**
   * 초기화
   */
  async initialize() {
    try {
      logger.info('에러 복구 시스템 초기화');
      
      // 에러 히스토리 로드
      await this.loadErrorHistory();
      
      // 글로벌 에러 핸들러 등록
      this.registerGlobalErrorHandlers();
      
      logger.info('에러 복구 시스템 초기화 완료');
    } catch (error) {
      logger.error('에러 복구 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 복구 전략 초기화
   * @private
   */
  initializeRecoveryStrategies() {
    // 파일 시스템 에러
    this.recoveryStrategies.set('ENOENT', {
      name: '파일/폴더 없음',
      strategies: [
        this.createMissingDirectory.bind(this),
        this.suggestAlternativePaths.bind(this),
        this.searchSimilarPaths.bind(this)
      ],
      userMessage: '지정된 파일이나 폴더를 찾을 수 없습니다.'
    });
    
    this.recoveryStrategies.set('EACCES', {
      name: '권한 부족',
      strategies: [
        this.requestPermissionFallback.bind(this),
        this.suggestAlternativeOperations.bind(this),
        this.createReadOnlyFallback.bind(this)
      ],
      userMessage: '파일에 접근할 권한이 없습니다.'
    });
    
    this.recoveryStrategies.set('EMFILE', {
      name: '파일 핸들 부족',
      strategies: [
        this.closePendingHandles.bind(this),
        this.processInBatches.bind(this),
        this.requestSystemResourceIncrease.bind(this)
      ],
      userMessage: '시스템 리소스가 부족합니다.'
    });
    
    this.recoveryStrategies.set('ENOSPC', {
      name: '디스크 공간 부족',
      strategies: [
        this.cleanTemporaryFiles.bind(this),
        this.suggestAlternativeLocation.bind(this),
        this.compressExistingFiles.bind(this)
      ],
      userMessage: '디스크 공간이 부족합니다.'
    });
    
    // 네트워크 에러
    this.recoveryStrategies.set('NETWORK_ERROR', {
      name: '네트워크 오류',
      strategies: [
        this.retryWithBackoff.bind(this),
        this.switchToOfflineMode.bind(this),
        this.useLocalFallback.bind(this)
      ],
      userMessage: '네트워크 연결에 문제가 있습니다.'
    });
    
    // API 에러
    this.recoveryStrategies.set('API_ERROR', {
      name: 'API 오류',
      strategies: [
        this.useAlternativeAPI.bind(this),
        this.useLocalProcessing.bind(this),
        this.queueForLaterProcessing.bind(this)
      ],
      userMessage: 'AI 서비스에 일시적인 문제가 있습니다.'
    });
    
    // 메모리 에러
    this.recoveryStrategies.set('MEMORY_ERROR', {
      name: '메모리 부족',
      strategies: [
        this.processInSmallerChunks.bind(this),
        this.clearMemoryCache.bind(this),
        this.useStreamProcessing.bind(this)
      ],
      userMessage: '메모리가 부족하여 작업을 나누어 처리합니다.'
    });
  }

  /**
   * 명령 에러 처리
   * @param {Error} error - 발생한 에러
   * @param {string} command - 실행 중이던 명령
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 복구 결과
   */
  async handleCommandError(error, command, context) {
    try {
      const errorInfo = this.analyzeError(error);
      
      logger.error('명령 에러 발생:', {
        command,
        error: errorInfo,
        context
      });
      
      // 에러 히스토리에 기록
      this.recordError(errorInfo, command, context);
      
      // 복구 시도
      const recoveryResult = await this.attemptRecovery(
        errorInfo,
        command,
        context
      );
      
      if (recoveryResult.success) {
        logger.info('에러 복구 성공:', recoveryResult);
        
        return {
          success: true,
          recovered: true,
          result: recoveryResult.result,
          recoveryMethod: recoveryResult.method,
          userMessage: this.generateSuccessMessage(recoveryResult)
        };
      } else {
        logger.warn('에러 복구 실패:', recoveryResult);
        
        return {
          success: false,
          error: errorInfo.message,
          recoveryAttempted: true,
          userMessage: this.generateFailureMessage(errorInfo, recoveryResult),
          suggestions: await this.generateSuggestions(errorInfo, command, context)
        };
      }
      
    } catch (recoveryError) {
      logger.error('복구 시도 중 추가 에러:', recoveryError);
      
      return {
        success: false,
        error: error.message,
        recoveryError: recoveryError.message,
        userMessage: '문제를 해결하는 중에 추가 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      };
    }
  }

  /**
   * 초기화 에러 처리
   * @param {Error} error - 초기화 에러
   * @returns {Promise<void>}
   */
  async handleInitError(error) {
    logger.error('초기화 에러:', error);
    
    // 기본 복구 시도
    const fallbackStrategies = [
      this.initializeWithDefaults.bind(this),
      this.resetToSafeMode.bind(this),
      this.useMinimalConfiguration.bind(this)
    ];
    
    for (const strategy of fallbackStrategies) {
      try {
        await strategy(error);
        logger.info('초기화 복구 성공');
        return;
      } catch (strategyError) {
        logger.warn('복구 전략 실패:', strategyError.message);
      }
    }
    
    throw new Error('초기화 복구 실패: 시스템을 안전 모드로 시작할 수 없습니다.');
  }

  /**
   * 에러 분석
   * @private
   */
  analyzeError(error) {
    const errorInfo = {
      type: this.classifyError(error),
      code: error.code || 'UNKNOWN',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: this.determineSeverity(error),
      recoverable: this.isRecoverable(error)
    };
    
    // 특수 에러 처리
    if (error.syscall) {
      errorInfo.syscall = error.syscall;
      errorInfo.path = error.path;
    }
    
    if (error.errno) {
      errorInfo.errno = error.errno;
    }
    
    return errorInfo;
  }

  /**
   * 에러 분류
   * @private
   */
  classifyError(error) {
    // 파일 시스템 에러
    if (error.code === 'ENOENT') return 'FILE_NOT_FOUND';
    if (error.code === 'EACCES') return 'PERMISSION_DENIED';
    if (error.code === 'EMFILE') return 'TOO_MANY_FILES';
    if (error.code === 'ENOSPC') return 'NO_SPACE';
    if (error.code === 'EEXIST') return 'FILE_EXISTS';
    
    // 네트워크 에러
    if (error.code === 'ECONNRESET') return 'NETWORK_ERROR';
    if (error.code === 'ECONNREFUSED') return 'NETWORK_ERROR';
    if (error.code === 'ETIMEDOUT') return 'NETWORK_ERROR';
    
    // JavaScript 에러
    if (error instanceof RangeError) return 'MEMORY_ERROR';
    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof SyntaxError) return 'SYNTAX_ERROR';
    
    // API 에러
    if (error.message.includes('API') || error.message.includes('rate limit')) {
      return 'API_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * 복구 시도
   * @private
   */
  async attemptRecovery(errorInfo, command, context, attemptCount = 0) {
    if (attemptCount >= this.maxRetryAttempts) {
      return {
        success: false,
        reason: 'MAX_RETRIES_EXCEEDED',
        attemptCount
      };
    }
    
    const recoveryStrategy = this.recoveryStrategies.get(errorInfo.code) ||
                            this.recoveryStrategies.get(errorInfo.type);
    
    if (!recoveryStrategy) {
      return {
        success: false,
        reason: 'NO_STRATEGY_FOUND',
        errorInfo
      };
    }
    
    // 재시도 지연
    if (attemptCount > 0) {
      const delay = this.retryDelays[attemptCount - 1] || 5000;
      await this.sleep(delay);
    }
    
    // 복구 전략 순차 실행
    for (let i = 0; i < recoveryStrategy.strategies.length; i++) {
      const strategy = recoveryStrategy.strategies[i];
      
      try {
        logger.info(`복구 전략 ${i + 1} 시도:`, strategy.name);
        
        const result = await strategy(errorInfo, command, context);
        
        if (result.success) {
          return {
            success: true,
            method: strategy.name,
            result: result.data,
            attemptCount: attemptCount + 1,
            strategyIndex: i
          };
        }
        
        logger.warn(`복구 전략 ${i + 1} 실패:`, result.reason);
        
      } catch (strategyError) {
        logger.error(`복구 전략 ${i + 1} 에러:`, strategyError);
      }
    }
    
    // 모든 전략 실패 시 재시도
    return this.attemptRecovery(errorInfo, command, context, attemptCount + 1);
  }

  /**
   * 복구 전략들
   */
  
  async createMissingDirectory(errorInfo, command, context) {
    if (!errorInfo.path) {
      return { success: false, reason: 'NO_PATH_INFO' };
    }
    
    try {
      const dirPath = path.dirname(errorInfo.path);
      await fs.mkdir(dirPath, { recursive: true });
      
      return {
        success: true,
        data: { createdPath: dirPath },
        message: '누락된 디렉토리를 생성했습니다.'
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
  
  async suggestAlternativePaths(errorInfo, command, context) {
    try {
      const targetPath = errorInfo.path;
      const alternatives = await this.findSimilarPaths(targetPath);
      
      return {
        success: alternatives.length > 0,
        data: { alternatives },
        message: `유사한 경로를 ${alternatives.length}개 찾았습니다.`
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
  
  async requestPermissionFallback(errorInfo, command, context) {
    // 읽기 전용 모드로 전환
    try {
      const result = await this.executeInReadOnlyMode(command, context);
      return {
        success: true,
        data: result,
        message: '읽기 전용 모드로 실행했습니다.'
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
  
  async closePendingHandles(errorInfo, command, context) {
    try {
      // 메모리 정리 및 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
      }
      
      // 잠시 대기 후 재시도
      await this.sleep(1000);
      
      return {
        success: true,
        data: {},
        message: '시스템 리소스를 정리했습니다.'
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
  
  async cleanTemporaryFiles(errorInfo, command, context) {
    try {
      const tempDirs = ['/tmp', process.env.TMPDIR, process.env.TEMP].filter(Boolean);
      let cleanedSize = 0;
      
      for (const tempDir of tempDirs) {
        try {
          const cleaned = await this.cleanDirectory(tempDir);
          cleanedSize += cleaned;
        } catch (error) {
          logger.warn(`임시 디렉토리 정리 실패: ${tempDir}`, error.message);
        }
      }
      
      return {
        success: cleanedSize > 0,
        data: { cleanedSize },
        message: `${this.formatBytes(cleanedSize)}의 임시 파일을 정리했습니다.`
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
  
  async useLocalFallback(errorInfo, command, context) {
    try {
      // 로컬 처리 모드로 전환
      const localResult = await this.processLocally(command, context);
      
      return {
        success: true,
        data: localResult,
        message: '로컬 처리 모드로 전환했습니다.'
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * 유틸리티 메서드들
   */
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  recordError(errorInfo, command, context) {
    this.errorHistory.push({
      errorInfo,
      command,
      context,
      timestamp: new Date().toISOString()
    });
    
    // 최대 1000개 유지
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
    
    this.emit('errorRecorded', { errorInfo, command, context });
  }
  
  generateSuccessMessage(recoveryResult) {
    return `문제가 해결되었습니다. (${recoveryResult.method})`;
  }
  
  generateFailureMessage(errorInfo, recoveryResult) {
    const strategy = this.recoveryStrategies.get(errorInfo.code) ||
                    this.recoveryStrategies.get(errorInfo.type);
    
    return strategy?.userMessage || '알 수 없는 오류가 발생했습니다.';
  }
  
  async generateSuggestions(errorInfo, command, context) {
    const suggestions = [];
    
    // 에러 타입별 제안
    switch (errorInfo.type) {
      case 'FILE_NOT_FOUND':
        suggestions.push('파일 경로를 확인해주세요.');
        suggestions.push('비슷한 이름의 파일을 검색해보세요.');
        break;
        
      case 'PERMISSION_DENIED':
        suggestions.push('관리자 권한으로 실행해보세요.');
        suggestions.push('파일 권한을 확인해주세요.');
        break;
        
      case 'NO_SPACE':
        suggestions.push('불필요한 파일을 삭제해주세요.');
        suggestions.push('다른 드라이브를 사용해보세요.');
        break;
        
      case 'NETWORK_ERROR':
        suggestions.push('인터넷 연결을 확인해주세요.');
        suggestions.push('잠시 후 다시 시도해주세요.');
        break;
        
      default:
        suggestions.push('잠시 후 다시 시도해주세요.');
        suggestions.push('문제가 지속되면 관리자에게 문의하세요.');
    }
    
    return suggestions;
  }
  
  determineSeverity(error) {
    // 치명적 에러
    if (error.code === 'ENOSPC' || error.code === 'EMFILE') {
      return 'CRITICAL';
    }
    
    // 경고 수준
    if (error.code === 'ENOENT' || error.code === 'EACCES') {
      return 'WARNING';
    }
    
    return 'INFO';
  }
  
  isRecoverable(error) {
    const unrecoverableErrors = ['SYNTAX_ERROR', 'TYPE_ERROR'];
    const errorType = this.classifyError(error);
    
    return !unrecoverableErrors.includes(errorType);
  }
  
  async loadErrorHistory() {
    try {
      const cached = await this.cache.get('error-history');
      if (cached) {
        this.errorHistory = cached;
        logger.info('에러 히스토리 로드 완료');
      }
    } catch (error) {
      logger.warn('에러 히스토리 로드 실패:', error.message);
    }
  }
  
  registerGlobalErrorHandlers() {
    // 처리되지 않은 Promise 거부
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', reason);
      this.emit('unhandledRejection', { reason, promise });
    });
    
    // 처리되지 않은 예외
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.emit('uncaughtException', error);
    });
  }
}

export default ErrorRecoverySystem;