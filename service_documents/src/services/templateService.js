const Template = require('../models/Template');
const User = require('../models/User');
const logger = require('../config/logger');
const { createClient } = require('redis');

class TemplateService {
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
  }

  /**
   * 새 템플릿 생성
   */
  async createTemplate(templateData, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const template = new Template({
        ...templateData,
        createdBy: userId,
        currentVersion: 1,
        versions: [{
          version: 1,
          content: templateData.content,
          modifiedBy: userId,
          modifiedAt: new Date(),
          changeLog: '초기 템플릿 생성'
        }],
        permissions: [{
          userId: userId,
          role: 'owner',
          grantedAt: new Date()
        }],
        isPublic: templateData.isPublic || false
      });

      await template.save();
      
      // Redis 캐시 업데이트
      await this.updateTemplateCache(template._id, template);

      logger.info(`템플릿 생성됨: ${template._id} by user: ${userId}`);
      return template;
    } catch (error) {
      logger.error('템플릿 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 조회 (권한 검증 포함)
   */
  async getTemplate(templateId, userId) {
    try {
      // Redis 캐시 확인
      const cached = await this.getTemplateFromCache(templateId);
      if (cached) {
        return cached;
      }

      const template = await Template.findById(templateId)
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email')
        .populate('permissions.userId', 'name email role');

      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증 (공개 템플릿은 모든 사용자가 접근 가능)
      if (!template.isPublic) {
        const hasAccess = await this.checkTemplateAccess(template, userId);
        if (!hasAccess) {
          throw new Error('템플릿에 접근할 권한이 없습니다.');
        }
      }

      // Redis 캐시 저장
      await this.updateTemplateCache(templateId, template);

      return template;
    } catch (error) {
      logger.error('템플릿 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 목록 조회 (필터링, 정렬, 페이징)
   */
  async getTemplates(filters = {}, options = {}) {
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
      } = options;

      let query = {};

      // 검색 필터
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // 카테고리 필터
      if (category) {
        query.category = category;
      }

      // 문서 타입 필터
      if (documentType) {
        query.documentType = documentType;
      }

      // 작성자 필터
      if (createdBy) {
        query.createdBy = createdBy;
      }

      // 공개 여부 필터
      if (isPublic !== undefined) {
        query.isPublic = isPublic;
      }

      // 태그 필터
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const templates = await Template.find(query)
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Template.countDocuments(query);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('템플릿 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 공개 템플릿 목록 조회
   */
  async getPublicTemplates(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'downloadCount',
        sortOrder = 'desc',
        category,
        documentType,
        tags
      } = options;

      let query = { isPublic: true };

      // 카테고리 필터
      if (category) {
        query.category = category;
      }

      // 문서 타입 필터
      if (documentType) {
        query.documentType = documentType;
      }

      // 태그 필터
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const templates = await Template.find(query)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Template.countDocuments(query);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('공개 템플릿 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 업데이트 (버전 관리 포함)
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasEditAccess = await this.checkEditAccess(template, userId);
      if (!hasEditAccess) {
        throw new Error('템플릿을 수정할 권한이 없습니다.');
      }

      // 새 버전 생성
      const newVersion = template.currentVersion + 1;
      const versionData = {
        version: newVersion,
        content: updateData.content,
        modifiedBy: userId,
        modifiedAt: new Date(),
        changeLog: updateData.changeLog || '템플릿 업데이트'
      };

      // 템플릿 업데이트
      const updatedTemplate = await Template.findByIdAndUpdate(
        templateId,
        {
          ...updateData,
          currentVersion: newVersion,
          $push: { versions: versionData },
          modifiedBy: userId,
          modifiedAt: new Date()
        },
        { new: true }
      ).populate('createdBy', 'name email')
       .populate('modifiedBy', 'name email');

      // Redis 캐시 업데이트
      await this.updateTemplateCache(templateId, updatedTemplate);

      logger.info(`템플릿 업데이트됨: ${templateId} by user: ${userId}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('템플릿 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 삭제 (소프트 삭제)
   */
  async deleteTemplate(templateId, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasDeleteAccess = await this.checkDeleteAccess(template, userId);
      if (!hasDeleteAccess) {
        throw new Error('템플릿을 삭제할 권한이 없습니다.');
      }

      // 소프트 삭제
      const deletedTemplate = await Template.findByIdAndUpdate(
        templateId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        },
        { new: true }
      );

      // Redis 캐시 제거
      await this.removeTemplateFromCache(templateId);

      logger.info(`템플릿 삭제됨: ${templateId} by user: ${userId}`);
      return deletedTemplate;
    } catch (error) {
      logger.error('템플릿 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 복사
   */
  async copyTemplate(templateId, userId, newTitle = null) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증 (공개 템플릿이거나 접근 권한이 있는 경우)
      if (!template.isPublic) {
        const hasAccess = await this.checkTemplateAccess(template, userId);
        if (!hasAccess) {
          throw new Error('템플릿에 접근할 권한이 없습니다.');
        }
      }

      const copiedTemplate = new Template({
        title: newTitle || `${template.title} (복사본)`,
        description: template.description,
        content: template.content,
        documentType: template.documentType,
        category: template.category,
        tags: template.tags,
        createdBy: userId,
        currentVersion: 1,
        versions: [{
          version: 1,
          content: template.content,
          modifiedBy: userId,
          modifiedAt: new Date(),
          changeLog: '템플릿 복사'
        }],
        permissions: [{
          userId: userId,
          role: 'owner',
          grantedAt: new Date()
        }],
        isPublic: false,
        isCopy: true,
        originalTemplate: templateId
      });

      await copiedTemplate.save();

      // 원본 템플릿의 복사 횟수 증가
      await Template.findByIdAndUpdate(templateId, {
        $inc: { copyCount: 1 }
      });

      logger.info(`템플릿 복사됨: ${templateId} -> ${copiedTemplate._id} by user: ${userId}`);
      return copiedTemplate;
    } catch (error) {
      logger.error('템플릿 복사 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 다운로드 (사용 통계 업데이트)
   */
  async downloadTemplate(templateId, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증 (공개 템플릿이거나 접근 권한이 있는 경우)
      if (!template.isPublic) {
        const hasAccess = await this.checkTemplateAccess(template, userId);
        if (!hasAccess) {
          throw new Error('템플릿에 접근할 권한이 없습니다.');
        }
      }

      // 다운로드 통계 업데이트
      await Template.findByIdAndUpdate(templateId, {
        $inc: { downloadCount: 1 },
        $push: {
          downloadHistory: {
            downloadedBy: userId,
            downloadedAt: new Date()
          }
        }
      });

      logger.info(`템플릿 다운로드: ${templateId} by user: ${userId}`);
      return template;
    } catch (error) {
      logger.error('템플릿 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 공개/비공개 설정
   */
  async toggleTemplateVisibility(templateId, isPublic, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // 권한 검증 (소유자만 공개 설정 가능)
      const isOwner = template.permissions.some(p => 
        p.userId.toString() === userId && p.role === 'owner'
      );
      if (!isOwner) {
        throw new Error('템플릿 공개 설정을 변경할 권한이 없습니다.');
      }

      const updatedTemplate = await Template.findByIdAndUpdate(
        templateId,
        {
          isPublic,
          modifiedBy: userId,
          modifiedAt: new Date()
        },
        { new: true }
      ).populate('createdBy', 'name email')
       .populate('modifiedBy', 'name email');

      // Redis 캐시 업데이트
      await this.updateTemplateCache(templateId, updatedTemplate);

      logger.info(`템플릿 공개 설정 변경: ${templateId} -> ${isPublic} by user: ${userId}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('템플릿 공개 설정 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 카테고리 목록 조회
   */
  async getTemplateCategories() {
    try {
      const categories = await Template.distinct('category');
      return categories.filter(category => category); // null/undefined 제거
    } catch (error) {
      logger.error('템플릿 카테고리 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 인기 템플릿 조회 (다운로드 수 기준)
   */
  async getPopularTemplates(limit = 10) {
    try {
      const templates = await Template.find({ isPublic: true, isDeleted: { $ne: true } })
        .sort({ downloadCount: -1 })
        .limit(limit)
        .populate('createdBy', 'name email');

      return templates;
    } catch (error) {
      logger.error('인기 템플릿 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 접근 권한 확인
   */
  async checkTemplateAccess(template, userId) {
    // 소유자 확인
    if (template.createdBy.toString() === userId) {
      return true;
    }

    // 명시적 권한 확인
    const permission = template.permissions.find(p => 
      p.userId.toString() === userId
    );
    if (permission) {
      return true;
    }

    return false;
  }

  /**
   * 템플릿 수정 권한 확인
   */
  async checkEditAccess(template, userId) {
    // 소유자 확인
    if (template.createdBy.toString() === userId) {
      return true;
    }

    // 편집 권한 확인
    const permission = template.permissions.find(p => 
      p.userId.toString() === userId && 
      ['owner', 'editor'].includes(p.role)
    );
    if (permission) {
      return true;
    }

    return false;
  }

  /**
   * 템플릿 삭제 권한 확인
   */
  async checkDeleteAccess(template, userId) {
    // 소유자만 삭제 가능
    return template.createdBy.toString() === userId;
  }

  /**
   * Redis 캐시에서 템플릿 조회
   */
  async getTemplateFromCache(templateId) {
    try {
      const cached = await this.redis.get(`template:${templateId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Redis 캐시 조회 실패:', error);
      return null;
    }
  }

  /**
   * Redis 캐시 업데이트
   */
  async updateTemplateCache(templateId, template) {
    try {
      await this.redis.setex(
        `template:${templateId}`,
        3600, // 1시간 캐시
        JSON.stringify(template)
      );
    } catch (error) {
      logger.error('Redis 캐시 업데이트 실패:', error);
    }
  }

  /**
   * Redis 캐시에서 템플릿 제거
   */
  async removeTemplateFromCache(templateId) {
    try {
      await this.redis.del(`template:${templateId}`);
    } catch (error) {
      logger.error('Redis 캐시 제거 실패:', error);
    }
  }
}

module.exports = new TemplateService(); 