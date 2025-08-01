/**
 * Error Handler Middleware - 에러 핸들링 미들웨어
 * 전역 에러 처리 및 로깅
 * 
 * @description
 * - 다양한 에러 타입 처리
 * - 에러 로깅 및 모니터링
 * - 클라이언트 응답 포맷팅
 * - 보안 관련 에러 처리
 * - 개발/프로덕션 환경별 에러 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

/**
 * 에러 타입 정의
 * 애플리케이션에서 발생할 수 있는 에러 타입들
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

/**
 * 커스텀 에러 클래스
 * 애플리케이션에서 사용할 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(message, statusCode, errorType = ErrorTypes.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
    this.isOperational = true; // 운영상 에러인지 구분

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 검증 에러 클래스
 * 데이터 검증 실패 시 사용
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, details);
  }
}

/**
 * 인증 에러 클래스
 * 인증 실패 시 사용
 */
export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }
}

/**
 * 권한 에러 클래스
 * 권한 부족 시 사용
 */
export class AuthorizationError extends AppError {
  constructor(message = '접근 권한이 없습니다.') {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
  }
}

/**
 * 리소스 없음 에러 클래스
 * 리소스를 찾을 수 없을 때 사용
 */
export class NotFoundError extends AppError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다.') {
    super(message, 404, ErrorTypes.NOT_FOUND_ERROR);
  }
}

/**
 * 충돌 에러 클래스
 * 리소스 충돌 시 사용
 */
export class ConflictError extends AppError {
  constructor(message = '리소스 충돌이 발생했습니다.') {
    super(message, 409, ErrorTypes.CONFLICT_ERROR);
  }
}

/**
 * 속도 제한 에러 클래스
 * 요청 속도 제한 초과 시 사용
 */
export class RateLimitError extends AppError {
  constructor(message = '요청이 너무 많습니다.') {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR);
  }
}

/**
 * 파일 업로드 에러 클래스
 * 파일 업로드 실패 시 사용
 */
export class FileUploadError extends AppError {
  constructor(message = '파일 업로드에 실패했습니다.') {
    super(message, 400, ErrorTypes.FILE_UPLOAD_ERROR);
  }
}

/**
 * 데이터베이스 에러 클래스
 * 데이터베이스 오류 시 사용
 */
export class DatabaseError extends AppError {
  constructor(message = '데이터베이스 오류가 발생했습니다.') {
    super(message, 500, ErrorTypes.DATABASE_ERROR);
  }
}

/**
 * 외부 서비스 에러 클래스
 * 외부 API 호출 실패 시 사용
 */
export class ExternalServiceError extends AppError {
  constructor(message = '외부 서비스 호출에 실패했습니다.') {
    super(message, 502, ErrorTypes.EXTERNAL_SERVICE_ERROR);
  }
}

/**
 * 전역 에러 핸들러
 * 모든 에러를 처리하는 미들웨어
 * 
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 에러 로깅
  logError(err, req);

  // Mongoose 검증 에러 처리
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message, err.errors);
  }

  // Mongoose 중복 키 에러 처리
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field}가 이미 사용 중입니다.`;
    error = new ConflictError(message);
  }

  // Mongoose Cast 에러 처리 (잘못된 ObjectId 등)
  if (err.name === 'CastError') {
    const message = '유효하지 않은 리소스 ID입니다.';
    error = new ValidationError(message);
  }

  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('유효하지 않은 토큰입니다.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('토큰이 만료되었습니다.');
  }

  // Multer 에러 처리 (파일 업로드)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new FileUploadError('파일 크기가 제한을 초과했습니다.');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new FileUploadError('파일 개수가 제한을 초과했습니다.');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new FileUploadError('예상하지 못한 파일이 업로드되었습니다.');
  }

  // 기본 에러 설정
  if (!error.statusCode) {
    error.statusCode = 500;
    error.errorType = ErrorTypes.INTERNAL_SERVER_ERROR;
  }

  // 에러 응답 생성
  const errorResponse = createErrorResponse(error, req);

  // 응답 전송
  res.status(error.statusCode).json(errorResponse);
};

/**
 * 404 에러 핸들러
 * 존재하지 않는 라우트에 대한 처리
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`경로 ${req.originalUrl}을(를) 찾을 수 없습니다.`);
  next(error);
};

/**
 * 에러 로깅 함수
 * 에러 정보를 로그에 기록
 * 
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 */
const logError = (err, req) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    errorType: err.errorType || ErrorTypes.INTERNAL_SERVER_ERROR,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    timestamp: new Date().toISOString()
  };

  // 운영상 에러가 아닌 경우 더 자세한 로그
  if (!err.isOperational) {
    logger.error('시스템 에러 발생:', errorInfo);
  } else {
    logger.warn('운영상 에러 발생:', errorInfo);
  }

  // 프로덕션에서는 민감한 정보 제거
  if (process.env.NODE_ENV === 'production') {
    delete errorInfo.stack;
    delete errorInfo.userAgent;
  }
};

