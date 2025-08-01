// 게시판/게시글/댓글 서비스 (비즈니스 로직)
const Board = require('../models/Board');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const notify = require('../plugins/notification');
const { ValidationError, PermissionError, NotFoundError } = require('../utils/errors');

// ===== MOCK DATA (몽고DB 없이 메모리에서 동작) =====
const mockBoards = [];
const mockPosts = [];
const mockComments = [];
let boardSeq = 1;
let postSeq = 1;
let commentSeq = 1;

/**
 * 게시판 생성 (mock)
 */
exports.createBoard = async (boardData, user) => {
  // TODO: 실제 DB 연동 시 BoardModel.create 등으로 교체
  const newBoard = {
    _id: 'board_' + boardSeq++,
    ...boardData,
    owner: user.id,
    createdAt: new Date(),
  };
  mockBoards.push(newBoard);
  return newBoard;
};

/**
 * 게시판 목록 조회 (mock)
 */
exports.getBoards = async (user, query = {}) => {
  // TODO: 실제 DB 연동 시 BoardModel.find 등으로 교체
  return mockBoards;
};

/**
 * 게시판 상세 조회
 */
exports.getBoard = async (boardId, user) => {
  try {
    const board = await Board.findById(boardId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!board) {
      throw new NotFoundError('게시판을 찾을 수 없습니다.');
    }

    // 권한 체크
    if (!board.isPublic && !user.roles.includes('admin')) {
      const isMember = board.members.some(member => member._id.toString() === user.id);
      if (!isMember) {
        throw new PermissionError('이 게시판에 접근할 권한이 없습니다.');
      }
    }

    return board;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      throw error;
    }
    throw new Error(`게시판 조회 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 게시글 생성 (mock)
 */
exports.createPost = async (boardId, postData, user) => {
  // TODO: 실제 DB 연동 시 PostModel.create 등으로 교체
  const newPost = {
    _id: 'post_' + postSeq++,
    boardId,
    ...postData,
    author: user.id,
    createdAt: new Date(),
  };
  mockPosts.push(newPost);
  return newPost;
};

/**
 * 게시글 목록 조회 (mock)
 */
exports.getPosts = async (boardId, query, user) => {
  // TODO: 실제 DB 연동 시 PostModel.find 등으로 교체
  return mockPosts.filter(post => post.boardId === boardId);
};

/**
 * 게시글 상세 조회
 */
exports.getPost = async (postId, user) => {
  try {
    const post = await Post.findById(postId)
      .populate('author', 'name email')
      .populate('board', 'name type isPublic')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email'
        }
      });

    if (!post) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.');
    }

    // 권한 체크
    if (!post.board.isPublic && !user.roles.includes('admin')) {
      const isMember = post.board.members.some(member => member.toString() === user.id);
      if (!isMember) {
        throw new PermissionError('이 게시글에 접근할 권한이 없습니다.');
      }
    }

    // 조회수 증가 (작성자 제외)
    if (post.author._id.toString() !== user.id) {
      await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
      post.viewCount += 1;
    }

    return post;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      throw error;
    }
    throw new Error(`게시글 조회 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 게시글 수정
 */
exports.updatePost = async (postId, postData, user) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.');
    }

    // 권한 체크: 작성자 또는 관리자만 수정 가능
    if (post.author.toString() !== user.id && !user.roles.includes('admin')) {
      throw new PermissionError('게시글을 수정할 권한이 없습니다.');
    }

    // 수정 가능한 필드만 업데이트
    const allowedFields = ['title', 'content', 'attachments', 'isPinned', 'isNotice'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (postData[field] !== undefined) {
        updateData[field] = postData[field];
      }
    });

    const updatedPost = await Post.findByIdAndUpdate(
      postId, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true }
    ).populate('author', 'name email');

    await notify('post_updated', { postId, post: updatedPost, user });
    return updatedPost;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      throw error;
    }
    throw new Error(`게시글 수정 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 게시글 삭제
 */
exports.deletePost = async (postId, user) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('게시글을 찾을 수 없습니다.');
    }

    // 권한 체크: 작성자 또는 관리자만 삭제 가능
    if (post.author.toString() !== user.id && !user.roles.includes('admin')) {
      throw new PermissionError('게시글을 삭제할 권한이 없습니다.');
    }

    // 댓글도 함께 삭제
    await Comment.deleteMany({ post: postId });

    // 게시판의 게시글 수 감소
    await Board.findByIdAndUpdate(post.board, { $inc: { postCount: -1 } });

    await Post.findByIdAndDelete(postId);

    await notify('post_deleted', { postId, post, user });
    return { message: '게시글이 삭제되었습니다.' };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      throw error;
    }
    throw new Error(`게시글 삭제 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 댓글 생성 (mock)
 */
exports.createComment = async (postId, commentData, user) => {
  // TODO: 실제 DB 연동 시 CommentModel.create 등으로 교체
  const newComment = {
    _id: 'comment_' + commentSeq++,
    postId,
    ...commentData,
    author: user.id,
    createdAt: new Date(),
  };
  mockComments.push(newComment);
  return newComment;
};

/**
 * 댓글 목록 조회 (mock)
 */
exports.getComments = async (postId, user) => {
  // TODO: 실제 DB 연동 시 CommentModel.find 등으로 교체
  return mockComments.filter(comment => comment.postId === postId);
};

/**
 * 댓글 수정
 */
exports.updateComment = async (commentId, commentData, user) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 권한 체크: 작성자 또는 관리자만 수정 가능
    if (comment.author.toString() !== user.id && !user.roles.includes('admin')) {
      throw new PermissionError('댓글을 수정할 권한이 없습니다.');
    }

    if (!commentData.content) {
      throw new ValidationError('댓글 내용은 필수입니다.');
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content: commentData.content, updatedAt: new Date() },
      { new: true }
    ).populate('author', 'name email');

    return updatedComment;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError || error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`댓글 수정 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 댓글 삭제
 */
exports.deleteComment = async (commentId, user) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 권한 체크: 작성자 또는 관리자만 삭제 가능
    if (comment.author.toString() !== user.id && !user.roles.includes('admin')) {
      throw new PermissionError('댓글을 삭제할 권한이 없습니다.');
    }

    // 대댓글도 함께 삭제
    await Comment.deleteMany({ parentComment: commentId });

    // 게시글에서 댓글 제거
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });

    await Comment.findByIdAndDelete(commentId);

    return { message: '댓글이 삭제되었습니다.' };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      throw error;
    }
    throw new Error(`댓글 삭제 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 게시글 검색/필터 (mock)
 */
