/**
 * Notification Model - 알림 모델
 * 사용자 및 조직 알림을 관리하는 모델
 * 
 * @description
 * - 개인 및 조직 알림 지원
 * - 다양한 알림 타입 및 우선순위
 * - 읽음 상태 및 전송 채널 관리
 * - 알림 그룹화 및 일괄 처리
 * - 확장 가능한 메타데이터 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

const notificationSchema = new mongoose.Schema({
  // 기본 정보
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
    maxlength: [1000, '알림 메시지는 1000자를 초과할 수 없습니다.']
  },
  type: {
    type: String,
    enum: {
      values: [
        'task_assigned', 'task_completed', 'task_overdue', 'task_updated',
        'project_created', 'project_updated', 'project_completed',
        'comment_added', 'comment_replied', 'comment_mentioned',
        'invitation_sent', 'invitation_accepted', 'invitation_declined',
        'permission_granted', 'permission_revoked',
        'deadline_approaching', 'deadline_passed',
        'milestone_reached', 'milestone_overdue',
        'team_joined', 'team_left', 'team_role_changed',
        'organization_joined', 'organization_left',
        'system_maintenance', 'system_update', 'system_error',
        'custom', 'reminder', 'announcement'
      ],
      message: '유효하지 않은 알림 타입입니다.'
    },
    required: [true, '알림 타입은 필수입니다.']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['task', 'project', 'team', 'organization', 'system', 'custom'],
    required: [true, '알림 카테고리는 필수입니다.']
  },

  // 수신자 정보
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: String,
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    deliveryChannels: [{
      channel: {
        type: String,
        enum: ['in_app', 'email', 'push', 'sms', 'slack', 'webhook'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      errorMessage: String,
      retryCount: {
        type: Number,
        default: 0
      }
    }]
  }],

  // 발신자 정보
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userAvatar: String,
    isSystem: {
      type: Boolean,
      default: false
    }
  },

  // 관련 리소스 정보
  relatedResource: {
    type: {
      type: String,
      enum: ['task', 'project', 'organization', 'team', 'comment', 'user'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    title: String,
    url: String
  },

  // 조직 및 팀 정보
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  // 알림 설정
  settings: {
    isPersistent: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    allowReply: {
      type: Boolean,
      default: false
    },
    requireAction: {
      type: Boolean,
      default: false
    },
    actionUrl: String,
    actionText: String,
    groupKey: String, // 같은 그룹의 알림을 묶어서 표시
    suppressDuplicate: {
      type: Boolean,
      default: true
    }
  },

  // 전송 설정
  delivery: {
    channels: [{
      type: String,
      enum: ['in_app', 'email', 'push', 'sms', 'slack', 'webhook'],
      default: ['in_app']
    }],
    scheduleAt: Date,
    retryPolicy: {
      maxRetries: {
        type: Number,
        default: 3
      },
      retryDelay: {
        type: Number,
        default: 300000 // 5분
      }
    },
    template: {
      name: String,
      variables: mongoose.Schema.Types.Mixed
    }
  },

  // 상태 및 메타데이터
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'draft'
  },
  metadata: {
    source: {
      type: String,
      enum: ['api', 'system', 'scheduled', 'webhook', 'import'],
      default: 'api'
    },
    sourceId: String,
    batchId: String,
    campaignId: String,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed
  },

  // 통계 정보
  stats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    },
    deliveredCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    },
    actionCount: {
      type: Number,
      default: 0
    }
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'send', 'deliver', 'read', 'click', 'action', 'cancel', 'retry'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
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
notificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });
notificationSchema.index({ 'recipients.userId': 1, 'recipients.isRead': 1 });
notificationSchema.index({ organization: 1, createdAt: -1 });
notificationSchema.index({ team: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ 'relatedResource.type': 1, 'relatedResource.id': 1 });
notificationSchema.index({ 'settings.groupKey': 1 });
notificationSchema.index({ 'delivery.scheduleAt': 1, status: 1 });
notificationSchema.index({ 'settings.expiresAt': 1 });
notificationSchema.index({ createdAt: -1 });

// 가상 필드
notificationSchema.virtual('readRate').get(function() {
  if (this.stats.totalRecipients === 0) return 0;
  return (this.stats.readCount / this.stats.totalRecipients) * 100;
});

notificationSchema.virtual('deliveryRate').get(function() {
  if (this.stats.totalRecipients === 0) return 0;
  return (this.stats.deliveredCount / this.stats.totalRecipients) * 100;
});

notificationSchema.virtual('isExpired').get(function() {
  if (!this.settings.expiresAt) return false;
  return new Date() > this.settings.expiresAt;
});

notificationSchema.virtual('isScheduled').get(function() {
  return this.delivery.scheduleAt && new Date() < this.delivery.scheduleAt;
});

// 인스턴스 메서드

/**
 * 알림 읽음 처리
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 */
notificationSchema.methods.markAsRead = function(userId, userName) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId);
  
  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    this.stats.readCount += 1;
    
    this.auditLog.push({
      action: 'read',
      userId,
      userName,
      details: '알림 읽음'
    });
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

/**
 * 알림 전송 완료 처리
 * @param {String} userId - 사용자 ID
 * @param {String} channel - 전송 채널
 */
