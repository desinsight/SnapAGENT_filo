/**
 * ErrorHandler.js
 * 공통 에러 처리 모듈 - 모든 AI 코어 컴포넌트에서 사용
 * 에러 분류, 로깅, 복구 전략 표준화
 */

import { Logger } from './Logger.js';

export class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.recoveryStrategies = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1초
  }

  /**
   * 에러 분류
   */
  static classifyError(error) {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'NETWORK_ERROR';
    }
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }
    if (error.name === 'AuthenticationError' || error.message.includes('auth')) {
      return 'AUTH_ERROR';
    }
    if (error.name === 'SubscriptionError' || error.message.includes('subscription')) {
      return 'SUBSCRIPTION_ERROR';
    }
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * 에러 처리
   */
  async handleError(error, context = {}) {
    const errorType = ErrorHandler.classifyError(error);
    const errorKey = `${errorType}:${context.component || 'unknown'}`;
    
    // 에러 카운트 증가
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // 로깅
    Logger.error(`${errorType} 발생`, error, '🚨');
    Logger.debug(`컨텍스트: ${JSON.stringify(context)}`, '🔍');
    
    // 복구 전략 실행
    const recoveryStrategy = this.recoveryStrategies.get(errorType);
    if (recoveryStrategy) {
      try {
        return await recoveryStrategy(error, context);
      } catch (recoveryError) {
        Logger.error('복구 전략 실행 실패', recoveryError, '💥');
      }
    }
    
    // 기본 에러 응답
    return {
      success: false,
      error: errorType,
      message: error.message,
      context: context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 복구 전략 등록
   */
  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * 재시도 로직
   */
  async retry(operation, maxRetries = null, delay = null) {
    const retries = maxRetries || this.maxRetries;
    const retryDelay = delay || this.retryDelay;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        Logger.warn(`재시도 ${attempt}/${retries} 실패, ${retryDelay}ms 후 재시도`, '🔄');
        await this.sleep(retryDelay);
      }
    }
  }

  /**
   * 지연 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 안전한 실행
   */
  async safeExecute(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      return await this.handleError(error, context);
    }
  }

  /**
   * 에러 통계 반환
   */
  getErrorStats() {
    const stats = {};
    for (const [key, count] of this.errorCounts) {
      const [errorType, component] = key.split(':');
      if (!stats[errorType]) {
        stats[errorType] = {};
      }
      stats[errorType][component] = count;
    }
    return stats;
  }

  /**
   * 에러 통계 초기화
   */
  resetErrorStats() {
    this.errorCounts.clear();
  }

  /**
   * 기본 복구 전략들 등록
   */
  registerDefaultStrategies() {
    // 네트워크 에러: 재시도
    this.registerRecoveryStrategy('NETWORK_ERROR', async (error, context) => {
      Logger.info('네트워크 에러 복구 시도: 재시도', '🔄');
      return await this.retry(async () => {
        // 원래 작업 재시도 로직
        throw new Error('복구 전략은 구체적인 작업이 필요합니다');
      });
    });

    // 검증 에러: 기본값 반환
    this.registerRecoveryStrategy('VALIDATION_ERROR', async (error, context) => {
      Logger.warn('검증 에러 복구: 기본값 사용', '⚠️');
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 유효하지 않습니다',
        defaultValue: context.defaultValue || null
      };
    });

    // 구독 에러: 무료 기능으로 제한
    this.registerRecoveryStrategy('SUBSCRIPTION_ERROR', async (error, context) => {
      Logger.warn('구독 에러 복구: 무료 기능으로 제한', '🔒');
      return {
        success: false,
        error: 'SUBSCRIPTION_REQUIRED',
        message: '이 기능을 사용하려면 구독이 필요합니다',
        upgradeUrl: context.upgradeUrl || '/upgrade'
      };
    });
  }
} 