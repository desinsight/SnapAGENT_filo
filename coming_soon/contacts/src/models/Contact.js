/**
 * 👤 Contact Model
 * 
 * 연락처 데이터 모델 - 개인/비즈니스 통합 관리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';

// 주소 스키마
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'other'
  },
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// SNS 정보 스키마
const socialMediaSchema = new mongoose.Schema({
  linkedin: String,
  twitter: String,
  facebook: String,
  instagram: String,
  github: String,
  website: String
}, { _id: false });

// 연락처 정보 스키마
const contactInfoSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'phone', 'address'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    enum: ['personal', 'work', 'mobile', 'home', 'other'],
    default: 'other'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// 프로젝트 참여 스키마
const projectParticipationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  role: String,
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, { _id: false });

// 연락처 메인 스키마
const contactSchema = new mongoose.Schema({
  // 기본 정보
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 개인 정보
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // 비즈니스 정보
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  industry: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // 연락처 정보
  emails: [contactInfoSchema],
  phones: [contactInfoSchema],
  addresses: [addressSchema],
  socialMedia: socialMediaSchema,
  
  // 분류 및 태그
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  categories: [{
    type: String,
    enum: ['client', 'vendor', 'partner', 'employee', 'friend', 'family', 'other'],
    default: 'other'
  }],
  
  // 프로젝트 연동
  projects: [projectParticipationSchema],
  
  // 네트워킹 설정
  isPublic: {
    type: Boolean,
    default: false
  },
  visibilitySettings: {
    profile: {
      type: String,
      enum: ['public', 'private', 'network'],
      default: 'private'
    },
    contact: {
      type: String,
      enum: ['public', 'private', 'network'],
      default: 'private'
    },
    projects: {
      type: String,
      enum: ['public', 'private', 'network'],
      default: 'private'
    }
  },
  
  // 추가 정보
  profileImage: {
    type: String,
    maxlength: 500
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  birthday: Date,
  anniversary: Date,
  
  // 연락 기록
  lastContact: {
    type: Date,
    default: Date.now
  },
  contactFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'never'],
    default: 'monthly'
  },
  
  // 상태 및 메타데이터
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['manual', 'import', 'scan', 'ai'],
    default: 'manual'
  },
  
  // 위치 정보
  location: {
    country: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // AI 관련 필드
  aiGeneratedTags: [String],
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  lastAiUpdate: Date,
  
  // 시스템 필드
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, industry: 1 });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, status: 1 });
contactSchema.index({ 'emails.value': 1 });
contactSchema.index({ 'phones.value': 1 });
contactSchema.index({ isPublic: 1, industry: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ updatedAt: -1 });

// 텍스트 검색 인덱스
contactSchema.index({
  name: 'text',
  company: 'text',
  position: 'text',
  industry: 'text',
  tags: 'text',
  notes: 'text'
});

// 가상 필드
contactSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  return this.name;
});

contactSchema.virtual('primaryEmail').get(function() {
  const primary = this.emails.find(email => email.isPrimary);
  return primary ? primary.value : (this.emails[0] ? this.emails[0].value : null);
});

contactSchema.virtual('primaryPhone').get(function() {
  const primary = this.phones.find(phone => phone.isPrimary);
  return primary ? primary.value : (this.phones[0] ? this.phones[0].value : null);
});

contactSchema.virtual('activeProjects').get(function() {
  return this.projects.filter(project => project.isActive);
});

// 미들웨어
contactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 이름 자동 설정
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  
  // 태그 정규화
  if (this.tags) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // 중복 제거
  }
  
  next();
});

contactSchema.pre('find', function() {
  this.where({ status: { $ne: 'archived' } });
});

// 정적 메서드
contactSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, ...options };
  return this.find(query).populate('projects.projectId');
};

contactSchema.statics.findPublic = function(industry = null) {
  const query = { isPublic: true, status: 'active' };
  if (industry) {
    query.industry = industry;
  }
  return this.find(query).select('-emails -phones -addresses -notes');
};

contactSchema.statics.search = function(userId, searchTerm) {
  return this.find({
    userId,
    $text: { $search: searchTerm }
  }).populate('projects.projectId');
};

// 인스턴스 메서드
contactSchema.methods.addEmail = function(email, label = 'other', isPrimary = false) {
  if (isPrimary) {
    this.emails.forEach(e => e.isPrimary = false);
  }
  
  this.emails.push({
    type: 'email',
    value: email,
    label,
    isPrimary
  });
  
  return this.save();
};

contactSchema.methods.addPhone = function(phone, label = 'other', isPrimary = false) {
  if (isPrimary) {
    this.phones.forEach(p => p.isPrimary = false);
  }
  
  this.phones.push({
    type: 'phone',
    value: phone,
    label,
    isPrimary
  });
  
  return this.save();
};

contactSchema.methods.addProject = function(projectId, role, startDate, endDate) {
  this.projects.push({
    projectId,
    role,
    startDate,
    endDate,
    isActive: true
  });
  
  return this.save();
};

contactSchema.methods.updateLastContact = function() {
  this.lastContact = new Date();
  return this.save();
};

contactSchema.methods.generateTags = function() {
  const tags = [];
  
  if (this.industry) tags.push(this.industry.toLowerCase());
  if (this.company) tags.push(this.company.toLowerCase());
  if (this.position) tags.push(this.position.toLowerCase());
  if (this.department) tags.push(this.department.toLowerCase());
  
  return tags;
};

// Contact 모델 생성 및 export
const Contact = mongoose.model('Contact', contactSchema);

export default Contact; 