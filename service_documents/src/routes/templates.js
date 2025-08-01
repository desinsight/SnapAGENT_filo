const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 템플릿 CRUD 라우트
router.post('/', templateController.createTemplate);
router.get('/', templateController.getTemplates);
router.get('/stats', templateController.getTemplateStats);
router.get('/categories', templateController.getTemplateCategories);
router.get('/popular', templateController.getPopularTemplates);

// 공개 템플릿 라우트 (인증 없이 접근 가능)
router.get('/public', templateController.getPublicTemplates);

// 개별 템플릿 라우트
router.get('/:id', templateController.getTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

// 템플릿 복사 및 다운로드
router.post('/:id/copy', templateController.copyTemplate);
router.post('/:id/download', templateController.downloadTemplate);

// 템플릿 공개/비공개 설정
router.patch('/:id/visibility', templateController.toggleTemplateVisibility);

// 템플릿 버전 관리
router.get('/:id/versions', templateController.getTemplateVersions);
router.get('/:id/versions/:version', templateController.getTemplateVersion);

module.exports = router; 