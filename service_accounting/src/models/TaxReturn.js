const mongoose = require('mongoose');

/**
 * 세무 신고 스키마 - 부가가치세, 소득세, 법인세 등 다양한 세무 신고 관리
 * 국세청 전자세금신고 시스템과 연동을 고려한 설계
 */
const taxReturnSchema = new mongoose.Schema({
  // 신고 기본 정보
  returnNumber: {
    type: String,
    required: true,
    unique: true,
    comment: '신고번호 (자동 생성)'
  },
  
  // 신고 유형
  taxType: {
    type: String,
    enum: ['VAT', 'INCOME_TAX', 'CORPORATE_TAX', 'WITHHOLDING_TAX', 'COMPREHENSIVE_INCOME_TAX'],
    required: true,
    comment: '세목 유형'
  },
  
  returnType: {
    type: String,
    enum: ['정기신고', '수정신고', '기한후신고', '추가신고'],
    default: '정기신고',
    comment: '신고 유형'
  },
  
  // 신고 기간
  taxYear: {
    type: Number,
    required: true,
    comment: '과세연도'
  },
  
  taxPeriod: {
    type: Number,
    required: true,
    comment: '과세기간 (1-12, 0: 연말정산)'
  },
  
  // 신고 일정
  filingDate: {
    type: Date,
    required: true,
    comment: '신고일자'
  },
  
  dueDate: {
    type: Date,
    required: true,
    comment: '신고 기한'
  },
  
  // 신고 상태
  status: {
    type: String,
    enum: ['draft', 'filed', 'accepted', 'rejected', 'amended', 'cancelled'],
    default: 'draft',
    comment: '신고 상태'
  },
  
  // 신고인 정보
  taxpayer: {
    businessNumber: {
      type: String,
      required: true,
      trim: true,
      comment: '사업자등록번호'
    },
    name: {
      type: String,
      required: true,
      trim: true,
      comment: '납세자명'
    },
    representative: {
      type: String,
      trim: true,
      comment: '대표자명'
    },
    address: {
      type: String,
      comment: '사업장 주소'
    },
    businessType: {
      type: String,
      enum: ['개인사업자', '법인사업자', '비영리법인'],
      comment: '사업자 유형'
    }
  },
  
  // 세무사 정보
  taxAgent: {
    agentNumber: {
      type: String,
      trim: true,
      comment: '세무사 등록번호'
    },
    name: {
      type: String,
      trim: true,
      comment: '세무사명'
    },
    officeName: {
      type: String,
      trim: true,
      comment: '세무사무소명'
    }
  },
  
  // 신고 내용 (세목별 상세)
  returnData: {
    // 부가가치세
    vat: {
      supplyAmount: {
        type: Number,
        default: 0,
        comment: '공급가액'
      },
      vatAmount: {
        type: Number,
        default: 0,
        comment: '부가세액'
      },
      purchaseAmount: {
        type: Number,
        default: 0,
        comment: '매입가액'
      },
      purchaseVatAmount: {
        type: Number,
        default: 0,
        comment: '매입세액'
      },
      taxCreditAmount: {
        type: Number,
        default: 0,
        comment: '세액공제'
      },
      taxLiabilityAmount: {
        type: Number,
        default: 0,
        comment: '납부세액'
      },
      refundAmount: {
        type: Number,
        default: 0,
        comment: '환급세액'
      }
    },
    
    // 소득세
    incomeTax: {
      grossIncome: {
        type: Number,
        default: 0,
        comment: '총수입금액'
      },
      deductibleExpenses: {
        type: Number,
        default: 0,
        comment: '공제금액'
      },
      taxableIncome: {
        type: Number,
        default: 0,
        comment: '과세표준'
      },
      calculatedTax: {
        type: Number,
        default: 0,
        comment: '산출세액'
      },
      taxCredit: {
        type: Number,
        default: 0,
        comment: '세액공제'
      },
      finalTax: {
        type: Number,
        default: 0,
        comment: '결정세액'
      },
      withholdingTax: {
        type: Number,
        default: 0,
        comment: '원천징수세액'
      },
      taxLiability: {
        type: Number,
        default: 0,
        comment: '납부세액'
      }
    },
    
    // 법인세
    corporateTax: {
      revenue: {
        type: Number,
        default: 0,
        comment: '수익금액'
      },
      expenses: {
        type: Number,
        default: 0,
        comment: '비용금액'
      },
      operatingIncome: {
        type: Number,
        default: 0,
        comment: '영업손익'
      },
      nonOperatingIncome: {
        type: Number,
        default: 0,
        comment: '영업외수익'
      },
      nonOperatingExpenses: {
        type: Number,
        default: 0,
        comment: '영업외비용'
      },
      taxableIncome: {
        type: Number,
        default: 0,
        comment: '과세표준'
      },
      calculatedTax: {
        type: Number,
        default: 0,
        comment: '산출세액'
      },
      taxCredit: {
        type: Number,
        default: 0,
        comment: '세액공제'
      },
      finalTax: {
        type: Number,
        default: 0,
        comment: '결정세액'
      },
      withholdingTax: {
        type: Number,
        default: 0,
        comment: '원천징수세액'
      },
      taxLiability: {
        type: Number,
        default: 0,
        comment: '납부세액'
      }
    }
  },
  
  // 납부 정보
  payment: {
    paymentMethod: {
      type: String,
      enum: ['현금', '계좌이체', '신용카드', '자동이체', '기타'],
      comment: '납부방법'
    },
    paymentDate: {
      type: Date,
      comment: '납부일자'
    },
    paymentAmount: {
      type: Number,
      default: 0,
      comment: '납부금액'
    },
    paymentReference: {
      type: String,
      comment: '납부참조번호'
    },
    isPaid: {
      type: Boolean,
      default: false,
      comment: '납부완료 여부'
    }
  },
  
  // 국세청 연동 정보
  ntsIntegration: {
    submissionId: {
      type: String,
      comment: '국세청 제출 ID'
    },
    submissionDate: {
      type: Date,
      comment: '국세청 제출일시'
    },
    acceptanceNumber: {
      type: String,
      comment: '접수번호'
    },
    acceptanceDate: {
      type: Date,
      comment: '접수일시'
    },
    rejectionReason: {
      type: String,
      comment: '반려사유'
    },
    lastSyncDate: {
      type: Date,
      comment: '마지막 동기화일시'
    }
  },
  
  // 첨부서류
  attachments: [{
    documentType: {
      type: String,
      enum: ['신고서', '부속서류', '증빙서류', '기타'],
      required: true,
      comment: '서류 유형'
    },
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
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isRequired: {
      type: Boolean,
      default: false,
      comment: '필수서류 여부'
    }
  }],
  
  // 검증 정보
  validation: {
    isCalculated: {
      type: Boolean,
      default: false,
      comment: '자동계산 완료 여부'
    },
    calculationDate: {
      type: Date,
      comment: '계산일시'
    },
    validationErrors: [{
      field: String,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }],
    isValid: {
      type: Boolean,
      default: false,
      comment: '검증 통과 여부'
    }
  },
  
  // 메타데이터
  createdBy: {
    type: String,
    required: true,
    comment: '작성자'
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
  
  // 메모
  notes: {
    type: String,
    comment: '메모'
  },
  
  // 태그
  tags: [{
    type: String,
    comment: '태그'
  }]
}, {
  timestamps: true,
  collection: 'tax_returns'
});

// 인덱스 설정
taxReturnSchema.index({ returnNumber: 1 });
taxReturnSchema.index({ taxType: 1 });
taxReturnSchema.index({ taxYear: 1, taxPeriod: 1 });
taxReturnSchema.index({ status: 1 });
taxReturnSchema.index({ organizationId: 1 });
taxReturnSchema.index({ 'taxpayer.businessNumber': 1 });
taxReturnSchema.index({ filingDate: 1 });
taxReturnSchema.index({ dueDate: 1 });
taxReturnSchema.index({ 'ntsIntegration.submissionId': 1 });

// 복합 인덱스
taxReturnSchema.index({ organizationId: 1, taxType: 1, taxYear: 1, taxPeriod: 1 });
taxReturnSchema.index({ organizationId: 1, status: 1 });
taxReturnSchema.index({ organizationId: 1, filingDate: 1 });

// 가상 필드
taxReturnSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status !== 'filed' && this.status !== 'accepted';
});

taxReturnSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

taxReturnSchema.virtual('taxLiabilityAmount').get(function() {
  switch (this.taxType) {
    case 'VAT':
      return this.returnData.vat.taxLiabilityAmount;
    case 'INCOME_TAX':
      return this.returnData.incomeTax.taxLiability;
    case 'CORPORATE_TAX':
      return this.returnData.corporateTax.taxLiability;
    default:
      return 0;
  }
});

// 인스턴스 메서드
taxReturnSchema.methods.generateReturnNumber = function() {
  const year = this.taxYear;
  const period = String(this.taxPeriod).padStart(2, '0');
  const type = this.taxType;
  const timestamp = Date.now();
  
  return `${this.organizationId}-${type}-${year}${period}-${timestamp}`;
};

taxReturnSchema.methods.calculateTaxLiability = function() {
  switch (this.taxType) {
    case 'VAT':
      this.returnData.vat.taxLiabilityAmount = 
        this.returnData.vat.vatAmount - 
        this.returnData.vat.purchaseVatAmount - 
        this.returnData.vat.taxCreditAmount;
      break;
    case 'INCOME_TAX':
      this.returnData.incomeTax.taxLiability = 
        this.returnData.incomeTax.finalTax - 
        this.returnData.incomeTax.withholdingTax;
      break;
    case 'CORPORATE_TAX':
      this.returnData.corporateTax.taxLiability = 
        this.returnData.corporateTax.finalTax - 
        this.returnData.corporateTax.withholdingTax;
      break;
  }
  
  this.validation.isCalculated = true;
  this.validation.calculationDate = new Date();
  return this;
};

