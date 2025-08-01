/**
 * Notification Service - 알림 서비스
 * 
 * @description
 * - 다양한 알림 타입 처리 (태스크, 프로젝트, 팀, 시스템 등)
 * - 실시간 알림 (Socket.io)
 * - 이메일, 푸시, 인앱 알림 지원
 * - 알림 템플릿 관리
 * - 알림 스케줄링 및 배치 처리
 * - 알림 통계 및 분석
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Organization from '../models/Organization.js';
import { sendEmail, sendPushNotification } from '../utils/index.js';

class NotificationService {
  constructor() {
    this.socketIO = null;
    this.notificationTemplates = new Map();
    this.scheduledNotifications = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    
    this.initializeTemplates();
    this.startQueueProcessor();
  }

  /**
   * Socket.io 설정
   */
  setSocketIO(io) {
    this.socketIO = io;
    logger.info('🔌 Socket.io가 NotificationService에 설정되었습니다.');
  }

  /**
   * 알림 템플릿 초기화
   */
  initializeTemplates() {
    // 태스크 관련 템플릿
    this.notificationTemplates.set('task_assigned', {
      title: '새로운 태스크가 할당되었습니다',
      body: '{{taskTitle}} 태스크가 {{assignerName}}님에 의해 할당되었습니다.',
      priority: 'medium',
      category: 'task'
    });

    this.notificationTemplates.set('task_completed', {
      title: '태스크가 완료되었습니다',
      body: '{{taskTitle}} 태스크가 {{assigneeName}}님에 의해 완료되었습니다.',
      priority: 'low',
      category: 'task'
    });

    this.notificationTemplates.set('task_overdue', {
      title: '태스크 마감일이 지났습니다',
      body: '{{taskTitle}} 태스크의 마감일이 지났습니다. 확인해주세요.',
      priority: 'high',
      category: 'task'
    });

    this.notificationTemplates.set('task_comment', {
      title: '태스크에 새 댓글이 달렸습니다',
      body: '{{taskTitle}} 태스크에 {{commenterName}}님이 댓글을 남겼습니다.',
      priority: 'medium',
      category: 'task'
    });

    // 프로젝트 관련 템플릿
    this.notificationTemplates.set('project_invitation', {
      title: '프로젝트 초대',
      body: '{{projectName}} 프로젝트에 초대되었습니다.',
      priority: 'medium',
      category: 'project'
    });

    this.notificationTemplates.set('project_role_change', {
      title: '프로젝트 역할 변경',
      body: '{{projectName}} 프로젝트에서 {{newRole}} 역할로 변경되었습니다.',
      priority: 'medium',
      category: 'project'
    });

    // 팀 관련 템플릿
    this.notificationTemplates.set('team_invitation', {
      title: '팀 초대',
      body: '{{teamName}} 팀에 초대되었습니다.',
      priority: 'medium',
      category: 'team'
    });

    // 시스템 알림
    this.notificationTemplates.set('system_maintenance', {
      title: '시스템 점검 안내',
      body: '{{maintenanceMessage}}',
      priority: 'high',
      category: 'system'
    });

    logger.info('📝 알림 템플릿 초기화 완료');
  }

  /**
   * 알림 생성 및 전송
   */
  async createAndSendNotification(notificationData) {
    try {
      const {
        type,
        title,
        body,
        recipients,
        senderId,
        relatedResource,
        priority = 'medium',
        category = 'general',
        scheduledAt = null,
        metadata = {},
        channels = ['in_app', 'email']
      } = notificationData;

      // 템플릿 기반 알림 생성
      const template = this.notificationTemplates.get(type);
      if (template) {
        notificationData.title = notificationData.title || template.title;
        notificationData.body = notificationData.body || template.body;
        notificationData.priority = notificationData.priority || template.priority;
        notificationData.category = notificationData.category || template.category;
      }

      // 알림 객체 생성
      const notification = new Notification({
        type,
        title,
        body,
        recipients: Array.isArray(recipients) ? recipients : [recipients],
        senderId,
        relatedResource,
        priority,
        category,
        scheduledAt,
        metadata,
        channels,
        status: 'pending'
      });

      await notification.save();

      // 즉시 전송 또는 스케줄링
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        this.scheduleNotification(notification);
      } else {
        await this.sendNotification(notification);
      }

      logger.info(`🔔 알림 생성 완료: ${notification._id}`);
      return notification;

    } catch (error) {
      logger.error('❌ 알림 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 전송
   */
  async sendNotification(notification) {
    try {
      const recipients = await User.find({
        _id: { $in: notification.recipients }
      });

      const promises = [];

      // 인앱 알림
      if (notification.channels.includes('in_app')) {
        promises.push(this.sendInAppNotification(notification, recipients));
      }

      // 이메일 알림
      if (notification.channels.includes('email')) {
        promises.push(this.sendEmailNotification(notification, recipients));
      }

      // 푸시 알림
      if (notification.channels.includes('push')) {
        promises.push(this.sendPushNotification(notification, recipients));
      }

      await Promise.all(promises);

      // 알림 상태 업데이트
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

      logger.info(`📤 알림 전송 완료: ${notification._id}`);

    } catch (error) {
      logger.error('❌ 알림 전송 실패:', error);
      
      // 실패 상태 업데이트
      notification.status = 'failed';
      notification.errorMessage = error.message;
      await notification.save();

      throw error;
    }
  }

  /**
   * 인앱 알림 전송 (Socket.io)
   */
  async sendInAppNotification(notification, recipients) {
    if (!this.socketIO) {
      logger.warn('⚠️ Socket.io가 설정되지 않았습니다.');
      return;
    }

    const notificationData = {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      category: notification.category,
      createdAt: notification.createdAt,
      metadata: notification.metadata
    };

    recipients.forEach(recipient => {
      this.socketIO.to(`user:${recipient._id}`).emit('notification', notificationData);
    });

    logger.debug(`📱 인앱 알림 전송: ${recipients.length}명`);
  }

  /**
   * 이메일 알림 전송
   */
  async sendEmailNotification(notification, recipients) {
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const emailData = {
          to: recipient.email,
          subject: notification.title,
          html: this.generateEmailTemplate(notification, recipient),
          text: notification.body
        };

        await sendEmail(emailData);
        logger.debug(`📧 이메일 전송: ${recipient.email}`);

      } catch (error) {
        logger.error(`❌ 이메일 전송 실패 (${recipient.email}):`, error);
      }
    });

    await Promise.all(emailPromises);
  }

  /**
   * 푸시 알림 전송
   */
  async sendPushNotification(notification, recipients) {
    const pushPromises = recipients.map(async (recipient) => {
      try {
        if (recipient.pushTokens && recipient.pushTokens.length > 0) {
          const pushData = {
            tokens: recipient.pushTokens,
            title: notification.title,
            body: notification.body,
            data: {
              notificationId: notification._id.toString(),
              type: notification.type,
              category: notification.category
            }
          };

          await sendPushNotification(pushData);
          logger.debug(`📱 푸시 알림 전송: ${recipient.email}`);
        }

      } catch (error) {
        logger.error(`❌ 푸시 알림 전송 실패 (${recipient.email}):`, error);
      }
    });

    await Promise.all(pushPromises);
  }

  /**
   * 이메일 템플릿 생성
   */
  generateEmailTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>${notification.title}</h2>
            <p>${notification.body}</p>
            <p>안녕하세요, ${recipient.name}님</p>
            <p>이 알림은 Task Manager에서 발송되었습니다.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              알림 설정을 변경하려면 앱 설정에서 확인하세요.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 알림 스케줄링
   */
  scheduleNotification(notification) {
    const delay = new Date(notification.scheduledAt) - new Date();
    
    const timeoutId = setTimeout(async () => {
      try {
        await this.sendNotification(notification);
        this.scheduledNotifications.delete(notification._id.toString());
      } catch (error) {
        logger.error('❌ 스케줄된 알림 전송 실패:', error);
      }
    }, delay);

    this.scheduledNotifications.set(notification._id.toString(), timeoutId);
    logger.info(`⏰ 알림 스케줄링: ${notification._id} (${new Date(notification.scheduledAt).toLocaleString()})`);
  }

  /**
   * 예약된 알림 처리
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        status: 'pending',
        scheduledAt: { $lte: now }
      });

      for (const notification of scheduledNotifications) {
        await this.sendNotification(notification);
      }

      logger.debug(`⏰ ${scheduledNotifications.length}개의 예약된 알림 처리 완료`);

    } catch (error) {
      logger.error('❌ 예약된 알림 처리 실패:', error);
    }
  }

  /**
   * 알림 큐 처리
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.notificationQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const batch = this.notificationQueue.splice(0, 10); // 한 번에 최대 10개 처리
        
        for (const notificationData of batch) {
          try {
            await this.createAndSendNotification(notificationData);
          } catch (error) {
            logger.error('❌ 큐 알림 처리 실패:', error);
          }
        }

      } catch (error) {
        logger.error('❌ 알림 큐 처리 실패:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // 5초마다 처리
  }

  /**
   * 알림을 큐에 추가
   */
  queueNotification(notificationData) {
    this.notificationQueue.push(notificationData);
    logger.debug(`📋 알림 큐에 추가: ${this.notificationQueue.length}개 대기 중`);
  }

  /**
   * 태스크 할당 알림
   */
  async sendTaskAssignmentNotification(task, assignerId) {
    try {
      const assigner = await User.findById(assignerId);
      const assignee = await User.findById(task.assigneeId);

      if (!assignee) return;

      const notificationData = {
        type: 'task_assigned',
        title: '새로운 태스크가 할당되었습니다',
        body: `"${task.title}" 태스크가 ${assigner.name}님에 의해 할당되었습니다.`,
        recipients: [task.assigneeId],
        senderId: assignerId,
        relatedResource: {
          type: 'task',
          id: task._id
        },
        priority: task.priority === 'high' ? 'high' : 'medium',
        category: 'task',
        metadata: {
          taskId: task._id,
          projectId: task.projectId,
          assignerName: assigner.name,
          taskTitle: task.title
        }
      };

      await this.createAndSendNotification(notificationData);

    } catch (error) {
      logger.error('❌ 태스크 할당 알림 전송 실패:', error);
    }
  }

  /**
   * 태스크 상태 변경 알림
   */
  async sendStatusChangeNotification(task, previousStatus, userId) {
    try {
      const user = await User.findById(userId);
      const watchers = await this.getTaskWatchers(task._id);

      if (watchers.length === 0) return;

      const statusLabels = {
        'todo': '할 일',
        'in_progress': '진행 중',
        'review': '검토 중',
        'done': '완료',
        'cancelled': '취소됨'
      };

      const notificationData = {
        type: 'task_status_change',
        title: '태스크 상태가 변경되었습니다',
        body: `"${task.title}" 태스크가 ${statusLabels[previousStatus]}에서 ${statusLabels[task.status]}로 변경되었습니다.`,
        recipients: watchers,
        senderId: userId,
        relatedResource: {
          type: 'task',
          id: task._id
        },
        priority: 'medium',
        category: 'task',
        metadata: {
          taskId: task._id,
          projectId: task.projectId,
          previousStatus,
          newStatus: task.status,
          changedBy: user.name,
          taskTitle: task.title
        }
      };

      await this.createAndSendNotification(notificationData);

    } catch (error) {
      logger.error('❌ 태스크 상태 변경 알림 전송 실패:', error);
    }
  }

  /**
   * 태스크 할당자 변경 알림
   */
  async sendAssigneeChangeNotification(task, previousAssigneeId, userId) {
    try {
      const user = await User.findById(userId);
      const previousAssignee = await User.findById(previousAssigneeId);
      const newAssignee = await User.findById(task.assigneeId);
      const watchers = await this.getTaskWatchers(task._id);

      const recipients = [...new Set([...watchers, task.assigneeId, previousAssigneeId])];

      const notificationData = {
        type: 'task_assignee_change',
        title: '태스크 할당자가 변경되었습니다',
        body: `"${task.title}" 태스크가 ${previousAssignee.name}님에서 ${newAssignee.name}님에게 재할당되었습니다.`,
        recipients,
        senderId: userId,
        relatedResource: {
          type: 'task',
          id: task._id
        },
        priority: 'medium',
        category: 'task',
        metadata: {
          taskId: task._id,
          projectId: task.projectId,
          previousAssigneeId,
          newAssigneeId: task.assigneeId,
          changedBy: user.name,
          taskTitle: task.title
        }
      };

      await this.createAndSendNotification(notificationData);

    } catch (error) {
      logger.error('❌ 태스크 할당자 변경 알림 전송 실패:', error);
    }
  }

  /**
   * 태스크 댓글 알림
   */
  async sendTaskCommentNotification(task, comment, userId) {
    try {
      const user = await User.findById(userId);
      const watchers = await this.getTaskWatchers(task._id);
      const mentionedUsers = this.extractMentionedUsers(comment.content);

      const recipients = [...new Set([...watchers, ...mentionedUsers])];

      if (recipients.length === 0) return;

      const notificationData = {
        type: 'task_comment',
        title: '태스크에 새 댓글이 달렸습니다',
        body: `"${task.title}" 태스크에 ${user.name}님이 댓글을 남겼습니다.`,
        recipients,
        senderId: userId,
        relatedResource: {
          type: 'task',
          id: task._id
        },
        priority: 'medium',
        category: 'task',
        metadata: {
          taskId: task._id,
          projectId: task.projectId,
          commentId: comment._id,
          commenterName: user.name,
          taskTitle: task.title,
          mentionedUsers
        }
      };

      await this.createAndSendNotification(notificationData);

    } catch (error) {
      logger.error('❌ 태스크 댓글 알림 전송 실패:', error);
    }
  }

  /**
   * 태스크 감시자 목록 조회
   */
  async getTaskWatchers(taskId) {
    try {
      const task = await Task.findById(taskId).populate('projectId');
      const watchers = new Set();

      // 태스크 할당자
      if (task.assigneeId) {
        watchers.add(task.assigneeId.toString());
      }

      // 프로젝트 멤버들
      if (task.projectId && task.projectId.members) {
        task.projectId.members.forEach(member => {
          watchers.add(member.userId.toString());
        });
      }

      return Array.from(watchers);

    } catch (error) {
      logger.error('❌ 태스크 감시자 조회 실패:', error);
      return [];
    }
  }

  /**
   * 멘션된 사용자 추출
   */
  extractMentionedUsers(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    
    if (!mentions) return [];

    // 실제 사용자 ID로 변환하는 로직 필요
    // 여기서는 간단히 빈 배열 반환
    return [];
  }

  /**
   * 알림 통계 조회
   */
  async getNotificationStats(userId, timeRange = '7d') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = await Notification.aggregate([
        {
          $match: {
            recipients: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              category: '$category',
              priority: '$priority'
            },
            count: { $sum: 1 }
          }
        }
      ]);

      return stats;

    } catch (error) {
      logger.error('❌ 알림 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(userId) {
    try {
      const user = await User.findById(userId);
      return user.notificationSettings || {
        email: true,
        push: true,
        inApp: true,
        categories: {
          task: true,
          project: true,
          team: true,
          system: true
        }
      };

    } catch (error) {
      logger.error('❌ 알림 설정 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { notificationSettings: settings },
        { new: true }
      );

      logger.info(`⚙️ 알림 설정 업데이트: ${userId}`);
      return user.notificationSettings;

    } catch (error) {
      logger.error('❌ 알림 설정 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipients: userId
        },
        {
          $set: {
            'readStatus.userId': {
              readAt: new Date(),
              read: true
            }
          }
        },
        { new: true }
      );

      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      logger.info(`👁️ 알림 읽음 처리: ${notificationId}`);
      return notification;

    } catch (error) {
      logger.error('❌ 알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          recipients: userId,
          'readStatus.userId.read': { $ne: true }
        },
        {
          $set: {
            'readStatus.userId': {
              readAt: new Date(),
              read: true
            }
          }
        }
      );

      logger.info(`👁️ 모든 알림 읽음 처리: ${result.modifiedCount}개`);
      return result;

    } catch (error) {
      logger.error('❌ 모든 알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipients: userId
      });

      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      logger.info(`🗑️ 알림 삭제: ${notificationId}`);
      return notification;

    } catch (error) {
      logger.error('❌ 알림 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 서비스 상태 조회
   */
  getServiceStatus() {
    return {
      isRunning: true,
      queueLength: this.notificationQueue.length,
      scheduledCount: this.scheduledNotifications.size,
      isProcessing: this.isProcessing,
      socketConnected: !!this.socketIO
    };
  }

  /**
   * 서비스 정리
   */
  async cleanup() {
    try {
      // 스케줄된 알림 취소
      this.scheduledNotifications.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.scheduledNotifications.clear();

      // 큐 정리
      this.notificationQueue = [];
      this.isProcessing = false;

      logger.info('🧹 NotificationService 정리 완료');

    } catch (error) {
      logger.error('❌ NotificationService 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성
const notificationService = new NotificationService();

export default notificationService; 