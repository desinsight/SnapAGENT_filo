/**
 * Collaboration Routes - 실시간 협업 API 라우트
 * 문서의 실시간 협업 기능을 위한 API 엔드포인트 정의
 * 
 * @description
 * - 코멘트 CRUD 라우트
 * - 태그 관리 라우트
 * - 실시간 협업 상태 조회 라우트
 * - 권한 검증 및 미들웨어 적용
 * - 다른 서비스와의 연동을 위한 확장 가능한 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware, requireAuth } from '../middleware/auth.js';
import collaborationController from '../controllers/collaborationController.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * 입력 검증 미들웨어
 * 요청 데이터의 유효성을 검사하고 에러를 처리
 */
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력 데이터가 유효하지 않습니다.',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 에러 처리 미들웨어
 * 라우트에서 발생하는 에러를 일관되게 처리
 */
const handleError = (err, req, res, next) => {
  logger.error('협업 라우트 에러:', err);
  res.status(500).json({
    success: false,
    message: '서버 에러가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ============================================================================
// 코멘트 관련 라우트
// ============================================================================

/**
 * @route   GET /api/v1/documents/:documentId/comments
 * @desc    문서의 코멘트 목록 조회
 * @access  Private
 * @param   {String} documentId - 문서 ID
 * @query   {Number} page - 페이지 번호 (기본값: 1)
 * @query   {Number} limit - 페이지당 항목 수 (기본값: 20)
 * @query   {String} type - 코멘트 유형 필터
 * @query   {String} status - 코멘트 상태 필터
 * @query   {String} sort - 정렬 기준 (기본값: -createdAt)
 */
router.get('/:documentId/comments',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('페이지 번호는 1 이상의 정수여야 합니다.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('페이지당 항목 수는 1-100 사이의 정수여야 합니다.'),
    query('type')
      .optional()
      .isIn(['comment', 'review', 'feedback', 'suggestion', 'question', 'answer', 'highlight', 'tag', 'annotation', 'approval', 'rejection'])
      .withMessage('유효하지 않은 코멘트 유형입니다.'),
    query('status')
      .optional()
      .isIn(['active', 'resolved', 'archived'])
      .withMessage('유효하지 않은 코멘트 상태입니다.'),
    query('sort')
      .optional()
      .isString()
      .withMessage('정렬 기준은 문자열이어야 합니다.')
  ],
  validateInput,
  collaborationController.getComments
);

/**
 * @route   POST /api/v1/documents/:documentId/comments
 * @desc    문서에 새 코멘트 생성
 * @access  Private
 * @param   {String} documentId - 문서 ID
 * @body    {String} content - 코멘트 내용
 * @body    {String} type - 코멘트 유형 (선택사항)
 * @body    {String} parentCommentId - 부모 코멘트 ID (답글인 경우)
 * @body    {Object} highlight - 하이라이트 정보 (선택사항)
 * @body    {Object} position - 위치 정보 (선택사항)
 * @body    {Array} tags - 태그 목록 (선택사항)
 */
router.post('/:documentId/comments',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('코멘트 내용은 1-5000자 사이여야 합니다.'),
    body('type')
      .optional()
      .isIn(['comment', 'review', 'feedback', 'suggestion', 'question', 'answer', 'highlight', 'tag', 'annotation', 'approval', 'rejection'])
      .withMessage('유효하지 않은 코멘트 유형입니다.'),
    body('parentCommentId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('부모 코멘트 ID는 유효한 문자열이어야 합니다.'),
    body('highlight.startOffset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('하이라이트 시작 오프셋은 0 이상의 정수여야 합니다.'),
    body('highlight.endOffset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('하이라이트 종료 오프셋은 0 이상의 정수여야 합니다.'),
    body('highlight.selectedText')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('선택된 텍스트는 1000자 이하여야 합니다.'),
    body('highlight.color')
      .optional()
      .isIn(['yellow', 'green', 'blue', 'red', 'purple', 'orange'])
      .withMessage('유효하지 않은 하이라이트 색상입니다.'),
    body('position.page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('페이지 번호는 1 이상의 정수여야 합니다.'),
    body('position.x')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('X 좌표는 0 이상의 숫자여야 합니다.'),
    body('position.y')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Y 좌표는 0 이상의 숫자여야 합니다.'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('태그는 배열이어야 합니다.'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('태그는 1-50자 사이의 문자열이어야 합니다.')
  ],
  validateInput,
  collaborationController.createComment
);

/**
 * @route   PUT /api/v1/comments/:commentId
 * @desc    코멘트 수정
 * @access  Private
 * @param   {String} commentId - 코멘트 ID
 * @body    {String} content - 수정할 코멘트 내용
 * @body    {Array} tags - 수정할 태그 목록 (선택사항)
 * @body    {Object} highlight - 수정할 하이라이트 정보 (선택사항)
 * @body    {Object} position - 수정할 위치 정보 (선택사항)
 */
router.put('/comments/:commentId',
  authMiddleware,
  requireAuth,
  [
    param('commentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('코멘트 ID는 필수입니다.'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('코멘트 내용은 1-5000자 사이여야 합니다.'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('태그는 배열이어야 합니다.'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('태그는 1-50자 사이의 문자열이어야 합니다.'),
    body('highlight.startOffset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('하이라이트 시작 오프셋은 0 이상의 정수여야 합니다.'),
    body('highlight.endOffset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('하이라이트 종료 오프셋은 0 이상의 정수여야 합니다.'),
    body('highlight.selectedText')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('선택된 텍스트는 1000자 이하여야 합니다.'),
    body('highlight.color')
      .optional()
      .isIn(['yellow', 'green', 'blue', 'red', 'purple', 'orange'])
      .withMessage('유효하지 않은 하이라이트 색상입니다.'),
    body('position.page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('페이지 번호는 1 이상의 정수여야 합니다.'),
    body('position.x')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('X 좌표는 0 이상의 숫자여야 합니다.'),
    body('position.y')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Y 좌표는 0 이상의 숫자여야 합니다.')
  ],
  validateInput,
  collaborationController.updateComment
);

/**
 * @route   DELETE /api/v1/comments/:commentId
 * @desc    코멘트 삭제 (소프트 삭제)
 * @access  Private
 * @param   {String} commentId - 코멘트 ID
 */
router.delete('/comments/:commentId',
  authMiddleware,
  requireAuth,
  [
    param('commentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('코멘트 ID는 필수입니다.')
  ],
  validateInput,
  collaborationController.deleteComment
);

/**
 * @route   POST /api/v1/comments/:commentId/reactions
 * @desc    코멘트 반응 토글 (좋아요, 반응 등)
 * @access  Private
 * @param   {String} commentId - 코멘트 ID
 * @body    {String} reactionType - 반응 유형
 */
router.post('/comments/:commentId/reactions',
  authMiddleware,
  requireAuth,
  [
    param('commentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('코멘트 ID는 필수입니다.'),
    body('reactionType')
      .isIn(['like', 'love', 'laugh', 'wow', 'sad', 'angry'])
      .withMessage('유효하지 않은 반응 유형입니다.')
  ],
  validateInput,
  collaborationController.toggleCommentReaction
);

// ============================================================================
// 태그 관련 라우트
// ============================================================================

/**
 * @route   GET /api/v1/documents/:documentId/tags
 * @desc    문서의 태그 목록 조회
 * @access  Private
 * @param   {String} documentId - 문서 ID
 */
router.get('/:documentId/tags',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.')
  ],
  validateInput,
  collaborationController.getTags
);

/**
 * @route   POST /api/v1/documents/:documentId/tags
 * @desc    문서에 태그 추가
 * @access  Private
 * @param   {String} documentId - 문서 ID
 * @body    {String} tag - 추가할 태그
 */
router.post('/:documentId/tags',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.'),
    body('tag')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('태그는 1-50자 사이의 문자열이어야 합니다.')
  ],
  validateInput,
  collaborationController.addTag
);

/**
 * @route   DELETE /api/v1/documents/:documentId/tags/:tag
 * @desc    문서에서 태그 제거
 * @access  Private
 * @param   {String} documentId - 문서 ID
 * @param   {String} tag - 제거할 태그
 */
router.delete('/:documentId/tags/:tag',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.'),
    param('tag')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('태그는 1-50자 사이의 문자열이어야 합니다.')
  ],
  validateInput,
  collaborationController.removeTag
);

// ============================================================================
// 실시간 협업 상태 관련 라우트
// ============================================================================

/**
 * @route   GET /api/v1/documents/:documentId/collaboration/status
 * @desc    문서의 실시간 협업 상태 조회
 * @access  Private
 * @param   {String} documentId - 문서 ID
 */
router.get('/:documentId/collaboration/status',
  authMiddleware,
  requireAuth,
  [
    param('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.')
  ],
  validateInput,
  collaborationController.getCollaborationStatus
);

// ============================================================================
// 확장 가능한 라우트 (다른 서비스와의 연동용)
// ============================================================================

/**
 * @route   GET /api/v1/collaboration/analytics
 * @desc    협업 분석 데이터 조회 (다른 서비스 연동용)
 * @access  Private
 * @query   {String} documentId - 문서 ID (선택사항)
 * @query   {String} userId - 사용자 ID (선택사항)
 * @query   {String} period - 기간 (day, week, month, year)
 */
router.get('/analytics',
  authMiddleware,
  requireAuth,
  [
    query('documentId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 유효한 문자열이어야 합니다.'),
    query('userId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('사용자 ID는 유효한 문자열이어야 합니다.'),
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('유효하지 않은 기간입니다.')
  ],
  validateInput,
  async (req, res) => {
    try {
      // 협업 분석 데이터 조회 로직 (구현 예정)
      const { documentId, userId, period = 'month' } = req.query;

      // 임시 응답 (실제 구현 시 분석 로직 추가)
      const response = {
        success: true,
        data: {
          period,
          documentId,
          userId,
          analytics: {
            totalComments: 0,
            totalReactions: 0,
            activeUsers: 0,
            collaborationTime: 0
          }
        },
        message: '협업 분석 데이터를 조회했습니다.'
      };

      logger.info(`📊 협업 분석 조회: ${req.user.name}`);
      res.json(response);

    } catch (error) {
      logger.error('협업 분석 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '협업 분석 데이터를 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/v1/collaboration/export
 * @desc    협업 데이터 내보내기 (다른 서비스 연동용)
 * @access  Private
 * @body    {String} documentId - 문서 ID
 * @body    {String} format - 내보내기 형식 (json, csv, pdf)
 * @body    {Array} dataTypes - 내보낼 데이터 유형 (comments, tags, activities)
 */
router.post('/export',
  authMiddleware,
  requireAuth,
  [
    body('documentId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('문서 ID는 필수입니다.'),
    body('format')
      .isIn(['json', 'csv', 'pdf'])
      .withMessage('유효하지 않은 내보내기 형식입니다.'),
    body('dataTypes')
      .isArray()
      .withMessage('데이터 유형은 배열이어야 합니다.'),
    body('dataTypes.*')
      .isIn(['comments', 'tags', 'activities'])
      .withMessage('유효하지 않은 데이터 유형입니다.')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { documentId, format, dataTypes } = req.body;

      // 협업 데이터 내보내기 로직 (구현 예정)
      const response = {
        success: true,
        data: {
          documentId,
          format,
          dataTypes,
          exportUrl: `/exports/collaboration_${documentId}_${Date.now()}.${format}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
        },
        message: '협업 데이터 내보내기가 시작되었습니다.'
      };

      logger.info(`📤 협업 데이터 내보내기: ${req.user.name} -> ${documentId} (${format})`);
      res.json(response);

    } catch (error) {
      logger.error('협업 데이터 내보내기 실패:', error);
      res.status(500).json({
        success: false,
        message: '협업 데이터를 내보낼 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ============================================================================
// 에러 처리 미들웨어 적용
// ============================================================================

router.use(handleError);

export default router; 