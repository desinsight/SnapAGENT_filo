// response.js
// 표준화된 API 응답 유틸리티
// 확장성, AI 연동성, 일관성을 고려한 응답 구조

/**
 * 성공 응답 생성
 * @param {Object} res - Express 응답 객체
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 응답 메시지
 * @param {*} data - 응답 데이터
 * @param {string} code - 응답 코드
 * @returns {Object} Express 응답
 */
const successResponse = (res, statusCode = 200, message = '성공', data = null, code = 'SUCCESS') => {
  const response = {
    success: true,
    message,
    code,
    data,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl || res.req?.url
  };

  return res.status(statusCode).json(response);
};

/**
 * 에러 응답 생성
 * @param {Object} res - Express 응답 객체
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 에러 메시지
 * @param {string} code - 에러 코드
 * @param {*} details - 상세 에러 정보
 * @returns {Object} Express 응답
 */
const errorResponse = (res, statusCode = 500, message = '서버 오류', code = 'ERROR', details = null) => {
  const response = {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl || res.req?.url
  };

  return res.status(statusCode).json(response);
};

/**
 * 성공 응답 (간단한 형태)
 * @param {*} data - 응답 데이터
 * @param {string} message - 응답 메시지
 * @returns {Object} 응답 객체
 */
const success = (data = null, message = '성공') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 에러 응답 (간단한 형태)
 * @param {string} message - 에러 메시지
 * @param {string} code - 에러 코드
 * @param {*} details - 상세 정보
 * @returns {Object} 응답 객체
 */
const error = (message = '오류가 발생했습니다', code = 'ERROR', details = null) => {
  return {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * 페이지네이션 응답 생성
 * @param {Array} items - 아이템 목록
 * @param {number} page - 현재 페이지
 * @param {number} limit - 페이지 크기
 * @param {number} total - 전체 아이템 수
 * @param {string} message - 응답 메시지
 * @returns {Object} 페이지네이션 응답 객체
 */
const paginatedResponse = (items, page, limit, total, message = '조회 성공') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * 검증 에러 응답 생성
 * @param {Array} errors - 검증 에러 목록
 * @param {string} message - 에러 메시지
 * @returns {Object} 검증 에러 응답 객체
 */
const validationError = (errors, message = '입력 데이터 검증에 실패했습니다') => {
  return {
    success: false,
    message,
    code: 'VALIDATION_ERROR',
    details: {
      errors
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * 권한 에러 응답 생성
 * @param {string} message - 에러 메시지
 * @returns {Object} 권한 에러 응답 객체
 */
const permissionError = (message = '접근 권한이 없습니다') => {
  return {
    success: false,
    message,
    code: 'PERMISSION_DENIED',
    timestamp: new Date().toISOString()
  };
};

/**
 * 리소스 없음 에러 응답 생성
 * @param {string} message - 에러 메시지
 * @returns {Object} 리소스 없음 에러 응답 객체
 */
const notFoundError = (message = '리소스를 찾을 수 없습니다') => {
  return {
    success: false,
    message,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  };
};

/**
 * 인증 에러 응답 생성
 * @param {string} message - 에러 메시지
 * @returns {Object} 인증 에러 응답 객체
 */
const authError = (message = '인증이 필요합니다') => {
  return {
    success: false,
    message,
    code: 'AUTHENTICATION_REQUIRED',
    timestamp: new Date().toISOString()
  };
};

// 모듈 내보내기
module.exports = {
  successResponse,
  errorResponse,
  success,
  error,
  paginatedResponse,
  validationError,
  permissionError,
  notFoundError,
  authError
}; 