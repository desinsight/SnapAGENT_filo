// calendar.api.test.js
// 캘린더/이벤트 API 기본 테스트 (Jest + Supertest)

const request = require('supertest');
const express = require('express');
const app = require('../src/index'); // 실제 서버 인스턴스가 export되어야 함
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Calendar = require('../src/models/Calendar');

const TEST_TOKEN = 'test-user';

// TODO: 실제 서버 인스턴스 export 필요 (index.js 수정 필요)

describe('Calendar API', () => {
  it('캘린더 생성/조회/삭제', async () => {
    // 캘린더 생성
    const resCreate = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '테스트 캘린더', color: '#ff0000' });
    expect(resCreate.statusCode).toBe(201);
    expect(resCreate.body.data.calendar).toHaveProperty('id');
    const calendarId = resCreate.body.data.calendar.id;

    // 캘린더 목록 조회
    const resList = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resList.statusCode).toBe(200);
    expect(Array.isArray(resList.body.data.calendars)).toBe(true);

    // 캘린더 삭제
    const resDelete = await request(app)
      .delete(`/api/calendar/${calendarId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resDelete.statusCode).toBe(200);
    expect(resDelete.body.success).toBe(true);
  });

  it('이벤트 생성/조회/삭제', async () => {
    // 캘린더 먼저 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '이벤트용 캘린더' });
    const calendarId = resCal.body.data.calendar.id;

    // 이벤트 생성
    const resEvent = await request(app)
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ calendarId, title: '테스트 이벤트', start: new Date(), end: new Date() });
    expect(resEvent.statusCode).toBe(201);
    expect(resEvent.body.data.event).toHaveProperty('id');
    const eventId = resEvent.body.data.event.id;

    // 이벤트 목록 조회
    const resList = await request(app)
      .get('/api/calendar/events?calendarId=' + calendarId)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resList.statusCode).toBe(200);
    expect(Array.isArray(resList.body.data.events)).toBe(true);

    // 이벤트 삭제
    const resDelete = await request(app)
      .delete(`/api/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resDelete.statusCode).toBe(200);
    expect(resDelete.body.success).toBe(true);
  });
});

describe('Notification API', () => {
  let calendarId, eventId, notificationId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/calendar_service');
    }
    // 테스트용 캘린더/이벤트 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '알림 캘린더' });
    calendarId = resCal.body.data.calendar.id;
    const resEvent = await request(app)
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ calendarId, title: '알림 테스트', start: new Date(), end: new Date() });
    eventId = resEvent.body.data.event.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('알림 추가/조회/수정/삭제', async () => {
    // 알림 추가
    const resAdd = await request(app)
      .post(`/api/calendar/events/${eventId}/notifications`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ minutesBefore: 30, type: 'email' });
    expect(resAdd.statusCode).toBe(201);
    expect(resAdd.body.data.notification).toHaveProperty('id');
    notificationId = resAdd.body.data.notification.id;

    // 알림 목록 조회
    const resList = await request(app)
      .get(`/api/calendar/events/${eventId}/notifications`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resList.statusCode).toBe(200);
    expect(Array.isArray(resList.body.data.notifications)).toBe(true);
    expect(resList.body.data.notifications.length).toBeGreaterThan(0);

    // 알림 수정
    const resUpdate = await request(app)
      .put(`/api/calendar/events/${eventId}/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ minutesBefore: 60, type: 'push' });
    expect(resUpdate.statusCode).toBe(200);
    expect(resUpdate.body.data.notification.minutesBefore).toBe(60);
    expect(resUpdate.body.data.notification.type).toBe('push');

    // 알림 삭제
    const resDelete = await request(app)
      .delete(`/api/calendar/events/${eventId}/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resDelete.statusCode).toBe(200);
    expect(resDelete.body.success).toBe(true);
  });
});

