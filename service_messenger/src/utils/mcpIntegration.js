// MCP/플랫폼 연동 유틸리티 예시
// 실제 MCP API 연동, 토큰 검증, 사용자/조직/팀 정보 조회 등 확장 포인트
const axios = require('axios');

/**
 * 플랫폼 토큰 검증 및 사용자 정보 조회 (실제 MCP 인증 서버 연동 예시)
 * @param {string} token - JWT 토큰
 * @returns {Promise<object>} 사용자 정보
 */
async function verifyPlatformToken(token) {
  try {
    // 실제 MCP 인증 서버에 토큰 검증 요청 (예시 URL)
    const response = await axios.post(
      process.env.MCP_AUTH_URL || 'https://platform.example.com/api/auth/verify',
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    // 성공 시 사용자 정보 반환
    return response.data.user;
  } catch (err) {
    // 인증 실패 또는 네트워크 오류
    console.error('[MCP 인증 연동 에러]', err.response?.data || err.message);
    return null;
  }
}

/**
 * 조직/팀 정보 조회 (실제 MCP 조직 API 연동 예시)
 * @param {string} orgId
 * @returns {Promise<object>} 조직 정보
 */
async function getOrganizationInfo(orgId) {
  try {
    // 실제 MCP 조직 API에 조직 정보 요청 (예시 URL)
    const response = await axios.get(
      `${process.env.MCP_ORG_URL || 'https://platform.example.com/api/orgs'}/${orgId}`
    );
    return response.data;
  } catch (err) {
    console.error('[MCP 조직 연동 에러]', err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  verifyPlatformToken,
  getOrganizationInfo
}; 