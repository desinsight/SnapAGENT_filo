// templates.api.test.js
// 일정 템플릿 기능 통합 테스트
// 편의성 극대화 기능 검증

const request = require('supertest');
const app = require('../src/index');
const mongoose = require('mongoose');
const Event = require('../src/models/Event');
const EventTemplate = require('../src/models/EventTemplate');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/calendar_service');
  }
});
afterAll(async () => {
  await mongoose.disconnect();
});

describe('📋 일정 템플릿 API 테스트', () => {
  let testEventId;
  let testTemplateId;

  beforeEach(async () => {
    await Event.deleteMany({});
    await EventTemplate.deleteMany({});
    
    // 테스트용 일정 생성
    const testEvent = {
      id: 'test-event-1',
      calendarId: 'test-calendar',
      title: '테스트 회의',
      description: '주간 팀 회의',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T11:00:00Z'),
      attendees: ['user1@test.com', 'user2@test.com'],
      tags: ['회의', '팀'],
      color: '#1976d2',
      allDay: false,
      category: '업무',
      ownerId: 'test-user'
    };
    await Event.create(testEvent);
    testEventId = testEvent.id;
  });

  describe('🎯 템플릿 CRUD 기능', () => {
    test('템플릿 생성 성공', async () => {
      const templateData = {
        name: '주간 팀 회의 템플릿',
        description: '매주 월요일 오전 팀 회의',
        type: 'personal',
        category: '업무',
        tags: ['회의', '팀', '주간'],
        template: {
          title: '주간 팀 회의',
          description: '이번 주 진행상황 공유 및 다음 주 계획 수립',
          duration: 60,
          color: '#1976d2',
          allDay: false,
          attendees: ['team@company.com'],
          category: '업무',
          tags: ['회의', '팀']
        }
      };

      const response = await request(app)
        .post('/api/templates')
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('주간 팀 회의 템플릿');
      expect(response.body.data.template.type).toBe('personal');
      expect(response.body.data.template.usageCount).toBe(0);
      
      testTemplateId = response.body.data.template.id;
    });

    test('템플릿 목록 조회 성공', async () => {
      // 먼저 템플릿 생성
      const templateData = {
        name: '테스트 템플릿',
        template: { title: '테스트 일정', duration: 30 }
      };
      
      await request(app).post('/api/templates').send(templateData);

      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.templates)).toBe(true);
      expect(response.body.data.templates.length).toBeGreaterThan(0);
    });

    test('템플릿 상세 조회 성공', async () => {
      // 먼저 템플릿 생성
      const templateData = {
        name: '상세 조회 테스트',
        template: { title: '상세 테스트', duration: 45 }
      };
      
      const createResponse = await request(app).post('/api/templates').send(templateData);
      const templateId = createResponse.body.data.template.id;

      const response = await request(app)
        .get(`/api/templates/${templateId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.id).toBe(templateId);
      expect(response.body.data.template.name).toBe('상세 조회 테스트');
    });

    test('템플릿 삭제 성공', async () => {
      // 먼저 템플릿 생성
      const templateData = {
        name: '삭제 테스트',
        template: { title: '삭제될 템플릿', duration: 30 }
      };
      
      const createResponse = await request(app).post('/api/templates').send(templateData);
      const templateId = createResponse.body.data.template.id;

      const response = await request(app)
        .delete(`/api/templates/${templateId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // 삭제 확인
      const getResponse = await request(app)
        .get(`/api/templates/${templateId}`)
        .expect(404);
    });
  });

  describe('🚀 편의성 극대화 기능', () => {
    test('템플릿에서 일정 생성 (복사/붙여넣기) 성공', async () => {
      // 먼저 템플릿 생성
      const templateData = {
        name: '복사 테스트 템플릿',
        template: {
          title: '복사될 일정',
          description: '템플릿에서 생성된 일정',
          duration: 90,
          color: '#ff5722',
          attendees: ['copy@test.com']
        }
      };
      
      const createResponse = await request(app).post('/api/templates').send(templateData);
      const templateId = createResponse.body.data.template.id;

      const eventData = {
        start: '2024-01-20T14:00:00Z',
        end: '2024-01-20T15:30:00Z',
        calendarId: 'test-calendar',
        customData: {
          title: '수정된 제목',
          description: '커스텀 설명'
        }
      };

      const response = await request(app)
        .post(`/api/templates/${templateId}/create-event`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe('수정된 제목');
      expect(response.body.data.event.description).toBe('커스텀 설명');
      expect(response.body.data.event.attendees).toContain('copy@test.com');
      
      // 템플릿 사용 횟수 증가 확인
      const templateResponse = await request(app)
        .get(`/api/templates/${templateId}`)
        .expect(200);
      
      expect(templateResponse.body.data.template.usageCount).toBe(1);
    });

    test('기존 일정을 템플릿으로 저장 성공', async () => {
      const templateData = {
        name: '저장된 일정 템플릿',
        description: '기존 일정에서 생성된 템플릿',
        type: 'personal',
        category: '업무'
      };

      const response = await request(app)
        .post(`/api/calendar/${testEventId}/save-as-template`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.name).toBe('저장된 일정 템플릿');
      expect(response.body.data.template.template.title).toBe('테스트 회의');
      expect(response.body.data.template.template.duration).toBe(60); // 1시간
    });

    test('스마트 템플릿 추천 성공', async () => {
      // 여러 템플릿 생성
      const templates = [
        { name: '자주 사용 템플릿', template: { title: '자주 사용', duration: 30 } },
        { name: '최근 사용 템플릿', template: { title: '최근 사용', duration: 45 } },
        { name: '공개 템플릿', type: 'public', template: { title: '공개', duration: 60 } }
      ];

      for (const template of templates) {
        await request(app).post('/api/templates').send(template);
      }

      const response = await request(app)
        .get('/api/templates/recommendations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
      
      // 추천 이유가 포함되어 있는지 확인
      const hasReason = response.body.data.recommendations.some(rec => rec.reason);
      expect(hasReason).toBe(true);
    });

    test('템플릿 즐겨찾기 토글 성공', async () => {
      // 먼저 템플릿 생성
      const templateData = {
        name: '즐겨찾기 테스트',
        template: { title: '즐겨찾기', duration: 30 }
      };
      
      const createResponse = await request(app).post('/api/templates').send(templateData);
      const templateId = createResponse.body.data.template.id;

      // 즐겨찾기 추가
      const addResponse = await request(app)
        .patch(`/api/templates/${templateId}/favorite`)
        .expect(200);

      expect(addResponse.body.success).toBe(true);
      expect(addResponse.body.data.template.isFavorite).toBe(true);

      // 즐겨찾기 제거
      const removeResponse = await request(app)
        .patch(`/api/templates/${templateId}/favorite`)
        .expect(200);

      expect(removeResponse.body.success).toBe(true);
      expect(removeResponse.body.data.template.isFavorite).toBe(false);
    });

    test('템플릿 검색 성공', async () => {
      // 검색할 템플릿들 생성
      const templates = [
        { name: '회의 템플릿', template: { title: '회의', duration: 60 }, tags: ['회의'] },
        { name: '미팅 템플릿', template: { title: '미팅', duration: 30 }, tags: ['미팅'] },
        { name: '업무 템플릿', template: { title: '업무', duration: 120 }, category: '업무' }
      ];

      for (const template of templates) {
        await request(app).post('/api/templates').send(template);
      }

      // '회의' 검색
      const response = await request(app)
        .get('/api/templates/search?q=' + encodeURIComponent('회의'))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.length).toBeGreaterThan(0);
      
      // 검색 결과에 '회의'가 포함되어 있는지 확인
      const hasMeeting = response.body.data.templates.some(t => 
        t.name.includes('회의') || t.tags.includes('회의')
      );
      expect(hasMeeting).toBe(true);
    });
  });

  describe('🔍 고급 기능 테스트', () => {
    test('다양한 타입의 템플릿 생성 및 조회', async () => {
      const templateTypes = [
        { name: '개인 템플릿', type: 'personal' },
        { name: '팀 템플릿', type: 'team' },
        { name: '공개 템플릿', type: 'public' }
      ];

      for (const template of templateTypes) {
        await request(app).post('/api/templates').send({
          ...template,
          template: { title: template.name, duration: 30 }
        });
      }

      // 개인 템플릿만 조회
      const personalResponse = await request(app)
        .get('/api/templates?type=personal')
        .expect(200);

      expect(personalResponse.body.data.templates.every(t => t.type === 'personal')).toBe(true);

      // 팀 템플릿만 조회
      const teamResponse = await request(app)
        .get('/api/templates?type=team')
        .expect(200);

      expect(teamResponse.body.data.templates.every(t => t.type === 'team')).toBe(true);
    });

    test('템플릿 사용 통계 확인', async () => {
      // 템플릿 생성
      const templateData = {
        name: '통계 테스트',
        template: { title: '통계', duration: 30 }
      };
      
      const createResponse = await request(app).post('/api/templates').send(templateData);
      const templateId = createResponse.body.data.template.id;

      // 여러 번 사용
      for (let i = 0; i < 3; i++) {
        await request(app).post(`/api/templates/${templateId}/create-event`).send({
          calendarId: 'test-calendar'
        });
      }

      // 사용 통계 확인
      const response = await request(app)
        .get(`/api/templates/${templateId}`)
        .expect(200);

      expect(response.body.data.template.usageCount).toBe(3);
      expect(response.body.data.template.lastUsed).toBeTruthy();
    });

    test('복잡한 템플릿에서 일정 생성', async () => {
      // 복잡한 템플릿 생성
      const complexTemplate = {
        name: '복잡한 회의 템플릿',
        description: '반복 회의를 위한 고급 템플릿',
        type: 'team',
        category: '회의',
        tags: ['팀', '주간', '리뷰'],
        template: {
          title: '주간 팀 리뷰',
          description: '이번 주 진행상황 공유 및 다음 주 계획 수립',
          duration: 90,
          color: '#4caf50',
          allDay: false,
          recurrence: 'FREQ=WEEKLY;BYDAY=MO',
          attendees: ['team@company.com', 'manager@company.com'],
          notifications: [
            { type: 'email', minutes: 15 },
            { type: 'popup', minutes: 5 }
          ],
          category: '회의',
          tags: ['팀', '주간', '리뷰']
        }
      };

      const createResponse = await request(app).post('/api/templates').send(complexTemplate);
      const templateId = createResponse.body.data.template.id;

      // 복잡한 템플릿에서 일정 생성
      const eventData = {
        start: '2024-01-22T09:00:00Z',
        end: '2024-01-22T10:30:00Z',
        calendarId: 'team-calendar',
        customData: {
          title: '수정된 팀 리뷰',
          attendees: ['team@company.com', 'newmember@company.com']
        }
      };

      const response = await request(app)
        .post(`/api/templates/${templateId}/create-event`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe('수정된 팀 리뷰');
      expect(response.body.data.event.recurrence).toBe('FREQ=WEEKLY;BYDAY=MO');
      expect(response.body.data.event.attendees).toContain('newmember@company.com');
      expect(response.body.data.event.notifications).toHaveLength(2);
    });
  });

  describe('❌ 에러 처리 테스트', () => {
    test('존재하지 않는 템플릿 조회 시 404', async () => {
      const response = await request(app)
        .get('/api/templates/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('템플릿을 찾을 수 없습니다');
    });

    test('존재하지 않는 템플릿에서 일정 생성 시 404', async () => {
      const response = await request(app)
        .post('/api/templates/non-existent-id/create-event')
        .send({ calendarId: 'test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('템플릿을 찾을 수 없습니다');
    });

    test('존재하지 않는 일정을 템플릿으로 저장 시 404', async () => {
      const response = await request(app)
        .post('/api/calendar/non-existent-event/save-as-template')
        .send({ name: 'test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('일정을 찾을 수 없습니다');
    });

    test('검색어 없이 검색 시 400', async () => {
      const response = await request(app)
        .get('/api/templates/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('검색어를 입력해주세요');
    });

    test('필수 필드 없이 템플릿 생성 시 500', async () => {
      const response = await request(app)
        .post('/api/templates')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
}); 