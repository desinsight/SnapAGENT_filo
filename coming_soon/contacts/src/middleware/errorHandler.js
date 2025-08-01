/**
 * 🚨 Error Handler Middleware
 * 
 * Express 에러 핸들링 미들웨어
 * 
 * @author Your Team
 * @version 1.0.0
 */

import logger from '../utils/logger.js';

/**
 * 🎯 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 🔍 에러 타입 분류
 */
const getErrorType = (error) => {
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
  if (error.name === 'CastError') return 'CAST_ERROR';
  if (error.name === 'MongoError' && error.code === 11000) return 'DUPLICATE_ERROR';
  if (error.name === 'JsonWebTokenError') return 'JWT_ERROR';
  if (error.name === 'TokenExpiredError') return 'JWT_EXPIRED';
  if (error.name === 'SyntaxError') return 'SYNTAX_ERROR';
  if (error.name === 'TypeError') return 'TYPE_ERROR';
  if (error.name === 'ReferenceError') return 'REFERENCE_ERROR';
  return 'UNKNOWN_ERROR';
};

/**
 * 📝 에러 로깅
 */
const logError = (error, req) => {
  const errorInfo = {
    type: getErrorType(error),
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  if (error.isOperational) {
    logger.warn('운영 에러:', errorInfo);
  } else {
    logger.error('시스템 에러:', errorInfo);
  }
};

/**
 * 🛡️ 에러 응답 생성
 */
const createErrorResponse = (error, isDevelopment = false) => {
  const baseResponse = {
    error: true,
    message: error.message || '서버 에러가 발생했습니다.',
    timestamp: new Date().toISOString()
  };

  // 개발 환경에서는 추가 정보 제공
  if (isDevelopment) {
    baseResponse.stack = error.stack;
    baseResponse.type = getErrorType(error);
  }

  return baseResponse;
};

/**
 * 🔧 MongoDB 에러 처리
 */
const handleMongoError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return {
      statusCode: 400,
      message: `유효성 검사 실패: ${messages.join(', ')}`
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: `잘못된 ID 형식: ${error.value}`
    };
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      statusCode: 409,
      message: `${field}가 이미 존재합니다.`
    };
  }

  return {
    statusCode: 500,
    message: '데이터베이스 에러가 발생했습니다.'
  };
};

/**
 * 🔐 JWT 에러 처리
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: '유효하지 않은 토큰입니다.'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: '토큰이 만료되었습니다.'
    };
  }

  return {
    statusCode: 401,
    message: '인증 에러가 발생했습니다.'
  };
};

/**
 * 🚨 메인 에러 핸들러
 */
export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || '서버 에러가 발생했습니다.';

  // 에러 로깅
  logError(error, req);

  // 특정 에러 타입 처리
  if (error.name === 'ValidationError' || error.name === 'CastError' || 
      (error.name === 'MongoError' && error.code === 11000)) {
    const mongoError = handleMongoError(error);
    statusCode = mongoError.statusCode;
    message = mongoError.message;
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const jwtError = handleJWTError(error);
    statusCode = jwtError.statusCode;
    message = jwtError.message;
  }

  // 운영 에러가 아닌 경우 500으로 설정
  if (!error.isOperational) {
    statusCode = 500;
    message = '서버 에러가 발생했습니다.';
  }

  // 개발 환경 확인
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 에러 응답 생성
  const errorResponse = createErrorResponse(
    { ...error, message },
    isDevelopment
  );

  // 응답 전송
  res.status(statusCode).json(errorResponse);
};

/**
 * 🔍 404 에러 핸들러
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `경로 ${req.originalUrl}을 찾을 수 없습니다.`,
    404
  );
  next(error);
};

/**
 * 🛡️ 비동기 에러 래퍼
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 🔒 권한 에러
 */
export const createPermissionError = (message = '접근 권한이 없습니다.') => {
  return new AppError(message, 403);
};

/**
 * 🔍 리소스 없음 에러
 */
export const createNotFoundError = (resource = '리소스') => {
  return new AppError(`${resource}을 찾을 수 없습니다.`, 404);
};

/**
 * ✅ 유효성 검사 에러
 */
export const createValidationError = (message = '유효성 검사에 실패했습니다.') => {
  return new AppError(message, 400);
};

/**
 * 🔐 인증 에러
 */
export const createAuthError = (message = '인증이 필요합니다.') => {
  return new AppError(message, 401);
};

/**
 * 📊 에러 통계
 */
class ErrorStats {
  constructor() {
    this.stats = {
      total: 0,
      byType: {},
      byStatusCode: {}
    };
  }

  record(error, statusCode) {
    this.stats.total++;
    
    const errorType = getErrorType(error);
    this.stats.byType[errorType] = (this.stats.byType[errorType] || 0) + 1;
    this.stats.byStatusCode[statusCode] = (this.stats.byStatusCode[statusCode] || 0) + 1;
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      total: 0,
      byType: {},
      byStatusCode: {}
    };
  }
}

export const errorStats = new ErrorStats();

// 에러 핸들러에 통계 추가
const originalErrorHandler = errorHandler;
export const errorHandlerWithStats = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  errorStats.record(error, statusCode);
  return originalErrorHandler(error, req, res, next);
}; 