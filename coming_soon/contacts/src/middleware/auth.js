/**
 * 🔐 Authentication Middleware
 * 
 * JWT 기반 인증 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { createAuthError, createPermissionError } from './errorHandler.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 🔑 JWT 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터
 * @returns {string} JWT 토큰
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'contacts-service',
    audience: 'contacts-app'
  });
};

/**
 * 🔍 JWT 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {Object} 디코딩된 토큰 데이터
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'contacts-service',
      audience: 'contacts-app'
    });
  } catch (error) {
    throw createAuthError('유효하지 않은 토큰입니다.');
  }
};

/**
 * 🛡️ 인증 미들웨어
 * 요청에서 JWT 토큰을 추출하고 검증하여 사용자 정보를 req.user에 설정
 */
export const auth = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAuthError('인증 토큰이 필요합니다.');
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    if (!token) {
      throw createAuthError('토큰이 비어있습니다.');
    }
    
    // 토큰 검증
    const decoded = verifyToken(token);
    
    // 사용자 정보 설정
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };
    
    // 로그 기록
    logger.debug(`인증 성공: ${req.user.email} (${req.user.userId})`);
    
    next();
    
  } catch (error) {
    logger.warn(`인증 실패: ${error.message} - IP: ${req.ip}`);
    next(error);
  }
};

/**
 * 🔒 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      };
      
      logger.debug(`선택적 인증 성공: ${req.user.email}`);
    }
    
    next();
    
  } catch (error) {
    // 인증 실패해도 계속 진행 (선택적 인증)
    logger.debug(`선택적 인증 실패: ${error.message}`);
    next();
  }
};

/**
 * 👑 관리자 권한 확인 미들웨어
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(createAuthError('인증이 필요합니다.'));
  }
  
  if (req.user.role !== 'admin') {
    return next(createPermissionError('관리자 권한이 필요합니다.'));
  }
  
  next();
};

/**
 * 🔐 특정 권한 확인 미들웨어
 * @param {string|Array} requiredPermissions - 필요한 권한
 */
export const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createAuthError('인증이 필요합니다.'));
    }
    
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission) || req.user.role === 'admin'
    );
    
    if (!hasPermission) {
      return next(createPermissionError('필요한 권한이 없습니다.'));
    }
    
    next();
  };
};

/**
 * 🔍 리소스 소유권 확인 미들웨어
 * @param {string} resourceUserIdField - 리소스의 사용자 ID 필드명
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createAuthError('인증이 필요합니다.'));
    }
    
    // 관리자는 모든 리소스에 접근 가능
    if (req.user.role === 'admin') {
      return next();
    }
    
    // 리소스의 사용자 ID 확인
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return next(createPermissionError('리소스 정보를 찾을 수 없습니다.'));
    }
    
    if (resourceUserId !== req.user.userId) {
      return next(createPermissionError('해당 리소스에 대한 접근 권한이 없습니다.'));
    }
    
    next();
  };
};

/**
 * 🔄 토큰 갱신 미들웨어
 */
export const refreshToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createAuthError('인증 토큰이 필요합니다.'));
    }
    
    const token = authHeader.substring(7);
    
    // 토큰 검증 (만료된 토큰도 허용)
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'contacts-service',
      audience: 'contacts-app',
      ignoreExpiration: true // 만료 무시
    });
    
    // 새 토큰 생성
    const newToken = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions
    });
    
    // 응답 헤더에 새 토큰 설정
    res.setHeader('X-New-Token', newToken);
    res.setHeader('X-Token-Expires-In', JWT_EXPIRES_IN);
    
    // 기존 사용자 정보 설정
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };
    
    next();
    
  } catch (error) {
    next(createAuthError('토큰 갱신에 실패했습니다.'));
  }
};

/**
 * 📊 인증 통계
 */
class AuthStats {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulAuth: 0,
      failedAuth: 0,
      tokenRefresh: 0,
      byRole: {},
      byIP: {}
    };
  }
  
  recordRequest(success, role = 'unknown', ip = 'unknown') {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulAuth++;
      this.stats.byRole[role] = (this.stats.byRole[role] || 0) + 1;
    } else {
      this.stats.failedAuth++;
    }
    
    this.stats.byIP[ip] = (this.stats.byIP[ip] || 0) + 1;
  }
  
  recordTokenRefresh() {
    this.stats.tokenRefresh++;
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  reset() {
    this.stats = {
      totalRequests: 0,
      successfulAuth: 0,
      failedAuth: 0,
      tokenRefresh: 0,
      byRole: {},
      byIP: {}
    };
  }
}

export const authStats = new AuthStats();

// 인증 미들웨어에 통계 추가
const originalAuth = auth;
export const authWithStats = (req, res, next) => {
  const startTime = Date.now();
  
  originalAuth(req, res, (error) => {
    const success = !error;
    const role = req.user?.role || 'unknown';
    const ip = req.ip || 'unknown';
    
    authStats.recordRequest(success, role, ip);
    
    if (error) {
      logger.warn(`인증 실패: ${error.message} - IP: ${ip} - 소요시간: ${Date.now() - startTime}ms`);
    } else {
      logger.debug(`인증 성공: ${req.user.email} - IP: ${ip} - 소요시간: ${Date.now() - startTime}ms`);
    }
    
    next(error);
  });
}; 