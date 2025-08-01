/**
 * Teams Router - 팀 라우터
 * 팀 관리 API 엔드포인트 정의
 *
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import teamController from '../controllers/teamController.js';
import { validateTeam, validateMemberRole } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   POST /api/organizations/:organizationId/teams
 * @desc    팀 생성
 * @access  Private
 */
router.post('/organizations/:organizationId/teams', validateTeam, teamController.createTeam);

/**
 * @route   GET /api/teams
 * @desc    팀 목록 조회
 * @access  Private
 */
router.get('/', teamController.getTeams);

/**
 * @route   GET /api/teams/my
 * @desc    사용자가 속한 팀 목록 조회
 * @access  Private
 */
router.get('/my', teamController.getUserTeams);

/**
 * @route   GET /api/organizations/:organizationId/teams
 * @desc    조직의 모든 팀 조회
 * @access  Private
 */
router.get('/organizations/:organizationId/teams', teamController.getOrganizationTeams);

/**
 * @route   GET /api/teams/:teamId
 * @desc    팀 상세 조회
 * @access  Private
 */
router.get('/:teamId', teamController.getTeamById);

/**
 * @route   PUT /api/teams/:teamId
 * @desc    팀 수정
 * @access  Private
 */
router.put('/:teamId', validateTeam, teamController.updateTeam);

/**
 * @route   DELETE /api/teams/:teamId
 * @desc    팀 삭제
 * @access  Private
 */
router.delete('/:teamId', teamController.deleteTeam);

/**
 * @route   GET /api/teams/:teamId/statistics
 * @desc    팀 통계 조회
 * @access  Private
 */
router.get('/:teamId/statistics', teamController.getTeamStatistics);

/**
 * @route   POST /api/teams/:teamId/members
 * @desc    팀 멤버 추가
 * @access  Private
 */
router.post('/:teamId/members', teamController.addMember);

/**
 * @route   DELETE /api/teams/:teamId/members/:userId
 * @desc    팀 멤버 제거
 * @access  Private
 */
router.delete('/:teamId/members/:userId', teamController.removeMember);

/**
 * @route   PUT /api/teams/:teamId/members/:userId/role
 * @desc    팀 멤버 역할 변경
 * @access  Private
 */
router.put('/:teamId/members/:userId/role', validateMemberRole, teamController.updateMemberRole);

export default router; 