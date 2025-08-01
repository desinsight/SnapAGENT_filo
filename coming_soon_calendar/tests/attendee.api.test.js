const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Calendar = require('../src/models/Calendar');
const Event = require('../src/models/Event');

describe('참석자별 상태 추적 및 코멘트, 초대/RSVP/코멘트 API 테스트', () => {
  let testCalendar, testEvent, ownerId, userId1, userId2, userId3, userId4;

  beforeAll(async () => {
    // 테스트용 사용자 ID 생성
    ownerId = new mongoose.Types.ObjectId();
    userId1 = new mongoose.Types.ObjectId();
    userId2 = new mongoose.Types.ObjectId();
    userId3 = new mongoose.Types.ObjectId();
    userId4 = new mongoose.Types.ObjectId();

    // 테스트용 캘린더 생성
    testCalendar = new Calendar({
      name: '테스트 캘린더',
      description: '참석자 테스트용 캘린더',
      ownerId: ownerId,
      color: '#1976d2',
      timezone: 'Asia/Seoul'
    });
    await testCalendar.save();

    // 테스트용 이벤트 생성
    testEvent = new Event({
      title: '테스트 이벤트',
      description: '참석자 테스트용 이벤트',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      calendarId: testCalendar._id,
      createdBy: ownerId,
      invitations: {
        settings: {
          allowGuests: true,
          maxAttendees: 10,
          requireRSVP: true,
          allowComments: true,
          allowPrivateComments: true
        },
        message: {
          subject: '테스트 이벤트 초대',
          body: '테스트 이벤트에 초대합니다.',
          template: 'default'
        },
        sentInvitations: [],
        statistics: {
          totalInvited: 0,
          accepted: 0,
          declined: 0,
          tentative: 0,
          pending: 0,
          attended: 0,
          noShow: 0,
          responseRate: 0
        }
      },
      attendees: [],
      attendeeGroups: [],
      feedback: {
        enabled: false,
        questions: [],
        responses: []
      }
    });
    await testEvent.save();
  });

  afterAll(async () => {
    await Calendar.deleteMany({});
    await Event.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 이벤트 상태 초기화
    await Event.findByIdAndUpdate(testEvent._id, {
      $set: {
        attendees: [],
        'invitations.statistics': {
          totalInvited: 0,
          accepted: 0,
          declined: 0,
          tentative: 0,
          pending: 0,
          attended: 0,
          noShow: 0,
          responseRate: 0
        }
      }
    });
  });

  describe('참석자 초대 기능', () => {
    test('참석자 초대 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/invite`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          attendees: [
            {
              userId: userId1,
              email: 'user1@test.com',
              name: '사용자1',
              role: 'attendee'
            },
            {
              userId: userId2,
              email: 'user2@test.com',
              name: '사용자2',
              role: 'organizer'
            }
          ],
          options: {
            method: 'email'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.results[0].status).toBe('invited');
      expect(response.body.data.results[1].status).toBe('invited');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.attendees).toHaveLength(2);
      expect(updatedEvent.invitations.statistics.totalInvited).toBe(2);
      expect(updatedEvent.invitations.statistics.pending).toBe(2);
    });

    test('참석자 초대 - 권한 없음', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/invite`)
        .set('Authorization', `Bearer ${userId3}`)
        .send({
          attendees: [{ userId: userId4, email: 'user4@test.com', name: '사용자4' }]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('참석자 초대 - 최대 참석자 수 초과', async () => {
      // 최대 참석자 수를 1로 설정
      await Event.findByIdAndUpdate(testEvent._id, {
        'invitations.settings.maxAttendees': 1
      });

      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/invite`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          attendees: [
            { userId: userId1, email: 'user1@test.com', name: '사용자1' },
            { userId: userId2, email: 'user2@test.com', name: '사용자2' }
          ]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('참석자 초대 - 기존 참석자 업데이트', async () => {
      // 먼저 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          attendees: {
            userId: userId1,
            email: 'user1@test.com',
            name: '사용자1',
            role: 'attendee',
            status: 'invited',
            invitedAt: new Date(),
            invitedBy: ownerId
          }
        }
      });

      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/invite`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          attendees: [
            {
              userId: userId1,
              email: 'user1@test.com',
              name: '사용자1',
              role: 'organizer'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.data.results[0].status).toBe('updated');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      const attendee = updatedEvent.attendees.find(a => a.userId.toString() === userId1.toString());
      expect(attendee.role).toBe('organizer');
    });
  });

  describe('RSVP 응답 처리', () => {
    beforeEach(async () => {
      // 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          attendees: {
            userId: userId1,
            email: 'user1@test.com',
            name: '사용자1',
            role: 'attendee',
            status: 'invited',
            rsvp: { status: 'pending', respondedAt: null, responseMessage: null },
            invitedAt: new Date(),
            invitedBy: ownerId
          }
        }
      });
    });

    test('RSVP 응답 - 수락', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/rsvp`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          attendeeId: userId1,
          status: 'yes',
          message: '참석하겠습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('accepted');
      expect(response.body.data.newRSVP).toBe('yes');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      const attendee = updatedEvent.attendees.find(a => a.userId.toString() === userId1.toString());
      expect(attendee.status).toBe('accepted');
      expect(attendee.rsvp.status).toBe('yes');
      expect(attendee.rsvp.respondedAt).toBeDefined();
      expect(updatedEvent.invitations.statistics.accepted).toBe(1);
    });

    test('RSVP 응답 - 거절', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/rsvp`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          attendeeId: userId1,
          status: 'no',
          message: '참석할 수 없습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('declined');
      expect(response.body.data.newRSVP).toBe('no');
    });

    test('RSVP 응답 - 미정', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/rsvp`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          attendeeId: userId1,
          status: 'maybe',
          message: '확정 후 알려드리겠습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('tentative');
      expect(response.body.data.newRSVP).toBe('maybe');
    });

    test('RSVP 응답 - 잘못된 상태', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/rsvp`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          attendeeId: userId1,
          status: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('참석자 코멘트 기능', () => {
    beforeEach(async () => {
      // 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          attendees: {
            userId: userId1,
            email: 'user1@test.com',
            name: '사용자1',
            role: 'attendee',
            status: 'accepted',
            comments: [],
            invitedAt: new Date(),
            invitedBy: ownerId
          }
        }
      });
    });

    test('참석자 코멘트 추가 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/comments`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          content: '테스트 코멘트입니다.',
          isPrivate: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('테스트 코멘트입니다.');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      const attendee = updatedEvent.attendees.find(a => a.userId.toString() === userId1.toString());
      expect(attendee.comments).toHaveLength(1);
      expect(attendee.comments[0].content).toBe('테스트 코멘트입니다.');
    });

    test('참석자 코멘트 추가 - 비공개', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/comments`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          content: '비공개 코멘트입니다.',
          isPrivate: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.isPrivate).toBe(true);
    });

    test('참석자 코멘트 수정 - 성공', async () => {
      // 먼저 코멘트 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          'attendees.0.comments': {
            content: '원본 코멘트',
            createdAt: new Date(),
            isPrivate: false,
            createdBy: userId1
          }
        }
      });

      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/comments/0`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          content: '수정된 코멘트',
          isPrivate: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('수정된 코멘트');
      expect(response.body.data.comment.isPrivate).toBe(true);
    });

    test('참석자 코멘트 수정 - 권한 없음', async () => {
      // 다른 사용자가 작성한 코멘트 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          'attendees.0.comments': {
            content: '다른 사용자 코멘트',
            createdAt: new Date(),
            isPrivate: false,
            createdBy: userId2
          }
        }
      });

      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/comments/0`)
        .set('Authorization', `Bearer ${userId1}`)
        .send({
          content: '수정 시도',
          isPrivate: false
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('참석자 출석 관리', () => {
    beforeEach(async () => {
      // 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $push: {
          attendees: {
            userId: userId1,
            email: 'user1@test.com',
            name: '사용자1',
            role: 'attendee',
            status: 'accepted',
            attendanceHistory: [],
            invitedAt: new Date(),
            invitedBy: ownerId
          }
        }
      });
    });

    test('참석자 출석 상태 업데이트 - 참석', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/attendance`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          status: 'attended',
          notes: '정시에 참석했습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendanceRecord.status).toBe('attended');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      const attendee = updatedEvent.attendees.find(a => a.userId.toString() === userId1.toString());
      expect(attendee.status).toBe('attended');
      expect(attendee.attendanceHistory).toHaveLength(1);
      expect(updatedEvent.invitations.statistics.attended).toBe(1);
    });

    test('참석자 출석 상태 업데이트 - 불참', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/attendance`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          status: 'no_show',
          notes: '연락 없이 불참했습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendanceRecord.status).toBe('no_show');

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      const attendee = updatedEvent.attendees.find(a => a.userId.toString() === userId1.toString());
      expect(attendee.status).toBe('no_show');
      expect(updatedEvent.invitations.statistics.noShow).toBe(1);
    });

    test('참석자 출석 상태 업데이트 - 지각', async () => {
      const response = await request(app)
        .put(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}/attendance`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          status: 'late',
          notes: '10분 지각했습니다.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendanceRecord.status).toBe('late');
    });
  });

  describe('참석자 그룹 관리', () => {
    test('참석자 그룹 생성 - 성공', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendee-groups`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          name: '개발팀',
          description: '소프트웨어 개발팀',
          type: 'team',
          members: [
            { userId: userId1, email: 'user1@test.com', name: '사용자1', role: 'member' },
            { userId: userId2, email: 'user2@test.com', name: '사용자2', role: 'leader' }
          ],
          permissions: {
            canInvite: true,
            canManage: false,
            canViewAll: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.group.name).toBe('개발팀');
      expect(response.body.data.group.members).toHaveLength(2);

      // 데이터베이스 확인
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.attendeeGroups).toHaveLength(1);
      expect(updatedEvent.attendeeGroups[0].name).toBe('개발팀');
    });

    test('참석자 그룹 생성 - 잘못된 타입', async () => {
      const response = await request(app)
        .post(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendee-groups`)
        .set('Authorization', `Bearer ${ownerId}`)
        .send({
          name: '테스트 그룹',
          type: 'invalid_type',
          members: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('참석자 통계 조회', () => {
    beforeEach(async () => {
      // 다양한 상태의 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $set: {
          attendees: [
            {
              userId: userId1,
              email: 'user1@test.com',
              name: '사용자1',
              role: 'attendee',
              status: 'accepted',
              rsvp: { status: 'yes', respondedAt: new Date() }
            },
            {
              userId: userId2,
              email: 'user2@test.com',
              name: '사용자2',
              role: 'organizer',
              status: 'declined',
              rsvp: { status: 'no', respondedAt: new Date() }
            },
            {
              userId: userId3,
              email: 'user3@test.com',
              name: '사용자3',
              role: 'attendee',
              status: 'tentative',
              rsvp: { status: 'maybe', respondedAt: new Date() }
            },
            {
              userId: userId4,
              email: 'user4@test.com',
              name: '사용자4',
              role: 'attendee',
              status: 'invited',
              rsvp: { status: 'pending' }
            }
          ]
        }
      });
    });

    test('참석자 통계 조회 - 성공', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/statistics`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics.total).toBe(4);
      expect(response.body.data.statistics.byStatus.accepted).toBe(1);
      expect(response.body.data.statistics.byStatus.declined).toBe(1);
      expect(response.body.data.statistics.byStatus.tentative).toBe(1);
      expect(response.body.data.statistics.byStatus.invited).toBe(1);
      expect(response.body.data.statistics.byRole.attendee).toBe(3);
      expect(response.body.data.statistics.byRole.organizer).toBe(1);
      expect(response.body.data.statistics.responseRate).toBe(75); // 3/4 * 100
    });
  });

  describe('참석자 목록 조회', () => {
    beforeEach(async () => {
      // 다양한 상태의 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $set: {
          attendees: [
            {
              userId: userId1,
              email: 'user1@test.com',
              name: '사용자1',
              role: 'attendee',
              status: 'accepted',
              comments: [{ content: '테스트 코멘트', createdAt: new Date(), createdBy: userId1 }]
            },
            {
              userId: userId2,
              email: 'user2@test.com',
              name: '사용자2',
              role: 'organizer',
              status: 'declined',
              comments: []
            }
          ]
        }
      });
    });

    test('참석자 목록 조회 - 전체', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.attendees).toHaveLength(2);
    });

    test('참석자 목록 조회 - 상태별 필터링', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees?status=accepted`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.attendees[0].status).toBe('accepted');
    });

    test('참석자 목록 조회 - 역할별 필터링', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees?role=organizer`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.attendees[0].role).toBe('organizer');
    });

    test('참석자 목록 조회 - 코멘트 포함', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees?includeComments=true`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const attendeeWithComments = response.body.data.attendees.find(a => a.comments);
      expect(attendeeWithComments.comments).toHaveLength(1);
    });
  });

  describe('참석자 상세 정보 조회', () => {
    beforeEach(async () => {
      // 참석자 추가
      await Event.findByIdAndUpdate(testEvent._id, {
        $set: {
          attendees: [{
            userId: userId1,
            email: 'user1@test.com',
            name: '사용자1',
            role: 'attendee',
            status: 'accepted',
            rsvp: { status: 'yes', respondedAt: new Date(), responseMessage: '참석하겠습니다.' },
            comments: [{ content: '테스트 코멘트', createdAt: new Date(), createdBy: userId1 }],
            attendanceHistory: [{ status: 'attended', timestamp: new Date(), recordedBy: ownerId }],
            invitedAt: new Date(),
            invitedBy: ownerId
          }]
        }
      });
    });

    test('참석자 상세 정보 조회 - 성공', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/${userId1}`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('사용자1');
      expect(response.body.data.status).toBe('accepted');
      expect(response.body.data.rsvp.status).toBe('yes');
      expect(response.body.data.comments).toHaveLength(1);
      expect(response.body.data.attendanceHistory).toHaveLength(1);
    });

    test('참석자 상세 정보 조회 - 존재하지 않는 참석자', async () => {
      const response = await request(app)
        .get(`/api/calendar/${testCalendar._id}/events/${testEvent._id}/attendees/nonexistent`)
        .set('Authorization', `Bearer ${ownerId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
}); 