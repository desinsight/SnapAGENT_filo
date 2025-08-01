/**
 * Notification Model - 알림 데이터 모델
 * Mongoose를 사용한 알림 스키마 정의
 * 
 * @description
 * - 다양한 알림 유형 관리 (문서, 코멘트, 승인, 시스템 등)
 * - 다중 채널 지원 (이메일, 푸시, 슬랙, 웹훅 등)
 * - 알림 상태 및 전송 이력 추적
 * - 사용자별 알림 설정 및 선호도 관리
 * - 다른 서비스와의 연동을 위한 확장 필드
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 알림 스키마 정의
 * 시스템의 모든 알림을 관리하는 Mongoose 스키마
 */
const notificationSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 수신자 정보
  recipientId: {
    type: String,
    required: [true, '수신자 ID는 필수입니다.'],
    ref: 'User',
    index: true
  },

  recipientEmail: {
    type: String,
    required: [true, '수신자 이메일은 필수입니다.'],
    trim: true,
    lowercase: true,
    index: true
  },

  recipientName: {
    type: String,
    required: [true, '수신자 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '수신자 이름은 100자를 초과할 수 없습니다.']
  },

  // 발신자 정보 (선택사항)
  senderId: {
    type: String,
    ref: 'User',
    index: true
  },

  senderName: {
    type: String,
    trim: true,
    maxlength: [100, '발신자 이름은 100자를 초과할 수 없습니다.']
  },

  // 알림 기본 정보
  title: {
    type: String,
    required: [true, '알림 제목은 필수입니다.'],
    trim: true,
    maxlength: [200, '알림 제목은 200자를 초과할 수 없습니다.']
  },

  message: {
    type: String,
    required: [true, '알림 메시지는 필수입니다.'],
    trim: true,
    maxlength: [1000, '알림 메시지는 1,000자를 초과할 수 없습니다.']
  },

  // 알림 유형
  type: {
    type: String,
    required: [true, '알림 유형은 필수입니다.'],
    enum: {
      values: [
        // 문서 관련 알림
        'document_created',        // 문서 생성
        'document_updated',        // 문서 수정
        'document_deleted',        // 문서 삭제
        'document_shared',         // 문서 공유
        'document_approved',       // 문서 승인
        'document_rejected',       // 문서 반려
        'document_commented',      // 문서 코멘트
        'document_tagged',         // 문서 태그
        
        // 협업 관련 알림
        'collaboration_invite',    // 협업 초대
        'collaboration_join',      // 협업 참여
        'collaboration_leave',     // 협업 나가기
        'real_time_edit',         // 실시간 편집
        
        // 승인 관련 알림
        'approval_request',        // 승인 요청
        'approval_approved',       // 승인 완료
        'approval_rejected',       // 승인 반려
        'approval_delegated',      // 승인 위임
        
        // 시스템 알림
        'system_maintenance',      // 시스템 점검
        'system_update',          // 시스템 업데이트
        'security_alert',         // 보안 경고
        'backup_complete',        // 백업 완료
        
        // 사용자 관련 알림
        'user_registered',        // 사용자 등록
        'user_login',             // 로그인
        'user_logout',            // 로그아웃
        'password_changed',       // 비밀번호 변경
        
        // 기타 알림
        'general',                // 일반 알림
        'reminder',               // 리마인더
        'announcement',           // 공지사항
        'custom'                  // 사용자 정의
      ],
      message: '유효하지 않은 알림 유형입니다.'
    },
    index: true
  },

  // 알림 카테고리
  category: {
    type: String,
    required: [true, '알림 카테고리는 필수입니다.'],
    enum: {
      values: [
        'document',               // 문서
        'collaboration',          // 협업
        'approval',               // 승인
        'system',                 // 시스템
        'user',                   // 사용자
        'security',               // 보안
        'general'                 // 일반
      ],
      message: '유효하지 않은 알림 카테고리입니다.'
    },
    index: true
  },

  // 우선순위
  priority: {
    type: String,
    required: [true, '알림 우선순위는 필수입니다.'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '유효하지 않은 알림 우선순위입니다.'
    },
    default: 'medium',
    index: true
  },

  // 알림 상태
  status: {
    type: String,
    required: [true, '알림 상태는 필수입니다.'],
    enum: {
      values: [
        'pending',                // 대기 중
        'sending',                // 전송 중
        'sent',                   // 전송 완료
        'delivered',              // 전달 완료
        'read',                   // 읽음
        'failed',                 // 전송 실패
        'cancelled',              // 취소됨
        'expired'                 // 만료됨
      ],
      message: '유효하지 않은 알림 상태입니다.'
    },
    default: 'pending',
    index: true
  },

  // 알림 채널 설정
  channels: [{
    type: {
      type: String,
      enum: ['email', 'push', 'slack', 'webhook', 'sms', 'in_app'],
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'sending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    sentAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    error: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    }
  }],

  // 알림 데이터 (동적 데이터)
  data: {
    // 문서 관련 데이터
    documentId: {
      type: String,
      ref: 'Document'
    },
    documentTitle: {
      type: String
    },
    
    // 코멘트 관련 데이터
    commentId: {
      type: String,
      ref: 'Comment'
    },
    commentContent: {
      type: String
    },
    
    // 승인 관련 데이터
    approvalId: {
      type: String
    },
    approvalType: {
      type: String
    },
    
    // 링크 및 액션
    actionUrl: {
      type: String,
      trim: true
    },
    actionText: {
      type: String,
      trim: true
    },
    
    // 이미지 및 첨부파일
    imageUrl: {
      type: String,
      trim: true
    },
    attachmentUrl: {
      type: String,
      trim: true
    },
    
    // 기타 동적 데이터
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // 스케줄링 정보
  scheduling: {
    sendAt: {
      type: Date,
      index: true
    },
    expiresAt: {
      type: Date,
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    recurring: {
      enabled: {
        type: Boolean,
        default: false
      },
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom']
      },
      interval: {
        type: Number
      },
      endDate: {
        type: Date
      }
    }
  },

  // 템플릿 정보
  template: {
    templateId: {
      type: String,
      ref: 'NotificationTemplate'
    },
    templateName: {
      type: String
    },
    variables: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // 그룹 알림 정보
  groupNotification: {
    isGroup: {
      type: Boolean,
      default: false
    },
    groupId: {
      type: String
    },
    totalRecipients: {
      type: Number,
      default: 1
    },
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    }
  },

  // 전송 이력
  deliveryHistory: [{
    channel: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: {
      type: Date
    },
    readAt: {
      type: Date
    },
    error: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    response: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // 메타데이터 (다른 서비스와의 연동을 위한 확장 필드)
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'desktop', 'integration', 'scheduled'],
      default: 'api'
    },
    sourceId: {
      type: String,
      description: '알림을 생성한 소스의 ID'
    },
    integrationId: {
      type: String,
      description: '외부 서비스 연동 ID'
    },
    externalData: {
      type: mongoose.Schema.Types.Mixed,
      description: '외부 서비스에서 전달받은 추가 데이터'
    },
    tags: [{
      type: String,
      trim: true
    }]
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'send', 'deliver', 'read', 'delete', 'cancel'],
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

  sentAt: {
    type: Date,
    index: true
  },

  deliveredAt: {
    type: Date,
    index: true
  },

  readAt: {
    type: Date,
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
notificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1, priority: 1 });
notificationSchema.index({ 'scheduling.sendAt': 1, status: 'pending' });
notificationSchema.index({ 'scheduling.expiresAt': 1 });
notificationSchema.index({ 'groupNotification.groupId': 1 });

// 가상 필드
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

notificationSchema.virtual('isDelivered').get(function() {
  return !!this.deliveredAt;
});

notificationSchema.virtual('isExpired').get(function() {
  return this.scheduling.expiresAt && new Date() > this.scheduling.expiresAt;
});

notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduling.sendAt && this.scheduling.sendAt > new Date();
});

