const Notification = require('../models/Notification');
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const logger = require('../utils/logger');

/**
 * 알림 서비스
 * 다중 채널 알림(푸시, 이메일, SMS) 및 중요/긴급 공지 기능 제공
 */
class NotificationService {
  /**
   * 알림 생성
   * @param {Object} notificationData - 알림 데이터
   * @param {string} creatorId - 생성자 ID
   * @returns {Promise<Object>} 생성된 알림
   */
  async createNotification(notificationData, creatorId) {
    try {
      const notification = new Notification({
        ...notificationData,
        createdBy: creatorId
      });

      // 수신자 수 계산
      await this.calculateRecipientCount(notification);

      // 즉시 발송 여부에 따라 상태 설정
      if (notification.scheduling.sendImmediately) {
        notification.status = 'sending';
      } else {
        notification.status = 'scheduled';
      }

      await notification.save();

      // 즉시 발송인 경우 발송 시작
      if (notification.scheduling.sendImmediately) {
        await this.sendNotification(notification._id);
      }

      logger.info(`알림 생성 완료: ${notification._id} by ${creatorId}`);
      return { success: true, notification };
    } catch (error) {
      logger.error('알림 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 알림 발송
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<Object>} 발송 결과
   */
  async sendNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      if (notification.status !== 'sending' && notification.status !== 'scheduled') {
        throw new Error('발송 가능한 상태가 아닙니다.');
      }

      // 수신자 목록 가져오기
      const recipients = await this.getRecipients(notification);
      
      if (recipients.length === 0) {
        notification.status = 'sent';
        notification.completedAt = new Date();
        await notification.save();
        return { success: true, message: '수신자가 없습니다.' };
      }

      notification.progress.total = recipients.length;
      notification.progress.pending = recipients.length;
      notification.status = 'sending';
      await notification.save();

      // 각 채널별로 발송
      const results = {
        email: { sent: 0, failed: 0 },
        push: { sent: 0, failed: 0 },
        sms: { sent: 0, failed: 0 },
        inApp: { sent: 0, failed: 0 }
      };

      for (const recipient of recipients) {
        try {
          // 이메일 발송
          if (notification.channels.email.enabled) {
            const emailResult = await this.sendEmail(notification, recipient);
            if (emailResult.success) {
              results.email.sent++;
            } else {
              results.email.failed++;
            }
            notification.addDeliveryLog(recipient._id, 'email', emailResult.success ? 'sent' : 'failed', emailResult.error);
          }

          // 푸시 알림 발송
          if (notification.channels.push.enabled) {
            const pushResult = await this.sendPushNotification(notification, recipient);
            if (pushResult.success) {
              results.push.sent++;
            } else {
              results.push.failed++;
            }
            notification.addDeliveryLog(recipient._id, 'push', pushResult.success ? 'sent' : 'failed', pushResult.error);
          }

          // SMS 발송
          if (notification.channels.sms.enabled) {
            const smsResult = await this.sendSMS(notification, recipient);
            if (smsResult.success) {
              results.sms.sent++;
            } else {
              results.sms.failed++;
            }
            notification.addDeliveryLog(recipient._id, 'sms', smsResult.success ? 'sent' : 'failed', smsResult.error);
          }

          // 앱 내 알림
          if (notification.channels.inApp.enabled) {
            const inAppResult = await this.sendInAppNotification(notification, recipient);
            if (inAppResult.success) {
              results.inApp.sent++;
            } else {
              results.inApp.failed++;
            }
            notification.addDeliveryLog(recipient._id, 'in_app', inAppResult.success ? 'sent' : 'failed', inAppResult.error);
          }

        } catch (error) {
          logger.error(`수신자 ${recipient._id} 발송 오류:`, error);
          results.email.failed++;
          results.push.failed++;
          results.sms.failed++;
          results.inApp.failed++;
        }
      }

      // 진행 상황 업데이트
      const totalSent = results.email.sent + results.push.sent + results.sms.sent + results.inApp.sent;
      const totalFailed = results.email.failed + results.push.failed + results.sms.failed + results.inApp.failed;
      
      notification.updateProgress(totalSent, totalFailed);
      await notification.save();

      logger.info(`알림 발송 완료: ${notificationId}`);
      return { success: true, results };
    } catch (error) {
      logger.error('알림 발송 오류:', error);
      throw error;
    }
  }

