/**
 * Notification Routes - 알림 시스템 API 라우트
 * 알림 관련 HTTP 엔드포인트 정의
 * 
 * @description
 * - 알림 CRUD 작업 라우트
 * - 알림 템플릿 관리 라우트
 * - 알림 설정 및 선호도 관리 라우트
 * - 알림 통계 및 분석 라우트
 * - 웹훅 및 외부 연동 라우트
 * - 권한 체크 및 미들웨어 적용
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * 알림 관련 라우트 그룹
 * 모든 알림 관련 API 엔드포인트를 정의
 */

// ========================================
// 알림 기본 CRUD 라우트
// ========================================

/**
 * GET /api/notifications
 * 사용자의 알림 목록 조회
 * 
 * @query {number} page - 페이지 번호 (기본값: 1)
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query {string} status - 알림 상태 필터
 * @query {string} type - 알림 유형 필터
 * @query {string} category - 알림 카테고리 필터
 * @query {string} priority - 알림 우선순위 필터
 * @query {boolean} unreadOnly - 읽지 않은 알림만 조회
 * @query {string} startDate - 시작 날짜 (ISO 형식)
 * @query {string} endDate - 종료 날짜 (ISO 형식)
 * 
 * @response {Object} 알림 목록 및 페이지네이션 정보
 */
router.get('/',
  authenticateToken,
  notificationController.getNotifications
);

/**
 * GET /api/notifications/:id
 * 특정 알림 상세 조회
 * 
 * @param {string} id - 알림 ID
 * 
 * @response {Object} 알림 상세 정보
 */
router.get('/:id',
  authenticateToken,
  notificationController.getNotification
);

/**
 * POST /api/notifications
 * 새로운 알림 생성
 * 
 * @body {string} recipientId - 수신자 ID
 * @body {string} recipientEmail - 수신자 이메일
 * @body {string} recipientName - 수신자 이름
 * @body {string} title - 알림 제목
 * @body {string} message - 알림 메시지
 * @body {string} type - 알림 유형
 * @body {string} category - 알림 카테고리
 * @body {string} priority - 알림 우선순위 (기본값: medium)
 * @body {Array} channels - 알림 채널 배열 (기본값: ['in_app'])
 * @body {Object} data - 알림 데이터
 * @body {Object} scheduling - 스케줄링 정보
 * @body {string} templateId - 템플릿 ID (선택사항)
 * 
 * @response {Object} 생성된 알림 정보
 */
router.post('/',
  authenticateToken,
  checkRole(['admin', 'manager', 'user']),
  validateRequest({
    body: {
      recipientId: { type: 'string', required: true },
      recipientEmail: { type: 'string', required: true, format: 'email' },
      recipientName: { type: 'string', required: true, maxLength: 100 },
      title: { type: 'string', required: true, maxLength: 200 },
      message: { type: 'string', required: true, maxLength: 1000 },
      type: { type: 'string', required: true },
      category: { type: 'string', required: true },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      channels: { type: 'array', items: { type: 'string' } },
      data: { type: 'object' },
      scheduling: { type: 'object' },
      templateId: { type: 'string' }
    }
  }),
  notificationController.createNotification
);

/**
 * DELETE /api/notifications/:id
 * 알림 삭제 (소프트 삭제)
 * 
 * @param {string} id - 알림 ID
 * 
 * @response {Object} 삭제 결과
 */
router.delete('/:id',
  authenticateToken,
  notificationController.deleteNotification
);

// ========================================
// 알림 읽음 처리 라우트
// ========================================

/**
 * PATCH /api/notifications/:id/read
 * 알림 읽음 처리
 * 
 * @param {string} id - 알림 ID
 * 
 * @response {Object} 읽음 처리 결과
 */
router.patch('/:id/read',
  authenticateToken,
  notificationController.markAsRead
);

/**
 * PATCH /api/notifications/read-multiple
 * 여러 알림 일괄 읽음 처리
 * 
 * @body {Array} notificationIds - 알림 ID 배열
 * 
 * @response {Object} 일괄 읽음 처리 결과
 */
router.patch('/read-multiple',
  authenticateToken,
  validateRequest({
    body: {
      notificationIds: { type: 'array', required: true, items: { type: 'string' } }
    }
  }),
  notificationController.markMultipleAsRead
);

/**
 * PATCH /api/notifications/read-all
 * 모든 알림 읽음 처리
 * 
 * @response {Object} 전체 읽음 처리 결과
 */
