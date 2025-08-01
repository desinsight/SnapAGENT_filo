const mongoose = require('mongoose');

/**
 * 영수증 스키마 - AI 기반 영수증 인식 및 자동 분류
 * OCR, 이미지 처리, 자동 회계 분개를 지원하는 구조
 */
const receiptSchema = new mongoose.Schema({
  // 영수증 기본 정보
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    comment: '영수증 번호 (자동 생성)'
  },
  
  // 원본 영수증 정보
  originalReceipt: {
    receiptNumber: {
      type: String,
      trim: true,
      comment: '원본 영수증 번호'
    },
    merchantName: {
      type: String,
      trim: true,
      comment: '가맹점명'
    },
    merchantBusinessNumber: {
      type: String,
      trim: true,
      comment: '가맹점 사업자등록번호'
    },
    merchantAddress: {
      type: String,
      comment: '가맹점 주소'
    },
    merchantPhone: {
      type: String,
      comment: '가맹점 연락처'
    }
  },
  
  // 거래 정보
  transaction: {
    transactionDate: {
      type: Date,
      required: true,
      comment: '거래일자'
    },
    transactionTime: {
      type: String,
      comment: '거래시간'
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      comment: '총 금액'
    },
    taxAmount: {
      type: Number,
      default: 0,
      comment: '세액'
    },
    netAmount: {
      type: Number,
      default: 0,
      comment: '공급가액'
    },
    paymentMethod: {
      type: String,
      enum: ['현금', '신용카드', '체크카드', '이체', '기타'],
      comment: '결제방법'
    },
    cardNumber: {
      type: String,
      comment: '카드번호 (마스킹)'
    },
    approvalNumber: {
      type: String,
      comment: '승인번호'
    }
  },
  
  // 상품/서비스 상세
  items: [{
    name: {
      type: String,
      required: true,
      trim: true,
      comment: '상품명'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      comment: '수량'
    },
    unitPrice: {
      type: Number,
      min: 0,
      comment: '단가'
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      comment: '총 금액'
    },
    category: {
      type: String,
      comment: '상품 카테고리'
    },
    taxCategory: {
      type: String,
      enum: ['과세', '면세', '영세'],
      default: '과세',
      comment: '세무 분류'
    }
  }],
  
  // AI 인식 결과
  aiRecognition: {
    isProcessed: {
      type: Boolean,
      default: false,
      comment: 'AI 처리 완료 여부'
    },
    processedAt: {
      type: Date,
      comment: 'AI 처리일시'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      comment: '인식 신뢰도 (0-1)'
    },
    extractedFields: {
      merchantName: {
        type: String,
        comment: '인식된 가맹점명'
      },
      totalAmount: {
        type: Number,
        comment: '인식된 총 금액'
      },
      taxAmount: {
        type: Number,
        comment: '인식된 세액'
      },
      transactionDate: {
        type: Date,
        comment: '인식된 거래일자'
      },
      items: [{
        name: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
      }]
    },
    recognitionErrors: [{
      field: String,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }]
  },
  
  // 자동 분류 결과
  autoClassification: {
    isClassified: {
      type: Boolean,
      default: false,
      comment: '자동 분류 완료 여부'
    },
    classifiedAt: {
      type: Date,
      comment: '분류일시'
    },
    expenseCategory: {
      type: String,
      comment: '지출 카테고리'
    },
    accountCode: {
      type: String,
      comment: '추천 계정과목 코드'
    },
    accountName: {
      type: String,
      comment: '추천 계정과목명'
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
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      comment: '분류 신뢰도'
    },
    classificationMethod: {
      type: String,
      enum: ['AI', 'Rule', 'Manual', 'Template'],
      comment: '분류 방법'
    }
  },
  
  // 회계 연동
  accounting: {
    isPosted: {
      type: Boolean,
      default: false,
      comment: '회계 전표 생성 여부'
    },
    postedAt: {
      type: Date,
      comment: '전표 생성일시'
    },
    transactionId: {
      type: String,
      comment: '연결된 전표 ID'
    },
    transactionNumber: {
      type: String,
      comment: '연결된 전표번호'
    },
    entryIndex: {
      type: Number,
      comment: '전표 내 항목 인덱스'
    }
  },
  
  // 이미지 파일
  images: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: {
      type: String,
      comment: '썸네일 URL'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPrimary: {
      type: Boolean,
      default: false,
      comment: '주요 이미지 여부'
    },
    ocrProcessed: {
      type: Boolean,
      default: false,
      comment: 'OCR 처리 완료 여부'
    }
  }],
  
  // 검증 및 검토
  validation: {
    isValid: {
      type: Boolean,
      default: false,
      comment: '검증 통과 여부'
    },
    validatedAt: {
      type: Date,
      comment: '검증일시'
    },
    validatedBy: {
      type: String,
      comment: '검증자'
    },
    validationErrors: [{
      field: String,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }]
  },
  
  // 검토 정보
  review: {
    isReviewed: {
      type: Boolean,
      default: false,
      comment: '검토 완료 여부'
    },
    reviewedAt: {
      type: Date,
      comment: '검토일시'
    },
    reviewedBy: {
      type: String,
      comment: '검토자'
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_correction'],
      default: 'pending',
      comment: '검토 상태'
    },
    reviewNotes: {
      type: String,
      comment: '검토 메모'
    },
    corrections: [{
      field: String,
      originalValue: mongoose.Schema.Types.Mixed,
      correctedValue: mongoose.Schema.Types.Mixed,
      correctedBy: String,
      correctedAt: Date
    }]
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'recognized', 'classified', 'posted', 'archived', 'deleted'],
    default: 'uploaded',
    comment: '영수증 상태'
  },
  
  // 태그 및 메타데이터
  tags: [{
    type: String,
    comment: '태그'
  }],
  
  notes: {
    type: String,
    comment: '메모'
  },
  
  // 메타데이터
  createdBy: {
    type: String,
    required: true,
    comment: '업로드자'
  },
  
  lastModifiedBy: {
    type: String,
    comment: '최종 수정자'
  },
  
  // 조직 정보
  organizationId: {
    type: String,
    required: true,
    comment: '조직 ID'
  },
  
  // 회계연도
  fiscalYear: {
    type: Number,
    required: true,
    comment: '회계연도'
  },
  
  // 회계기간
  fiscalPeriod: {
    type: Number,
    required: true,
    comment: '회계기간 (1-12)'
  }
}, {
  timestamps: true,
  collection: 'receipts'
});

