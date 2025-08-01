// Event(일정) 모델 (MongoDB/Mongoose)
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const NotificationSchema = new Schema({
  id: { type: String, required: true },
  minutesBefore: { type: Number, required: true },
  type: { type: String, required: true }
}, { _id: false });

const AttachmentSchema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number },
  mimetype: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const EventSchema = new Schema({
  id: { type: String, required: true, unique: true }, // UUID
  calendarId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['organizer', 'attendee', 'optional', 'resource'],
      default: 'attendee'
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'tentative', 'attended', 'no_show'],
      default: 'invited'
    },
    rsvp: {
      status: {
        type: String,
        enum: ['pending', 'yes', 'no', 'maybe'],
        default: 'pending'
      },
      respondedAt: Date,
      responseMessage: {
        type: String,
        trim: true,
        maxlength: 500
      }
    },
    comments: [{
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: Date,
      isPrivate: {
        type: Boolean,
        default: false
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }],
    preferences: {
      // 알림 설정
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        reminderTime: {
          type: Number, // 분 단위
          default: 15
        }
      },
      // 개인 설정
      timezone: {
        type: String,
        default: 'Asia/Seoul'
      },
      language: {
        type: String,
        default: 'ko'
      }
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastNotifiedAt: Date,
    attendanceHistory: [{
      status: {
        type: String,
        enum: ['attended', 'no_show', 'late', 'left_early'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 500
      },
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  attendeeStatus: { type: Object, default: {} },
  tags: [String],
  color: { type: String, default: '#1976d2' },
  allDay: { type: Boolean, default: false },
  recurrence: { type: String },
  notifications: [NotificationSchema],
  category: { type: String },
  attachments: [AttachmentSchema],
  // 위치 정보 및 지도 연동
  location: {
    // 기본 위치 정보
    address: {
      type: String,
      trim: true,
      maxlength: [500, '주소는 500자를 초과할 수 없습니다.']
    },
    name: {
      type: String,
      trim: true,
      maxlength: [200, '장소명은 200자를 초과할 수 없습니다.']
    },
    
    // 좌표 정보
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, '위도는 -90에서 90 사이여야 합니다.'],
        max: [90, '위도는 -90에서 90 사이여야 합니다.']
      },
      longitude: {
        type: Number,
        min: [-180, '경도는 -180에서 180 사이여야 합니다.'],
        max: [180, '경도는 -180에서 180 사이여야 합니다.']
      }
    },
    
    // 상세 위치 정보
    details: {
      building: {
        type: String,
        trim: true,
        maxlength: [100, '건물명은 100자를 초과할 수 없습니다.']
      },
      floor: {
        type: String,
        trim: true,
        maxlength: [20, '층수는 20자를 초과할 수 없습니다.']
      },
      room: {
        type: String,
        trim: true,
        maxlength: [50, '방번호는 50자를 초과할 수 없습니다.']
      },
      entrance: {
        type: String,
        trim: true,
        maxlength: [100, '출입구는 100자를 초과할 수 없습니다.']
      }
    },
    
    // 지도 관련 정보
    mapInfo: {
      placeId: {
        type: String,
        trim: true
      },
      formattedAddress: {
        type: String,
        trim: true
      },
      types: [{
        type: String,
        trim: true
      }],
      vicinity: {
        type: String,
        trim: true
      },
      rating: {
        type: Number,
        min: [0, '평점은 0 이상이어야 합니다.'],
        max: [5, '평점은 5 이하여야 합니다.']
      },
      userRatingsTotal: {
        type: Number,
        min: [0, '평점 개수는 0 이상이어야 합니다.']
      },
      photos: [{
        photoReference: {
          type: String,
          required: true
        },
        width: {
          type: Number,
          min: [1, '사진 너비는 1 이상이어야 합니다.']
        },
        height: {
          type: Number,
          min: [1, '사진 높이는 1 이상이어야 합니다.']
        },
        htmlAttributions: [{
          type: String
        }]
      }],
      openingHours: {
        openNow: {
          type: Boolean
        },
        periods: [{
          close: {
            day: {
              type: Number,
              min: [0, '요일은 0-6 사이여야 합니다.'],
              max: [6, '요일은 0-6 사이여야 합니다.']
            },
            time: {
              type: String,
              validate: {
                validator: function(v) {
                  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: '시간은 HH:MM 형식이어야 합니다.'
              }
            }
          },
          open: {
            day: {
              type: Number,
              min: [0, '요일은 0-6 사이여야 합니다.'],
              max: [6, '요일은 0-6 사이여야 합니다.']
            },
            time: {
              type: String,
              validate: {
                validator: function(v) {
                  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: '시간은 HH:MM 형식이어야 합니다.'
              }
            }
          }
        }],
        weekdayText: [{
          type: String,
          trim: true
        }]
      },
      priceLevel: {
        type: Number,
        min: [0, '가격 수준은 0-4 사이여야 합니다.'],
        max: [4, '가격 수준은 0-4 사이여야 합니다.']
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return /^https?:\/\/.+/.test(v);
          },
          message: '웹사이트는 유효한 URL이어야 합니다.'
        }
      },
      phoneNumber: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return /^[\+]?[0-9\s\-\(\)]+$/.test(v);
          },
          message: '전화번호는 유효한 형식이어야 합니다.'
        }
      }
    },
    
    // 교통 정보
    transportation: {
      parking: {
        available: {
          type: Boolean,
          default: false
        },
        type: {
          type: String,
          enum: ['free', 'paid', 'street', 'garage', 'lot'],
          default: 'free'
        },
        details: {
          type: String,
          trim: true,
          maxlength: [200, '주차 상세정보는 200자를 초과할 수 없습니다.']
        }
      },
      publicTransport: {
        subway: [{
          line: {
            type: String,
            trim: true
          },
          station: {
            type: String,
            trim: true
          },
          distance: {
            type: Number,
            min: [0, '거리는 0 이상이어야 합니다.']
          },
          walkingTime: {
            type: Number,
            min: [0, '도보 시간은 0 이상이어야 합니다.']
          }
        }],
        bus: [{
          line: {
            type: String,
            trim: true
          },
          stop: {
            type: String,
            trim: true
          },
          distance: {
            type: Number,
            min: [0, '거리는 0 이상이어야 합니다.']
          },
          walkingTime: {
            type: Number,
            min: [0, '도보 시간은 0 이상이어야 합니다.']
          }
        }]
      },
      directions: {
        driving: {
          duration: {
            type: Number,
            min: [0, '소요 시간은 0 이상이어야 합니다.']
          },
          distance: {
            type: Number,
            min: [0, '거리는 0 이상이어야 합니다.']
          },
          route: {
            type: String,
            trim: true
          }
        },
        walking: {
          duration: {
            type: Number,
            min: [0, '소요 시간은 0 이상이어야 합니다.']
          },
          distance: {
            type: Number,
            min: [0, '거리는 0 이상이어야 합니다.']
          },
          route: {
            type: String,
            trim: true
          }
        },
        transit: {
          duration: {
            type: Number,
            min: [0, '소요 시간은 0 이상이어야 합니다.']
          },
          distance: {
            type: Number,
            min: [0, '거리는 0 이상이어야 합니다.']
          },
          route: {
            type: String,
            trim: true
          }
        }
      }
    },
    
    // 위치 검증 및 메타데이터
    validation: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      confidence: {
        type: Number,
        min: [0, '신뢰도는 0 이상이어야 합니다.'],
        max: [1, '신뢰도는 1 이하여야 합니다.'],
        default: 0
      }
    },
    
    // 위치 히스토리
    history: [{
      address: {
        type: String,
        required: true
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  // 초대 관리
  invitations: {
    // 초대 설정
    settings: {
      allowGuests: {
        type: Boolean,
        default: false
      },
      maxAttendees: {
        type: Number,
        min: [1, '최소 1명 이상이어야 합니다.'],
        max: [1000, '최대 1000명까지 가능합니다.']
      },
      requireRSVP: {
        type: Boolean,
        default: true
      },
      rsvpDeadline: {
        type: Date,
        validate: {
          validator: function(v) {
            return !v || v > new Date();
          },
          message: 'RSVP 마감일은 현재 시간보다 이후여야 합니다.'
        }
      },
      autoAccept: {
        type: Boolean,
        default: false
      },
      allowComments: {
        type: Boolean,
        default: true
      },
      allowPrivateComments: {
        type: Boolean,
        default: false
      }
    },
    
    // 초대 메시지
    message: {
      subject: {
        type: String,
        trim: true,
        maxlength: 200
      },
      body: {
        type: String,
        trim: true,
        maxlength: 2000
      },
      template: {
        type: String,
        enum: ['default', 'formal', 'casual', 'urgent', 'custom'],
        default: 'default'
      }
    },
    
    // 초대 발송 기록
    sentInvitations: [{
      attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: {
        type: String,
        required: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      method: {
        type: String,
        enum: ['email', 'push', 'sms', 'in_app'],
        default: 'email'
      },
      status: {
        type: String,
        enum: ['sent', 'delivered', 'opened', 'clicked', 'failed'],
        default: 'sent'
      },
      errorMessage: String,
      trackingId: String
    }],
    
    // 초대 응답 통계
    statistics: {
      totalInvited: {
        type: Number,
        default: 0
      },
      accepted: {
        type: Number,
        default: 0
      },
      declined: {
        type: Number,
        default: 0
      },
      tentative: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      },
      attended: {
        type: Number,
        default: 0
      },
      noShow: {
        type: Number,
        default: 0
      },
      responseRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    }
  },
  // 참석자 그룹 관리
  attendeeGroups: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['department', 'team', 'project', 'role', 'custom'],
      required: true
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: String,
      name: String,
      role: {
        type: String,
        enum: ['member', 'leader', 'observer'],
        default: 'member'
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    permissions: {
      canInvite: {
        type: Boolean,
        default: false
      },
      canManage: {
        type: Boolean,
        default: false
      },
      canViewAll: {
        type: Boolean,
        default: true
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  // 참석자 피드백 및 평가
  feedback: {
    enabled: {
      type: Boolean,
      default: false
    },
    questions: [{
      question: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['text', 'rating', 'multiple_choice', 'yes_no'],
        required: true
      },
      options: [{
        type: String,
        trim: true
      }],
      required: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    responses: [{
      attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      answers: [{
        questionIndex: {
          type: Number,
          required: true
        },
        answer: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        submittedAt: {
          type: Date,
          default: Date.now
        }
      }],
      submittedAt: {
        type: Date,
        default: Date.now
      },
      isAnonymous: {
        type: Boolean,
        default: false
      }
    }]
  },
}, {
  timestamps: true // createdAt, updatedAt 자동 관리
});

module.exports = model('Event', EventSchema); 