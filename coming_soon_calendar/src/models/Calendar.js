// Calendar 모델 (MongoDB/Mongoose)
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SharedWithSchema = new Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ['reader', 'writer', 'admin'], default: 'reader' }
}, { _id: false });

const CalendarSchema = new Schema({
  id: { type: String, required: true, unique: true }, // UUID
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#1976d2' },
  sharedWith: [SharedWithSchema],
  // 공유 및 권한 관리
  sharing: {
    // 공유 설정
    isPublic: {
      type: Boolean,
      default: false
    },
    isShared: {
      type: Boolean,
      default: false
    },
    
    // 공유된 사용자 목록
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer'
      },
      permissions: {
        viewEvents: {
          type: Boolean,
          default: true
        },
        createEvents: {
          type: Boolean,
          default: false
        },
        editEvents: {
          type: Boolean,
          default: false
        },
        deleteEvents: {
          type: Boolean,
          default: false
        },
        manageCalendar: {
          type: Boolean,
          default: false
        },
        inviteOthers: {
          type: Boolean,
          default: false
        }
      },
      invitedAt: {
        type: Date,
        default: Date.now
      },
      acceptedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'revoked'],
        default: 'pending'
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
    // 공개 링크
    publicLink: {
      enabled: {
        type: Boolean,
        default: false
      },
      token: {
        type: String,
        unique: true,
        sparse: true
      },
      permissions: {
        viewEvents: {
          type: Boolean,
          default: true
        },
        createEvents: {
          type: Boolean,
          default: false
        },
        editEvents: {
          type: Boolean,
          default: false
        }
      },
      expiresAt: Date,
      accessCount: {
        type: Number,
        default: 0
      },
      lastAccessed: Date
    },
    
    // 그룹 공유
    sharedGroups: [{
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer'
      },
      permissions: {
        viewEvents: {
          type: Boolean,
          default: true
        },
        createEvents: {
          type: Boolean,
          default: false
        },
        editEvents: {
          type: Boolean,
          default: false
        },
        deleteEvents: {
          type: Boolean,
          default: false
        }
      },
      sharedAt: {
        type: Date,
        default: Date.now
      },
      sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
    // 조직 공유
    organizationAccess: {
      enabled: {
        type: Boolean,
        default: false
      },
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer'
      }
    }
  },
  
  // 접근 제어 및 보안
  accessControl: {
    // 기본 접근 권한
    defaultPermissions: {
      viewEvents: {
        type: Boolean,
        default: true
      },
      createEvents: {
        type: Boolean,
        default: false
      },
      editEvents: {
        type: Boolean,
        default: false
      },
      deleteEvents: {
        type: Boolean,
        default: false
      },
      manageCalendar: {
        type: Boolean,
        default: false
      },
      inviteOthers: {
        type: Boolean,
        default: false
      }
    },
    
    // IP 제한
    allowedIPs: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v) ||
                 /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
        },
        message: '유효한 IP 주소를 입력하세요.'
      }
    }],
    
    // 시간 제한
    accessHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      startTime: {
        type: String,
        validate: {
          validator: function(v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: '시간은 HH:MM 형식이어야 합니다.'
        }
      },
      endTime: {
        type: String,
        validate: {
          validator: function(v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: '시간은 HH:MM 형식이어야 합니다.'
        }
      },
      timezone: {
        type: String,
        default: 'Asia/Seoul'
      }
    },
    
    // 2단계 인증
    require2FA: {
      type: Boolean,
      default: false
    },
    
    // 세션 관리
    sessionTimeout: {
      type: Number, // 분 단위
      default: 30,
      min: [1, '세션 타임아웃은 최소 1분이어야 합니다.']
    },
    
    // 접근 로그
    accessLog: {
      enabled: {
        type: Boolean,
        default: true
      },
      retentionDays: {
        type: Number,
        default: 90,
        min: [1, '보관 기간은 최소 1일이어야 합니다.']
      }
    }
  },
  
  // 동기화 설정
  syncSettings: {
    // 외부 캘린더 동기화
    externalSync: {
      enabled: {
        type: Boolean,
        default: false
      },
      providers: [{
        name: {
          type: String,
          enum: ['google', 'outlook', 'apple', 'yahoo'],
          required: true
        },
        accountId: {
          type: String,
          required: true
        },
        calendarId: {
          type: String,
          required: true
        },
        syncDirection: {
          type: String,
          enum: ['oneway_in', 'oneway_out', 'bidirectional'],
          default: 'bidirectional'
        },
        lastSyncAt: Date,
        syncStatus: {
          type: String,
          enum: ['active', 'error', 'paused'],
          default: 'active'
        },
        errorMessage: String
      }]
    },
    
    // 실시간 동기화
    realtimeSync: {
      enabled: {
        type: Boolean,
        default: true
      },
      websocket: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['events', 'calendar', 'sharing']
        }]
      }
    }
  },
  
  // 알림 및 통지 설정
  notifications: {
    // 이메일 알림
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        eventReminders: {
          type: Boolean,
          default: true
        },
        sharingInvites: {
          type: Boolean,
          default: true
        },
        calendarUpdates: {
          type: Boolean,
          default: false
        },
        accessAttempts: {
          type: Boolean,
          default: false
        }
      },
      recipients: [{
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        name: {
          type: String,
          trim: true
        },
        types: [{
          type: String,
          enum: ['eventReminders', 'sharingInvites', 'calendarUpdates', 'accessAttempts']
        }]
      }]
    },
    
    // 푸시 알림
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      devices: [{
        deviceId: {
          type: String,
          required: true
        },
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
          required: true
        },
        token: {
          type: String,
          required: true
        },
        lastSeen: Date
      }]
    },
    
    // 웹훅
    webhooks: [{
      url: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: '웹훅 URL은 유효한 URL이어야 합니다.'
        }
      },
      events: [{
        type: String,
        enum: ['event.created', 'event.updated', 'event.deleted', 'calendar.shared', 'access.granted']
      }],
      secret: {
        type: String,
        trim: true
      },
      isActive: {
        type: Boolean,
        default: true
      },
      lastTriggered: Date,
      failureCount: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'deleted', 'shared', 'unshared', 'accessed', 'permission_changed']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true // createdAt, updatedAt 자동 관리
});

module.exports = model('Calendar', CalendarSchema); 