/**
 * Task Model - 태스크 모델
 * 개인 및 조직 태스크를 관리하는 MongoDB 스키마
 * 
 * @description
 * - 태스크 CRUD 기능
 * - 상태 관리 및 워크플로우
 * - 우선순위 및 마감일 관리
 * - 태그 및 분류 시스템
 * - 협업 기능 (댓글, 파일 첨부)
 * - 반복 태스크 지원
 * - 하위 태스크 및 체크리스트
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * 태스크 스키마 정의
 */
const taskSchema = new mongoose.Schema({
  // 기본 정보
  title: {
    type: String,
    required: [true, '태스크 제목은 필수입니다.'],
    trim: true,
    maxlength: [200, '제목은 200자를 초과할 수 없습니다.']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '설명은 2000자를 초과할 수 없습니다.']
  },
  
  // 태스크 유형 및 분류
  type: {
    type: String,
    enum: ['todo', 'bug', 'feature', 'document', 'meeting', 'survey', 'review'],
    default: 'todo',
    required: true
  },
  
  category: {
    type: String,
    enum: ['work', 'personal', 'learning', 'health', 'finance', 'other'],
    default: 'work'
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled', 'overdue'],
    default: 'pending',
    required: true
  },
  
  // 우선순위
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium',
    required: true
  },
  
  // 마감일 관리
  dueDate: {
    type: Date,
    required: false
  },
  
  dueTime: {
    type: String, // HH:mm 형식
    required: false
  },
  
  // 반복 설정
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      required: function() { return this.recurrence.enabled; }
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    daysOfWeek: [{
      type: Number, // 0-6 (일요일-토요일)
      min: 0,
      max: 6
    }],
    endDate: Date,
    nextDueDate: Date
  },
  
  // 담당자 및 생성자
  assignee: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: String,
    avatar: String
  },
  
  creator: {
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
  
  // 조직 및 프로젝트 정보
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
  
  project: {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false
    },
    name: String
  },
  
  // 하위 태스크 및 체크리스트
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    }
  }],
  
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
  
  // 파일 첨부
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
  
  // 댓글 및 활동
  comments: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
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
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    mentions: [{
      userId: mongoose.Schema.Types.ObjectId,
      name: String
    }]
  }],
  
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
    timeEntries: [{
      startTime: {
        type: Date,
        required: true
      },
      endTime: Date,
      duration: Number, // 분 단위
      description: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      userName: String
    }]
  },
  
  // 알림 설정
  notifications: {
    dueDateReminder: {
      type: Boolean,
      default: true
    },
    reminderHours: {
      type: Number,
      default: 24,
      min: 0
    },
    assigneeNotification: {
      type: Boolean,
      default: true
    },
    commentNotification: {
      type: Boolean,
      default: true
    }
  },
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['api', 'web', 'mobile', 'email', 'import'],
      default: 'api'
    },
    externalId: String, // 외부 시스템 연동용
    templateId: mongoose.Schema.Types.ObjectId, // 템플릿 기반 생성시
    sessionId: String
  },
  
  // 감사 로그
  auditLog: [{
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'status_change', 'assign', 'comment'],
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
taskSchema.index({ creator: 1, createdAt: -1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ organization: 1, project: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ 'recurrence.nextDueDate': 1 });
taskSchema.index({ title: 'text', description: 'text' });

// 가상 필드
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

taskSchema.virtual('progress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completed = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

taskSchema.virtual('subtaskCount').get(function() {
  return this.subtasks ? this.subtasks.length : 0;
});

taskSchema.virtual('completedSubtaskCount').get(function() {
  return this.subtasks ? this.subtasks.filter(subtask => subtask.completed).length : 0;
});

// 미들웨어
taskSchema.pre('save', function(next) {
  // 마감일 지난 태스크 자동 상태 변경
  if (this.dueDate && new Date() > this.dueDate && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  // 반복 태스크 다음 마감일 계산
  if (this.recurrence && this.recurrence.enabled && this.recurrence.pattern) {
    this.calculateNextDueDate();
  }
  
  next();
});

// 인스턴스 메서드
taskSchema.methods.addComment = function(content, author) {
  this.comments.push({
    content,
    author: {
      userId: author.userId,
      name: author.name,
      avatar: author.avatar
    }
  });
  return this.save();
};

taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title });
  return this.save();
};

taskSchema.methods.toggleSubtask = function(subtaskIndex) {
  if (this.subtasks[subtaskIndex]) {
    this.subtasks[subtaskIndex].completed = !this.subtasks[subtaskIndex].completed;
    this.subtasks[subtaskIndex].completedAt = this.subtasks[subtaskIndex].completed ? new Date() : null;
  }
  return this.save();
};

taskSchema.methods.addTimeEntry = function(timeEntry) {
  this.timeTracking.timeEntries.push(timeEntry);
  this.timeTracking.actualHours += (timeEntry.duration / 60); // 분을 시간으로 변환
  return this.save();
};

taskSchema.methods.addAuditLog = function(action, userId, userName, details, changes = {}) {
  this.auditLog.push({
    action,
    userId,
    userName,
    details,
    changes
  });
  return this.save();
};

taskSchema.methods.calculateNextDueDate = function() {
  if (!this.recurrence || !this.recurrence.enabled || !this.dueDate) {
    return;
  }
  
  const currentDate = new Date(this.dueDate);
  const nextDate = new Date(currentDate);
  
  switch (this.recurrence.pattern) {
    case 'daily':
      nextDate.setDate(currentDate.getDate() + this.recurrence.interval);
      break;
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + (7 * this.recurrence.interval));
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + this.recurrence.interval);
      break;
    case 'yearly':
      nextDate.setFullYear(currentDate.getFullYear() + this.recurrence.interval);
      break;
  }
  
  this.recurrence.nextDueDate = nextDate;
};

// 정적 메서드
taskSchema.statics.findOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

taskSchema.statics.findDueToday = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  return this.find({
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

taskSchema.statics.findByAssignee = function(userId) {
  return this.find({ 'assignee.userId': userId });
};

taskSchema.statics.findByCreator = function(userId) {
  return this.find({ 'creator.userId': userId });
};

const Task = mongoose.model('Task', taskSchema);

export default Task; 