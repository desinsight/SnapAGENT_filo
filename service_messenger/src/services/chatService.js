// 채팅방/메시지 서비스 (비즈니스 로직)
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// ===== MOCK DATA (몽고DB 없이 메모리에서 동작) =====
const mockChatRooms = [];
const mockMessages = [];
let chatRoomSeq = 1;
let messageSeq = 1;

/**
 * 채팅방 생성 (mock)
 */
exports.createRoom = async (roomData, user) => {
  // TODO: 실제 DB 연동 시 ChatRoomModel.create 등으로 교체
  const newRoom = {
    _id: 'room_' + chatRoomSeq++,
    ...roomData,
    members: [user],
    createdAt: new Date(),
  };
  mockChatRooms.push(newRoom);
  return newRoom;
};

/**
 * 채팅방 목록 조회 (mock)
 */
exports.getRooms = async (user) => {
  // TODO: 실제 DB 연동 시 ChatRoomModel.find 등으로 교체
  // (예시: 사용자가 멤버로 포함된 방만 반환)
  return mockChatRooms.filter(room => room.members.some(m => m.id === user.id));
};

/**
 * 채팅방 멤버 추가 (mock)
 */
exports.addMember = async (roomId, userId, user) => {
  // TODO: 실제 DB 연동 시 update 등으로 교체
  const room = mockChatRooms.find(r => r._id === roomId);
  if (!room) throw new Error('채팅방 없음');
  if (!room.members.some(m => m.id === userId)) {
    room.members.push({ id: userId });
  }
  return { success: true };
};

/**
 * 채팅방 멤버 삭제 (mock)
 */
exports.removeMember = async (roomId, userId, user) => {
  const room = mockChatRooms.find(r => r._id === roomId);
  if (!room) throw new Error('채팅방 없음');
  room.members = room.members.filter(m => m.id !== userId);
  return { success: true };
};

/**
 * 메시지 전송 (mock)
 */
exports.sendMessage = async (roomId, messageData, user) => {
  // TODO: 실제 DB 연동 시 MessageModel.create 등으로 교체
  const newMsg = {
    _id: 'msg_' + messageSeq++,
    roomId,
    sender: user.id,
    content: messageData.content,
    createdAt: new Date(),
  };
  mockMessages.push(newMsg);
  return newMsg;
};

/**
 * 메시지 목록 조회 (mock)
 */
exports.getMessages = async (roomId, query, user) => {
  // TODO: 실제 DB 연동 시 MessageModel.find 등으로 교체
  return mockMessages.filter(msg => msg.roomId === roomId);
};

/**
 * 채팅방 멤버 역할 변경
 * @param {string} roomId
 * @param {string} userId
 * @param {string} newRole (admin|member|guest)
 * @param {object} actor (요청자)
 * @returns {Promise<object>} 결과
 */
exports.changeMemberRole = async (roomId, userId, newRole, actor) => {
  // TODO: 권한 체크, 플랫폼 연동, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '역할 변경(샘플)' };
};

/**
 * 메시지 읽음 처리
 * @param {string} roomId
 * @param {string} messageId
 * @param {object} user
 * @returns {Promise<object>} 결과
 */
exports.markMessageAsRead = async (roomId, messageId, user) => {
  // TODO: DB 업데이트, 읽음 상태 기록 등 실제 구현 필요
  return { success: true, message: '읽음 처리(샘플)' };
};

/**
 * 메시지 수정
 * @param {string} roomId
 * @param {string} messageId
 * @param {string} newContent
 * @param {object} user
 * @returns {Promise<object>} 결과
 */
exports.editMessage = async (roomId, messageId, newContent, user) => {
  // TODO: 권한 체크, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '메시지 수정(샘플)' };
};

/**
 * 메시지 삭제
 * @param {string} roomId
 * @param {string} messageId
 * @param {object} user
 * @returns {Promise<object>} 결과
 */
exports.deleteMessage = async (roomId, messageId, user) => {
  // TODO: 권한 체크, DB 업데이트 등 실제 구현 필요
  return { success: true, message: '메시지 삭제(샘플)' };
};

/**
 * 메시지 파일 첨부(메타데이터만 저장)
 * @param {string} roomId
 * @param {string} messageId
 * @param {object} fileMeta
 * @param {object} user
 * @returns {Promise<object>} 결과
 */
exports.attachFileToMessage = async (roomId, messageId, fileMeta, user) => {
  // TODO: 파일 메타데이터 저장, 실제 파일 저장은 외부 서비스 연동
  return { success: true, message: '파일 첨부(샘플)' };
};

/**
 * 플랫폼 연동: 채팅방 멤버십/권한 체크 (mock)
 */
exports.checkRoomMembership = async (roomId, userId) => {
  // TODO: 실제 플랫폼 API 연동
  const room = mockChatRooms.find(r => r._id === roomId);
  if (!room) throw new Error('채팅방 없음');
  return room.members.some(m => m.id === userId);
};

/**
 * 실서비스 수준의 예외처리/보안 샘플 (모든 함수 try-catch, 에러 로깅)
 */
function safeAsync(fn) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (err) {
      require('../utils/logger').error('서비스 에러:', err);
      throw err;
    }
  };
}

// 기존 함수들을 safeAsync로 감싸기 (예시)
exports.createRoom = safeAsync(exports.createRoom);
exports.getRooms = safeAsync(exports.getRooms);
exports.addMember = safeAsync(exports.addMember);
exports.removeMember = safeAsync(exports.removeMember);
exports.sendMessage = safeAsync(exports.sendMessage);
exports.getMessages = safeAsync(exports.getMessages); 