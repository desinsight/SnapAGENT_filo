/**
 * 🚨 Error Handler Middleware
 * 
 * 통합 에러 핸들러 미들웨어
 * 세무 서비스에 특화된 에러 처리 로직
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import logger from '../utils/logger.js';

/**
 * 비동기 함수 에러 처리 래퍼
 * @param {Function} fn - 비동기 함수
 * @returns {Function} 에러 처리된 함수
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 데이터베이스 에러 처리
 * @param {Error} error - 데이터베이스 에러
 * @returns {AppError} 처리된 에러
 */
const handleDatabaseError = (error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(err => err.message).join(', ');
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }

  if (error.name === 'CastError') {
    return new AppError('유효하지 않은 ID 형식입니다.', 400, 'INVALID_ID');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new AppError(`${field}가 이미 존재합니다.`, 400, 'DUPLICATE_FIELD');
  }

  return new AppError('데이터베이스 오류가 발생했습니다.', 500, 'DATABASE_ERROR');
};

/**
 * JWT 에러 처리
 * @param {Error} error - JWT 에러
 * @returns {AppError} 처리된 에러
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('유효하지 않은 토큰입니다.', 401, 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('토큰이 만료되었습니다.', 401, 'TOKEN_EXPIRED');
  }

  return new AppError('인증 오류가 발생했습니다.', 401, 'AUTH_ERROR');
};

/**
 * 파일 업로드 에러 처리
 * @param {Error} error - 파일 업로드 에러
 * @returns {AppError} 처리된 에러
 */
const handleFileUploadError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('파일 크기가 제한을 초과했습니다.', 400, 'FILE_TOO_LARGE');
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('업로드 가능한 파일 개수를 초과했습니다.', 400, 'TOO_MANY_FILES');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('예상하지 못한 파일 필드가 있습니다.', 400, 'UNEXPECTED_FILE');
  }

  return new AppError('파일 업로드 중 오류가 발생했습니다.', 500, 'FILE_UPLOAD_ERROR');
};

/**
 * 외부 API 에러 처리
 * @param {Error} error - 외부 API 에러
 * @returns {AppError} 처리된 에러
 */
const handleExternalAPIError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || '외부 API 호출 중 오류가 발생했습니다.';

    if (status === 401) {
      return new AppError('외부 API 인증에 실패했습니다.', 401, 'EXTERNAL_API_AUTH_ERROR');
    }

    if (status === 403) {
      return new AppError('외부 API 접근이 거부되었습니다.', 403, 'EXTERNAL_API_FORBIDDEN');
    }

    if (status === 404) {
      return new AppError('외부 API 리소스를 찾을 수 없습니다.', 404, 'EXTERNAL_API_NOT_FOUND');
    }

    if (status >= 500) {
      return new AppError('외부 API 서버 오류가 발생했습니다.', 502, 'EXTERNAL_API_SERVER_ERROR');
    }

    return new AppError(message, status, 'EXTERNAL_API_ERROR');
  }

  if (error.request) {
    return new AppError('외부 API 서버에 연결할 수 없습니다.', 503, 'EXTERNAL_API_CONNECTION_ERROR');
  }

  return new AppError('외부 API 호출 중 오류가 발생했습니다.', 500, 'EXTERNAL_API_ERROR');
};

/**
 * 전역 에러 핸들러 미들웨어
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const errorHandler = (error, req, res, next) => {
  let processedError = error;

  // 에러 타입별 처리
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
    processedError = handleDatabaseError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    processedError = handleJWTError(error);
  } else if (error.code && error.code.startsWith('LIMIT_')) {
    processedError = handleFileUploadError(error);
  } else if (error.isAxiosError) {
    processedError = handleExternalAPIError(error);
  } else if (!error.isOperational) {
    // 프로그래밍 에러는 500으로 처리
    processedError = new AppError('서버 내부 오류가 발생했습니다.', 500, 'INTERNAL_SERVER_ERROR');
  }

  // 에러 로깅
  logger.error('에러 발생', {
    error: {
      message: processedError.message,
      stack: processedError.stack,
      statusCode: processedError.statusCode,
      errorCode: processedError.errorCode
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    },
    timestamp: new Date().toISOString()
  });

  // 개발 환경에서는 스택 트레이스 포함
  const errorResponse = {
    success: false,
    message: processedError.message,
    errorCode: processedError.errorCode
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = processedError.stack;
    errorResponse.details = {
      originalError: error.message,
      originalStack: error.stack
    };
  }

  res.status(processedError.statusCode || 500).json(errorResponse);
};

/**
 * 404 에러 핸들러
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `요청한 경로 ${req.originalUrl}를 찾을 수 없습니다.`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * 요청 유효성 검사 에러 핸들러
 * @param {Error} error - 유효성 검사 에러
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const validationErrorHandler = (error, req, res, next) => {
  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    const processedError = new AppError(
      '요청 데이터 유효성 검사에 실패했습니다.',
      400,
      'VALIDATION_ERROR'
    );

    processedError.details = details;
    return next(processedError);
  }

  next(error);
};

/**
 * 보안 관련 에러 핸들러
 * @param {Error} error - 보안 관련 에러
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const securityErrorHandler = (error, req, res, next) => {
  // 보안 관련 에러 로깅 강화
  if (error.statusCode === 401 || error.statusCode === 403) {
    logger.warn('보안 관련 에러 발생', {
      error: {
        message: error.message,
        statusCode: error.statusCode,
        errorCode: error.errorCode
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      },
      timestamp: new Date().toISOString()
    });
  }

  next(error);
};

/**
 * 프로세스 종료 시 에러 처리
 */
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외 발생', {
    error: {
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  });

  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 Promise 거부', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    timestamp: new Date().toISOString()
  });

  process.exit(1);
});

export default {
  asyncHandler,
  AppError,
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  securityErrorHandler
}; 