/**
 * Notifications Router - 알림 라우터
 * 알림 관리 API 엔드포인트 정의
 *
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    사용자 알림 목록 조회
 * @access  Private
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    읽지 않은 알림 개수 조회
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    알림 통계 조회
 * @access  Private
 */
router.get('/stats', notificationController.getNotificationStats);

/**
 * @route   GET /api/notifications/settings
 * @desc    알림 설정 조회
 * @access  Private
 */
router.get('/settings', notificationController.getNotificationSettings);

/**
 * @route   PUT /api/notifications/settings
 * @desc    알림 설정 업데이트
 * @access  Private
 */
router.put('/settings', notificationController.updateNotificationSettings);

/**
 * @route   GET /api/notifications/status
 * @desc    서비스 상태 조회
 * @access  Private
 */
router.get('/status', notificationController.getServiceStatus);

/**
 * @route   GET /api/notifications/:notificationId
 * @desc    알림 상세 조회
 * @access  Private
 */
router.get('/:notificationId', notificationController.getNotificationById);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    알림 읽음 처리
 * @access  Private
 */
router.put('/:notificationId/read', notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-multiple
 * @desc    여러 알림 읽음 처리
 * @access  Private
 */
router.put('/read-multiple', notificationController.markMultipleAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    모든 알림 읽음 처리
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    알림 삭제
 * @access  Private
 */
router.delete('/:notificationId', notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications/delete-multiple
 * @desc    여러 알림 삭제
 * @access  Private
 */
router.delete('/delete-multiple', notificationController.deleteMultipleNotifications);

export default router; 