/**
 * 에러 응답 생성 함수
 * 클라이언트에게 전송할 에러 응답 포맷 생성
 * 
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @returns {Object} 에러 응답 객체
 */
const createErrorResponse = (error, req) => {
  const response = {
    success: false,
    message: error.message,
    error: {
      type: error.errorType || ErrorTypes.INTERNAL_SERVER_ERROR,
      code: error.statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // 개발 환경에서는 추가 정보 포함
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.details = error.details;
  }

  // 특정 에러 타입에 따른 추가 정보
  switch (error.errorType) {
    case ErrorTypes.VALIDATION_ERROR:
      response.error.validationErrors = error.details;
      break;
    
    case ErrorTypes.RATE_LIMIT_ERROR:
      response.error.retryAfter = error.retryAfter;
      break;
    
    case ErrorTypes.FILE_UPLOAD_ERROR:
      response.error.fileInfo = error.details;
      break;
  }

  return response;
};

/**
 * 비동기 에러 래퍼
 * 비동기 함수의 에러를 자동으로 캐치하는 래퍼 함수
 * 
 * @param {Function} fn - 비동기 함수
 * @returns {Function} 에러 처리된 함수
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 에러 모니터링 함수
 * 에러 통계 및 모니터링 정보 수집
 * 
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 */
export const monitorError = (err, req) => {
  // 에러 통계 수집 (Redis 또는 데이터베이스에 저장)
  const errorStats = {
    type: err.errorType || ErrorTypes.INTERNAL_SERVER_ERROR,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date(),
    userId: req.user?._id
  };

  // Redis에 에러 통계 저장 (비동기)
  if (process.env.REDIS_URL) {
    const { setCache } = require('../config/redis.js');
    const key = `error_stats:${new Date().toISOString().split('T')[0]}`;
    
    setCache(key, errorStats, 86400).catch(logErr => {
      logger.error('에러 통계 저장 실패:', logErr);
    });
  }
};

/**
 * 보안 에러 처리 함수
 * 보안 관련 에러에 대한 특별 처리
 * 
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 */
export const handleSecurityError = (err, req) => {
  // 보안 관련 에러 감지
  const securityErrors = [
    'SQL_INJECTION',
    'XSS_ATTACK',
    'CSRF_ATTACK',
    'PATH_TRAVERSAL',
    'UNAUTHORIZED_ACCESS'
  ];

  if (securityErrors.includes(err.errorType)) {
    // 보안 로그 기록
    logger.error('보안 위협 감지:', {
      errorType: err.errorType,
      message: err.message,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });

    // 관리자에게 알림 (이메일, 슬랙 등)
    // sendSecurityAlert(err, req);
  }
};

/**
 * 에러 복구 함수
 * 일부 에러에 대한 자동 복구 시도
 * 
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @returns {boolean} 복구 성공 여부
 */
export const attemptErrorRecovery = async (err, req) => {
  try {
    // 데이터베이스 연결 에러 복구
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      const { connectDatabase } = require('../config/database.js');
      await connectDatabase();
      return true;
    }

    // Redis 연결 에러 복구
    if (err.message.includes('Redis')) {
      const { connectRedis } = require('../config/redis.js');
      await connectRedis();
      return true;
    }

    return false;
  } catch (recoveryError) {
    logger.error('에러 복구 실패:', recoveryError);
    return false;
  }
};

// 기본 내보내기
export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  FileUploadError,
  DatabaseError,
  ExternalServiceError,
  ErrorTypes
}; 