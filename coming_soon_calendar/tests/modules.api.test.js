const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Module = require('../src/models/Module');

describe('모듈 API 테스트', () => {
  let testModuleId;
  let testUserId = '507f1f77bcf86cd799439011'; // 테스트용 사용자 ID

  beforeAll(async () => {
    // 테스트 데이터베이스 연결
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/calendar_test');
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await Module.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 모듈 데이터 정리
    await Module.deleteMany({});
  });

  describe('POST /api/modules', () => {
    it('새로운 모듈을 성공적으로 생성해야 함', async () => {
      const moduleData = {
        name: 'test_module',
        displayName: '테스트 모듈',
        description: '테스트를 위한 모듈입니다.',
        version: '1.0.0',
        category: 'business',
        subcategory: 'calendar',
        type: 'calendar_extension',
        features: [
          {
            name: 'test_feature',
            description: '테스트 기능',
            enabled: true
          }
        ],
        configuration: {
          isEnabled: true,
          isPublic: false,
          requiresApproval: false,
          maxUsers: 100,
          settings: {},
          permissions: {
            view: ['user'],
            edit: ['admin'],
            delete: ['admin'],
            manage: ['admin']
          }
        },
        ui: {
          icon: 'extension',
          color: '#007bff',
          position: 'sidebar',
          order: 0,
          showInMenu: true,
          showInDashboard: false
        },
        dataSchema: {
          collections: [],
          relationships: []
        },
        api: {
          endpoints: [],
          webhooks: []
        },
        workflows: [],
        analytics: {
          enabled: false,
          metrics: [],
          dashboards: []
        },
        dependencies: {
          modules: [],
          services: [],
          permissions: []
        },
        metadata: {
          tags: ['test', 'calendar'],
          keywords: ['테스트', '캘린더']
        }
      };

      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer test-token`)
        .send(moduleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 생성되었습니다.');
      expect(response.body.data.name).toBe('test_module');
      expect(response.body.data.category).toBe('business');
      expect(response.body.data.status).toBe('draft');

      testModuleId = response.body.data._id;
    });

    it('필수 필드가 누락된 경우 400 오류를 반환해야 함', async () => {
      const invalidData = {
        description: '설명만 있는 경우'
      };

      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer test-token`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('필수 필드가 누락되었습니다.');
    });

    it('비즈니스 모듈을 성공적으로 생성해야 함', async () => {
      const businessModuleData = {
        name: 'business_calendar',
        displayName: '비즈니스 캘린더',
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
        },
        ui: {
          icon: 'business',
          color: '#28a745',
          position: 'sidebar'
        }
      };

      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer test-token`)
        .send(businessModuleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('business');
      expect(response.body.data.features).toHaveLength(3);
      expect(response.body.data.configuration.isPublic).toBe(true);
    });
  });

  describe('GET /api/modules', () => {
    beforeEach(async () => {
      // 테스트용 모듈 데이터 생성
      const modules = [
        {
          name: 'module_1',
          displayName: '모듈 1',
          description: '첫 번째 테스트 모듈',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: false },
          createdBy: testUserId
        },
        {
          name: 'module_2',
          displayName: '모듈 2',
          description: '두 번째 테스트 모듈',
          category: 'education',
          type: 'workflow',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          createdBy: testUserId
        },
        {
          name: 'module_3',
          displayName: '모듈 3',
          description: '세 번째 테스트 모듈',
          category: 'healthcare',
          type: 'integration',
          status: 'inactive',
          configuration: { isEnabled: false, isPublic: false },
          createdBy: testUserId
        }
      ];

      await Module.insertMany(modules);
    });

    it('모든 모듈 목록을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('필터링된 모듈 목록을 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules?category=business&type=calendar_extension')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(1);
      expect(response.body.data.modules[0].category).toBe('business');
    });

    it('검색 기능으로 모듈을 찾을 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/modules?search=모듈')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(3);
      expect(response.body.data.modules.every(m => m.displayName.includes('모듈'))).toBe(true);
    });
  });

  describe('GET /api/modules/:id', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'detail_test',
        displayName: '상세 조회 테스트',
        description: '상세 조회를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('특정 모듈을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get(`/api/modules/${testModuleId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('상세 조회 테스트');
      expect(response.body.data._id).toBe(testModuleId.toString());
    });

    it('존재하지 않는 모듈 ID로 조회 시 404 오류를 반환해야 함', async () => {
      const fakeId = '507f1f77bcf86cd799439012';
      const response = await request(app)
        .get(`/api/modules/${fakeId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('모듈을 찾을 수 없습니다.');
    });
  });

  describe('PUT /api/modules/:id', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'update_test',
        displayName: '수정 테스트',
        description: '수정을 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 수정해야 함', async () => {
      const updateData = {
        displayName: '수정된 모듈',
        description: '수정된 설명',
        version: '2.0.0'
      };

      const response = await request(app)
        .put(`/api/modules/${testModuleId}`)
        .set('Authorization', `Bearer test-token`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('수정된 모듈');
      expect(response.body.data.version).toBe('2.0.0');
    });
  });

  describe('DELETE /api/modules/:id', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'delete_test',
        displayName: '삭제 테스트',
        description: '삭제를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        installationCount: 0,
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 삭제해야 함', async () => {
      const response = await request(app)
        .delete(`/api/modules/${testModuleId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 삭제되었습니다.');

      // 삭제 확인
      const deletedModule = await Module.findById(testModuleId);
      expect(deletedModule).toBeNull();
    });
  });

  describe('PATCH /api/modules/:id/toggle', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'toggle_test',
        displayName: '토글 테스트',
        description: '토글을 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        status: 'active',
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 비활성화해야 함', async () => {
      const response = await request(app)
        .patch(`/api/modules/${testModuleId}/toggle`)
        .set('Authorization', `Bearer test-token`)
        .send({ enabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 비활성화되었습니다.');
      expect(response.body.data.configuration.isEnabled).toBe(false);
      expect(response.body.data.status).toBe('inactive');
    });

    it('모듈을 성공적으로 활성화해야 함', async () => {
      // 먼저 비활성화
      await Module.findByIdAndUpdate(testModuleId, {
        'configuration.isEnabled': false,
        status: 'inactive'
      });

      const response = await request(app)
        .patch(`/api/modules/${testModuleId}/toggle`)
        .set('Authorization', `Bearer test-token`)
        .send({ enabled: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 활성화되었습니다.');
      expect(response.body.data.configuration.isEnabled).toBe(true);
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('POST /api/modules/:id/install', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'install_test',
        displayName: '설치 테스트',
        description: '설치를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        status: 'active',
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 설치해야 함', async () => {
      const response = await request(app)
        .post(`/api/modules/${testModuleId}/install`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 설치되었습니다.');

      // 설치 수 증가 확인
      const installedModule = await Module.findById(testModuleId);
      expect(installedModule.installationCount).toBe(1);
    });
  });

  describe('POST /api/modules/:id/uninstall', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'uninstall_test',
        displayName: '제거 테스트',
        description: '제거를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        status: 'active',
        installationCount: 1,
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 제거해야 함', async () => {
      const response = await request(app)
        .post(`/api/modules/${testModuleId}/uninstall`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈이 성공적으로 제거되었습니다.');

      // 설치 수 감소 확인
      const uninstalledModule = await Module.findById(testModuleId);
      expect(uninstalledModule.installationCount).toBe(0);
    });
  });

  describe('POST /api/modules/:id/rate', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'rate_test',
        displayName: '평가 테스트',
        description: '평가를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        rating: { average: 0, count: 0 },
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈을 성공적으로 평가해야 함', async () => {
      const response = await request(app)
        .post(`/api/modules/${testModuleId}/rate`)
        .set('Authorization', `Bearer test-token`)
        .send({ rating: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈 평가가 성공적으로 등록되었습니다.');

      // 평가 결과 확인
      const ratedModule = await Module.findById(testModuleId);
      expect(ratedModule.rating.average).toBe(5);
      expect(ratedModule.rating.count).toBe(1);
    });

    it('잘못된 평가 점수로 400 오류를 반환해야 함', async () => {
      const response = await request(app)
        .post(`/api/modules/${testModuleId}/rate`)
        .set('Authorization', `Bearer test-token`)
        .send({ rating: 6 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('평가 점수는 1-5 사이의 숫자여야 합니다.');
    });
  });

  describe('GET /api/modules/category/:category', () => {
    beforeEach(async () => {
      const modules = [
        {
          name: 'business_1',
          displayName: '비즈니스 모듈 1',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: false },
          createdBy: testUserId
        },
        {
          name: 'business_2',
          displayName: '비즈니스 모듈 2',
          category: 'business',
          type: 'workflow',
          status: 'active',
          configuration: { isEnabled: true, isPublic: false },
          createdBy: testUserId
        },
        {
          name: 'education_1',
          displayName: '교육 모듈 1',
          category: 'education',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: false },
          createdBy: testUserId
        }
      ];

      await Module.insertMany(modules);
    });

    it('카테고리별 모듈을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules/category/business')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(m => m.category === 'business')).toBe(true);
    });
  });

  describe('GET /api/modules/public', () => {
    beforeEach(async () => {
      const modules = [
        {
          name: 'public_1',
          displayName: '공개 모듈 1',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          rating: { average: 4.5, count: 10 },
          installationCount: 100,
          createdBy: testUserId
        },
        {
          name: 'public_2',
          displayName: '공개 모듈 2',
          category: 'education',
          type: 'workflow',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          rating: { average: 4.0, count: 5 },
          installationCount: 50,
          createdBy: testUserId
        },
        {
          name: 'private_1',
          displayName: '비공개 모듈 1',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: false },
          createdBy: testUserId
        }
      ];

      await Module.insertMany(modules);
    });

    it('공개 모듈을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules/public')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(m => m.configuration.isPublic)).toBe(true);
    });
  });

  describe('GET /api/modules/popular', () => {
    beforeEach(async () => {
      const modules = [
        {
          name: 'popular_1',
          displayName: '인기 모듈 1',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          rating: { average: 4.8, count: 100 },
          installationCount: 1000,
          createdBy: testUserId
        },
        {
          name: 'popular_2',
          displayName: '인기 모듈 2',
          category: 'education',
          type: 'workflow',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          rating: { average: 4.5, count: 50 },
          installationCount: 500,
          createdBy: testUserId
        },
        {
          name: 'unpopular_1',
          displayName: '비인기 모듈 1',
          category: 'business',
          type: 'calendar_extension',
          status: 'active',
          configuration: { isEnabled: true, isPublic: true },
          rating: { average: 3.0, count: 5 },
          installationCount: 10,
          createdBy: testUserId
        }
      ];

      await Module.insertMany(modules);
    });

    it('인기 모듈을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules/popular?limit=2')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // 설치 수 순으로 정렬되어야 함
      expect(response.body.data[0].installationCount).toBeGreaterThanOrEqual(response.body.data[1].installationCount);
    });
  });

  describe('GET /api/modules/:id/stats', () => {
    beforeEach(async () => {
      const module = new Module({
        name: 'stats_test',
        displayName: '통계 테스트',
        description: '통계를 위한 테스트 모듈',
        category: 'business',
        type: 'calendar_extension',
        configuration: { isEnabled: true, isPublic: false },
        installationCount: 100,
        rating: { average: 4.5, count: 20 },
        status: 'active',
        lastUpdated: new Date(),
        createdBy: testUserId
      });
      await module.save();
      testModuleId = module._id;
    });

    it('모듈 통계를 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get(`/api/modules/${testModuleId}/stats`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('installationCount');
      expect(response.body.data).toHaveProperty('rating');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data.installationCount).toBe(100);
      expect(response.body.data.rating.average).toBe(4.5);
    });
  });

  describe('GET /api/modules/templates', () => {
    it('모듈 템플릿을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/modules/templates')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // 템플릿 구조 확인
      const template = response.body.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('features');
      expect(template).toHaveProperty('configuration');
    });
  });

  describe('POST /api/modules/validate', () => {
    it('유효한 모듈 데이터를 성공적으로 검증해야 함', async () => {
      const validModuleData = {
        name: 'valid_module',
        displayName: '유효한 모듈',
        category: 'business',
        type: 'calendar_extension'
      };

      const response = await request(app)
        .post('/api/modules/validate')
        .set('Authorization', `Bearer test-token`)
        .send(validModuleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('모듈 검증이 성공적으로 완료되었습니다.');
    });

    it('유효하지 않은 모듈 데이터에 대해 400 오류를 반환해야 함', async () => {
      const invalidModuleData = {
        description: '설명만 있는 경우'
      };

      const response = await request(app)
        .post('/api/modules/validate')
        .set('Authorization', `Bearer test-token`)
        .send(invalidModuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('모듈 검증 실패');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
}); 