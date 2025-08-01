const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const logger = require('../utils/logger');

/**
 * 참석자 관리 서비스
 * 참석자 초대, RSVP 처리, 코멘트 관리, 상태 추적 기능 제공
 */
class AttendeeService {
  /**
   * 참석자 초대
   * @param {string} eventId - 이벤트 ID
   * @param {Array} attendees - 초대할 참석자 목록
   * @param {Object} options - 초대 옵션
   * @param {string} inviterId - 초대자 ID
   * @returns {Promise<Object>} 초대 결과
   */
  async inviteAttendees(eventId, attendees, options = {}, inviterId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      // 권한 확인
      if (!this.hasInvitePermission(event, inviterId)) {
        throw new Error('참석자를 초대할 권한이 없습니다.');
      }

      // 최대 참석자 수 확인
      if (event.invitations.settings.maxAttendees) {
        const currentCount = event.attendees.length;
        if (currentCount + attendees.length > event.invitations.settings.maxAttendees) {
          throw new Error(`최대 참석자 수(${event.invitations.settings.maxAttendees}명)를 초과합니다.`);
        }
      }

      const results = [];
      for (const attendee of attendees) {
        try {
          // 이미 초대된 참석자인지 확인
          const existingAttendee = event.attendees.find(
            a => a.email === attendee.email || a.userId?.toString() === attendee.userId
          );

          if (existingAttendee) {
            // 기존 참석자 정보 업데이트
            existingAttendee.role = attendee.role || existingAttendee.role;
            existingAttendee.status = 'invited';
            existingAttendee.invitedBy = inviterId;
            existingAttendee.invitedAt = new Date();
            
            results.push({
              email: attendee.email,
              status: 'updated',
              message: '기존 참석자 정보가 업데이트되었습니다.'
            });
          } else {
            // 새로운 참석자 추가
            const newAttendee = {
              userId: attendee.userId,
              email: attendee.email,
              name: attendee.name,
              role: attendee.role || 'attendee',
              status: 'invited',
              rsvp: {
                status: 'pending',
                respondedAt: null,
                responseMessage: null
              },
              comments: [],
              preferences: {
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                  reminderTime: 15
                },
                timezone: 'Asia/Seoul',
                language: 'ko'
              },
              invitedAt: new Date(),
              invitedBy: inviterId,
              attendanceHistory: []
            };

            event.attendees.push(newAttendee);
            results.push({
              email: attendee.email,
              status: 'invited',
              message: '초대가 전송되었습니다.'
            });
          }
        } catch (error) {
          results.push({
            email: attendee.email,
            status: 'error',
            message: error.message
          });
        }
      }

      // 통계 업데이트
      this.updateInvitationStatistics(event);
      await event.save();

      // 초대 발송 기록 추가
      await this.recordInvitationSent(event, attendees, inviterId, options);

