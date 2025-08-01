/**
 * Collaboration Service - 실시간 협업 서비스
 * 문서의 실시간 협업 기능을 관리하는 서비스
 * 
 * @description
 * - Socket.io를 활용한 실시간 통신
 * - 동시 편집 및 충돌 해결
 * - 실시간 코멘트 및 태그 시스템
 * - 사용자 활동 추적 및 알림
 * - 다른 서비스와의 연동을 위한 이벤트 시스템
 * - 확장성을 고려한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

/**
 * 실시간 협업 서비스 클래스
 * 문서 편집, 코멘트, 태그 등의 실시간 기능을 관리
 */
class CollaborationService {
  constructor() {
    this.io = null;
    this.activeUsers = new Map(); // userId -> socket mapping
    this.documentSessions = new Map(); // documentId -> active users
    this.editingSessions = new Map(); // documentId -> editing users
    this.cursorPositions = new Map(); // userId -> cursor position
    this.operationQueue = new Map(); // documentId -> operation queue
    this.lastOperationId = new Map(); // documentId -> last operation ID
    
    // 이벤트 리스너 등록
    this.setupEventHandlers();
  }

  /**
   * Socket.io 서버 초기화
   * @param {Server} io - Socket.io 서버 인스턴스
   */
  initialize(io) {
    this.io = io;
    this.setupSocketHandlers();
    logger.info('✅ 실시간 협업 서비스 초기화 완료');
  }

  /**
   * Socket.io 이벤트 핸들러 설정
   * 실시간 협업을 위한 모든 소켓 이벤트를 처리
   */
  setupSocketHandlers() {
    if (!this.io) {
      logger.error('Socket.io 서버가 초기화되지 않았습니다.');
      return;
    }

    this.io.on('connection', (socket) => {
      logger.info(`🔌 클라이언트 연결: ${socket.id}`);

      // 인증 처리
      this.handleAuthentication(socket);

      // 문서 관련 이벤트
      this.handleDocumentEvents(socket);

      // 편집 관련 이벤트
      this.handleEditingEvents(socket);

      // 코멘트 관련 이벤트
      this.handleCommentEvents(socket);

      // 태그 관련 이벤트
      this.handleTagEvents(socket);

      // 커서 및 활동 추적 이벤트
      this.handleCursorEvents(socket);

      // 연결 해제 처리
      this.handleDisconnection(socket);

      // 에러 처리
      this.handleErrors(socket);
    });

    logger.info('✅ Socket.io 이벤트 핸들러 설정 완료');
  }

