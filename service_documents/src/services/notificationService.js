/**
 * Notification Service - 알림 시스템 서비스
 * 다양한 채널을 통한 알림 전송 및 관리 서비스
 * 
 * @description
 * - 다중 채널 알림 전송 (이메일, 푸시, 슬랙, SMS, 웹훅 등)
 * - 알림 템플릿 기반 동적 콘텐츠 생성
 * - 스케줄링 및 재시도 로직
 * - 알림 상태 추적 및 이력 관리
 * - 다른 서비스와의 연동을 위한 이벤트 시스템
 * - 확장성을 고려한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { logger } from '../config/logger.js';
import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import User from '../models/User.js';

/**
 * 알림 서비스 클래스
 * 다양한 채널을 통한 알림 전송 및 관리를 담당
 */
class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.slackClient = null;
    this.pushProviders = new Map();
    this.webhookClients = new Map();
    
    // 설정 초기화
    this.initializeProviders();
    
    // 이벤트 리스너 등록
    this.setupEventHandlers();
  }

  /**
   * 알림 제공자 초기화
   * 이메일, 슬랙, 푸시 등 각 채널별 클라이언트 설정
   */
  initializeProviders() {
    try {
      // 이메일 전송기 초기화
      this.initializeEmailProvider();
      
      // 슬랙 클라이언트 초기화
      this.initializeSlackProvider();
      
      // 푸시 알림 제공자 초기화
      this.initializePushProviders();
      
      // 웹훅 클라이언트 초기화
      this.initializeWebhookClients();
      
      logger.info('✅ 알림 제공자 초기화 완료');
    } catch (error) {
      logger.error('❌ 알림 제공자 초기화 실패:', error);
    }
  }

  /**
   * 이메일 제공자 초기화
   */
  initializeEmailProvider() {
    if (process.env.EMAIL_PROVIDER === 'smtp') {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      // SendGrid 설정 (구현 예정)
      logger.info('SendGrid 이메일 제공자 설정됨');
    } else if (process.env.EMAIL_PROVIDER === 'aws-ses') {
      // AWS SES 설정 (구현 예정)
      logger.info('AWS SES 이메일 제공자 설정됨');
    }
  }

  /**
   * 슬랙 제공자 초기화
   */
  initializeSlackProvider() {
    if (process.env.SLACK_BOT_TOKEN) {
      this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
      logger.info('Slack 클라이언트 초기화 완료');
    }
  }

  /**
   * 푸시 알림 제공자 초기화
   */
  initializePushProviders() {
    // Firebase Cloud Messaging (FCM)
    if (process.env.FCM_SERVER_KEY) {
      this.pushProviders.set('fcm', {
        type: 'fcm',
        config: {
          serverKey: process.env.FCM_SERVER_KEY
        }
      });
    }

    // Apple Push Notification Service (APNS)
    if (process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
      this.pushProviders.set('apns', {
        type: 'apns',
        config: {
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID,
          keyPath: process.env.APNS_KEY_PATH
        }
      });
    }

    // 기타 푸시 제공자들 (구현 예정)
  }

  /**
   * 웹훅 클라이언트 초기화
   */
  initializeWebhookClients() {
    // 기본 웹훅 설정
    if (process.env.DEFAULT_WEBHOOK_URL) {
      this.webhookClients.set('default', {
        url: process.env.DEFAULT_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
        }
      });
    }
  }

  /**
   * 알림 생성 및 전송
   * @param {Object} notificationData - 알림 데이터
   * @returns {Promise<Object>} 생성된 알림 객체
   */
  async createAndSendNotification(notificationData) {
    try {
      // 알림 생성
      const notification = new Notification(notificationData);
      await notification.save();

      // 알림 전송
      await this.sendNotification(notification);

      logger.info(`📧 알림 생성 및 전송 완료: ${notification._id}`);
      return notification;
    } catch (error) {
      logger.error('알림 생성 및 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿 기반 알림 생성 및 전송
   * @param {String} templateType - 템플릿 유형
   * @param {Object} variables - 템플릿 변수
   * @param {Object} recipientData - 수신자 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 생성된 알림 객체
   */
  async sendTemplatedNotification(templateType, variables, recipientData, options = {}) {
    try {
      // 템플릿 조회
      const template = await NotificationTemplate.findByType(templateType, {
        language: recipientData.language || 'ko'
      }).limit(1);

      if (!template || template.length === 0) {
        throw new Error(`템플릿을 찾을 수 없습니다: ${templateType}`);
      }

      const selectedTemplate = template[0];

      // 알림 데이터 구성
      const notificationData = {
        recipientId: recipientData.userId,
        recipientEmail: recipientData.email,
        recipientName: recipientData.name,
        senderId: options.senderId,
        senderName: options.senderName,
        type: templateType,
        category: selectedTemplate.category,
        priority: options.priority || selectedTemplate.metadata.priority,
        channels: this.buildChannelsFromTemplate(selectedTemplate, recipientData),
        data: {
          ...variables,
          templateId: selectedTemplate._id,
          templateName: selectedTemplate.name
        },
        scheduling: options.scheduling || {},
        metadata: {
          source: options.source || 'api',
          templateId: selectedTemplate._id
        }
      };

      // 알림 생성 및 전송
      const notification = await this.createAndSendNotification(notificationData);

      // 템플릿 사용 통계 업데이트
      await selectedTemplate.incrementUsage(true);

      logger.info(`📧 템플릿 기반 알림 전송 완료: ${templateType} -> ${recipientData.email}`);
      return notification;
    } catch (error) {
      logger.error('템플릿 기반 알림 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 템플릿에서 채널 설정 구성
   * @param {Object} template - 알림 템플릿
   * @param {Object} recipientData - 수신자 데이터
   * @returns {Array} 채널 설정 배열
   */
  buildChannelsFromTemplate(template, recipientData) {
    const channels = [];
    const userPreferences = recipientData.notificationPreferences || {};

    // 이메일 채널
    if (template.channels.email && userPreferences.email !== false) {
      channels.push({
        type: 'email',
        enabled: true,
        status: 'pending'
      });
    }

    // 푸시 알림 채널
    if (template.channels.push && userPreferences.push !== false && recipientData.pushToken) {
      channels.push({
        type: 'push',
        enabled: true,
        status: 'pending'
      });
    }

    // 슬랙 채널
    if (template.channels.slack && userPreferences.slack !== false && recipientData.slackUserId) {
      channels.push({
        type: 'slack',
        enabled: true,
        status: 'pending'
      });
    }

    // SMS 채널
    if (template.channels.sms && userPreferences.sms !== false && recipientData.phoneNumber) {
      channels.push({
        type: 'sms',
        enabled: true,
        status: 'pending'
      });
    }

    // 앱 내 알림 채널
    if (template.channels.in_app && userPreferences.in_app !== false) {
      channels.push({
        type: 'in_app',
        enabled: true,
        status: 'pending'
      });
    }

    return channels;
  }

  /**
   * 알림 전송 처리
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendNotification(notification) {
    try {
      // 알림 상태를 전송 중으로 변경
      notification.status = 'sending';
      await notification.save();

      // 각 채널별로 알림 전송
      const sendPromises = notification.channels
        .filter(channel => channel.enabled)
        .map(channel => this.sendToChannel(notification, channel.type));

      // 모든 채널 전송 완료 대기
      await Promise.allSettled(sendPromises);

      // 전송 결과 확인
      const failedChannels = notification.channels.filter(c => c.status === 'failed');
      if (failedChannels.length === notification.channels.length) {
        notification.status = 'failed';
      } else if (failedChannels.length === 0) {
        notification.status = 'sent';
      } else {
        notification.status = 'sent'; // 일부 성공
      }

      await notification.save();

      logger.info(`📧 알림 전송 완료: ${notification._id} (${notification.status})`);
    } catch (error) {
      logger.error('알림 전송 실패:', error);
      notification.status = 'failed';
      await notification.save();
      throw error;
    }
  }

  /**
   * 특정 채널로 알림 전송
   * @param {Object} notification - 알림 객체
   * @param {String} channelType - 채널 유형
   * @returns {Promise<void>}
   */
  async sendToChannel(notification, channelType) {
    try {
      const channelData = notification.channels.find(c => c.type === channelType);
      if (!channelData || !channelData.enabled) {
        return;
      }

      // 채널별 전송 로직
      switch (channelType) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        case 'slack':
          await this.sendSlackMessage(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'in_app':
          await this.sendInAppNotification(notification);
          break;
        case 'webhook':
          await this.sendWebhook(notification);
          break;
        default:
          logger.warn(`지원하지 않는 채널: ${channelType}`);
      }

      // 전송 성공 처리
      await notification.markAsSent(channelType);
    } catch (error) {
      logger.error(`${channelType} 채널 전송 실패:`, error);
      await notification.markAsFailed(channelType, error.message);
      throw error;
    }
  }

  /**
   * 이메일 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendEmail(notification) {
    if (!this.emailTransporter) {
      throw new Error('이메일 전송기가 설정되지 않았습니다.');
    }

    // 템플릿 기반 이메일 렌더링
    let emailContent = {
      subject: notification.title,
      body: notification.message
    };

    if (notification.template && notification.template.templateId) {
      const template = await NotificationTemplate.findById(notification.template.templateId);
      if (template) {
        emailContent = template.renderTemplate('email', notification.data);
      }
    }

    // 이메일 전송
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: notification.recipientEmail,
      subject: emailContent.subject,
      text: emailContent.body,
      html: emailContent.htmlBody
    };

    await this.emailTransporter.sendMail(mailOptions);
    logger.info(`📧 이메일 전송 완료: ${notification.recipientEmail}`);
  }

  /**
   * 푸시 알림 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendPushNotification(notification) {
    // 사용자 푸시 토큰 조회
    const user = await User.findById(notification.recipientId);
    if (!user || !user.pushToken) {
      throw new Error('사용자의 푸시 토큰이 없습니다.');
    }

    // 템플릿 기반 푸시 알림 렌더링
    let pushContent = {
      title: notification.title,
      body: notification.message
    };

    if (notification.template && notification.template.templateId) {
      const template = await NotificationTemplate.findById(notification.template.templateId);
      if (template) {
        pushContent = template.renderTemplate('push', notification.data);
      }
    }

    // FCM을 통한 푸시 알림 전송
    if (this.pushProviders.has('fcm')) {
      await this.sendFCMNotification(user.pushToken, pushContent);
    }

    // APNS를 통한 푸시 알림 전송 (iOS)
    if (this.pushProviders.has('apns')) {
      await this.sendAPNSNotification(user.pushToken, pushContent);
    }

    logger.info(`📱 푸시 알림 전송 완료: ${notification.recipientId}`);
  }

  /**
   * FCM 푸시 알림 전송
   * @param {String} token - FCM 토큰
   * @param {Object} content - 알림 내용
   * @returns {Promise<void>}
   */
  async sendFCMNotification(token, content) {
    const fcmProvider = this.pushProviders.get('fcm');
    if (!fcmProvider) {
      throw new Error('FCM 제공자가 설정되지 않았습니다.');
    }

    const message = {
      to: token,
      notification: {
        title: content.title,
        body: content.body,
        image: content.imageUrl
      },
      data: content.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: content.badge || 1
          }
        }
      }
    };

    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      message,
      {
        headers: {
          'Authorization': `key=${fcmProvider.config.serverKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.failure > 0) {
      throw new Error(`FCM 전송 실패: ${response.data.results[0].error}`);
    }
  }

  /**
   * APNS 푸시 알림 전송
   * @param {String} token - APNS 토큰
   * @param {Object} content - 알림 내용
   * @returns {Promise<void>}
   */
  async sendAPNSNotification(token, content) {
    // APNS 구현 (구현 예정)
    logger.info('APNS 푸시 알림 전송 (구현 예정)');
  }

  /**
   * 슬랙 메시지 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendSlackMessage(notification) {
    if (!this.slackClient) {
      throw new Error('Slack 클라이언트가 설정되지 않았습니다.');
    }

    // 사용자 슬랙 ID 조회
    const user = await User.findById(notification.recipientId);
    if (!user || !user.slackUserId) {
      throw new Error('사용자의 Slack ID가 없습니다.');
    }

    // 템플릿 기반 슬랙 메시지 렌더링
    let slackContent = {
      text: notification.message
    };

    if (notification.template && notification.template.templateId) {
      const template = await NotificationTemplate.findById(notification.template.templateId);
      if (template) {
        slackContent = template.renderTemplate('slack', notification.data);
      }
    }

    // 슬랙 메시지 전송
    await this.slackClient.chat.postMessage({
      channel: user.slackUserId,
      text: slackContent.text,
      blocks: slackContent.blocks,
      attachments: slackContent.attachments
    });

    logger.info(`💬 Slack 메시지 전송 완료: ${notification.recipientId}`);
  }

  /**
   * SMS 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendSMS(notification) {
    // 사용자 전화번호 조회
    const user = await User.findById(notification.recipientId);
    if (!user || !user.phoneNumber) {
      throw new Error('사용자의 전화번호가 없습니다.');
    }

    // 템플릿 기반 SMS 메시지 렌더링
    let smsContent = {
      message: notification.message
    };

    if (notification.template && notification.template.templateId) {
      const template = await NotificationTemplate.findById(notification.template.templateId);
      if (template) {
        smsContent = template.renderTemplate('sms', notification.data);
      }
    }

    // SMS 전송 (구현 예정)
    logger.info(`📱 SMS 전송 (구현 예정): ${user.phoneNumber}`);
  }

  /**
   * 앱 내 알림 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendInAppNotification(notification) {
    // 앱 내 알림은 실시간으로 처리되므로 여기서는 로깅만
    logger.info(`📱 앱 내 알림 생성: ${notification.recipientId}`);
    
    // 실시간 알림을 위한 이벤트 발생
    process.emit('in_app_notification', {
      userId: notification.recipientId,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        createdAt: notification.createdAt
      }
    });
  }

  /**
   * 웹훅 전송
   * @param {Object} notification - 알림 객체
   * @returns {Promise<void>}
   */
  async sendWebhook(notification) {
    const webhookClient = this.webhookClients.get('default');
    if (!webhookClient) {
      throw new Error('웹훅 클라이언트가 설정되지 않았습니다.');
    }

    const webhookData = {
      notificationId: notification._id,
      type: notification.type,
      recipient: {
        id: notification.recipientId,
        email: notification.recipientEmail,
        name: notification.recipientName
      },
      content: {
        title: notification.title,
        message: notification.message
      },
      data: notification.data,
      timestamp: notification.createdAt
    };

    await axios.post(webhookClient.url, webhookData, {
      headers: webhookClient.headers
    });

    logger.info(`🔗 웹훅 전송 완료: ${notification._id}`);
  }

  /**
   * 스케줄된 알림 처리
   * @returns {Promise<void>}
   */
  async processScheduledNotifications() {
    try {
      const scheduledNotifications = await Notification.findPendingScheduled();
      
      for (const notification of scheduledNotifications) {
        try {
          await this.sendNotification(notification);
        } catch (error) {
          logger.error(`스케줄된 알림 전송 실패: ${notification._id}`, error);
        }
      }

      logger.info(`⏰ 스케줄된 알림 처리 완료: ${scheduledNotifications.length}개`);
    } catch (error) {
      logger.error('스케줄된 알림 처리 실패:', error);
    }
  }

  /**
   * 만료된 알림 처리
   * @returns {Promise<void>}
   */
  async processExpiredNotifications() {
    try {
      const expiredNotifications = await Notification.findExpired();
      
      for (const notification of expiredNotifications) {
        notification.status = 'expired';
        await notification.save();
      }

      logger.info(`⏰ 만료된 알림 처리 완료: ${expiredNotifications.length}개`);
    } catch (error) {
      logger.error('만료된 알림 처리 실패:', error);
    }
  }

  /**
   * 알림 재시도 처리
   * @param {String} notificationId - 알림 ID
   * @param {String} channelType - 채널 유형
   * @returns {Promise<void>}
   */
  async retryNotification(notificationId, channelType) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      await notification.retry(channelType);
      await this.sendToChannel(notification, channelType);

      logger.info(`🔄 알림 재시도 완료: ${notificationId} (${channelType})`);
    } catch (error) {
      logger.error('알림 재시도 실패:', error);
      throw error;
    }
  }

  /**
   * 이벤트 리스너 설정 (다른 서비스와의 연동용)
   */
  setupEventHandlers() {
    // 문서 관련 이벤트
    process.on('document_created', (data) => {
      this.handleDocumentEvent('document_created', data);
    });

    process.on('document_updated', (data) => {
      this.handleDocumentEvent('document_updated', data);
    });

    process.on('document_commented', (data) => {
      this.handleDocumentEvent('document_commented', data);
    });

    // 협업 관련 이벤트
    process.on('collaboration_invite', (data) => {
      this.handleCollaborationEvent('collaboration_invite', data);
    });

    // 승인 관련 이벤트
    process.on('approval_request', (data) => {
      this.handleApprovalEvent('approval_request', data);
    });
  }

  /**
   * 문서 이벤트 처리
   * @param {String} eventType - 이벤트 유형
   * @param {Object} data - 이벤트 데이터
   */
  async handleDocumentEvent(eventType, data) {
    try {
      const { documentId, userId, documentTitle, commentContent } = data;

      // 문서 소유자 조회
      const document = await Document.findById(documentId);
      if (!document) return;

      // 알림 수신자 목록 구성
      const recipients = [document.createdBy];
      
      // 문서 권한이 있는 사용자들 추가
      document.permissions.forEach(permission => {
        if (!recipients.includes(permission.userId)) {
          recipients.push(permission.userId);
        }
      });

      // 각 수신자에게 알림 전송
      for (const recipientId of recipients) {
        if (recipientId === userId) continue; // 발신자는 제외

        const recipient = await User.findById(recipientId);
        if (!recipient) continue;

        const variables = {
          documentTitle,
          documentId,
          commentContent,
          userName: recipient.name
        };

        await this.sendTemplatedNotification(
          eventType,
          variables,
          {
            userId: recipient._id,
            email: recipient.email,
            name: recipient.name,
            language: recipient.language || 'ko',
            notificationPreferences: recipient.notificationPreferences
          }
        );
      }
    } catch (error) {
      logger.error('문서 이벤트 처리 실패:', error);
    }
  }

  /**
   * 협업 이벤트 처리
   * @param {String} eventType - 이벤트 유형
   * @param {Object} data - 이벤트 데이터
   */
  async handleCollaborationEvent(eventType, data) {
    try {
      const { documentId, inviterId, inviteeId, documentTitle } = data;

      const invitee = await User.findById(inviteeId);
      if (!invitee) return;

      const inviter = await User.findById(inviterId);
      if (!inviter) return;

      const variables = {
        documentTitle,
        documentId,
        inviterName: inviter.name,
        inviteeName: invitee.name
      };

      await this.sendTemplatedNotification(
        eventType,
        variables,
        {
          userId: invitee._id,
          email: invitee.email,
          name: invitee.name,
          language: invitee.language || 'ko',
          notificationPreferences: invitee.notificationPreferences
        }
      );
    } catch (error) {
      logger.error('협업 이벤트 처리 실패:', error);
    }
  }

  /**
   * 승인 이벤트 처리
   * @param {String} eventType - 이벤트 유형
   * @param {Object} data - 이벤트 데이터
   */
  async handleApprovalEvent(eventType, data) {
    try {
      const { documentId, requesterId, approverId, documentTitle } = data;

      const approver = await User.findById(approverId);
      if (!approver) return;

      const requester = await User.findById(requesterId);
      if (!requester) return;

      const variables = {
        documentTitle,
        documentId,
        requesterName: requester.name,
        approverName: approver.name
      };

      await this.sendTemplatedNotification(
        eventType,
        variables,
        {
          userId: approver._id,
          email: approver.email,
          name: approver.name,
          language: approver.language || 'ko',
          notificationPreferences: approver.notificationPreferences
        }
      );
    } catch (error) {
      logger.error('승인 이벤트 처리 실패:', error);
    }
  }

  /**
   * 서비스 상태 조회
   * @returns {Object} 서비스 상태 정보
   */
  getServiceStatus() {
    return {
      emailProvider: !!this.emailTransporter,
      slackClient: !!this.slackClient,
      pushProviders: Array.from(this.pushProviders.keys()),
      webhookClients: Array.from(this.webhookClients.keys())
    };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const notificationService = new NotificationService();

export default notificationService; 