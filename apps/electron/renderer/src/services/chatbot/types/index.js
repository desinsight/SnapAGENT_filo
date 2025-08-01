/**
 * Chatbot Service Types
 * 
 * 이 폴더에는 채팅봇 서비스 전용 타입 정의들이 포함됩니다:
 * - Message.js - 메시지 타입 정의
 * - Conversation.js - 대화 타입 정의
 * - ChatSettings.js - 채팅 설정 타입 정의
 * - ChatEvents.js - 채팅 이벤트 타입 정의
 */

// JavaScript에서는 JSDoc 주석으로 타입 정의 제공
/**
 * @typedef {Object} Message
 * @property {string} id - 메시지 고유 ID
 * @property {string} content - 메시지 내용
 * @property {'user'|'bot'} sender - 발신자 타입
 * @property {Date} timestamp - 메시지 시간
 * @property {string} [attachments] - 첨부파일 (선택사항)
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id - 대화 고유 ID
 * @property {string} title - 대화 제목
 * @property {Message[]} messages - 메시지 목록
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */