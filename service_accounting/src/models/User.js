const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 사용자 스키마 - 세무 서비스 전용 사용자 정보
 * 플랫폼 통합 인증과 연동되며, 세무 서비스 특화 정보를 관리
 */
const userSchema = new mongoose.Schema({
  // 플랫폼 통합 정보
  platformUserId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: '플랫폼 통합 사용자 ID'
  },
  
  // 기본 정보
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    comment: '사용자 이메일'
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    comment: '사용자 이름'
  },
  
  phone: {
    type: String,
    trim: true,
    comment: '연락처'
  },
  
  // 세무 서비스 특화 정보
  businessInfo: {
    businessNumber: {
      type: String,
      trim: true,
      comment: '사업자등록번호'
    },
    companyName: {
      type: String,
      trim: true,
      comment: '회사명'
    },
    businessType: {
      type: String,
      enum: ['개인사업자', '법인사업자', '비영리법인', '기타'],
      comment: '사업자 유형'
    },
    businessCategory: {
      type: String,
      comment: '업종'
    },
    address: {
      type: String,
      comment: '사업장 주소'
    },
    representative: {
      type: String,
      comment: '대표자명'
    },
    establishmentDate: {
      type: Date,
      comment: '설립일'
    }
  },
  
  // 세무 관련 설정
  taxSettings: {
    taxYear: {
      type: Number,
      default: new Date().getFullYear(),
      comment: '기준 세무연도'
    },
    accountingMethod: {
      type: String,
      enum: ['복식부기', '단식부기'],
      default: '복식부기',
      comment: '회계처리방법'
    },
    vatMethod: {
      type: String,
      enum: ['일반과세자', '간이과세자', '면세사업자'],
      default: '일반과세자',
      comment: '부가세 과세방법'
    },
    autoBackup: {
      type: Boolean,
      default: true,
      comment: '자동 백업 여부'
    },
    notificationSettings: {
      taxDeadline: {
        type: Boolean,
        default: true,
        comment: '세무 신고 기한 알림'
      },
      paymentReminder: {
        type: Boolean,
        default: true,
        comment: '납부 기한 알림'
      },
      auditNotice: {
        type: Boolean,
        default: true,
        comment: '세무조사 알림'
      }
    }
  },
  
  // 권한 및 역할
  role: {
    type: String,
    enum: ['owner', 'admin', 'accountant', 'employee', 'viewer'],
    default: 'owner',
    comment: '사용자 역할'
  },
  
  permissions: [{
    type: String,
    enum: [
      'read_accounting',
      'write_accounting',
      'read_tax',
      'write_tax',
      'read_payroll',
      'write_payroll',
      'read_reports',
      'write_reports',
      'manage_users',
      'manage_settings',
      'export_data',
      'import_data'
    ],
    comment: '세부 권한 목록'
  }],
  
  // 구독 정보
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic',
      comment: '구독 플랜'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active',
      comment: '구독 상태'
    },
    startDate: {
      type: Date,
      default: Date.now,
      comment: '구독 시작일'
    },
    endDate: {
      type: Date,
      comment: '구독 종료일'
    },
    features: [{
      type: String,
      comment: '활성화된 기능 목록'
    }]
  },
  
  // 조직 정보 (다중 조직 지원)
  organizations: [{
    organizationId: {
      type: String,
      required: true,
      comment: '조직 ID'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
      comment: '조직 내 역할'
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      comment: '조직 가입일'
    }
  }],
  
  // 보안 설정
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      comment: '2단계 인증 활성화'
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
      comment: '마지막 비밀번호 변경일'
    },
    loginHistory: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      ip: String,
      userAgent: String,
      success: Boolean
    }]
  },
  
  // 상태 정보
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active',
    comment: '사용자 상태'
  },
  
  // 메타데이터
  lastLoginAt: {
    type: Date,
    comment: '마지막 로그인 시간'
  },
  
  preferences: {
    language: {
      type: String,
      default: 'ko',
      enum: ['ko', 'en'],
      comment: '언어 설정'
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul',
      comment: '시간대 설정'
    },
    currency: {
      type: String,
      default: 'KRW',
      comment: '통화 설정'
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ platformUserId: 1 });
userSchema.index({ 'businessInfo.businessNumber': 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ status: 1 });

// 가상 필드
userSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.subscription.status === 'active';
});

userSchema.virtual('hasPermission').get(function() {
  return (permission) => this.permissions.includes(permission);
});

// 인스턴스 메서드
userSchema.methods.updateLastLogin = function(ip, userAgent) {
  this.lastLoginAt = new Date();
  this.security.loginHistory.push({
    timestamp: new Date(),
    ip,
    userAgent,
    success: true
  });
  
  // 로그인 히스토리 최대 50개 유지
  if (this.security.loginHistory.length > 50) {
    this.security.loginHistory = this.security.loginHistory.slice(-50);
  }
  
  return this.save();
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.isInOrganization = function(organizationId) {
  return this.organizations.some(org => org.organizationId === organizationId);
};

// 정적 메서드
userSchema.statics.findByBusinessNumber = function(businessNumber) {
  return this.findOne({ 'businessInfo.businessNumber': businessNumber });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({
    status: 'active',
    'subscription.status': 'active'
  });
};

// 미들웨어
userSchema.pre('save', function(next) {
  // 이메일 소문자 변환
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  
  // 비즈니스 번호 정리
  if (this.isModified('businessInfo.businessNumber')) {
    this.businessInfo.businessNumber = this.businessInfo.businessNumber.replace(/[^0-9]/g, '');
  }
  
  next();
});

// JSON 변환 시 가상 필드 포함
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 