/**
 * RecommendationService - 추천/연관 문서 서비스
 * 최근 검색/클릭 기반 추천, 연관 문서 조회 기능 제공
 *
 * @description
 * - 최근 검색/클릭/조회 기반 추천 문서 제공
 * - 연관 문서(유사 쿼리, 태그, 카테고리 등) 조회
 * - 추후 AI 추천, 사용자별 맞춤화 등 확장 고려
 * - 상세 주석 포함
 *
 * @author Your Team
 * @version 1.0.0
 */

const SearchLog = require('../models/SearchLog');
const { logger } = require('../config/logger');
const advancedSearchService = require('./advancedSearchService');

class RecommendationService {
  /**
   * 최근 검색 기반 추천 문서
   * @param {string} userId - 사용자 ID
   * @param {number} limit - 추천 개수
   * @returns {Promise<Array>} 추천 문서 리스트
   */
  async recommendByRecentSearch(userId, limit = 5) {
    try {
      // 최근 검색 로그에서 쿼리 추출
      const logs = await SearchLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      const recentQueries = logs.map(log => log.query).filter(Boolean);
      if (recentQueries.length === 0) return [];

      // 최근 쿼리로 문서 검색 (중복 제거)
      const uniqueQueries = [...new Set(recentQueries)];
      const results = [];
      for (const q of uniqueQueries) {
        const searchResult = await advancedSearchService.searchByIndex('document', { q, limit: 2 });
        if (searchResult.success && searchResult.data.results.length > 0) {
          results.push(...searchResult.data.results);
        }
        if (results.length >= limit) break;
      }
      // 중복 문서 제거
      const seen = new Set();
      const recommended = results.filter(doc => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      });
      return recommended.slice(0, limit);
    } catch (error) {
      logger.error('최근 검색 기반 추천 실패:', error);
      return [];
    }
  }

  /**
   * 최근 클릭 기반 추천 문서
   * @param {string} userId - 사용자 ID
   * @param {number} limit - 추천 개수
   * @returns {Promise<Array>} 추천 문서 리스트
   */
  async recommendByRecentClick(userId, limit = 5) {
    try {
      // 최근 클릭 로그에서 문서 ID 추출
      const logs = await SearchLog.find({ userId, clickedIds: { $exists: true, $not: { $size: 0 } } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      const clickedIds = logs.flatMap(log => log.clickedIds).filter(Boolean);
      if (clickedIds.length === 0) return [];
      // 중복 제거
      const uniqueIds = [...new Set(clickedIds)];
      // 해당 문서 상세 검색
      const docs = [];
      for (const id of uniqueIds.slice(0, limit * 2)) {
        const searchResult = await advancedSearchService.searchByIndex('document', { filters: { _id: id }, limit: 1 });
        if (searchResult.success && searchResult.data.results.length > 0) {
          docs.push(searchResult.data.results[0]);
        }
        if (docs.length >= limit) break;
      }
      return docs.slice(0, limit);
    } catch (error) {
      logger.error('최근 클릭 기반 추천 실패:', error);
      return [];
    }
  }

  /**
   * 연관 문서 추천 (유사 쿼리, 태그, 카테고리 등)
   * @param {object} doc - 기준 문서
   * @param {number} limit - 추천 개수
   * @returns {Promise<Array>} 연관 문서 리스트
   */
  async recommendRelatedDocuments(doc, limit = 5) {
    try {
      // 태그, 카테고리, 제목 등으로 유사 문서 검색
      const filters = {};
      if (doc.tags && doc.tags.length > 0) filters.tags = doc.tags;
      if (doc.category) filters.category = doc.category;
      // 제목 일부로 유사 검색
      const q = doc.title ? doc.title.split(' ').slice(0, 3).join(' ') : '';
      const searchResult = await advancedSearchService.searchByIndex('document', {
        q,
        filters,
        limit: limit + 1 // 자기 자신 제외
      });
      if (!searchResult.success) return [];
      // 자기 자신 제외
      const related = searchResult.data.results.filter(r => r.id !== doc._id).slice(0, limit);
      return related;
    } catch (error) {
      logger.error('연관 문서 추천 실패:', error);
      return [];
    }
  }
}

const recommendationService = new RecommendationService();
module.exports = recommendationService; 