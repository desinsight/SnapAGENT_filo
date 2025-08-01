/**
 * Template Model - 템플릿 데이터 모델
 * Mongoose를 사용한 템플릿 스키마 정의
 * 
 * @description
 * - 템플릿 기본 정보 (제목, 설명, 유형 등)
 * - 템플릿 필드 정의 및 구조
 * - 버전 관리 및 이력 추적
 * - 권한 및 공유 설정
 * - 파일 템플릿 관리
 * - 사용 통계 및 분석
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 템플릿 스키마 정의
 * 템플릿의 모든 속성과 관계를 정의하는 Mongoose 스키마
 */
const templateSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 템플릿 기본 정보
  name: {
    type: String,
    required: [true, '템플릿 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '템플릿 이름은 100자를 초과할 수 없습니다.']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, '템플릿 설명은 1,000자를 초과할 수 없습니다.']
  },

  // 템플릿 유형 및 분류
  type: {
    type: String,
    required: [true, '템플릿 유형은 필수입니다.'],
    enum: {
      values: [
        'specification',      // 시방서
        'expense_report',     // 지출결의서
        'contract',           // 계약서
        'proposal',           // 제안서
        'report',             // 보고서
        'manual',             // 매뉴얼
        'policy',             // 정책서
        'procedure',          // 절차서
        'form',               // 양식
        'letter',             // 편지
        'agreement',          // 협약서
        'other'               // 기타
      ],
      message: '유효하지 않은 템플릿 유형입니다.'
    },
    index: true
  },

  category: {
    type: String,
    required: [true, '템플릿 카테고리는 필수입니다.'],
    enum: {
      values: [
        'business',           // 업무
        'finance',            // 재무
        'hr',                 // 인사
        'legal',              // 법무
        'technical',          // 기술
        'marketing',          // 마케팅
        'sales',              // 영업
        'operations',         // 운영
        'project',            // 프로젝트
        'general'             // 일반
      ],
      message: '유효하지 않은 템플릿 카테고리입니다.'
    },
    index: true
  },

  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '태그는 50자를 초과할 수 없습니다.']
  }],

  // 템플릿 상태
  status: {
    type: String,
    required: [true, '템플릿 상태는 필수입니다.'],
    enum: {
      values: [
        'draft',              // 초안
        'active',             // 활성
        'inactive',           // 비활성
        'archived',           // 보관
        'deleted'             // 삭제
      ],
      message: '유효하지 않은 템플릿 상태입니다.'
    },
    default: 'draft',
    index: true
  },

  visibility: {
    type: String,
    required: [true, '템플릿 가시성은 필수입니다.'],
    enum: {
      values: [
        'public',             // 공개
        'private',            // 비공개
        'restricted',         // 제한적
        'organization',       // 조직 내
        'department'          // 부서 내
      ],
      message: '유효하지 않은 템플릿 가시성입니다.'
    },
    default: 'private',
    index: true
  },

  // 템플릿 필드 정의
  fields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'text',               // 텍스트
        'textarea',           // 긴 텍스트
        'number',             // 숫자
        'date',               // 날짜
        'datetime',           // 날짜시간
        'select',             // 선택
        'multiselect',        // 다중선택
        'checkbox',           // 체크박스
        'radio',              // 라디오
        'file',               // 파일
        'image',              // 이미지
        'email',              // 이메일
        'phone',              // 전화번호
        'url',                // URL
        'signature',          // 서명
        'table',              // 테이블
        'section',            // 섹션
        'divider'             // 구분선
      ]
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed
    },
    placeholder: {
      type: String,
      trim: true
    },
    helpText: {
      type: String,
      trim: true,
      maxlength: [500, '도움말 텍스트는 500자를 초과할 수 없습니다.']
    },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      minLength: Number,
      maxLength: Number,
      custom: String
    },
    options: [{
      value: String,
      label: String,
      default: Boolean
    }],
    order: {
      type: Number,
      default: 0
    },
    width: {
      type: String,
      enum: ['full', 'half', 'third', 'quarter'],
      default: 'full'
    },
    isReadOnly: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  }],

  // 템플릿 구조 (섹션별 그룹핑)
  sections: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    isCollapsible: {
      type: Boolean,
      default: false
    },
    isCollapsed: {
      type: Boolean,
      default: false
    },
    fields: [{
      type: String // 필드 이름 참조
    }]
  }],

  // 파일 템플릿 정보
  fileTemplate: {
    type: {
      type: String,
      enum: ['none', 'docx', 'pdf', 'html', 'custom'],
      default: 'none'
    },
    filePath: {
      type: String
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    contentType: {
      type: String
    },
    uploadedAt: {
      type: Date
    },
    uploadedBy: {
      type: String,
      ref: 'User'
    }
  },

  // 템플릿 스타일 및 레이아웃
  styling: {
    theme: {
      type: String,
      enum: ['default', 'modern', 'classic', 'minimal', 'corporate'],
      default: 'default'
    },
    primaryColor: {
      type: String,
      default: '#007bff'
    },
    secondaryColor: {
      type: String,
      default: '#6c757d'
    },
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    fontSize: {
      type: String,
      default: '14px'
    },
    layout: {
      type: String,
      enum: ['single', 'two-column', 'three-column'],
      default: 'single'
    }
  },

  // 버전 관리
  version: {
    type: Number,
    default: 1,
    min: [1, '버전은 1 이상이어야 합니다.']
  },

  versionHistory: [{
    version: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    fields: [{
      type: mongoose.Schema.Types.Mixed
    }],
    changedBy: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changeReason: {
      type: String,
      maxlength: [500, '변경 사유는 500자를 초과할 수 없습니다.']
    }
  }],

  // 권한 및 공유
  permissions: [{
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'share', 'use']
    }],
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date
    }
  }],

  // 사용 통계
  usageStats: {
    totalUses: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date
    },
    lastUsedBy: {
      type: String,
      ref: 'User'
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },

  // 평가 및 리뷰
  ratings: [{
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [1000, '평가 코멘트는 1,000자를 초과할 수 없습니다.']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 메타데이터
  createdBy: {
    type: String,
    required: [true, '작성자는 필수입니다.'],
    ref: 'User',
    index: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedBy: {
    type: String,
    ref: 'User'
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 외부 연동
  externalId: {
    type: String,
    index: true
  },

  externalSystem: {
    type: String,
    enum: ['erp', 'crm', 'hr', 'accounting', 'other']
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'use', 'share', 'rate']
    },
    userId: {
      type: String,
      required: true
    },
    userIp: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }]

}, {
  // 스키마 옵션
  timestamps: true,
  collection: 'templates',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 인덱스 설정
 */
templateSchema.index({ name: 'text', description: 'text' });
templateSchema.index({ createdAt: -1 });
templateSchema.index({ updatedAt: -1 });
templateSchema.index({ status: 1, createdAt: -1 });
templateSchema.index({ type: 1, category: 1 });
templateSchema.index({ createdBy: 1, createdAt: -1 });
templateSchema.index({ 'permissions.userId': 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ 'usageStats.totalUses': -1 });
templateSchema.index({ 'usageStats.averageRating': -1 });

/**
 * 가상 필드
 */

// 템플릿 URL
templateSchema.virtual('url').get(function() {
  return `/api/v1/templates/${this._id}`;
});

// 템플릿 미리보기 URL
templateSchema.virtual('previewUrl').get(function() {
  return `/api/v1/templates/${this._id}/preview`;
});

// 템플릿 다운로드 URL
templateSchema.virtual('downloadUrl').get(function() {
  return `/api/v1/templates/${this._id}/download`;
});

// 필드 개수
templateSchema.virtual('fieldCount').get(function() {
  return this.fields ? this.fields.length : 0;
});

// 필수 필드 개수
templateSchema.virtual('requiredFieldCount').get(function() {
  return this.fields ? this.fields.filter(f => f.required).length : 0;
});

// 섹션 개수
templateSchema.virtual('sectionCount').get(function() {
  return this.sections ? this.sections.length : 0;
});

// 평점 표시
templateSchema.virtual('ratingDisplay').get(function() {
  if (this.usageStats.ratingCount === 0) return '평가 없음';
  return `${this.usageStats.averageRating.toFixed(1)} (${this.usageStats.ratingCount}개 평가)`;
};

/**
 * 미들웨어
 */

// 저장 전 미들웨어
templateSchema.pre('save', function(next) {
  // 업데이트 시간 설정
  this.updatedAt = new Date();
  
  // 버전 관리
  if (this.isModified('fields') || this.isModified('name') || this.isModified('description')) {
    this.version += 1;
    
    // 버전 이력에 추가
    this.versionHistory.push({
      version: this.version - 1,
      name: this.name,
      description: this.description,
      fields: this.fields,
      changedBy: this.updatedBy || this.createdBy,
      changedAt: new Date()
    });
  }
  
  // 필드 순서 정렬
  if (this.fields) {
    this.fields.sort((a, b) => a.order - b.order);
  }
  
  // 섹션 순서 정렬
  if (this.sections) {
    this.sections.sort((a, b) => a.order - b.order);
  }
  
  next();
});

// 저장 후 미들웨어
templateSchema.post('save', function(doc) {
  // Elasticsearch 인덱싱 (비동기)
  if (process.env.ENABLE_ELASTICSEARCH === 'true') {
    const { indexDocument } = require('../config/elasticsearch.js');
    indexDocument(doc.toObject()).catch(err => {
      console.error('Elasticsearch 인덱싱 실패:', err);
    });
  }
});

/**
 * 인스턴스 메서드
 */

// 템플릿 복사
templateSchema.methods.copy = function(newName = null) {
  const copy = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: newName || `${this.name} (복사본)`,
    version: 1,
    versionHistory: [],
    auditLog: [],
    usageStats: {
      totalUses: 0,
      averageRating: 0,
      ratingCount: 0
    },
    ratings: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return copy;
};

// 템플릿 사용
templateSchema.methods.use = function(userId) {
  this.usageStats.totalUses += 1;
  this.usageStats.lastUsedAt = new Date();
  this.usageStats.lastUsedBy = userId;
  
  return this.save();
};

// 템플릿 평가
templateSchema.methods.rate = function(userId, rating, comment = null) {
  // 기존 평가 확인
  const existingRating = this.ratings.find(r => r.userId === userId);
  
  if (existingRating) {
    // 기존 평가 업데이트
    existingRating.rating = rating;
    existingRating.comment = comment;
    existingRating.createdAt = new Date();
  } else {
    // 새 평가 추가
    this.ratings.push({
      userId,
      rating,
      comment,
      createdAt: new Date()
    });
    this.usageStats.ratingCount += 1;
  }
  
  // 평균 평점 재계산
  const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.usageStats.averageRating = totalRating / this.ratings.length;
  
  return this.save();
};

// 템플릿 공유 권한 확인
templateSchema.methods.canShare = function(userId) {
  if (this.createdBy === userId) return true;
  
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('share');
};

// 템플릿 편집 권한 확인
templateSchema.methods.canEdit = function(userId) {
  if (this.createdBy === userId) return true;
  
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('write');
};

// 템플릿 사용 권한 확인
templateSchema.methods.canUse = function(userId) {
  if (this.createdBy === userId) return true;
  
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('use');
};

// 감사 로그 추가
templateSchema.methods.addAuditLog = function(action, userId, details = {}) {
  this.auditLog.push({
    action,
    userId,
    timestamp: new Date(),
    details
  });
  
  // 감사 로그는 최대 1000개까지만 유지
  if (this.auditLog.length > 1000) {
    this.auditLog = this.auditLog.slice(-1000);
  }
  
  return this.save();
};

/**
 * 정적 메서드
 */

// 템플릿 검색
templateSchema.statics.search = function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    filters = {}
  } = options;

  const skip = (page - 1) * limit;
  
  let searchQuery = this.find();
  
  // 텍스트 검색
  if (query) {
    searchQuery = searchQuery.find({
      $text: { $search: query }
    });
  }
  
  // 필터 적용
  if (filters.type) {
    searchQuery = searchQuery.where('type', filters.type);
  }
  if (filters.category) {
    searchQuery = searchQuery.where('category', filters.category);
  }
  if (filters.status) {
    searchQuery = searchQuery.where('status', filters.status);
  }
  if (filters.createdBy) {
    searchQuery = searchQuery.where('createdBy', filters.createdBy);
  }
  if (filters.tags && filters.tags.length > 0) {
    searchQuery = searchQuery.where('tags').in(filters.tags);
  }
  
  return searchQuery
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
};

// 인기 템플릿 조회
templateSchema.statics.getPopularTemplates = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'usageStats.totalUses': -1, 'usageStats.averageRating': -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// 최신 템플릿 조회
templateSchema.statics.getRecentTemplates = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// 템플릿 통계
templateSchema.statics.getStats = function(userId = null) {
  const match = userId ? { createdBy: userId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: { $push: '$type' },
        byStatus: { $push: '$status' },
        byCategory: { $push: '$category' },
        totalUses: { $sum: '$usageStats.totalUses' },
        averageRating: { $avg: '$usageStats.averageRating' }
      }
    }
  ]);
};

// 모델 생성 및 내보내기
const Template = mongoose.model('Template', templateSchema);

export default Template; 