taxReturnSchema.methods.validateReturn = function() {
  const errors = [];
  
  // 기본 검증
  if (!this.taxpayer.businessNumber) {
    errors.push({
      field: 'taxpayer.businessNumber',
      message: '사업자등록번호는 필수입니다.',
      severity: 'error'
    });
  }
  
  if (!this.filingDate) {
    errors.push({
      field: 'filingDate',
      message: '신고일자는 필수입니다.',
      severity: 'error'
    });
  }
  
  // 세목별 검증
  switch (this.taxType) {
    case 'VAT':
      if (this.returnData.vat.supplyAmount < 0) {
        errors.push({
          field: 'returnData.vat.supplyAmount',
          message: '공급가액은 0 이상이어야 합니다.',
          severity: 'error'
        });
      }
      break;
    case 'INCOME_TAX':
      if (this.returnData.incomeTax.taxableIncome < 0) {
        errors.push({
          field: 'returnData.incomeTax.taxableIncome',
          message: '과세표준은 0 이상이어야 합니다.',
          severity: 'error'
        });
      }
      break;
  }
  
  this.validation.validationErrors = errors;
  this.validation.isValid = errors.length === 0;
  return this;
};

taxReturnSchema.methods.submitToNTS = function() {
  // 국세청 전자세금신고 시스템 연동 로직
  this.status = 'filed';
  this.ntsIntegration.submissionDate = new Date();
  this.ntsIntegration.submissionId = `NTS-${Date.now()}`;
  return this;
};

// 정적 메서드
taxReturnSchema.statics.findByTaxPeriod = function(organizationId, taxType, taxYear, taxPeriod) {
  return this.findOne({
    organizationId,
    taxType,
    taxYear,
    taxPeriod
  });
};

taxReturnSchema.statics.findOverdueReturns = function(organizationId) {
  return this.find({
    organizationId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['filed', 'accepted'] }
  });
};

taxReturnSchema.statics.findByStatus = function(organizationId, status) {
  return this.find({
    organizationId,
    status
  }).sort({ filingDate: -1 });
};

// 미들웨어
taxReturnSchema.pre('save', function(next) {
  // 신고번호 자동 생성
  if (!this.returnNumber) {
    this.returnNumber = this.generateReturnNumber();
  }
  
  // 세액 계산
  if (this.isModified('returnData')) {
    this.calculateTaxLiability();
  }
  
  // 검증
  this.validateReturn();
  
  next();
});

// JSON 변환 시 가상 필드 포함
taxReturnSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('TaxReturn', taxReturnSchema); 