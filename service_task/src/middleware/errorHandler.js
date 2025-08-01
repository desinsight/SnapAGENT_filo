/**
 * Error Handler Middleware - 에러 핸들링 미들웨어
 * 애플리케이션 에러 처리 및 응답 포맷팅
 * 
 * @description
 * - 다양한 에러 타입 처리
 * - 에러 로깅 및 모니터링
 * - 클라이언트 응답 포맷팅
 * - 개발/프로덕션 환경별 에러 처리
 * - 보안을 위한 에러 정보 필터링
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';

/**
 * 커스텀 에러 클래스들
 */
export class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = '권한이 없습니다.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = '리소스') {
    super(`${resource}를 찾을 수 없습니다.`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = '데이터베이스 오류가 발생했습니다.') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = '외부 서비스 오류가 발생했습니다.') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

/**
 * 에러 코드별 메시지 매핑
 */
const ERROR_MESSAGES = {
  // 인증 관련
  'TOKEN_REQUIRED': '인증 토큰이 필요합니다.',
  'INVALID_TOKEN': '유효하지 않은 토큰입니다.',
  'TOKEN_EXPIRED': '토큰이 만료되었습니다.',
  'INACTIVE_ACCOUNT': '비활성화된 계정입니다.',
  'INVALID_CREDENTIALS': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'ACCOUNT_LOCKED': '계정이 잠겼습니다.',
  'REFRESH_TOKEN_REQUIRED': '리프레시 토큰이 필요합니다.',
  'INVALID_REFRESH_TOKEN': '유효하지 않은 리프레시 토큰입니다.',

  // 권한 관련
  'ADMIN_REQUIRED': '관리자 권한이 필요합니다.',
  'ORGANIZATION_ID_REQUIRED': '조직 ID가 필요합니다.',
  'NOT_ORGANIZATION_MEMBER': '해당 조직의 멤버가 아닙니다.',
  'TEAM_ID_REQUIRED': '팀 ID가 필요합니다.',
  'NOT_TEAM_MEMBER': '해당 팀의 멤버가 아닙니다.',
  'PROJECT_ID_REQUIRED': '프로젝트 ID가 필요합니다.',
  'NOT_PROJECT_MEMBER': '해당 프로젝트의 멤버가 아닙니다.',
  'TASK_ID_REQUIRED': '태스크 ID가 필요합니다.',
  'TASK_ACCESS_DENIED': '해당 태스크에 접근할 권한이 없습니다.',

  // 검증 관련
  'VALIDATION_ERROR': '입력 데이터가 유효하지 않습니다.',
  'REQUIRED_FIELD': '필수 필드가 누락되었습니다.',
  'INVALID_FORMAT': '잘못된 형식입니다.',
  'INVALID_EMAIL': '유효한 이메일 주소를 입력해주세요.',
  'INVALID_PASSWORD': '비밀번호 형식이 올바르지 않습니다.',
  'PASSWORD_MISMATCH': '비밀번호가 일치하지 않습니다.',
  'INVALID_DATE': '유효한 날짜를 입력해주세요.',
  'INVALID_URL': '유효한 URL을 입력해주세요.',

  // 리소스 관련
  'NOT_FOUND_ERROR': '요청한 리소스를 찾을 수 없습니다.',
  'USER_NOT_FOUND': '사용자를 찾을 수 없습니다.',
  'TASK_NOT_FOUND': '태스크를 찾을 수 없습니다.',
  'ORGANIZATION_NOT_FOUND': '조직을 찾을 수 없습니다.',
  'TEAM_NOT_FOUND': '팀을 찾을 수 없습니다.',
  'PROJECT_NOT_FOUND': '프로젝트를 찾을 수 없습니다.',

  // 충돌 관련
  'CONFLICT_ERROR': '리소스 충돌이 발생했습니다.',
  'EMAIL_ALREADY_EXISTS': '이미 존재하는 이메일입니다.',
  'ORGANIZATION_NAME_EXISTS': '이미 존재하는 조직명입니다.',
  'TEAM_NAME_EXISTS': '이미 존재하는 팀명입니다.',
  'PROJECT_NAME_EXISTS': '이미 존재하는 프로젝트명입니다.',
  'DUPLICATE_TASK': '중복된 태스크입니다.',

  // 시스템 관련
  'DATABASE_ERROR': '데이터베이스 오류가 발생했습니다.',
  'EXTERNAL_SERVICE_ERROR': '외부 서비스 오류가 발생했습니다.',
  'FILE_UPLOAD_ERROR': '파일 업로드 중 오류가 발생했습니다.',
  'FILE_DELETE_ERROR': '파일 삭제 중 오류가 발생했습니다.',
  'EMAIL_SEND_ERROR': '이메일 전송 중 오류가 발생했습니다.',
  'NOTIFICATION_ERROR': '알림 전송 중 오류가 발생했습니다.',

  // 제한 관련
  'RATE_LIMIT_ERROR': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'QUOTA_EXCEEDED': '사용량 한도를 초과했습니다.',
  'FILE_SIZE_LIMIT': '파일 크기가 제한을 초과했습니다.',
  'MAX_MEMBERS_REACHED': '최대 멤버 수에 도달했습니다.',
  'MAX_TASKS_REACHED': '최대 태스크 수에 도달했습니다.',

  // 기타
  'UNKNOWN_ERROR': '알 수 없는 오류가 발생했습니다.',
  'SERVICE_UNAVAILABLE': '서비스를 일시적으로 사용할 수 없습니다.',
  'MAINTENANCE_MODE': '시스템 점검 중입니다.',
  'VERSION_DEPRECATED': '지원되지 않는 API 버전입니다.'
};

