const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 알림 컨트롤러
 * 다중 채널 알림(푸시, 이메일, SMS) 및 중요/긴급 공지 기능 제공
 */
class NotificationController {
  /**
   * 알림 생성
   * POST /api/notifications
   */
  async createNotification(req, res) {
    try {
      const { title, message, type, priority, category, channels, recipients, scheduling, urgentNotice, interactions } = req.body;
      const creatorId = req.user.id; // 인증된 사용자 ID

      // 필수 필드 검증
      if (!title || !message || !type || !category) {
        return errorResponse(res, 400, '필수 필드가 누락되었습니다.');
      }

      // 수신자 설정 검증
      if (!recipients || !recipients.type) {
        return errorResponse(res, 400, '수신자 설정이 필요합니다.');
      }

      const notificationData = {
        title,
        message,
        type,
        priority: priority || 'normal',
        category,
        channels: channels || {
          email: { enabled: true },
          push: { enabled: true },
          sms: { enabled: false },
          inApp: { enabled: true }
        },
        recipients,
        scheduling: scheduling || { sendImmediately: true },
        urgentNotice: urgentNotice || { enabled: false },
        interactions: interactions || {}
      };

      const result = await notificationService.createNotification(notificationData, creatorId);

      return successResponse(res, 201, '알림이 성공적으로 생성되었습니다.', result.notification);
    } catch (error) {
      console.error('알림 생성 오류:', error);
      return errorResponse(res, 500, '알림 생성 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 목록 조회
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        type, 
        category, 
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        sortOrder
      };

      const result = await notificationService.getNotifications(filters, options);

      return successResponse(res, 200, '알림 목록을 성공적으로 조회했습니다.', result);
    } catch (error) {
      console.error('알림 목록 조회 오류:', error);
      return errorResponse(res, 500, '알림 목록 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 상세 조회
   * GET /api/notifications/:id
   */
  async getNotification(req, res) {
    try {
      const { id } = req.params;
      const result = await notificationService.getNotification(id);

      return successResponse(res, 200, '알림을 성공적으로 조회했습니다.', result.notification);
    } catch (error) {
      console.error('알림 조회 오류:', error);
      if (error.message === '알림을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '알림을 찾을 수 없습니다.');
      }
      return errorResponse(res, 500, '알림 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 수정
   * PUT /api/notifications/:id
   */
  async updateNotification(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updaterId = req.user.id;

      const result = await notificationService.updateNotification(id, updateData, updaterId);

      return successResponse(res, 200, '알림이 성공적으로 수정되었습니다.', result.notification);
    } catch (error) {
      console.error('알림 수정 오류:', error);
      if (error.message === '알림을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '알림을 찾을 수 없습니다.');
      }
      if (error.message === '발송된 알림은 수정할 수 없습니다.') {
        return errorResponse(res, 400, '발송된 알림은 수정할 수 없습니다.');
      }
      return errorResponse(res, 500, '알림 수정 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 삭제
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const deleterId = req.user.id;

      await notificationService.deleteNotification(id, deleterId);

      return successResponse(res, 200, '알림이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      if (error.message === '알림을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '알림을 찾을 수 없습니다.');
      }
      if (error.message === '발송 중인 알림은 삭제할 수 없습니다.') {
        return errorResponse(res, 400, '발송 중인 알림은 삭제할 수 없습니다.');
      }
      return errorResponse(res, 500, '알림 삭제 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 발송
   * POST /api/notifications/:id/send
   */
  async sendNotification(req, res) {
    try {
      const { id } = req.params;
      const result = await notificationService.sendNotification(id);

      return successResponse(res, 200, '알림이 성공적으로 발송되었습니다.', result);
    } catch (error) {
      console.error('알림 발송 오류:', error);
      if (error.message === '알림을 찾을 수 없습니다.') {
        return errorResponse(res, 404, '알림을 찾을 수 없습니다.');
      }
      if (error.message === '발송 가능한 상태가 아닙니다.') {
        return errorResponse(res, 400, '발송 가능한 상태가 아닙니다.');
      }
      return errorResponse(res, 500, '알림 발송 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 긴급 공지 조회
   * GET /api/notifications/urgent
   */
  async getUrgentNotices(req, res) {
    try {
      const result = await notificationService.getUrgentNotices();

      return successResponse(res, 200, '긴급 공지를 성공적으로 조회했습니다.', result.notifications);
    } catch (error) {
      console.error('긴급 공지 조회 오류:', error);
      return errorResponse(res, 500, '긴급 공지 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 예약된 알림 조회
   * GET /api/notifications/scheduled
   */
  async getScheduledNotifications(req, res) {
    try {
      const result = await notificationService.getScheduledNotifications();

      return successResponse(res, 200, '예약된 알림을 성공적으로 조회했습니다.', result.notifications);
    } catch (error) {
      console.error('예약된 알림 조회 오류:', error);
      return errorResponse(res, 500, '예약된 알림 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 통계 조회
   * GET /api/notifications/stats
   */
  async getNotificationStats(req, res) {
    try {
      const { startDate, endDate, type, category } = req.query;

      // 통계 데이터 조회 (실제 구현에서는 별도 서비스 필요)
      const stats = {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {},
        byCategory: {},
        byChannel: {
          email: { sent: 0, failed: 0 },
          push: { sent: 0, failed: 0 },
          sms: { sent: 0, failed: 0 },
          inApp: { sent: 0, failed: 0 }
        },
        urgentNotices: 0,
        scheduledNotifications: 0
      };

      return successResponse(res, 200, '알림 통계를 성공적으로 조회했습니다.', stats);
    } catch (error) {
      console.error('알림 통계 조회 오류:', error);
      return errorResponse(res, 500, '알림 통계 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 템플릿 조회
   * GET /api/notifications/templates
   */
  async getNotificationTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'event_reminder',
          name: '이벤트 알림',
          description: '이벤트 시작 전 알림',
          type: 'event_reminder',
          category: 'event',
          channels: {
            email: {
              template: 'formal',
              subject: '이벤트 알림: {{eventTitle}}',
              htmlContent: '<p>{{eventTitle}} 이벤트가 {{startTime}}에 시작됩니다.</p>'
            },
            push: {
              title: '이벤트 알림',
              body: '{{eventTitle}} 이벤트가 곧 시작됩니다.'
            }
          }
        },
        {
          id: 'urgent_notice',
          name: '긴급 공지',
          description: '긴급한 공지사항',
          type: 'urgent_notice',
          category: 'announcement',
          priority: 'urgent',
          urgentNotice: {
            enabled: true,
            displayType: 'banner',
            backgroundColor: '#ff4444',
            requireAcknowledgment: true
          },
          channels: {
            email: {
              template: 'urgent',
              subject: '🚨 긴급 공지: {{title}}'
            },
            push: {
              title: '🚨 긴급 공지',
              body: '{{message}}',
              sound: 'urgent'
            },
            sms: {
              enabled: true,
              message: '긴급 공지: {{message}}'
            }
          }
        },
        {
          id: 'system_maintenance',
          name: '시스템 점검',
          description: '시스템 점검 알림',
          type: 'system_notice',
          category: 'maintenance',
          priority: 'high',
          channels: {
            email: {
              template: 'formal',
              subject: '시스템 점검 안내',
              htmlContent: '<p>시스템 점검이 예정되어 있습니다.</p>'
            },
            push: {
              title: '시스템 점검 안내',
              body: '{{message}}'
            }
          }
        }
      ];

      return successResponse(res, 200, '알림 템플릿을 성공적으로 조회했습니다.', templates);
    } catch (error) {
      console.error('알림 템플릿 조회 오류:', error);
      return errorResponse(res, 500, '알림 템플릿 조회 중 오류가 발생했습니다.', error.message);
    }
  }

  /**
   * 알림 발송 테스트
   * POST /api/notifications/test
   */
  async testNotification(req, res) {
    try {
      const { channels, testRecipients } = req.body;
      const creatorId = req.user.id;

      if (!testRecipients || testRecipients.length === 0) {
        return errorResponse(res, 400, '테스트 수신자가 필요합니다.');
      }

      const testNotification = {
        title: '테스트 알림',
        message: '이것은 테스트 알림입니다.',
        type: 'custom',
        category: 'system',
        priority: 'normal',
        channels: channels || {
          email: { enabled: true },
          push: { enabled: true },
          sms: { enabled: false },
          inApp: { enabled: true }
        },
        recipients: {
          type: 'specific_users',
          userIds: testRecipients
        },
        scheduling: { sendImmediately: true },
        urgentNotice: { enabled: false },
        interactions: {}
      };

      const result = await notificationService.createNotification(testNotification, creatorId);

      return successResponse(res, 200, '테스트 알림이 성공적으로 발송되었습니다.', result);
    } catch (error) {
      console.error('테스트 알림 발송 오류:', error);
      return errorResponse(res, 500, '테스트 알림 발송 중 오류가 발생했습니다.', error.message);
    }
  }
}

module.exports = new NotificationController(); 