describe('Attendee API', () => {
  let calendarId, eventId, userId = 'user-attendee-1';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/calendar_service');
    }
    // 테스트용 캘린더/이벤트 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '참석자 캘린더' });
    calendarId = resCal.body.data.calendar.id;
    const resEvent = await request(app)
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ calendarId, title: '참석자 테스트', start: new Date(), end: new Date() });
    eventId = resEvent.body.data.event.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('참석자 초대/상태변경/조회', async () => {
    // 참석자 초대
    const resAdd = await request(app)
      .post(`/api/calendar/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ userId });
    expect(resAdd.statusCode).toBe(201);
    expect(resAdd.body.data.event.attendees).toContain(userId);
    expect(resAdd.body.data.event.attendeeStatus[userId]).toBe('pending');

    // 참석자 상태 변경(수락)
    const resAccept = await request(app)
      .put(`/api/calendar/events/${eventId}/attendees/${userId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ status: 'accepted' });
    expect(resAccept.statusCode).toBe(200);
    expect(resAccept.body.data.event.attendeeStatus[userId]).toBe('accepted');

    // 특정 참석자 상태 조회
    const resStatus = await request(app)
      .get(`/api/calendar/events/${eventId}/attendees/${userId}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resStatus.statusCode).toBe(200);
    expect(resStatus.body.data.status).toBe('accepted');

    // 전체 참석자 상태 목록 조회
    const resAll = await request(app)
      .get(`/api/calendar/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resAll.statusCode).toBe(200);
    expect(resAll.body.data.attendeeStatus[userId]).toBe('accepted');
  });
});

describe('Tag/Category & Search API', () => {
  let calendarId, eventId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/calendar_service');
    }
    // 테스트용 캘린더/이벤트 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '태그/카테고리 캘린더' });
    calendarId = resCal.body.data.calendar.id;
    const resEvent = await request(app)
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ calendarId, title: '검색 테스트', start: new Date(), end: new Date() });
    eventId = resEvent.body.data.event.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('태그 추가/제거/전체조회', async () => {
    // 태그 추가
    const resAdd = await request(app)
      .post(`/api/calendar/events/${eventId}/tags`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ tag: 'work' });
    expect(resAdd.statusCode).toBe(201);
    expect(resAdd.body.success).toBe(true);
    expect(resAdd.body.data.event.tags).toContain('work');

    // 태그 전체 조회
    const resTags = await request(app)
      .get('/api/calendar/tags')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resTags.statusCode).toBe(200);
    expect(resTags.body.success).toBe(true);
    expect(Array.isArray(resTags.body.data.tags)).toBe(true);
    if (resTags.body.data.tags.length > 0) {
      expect(resTags.body.data.tags).toContain('work');
    }

    // 태그 제거
    const resRemove = await request(app)
      .delete(`/api/calendar/events/${eventId}/tags/work`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resRemove.statusCode).toBe(200);
    expect(resRemove.body.success).toBe(true);
    expect(Array.isArray(resRemove.body.data.event.tags)).toBe(true);
    expect(resRemove.body.data.event.tags).not.toContain('work');
  });

  it('카테고리 지정/제거/전체조회', async () => {
    // 카테고리 지정
    const resAdd = await request(app)
      .post(`/api/calendar/events/${eventId}/category`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ category: 'meeting' });
    expect(resAdd.statusCode).toBe(201);
    expect(resAdd.body.success).toBe(true);
    expect(resAdd.body.data.event.category).toBe('meeting');

    // 카테고리 전체 조회
    const resCats = await request(app)
      .get('/api/calendar/categories')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resCats.statusCode).toBe(200);
    expect(resCats.body.success).toBe(true);
    expect(Array.isArray(resCats.body.data.categories)).toBe(true);
    if (resCats.body.data.categories.length > 0) {
      expect(resCats.body.data.categories).toContain('meeting');
    }

    // 카테고리 제거
    const resRemove = await request(app)
      .delete(`/api/calendar/events/${eventId}/category`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resRemove.statusCode).toBe(200);
    expect(resRemove.body.success).toBe(true);
    expect(resRemove.body.data.event.category).toBeUndefined();
  });

  it('고급 검색/필터/정렬', async () => {
    // 태그/카테고리 지정
    await request(app)
      .post(`/api/calendar/events/${eventId}/tags`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ tag: 'urgent' });
    await request(app)
      .post(`/api/calendar/events/${eventId}/category`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ category: 'meeting' });

    // 키워드 검색
    const resKeyword = await request(app)
      .get('/api/calendar/events/search?keyword=' + encodeURIComponent('검색'))
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resKeyword.statusCode).toBe(200);
    expect(resKeyword.body.success).toBe(true);
    expect(resKeyword.body.data.events.length).toBeGreaterThan(0);

    // 태그 검색
    const resTag = await request(app)
      .get('/api/calendar/events/search?tags=urgent')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resTag.statusCode).toBe(200);
    expect(resTag.body.success).toBe(true);
    expect(resTag.body.data.events.length).toBeGreaterThan(0);

    // 카테고리 검색(정렬 포함)
    const resCat = await request(app)
      .get('/api/calendar/events/search?sortBy=start&sortOrder=desc')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(resCat.statusCode).toBe(200);
    expect(resCat.body.success).toBe(true);
  });
});

