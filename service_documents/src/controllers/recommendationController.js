/**
 * RecommendationController - 추천/연관 문서 API 컨트롤러
 * 최근 검색/클릭 기반 추천, 연관 문서 추천 API 제공
 *
 * @description
 * - 최근 검색/클릭 기반 추천 문서 API
 * - 연관 문서 추천 API
 * - 상세 주석 및 예외처리 포함
 *
 * @author Your Team
 * @version 1.0.0
 */

const recommendationService = require('../services/recommendationService');
const { logger } = require('../config/logger');

class RecommendationController {
  /**
   * 최근 검색 기반 추천 문서 API
   * @route GET /api/recommendation/recent-search
   * @query {number} limit - 추천 개수
   */
  async recommendByRecentSearch(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;
      const results = await recommendationService.recommendByRecentSearch(userId, limit);
      res.json({ success: true, data: results });
    } catch (error) {
      logger.error('최근 검색 기반 추천 API 오류:', error);
      res.status(500).json({ success: false, message: '추천 문서 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 최근 클릭 기반 추천 문서 API
   * @route GET /api/recommendation/recent-click
   * @query {number} limit - 추천 개수
   */
  async recommendByRecentClick(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;
      const results = await recommendationService.recommendByRecentClick(userId, limit);
      res.json({ success: true, data: results });
    } catch (error) {
      logger.error('최근 클릭 기반 추천 API 오류:', error);
      res.status(500).json({ success: false, message: '추천 문서 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 연관 문서 추천 API
   * @route POST /api/recommendation/related
   * @body {object} doc - 기준 문서
   * @body {number} limit - 추천 개수
   */
  async recommendRelatedDocuments(req, res) {
    try {
      const { doc, limit = 5 } = req.body;
      if (!doc || !doc._id) {
        return res.status(400).json({ success: false, message: '기준 문서 정보가 필요합니다.' });
      }
      const results = await recommendationService.recommendRelatedDocuments(doc, limit);
      res.json({ success: true, data: results });
    } catch (error) {
      logger.error('연관 문서 추천 API 오류:', error);
      res.status(500).json({ success: false, message: '연관 문서 추천 중 오류가 발생했습니다.', error: error.message });
    }
  }
}

const recommendationController = new RecommendationController();
module.exports = recommendationController; 