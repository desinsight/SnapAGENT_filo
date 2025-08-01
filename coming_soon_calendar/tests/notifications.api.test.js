const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Notification = require('../src/models/Notification');

describe('알림 API 테스트', () => {
  let testNotificationId;
  let testUserId = '507f1f77bcf86cd799439011'; // 테스트용 사용자 ID

  beforeAll(async () => {
    // 테스트 데이터베이스 연결
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/calendar_test');
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 알림 데이터 정리
    await Notification.deleteMany({});
  });

  describe('POST /api/notifications', () => {
    it('새로운 알림을 성공적으로 생성해야 함', async () => {
      const notificationData = {
        title: '테스트 알림',
        message: '이것은 테스트 알림입니다.',
        type: 'custom',
        category: 'system',
        priority: 'normal',
        channels: {
          email: { enabled: true },
          push: { enabled: true },
          sms: { enabled: false },
          inApp: { enabled: true }
        },
        recipients: {
          type: 'specific_users',
          userIds: [testUserId]
        },
        scheduling: { sendImmediately: true },
        urgentNotice: { enabled: false },
        interactions: {}
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer test-token`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('알림이 성공적으로 생성되었습니다.');
      expect(response.body.data.title).toBe('테스트 알림');
      expect(response.body.data.type).toBe('custom');
      expect(response.body.data.status).toBe('sending');

      testNotificationId = response.body.data._id;
    });

    it('필수 필드가 누락된 경우 400 오류를 반환해야 함', async () => {
      const invalidData = {
        message: '메시지만 있는 경우'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer test-token`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('필수 필드가 누락되었습니다.');
    });

    it('긴급 공지 알림을 성공적으로 생성해야 함', async () => {
      const urgentNotificationData = {
        title: '🚨 긴급 공지',
        message: '시스템 점검이 예정되어 있습니다.',
        type: 'urgent_notice',
        category: 'announcement',
        priority: 'urgent',
        channels: {
          email: { enabled: true, template: 'urgent' },
          push: { enabled: true, sound: 'urgent' },
          sms: { enabled: true },
          inApp: { enabled: true }
        },
        recipients: {
          type: 'all_users'
        },
        scheduling: { sendImmediately: true },
        urgentNotice: {
          enabled: true,
          displayType: 'banner',
          backgroundColor: '#ff4444',
          requireAcknowledgment: true
        },
        interactions: {
          allowReply: false,
          allowForward: true,
          requireConfirmation: true
        }
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer test-token`)
        .send(urgentNotificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe('urgent');
      expect(response.body.data.urgentNotice.enabled).toBe(true);
    });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // 테스트용 알림 데이터 생성
      const notifications = [
        {
          title: '일반 알림 1',
          message: '첫 번째 일반 알림',
          type: 'custom',
          category: 'system',
          priority: 'normal',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { sendImmediately: true },
          createdBy: testUserId
        },
        {
          title: '긴급 알림',
          message: '긴급한 알림',
          type: 'urgent_notice',
          category: 'announcement',
          priority: 'urgent',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { sendImmediately: true },
          urgentNotice: { enabled: true },
          createdBy: testUserId
        },
        {
          title: '예약 알림',
          message: '나중에 발송될 알림',
          type: 'custom',
          category: 'system',
          priority: 'normal',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { 
            sendImmediately: false, 
            scheduledAt: new Date(Date.now() + 86400000) // 24시간 후
          },
          createdBy: testUserId
        }
      ];

      await Notification.insertMany(notifications);
    });

    it('모든 알림 목록을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('필터링된 알림 목록을 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications?priority=urgent&type=urgent_notice')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(1);
      expect(response.body.data.modules[0].priority).toBe('urgent');
    });

    it('검색 기능으로 알림을 찾을 수 있어야 함', async () => {
      const response = await request(app)
        .get('/api/notifications?search=긴급')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules).toHaveLength(1);
      expect(response.body.data.modules[0].title).toContain('긴급');
    });
  });

  describe('GET /api/notifications/:id', () => {
    beforeEach(async () => {
      const notification = new Notification({
        title: '상세 조회 테스트',
        message: '상세 조회를 위한 테스트 알림',
        type: 'custom',
        category: 'system',
        channels: { email: { enabled: true } },
        recipients: { type: 'specific_users', userIds: [testUserId] },
        scheduling: { sendImmediately: true },
        createdBy: testUserId
      });
      await notification.save();
      testNotificationId = notification._id;
    });

    it('특정 알림을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('상세 조회 테스트');
      expect(response.body.data._id).toBe(testNotificationId.toString());
    });

    it('존재하지 않는 알림 ID로 조회 시 404 오류를 반환해야 함', async () => {
      const fakeId = '507f1f77bcf86cd799439012';
      const response = await request(app)
        .get(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('알림을 찾을 수 없습니다.');
    });
  });

  describe('PUT /api/notifications/:id', () => {
    beforeEach(async () => {
      const notification = new Notification({
        title: '수정 테스트',
        message: '수정을 위한 테스트 알림',
        type: 'custom',
        category: 'system',
        channels: { email: { enabled: true } },
        recipients: { type: 'specific_users', userIds: [testUserId] },
        scheduling: { sendImmediately: false, scheduledAt: new Date(Date.now() + 86400000) },
        createdBy: testUserId
      });
      await notification.save();
      testNotificationId = notification._id;
    });

    it('알림을 성공적으로 수정해야 함', async () => {
      const updateData = {
        title: '수정된 알림',
        message: '수정된 메시지',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer test-token`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('수정된 알림');
      expect(response.body.data.priority).toBe('high');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    beforeEach(async () => {
      const notification = new Notification({
        title: '삭제 테스트',
        message: '삭제를 위한 테스트 알림',
        type: 'custom',
        category: 'system',
        channels: { email: { enabled: true } },
        recipients: { type: 'specific_users', userIds: [testUserId] },
        scheduling: { sendImmediately: false, scheduledAt: new Date(Date.now() + 86400000) },
        createdBy: testUserId
      });
      await notification.save();
      testNotificationId = notification._id;
    });

    it('알림을 성공적으로 삭제해야 함', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('알림이 성공적으로 삭제되었습니다.');

      // 삭제 확인
      const deletedNotification = await Notification.findById(testNotificationId);
      expect(deletedNotification).toBeNull();
    });
  });

  describe('POST /api/notifications/:id/send', () => {
    beforeEach(async () => {
      const notification = new Notification({
        title: '발송 테스트',
        message: '발송을 위한 테스트 알림',
        type: 'custom',
        category: 'system',
        channels: { email: { enabled: true } },
        recipients: { type: 'specific_users', userIds: [testUserId] },
        scheduling: { sendImmediately: false, scheduledAt: new Date(Date.now() + 86400000) },
        status: 'scheduled',
        createdBy: testUserId
      });
      await notification.save();
      testNotificationId = notification._id;
    });

    it('예약된 알림을 즉시 발송해야 함', async () => {
      const response = await request(app)
        .post(`/api/notifications/${testNotificationId}/send`)
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('알림이 성공적으로 발송되었습니다.');

      // 발송 상태 확인
      const sentNotification = await Notification.findById(testNotificationId);
      expect(sentNotification.status).toBe('sent');
    });
  });

  describe('GET /api/notifications/urgent', () => {
    beforeEach(async () => {
      const urgentNotifications = [
        {
          title: '긴급 공지 1',
          message: '첫 번째 긴급 공지',
          type: 'urgent_notice',
          category: 'announcement',
          priority: 'urgent',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { sendImmediately: true },
          urgentNotice: { enabled: true },
          status: 'sent',
          createdBy: testUserId
        },
        {
          title: '긴급 공지 2',
          message: '두 번째 긴급 공지',
          type: 'urgent_notice',
          category: 'announcement',
          priority: 'critical',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { sendImmediately: true },
          urgentNotice: { enabled: true },
          status: 'sent',
          createdBy: testUserId
        }
      ];

      await Notification.insertMany(urgentNotifications);
    });

    it('긴급 공지 목록을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications/urgent')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(n => n.priority === 'urgent' || n.priority === 'critical')).toBe(true);
    });
  });

  describe('GET /api/notifications/scheduled', () => {
    beforeEach(async () => {
      const scheduledNotifications = [
        {
          title: '예약 알림 1',
          message: '첫 번째 예약 알림',
          type: 'custom',
          category: 'system',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { 
            sendImmediately: false, 
            scheduledAt: new Date(Date.now() + 3600000) // 1시간 후
          },
          status: 'scheduled',
          createdBy: testUserId
        },
        {
          title: '예약 알림 2',
          message: '두 번째 예약 알림',
          type: 'custom',
          category: 'system',
          channels: { email: { enabled: true } },
          recipients: { type: 'specific_users', userIds: [testUserId] },
          scheduling: { 
            sendImmediately: false, 
            scheduledAt: new Date(Date.now() + 7200000) // 2시간 후
          },
          status: 'scheduled',
          createdBy: testUserId
        }
      ];

      await Notification.insertMany(scheduledNotifications);
    });

    it('예약된 알림 목록을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications/scheduled')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(n => n.status === 'scheduled')).toBe(true);
    });
  });

  describe('GET /api/notifications/templates', () => {
    it('알림 템플릿 목록을 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications/templates')
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
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('channels');
    });
  });

  describe('POST /api/notifications/test', () => {
    it('테스트 알림을 성공적으로 발송해야 함', async () => {
      const testData = {
        channels: {
          email: { enabled: true },
          push: { enabled: true },
          sms: { enabled: false },
          inApp: { enabled: true }
        },
        testRecipients: [testUserId]
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer test-token`)
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('테스트 알림이 성공적으로 발송되었습니다.');
    });

    it('테스트 수신자가 없으면 400 오류를 반환해야 함', async () => {
      const testData = {
        channels: {
          email: { enabled: true }
        }
      };

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer test-token`)
        .send(testData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('테스트 수신자가 필요합니다.');
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('알림 통계를 성공적으로 조회해야 함', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('sent');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data).toHaveProperty('byChannel');
      expect(response.body.data).toHaveProperty('urgentNotices');
      expect(response.body.data).toHaveProperty('scheduledNotifications');
    });
  });
}); 