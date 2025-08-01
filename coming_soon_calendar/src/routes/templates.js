// templates.js
// 일정 템플릿 관련 라우터
// 편의성 극대화 기능들

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// 템플릿 목록 조회
router.get('/', templateController.getTemplates);

// 스마트 템플릿 추천
router.get('/recommendations', templateController.getRecommendations);

// 템플릿 검색
router.get('/search', templateController.searchTemplates);

// 템플릿 생성
router.post('/', templateController.createTemplate);

// 템플릿 상세 조회
router.get('/:id', templateController.getTemplateById);

// 템플릿에서 일정 생성 (복사/붙여넣기)
router.post('/:id/create-event', templateController.createEventFromTemplate);

// 템플릿 즐겨찾기 토글
router.patch('/:id/favorite', templateController.toggleFavorite);

// 템플릿 삭제
router.delete('/:id', templateController.deleteTemplate);

module.exports = router; 