/**
 * Project Model - 프로젝트 모델
 * 팀별 프로젝트 관리와 태스크 그룹화를 위한 MongoDB 스키마
 * 
 * @description
 * - 프로젝트 CRUD 기능
 * - 팀 및 멤버 관리
 * - 프로젝트별 태스크 그룹화
 * - 진행률 및 통계 관리
 * - 권한 및 접근 제어
 * - 프로젝트 템플릿 지원
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * 프로젝트 스키마 정의
 */
const projectSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: [true, '프로젝트 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '프로젝트 이름은 100자를 초과할 수 없습니다.']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '프로젝트 설명은 1000자를 초과할 수 없습니다.']
  },
  
  // 프로젝트 유형 및 분류
  type: {
    type: String,
    enum: ['development', 'design', 'marketing', 'research', 'maintenance', 'other'],
    default: 'development'
  },
  
  category: {
    type: String,
    enum: ['client', 'internal', 'personal', 'open_source'],
    default: 'internal'
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning',
    required: true
  },
  
  // 우선순위
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // 일정 관리
  startDate: {
    type: Date,
    required: false
  },
  
  endDate: {
    type: Date,
    required: false
  },
  
  estimatedDuration: {
    type: Number, // 일 단위
    min: 1
  },
  
  // 조직 및 팀 정보
  organization: {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: false
    },
    name: String
  },
  
  team: {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false
    },
    name: String
  },
  
  // 프로젝트 관리자
  manager: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: String
  },
  
  // 프로젝트 멤버
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
    avatar: String,
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: true
      },
      canDelete: {
        type: Boolean,
        default: false
      },
      canInvite: {
        type: Boolean,
        default: false
      },
      canManageTasks: {
        type: Boolean,
        default: true
      }
    }
  }],
  
  // 프로젝트 설정
  settings: {
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
    allowPublicAccess: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoAssignTasks: {
      type: Boolean,
      default: false
    },
    notificationSettings: {
      taskCreated: {
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
      deadlineApproaching: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 태그 및 라벨
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
  
  // 파일 및 리소스
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    uploadedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 외부 링크
  links: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    description: String,
    addedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 진행률 및 통계
  progress: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    inProgressTasks: {
      type: Number,
      default: 0
    },
    overdueTasks: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // 시간 추적
  timeTracking: {
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0
    },
    budget: {
      type: Number,
      min: 0
    },
    spent: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // 템플릿 정보
  template: {
    isTemplate: {
      type: Boolean,
      default: false
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTemplate'
    },
    templateName: String
  },
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'import', 'template'],
      default: 'api'
    },
    externalId: String,
    clientInfo: {
      name: String,
      email: String,
      phone: String
    },
    version: {
      type: String,
      default: '1.0.0'
    }
  },
  
  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'member_add', 'member_remove', 'status_change'],
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
projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ team: 1, createdAt: -1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ 'members.userId': 1 });
projectSchema.index({ endDate: 1, status: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// 가상 필드
projectSchema.virtual('isOverdue').get(function() {
  if (!this.endDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.endDate;
});

projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

projectSchema.virtual('activeMemberCount').get(function() {
  return this.members ? this.members.filter(member => 
    member.role !== 'viewer' || member.permissions.canEdit
  ).length : 0;
});

// 미들웨어
projectSchema.pre('save', function(next) {
  // 진행률 자동 계산
  if (this.progress.totalTasks > 0) {
    this.progress.completionRate = Math.round(
      (this.progress.completedTasks / this.progress.totalTasks) * 100
    );
  }
  
  // 마감일 지난 프로젝트 상태 변경
  if (this.endDate && new Date() > this.endDate && this.status === 'active') {
    this.status = 'on_hold';
  }
  
  next();
});

// 인스턴스 메서드
projectSchema.methods.addMember = function(userId, name, avatar, role = 'member', permissions = {}) {
  const existingMember = this.members.find(member => member.userId.toString() === userId.toString());
  
  if (existingMember) {
    // 기존 멤버 정보 업데이트
    existingMember.role = role;
    existingMember.permissions = { ...existingMember.permissions, ...permissions };
  } else {
    // 새 멤버 추가
    this.members.push({
      userId,
      name,
      avatar,
      role,
      permissions: {
        canEdit: true,
        canDelete: false,
        canInvite: false,
        canManageTasks: true,
        ...permissions
      }
    });
  }
  
  return this.save();
};

projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.userId.toString() !== userId.toString()
  );
  return this.save();
};

projectSchema.methods.updateMemberRole = function(userId, role, permissions = {}) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (member) {
    member.role = role;
    member.permissions = { ...member.permissions, ...permissions };
  }
  
  return this.save();
};

projectSchema.methods.addAttachment = function(attachment) {
  this.attachments.push(attachment);
  return this.save();
};

projectSchema.methods.addLink = function(link) {
  this.links.push(link);
  return this.save();
};

projectSchema.methods.updateProgress = function(taskStats) {
  this.progress = {
    ...this.progress,
    ...taskStats
  };
  
  if (this.progress.totalTasks > 0) {
    this.progress.completionRate = Math.round(
      (this.progress.completedTasks / this.progress.totalTasks) * 100
    );
  }
  
  return this.save();
};

projectSchema.methods.addAuditLog = function(action, userId, userName, details, changes = {}) {
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
projectSchema.statics.findByOrganization = function(organizationId) {
  return this.find({ 'organization.organizationId': organizationId });
};

projectSchema.statics.findByTeam = function(teamId) {
  return this.find({ 'team.teamId': teamId });
};

projectSchema.statics.findByManager = function(userId) {
  return this.find({ 'manager.userId': userId });
};

projectSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.userId': userId });
};

projectSchema.statics.findOverdueProjects = function() {
  return this.find({
    endDate: { $lt: new Date() },
    status: { $in: ['active', 'planning'] }
  });
};

projectSchema.statics.findActiveProjects = function() {
  return this.find({ status: 'active' });
};

const Project = mongoose.model('Project', projectSchema);

export default Project; 