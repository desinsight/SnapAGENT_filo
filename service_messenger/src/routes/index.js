// API 라우터 엔트리포인트
// 각 도메인별 라우터 연결 (확장성 고려)

const express = require('express');
const router = express.Router();

// 헬스체크 라우터 연결
const healthRouter = require('./health');
router.use('/health', healthRouter);

// 메신저(채팅방/메시지) 라우터 연결
const messengerRouter = require('./messenger');
router.use('/messenger', messengerRouter);

// 게시판/게시글/댓글 라우터 연결
const boardRouter = require('./board');
router.use('/board', boardRouter);

// TODO: 메신저, 게시판 등 라우터 연결
// const messengerRouter = require('./messenger');
// router.use('/messenger', messengerRouter);
// const boardRouter = require('./board');
// router.use('/board', boardRouter);

module.exports = router; 