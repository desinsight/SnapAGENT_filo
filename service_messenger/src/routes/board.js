// 게시판/게시글/댓글 라우터
const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { uploadMiddleware } = require('../middlewares/upload');

// 게시판 관련 라우트
router.post('/boards', boardController.createBoard);
router.get('/boards', boardController.getBoards);
router.get('/boards/:boardId', boardController.getBoard);

// 게시글 관련 라우트 (파일 업로드 포함)
router.post('/boards/:boardId/posts', uploadMiddleware('multiple'), boardController.createPost);
router.get('/boards/:boardId/posts', boardController.getPosts);
router.get('/posts/:postId', boardController.getPost);
router.put('/posts/:postId', uploadMiddleware('multiple'), boardController.updatePost);
router.delete('/posts/:postId', boardController.deletePost);

// 게시글 파일 첨부
router.post('/posts/:postId/attachments', boardController.attachFileToPost);
// 게시글 공지 상단고정/해제
router.patch('/posts/:postId/pin', boardController.setPostPin);

// 댓글 관련 라우트
router.post('/posts/:postId/comments', boardController.createComment);
router.get('/posts/:postId/comments', boardController.getComments);
router.put('/comments/:commentId', boardController.updateComment);
router.delete('/comments/:commentId', boardController.deleteComment);

// 검색 라우트
router.get('/search/posts', boardController.searchPosts);

// 게시판 멤버 초대
router.post('/boards/:boardId/members', boardController.inviteBoardMember);
// 게시판 멤버 강퇴
router.delete('/boards/:boardId/members/:userId', boardController.removeBoardMember);
// 게시판 멤버 역할 변경
router.patch('/boards/:boardId/members/:userId/role', boardController.changeBoardMemberRole);

module.exports = router; 