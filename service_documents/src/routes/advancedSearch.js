/**
 * Advanced Search Routes - 고급 검색 및 분석 API 라우트
 * Elasticsearch 기반 통합 검색/분석 엔드포인트 정의
 *
 * @description
 * - 통합 검색, 인덱스별 검색, 통계/분석 API 라우트
 * - 상세 주석 및 확장성 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

const express = require('express');
const advancedSearchController = require('../controllers/advancedSearchController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/search
 * 통합 검색 (여러 인덱스 대상)
 * @body {string} q - 검색어
 * @body {array} indices - 검색 대상 인덱스 (예: ['document', 'notification'])
 * @body {object} filters - 필터 조건
 * @body {object} sort - 정렬 조건
 * @body {number} page - 페이지 번호
 * @body {number} limit - 페이지당 결과 수
 * @body {object} highlight - 하이라이트 옵션
 */
router.post(
  '/',
  authenticateToken,
  validateRequest({
    body: {
      q: { type: 'string' },
      indices: { type: 'array', items: { type: 'string' } },
      filters: { type: 'object' },
      sort: { type: 'object' },
      page: { type: 'number' },
      limit: { type: 'number' },
      highlight: { type: 'object' }
    }
  }),
  advancedSearchController.search
);

/**
 * POST /api/search/:index
 * 단일 인덱스 검색
 * @param {string} index - 인덱스명 (document/notification/comment)
 * @body {string} q - 검색어
 * @body {object} filters - 필터 조건
 * @body {object} sort - 정렬 조건
 * @body {number} page - 페이지 번호
 * @body {number} limit - 페이지당 결과 수
 * @body {object} highlight - 하이라이트 옵션
 */
router.post(
  '/:index',
  authenticateToken,
  validateRequest({
    body: {
      q: { type: 'string' },
      filters: { type: 'object' },
      sort: { type: 'object' },
      page: { type: 'number' },
      limit: { type: 'number' },
      highlight: { type: 'object' }
    }
  }),
  advancedSearchController.searchByIndex
);

/**
 * POST /api/search/analytics
 * 통계/분석 API
 * @body {array} indices - 분석 대상 인덱스
 * @body {object} aggs - 집계 쿼리 정의
 */
router.post(
  '/analytics',
  authenticateToken,
  validateRequest({
    body: {
      indices: { type: 'array', items: { type: 'string' } },
      aggs: { type: 'object' }
    }
  }),
  advancedSearchController.analytics
);

module.exports = router; 