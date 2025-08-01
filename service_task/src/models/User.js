/**
 * User Model - 사용자 모델
 * 개인 사용자와 조직 멤버를 모두 지원하는 통합 사용자 시스템
 * 
 * @description
 * - 사용자 CRUD 기능
 * - 인증 및 권한 관리
 * - 개인 설정 및 프로필
 * - 조직 멤버십 관리
 * - 활동 추적 및 통계
 * - 알림 설정
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '../config/logger.js';

/**
 * 사용자 스키마 정의
 */
const userSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: [true, '이름은 필수입니다.'],
    trim: true,
    maxlength: [50, '이름은 50자를 초과할 수 없습니다.']
  },
  
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요.']
  },
  
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.']
  },
  
  // 프로필 정보
  profile: {
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [200, '자기소개는 200자를 초과할 수 없습니다.']
    },
    phone: {
      type: String,
      match: [/^[0-9-+\s()]+$/, '유효한 전화번호를 입력해주세요.']
    },
    location: {
      city: String,
      country: String,
      timezone: {
        type: String,
        default: 'Asia/Seoul'
      }
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, '유효한 웹사이트 URL을 입력해주세요.']
    },
    social: {
      github: String,
      linkedin: String,
      twitter: String
    },
    skills: [String],
    interests: [String],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native'],
        default: 'intermediate'
      }
    }]
  },
  
  // 계정 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  
  // 이메일 인증
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // 비밀번호 재설정
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // 2단계 인증
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  },
  
  // 로그인 정보
  lastLoginAt: Date,
  lastLoginIp: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // 개인 설정
  preferences: {
    // 언어 및 지역
    language: {
      type: String,
      enum: ['ko', 'en', 'ja', 'zh'],
      default: 'ko'
    },
    dateFormat: {
      type: String,
      enum: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
      default: 'YYYY-MM-DD'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '24h'
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
    },
    
    // 테마 및 UI
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    sidebarCollapsed: {
      type: Boolean,
      default: false
    },
    
    // 작업 설정
    defaultTaskView: {
      type: String,
      enum: ['list', 'board', 'calendar', 'timeline'],
      default: 'list'
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    showCompletedTasks: {
      type: Boolean,
      default: true
    },
    taskSortOrder: {
      type: String,
      enum: ['dueDate', 'priority', 'createdAt', 'title'],
      default: 'dueDate'
    },
    
    // 알림 설정
    notifications: {
      email: {
        taskAssigned: {
          type: Boolean,
          default: true
        },
        taskDue: {
          type: Boolean,
          default: true
        },
        taskOverdue: {
          type: Boolean,
          default: true
        },
        projectUpdates: {
          type: Boolean,
          default: true
        },
        teamActivity: {
          type: Boolean,
          default: false
        },
        weeklyDigest: {
          type: Boolean,
          default: true
        }
      },
      push: {
        taskAssigned: {
          type: Boolean,
          default: true
        },
        taskDue: {
          type: Boolean,
          default: true
        },
        taskOverdue: {
          type: Boolean,
          default: true
        },
        projectUpdates: {
          type: Boolean,
          default: true
        },
        teamActivity: {
          type: Boolean,
          default: false
        }
      },
      inApp: {
        taskAssigned: {
          type: Boolean,
          default: true
        },
        taskDue: {
          type: Boolean,
          default: true
        },
        taskOverdue: {
          type: Boolean,
          default: true
        },
        projectUpdates: {
          type: Boolean,
          default: true
        },
        teamActivity: {
          type: Boolean,
          default: true
        }
      }
    },
    
    // 개인정보 보호
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'team', 'organization', 'private'],
        default: 'team'
      },
      activityVisibility: {
        type: String,
        enum: ['public', 'team', 'organization', 'private'],
        default: 'team'
      },
      allowMentions: {
        type: Boolean,
        default: true
      },
      allowDirectMessages: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 조직 멤버십
  organizations: [{
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    organizationName: String,
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'member', 'viewer'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canManageMembers: {
        type: Boolean,
        default: false
      },
      canManageTeams: {
        type: Boolean,
        default: false
      },
      canManageProjects: {
        type: Boolean,
        default: true
      },
      canManageTasks: {
        type: Boolean,
        default: true
      },
      canViewAnalytics: {
        type: Boolean,
        default: false
      },
      canManageSettings: {
        type: Boolean,
        default: false
      }
    }
  }],
  
  // 팀 멤버십
  teams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    teamName: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    role: {
      type: String,
      enum: ['leader', 'senior', 'member', 'intern'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 사용자 통계
  statistics: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    overdueTasks: {
      type: Number,
      default: 0
    },
    totalProjects: {
      type: Number,
      default: 0
    },
    activeProjects: {
      type: Number,
      default: 0
    },
    totalOrganizations: {
      type: Number,
      default: 0
    },
    totalTeams: {
      type: Number,
      default: 0
    },
    averageTaskCompletionTime: {
      type: Number, // 시간 단위
      default: 0
    },
    productivityScore: {
      type: Number, // 0-100 점수
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // 활동 로그
  activityLog: [{
    action: {
      type: String,
      enum: ['login', 'logout', 'task_created', 'task_completed', 'project_joined', 'team_joined'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'import', 'invitation'],
      default: 'api'
    },
    externalId: String,
    registrationMethod: {
      type: String,
      enum: ['email', 'google', 'github', 'linkedin'],
      default: 'email'
    },
    lastActiveAt: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'organizations.organizationId': 1 });
userSchema.index({ 'teams.teamId': 1 });
userSchema.index({ 'metadata.lastActiveAt': 1 });
userSchema.index({ name: 'text', email: 'text' });

// 가상 필드
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalTasks === 0) return 0;
  return Math.round((this.statistics.completedTasks / this.statistics.totalTasks) * 100);
});

