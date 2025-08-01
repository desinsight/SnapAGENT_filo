/**
 * 커스텀 에러 클래스들
 */

/**
 * 유효성 검증 에러
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * 권한 에러
 */
class PermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermissionError';
    this.statusCode = 403;
  }
}

/**
 * 리소스 없음 에러
 */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * 인증 에러
 */
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * 충돌 에러 (중복 등)
 */
class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

/**
 * 서버 에러
 */
class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = 500;
  }
}

/**
 * 에러 핸들러 미들웨어
 */
const errorHandler = (err, req, res, next) => {
  const logger = require('./logger');
  
  // 기본 에러 정보
  let statusCode = err.statusCode || 500;
  let message = err.message || '서버 내부 오류가 발생했습니다.';
  
  // 커스텀 에러 처리
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      break;
    case 'PermissionError':
      statusCode = 403;
      break;
    case 'NotFoundError':
      statusCode = 404;
      break;
    case 'AuthenticationError':
      statusCode = 401;
      break;
    case 'ConflictError':
      statusCode = 409;
      break;
    case 'MongoError':
      if (err.code === 11000) {
        statusCode = 409;
        message = '중복된 데이터입니다.';
      }
      break;
    case 'CastError':
      statusCode = 400;
      message = '잘못된 데이터 형식입니다.';
      break;
    default:
      statusCode = 500;
  }
  
  // 로그 기록
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`, {
    error: err.stack,
    user: req.user?.id,
    ip: req.ip
  });
  
  // 응답
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  ValidationError,
  PermissionError,
  NotFoundError,
  AuthenticationError,
  ConflictError,
  ServerError,
  errorHandler
}; 