/**
 * Organization Model - 조직 모델
 * 조직별 멤버 관리 및 권한 시스템을 위한 MongoDB 스키마
 * 
 * @description
 * - 조직 CRUD 기능
 * - 멤버 관리 및 역할 설정
 * - 권한 및 접근 제어
 * - 조직 설정 관리
 * - 팀 생성 및 관리
 * - 조직 통계 및 분석
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * 조직 스키마 정의
 */
const organizationSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: [true, '조직 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '조직 이름은 100자를 초과할 수 없습니다.']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, '조직 설명은 500자를 초과할 수 없습니다.']
  },
  
  // 조직 유형
  type: {
    type: String,
    enum: ['company', 'startup', 'agency', 'nonprofit', 'educational', 'other'],
    default: 'company'
  },
  
  // 조직 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  
  // 조직 소유자
  owner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    avatar: String
  },
  
  // 조직 멤버
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    avatar: String,
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
    lastActiveAt: Date,
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
      },
      canInviteMembers: {
        type: Boolean,
        default: false
      },
      canRemoveMembers: {
        type: Boolean,
        default: false
      }
    },
    department: String,
    position: String,
    phone: String
  }],
  
  // 조직 설정
  settings: {
    // 기본 설정
    defaultLanguage: {
      type: String,
      enum: ['ko', 'en', 'ja', 'zh'],
      default: 'ko'
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
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
    
    // 작업 설정
    defaultTaskStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'review', 'completed'],
      default: 'pending'
    },
    defaultTaskPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    allowPublicProjects: {
      type: Boolean,
      default: false
    },
    requireTaskApproval: {
      type: Boolean,
      default: false
    },
    autoAssignTasks: {
      type: Boolean,
      default: false
    },
    
    // 알림 설정
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      projectUpdates: {
        type: Boolean,
        default: true
      },
      memberActivity: {
        type: Boolean,
        default: false
      }
    },
    
    // 보안 설정
    security: {
      requireTwoFactor: {
        type: Boolean,
        default: false
      },
      sessionTimeout: {
        type: Number,
        default: 24, // 시간
        min: 1,
        max: 168
      },
      passwordPolicy: {
        minLength: {
          type: Number,
          default: 8,
          min: 6
        },
        requireUppercase: {
          type: Boolean,
          default: true
        },
        requireLowercase: {
          type: Boolean,
          default: true
        },
        requireNumbers: {
          type: Boolean,
          default: true
        },
        requireSpecialChars: {
          type: Boolean,
          default: false
        }
      }
    }
  },
  
  // 조직 정보
  contact: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  
  // 조직 로고 및 브랜딩
  branding: {
    logo: {
      url: String,
      filename: String
    },
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#6B7280'
    },
    customDomain: String
  },
  
  // 조직 통계
  statistics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
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
    averageTaskCompletionTime: {
      type: Number, // 시간 단위
      default: 0
    }
  },
  
  // 구독 및 결제 정보
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    trialEndDate: Date,
    maxMembers: {
      type: Number,
      default: 5
    },
    maxProjects: {
      type: Number,
      default: 10
    },
    features: [{
      name: String,
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // 초대 관리
  invitations: [{
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member', 'viewer'],
      default: 'member'
    },
    invitedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending'
    },
    token: {
      type: String,
      required: true
    }
  }],
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'import'],
      default: 'api'
    },
    externalId: String,
    industry: String,
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '1-10'
    }
  },
  
  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'member_add', 'member_remove', 'member_role_change', 'settings_change'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    details: String,
    changes: Object,
    ipAddress: String,
    userAgent: String
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
organizationSchema.index({ 'owner.userId': 1 });
organizationSchema.index({ 'members.userId': 1 });
organizationSchema.index({ 'members.email': 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ 'subscription.plan': 1 });
organizationSchema.index({ name: 'text', description: 'text' });

// 가상 필드
organizationSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

organizationSchema.virtual('activeMemberCount').get(function() {
  return this.members ? this.members.filter(member => member.status === 'active').length : 0;
});

organizationSchema.virtual('adminCount').get(function() {
  return this.members ? this.members.filter(member => 
    member.role === 'owner' || member.role === 'admin'
  ).length : 0;
});

organizationSchema.virtual('isSubscriptionActive').get(function() {
  if (!this.subscription) return false;
  return this.subscription.status === 'active' || this.subscription.status === 'trial';
});

organizationSchema.virtual('isSubscriptionExpired').get(function() {
  if (!this.subscription || !this.subscription.endDate) return false;
  return new Date() > this.subscription.endDate;
});

// 미들웨어
organizationSchema.pre('save', function(next) {
  // 통계 자동 업데이트
  this.statistics.totalMembers = this.members ? this.members.length : 0;
  this.statistics.activeMembers = this.members ? 
    this.members.filter(member => member.status === 'active').length : 0;
  
  next();
});

// 인스턴스 메서드
organizationSchema.methods.addMember = function(userId, name, email, avatar, role = 'member', permissions = {}) {
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString() || member.email === email
  );
  
  if (existingMember) {
    // 기존 멤버 정보 업데이트
    existingMember.role = role;
    existingMember.permissions = { ...existingMember.permissions, ...permissions };
    existingMember.status = 'active';
  } else {
    // 새 멤버 추가
    this.members.push({
      userId,
      name,
      email,
      avatar,
      role,
      permissions: {
        canManageMembers: false,
        canManageTeams: false,
        canManageProjects: true,
        canManageTasks: true,
        canViewAnalytics: false,
        canManageSettings: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        ...permissions
      }
    });
  }
  
  return this.save();
};

organizationSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.userId.toString() !== userId.toString()
  );
  return this.save();
};

organizationSchema.methods.updateMemberRole = function(userId, role, permissions = {}) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (member) {
    member.role = role;
    member.permissions = { ...member.permissions, ...permissions };
  }
  
  return this.save();
};

organizationSchema.methods.inviteMember = function(email, role, invitedBy) {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료
  
  this.invitations.push({
    email,
    role,
    invitedBy: {
      userId: invitedBy.userId,
      name: invitedBy.name
    },
    expiresAt,
    token
  });
  
  return this.save();
};

organizationSchema.methods.acceptInvitation = async function(token, userId, name, email, avatar) {
  const invitation = this.invitations.find(inv => 
    inv.token === token && inv.status === 'pending' && inv.expiresAt > new Date()
  );
  
  if (invitation) {
    invitation.status = 'accepted';
    return await this.addMember(userId, name, email, avatar, invitation.role);
  }
  
  return this.save();
};

organizationSchema.methods.updateStatistics = function(stats) {
  this.statistics = {
    ...this.statistics,
    ...stats
  };
  return this.save();
};

organizationSchema.methods.addAuditLog = function(action, userId, userName, details, changes = {}, ipAddress = '', userAgent = '') {
  this.auditLog.push({
    action,
    userId,
    userName,
    details,
    changes,
    ipAddress,
    userAgent
  });
  return this.save();
};

// 정적 메서드
organizationSchema.statics.findByOwner = function(userId) {
  return this.find({ 'owner.userId': userId });
};

organizationSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.userId': userId });
};

organizationSchema.statics.findActiveOrganizations = function() {
  return this.find({ status: 'active' });
};

organizationSchema.statics.findExpiredSubscriptions = function() {
  return this.find({
    'subscription.endDate': { $lt: new Date() },
    'subscription.status': 'active'
  });
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization; 