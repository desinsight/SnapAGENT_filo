/**
 * Authentication Middleware - 인증 미들웨어
 * JWT 토큰 기반 인증 및 권한 관리
 * 
 * @description
 * - JWT 토큰 검증
 * - 사용자 정보 추출
 * - 권한 확인
 * - 역할 기반 접근 제어
 * - 토큰 갱신
 * 
 * @author Your Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

/**
 * JWT 토큰 검증 및 사용자 정보 추출
 * 요청 헤더에서 JWT 토큰을 추출하고 검증하여 사용자 정보를 req.user에 설정
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    // 계정 상태 확인
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다.',
        code: 'INACTIVE_ACCOUNT'
      });
    }

    // 계정 잠금 확인
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: '잠긴 계정입니다.',
        code: 'LOCKED_ACCOUNT'
      });
    }

    // 사용자 정보를 요청 객체에 설정
    req.user = user;
    req.token = token;

    // 마지막 활동 시간 업데이트 (비동기)
    user.updateStats('lastActivityAt').catch(err => {
      logger.error('활동 시간 업데이트 실패:', err);
    });

    next();

  } catch (error) {
    logger.error('인증 미들웨어 오류:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 사용자 정보를 설정하고, 없어도 요청을 계속 진행
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 토큰이 없어도 계속 진행
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // 토큰 검증 실패 시 무시하고 계속 진행
      logger.debug('선택적 인증 실패 (무시됨):', error.message);
    }

    next();

  } catch (error) {
    logger.error('선택적 인증 미들웨어 오류:', error);
    next(); // 오류가 있어도 계속 진행
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * 특정 역할을 가진 사용자만 접근 허용
 * 
 * @param {...string} roles - 허용할 역할들
 * @returns {Function} Express 미들웨어 함수
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const hasRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * 권한 기반 접근 제어 미들웨어
 * 특정 리소스에 대한 특정 액션 권한을 확인
 * 
 * @param {string} resource - 리소스명
 * @param {string} action - 액션명
 * @returns {Function} Express 미들웨어 함수
 */
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!req.user.hasPermission(resource, action)) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * 관리자 전용 미들웨어
 * 관리자 역할을 가진 사용자만 접근 허용
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * 승인자 전용 미들웨어
 * 승인자 역할을 가진 사용자만 접근 허용
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const requireApprover = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (!req.user.isApprover) {
    return res.status(403).json({
      success: false,
      message: '승인자 권한이 필요합니다.',
      code: 'APPROVER_REQUIRED'
    });
  }

  next();
};

/**
 * 소유자 또는 관리자 미들웨어
 * 리소스 소유자이거나 관리자인 경우에만 접근 허용
 * 
 * @param {Function} getResourceOwnerId - 리소스 소유자 ID를 반환하는 함수
 * @returns {Function} Express 미들웨어 함수
 */
export const requireOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // 관리자는 모든 권한 보유
    if (req.user.isAdmin) {
      return next();
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (req.user._id === resourceOwnerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });

    } catch (error) {
      logger.error('소유자 확인 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '권한 확인 중 오류가 발생했습니다.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * 토큰 갱신 미들웨어
 * 토큰이 곧 만료될 경우 자동으로 갱신
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  if (!req.token) {
    return next();
  }

  try {
    const decoded = jwt.decode(req.token);
    
    if (!decoded) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;
    
    // 토큰이 30분 이내에 만료될 경우 갱신
    if (expiresIn < 1800 && expiresIn > 0) {
      const newToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // 새 토큰을 응답 헤더에 설정
      res.setHeader('X-New-Token', newToken);
      
      logger.debug(`토큰 갱신: 사용자 ${decoded.userId}`);
    }

    next();

  } catch (error) {
    logger.error('토큰 갱신 중 오류:', error);
    next(); // 오류가 있어도 계속 진행
  }
};

/**
 * 요청 속도 제한 미들웨어
 * 인증된 사용자별로 요청 속도 제한
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const rateLimitByUser = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const userId = req.user._id;
  const key = `rate_limit:${userId}`;
  const limit = 100; // 1분당 최대 100개 요청
  const windowMs = 60 * 1000; // 1분

  // Redis를 사용한 속도 제한 (Redis가 설정된 경우)
  if (process.env.REDIS_URL) {
    const { getCache, setCache } = require('../config/redis.js');
    
    getCache(key).then(current => {
      if (current && current.count >= limit) {
        return res.status(429).json({
          success: false,
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      const newCount = (current ? current.count : 0) + 1;
      setCache(key, { count: newCount }, windowMs / 1000);
      next();
    }).catch(() => {
      next(); // Redis 오류 시 제한 없이 진행
    });
  } else {
    next(); // Redis가 없으면 제한 없이 진행
  }
};

/**
 * 보안 헤더 설정 미들웨어
 * 보안 관련 HTTP 헤더 설정
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const securityHeaders = (req, res, next) => {
  // XSS 방지
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'DENY');
  
  // MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // HSTS (HTTPS 강제)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // 참조 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * 감사 로그 미들웨어
 * 인증된 사용자의 요청을 감사 로그에 기록
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const auditLogMiddleware = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const originalSend = res.send;
  
  res.send = function(data) {
    // 응답 완료 후 감사 로그 기록
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userId: req.user._id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    };

    // 비동기로 감사 로그 기록
    req.user.addActivityLog('api_request', logData).catch(err => {
      logger.error('감사 로그 기록 실패:', err);
    });

    originalSend.call(this, data);
  };

  next();
};

// 기본 내보내기
export default {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  requireAdmin,
  requireApprover,
  requireOwnerOrAdmin,
  refreshTokenMiddleware,
  rateLimitByUser,
  securityHeaders,
  auditLogMiddleware
}; 