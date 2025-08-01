const fileService = require('../services/fileService');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

class FileController {
  /**
   * 파일 업로드
   * POST /api/files/upload
   */
  async uploadFile(req, res) {
    try {
      const userId = req.user.id;
      const { documentId } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '업로드할 파일이 없습니다.'
        });
      }

      const fileMetadata = await fileService.uploadFile(req.file, userId, documentId);

      res.status(201).json({
        success: true,
        message: '파일이 성공적으로 업로드되었습니다.',
        data: fileMetadata
      });
    } catch (error) {
      logger.error('파일 업로드 컨트롤러 오류:', error);
      
      if (error.message.includes('크기가 제한을 초과했습니다')) {
        return res.status(413).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('지원하지 않는 파일 형식입니다')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('보안 검사를 통과하지 못했습니다')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '파일 업로드 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 다운로드
   * GET /api/files/:id/download
   */
  async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const fileMetadata = await fileService.downloadFile(id, userId);

      // 파일 스트림 생성
      const fileStream = fs.createReadStream(fileMetadata.path);
      
      // 파일 다운로드 헤더 설정
      res.setHeader('Content-Type', fileMetadata.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileMetadata.originalName)}"`);
      res.setHeader('Content-Length', fileMetadata.size);

      // 파일 스트림을 응답으로 파이프
      fileStream.pipe(res);

      // 스트림 에러 처리
      fileStream.on('error', (error) => {
        logger.error('파일 스트림 오류:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '파일 다운로드 중 오류가 발생했습니다.'
          });
        }
      });
    } catch (error) {
      logger.error('파일 다운로드 컨트롤러 오류:', error);
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('권한이 없습니다')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('존재하지 않습니다')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '파일 다운로드 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 삭제
   * DELETE /api/files/:id
   */
  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await fileService.deleteFile(id, userId);

      res.json({
        success: true,
        message: '파일이 성공적으로 삭제되었습니다.',
        data: result
      });
    } catch (error) {
      logger.error('파일 삭제 컨트롤러 오류:', error);
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('권한이 없습니다')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '파일 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 목록 조회
   * GET /api/files
   */
  async getFiles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
        documentId,
        uploadedBy,
        fileType
      } = req.query;

      const filters = {};
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        documentId,
        uploadedBy,
        fileType
      };

      const result = await fileService.getFiles(filters, options);

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('파일 목록 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 정보 조회
   * GET /api/files/:id
   */
  async getFileInfo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const fileMetadata = await fileService.getFileMetadata(id);
      if (!fileMetadata) {
        return res.status(404).json({
          success: false,
          message: '파일을 찾을 수 없습니다.'
        });
      }

      // 권한 검증
      const hasAccess = await fileService.checkFileAccess(fileMetadata, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: '파일에 접근할 권한이 없습니다.'
        });
      }

      res.json({
        success: true,
        data: fileMetadata
      });
    } catch (error) {
      logger.error('파일 정보 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 정보 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 미리보기 (이미지 파일)
   * GET /api/files/:id/preview
   */
  async previewFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const fileMetadata = await fileService.getFileMetadata(id);
      if (!fileMetadata) {
        return res.status(404).json({
          success: false,
          message: '파일을 찾을 수 없습니다.'
        });
      }

      // 권한 검증
      const hasAccess = await fileService.checkFileAccess(fileMetadata, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: '파일에 접근할 권한이 없습니다.'
        });
      }

      // 이미지 파일만 미리보기 허용
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      if (!imageTypes.includes(fileMetadata.extension.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: '이미지 파일만 미리보기가 가능합니다.'
        });
      }

      // 파일 존재 확인
      const fileExists = await fileService.fileExists(fileMetadata.path);
      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: '파일이 서버에 존재하지 않습니다.'
        });
      }

      // 이미지 파일 스트리밍
      const fileStream = fs.createReadStream(fileMetadata.path);
      
      res.setHeader('Content-Type', fileMetadata.mimetype);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1시간 캐시

      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error('파일 미리보기 스트림 오류:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '파일 미리보기 중 오류가 발생했습니다.'
          });
        }
      });
    } catch (error) {
      logger.error('파일 미리보기 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 미리보기 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 업로드 설정 조회
   * GET /api/files/config
   */
  async getUploadConfig(req, res) {
    try {
      const config = {
        maxFileSize: fileService.maxFileSize,
        allowedFileTypes: fileService.allowedFileTypes,
        maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('파일 업로드 설정 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 업로드 설정 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 통계 조회
   * GET /api/files/stats
   */
  async getFileStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      // 실제 구현에서는 통계 서비스를 통해 데이터 조회
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        recentUploads: [],
        storageUsage: {
          used: 0,
          limit: fileService.maxFileSize * 1000 // 예시 제한
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('파일 통계 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 검증
   * POST /api/files/validate
   */
  async validateFile(req, res) {
    try {
      const { filename, size, mimetype } = req.body;

      if (!filename || !size || !mimetype) {
        return res.status(400).json({
          success: false,
          message: '파일명, 크기, MIME 타입은 필수입니다.'
        });
      }

      const fileExtension = path.extname(filename).toLowerCase().substring(1);
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // 파일 크기 검증
      if (!fileService.checkFileSize(size)) {
        validation.isValid = false;
        validation.errors.push(`파일 크기가 제한을 초과했습니다. (최대: ${fileService.maxFileSize / 1024 / 1024}MB)`);
      }

      // 파일 타입 검증
      if (!fileService.isAllowedFileType(fileExtension)) {
        validation.isValid = false;
        validation.errors.push(`지원하지 않는 파일 형식입니다: ${fileExtension}`);
      }

      // 파일 크기가 너무 작으면 경고
      if (size < 1024) { // 1KB 미만
        validation.warnings.push('파일 크기가 매우 작습니다. 파일이 손상되었을 수 있습니다.');
      }

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('파일 검증 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 검증 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 정리 (관리자용)
   * POST /api/files/cleanup
   */
  async cleanupFiles(req, res) {
    try {
      const { daysToKeep = 30 } = req.body;
      const userId = req.user.id;

      // 관리자 권한 확인 (실제 구현에서는 역할 기반 권한 확인)
      // const user = await User.findById(userId);
      // if (user.role !== 'admin') {
      //   return res.status(403).json({
      //     success: false,
      //     message: '관리자 권한이 필요합니다.'
      //   });
      // }

      await fileService.cleanupOldFiles(daysToKeep);

      res.json({
        success: true,
        message: '파일 정리가 완료되었습니다.'
      });
    } catch (error) {
      logger.error('파일 정리 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 정리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 파일 다운로드 통계 조회
   * GET /api/files/:id/download-stats
   */
  async getDownloadStats(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const fileMetadata = await fileService.getFileMetadata(id);
      if (!fileMetadata) {
        return res.status(404).json({
          success: false,
          message: '파일을 찾을 수 없습니다.'
        });
      }

      // 권한 검증
      const hasAccess = await fileService.checkFileAccess(fileMetadata, userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: '파일에 접근할 권한이 없습니다.'
        });
      }

      // Redis에서 다운로드 통계 조회
      const downloadCount = await fileService.redis.get(`download:${id}`) || 0;
      const downloadHistory = await fileService.redis.lrange(`download_history:${id}`, 0, 9) || [];

      const stats = {
        downloadCount: parseInt(downloadCount),
        recentDownloads: downloadHistory.map(record => JSON.parse(record))
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('파일 다운로드 통계 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '파일 다운로드 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new FileController(); 