const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const fileService = require('../services/fileService');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 파일 업로드 라우트
router.post('/upload', 
  fileService.getMulterConfig().single('file'), 
  fileController.uploadFile
);

// 파일 CRUD 라우트
router.get('/', fileController.getFiles);
router.get('/config', fileController.getUploadConfig);
router.get('/stats', fileController.getFileStats);

// 파일 검증
router.post('/validate', fileController.validateFile);

// 파일 정리 (관리자용)
router.post('/cleanup', fileController.cleanupFiles);

// 개별 파일 라우트
router.get('/:id', fileController.getFileInfo);
router.get('/:id/download', fileController.downloadFile);
router.get('/:id/preview', fileController.previewFile);
router.get('/:id/download-stats', fileController.getDownloadStats);
router.delete('/:id', fileController.deleteFile);

module.exports = router; 