describe('Calendar Share/Permission API', () => {
  let calendarId;
  const ownerId = 'test-user';
  const otherUserId = 'user-share-1';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/calendar_service');
    }
    // 캘린더 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ name: '공유 캘린더' });
    calendarId = resCal.body.data.calendar.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('캘린더 공유(권한 부여)', async () => {
    const res = await request(app)
      .post(`/api/calendar/${calendarId}/share`)
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ userId: otherUserId, role: 'writer' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.calendar.sharedWith.some(s => s.userId === otherUserId && s.role === 'writer')).toBe(true);
  });

  it('공유 사용자 권한(role) 변경', async () => {
    const res = await request(app)
      .patch(`/api/calendar/${calendarId}/share`)
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ userId: otherUserId, role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.calendar.sharedWith.some(s => s.userId === otherUserId && s.role === 'admin')).toBe(true);
  });

  it('특정 사용자의 권한 확인', async () => {
    const res = await request(app)
      .get(`/api/calendar/${calendarId}/role?userId=${otherUserId}`)
      .set('Authorization', `Bearer ${ownerId}`);
    expect(res.statusCode).toBe(200);
    expect(['admin', 'writer', 'reader', 'owner']).toContain(res.body.data.role);
  });

  it('캘린더 공유 해제(권한 회수)', async () => {
    const res = await request(app)
      .delete(`/api/calendar/${calendarId}/share`)
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ userId: otherUserId });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.calendar.sharedWith.some(s => s.userId === otherUserId)).toBe(false);
  });

  it('존재하지 않는 캘린더/사용자에 대한 에러 처리', async () => {
    const res1 = await request(app)
      .post(`/api/calendar/invalid-id/share`)
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ userId: 'nouser' });
    expect(res1.statusCode).toBe(404);
    const res2 = await request(app)
      .patch(`/api/calendar/${calendarId}/share`)
      .set('Authorization', `Bearer ${ownerId}`)
      .send({ userId: 'nouser', role: 'admin' });
    expect(res2.statusCode).toBe(404);
    const res3 = await request(app)
      .get(`/api/calendar/${calendarId}/role?userId=nouser`)
      .set('Authorization', `Bearer ${ownerId}`);
    expect(res3.statusCode).toBe(404);
  });
});

describe('Event Attachment API', () => {
  let calendarId, eventId;
  const testFilePath = path.join(__dirname, 'testfile.txt');
  const testFileContent = '첨부파일 테스트';
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/calendar_service');
    }
    // 테스트용 파일 생성
    fs.writeFileSync(testFilePath, testFileContent);
    // 캘린더/이벤트 생성
    const resCal = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ name: '첨부파일 캘린더' });
    calendarId = resCal.body.data.calendar.id;
    const resEvent = await request(app)
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ calendarId, title: '첨부파일 이벤트', start: new Date(), end: new Date() });
    eventId = resEvent.body.data.event.id;
  });
  afterAll(async () => {
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    await mongoose.disconnect();
  });
  let uploadedFilename;
  it('첨부파일 업로드', async () => {
    const res = await request(app)
      .post(`/api/calendar/events/${eventId}/attachments`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .attach('file', testFilePath);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.attachment).toHaveProperty('filename');
    uploadedFilename = res.body.data.attachment.filename;
  });
  it('첨부파일 목록 조회', async () => {
    const res = await request(app)
      .get(`/api/calendar/events/${eventId}/attachments`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.attachments)).toBe(true);
    expect(res.body.data.attachments.some(f => f.filename === uploadedFilename)).toBe(true);
  });
  it('첨부파일 다운로드', async () => {
    const res = await request(app)
      .get(`/api/calendar/events/${eventId}/attachments/${uploadedFilename}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(res.header['content-disposition']).toContain(uploadedFilename);
    expect(res.text).toBe(testFileContent);
  });
  it('첨부파일 삭제', async () => {
    const res = await request(app)
      .delete(`/api/calendar/events/${eventId}/attachments/${uploadedFilename}`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.event.attachments)).toBe(true);
    expect(res.body.data.event.attachments.some(f => f.filename === uploadedFilename)).toBe(false);
  });
  it('존재하지 않는 파일/이벤트에 대한 에러 처리', async () => {
    const res1 = await request(app)
      .get(`/api/calendar/events/${eventId}/attachments/no-such-file.txt`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res1.statusCode).toBe(404);
    const res2 = await request(app)
      .delete(`/api/calendar/events/${eventId}/attachments/no-such-file.txt`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`);
    expect(res2.statusCode).toBe(404);
    const res3 = await request(app)
      .post(`/api/calendar/events/no-such-event/attachments`)
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .attach('file', testFilePath);
    expect(res3.statusCode).toBe(404);
  });
});

