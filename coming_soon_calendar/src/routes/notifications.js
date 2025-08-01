const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');
const { validateNotification } = require('../middlewares/validation');

/**
 * 알림 라우트
 * 다중 채널 알림(푸시, 이메일, SMS) 및 중요/긴급 공지 기능
 */

// 모든 알림 API에 인증 적용
router.use(auth.authenticate);

/**
 * @route   POST /api/notifications
 * @desc    알림 생성
 * @access  Private (Admin, Manager)
 */
router.post('/', 
  validateNotification, 
  notificationController.createNotification
);

/**
 * @route   GET /api/notifications
 * @desc    알림 목록 조회
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/:id
 * @desc    알림 상세 조회
 * @access  Private
 */
router.get('/:id', notificationController.getNotification);

/**
 * @route   PUT /api/notifications/:id
 * @desc    알림 수정
 * @access  Private (Admin, Manager)
 */
router.put('/:id', 
  validateNotification, 
  notificationController.updateNotification
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    알림 삭제
 * @access  Private (Admin)
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   POST /api/notifications/:id/send
 * @desc    알림 발송
 * @access  Private (Admin, Manager)
 */
router.post('/:id/send', notificationController.sendNotification);

/**
 * @route   GET /api/notifications/urgent
 * @desc    긴급 공지 조회
 * @access  Private
 */
router.get('/urgent', notificationController.getUrgentNotices);

/**
 * @route   GET /api/notifications/scheduled
 * @desc    예약된 알림 조회
 * @access  Private (Admin, Manager)
 */
router.get('/scheduled', notificationController.getScheduledNotifications);

/**
 * @route   GET /api/notifications/stats
 * @desc    알림 통계 조회
 * @access  Private (Admin)
 */
router.get('/stats', notificationController.getNotificationStats);

/**
 * @route   GET /api/notifications/templates
 * @desc    알림 템플릿 조회
 * @access  Private
 */
router.get('/templates', notificationController.getNotificationTemplates);

/**
 * @route   POST /api/notifications/test
 * @desc    알림 발송 테스트
 * @access  Private (Admin, Manager)
 */
router.post('/test', notificationController.testNotification);

module.exports = router; 