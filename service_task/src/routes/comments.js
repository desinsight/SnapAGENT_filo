/**
 * Comments Router - 댓글 라우터
 * 댓글 관리 API 엔드포인트 정의
 *
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import commentController from '../controllers/commentController.js';
import { validateComment } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   POST /api/comments
 * @desc    댓글 생성
 * @access  Private
 */
router.post('/', validateComment, commentController.createComment);

/**
 * @route   GET /api/comments/search
 * @desc    댓글 검색
 * @access  Private
 */
router.get('/search', commentController.searchComments);

/**
 * @route   GET /api/comments/my
 * @desc    사용자 댓글 목록 조회
 * @access  Private
 */
router.get('/my', commentController.getUserComments);

/**
 * @route   GET /api/comments/:relatedType/:relatedId
 * @desc    특정 리소스의 댓글 목록 조회
 * @access  Private
 */
router.get('/:relatedType/:relatedId', commentController.getComments);

/**
 * @route   GET /api/comments/:relatedType/:relatedId/statistics
 * @desc    댓글 통계 조회
 * @access  Private
 */
router.get('/:relatedType/:relatedId/statistics', commentController.getCommentStatistics);

/**
 * @route   GET /api/comments/:commentId
 * @desc    댓글 상세 조회
 * @access  Private
 */
router.get('/:commentId', commentController.getCommentById);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    댓글 수정
 * @access  Private
 */
router.put('/:commentId', validateComment, commentController.updateComment);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    댓글 삭제
 * @access  Private
 */
router.delete('/:commentId', commentController.deleteComment);

/**
 * @route   POST /api/comments/:commentId/reactions
 * @desc    댓글 반응 토글
 * @access  Private
 */
router.post('/:commentId/reactions', commentController.toggleReaction);

export default router; 