const Module = require('../models/Module');
const logger = require('../utils/logger');

/**
 * 모듈 서비스
 * 분야별 맞춤 모듈 및 관리자 기능 제공
 */
class ModuleService {
  /**
   * 모듈 생성
   * @param {Object} moduleData - 모듈 데이터
   * @param {string} creatorId - 생성자 ID
   * @returns {Promise<Object>} 생성된 모듈
   */
  async createModule(moduleData, creatorId) {
    try {
      const module = new Module({
        ...moduleData,
        createdBy: creatorId
      });

      // 기본 기능 추가
      if (!module.features || module.features.length === 0) {
        module.features = this.getDefaultFeatures(module.type);
      }

      // 기본 API 엔드포인트 추가
      if (!module.api.endpoints || module.api.endpoints.length === 0) {
        module.api.endpoints = this.getDefaultEndpoints(module.name);
      }

      await module.save();

      logger.info(`모듈 생성 완료: ${module._id} by ${creatorId}`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 조회
   * @param {string} moduleId - 모듈 ID
   * @returns {Promise<Object>} 모듈 정보
   */
  async getModule(moduleId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      return { success: true, module };
    } catch (error) {
      logger.error('모듈 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 목록 조회
   * @param {Object} filters - 필터 조건
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 모듈 목록
   */
  async getModules(filters = {}, options = {}) {
    try {
      const {
        category,
        type,
        status,
        isPublic,
        isEnabled,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = options;

      // 필터 조건 구성
      const query = {};

      if (category) query.category = category;
      if (type) query.type = type;
      if (status) query.status = status;
      if (isPublic !== undefined) query['configuration.isPublic'] = isPublic;
      if (isEnabled !== undefined) query['configuration.isEnabled'] = isEnabled;

      // 검색 조건
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // 정렬 조건
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 페이지네이션
      const skip = (page - 1) * limit;

      const modules = await Module.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      const total = await Module.countDocuments(query);

      return {
        success: true,
        modules,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('모듈 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 모듈 조회
   * @param {string} category - 카테고리
   * @returns {Promise<Object>} 카테고리별 모듈 목록
   */
  async getModulesByCategory(category) {
    try {
      const modules = await Module.findByCategory(category);
      return { success: true, modules };
    } catch (error) {
      logger.error('카테고리별 모듈 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 공개 모듈 조회
   * @returns {Promise<Object>} 공개 모듈 목록
   */
  async getPublicModules() {
    try {
      const modules = await Module.findPublicModules();
      return { success: true, modules };
    } catch (error) {
      logger.error('공개 모듈 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 인기 모듈 조회
   * @param {number} limit - 조회 개수
   * @returns {Promise<Object>} 인기 모듈 목록
   */
  async getPopularModules(limit = 10) {
    try {
      const modules = await Module.findPopularModules(limit);
      return { success: true, modules };
    } catch (error) {
      logger.error('인기 모듈 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 업데이트
   * @param {string} moduleId - 모듈 ID
   * @param {Object} updateData - 업데이트 데이터
   * @param {string} updaterId - 수정자 ID
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateModule(moduleId, updateData, updaterId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      // 버전 업데이트
      if (updateData.version && updateData.version !== module.version) {
        updateData.lastUpdated = new Date();
      }

      Object.assign(module, updateData, { updatedBy: updaterId });
      await module.save();

      logger.info(`모듈 수정 완료: ${moduleId} by ${updaterId}`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 삭제
   * @param {string} moduleId - 모듈 ID
   * @param {string} deleterId - 삭제자 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteModule(moduleId, deleterId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      // 설치된 모듈은 삭제 불가
      if (module.installationCount > 0) {
        throw new Error('설치된 모듈은 삭제할 수 없습니다. 먼저 비활성화하세요.');
      }

      await Module.findByIdAndDelete(moduleId);

      logger.info(`모듈 삭제 완료: ${moduleId} by ${deleterId}`);
      return { success: true };
    } catch (error) {
      logger.error('모듈 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 활성화/비활성화
   * @param {string} moduleId - 모듈 ID
   * @param {boolean} enabled - 활성화 여부
   * @param {string} updaterId - 수정자 ID
   * @returns {Promise<Object>} 결과
   */
  async toggleModule(moduleId, enabled, updaterId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      if (enabled) {
        await module.enable();
      } else {
        await module.disable();
      }

      module.updatedBy = updaterId;
      await module.save();

      logger.info(`모듈 ${enabled ? '활성화' : '비활성화'} 완료: ${moduleId} by ${updaterId}`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 활성화/비활성화 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 설치
   * @param {string} moduleId - 모듈 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 설치 결과
   */
  async installModule(moduleId, userId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      if (!module.configuration.isEnabled) {
        throw new Error('비활성화된 모듈은 설치할 수 없습니다.');
      }

      if (module.configuration.maxUsers > 0 && module.installationCount >= module.configuration.maxUsers) {
        throw new Error('최대 사용자 수에 도달했습니다.');
      }

      // 의존성 확인
      await this.checkDependencies(module);

      // 모듈 설치 로직 실행
      await this.executeInstallation(module, userId);

      // 설치 수 증가
      await module.incrementInstallation();

      logger.info(`모듈 설치 완료: ${moduleId} by ${userId}`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 설치 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 제거
   * @param {string} moduleId - 모듈 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 제거 결과
   */
  async uninstallModule(moduleId, userId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      // 모듈 제거 로직 실행
      await this.executeUninstallation(module, userId);

      // 설치 수 감소
      module.installationCount = Math.max(0, module.installationCount - 1);
      await module.save();

      logger.info(`모듈 제거 완료: ${moduleId} by ${userId}`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 제거 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 평가
   * @param {string} moduleId - 모듈 ID
   * @param {number} rating - 평가 점수 (1-5)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 평가 결과
   */
  async rateModule(moduleId, rating, userId) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('평가 점수는 1-5 사이여야 합니다.');
      }

      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      await module.updateRating(rating);

      logger.info(`모듈 평가 완료: ${moduleId} by ${userId} - ${rating}점`);
      return { success: true, module };
    } catch (error) {
      logger.error('모듈 평가 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 통계 조회
   * @param {string} moduleId - 모듈 ID
   * @returns {Promise<Object>} 통계 정보
   */
  async getModuleStats(moduleId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('모듈을 찾을 수 없습니다.');
      }

      // 기본 통계
      const stats = {
        installationCount: module.installationCount,
        rating: module.rating,
        status: module.status,
        lastUpdated: module.lastUpdated
      };

      // 분석 데이터가 활성화된 경우
      if (module.analytics.enabled) {
        stats.analytics = await this.getAnalyticsData(module);
      }

      return { success: true, stats };
    } catch (error) {
      logger.error('모듈 통계 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 기본 기능 가져오기
   * @param {string} type - 모듈 타입
   * @returns {Array} 기본 기능 목록
   */
  getDefaultFeatures(type) {
    const defaultFeatures = {
      calendar_extension: [
        {
          name: 'calendar_view',
          description: '캘린더 뷰 확장',
          enabled: true
        },
        {
          name: 'event_management',
          description: '이벤트 관리 기능',
          enabled: true
        }
      ],
      event_template: [
        {
          name: 'template_creation',
          description: '템플릿 생성',
          enabled: true
        },
        {
          name: 'template_sharing',
          description: '템플릿 공유',
          enabled: true
        }
      ],
      workflow: [
        {
          name: 'workflow_engine',
          description: '워크플로우 엔진',
          enabled: true
        },
        {
          name: 'automation',
          description: '자동화 기능',
          enabled: true
        }
      ],
      integration: [
        {
          name: 'api_integration',
          description: 'API 통합',
          enabled: true
        },
        {
          name: 'webhook_support',
          description: '웹훅 지원',
          enabled: true
        }
      ]
    };

    return defaultFeatures[type] || [];
  }

  /**
   * 기본 엔드포인트 가져오기
   * @param {string} moduleName - 모듈 이름
   * @returns {Array} 기본 엔드포인트 목록
   */
  getDefaultEndpoints(moduleName) {
    return [
      {
        path: `/api/modules/${moduleName}`,
        method: 'GET',
        description: '모듈 정보 조회',
        handler: 'getModuleInfo',
        permissions: ['user']
      },
      {
        path: `/api/modules/${moduleName}/config`,
        method: 'GET',
        description: '모듈 설정 조회',
        handler: 'getModuleConfig',
        permissions: ['user']
      },
      {
        path: `/api/modules/${moduleName}/config`,
        method: 'PUT',
        description: '모듈 설정 업데이트',
        handler: 'updateModuleConfig',
        permissions: ['admin']
      }
    ];
  }

  /**
   * 의존성 확인
   * @param {Object} module - 모듈 객체
   * @returns {Promise<void>}
   */
  async checkDependencies(module) {
    const { dependencies } = module;

    // 모듈 의존성 확인
    for (const dep of dependencies.modules) {
      if (dep.required) {
        const depModule = await Module.findById(dep.moduleId);
        if (!depModule || !depModule.configuration.isEnabled) {
          throw new Error(`필수 모듈 ${dep.name}이 설치되지 않았거나 비활성화되어 있습니다.`);
        }
      }
    }

    // 서비스 의존성 확인 (실제 구현에서는 서비스 상태 확인)
    for (const service of dependencies.services) {
      if (service.required) {
        // 서비스 상태 확인 로직
        logger.info(`서비스 의존성 확인: ${service.name}`);
      }
    }
  }

  /**
   * 모듈 설치 실행
   * @param {Object} module - 모듈 객체
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async executeInstallation(module, userId) {
    try {
      // 데이터베이스 스키마 생성
      if (module.dataSchema.collections) {
        await this.createCollections(module.dataSchema.collections);
      }

      // 워크플로우 등록
      if (module.workflows) {
        await this.registerWorkflows(module.workflows, userId);
      }

      // 웹훅 등록
      if (module.api.webhooks) {
        await this.registerWebhooks(module.api.webhooks, userId);
      }

      logger.info(`모듈 설치 실행 완료: ${module.name} for ${userId}`);
    } catch (error) {
      logger.error('모듈 설치 실행 오류:', error);
      throw error;
    }
  }

  /**
   * 모듈 제거 실행
   * @param {Object} module - 모듈 객체
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async executeUninstallation(module, userId) {
    try {
      // 워크플로우 제거
      if (module.workflows) {
        await this.unregisterWorkflows(module.workflows, userId);
      }

      // 웹훅 제거
      if (module.api.webhooks) {
        await this.unregisterWebhooks(module.api.webhooks, userId);
      }

      logger.info(`모듈 제거 실행 완료: ${module.name} for ${userId}`);
    } catch (error) {
      logger.error('모듈 제거 실행 오류:', error);
      throw error;
    }
  }

  /**
   * 컬렉션 생성
   * @param {Array} collections - 컬렉션 정의
   * @returns {Promise<void>}
   */
  async createCollections(collections) {
    // 실제 구현에서는 동적으로 스키마 생성
    for (const collection of collections) {
      logger.info(`컬렉션 생성: ${collection.name}`);
      // mongoose.model(collection.name, new mongoose.Schema(collection.schema));
    }
  }

  /**
   * 워크플로우 등록
   * @param {Array} workflows - 워크플로우 목록
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async registerWorkflows(workflows, userId) {
    for (const workflow of workflows) {
      if (workflow.isActive) {
        logger.info(`워크플로우 등록: ${workflow.name} for ${userId}`);
        // 실제 워크플로우 엔진에 등록
      }
    }
  }

  /**
   * 워크플로우 제거
   * @param {Array} workflows - 워크플로우 목록
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async unregisterWorkflows(workflows, userId) {
    for (const workflow of workflows) {
      logger.info(`워크플로우 제거: ${workflow.name} for ${userId}`);
      // 실제 워크플로우 엔진에서 제거
    }
  }

  /**
   * 웹훅 등록
   * @param {Array} webhooks - 웹훅 목록
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async registerWebhooks(webhooks, userId) {
    for (const webhook of webhooks) {
      if (webhook.isActive) {
        logger.info(`웹훅 등록: ${webhook.name} for ${userId}`);
        // 실제 웹훅 시스템에 등록
      }
    }
  }

  /**
   * 웹훅 제거
   * @param {Array} webhooks - 웹훅 목록
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async unregisterWebhooks(webhooks, userId) {
    for (const webhook of webhooks) {
      logger.info(`웹훅 제거: ${webhook.name} for ${userId}`);
      // 실제 웹훅 시스템에서 제거
    }
  }

  /**
   * 분석 데이터 가져오기
   * @param {Object} module - 모듈 객체
   * @returns {Promise<Object>} 분석 데이터
   */
  async getAnalyticsData(module) {
    // 실제 구현에서는 분석 데이터 수집
    return {
      usage: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      performance: {
        responseTime: 0,
        errorRate: 0
      },
      userEngagement: {
        activeUsers: 0,
        sessionDuration: 0
      }
    };
  }
}

module.exports = new ModuleService(); 