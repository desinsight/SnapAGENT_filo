const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * 회계 서비스 - 전표 관리, 계정과목 관리, 재무제표 생성
 * 복식부기 회계의 핵심 비즈니스 로직을 담당
 */
class AccountingService {
  /**
   * 전표 생성
   * @param {Object} transactionData - 전표 데이터
   * @param {String} userId - 작성자 ID
   * @returns {Promise<Object>} 생성된 전표
   */
  async createTransaction(transactionData, userId) {
    try {
      logger.info('전표 생성 시작', {
        organizationId: transactionData.organizationId,
        userId,
        transactionType: transactionData.transactionType
      });

      // 계정과목 유효성 검증
      await this.validateAccounts(transactionData.entries);

      // 차변/대변 균형 검증
      this.validateBalance(transactionData.entries);

      // 전표 생성
      const transaction = new Transaction({
        ...transactionData,
        createdBy: userId,
        lastModifiedBy: userId
      });

      const savedTransaction = await transaction.save();

      // 계정과목 사용 통계 업데이트
      await this.updateAccountUsageStats(transactionData.entries);

      logger.info('전표 생성 완료', {
        transactionId: savedTransaction._id,
        transactionNumber: savedTransaction.transactionNumber
      });

      return savedTransaction;
    } catch (error) {
      logger.error('전표 생성 실패', {
        error: error.message,
        organizationId: transactionData.organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * 전표 수정
   * @param {String} transactionId - 전표 ID
   * @param {Object} updateData - 수정 데이터
   * @param {String} userId - 수정자 ID
   * @returns {Promise<Object>} 수정된 전표
   */
  async updateTransaction(transactionId, updateData, userId) {
    try {
      logger.info('전표 수정 시작', { transactionId, userId });

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('전표를 찾을 수 없습니다.');
      }

      // 승인된 전표는 수정 불가
      if (transaction.status === 'posted') {
        throw new Error('승인된 전표는 수정할 수 없습니다.');
      }

      // 계정과목 유효성 검증
      if (updateData.entries) {
        await this.validateAccounts(updateData.entries);
        this.validateBalance(updateData.entries);
      }

      // 전표 수정
      Object.assign(transaction, updateData, {
        lastModifiedBy: userId
      });

      const updatedTransaction = await transaction.save();

      logger.info('전표 수정 완료', { transactionId });

      return updatedTransaction;
    } catch (error) {
      logger.error('전표 수정 실패', {
        error: error.message,
        transactionId,
        userId
      });
      throw error;
    }
  }

  /**
   * 전표 승인
   * @param {String} transactionId - 전표 ID
   * @param {String} approvedBy - 승인자 ID
   * @param {String} note - 승인 메모
   * @returns {Promise<Object>} 승인된 전표
   */
  async approveTransaction(transactionId, approvedBy, note = '') {
    try {
      logger.info('전표 승인 시작', { transactionId, approvedBy });

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('전표를 찾을 수 없습니다.');
      }

      if (transaction.status === 'posted') {
        throw new Error('이미 승인된 전표입니다.');
      }

      // 전표 승인
      transaction.approve(approvedBy, note);
      const approvedTransaction = await transaction.save();

      logger.info('전표 승인 완료', { transactionId });

      return approvedTransaction;
    } catch (error) {
      logger.error('전표 승인 실패', {
        error: error.message,
        transactionId,
        approvedBy
      });
      throw error;
    }
  }

  /**
   * 전표 취소
   * @param {String} transactionId - 전표 ID
   * @param {String} cancelledBy - 취소자 ID
   * @param {String} reason - 취소 사유
   * @returns {Promise<Object>} 취소된 전표
   */
  async cancelTransaction(transactionId, cancelledBy, reason = '') {
    try {
      logger.info('전표 취소 시작', { transactionId, cancelledBy });

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('전표를 찾을 수 없습니다.');
      }

      // 전표 취소
      transaction.cancel(cancelledBy, reason);
      const cancelledTransaction = await transaction.save();

      logger.info('전표 취소 완료', { transactionId });

      return cancelledTransaction;
    } catch (error) {
      logger.error('전표 취소 실패', {
        error: error.message,
        transactionId,
        cancelledBy
      });
      throw error;
    }
  }

  /**
   * 전표 조회
   * @param {String} organizationId - 조직 ID
   * @param {Object} filters - 필터 조건
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 전표 목록 및 페이징 정보
   */
  async getTransactions(organizationId, filters = {}, options = {}) {
    try {
      const {
        startDate,
        endDate,
        status,
        transactionType,
        accountCode,
        page = 1,
        limit = 20,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = options;

      // 쿼리 조건 구성
      const query = { organizationId };

      if (startDate && endDate) {
        query.transactionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      if (status) {
        query.status = status;
      }

      if (transactionType) {
        query.transactionType = transactionType;
      }

      if (accountCode) {
        query['entries.accountCode'] = accountCode;
      }

      // 정렬 조건
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 페이징
      const skip = (page - 1) * limit;

      // 전표 조회
      const transactions = await Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email');

      // 전체 개수 조회
      const total = await Transaction.countDocuments(query);

      logger.info('전표 조회 완료', {
        organizationId,
        count: transactions.length,
        total
      });

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('전표 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 계정과목 잔액 조회
   * @param {String} organizationId - 조직 ID
   * @param {String} accountCode - 계정과목 코드
   * @param {Date} asOfDate - 기준일자
   * @returns {Promise<Object>} 계정과목 잔액 정보
   */
  async getAccountBalance(organizationId, accountCode, asOfDate = new Date()) {
    try {
      logger.info('계정과목 잔액 조회 시작', {
        organizationId,
        accountCode,
        asOfDate
      });

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

      const result = {
        accountCode,
        accountName: account.accountName,
        category: account.category,
        normalBalance: account.normalBalance,
        totalDebit,
        totalCredit,
        balance,
        asOfDate
      };

      logger.info('계정과목 잔액 조회 완료', {
        accountCode,
        balance
      });

      return result;
    } catch (error) {
      logger.error('계정과목 잔액 조회 실패', {
        error: error.message,
        organizationId,
        accountCode
      });
      throw error;
    }
  }

  /**
   * 총계정원장 조회
   * @param {String} organizationId - 조직 ID
   * @param {Number} fiscalYear - 회계연도
   * @param {Number} fiscalPeriod - 회계기간
   * @returns {Promise<Array>} 총계정원장
   */
  async getGeneralLedger(organizationId, fiscalYear, fiscalPeriod) {
    try {
      logger.info('총계정원장 조회 시작', {
        organizationId,
        fiscalYear,
        fiscalPeriod
      });

      // 활성 계정과목 조회
      const accounts = await Account.findActiveAccounts();

      // 각 계정과목별 잔액 계산
      const ledger = [];

      for (const account of accounts) {
        const balance = await this.getAccountBalance(
          organizationId,
          account.accountCode,
          new Date(fiscalYear, fiscalPeriod, 0) // 해당 월의 마지막 날
        );

        if (balance.totalDebit > 0 || balance.totalCredit > 0) {
          ledger.push(balance);
        }
      }

      // 계정과목 코드 순으로 정렬
      ledger.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      logger.info('총계정원장 조회 완료', {
        organizationId,
        accountCount: ledger.length
      });

      return ledger;
    } catch (error) {
      logger.error('총계정원장 조회 실패', {
        error: error.message,
        organizationId,
        fiscalYear,
        fiscalPeriod
      });
      throw error;
    }
  }

  /**
   * 손익계산서 생성
   * @param {String} organizationId - 조직 ID
   * @param {Number} fiscalYear - 회계연도
   * @param {Number} fiscalPeriod - 회계기간
   * @returns {Promise<Object>} 손익계산서
   */
  async generateIncomeStatement(organizationId, fiscalYear, fiscalPeriod) {
    try {
      logger.info('손익계산서 생성 시작', {
        organizationId,
        fiscalYear,
        fiscalPeriod
      });

      const startDate = new Date(fiscalYear, 0, 1); // 연초
      const endDate = new Date(fiscalYear, fiscalPeriod, 0); // 해당 월 말

      // 수익 계정과목 조회
      const revenueAccounts = await Account.findByCategory('수익');
      let totalRevenue = 0;
      const revenueDetails = [];

      for (const account of revenueAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        if (balance.balance > 0) {
          revenueDetails.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: balance.balance
          });
          totalRevenue += balance.balance;
        }
      }

      // 비용 계정과목 조회
      const expenseAccounts = await Account.findByCategory('비용');
      let totalExpenses = 0;
      const expenseDetails = [];

      for (const account of expenseAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, endDate);
        if (balance.balance > 0) {
          expenseDetails.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: balance.balance
          });
          totalExpenses += balance.balance;
        }
      }

      const netIncome = totalRevenue - totalExpenses;

      const incomeStatement = {
        fiscalYear,
        fiscalPeriod,
        period: `${fiscalYear}년 ${fiscalPeriod}월`,
        revenue: {
          total: totalRevenue,
          details: revenueDetails
        },
        expenses: {
          total: totalExpenses,
          details: expenseDetails
        },
        netIncome,
        generatedAt: new Date()
      };

      logger.info('손익계산서 생성 완료', {
        organizationId,
        netIncome
      });

      return incomeStatement;
    } catch (error) {
      logger.error('손익계산서 생성 실패', {
        error: error.message,
        organizationId,
        fiscalYear,
        fiscalPeriod
      });
      throw error;
    }
  }

  /**
   * 재무상태표 생성
   * @param {String} organizationId - 조직 ID
   * @param {Number} fiscalYear - 회계연도
   * @param {Number} fiscalPeriod - 회계기간
   * @returns {Promise<Object>} 재무상태표
   */
  async generateBalanceSheet(organizationId, fiscalYear, fiscalPeriod) {
    try {
      logger.info('재무상태표 생성 시작', {
        organizationId,
        fiscalYear,
        fiscalPeriod
      });

      const asOfDate = new Date(fiscalYear, fiscalPeriod, 0); // 해당 월 말

      // 자산 계정과목 조회
      const assetAccounts = await Account.findByCategory('자산');
      let totalAssets = 0;
      const assetDetails = [];

      for (const account of assetAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, asOfDate);
        if (balance.balance > 0) {
          assetDetails.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: balance.balance
          });
          totalAssets += balance.balance;
        }
      }