  /**
   * 수신자 목록 가져오기
   * @param {Object} notification - 알림 객체
   * @returns {Promise<Array>} 수신자 목록
   */
  async getRecipients(notification) {
    const { recipients } = notification;
    let userIds = [];

    switch (recipients.type) {
      case 'specific_users':
        userIds = recipients.userIds;
        break;
      
      case 'all_users':
        // 모든 사용자 조회 (실제 구현에서는 User 모델 필요)
        userIds = await this.getAllUserIds();
        break;
      
      case 'user_groups':
        // 그룹 멤버 조회 (실제 구현에서는 UserGroup 모델 필요)
        userIds = await this.getGroupMemberIds(recipients.userGroups);
        break;
      
      case 'calendar_members':
        // 캘린더 멤버 조회
        userIds = await this.getCalendarMemberIds(recipients.calendarIds);
        break;
      
      case 'event_attendees':
        // 이벤트 참석자 조회
        userIds = await this.getEventAttendeeIds(recipients.eventIds);
        break;
      
      case 'custom_query':
        // 커스텀 쿼리 실행 (실제 구현에서는 보안 고려 필요)
        userIds = await this.executeCustomQuery(recipients.customQuery);
        break;
    }

    // 제외할 사용자 필터링
    if (recipients.excludeUserIds && recipients.excludeUserIds.length > 0) {
      userIds = userIds.filter(id => !recipients.excludeUserIds.includes(id));
    }

    // 중복 제거
    userIds = [...new Set(userIds)];

    return userIds.map(id => ({ _id: id }));
  }

  /**
   * 수신자 수 계산
   * @param {Object} notification - 알림 객체
   */
  async calculateRecipientCount(notification) {
    const recipients = await this.getRecipients(notification);
    notification.progress.total = recipients.length;
  }

