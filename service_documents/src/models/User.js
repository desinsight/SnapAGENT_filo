/**
 * User Model - 사용자 데이터 모델
 * Mongoose를 사용한 사용자 스키마 정의
 * 
 * @description
 * - 사용자 기본 정보 (이름, 이메일, 비밀번호 등)
 * - 인증 및 보안 설정
 * - 권한 및 역할 관리
 * - 프로필 정보 및 설정
 * - 활동 이력 및 통계
 * - 조직 및 부서 정보
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 사용자 스키마 정의
 * 사용자의 모든 속성과 관계를 정의하는 Mongoose 스키마
 */
const userSchema = new mongoose.Schema({
  // 기본 식별자
  _id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },

  // 기본 정보
  username: {
    type: String,
    required: [true, '사용자명은 필수입니다.'],
    unique: true,
    trim: true,
    minlength: [3, '사용자명은 3자 이상이어야 합니다.'],
    maxlength: [30, '사용자명은 30자를 초과할 수 없습니다.']
  },

  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '유효한 이메일 주소를 입력해주세요.'
    ]
  },

  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [8, '비밀번호는 8자 이상이어야 합니다.']
  },

  // 프로필 정보
  profile: {
    firstName: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
      maxlength: [50, '이름은 50자를 초과할 수 없습니다.']
    },

    lastName: {
      type: String,
      required: [true, '성은 필수입니다.'],
      trim: true,
      maxlength: [50, '성은 50자를 초과할 수 없습니다.']
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: [100, '표시명은 100자를 초과할 수 없습니다.']
    },

    avatar: {
      type: String,
      default: null
    },

    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        '유효한 전화번호를 입력해주세요.'
      ]
    },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'KR'
      }
    },

    bio: {
      type: String,
      maxlength: [500, '자기소개는 500자를 초과할 수 없습니다.']
    },

    dateOfBirth: {
      type: Date
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },

    language: {
      type: String,
      default: 'ko',
      enum: ['ko', 'en', 'zh', 'ja']
    },

    timezone: {
      type: String,
      default: 'Asia/Seoul'
    }
  },

  // 조직 정보
  organization: {
    id: {
      type: String,
      ref: 'Organization',
      index: true
    },

    name: {
      type: String,
      trim: true
    },

    department: {
      type: String,
      trim: true
    },

    position: {
      type: String,
      trim: true
    },

    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    joinDate: {
      type: Date,
      default: Date.now
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },

  // 권한 및 역할
  roles: [{
    type: String,
    enum: [
      'admin',           // 관리자
      'manager',         // 매니저
      'editor',          // 편집자
      'viewer',          // 조회자
      'approver',        // 승인자
      'user'             // 일반 사용자
    ],
    default: 'user'
  }],

  permissions: [{
    resource: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve', 'share']
    }]
  }],

  // 계정 상태
  status: {
    type: String,
    required: [true, '계정 상태는 필수입니다.'],
    enum: {
      values: [
        'active',         // 활성
        'inactive',       // 비활성
        'suspended',      // 정지
        'pending',        // 대기
        'deleted'         // 삭제
      ],
      message: '유효하지 않은 계정 상태입니다.'
    },
    default: 'pending',
    index: true
  },

  // 인증 관련
  auth: {
    emailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: {
      type: String
    },

    emailVerificationExpires: {
      type: Date
    },

    passwordResetToken: {
      type: String
    },

    passwordResetExpires: {
      type: Date
    },

    lastLoginAt: {
      type: Date
    },

    lastLoginIp: {
      type: String
    },

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    twoFactorSecret: {
      type: String
    },

    twoFactorBackupCodes: [{
      type: String
    }]
  },

  // 설정
  settings: {
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
      }
    },

    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'organization', 'department', 'private'],
        default: 'organization'
      },
      activityVisibility: {
        type: String,
        enum: ['public', 'organization', 'department', 'private'],
        default: 'organization'
      }
    },

    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      language: {
        type: String,
        default: 'ko'
      },
      timezone: {
        type: String,
        default: 'Asia/Seoul'
      },
      dateFormat: {
        type: String,
        default: 'YYYY-MM-DD'
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '24h'
      }
    }
  },

  // 활동 통계
  stats: {
    documentsCreated: {
      type: Number,
      default: 0
    },

    documentsEdited: {
      type: Number,
      default: 0
    },

    documentsViewed: {
      type: Number,
      default: 0
    },

    templatesCreated: {
      type: Number,
      default: 0
    },

    templatesUsed: {
      type: Number,
      default: 0
    },

    approvalsGiven: {
      type: Number,
      default: 0
    },

    approvalsReceived: {
      type: Number,
      default: 0
    },

    lastActivityAt: {
      type: Date
    }
  },

  // 활동 이력
  activityLog: [{
    action: {
      type: String,
      required: true,
      enum: [
        'login', 'logout', 'password_change', 'profile_update',
        'document_create', 'document_edit', 'document_view',
        'template_create', 'template_use', 'approval_give',
        'approval_receive', 'permission_change'
      ]
    },
    resource: {
      type: String
    },
    resourceId: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // 메타데이터
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  createdBy: {
    type: String,
    ref: 'User'
  },

  updatedBy: {
    type: String,
    ref: 'User'
  }

}, {
  // 스키마 옵션
  timestamps: true,
  collection: 'users',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 인덱스 설정
 */
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'organization.id': 1 });
userSchema.index({ 'organization.employeeId': 1 });
userSchema.index({ status: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.lastActivityAt': -1 });

/**
 * 가상 필드
 */

// 전체 이름
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// 표시명 (표시명이 있으면 표시명, 없으면 전체 이름)
userSchema.virtual('displayName').get(function() {
  return this.profile.displayName || this.fullName;
});

// 사용자 URL
userSchema.virtual('url').get(function() {
  return `/api/v1/users/${this._id}`;
});

// 프로필 URL
userSchema.virtual('profileUrl').get(function() {
  return `/api/v1/users/${this._id}/profile`;
});

// 아바타 URL
userSchema.virtual('avatarUrl').get(function() {
  if (this.profile.avatar) {
    return `/uploads/avatars/${this.profile.avatar}`;
  }
  return null;
});

// 계정 잠금 여부
userSchema.virtual('isLocked').get(function() {
  return !!(this.auth.lockUntil && this.auth.lockUntil > Date.now());
});

// 계정 활성화 여부
userSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isLocked;
});

