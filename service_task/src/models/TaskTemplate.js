/**
 * TaskTemplate Model - 태스크 템플릿 모델
 * 재사용 가능한 태스크 템플릿을 관리하는 모델
 * 
 * @description
 * - 개인 및 조직 템플릿 지원
 * - 템플릿 카테고리 및 태그 관리
 * - 권한 및 공유 설정
 * - 사용 통계 및 인기도 추적
 * - 확장 가능한 메타데이터 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

const taskTemplateSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: [true, '템플릿 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '템플릿 이름은 100자를 초과할 수 없습니다.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '템플릿 설명은 500자를 초과할 수 없습니다.']
  },
  category: {
    type: String,
    required: [true, '카테고리는 필수입니다.'],
    enum: {
      values: ['project', 'task', 'meeting', 'review', 'maintenance', 'development', 'design', 'marketing', 'sales', 'support', 'other'],
      message: '유효하지 않은 카테고리입니다.'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '태그는 20자를 초과할 수 없습니다.']
  }],

  // 템플릿 내용
  template: {
    title: {
      type: String,
      required: [true, '태스크 제목은 필수입니다.'],
      trim: true,
      maxlength: [200, '태스크 제목은 200자를 초과할 수 없습니다.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, '태스크 설명은 2000자를 초과할 수 없습니다.']
    },
    type: {
      type: String,
      enum: ['task', 'subtask', 'milestone', 'bug', 'feature', 'improvement', 'research'],
      default: 'task'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    estimatedHours: {
      type: Number,
      min: [0, '예상 시간은 0 이상이어야 합니다.'],
      max: [1000, '예상 시간은 1000시간을 초과할 수 없습니다.']
    },
    checklist: [{
      item: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, '체크리스트 항목은 200자를 초과할 수 없습니다.']
      },
      required: {
        type: Boolean,
        default: false
      }
    }],
    attachments: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
    customFields: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'multiselect', 'boolean'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed,
      required: {
        type: Boolean,
        default: false
      },
      options: [String] // select, multiselect 타입용
    }]
  },

  // 소유권 및 권한
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '템플릿 소유자는 필수입니다.']
  },
  ownerType: {
    type: String,
    enum: ['personal', 'organization', 'team'],
    default: 'personal'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.ownerType === 'organization';
    }
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: function() {
      return this.ownerType === 'team';
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  permissions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // 사용 통계
  usageStats: {
    totalUses: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    rating: {
      type: Number,
      min: [0, '평점은 0 이상이어야 합니다.'],
      max: [5, '평점은 5를 초과할 수 없습니다.'],
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    }
  },

  // 상태 및 메타데이터
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'deleted'],
    default: 'active'
  },
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskTemplate'
  },
  metadata: {
    source: {
      type: String,
      enum: ['created', 'imported', 'copied', 'migrated'],
      default: 'created'
    },
    originalId: String,
    importSource: String,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modificationReason: String
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'archive', 'restore', 'share', 'unshare', 'use', 'rate', 'favorite'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
taskTemplateSchema.index({ owner: 1, status: 1 });
taskTemplateSchema.index({ organization: 1, status: 1 });
taskTemplateSchema.index({ team: 1, status: 1 });
taskTemplateSchema.index({ category: 1, status: 1 });
taskTemplateSchema.index({ tags: 1 });
taskTemplateSchema.index({ 'usageStats.totalUses': -1 });
taskTemplateSchema.index({ 'usageStats.rating': -1 });
taskTemplateSchema.index({ isPublic: 1, status: 1 });
taskTemplateSchema.index({ createdAt: -1 });
taskTemplateSchema.index({ updatedAt: -1 });

// 가상 필드
taskTemplateSchema.virtual('averageRating').get(function() {
  if (this.usageStats.ratingCount === 0) return 0;
  return this.usageStats.rating / this.usageStats.ratingCount;
});

taskTemplateSchema.virtual('isPopular').get(function() {
  return this.usageStats.totalUses >= 10 || this.usageStats.rating >= 4.0;
});

// 인스턴스 메서드

/**
 * 템플릿 사용 기록
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 */
taskTemplateSchema.methods.recordUsage = function(userId, userName) {
  this.usageStats.totalUses += 1;
  this.usageStats.lastUsed = new Date();
  
  this.auditLog.push({
    action: 'use',
    userId,
    userName,
    details: '템플릿 사용'
  });
  
  return this.save();
};