describe('고급 반복 및 충돌 감지 테스트', () => {
  let testCalendarId;
  let testEventId;

  beforeAll(async () => {
    // 테스트 캘린더 생성
    const calendarResponse = await request(app)
      .post('/api/calendars')
      .send({
        name: '고급 반복 테스트 캘린더',
        description: '고급 반복 기능 테스트용'
      });
    testCalendarId = calendarResponse.body.data.calendar.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testCalendarId) {
      await Calendar.findByIdAndDelete(testCalendarId);
    }
  });

  describe('공휴일 제외 반복 일정', () => {
    it('공휴일을 제외한 주간 반복 일정을 생성할 수 있어야 한다', async () => {
      const eventData = {
        calendarId: testCalendarId,
        title: '주간 회의 (공휴일 제외)',
        description: '매주 월요일 회의, 공휴일 제외',
        start: '2024-01-01T09:00:00Z',
        end: '2024-01-01T10:00:00Z',
        recurrence: {
          freq: 'WEEKLY',
          interval: 1,
          byweekday: ['MO']
        },
        excludeHolidays: true
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.data.event.recurrence).toBeDefined();
      expect(response.body.data.event.excludeHolidays).toBe(true);
    });

    it('특정 날짜를 제외한 반복 일정을 생성할 수 있어야 한다', async () => {
      const eventData = {
        calendarId: testCalendarId,
        title: '월간 회의 (특정일 제외)',
        description: '매월 1일 회의, 특정일 제외',
        start: '2024-01-01T14:00:00Z',
        end: '2024-01-01T15:00:00Z',
        recurrence: {
          freq: 'MONTHLY',
          interval: 1,
          bymonthday: [1]
        },
        excludeDates: ['2024-02-01', '2024-03-01']
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.data.event.excludeDates).toEqual(['2024-02-01', '2024-03-01']);
    });
  });

  describe('일정 충돌 감지', () => {
    beforeEach(async () => {
      // 기존 테스트 일정 생성
      const eventData = {
        calendarId: testCalendarId,
        title: '기존 일정',
        description: '충돌 테스트용 기존 일정',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);
      
      testEventId = response.body.data.event.id;
    });

    it('충돌하는 일정 생성 시 충돌 정보와 해결 제안을 반환해야 한다', async () => {
      const conflictingEventData = {
        calendarId: testCalendarId,
        title: '충돌 일정',
        description: '기존 일정과 시간이 겹치는 일정',
        start: '2024-01-15T10:30:00Z',
        end: '2024-01-15T11:30:00Z'
      };

      const response = await request(app)
        .post('/api/events')
        .send(conflictingEventData);

      expect(response.status).toBe(409);
      expect(response.body.data.conflicts).toBeDefined();
      expect(response.body.data.conflicts.length).toBeGreaterThan(0);
      expect(response.body.data.suggestions).toBeDefined();
      expect(response.body.data.suggestions.length).toBeGreaterThan(0);
    });

    it('충돌 해결 제안을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/conflicts/suggestions')
        .query({
          calendarId: testCalendarId,
          start: '2024-01-15T10:30:00Z',
          end: '2024-01-15T11:30:00Z',
          excludeHolidays: 'true'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.conflicts).toBeDefined();
      expect(response.body.data.suggestions).toBeDefined();
    });

    it('공휴일 제외 옵션과 함께 충돌 제안을 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/conflicts/suggestions')
        .query({
          calendarId: testCalendarId,
          start: '2024-01-01T09:00:00Z',
          end: '2024-01-01T10:00:00Z',
          excludeHolidays: 'true',
          excludeDates: '2024-01-01'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions).toBeDefined();
    });
  });

  describe('반복 일정 충돌 감지', () => {
    it('반복 일정과 충돌하는 일정 생성 시 반복 발생일별 충돌을 감지해야 한다', async () => {
      // 반복 일정 생성
      const recurringEventData = {
        calendarId: testCalendarId,
        title: '매주 월요일 회의',
        description: '매주 월요일 반복 회의',
        start: '2024-01-01T09:00:00Z',
        end: '2024-01-01T10:00:00Z',
        recurrence: {
          freq: 'WEEKLY',
          interval: 1,
          byweekday: ['MO']
        }
      };

      await request(app)
        .post('/api/events')
        .send(recurringEventData);

      // 반복 일정과 충돌하는 일정 생성
      const conflictingEventData = {
        calendarId: testCalendarId,
        title: '충돌 일정',
        description: '반복 일정과 충돌',
        start: '2024-01-08T09:30:00Z', // 두 번째 월요일
        end: '2024-01-08T10:30:00Z'
      };

      const response = await request(app)
        .post('/api/events')
        .send(conflictingEventData);

      expect(response.status).toBe(409);
      expect(response.body.data.conflicts).toBeDefined();
      expect(response.body.data.conflicts.length).toBeGreaterThan(0);
    });
  });
});

