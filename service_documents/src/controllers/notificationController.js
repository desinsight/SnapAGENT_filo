/**
 * Notification Controller - 알림 시스템 API 컨트롤러
 * 알림 관련 HTTP 요청을 처리하는 컨트롤러
 * 
 * @description
 * - 알림 생성, 조회, 수정, 삭제 API
 * - 알림 템플릿 관리 API
 * - 알림 설정 및 선호도 관리 API
 * - 알림 통계 및 분석 API
 * - 다른 서비스와의 연동을 위한 웹훅 API
 * - 확장성을 고려한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';

/**
 * 알림 컨트롤러 클래스
 * 알림 관련 HTTP 요청을 처리하는 컨트롤러
 */
class NotificationController {
  /**
   * 알림 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
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
        unreadOnly = false,
        startDate,
        endDate
      } = req.query;

      const userId = req.user.id;
      const skip = (page - 1) * limit;

      // 쿼리 조건 구성
      const query = { recipientId: userId, status: { $ne: 'cancelled' } };
      
      if (status) query.status = status;
      if (type) query.type = type;
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (unreadOnly === 'true') query.readAt = null;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // 알림 조회
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('senderId', 'name email')
        .lean();

      // 전체 개수 조회
      const total = await Notification.countDocuments(query);

      // 응답 데이터 구성
      const response = {
        success: true,
        data: {
          notifications: notifications.map(notification => ({
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            priority: notification.priority,
            status: notification.status,
            isRead: !!notification.readAt,
            isDelivered: !!notification.deliveredAt,
            channels: notification.channels,
            data: notification.data,
            sender: notification.senderId,
            createdAt: notification.createdAt,
            readAt: notification.readAt,
            deliveredAt: notification.deliveredAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('알림 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 목록을 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 특정 알림 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId
      }).populate('senderId', 'name email').lean();

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '알림을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          status: notification.status,
          isRead: !!notification.readAt,
          isDelivered: !!notification.deliveredAt,
          channels: notification.channels,
          data: notification.data,
          sender: notification.senderId,
          createdAt: notification.createdAt,
          readAt: notification.readAt,
          deliveredAt: notification.deliveredAt,
          deliveryHistory: notification.deliveryHistory,
          auditLog: notification.auditLog
        }
      });
    } catch (error) {
      logger.error('알림 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createNotification(req, res) {
    try {
      const {
        recipientId,
        recipientEmail,
        recipientName,
        title,
        message,
        type,
        category,
        priority = 'medium',
        channels = ['in_app'],
        data = {},
        scheduling = {},
        templateId
      } = req.body;

      const senderId = req.user.id;
      const senderName = req.user.name;

      // 필수 필드 검증
      if (!recipientId || !recipientEmail || !recipientName || !title || !message || !type || !category) {
        return res.status(400).json({
          success: false,
          message: '필수 필드가 누락되었습니다.'
        });
      }

      // 알림 데이터 구성
      const notificationData = {
        recipientId,
        recipientEmail,
        recipientName,
        senderId,
        senderName,
        title,
        message,
        type,
        category,
        priority,
        channels: channels.map(channel => ({
          type: channel,
          enabled: true,
          status: 'pending'
        })),
        data,
        scheduling,
        metadata: {
          source: 'api',
          sourceId: senderId
        }
      };

      // 템플릿 ID가 있는 경우 템플릿 정보 추가
      if (templateId) {
        const template = await NotificationTemplate.findById(templateId);
        if (template) {
          notificationData.template = {
            templateId: template._id,
            templateName: template.name
          };
        }
      }

      // 알림 생성 및 전송
      const notification = await notificationService.createAndSendNotification(notificationData);

      res.status(201).json({
        success: true,
        message: '알림이 성공적으로 생성되었습니다.',
        data: {
          id: notification._id,
          status: notification.status
        }
      });
    } catch (error) {
      logger.error('알림 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 생성하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 템플릿 기반 알림 전송
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async sendTemplatedNotification(req, res) {
    try {
      const {
        templateType,
        variables = {},
        recipients = [],
        options = {}
      } = req.body;

      const senderId = req.user.id;
      const senderName = req.user.name;

      // 필수 필드 검증
      if (!templateType || !recipients || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: '템플릿 유형과 수신자 정보가 필요합니다.'
        });
      }

      const results = [];
      const errors = [];

      // 각 수신자에게 알림 전송
      for (const recipientData of recipients) {
        try {
          const notification = await notificationService.sendTemplatedNotification(
            templateType,
            variables,
            {
              userId: recipientData.userId,
              email: recipientData.email,
              name: recipientData.name,
              language: recipientData.language || 'ko',
              notificationPreferences: recipientData.notificationPreferences
            },
            {
              senderId,
              senderName,
              ...options
            }
          );

          results.push({
            recipientId: recipientData.userId,
            notificationId: notification._id,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            recipientId: recipientData.userId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `템플릿 기반 알림 전송 완료: ${results.length}개 성공, ${errors.length}개 실패`,
        data: {
          results,
          errors
        }
      });
    } catch (error) {
      logger.error('템플릿 기반 알림 전송 실패:', error);
      res.status(500).json({
        success: false,
        message: '템플릿 기반 알림을 전송하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 읽음 처리
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userName = req.user.name;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '알림을 찾을 수 없습니다.'
        });
      }

      await notification.markAsRead(userId, userName);

      res.json({
        success: true,
        message: '알림이 읽음으로 표시되었습니다.',
        data: {
          id: notification._id,
          readAt: notification.readAt
        }
      });
    } catch (error) {
      logger.error('알림 읽음 처리 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 읽음으로 표시하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 여러 알림 읽음 처리
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds = [] } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;

      if (!notificationIds || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '알림 ID 목록이 필요합니다.'
        });
      }

      const results = [];
      const errors = [];

      for (const notificationId of notificationIds) {
        try {
          const notification = await Notification.findOne({
            _id: notificationId,
            recipientId: userId
          });

          if (notification) {
            await notification.markAsRead(userId, userName);
            results.push(notificationId);
          } else {
            errors.push({
              notificationId,
              error: '알림을 찾을 수 없습니다.'
            });
          }
        } catch (error) {
          errors.push({
            notificationId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `알림 읽음 처리 완료: ${results.length}개 성공, ${errors.length}개 실패`,
        data: {
          successCount: results.length,
          errorCount: errors.length,
          errors
        }
      });
    } catch (error) {
      logger.error('여러 알림 읽음 처리 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 읽음으로 표시하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 모든 알림 읽음 처리
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const userName = req.user.name;

      const result = await Notification.updateMany(
        {
          recipientId: userId,
          readAt: null,
          status: { $ne: 'cancelled' }
        },
        {
          $set: {
            readAt: new Date(),
            status: 'read'
          },
          $push: {
            auditLog: {
              action: 'read',
              userId,
              userName,
              timestamp: new Date(),
              details: '일괄 읽음 처리'
            }
          }
        }
      );

      res.json({
        success: true,
        message: '모든 알림이 읽음으로 표시되었습니다.',
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      logger.error('모든 알림 읽음 처리 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 읽음으로 표시하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '알림을 찾을 수 없습니다.'
        });
      }

      // 소프트 삭제 (deletedAt 설정)
      notification.deletedAt = new Date();
      await notification.save();

      res.json({
        success: true,
        message: '알림이 삭제되었습니다.'
      });
    } catch (error) {
      logger.error('알림 삭제 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림을 삭제하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // 쿼리 조건 구성
      const query = { recipientId: userId, status: { $ne: 'cancelled' } };
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // 통계 데이터 조회
      const [
        totalCount,
        unreadCount,
        readCount,
        typeStats,
        categoryStats,
        priorityStats,
        recentNotifications
      ] = await Promise.all([
        Notification.countDocuments(query),
        Notification.countDocuments({ ...query, readAt: null }),
        Notification.countDocuments({ ...query, readAt: { $ne: null } }),
        Notification.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Notification.aggregate([
          { $match: query },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Notification.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Notification.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title type category priority createdAt readAt')
          .lean()
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            total: totalCount,
            unread: unreadCount,
            read: readCount,
            readRate: totalCount > 0 ? (readCount / totalCount) * 100 : 0
          },
          typeStats,
          categoryStats,
          priorityStats,
          recentNotifications
        }
      });
    } catch (error) {
      logger.error('알림 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 통계를 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 설정 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getNotificationSettings(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).select('notificationPreferences');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          notificationPreferences: user.notificationPreferences || {
            email: true,
            push: true,
            slack: true,
            sms: false,
            in_app: true
          }
        }
      });
    } catch (error) {
      logger.error('알림 설정 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 설정을 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 설정 업데이트
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const { notificationPreferences } = req.body;

      if (!notificationPreferences) {
        return res.status(400).json({
          success: false,
          message: '알림 설정이 필요합니다.'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences },
        { new: true }
      ).select('notificationPreferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '알림 설정이 업데이트되었습니다.',
        data: {
          notificationPreferences: user.notificationPreferences
        }
      });
    } catch (error) {
      logger.error('알림 설정 업데이트 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 설정을 업데이트하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 템플릿 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getNotificationTemplates(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        category, 
        status = 'active',
        language = 'ko'
      } = req.query;

      const skip = (page - 1) * limit;

      // 쿼리 조건 구성
      const query = { status };
      
      if (type) query.type = type;
      if (category) query.category = category;
      if (language) query.language = language;

      // 템플릿 조회
      const templates = await NotificationTemplate.find(query)
        .sort({ 'usage.totalSent': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-channels -variables -conditions -styling')
        .lean();

      // 전체 개수 조회
      const total = await NotificationTemplate.countDocuments(query);

      res.json({
        success: true,
        data: {
          templates: templates.map(template => ({
            id: template._id,
            name: template.name,
            description: template.description,
            type: template.type,
            category: template.category,
            language: template.language,
            status: template.status,
            version: template.version,
            usage: template.usage,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('알림 템플릿 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 템플릿 목록을 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 알림 재시도
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async retryNotification(req, res) {
    try {
      const { id } = req.params;
      const { channelType } = req.body;
      const userId = req.user.id;

      if (!channelType) {
        return res.status(400).json({
          success: false,
          message: '채널 유형이 필요합니다.'
        });
      }

      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '알림을 찾을 수 없습니다.'
        });
      }

      await notificationService.retryNotification(id, channelType);

      res.json({
        success: true,
        message: '알림 재시도가 완료되었습니다.'
      });
    } catch (error) {
      logger.error('알림 재시도 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 재시도 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 서비스 상태 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getServiceStatus(req, res) {
    try {
      const status = notificationService.getServiceStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('서비스 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '서비스 상태를 조회하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

// 컨트롤러 인스턴스 생성 및 내보내기
const notificationController = new NotificationController();

export default notificationController; 