/**
 * Recommendation Routes - 추천/연관 문서 API 라우트
 * 최근 검색/클릭 기반 추천, 연관 문서 추천 엔드포인트 정의
 *
 * @description
 * - 최근 검색/클릭 기반 추천 문서 API
 * - 연관 문서 추천 API
 * - 상세 주석 및 확장성 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/recommendation/recent-search
 * 최근 검색 기반 추천 문서
 * @query {number} limit - 추천 개수
 */
router.get('/recent-search', authenticateToken, recommendationController.recommendByRecentSearch);

/**
 * GET /api/recommendation/recent-click
 * 최근 클릭 기반 추천 문서
 * @query {number} limit - 추천 개수
 */
router.get('/recent-click', authenticateToken, recommendationController.recommendByRecentClick);

/**
 * POST /api/recommendation/related
 * 연관 문서 추천
 * @body {object} doc - 기준 문서
 * @body {number} limit - 추천 개수
 */
router.post('/related', authenticateToken, recommendationController.recommendRelatedDocuments);

module.exports = router; 