  /**
   * 사용자 인증 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleAuthentication(socket) {
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        
        if (!token) {
          socket.emit('auth_error', { message: '인증 토큰이 필요합니다.' });
          return;
        }

        // JWT 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          socket.emit('auth_error', { message: '유효하지 않은 사용자입니다.' });
          return;
        }

        // 소켓에 사용자 정보 저장
        socket.userId = user._id.toString();
        socket.userName = user.name;
        socket.userAvatar = user.avatar;

        // 활성 사용자 목록에 추가
        this.activeUsers.set(socket.userId, socket);

        socket.emit('authenticated', {
          success: true,
          userId: socket.userId,
          userName: socket.userName,
          userAvatar: socket.userAvatar
        });

        logger.info(`✅ 사용자 인증 성공: ${socket.userName} (${socket.userId})`);
      } catch (error) {
        logger.error('인증 실패:', error);
        socket.emit('auth_error', { message: '인증에 실패했습니다.' });
      }
    });
  }

  /**
   * 문서 관련 이벤트 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleDocumentEvents(socket) {
    // 문서 참여
    socket.on('join_document', async (data) => {
      try {
        const { documentId } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: '인증이 필요합니다.' });
          return;
        }

        // 문서 존재 확인 및 권한 체크
        const document = await Document.findById(documentId);
        if (!document) {
          socket.emit('error', { message: '문서를 찾을 수 없습니다.' });
          return;
        }

        // 이전 문서에서 나가기
        if (socket.documentId) {
          await this.leaveDocument(socket, { documentId: socket.documentId });
        }

        // 새 문서에 참여
        await this.joinDocument(socket, { documentId });

        socket.emit('joined_document', {
          success: true,
          documentId,
          participants: this.getDocumentParticipants(documentId)
        });

        logger.info(`📄 문서 참여: ${socket.userName} -> ${documentId}`);
      } catch (error) {
        logger.error('문서 참여 실패:', error);
        socket.emit('error', { message: '문서 참여에 실패했습니다.' });
      }
    });

    // 문서 나가기
    socket.on('leave_document', async (data) => {
      try {
        const { documentId } = data;
        await this.leaveDocument(socket, { documentId });
        socket.emit('left_document', { success: true, documentId });
      } catch (error) {
        logger.error('문서 나가기 실패:', error);
        socket.emit('error', { message: '문서 나가기에 실패했습니다.' });
      }
    });
  }

  /**
   * 편집 관련 이벤트 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleEditingEvents(socket) {
    // 편집 시작
    socket.on('start_editing', async (data) => {
      try {
        const { documentId, section } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 편집 세션에 추가
        this.addEditingUser(documentId, socket.userId, section);

        // 다른 사용자들에게 편집 시작 알림
        socket.to(`document:${documentId}`).emit('user_started_editing', {
          userId: socket.userId,
          userName: socket.userName,
          userAvatar: socket.userAvatar,
          section,
          timestamp: new Date()
        });

        logger.info(`✏️ 편집 시작: ${socket.userName} -> ${documentId} (${section})`);
      } catch (error) {
        logger.error('편집 시작 실패:', error);
        socket.emit('error', { message: '편집을 시작할 수 없습니다.' });
      }
    });

    // 편집 중 (실시간 동기화)
    socket.on('editing', async (data) => {
      try {
        const { documentId, operation, content, version } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 작업 큐에 추가
        const operationId = this.addOperation(documentId, {
          userId: socket.userId,
          userName: socket.userName,
          operation,
          content,
          version,
          timestamp: new Date()
        });

        // 다른 사용자들에게 편집 내용 전송
        socket.to(`document:${documentId}`).emit('document_edited', {
          operationId,
          userId: socket.userId,
          userName: socket.userName,
          operation,
          content,
          version,
          timestamp: new Date()
        });

        // 작업 확인 응답
        socket.emit('operation_confirmed', {
          operationId,
          success: true
        });

      } catch (error) {
        logger.error('편집 처리 실패:', error);
        socket.emit('error', { message: '편집을 처리할 수 없습니다.' });
      }
    });

    // 편집 완료
    socket.on('stop_editing', async (data) => {
      try {
        const { documentId, section } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 편집 세션에서 제거
        this.removeEditingUser(documentId, socket.userId);

        // 다른 사용자들에게 편집 완료 알림
        socket.to(`document:${documentId}`).emit('user_stopped_editing', {
          userId: socket.userId,
          userName: socket.userName,
          section,
          timestamp: new Date()
        });

        logger.info(`✅ 편집 완료: ${socket.userName} -> ${documentId} (${section})`);
      } catch (error) {
        logger.error('편집 완료 처리 실패:', error);
        socket.emit('error', { message: '편집 완료를 처리할 수 없습니다.' });
      }
    });
  }

  /**
   * 코멘트 관련 이벤트 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleCommentEvents(socket) {
    // 코멘트 추가
    socket.on('add_comment', async (data) => {
      try {
        const { documentId, content, type, parentCommentId, highlight, position } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 코멘트 생성
        const comment = new Comment({
          documentId,
          authorId: socket.userId,
          authorName: socket.userName,
          authorAvatar: socket.userAvatar,
          content,
          type: type || 'comment',
          parentCommentId,
          highlight,
          position,
          metadata: {
            source: 'realtime',
            sessionId: socket.id
          }
        });

        await comment.save();

        // 감사 로그 추가
        await comment.addAuditLog('create', socket.userId, socket.userName, '실시간 코멘트 생성');

        // 다른 사용자들에게 새 코멘트 알림
        socket.to(`document:${documentId}`).emit('new_comment', {
          comment: {
            _id: comment._id,
            content: comment.content,
            type: comment.type,
            authorName: comment.authorName,
            authorAvatar: comment.authorAvatar,
            createdAt: comment.createdAt,
            highlight: comment.highlight,
            position: comment.position
          },
          timestamp: new Date()
        });

        // 작성자에게 확인 응답
        socket.emit('comment_added', {
          success: true,
          commentId: comment._id
        });

        logger.info(`💬 코멘트 추가: ${socket.userName} -> ${documentId}`);
      } catch (error) {
        logger.error('코멘트 추가 실패:', error);
        socket.emit('error', { message: '코멘트를 추가할 수 없습니다.' });
      }
    });

    // 코멘트 수정
    socket.on('edit_comment', async (data) => {
      try {
        const { commentId, content } = data;
        
        const comment = await Comment.findById(commentId);
        if (!comment) {
          socket.emit('error', { message: '코멘트를 찾을 수 없습니다.' });
          return;
        }

        // 권한 확인 (작성자만 수정 가능)
        if (comment.authorId !== socket.userId) {
          socket.emit('error', { message: '코멘트를 수정할 권한이 없습니다.' });
          return;
        }

        comment.content = content;
        comment.updatedAt = new Date();
        await comment.save();

        // 감사 로그 추가
        await comment.addAuditLog('update', socket.userId, socket.userName, '코멘트 수정');

        // 다른 사용자들에게 수정 알림
        socket.to(`document:${comment.documentId}`).emit('comment_edited', {
          commentId: comment._id,
          content: comment.content,
          updatedAt: comment.updatedAt,
          timestamp: new Date()
        });

        socket.emit('comment_updated', {
          success: true,
          commentId: comment._id
        });

        logger.info(`✏️ 코멘트 수정: ${socket.userName} -> ${commentId}`);
      } catch (error) {
        logger.error('코멘트 수정 실패:', error);
        socket.emit('error', { message: '코멘트를 수정할 수 없습니다.' });
      }
    });

    // 코멘트 삭제
    socket.on('delete_comment', async (data) => {
      try {
        const { commentId } = data;
        
        const comment = await Comment.findById(commentId);
        if (!comment) {
          socket.emit('error', { message: '코멘트를 찾을 수 없습니다.' });
          return;
        }

        // 권한 확인 (작성자만 삭제 가능)
        if (comment.authorId !== socket.userId) {
          socket.emit('error', { message: '코멘트를 삭제할 권한이 없습니다.' });
          return;
        }

        await comment.softDelete(socket.userId, socket.userName);

        // 다른 사용자들에게 삭제 알림
        socket.to(`document:${comment.documentId}`).emit('comment_deleted', {
          commentId: comment._id,
          timestamp: new Date()
        });

        socket.emit('comment_deleted', {
          success: true,
          commentId: comment._id
        });

        logger.info(`🗑️ 코멘트 삭제: ${socket.userName} -> ${commentId}`);
      } catch (error) {
        logger.error('코멘트 삭제 실패:', error);
        socket.emit('error', { message: '코멘트를 삭제할 수 없습니다.' });
      }
    });

    // 코멘트 반응 (좋아요 등)
    socket.on('react_to_comment', async (data) => {
      try {
        const { commentId, reactionType } = data;
        
        const comment = await Comment.findById(commentId);
        if (!comment) {
          socket.emit('error', { message: '코멘트를 찾을 수 없습니다.' });
          return;
        }

        await comment.addReaction(socket.userId, reactionType);

        // 다른 사용자들에게 반응 알림
        socket.to(`document:${comment.documentId}`).emit('comment_reaction', {
          commentId: comment._id,
          userId: socket.userId,
          userName: socket.userName,
          reactionType,
          reactionCount: comment.reactionCount,
          timestamp: new Date()
        });

        socket.emit('reaction_added', {
          success: true,
          commentId: comment._id,
          reactionType
        });

        logger.info(`👍 코멘트 반응: ${socket.userName} -> ${commentId} (${reactionType})`);
      } catch (error) {
        logger.error('코멘트 반응 실패:', error);
        socket.emit('error', { message: '반응을 추가할 수 없습니다.' });
      }
    });
  }

  /**
   * 태그 관련 이벤트 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleTagEvents(socket) {
    // 태그 추가
    socket.on('add_tag', async (data) => {
      try {
        const { documentId, tag } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 문서에 태그 추가
        const document = await Document.findById(documentId);
        if (!document.tags.includes(tag)) {
          document.tags.push(tag);
          await document.save();
        }

        // 태그 코멘트 생성
        const tagComment = new Comment({
          documentId,
          authorId: socket.userId,
          authorName: socket.userName,
          authorAvatar: socket.userAvatar,
          content: `태그 추가: #${tag}`,
          type: 'tag',
          tags: [tag],
          metadata: {
            source: 'realtime',
            sessionId: socket.id
          }
        });

        await tagComment.save();

        // 다른 사용자들에게 태그 추가 알림
        socket.to(`document:${documentId}`).emit('tag_added', {
          tag,
          addedBy: socket.userName,
          timestamp: new Date()
        });

        socket.emit('tag_added', {
          success: true,
          tag
        });

        logger.info(`🏷️ 태그 추가: ${socket.userName} -> ${documentId} (#${tag})`);
      } catch (error) {
        logger.error('태그 추가 실패:', error);
        socket.emit('error', { message: '태그를 추가할 수 없습니다.' });
      }
    });

    // 태그 제거
    socket.on('remove_tag', async (data) => {
      try {
        const { documentId, tag } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 문서에서 태그 제거
        const document = await Document.findById(documentId);
        document.tags = document.tags.filter(t => t !== tag);
        await document.save();

        // 다른 사용자들에게 태그 제거 알림
        socket.to(`document:${documentId}`).emit('tag_removed', {
          tag,
          removedBy: socket.userName,
          timestamp: new Date()
        });

        socket.emit('tag_removed', {
          success: true,
          tag
        });

        logger.info(`🏷️ 태그 제거: ${socket.userName} -> ${documentId} (#${tag})`);
      } catch (error) {
        logger.error('태그 제거 실패:', error);
        socket.emit('error', { message: '태그를 제거할 수 없습니다.' });
      }
    });
  }

  /**
   * 커서 및 활동 추적 이벤트 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleCursorEvents(socket) {
    // 커서 위치 업데이트
    socket.on('cursor_move', (data) => {
      try {
        const { documentId, position } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 커서 위치 저장
        this.cursorPositions.set(socket.userId, {
          documentId,
          position,
          timestamp: new Date()
        });

        // 다른 사용자들에게 커서 위치 전송
        socket.to(`document:${documentId}`).emit('cursor_moved', {
          userId: socket.userId,
          userName: socket.userName,
          userAvatar: socket.userAvatar,
          position,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('커서 이동 처리 실패:', error);
      }
    });

    // 사용자 활동 추적
    socket.on('user_activity', (data) => {
      try {
        const { documentId, activity } = data;
        
        if (!this.validateDocumentAccess(socket, documentId)) {
          return;
        }

        // 다른 사용자들에게 활동 알림
        socket.to(`document:${documentId}`).emit('user_activity_update', {
          userId: socket.userId,
          userName: socket.userName,
          activity,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('사용자 활동 처리 실패:', error);
      }
    });
  }

  /**
   * 연결 해제 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleDisconnection(socket) {
    socket.on('disconnect', async () => {
      try {
        logger.info(`🔌 클라이언트 연결 해제: ${socket.id}`);

        // 활성 사용자 목록에서 제거
        if (socket.userId) {
          this.activeUsers.delete(socket.userId);
        }

        // 문서 세션에서 제거
        if (socket.documentId) {
          await this.leaveDocument(socket, { documentId: socket.documentId });
        }

        // 편집 세션에서 제거
        if (socket.documentId && socket.userId) {
          this.removeEditingUser(socket.documentId, socket.userId);
        }

        // 커서 위치 제거
        if (socket.userId) {
          this.cursorPositions.delete(socket.userId);
        }

        logger.info(`✅ 사용자 연결 해제 완료: ${socket.userName || 'Unknown'}`);
      } catch (error) {
        logger.error('연결 해제 처리 실패:', error);
      }
    });
  }

  /**
   * 에러 처리
   * @param {Socket} socket - 소켓 인스턴스
   */
  handleErrors(socket) {
    socket.on('error', (error) => {
      logger.error('Socket 에러:', error);
      socket.emit('error', { message: '서버 에러가 발생했습니다.' });
    });
  }

