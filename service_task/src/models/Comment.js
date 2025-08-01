/**
 * Comment Model - 댓글 모델
 * 태스크 및 프로젝트 댓글을 관리하는 모델
 * 
 * @description
 * - 계층형 댓글 구조 (답글 지원)
 * - 반응 및 멘션 기능
 * - 파일 첨부 및 하이라이트
 * - 권한 및 접근 제어
 * - 확장 가능한 메타데이터 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

const commentSchema = new mongoose.Schema({
  // 기본 정보
  content: {
    type: String,
    required: [true, '댓글 내용은 필수입니다.'],
    trim: true,
    maxlength: [5000, '댓글 내용은 5000자를 초과할 수 없습니다.']
  },
  type: {
    type: String,
    enum: ['comment', 'reply', 'mention', 'system', 'activity'],
    default: 'comment'
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },

  // 작성자 정보
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '작성자는 필수입니다.']
  },
  authorName: {
    type: String,
    required: [true, '작성자 이름은 필수입니다.']
  },
  authorAvatar: String,
  authorRole: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // 관련 리소스 정보
  resourceType: {
    type: String,
    enum: ['task', 'project', 'organization', 'team'],
    required: [true, '리소스 타입은 필수입니다.']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, '리소스 ID는 필수입니다.']
  },

  // 계층형 구조
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  rootCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  depth: {
    type: Number,
    default: 0,
    max: [10, '댓글 깊이는 10을 초과할 수 없습니다.']
  },
  replyCount: {
    type: Number,
    default: 0
  },

  // 멘션 및 태그
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userEmail: String,
    position: {
      start: Number,
      end: Number
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '태그는 20자를 초과할 수 없습니다.']
  }],

  // 하이라이트 및 위치 정보
  highlight: {
    text: String,
    position: {
      start: Number,
      end: Number
    },
    color: {
      type: String,
      default: '#ffeb3b'
    }
  },
  position: {
    x: Number,
    y: Number,
    page: Number,
    element: String
  },

  // 파일 첨부
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
    },
    thumbnail: String,
    metadata: mongoose.Schema.Types.Mixed
  }],

  // 반응 및 평가
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbsup', 'thumbsdown'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactionCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },

  // 권한 및 접근 제어
  visibility: {
    type: String,
    enum: ['public', 'private', 'team', 'organization'],
    default: 'public'
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
    }
  }],

  // 조직 및 팀 정보
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'email', 'import'],
      default: 'api'
    },
    sessionId: String,
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    customData: mongoose.Schema.Types.Mixed
  },

  // 통계 정보
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    }
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'hide', 'restore', 'report', 'moderate'],
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
commentSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ rootCommentId: 1, depth: 1, createdAt: 1 });
commentSchema.index({ 'mentions.userId': 1 });
commentSchema.index({ tags: 1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ organization: 1, createdAt: -1 });
commentSchema.index({ team: 1, createdAt: -1 });
commentSchema.index({ 'reactions.userId': 1 });
commentSchema.index({ createdAt: -1 });

// 가상 필드
commentSchema.virtual('isReply').get(function() {
  return this.parentCommentId !== null;
});

commentSchema.virtual('hasReplies').get(function() {
  return this.replyCount > 0;
});

commentSchema.virtual('isEdited').get(function() {
  return this.updatedAt > this.createdAt;
});

commentSchema.virtual('popularityScore').get(function() {
  return this.reactionCount + (this.replyCount * 2) + this.stats.viewCount;
});

// 인스턴스 메서드

/**
 * 댓글 반응 추가
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 * @param {String} reactionType - 반응 타입
 */
commentSchema.methods.addReaction = function(userId, userName, reactionType) {
  // 기존 반응 확인
  const existingReaction = this.reactions.find(r => r.userId.toString() === userId);
  
  if (existingReaction) {
    // 기존 반응과 같은 유형이면 제거
    if (existingReaction.type === reactionType) {
      this.reactions = this.reactions.filter(r => r.userId.toString() !== userId);
      this.reactionCount = Math.max(0, this.reactionCount - 1);
      if (reactionType === 'like' || reactionType === 'thumbsup') {
        this.likeCount = Math.max(0, this.likeCount - 1);
      }
    } else {
      // 다른 유형이면 변경
      existingReaction.type = reactionType;
      existingReaction.createdAt = new Date();
      if (reactionType === 'like' || reactionType === 'thumbsup') {
        this.likeCount += 1;
      }
    }
  } else {
    // 새 반응 추가
    this.reactions.push({
      userId,
      userName,
      type: reactionType,
      createdAt: new Date()
    });
    this.reactionCount += 1;
    if (reactionType === 'like' || reactionType === 'thumbsup') {
      this.likeCount += 1;
    }
  }
  
  return this.save();
};

/**
 * 댓글 반응 제거
 * @param {String} userId - 사용자 ID
 */