notificationSchema.methods.markAsDelivered = function(userId, channel) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId);
  
  if (recipient) {
    recipient.isDelivered = true;
    recipient.deliveredAt = new Date();
    
    const deliveryChannel = recipient.deliveryChannels.find(dc => dc.channel === channel);
    if (deliveryChannel) {
      deliveryChannel.status = 'delivered';
      deliveryChannel.deliveredAt = new Date();
    }
    
    this.stats.deliveredCount += 1;
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

/**
 * 알림 전송 실패 처리
 * @param {String} userId - 사용자 ID
 * @param {String} channel - 전송 채널
 * @param {String} errorMessage - 에러 메시지
 */
notificationSchema.methods.markAsFailed = function(userId, channel, errorMessage) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId);
  
  if (recipient) {
    const deliveryChannel = recipient.deliveryChannels.find(dc => dc.channel === channel);
    if (deliveryChannel) {
      deliveryChannel.status = 'failed';
      deliveryChannel.errorMessage = errorMessage;
      deliveryChannel.retryCount += 1;
    }
    
    this.stats.failedCount += 1;
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

/**
 * 알림 액션 처리
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 * @param {String} action - 액션 타입
 */
notificationSchema.methods.recordAction = function(userId, userName, action) {
  this.stats.actionCount += 1;
  
  this.auditLog.push({
    action: 'action',
    userId,
    userName,
    details: `액션 수행: ${action}`
  });
  
  return this.save();
};

/**
 * 알림 클릭 처리
 * @param {String} userId - 사용자 ID
 * @param {String} userName - 사용자 이름
 */
notificationSchema.methods.recordClick = function(userId, userName) {
  this.stats.clickCount += 1;
  
  this.auditLog.push({
    action: 'click',
    userId,
    userName,
    details: '알림 클릭'
  });
  
  return this.save();
};

/**
 * 알림 전송
 */
notificationSchema.methods.send = function() {
  this.status = 'sending';
  this.stats.totalRecipients = this.recipients.length;
  
  this.auditLog.push({
    action: 'send',
    details: `${this.recipients.length}명에게 알림 전송 시작`
  });
  
  return this.save();
};

/**
 * 알림 전송 완료
 */
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  
  this.auditLog.push({
    action: 'send',
    details: '알림 전송 완료'
  });
  
  return this.save();
};

/**
 * 알림 취소
 * @param {String} userId - 취소자 ID
 * @param {String} userName - 취소자 이름
 * @param {String} reason - 취소 이유
 */
notificationSchema.methods.cancel = function(userId, userName, reason) {
  this.status = 'cancelled';
  
  this.auditLog.push({
    action: 'cancel',
    userId,
    userName,
    details: `알림 취소: ${reason}`
  });
  
  return this.save();
};

/**
 * 알림 재시도
 * @param {String} userId - 재시도자 ID
 * @param {String} userName - 재시도자 이름
 */
notificationSchema.methods.retry = function(userId, userName) {
  this.status = 'sending';
  
  this.auditLog.push({
    action: 'retry',
    userId,
    userName,
    details: '알림 재전송'
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
notificationSchema.methods.addAuditLog = function(action, userId, userName, details, ipAddress = null, userAgent = null) {
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
 * 사용자 알림 조회
 * @param {String} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 */
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type,
    category,
    priority,
    sort = '-createdAt'
  } = options;
  
  const query = {
    'recipients.userId': userId,
    status: { $in: ['sent', 'delivered'] }
  };
  
  if (unreadOnly) {
    query['recipients.isRead'] = false;
  }
  
  if (type) query.type = type;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('sender.userId', 'name avatar')
    .populate('relatedResource.id')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

/**
 * 읽지 않은 알림 개수 조회
 * @param {String} userId - 사용자 ID
 */
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'recipients.userId': userId,
    'recipients.isRead': false,
    status: { $in: ['sent', 'delivered'] }
  });
};

/**
 * 알림 일괄 읽음 처리
 * @param {String} userId - 사용자 ID
 * @param {Array} notificationIds - 알림 ID 배열
 */
notificationSchema.statics.markMultipleAsRead = function(userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      'recipients.userId': userId
    },
    {
      $set: {
        'recipients.$.isRead': true,
        'recipients.$.readAt': new Date()
      },
      $inc: { 'stats.readCount': 1 }
    }
  );
};

/**
 * 만료된 알림 정리
 */
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      'settings.expiresAt': { $lt: new Date() },
      status: { $in: ['draft', 'scheduled'] }
    },
    {
      $set: { status: 'cancelled' }
    }
  );
};

/**
 * 알림 통계 조회
 * @param {String} userId - 사용자 ID
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 */
notificationSchema.statics.getUserStats = function(userId, startDate, endDate) {
  const matchStage = {
    'recipients.userId': userId,
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category',
          priority: '$priority'
        },
        total: { $sum: 1 },
        read: {
          $sum: {
            $cond: [{ $eq: ['$recipients.isRead', true] }, 1, 0]
          }
        },
        delivered: {
          $sum: {
            $cond: [{ $eq: ['$recipients.isDelivered', true] }, 1, 0]
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            priority: '$_id.priority',
            total: '$total',
            read: '$read',
            delivered: '$delivered'
          }
        },
        totalCount: { $sum: '$total' },
        readCount: { $sum: '$read' },
        deliveredCount: { $sum: '$delivered' }
      }
    }
  ]);
};

// 미들웨어

// 저장 전 처리
notificationSchema.pre('save', function(next) {
  // 태그 정리
  if (this.metadata.tags) {
    this.metadata.tags = [...new Set(this.metadata.tags.filter(tag => tag.trim().length > 0))];
  }
  
  // 전송 채널 중복 제거
  if (this.delivery.channels) {
    this.delivery.channels = [...new Set(this.delivery.channels)];
  }
  
  next();
});

// 저장 후 처리
notificationSchema.post('save', function(doc) {
  logger.info(`🔔 Notification ${doc._id} ${doc.isNew ? 'created' : 'updated'}: ${doc.title}`);
});

// 삭제 후 처리
notificationSchema.post('remove', function(doc) {
  logger.info(`🗑️ Notification ${doc._id} deleted: ${doc.title}`);
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 