notificationSchema.virtual('deliveryStatus').get(function() {
  if (this.status === 'failed') return 'failed';
  if (this.readAt) return 'read';
  if (this.deliveredAt) return 'delivered';
  if (this.sentAt) return 'sent';
  if (this.status === 'sending') return 'sending';
  return 'pending';
});

// 미들웨어
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

notificationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 정적 메서드
notificationSchema.statics.findByRecipient = function(recipientId, options = {}) {
  const query = this.find({ recipientId, status: { $ne: 'cancelled' } });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  if (options.type) {
    query.where('type', options.type);
  }
  
  if (options.category) {
    query.where('category', options.category);
  }
  
  if (options.unreadOnly) {
    query.where('readAt', null);
  }
  
  return query.sort({ createdAt: -1 });
};

notificationSchema.statics.findByType = function(type, options = {}) {
  const query = this.find({ type, status: { $ne: 'cancelled' } });
  
  if (options.recipientId) {
    query.where('recipientId', options.recipientId);
  }
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  return query.sort({ createdAt: -1 });
};

notificationSchema.statics.findPendingScheduled = function() {
  return this.find({
    status: 'pending',
    'scheduling.sendAt': { $lte: new Date() },
    'scheduling.expiresAt': { $gt: new Date() }
  }).sort({ 'scheduling.sendAt': 1 });
};

