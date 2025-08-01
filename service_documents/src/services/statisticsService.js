/**
 * StatisticsService - 검색/추천 행동 통계 집계 서비스
 * SearchLog 기반 검색/추천 통계 집계 (AI 분석 제외)
 *
 * @description
 * - 일별/사용자별 검색수, 인기 쿼리, 클릭률, 추천 클릭률 등 제공
 * - SearchLog 기반 집계, AI 추천/분석은 제외
 * - 상세 주석 및 확장성 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

const SearchLog = require('../models/SearchLog');
const { logger } = require('../config/logger');

class StatisticsService {
  /**
   * 일별 검색수 집계
   * @param {Date} startDate - 시작일
   * @param {Date} endDate - 종료일
   * @returns {Promise<Array>} [{ date, count }]
   */
  async getDailySearchCount(startDate, endDate) {
    try {
      const match = {};
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = startDate;
        if (endDate) match.createdAt.$lte = endDate;
      }
      const result = await SearchLog.aggregate([
        { $match: match },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
      return result.map(r => ({ date: r._id, count: r.count }));
    } catch (error) {
      logger.error('일별 검색수 집계 실패:', error);
      return [];
    }
  }

  /**
   * 인기 검색 쿼리 집계
   * @param {number} limit - 상위 N개
   * @returns {Promise<Array>} [{ query, count }]
   */
  async getTopQueries(limit = 10) {
    try {
      const result = await SearchLog.aggregate([
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      return result.map(r => ({ query: r._id, count: r.count }));
    } catch (error) {
      logger.error('인기 쿼리 집계 실패:', error);
      return [];
    }
  }

  /**
   * 사용자별 검색수 집계
   * @param {number} limit - 상위 N명
   * @returns {Promise<Array>} [{ userId, count }]
   */
  async getTopUsers(limit = 10) {
    try {
      const result = await SearchLog.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      return result.map(r => ({ userId: r._id, count: r.count }));
    } catch (error) {
      logger.error('사용자별 검색수 집계 실패:', error);
      return [];
    }
  }

  /**
   * 전체 검색수, 클릭수, 클릭률
   * @returns {Promise<Object>} { totalSearch, totalClick, clickRate }
   */
  async getSearchClickStats() {
    try {
      const totalSearch = await SearchLog.countDocuments();
      const totalClick = await SearchLog.countDocuments({ clickedIds: { $exists: true, $not: { $size: 0 } } });
      const clickRate = totalSearch > 0 ? (totalClick / totalSearch) * 100 : 0;
      return { totalSearch, totalClick, clickRate };
    } catch (error) {
      logger.error('검색/클릭 통계 집계 실패:', error);
      return { totalSearch: 0, totalClick: 0, clickRate: 0 };
    }
  }

  /**
   * 추천 클릭률(추천 결과 클릭 비율)
   * @returns {Promise<Object>} { totalRecommend, recommendClick, recommendClickRate }
   */
  async getRecommendationClickStats() {
    try {
      // 추천 결과가 노출된 로그(추천 결과가 results에 포함) 중 클릭이 발생한 비율
      const totalRecommend = await SearchLog.countDocuments({ results: { $exists: true, $not: { $size: 0 } } });
      const recommendClick = await SearchLog.countDocuments({ results: { $exists: true, $not: { $size: 0 } }, clickedIds: { $exists: true, $not: { $size: 0 } } });
      const recommendClickRate = totalRecommend > 0 ? (recommendClick / totalRecommend) * 100 : 0;
      return { totalRecommend, recommendClick, recommendClickRate };
    } catch (error) {
      logger.error('추천 클릭률 집계 실패:', error);
      return { totalRecommend: 0, recommendClick: 0, recommendClickRate: 0 };
    }
  }

  /**
   * 최근 검색/추천 로그 (대시보드용)
   * @param {number} limit - 최대 개수
   * @returns {Promise<Array>} 최근 로그
   */
  async getRecentLogs(limit = 20) {
    try {
      const logs = await SearchLog.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return logs;
    } catch (error) {
      logger.error('최근 검색/추천 로그 조회 실패:', error);
      return [];
    }
  }
}

const statisticsService = new StatisticsService();
module.exports = statisticsService; 