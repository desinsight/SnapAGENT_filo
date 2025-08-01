// EventTemplate 모델 (일정 템플릿 시스템)
// 개인/팀/공개 템플릿, 사용 빈도, AI 추천 등 지원

const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TemplateDetailSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, default: 60 }, // 분 단위
  color: { type: String, default: '#1976d2' },
  allDay: { type: Boolean, default: false },
  recurrence: { type: String },
  attendees: [String],
  notifications: [Object],
  category: { type: String },
  tags: [String]
}, { _id: false });

const EventTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true }, // UUID
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
  ownerId: { type: String, required: true },
  type: { type: String, enum: ['personal', 'team', 'public'], default: 'personal' },
  category: {
    type: String,
    enum: ['회의', '미팅', '약속', '업무', '개인', '기타'],
    default: '기타'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '태그는 20자를 초과할 수 없습니다.']
  }],
  template: TemplateDetailSchema,
  usageCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  isFavorite: { type: Boolean, default: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '템플릿 생성자는 필수입니다.']
  },
  usageStats: {
    useCount: {
      type: Number,
      default: 0,
      min: [0, '사용 횟수는 0 이상이어야 합니다.']
    },
    lastUsed: Date,
    averageRating: {
      type: Number,
      min: [0, '평점은 0 이상이어야 합니다.'],
      max: [5, '평점은 5 이하여야 합니다.'],
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: [0, '평점 개수는 0 이상이어야 합니다.']
    }
  },
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit', 'admin'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    publicLink: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  version: {
    type: Number,
    default: 1,
    min: [1, '버전은 1 이상이어야 합니다.']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'imported', 'generated'],
      default: 'manual'
    },
    originalEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    importSource: String,
    lastModified: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
EventTemplateSchema.index({ createdBy: 1, isActive: 1 });
EventTemplateSchema.index({ category: 1, isActive: 1 });
EventTemplateSchema.index({ tags: 1 });
EventTemplateSchema.index({ 'sharing.publicLink': 1 });
EventTemplateSchema.index({ 'usageStats.useCount': -1 });
EventTemplateSchema.index({ 'usageStats.averageRating': -1 });

// 가상 필드
EventTemplateSchema.virtual('isPopular').get(function() {
  return this.usageStats.useCount >= 10 || this.usageStats.averageRating >= 4.0;
});

EventTemplateSchema.virtual('isRecentlyUsed').get(function() {
  if (!this.usageStats.lastUsed) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.usageStats.lastUsed > thirtyDaysAgo;
});

// 미들웨어
EventTemplateSchema.pre('save', function(next) {
  if (this.sharing.isShared && !this.sharing.publicLink) {
    this.sharing.publicLink = `template_${this._id}_${Date.now()}`;
  }
  
  this.metadata.lastModified = new Date();
  
  next();
});

// 정적 메서드
EventTemplateSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ 'usageStats.useCount': -1 });
};

EventTemplateSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .where('usageStats.useCount').gte(5)
    .sort({ 'usageStats.averageRating': -1, 'usageStats.useCount': -1 })
    .limit(limit);
};

EventTemplateSchema.statics.findRecentlyUsed = function(userId, limit = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    createdBy: userId,
    isActive: true,
    'usageStats.lastUsed': { $gte: thirtyDaysAgo }
  })
  .sort({ 'usageStats.lastUsed': -1 })
  .limit(limit);
};

// 인스턴스 메서드
EventTemplateSchema.methods.incrementUsage = function() {
  this.usageStats.useCount += 1;
  this.usageStats.lastUsed = new Date();
  return this.save();
};

EventTemplateSchema.methods.addRating = function(rating) {
  if (rating < 0 || rating > 5) {
    throw new Error('평점은 0-5 사이여야 합니다.');
  }
  
  const currentTotal = this.usageStats.averageRating * this.usageStats.ratingCount;
  this.usageStats.ratingCount += 1;
  this.usageStats.averageRating = (currentTotal + rating) / this.usageStats.ratingCount;
  
  return this.save();
};

EventTemplateSchema.methods.createEventFromTemplate = function(targetDate, calendarId) {
  const eventData = {
    calendarId,
    title: this.template.title,
    description: this.template.description,
    location: this.template.location,
    color: this.template.color,
    excludeHolidays: this.template.excludeHolidays,
    excludeDates: [...this.template.excludeDates],
    reminders: [...this.template.notifications],
    attendees: [...this.template.attendees],
    isPublic: this.type === 'public'
  };
  
  const targetDateTime = new Date(targetDate);
  targetDateTime.setHours(
    this.template.timeSlot.startHour || 9,
    this.template.timeSlot.startMinute || 0,
    0,
    0
  );
  
  eventData.start = targetDateTime;
  eventData.end = new Date(targetDateTime.getTime() + this.template.duration * 60000);
  
  if (this.template.recurrence) {
    eventData.recurrence = { ...this.template.recurrence };
  }
  
  return eventData;
};

module.exports = model('EventTemplate', EventTemplateSchema); 