  /**
   * 문서 참여 처리
   * @param {Socket} socket - 소켓 인스턴스
   * @param {Object} data - 참여 데이터
   */
  async joinDocument(socket, data) {
    const { documentId } = data;
    
    // 소켓을 문서 룸에 참여시킴
    socket.join(`document:${documentId}`);
    socket.documentId = documentId;

    // 문서 세션에 사용자 추가
    if (!this.documentSessions.has(documentId)) {
      this.documentSessions.set(documentId, new Set());
    }
    this.documentSessions.get(documentId).add(socket.userId);

    // 다른 사용자들에게 참여 알림
    socket.to(`document:${documentId}`).emit('user_joined_document', {
      userId: socket.userId,
      userName: socket.userName,
      userAvatar: socket.userAvatar,
      timestamp: new Date()
    });
  }

  /**
   * 문서 나가기 처리
   * @param {Socket} socket - 소켓 인스턴스
   * @param {Object} data - 나가기 데이터
   */
  async leaveDocument(socket, data) {
    const { documentId } = data;
    
    // 소켓을 문서 룸에서 나가게 함
    socket.leave(`document:${documentId}`);
    socket.documentId = null;

    // 문서 세션에서 사용자 제거
    if (this.documentSessions.has(documentId)) {
      this.documentSessions.get(documentId).delete(socket.userId);
      
      // 세션이 비어있으면 제거
      if (this.documentSessions.get(documentId).size === 0) {
        this.documentSessions.delete(documentId);
      }
    }

    // 다른 사용자들에게 나가기 알림
    socket.to(`document:${documentId}`).emit('user_left_document', {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date()
    });
  }

