// auth.js
// 인증 미들웨어 - 사용자 인증 및 권한 검증
// 추후 플랫폼 인증 시스템과 연동 예정

const response = require('../utils/response');

// 커스텀 에러 클래스 정의
class AuthenticationError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

/**
 * 토큰 검증 함수
 * @param {string} token - 검증할 토큰
 * @returns {Object|null} 검증된 사용자 정보 또는 null
 */
const validateToken = (token) => {
  try {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return null;
    }
    
    // 토큰 형식 검증 (실제 서비스에서는 JWT 검증 로직으로 대체)
    const cleanToken = token.trim();
    
    // 임시: 간단한 토큰 검증 (실제 서비스에서는 JWT, OAuth 등과 연동 필요)
    if (cleanToken === 'test-token' || cleanToken.startsWith('user-')) {
      return {
        id: cleanToken === 'test-token' ? 'test-user' : cleanToken.replace('user-', ''),
        role: 'user',
        permissions: ['read', 'write']
      };
    }
    
    return null;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return null;
  }
};

/**
 * 요청 헤더에서 토큰 추출
 * @param {Object} headers - 요청 헤더
 * @returns {string|null} 추출된 토큰 또는 null
 */
const extractTokenFromHeaders = (headers) => {
  try {
    // Authorization 헤더 확인
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }
    
    // Bearer 토큰 형식 확인
    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }
    
    return parts[1];
  } catch (error) {
    console.error('토큰 추출 오류:', error);
    return null;
  }
};

/**
 * 사용자 권한 검증
 * @param {Object} user - 사용자 정보
 * @param {Array<string>} requiredPermissions - 필요한 권한 목록
 * @returns {boolean} 권한 보유 여부
 */
const validatePermissions = (user, requiredPermissions = []) => {
  try {
    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    
    if (requiredPermissions.length === 0) {
      return true; // 권한 요구사항이 없으면 통과
    }
    
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  } catch (error) {
    console.error('권한 검증 오류:', error);
    return false;
  }
};

/**
 * 기본 인증 미들웨어
 * 요청 헤더의 Authorization 토큰을 검사하여 사용자 인증
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const authenticate = (req, res, next) => {
  try {
    // 테스트 환경 처리
    if (process.env.NODE_ENV === 'test') {
      req.user = { 
        id: 'test-user',
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      };
      return next();
    }
    
    // 토큰 추출
    const token = extractTokenFromHeaders(req.headers);
    if (!token) {
      return res.status(401).json(
        response.error('인증 토큰이 필요합니다.', 'AUTH_TOKEN_REQUIRED')
      );
    }
    
    // 토큰 검증
    const user = validateToken(token);
    if (!user) {
      return res.status(401).json(
        response.error('유효하지 않은 인증 토큰입니다.', 'INVALID_TOKEN')
      );
    }
    
    // 사용자 정보를 요청 객체에 추가
    req.user = user;
    next();
  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json(
      response.error('인증 처리 중 오류가 발생했습니다.', 'AUTH_ERROR')
    );
  }
};

/**
 * 권한 검증 미들웨어 팩토리
 * @param {Array<string>} requiredPermissions - 필요한 권한 목록
 * @returns {Function} 권한 검증 미들웨어 함수
 */
const requirePermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      // 인증 확인
      if (!req.user) {
        return res.status(401).json(
          response.error('인증이 필요합니다.', 'AUTHENTICATION_REQUIRED')
        );
      }
      
      // 권한 검증
      if (!validatePermissions(req.user, requiredPermissions)) {
        return res.status(403).json(
          response.error('접근 권한이 없습니다.', 'INSUFFICIENT_PERMISSIONS')
        );
      }
      
      next();
    } catch (error) {
      console.error('권한 검증 미들웨어 오류:', error);
      return res.status(500).json(
        response.error('권한 검증 중 오류가 발생했습니다.', 'PERMISSION_ERROR')
      );
    }
  };
};

/**
 * 소유자 확인 미들웨어
 * 리소스 소유자와 현재 사용자가 일치하는지 확인
 * @param {Function} getOwnerId - 소유자 ID를 가져오는 함수
 * @returns {Function} 소유자 확인 미들웨어 함수
 */
const requireOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      // 인증 확인
      if (!req.user) {
        return res.status(401).json(
          response.error('인증이 필요합니다.', 'AUTHENTICATION_REQUIRED')
        );
      }
      
      // 소유자 ID 가져오기
      const resourceOwnerId = await getOwnerId(req);
      if (!resourceOwnerId) {
        return res.status(404).json(
          response.error('리소스를 찾을 수 없습니다.', 'RESOURCE_NOT_FOUND')
        );
      }
      
      // 소유자 확인
      if (req.user.id !== resourceOwnerId && req.user.role !== 'admin') {
        return res.status(403).json(
          response.error('리소스에 대한 접근 권한이 없습니다.', 'ACCESS_DENIED')
        );
      }
      
      next();
    } catch (error) {
      console.error('소유자 확인 미들웨어 오류:', error);
      return res.status(500).json(
        response.error('소유자 확인 중 오류가 발생했습니다.', 'OWNERSHIP_ERROR')
      );
    }
  };
};

/**
 * 관리자 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const requireAdmin = (req, res, next) => {
  try {
    // 인증 확인
    if (!req.user) {
      return res.status(401).json(
        response.error('인증이 필요합니다.', 'AUTHENTICATION_REQUIRED')
      );
    }
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json(
        response.error('관리자 권한이 필요합니다.', 'ADMIN_REQUIRED')
      );
    }
    
    next();
  } catch (error) {
    console.error('관리자 권한 확인 미들웨어 오류:', error);
    return res.status(500).json(
      response.error('권한 확인 중 오류가 발생했습니다.', 'PERMISSION_ERROR')
    );
  }
};

module.exports = {
  authenticate,
  requirePermissions,
  requireOwnership,
  requireAdmin,
  validateToken,
  validatePermissions
}; 