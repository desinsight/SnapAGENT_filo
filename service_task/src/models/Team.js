/**
 * Team Model - 팀 모델
 * 조직 내 팀 관리 및 멤버 협업을 위한 MongoDB 스키마
 * 
 * @description
 * - 팀 CRUD 기능
 * - 팀 멤버 관리
 * - 팀별 프로젝트 관리
 * - 팀 권한 및 설정
 * - 팀 통계 및 분석
 * - 팀 채널 및 소통
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * 팀 스키마 정의
 */
const teamSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: [true, '팀 이름은 필수입니다.'],
    trim: true,
    maxlength: [50, '팀 이름은 50자를 초과할 수 없습니다.']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [300, '팀 설명은 300자를 초과할 수 없습니다.']
  },
  
  // 팀 유형
  type: {
    type: String,
    enum: ['development', 'design', 'marketing', 'sales', 'support', 'management', 'other'],
    default: 'development'
  },
  
  // 팀 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // 조직 정보
  organization: {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  
  // 팀 리더
  leader: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: String,
    avatar: String
  },
  
  // 팀 멤버
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
    email: String,
    avatar: String,
    role: {
      type: String,
      enum: ['leader', 'senior', 'member', 'intern'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'away'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: Date,
    permissions: {
      canManageTeam: {
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
      }
    },
    skills: [String],
    department: String,
    position: String
  }],
  
  // 팀 설정
  settings: {
    // 기본 설정
    defaultProjectType: {
      type: String,
      enum: ['development', 'design', 'marketing', 'research', 'maintenance', 'other'],
      default: 'development'
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
    
    // 협업 설정
    collaboration: {
      allowComments: {
        type: Boolean,
        default: true
      },
      allowFileSharing: {
        type: Boolean,
        default: true
      },
      allowTimeTracking: {
        type: Boolean,
        default: true
      },
      allowTaskReassignment: {
        type: Boolean,
        default: true
      }
    },
    
    // 알림 설정
    notifications: {
      taskAssigned: {
        type: Boolean,
        default: true
      },
      taskCompleted: {
        type: Boolean,
        default: true
      },
      memberJoined: {
        type: Boolean,
        default: true
      },
      projectUpdates: {
        type: Boolean,
        default: true
      },
      deadlineReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 팀 채널 (미래 확장용)
  channels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    type: {
      type: String,
      enum: ['general', 'project', 'announcement', 'random'],
      default: 'general'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    members: [{
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    }]
  }],
  
  // 팀 태그
  tags: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#3B82F6'
    }
  }],
  
  // 팀 통계
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
    },
    teamProductivity: {
      type: Number, // 0-100 점수
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // 팀 목표
  goals: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    createdBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 팀 일정
  schedule: {
    workingDays: {
      type: [Number], // 0-6 (일요일-토요일)
      default: [1, 2, 3, 4, 5] // 월-금
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    timezone: {
      type: String,
      default: 'Asia/Seoul'
    },
    holidays: [{
      date: Date,
      name: String,
      description: String
    }]
  },
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'import'],
      default: 'api'
    },
    externalId: String,
    department: String,
    location: String
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
    changes: Object
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
teamSchema.index({ organization: 1, status: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ type: 1 });
teamSchema.index({ name: 'text', description: 'text' });

// 가상 필드
teamSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

teamSchema.virtual('activeMemberCount').get(function() {
  return this.members ? this.members.filter(member => member.status === 'active').length : 0;
});

teamSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalTasks === 0) return 0;
  return Math.round((this.statistics.completedTasks / this.statistics.totalTasks) * 100);
});

teamSchema.virtual('isOverdue').get(function() {
  return this.statistics.overdueTasks > 0;
});

// 미들웨어
teamSchema.pre('save', function(next) {
  // 통계 자동 업데이트
  this.statistics.totalMembers = this.members ? this.members.length : 0;
  this.statistics.activeMembers = this.members ? 
    this.members.filter(member => member.status === 'active').length : 0;
  
  // 생산성 점수 계산
  if (this.statistics.totalTasks > 0) {
    const completionRate = this.statistics.completedTasks / this.statistics.totalTasks;
    const overduePenalty = this.statistics.overdueTasks / this.statistics.totalTasks;
    this.statistics.teamProductivity = Math.max(0, Math.min(100, 
      (completionRate * 100) - (overduePenalty * 50)
    ));
  }
  
  next();
});

// 인스턴스 메서드
teamSchema.methods.addMember = function(userId, name, email, avatar, role = 'member', permissions = {}) {
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString()
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
        canManageTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canManageProjects: true,
        canManageTasks: true,
        canViewAnalytics: false,
        ...permissions
      }
    });
  }
  
  return this.save();
};

teamSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.userId.toString() !== userId.toString()
  );
  return this.save();
};

teamSchema.methods.updateMemberRole = function(userId, role, permissions = {}) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (member) {
    member.role = role;
    member.permissions = { ...member.permissions, ...permissions };
  }
  
  return this.save();
};

teamSchema.methods.addChannel = function(channelData) {
  this.channels.push(channelData);
  return this.save();
};

teamSchema.methods.addGoal = function(goalData) {
  this.goals.push(goalData);
  return this.save();
};

teamSchema.methods.updateGoal = function(goalId, updates) {
  const goal = this.goals.id(goalId);
  if (goal) {
    Object.assign(goal, updates);
  }
  return this.save();
};

teamSchema.methods.updateStatistics = function(stats) {
  this.statistics = {
    ...this.statistics,
    ...stats
  };
  return this.save();
};

teamSchema.methods.addAuditLog = function(action, userId, userName, details, changes = {}) {
  this.auditLog.push({
    action,
    userId,
    userName,
    details,
    changes
  });
  return this.save();
};

// 정적 메서드
teamSchema.statics.findByOrganization = function(organizationId) {
  return this.find({ 'organization.organizationId': organizationId });
};

teamSchema.statics.findByLeader = function(userId) {
  return this.find({ 'leader.userId': userId });
};

teamSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.userId': userId });
};

teamSchema.statics.findActiveTeams = function() {
  return this.find({ status: 'active' });
};

teamSchema.statics.findByType = function(type) {
  return this.find({ type });
};

const Team = mongoose.model('Team', teamSchema);

export default Team; 