router.patch('/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

// ========================================
// 템플릿 기반 알림 라우트
// ========================================

/**
 * POST /api/notifications/template
 * 템플릿 기반 알림 전송
 * 
 * @body {string} templateType - 템플릿 유형
 * @body {Object} variables - 템플릿 변수
 * @body {Array} recipients - 수신자 배열
 * @body {Object} options - 추가 옵션
 * 
 * @response {Object} 템플릿 기반 알림 전송 결과
 */
router.post('/template',
  authenticateToken,
  checkRole(['admin', 'manager']),
  validateRequest({
    body: {
      templateType: { type: 'string', required: true },
      variables: { type: 'object' },
      recipients: { 
        type: 'array', 
        required: true, 
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string', required: true },
            email: { type: 'string', required: true, format: 'email' },
            name: { type: 'string', required: true },
            language: { type: 'string' },
            notificationPreferences: { type: 'object' }
          }
        }
      },
      options: { type: 'object' }
    }
  }),
  notificationController.sendTemplatedNotification
);

// ========================================
// 알림 템플릿 관리 라우트
// ========================================

/**
 * GET /api/notifications/templates
 * 알림 템플릿 목록 조회
 * 
 * @query {number} page - 페이지 번호 (기본값: 1)
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query {string} type - 템플릿 유형 필터
 * @query {string} category - 템플릿 카테고리 필터
 * @query {string} status - 템플릿 상태 필터 (기본값: active)
 * @query {string} language - 언어 필터 (기본값: ko)
 * 
 * @response {Object} 템플릿 목록 및 페이지네이션 정보
 */
router.get('/templates',
  authenticateToken,
  checkRole(['admin', 'manager']),
  notificationController.getNotificationTemplates
);

// ========================================
// 알림 설정 관리 라우트
// ========================================

/**
 * GET /api/notifications/settings
 * 사용자 알림 설정 조회
 * 
 * @response {Object} 알림 설정 정보
 */
router.get('/settings',
  authenticateToken,
  notificationController.getNotificationSettings
);

/**
 * PUT /api/notifications/settings
 * 사용자 알림 설정 업데이트
 * 
 * @body {Object} notificationPreferences - 알림 선호도 설정
 * 
 * @response {Object} 업데이트된 알림 설정
 */
router.put('/settings',
  authenticateToken,
  validateRequest({
    body: {
      notificationPreferences: {
        type: 'object',
        properties: {
          email: { type: 'boolean' },
          push: { type: 'boolean' },
          slack: { type: 'boolean' },
          sms: { type: 'boolean' },
          in_app: { type: 'boolean' }
        }
      }
    }
  }),
  notificationController.updateNotificationSettings
);

// ========================================
// 알림 통계 및 분석 라우트
// ========================================

/**
 * GET /api/notifications/stats
 * 알림 통계 조회
 * 
 * @query {string} startDate - 시작 날짜 (ISO 형식)
 * @query {string} endDate - 종료 날짜 (ISO 형식)
 * 
 * @response {Object} 알림 통계 정보
 */
router.get('/stats',
  authenticateToken,
  notificationController.getNotificationStats
);

// ========================================
// 알림 재시도 및 관리 라우트
// ========================================

/**
 * POST /api/notifications/:id/retry
 * 알림 재시도
 * 
 * @param {string} id - 알림 ID
 * @body {string} channelType - 재시도할 채널 유형
 * 
 * @response {Object} 재시도 결과
 */
router.post('/:id/retry',
  authenticateToken,
  checkRole(['admin', 'manager']),
  validateRequest({
    body: {
      channelType: { type: 'string', required: true, enum: ['email', 'push', 'slack', 'sms', 'in_app', 'webhook'] }
    }
  }),
  notificationController.retryNotification
);

// ========================================
// 서비스 상태 및 관리 라우트
// ========================================

/**
 * GET /api/notifications/status
 * 알림 서비스 상태 조회
 * 
 * @response {Object} 서비스 상태 정보
 */
router.get('/status',
  authenticateToken,
  checkRole(['admin']),
  notificationController.getServiceStatus
);

// ========================================
// 웹훅 및 외부 연동 라우트
// ========================================

/**
 * POST /api/notifications/webhook
 * 외부 서비스에서 알림 생성 웹훅
 * 
 * @body {Object} webhookData - 웹훅 데이터
 * 
 * @response {Object} 웹훅 처리 결과
 */
