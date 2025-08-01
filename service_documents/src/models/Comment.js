/**
 * Comment Model - 코멘트 및 태그 데이터 모델
 * Mongoose를 사용한 코멘트 스키마 정의
 * 
 * @description
 * - 문서별 코멘트 관리 (댓글, 의견, 피드백 등)
 * - 실시간 협업을 위한 코멘트 시스템
 * - 태그 및 하이라이트 기능
 * - 코멘트 이력 및 버전 관리
 * - 권한 및 보안 설정
 * - 다른 서비스와의 연동을 위한 인터페이스
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 코멘트 스키마 정의
 * 문서의 코멘트, 태그, 하이라이트 등을 관리하는 Mongoose 스키마
 */
const commentSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 문서 참조 (문서 서비스와의 연동)
  documentId: {
    type: String,
    required: [true, '문서 ID는 필수입니다.'],
    ref: 'Document',
    index: true
  },

  // 코멘트 작성자
  authorId: {
    type: String,
    required: [true, '작성자 ID는 필수입니다.'],
    ref: 'User',
    index: true
  },

  authorName: {
    type: String,
    required: [true, '작성자 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '작성자 이름은 100자를 초과할 수 없습니다.']
  },

  authorAvatar: {
    type: String,
    trim: true
  },

  // 코멘트 유형
  type: {
    type: String,
    required: [true, '코멘트 유형은 필수입니다.'],
    enum: {
      values: [
        'comment',           // 일반 코멘트
        'review',            // 리뷰/검토
        'feedback',          // 피드백
        'suggestion',        // 제안
        'question',          // 질문
        'answer',            // 답변
        'highlight',         // 하이라이트
        'tag',               // 태그
        'annotation',        // 주석
        'approval',          // 승인 코멘트
        'rejection'          // 반려 코멘트
      ],
      message: '유효하지 않은 코멘트 유형입니다.'
    },
    default: 'comment',
    index: true
  },

  // 코멘트 내용
  content: {
    type: String,
    required: [true, '코멘트 내용은 필수입니다.'],
    maxlength: [5000, '코멘트 내용은 5,000자를 초과할 수 없습니다.']
  },

  // 마크다운 지원
  contentMarkdown: {
    type: String,
    maxlength: [10000, '마크다운 내용은 10,000자를 초과할 수 없습니다.']
  },

  // 태그 정보
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '태그는 50자를 초과할 수 없습니다.']
  }],

  // 하이라이트 정보 (문서 내 특정 텍스트 하이라이트)
  highlight: {
    startOffset: {
      type: Number,
      min: [0, '시작 오프셋은 0 이상이어야 합니다.']
    },
    endOffset: {
      type: Number,
      min: [0, '종료 오프셋은 0 이상이어야 합니다.']
    },
    selectedText: {
      type: String,
      maxlength: [1000, '선택된 텍스트는 1,000자를 초과할 수 없습니다.']
    },
    color: {
      type: String,
      enum: ['yellow', 'green', 'blue', 'red', 'purple', 'orange'],
      default: 'yellow'
    }
  },

  // 위치 정보 (문서 내 특정 위치)
  position: {
    page: {
      type: Number,
      min: [1, '페이지 번호는 1 이상이어야 합니다.']
    },
    x: {
      type: Number,
      min: [0, 'X 좌표는 0 이상이어야 합니다.']
    },
    y: {
      type: Number,
      min: [0, 'Y 좌표는 0 이상이어야 합니다.']
    }
  },

  // 상태 관리
  status: {
    type: String,
    required: [true, '코멘트 상태는 필수입니다.'],
    enum: {
      values: [
        'active',            // 활성
        'resolved',          // 해결됨
        'archived',          // 보관됨
        'deleted'            // 삭제됨
      ],
      message: '유효하지 않은 코멘트 상태입니다.'
    },
    default: 'active',
    index: true
  },

  // 우선순위
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // 부모 코멘트 (답글 기능)
  parentCommentId: {
    type: String,
    ref: 'Comment',
    index: true
  },

  // 답글 목록
  replies: [{
    type: String,
    ref: 'Comment'
  }],

  // 좋아요/반응
  reactions: [{
    userId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 멘션된 사용자들
  mentions: [{
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    }
  }],

  // 첨부파일
  attachments: [{
    fileId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 메타데이터 (다른 서비스와의 연동을 위한 확장 필드)
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'desktop', 'api', 'integration'],
      default: 'web'
    },
    integrationId: {
      type: String,
      description: '외부 서비스 연동 ID'
    },
    externalData: {
      type: mongoose.Schema.Types.Mixed,
      description: '외부 서비스에서 전달받은 추가 데이터'
    }
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'resolve', 'archive', 'restore'],
      required: true
    },
    userId: {
      type: String,
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
    details: {
      type: String,
      maxlength: [500, '감사 로그 상세는 500자를 초과할 수 없습니다.']
    }
  }],

  // 생성/수정 정보
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

  deletedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정 (성능 최적화)
