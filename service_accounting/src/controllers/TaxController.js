const TaxService = require('../services/TaxService');
const TaxReturn = require('../models/TaxReturn');
const logger = require('../utils/logger');

/**
 * 세무 컨트롤러 - 세무 관련 API 요청 처리
 * 부가세, 소득세, 법인세, 원천세 신고서 관리 등을 담당
 */
class TaxController {
  /**
   * 부가가치세 신고서 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createVatReturn(req, res) {
    try {
      const { organizationId } = req.user;
      const { period } = req.body;

      const vatReturn = await TaxService.createVatReturn(
        organizationId,
        period,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '부가가치세 신고서가 성공적으로 생성되었습니다.',
        data: vatReturn
      });
    } catch (error) {
      logger.error('부가가치세 신고서 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        period: req.body.period
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 종합소득세 신고서 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createIncomeTaxReturn(req, res) {
    try {
      const { organizationId } = req.user;
      const { year, taxpayerId } = req.body;

      const incomeTaxReturn = await TaxService.createIncomeTaxReturn(
        organizationId,
        year,
        taxpayerId,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '종합소득세 신고서가 성공적으로 생성되었습니다.',
        data: incomeTaxReturn
      });
    } catch (error) {
      logger.error('종합소득세 신고서 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        year: req.body.year
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 법인세 신고서 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createCorporateTaxReturn(req, res) {
    try {
      const { organizationId } = req.user;
      const { year, corporateId } = req.body;

      const corporateTaxReturn = await TaxService.createCorporateTaxReturn(
        organizationId,
        year,
        corporateId,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '법인세 신고서가 성공적으로 생성되었습니다.',
        data: corporateTaxReturn
      });
    } catch (error) {
      logger.error('법인세 신고서 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        year: req.body.year
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 원천세 신고서 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createWithholdingTaxReturn(req, res) {
    try {
      const { organizationId } = req.user;
      const { period, type } = req.body;

      const withholdingTaxReturn = await TaxService.createWithholdingTaxReturn(
        organizationId,
        period,
        type,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: '원천세 신고서가 성공적으로 생성되었습니다.',
        data: withholdingTaxReturn
      });
    } catch (error) {
      logger.error('원천세 신고서 생성 컨트롤러 오류', {
        error: error.message,
        userId: req.user.id,
        period: req.body.period,
        type: req.body.type
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTaxReturns(req, res) {
    try {
      const { organizationId } = req.user;
      const filters = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await TaxService.getTaxReturns(
        organizationId,
        filters,
        options
      );

      res.json({
        success: true,
        data: result.taxReturns,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('세무 신고서 목록 조회 컨트롤러 오류', {
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
   * 세무 신고서 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const { organizationId } = req.user;

      const taxReturn = await TaxService.getTaxReturn(
        taxReturnId,
        organizationId
      );

      res.json({
        success: true,
        data: taxReturn
      });
    } catch (error) {
      logger.error('세무 신고서 상세 조회 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 수정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const updateData = req.body;

      const taxReturn = await TaxService.updateTaxReturn(
        taxReturnId,
        updateData,
        req.user.id
      );

      res.json({
        success: true,
        message: '세무 신고서가 성공적으로 수정되었습니다.',
        data: taxReturn
      });
    } catch (error) {
      logger.error('세무 신고서 수정 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 제출
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async submitTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const { organizationId } = req.user;

      const result = await TaxService.submitTaxReturn(
        taxReturnId,
        organizationId,
        req.user.id
      );

      res.json({
        success: true,
        message: '세무 신고서가 성공적으로 제출되었습니다.',
        data: result
      });
    } catch (error) {
      logger.error('세무 신고서 제출 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async deleteTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const { organizationId } = req.user;

      await TaxService.deleteTaxReturn(
        taxReturnId,
        organizationId,
        req.user.id
      );

      res.json({
        success: true,
        message: '세무 신고서가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      logger.error('세무 신고서 삭제 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 검증
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async validateTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const { organizationId } = req.user;

      const validationResult = await TaxService.validateTaxReturn(
        taxReturnId,
        organizationId
      );

      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      logger.error('세무 신고서 검증 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 계산
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async calculateTaxReturn(req, res) {
    try {
      const { taxReturnId } = req.params;
      const { organizationId } = req.user;

      const calculationResult = await TaxService.calculateTaxReturn(
        taxReturnId,
        organizationId
      );

      res.json({
        success: true,
        data: calculationResult
      });
    } catch (error) {
      logger.error('세무 신고서 계산 컨트롤러 오류', {
        error: error.message,
        taxReturnId: req.params.taxReturnId,
        userId: req.user.id
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 세무 신고서 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTaxReturnStats(req, res) {
    try {
      const { organizationId } = req.user;
      const { year, type } = req.query;

      const stats = await TaxService.getTaxReturnStats(
        organizationId,
        year,
        type
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('세무 신고서 통계 조회 컨트롤러 오류', {
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
   * 기한 경과 신고서 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getOverdueTaxReturns(req, res) {
    try {
      const { organizationId } = req.user;
      const { type } = req.query;

      const overdueReturns = await TaxService.getOverdueTaxReturns(
        organizationId,
        type
      );

      res.json({
        success: true,
        data: overdueReturns
      });
    } catch (error) {
      logger.error('기한 경과 신고서 조회 컨트롤러 오류', {
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

module.exports = new TaxController(); 