router.post('/webhook',
  validateRequest({
    body: {
      type: { type: 'string', required: true },
      recipient: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          email: { type: 'string', required: true, format: 'email' },
          name: { type: 'string', required: true }
        }
      },
      content: {
        type: 'object',
        properties: {
          title: { type: 'string', required: true },
          message: { type: 'string', required: true }
        }
      },
      data: { type: 'object' },
      channels: { type: 'array', items: { type: 'string' } },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
    }
  }),
  async (req, res) => {
    try {
      const { type, recipient, content, data, channels, priority } = req.body;

      // 웹훅 데이터를 알림 데이터로 변환
      const notificationData = {
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        title: content.title,
        message: content.message,
        type,
        category: 'general',
        priority: priority || 'medium',
        channels: (channels || ['in_app']).map(channel => ({
          type: channel,
          enabled: true,
          status: 'pending'
        })),
        data: data || {},
        metadata: {
          source: 'webhook',
          sourceId: req.headers['x-webhook-id'] || 'unknown'
        }
      };

      // 알림 생성 및 전송
      const notification = await notificationController.createNotification({
        body: notificationData,
        user: { id: 'system', name: 'Webhook System' }
      }, res);

      res.json({
        success: true,
        message: '웹훅 알림이 성공적으로 처리되었습니다.',
        data: {
          notificationId: notification._id
        }
      });
    } catch (error) {
      logger.error('웹훅 알림 처리 실패:', error);
      res.status(500).json({
        success: false,
        message: '웹훅 알림을 처리하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
);

// ========================================
// 실시간 알림 라우트 (WebSocket 대체)
// ========================================

/**
 * GET /api/notifications/realtime
 * 실시간 알림 스트림 (Server-Sent Events)
 * 
 * @response {EventStream} 실시간 알림 이벤트 스트림
 */
router.get('/realtime',
  authenticateToken,
  (req, res) => {
    // SSE 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const userId = req.user.id;
    const clientId = `${userId}-${Date.now()}`;

    // 클라이언트 연결 관리
    const clients = req.app.locals.notificationClients || new Map();
    req.app.locals.notificationClients = clients;

    // 클라이언트 등록
    clients.set(clientId, res);

    // 연결 유지를 위한 하트비트
    const heartbeat = setInterval(() => {
      res.write('data: {"type": "heartbeat", "timestamp": "' + new Date().toISOString() + '"}\n\n');
    }, 30000);

    // 클라이언트 연결 해제 처리
    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(clientId);
    });

    // 초기 연결 메시지
    res.write(`data: {"type": "connected", "clientId": "${clientId}", "timestamp": "${new Date().toISOString()}"}\n\n`);
  }
);

// ========================================
// 알림 일괄 작업 라우트
// ========================================

/**
 * POST /api/notifications/bulk
 * 알림 일괄 생성
 * 
 * @body {Array} notifications - 알림 데이터 배열
 * 
 * @response {Object} 일괄 생성 결과
 */
router.post('/bulk',
  authenticateToken,
  checkRole(['admin', 'manager']),
  validateRequest({
    body: {
      notifications: {
        type: 'array',
        required: true,
        items: {
          type: 'object',
          properties: {
            recipientId: { type: 'string', required: true },
            recipientEmail: { type: 'string', required: true, format: 'email' },
            recipientName: { type: 'string', required: true },
            title: { type: 'string', required: true },
            message: { type: 'string', required: true },
            type: { type: 'string', required: true },
            category: { type: 'string', required: true },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            channels: { type: 'array', items: { type: 'string' } },
            data: { type: 'object' }
          }
        }
      }
    }
  }),
  async (req, res) => {
    try {
      const { notifications } = req.body;
      const senderId = req.user.id;
      const senderName = req.user.name;

      const results = [];
      const errors = [];

      // 각 알림 생성
      for (const notificationData of notifications) {
        try {
          const notification = await notificationController.createNotification({
            body: {
              ...notificationData,
              senderId,
              senderName
            },
            user: req.user
          }, {
            status: (code) => ({ statusCode: code }),
            json: (data) => data
          });

          results.push({
            recipientId: notificationData.recipientId,
            notificationId: notification.data.id,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            recipientId: notificationData.recipientId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `일괄 알림 생성 완료: ${results.length}개 성공, ${errors.length}개 실패`,
        data: {
          results,
          errors
        }
      });
    } catch (error) {
      logger.error('일괄 알림 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '일괄 알림을 생성하는 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
);

// ========================================
// 알림 검색 및 필터링 라우트
// ========================================

/**
 * GET /api/notifications/search
 * 알림 검색
 * 
 * @query {string} q - 검색어
 * @query {string} type - 알림 유형 필터
 * @query {string} category - 알림 카테고리 필터
 * @query {string} status - 알림 상태 필터
 * @query {string} startDate - 시작 날짜
 * @query {string} endDate - 종료 날짜
 * @query {number} page - 페이지 번호
 * @query {number} limit - 페이지당 항목 수
 * 
 * @response {Object} 검색 결과 및 페이지네이션
 */
router.get('/search',
  authenticateToken,
  async (req, res) => {
    try {
      const { 
        q, 
        type, 
        category, 
        status, 
        startDate, 
        endDate,
        page = 1, 
        limit = 20 
      } = req.query;

      const userId = req.user.id;
      const skip = (page - 1) * limit;

      // 검색 조건 구성
      const query = { recipientId: userId, status: { $ne: 'cancelled' } };
      
      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { message: { $regex: q, $options: 'i' } }
        ];
      }
      
      if (type) query.type = type;
      if (category) query.category = category;
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // 검색 실행
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('senderId', 'name email')
        .lean();

      const total = await Notification.countDocuments(query);

      res.json({
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
            sender: notification.senderId,
            createdAt: notification.createdAt
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
      logger.error('알림 검색 실패:', error);
      res.status(500).json({
        success: false,
        message: '알림 검색 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
);

// 라우터 내보내기
export default router; 