  /**
   * 문서 접근 권한 검증
   * @param {Socket} socket - 소켓 인스턴스
   * @param {String} documentId - 문서 ID
   * @returns {Boolean} 권한 여부
   */
  validateDocumentAccess(socket, documentId) {
    if (!socket.userId) {
      socket.emit('error', { message: '인증이 필요합니다.' });
      return false;
    }

    if (!documentId) {
      socket.emit('error', { message: '문서 ID가 필요합니다.' });
      return false;
    }

    return true;
  }

  /**
   * 편집 사용자 추가
   * @param {String} documentId - 문서 ID
   * @param {String} userId - 사용자 ID
   * @param {String} section - 편집 섹션
   */
  addEditingUser(documentId, userId, section) {
    if (!this.editingSessions.has(documentId)) {
      this.editingSessions.set(documentId, new Map());
    }
    this.editingSessions.get(documentId).set(userId, {
      section,
      timestamp: new Date()
    });
  }

  /**
   * 편집 사용자 제거
   * @param {String} documentId - 문서 ID
   * @param {String} userId - 사용자 ID
   */
  removeEditingUser(documentId, userId) {
    if (this.editingSessions.has(documentId)) {
      this.editingSessions.get(documentId).delete(userId);
      
      // 세션이 비어있으면 제거
      if (this.editingSessions.get(documentId).size === 0) {
        this.editingSessions.delete(documentId);
      }
    }
  }

