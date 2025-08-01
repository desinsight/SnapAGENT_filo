// 메신저(채팅방/메시지) 라우터
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 채팅방 생성
router.post('/rooms', chatController.createRoom);
// 채팅방 목록 조회
router.get('/rooms', chatController.getRooms);
// 채팅방 멤버 추가
router.post('/rooms/:roomId/members', chatController.addMember);
// 채팅방 멤버 삭제
router.delete('/rooms/:roomId/members', chatController.removeMember);
// 채팅방 멤버 역할 변경
router.patch('/rooms/:roomId/members/:userId/role', chatController.changeMemberRole);
// 메시지 전송
router.post('/rooms/:roomId/messages', chatController.sendMessage);
// 메시지 목록 조회
router.get('/rooms/:roomId/messages', chatController.getMessages);
// 메시지 읽음 처리
router.post('/rooms/:roomId/messages/:messageId/read', chatController.markMessageAsRead);
// 메시지 수정
router.patch('/rooms/:roomId/messages/:messageId', chatController.editMessage);
// 메시지 삭제
router.delete('/rooms/:roomId/messages/:messageId', chatController.deleteMessage);
// 메시지 파일 첨부
router.post('/rooms/:roomId/messages/:messageId/attachments', chatController.attachFileToMessage);

module.exports = router; 