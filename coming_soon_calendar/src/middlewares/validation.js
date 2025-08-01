// validation.js
// 데이터 검증 미들웨어 - 캘린더 서비스의 모든 입력 데이터 검증
// 확장성, 재사용성, AI 연동성을 고려한 체계적인 검증 시스템

const response = require('../utils/response');

// 커스텀 검증 에러 클래스
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * 공통 검증 유틸리티 함수들
 */

/**
 * 필수 필드 검증
 * @param {Object} data - 검증할 데이터 객체
 * @param {Array<string>} requiredFields - 필수 필드 목록
 * @returns {Object} 검증 결과
 */
const validateRequiredFields = (data, requiredFields) => {
  const errors = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field}는 필수 항목입니다.`,
        code: 'REQUIRED_FIELD'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 문자열 길이 검증
 * @param {string} value - 검증할 문자열
 * @param {number} minLength - 최소 길이
 * @param {number} maxLength - 최대 길이
 * @param {string} fieldName - 필드명
 * @returns {Object} 검증 결과
 */
const validateStringLength = (value, minLength, maxLength, fieldName) => {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName}는 문자열이어야 합니다.`,
        code: 'INVALID_TYPE'
      }
    };
  }
  
  if (value.length < minLength) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName}는 최소 ${minLength}자 이상이어야 합니다.`,
        code: 'MIN_LENGTH'
      }
    };
  }
  
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName}는 최대 ${maxLength}자까지 허용됩니다.`,
        code: 'MAX_LENGTH'
      }
    };
  }
  
  return { isValid: true };
};

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일 여부
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 날짜 형식 검증
 * @param {string|Date} date - 검증할 날짜
 * @returns {boolean} 유효한 날짜 여부
 */
const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * UUID 형식 검증
 * @param {string} uuid - 검증할 UUID
 * @returns {boolean} 유효한 UUID 여부
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 색상 코드 검증
 * @param {string} color - 검증할 색상 코드
 * @returns {boolean} 유효한 색상 코드 여부
 */
const isValidColor = (color) => {
  const colorRegex = /^#[0-9A-F]{6}$/i;
  return colorRegex.test(color);
};

