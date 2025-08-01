/**
 * 🧠 백엔드 학습 시스템 메인 진입점
 * 모든 학습 컴포넌트를 통합하고 외부에서 사용할 수 있는 인터페이스 제공
 */

import { BackendLearningManager } from './BackendLearningManager.js';

// 전역 학습 매니저 인스턴스
let learningManager = null;

/**
 * 백엔드 학습 시스템 초기화
 */
export function initializeBackendLearning(config = {}) {
  try {
    if (learningManager) {
      console.log('⚠️ 백엔드 학습 시스템이 이미 초기화되어 있습니다.');
      return learningManager;
    }

    learningManager = new BackendLearningManager();
    
    // 추가 설정 적용
    if (Object.keys(config).length > 0) {
      learningManager.updateConfig(config);
    }

    console.log('✅ 백엔드 학습 시스템 초기화 완료');
    return learningManager;
  } catch (error) {
    console.error('❌ 백엔드 학습 시스템 초기화 실패:', error);
    throw error;
  }
}

/**
 * 학습 매니저 인스턴스 조회
 */
export function getLearningManager() {
  if (!learningManager) {
    throw new Error('백엔드 학습 시스템이 초기화되지 않았습니다. initializeBackendLearning()을 먼저 호출하세요.');
  }
  return learningManager;
}

/**
 * API 호출 학습 (간편 인터페이스)
 */
export function learnAPICall(userId, endpoint, method, params, responseTime, statusCode, timestamp = Date.now()) {
  try {
    const manager = getLearningManager();
    manager.learnAPICall(userId, endpoint, method, params, responseTime, statusCode, timestamp);
  } catch (error) {
    console.error('❌ API 호출 학습 실패:', error);
  }
}

/**
 * 보안 이벤트 학습 (간편 인터페이스)
 */
export function learnSecurityEvent(event) {
  try {
    const manager = getLearningManager();
    manager.learnSecurityEvent(event);
  } catch (error) {
    console.error('❌ 보안 이벤트 학습 실패:', error);
  }
}

/**
 * 성능 이벤트 학습 (간편 인터페이스)
 */
export function learnPerformanceEvent(event) {
  try {
    const manager = getLearningManager();
    manager.learnPerformanceEvent(event);
  } catch (error) {
    console.error('❌ 성능 이벤트 학습 실패:', error);
  }
}

/**
 * 종합 분석 결과 조회 (간편 인터페이스)
 */
export function getAnalysis() {
  try {
    const manager = getLearningManager();
    return manager.getComprehensiveAnalysis();
  } catch (error) {
    console.error('❌ 분석 결과 조회 실패:', error);
    return { error: '분석 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자별 분석 (간편 인터페이스)
 */
export function getUserAnalysis(userId) {
  try {
    const manager = getLearningManager();
    return manager.getUserAnalysis(userId);
  } catch (error) {
    console.error('❌ 사용자 분석 실패:', error);
    return { error: '사용자 분석 중 오류가 발생했습니다.' };
  }
}

/**
 * 엔드포인트별 분석 (간편 인터페이스)
 */
export function getEndpointAnalysis(endpoint, method) {
  try {
    const manager = getLearningManager();
    return manager.getEndpointAnalysis(endpoint, method);
  } catch (error) {
    console.error('❌ 엔드포인트 분석 실패:', error);
    return { error: '엔드포인트 분석 중 오류가 발생했습니다.' };
  }
}

/**
 * 학습 데이터 내보내기 (간편 인터페이스)
 */
export function exportData() {
  try {
    const manager = getLearningManager();
    return manager.exportLearningData();
  } catch (error) {
    console.error('❌ 데이터 내보내기 실패:', error);
    return { error: '데이터 내보내기 중 오류가 발생했습니다.' };
  }
}

/**
 * 학습 데이터 초기화 (간편 인터페이스)
 */
export function resetData() {
  try {
    const manager = getLearningManager();
    return manager.resetLearningData();
  } catch (error) {
    console.error('❌ 데이터 초기화 실패:', error);
    return { error: '데이터 초기화 중 오류가 발생했습니다.' };
  }
}

/**
 * 학습 시스템 설정 업데이트 (간편 인터페이스)
 */
export function updateConfig(newConfig) {
  try {
    const manager = getLearningManager();
    return manager.updateConfig(newConfig);
  } catch (error) {
    console.error('❌ 설정 업데이트 실패:', error);
    return { error: '설정 업데이트 중 오류가 발생했습니다.' };
  }
}

/**
 * Express.js 미들웨어 생성
 * API 요청/응답을 자동으로 학습
 */
export function createLearningMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // 응답 시간 측정을 위한 래퍼
    const measureResponse = (originalMethod) => {
      return function(data) {
        const responseTime = Date.now() - startTime;
        
        // 학습 데이터 수집
        const learningData = {
          userId: req.user?.id || req.headers['user-id'] || 'anonymous',
          endpoint: req.path,
          method: req.method,
          params: {
            query: req.query,
            body: req.body,
            params: req.params
          },
          responseTime,
          statusCode: res.statusCode,
          timestamp: startTime,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection.remoteAddress
        };

        // 비동기로 학습 실행 (응답 지연 방지)
        setImmediate(() => {
          try {
            learnAPICall(
              learningData.userId,
              learningData.endpoint,
              learningData.method,
              learningData.params,
              learningData.responseTime,
              learningData.statusCode,
              learningData.timestamp
            );
          } catch (error) {
            console.error('❌ 미들웨어 학습 실패:', error);
          }
        });

        return originalMethod.call(this, data);
      };
    };

    // 응답 메서드 래핑
    res.send = measureResponse(originalSend);
    res.json = measureResponse(originalJson);

    next();
  };
}

/**
 * 학습 시스템 상태 확인
 */
export function getSystemStatus() {
  try {
    if (!learningManager) {
      return {
        status: 'not_initialized',
        message: '백엔드 학습 시스템이 초기화되지 않았습니다.'
      };
    }

    const manager = getLearningManager();
    const stats = manager.getLearningStats();
    
    return {
      status: 'running',
      message: '백엔드 학습 시스템이 정상적으로 실행 중입니다.',
      stats: {
        uptime: stats.uptime,
        totalEvents: stats.totalEvents,
        eventsPerHour: stats.eventsPerHour,
        lastCleanup: stats.lastCleanup
      }
    };
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);
    return {
      status: 'error',
      message: '시스템 상태 확인 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}

/**
 * 학습 시스템 종료
 */
export function shutdownLearningSystem() {
  try {
    if (learningManager) {
      learningManager.cleanup();
      learningManager = null;
      console.log('🛑 백엔드 학습 시스템이 종료되었습니다.');
      return { success: true, message: '학습 시스템이 정상적으로 종료되었습니다.' };
    }
    return { success: true, message: '학습 시스템이 이미 종료되어 있습니다.' };
  } catch (error) {
    console.error('❌ 학습 시스템 종료 실패:', error);
    return { error: '학습 시스템 종료 중 오류가 발생했습니다.' };
  }
}

// 기본 내보내기
export default {
  initializeBackendLearning,
  getLearningManager,
  learnAPICall,
  learnSecurityEvent,
  learnPerformanceEvent,
  getAnalysis,
  getUserAnalysis,
  getEndpointAnalysis,
  exportData,
  resetData,
  updateConfig,
  createLearningMiddleware,
  getSystemStatus,
  shutdownLearningSystem
}; 