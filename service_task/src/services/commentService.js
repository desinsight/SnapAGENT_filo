/**
 * Comment Service - 댓글 서비스
 * 댓글 관리 비즈니스 로직
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import notificationService from './notificationService.js';

class CommentService {
  /**
   * 댓글 생성
   */
  async createComment(commentData, authorId) {
    try {
      const { content, relatedType, relatedId, parentCommentId } = commentData;

      // 관련 리소스 존재 확인
      let relatedResource;
      if (relatedType === 'task') {
        relatedResource = await Task.findById(relatedId);
      } else if (relatedType === 'project') {
        relatedResource = await Project.findById(relatedId);
      }

      if (!relatedResource) {
        throw new Error('관련 리소스를 찾을 수 없습니다.');
      }

      // 부모 댓글 확인 (답글인 경우)
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment || parentComment.relatedId.toString() !== relatedId) {
          throw new Error('유효하지 않은 부모 댓글입니다.');
        }
      }

      const comment = new Comment({
        content,
        authorId,
        relatedType,
        relatedId,
        parentCommentId,
        status: 'active'
      });

      await comment.save();

      // 부모 댓글에 답글 추가
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        parentComment.replies.push(comment._id);
        await parentComment.save();
      }

      // 멘션된 사용자 추출 및 알림 생성
      const mentionedUsers = this.extractMentionedUsers(content);
      for (const userId of mentionedUsers) {
        await notificationService.createMentionNotification(
          userId,
          authorId,
          `${relatedType} 댓글`,
          relatedId,
          relatedType
        );
      }

      logger.info(`💬 댓글 생성: ${relatedType} ${relatedId} (${authorId})`);
      return comment;

    } catch (error) {
      logger.error('❌ 댓글 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 목록 조회
   */
  async getComments(relatedType, relatedId, filters = {}) {
    try {
      const { page = 1, limit = 20, sort = '-createdAt', parentCommentId } = filters;
      
      const query = {
        relatedType,
        relatedId,
        status: 'active'
      };

      if (parentCommentId) {
        query.parentCommentId = parentCommentId;
      } else {
        query.parentCommentId = null; // 최상위 댓글만
      }

      const skip = (page - 1) * limit;
      const total = await Comment.countDocuments(query);
      
      const comments = await Comment.find(query)
        .populate('authorId', 'name email avatar')
        .populate('parentCommentId', 'content authorId')
        .populate('replies')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      return {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ 댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 상세 조회
   */
  async getCommentById(commentId) {
    try {
      const comment = await Comment.findById(commentId)
        .populate('authorId', 'name email avatar')
        .populate('parentCommentId', 'content authorId')
        .populate('replies')
        .populate('reactions.userId', 'name');

      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      return comment;

    } catch (error) {
      logger.error('❌ 댓글 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 수정
   */
  async updateComment(commentId, updateData, userId) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      // 권한 확인 (작성자만 수정 가능)
      if (comment.authorId.toString() !== userId) {
        throw new Error('댓글을 수정할 권한이 없습니다.');
      }

      comment.content = updateData.content;
      comment.updatedAt = new Date();

      await comment.save();

      logger.info(`✏️ 댓글 수정: ${commentId} (${userId})`);
      return comment;

    } catch (error) {
      logger.error('❌ 댓글 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      // 권한 확인 (작성자만 삭제 가능)
      if (comment.authorId.toString() !== userId) {
        throw new Error('댓글을 삭제할 권한이 없습니다.');
      }

      // 부모 댓글에서 답글 제거
      if (comment.parentCommentId) {
        const parentComment = await Comment.findById(comment.parentCommentId);
        parentComment.replies = parentComment.replies.filter(
          replyId => replyId.toString() !== commentId
        );
        await parentComment.save();
      }

      // 답글이 있는 경우 소프트 삭제, 없는 경우 완전 삭제
      if (comment.replies.length > 0) {
        comment.status = 'deleted';
        comment.content = '[삭제된 댓글입니다]';
        await comment.save();
      } else {
        await Comment.findByIdAndDelete(commentId);
      }

      logger.info(`🗑️ 댓글 삭제: ${commentId} (${userId})`);
      return { success: true, message: '댓글이 성공적으로 삭제되었습니다.' };

    } catch (error) {
      logger.error('❌ 댓글 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 반응 추가/제거
   */
  async toggleReaction(commentId, userId, reactionType) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      // 기존 반응 확인
      const existingReaction = comment.reactions.find(
        r => r.userId.toString() === userId
      );

      if (existingReaction) {
        // 기존 반응과 같은 유형이면 제거, 다르면 변경
        if (existingReaction.type === reactionType) {
          comment.reactions = comment.reactions.filter(
            r => r.userId.toString() !== userId
          );
        } else {
          existingReaction.type = reactionType;
          existingReaction.updatedAt = new Date();
        }
      } else {
        // 새 반응 추가
        comment.reactions.push({
          userId,
          type: reactionType,
          createdAt: new Date()
        });
      }

      await comment.save();

      logger.info(`👍 댓글 반응 토글: ${commentId} -> ${userId} (${reactionType})`);
      return comment;

    } catch (error) {
      logger.error('❌ 댓글 반응 토글 실패:', error);
      throw error;
    }
  }

  /**
   * 댓글 통계 조회
   */
  async getCommentStatistics(relatedType, relatedId) {
    try {
      const totalComments = await Comment.countDocuments({
        relatedType,
        relatedId,
        status: 'active'
      });

      const totalReplies = await Comment.countDocuments({
        relatedType,
        relatedId,
        status: 'active',
        parentCommentId: { $ne: null }
      });

      const topLevelComments = totalComments - totalReplies;

      return {
        totalComments,
        topLevelComments,
        totalReplies,
        averageRepliesPerComment: topLevelComments > 0 ? (totalReplies / topLevelComments).toFixed(1) : 0
      };

    } catch (error) {
      logger.error('❌ 댓글 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 댓글 목록 조회
   */
  async getUserComments(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, sort = '-createdAt' } = filters;

      const skip = (page - 1) * limit;
      const total = await Comment.countDocuments({
        authorId: userId,
        status: 'active'
      });

      const comments = await Comment.find({
        authorId: userId,
        status: 'active'
      })
        .populate('relatedId', 'title name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      return {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ 사용자 댓글 목록 조회 실패:', error);
      throw error;
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
    // 현재는 예시로 빈 배열 반환
    return [];
  }

  /**
   * 댓글 검색
   */
  async searchComments(searchTerm, filters = {}) {
    try {
      const { page = 1, limit = 20, relatedType, relatedId } = filters;

      const query = {
        content: { $regex: searchTerm, $options: 'i' },
        status: 'active'
      };

      if (relatedType) query.relatedType = relatedType;
      if (relatedId) query.relatedId = relatedId;

      const skip = (page - 1) * limit;
      const total = await Comment.countDocuments(query);

      const comments = await Comment.find(query)
        .populate('authorId', 'name email avatar')
        .populate('relatedId', 'title name')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      return {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ 댓글 검색 실패:', error);
      throw error;
    }
  }
}

const commentService = new CommentService();
export default commentService; 