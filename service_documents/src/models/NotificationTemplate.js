/**
 * NotificationTemplate Model - 알림 템플릿 데이터 모델
 * Mongoose를 사용한 알림 템플릿 스키마 정의
 * 
 * @description
 * - 다양한 알림 유형별 템플릿 관리
 * - 다중 채널 지원 (이메일, 푸시, 슬랙 등)
 * - 변수 치환 및 동적 콘텐츠 지원
 * - 다국어 지원 및 지역화
 * - 템플릿 버전 관리 및 이력 추적
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 알림 템플릿 스키마 정의
 * 알림 템플릿의 모든 속성과 관계를 정의하는 Mongoose 스키마
 */
const notificationTemplateSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 템플릿 기본 정보
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

  // 템플릿 유형
  type: {
    type: String,
    required: [true, '템플릿 유형은 필수입니다.'],
    enum: {
      values: [
        // 문서 관련 템플릿
        'document_created',        // 문서 생성
        'document_updated',        // 문서 수정
        'document_deleted',        // 문서 삭제
        'document_shared',         // 문서 공유
        'document_approved',       // 문서 승인
        'document_rejected',       // 문서 반려
        'document_commented',      // 문서 코멘트
        'document_tagged',         // 문서 태그
        
        // 협업 관련 템플릿
        'collaboration_invite',    // 협업 초대
        'collaboration_join',      // 협업 참여
        'collaboration_leave',     // 협업 나가기
        'real_time_edit',         // 실시간 편집
        
        // 승인 관련 템플릿
        'approval_request',        // 승인 요청
        'approval_approved',       // 승인 완료
        'approval_rejected',       // 승인 반려
        'approval_delegated',      // 승인 위임
        
        // 시스템 템플릿
        'system_maintenance',      // 시스템 점검
        'system_update',          // 시스템 업데이트
        'security_alert',         // 보안 경고
        'backup_complete',        // 백업 완료
        
        // 사용자 관련 템플릿
        'user_registered',        // 사용자 등록
        'user_login',             // 로그인
        'user_logout',            // 로그아웃
        'password_changed',       // 비밀번호 변경
        
        // 기타 템플릿
        'general',                // 일반 알림
        'reminder',               // 리마인더
        'announcement',           // 공지사항
        'custom'                  // 사용자 정의
      ],
      message: '유효하지 않은 템플릿 유형입니다.'
    },
    index: true
  },

  // 템플릿 카테고리
  category: {
    type: String,
    required: [true, '템플릿 카테고리는 필수입니다.'],
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
      message: '유효하지 않은 템플릿 카테고리입니다.'
    },
    index: true
  },

  // 언어 및 지역화
  language: {
    type: String,
    required: [true, '언어는 필수입니다.'],
    default: 'ko',
    enum: {
      values: ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'],
      message: '지원하지 않는 언어입니다.'
    },
    index: true
  },

  locale: {
    type: String,
    default: 'ko-KR',
    trim: true
  },

  // 템플릿 상태
  status: {
    type: String,
    required: [true, '템플릿 상태는 필수입니다.'],
    enum: {
      values: ['draft', 'active', 'inactive', 'archived'],
      message: '유효하지 않은 템플릿 상태입니다.'
    },
    default: 'draft',
    index: true
  },

  // 템플릿 버전
  version: {
    type: Number,
    required: [true, '템플릿 버전은 필수입니다.'],
    min: [1, '버전은 1 이상이어야 합니다.'],
    default: 1
  },

  // 채널별 템플릿 콘텐츠
  channels: {
    email: {
      subject: {
        type: String,
        required: [true, '이메일 제목은 필수입니다.'],
        trim: true,
        maxlength: [200, '이메일 제목은 200자를 초과할 수 없습니다.']
      },
      body: {
        type: String,
        required: [true, '이메일 본문은 필수입니다.'],
        maxlength: [10000, '이메일 본문은 10,000자를 초과할 수 없습니다.']
      },
      htmlBody: {
        type: String,
        maxlength: [20000, 'HTML 이메일 본문은 20,000자를 초과할 수 없습니다.']
      },
      fromName: {
        type: String,
        trim: true,
        maxlength: [100, '발신자 이름은 100자를 초과할 수 없습니다.']
      },
      fromEmail: {
        type: String,
        trim: true,
        lowercase: true
      },
      replyTo: {
        type: String,
        trim: true,
        lowercase: true
      }
    },
    
    push: {
      title: {
        type: String,
        required: [true, '푸시 알림 제목은 필수입니다.'],
        trim: true,
        maxlength: [100, '푸시 알림 제목은 100자를 초과할 수 없습니다.']
      },
      body: {
        type: String,
        required: [true, '푸시 알림 본문은 필수입니다.'],
        trim: true,
        maxlength: [500, '푸시 알림 본문은 500자를 초과할 수 없습니다.']
      },
      imageUrl: {
        type: String,
        trim: true
      },
      actionUrl: {
        type: String,
        trim: true
      },
      badge: {
        type: Number,
        min: [0, '배지는 0 이상이어야 합니다.']
      },
      sound: {
        type: String,
        trim: true
      }
    },
    
    slack: {
      channel: {
        type: String,
        trim: true
      },
      text: {
        type: String,
        required: [true, '슬랙 메시지는 필수입니다.'],
        maxlength: [3000, '슬랙 메시지는 3,000자를 초과할 수 없습니다.']
      },
      blocks: {
        type: mongoose.Schema.Types.Mixed
      },
      attachments: [{
        title: String,
        text: String,
        color: String,
        fields: [{
          title: String,
          value: String,
          short: Boolean
        }]
      }]
    },
    
    sms: {
      message: {
        type: String,
        required: [true, 'SMS 메시지는 필수입니다.'],
        trim: true,
        maxlength: [160, 'SMS 메시지는 160자를 초과할 수 없습니다.']
      }
    },
    
    in_app: {
      title: {
        type: String,
        required: [true, '앱 내 알림 제목은 필수입니다.'],
        trim: true,
        maxlength: [100, '앱 내 알림 제목은 100자를 초과할 수 없습니다.']
      },
      message: {
        type: String,
        required: [true, '앱 내 알림 메시지는 필수입니다.'],
        trim: true,
        maxlength: [500, '앱 내 알림 메시지는 500자를 초과할 수 없습니다.']
      },
      actionUrl: {
        type: String,
        trim: true
      },
      icon: {
        type: String,
        trim: true
      }
    }
  },

  // 변수 정의
  variables: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
      default: 'string'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed
    },
    validation: {
      pattern: String,
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number
    }
  }],

  // 조건부 로직
  conditions: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    },
    action: {
      type: String,
      enum: ['show', 'hide', 'modify'],
      required: true
    },
    modification: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // 스타일링 및 브랜딩
  styling: {
    primaryColor: {
      type: String,
      trim: true
    },
    secondaryColor: {
      type: String,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    fontFamily: {
      type: String,
      trim: true
    },
    fontSize: {
      type: String,
      trim: true
    }
  },

  // 메타데이터
  metadata: {
    author: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    category: {
      type: String,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedSendTime: {
      type: Number, // 초 단위
      default: 5
    }
  },

  // 사용 통계
  usage: {
    totalSent: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date
    },
    averageDeliveryTime: {
      type: Number, // 밀리초 단위
      default: 0
    }
  },

  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'activate', 'deactivate', 'archive', 'delete'],
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
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
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

  createdBy: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },

  updatedBy: {
    type: String,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정 (성능 최적화)
notificationTemplateSchema.index({ type: 1, language: 1, status: 1 });
notificationTemplateSchema.index({ category: 1, status: 1 });
notificationTemplateSchema.index({ createdBy: 1, createdAt: -1 });
notificationTemplateSchema.index({ 'usage.totalSent': -1 });

// 가상 필드
notificationTemplateSchema.virtual('successRate').get(function() {
  if (this.usage.totalSent === 0) return 0;
  return (this.usage.successCount / this.usage.totalSent) * 100;
});

notificationTemplateSchema.virtual('failureRate').get(function() {
  if (this.usage.totalSent === 0) return 0;
  return (this.usage.failureCount / this.usage.totalSent) * 100;
});

notificationTemplateSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

notificationTemplateSchema.virtual('isDraft').get(function() {
  return this.status === 'draft';
});

// 미들웨어
notificationTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

notificationTemplateSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 정적 메서드
notificationTemplateSchema.statics.findByType = function(type, options = {}) {
  const query = this.find({ type, status: 'active' });
  
  if (options.language) {
    query.where('language', options.language);
  }
  
  if (options.category) {
    query.where('category', options.category);
  }
  
  return query.sort({ version: -1 });
};

notificationTemplateSchema.statics.findActive = function(options = {}) {
  const query = this.find({ status: 'active' });
  
  if (options.type) {
    query.where('type', options.type);
  }
  
  if (options.language) {
    query.where('language', options.language);
  }
  
  if (options.category) {
    query.where('category', options.category);
  }
  
  return query.sort({ 'usage.totalSent': -1 });
};

notificationTemplateSchema.statics.findByAuthor = function(authorId, options = {}) {
  const query = this.find({ createdBy: authorId });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  return query.sort({ createdAt: -1 });
};

// 인스턴스 메서드
notificationTemplateSchema.methods.activate = function(userId, userName) {
  this.status = 'active';
  this.updatedBy = userId;
  this.addAuditLog('activate', userId, userName, '템플릿 활성화');
  return this.save();
};

notificationTemplateSchema.methods.deactivate = function(userId, userName) {
  this.status = 'inactive';
  this.updatedBy = userId;
  this.addAuditLog('deactivate', userId, userName, '템플릿 비활성화');
  return this.save();
};

notificationTemplateSchema.methods.archive = function(userId, userName) {
  this.status = 'archived';
  this.updatedBy = userId;
  this.addAuditLog('archive', userId, userName, '템플릿 보관');
  return this.save();
};

notificationTemplateSchema.methods.incrementUsage = function(success = true, deliveryTime = 0) {
  this.usage.totalSent += 1;
  this.usage.lastUsedAt = new Date();
  
  if (success) {
    this.usage.successCount += 1;
  } else {
    this.usage.failureCount += 1;
  }
  
  // 평균 전송 시간 업데이트
  if (deliveryTime > 0) {
    const currentAvg = this.usage.averageDeliveryTime;
    const totalSent = this.usage.totalSent;
    this.usage.averageDeliveryTime = ((currentAvg * (totalSent - 1)) + deliveryTime) / totalSent;
  }
  
  return this.save();
};

notificationTemplateSchema.methods.addAuditLog = function(action, userId, userName, details = '', changes = null) {
  this.auditLog.push({
    action,
    userId,
    userName,
    timestamp: new Date(),
    details,
    changes
  });
  return this.save();
};

notificationTemplateSchema.methods.validateVariables = function(variables) {
  const errors = [];
  
  // 필수 변수 확인
  for (const requiredVar of this.variables.filter(v => v.required)) {
    if (!variables[requiredVar.name]) {
      errors.push(`필수 변수 '${requiredVar.name}'이(가) 누락되었습니다.`);
    }
  }
  
  // 변수 타입 및 유효성 검사
  for (const [name, value] of Object.entries(variables)) {
    const varDef = this.variables.find(v => v.name === name);
    if (varDef) {
      // 타입 검사
      if (varDef.type === 'number' && typeof value !== 'number') {
        errors.push(`변수 '${name}'은(는) 숫자 타입이어야 합니다.`);
      }
      
      // 길이 검사
      if (varDef.validation) {
        if (varDef.validation.minLength && value.length < varDef.validation.minLength) {
          errors.push(`변수 '${name}'은(는) 최소 ${varDef.validation.minLength}자 이상이어야 합니다.`);
        }
        if (varDef.validation.maxLength && value.length > varDef.validation.maxLength) {
          errors.push(`변수 '${name}'은(는) 최대 ${varDef.validation.maxLength}자 이하여야 합니다.`);
        }
      }
    }
  }
  
  return errors;
};

notificationTemplateSchema.methods.renderTemplate = function(channel, variables = {}) {
  // 변수 유효성 검사
  const validationErrors = this.validateVariables(variables);
  if (validationErrors.length > 0) {
    throw new Error(`템플릿 변수 검증 실패: ${validationErrors.join(', ')}`);
  }
  
  const channelTemplate = this.channels[channel];
  if (!channelTemplate) {
    throw new Error(`채널 '${channel}'에 대한 템플릿이 정의되지 않았습니다.`);
  }
  
  // 변수 치환 함수
  const replaceVariables = (text) => {
    if (!text) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
  };
  
  // 채널별 렌더링
  const rendered = {};
  
  switch (channel) {
    case 'email':
      rendered.subject = replaceVariables(channelTemplate.subject);
      rendered.body = replaceVariables(channelTemplate.body);
      if (channelTemplate.htmlBody) {
        rendered.htmlBody = replaceVariables(channelTemplate.htmlBody);
      }
      break;
      
    case 'push':
      rendered.title = replaceVariables(channelTemplate.title);
      rendered.body = replaceVariables(channelTemplate.body);
      break;
      
    case 'slack':
      rendered.text = replaceVariables(channelTemplate.text);
      if (channelTemplate.blocks) {
        rendered.blocks = JSON.parse(replaceVariables(JSON.stringify(channelTemplate.blocks)));
      }
      break;
      
    case 'sms':
      rendered.message = replaceVariables(channelTemplate.message);
      break;
      
    case 'in_app':
      rendered.title = replaceVariables(channelTemplate.title);
      rendered.message = replaceVariables(channelTemplate.message);
      break;
      
    default:
      throw new Error(`지원하지 않는 채널: ${channel}`);
  }
  
  return rendered;
};

// 모델 생성 및 내보내기
const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

export default NotificationTemplate; 