      // 부채 계정과목 조회
      const liabilityAccounts = await Account.findByCategory('부채');
      let totalLiabilities = 0;
      const liabilityDetails = [];

      for (const account of liabilityAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, asOfDate);
        if (balance.balance > 0) {
          liabilityDetails.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: balance.balance
          });
          totalLiabilities += balance.balance;
        }
      }

      // 자본 계정과목 조회
      const equityAccounts = await Account.findByCategory('자본');
      let totalEquity = 0;
      const equityDetails = [];

      for (const account of equityAccounts) {
        const balance = await this.getAccountBalance(organizationId, account.accountCode, asOfDate);
        if (balance.balance > 0) {
          equityDetails.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            amount: balance.balance
          });
          totalEquity += balance.balance;
        }
      }

      const balanceSheet = {
        fiscalYear,
        fiscalPeriod,
        asOfDate,
        assets: {
          total: totalAssets,
          details: assetDetails
        },
        liabilities: {
          total: totalLiabilities,
          details: liabilityDetails
        },
        equity: {
          total: totalEquity,
          details: equityDetails
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        generatedAt: new Date()
      };

      logger.info('재무상태표 생성 완료', {
        organizationId,
        totalAssets,
        totalLiabilities,
        totalEquity
      });

      return balanceSheet;
    } catch (error) {
      logger.error('재무상태표 생성 실패', {
        error: error.message,
        organizationId,
        fiscalYear,
        fiscalPeriod
      });
      throw error;
    }
  }

  /**
   * 계정과목 유효성 검증
   * @param {Array} entries - 전표 항목들
   * @returns {Promise<void>}
   */
  async validateAccounts(entries) {
    for (const entry of entries) {
      const account = await Account.findByCode(entry.accountCode);
      if (!account) {
        throw new Error(`존재하지 않는 계정과목입니다: ${entry.accountCode}`);
      }
      if (!account.isActive) {
        throw new Error(`비활성화된 계정과목입니다: ${entry.accountCode}`);
      }
    }
  }

  /**
   * 차변/대변 균형 검증
   * @param {Array} entries - 전표 항목들
   * @returns {void}
   */
  validateBalance(entries) {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('차변과 대변의 합계가 일치하지 않습니다.');
    }
  }

  /**
   * 계정과목 사용 통계 업데이트
   * @param {Array} entries - 전표 항목들
   * @returns {Promise<void>}
   */
  async updateAccountUsageStats(entries) {
    for (const entry of entries) {
      const account = await Account.findByCode(entry.accountCode);
      if (account) {
        await account.updateUsageStats();
      }
    }
  }
}

module.exports = new AccountingService(); 