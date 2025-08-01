/**
 * Projects Router - 프로젝트 라우터
 * 프로젝트 관련 API 엔드포인트를 정의하는 라우터
 * 
 * @description
 * - 프로젝트 CRUD API 라우트
 * - 프로젝트 멤버 관리 라우트
 * - 프로젝트 통계 및 분석 라우트
 * - 인증 및 권한 검증
 * - 입력 데이터 검증
 * - 확장 가능한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import projectController from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateProject, validateProjectMember, validateProjectStatus } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/v1/projects
 * @desc    프로젝트 목록 조회
 * @access  Private
 * @query   {number} page - 페이지 번호 (기본값: 1)
 * @query   {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query   {string} sort - 정렬 기준 (기본값: -createdAt)
 * @query   {string} status - 상태 필터
 * @query   {string} priority - 우선순위 필터
 * @query   {string} category - 카테고리 필터
 * @query   {string} search - 검색어
 * @query   {string} organization - 조직 필터
 * @query   {string} team - 팀 필터
 * @query   {string} assignedTo - 담당자 필터
 * @query   {string} createdBy - 생성자 필터
 * @query   {string} startDate - 시작 날짜
 * @query   {string} endDate - 종료 날짜
 * @query   {boolean} includeArchived - 아카이브 포함 여부
 */
router.get('/', 
  authMiddleware, 
  projectController.getProjects
);

/**
 * @route   GET /api/v1/projects/search
 * @desc    프로젝트 검색
 * @access  Private
 * @query   {string} q - 검색어 (필수)
 * @query   {number} page - 페이지 번호
 * @query   {number} limit - 페이지당 항목 수
 * @query   {object} filters - 추가 필터
 * @query   {string} sort - 정렬 기준
 */
router.get('/search',
  authMiddleware,
  projectController.searchProjects
);

/**
 * @route   GET /api/v1/projects/:projectId
 * @desc    프로젝트 상세 조회
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @query   {boolean} includeTasks - 태스크 포함 여부
 * @query   {boolean} includeMembers - 멤버 포함 여부
 * @query   {boolean} includeStats - 통계 포함 여부
 */
router.get('/:projectId',
  authMiddleware,
  projectController.getProject
);

/**
 * @route   POST /api/v1/projects
 * @desc    프로젝트 생성
 * @access  Private
 * @body    {string} title - 프로젝트 제목 (필수)
 * @body    {string} description - 프로젝트 설명
 * @body    {string} category - 카테고리
 * @body    {string} priority - 우선순위
 * @body    {string} status - 상태
 * @body    {string} organization - 조직 ID
 * @body    {string} team - 팀 ID
 * @body    {string} assignedTo - 담당자 ID
 * @body    {array} tags - 태그 배열
 * @body    {date} startDate - 시작 날짜
 * @body    {date} endDate - 종료 날짜
 * @body    {object} settings - 프로젝트 설정
 */
router.post('/',
  authMiddleware,
  validateProject,
  projectController.createProject
);

/**
 * @route   PUT /api/v1/projects/:projectId
 * @desc    프로젝트 수정
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} title - 프로젝트 제목
 * @body    {string} description - 프로젝트 설명
 * @body    {string} category - 카테고리
 * @body    {string} priority - 우선순위
 * @body    {string} assignedTo - 담당자 ID
 * @body    {array} tags - 태그 배열
 * @body    {date} startDate - 시작 날짜
 * @body    {date} endDate - 종료 날짜
 * @body    {object} settings - 프로젝트 설정
 */
router.put('/:projectId',
  authMiddleware,
  validateProject,
  projectController.updateProject
);

/**
 * @route   DELETE /api/v1/projects/:projectId
 * @desc    프로젝트 삭제
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @query   {boolean} force - 강제 삭제 여부
 */
router.delete('/:projectId',
  authMiddleware,
  projectController.deleteProject
);

/**
 * @route   PATCH /api/v1/projects/:projectId/status
 * @desc    프로젝트 상태 변경
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} status - 새 상태 (필수)
 * @body    {string} reason - 변경 이유
 */
