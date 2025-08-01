const mongoose = require('mongoose');

/**
 * 알림 모델
 * 다중 채널 알림(푸시, 이메일, SMS) 및 중요/긴급 공지 기능
 */
const notificationSchema = new mongoose.Schema({
  // 기본 정보
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['event_reminder', 'event_update', 'event_cancellation', 'rsvp_request', 'rsvp_response', 'attendee_update', 'calendar_share', 'system_notice', 'urgent_notice', 'custom'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent', 'critical'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['calendar', 'event', 'attendee', 'system', 'security', 'maintenance', 'announcement'],
    required: true
  },

  // 발송 설정
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      template: {
        type: String,
        enum: ['default', 'formal', 'casual', 'urgent', 'custom'],
        default: 'default'
      },
      subject: {
        type: String,
        trim: true,
        maxlength: 200
      },
      htmlContent: {
        type: String,
        trim: true
      },
      textContent: {
        type: String,
        trim: true
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      title: {
        type: String,
        trim: true,
        maxlength: 100
      },
      body: {
        type: String,
        trim: true,
        maxlength: 500
      },
      image: {
        type: String,
        trim: true
      },
      action: {
        type: String,
        enum: ['open_app', 'open_event', 'open_calendar', 'open_url', 'none'],
        default: 'open_app'
      },
      actionUrl: {
        type: String,
        trim: true
      },
      badge: {
        type: Number,
        default: 1
      },
      sound: {
        type: String,
        default: 'default'
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        trim: true,
        maxlength: 160
      },
      sender: {
        type: String,
        trim: true,
        maxlength: 20
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      showInFeed: {
        type: Boolean,
        default: true
      },
      showInSidebar: {
        type: Boolean,
        default: true
      },
      autoDismiss: {
        type: Boolean,
        default: false
      },
      dismissAfter: {
        type: Number, // 초 단위
        default: 0
      }
    }
  },

  // 대상 설정
  recipients: {
    type: {
      type: String,
      enum: ['specific_users', 'all_users', 'user_groups', 'calendar_members', 'event_attendees', 'custom_query'],
      required: true
    },
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    userGroups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserGroup'
    }],
    calendarIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calendar'
    }],
    eventIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }],
    customQuery: {
      type: String,
      trim: true
    },
    excludeUserIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // 스케줄링
  scheduling: {
    sendImmediately: {
      type: Boolean,
      default: true
    },
    scheduledAt: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v > new Date();
        },
        message: '예약 시간은 현재 시간보다 이후여야 합니다.'
      }
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
    },
    repeat: {
      enabled: {
        type: Boolean,
        default: false
      },
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
        default: 'daily'
      },
      interval: {
        type: Number,
        default: 1,
        min: [1, '반복 간격은 최소 1이어야 합니다.']
      },
      endDate: {
        type: Date,
        validate: {
          validator: function(v) {
            return !v || v > new Date();
          },
          message: '종료 날짜는 현재 날짜보다 이후여야 합니다.'
        }
      },
      maxOccurrences: {
        type: Number,
        min: [1, '최대 반복 횟수는 최소 1이어야 합니다.']
      }
    }
  },

  // 발송 상태 및 통계
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', 'paused'],
    default: 'draft'
  },
  progress: {
    total: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    }
  },
  sentAt: Date,
  completedAt: Date,

  // 발송 기록
  deliveryLog: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    errorMessage: String,
    trackingId: String,
    retryCount: {
      type: Number,
      default: 0
    }
  }],

  // 중요/긴급 공지 설정
  urgentNotice: {
    enabled: {
      type: Boolean,
      default: false
    },
    displayType: {
      type: String,
      enum: ['banner', 'modal', 'toast', 'fullscreen'],
      default: 'banner'
    },
    backgroundColor: {
      type: String,
      default: '#ff4444'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    },
    icon: {
      type: String,
      enum: ['warning', 'error', 'info', 'success', 'custom'],
      default: 'warning'
    },
    customIcon: {
      type: String,
      trim: true
    },
    requireAcknowledgment: {
      type: Boolean,
      default: false
    },
    acknowledgmentMessage: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },

  // 상호작용
  interactions: {
    allowReply: {
      type: Boolean,
      default: false
    },
    allowForward: {
      type: Boolean,
      default: false
    },
    allowShare: {
      type: Boolean,
      default: false
    },
    requireConfirmation: {
      type: Boolean,
      default: false
    },
    confirmationMessage: {
      type: String,
      trim: true,
      maxlength: 200
    },
    actions: [{
      label: {
        type: String,
        required: true,
        trim: true
      },
      action: {
        type: String,
        enum: ['open_url', 'open_app', 'dismiss', 'confirm', 'custom'],
        required: true
      },
      url: {
        type: String,
        trim: true
      },
      style: {
        type: String,
        enum: ['primary', 'secondary', 'danger', 'success'],
        default: 'primary'
      }
    }]
  },

  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['system', 'user', 'api', 'webhook'],
      default: 'system'
    },
    sourceId: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    customData: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // 생성자 정보
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 관리
});

// 인덱스 설정
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ 'recipients.userIds': 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ 'urgentNotice.enabled': 1, createdAt: -1 });

// 가상 필드
notificationSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.priority === 'critical' || this.urgentNotice.enabled;
});

notificationSchema.virtual('isScheduled').get(function() {
  return !this.scheduling.sendImmediately && this.scheduling.scheduledAt;
});

notificationSchema.virtual('isRepeating').get(function() {
  return this.scheduling.repeat.enabled;
});

// 메서드
notificationSchema.methods.updateProgress = function(sent, failed) {
  this.progress.sent += sent;
  this.progress.failed += failed;
  this.progress.pending = this.progress.total - this.progress.sent - this.progress.failed;
  
  if (this.progress.pending <= 0) {
    this.status = 'sent';
    this.completedAt = new Date();
  }
};

notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
};

notificationSchema.methods.addDeliveryLog = function(recipientId, channel, status, errorMessage = null) {
  this.deliveryLog.push({
    recipientId,
    channel,
    status,
    sentAt: new Date(),
    errorMessage,
    trackingId: this.generateTrackingId()
  });
};

notificationSchema.methods.generateTrackingId = function() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 정적 메서드
notificationSchema.statics.findUrgentNotices = function() {
  return this.find({
    $or: [
      { priority: { $in: ['urgent', 'critical'] } },
      { 'urgentNotice.enabled': true }
    ],
    status: { $in: ['scheduled', 'sending', 'sent'] }
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findScheduledNotifications = function() {
  return this.find({
    status: 'scheduled',
    'scheduling.scheduledAt': { $lte: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 