/**
 * 템플릿 평점 추가
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 * @param {Number} rating - 평점 (1-5)
 */
taskTemplateSchema.methods.addRating = function(userId, userName, rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('평점은 1-5 사이여야 합니다.');
  }
  
  this.usageStats.rating += rating;
  this.usageStats.ratingCount += 1;
  
  this.auditLog.push({
    action: 'rate',
    userId,
    userName,
    details: `평점 ${rating}점 추가`
  });
  
  return this.save();
};

/**
 * 템플릿 즐겨찾기 토글
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 * @param {Boolean} isFavorite - 즐겨찾기 여부
 */
taskTemplateSchema.methods.toggleFavorite = function(userId, userName, isFavorite) {
  if (isFavorite) {
    this.usageStats.favorites += 1;
    this.auditLog.push({
      action: 'favorite',
      userId,
      userName,
      details: '즐겨찾기 추가'
    });
  } else {
    this.usageStats.favorites = Math.max(0, this.usageStats.favorites - 1);
    this.auditLog.push({
      action: 'favorite',
      userId,
      userName,
      details: '즐겨찾기 제거'
    });
  }
  
  return this.save();
};

/**
 * 템플릿 복사
 * @param {String} newOwnerId - 새 소유자 ID
 * @param {String} newOwnerType - 새 소유자 타입
 * @param {String} organizationId - 조직 ID (조직 템플릿인 경우)
 * @param {String} teamId - 팀 ID (팀 템플릿인 경우)
 */
taskTemplateSchema.methods.copy = function(newOwnerId, newOwnerType, organizationId = null, teamId = null) {
  const copyData = {
    name: `${this.name} (복사본)`,
    description: this.description,
    category: this.category,
    tags: [...this.tags],
    template: { ...this.template },
    owner: newOwnerId,
    ownerType: newOwnerType,
    organization: organizationId,
    team: teamId,
    isPublic: false,
    parentTemplate: this._id,
    metadata: {
      source: 'copied',
      originalId: this._id.toString()
    }
  };
  
  return new TaskTemplate(copyData);
};

/**
 * 템플릿 버전 생성
 * @param {String} userId - 수정자 ID
 * @param {String} userName - 수정자 이름
 * @param {String} reason - 수정 이유
 */
taskTemplateSchema.methods.createVersion = function(userId, userName, reason) {
  // 현재 버전을 비활성화
  this.isLatest = false;
  await this.save();
  
  // 새 버전 생성
  const newVersion = new TaskTemplate({
    ...this.toObject(),
    _id: undefined,
    version: this.version + 1,
    isLatest: true,
    parentTemplate: this._id,
    metadata: {
      ...this.metadata,
      lastModifiedBy: userId,
      modificationReason: reason
    }
  });
  
  newVersion.auditLog.push({
    action: 'create',
    userId,
    userName,
    details: `버전 ${newVersion.version} 생성: ${reason}`
  });
  
  return newVersion.save();
};

/**
 * 템플릿 공유
 * @param {String} userId - 공유할 사용자 ID
 * @param {String} role - 권한 역할
 * @param {String} grantedBy - 권한 부여자 ID
 * @param {String} grantedByName - 권한 부여자 이름
 */
taskTemplateSchema.methods.share = function(userId, role, grantedBy, grantedByName) {
  // 기존 권한 확인
  const existingPermission = this.permissions.find(p => p.userId.toString() === userId);
  
  if (existingPermission) {
    existingPermission.role = role;
    existingPermission.grantedAt = new Date();
    existingPermission.grantedBy = grantedBy;
  } else {
    this.permissions.push({
      userId,
      role,
      grantedBy
    });
  }
  
  this.auditLog.push({
    action: 'share',
    userId: grantedBy,
    userName: grantedByName,
    details: `${userId}에게 ${role} 권한 부여`
  });
  
  return this.save();
};

/**
 * 템플릿 공유 해제
 * @param {String} userId - 공유 해제할 사용자 ID
 * @param {String} revokedBy - 해제자 ID
 * @param {String} revokedByName - 해제자 이름
 */
taskTemplateSchema.methods.unshare = function(userId, revokedBy, revokedByName) {
  this.permissions = this.permissions.filter(p => p.userId.toString() !== userId);
  
  this.auditLog.push({
    action: 'unshare',
    userId: revokedBy,
    userName: revokedByName,
    details: `${userId}의 권한 해제`
  });
  
  return this.save();
};

