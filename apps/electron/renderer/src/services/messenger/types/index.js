/**
 * Messenger Service Types
 * 
 * 이 폴더에는 메신저 서비스 전용 타입 정의들이 포함됩니다:
 */

// JavaScript에서는 JSDoc 주석으로 타입 정의 제공
/**
 * @typedef {Object} Message
 * @property {string} id - 메시지 고유 ID
 * @property {string} content - 메시지 내용
 * @property {string} senderId - 발신자 ID
 * @property {string} receiverId - 수신자 ID
 * @property {Date} timestamp - 전송 시간
 * @property {'text'|'image'|'file'|'voice'} type - 메시지 타입
 * @property {'sent'|'delivered'|'read'} status - 메시지 상태
 * @property {string[]} [attachments] - 첨부파일 목록
 */

/**
 * @typedef {Object} ChatRoom
 * @property {string} id - 채팅방 ID
 * @property {string} name - 채팅방 이름
 * @property {'private'|'group'} type - 채팅방 타입
 * @property {string[]} participants - 참여자 ID 목록
 * @property {Message} lastMessage - 마지막 메시지
 * @property {Date} createdAt - 생성 시간
 * @property {boolean} isArchived - 보관 여부
 */

/**
 * @typedef {Object} Contact
 * @property {string} id - 연락처 ID
 * @property {string} name - 이름
 * @property {string} email - 이메일
 * @property {string} phone - 전화번호
 * @property {string} avatar - 프로필 이미지
 * @property {'online'|'offline'|'away'} status - 접속 상태
 * @property {Date} lastSeen - 마지막 접속 시간
 */