// 관리자 여부
userSchema.virtual('isAdmin').get(function() {
  return this.roles.includes('admin');
});

// 매니저 여부
userSchema.virtual('isManager').get(function() {
  return this.roles.includes('manager') || this.roles.includes('admin');
});

// 승인자 여부
userSchema.virtual('isApprover').get(function() {
  return this.roles.includes('approver') || this.roles.includes('manager') || this.roles.includes('admin');
});

/**
 * 미들웨어
 */

// 저장 전 미들웨어
userSchema.pre('save', async function(next) {
  // 업데이트 시간 설정
  this.updatedAt = new Date();
  
  // 비밀번호 해싱
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  // 표시명 자동 설정
  if (!this.profile.displayName) {
    this.profile.displayName = this.fullName;
  }
  
  next();
});

// 저장 후 미들웨어
userSchema.post('save', function(doc) {
  // Elasticsearch 인덱싱 (비동기)
  if (process.env.ENABLE_ELASTICSEARCH === 'true') {
    const { indexDocument } = require('../config/elasticsearch.js');
    indexDocument(doc.toObject()).catch(err => {
      console.error('Elasticsearch 인덱싱 실패:', err);
    });
  }
});

/**
 * 인스턴스 메서드
 */

// 비밀번호 검증
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('비밀번호 검증 중 오류가 발생했습니다.');
  }
};

// 로그인 시도 증가
userSchema.methods.incLoginAttempts = function() {
  // 잠금 해제 시간이 지났으면 초기화
  if (this.auth.lockUntil && this.auth.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'auth.lockUntil': 1 },
      $set: { 'auth.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'auth.loginAttempts': 1 } };
  
  // 5번 실패 시 계정 잠금 (15분)
  if (this.auth.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'auth.lockUntil': Date.now() + 15 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// 로그인 성공 시 초기화
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'auth.lockUntil': 1, 'auth.loginAttempts': 1 }
  });
};

// 이메일 인증 토큰 생성
userSchema.methods.generateEmailVerificationToken = function() {
  const token = uuidv4();
  this.auth.emailVerificationToken = token;
  this.auth.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24시간
  return this.save();
};

// 비밀번호 재설정 토큰 생성
userSchema.methods.generatePasswordResetToken = function() {
  const token = uuidv4();
  this.auth.passwordResetToken = token;
  this.auth.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1시간
  return this.save();
};

// 권한 확인
userSchema.methods.hasPermission = function(resource, action) {
  // 관리자는 모든 권한 보유
  if (this.isAdmin) return true;
  
  // 특정 권한 확인
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

// 역할 확인
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

// 활동 로그 추가
userSchema.methods.addActivityLog = function(action, details = {}) {
  this.activityLog.push({
    action,
    details,
    timestamp: new Date()
  });
  
  // 활동 로그는 최대 1000개까지만 유지
  if (this.activityLog.length > 1000) {
    this.activityLog = this.activityLog.slice(-1000);
  }
  
  // 마지막 활동 시간 업데이트
  this.stats.lastActivityAt = new Date();
  
  return this.save();
};

// 통계 업데이트
userSchema.methods.updateStats = function(statType, increment = 1) {
  const update = {};
  update[`stats.${statType}`] = increment;
  update['stats.lastActivityAt'] = new Date();
  
  return this.updateOne({ $inc: update });
};

/**
 * 정적 메서드
 */

// 사용자 검색
userSchema.statics.search = function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    filters = {}
  } = options;

  const skip = (page - 1) * limit;
  
  let searchQuery = this.find();
  
  // 텍스트 검색
  if (query) {
    searchQuery = searchQuery.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'profile.firstName': { $regex: query, $options: 'i' } },
        { 'profile.lastName': { $regex: query, $options: 'i' } },
        { 'profile.displayName': { $regex: query, $options: 'i' } }
      ]
    });
  }
  
  // 필터 적용
  if (filters.status) {
    searchQuery = searchQuery.where('status', filters.status);
  }
  if (filters.role) {
    searchQuery = searchQuery.where('roles', filters.role);
  }
  if (filters.organization) {
    searchQuery = searchQuery.where('organization.id', filters.organization);
  }
  if (filters.department) {
    searchQuery = searchQuery.where('organization.department', filters.department);
  }
  
  return searchQuery
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-password -auth');
};

// 사용자 통계
userSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        byRole: { $push: '$roles' },
        byDepartment: { $push: '$organization.department' }
      }
    }
  ]);
};

// 활성 사용자 조회
userSchema.statics.getActiveUsers = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.lastActivityAt': -1 })
    .limit(limit)
    .select('username profile stats');
};

// 모델 생성 및 내보내기
const User = mongoose.model('User', userSchema);

export default User; 