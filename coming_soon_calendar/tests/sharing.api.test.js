const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Calendar = require('../src/models/Calendar');
const Event = require('../src/models/Event');

describe('공유 캘린더 및 권한별 접근 제어 API 테스트', () => {
  let testCalendar, testEvent, ownerId, userId1, userId2, userId3;

  beforeAll(async () => {
    // 테스트용 사용자 ID 생성
    ownerId = new mongoose.Types.ObjectId();
    userId1 = new mongoose.Types.ObjectId();
    userId2 = new mongoose.Types.ObjectId();
    userId3 = new mongoose.Types.ObjectId();

    // 테스트용 캘린더 생성
    testCalendar = new Calendar({
      name: '테스트 캘린더',
      description: '공유 테스트용 캘린더',
      ownerId: ownerId,
      color: '#1976d2',
      timezone: 'Asia/Seoul'
    });
    await testCalendar.save();

    // 테스트용 이벤트 생성
    testEvent = new Event({
      title: '테스트 이벤트',
      description: '공유 테스트용 이벤트',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      calendarId: testCalendar._id,
      createdBy: ownerId
    });
    await testEvent.save();
  });

  afterAll(async () => {
    await Calendar.deleteMany({});
    await Event.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 캘린더 상태 초기화
    await Calendar.findByIdAndUpdate(testCalendar._id, {
      $set: {
        'sharing.isShared': false,
        'sharing.isPublic': false,
        'sharing.sharedWith': [],
        'sharing.publicLink.enabled': false,
        'sharing.publicLink.token': null
      }
    });
  });

  describe('캘린더 공유 기능', () => {
    test('캘린더 공유 초대 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/share`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          users: [
            {
              userId: userId1,
              role: 'viewer',
              permissions: {
                viewEvents: true,
                createEvents: false
              }
            },
            {
              userId: userId2,
              role: 'editor',
              permissions: {
                viewEvents: true,
                createEvents: true,
                editEvents: true
              }
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.results[0].status).toBe('invited');
      expect(response.body.data.results[1].status).toBe('invited');

      // 데이터베이스 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      expect(updatedCalendar.sharing.isShared).toBe(true);
      expect(updatedCalendar.sharing.sharedWith).toHaveLength(2);
    });

    test('캘린더 공유 초대 - 권한 없음', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/share`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          users: [{ userId: userId2, role: 'viewer' }]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('캘린더 공유 초대 - 잘못된 입력', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/share`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          users: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('초대 응답 처리', () => {
    beforeEach(async () => {
      // 초대 상태로 설정
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId1,
            role: 'viewer',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false,
              deleteEvents: false,
              manageCalendar: false,
              inviteOthers: false
            },
            status: 'pending',
            invitedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });
    });

    test('초대 수락 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/invite/respond`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({ response: 'accept' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');

      // 데이터베이스 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      const share = updatedCalendar.sharing.sharedWith.find(s => s.userId.toString() === userId1.toString());
      expect(share.status).toBe('accepted');
      expect(share.acceptedAt).toBeDefined();
    });

    test('초대 거절 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/invite/respond`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({ response: 'decline' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('declined');
    });

    test('초대 응답 - 잘못된 응답', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/invite/respond`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({ response: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('공유 권한 수정', () => {
    beforeEach(async () => {
      // 수락된 공유 상태로 설정
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId1,
            role: 'viewer',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false,
              deleteEvents: false,
              manageCalendar: false,
              inviteOthers: false
            },
            status: 'accepted',
            acceptedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });
    });

    test('공유 권한 수정 - 성공', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/share/${userId1}/permissions`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          permissions: {
            createEvents: true,
            editEvents: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions.createEvents).toBe(true);
      expect(response.body.data.permissions.editEvents).toBe(true);
    });

    test('공유 권한 수정 - 권한 없음', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/share/${userId1}/permissions`)
        .set('Authorization', `Bearer ${userId2}`)
        .send({
          permissions: { createEvents: true }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('공유 해제', () => {
    beforeEach(async () => {
      // 수락된 공유 상태로 설정
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId1,
            role: 'viewer',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false,
              deleteEvents: false,
              manageCalendar: false,
              inviteOthers: false
            },
            status: 'accepted',
            acceptedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });
    });

    test('공유 해제 - 성공', async () => {
      const response = await request(app)
        .delete(`/api/calendar/${testCalendar._id}/share/${userId1}`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 데이터베이스 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      expect(updatedCalendar.sharing.sharedWith).toHaveLength(0);
      expect(updatedCalendar.sharing.isShared).toBe(false);
    });

    test('공유 해제 - 권한 없음', async () => {
      const response = await request(app)
        .delete(`/api/calendar/${testCalendar._id}/share/${userId1}`)
        .set('Authorization', `Bearer ${userId2}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('공개 링크 기능', () => {
    test('공개 링크 생성 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/public-link`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          permissions: {
            viewEvents: true,
            createEvents: false,
            editEvents: false
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.url).toBeDefined();

      // 데이터베이스 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      expect(updatedCalendar.sharing.publicLink.enabled).toBe(true);
      expect(updatedCalendar.sharing.publicLink.token).toBeDefined();
    });

    test('공개 링크 접근 - 성공', async () => {
      // 공개 링크 생성
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.publicLink': {
            enabled: true,
            token: 'test-token-123',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false
            },
            accessCount: 0,
            lastAccessed: null
          }
        }
      });

      const response = await request(app)
        .get('/api/calendar/public/test-token-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.calendar.id).toBe(testCalendar._id.toString());
      expect(response.body.data.permissions.viewEvents).toBe(true);
    });

    test('공개 링크 접근 - 잘못된 토큰', async () => {
      const response = await request(app)
        .get('/api/calendar/public/invalid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('공유 상태 조회', () => {
    beforeEach(async () => {
      // 복잡한 공유 상태로 설정
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.isPublic': true,
          'sharing.sharedWith': [
            {
              userId: userId1,
              role: 'viewer',
              permissions: {
                viewEvents: true,
                createEvents: false,
                editEvents: false,
                deleteEvents: false,
                manageCalendar: false,
                inviteOthers: false
              },
              status: 'accepted',
              acceptedAt: new Date(),
              invitedBy: ownerId
            },
            {
              userId: userId2,
              role: 'editor',
              permissions: {
                viewEvents: true,
                createEvents: true,
                editEvents: true,
                deleteEvents: false,
                manageCalendar: false,
                inviteOthers: false
              },
              status: 'pending',
              invitedAt: new Date(),
              invitedBy: ownerId
            }
          ],
          'sharing.publicLink': {
            enabled: true,
            token: 'test-token-456',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false
            },
            accessCount: 5,
            lastAccessed: new Date()
          }
        }
      });
    });

    test('공유 상태 조회 - 소유자', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/sharing-status`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isShared).toBe(true);
      expect(response.body.data.isPublic).toBe(true);
      expect(response.body.data.sharedWith).toHaveLength(2);
      expect(response.body.data.publicLink.enabled).toBe(true);
      expect(response.body.data.userPermissions.isOwner).toBe(true);
    });

    test('공유 상태 조회 - 공유된 사용자', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/sharing-status`)
        .set('Authorization', `Bearer ${userId1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userPermissions.isOwner).toBe(false);
      expect(response.body.data.userPermissions.role).toBe('viewer');
      expect(response.body.data.userPermissions.permissions.viewEvents).toBe(true);
    });

    test('공유 상태 조회 - 권한 없는 사용자', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/sharing-status`)
        .set('Authorization', `Bearer ${userId3}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userPermissions.isOwner).toBe(false);
      expect(response.body.data.userPermissions.role).toBe('none');
      expect(response.body.data.userPermissions.permissions.viewEvents).toBe(false);
    });
  });

  describe('공유된 캘린더 목록 조회', () => {
    beforeEach(async () => {
      // 여러 캘린더 생성 및 공유 설정
      const calendar1 = new Calendar({
        name: '공유 캘린더 1',
        ownerId: userId1,
        color: '#ff0000'
      });
      await calendar1.save();

      const calendar2 = new Calendar({
        name: '공유 캘린더 2',
        ownerId: userId2,
        color: '#00ff00'
      });
      await calendar2.save();

      // userId3에게 공유
      await Calendar.findByIdAndUpdate(calendar1._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId3,
            role: 'viewer',
            permissions: { viewEvents: true },
            status: 'accepted',
            acceptedAt: new Date()
          }]
        }
      });

      await Calendar.findByIdAndUpdate(calendar2._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId3,
            role: 'editor',
            permissions: { viewEvents: true, createEvents: true },
            status: 'accepted',
            acceptedAt: new Date()
          }]
        }
      });
    });

    test('공유된 캘린더 목록 조회 - 성공', async () => {
      const response = await request(app)
        .get('/api/calendar/shared')
        .set('Authorization', `Bearer ${userId3}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const calendar1 = response.body.data.find(c => c.name === '공유 캘린더 1');
      const calendar2 = response.body.data.find(c => c.name === '공유 캘린더 2');
      
      expect(calendar1.permissions.role).toBe('viewer');
      expect(calendar2.permissions.role).toBe('editor');
      expect(calendar2.permissions.permissions.createEvents).toBe(true);
    });
  });

  describe('권한별 접근 제어', () => {
    beforeEach(async () => {
      // 수락된 공유 상태로 설정
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId1,
            role: 'viewer',
            permissions: {
              viewEvents: true,
              createEvents: false,
              editEvents: false,
              deleteEvents: false,
              manageCalendar: false,
              inviteOthers: false
            },
            status: 'accepted',
            acceptedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });
    });

    test('이벤트 조회 - 권한 있음', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events`)
        .set('Authorization', `Bearer ${userId1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('이벤트 생성 - 권한 없음', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          title: '새 이벤트',
          startTime: new Date('2024-01-16T10:00:00Z'),
          endTime: new Date('2024-01-16T11:00:00Z')
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('이벤트 수정 - 권한 없음', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          title: '수정된 이벤트'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('캘린더 관리 - 권한 없음', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          name: '수정된 캘린더'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('감사 로그', () => {
    test('공유 시 감사 로그 생성', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/share`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          users: [{ userId: userId1, role: 'viewer' }]
        });

      expect(response.status).toBe(200);

      // 감사 로그 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      expect(updatedCalendar.auditLog).toHaveLength(1);
      expect(updatedCalendar.auditLog[0].action).toBe('shared');
      expect(updatedCalendar.auditLog[0].userId.toString()).toBe(ownerId.toString());
      expect(updatedCalendar.auditLog[0].details.sharedUsers).toBeDefined();
    });

    test('권한 변경 시 감사 로그 생성', async () => {
      // 먼저 공유
      await Calendar.findByIdAndUpdate(testCalendar._id, {
        $set: {
          'sharing.isShared': true,
          'sharing.sharedWith': [{
            userId: userId1,
            role: 'viewer',
            permissions: { viewEvents: true },
            status: 'accepted',
            acceptedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });

      // 권한 변경
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/share/${userId1}/permissions`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          permissions: { createEvents: true }
        });

      expect(response.status).toBe(200);

      // 감사 로그 확인
      const updatedCalendar = await Calendar.findById(testCalendar._id);
      const permissionChangeLog = updatedCalendar.auditLog.find(log => log.action === 'permission_changed');
      expect(permissionChangeLog).toBeDefined();
      expect(permissionChangeLog.details.targetUserId).toBe(userId1.toString());
      expect(permissionChangeLog.details.oldPermissions).toBeDefined();
      expect(permissionChangeLog.details.newPermissions).toBeDefined();
    });
  });
}); 