const TaxReturn = require('../models/TaxReturn');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * 세무 서비스 - 세무 신고, 세액 계산, 국세청 연동
 * 부가가치세, 소득세, 법인세 등 다양한 세무 처리를 담당
 */
class TaxService {
  /**
   * 세무 신고 생성
   * @param {Object} returnData - 신고 데이터
   * @param {String} userId - 작성자 ID
   * @returns {Promise<Object>} 생성된 세무 신고
   */
  async createTaxReturn(returnData, userId) {
    try {
      logger.info('세무 신고 생성 시작', {
        organizationId: returnData.organizationId,
        userId,
        taxType: returnData.taxType
      });

      // 기존 신고 확인
      const existingReturn = await TaxReturn.findByTaxPeriod(
        returnData.organizationId,
        returnData.taxType,
        returnData.taxYear,
        returnData.taxPeriod
      );

      if (existingReturn) {
        throw new Error('해당 기간의 신고가 이미 존재합니다.');
      }

      // 세무 신고 생성
      const taxReturn = new TaxReturn({
        ...returnData,
        createdBy: userId,
        lastModifiedBy: userId
      });

      const savedReturn = await taxReturn.save();

      logger.info('세무 신고 생성 완료', {
        returnId: savedReturn._id,
        returnNumber: savedReturn.returnNumber
      });

      return savedReturn;
    } catch (error) {
      logger.error('세무 신고 생성 실패', {
        error: error.message,
        organizationId: returnData.organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * 부가가치세 자동 계산
   * @param {String} organizationId - 조직 ID
   * @param {Number} taxYear - 과세연도
   * @param {Number} taxPeriod - 과세기간
   * @returns {Promise<Object>} 계산된 부가가치세 데이터
   */
  async calculateVAT(organizationId, taxYear, taxPeriod) {
    try {
      logger.info('부가가치세 계산 시작', {
        organizationId,
        taxYear,
        taxPeriod
      });

      const startDate = new Date(taxYear, taxPeriod - 1, 1);
      const endDate = new Date(taxYear, taxPeriod, 0);

      // 공급가액 및 부가세 조회
      const supplyTransactions = await Transaction.find({
        organizationId,
        transactionDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
        'entries.taxCategory': '과세'
      });

      let totalSupplyAmount = 0;
      let totalVATAmount = 0;

      supplyTransactions.forEach(transaction => {
        transaction.entries.forEach(entry => {
          if (entry.taxCategory === '과세' && entry.vatCategory === '과세') {
            totalSupplyAmount += entry.debitAmount;
            totalVATAmount += entry.debitAmount * 0.1; // 10% 부가세
          }
        });
      });

      // 매입가액 및 매입세액 조회
      const purchaseTransactions = await Transaction.find({
        organizationId,
        transactionDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
        'entries.taxCategory': '공제'
      });

      let totalPurchaseAmount = 0;
      let totalPurchaseVATAmount = 0;

      purchaseTransactions.forEach(transaction => {
        transaction.entries.forEach(entry => {
          if (entry.taxCategory === '공제' && entry.vatCategory === '과세') {
            totalPurchaseAmount += entry.creditAmount;
            totalPurchaseVATAmount += entry.creditAmount * 0.1; // 10% 부가세
          }
        });
      });

      // 납부세액 계산
      const taxLiabilityAmount = totalVATAmount - totalPurchaseVATAmount;

      const vatData = {
        supplyAmount: totalSupplyAmount,
        vatAmount: totalVATAmount,
        purchaseAmount: totalPurchaseAmount,
        purchaseVatAmount: totalPurchaseVATAmount,
        taxLiabilityAmount: Math.max(0, taxLiabilityAmount),
        refundAmount: Math.max(0, -taxLiabilityAmount)
      };

      logger.info('부가가치세 계산 완료', {
        organizationId,
        taxLiabilityAmount: vatData.taxLiabilityAmount
      });

      return vatData;
    } catch (error) {
      logger.error('부가가치세 계산 실패', {
        error: error.message,
        organizationId,
        taxYear,
        taxPeriod
      });
      throw error;
    }
  }

  /**
   * 소득세 자동 계산
   * @param {String} organizationId - 조직 ID
   * @param {Number} taxYear - 과세연도
   * @returns {Promise<Object>} 계산된 소득세 데이터
   */
  async calculateIncomeTax(organizationId, taxYear) {
    try {
      logger.info('소득세 계산 시작', {
        organizationId,
        taxYear
      });

      const startDate = new Date(taxYear, 0, 1);
      const endDate = new Date(taxYear, 11, 31);

      // 총수입금액 조회
      const revenueAccounts = await Account.findByCategory('수익');
      let grossIncome = 0;

      for (const account of revenueAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        grossIncome += balance.balance;
      }

      // 공제금액 조회
      const deductibleAccounts = await Account.find({
        'settings.taxCategory': '공제',
        isActive: true
      });

      let deductibleExpenses = 0;

      for (const account of deductibleAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        deductibleExpenses += balance.balance;
      }

      // 과세표준 계산
      const taxableIncome = Math.max(0, grossIncome - deductibleExpenses);

      // 산출세액 계산 (간단한 누진세율 적용)
      let calculatedTax = 0;
      if (taxableIncome <= 12000000) {
        calculatedTax = taxableIncome * 0.06;
      } else if (taxableIncome <= 46000000) {
        calculatedTax = 720000 + (taxableIncome - 12000000) * 0.15;
      } else if (taxableIncome <= 88000000) {
        calculatedTax = 5820000 + (taxableIncome - 46000000) * 0.24;
      } else if (taxableIncome <= 150000000) {
        calculatedTax = 15900000 + (taxableIncome - 88000000) * 0.35;
      } else if (taxableIncome <= 300000000) {
        calculatedTax = 37600000 + (taxableIncome - 150000000) * 0.38;
      } else if (taxableIncome <= 500000000) {
        calculatedTax = 94600000 + (taxableIncome - 300000000) * 0.40;
      } else {
        calculatedTax = 174600000 + (taxableIncome - 500000000) * 0.42;
      }

      // 세액공제 (간단한 계산)
      const taxCredit = Math.min(calculatedTax * 0.1, 1000000); // 10% 세액공제, 최대 100만원

      // 결정세액
      const finalTax = Math.max(0, calculatedTax - taxCredit);

      // 원천징수세액 (예시)
      const withholdingTax = finalTax * 0.1; // 10% 원천징수 가정

      // 납부세액
      const taxLiability = Math.max(0, finalTax - withholdingTax);

      const incomeTaxData = {
        grossIncome,
        deductibleExpenses,
        taxableIncome,
        calculatedTax,
        taxCredit,
        finalTax,
        withholdingTax,
        taxLiability
      };

      logger.info('소득세 계산 완료', {
        organizationId,
        taxLiability: incomeTaxData.taxLiability
      });

      return incomeTaxData;
    } catch (error) {
      logger.error('소득세 계산 실패', {
        error: error.message,
        organizationId,
        taxYear
      });
      throw error;
    }
  }

  /**
   * 법인세 자동 계산
   * @param {String} organizationId - 조직 ID
   * @param {Number} taxYear - 과세연도
   * @returns {Promise<Object>} 계산된 법인세 데이터
   */
  async calculateCorporateTax(organizationId, taxYear) {
    try {
      logger.info('법인세 계산 시작', {
        organizationId,
        taxYear
      });

      const startDate = new Date(taxYear, 0, 1);
      const endDate = new Date(taxYear, 11, 31);

      // 수익금액 조회
      const revenueAccounts = await Account.findByCategory('수익');
      let revenue = 0;

      for (const account of revenueAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        revenue += balance.balance;
      }

      // 비용금액 조회
      const expenseAccounts = await Account.findByCategory('비용');
      let expenses = 0;

      for (const account of expenseAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        expenses += balance.balance;
      }

      // 영업손익 계산
      const operatingIncome = revenue - expenses;

      // 영업외수익/비용 (예시)
      const nonOperatingIncome = 0;
      const nonOperatingExpenses = 0;

      // 과세표준 계산
      const taxableIncome = Math.max(0, operatingIncome + nonOperatingIncome - nonOperatingExpenses);

      // 산출세액 계산 (법인세율 25% 적용)
      const calculatedTax = taxableIncome * 0.25;

      // 세액공제 (간단한 계산)
      const taxCredit = Math.min(calculatedTax * 0.05, 500000); // 5% 세액공제, 최대 50만원

      // 결정세액
      const finalTax = Math.max(0, calculatedTax - taxCredit);

      // 원천징수세액 (예시)
      const withholdingTax = finalTax * 0.1; // 10% 원천징수 가정

      // 납부세액
      const taxLiability = Math.max(0, finalTax - withholdingTax);

      const corporateTaxData = {
        revenue,
        expenses,
        operatingIncome,
        nonOperatingIncome,
        nonOperatingExpenses,
        taxableIncome,
        calculatedTax,
        taxCredit,
        finalTax,
        withholdingTax,
        taxLiability
      };

      logger.info('법인세 계산 완료', {
        organizationId,
        taxLiability: corporateTaxData.taxLiability
      });

      return corporateTaxData;
    } catch (error) {
      logger.error('법인세 계산 실패', {
        error: error.message,
        organizationId,
        taxYear
      });
      throw error;
    }
  }

  /**
   * 세무 신고 자동 계산
   * @param {String} returnId - 신고 ID
   * @returns {Promise<Object>} 계산된 신고 데이터
   */
  async calculateTaxReturn(returnId) {
    try {
      logger.info('세무 신고 자동 계산 시작', { returnId });

      const taxReturn = await TaxReturn.findById(returnId);
      if (!taxReturn) {
        throw new Error('세무 신고를 찾을 수 없습니다.');
      }

      // 세목별 계산
      switch (taxReturn.taxType) {
        case 'VAT':
          const vatData = await this.calculateVAT(
            taxReturn.organizationId,
            taxReturn.taxYear,
            taxReturn.taxPeriod
          );
          taxReturn.returnData.vat = vatData;
          break;

        case 'INCOME_TAX':
          const incomeTaxData = await this.calculateIncomeTax(
            taxReturn.organizationId,
            taxReturn.taxYear
          );
          taxReturn.returnData.incomeTax = incomeTaxData;
          break;

        case 'CORPORATE_TAX':
          const corporateTaxData = await this.calculateCorporateTax(
            taxReturn.organizationId,
            taxReturn.taxYear
          );
          taxReturn.returnData.corporateTax = corporateTaxData;
          break;

        default:
          throw new Error('지원하지 않는 세목입니다.');
      }

      // 계산 완료 표시
      taxReturn.validation.isCalculated = true;
      taxReturn.validation.calculationDate = new Date();

      const savedReturn = await taxReturn.save();

      logger.info('세무 신고 자동 계산 완료', { returnId });

      return savedReturn;
    } catch (error) {
      logger.error('세무 신고 자동 계산 실패', {
        error: error.message,
        returnId
      });
      throw error;
    }
  }

  /**
   * 세무 신고 검증
   * @param {String} returnId - 신고 ID
   * @returns {Promise<Object>} 검증 결과
   */
  async validateTaxReturn(returnId) {
    try {
      logger.info('세무 신고 검증 시작', { returnId });

      const taxReturn = await TaxReturn.findById(returnId);
      if (!taxReturn) {
        throw new Error('세무 신고를 찾을 수 없습니다.');
      }

      // 검증 실행
      taxReturn.validateReturn();

      const savedReturn = await taxReturn.save();

      logger.info('세무 신고 검증 완료', {
        returnId,
        isValid: savedReturn.validation.isValid,
        errorCount: savedReturn.validation.validationErrors.length
      });

      return savedReturn;
    } catch (error) {
      logger.error('세무 신고 검증 실패', {
        error: error.message,
        returnId
      });
      throw error;
    }
  }

  /**
   * 국세청 전자세금신고 제출
   * @param {String} returnId - 신고 ID
   * @returns {Promise<Object>} 제출 결과
   */
  async submitToNTS(returnId) {
    try {
      logger.info('국세청 제출 시작', { returnId });

      const taxReturn = await TaxReturn.findById(returnId);
      if (!taxReturn) {
        throw new Error('세무 신고를 찾을 수 없습니다.');
      }

      // 검증 확인
      if (!taxReturn.validation.isValid) {
        throw new Error('검증을 통과하지 못한 신고는 제출할 수 없습니다.');
      }

      // 국세청 제출 (실제로는 국세청 API 호출)
      taxReturn.submitToNTS();

      const savedReturn = await taxReturn.save();

      logger.info('국세청 제출 완료', {
        returnId,
        submissionId: savedReturn.ntsIntegration.submissionId
      });

      return savedReturn;
    } catch (error) {
      logger.error('국세청 제출 실패', {
        error: error.message,
        returnId
      });
      throw error;
    }
  }

  /**
   * 세무 신고 조회
   * @param {String} organizationId - 조직 ID
   * @param {Object} filters - 필터 조건
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 세무 신고 목록 및 페이징 정보
   */
  async getTaxReturns(organizationId, filters = {}, options = {}) {
    try {
      const {
        taxType,
        taxYear,
        status,
        page = 1,
        limit = 20,
        sortBy = 'filingDate',
        sortOrder = 'desc'
      } = options;

      // 쿼리 조건 구성
      const query = { organizationId };

      if (taxType) {
        query.taxType = taxType;
      }

      if (taxYear) {
        query.taxYear = taxYear;
      }

      if (status) {
        query.status = status;
      }

      // 정렬 조건
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 페이징
      const skip = (page - 1) * limit;

      // 세무 신고 조회
      const taxReturns = await TaxReturn.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // 전체 개수 조회
      const total = await TaxReturn.countDocuments(query);

      logger.info('세무 신고 조회 완료', {
        organizationId,
        count: taxReturns.length,
        total
      });

      return {
        taxReturns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('세무 신고 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 기한 경과 신고 조회
   * @param {String} organizationId - 조직 ID
   * @returns {Promise<Array>} 기한 경과 신고 목록
   */
  async getOverdueReturns(organizationId) {
    try {
      logger.info('기한 경과 신고 조회 시작', { organizationId });

      const overdueReturns = await TaxReturn.findOverdueReturns(organizationId);

      logger.info('기한 경과 신고 조회 완료', {
        organizationId,
        count: overdueReturns.length
      });

      return overdueReturns;
    } catch (error) {
      logger.error('기한 경과 신고 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 계정과목 잔액 조회 (세무 계산용)
   * @param {String} organizationId - 조직 ID
   * @param {String} accountCode - 계정과목 코드
   * @param {Date} asOfDate - 기준일자
   * @returns {Promise<Object>} 계정과목 잔액 정보
   */
  async getAccountBalance(organizationId, accountCode, asOfDate = new Date()) {
    try {
      // 계정과목 정보 조회
      const account = await Account.findByCode(accountCode);
      if (!account) {
        throw new Error('계정과목을 찾을 수 없습니다.');
      }

      // 해당 계정과목의 모든 거래 조회
      const transactions = await Transaction.find({
        organizationId,
        'entries.accountCode': accountCode,
        transactionDate: { $lte: asOfDate },
        status: { $ne: 'cancelled' }
      });

      // 잔액 계산
      let totalDebit = 0;
      let totalCredit = 0;

      transactions.forEach(transaction => {
        transaction.entries.forEach(entry => {
          if (entry.accountCode === accountCode) {
            totalDebit += entry.debitAmount;
            totalCredit += entry.creditAmount;
          }
        });
      });

      // 정상잔액 계산
      let balance = 0;
      if (account.normalBalance === 'debit') {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        accountCode,
        accountName: account.accountName,
        totalDebit,
        totalCredit,
        balance
      };
    } catch (error) {
      logger.error('계정과목 잔액 조회 실패', {
        error: error.message,
        organizationId,
        accountCode
      });
      throw error;
    }
  }
}

module.exports = new TaxService(); 