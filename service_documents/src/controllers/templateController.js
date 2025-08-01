const templateService = require('../services/templateService');
const logger = require('../config/logger');

class TemplateController {
  /**
   * 새 템플릿 생성
   * POST /api/templates
   */
  async createTemplate(req, res) {
    try {
      const { title, content, documentType, category, tags, description, isPublic } = req.body;
      const userId = req.user.id;

      // 필수 필드 검증
      if (!title || !content || !documentType) {
        return res.status(400).json({
          success: false,
          message: '제목, 내용, 문서 타입은 필수입니다.'
        });
      }

      const templateData = {
        title,
        content,
        documentType,
        category: category || '기타',
        tags: tags || [],
        description: description || '',
        isPublic: isPublic || false
      };

      const template = await templateService.createTemplate(templateData, userId);

      res.status(201).json({
        success: true,
        message: '템플릿이 성공적으로 생성되었습니다.',
        data: template
      });
    } catch (error) {
      logger.error('템플릿 생성 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '템플릿 생성 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 조회
   * GET /api/templates/:id
   */
  async getTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const template = await templateService.getTemplate(id, userId);

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('템플릿 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 목록 조회
   * GET /api/templates
   */
  async getTemplates(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        category,
        documentType,
        createdBy,
        isPublic,
        tags
      } = req.query;

      const filters = {};
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        category,
        documentType,
        createdBy,
        isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
        tags: tags ? tags.split(',') : undefined
      };

      const result = await templateService.getTemplates(filters, options);

      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('템플릿 목록 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '템플릿 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 공개 템플릿 목록 조회
   * GET /api/templates/public
   */
  async getPublicTemplates(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'downloadCount',
        sortOrder = 'desc',
        category,
        documentType,
        tags
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        category,
        documentType,
        tags: tags ? tags.split(',') : undefined
      };

      const result = await templateService.getPublicTemplates(options);

      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('공개 템플릿 목록 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '공개 템플릿 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 업데이트
   * PUT /api/templates/:id
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // 업데이트할 수 있는 필드만 허용
      const allowedFields = ['title', 'content', 'category', 'tags', 'description', 'isPublic'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      const template = await templateService.updateTemplate(id, filteredData, userId);

      res.json({
        success: true,
        message: '템플릿이 성공적으로 업데이트되었습니다.',
        data: template
      });
    } catch (error) {
      logger.error('템플릿 업데이트 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 삭제
   * DELETE /api/templates/:id
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await templateService.deleteTemplate(id, userId);

      res.json({
        success: true,
        message: '템플릿이 성공적으로 삭제되었습니다.',
        data: result
      });
    } catch (error) {
      logger.error('템플릿 삭제 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 복사
   * POST /api/templates/:id/copy
   */
  async copyTemplate(req, res) {
    try {
      const { id } = req.params;
      const { newTitle } = req.body;
      const userId = req.user.id;

      const copiedTemplate = await templateService.copyTemplate(id, userId, newTitle);

      res.status(201).json({
        success: true,
        message: '템플릿이 성공적으로 복사되었습니다.',
        data: copiedTemplate
      });
    } catch (error) {
      logger.error('템플릿 복사 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 복사 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 다운로드
   * POST /api/templates/:id/download
   */
  async downloadTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const template = await templateService.downloadTemplate(id, userId);

      res.json({
        success: true,
        message: '템플릿 다운로드가 완료되었습니다.',
        data: template
      });
    } catch (error) {
      logger.error('템플릿 다운로드 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 다운로드 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 공개/비공개 설정
   * PATCH /api/templates/:id/visibility
   */
  async toggleTemplateVisibility(req, res) {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;
      const userId = req.user.id;

      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isPublic은 boolean 값이어야 합니다.'
        });
      }

      const template = await templateService.toggleTemplateVisibility(id, isPublic, userId);

      res.json({
        success: true,
        message: `템플릿이 ${isPublic ? '공개' : '비공개'}로 설정되었습니다.`,
        data: template
      });
    } catch (error) {
      logger.error('템플릿 공개 설정 변경 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 공개 설정 변경 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 카테고리 목록 조회
   * GET /api/templates/categories
   */
  async getTemplateCategories(req, res) {
    try {
      const categories = await templateService.getTemplateCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('템플릿 카테고리 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '템플릿 카테고리 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 인기 템플릿 조회
   * GET /api/templates/popular
   */
  async getPopularTemplates(req, res) {
    try {
      const { limit = 10 } = req.query;
      const templates = await templateService.getPopularTemplates(parseInt(limit));

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('인기 템플릿 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '인기 템플릿 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 버전 히스토리 조회
   * GET /api/templates/:id/versions
   */
  async getTemplateVersions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const template = await templateService.getTemplate(id, userId);

      res.json({
        success: true,
        data: {
          currentVersion: template.currentVersion,
          versions: template.versions
        }
      });
    } catch (error) {
      logger.error('템플릿 버전 히스토리 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 버전 히스토리 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 특정 버전의 템플릿 조회
   * GET /api/templates/:id/versions/:version
   */
  async getTemplateVersion(req, res) {
    try {
      const { id, version } = req.params;
      const userId = req.user.id;

      const template = await templateService.getTemplate(id, userId);
      const targetVersion = template.versions.find(v => v.version === parseInt(version));

      if (!targetVersion) {
        return res.status(404).json({
          success: false,
          message: '해당 버전을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          templateId: template._id,
          version: targetVersion,
          currentVersion: template.currentVersion
        }
      });
    } catch (error) {
      logger.error('템플릿 버전 조회 컨트롤러 오류:', error);
      
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
        message: error.message || '템플릿 버전 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 템플릿 통계 조회
   * GET /api/templates/stats
   */
  async getTemplateStats(req, res) {
    try {
      const userId = req.user.id;

      // 실제 구현에서는 통계 서비스를 통해 데이터 조회
      const stats = {
        totalTemplates: 0,
        publicTemplates: 0,
        privateTemplates: 0,
        templatesByCategory: {},
        templatesByType: {},
        totalDownloads: 0,
        totalCopies: 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('템플릿 통계 조회 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '템플릿 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new TemplateController(); 