const AccountingService = require('../services/AccountingService');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * 회계 컨트롤러 - 회계 관련 API 요청 처리
 * 전표 관리, 계정과목 관리, 재무제표 생성 등을 담당
 */
class AccountingController {
  /**
   * 전표 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createTransaction(req, res) {
    try {
      const { organizationId } = req.user;
      const transactionData = {
        ...req.body,
        organizationId
      };

      const transaction = await AccountingService.createTransaction(
        transactionData,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '전표가 성공적으로 생성되었습니다.',
        data: transaction
      });
    } catch (error) {
      logger.error('전표 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 전표 수정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const updateData = req.body;

      const transaction = await AccountingService.updateTransaction(
        transactionId,
        updateData,
        req.user.id
      );

      res.json({
        success: true,
        message: '전표가 성공적으로 수정되었습니다.',
        data: transaction
      });
    } catch (error) {
      logger.error('전표 수정 컨트롤러 오류', {
        error: error.message,
        transactionId: req.params.transactionId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 전표 승인
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async approveTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { note } = req.body;

      const transaction = await AccountingService.approveTransaction(
        transactionId,
        req.user.id,
        note
      );

      res.json({
        success: true,
        message: '전표가 성공적으로 승인되었습니다.',
        data: transaction
      });
    } catch (error) {
      logger.error('전표 승인 컨트롤러 오류', {
        error: error.message,
        transactionId: req.params.transactionId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 전표 취소
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async cancelTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      const transaction = await AccountingService.cancelTransaction(
        transactionId,
        req.user.id,
        reason
      );

      res.json({
        success: true,
        message: '전표가 성공적으로 취소되었습니다.',
        data: transaction
      });
    } catch (error) {
      logger.error('전표 취소 컨트롤러 오류', {
        error: error.message,
        transactionId: req.params.transactionId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 전표 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTransactions(req, res) {
    try {
      const { organizationId } = req.user;
      const filters = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'transactionDate',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await AccountingService.getTransactions(
        organizationId,
        filters,
        options
      );

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('전표 조회 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 전표 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { organizationId } = req.user;

      // Transaction 모델에서 직접 조회
      const Transaction = require('../models/Transaction');
      const transaction = await Transaction.findOne({
        _id: transactionId,
        organizationId
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: '전표를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('전표 상세 조회 컨트롤러 오류', {
        error: error.message,
        transactionId: req.params.transactionId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 계정과목 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getAccounts(req, res) {
    try {
      const { category, isActive } = req.query;
      const query = {};

      if (category) {
        query.category = category;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const accounts = await Account.find(query).sort({ sortOrder: 1, accountCode: 1 });

      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      logger.error('계정과목 조회 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 계정과목 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getAccount(req, res) {
    try {
      const { accountCode } = req.params;

      const account = await Account.findByCode(accountCode);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '계정과목을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('계정과목 상세 조회 컨트롤러 오류', {
        error: error.message,
        accountCode: req.params.accountCode,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 계정과목 잔액 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getAccountBalance(req, res) {
    try {
      const { accountCode } = req.params;
      const { organizationId } = req.user;
      const { asOfDate } = req.query;

      const balance = await AccountingService.getAccountBalance(
        organizationId,
        accountCode,
        asOfDate ? new Date(asOfDate) : new Date()
      );

      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      logger.error('계정과목 잔액 조회 컨트롤러 오류', {
        error: error.message,
        accountCode: req.params.accountCode,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 총계정원장 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getGeneralLedger(req, res) {
    try {
      const { organizationId } = req.user;
      const { fiscalYear, fiscalPeriod } = req.query;

      if (!fiscalYear || !fiscalPeriod) {
        return res.status(400).json({
          success: false,
          message: '회계연도와 회계기간은 필수입니다.'
        });
      }

      const ledger = await AccountingService.getGeneralLedger(
        organizationId,
        parseInt(fiscalYear),
        parseInt(fiscalPeriod)
      );

      res.json({
        success: true,
        data: ledger
      });
    } catch (error) {
      logger.error('총계정원장 조회 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 손익계산서 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async generateIncomeStatement(req, res) {
    try {
      const { organizationId } = req.user;
      const { fiscalYear, fiscalPeriod } = req.query;

      if (!fiscalYear || !fiscalPeriod) {
        return res.status(400).json({
          success: false,
          message: '회계연도와 회계기간은 필수입니다.'
        });
      }

      const incomeStatement = await AccountingService.generateIncomeStatement(
        organizationId,
        parseInt(fiscalYear),
        parseInt(fiscalPeriod)
      );

      res.json({
        success: true,
        data: incomeStatement
      });
    } catch (error) {
      logger.error('손익계산서 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 재무상태표 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async generateBalanceSheet(req, res) {
    try {
      const { organizationId } = req.user;
      const { fiscalYear, fiscalPeriod } = req.query;

      if (!fiscalYear || !fiscalPeriod) {
        return res.status(400).json({
          success: false,
          message: '회계연도와 회계기간은 필수입니다.'
        });
      }

      const balanceSheet = await AccountingService.generateBalanceSheet(
        organizationId,
        parseInt(fiscalYear),
        parseInt(fiscalPeriod)
      );

      res.json({
        success: true,
        data: balanceSheet
      });
    } catch (error) {
      logger.error('재무상태표 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 회계 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getAccountingStats(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: '시작일과 종료일은 필수입니다.'
        });
      }

      // Transaction 모델에서 통계 조회
      const Transaction = require('../models/Transaction');
      
      const totalTransactions = await Transaction.countDocuments({
        organizationId,
        transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: { $ne: 'cancelled' }
      });

      const postedTransactions = await Transaction.countDocuments({
        organizationId,
        transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'posted'
      });

      const draftTransactions = await Transaction.countDocuments({
        organizationId,
        transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'draft'
      });

      const totalAmount = await Transaction.aggregate([
        {
          $match: {
            organizationId,
            transactionDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      const stats = {
        totalTransactions,
        postedTransactions,
        draftTransactions,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        postingRate: totalTransactions > 0 ? (postedTransactions / totalTransactions) * 100 : 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('회계 통계 조회 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AccountingController(); 