describe('위치 정보 및 지도 연동 테스트', () => {
  describe('주소 좌표 변환', () => {
    it('주소를 좌표로 변환할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/geocode')
        .send({
          address: '서울특별시 강남구 테헤란로 152',
          provider: 'google'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.coordinates).toBeDefined();
      expect(response.body.data.coordinates.latitude).toBeDefined();
      expect(response.body.data.coordinates.longitude).toBeDefined();
    });

    it('주소가 없으면 오류를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/geocode')
        .send({
          provider: 'google'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('좌표 주소 변환', () => {
    it('좌표를 주소로 변환할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/reverse-geocode')
        .send({
          latitude: 37.5665,
          longitude: 126.9780,
          provider: 'google'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.address).toBeDefined();
    });

    it('유효하지 않은 좌표면 오류를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/reverse-geocode')
        .send({
          latitude: 'invalid',
          longitude: 126.9780
        });

      expect(response.status).toBe(400);
    });
  });

  describe('장소 검색', () => {
    it('장소를 검색할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/places/search')
        .query({
          query: '강남역',
          latitude: 37.5665,
          longitude: 126.9780,
          radius: 5000
        });

      expect(response.status).toBe(200);
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });

    it('검색어가 없으면 오류를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/places/search')
        .query({
          latitude: 37.5665,
          longitude: 126.9780
        });

      expect(response.status).toBe(400);
    });
  });

  describe('장소 상세 정보', () => {
    it('장소 상세 정보를 조회할 수 있어야 한다', async () => {
      // 먼저 장소 검색으로 placeId를 얻음
      const searchResponse = await request(app)
        .get('/api/places/search')
        .query({
          query: '강남역'
        });

      if (searchResponse.body.data.results.length > 0) {
        const placeId = searchResponse.body.data.results[0].placeId;
        
        const response = await request(app)
          .get(`/api/places/${placeId}`);

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBeDefined();
      }
    });
  });

  describe('경로 안내', () => {
    it('경로 안내를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/directions')
        .send({
          origin: {
            latitude: 37.5665,
            longitude: 126.9780
          },
          destination: {
            latitude: 37.4968,
            longitude: 127.0276
          },
          mode: 'driving'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.duration).toBeDefined();
      expect(response.body.data.distance).toBeDefined();
    });

    it('출발지와 목적지가 없으면 오류를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/directions')
        .send({
          mode: 'driving'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('주변 교통 정보', () => {
    it('주변 교통 정보를 조회할 수 있어야 한다', async () => {
      const response = await request(app)
        .get('/api/transportation/nearby')
        .query({
          latitude: 37.5665,
          longitude: 126.9780,
          radius: 1000
        });

      expect(response.status).toBe(200);
      expect(response.body.data.subway).toBeDefined();
      expect(response.body.data.bus).toBeDefined();
    });

    it('좌표가 없으면 오류를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/transportation/nearby')
        .query({
          radius: 1000
        });

      expect(response.status).toBe(400);
    });
  });

  describe('위치 정보 검증', () => {
    it('유효한 위치 정보를 검증할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          coordinates: {
            latitude: 37.5665,
            longitude: 126.9780
          },
          address: '서울특별시 강남구 테헤란로 152',
          mapInfo: {
            phoneNumber: '02-1234-5678',
            website: 'https://example.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(true);
    });

    it('유효하지 않은 위치 정보를 검증할 수 있어야 한다', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          coordinates: {
            latitude: 200, // 유효하지 않은 위도
            longitude: 126.9780
          },
          mapInfo: {
            phoneNumber: 'invalid-phone',
            website: 'invalid-url'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });
}); 