commentSchema.index({ documentId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, createdAt: -1 });
commentSchema.index({ type: 1, status: 1 });
commentSchema.index({ tags: 1 });
commentSchema.index({ 'reactions.userId': 1 });
commentSchema.index({ 'mentions.userId': 1 });

// 가상 필드
commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

commentSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

commentSchema.virtual('likeCount').get(function() {
  if (!this.reactions) return 0;
  return this.reactions.filter(r => r.type === 'like').length;
});

commentSchema.virtual('isEdited').get(function() {
  return this.updatedAt > this.createdAt;
});

// 미들웨어
commentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

commentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 정적 메서드
commentSchema.statics.findByDocument = function(documentId, options = {}) {
  const query = this.find({ documentId, status: { $ne: 'deleted' } });
  
  if (options.populate) {
    query.populate('authorId', 'name avatar');
    query.populate('parentCommentId', 'content authorName');
  }
  
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ createdAt: -1 });
  }
  
  return query;
};

commentSchema.statics.findByAuthor = function(authorId, options = {}) {
  const query = this.find({ authorId, status: { $ne: 'deleted' } });
  
  if (options.populate) {
    query.populate('documentId', 'title type');
  }
  
  return query.sort({ createdAt: -1 });
};

commentSchema.statics.findByTags = function(tags, options = {}) {
  const query = this.find({ 
    tags: { $in: tags }, 
    status: { $ne: 'deleted' } 
  });
  
  if (options.populate) {
    query.populate('documentId', 'title type');
    query.populate('authorId', 'name avatar');
  }
  
  return query.sort({ createdAt: -1 });
};

// 인스턴스 메서드
commentSchema.methods.addReaction = function(userId, reactionType) {
  // 기존 반응 제거
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  
  // 새 반응 추가
  this.reactions.push({
    userId,
    type: reactionType,
    createdAt: new Date()
  });
  
  return this.save();
};

commentSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  return this.save();
};

commentSchema.methods.addMention = function(userId, userName) {
  const existingMention = this.mentions.find(m => m.userId === userId);
  if (!existingMention) {
    this.mentions.push({ userId, userName });
  }
  return this.save();
};

commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
  return this.save();
};

commentSchema.methods.removeReply = function(replyId) {
  this.replies = this.replies.filter(id => id !== replyId);
  return this.save();
};

commentSchema.methods.addAuditLog = function(action, userId, userName, details = '') {
  this.auditLog.push({
    action,
    userId,
    userName,
    timestamp: new Date(),
    details
  });
  return this.save();
};

commentSchema.methods.softDelete = function(userId, userName) {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.addAuditLog('delete', userId, userName, '코멘트 삭제');
  return this.save();
};

commentSchema.methods.restore = function(userId, userName) {
  this.status = 'active';
  this.deletedAt = undefined;
  this.addAuditLog('restore', userId, userName, '코멘트 복원');
  return this.save();
};

// 모델 생성 및 내보내기
const Comment = mongoose.model('Comment', commentSchema);

export default Comment; 