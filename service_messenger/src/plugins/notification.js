// 알림 플러그인 예시
// 주요 이벤트 발생 시 외부 알림 서비스 연동/로깅 등 확장 가능

/**
 * 알림 플러그인 함수
 * @param {string} event - 이벤트명 (예: 'message_sent', 'comment_created')
 * @param {object} data - 이벤트 데이터
 */
module.exports = async function notify(event, data) {
  // TODO: 외부 알림 서비스 연동(예: 사내 알림, 슬랙, 이메일 등)
  console.log(`[알림 플러그인] 이벤트: ${event}`, data);
}; 