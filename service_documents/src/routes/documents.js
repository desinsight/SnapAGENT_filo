const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const fileService = require('../services/fileService');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 문서 CRUD 라우트
router.post('/', documentController.createDocument);
router.get('/', documentController.getDocuments);
router.get('/stats', documentController.getDocumentStats);
router.post('/search', documentController.searchDocuments);

// 개별 문서 라우트
router.get('/:id', documentController.getDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

// 문서 상태 관리
router.patch('/:id/status', documentController.updateDocumentStatus);

// 문서 권한 관리
router.put('/:id/permissions', documentController.updateDocumentPermissions);

// 문서 버전 관리
router.get('/:id/versions', documentController.getDocumentVersions);
router.get('/:id/versions/:version', documentController.getDocumentVersion);

// 문서 첨부파일 관리
router.post('/:id/attachments', 
  fileService.getMulterConfig().single('file'), 
  documentController.uploadAttachment
);
router.get('/:id/attachments', documentController.getAttachments);

module.exports = router; 