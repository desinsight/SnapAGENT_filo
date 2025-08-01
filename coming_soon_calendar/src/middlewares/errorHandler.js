// errorHandler.js
// API 표준 에러 응답 및 상세 로깅을 위한 공통 에러 핸들러 미들웨어

const response = require('../utils/response');

// 커스텀 에러 클래스들
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'AUTHORIZATION_ERROR';
  }
}

class NotFoundError extends Error {
  constructor(message, resource = null) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    this.resource = resource;
  }
}

class ConflictError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'CONFLICT';
    this.details = details;
  }
}

class DatabaseError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.code = 'DATABASE_ERROR';
    this.details = details;
  }
}

/**
 * 에러 타입별 상태 코드 및 메시지 매핑
 */
const ERROR_MAPPINGS = {
  ValidationError: { status: 400, code: 'VALIDATION_ERROR' },
  AuthenticationError: { status: 401, code: 'AUTHENTICATION_ERROR' },
  AuthorizationError: { status: 403, code: 'AUTHORIZATION_ERROR' },
  NotFoundError: { status: 404, code: 'NOT_FOUND' },
  ConflictError: { status: 409, code: 'CONFLICT' },
  DatabaseError: { status: 500, code: 'DATABASE_ERROR' },
  SyntaxError: { status: 400, code: 'SYNTAX_ERROR' },
  TypeError: { status: 400, code: 'TYPE_ERROR' },
  ReferenceError: { status: 500, code: 'REFERENCE_ERROR' }
};

/**
 * 에러 로깅 함수
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
const logError = (error, req, res) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous',
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500
    },
    requestBody: req.body,
    requestParams: req.params,
    requestQuery: req.query
  };

  // 에러 심각도에 따른 로깅 레벨 결정
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error('🚨 심각한 서버 에러:', JSON.stringify(errorInfo, null, 2));
  } else if (statusCode >= 400) {
    console.warn('⚠️ 클라이언트 에러:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.info('ℹ️ 정보성 에러:', JSON.stringify(errorInfo, null, 2));
  }
};

/**
 * 에러 정보 정제 함수
 * @param {Error} error - 원본 에러 객체
 * @param {string} environment - 실행 환경
 * @returns {Object} 정제된 에러 정보
 */
const sanitizeError = (error, environment) => {
  const baseError = {
    message: error.message || '서버 내부 오류가 발생했습니다.',
    code: error.code || 'INTERNAL_ERROR'
  };

  // 개발 환경에서는 상세 정보 포함
  if (environment === 'development') {
    return {
      ...baseError,
      name: error.name,
      stack: error.stack,
      details: error.details,
      resource: error.resource
    };
  }

  // 프로덕션 환경에서는 민감한 정보 제거
  return {
    ...baseError,
    ...(error.details && { details: error.details }),
    ...(error.resource && { resource: error.resource })
  };
};

/**
 * 에러 응답 생성 함수
 * @param {Error} error - 에러 객체
 * @param {string} environment - 실행 환경
 * @returns {Object} 에러 응답 객체
 */
const createErrorResponse = (error, environment) => {
  const statusCode = error.statusCode || 500;
  const sanitizedError = sanitizeError(error, environment);
  
  return response.error(
    sanitizedError.message,
    sanitizedError.code,
    sanitizedError
  );
};

/**
 * 공통 에러 핸들러
 * - 예상치 못한 에러도 표준 포맷으로 반환
 * - 상세 에러 로깅
 * - 보안 고려사항 적용
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const errorHandler = (err, req, res, next) => {
  try {
    // 에러 로깅
    logError(err, req, res);

    // 에러 타입별 처리
    const errorMapping = ERROR_MAPPINGS[err.name] || { status: 500, code: 'INTERNAL_ERROR' };
    const statusCode = err.statusCode || errorMapping.status;
    const errorCode = err.code || errorMapping.code;

    // 기본 에러 응답 생성
    const errorResponse = createErrorResponse(err, process.env.NODE_ENV);

    // 응답 전송
    res.status(statusCode).json(errorResponse);

  } catch (handlerError) {
    // 에러 핸들러 자체에서 오류 발생 시 기본 응답
    console.error('🚨 에러 핸들러 오류:', handlerError);
    res.status(500).json(
      response.error(
        '서버 내부 오류가 발생했습니다.',
        'INTERNAL_ERROR'
      )
    );
  }
};

/**
 * 404 에러 핸들러 (라우트를 찾을 수 없는 경우)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `요청한 리소스를 찾을 수 없습니다: ${req.method} ${req.url}`,
    { method: req.method, url: req.url }
  );
  next(error);
};

/**
 * 비동기 에러 래퍼
 * Express에서 비동기 함수의 에러를 자동으로 캐치하기 위한 래퍼
 * @param {Function} fn - 비동기 함수
 * @returns {Function} 래핑된 함수
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 입력값 검증 에러 생성 헬퍼
 * @param {string} message - 에러 메시지
 * @param {Object} details - 상세 정보
 * @returns {ValidationError} 검증 에러 객체
 */
const createValidationError = (message, details = null) => {
  return new ValidationError(message, details);
};

/**
 * 데이터베이스 에러 생성 헬퍼
 * @param {string} message - 에러 메시지
 * @param {Object} details - 상세 정보
 * @returns {DatabaseError} 데이터베이스 에러 객체
 */
const createDatabaseError = (message, details = null) => {
  return new DatabaseError(message, details);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createValidationError,
  createDatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
}; 