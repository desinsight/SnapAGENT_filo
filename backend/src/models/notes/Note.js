/**
 * 노트 데이터 모델
 * 개인 및 공용 노트의 스키마 정의
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const noteSchema = new mongoose.Schema({
  // 기본 정보
  title: {
    type: String,
    required: [true, '노트 제목은 필수입니다'],
    trim: true,
    maxlength: [200, '제목은 200자를 초과할 수 없습니다']
  },
  
  content: {
    type: String,
    required: [true, '노트 내용은 필수입니다'],
    maxlength: [50000, '내용은 50,000자를 초과할 수 없습니다']
  },
  
  // 마크다운 지원
  contentHtml: {
    type: String,
    default: ''
  },
  
  // 메타데이터
  summary: {
    type: String,
    maxlength: [500, '요약은 500자를 초과할 수 없습니다']
  },
  
  // 분류 및 태그
  category: {
    type: String,
    enum: ['개인', '업무', '학습', '아이디어', '할일', '기타'],
    default: '개인'
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '태그는 50자를 초과할 수 없습니다']
  }],
  
  // 소유권 및 권한
  userId: {
    type: String,
    required: [true, '사용자 ID는 필수입니다'],
    index: true
  },
  
  isShared: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 공용 노트 관련
  collaborators: [{
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 공개 설정
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  
  // 폴더 구조
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null
  },
  
  path: {
    type: String,
    default: '/'
  },
  
  // 파일 첨부
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
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
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // AI 관련 필드
  aiGenerated: {
    type: Boolean,
    default: false
  },
  
  aiTags: [{
    type: String,
    trim: true
  }],
  
  aiCategory: {
    type: String,
    enum: ['개인', '업무', '학습', '아이디어', '할일', '기타']
  },
  
  // 버전 관리
  version: {
    type: Number,
    default: 1
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'deleted'],
    default: 'draft'
  },
  
  // 보안 및 접근 제어
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  encryptionKey: {
    type: String,
    select: false // 기본적으로 조회에서 제외
  },
  
  // 검색 최적화
  searchKeywords: [{
    type: String,
    trim: true
  }],
  
  // 통계
  viewCount: {
    type: Number,
    default: 0
  },
  
  editCount: {
    type: Number,
    default: 0
  },
  
  // 타임스탬프
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 소프트 삭제
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 인덱스 설정
 */
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, category: 1 });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ isShared: 1, visibility: 1 });
noteSchema.index({ 'collaborators.userId': 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
noteSchema.index({ searchKeywords: 1 });
// 인덱스 최적화
noteSchema.index({ userId: 1, updatedAt: -1 }); // 사용자별 최신순
noteSchema.index({ category: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isShared: 1 });

/**
 * 가상 필드
 */
noteSchema.virtual('isOwner').get(function() {
  return this.userId === this._userId; // 요청한 사용자와 비교
});

noteSchema.virtual('canEdit').get(function() {
  if (this.isOwner) return true;
  if (!this.isShared) return false;
  
  const collaborator = this.collaborators.find(c => c.userId === this._userId);
  return collaborator && ['editor', 'admin'].includes(collaborator.role);
});

noteSchema.virtual('canView').get(function() {
  if (this.isOwner) return true;
  if (this.visibility === 'public') return true;
  if (!this.isShared) return false;
  
  const collaborator = this.collaborators.find(c => c.userId === this._userId);
  return collaborator && ['viewer', 'editor', 'admin'].includes(collaborator.role);
});

/**
 * 미들웨어
 */

// 저장 전 처리
noteSchema.pre('save', function(next) {
  // 업데이트 시간 설정
  this.updatedAt = new Date();
  
  // 버전 증가
  if (this.isModified('content') || this.isModified('title')) {
    this.version += 1;
  }
  
  // 검색 키워드 자동 생성
  if (this.isModified('title') || this.isModified('content') || this.isModified('tags')) {
    this.searchKeywords = this.generateSearchKeywords();
  }
  
  next();
});

// 조회 전 처리
noteSchema.pre('find', function() {
  // 삭제된 노트 제외
  this.where({ deletedAt: null });
});

noteSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

/**
 * 인스턴스 메서드
 */
noteSchema.methods.generateSearchKeywords = function() {
  const keywords = [];
  
  // 제목에서 키워드 추출
  if (this.title) {
    keywords.push(...this.title.toLowerCase().split(/\s+/));
  }
  
  // 태그 추가
  if (this.tags && this.tags.length > 0) {
    keywords.push(...this.tags.map(tag => tag.toLowerCase()));
  }
  
  // 카테고리 추가
  if (this.category) {
    keywords.push(this.category.toLowerCase());
  }
  
  // 중복 제거 및 정렬
  return [...new Set(keywords)].sort();
};

noteSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  const existingIndex = this.collaborators.findIndex(c => c.userId === userId);
  
  if (existingIndex >= 0) {
    this.collaborators[existingIndex].role = role;
  } else {
    this.collaborators.push({
      userId,
      role,
      addedAt: new Date()
    });
  }
  
  this.isShared = true;
  return this;
};

noteSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(c => c.userId !== userId);
  
  // 협업자가 없으면 개인 노트로 변경
  if (this.collaborators.length === 0) {
    this.isShared = false;
    this.visibility = 'private';
  }
  
  return this;
};

noteSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.status = 'deleted';
  return this;
};

noteSchema.methods.restore = function() {
  this.deletedAt = null;
  this.status = 'draft';
  return this;
};

/**
 * 정적 메서드
 */
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { userId },
      { 'collaborators.userId': userId }
    ],
    deletedAt: null
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.isShared !== undefined) {
    query.isShared = options.isShared;
  }
  
  return this.find(query)
    .sort({ updatedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

noteSchema.statics.search = function(query, userId, options = {}) {
  const searchQuery = {
    $and: [
      {
        $or: [
          { userId },
          { 'collaborators.userId': userId },
          { visibility: 'public' }
        ]
      },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { searchKeywords: { $in: [new RegExp(query, 'i')] } }
        ]
      },
      { deletedAt: null }
    ]
  };
  
  return this.find(searchQuery)
    .sort({ updatedAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

noteSchema.statics.getStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId,
        deletedAt: null
      }
    },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalEdits: { $sum: '$editCount' },
        categories: { $addToSet: '$category' },
        tags: { $addToSet: '$tags' }
      }
    }
  ]);
};

/**
 * 플러그인 및 확장
 */

// 버전 히스토리 플러그인 (향후 구현)
// noteSchema.plugin(require('./plugins/versionHistory'));

// 감사 로그 플러그인 (향후 구현)
// noteSchema.plugin(require('./plugins/auditLog'));

export default mongoose.model('Note', noteSchema); 