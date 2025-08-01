/**
 * AdvancedSearchController - 고급 검색 및 분석 API 컨트롤러
 * Elasticsearch 기반 통합 검색/분석 API 엔드포인트 제공
 *
 * @description
 * - 통합 검색, 인덱스별 검색, 통계/분석 API 제공
 * - 상세 주석 및 예외처리 포함
 * - 확장성 고려 (추후 AI 추천, 연관 문서 등)
 *
 * @author Your Team
 * @version 1.0.0
 */

const advancedSearchService = require('../services/advancedSearchService');
const { logger } = require('../config/logger');

class AdvancedSearchController {
  /**
   * 통합 검색 API
   * @route POST /api/search
   * @body {string} q - 검색어
   * @body {array} indices - 검색 대상 인덱스 (예: ['document', 'notification'])
   * @body {object} filters - 필터 조건
   * @body {object} sort - 정렬 조건
   * @body {number} page - 페이지 번호
   * @body {number} limit - 페이지당 결과 수
   * @body {object} highlight - 하이라이트 옵션
   */
  async search(req, res) {
    try {
      const {
        q = '',
        indices = ['document'],
        filters = {},
        sort = {},
        page = 1,
        limit = 20,
        highlight = {}
      } = req.body;

      const result = await advancedSearchService.search({ q, indices, filters, sort, page, limit, highlight });
      res.json(result);
    } catch (error) {
      logger.error('통합 검색 API 오류:', error);
      res.status(500).json({ success: false, message: '검색 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 단일 인덱스 검색 API
   * @route POST /api/search/:index
   * @param {string} index - 인덱스명 (document/notification/comment)
   * @body {string} q - 검색어
   * @body {object} filters - 필터 조건
   * @body {object} sort - 정렬 조건
   * @body {number} page - 페이지 번호
   * @body {number} limit - 페이지당 결과 수
   * @body {object} highlight - 하이라이트 옵션
   */
  async searchByIndex(req, res) {
    try {
      const { index } = req.params;
      const {
        q = '',
        filters = {},
        sort = {},
        page = 1,
        limit = 20,
        highlight = {}
      } = req.body;

      const result = await advancedSearchService.searchByIndex(index, { q, filters, sort, page, limit, highlight });
      res.json(result);
    } catch (error) {
      logger.error('인덱스별 검색 API 오류:', error);
      res.status(500).json({ success: false, message: '검색 중 오류가 발생했습니다.', error: error.message });
    }
  }

  /**
   * 통계/분석 API
   * @route POST /api/search/analytics
   * @body {array} indices - 분석 대상 인덱스
   * @body {object} aggs - 집계 쿼리 정의
   */
  async analytics(req, res) {
    try {
      const { indices = ['document'], aggs = {} } = req.body;
      const result = await advancedSearchService.getAggregations(indices, aggs);
      res.json(result);
    } catch (error) {
      logger.error('검색 통계/분석 API 오류:', error);
      res.status(500).json({ success: false, message: '통계/분석 중 오류가 발생했습니다.', error: error.message });
    }
  }
}

const advancedSearchController = new AdvancedSearchController();
module.exports = advancedSearchController; 