/**
 * 알림 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateNotification = (req, res, next) => {
  try {
    const { type, message, scheduledAt, priority } = req.body;
    const errors = [];
    
    // 필수 필드 검증
    const requiredValidation = validateRequiredFields(req.body, ['type', 'message']);
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // 타입 검증
    const validTypes = ['email', 'push', 'sms', 'in_app', 'webhook'];
    if (type && !validTypes.includes(type)) {
      errors.push({
        field: 'type',
        message: `유효하지 않은 알림 타입입니다. 허용된 타입: ${validTypes.join(', ')}`,
        code: 'INVALID_TYPE'
      });
    }
    
    // 메시지 길이 검증
    if (message) {
      const messageValidation = validateStringLength(message, 1, 500, 'message');
      if (!messageValidation.isValid) {
        errors.push(messageValidation.error);
      }
    }
    
    // 예약 시간 검증
    if (scheduledAt) {
      if (!isValidDate(scheduledAt)) {
        errors.push({
          field: 'scheduledAt',
          message: '유효하지 않은 날짜 형식입니다.',
          code: 'INVALID_DATE'
        });
      } else {
        const scheduledDate = new Date(scheduledAt);
        const now = new Date();
        if (scheduledDate <= now) {
          errors.push({
            field: 'scheduledAt',
            message: '예약 시간은 현재 시간보다 이후여야 합니다.',
            code: 'INVALID_SCHEDULE_TIME'
          });
        }
      }
    }
    
    // 우선순위 검증
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push({
        field: 'priority',
        message: `유효하지 않은 우선순위입니다. 허용된 우선순위: ${validPriorities.join(', ')}`,
        code: 'INVALID_PRIORITY'
      });
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('입력 데이터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('알림 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

/**
 * 캘린더 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateCalendar = (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const errors = [];
    
    // 필수 필드 검증
    const requiredValidation = validateRequiredFields(req.body, ['name']);
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // 이름 길이 검증
    if (name) {
      const nameValidation = validateStringLength(name, 1, 100, 'name');
      if (!nameValidation.isValid) {
        errors.push(nameValidation.error);
      }
    }
    
    // 색상 검증
    if (color && !isValidColor(color)) {
      errors.push({
        field: 'color',
        message: '유효하지 않은 색상 형식입니다. (예: #FF0000)',
        code: 'INVALID_COLOR'
      });
    }
    
    // 설명 길이 검증
    if (description) {
      const descValidation = validateStringLength(description, 0, 500, 'description');
      if (!descValidation.isValid) {
        errors.push(descValidation.error);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('입력 데이터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('캘린더 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

/**
 * 이벤트 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateEvent = (req, res, next) => {
  try {
    const { title, start, end, description, attendees } = req.body;
    const errors = [];
    
    // 필수 필드 검증
    const requiredValidation = validateRequiredFields(req.body, ['title', 'start', 'end']);
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // 제목 길이 검증
    if (title) {
      const titleValidation = validateStringLength(title, 1, 200, 'title');
      if (!titleValidation.isValid) {
        errors.push(titleValidation.error);
      }
    }
    
    // 시작 시간 검증
    if (start && !isValidDate(start)) {
      errors.push({
        field: 'start',
        message: '유효하지 않은 시작 시간 형식입니다.',
        code: 'INVALID_START_DATE'
      });
    }
    
    // 종료 시간 검증
    if (end && !isValidDate(end)) {
      errors.push({
        field: 'end',
        message: '유효하지 않은 종료 시간 형식입니다.',
        code: 'INVALID_END_DATE'
      });
    }
    
    // 시작/종료 시간 순서 검증
    if (start && end && isValidDate(start) && isValidDate(end)) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate >= endDate) {
        errors.push({
          field: 'end',
          message: '종료 시간은 시작 시간보다 이후여야 합니다.',
          code: 'INVALID_TIME_ORDER'
        });
      }
    }
    
    // 설명 길이 검증
    if (description) {
      const descValidation = validateStringLength(description, 0, 1000, 'description');
      if (!descValidation.isValid) {
        errors.push(descValidation.error);
      }
    }
    
    // 참석자 검증
    if (attendees && Array.isArray(attendees)) {
      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        if (attendee.email && !isValidEmail(attendee.email)) {
          errors.push({
            field: `attendees[${i}].email`,
            message: '유효하지 않은 이메일 형식입니다.',
            code: 'INVALID_EMAIL'
          });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('입력 데이터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('이벤트 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

/**
 * 참석자 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateAttendee = (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    const errors = [];
    
    // 필수 필드 검증
    const requiredValidation = validateRequiredFields(req.body, ['email']);
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // 이메일 검증
    if (email && !isValidEmail(email)) {
      errors.push({
        field: 'email',
        message: '유효하지 않은 이메일 형식입니다.',
        code: 'INVALID_EMAIL'
      });
    }
    
    // 이름 길이 검증
    if (name) {
      const nameValidation = validateStringLength(name, 1, 100, 'name');
      if (!nameValidation.isValid) {
        errors.push(nameValidation.error);
      }
    }
    
    // 역할 검증
    const validRoles = ['attendee', 'organizer', 'optional', 'resource'];
    if (role && !validRoles.includes(role)) {
      errors.push({
        field: 'role',
        message: `유효하지 않은 역할입니다. 허용된 역할: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE'
      });
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('입력 데이터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('참석자 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

/**
 * UUID 파라미터 검증 미들웨어
 * @param {string} paramName - 검증할 파라미터 이름
 * @returns {Function} 검증 미들웨어 함수
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    try {
      const uuid = req.params[paramName];
      
      if (!uuid) {
        return res.status(400).json(response.error(`${paramName} 파라미터가 필요합니다.`));
      }
      
      if (!isValidUUID(uuid)) {
        return res.status(400).json(response.error(`유효하지 않은 ${paramName} 형식입니다.`));
      }
      
      next();
    } catch (error) {
      console.error('UUID 검증 오류:', error);
      res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
    }
  };
};

/**
 * 페이지네이션 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validatePagination = (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const errors = [];
    
    // 페이지 번호 검증
    if (page) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push({
          field: 'page',
          message: '페이지 번호는 1 이상의 정수여야 합니다.',
          code: 'INVALID_PAGE'
        });
      }
    }
    
    // 페이지 크기 검증
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({
          field: 'limit',
          message: '페이지 크기는 1~100 사이의 정수여야 합니다.',
          code: 'INVALID_LIMIT'
        });
      }
    }
    
    // 정렬 순서 검증
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      errors.push({
        field: 'sortOrder',
        message: '정렬 순서는 "asc" 또는 "desc"여야 합니다.',
        code: 'INVALID_SORT_ORDER'
      });
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('페이지네이션 파라미터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('페이지네이션 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

/**
 * 위치 정보 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateLocation = (req, res, next) => {
  try {
    const { address, coordinates, placeId } = req.body;
    const errors = [];
    
    // 주소 검증
    if (address && typeof address !== 'string') {
      errors.push('주소는 문자열이어야 합니다.');
    }
    
    // 좌표 검증
    if (coordinates) {
      const { latitude, longitude } = coordinates;
      
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        errors.push('유효하지 않은 위도입니다.');
      }
      
      if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        errors.push('유효하지 않은 경도입니다.');
      }
    }
    
    // 장소 ID 검증
    if (placeId && typeof placeId !== 'string') {
      errors.push('장소 ID는 문자열이어야 합니다.');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '위치 정보 검증 실패',
        errors: errors
      });
    }
    
    next();
  } catch (error) {
    console.error('위치 정보 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '위치 정보 검증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 모듈 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const validateModule = (req, res, next) => {
  try {
    const { name, description, category, version, dependencies, settings } = req.body;
    const errors = [];
    
    // 필수 필드 검증
    const requiredValidation = validateRequiredFields(req.body, ['name', 'category', 'version']);
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // 이름 길이 검증
    if (name) {
      const nameValidation = validateStringLength(name, 1, 100, 'name');
      if (!nameValidation.isValid) {
        errors.push(nameValidation.error);
      }
    }
    
    // 설명 길이 검증
    if (description) {
      const descValidation = validateStringLength(description, 0, 1000, 'description');
      if (!descValidation.isValid) {
        errors.push(descValidation.error);
      }
    }
    
    // 카테고리 검증
    const validCategories = ['calendar', 'contacts', 'notes', 'tasks', 'messenger', 'files', 'analytics', 'integration', 'custom'];
    if (category && !validCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: `유효하지 않은 카테고리입니다. 허용된 카테고리: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }
    
    // 버전 형식 검증 (semver)
    if (version) {
      const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
      if (!semverRegex.test(version)) {
        errors.push({
          field: 'version',
          message: '유효하지 않은 버전 형식입니다. (예: 1.0.0, 2.1.0-beta)',
          code: 'INVALID_VERSION'
        });
      }
    }
    
    // 의존성 검증
    if (dependencies && Array.isArray(dependencies)) {
      for (let i = 0; i < dependencies.length; i++) {
        const dep = dependencies[i];
        if (!dep.name || !dep.version) {
          errors.push({
            field: `dependencies[${i}]`,
            message: '의존성은 name과 version이 필요합니다.',
            code: 'INVALID_DEPENDENCY'
          });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json(response.error('입력 데이터 검증에 실패했습니다.', 'VALIDATION_ERROR', { errors }));
    }
    
    next();
  } catch (error) {
    console.error('모듈 검증 오류:', error);
    res.status(500).json(response.error('검증 처리 중 오류가 발생했습니다.'));
  }
};

// 모듈 내보내기
module.exports = {
  validateNotification,
  validateCalendar,
  validateEvent,
  validateAttendee,
  validateModule,
  validateLocation,
  validateUUID,
  validatePagination,
  validateRequiredFields,
  validateStringLength,
  isValidEmail,
  isValidDate,
  isValidUUID,
  isValidColor,
  ValidationError
}; 