const mongoose = require('mongoose');

/**
 * 회계 계정과목 스키마 - 복식부기 회계 시스템의 기본 구조
 * 한국 표준 회계계정과목표(K-GAAP) 기반으로 설계
 */
const accountSchema = new mongoose.Schema({
  // 계정과목 코드 및 정보
  accountCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    comment: '계정과목 코드 (예: 1000, 1100, 1200...)'
  },
  
  accountName: {
    type: String,
    required: true,
    trim: true,
    comment: '계정과목명'
  },
  
  accountNameEn: {
    type: String,
    trim: true,
    comment: '영문 계정과목명'
  },
  
  // 계정과목 분류
  category: {
    type: String,
    enum: ['자산', '부채', '자본', '수익', '비용'],
    required: true,
    comment: '대분류'
  },
  
  subCategory: {
    type: String,
    required: true,
    comment: '중분류 (예: 유동자산, 고정자산, 유동부채, 고정부채 등)'
  },
  
  detailCategory: {
    type: String,
    comment: '소분류 (예: 당좌자산, 재고자산, 투자자산 등)'
  },
  
  // 계정과목 특성
  accountType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
    comment: '차변/대변 계정 구분'
  },
  
  normalBalance: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
    comment: '정상잔액 방향'
  },
  
  // 계정과목 상태
  isActive: {
    type: Boolean,
    default: true,
    comment: '활성화 여부'
  },
  
  isSystem: {
    type: Boolean,
    default: false,
    comment: '시스템 기본 계정과목 여부'
  },
  
  isEditable: {
    type: Boolean,
    default: true,
    comment: '수정 가능 여부'
  },
  
  // 계정과목 설정
  settings: {
    allowNegative: {
      type: Boolean,
      default: false,
      comment: '음수 잔액 허용 여부'
    },
    requireDescription: {
      type: Boolean,
      default: false,
      comment: '적요 필수 입력 여부'
    },
    autoReconciliation: {
      type: Boolean,
      default: false,
      comment: '자동 대체 여부'
    },
    taxCategory: {
      type: String,
      enum: ['과세', '면세', '영세', '불공제', '공제'],
      comment: '세무 분류'
    },
    vatCategory: {
      type: String,
      enum: ['과세', '면세', '영세', '불공제'],
      comment: '부가세 분류'
    }
  },
  
  // 계정과목 설명
  description: {
    type: String,
    comment: '계정과목 설명'
  },
  
  // 사용 예시
  examples: [{
    type: String,
    comment: '사용 예시'
  }],
  
  // 관련 계정과목
  relatedAccounts: [{
    accountCode: {
      type: String,
      comment: '관련 계정과목 코드'
    },
    relationship: {
      type: String,
      enum: ['대응계정', '상계계정', '연결계정'],
      comment: '관계 유형'
    }
  }],
  
  // 계정과목 순서
  sortOrder: {
    type: Number,
    default: 0,
    comment: '정렬 순서'
  },
  
  // 메타데이터
  createdBy: {
    type: String,
    comment: '생성자'
  },
  
  lastModifiedBy: {
    type: String,
    comment: '최종 수정자'
  },
  
  // 사용 통계
  usageStats: {
    transactionCount: {
      type: Number,
      default: 0,
      comment: '거래 건수'
    },
    lastUsedAt: {
      type: Date,
      comment: '마지막 사용일'
    }
  }
}, {
  timestamps: true,
  collection: 'accounts'
});

// 인덱스 설정
accountSchema.index({ accountCode: 1 });
accountSchema.index({ category: 1, subCategory: 1 });
accountSchema.index({ isActive: 1 });
accountSchema.index({ isSystem: 1 });
accountSchema.index({ sortOrder: 1 });

// 가상 필드
accountSchema.virtual('fullAccountName').get(function() {
  return `${this.accountCode} - ${this.accountName}`;
});

accountSchema.virtual('isDebitAccount').get(function() {
  return this.normalBalance === 'debit';
});

accountSchema.virtual('isCreditAccount').get(function() {
  return this.normalBalance === 'credit';
});

// 인스턴스 메서드
accountSchema.methods.getBalanceType = function() {
  return this.normalBalance;
};

accountSchema.methods.isBalanceSheetAccount = function() {
  return ['자산', '부채', '자본'].includes(this.category);
};

accountSchema.methods.isIncomeStatementAccount = function() {
  return ['수익', '비용'].includes(this.category);
};

accountSchema.methods.updateUsageStats = function() {
  this.usageStats.transactionCount += 1;
  this.usageStats.lastUsedAt = new Date();
  return this.save();
};

// 정적 메서드
accountSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true 
  }).sort({ sortOrder: 1, accountCode: 1 });
};

accountSchema.statics.findSystemAccounts = function() {
  return this.find({ 
    isSystem: true, 
    isActive: true 
  }).sort({ sortOrder: 1, accountCode: 1 });
};

accountSchema.statics.findActiveAccounts = function() {
  return this.find({ 
    isActive: true 
  }).sort({ sortOrder: 1, accountCode: 1 });
};

accountSchema.statics.findByCode = function(accountCode) {
  return this.findOne({ accountCode, isActive: true });
};

// 미들웨어
accountSchema.pre('save', function(next) {
  // 계정코드 정리 (숫자만)
  if (this.isModified('accountCode')) {
    this.accountCode = this.accountCode.replace(/[^0-9]/g, '');
  }
  
  // 시스템 계정은 수정 불가
  if (this.isSystem && this.isModified('accountCode')) {
    return next(new Error('시스템 계정과목은 수정할 수 없습니다.'));
  }
  
  next();
});

// JSON 변환 시 가상 필드 포함
accountSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Account', accountSchema); 