/**
 * Statistics Routes - 검색/추천 행동 통계 API 라우트
 * SearchLog 기반 통계 엔드포인트 정의 (AI 분석 제외)
 *
 * @description
 * - 일별 검색수, 인기 쿼리, 사용자별 검색수, 클릭률, 추천 클릭률, 최근 로그 등 API
 * - 상세 주석 및 확장성 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

const express = require('express');
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/statistics/daily-search
 * 일별 검색수
 * @query {string} startDate - 시작일(YYYY-MM-DD)
 * @query {string} endDate - 종료일(YYYY-MM-DD)
 */
router.get('/daily-search', authenticateToken, statisticsController.getDailySearchCount);

/**
 * GET /api/statistics/top-queries
 * 인기 쿼리
 * @query {number} limit - 상위 N개
 */
router.get('/top-queries', authenticateToken, statisticsController.getTopQueries);

/**
 * GET /api/statistics/top-users
 * 사용자별 검색수
 * @query {number} limit - 상위 N명
 */
router.get('/top-users', authenticateToken, statisticsController.getTopUsers);

/**
 * GET /api/statistics/search-click
 * 전체 검색수/클릭수/클릭률
 */
router.get('/search-click', authenticateToken, statisticsController.getSearchClickStats);

/**
 * GET /api/statistics/recommend-click
 * 추천 클릭률
 */
router.get('/recommend-click', authenticateToken, statisticsController.getRecommendationClickStats);

/**
 * GET /api/statistics/recent-logs
 * 최근 검색/추천 로그
 * @query {number} limit - 최대 개수
 */
router.get('/recent-logs', authenticateToken, statisticsController.getRecentLogs);

module.exports = router; 