/**
 * 에러 로깅 함수
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 */
const logError = (error, req) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    userId: req?.user?._id,
    timestamp: new Date().toISOString()
  };

  // 운영 에러와 프로그래밍 에러 구분
  if (error.isOperational) {
    logger.warn('운영 에러 발생:', errorInfo);
  } else {
    logger.error('프로그래밍 에러 발생:', errorInfo);
  }

  // 개발 환경에서는 스택 트레이스도 로깅
  if (process.env.NODE_ENV === 'development') {
    logger.debug('에러 스택 트레이스:', error.stack);
  }
};

/**
 * 클라이언트 응답 포맷팅 함수
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @returns {Object} 포맷된 응답 객체
 */
const formatErrorResponse = (error, req) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'UNKNOWN_ERROR';
  const message = error.message || ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];

  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req?.url,
    method: req?.method
  };

  // 개발 환경에서는 추가 정보 제공
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.details;
    response.originalError = {
      name: error.name,
      message: error.message
    };
  }

  // 프로덕션 환경에서는 민감한 정보 제거
  if (process.env.NODE_ENV === 'production') {
    // 500 에러의 경우 일반적인 메시지로 변경
    if (statusCode >= 500) {
      response.message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      response.code = 'INTERNAL_SERVER_ERROR';
    }
  }

  return response;
};

/**
 * MongoDB 에러 처리 함수
 * @param {Error} error - MongoDB 에러 객체
 * @returns {AppError} 처리된 에러 객체
 */
const handleMongoError = (error) => {
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return new ValidationError('데이터 검증에 실패했습니다.', details);
  }

  if (error.name === 'CastError') {
    return new ValidationError('잘못된 데이터 형식입니다.');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    return new ConflictError(`${field} '${value}'가 이미 존재합니다.`);
  }

  if (error.name === 'MongoNetworkError') {
    return new DatabaseError('데이터베이스 연결 오류가 발생했습니다.');
  }

  return new DatabaseError('데이터베이스 오류가 발생했습니다.');
};

/**
 * JWT 에러 처리 함수
 * @param {Error} error - JWT 에러 객체
 * @returns {AppError} 처리된 에러 객체
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('유효하지 않은 토큰입니다.');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('토큰이 만료되었습니다.');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('토큰이 아직 유효하지 않습니다.');
  }

  return new AuthenticationError('토큰 처리 중 오류가 발생했습니다.');
};

/**
 * 메인 에러 핸들링 미들웨어
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const errorHandler = (error, req, res, next) => {
  let processedError = error;

  // MongoDB 에러 처리
  if (error.name && error.name.startsWith('Mongo')) {
    processedError = handleMongoError(error);
  }

  // JWT 에러 처리
  if (error.name && error.name.includes('JsonWebToken')) {
    processedError = handleJWTError(error);
  }

  // Multer 에러 처리 (파일 업로드)
  if (error.code === 'LIMIT_FILE_SIZE') {
    processedError = new ValidationError('파일 크기가 제한을 초과했습니다.');
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    processedError = new ValidationError('파일 개수가 제한을 초과했습니다.');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    processedError = new ValidationError('예상하지 못한 파일 필드가 있습니다.');
  }

  // 에러 로깅
  logError(processedError, req);

  // 응답 포맷팅
  const response = formatErrorResponse(processedError, req);
  const statusCode = processedError.statusCode || 500;

  // 응답 전송
  res.status(statusCode).json(response);
};

/**
 * 404 에러 핸들링 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('요청한 엔드포인트');
  next(error);
};

/**
 * 비동기 에러 래퍼 함수
 * @param {Function} fn - 비동기 함수
 * @returns {Function} 래핑된 함수
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 글로벌 에러 이벤트 리스너
 */
export const setupGlobalErrorHandlers = () => {
  // 처리되지 않은 Promise 거부 처리
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('처리되지 않은 Promise 거부:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise
    });

    // 프로덕션 환경에서는 프로세스 종료
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // 처리되지 않은 예외 처리
  process.on('uncaughtException', (error) => {
    logger.error('처리되지 않은 예외:', {
      message: error.message,
      stack: error.stack
    });

    // 프로덕션 환경에서는 프로세스 종료
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // 경고 처리
  process.on('warning', (warning) => {
    logger.warn('Node.js 경고:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
};

/**
 * 에러 통계 수집 함수
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 */
export const collectErrorStats = (error, req) => {
  // 에러 통계 수집 로직 (구현 필요)
  // 예: 에러 빈도, 에러 타입별 분류, 사용자별 에러 패턴 등
  const errorStats = {
    timestamp: new Date(),
    errorCode: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500,
    path: req?.url,
    method: req?.method,
    userId: req?.user?._id,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip
  };

  // 통계 데이터 저장 로직 (구현 필요)
  // logger.info('에러 통계:', errorStats);
};

/**
 * 에러 복구 함수
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @returns {boolean} 복구 가능 여부
 */
export const attemptErrorRecovery = (error, req) => {
  // 에러 복구 로직 (구현 필요)
  // 예: 데이터베이스 재연결, 캐시 초기화, 세션 복구 등
  
  if (error.name === 'MongoNetworkError') {
    // 데이터베이스 재연결 시도
    logger.info('데이터베이스 재연결 시도 중...');
    return true;
  }

  if (error.code === 'RATE_LIMIT_ERROR') {
    // 속도 제한 해제 대기
    logger.info('속도 제한 해제 대기 중...');
    return true;
  }

  return false;
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  collectErrorStats,
  attemptErrorRecovery,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
}; 