  /**
   * 이메일 발송
   * @param {Object} notification - 알림 객체
   * @param {Object} recipient - 수신자
   * @returns {Promise<Object>} 발송 결과
   */
  async sendEmail(notification, recipient) {
    try {
      // 이메일 템플릿 생성
      const emailContent = await this.generateEmailContent(notification, recipient);
      
      // 실제 이메일 발송 로직 (외부 서비스 연동 필요)
      // const result = await emailService.send({
      //   to: recipient.email,
      //   subject: notification.channels.email.subject || notification.title,
      //   html: emailContent.html,
      //   text: emailContent.text
      // });

      // 임시 성공 응답
      return { success: true };
    } catch (error) {
      logger.error('이메일 발송 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 푸시 알림 발송
   * @param {Object} notification - 알림 객체
   * @param {Object} recipient - 수신자
   * @returns {Promise<Object>} 발송 결과
   */
  async sendPushNotification(notification, recipient) {
    try {
      // 푸시 알림 데이터 생성
      const pushData = {
        title: notification.channels.push.title || notification.title,
        body: notification.channels.push.body || notification.message,
        image: notification.channels.push.image,
        action: notification.channels.push.action,
        actionUrl: notification.channels.push.actionUrl,
        badge: notification.channels.push.badge,
        sound: notification.channels.push.sound,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          category: notification.category
        }
      };

      // 실제 푸시 발송 로직 (FCM, APNS 등 연동 필요)
      // const result = await pushService.send(recipient.deviceTokens, pushData);

      // 임시 성공 응답
      return { success: true };
    } catch (error) {
      logger.error('푸시 알림 발송 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SMS 발송
   * @param {Object} notification - 알림 객체
   * @param {Object} recipient - 수신자
   * @returns {Promise<Object>} 발송 결과
   */
  async sendSMS(notification, recipient) {
    try {
      const smsData = {
        to: recipient.phone,
        message: notification.channels.sms.message || notification.message,
        sender: notification.channels.sms.sender || 'Calendar'
      };

      // 실제 SMS 발송 로직 (외부 서비스 연동 필요)
      // const result = await smsService.send(smsData);

      // 임시 성공 응답
      return { success: true };
    } catch (error) {
      logger.error('SMS 발송 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 앱 내 알림 발송
   * @param {Object} notification - 알림 객체
   * @param {Object} recipient - 수신자
   * @returns {Promise<Object>} 발송 결과
   */
  async sendInAppNotification(notification, recipient) {
    try {
      // 앱 내 알림 저장 (실제 구현에서는 별도 컬렉션 필요)
      const inAppNotification = {
        userId: recipient._id,
        notificationId: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        category: notification.category,
        urgentNotice: notification.urgentNotice,
        interactions: notification.interactions,
        createdAt: new Date(),
        read: false,
        dismissed: false
      };

      // 실제 저장 로직
      // await InAppNotification.create(inAppNotification);

      // 임시 성공 응답
      return { success: true };
    } catch (error) {
      logger.error('앱 내 알림 발송 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 이메일 템플릿 생성
   * @param {Object} notification - 알림 객체
   * @param {Object} recipient - 수신자
   * @returns {Promise<Object>} 이메일 내용
   */
  async generateEmailContent(notification, recipient) {
    const template = notification.channels.email.template;
    const subject = notification.channels.email.subject || notification.title;
    
    // 템플릿별 HTML 생성
    let html = '';
    let text = '';

    switch (template) {
      case 'formal':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${notification.message}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">이 메일은 자동으로 발송되었습니다.</p>
          </div>
        `;
        break;
      
      case 'urgent':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ff4444; padding: 20px;">
            <h2 style="color: #ff4444;">🚨 ${subject}</h2>
            <p style="color: #333; line-height: 1.6; font-weight: bold;">${notification.message}</p>
            <p style="color: #999; font-size: 12px;">긴급 공지사항입니다.</p>
          </div>
        `;
        break;
      
      default:
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${subject}</h2>
            <p>${notification.message}</p>
          </div>
        `;
    }

    text = notification.message;

    return { html, text };
  }

  /**
   * 긴급 공지 조회
   * @returns {Promise<Array>} 긴급 공지 목록
   */
  async getUrgentNotices() {
    try {
      const notifications = await Notification.findUrgentNotices();
      return { success: true, notifications };
    } catch (error) {
      logger.error('긴급 공지 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 예약된 알림 조회
   * @returns {Promise<Array>} 예약된 알림 목록
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notification.findScheduledNotifications();
      return { success: true, notifications };
    } catch (error) {
      logger.error('예약된 알림 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 알림 상태 업데이트
   * @param {string} notificationId - 알림 ID
   * @param {Object} updateData - 업데이트 데이터
   * @param {string} updaterId - 수정자 ID
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateNotification(notificationId, updateData, updaterId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      // 발송된 알림은 수정 불가
      if (notification.status === 'sent') {
        throw new Error('발송된 알림은 수정할 수 없습니다.');
      }

      Object.assign(notification, updateData, { updatedBy: updaterId });

      // 수신자 변경 시 수신자 수 재계산
      if (updateData.recipients) {
        await this.calculateRecipientCount(notification);
      }

      await notification.save();

      logger.info(`알림 수정 완료: ${notificationId} by ${updaterId}`);
      return { success: true, notification };
    } catch (error) {
      logger.error('알림 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 알림 삭제
   * @param {string} notificationId - 알림 ID
   * @param {string} deleterId - 삭제자 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteNotification(notificationId, deleterId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      // 발송 중인 알림은 삭제 불가
      if (notification.status === 'sending') {
        throw new Error('발송 중인 알림은 삭제할 수 없습니다.');
      }

      await Notification.findByIdAndDelete(notificationId);

      logger.info(`알림 삭제 완료: ${notificationId} by ${deleterId}`);
      return { success: true };
    } catch (error) {
      logger.error('알림 삭제 오류:', error);
      throw error;
    }
  }

  // 임시 메서드들 (실제 구현에서는 해당 모델들 필요)
  async getAllUserIds() {
    // 실제 구현에서는 User 모델에서 조회
    return [];
  }

  async getGroupMemberIds(groupIds) {
    // 실제 구현에서는 UserGroup 모델에서 조회
    return [];
  }

  async getCalendarMemberIds(calendarIds) {
    // 캘린더 멤버 조회
    const calendars = await Calendar.find({ _id: { $in: calendarIds } });
    const userIds = [];
    
    calendars.forEach(calendar => {
      userIds.push(calendar.ownerId);
      calendar.sharing.sharedWith.forEach(share => {
        if (share.status === 'accepted') {
          userIds.push(share.userId);
        }
      });
    });

    return userIds;
  }

  async getEventAttendeeIds(eventIds) {
    // 이벤트 참석자 조회
    const events = await Event.find({ _id: { $in: eventIds } });
    const userIds = [];
    
    events.forEach(event => {
      event.attendees.forEach(attendee => {
        if (attendee.userId) {
          userIds.push(attendee.userId);
        }
      });
    });

    return userIds;
  }

  async executeCustomQuery(query) {
    // 보안상 실제 구현에서는 제한된 쿼리만 허용
    logger.warn('커스텀 쿼리 실행 시도:', query);
    return [];
  }
}

module.exports = new NotificationService(); 