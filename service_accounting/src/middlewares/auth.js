/**
 * 🔐 Authentication Middleware
 * 
 * JWT 기반 인증 미들웨어
 * 플랫폼 통합 인증 시스템과 연동
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * JWT 토큰 검증 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    // 사용자 상태 확인
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다.'
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    logger.error('인증 미들웨어 오류', {
      error: error.message,
      token: req.headers['authorization']?.split(' ')[1]?.substring(0, 10) + '...'
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    }

    res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * @param {Array} roles - 허용된 역할 목록
 * @returns {Function} 미들웨어 함수
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 역할 확인
      const userRole = req.user.role;
      if (!roles.includes(userRole)) {
        logger.warn('권한 없는 접근 시도', {
          userId: req.user.id,
          userRole,
          requiredRoles: roles,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: '접근 권한이 없습니다.'
        });
      }

      next();
    } catch (error) {
      logger.error('역할 검증 미들웨어 오류', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: '권한 검증 중 오류가 발생했습니다.'
      });
    }
  };
};

/**
 * 권한 기반 접근 제어 미들웨어
 * @param {Array} permissions - 필요한 권한 목록
 * @returns {Function} 미들웨어 함수
 */
export const requirePermission = (permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      // 사용자 권한 확인
      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('권한 없는 접근 시도', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions: permissions,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: '필요한 권한이 없습니다.'
        });
      }

      next();
    } catch (error) {
      logger.error('권한 검증 미들웨어 오류', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: '권한 검증 중 오류가 발생했습니다.'
      });
    }
  };
};

/**
 * 조직 접근 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const requireOrganizationAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { organizationId } = req.params;
    const userOrganizationId = req.user.organizationId;

    // 관리자는 모든 조직에 접근 가능
    if (req.user.role === 'admin') {
      return next();
    }

    // 사용자의 조직과 요청된 조직이 일치하는지 확인
    if (organizationId && userOrganizationId !== organizationId) {
      logger.warn('조직 접근 권한 없음', {
        userId: req.user.id,
        userOrganizationId,
        requestedOrganizationId: organizationId,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: '해당 조직에 대한 접근 권한이 없습니다.'
      });
    }

    next();
  } catch (error) {
    logger.error('조직 접근 권한 확인 미들웨어 오류', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: '조직 접근 권한 확인 중 오류가 발생했습니다.'
    });
  }
};

/**
 * API 키 인증 미들웨어 (외부 서비스 연동용)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API 키가 필요합니다.'
      });
    }

    // API 키 검증 (환경변수에서 관리)
    const validApiKeys = process.env.API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      logger.warn('유효하지 않은 API 키 사용', {
        apiKey: apiKey.substring(0, 10) + '...',
        ip: req.ip,
        path: req.path
      });

      return res.status(401).json({
        success: false,
        message: '유효하지 않은 API 키입니다.'
      });
    }

    next();
  } catch (error) {
    logger.error('API 키 인증 미들웨어 오류', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'API 키 인증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 요청 속도 제한 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const rateLimit = (req, res, next) => {
  // TODO: Redis를 사용한 요청 속도 제한 구현
  // 현재는 기본 구현만 제공
  next();
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOrganizationAccess,
  authenticateApiKey,
  rateLimit
}; 