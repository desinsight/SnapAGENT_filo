// 플랫폼 연동 API 유틸리티
// 사용자/조직/팀 정보는 자체 DB 최소화, 플랫폼 API 연동으로 처리
// 실제 API 엔드포인트/인증 방식 등은 TODO

/**
 * 플랫폼 사용자 정보 조회
 * @param {string} userId
 * @returns {Promise<object>} 사용자 정보
 */
async function getUserInfo(userId) {
  // TODO: 실제 플랫폼 API 연동 구현
  // 예시: fetch('https://platform/api/users/' + userId)
  return { id: userId, name: '샘플유저' };
}

/**
 * 플랫폼 조직 정보 조회
 * @param {string} orgId
 * @returns {Promise<object>} 조직 정보
 */
async function getOrgInfo(orgId) {
  // TODO: 실제 플랫폼 API 연동 구현
  return { id: orgId, name: '샘플조직' };
}

/**
 * 플랫폼 팀 정보 조회
 * @param {string} teamId
 * @returns {Promise<object>} 팀 정보
 */
async function getTeamInfo(teamId) {
  // TODO: 실제 플랫폼 API 연동 구현
  return { id: teamId, name: '샘플팀' };
}

module.exports = { getUserInfo, getOrgInfo, getTeamInfo }; 