/**
 * Comment Controller - 댓글 컨트롤러
 * 댓글 관리 API 엔드포인트 처리
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import commentService from '../services/commentService.js';

/**
 * 댓글 컨트롤러 클래스
 */
class CommentController {
  /**
   * 댓글 생성
   */
  async createComment(req, res) {
    try {
      const commentData = req.body;
      const authorId = req.user._id;

      const comment = await commentService.createComment(commentData, authorId);

      res.status(201).json({
        success: true,
        data: { comment },
        message: '댓글이 성공적으로 생성되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 댓글 생성 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '댓글을 생성할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 목록 조회
   */
  async getComments(req, res) {
    try {
      const { relatedType, relatedId } = req.params;
      const filters = req.query;

      const result = await commentService.getComments(relatedType, relatedId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 댓글 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '댓글 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 상세 조회
   */
  async getCommentById(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await commentService.getCommentById(commentId);

      res.json({
        success: true,
        data: { comment }
      });

    } catch (error) {
      logger.error('❌ 댓글 상세 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '댓글을 찾을 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 수정
   */
  async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const comment = await commentService.updateComment(commentId, updateData, userId);

      res.json({
        success: true,
        data: { comment },
        message: '댓글이 성공적으로 수정되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 댓글 수정 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '댓글을 수정할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const result = await commentService.deleteComment(commentId, userId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 댓글 삭제 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '댓글을 삭제할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 반응 토글
   */
  async toggleReaction(req, res) {
    try {
      const { commentId } = req.params;
      const { reactionType } = req.body;
      const userId = req.user._id;

      const comment = await commentService.toggleReaction(commentId, userId, reactionType);

      res.json({
        success: true,
        data: { comment },
        message: '반응이 성공적으로 처리되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 댓글 반응 토글 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '반응을 처리할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 통계 조회
   */
  async getCommentStatistics(req, res) {
    try {
      const { relatedType, relatedId } = req.params;

      const statistics = await commentService.getCommentStatistics(relatedType, relatedId);

      res.json({
        success: true,
        data: { statistics }
      });

    } catch (error) {
      logger.error('❌ 댓글 통계 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '댓글 통계를 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 사용자 댓글 목록 조회
   */
  async getUserComments(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      const result = await commentService.getUserComments(userId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 사용자 댓글 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '댓글 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 댓글 검색
   */
  async searchComments(req, res) {
    try {
      const { searchTerm } = req.query;
      const filters = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: '검색어가 필요합니다.'
        });
      }

      const result = await commentService.searchComments(searchTerm, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 댓글 검색 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '댓글 검색을 수행할 수 없습니다.'
      });
    }
  }
}

const commentController = new CommentController();
export default commentController; 