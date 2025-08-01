/**
 * ✅ Validation Middleware
 * 
 * Joi 기반 입력 데이터 유효성 검사
 * 
 * @author Your Team
 * @version 1.0.0
 */

import Joi from 'joi';
import { createValidationError } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * 📧 이메일 유효성 검사 스키마
 */
const emailSchema = Joi.object({
  value: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': '유효한 이메일 주소를 입력해주세요.',
      'any.required': '이메일 주소는 필수입니다.'
    }),
  label: Joi.string()
    .valid('personal', 'work', 'mobile', 'home', 'other')
    .default('other'),
  isPrimary: Joi.boolean().default(false),
  isVerified: Joi.boolean().default(false)
});

/**
 * 📞 전화번호 유효성 검사 스키마
 */
const phoneSchema = Joi.object({
  value: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': '유효한 전화번호를 입력해주세요.',
      'any.required': '전화번호는 필수입니다.'
    }),
  label: Joi.string()
    .valid('personal', 'work', 'mobile', 'home', 'other')
    .default('other'),
  isPrimary: Joi.boolean().default(false),
  isVerified: Joi.boolean().default(false)
});

/**
 * 🏠 주소 유효성 검사 스키마
 */
const addressSchema = Joi.object({
  type: Joi.string()
    .valid('home', 'work', 'other')
    .default('other'),
  street: Joi.string().max(200),
  city: Joi.string().max(100),
  state: Joi.string().max(100),
  zipCode: Joi.string().max(20),
  country: Joi.string().max(100),
  isPrimary: Joi.boolean().default(false)
});

/**
 * 📱 SNS 정보 유효성 검사 스키마
 */
const socialMediaSchema = Joi.object({
  linkedin: Joi.string().uri().allow(''),
  twitter: Joi.string().uri().allow(''),
  facebook: Joi.string().uri().allow(''),
  instagram: Joi.string().uri().allow(''),
  github: Joi.string().uri().allow(''),
  website: Joi.string().uri().allow('')
});

/**
 * 📍 위치 정보 유효성 검사 스키마
 */
const locationSchema = Joi.object({
  country: Joi.string().max(100),
  city: Joi.string().max(100),
  timezone: Joi.string().max(50),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  })
});

/**
 * 👤 연락처 유효성 검사 스키마
 */
const contactSchema = Joi.object({
  // 기본 정보
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '이름은 필수입니다.',
      'string.min': '이름은 최소 1자 이상이어야 합니다.',
      'string.max': '이름은 최대 100자까지 가능합니다.',
      'any.required': '이름은 필수입니다.'
    }),
  
  firstName: Joi.string()
    .max(50)
    .allow(''),
  
  lastName: Joi.string()
    .max(50)
    .allow(''),
  
  middleName: Joi.string()
    .max(50)
    .allow(''),
  
  // 비즈니스 정보
  company: Joi.string()
    .max(100)
    .allow(''),
  
  position: Joi.string()
    .max(100)
    .allow(''),
  
  department: Joi.string()
    .max(100)
    .allow(''),
  
  industry: Joi.string()
    .max(100)
    .allow(''),
  
  // 연락처 정보
  emails: Joi.array()
    .items(emailSchema)
    .max(10)
    .messages({
      'array.max': '이메일은 최대 10개까지 등록 가능합니다.'
    }),
  
  phones: Joi.array()
    .items(phoneSchema)
    .max(10)
    .messages({
      'array.max': '전화번호는 최대 10개까지 등록 가능합니다.'
    }),
  
  addresses: Joi.array()
    .items(addressSchema)
    .max(5)
    .messages({
      'array.max': '주소는 최대 5개까지 등록 가능합니다.'
    }),
  
  socialMedia: socialMediaSchema,
  
  // 분류 및 태그
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': '태그는 최대 20개까지 등록 가능합니다.'
    }),
  
  categories: Joi.array()
    .items(Joi.string().valid('client', 'vendor', 'partner', 'employee', 'friend', 'family', 'other'))
    .max(10)
    .messages({
      'array.max': '카테고리는 최대 10개까지 등록 가능합니다.'
    }),
  
  // 네트워킹 설정
  isPublic: Joi.boolean().default(false),
  
  visibilitySettings: Joi.object({
    profile: Joi.string()
      .valid('public', 'private', 'network')
      .default('private'),
    contact: Joi.string()
      .valid('public', 'private', 'network')
      .default('private'),
    projects: Joi.string()
      .valid('public', 'private', 'network')
      .default('private')
  }),
  
  // 추가 정보
  profileImage: Joi.string()
    .uri()
    .max(500)
    .allow(''),
  
  notes: Joi.string()
    .max(2000)
    .allow(''),
  
  birthday: Joi.date()
    .max('now')
    .allow(null),
  
  anniversary: Joi.date()
    .max('now')
    .allow(null),
  
  // 연락 기록
  contactFrequency: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'never')
    .default('monthly'),
  
  // 상태 및 메타데이터
  status: Joi.string()
    .valid('active', 'inactive', 'archived')
    .default('active'),
  
  source: Joi.string()
    .valid('manual', 'import', 'scan', 'ai')
    .default('manual'),
  
  // 위치 정보
  location: locationSchema,
  
  // AI 관련 필드
  aiGeneratedTags: Joi.array()
    .items(Joi.string())
    .max(20),
  
  aiConfidence: Joi.number()
    .min(0)
    .max(1)
    .default(0),
  
  lastAiUpdate: Joi.date().allow(null)
});

/**
 * 🔍 검색 쿼리 유효성 검사 스키마
 */
const searchQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  search: Joi.string()
    .max(200)
    .allow(''),
  
  industry: Joi.string()
    .max(100)
    .allow(''),
  
  company: Joi.string()
    .max(100)
    .allow(''),
  
  tags: Joi.string()
    .max(500)
    .allow(''),
  
  category: Joi.string()
    .valid('client', 'vendor', 'partner', 'employee', 'friend', 'family', 'other')
    .allow(''),
  
  status: Joi.string()
    .valid('active', 'inactive', 'archived')
    .default('active'),
  
  sortBy: Joi.string()
    .valid('name', 'company', 'industry', 'createdAt', 'updatedAt', 'lastContact')
    .default('name'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
});

/**
 * 🔗 병합 옵션 유효성 검사 스키마
 */
const mergeOptionsSchema = Joi.object({
  emails: Joi.boolean().default(true),
  phones: Joi.boolean().default(true),
  addresses: Joi.boolean().default(true),
  tags: Joi.boolean().default(true),
  projects: Joi.boolean().default(true),
  notes: Joi.boolean().default(true)
});

/**
 * 🔄 병합 요청 유효성 검사 스키마
 */
const mergeRequestSchema = Joi.object({
  primaryId: Joi.string()
    .required()
    .messages({
      'any.required': '주 연락처 ID는 필수입니다.'
    }),
  
  secondaryIds: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': '병합할 연락처를 최소 1개 이상 선택해주세요.',
      'any.required': '병합할 연락처 목록은 필수입니다.'
    }),
  
  mergeOptions: mergeOptionsSchema
});

/**
 * 📤 가져오기 옵션 유효성 검사 스키마
 */
const importOptionsSchema = Joi.object({
  overwrite: Joi.boolean().default(false),
  skipDuplicates: Joi.boolean().default(true),
  validateEmails: Joi.boolean().default(true),
  validatePhones: Joi.boolean().default(true)
});

/**
 * 📥 가져오기 요청 유효성 검사 스키마
 */
const importRequestSchema = Joi.object({
  contacts: Joi.array()
    .items(contactSchema)
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.min': '가져올 연락처를 최소 1개 이상 입력해주세요.',
      'array.max': '한 번에 최대 1000개까지 가져올 수 있습니다.',
      'any.required': '연락처 데이터는 필수입니다.'
    }),
  
  options: importOptionsSchema
});

/**
 * 🔍 중복 확인 요청 유효성 검사 스키마
 */
const duplicateCheckSchema = Joi.object({
  emails: Joi.array()
    .items(Joi.object({
      value: Joi.string().email().required()
    }))
    .max(10),
  
  phones: Joi.array()
    .items(Joi.object({
      value: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required()
    }))
    .max(10),
  
  name: Joi.string().max(100),
  company: Joi.string().max(100)
});

/**
 * ✅ 유효성 검사 미들웨어 생성 함수
 * @param {Joi.Schema} schema - 검증할 스키마
 * @param {string} property - 검증할 요청 속성 ('body', 'query', 'params')
 */
const createValidator = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const validationError = createValidationError(
        `유효성 검사 실패: ${errorMessages.join(', ')}`
      );
      
      logger.warn(`유효성 검사 실패: ${errorMessages.join(', ')} - IP: ${req.ip}`);
      return next(validationError);
    }
    
    // 검증된 데이터로 요청 객체 업데이트
    req[property] = value;
    next();
  };
};

/**
 * 👤 연락처 유효성 검사 미들웨어
 */
export const validateContact = createValidator(contactSchema, 'body');

/**
 * 🔍 검색 쿼리 유효성 검사 미들웨어
 */
export const validateSearchQuery = createValidator(searchQuerySchema, 'query');

/**
 * 🔄 병합 요청 유효성 검사 미들웨어
 */
export const validateMergeRequest = createValidator(mergeRequestSchema, 'body');

/**
 * 📤 가져오기 요청 유효성 검사 미들웨어
 */
export const validateImportRequest = createValidator(importRequestSchema, 'body');

/**
 * 🔍 중복 확인 요청 유효성 검사 미들웨어
 */
export const validateDuplicateCheck = createValidator(duplicateCheckSchema, 'body');

/**
 * 📊 유효성 검사 통계
 */
class ValidationStats {
  constructor() {
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      bySchema: {},
      byError: {}
    };
  }
  
  recordValidation(schema, success, errors = []) {
    this.stats.totalValidations++;
    
    if (success) {
      this.stats.successfulValidations++;
    } else {
      this.stats.failedValidations++;
      
      // 에러 타입별 통계
      errors.forEach(error => {
        const errorType = error.type || 'unknown';
        this.stats.byError[errorType] = (this.stats.byError[errorType] || 0) + 1;
      });
    }
    
    // 스키마별 통계
    this.stats.bySchema[schema] = (this.stats.bySchema[schema] || 0) + 1;
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  reset() {
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      bySchema: {},
      byError: {}
    };
  }
}

export const validationStats = new ValidationStats();

// 유효성 검사 미들웨어에 통계 추가
const originalCreateValidator = createValidator;
export const createValidatorWithStats = (schema, property = 'body', schemaName = 'unknown') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      validationStats.recordValidation(schemaName, false, error.details);
      
      const validationError = createValidationError(
        `유효성 검사 실패: ${errorMessages.join(', ')}`
      );
      
      logger.warn(`유효성 검사 실패: ${errorMessages.join(', ')} - IP: ${req.ip}`);
      return next(validationError);
    }
    
    validationStats.recordValidation(schemaName, true);
    req[property] = value;
    next();
  };
}; 