/**
 * Authentication Middleware - 인증 미들웨어
 * JWT 토큰 검증 및 사용자 인증 처리
 * 
 * @description
 * - JWT 토큰 검증
 * - 사용자 정보 추출
 * - 권한 확인
 * - 인증 실패 처리
 * - 토큰 갱신 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

/**
 * JWT 토큰 검증 및 사용자 정보 추출
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
        code: 'TOKEN_REQUIRED'
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

    // 사용자 상태 확인
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다.',
        code: 'INACTIVE_ACCOUNT'
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.token = token;

    // 마지막 활동 시간 업데이트
    user.metadata.lastActiveAt = new Date();
    await user.save();

    logger.debug(`🔐 인증 성공: ${user.email} (${user._id})`);
    next();

  } catch (error) {
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

    logger.error('인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 추가, 없어도 통과)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 토큰이 없어도 통과
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
      
      // 마지막 활동 시간 업데이트
      user.metadata.lastActiveAt = new Date();
      await user.save();
    }

    next();

  } catch (error) {
    // 토큰 오류가 있어도 통과 (선택적 인증이므로)
    next();
  }
};

/**
 * 관리자 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    // 먼저 기본 인증 수행
    await authMiddleware(req, res, (err) => {
      if (err) return next(err);
    });

    // 관리자 권한 확인
    const user = req.user;
    const isAdmin = user.organizations.some(org => 
      org.role === 'owner' || org.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();

  } catch (error) {
    logger.error('관리자 인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.',
      code: 'PERMISSION_ERROR'
    });
  }
};

/**
 * 조직 멤버 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const organizationMemberMiddleware = async (req, res, next) => {
  try {
    // 먼저 기본 인증 수행
    await authMiddleware(req, res, (err) => {
      if (err) return next(err);
    });

    const organizationId = req.params.organizationId || req.body.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: '조직 ID가 필요합니다.',
        code: 'ORGANIZATION_ID_REQUIRED'
      });
    }

    const user = req.user;
    const organization = user.organizations.find(org => 
      org.organizationId.toString() === organizationId.toString()
    );

    if (!organization || organization.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '해당 조직의 멤버가 아닙니다.',
        code: 'NOT_ORGANIZATION_MEMBER'
      });
    }

    req.organization = organization;
    next();

  } catch (error) {
    logger.error('조직 멤버 인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '조직 권한 확인 중 오류가 발생했습니다.',
      code: 'ORGANIZATION_PERMISSION_ERROR'
    });
  }
};

/**
 * 팀 멤버 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const teamMemberMiddleware = async (req, res, next) => {
  try {
    // 먼저 기본 인증 수행
    await authMiddleware(req, res, (err) => {
      if (err) return next(err);
    });

    const teamId = req.params.teamId || req.body.teamId;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: '팀 ID가 필요합니다.',
        code: 'TEAM_ID_REQUIRED'
      });
    }

    const user = req.user;
    const team = user.teams.find(t => 
      t.teamId.toString() === teamId.toString()
    );

    if (!team || team.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '해당 팀의 멤버가 아닙니다.',
        code: 'NOT_TEAM_MEMBER'
      });
    }

    req.team = team;
    next();

  } catch (error) {
    logger.error('팀 멤버 인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '팀 권한 확인 중 오류가 발생했습니다.',
      code: 'TEAM_PERMISSION_ERROR'
    });
  }
};

/**
 * 프로젝트 멤버 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const projectMemberMiddleware = async (req, res, next) => {
  try {
    // 먼저 기본 인증 수행
    await authMiddleware(req, res, (err) => {
      if (err) return next(err);
    });

    const projectId = req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '프로젝트 ID가 필요합니다.',
        code: 'PROJECT_ID_REQUIRED'
      });
    }

    // 프로젝트 모델 임포트
    const Project = (await import('../models/Project.js')).default;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    const user = req.user;
    const isMember = project.members.some(member => 
      member.userId.toString() === user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: '해당 프로젝트의 멤버가 아닙니다.',
        code: 'NOT_PROJECT_MEMBER'
      });
    }

    req.project = project;
    next();

  } catch (error) {
    logger.error('프로젝트 멤버 인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로젝트 권한 확인 중 오류가 발생했습니다.',
      code: 'PROJECT_PERMISSION_ERROR'
    });
  }
};

/**
 * 태스크 접근 권한 확인 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const taskAccessMiddleware = async (req, res, next) => {
  try {
    // 먼저 기본 인증 수행
    await authMiddleware(req, res, (err) => {
      if (err) return next(err);
    });

    const taskId = req.params.taskId || req.params.id;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '태스크 ID가 필요합니다.',
        code: 'TASK_ID_REQUIRED'
      });
    }

    // 태스크 모델 임포트
    const Task = (await import('../models/Task.js')).default;
    
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '태스크를 찾을 수 없습니다.',
        code: 'TASK_NOT_FOUND'
      });
    }

    const user = req.user;
    
    // 태스크 접근 권한 확인
    const hasAccess = await checkTaskAccess(task, user);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '해당 태스크에 접근할 권한이 없습니다.',
        code: 'TASK_ACCESS_DENIED'
      });
    }

    req.task = task;
    next();

  } catch (error) {
    logger.error('태스크 접근 권한 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '태스크 권한 확인 중 오류가 발생했습니다.',
      code: 'TASK_PERMISSION_ERROR'
    });
  }
};

/**
 * 태스크 접근 권한 확인 함수
 * @param {Object} task - 태스크 객체
 * @param {Object} user - 사용자 객체
 * @returns {Boolean} 접근 권한 여부
 */
const checkTaskAccess = async (task, user) => {
  // 태스크 생성자 또는 담당자인 경우
  if (task.creator.userId.toString() === user._id.toString() ||
      (task.assignee && task.assignee.userId.toString() === user._id.toString())) {
    return true;
  }

  // 조직 태스크인 경우 조직 멤버 확인
  if (task.organization && task.organization.organizationId) {
    const orgMember = user.organizations.find(org => 
      org.organizationId.toString() === task.organization.organizationId.toString()
    );
    if (orgMember && orgMember.status === 'active') {
      return true;
    }
  }

  // 팀 태스크인 경우 팀 멤버 확인
  if (task.team && task.team.teamId) {
    const teamMember = user.teams.find(team => 
      team.teamId.toString() === task.team.teamId.toString()
    );
    if (teamMember && teamMember.status === 'active') {
      return true;
    }
  }

  // 프로젝트 태스크인 경우 프로젝트 멤버 확인
  if (task.project && task.project.projectId) {
    const Project = (await import('../models/Project.js')).default;
    const project = await Project.findById(task.project.projectId);
    
    if (project && project.members.some(member => 
      member.userId.toString() === user._id.toString()
    )) {
      return true;
    }
  }

  return false;
};

/**
 * 토큰 갱신 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '리프레시 토큰이 필요합니다.',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // 리프레시 토큰 검증
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 리프레시 토큰입니다.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // 새로운 액세스 토큰 생성
    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    req.user = user;
    req.newAccessToken = newAccessToken;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 리프레시 토큰입니다.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    logger.error('토큰 갱신 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '토큰 갱신 중 오류가 발생했습니다.',
      code: 'REFRESH_TOKEN_ERROR'
    });
  }
};

export default {
  authMiddleware,
  optionalAuthMiddleware,
  adminAuthMiddleware,
  organizationMemberMiddleware,
  teamMemberMiddleware,
  projectMemberMiddleware,
  taskAccessMiddleware,
  refreshTokenMiddleware
}; 