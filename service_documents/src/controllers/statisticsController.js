/**
 * StatisticsController - 검색/추천 행동 통계 API 컨트롤러
 * SearchLog 기반 통계 API 제공 (AI 분석 제외)
 *
 * @description
 * - 일별 검색수, 인기 쿼리, 사용자별 검색수, 클릭률, 추천 클릭률, 최근 로그 등 API
 * - 상세 주석 및 예외처리 포함
 *
 * @author Your Team
 * @version 1.0.0
 */

const statisticsService = require('../services/statisticsService');
const { logger } = require('../config/logger');

class StatisticsController {
  /**
   * 일별 검색수 API
   * @route GET /api/statistics/daily-search
   * @query {string} startDate - 시작일(YYYY-MM-DD)
   * @query {string} endDate - 종료일(YYYY-MM-DD)
   */
  async getDailySearchCount(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const data = await statisticsService.getDailySearchCount(start, end);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('일별 검색수 API 오류:', error);
      res.status(500).json({ success: false, message: '일별 검색수 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 인기 쿼리 API
   * @route GET /api/statistics/top-queries
   * @query {number} limit - 상위 N개
   */
  async getTopQueries(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await statisticsService.getTopQueries(limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('인기 쿼리 API 오류:', error);
      res.status(500).json({ success: false, message: '인기 쿼리 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 사용자별 검색수 API
   * @route GET /api/statistics/top-users
   * @query {number} limit - 상위 N명
   */
  async getTopUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await statisticsService.getTopUsers(limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('사용자별 검색수 API 오류:', error);
      res.status(500).json({ success: false, message: '사용자별 검색수 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 전체 검색수/클릭수/클릭률 API
   * @route GET /api/statistics/search-click
   */
  async getSearchClickStats(req, res) {
    try {
      const data = await statisticsService.getSearchClickStats();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('검색/클릭 통계 API 오류:', error);
      res.status(500).json({ success: false, message: '검색/클릭 통계 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 추천 클릭률 API
   * @route GET /api/statistics/recommend-click
   */
  async getRecommendationClickStats(req, res) {
    try {
      const data = await statisticsService.getRecommendationClickStats();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('추천 클릭률 API 오류:', error);
      res.status(500).json({ success: false, message: '추천 클릭률 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 최근 검색/추천 로그 API
   * @route GET /api/statistics/recent-logs
   * @query {number} limit - 최대 개수
   */
  async getRecentLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const data = await statisticsService.getRecentLogs(limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('최근 로그 API 오류:', error);
      res.status(500).json({ success: false, message: '최근 로그 조회 중 오류가 발생했습니다.', error: error.message });
    }
  }
}

const statisticsController = new StatisticsController();
module.exports = statisticsController; 