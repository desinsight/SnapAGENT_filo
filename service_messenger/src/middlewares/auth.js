// JWT 인증 미들웨어 (플랫폼 토큰 검증)
// MCP 연동 유틸 사용

const { verifyPlatformToken } = require('../utils/mcpIntegration');

/**
 * JWT 인증 미들웨어
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    // MCP 플랫폼 토큰 검증 및 사용자 정보 조회
    const user = await verifyPlatformToken(token);
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('[인증 에러]', err);
    return res.status(401).json({ message: '토큰 검증 중 오류가 발생했습니다.' });
  }
}

/**
 * 플랫폼 JWT 토큰 검증 미들웨어
 * 플랫폼에서 발급한 JWT 토큰을 검증하여 사용자 인증을 수행합니다.
 * (공개키/시크릿 등은 config에서 관리, 실제 검증 로직은 utils/jwt.js 등에서 분리 구현 권장)
 */
const verifyPlatformJWT = (req, res, next) => {
  // 예시: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  // TODO: 실제 검증 로직은 utils/jwt.js 등에서 분리 구현
  // 예시: const payload = verifyJWT(token, 공개키/시크릿)
  try {
    // 임시: 토큰이 있으면 통과(실제 구현 필요)
    if (!token) throw new Error('Invalid token');
    req.user = { id: '샘플', role: 'user' }; // 실제 payload로 대체
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * 접근 권한 체크 미들웨어 (조직/팀/게시판/채팅방별)
 * @param {object} options - { type: 'board'|'chat'|'team'|'org', resourceIdParam: 'boardId'|'roomId' 등 }
 * @returns 미들웨어 함수
 *
 * 사용 예시: router.get('/boards/:boardId', checkPermission({ type: 'board', resourceIdParam: 'boardId' }), ... )
 */
const checkPermission = (options) => async (req, res, next) => {
  try {
    // 1. 사용자 정보(req.user)와 리소스 ID(req.params[resourceIdParam]) 추출
    const user = req.user;
    const resourceId = req.params[options.resourceIdParam];
    // 2. 실제 권한 체크 로직은 utils/permission.js 등에서 분리 구현 권장
    // 예시: const hasPermission = await checkUserPermission(user, options.type, resourceId);
    // TODO: 실제 권한 체크 로직 구현 필요
    const hasPermission = true; // 임시: 항상 통과
    if (!hasPermission) return res.status(403).json({ message: '권한이 없습니다.' });
    next();
  } catch (err) {
    return res.status(500).json({ message: '권한 체크 중 오류 발생', error: err.message });
  }
};

module.exports = { authMiddleware, verifyPlatformJWT, checkPermission }; 