commentSchema.methods.removeReaction = function(userId) {
  const reaction = this.reactions.find(r => r.userId.toString() === userId);
  
  if (reaction) {
    this.reactions = this.reactions.filter(r => r.userId.toString() !== userId);
    this.reactionCount = Math.max(0, this.reactionCount - 1);
    if (reaction.type === 'like' || reaction.type === 'thumbsup') {
      this.likeCount = Math.max(0, this.likeCount - 1);
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

/**
 * 답글 추가
 * @param {String} replyId - 답글 ID
 */
commentSchema.methods.addReply = function(replyId) {
  this.replyCount += 1;
  return this.save();
};

/**
 * 답글 제거
 * @param {String} replyId - 답글 ID
 */
commentSchema.methods.removeReply = function(replyId) {
  this.replyCount = Math.max(0, this.replyCount - 1);
  return this.save();
};

/**
 * 댓글 조회수 증가
 */
commentSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  return this.save();
};

/**
 * 댓글 신고
 * @param {String} userId - 신고자 ID
 * @param {String} userName - 신고자 이름
 * @param {String} reason - 신고 이유
 */
commentSchema.methods.report = function(userId, userName, reason) {
  this.stats.reportCount += 1;
  
  this.auditLog.push({
    action: 'report',
    userId,
    userName,
    details: `신고: ${reason}`
  });
  
  return this.save();
};

/**
 * 댓글 숨김 처리
 * @param {String} userId - 처리자 ID
 * @param {String} userName - 처리자 이름
 * @param {String} reason - 숨김 이유
 */
commentSchema.methods.hide = function(userId, userName, reason) {
  this.status = 'hidden';
  
  this.auditLog.push({
    action: 'hide',
    userId,
    userName,
    details: `숨김 처리: ${reason}`
  });
  
  return this.save();
};

/**
 * 댓글 복원
 * @param {String} userId - 복원자 ID
 * @param {String} userName - 복원자 이름
 */
commentSchema.methods.restore = function(userId, userName) {
  this.status = 'active';
  
  this.auditLog.push({
    action: 'restore',
    userId,
    userName,
    details: '댓글 복원'
  });
  
  return this.save();
};

/**
 * 댓글 소프트 삭제
 * @param {String} userId - 삭제자 ID
 * @param {String} userName - 삭제자 이름
 * @param {String} reason - 삭제 이유
 */
commentSchema.methods.softDelete = function(userId, userName, reason) {
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
 * 멘션 추가
 * @param {String} userId - 멘션할 사용자 ID
 * @param {String} userName - 멘션할 사용자 이름
 * @param {String} userEmail - 멘션할 사용자 이메일
 * @param {Number} start - 시작 위치
 * @param {Number} end - 종료 위치
 */
commentSchema.methods.addMention = function(userId, userName, userEmail, start, end) {
  this.mentions.push({
    userId,
    userName,
    userEmail,
    position: { start, end }
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
commentSchema.methods.addAuditLog = function(action, userId, userName, details, ipAddress = null, userAgent = null) {
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
 * 리소스 댓글 조회
 * @param {String} resourceType - 리소스 타입
 * @param {String} resourceId - 리소스 ID
 * @param {Object} options - 조회 옵션
 */
commentSchema.statics.getResourceComments = function(resourceType, resourceId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    includeReplies = true,
    depth = 0
  } = options;
  
  const query = {
    resourceType,
    resourceId,
    status: 'active'
  };
  
  if (!includeReplies) {
    query.parentCommentId = null;
  }
  
  if (depth > 0) {
    query.depth = { $lte: depth };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('authorId', 'name avatar role')
    .populate('parentCommentId', 'content authorName')
    .populate('mentions.userId', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

/**
 * 사용자 댓글 조회
 * @param {String} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 */
commentSchema.statics.getUserComments = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    resourceType,
    status
  } = options;
  
  const query = { authorId: userId };
  
  if (resourceType) query.resourceType = resourceType;
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('authorId', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

/**
 * 멘션된 댓글 조회
 * @param {String} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 */
commentSchema.statics.getMentionedComments = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = options;
  
  const query = {
    'mentions.userId': userId,
    status: 'active'
  };
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('authorId', 'name avatar')
    .populate('mentions.userId', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

/**
 * 댓글 통계 조회
 * @param {String} resourceType - 리소스 타입
 * @param {String} resourceId - 리소스 ID
 */
commentSchema.statics.getResourceStats = function(resourceType, resourceId) {
  return this.aggregate([
    {
      $match: {
        resourceType,
        resourceId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalReplies: { $sum: '$replyCount' },
        totalReactions: { $sum: '$reactionCount' },
        totalLikes: { $sum: '$likeCount' },
        totalViews: { $sum: '$stats.viewCount' },
        avgReactions: { $avg: '$reactionCount' }
      }
    }
  ]);
};

/**
 * 인기 댓글 조회
 * @param {String} resourceType - 리소스 타입
 * @param {String} resourceId - 리소스 ID
 * @param {Number} limit - 조회 개수
 */
commentSchema.statics.getPopularComments = function(resourceType, resourceId, limit = 5) {
  return this.find({
    resourceType,
    resourceId,
    status: 'active',
    parentCommentId: null
  })
  .sort({ reactionCount: -1, replyCount: -1, createdAt: -1 })
  .limit(limit)
  .populate('authorId', 'name avatar')
  .populate('mentions.userId', 'name avatar');
};

// 미들웨어

// 저장 전 처리
commentSchema.pre('save', function(next) {
  // 태그 정리
  if (this.tags) {
    this.tags = [...new Set(this.tags.filter(tag => tag.trim().length > 0))];
  }
  
  // 멘션 중복 제거
  if (this.mentions) {
    const seen = new Set();
    this.mentions = this.mentions.filter(mention => {
      const key = mention.userId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  // 반응 중복 제거
  if (this.reactions) {
    const seen = new Set();
    this.reactions = this.reactions.filter(reaction => {
      const key = reaction.userId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  next();
});

// 저장 후 처리
commentSchema.post('save', function(doc) {
  logger.info(`💬 Comment ${doc._id} ${doc.isNew ? 'created' : 'updated'}: ${doc.content.substring(0, 50)}...`);
});

// 삭제 후 처리
commentSchema.post('remove', function(doc) {
  logger.info(`🗑️ Comment ${doc._id} deleted: ${doc.content.substring(0, 50)}...`);
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment; 