/**
 * 템플릿 소프트 삭제
 * @param {String} userId - 삭제자 ID
 * @param {String} userName - 삭제자 이름
 * @param {String} reason - 삭제 이유
 */
taskTemplateSchema.methods.softDelete = function(userId, userName, reason) {
  this.status = 'deleted';
  
  this.auditLog.push({
    action: 'delete',
    userId,
    userName,
    details: `소프트 삭제: ${reason}`
  });
  
  return this.save();
};

/**
 * 템플릿 복원
 * @param {String} userId - 복원자 ID
 * @param {String} userName - 복원자 이름
 */
taskTemplateSchema.methods.restore = function(userId, userName) {
  this.status = 'active';
  
  this.auditLog.push({
    action: 'restore',
    userId,
    userName,
    details: '템플릿 복원'
  });
  
  return this.save();
};

/**
 * 감사 로그 추가
 * @param {String} action - 액션
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 * @param {String} details - 상세 내용
 * @param {String} ipAddress - IP 주소
 * @param {String} userAgent - 사용자 에이전트
 */
taskTemplateSchema.methods.addAuditLog = function(action, userId, userName, details, ipAddress = null, userAgent = null) {
  this.auditLog.push({
    action,
    userId,
    userName,
    timestamp: new Date(),
    details,
    ipAddress,
    userAgent
  });
  
  return this.save();
};

// 정적 메서드

/**
 * 템플릿 검색
 * @param {Object} filters - 검색 필터
 * @param {Object} options - 검색 옵션
 */
taskTemplateSchema.statics.search = function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    search,
    category,
    tags,
    ownerType,
    isPublic,
    minRating,
    minUses
  } = options;
  
  const query = { status: { $ne: 'deleted' } };
  
  // 검색어 필터
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  // 카테고리 필터
  if (category) {
    query.category = category;
  }
  
  // 태그 필터
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  // 소유자 타입 필터
  if (ownerType) {
    query.ownerType = ownerType;
  }
  
  // 공개 여부 필터
  if (isPublic !== undefined) {
    query.isPublic = isPublic;
  }
  
  // 최소 평점 필터
  if (minRating) {
    query['usageStats.rating'] = { $gte: minRating };
  }
  
  // 최소 사용 횟수 필터
  if (minUses) {
    query['usageStats.totalUses'] = { $gte: minUses };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('owner', 'name avatar')
    .populate('organization', 'name')
    .populate('team', 'name')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

/**
 * 인기 템플릿 조회
 * @param {Number} limit - 조회 개수
 */
taskTemplateSchema.statics.getPopular = function(limit = 10) {
  return this.find({ 
    status: 'active',
    isPublic: true 
  })
  .sort({ 'usageStats.totalUses': -1, 'usageStats.rating': -1 })
  .limit(limit)
  .populate('owner', 'name avatar');
};

/**
 * 카테고리별 통계
 */
taskTemplateSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    { $match: { status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUses: { $sum: '$usageStats.totalUses' },
        avgRating: { $avg: '$usageStats.rating' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * 태그별 통계
 */
taskTemplateSchema.statics.getTagStats = function() {
  return this.aggregate([
    { $match: { status: { $ne: 'deleted' } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        totalUses: { $sum: '$usageStats.totalUses' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// 미들웨어

// 저장 전 처리
taskTemplateSchema.pre('save', function(next) {
  // 태그 정리 (중복 제거, 빈 문자열 제거)
  if (this.tags) {
    this.tags = [...new Set(this.tags.filter(tag => tag.trim().length > 0))];
  }
  
  // 체크리스트 정리
  if (this.template.checklist) {
    this.template.checklist = this.template.checklist.filter(item => 
      item.item && item.item.trim().length > 0
    );
  }
  
  next();
});

// 저장 후 처리
taskTemplateSchema.post('save', function(doc) {
  logger.info(`📋 TaskTemplate ${doc._id} ${doc.isNew ? 'created' : 'updated'}: ${doc.name}`);
});

// 삭제 후 처리
taskTemplateSchema.post('remove', function(doc) {
  logger.info(`🗑️ TaskTemplate ${doc._id} deleted: ${doc.name}`);
});

const TaskTemplate = mongoose.model('TaskTemplate', taskTemplateSchema);

export default TaskTemplate; 