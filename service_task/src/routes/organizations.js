/**
 * Organizations Router - 조직 라우터
 * 조직 관리 API 엔드포인트 정의
 *
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import organizationController from '../controllers/organizationController.js';
import { validateOrganization, validateMemberInvite, validateMemberRole } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   POST /api/organizations
 * @desc    조직 생성
 * @access  Private
 */
router.post('/', validateOrganization, organizationController.createOrganization);

/**
 * @route   GET /api/organizations
 * @desc    조직 목록 조회
 * @access  Private
 */
router.get('/', organizationController.getOrganizations);

/**
 * @route   GET /api/organizations/my
 * @desc    사용자가 속한 조직 목록 조회
 * @access  Private
 */
router.get('/my', organizationController.getUserOrganizations);

/**
 * @route   GET /api/organizations/:organizationId
 * @desc    조직 상세 조회
 * @access  Private
 */
router.get('/:organizationId', organizationController.getOrganizationById);

/**
 * @route   PUT /api/organizations/:organizationId
 * @desc    조직 수정
 * @access  Private
 */
router.put('/:organizationId', validateOrganization, organizationController.updateOrganization);

/**
 * @route   DELETE /api/organizations/:organizationId
 * @desc    조직 삭제
 * @access  Private
 */
router.delete('/:organizationId', organizationController.deleteOrganization);

/**
 * @route   GET /api/organizations/:organizationId/statistics
 * @desc    조직 통계 조회
 * @access  Private
 */
router.get('/:organizationId/statistics', organizationController.getOrganizationStatistics);

/**
 * @route   POST /api/organizations/:organizationId/invite
 * @desc    조직 멤버 초대
 * @access  Private
 */
router.post('/:organizationId/invite', validateMemberInvite, organizationController.inviteMember);

/**
 * @route   POST /api/organizations/:organizationId/members
 * @desc    조직 멤버 추가
 * @access  Private
 */
router.post('/:organizationId/members', organizationController.addMember);

/**
 * @route   DELETE /api/organizations/:organizationId/members/:userId
 * @desc    조직 멤버 제거
 * @access  Private
 */
router.delete('/:organizationId/members/:userId', organizationController.removeMember);

/**
 * @route   PUT /api/organizations/:organizationId/members/:userId/role
 * @desc    조직 멤버 역할 변경
 * @access  Private
 */
router.put('/:organizationId/members/:userId/role', validateMemberRole, organizationController.updateMemberRole);

export default router; 