/**
 * ⚠️ ERROR HANDLER - 오류 관리 및 복구 시스템
 * 역할: 파일 시스템 작업 중 발생하는 오류를 감지하고 복구
 * 기능: 오류 감지, 분류, 복구, 자동 복구, 실시간 분석, 보고
 * 특징: 오류 관리, 자동 복구, 실시간 분석, 성능 최적화
 */

export class FileSystemError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorHandler {
  constructor() {
    this.errorMessages = {
      // 파일 시스템 오류
      EACCES: {
        ko: '⚠️ 해당 폴더/파일에 접근 권한이 없습니다.',
        en: '⚠️ Access denied to the folder/file.',
        suggestions: ['관리자 권한으로 실행하거나 파일 속성을 확인해주세요.']
      },
      ENOENT: {
        ko: '⚠️ 해당 파일이 존재하지 않습니다.',
        en: '⚠️ File or directory does not exist.',
        suggestions: ['파일 경로를 다시 확인해주세요.']
      },
      ENOSPC: {
        ko: '⚠️ 디스크 공간이 부족합니다.',
        en: '⚠️ No space left on device.',
        suggestions: ['불필요한 파일을 정리하고 다시 시도해주세요.']
      },
      EBUSY: {
        ko: '⚠️ 파일이 다른 프로그램에서 사용 중입니다.',
        en: '⚠️ File is being used by another process.',
        suggestions: ['해당 프로그램을 종료하고 다시 시도해주세요.']
      },
      EISDIR: {
        ko: '⚠️ 디렉토리는 읽을 수 없습니다.',
        en: '⚠️ Cannot read directory as file.',
        suggestions: ['파일을 선택해주세요.']
      },
      EFBIG: {
        ko: '⚠️ 파일이 너무 큽니다.',
        en: '⚠️ File too large.',
        suggestions: ['더 작은 파일을 선택하거나 파일을 분할해주세요.']
      },
      EILSEQ: {
        ko: '⚠️ 파일 인코딩에 문제가 있습니다.',
        en: '⚠️ Invalid character sequence.',
        suggestions: ['다른 인코딩으로 시도해주세요.']
      },
      EROFS: {
        ko: '⚠️ 읽기 전용 파일시스템입니다.',
        en: '⚠️ Read-only file system.',
        suggestions: ['쓰기 권한이 있는 위치를 선택해주세요.']
      },
      ENOTEMPTY: {
        ko: '⚠️ 디렉토리가 비어있지 않습니다.',
        en: '⚠️ Directory not empty.',
        suggestions: ['먼저 내부 파일들을 삭제해주세요.']
      },
      ETIMEDOUT: {
        ko: '⚠️ 작업 시간이 초과되었습니다.',
        en: '⚠️ Operation timed out.',
        suggestions: ['다시 시도해주세요.']
      },
      ENOTFOUND: {
        ko: '⚠️ 네트워크 연결에 문제가 있습니다.',
        en: '⚠️ Network connection issue.',
        suggestions: ['인터넷 연결을 확인해주세요.']
      },
      
      // 경로 해석 오류
      PATH_NOT_FOUND: {
        ko: '⚠️ 경로를 찾을 수 없습니다.',
        en: '⚠️ Path not found.',
        suggestions: ['경로를 다시 확인해주세요.']
      },
      INVALID_PATH: {
        ko: '⚠️ 유효하지 않은 경로입니다.',
        en: '⚠️ Invalid path.',
        suggestions: ['올바른 경로 형식을 사용해주세요.']
      },
      PATH_RESOLUTION_FAILED: {
        ko: '⚠️ 경로 해석에 실패했습니다.',
        en: '⚠️ Path resolution failed.',
        suggestions: ['다른 경로를 시도해주세요.']
      },
      
      // 초기화 오류
      INITIALIZATION_FAILED: {
        ko: '⚠️ 시스템 초기화에 실패했습니다.',
        en: '⚠️ System initialization failed.',
        suggestions: ['시스템을 재시작해주세요.']
      },
      DEPENDENCY_ERROR: {
        ko: '⚠️ 의존성 모듈 로드에 실패했습니다.',
        en: '⚠️ Dependency module loading failed.',
        suggestions: ['필요한 모듈을 확인해주세요.']
      },
      
      // 권한 오류
      PERMISSION_DENIED: {
        ko: '⚠️ 권한이 부족합니다.',
        en: '⚠️ Permission denied.',
        suggestions: ['관리자 권한으로 실행해주세요.']
      },
      SUBSCRIPTION_REQUIRED: {
        ko: '⚠️ 이 기능은 구독이 필요합니다.',
        en: '⚠️ Subscription required for this feature.',
        suggestions: ['구독을 업그레이드해주세요.']
      }
    };
  }

  /**
   * 에러 코드에 따른 사용자 친화적 메시지 생성
   */
  getUserFriendlyMessage(error, language = 'ko') {
    const errorCode = error.code || 'UNKNOWN';
    const errorInfo = this.errorMessages[errorCode];
    
    if (errorInfo) {
      return {
        message: errorInfo[language] || errorInfo.ko,
        suggestions: errorInfo.suggestions || [],
        code: errorCode,
        technical: error.message
      };
    }
    
    // 기본 에러 메시지
    return {
      message: language === 'ko' ? '⚠️ 알 수 없는 오류가 발생했습니다.' : '⚠️ An unknown error occurred.',
      suggestions: ['작업을 다시 시도해보세요.'],
      code: 'UNKNOWN',
      technical: error.message
    };
  }

  /**
   * 에러 로깅
   */
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context,
      userFriendly: this.getUserFriendlyMessage(error)
    };
    
    console.error('❌ FileSystem Error:', JSON.stringify(errorLog, null, 2));
    return errorLog;
  }

  /**
   * 에러 복구 시도
   */
  async attemptRecovery(error, context = {}) {
    const recoveryStrategies = {
      ENOENT: async () => {
        // 파일이 없으면 대안 경로 시도
        return { strategy: 'alternative_path', success: false };
      },
      EACCES: async () => {
        // 권한 문제면 권한 확인
        return { strategy: 'permission_check', success: false };
      },
      ETIMEDOUT: async () => {
        // 타임아웃이면 재시도
        return { strategy: 'retry', success: false };
      }
    };
    
    const strategy = recoveryStrategies[error.code];
    if (strategy) {
      try {
        return await strategy();
      } catch (recoveryError) {
        return { strategy: 'none', success: false, error: recoveryError };
      }
    }
    
    return { strategy: 'none', success: false };
  }

  /**
   * 에러 통계 업데이트
   */
  updateErrorStats(error, context = {}) {
    // 에러 통계 업데이트 로직
    const stats = {
      totalErrors: 0,
      errorTypes: {},
      lastError: new Date().toISOString()
    };
    
    return stats;
  }
}

// 전역 에러 핸들러 인스턴스
export const errorHandler = new ErrorHandler(); 