userSchema.virtual('activeOrganizationCount').get(function() {
  return this.organizations ? 
    this.organizations.filter(org => org.status === 'active').length : 0;
});

userSchema.virtual('activeTeamCount').get(function() {
  return this.teams ? 
    this.teams.filter(team => team.status === 'active').length : 0;
});

// 미들웨어
userSchema.pre('save', async function(next) {
  // 비밀번호 해싱
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  // 통계 자동 업데이트
  this.statistics.totalOrganizations = this.organizations ? this.organizations.length : 0;
  this.statistics.totalTeams = this.teams ? this.teams.length : 0;
  
  // 생산성 점수 계산
  if (this.statistics.totalTasks > 0) {
    const completionRate = this.statistics.completedTasks / this.statistics.totalTasks;
    const overduePenalty = this.statistics.overdueTasks / this.statistics.totalTasks;
    this.statistics.productivityScore = Math.max(0, Math.min(100, 
      (completionRate * 100) - (overduePenalty * 50)
    ));
  }
  
  next();
});

// 인스턴스 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('비밀번호 비교 중 오류가 발생했습니다.');
  }
};

userSchema.methods.incrementLoginAttempts = function() {
  // 잠금 해제 시간이 지났으면 로그인 시도 횟수 초기화
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // 5번 실패하면 2시간 동안 잠금
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.addOrganization = function(organizationId, organizationName, role = 'member', permissions = {}) {
  const existingOrg = this.organizations.find(org => 
    org.organizationId.toString() === organizationId.toString()
  );
  
  if (existingOrg) {
    // 기존 조직 정보 업데이트
    existingOrg.role = role;
    existingOrg.permissions = { ...existingOrg.permissions, ...permissions };
    existingOrg.status = 'active';
  } else {
    // 새 조직 추가
    this.organizations.push({
      organizationId,
      organizationName,
      role,
      permissions: {
        canManageMembers: false,
        canManageTeams: false,
        canManageProjects: true,
        canManageTasks: true,
        canViewAnalytics: false,
        canManageSettings: false,
        ...permissions
      }
    });
  }
  
  return this.save();
};

userSchema.methods.removeOrganization = function(organizationId) {
  this.organizations = this.organizations.filter(org => 
    org.organizationId.toString() !== organizationId.toString()
  );
  return this.save();
};

userSchema.methods.addTeam = function(teamId, teamName, organizationId, role = 'member') {
  const existingTeam = this.teams.find(team => 
    team.teamId.toString() === teamId.toString()
  );
  
  if (existingTeam) {
    // 기존 팀 정보 업데이트
    existingTeam.role = role;
    existingTeam.status = 'active';
  } else {
    // 새 팀 추가
    this.teams.push({
      teamId,
      teamName,
      organizationId,
      role
    });
  }
  
  return this.save();
};

userSchema.methods.removeTeam = function(teamId) {
  this.teams = this.teams.filter(team => 
    team.teamId.toString() !== teamId.toString()
  );
  return this.save();
};

userSchema.methods.updateStatistics = function(stats) {
  this.statistics = {
    ...this.statistics,
    ...stats
  };
  return this.save();
};

userSchema.methods.addActivityLog = function(action, details = '', ipAddress = '', userAgent = '') {
  this.activityLog.push({
    action,
    details,
    ipAddress,
    userAgent
  });
  
  // 활동 로그는 최근 100개만 유지
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  this.metadata.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24시간
  return this.save();
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1시간
  return this.save();
};

// 정적 메서드
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findByOrganization = function(organizationId) {
  return this.find({ 'organizations.organizationId': organizationId });
};

userSchema.statics.findByTeam = function(teamId) {
  return this.find({ 'teams.teamId': teamId });
};

const User = mongoose.model('User', userSchema);

export default User; 