router.patch('/:projectId/status',
  authMiddleware,
  validateProjectStatus,
  projectController.updateProjectStatus
);

/**
 * @route   POST /api/v1/projects/:projectId/members
 * @desc    프로젝트 멤버 추가
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} userId - 사용자 ID (필수)
 * @body    {string} role - 역할
 * @body    {array} permissions - 권한 배열
 */
router.post('/:projectId/members',
  authMiddleware,
  validateProjectMember,
  projectController.addProjectMember
);

/**
 * @route   DELETE /api/v1/projects/:projectId/members/:userId
 * @desc    프로젝트 멤버 제거
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @param   {string} userId - 사용자 ID
 * @body    {string} reason - 제거 이유
 */
router.delete('/:projectId/members/:userId',
  authMiddleware,
  projectController.removeProjectMember
);

/**
 * @route   PATCH /api/v1/projects/:projectId/members/:userId
 * @desc    프로젝트 멤버 권한 변경
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @param   {string} userId - 사용자 ID
 * @body    {string} role - 새 역할
 * @body    {array} permissions - 새 권한 배열
 */
router.patch('/:projectId/members/:userId',
  authMiddleware,
  validateProjectMember,
  projectController.updateProjectMemberRole
);

/**
 * @route   GET /api/v1/projects/:projectId/stats
 * @desc    프로젝트 통계 조회
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @query   {string} period - 기간 (all, week, month, quarter, year)
 * @query   {string} startDate - 시작 날짜
 * @query   {string} endDate - 종료 날짜
 */
router.get('/:projectId/stats',
  authMiddleware,
  projectController.getProjectStats
);

/**
 * @route   GET /api/v1/projects/:projectId/activity
 * @desc    프로젝트 활동 로그 조회
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @query   {number} page - 페이지 번호
 * @query   {number} limit - 페이지당 항목 수
 * @query   {string} action - 액션 필터
 * @query   {string} userId - 사용자 필터
 * @query   {string} startDate - 시작 날짜
 * @query   {string} endDate - 종료 날짜
 * @query   {string} sort - 정렬 기준
 */
router.get('/:projectId/activity',
  authMiddleware,
  projectController.getProjectActivityLog
);

/**
 * @route   POST /api/v1/projects/:projectId/copy
 * @desc    프로젝트 복사
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} title - 새 프로젝트 제목
 * @body    {string} description - 새 프로젝트 설명
 * @body    {boolean} includeTasks - 태스크 포함 여부
 * @body    {boolean} includeMembers - 멤버 포함 여부
 * @body    {boolean} includeSettings - 설정 포함 여부
 */
router.post('/:projectId/copy',
  authMiddleware,
  projectController.copyProject
);

/**
 * @route   PATCH /api/v1/projects/:projectId/archive
 * @desc    프로젝트 아카이브/복원
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} action - 액션 (archive, restore)
 * @body    {string} reason - 이유
 */
router.patch('/:projectId/archive',
  authMiddleware,
  projectController.toggleProjectArchive
);

/**
 * @route   POST /api/v1/projects/:projectId/template
 * @desc    프로젝트를 템플릿으로 저장
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} templateName - 템플릿 이름
 * @body    {string} templateDescription - 템플릿 설명
 * @body    {string} category - 카테고리
 * @body    {array} tags - 태그 배열
 * @body    {boolean} isPublic - 공개 여부
 */
router.post('/:projectId/template',
  authMiddleware,
  projectController.saveAsTemplate
);

/**
 * @route   PATCH /api/v1/projects/:projectId/sharing
 * @desc    프로젝트 공유 설정 변경
 * @access  Private
 * @param   {string} projectId - 프로젝트 ID
 * @body    {string} visibility - 가시성 (public, private, team, organization)
 * @body    {boolean} allowGuestAccess - 게스트 접근 허용 여부
 * @body    {array} guestPermissions - 게스트 권한
 * @body    {boolean} shareLink - 공유 링크 생성 여부
 * @body    {string} password - 공유 비밀번호
 */
router.patch('/:projectId/sharing',
  authMiddleware,
  projectController.updateProjectSharing
);

export default router; 