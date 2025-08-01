const moduleService = require('../services/moduleService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 모듈 컨트롤러
 * 분야별 맞춤 모듈 및 관리자 기능 제공
 */
class ModuleController {
  /**
   * 모듈 생성
   * POST /api/modules
   */
  async createModule(req, res) {
    try {
      const {
        name,
        displayName,
        description,
        version,
        category,
        subcategory,
        type,
        features,
        configuration,
        ui,
        dataSchema,
        api,
        workflows,
        analytics,
        dependencies,
        metadata
      } = req.body;
      const creatorId = req.user.id;

      // 필수 필드 검증
      if (!name || !displayName || !category || !type) {
        return errorResponse(res, 400, '필수 필드가 누락되었습니다.');
      }

      // 이름 중복 검증
      const existingModule = await moduleService.getModuleByName(name);
      if (existingModule) {
        return errorResponse(res, 400, '이미 존재하는 모듈 이름입니다.');
      }

      const moduleData = {
        name,
        displayName,
        description,
        version: version || '1.0.0',
        category,
        subcategory,
        type,
        features,
        configuration: configuration || {
          isEnabled: true,
          isPublic: false,
          requiresApproval: false,
          maxUsers: -1,
          settings: {},
          permissions: {
            view: ['user'],
            edit: ['admin'],
            delete: ['admin'],
            manage: ['admin']
          }
        },
        ui: ui || {
          icon: 'extension',
          color: '#007bff',
          position: 'sidebar',
          order: 0,
          showInMenu: true,
          showInDashboard: false
        },
        dataSchema: dataSchema || { collections: [], relationships: [] },
        api: api || { endpoints: [], webhooks: [] },
        workflows: workflows || [],
        analytics: analytics || { enabled: false, metrics: [], dashboards: [] },
        dependencies: dependencies || { modules: [], services: [], permissions: [] },
        metadata: metadata || { tags: [], keywords: [] }
      };

      const result = await moduleService.createModule(moduleData, creatorId);

      return successResponse(res, 201, '모듈이 성공적으로 생성되었습니다.', result.module);
    } catch (error) {
      console.error('모듈 생성 오류:', error);
      return errorResponse(res, 500, '모듈 생성 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 목록 조회
   * GET /api/modules
   */
  async getModules(req, res) {
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
      } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      if (isEnabled !== undefined) filters.isEnabled = isEnabled === 'true';

      const options = {
        category,
        type,
        status,
        isPublic: isPublic === 'true',
        isEnabled: isEnabled === 'true',
        search,
        sortBy,
        sortOrder,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await moduleService.getModules(filters, options);

      return successResponse(res, 200, '모듈 목록을 성공적으로 조회했습니다.', result);
    } catch (error) {
      console.error('모듈 목록 조회 오류:', error);
      return errorResponse(res, 500, '모듈 목록 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 상세 조회
   * GET /api/modules/:id
   */
  async getModule(req, res) {
    try {
      const { id } = req.params;
      const result = await moduleService.getModule(id);

      return successResponse(res, 200, '모듈을 성공적으로 조회했습니다.', result.module);
    } catch (error) {
      console.error('모듈 조회 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 수정
   * PUT /api/modules/:id
   */
  async updateModule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updaterId = req.user.id;

      const result = await moduleService.updateModule(id, updateData, updaterId);

      return successResponse(res, 200, '모듈이 성공적으로 수정되었습니다.', result.module);
    } catch (error) {
      console.error('모듈 수정 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 수정 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 삭제
   * DELETE /api/modules/:id
   */
  async deleteModule(req, res) {
    try {
      const { id } = req.params;
      const deleterId = req.user.id;

      await moduleService.deleteModule(id, deleterId);

      return successResponse(res, 200, '모듈이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('모듈 삭제 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      if (error.message === '설치된 모듈은 삭제할 수 없습니다. 먼저 비활성화하세요.') {
        return errorResponse(res, 400, '설치된 모듈은 삭제할 수 없습니다. 먼저 비활성화하세요.');
      }
      return errorResponse(res, 500, '모듈 삭제 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 활성화/비활성화
   * PATCH /api/modules/:id/toggle
   */
  async toggleModule(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const updaterId = req.user.id;

      if (typeof enabled !== 'boolean') {
        return errorResponse(res, 400, 'enabled 필드는 boolean 값이어야 합니다.');
      }

      const result = await moduleService.toggleModule(id, enabled, updaterId);

      return successResponse(res, 200, `모듈이 성공적으로 ${enabled ? '활성화' : '비활성화'}되었습니다.`, result.module);
    } catch (error) {
      console.error('모듈 활성화/비활성화 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 활성화/비활성화 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 설치
   * POST /api/modules/:id/install
   */
  async installModule(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await moduleService.installModule(id, userId);

      return successResponse(res, 200, '모듈이 성공적으로 설치되었습니다.', result.module);
    } catch (error) {
      console.error('모듈 설치 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      if (error.message === '비활성화된 모듈은 설치할 수 없습니다.') {
        return errorResponse(res, 400, '비활성화된 모듈은 설치할 수 없습니다.');
      }
      if (error.message.includes('최대 사용자 수에 도달했습니다.')) {
        return errorResponse(res, 400, '최대 사용자 수에 도달했습니다.');
      }
      if (error.message.includes('필수 모듈')) {
        return errorResponse(res, 400, error.message);
      }
      return errorResponse(res, 500, '모듈 설치 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 제거
   * POST /api/modules/:id/uninstall
   */
  async uninstallModule(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await moduleService.uninstallModule(id, userId);

      return successResponse(res, 200, '모듈이 성공적으로 제거되었습니다.', result.module);
    } catch (error) {
      console.error('모듈 제거 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 제거 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 평가
   * POST /api/modules/:id/rate
   */
  async rateModule(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user.id;

      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return errorResponse(res, 400, '평가 점수는 1-5 사이의 숫자여야 합니다.');
      }

      const result = await moduleService.rateModule(id, rating, userId);

      return successResponse(res, 200, '모듈 평가가 성공적으로 등록되었습니다.', result.module);
    } catch (error) {
      console.error('모듈 평가 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 평가 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 카테고리별 모듈 조회
   * GET /api/modules/category/:category
   */
  async getModulesByCategory(req, res) {
    try {
      const { category } = req.params;
      const result = await moduleService.getModulesByCategory(category);

      return successResponse(res, 200, `${category} 카테고리 모듈을 성공적으로 조회했습니다.`, result.modules);
    } catch (error) {
      console.error('카테고리별 모듈 조회 오류:', error);
      return errorResponse(res, 500, '카테고리별 모듈 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 공개 모듈 조회
   * GET /api/modules/public
   */
  async getPublicModules(req, res) {
    try {
      const result = await moduleService.getPublicModules();

      return successResponse(res, 200, '공개 모듈을 성공적으로 조회했습니다.', result.modules);
    } catch (error) {
      console.error('공개 모듈 조회 오류:', error);
      return errorResponse(res, 500, '공개 모듈 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 인기 모듈 조회
   * GET /api/modules/popular
   */
  async getPopularModules(req, res) {
    try {
      const { limit = 10 } = req.query;
      const result = await moduleService.getPopularModules(parseInt(limit));

      return successResponse(res, 200, '인기 모듈을 성공적으로 조회했습니다.', result.modules);
    } catch (error) {
      console.error('인기 모듈 조회 오류:', error);
      return errorResponse(res, 500, '인기 모듈 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 통계 조회
   * GET /api/modules/:id/stats
   */
  async getModuleStats(req, res) {
    try {
      const { id } = req.params;
      const result = await moduleService.getModuleStats(id);

      return successResponse(res, 200, '모듈 통계를 성공적으로 조회했습니다.', result.stats);
    } catch (error) {
      console.error('모듈 통계 조회 오류:', error);
      if (error.message === '모듈을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '모듈을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '모듈 통계 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 템플릿 조회
   * GET /api/modules/templates
   */
  async getModuleTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'business_calendar',
          name: '비즈니스 캘린더',
          description: '기업용 캘린더 확장 모듈',
          category: 'business',
          type: 'calendar_extension',
          features: [
            { name: 'meeting_scheduler', description: '회의 스케줄러' },
            { name: 'resource_booking', description: '자원 예약 시스템' },
            { name: 'approval_workflow', description: '승인 워크플로우' }
          ],
          configuration: {
            isPublic: true,
            maxUsers: 1000
          }
        },
        {
          id: 'education_planner',
          name: '교육 플래너',
          description: '교육기관용 일정 관리 모듈',
          category: 'education',
          type: 'calendar_extension',
          features: [
            { name: 'class_scheduling', description: '수업 스케줄링' },
            { name: 'student_attendance', description: '학생 출석 관리' },
            { name: 'exam_calendar', description: '시험 일정 관리' }
          ],
          configuration: {
            isPublic: true,
            maxUsers: 5000
          }
        },
        {
          id: 'healthcare_scheduler',
          name: '의료 스케줄러',
          description: '의료기관용 예약 관리 모듈',
          category: 'healthcare',
          type: 'calendar_extension',
          features: [
            { name: 'appointment_booking', description: '진료 예약 시스템' },
            { name: 'doctor_availability', description: '의사 가용성 관리' },
            { name: 'patient_records', description: '환자 기록 연동' }
          ],
          configuration: {
            isPublic: true,
            maxUsers: 500
          }
        },
        {
          id: 'workflow_automation',
          name: '워크플로우 자동화',
          description: '업무 자동화 워크플로우 모듈',
          category: 'business',
          type: 'workflow',
          features: [
            { name: 'task_automation', description: '작업 자동화' },
            { name: 'approval_chain', description: '승인 체인' },
            { name: 'notification_system', description: '알림 시스템' }
          ],
          configuration: {
            isPublic: true,
            maxUsers: -1
          }
        }
      ];

      return successResponse(res, 200, '모듈 템플릿을 성공적으로 조회했습니다.', templates);
    } catch (error) {
      console.error('모듈 템플릿 조회 오류:', error);
      return errorResponse(res, 500, '모듈 템플릿 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 모듈 검증
   * POST /api/modules/validate
   */
  async validateModule(req, res) {
    try {
      const moduleData = req.body;

      // 모듈 데이터 검증
      const validationErrors = [];

      if (!moduleData.name) {
        validationErrors.push('모듈 이름이 필요합니다.');
      }

      if (!moduleData.displayName) {
        validationErrors.push('모듈 표시 이름이 필요합니다.');
      }

      if (!moduleData.category) {
        validationErrors.push('모듈 카테고리가 필요합니다.');
      }

      if (!moduleData.type) {
        validationErrors.push('모듈 타입이 필요합니다.');
      }

      // 의존성 검증
      if (moduleData.dependencies) {
        for (const dep of moduleData.dependencies.modules || []) {
          if (dep.required && !dep.moduleId && !dep.name) {
            validationErrors.push('필수 모듈 의존성 정보가 불완전합니다.');
          }
        }
      }

      if (validationErrors.length > 0) {
        return errorResponse(res, 400, '모듈 검증 실패', validationErrors);
      }

      return successResponse(res, 200, '모듈 검증이 성공적으로 완료되었습니다.');
    } catch (error) {
      console.error('모듈 검증 오류:', error);
      return errorResponse(res, 500, '모듈 검증 중 오류가 발생했습니다.', error.message);
    }
  }
}

module.exports = new ModuleController(); 