// 채팅방/메시지 컨트롤러
// 비즈니스 로직은 서비스로 위임, 에러 핸들링 포함

const chatService = require('../services/chatService');

/**
 * 채팅방 생성
 */
exports.createRoom = async (req, res) => {
  try {
    const room = await chatService.createRoom(req.body, req.user);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: '채팅방 생성 실패', error: err.message });
  }
};

/**
 * 채팅방 목록 조회
 */
exports.getRooms = async (req, res) => {
  try {
    const rooms = await chatService.getRooms(req.user);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: '채팅방 목록 조회 실패', error: err.message });
  }
};

/**
 * 채팅방 멤버 추가
 */
exports.addMember = async (req, res) => {
  try {
    const room = await chatService.addMember(req.params.roomId, req.body.userId, req.user);
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: '멤버 추가 실패', error: err.message });
  }
};

/**
 * 채팅방 멤버 삭제
 */
exports.removeMember = async (req, res) => {
  try {
    const room = await chatService.removeMember(req.params.roomId, req.body.userId, req.user);
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: '멤버 삭제 실패', error: err.message });
  }
};

/**
 * 메시지 전송
 */
exports.sendMessage = async (req, res) => {
  try {
    const message = await chatService.sendMessage(req.params.roomId, req.body, req.user);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: '메시지 전송 실패', error: err.message });
  }
};

/**
 * 메시지 목록 조회
 */
exports.getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.params.roomId, req.query, req.user);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: '메시지 목록 조회 실패', error: err.message });
  }
};

/**
 * 채팅방 멤버 역할 변경 API
 * PATCH /messenger/rooms/:roomId/members/:userId/role
 */
exports.changeMemberRole = async (req, res) => {
  const { roomId, userId } = req.params;
  const { newRole } = req.body;
  const actor = req.user;
  try {
    // 서비스 함수 호출
    const result = await require('../services/chatService').changeMemberRole(roomId, userId, newRole, actor);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '멤버 역할 변경 실패', error: err.message });
  }
};

/**
 * 메시지 읽음 처리 API
 * POST /messenger/rooms/:roomId/messages/:messageId/read
 */
exports.markMessageAsRead = async (req, res) => {
  const { roomId, messageId } = req.params;
  const user = req.user;
  try {
    const result = await require('../services/chatService').markMessageAsRead(roomId, messageId, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '읽음 처리 실패', error: err.message });
  }
};

/**
 * 메시지 수정 API
 * PATCH /messenger/rooms/:roomId/messages/:messageId
 */
exports.editMessage = async (req, res) => {
  const { roomId, messageId } = req.params;
  const { newContent } = req.body;
  const user = req.user;
  try {
    const result = await require('../services/chatService').editMessage(roomId, messageId, newContent, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '메시지 수정 실패', error: err.message });
  }
};

/**
 * 메시지 삭제 API
 * DELETE /messenger/rooms/:roomId/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
  const { roomId, messageId } = req.params;
  const user = req.user;
  try {
    const result = await require('../services/chatService').deleteMessage(roomId, messageId, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '메시지 삭제 실패', error: err.message });
  }
};

/**
 * 메시지 파일 첨부 API
 * POST /messenger/rooms/:roomId/messages/:messageId/attachments
 */
exports.attachFileToMessage = async (req, res) => {
  const { roomId, messageId } = req.params;
  const fileMeta = req.body.fileMeta;
  const user = req.user;
  try {
    const result = await require('../services/chatService').attachFileToMessage(roomId, messageId, fileMeta, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '파일 첨부 실패', error: err.message });
  }
}; 