notificationSchema.statics.findExpired = function() {
  return this.find({
    'scheduling.expiresAt': { $lt: new Date() },
    status: { $in: ['pending', 'sending'] }
  });
};

// 인스턴스 메서드
notificationSchema.methods.markAsRead = function(userId, userName) {
  this.readAt = new Date();
  this.status = 'read';
  this.addAuditLog('read', userId, userName, '알림 읽음');
  return this.save();
};

notificationSchema.methods.markAsDelivered = function(channel) {
  this.deliveredAt = new Date();
  this.status = 'delivered';
  
  // 채널별 전달 상태 업데이트
  const channelData = this.channels.find(c => c.type === channel);
  if (channelData) {
    channelData.status = 'delivered';
    channelData.deliveredAt = new Date();
  }
  
  // 전송 이력 추가
  this.deliveryHistory.push({
    channel,
    status: 'delivered',
    deliveredAt: new Date()
  });
  
  return this.save();
};

notificationSchema.methods.markAsSent = function(channel) {
  this.sentAt = new Date();
  this.status = 'sent';
  
  // 채널별 전송 상태 업데이트
  const channelData = this.channels.find(c => c.type === channel);
  if (channelData) {
    channelData.status = 'sent';
    channelData.sentAt = new Date();
  }
  
  // 전송 이력 추가
  this.deliveryHistory.push({
    channel,
    status: 'sent',
    sentAt: new Date()
  });
  
  return this.save();
};

notificationSchema.methods.markAsFailed = function(channel, error) {
  this.status = 'failed';
  
  // 채널별 실패 상태 업데이트
  const channelData = this.channels.find(c => c.type === channel);
  if (channelData) {
    channelData.status = 'failed';
    channelData.error = error;
    channelData.retryCount += 1;
  }
  
  // 전송 이력 추가
  this.deliveryHistory.push({
    channel,
    status: 'failed',
    error,
    retryCount: channelData ? channelData.retryCount : 1
  });
  
  return this.save();
};

notificationSchema.methods.cancel = function(userId, userName, reason = '') {
  this.status = 'cancelled';
  this.addAuditLog('cancel', userId, userName, `알림 취소: ${reason}`);
  return this.save();
};

notificationSchema.methods.addAuditLog = function(action, userId, userName, details = '') {
  this.auditLog.push({
    action,
    userId,
    userName,
    timestamp: new Date(),
    details
  });
  return this.save();
};

notificationSchema.methods.retry = function(channel) {
  // 재시도 로직
  const channelData = this.channels.find(c => c.type === channel);
  if (channelData && channelData.retryCount < 3) {
    channelData.status = 'pending';
    channelData.error = null;
    this.status = 'pending';
    return this.save();
  }
  return Promise.reject(new Error('최대 재시도 횟수를 초과했습니다.'));
};

// 모델 생성 및 내보내기
const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 