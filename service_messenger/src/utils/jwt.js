// 플랫폼 JWT 토큰 검증 유틸리티
// 실제 공개키/시크릿 등은 config에서 관리
// 외부 라이브러리(jsonwebtoken 등) 사용 권장

/**
 * JWT 토큰 검증 함수
 * @param {string} token - JWT 토큰
 * @returns {object} payload - 검증된 페이로드(실패시 에러 throw)
 */
function verifyJWT(token) {
  // TODO: 실제 검증 로직 구현 (예: jsonwebtoken.verify 등)
  // 예시: return jwt.verify(token, 공개키/시크릿)
  throw new Error('verifyJWT는 아직 구현되지 않았습니다.');
}

module.exports = { verifyJWT }; 