/**
 * Notification Controller - 알림 컨트롤러
 * 알림 관리 API 엔드포인트 처리
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import notificationService from '../services/notificationService.js';

/**
 * 알림 컨트롤러 클래스
 */
class NotificationController {
  /**
   * 사용자 알림 목록 조회
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      const result = await notificationService.getUserNotifications(userId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 사용자 알림 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 알림 상세 조회
   */
  async getNotificationById(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      const notification = await notificationService.getNotificationById(notificationId, userId);

      res.json({
        success: true,
        data: { notification }
      });

    } catch (error) {
      logger.error('❌ 알림 상세 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '알림을 찾을 수 없습니다.'
      });
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: { notification },
        message: '알림이 읽음 처리되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 알림 읽음 처리 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '알림을 읽음 처리할 수 없습니다.'
      });
    }
  }

  /**
   * 여러 알림 읽음 처리
   */
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user._id;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '알림 ID 목록이 필요합니다.'
        });
      }

      const result = await notificationService.markMultipleAsRead(notificationIds, userId);

      res.json({
        success: true,
        data: result,
        message: `${result.modifiedCount}개의 알림이 읽음 처리되었습니다.`
      });

    } catch (error) {
      logger.error('❌ 여러 알림 읽음 처리 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: '알림을 읽음 처리할 수 없습니다.'
      });
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: result,
        message: `${result.modifiedCount}개의 알림이 읽음 처리되었습니다.`
      });

    } catch (error) {
      logger.error('❌ 모든 알림 읽음 처리 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: '알림을 읽음 처리할 수 없습니다.'
      });
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      const result = await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 알림 삭제 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '알림을 삭제할 수 없습니다.'
      });
    }
  }

  /**
   * 여러 알림 삭제
   */
  async deleteMultipleNotifications(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user._id;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '알림 ID 목록이 필요합니다.'
        });
      }

      const result = await notificationService.deleteMultipleNotifications(notificationIds, userId);

      res.json({
        success: true,
        data: result,
        message: `${result.deletedCount}개의 알림이 삭제되었습니다.`
      });

    } catch (error) {
      logger.error('❌ 여러 알림 삭제 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: '알림을 삭제할 수 없습니다.'
      });
    }
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user._id;

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });

    } catch (error) {
      logger.error('❌ 읽지 않은 알림 개수 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '읽지 않은 알림 개수를 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(req, res) {
    try {
      const userId = req.user._id;

      const settings = await notificationService.getNotificationSettings(userId);

      res.json({
        success: true,
        data: { settings }
      });

    } catch (error) {
      logger.error('❌ 알림 설정 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 설정을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user._id;
      const settings = req.body;

      const result = await notificationService.updateNotificationSettings(userId, settings);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 알림 설정 업데이트 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: '알림 설정을 업데이트할 수 없습니다.'
      });
    }
  }

  /**
   * 알림 통계 조회
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.user._id;
      const { timeRange = '7d' } = req.query;

      const stats = await notificationService.getNotificationStats(userId, timeRange);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('❌ 알림 통계 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 통계를 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 서비스 상태 조회
   */
  async getServiceStatus(req, res) {
    try {
      const status = notificationService.getServiceStatus();

      res.json({
        success: true,
        data: { status }
      });

    } catch (error) {
      logger.error('❌ 서비스 상태 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '서비스 상태를 조회할 수 없습니다.'
      });
    }
  }
}

const notificationController = new NotificationController();
export default notificationController; 