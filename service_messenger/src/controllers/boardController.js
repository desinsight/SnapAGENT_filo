// 게시판/게시글/댓글 컨트롤러
// 비즈니스 로직은 서비스로 위임, 에러 핸들링 포함

const boardService = require('../services/boardService');
const { ValidationError, PermissionError, NotFoundError } = require('../utils/errors');

/**
 * 게시판 생성
 */
exports.createBoard = async (req, res) => {
  try {
    const board = await boardService.createBoard(req.body, req.user);
    res.status(201).json({
      success: true,
      data: board,
      message: '게시판이 생성되었습니다.'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PermissionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시판 생성 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시판 목록 조회
 */
exports.getBoards = async (req, res) => {
  try {
    const result = await boardService.getBoards(req.user, req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: '게시판 목록 조회 중 오류가 발생했습니다.' }
    });
  }
};

/**
 * 게시판 상세 조회
 */
exports.getBoard = async (req, res) => {
  try {
    const board = await boardService.getBoard(req.params.boardId, req.user);
    res.json({
      success: true,
      data: board
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시판 조회 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 작성
 */
exports.createPost = async (req, res) => {
  try {
    const post = await boardService.createPost(req.params.boardId, req.body, req.user);
    res.status(201).json({
      success: true,
      data: post,
      message: '게시글이 작성되었습니다.'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시글 작성 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 목록 조회
 */
exports.getPosts = async (req, res) => {
  try {
    const result = await boardService.getPosts(req.params.boardId, req.query, req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시글 목록 조회 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 상세 조회
 */
exports.getPost = async (req, res) => {
  try {
    const post = await boardService.getPost(req.params.postId, req.user);
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시글 조회 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 수정
 */
exports.updatePost = async (req, res) => {
  try {
    const post = await boardService.updatePost(req.params.postId, req.body, req.user);
    res.json({
      success: true,
      data: post,
      message: '게시글이 수정되었습니다.'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시글 수정 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 삭제
 */
exports.deletePost = async (req, res) => {
  try {
    const result = await boardService.deletePost(req.params.postId, req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '게시글 삭제 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 댓글 작성
 */
exports.createComment = async (req, res) => {
  try {
    const comment = await boardService.createComment(req.params.postId, req.body, req.user);
    res.status(201).json({
      success: true,
      data: comment,
      message: '댓글이 작성되었습니다.'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '댓글 작성 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 댓글 목록 조회
 */
exports.getComments = async (req, res) => {
  try {
    const comments = await boardService.getComments(req.params.postId, req.user);
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '댓글 목록 조회 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 댓글 수정
 */
exports.updateComment = async (req, res) => {
  try {
    const comment = await boardService.updateComment(req.params.commentId, req.body, req.user);
    res.json({
      success: true,
      data: comment,
      message: '댓글이 수정되었습니다.'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '댓글 수정 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 댓글 삭제
 */
exports.deleteComment = async (req, res) => {
  try {
    const result = await boardService.deleteComment(req.params.commentId, req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof PermissionError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: '댓글 삭제 중 오류가 발생했습니다.' }
      });
    }
  }
};

/**
 * 게시글 검색
 */
exports.searchPosts = async (req, res) => {
  try {
    const result = await boardService.searchPosts(req.query, req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: '게시글 검색 중 오류가 발생했습니다.' }
    });
  }
};

/**
 * 게시판 멤버 초대 API
 * POST /board/boards/:boardId/members
 */
exports.inviteBoardMember = async (req, res) => {
  const { boardId } = req.params;
  const { userId } = req.body;
  const actor = req.user;
  try {
    const result = await require('../services/boardService').inviteBoardMember(boardId, userId, actor);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '멤버 초대 실패', error: err.message });
  }
};

/**
 * 게시판 멤버 강퇴 API
 * DELETE /board/boards/:boardId/members/:userId
 */
exports.removeBoardMember = async (req, res) => {
  const { boardId, userId } = req.params;
  const actor = req.user;
  try {
    const result = await require('../services/boardService').removeBoardMember(boardId, userId, actor);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '멤버 강퇴 실패', error: err.message });
  }
};

/**
 * 게시판 멤버 역할 변경 API
 * PATCH /board/boards/:boardId/members/:userId/role
 */
exports.changeBoardMemberRole = async (req, res) => {
  const { boardId, userId } = req.params;
  const { newRole } = req.body;
  const actor = req.user;
  try {
    const result = await require('../services/boardService').changeBoardMemberRole(boardId, userId, newRole, actor);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '멤버 역할 변경 실패', error: err.message });
  }
};

/**
 * 게시글 파일 첨부 API
 * POST /board/posts/:postId/attachments
 */
exports.attachFileToPost = async (req, res) => {
  const { postId } = req.params;
  const fileMeta = req.body.fileMeta;
  const user = req.user;
  try {
    const result = await require('../services/boardService').attachFileToPost(postId, fileMeta, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '파일 첨부 실패', error: err.message });
  }
};

/**
 * 게시글 공지 상단고정/해제 API
 * PATCH /board/posts/:postId/pin
 */
exports.setPostPin = async (req, res) => {
  const { postId } = req.params;
  const { pin } = req.body;
  const user = req.user;
  try {
    const result = await require('../services/boardService').setPostPin(postId, pin, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '상단고정/해제 실패', error: err.message });
  }
}; 