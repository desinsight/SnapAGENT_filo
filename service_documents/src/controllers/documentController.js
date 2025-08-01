const documentService = require('../services/documentService');
const fileService = require('../services/fileService');
const logger = require('../config/logger');

class DocumentController {
  /**
   * 새 문서 생성
   * POST /api/documents
   */
  async createDocument(req, res) {
    try {
      const { title, content, documentType, tags, description, priority, dueDate } = req.body;
      const userId = req.user.id;

      // 필수 필드 검증
      if (!title || !content || !documentType) {
        return res.status(400).json({
          success: false,
          message: '제목, 내용, 문서 타입은 필수입니다.'
        });
      }

      const documentData = {
        title,
        content,
        documentType,
        tags: tags || [],
        description: description || '',
        priority: priority || 'normal',
        dueDate: dueDate ? new Date(dueDate) : null
      };

      const document = await documentService.createDocument(documentData, userId);

      res.status(201).json({
        success: true,
        message: '문서가 성공적으로 생성되었습니다.',
        data: document
      });
    } catch (error) {
      logger.error('문서 생성 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '문서 생성 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 조회
   * GET /api/documents/:id
   */
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const document = await documentService.getDocument(id, userId);

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      logger.error('문서 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 목록 조회
   * GET /api/documents
   */
  async getDocuments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        status,
        documentType,
        createdBy,
        tags
      } = req.query;

      const filters = {};
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        status,
        documentType,
        createdBy,
        tags: tags ? tags.split(',') : undefined
      };

      const result = await documentService.getDocuments(filters, options);

      res.json({
        success: true,
        data: result.documents,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('문서 목록 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '문서 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 업데이트
   * PUT /api/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // 업데이트할 수 있는 필드만 허용
      const allowedFields = ['title', 'content', 'tags', 'description', 'priority', 'dueDate'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      const document = await documentService.updateDocument(id, filteredData, userId);

      res.json({
        success: true,
        message: '문서가 성공적으로 업데이트되었습니다.',
        data: document
      });
    } catch (error) {
      logger.error('문서 업데이트 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 삭제
   * DELETE /api/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await documentService.deleteDocument(id, userId);

      res.json({
        success: true,
        message: '문서가 성공적으로 삭제되었습니다.',
        data: result
      });
    } catch (error) {
      logger.error('문서 삭제 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 상태 변경
   * PATCH /api/documents/:id/status
   */
  async updateDocumentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      const userId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: '상태는 필수입니다.'
        });
      }

      const document = await documentService.updateDocumentStatus(id, status, userId, comment);

      res.json({
        success: true,
        message: '문서 상태가 성공적으로 변경되었습니다.',
        data: document
      });
    } catch (error) {
      logger.error('문서 상태 변경 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 상태 변경 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 권한 관리
   * PUT /api/documents/:id/permissions
   */
  async updateDocumentPermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const userId = req.user.id;

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: '권한 정보는 배열 형태로 제공되어야 합니다.'
        });
      }

      const document = await documentService.updateDocumentPermissions(id, permissions, userId);

      res.json({
        success: true,
        message: '문서 권한이 성공적으로 업데이트되었습니다.',
        data: document
      });
    } catch (error) {
      logger.error('문서 권한 업데이트 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 권한 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 고급 검색
   * POST /api/documents/search
   */
  async searchDocuments(req, res) {
    try {
      const { query, filters = {}, options = {} } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: '검색어는 필수입니다.'
        });
      }

      const result = await documentService.searchDocuments(query, filters, options);

      res.json({
        success: true,
        data: result.documents,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('문서 검색 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '문서 검색 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 첨부파일 업로드
   * POST /api/documents/:id/attachments
   */
  async uploadAttachment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '업로드할 파일이 없습니다.'
        });
      }

      // 문서 존재 및 권한 확인
      await documentService.getDocument(id, userId);

      // 파일 업로드 처리
      const fileMetadata = await fileService.uploadFile(req.file, userId, id);

      res.status(201).json({
        success: true,
        message: '첨부파일이 성공적으로 업로드되었습니다.',
        data: fileMetadata
      });
    } catch (error) {
      logger.error('첨부파일 업로드 컨트롤러 오류:', error);
      
      if (error.message.includes('찾을 수 없습니다') || error.message.includes('권한이 없습니다')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '첨부파일 업로드 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 첨부파일 목록 조회
   * GET /api/documents/:id/attachments
   */
  async getAttachments(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      // 문서 존재 및 권한 확인
      await documentService.getDocument(id, userId);

      // 첨부파일 목록 조회
      const result = await fileService.getFiles({}, {
        documentId: id,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('첨부파일 목록 조회 컨트롤러 오류:', error);
      
      if (error.message.includes('찾을 수 없습니다') || error.message.includes('권한이 없습니다')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '첨부파일 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 통계 조회
   * GET /api/documents/stats
   */
  async getDocumentStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      // 실제 구현에서는 통계 서비스를 통해 데이터 조회
      const stats = {
        totalDocuments: 0,
        documentsByStatus: {
          draft: 0,
          review: 0,
          approved: 0,
          rejected: 0
        },
        documentsByType: {},
        recentActivity: []
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('문서 통계 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '문서 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 문서 버전 히스토리 조회
   * GET /api/documents/:id/versions
   */
  async getDocumentVersions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const document = await documentService.getDocument(id, userId);

      res.json({
        success: true,
        data: {
          currentVersion: document.currentVersion,
          versions: document.versions
        }
      });
    } catch (error) {
      logger.error('문서 버전 히스토리 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 버전 히스토리 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 특정 버전의 문서 조회
   * GET /api/documents/:id/versions/:version
   */
  async getDocumentVersion(req, res) {
    try {
      const { id, version } = req.params;
      const userId = req.user.id;

      const document = await documentService.getDocument(id, userId);
      const targetVersion = document.versions.find(v => v.version === parseInt(version));

      if (!targetVersion) {
        return res.status(404).json({
          success: false,
          message: '해당 버전을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          documentId: document._id,
          version: targetVersion,
          currentVersion: document.currentVersion
        }
      });
    } catch (error) {
      logger.error('문서 버전 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '문서 버전 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new DocumentController(); 