      logger.info(`참석자 초대 완료: ${eventId} by ${inviterId}`);
      return { success: true, results };
    } catch (error) {
      logger.error('참석자 초대 오류:', error);
      throw error;
    }
  }

  /**
   * RSVP 응답 처리
   * @param {string} eventId - 이벤트 ID
   * @param {string} attendeeId - 참석자 ID
   * @param {Object} rsvpData - RSVP 데이터
   * @returns {Promise<Object>} 처리 결과
   */
  async respondToRSVP(eventId, attendeeId, rsvpData) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const attendee = event.attendees.find(
        a => a.userId?.toString() === attendeeId || a.email === attendeeId
      );

      if (!attendee) {
        throw new Error('참석자를 찾을 수 없습니다.');
      }

      // RSVP 마감일 확인
      if (event.invitations.settings.rsvpDeadline && 
          new Date() > event.invitations.settings.rsvpDeadline) {
        throw new Error('RSVP 마감일이 지났습니다.');
      }

      const oldStatus = attendee.status;
      const oldRSVP = attendee.rsvp.status;

      // RSVP 상태 업데이트
      attendee.rsvp.status = rsvpData.status;
      attendee.rsvp.respondedAt = new Date();
      attendee.rsvp.responseMessage = rsvpData.message || null;

      // 참석자 상태 업데이트
      switch (rsvpData.status) {
        case 'yes':
          attendee.status = 'accepted';
          break;
        case 'no':
          attendee.status = 'declined';
          break;
        case 'maybe':
          attendee.status = 'tentative';
          break;
        default:
          attendee.status = 'invited';
      }

      // 통계 업데이트
      this.updateInvitationStatistics(event);
      await event.save();

      logger.info(`RSVP 응답 처리 완료: ${eventId} ${attendeeId} ${rsvpData.status}`);
      return { 
        success: true, 
        oldStatus,
        newStatus: attendee.status,
        oldRSVP,
        newRSVP: attendee.rsvp.status
      };
    } catch (error) {
      logger.error('RSVP 응답 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 참석자 코멘트 추가
   * @param {string} eventId - 이벤트 ID
   * @param {string} attendeeId - 참석자 ID
   * @param {Object} commentData - 코멘트 데이터
   * @param {string} authorId - 작성자 ID
   * @returns {Promise<Object>} 추가된 코멘트
   */
  async addComment(eventId, attendeeId, commentData, authorId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const attendee = event.attendees.find(
        a => a.userId?.toString() === attendeeId || a.email === attendeeId
      );

      if (!attendee) {
        throw new Error('참석자를 찾을 수 없습니다.');
      }

      // 코멘트 허용 여부 확인
      if (!event.invitations.settings.allowComments) {
        throw new Error('코멘트가 허용되지 않습니다.');
      }

      // 비공개 코멘트 허용 여부 확인
      if (commentData.isPrivate && !event.invitations.settings.allowPrivateComments) {
        throw new Error('비공개 코멘트가 허용되지 않습니다.');
      }

      const newComment = {
        content: commentData.content,
        createdAt: new Date(),
        isPrivate: commentData.isPrivate || false,
        createdBy: authorId
      };

      attendee.comments.push(newComment);
      await event.save();

      logger.info(`참석자 코멘트 추가 완료: ${eventId} ${attendeeId} by ${authorId}`);
      return { success: true, comment: newComment };
    } catch (error) {
      logger.error('참석자 코멘트 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 참석자 코멘트 수정
   * @param {string} eventId - 이벤트 ID
   * @param {string} attendeeId - 참석자 ID
   * @param {number} commentIndex - 코멘트 인덱스
   * @param {Object} commentData - 수정할 코멘트 데이터
   * @param {string} authorId - 작성자 ID
   * @returns {Promise<Object>} 수정된 코멘트
   */
  async updateComment(eventId, attendeeId, commentIndex, commentData, authorId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const attendee = event.attendees.find(
        a => a.userId?.toString() === attendeeId || a.email === attendeeId
      );

      if (!attendee) {
        throw new Error('참석자를 찾을 수 없습니다.');
      }

      if (commentIndex < 0 || commentIndex >= attendee.comments.length) {
        throw new Error('코멘트를 찾을 수 없습니다.');
      }

      const comment = attendee.comments[commentIndex];
      
      // 권한 확인 (작성자만 수정 가능)
      if (comment.createdBy.toString() !== authorId) {
        throw new Error('코멘트를 수정할 권한이 없습니다.');
      }

      comment.content = commentData.content;
      comment.updatedAt = new Date();
      comment.isPrivate = commentData.isPrivate || comment.isPrivate;

      await event.save();

      logger.info(`참석자 코멘트 수정 완료: ${eventId} ${attendeeId} ${commentIndex} by ${authorId}`);
      return { success: true, comment };
    } catch (error) {
      logger.error('참석자 코멘트 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 참석자 출석 상태 업데이트
   * @param {string} eventId - 이벤트 ID
   * @param {string} attendeeId - 참석자 ID
   * @param {Object} attendanceData - 출석 데이터
   * @param {string} recorderId - 기록자 ID
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateAttendance(eventId, attendeeId, attendanceData, recorderId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const attendee = event.attendees.find(
        a => a.userId?.toString() === attendeeId || a.email === attendeeId
      );

      if (!attendee) {
        throw new Error('참석자를 찾을 수 없습니다.');
      }

      // 출석 기록 추가
      const attendanceRecord = {
        status: attendanceData.status,
        timestamp: new Date(),
        notes: attendanceData.notes || null,
        recordedBy: recorderId
      };

      attendee.attendanceHistory.push(attendanceRecord);

      // 참석자 상태 업데이트
      if (attendanceData.status === 'attended') {
        attendee.status = 'attended';
      } else if (attendanceData.status === 'no_show') {
        attendee.status = 'no_show';
      }

      // 통계 업데이트
      this.updateInvitationStatistics(event);
      await event.save();

      logger.info(`참석자 출석 상태 업데이트 완료: ${eventId} ${attendeeId} ${attendanceData.status} by ${recorderId}`);
      return { success: true, attendanceRecord };
    } catch (error) {
      logger.error('참석자 출석 상태 업데이트 오류:', error);
      throw error;
    }
  }

  /**
   * 참석자 그룹 관리
   * @param {string} eventId - 이벤트 ID
   * @param {Object} groupData - 그룹 데이터
   * @param {string} creatorId - 생성자 ID
   * @returns {Promise<Object>} 생성된 그룹
   */
  async createAttendeeGroup(eventId, groupData, creatorId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const newGroup = {
        name: groupData.name,
        description: groupData.description,
        type: groupData.type,
        members: groupData.members || [],
        permissions: {
          canInvite: groupData.permissions?.canInvite || false,
          canManage: groupData.permissions?.canManage || false,
          canViewAll: groupData.permissions?.canViewAll || true
        },
        createdAt: new Date(),
        createdBy: creatorId
      };

      event.attendeeGroups.push(newGroup);
      await event.save();

      logger.info(`참석자 그룹 생성 완료: ${eventId} ${groupData.name} by ${creatorId}`);
      return { success: true, group: newGroup };
    } catch (error) {
      logger.error('참석자 그룹 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 참석자 통계 조회
   * @param {string} eventId - 이벤트 ID
   * @returns {Promise<Object>} 통계 정보
   */
  async getAttendeeStatistics(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      const stats = {
        total: event.attendees.length,
        byStatus: {
          invited: 0,
          accepted: 0,
          declined: 0,
          tentative: 0,
          attended: 0,
          no_show: 0
        },
        byRole: {
          organizer: 0,
          attendee: 0,
          optional: 0,
          resource: 0
        },
        byRSVP: {
          pending: 0,
          yes: 0,
          no: 0,
          maybe: 0
        },
        responseRate: 0
      };

      event.attendees.forEach(attendee => {
        stats.byStatus[attendee.status]++;
        stats.byRole[attendee.role]++;
        stats.byRSVP[attendee.rsvp.status]++;
      });

      // 응답률 계산
      const responded = stats.byRSVP.yes + stats.byRSVP.no + stats.byRSVP.maybe;
      stats.responseRate = stats.total > 0 ? Math.round((responded / stats.total) * 100) : 0;

      return { success: true, statistics: stats };
    } catch (error) {
      logger.error('참석자 통계 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 초대 권한 확인
   * @param {Object} event - 이벤트 객체
   * @param {string} userId - 사용자 ID
   * @returns {boolean} 권한 여부
   */
  hasInvitePermission(event, userId) {
    // 이벤트 생성자
    if (event.createdBy.toString() === userId) {
      return true;
    }

    // 캘린더 소유자
    const calendar = event.calendarId;
    if (calendar && calendar.ownerId.toString() === userId) {
      return true;
    }

    // 참석자 중 조직자
    const attendee = event.attendees.find(a => a.userId?.toString() === userId);
    return attendee && attendee.role === 'organizer';
  }

  /**
   * 초대 통계 업데이트
   * @param {Object} event - 이벤트 객체
   */
  updateInvitationStatistics(event) {
    const stats = event.invitations.statistics;
    stats.totalInvited = event.attendees.length;
    stats.accepted = event.attendees.filter(a => a.status === 'accepted').length;
    stats.declined = event.attendees.filter(a => a.status === 'declined').length;
    stats.tentative = event.attendees.filter(a => a.status === 'tentative').length;
    stats.pending = event.attendees.filter(a => a.status === 'invited').length;
    stats.attended = event.attendees.filter(a => a.status === 'attended').length;
    stats.noShow = event.attendees.filter(a => a.status === 'no_show').length;
    
    const responded = stats.accepted + stats.declined + stats.tentative;
    stats.responseRate = stats.totalInvited > 0 ? Math.round((responded / stats.totalInvited) * 100) : 0;
  }

  /**
   * 초대 발송 기록
   * @param {Object} event - 이벤트 객체
   * @param {Array} attendees - 참석자 목록
   * @param {string} inviterId - 초대자 ID
   * @param {Object} options - 옵션
   */
  async recordInvitationSent(event, attendees, inviterId, options) {
    const sentInvitations = attendees.map(attendee => ({
      attendeeId: attendee.userId,
      email: attendee.email,
      sentAt: new Date(),
      sentBy: inviterId,
      method: options.method || 'email',
      status: 'sent',
      trackingId: this.generateTrackingId()
    }));

    event.invitations.sentInvitations.push(...sentInvitations);
  }

  /**
   * 추적 ID 생성
   * @returns {string} 추적 ID
   */
  generateTrackingId() {
    return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new AttendeeService(); 