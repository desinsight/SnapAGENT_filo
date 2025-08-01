/**
 * Collaboration Controller - 실시간 협업 컨트롤러
 * 문서의 실시간 협업 기능을 처리하는 컨트롤러
 * 
 * @description
 * - 코멘트 CRUD API
 * - 태그 관리 API
 * - 실시간 편집 상태 관리
 * - 사용자 활동 추적
 * - 다른 서비스와의 연동을 위한 API
 * - 확장성을 고려한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import collaborationService from '../services/collaborationService.js';

/**
 * 협업 컨트롤러 클래스
 * 실시간 협업 관련 API 엔드포인트를 처리
 */
class CollaborationController {
  /**
   * 코멘트 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getComments(req, res) {
    try {
      const { documentId } = req.params;
      const { page = 1, limit = 20, type, status, sort = '-createdAt' } = req.query;

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 쿼리 조건 구성
      const query = { documentId, status: { $ne: 'deleted' } };
      if (type) query.type = type;
      if (status) query.status = status;

      // 페이지네이션
      const skip = (page - 1) * limit;
      const total = await Comment.countDocuments(query);
      const comments = await Comment.find(query)
        .populate('authorId', 'name avatar')
        .populate('parentCommentId', 'content authorName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // 응답 데이터 구성
      const response = {
        success: true,
        data: {
          comments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };

      logger.info(`📄 코멘트 목록 조회: ${req.user.name} -> ${documentId} (${comments.length}개)`);
      res.json(response);

    } catch (error) {
      logger.error('코멘트 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '코멘트 목록을 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 코멘트 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createComment(req, res) {
    try {
      const { documentId } = req.params;
      const { content, type, parentCommentId, highlight, position, tags } = req.body;

      // 입력 검증
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '코멘트 내용은 필수입니다.'
        });
      }

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 부모 코멘트 확인 (답글인 경우)
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment || parentComment.documentId !== documentId) {
          return res.status(400).json({
            success: false,
            message: '유효하지 않은 부모 코멘트입니다.'
          });
        }
      }

      // 코멘트 생성
      const comment = new Comment({
        documentId,
        authorId: req.user._id,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        content: content.trim(),
        type: type || 'comment',
        parentCommentId,
        highlight,
        position,
        tags: tags || [],
        metadata: {
          source: 'api',
          sessionId: req.sessionID
        }
      });

      await comment.save();

      // 부모 코멘트에 답글 추가
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        await parentComment.addReply(comment._id);
      }

      // 감사 로그 추가
      await comment.addAuditLog('create', req.user._id, req.user.name, 'API를 통한 코멘트 생성');

      // 실시간 알림 (Socket.io)
      collaborationService.sendUserNotification({
        userId: document.createdBy,
        notification: {
          type: 'new_comment',
          title: '새 코멘트',
          message: `${req.user.name}님이 문서에 코멘트를 남겼습니다.`,
          data: {
            documentId,
            commentId: comment._id,
            documentTitle: document.title
          }
        }
      });

      // 응답 데이터 구성
      const populatedComment = await Comment.findById(comment._id)
        .populate('authorId', 'name avatar')
        .populate('parentCommentId', 'content authorName');

      const response = {
        success: true,
        data: {
          comment: populatedComment
        },
        message: '코멘트가 성공적으로 생성되었습니다.'
      };

      logger.info(`💬 코멘트 생성: ${req.user.name} -> ${documentId}`);
      res.status(201).json(response);

    } catch (error) {
      logger.error('코멘트 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '코멘트를 생성할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 코멘트 수정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const { content, tags, highlight, position } = req.body;

      // 입력 검증
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '코멘트 내용은 필수입니다.'
        });
      }

      // 코멘트 존재 확인
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '코멘트를 찾을 수 없습니다.'
        });
      }

      // 권한 확인 (작성자만 수정 가능)
      if (comment.authorId !== req.user._id) {
        return res.status(403).json({
          success: false,
          message: '코멘트를 수정할 권한이 없습니다.'
        });
      }

      // 코멘트 수정
      comment.content = content.trim();
      if (tags) comment.tags = tags;
      if (highlight) comment.highlight = highlight;
      if (position) comment.position = position;
      comment.updatedAt = new Date();

      await comment.save();

      // 감사 로그 추가
      await comment.addAuditLog('update', req.user._id, req.user.name, '코멘트 수정');

      // 실시간 알림 (Socket.io)
      collaborationService.sendUserNotification({
        userId: comment.documentId,
        notification: {
          type: 'comment_updated',
          title: '코멘트 수정',
          message: `${req.user.name}님이 코멘트를 수정했습니다.`,
          data: {
            documentId: comment.documentId,
            commentId: comment._id
          }
        }
      });

      // 응답 데이터 구성
      const populatedComment = await Comment.findById(comment._id)
        .populate('authorId', 'name avatar')
        .populate('parentCommentId', 'content authorName');

      const response = {
        success: true,
        data: {
          comment: populatedComment
        },
        message: '코멘트가 성공적으로 수정되었습니다.'
      };

      logger.info(`✏️ 코멘트 수정: ${req.user.name} -> ${commentId}`);
      res.json(response);

    } catch (error) {
      logger.error('코멘트 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '코멘트를 수정할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 코멘트 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;

      // 코멘트 존재 확인
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '코멘트를 찾을 수 없습니다.'
        });
      }

      // 권한 확인 (작성자만 삭제 가능)
      if (comment.authorId !== req.user._id) {
        return res.status(403).json({
          success: false,
          message: '코멘트를 삭제할 권한이 없습니다.'
        });
      }

      // 부모 코멘트에서 답글 제거
      if (comment.parentCommentId) {
        const parentComment = await Comment.findById(comment.parentCommentId);
        await parentComment.removeReply(comment._id);
      }

      // 코멘트 소프트 삭제
      await comment.softDelete(req.user._id, req.user.name);

      // 실시간 알림 (Socket.io)
      collaborationService.sendUserNotification({
        userId: comment.documentId,
        notification: {
          type: 'comment_deleted',
          title: '코멘트 삭제',
          message: `${req.user.name}님이 코멘트를 삭제했습니다.`,
          data: {
            documentId: comment.documentId,
            commentId: comment._id
          }
        }
      });

      const response = {
        success: true,
        message: '코멘트가 성공적으로 삭제되었습니다.'
      };

      logger.info(`🗑️ 코멘트 삭제: ${req.user.name} -> ${commentId}`);
      res.json(response);

    } catch (error) {
      logger.error('코멘트 삭제 실패:', error);
      res.status(500).json({
        success: false,
        message: '코멘트를 삭제할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 코멘트 반응 추가/제거
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async toggleCommentReaction(req, res) {
    try {
      const { commentId } = req.params;
      const { reactionType } = req.body;

      // 입력 검증
      if (!reactionType) {
        return res.status(400).json({
          success: false,
          message: '반응 유형은 필수입니다.'
        });
      }

      // 코멘트 존재 확인
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '코멘트를 찾을 수 없습니다.'
        });
      }

      // 기존 반응 확인
      const existingReaction = comment.reactions.find(r => r.userId === req.user._id);

      if (existingReaction) {
        // 기존 반응과 같은 유형이면 제거, 다르면 변경
        if (existingReaction.type === reactionType) {
          await comment.removeReaction(req.user._id);
          const action = 'removed';
        } else {
          await comment.addReaction(req.user._id, reactionType);
          const action = 'updated';
        }
      } else {
        // 새 반응 추가
        await comment.addReaction(req.user._id, reactionType);
        const action = 'added';
      }

      // 응답 데이터 구성
      const response = {
        success: true,
        data: {
          reactionCount: comment.reactionCount,
          likeCount: comment.likeCount,
          userReaction: comment.reactions.find(r => r.userId === req.user._id)
        },
        message: `반응이 성공적으로 ${action}되었습니다.`
      };

      logger.info(`👍 코멘트 반응 토글: ${req.user.name} -> ${commentId} (${reactionType})`);
      res.json(response);

    } catch (error) {
      logger.error('코멘트 반응 토글 실패:', error);
      res.status(500).json({
        success: false,
        message: '반응을 처리할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 태그 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTags(req, res) {
    try {
      const { documentId } = req.params;

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 문서의 모든 태그 조회
      const documentTags = document.tags || [];

      // 코멘트의 모든 태그 조회
      const commentTags = await Comment.distinct('tags', {
        documentId,
        status: { $ne: 'deleted' }
      });

      // 태그 통합 및 중복 제거
      const allTags = [...new Set([...documentTags, ...commentTags])];

      // 태그별 사용 빈도 계산
      const tagStats = await Comment.aggregate([
        {
          $match: {
            documentId,
            status: { $ne: 'deleted' },
            tags: { $exists: true, $ne: [] }
          }
        },
        {
          $unwind: '$tags'
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const response = {
        success: true,
        data: {
          tags: allTags,
          tagStats: tagStats.map(stat => ({
            tag: stat._id,
            count: stat.count
          }))
        }
      };

      logger.info(`🏷️ 태그 목록 조회: ${req.user.name} -> ${documentId}`);
      res.json(response);

    } catch (error) {
      logger.error('태그 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '태그 목록을 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 태그 추가
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async addTag(req, res) {
    try {
      const { documentId } = req.params;
      const { tag } = req.body;

      // 입력 검증
      if (!tag || tag.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '태그는 필수입니다.'
        });
      }

      const cleanTag = tag.trim();

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 태그가 이미 존재하는지 확인
      if (document.tags.includes(cleanTag)) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 태그입니다.'
        });
      }

      // 문서에 태그 추가
      document.tags.push(cleanTag);
      await document.save();

      // 태그 코멘트 생성 (이력 추적)
      const tagComment = new Comment({
        documentId,
        authorId: req.user._id,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        content: `태그 추가: #${cleanTag}`,
        type: 'tag',
        tags: [cleanTag],
        metadata: {
          source: 'api',
          sessionId: req.sessionID
        }
      });

      await tagComment.save();

      const response = {
        success: true,
        data: {
          tag: cleanTag,
          documentTags: document.tags
        },
        message: '태그가 성공적으로 추가되었습니다.'
      };

      logger.info(`🏷️ 태그 추가: ${req.user.name} -> ${documentId} (#${cleanTag})`);
      res.status(201).json(response);

    } catch (error) {
      logger.error('태그 추가 실패:', error);
      res.status(500).json({
        success: false,
        message: '태그를 추가할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 태그 제거
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async removeTag(req, res) {
    try {
      const { documentId, tag } = req.params;

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 태그가 존재하는지 확인
      if (!document.tags.includes(tag)) {
        return res.status(404).json({
          success: false,
          message: '존재하지 않는 태그입니다.'
        });
      }

      // 문서에서 태그 제거
      document.tags = document.tags.filter(t => t !== tag);
      await document.save();

      // 태그 제거 코멘트 생성 (이력 추적)
      const tagComment = new Comment({
        documentId,
        authorId: req.user._id,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        content: `태그 제거: #${tag}`,
        type: 'tag',
        tags: [tag],
        metadata: {
          source: 'api',
          sessionId: req.sessionID
        }
      });

      await tagComment.save();

      const response = {
        success: true,
        data: {
          tag,
          documentTags: document.tags
        },
        message: '태그가 성공적으로 제거되었습니다.'
      };

      logger.info(`🏷️ 태그 제거: ${req.user.name} -> ${documentId} (#${tag})`);
      res.json(response);

    } catch (error) {
      logger.error('태그 제거 실패:', error);
      res.status(500).json({
        success: false,
        message: '태그를 제거할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 실시간 협업 상태 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getCollaborationStatus(req, res) {
    try {
      const { documentId } = req.params;

      // 문서 존재 확인
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '문서를 찾을 수 없습니다.'
        });
      }

      // 문서 접근 권한 확인
      if (!await this.checkDocumentAccess(document, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: '문서에 접근할 권한이 없습니다.'
        });
      }

      // 실시간 협업 상태 조회
      const participants = collaborationService.getDocumentParticipants(documentId);
      const serviceStatus = collaborationService.getServiceStatus();

      const response = {
        success: true,
        data: {
          documentId,
          participants,
          serviceStatus,
          currentUser: {
            userId: req.user._id,
            userName: req.user.name,
            userAvatar: req.user.avatar
          }
        }
      };

      logger.info(`📊 협업 상태 조회: ${req.user.name} -> ${documentId}`);
      res.json(response);

    } catch (error) {
      logger.error('협업 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '협업 상태를 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 문서 접근 권한 확인
   * @param {Object} document - 문서 객체
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 접근 권한 여부
   */
  async checkDocumentAccess(document, userId) {
    // 소유자 확인
    if (document.createdBy.toString() === userId) {
      return true;
    }

    // 명시적 권한 확인
    const permission = document.permissions.find(p => 
      p.userId.toString() === userId
    );
    if (permission) {
      return true;
    }

    // 조직 권한 확인 (구현 필요)
    // const user = await User.findById(userId);
    // if (user.organization === document.organization) {
    //   return true;
    // }

    return false;
  }
}

// 컨트롤러 인스턴스 생성 및 내보내기
const collaborationController = new CollaborationController();

export default collaborationController; 