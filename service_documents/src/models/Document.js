/**
 * Document Model - 문서 데이터 모델
 * Mongoose를 사용한 문서 스키마 정의
 * 
 * @description
 * - 문서 기본 정보 (제목, 내용, 설명 등)
 * - 문서 유형 및 분류 (시방서, 지출결의서 등)
 * - 상태 관리 (임시저장, 제출, 승인, 반려 등)
 * - 버전 관리 및 이력 추적
 * - 권한 및 보안 설정
 * - 첨부파일 관리
 * - 승인 프로세스 관리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 문서 스키마 정의
 * 문서의 모든 속성과 관계를 정의하는 Mongoose 스키마
 */
const documentSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 문서 기본 정보
  title: {
    type: String,
    required: [true, '문서 제목은 필수입니다.'],
    trim: true,
    maxlength: [200, '문서 제목은 200자를 초과할 수 없습니다.']
  },

  content: {
    type: String,
    required: [true, '문서 내용은 필수입니다.'],
    maxlength: [100000, '문서 내용은 100,000자를 초과할 수 없습니다.']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, '문서 설명은 1,000자를 초과할 수 없습니다.']
  },

  // 문서 유형 및 분류
  type: {
    type: String,
    required: [true, '문서 유형은 필수입니다.'],
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
        'template',           // 템플릿
        'other'               // 기타
      ],
      message: '유효하지 않은 문서 유형입니다.'
    },
    index: true
  },

  category: {
    type: String,
    required: [true, '문서 카테고리는 필수입니다.'],
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
      message: '유효하지 않은 문서 카테고리입니다.'
    },
    index: true
  },

  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '태그는 50자를 초과할 수 없습니다.']
  }],

  // 상태 관리
  status: {
    type: String,
    required: [true, '문서 상태는 필수입니다.'],
    enum: {
      values: [
        'draft',              // 임시저장
        'submitted',          // 제출됨
        'under_review',       // 검토 중
        'approved',           // 승인됨
        'rejected',           // 반려됨
        'archived',           // 보관됨
        'deleted'             // 삭제됨
      ],
      message: '유효하지 않은 문서 상태입니다.'
    },
    default: 'draft',
    index: true
  },

  visibility: {
    type: String,
    required: [true, '문서 가시성은 필수입니다.'],
    enum: {
      values: [
        'public',             // 공개
        'private',            // 비공개
        'restricted',         // 제한적
        'confidential'        // 기밀
      ],
      message: '유효하지 않은 문서 가시성입니다.'
    },
    default: 'private',
    index: true
  },

  // 템플릿 정보
  templateId: {
    type: String,
    ref: 'Template',
    index: true
  },

  templateVersion: {
    type: Number,
    default: 1
  },

  // 버전 관리
  version: {
    type: Number,
    default: 1,
    min: [1, '버전은 1 이상이어야 합니다.']
  },

  parentDocumentId: {
    type: String,
    ref: 'Document',
    index: true
  },

  versionHistory: [{
    version: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
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

  // 권한 및 보안
  permissions: [{
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer', 'approver'],
      default: 'viewer'
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'approve', 'share']
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

  // 승인 프로세스
  approvalWorkflow: {
    type: String,
    enum: ['none', 'single', 'multi', 'custom'],
    default: 'none'
  },

  approvalStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'approved', 'rejected'],
    default: 'pending'
  },

  approvalHistory: [{
    step: {
      type: Number,
      required: true
    },
    approverId: {
      type: String,
      required: true
    },
    approverName: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'return', 'delegate'],
      required: true
    },
    comment: {
      type: String,
      maxlength: [1000, '승인 의견은 1,000자를 초과할 수 없습니다.']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    delegatedTo: {
      type: String
    }
  }],

  currentApprover: {
    type: String,
    ref: 'User'
  },

  // 첨부파일
  attachments: [{
    id: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: [0, '파일 크기는 0 이상이어야 합니다.']
    },
    path: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      maxlength: [500, '첨부파일 설명은 500자를 초과할 수 없습니다.']
    },
    isPublic: {
      type: Boolean,
      default: false
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

  // 만료 및 보존
  expiresAt: {
    type: Date,
    index: true
  },

  retentionPeriod: {
    type: Number, // 일 단위
    default: 2555 // 7년
  },

  // 검색 최적화
  searchKeywords: [{
    type: String,
    trim: true
  }],

  // 통계 및 분석
  viewCount: {
    type: Number,
    default: 0,
    min: [0, '조회수는 0 이상이어야 합니다.']
  },

  downloadCount: {
    type: Number,
    default: 0,
    min: [0, '다운로드 수는 0 이상이어야 합니다.']
  },

  lastAccessedAt: {
    type: Date
  },

  lastAccessedBy: {
    type: String,
    ref: 'User'
  },

  // 댓글 및 협업
  comments: [{
    id: {
      type: String,
      default: () => uuidv4()
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, '댓글 내용은 2,000자를 초과할 수 없습니다.']
    },
    authorId: {
      type: String,
      required: true,
      ref: 'User'
    },
    authorName: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    parentCommentId: {
      type: String
    }
  }],

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
      enum: ['create', 'update', 'delete', 'view', 'download', 'share', 'approve', 'reject']
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
  timestamps: true, // createdAt, updatedAt 자동 생성
  collection: 'documents', // 컬렉션 이름 명시
  toJSON: { virtuals: true }, // JSON 변환 시 가상 필드 포함
  toObject: { virtuals: true } // 객체 변환 시 가상 필드 포함
});