  /**
   * 작업 큐에 작업 추가
   * @param {String} documentId - 문서 ID
   * @param {Object} operation - 작업 정보
   * @returns {String} 작업 ID
   */
  addOperation(documentId, operation) {
    if (!this.operationQueue.has(documentId)) {
      this.operationQueue.set(documentId, []);
    }

    const operationId = uuidv4();
    const operationWithId = {
      ...operation,
      operationId,
      timestamp: new Date()
    };

    this.operationQueue.get(documentId).push(operationWithId);
    this.lastOperationId.set(documentId, operationId);

    // 큐 크기 제한 (최대 100개)
    if (this.operationQueue.get(documentId).length > 100) {
      this.operationQueue.get(documentId).shift();
    }

    return operationId;
  }

  /**
   * 문서 참여자 목록 조회
   * @param {String} documentId - 문서 ID
   * @returns {Array} 참여자 목록
   */
  getDocumentParticipants(documentId) {
    if (!this.documentSessions.has(documentId)) {
      return [];
    }

    const participants = [];
    const userIds = this.documentSessions.get(documentId);

    for (const userId of userIds) {
      const socket = this.activeUsers.get(userId);
      if (socket) {
        participants.push({
          userId: socket.userId,
          userName: socket.userName,
          userAvatar: socket.userAvatar,
          isEditing: this.isUserEditing(documentId, userId)
        });
      }
    }

    return participants;
  }

  /**
   * 사용자 편집 상태 확인
   * @param {String} documentId - 문서 ID
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 편집 중 여부
   */
  isUserEditing(documentId, userId) {
    return this.editingSessions.has(documentId) && 
           this.editingSessions.get(documentId).has(userId);
  }

  /**
   * 서비스 상태 조회
   * @returns {Object} 서비스 상태 정보
   */
  getServiceStatus() {
    return {
      activeUsers: this.activeUsers.size,
      documentSessions: this.documentSessions.size,
      editingSessions: this.editingSessions.size,
      cursorPositions: this.cursorPositions.size,
      operationQueues: this.operationQueue.size
    };
  }

  /**
   * 이벤트 리스너 설정 (다른 서비스와의 연동용)
   */
  setupEventHandlers() {
    // 외부 서비스에서 호출할 수 있는 이벤트 리스너들
    process.on('document_updated', (data) => {
      this.broadcastDocumentUpdate(data);
    });

    process.on('user_notification', (data) => {
      this.sendUserNotification(data);
    });
  }

  /**
   * 문서 업데이트 브로드캐스트
   * @param {Object} data - 업데이트 데이터
   */
  broadcastDocumentUpdate(data) {
    const { documentId, updateType, content } = data;
    
    if (this.io) {
      this.io.to(`document:${documentId}`).emit('document_updated', {
        updateType,
        content,
        timestamp: new Date()
      });
    }
  }

  /**
   * 사용자 알림 전송
   * @param {Object} data - 알림 데이터
   */
  sendUserNotification(data) {
    const { userId, notification } = data;
    
    const socket = this.activeUsers.get(userId);
    if (socket) {
      socket.emit('notification', {
        ...notification,
        timestamp: new Date()
      });
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const collaborationService = new CollaborationService();

export default collaborationService; 