// 인덱스 설정
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ 'transaction.transactionDate': 1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ organizationId: 1 });
receiptSchema.index({ 'originalReceipt.merchantBusinessNumber': 1 });
receiptSchema.index({ 'accounting.transactionId': 1 });
receiptSchema.index({ 'aiRecognition.isProcessed': 1 });
receiptSchema.index({ 'autoClassification.isClassified': 1 });
receiptSchema.index({ 'review.isReviewed': 1 });

// 복합 인덱스
receiptSchema.index({ organizationId: 1, 'transaction.transactionDate': 1 });
receiptSchema.index({ organizationId: 1, status: 1 });
receiptSchema.index({ organizationId: 1, fiscalYear: 1, fiscalPeriod: 1 });

// 가상 필드
receiptSchema.virtual('isExpense').get(function() {
  return this.transaction.totalAmount > 0;
});

receiptSchema.virtual('isIncome').get(function() {
  return this.transaction.totalAmount < 0;
});

receiptSchema.virtual('hasVat').get(function() {
  return this.transaction.taxAmount > 0;
});

receiptSchema.virtual('processingStatus').get(function() {
  if (this.status === 'uploaded') return '업로드됨';
  if (this.status === 'processing') return '처리중';
  if (this.status === 'recognized') return '인식완료';
  if (this.status === 'classified') return '분류완료';
  if (this.status === 'posted') return '전표생성';
  if (this.status === 'archived') return '보관됨';
  return '알 수 없음';
});

// 인스턴스 메서드
receiptSchema.methods.generateReceiptNumber = function() {
  const year = this.transaction.transactionDate.getFullYear();
  const month = String(this.transaction.transactionDate.getMonth() + 1).padStart(2, '0');
  const day = String(this.transaction.transactionDate.getDate()).padStart(2, '0');
  
  return `${this.organizationId}-${year}${month}${day}-${Date.now()}`;
};

receiptSchema.methods.processWithAI = async function() {
  // AI 처리 로직 (실제 구현에서는 외부 AI 서비스 호출)
  this.status = 'processing';
  this.aiRecognition.isProcessed = true;
  this.aiRecognition.processedAt = new Date();
  this.aiRecognition.confidence = 0.95; // 예시 값
  
  // 기본 필드 추출
  this.aiRecognition.extractedFields = {
    merchantName: this.originalReceipt.merchantName,
    totalAmount: this.transaction.totalAmount,
    taxAmount: this.transaction.taxAmount,
    transactionDate: this.transaction.transactionDate
  };
  
  this.status = 'recognized';
  return this.save();
};