/**
 * 인덱스 설정
 * 검색 성능 최적화를 위한 인덱스 정의
 */
documentSchema.index({ title: 'text', content: 'text', description: 'text' });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ updatedAt: -1 });
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ type: 1, category: 1 });
documentSchema.index({ createdBy: 1, createdAt: -1 });
documentSchema.index({ 'permissions.userId': 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiresAt: 1 });

/**
 * 가상 필드
 * 계산된 값이나 관계를 위한 가상 필드
 */

// 문서 URL
documentSchema.virtual('url').get(function() {
  return `/api/v1/documents/${this._id}`;
});

// 문서 공유 URL
documentSchema.virtual('shareUrl').get(function() {
  return `/api/v1/documents/${this._id}/share`;
});

// 문서 미리보기 URL
documentSchema.virtual('previewUrl').get(function() {
  return `/api/v1/documents/${this._id}/preview`;
});

// 문서 다운로드 URL
documentSchema.virtual('downloadUrl').get(function() {
  return `/api/v1/documents/${this._id}/download`;
});

// 첨부파일 개수
documentSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// 댓글 개수
documentSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// 승인 단계
documentSchema.virtual('approvalStep').get(function() {
  if (!this.approvalHistory || this.approvalHistory.length === 0) {
    return 0;
  }
  return Math.max(...this.approvalHistory.map(h => h.step));
});

// 문서 크기 (바이트)
documentSchema.virtual('documentSize').get(function() {
  let size = Buffer.byteLength(this.content, 'utf8');
  if (this.attachments) {
    size += this.attachments.reduce((total, att) => total + (att.size || 0), 0);
  }
  return size;
});

// 만료 여부
documentSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// 만료까지 남은 일수
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * 미들웨어 (Pre/Post Hooks)
 * 문서 저장/수정 시 자동으로 실행되는 로직
 */

// 저장 전 미들웨어
documentSchema.pre('save', function(next) {
  // 업데이트 시간 설정
  this.updatedAt = new Date();
  
  // 버전 관리
  if (this.isModified('content') || this.isModified('title')) {
    this.version += 1;
    
    // 버전 이력에 추가
    this.versionHistory.push({
      version: this.version - 1,
      title: this.title,
      content: this.content,
      changedBy: this.updatedBy || this.createdBy,
      changedAt: new Date()
    });
  }
  
  next();
});

// 저장 후 미들웨어
documentSchema.post('save', function(doc) {
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
 * 문서 인스턴스에서 사용할 수 있는 메서드들
 */

// 문서 복사
documentSchema.methods.copy = function(newTitle = null) {
  const copy = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    title: newTitle || `${this.title} (복사본)`,
    version: 1,
    versionHistory: [],
    approvalHistory: [],
    auditLog: [],
    viewCount: 0,
    downloadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return copy;
};

// 문서 공유 권한 확인
documentSchema.methods.canShare = function(userId) {
  // 소유자 확인
  if (this.createdBy === userId) return true;
  
  // 권한 확인
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('share');
};

// 문서 편집 권한 확인
documentSchema.methods.canEdit = function(userId) {
  // 소유자 확인
  if (this.createdBy === userId) return true;
  
  // 권한 확인
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('write');
};

// 문서 삭제 권한 확인
documentSchema.methods.canDelete = function(userId) {
  // 소유자 확인
  if (this.createdBy === userId) return true;
  
  // 권한 확인
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('delete');
};

// 문서 승인 권한 확인
documentSchema.methods.canApprove = function(userId) {
  // 권한 확인
  const permission = this.permissions.find(p => p.userId === userId);
  return permission && permission.permissions.includes('approve');
};

// 조회수 증가
documentSchema.methods.incrementViewCount = function(userId = null) {
  this.viewCount += 1;
  this.lastAccessedAt = new Date();
  if (userId) {
    this.lastAccessedBy = userId;
  }
  return this.save();
};

// 다운로드 수 증가
documentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// 감사 로그 추가
documentSchema.methods.addAuditLog = function(action, userId, details = {}) {
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
 * 모델 레벨에서 사용할 수 있는 메서드들
 */

// 문서 검색
documentSchema.statics.search = function(query, options = {}) {
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

// 문서 통계
documentSchema.statics.getStats = function(userId = null) {
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
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ]);
};

// 만료 예정 문서 조회
documentSchema.statics.getExpiringDocuments = function(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    expiresAt: { $lte: expiryDate, $gt: new Date() }
  }).sort({ expiresAt: 1 });
};

// 모델 생성 및 내보내기
const Document = mongoose.model('Document', documentSchema);

export default Document; 