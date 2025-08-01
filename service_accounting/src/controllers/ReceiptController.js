const ReceiptService = require('../services/ReceiptService');
const Receipt = require('../models/Receipt');
const logger = require('../utils/logger');

/**
 * 영수증 컨트롤러 - 영수증 관련 API 요청 처리
 * OCR 처리, 자동 분류, 증빙 관리, 회계 연동 등을 담당
 */
class ReceiptController {
  /**
   * 영수증 업로드 및 AI 처리
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async uploadReceipt(req, res) {
    try {
      const { organizationId } = req.user;
      const { category } = req.body;
      const file = req.file; // multer 미들웨어에서 처리된 파일

      if (!file) {
        return res.status(400).json({
          success: false,
          message: '영수증 파일이 필요합니다.'
        });
      }

      const receipt = await ReceiptService.uploadReceipt(
        organizationId,
        file,
        category,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '영수증이 성공적으로 업로드되고 처리되었습니다.',
        data: receipt
      });
    } catch (error) {
      logger.error('영수증 업로드 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        fileName: req.file?.originalname
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getReceipts(req, res) {
    try {
      const { organizationId } = req.user;
      const filters = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'uploadedAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await ReceiptService.getReceipts(
        organizationId,
        filters,
        options
      );

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('영수증 목록 조회 컨트롤러 오류', {
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
   * 영수증 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { organizationId } = req.user;

      const receipt = await ReceiptService.getReceipt(
        receiptId,
        organizationId
      );

      res.json({
        success: true,
        data: receipt
      });
    } catch (error) {
      logger.error('영수증 상세 조회 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 수동 분류
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async classifyReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { category, accountCode, description } = req.body;
      const { organizationId } = req.user;

      const receipt = await ReceiptService.classifyReceipt(
        receiptId,
        organizationId,
        {
          category,
          accountCode,
          description
        },
        req.user.id
      );

      res.json({
        success: true,
        message: '영수증이 성공적으로 분류되었습니다.',
        data: receipt
      });
    } catch (error) {
      logger.error('영수증 분류 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 검토
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async reviewReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { status, note } = req.body;
      const { organizationId } = req.user;

      const receipt = await ReceiptService.reviewReceipt(
        receiptId,
        organizationId,
        status,
        note,
        req.user.id
      );

      res.json({
        success: true,
        message: '영수증 검토가 완료되었습니다.',
        data: receipt
      });
    } catch (error) {
      logger.error('영수증 검토 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증에서 회계 전표 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createTransactionFromReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { organizationId } = req.user;

      const transaction = await ReceiptService.createTransactionFromReceipt(
        receiptId,
        organizationId,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '영수증에서 회계 전표가 성공적으로 생성되었습니다.',
        data: transaction
      });
    } catch (error) {
      logger.error('영수증 전표 생성 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 일괄 처리
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async processReceiptsBatch(req, res) {
    try {
      const { organizationId } = req.user;
      const { receiptIds, action, options } = req.body;

      const result = await ReceiptService.processReceiptsBatch(
        organizationId,
        receiptIds,
        action,
        options,
        req.user.id
      );

      res.json({
        success: true,
        message: '영수증 일괄 처리가 완료되었습니다.',
        data: result
      });
    } catch (error) {
      logger.error('영수증 일괄 처리 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        action: req.body.action
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async deleteReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { organizationId } = req.user;

      await ReceiptService.deleteReceipt(
        receiptId,
        organizationId,
        req.user.id
      );

      res.json({
        success: true,
        message: '영수증이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      logger.error('영수증 삭제 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 미처리 영수증 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getUnprocessedReceipts(req, res) {
    try {
      const { organizationId } = req.user;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ReceiptService.getUnprocessedReceipts(
        organizationId,
        options
      );

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('미처리 영수증 조회 컨트롤러 오류', {
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
   * 미분류 영수증 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getUnclassifiedReceipts(req, res) {
    try {
      const { organizationId } = req.user;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ReceiptService.getUnclassifiedReceipts(
        organizationId,
        options
      );

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('미분류 영수증 조회 컨트롤러 오류', {
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
   * 미전표 영수증 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getUnjournalizedReceipts(req, res) {
    try {
      const { organizationId } = req.user;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ReceiptService.getUnjournalizedReceipts(
        organizationId,
        options
      );

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('미전표 영수증 조회 컨트롤러 오류', {
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
   * 영수증 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getReceiptStats(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate, category } = req.query;

      const stats = await ReceiptService.getReceiptStats(
        organizationId,
        startDate,
        endDate,
        category
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('영수증 통계 조회 컨트롤러 오류', {
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
   * 영수증 이미지 다운로드
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async downloadReceiptImage(req, res) {
    try {
      const { receiptId } = req.params;
      const { organizationId } = req.user;

      const imageStream = await ReceiptService.downloadReceiptImage(
        receiptId,
        organizationId
      );

      // 이미지 스트림을 응답으로 전송
      imageStream.pipe(res);
    } catch (error) {
      logger.error('영수증 이미지 다운로드 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 영수증 재처리 (OCR 재실행)
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async reprocessReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const { organizationId } = req.user;

      const receipt = await ReceiptService.reprocessReceipt(
        receiptId,
        organizationId,
        req.user.id
      );

      res.json({
        success: true,
        message: '영수증이 성공적으로 재처리되었습니다.',
        data: receipt
      });
    } catch (error) {
      logger.error('영수증 재처리 컨트롤러 오류', {
        error: error.message,
        receiptId: req.params.receiptId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ReceiptController(); 