receiptSchema.methods.autoClassify = async function() {
  // 자동 분류 로직
  this.autoClassification.isClassified = true;
  this.autoClassification.classifiedAt = new Date();
  this.autoClassification.classificationMethod = 'AI';
  this.autoClassification.confidence = 0.85; // 예시 값
  
  // 기본 분류 규칙 (실제로는 더 복잡한 AI 모델 사용)
  if (this.originalReceipt.merchantName.includes('식당') || 
      this.originalReceipt.merchantName.includes('카페')) {
    this.autoClassification.expenseCategory = '식비';
    this.autoClassification.accountCode = '5210';
    this.autoClassification.accountName = '식대비';
  } else if (this.originalReceipt.merchantName.includes('주유소') ||
             this.originalReceipt.merchantName.includes('GS') ||
             this.originalReceipt.merchantName.includes('SK')) {
    this.autoClassification.expenseCategory = '교통비';
    this.autoClassification.accountCode = '5220';
    this.autoClassification.accountName = '교통비';
  } else {
    this.autoClassification.expenseCategory = '기타비용';
    this.autoClassification.accountCode = '5290';
    this.autoClassification.accountName = '기타비용';
  }
  
  this.autoClassification.taxCategory = '공제';
  this.autoClassification.vatCategory = '과세';
  
  this.status = 'classified';
  return this.save();
};

receiptSchema.methods.createTransaction = async function() {
  // 회계 전표 생성 로직
  const Transaction = require('./Transaction');
  
  const transaction = new Transaction({
    transactionDate: this.transaction.transactionDate,
    postingDate: this.transaction.transactionDate,
    description: `${this.originalReceipt.merchantName} - ${this.transaction.totalAmount.toLocaleString()}원`,
    totalAmount: this.transaction.totalAmount,
    currency: 'KRW',
    organizationId: this.organizationId,
    createdBy: this.createdBy,
    entries: [
      {
        accountCode: this.autoClassification.accountCode,
        accountName: this.autoClassification.accountName,
        debitAmount: this.transaction.totalAmount,
        creditAmount: 0,
        description: this.originalReceipt.merchantName,
        taxCategory: this.autoClassification.taxCategory,
        vatCategory: this.autoClassification.vatCategory
      },
      {
        accountCode: '1100', // 현금 계정
        accountName: '현금',
        debitAmount: 0,
        creditAmount: this.transaction.totalAmount,
        description: this.originalReceipt.merchantName
      }
    ]
  });
  
  const savedTransaction = await transaction.save();
  
  this.accounting.isPosted = true;
  this.accounting.postedAt = new Date();
  this.accounting.transactionId = savedTransaction._id;
  this.accounting.transactionNumber = savedTransaction.transactionNumber;
  this.status = 'posted';
  
  return this.save();
};

receiptSchema.methods.validateReceipt = function() {
  const errors = [];
  
  // 기본 검증
  if (!this.transaction.transactionDate) {
    errors.push({
      field: 'transaction.transactionDate',
      message: '거래일자는 필수입니다.',
      severity: 'error'
    });
  }
  
  if (!this.transaction.totalAmount || this.transaction.totalAmount <= 0) {
    errors.push({
      field: 'transaction.totalAmount',
      message: '총 금액은 0보다 커야 합니다.',
      severity: 'error'
    });
  }
  
  if (!this.originalReceipt.merchantName) {
    errors.push({
      field: 'originalReceipt.merchantName',
      message: '가맹점명은 필수입니다.',
      severity: 'error'
    });
  }
  
  this.validation.validationErrors = errors;
  this.validation.isValid = errors.length === 0;
  this.validation.validatedAt = new Date();
  
  return this;
};

// 정적 메서드
receiptSchema.statics.findByDateRange = function(organizationId, startDate, endDate) {
  return this.find({
    organizationId,
    'transaction.transactionDate': { $gte: startDate, $lte: endDate }
  }).sort({ 'transaction.transactionDate': -1 });
};

receiptSchema.statics.findUnprocessed = function(organizationId) {
  return this.find({
    organizationId,
    'aiRecognition.isProcessed': false
  }).sort({ createdAt: 1 });
};

receiptSchema.statics.findUnclassified = function(organizationId) {
  return this.find({
    organizationId,
    'aiRecognition.isProcessed': true,
    'autoClassification.isClassified': false
  }).sort({ createdAt: 1 });
};

receiptSchema.statics.findUnposted = function(organizationId) {
  return this.find({
    organizationId,
    'autoClassification.isClassified': true,
    'accounting.isPosted': false
  }).sort({ createdAt: 1 });
};

// 미들웨어
receiptSchema.pre('save', function(next) {
  // 영수증 번호 자동 생성
  if (!this.receiptNumber) {
    this.receiptNumber = this.generateReceiptNumber();
  }
  
  // 회계연도/기간 자동 설정
  if (!this.fiscalYear) {
    this.fiscalYear = this.transaction.transactionDate.getFullYear();
  }
  if (!this.fiscalPeriod) {
    this.fiscalPeriod = this.transaction.transactionDate.getMonth() + 1;
  }
  
  // 공급가액 자동 계산
  if (this.transaction.totalAmount && this.transaction.taxAmount) {
    this.transaction.netAmount = this.transaction.totalAmount - this.transaction.taxAmount;
  }
  
  next();
});

// JSON 변환 시 가상 필드 포함
receiptSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Receipt', receiptSchema); 