exports.searchPosts = async (searchQuery, user) => {
  // TODO: 실제 DB/플랫폼 연동 시 고도화
  const { keyword, author, dateFrom, dateTo } = searchQuery;
  return mockPosts.filter(post => {
    let ok = true;
    if (keyword) ok = ok && (post.title?.includes(keyword) || post.content?.includes(keyword));
    if (author) ok = ok && post.author === author;
    if (dateFrom) ok = ok && new Date(post.createdAt) >= new Date(dateFrom);
    if (dateTo) ok = ok && new Date(post.createdAt) <= new Date(dateTo);
    return ok;
  });
};

/**
 * 공지글 상단고정/해제 (mock)
 */
exports.setPostPin = async (postId, pin, user) => {
  // TODO: 실제 DB 연동 시 고도화
  const post = mockPosts.find(p => p._id === postId);
  if (post) post.isPinned = !!pin;
  return { success: true, isPinned: !!pin };
};

/**
 * 게시판 구독 (mock)
 */
exports.subscribeBoard = async (boardId, user) => {
  // TODO: 실제 DB/플랫폼 연동 시 고도화
  if (!user.subscriptions) user.subscriptions = [];
  if (!user.subscriptions.includes(boardId)) user.subscriptions.push(boardId);
  return { success: true };
};

/**
 * 게시판 구독 해제 (mock)
 */
exports.unsubscribeBoard = async (boardId, user) => {
  // TODO: 실제 DB/플랫폼 연동 시 고도화
  if (user.subscriptions) user.subscriptions = user.subscriptions.filter(id => id !== boardId);
  return { success: true };
};

/**
 * 대댓글 생성 (mock)
 */
exports.createReply = async (commentId, replyData, user) => {
  // TODO: 실제 DB 연동 시 고도화
  const newReply = {
    _id: 'reply_' + (++commentSeq),
    parentCommentId: commentId,
    ...replyData,
    author: user.id,
    createdAt: new Date(),
  };
  mockComments.push(newReply);
  return newReply;
};

/**
 * 대댓글 목록 조회 (mock)
 */
exports.getReplies = async (commentId, user) => {
  // TODO: 실제 DB 연동 시 고도화
  return mockComments.filter(comment => comment.parentCommentId === commentId);
};

/**
 * 게시판 멤버 초대
 * @param {string} boardId
 * @param {string} userId
 * @param {object} actor (요청자)
 * @returns {Promise<object>} 결과
 */
exports.inviteBoardMember = async (boardId, userId, actor) => {
  // TODO: 권한 체크, 플랫폼 연동, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '멤버 초대(샘플)' };
};

/**
 * 게시판 멤버 강퇴
 * @param {string} boardId
 * @param {string} userId
 * @param {object} actor (요청자)
 * @returns {Promise<object>} 결과
 */
exports.removeBoardMember = async (boardId, userId, actor) => {
  // TODO: 권한 체크, 플랫폼 연동, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '멤버 강퇴(샘플)' };
};

/**
 * 게시판 멤버 역할 변경
 * @param {string} boardId
 * @param {string} userId
 * @param {string} newRole (admin|member|guest)
 * @param {object} actor (요청자)
 * @returns {Promise<object>} 결과
 */
exports.changeBoardMemberRole = async (boardId, userId, newRole, actor) => {
  // TODO: 권한 체크, 플랫폼 연동, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '역할 변경(샘플)' };
};

/**
 * 게시글 파일 첨부(메타데이터만 저장)
 * @param {string} postId
 * @param {object} fileMeta
 * @param {object} user
 * @returns {Promise<object>} 결과
 */
exports.attachFileToPost = async (postId, fileMeta, user) => {
  // TODO: 파일 메타데이터 저장, 실제 파일 저장은 외부 서비스 연동
  return { success: true, message: '게시글 파일 첨부(샘플)' };
}; 