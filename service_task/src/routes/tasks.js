/**
 * Task Routes - 태스크 라우터
 * 태스크 관련 API 엔드포인트 정의
 * 
 * @description
 * - 태스크 CRUD 라우트
 * - 태스크 상태 및 담당자 관리
 * - 태스크 검색 및 필터링
 * - 태스크 통계 및 분석
 * - 권한 기반 접근 제어
 * - 확장 가능한 라우트 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import taskController from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';
import { 
  validateTaskCreate, 
  validateTaskUpdate, 
  validateTaskQuery,
  validateId 
} from '../middleware/validation.js';

const router = express.Router();

/**
 * 태스크 라우트 그룹
 * 모든 태스크 관련 엔드포인트는 인증이 필요함
 */
router.use(authMiddleware);

/**
 * @route   GET /api/tasks
 * @desc    태스크 목록 조회 (검색, 필터링, 정렬 지원)
 * @access  Private
 * @query   {number} page - 페이지 번호 (기본값: 1)
 * @query   {number} limit - 페이지 크기 (기본값: 20, 최대: 100)
 * @query   {string} search - 검색어 (제목, 설명, 태그)
 * @query   {string} status - 상태 필터 (todo, in_progress, review, done, cancelled)
 * @query   {string} priority - 우선순위 필터 (low, medium, high, urgent)
 * @query   {string} type - 유형 필터 (task, bug, feature, improvement, research)
 * @query   {string} assigneeId - 담당자 ID 필터
 * @query   {string} creatorId - 생성자 ID 필터
 * @query   {string} organizationId - 조직 ID 필터
 * @query   {string} teamId - 팀 ID 필터
 * @query   {string} projectId - 프로젝트 ID 필터
 * @query   {string[]} tags - 태그 필터
 * @query   {string} dueDateFrom - 마감일 시작 범위 (ISO 날짜)
 * @query   {string} dueDateTo - 마감일 종료 범위 (ISO 날짜)
 * @query   {string} sortBy - 정렬 기준 (createdAt, updatedAt, dueDate, priority, title, status)
 * @query   {string} sortOrder - 정렬 순서 (asc, desc)
 * @returns {Object} 태스크 목록 및 페이지네이션 정보
 */
router.get('/', validateTaskQuery, taskController.getTasks);

/**
 * @route   GET /api/tasks/stats
 * @desc    태스크 통계 조회
 * @access  Private
 * @query   {string} organizationId - 조직 ID 필터
 * @query   {string} teamId - 팀 ID 필터
 * @query   {string} projectId - 프로젝트 ID 필터
 * @query   {string} period - 통계 기간 (7d, 30d, 90d, 1y)
 * @returns {Object} 태스크 통계 데이터
 */
router.get('/stats', taskController.getTaskStats);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    태스크 상세 조회
 * @access  Private
 * @param   {string} taskId - 태스크 ID
 * @returns {Object} 태스크 상세 정보
 */
router.get('/:taskId', validateId, taskController.getTask);

/**
 * @route   POST /api/tasks
 * @desc    태스크 생성
 * @access  Private
 * @body    {string} title - 태스크 제목 (필수)
 * @body    {string} description - 태스크 설명
 * @body    {string} priority - 우선순위 (low, medium, high, urgent)
 * @body    {string} status - 상태 (todo, in_progress, review, done, cancelled)
 * @body    {string} type - 유형 (task, bug, feature, improvement, research)
 * @body    {string} dueDate - 마감일 (ISO 날짜)
 * @body    {number} estimatedHours - 예상 소요 시간
 * @body    {string} assigneeId - 담당자 ID
 * @body    {string[]} tags - 태그 배열
 * @body    {Object[]} attachments - 첨부파일 배열
 * @body    {string} organizationId - 조직 ID
 * @body    {string} teamId - 팀 ID
 * @body    {string} projectId - 프로젝트 ID
 * @body    {string} parentTaskId - 상위 태스크 ID
 * @body    {Object} recurrence - 반복 설정
 * @returns {Object} 생성된 태스크 정보
 */
router.post('/', validateTaskCreate, taskController.createTask);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    태스크 수정
 * @access  Private
 * @param   {string} taskId - 태스크 ID
 * @body    {string} title - 태스크 제목
 * @body    {string} description - 태스크 설명
 * @body    {string} priority - 우선순위
 * @body    {string} status - 상태
 * @body    {string} type - 유형
 * @body    {string} dueDate - 마감일
 * @body    {number} estimatedHours - 예상 소요 시간
 * @body    {number} actualHours - 실제 소요 시간
 * @body    {string} assigneeId - 담당자 ID
 * @body    {string[]} tags - 태그 배열
 * @body    {number} progress - 진행률 (0-100)
 * @returns {Object} 수정된 태스크 정보
 */
router.put('/:taskId', validateId, validateTaskUpdate, taskController.updateTask);

/**
 * @route   PATCH /api/tasks/:taskId/status
 * @desc    태스크 상태 변경
 * @access  Private
 * @param   {string} taskId - 태스크 ID
 * @body    {string} status - 새로운 상태 (필수)
 * @body    {string} comment - 상태 변경 코멘트
 * @returns {Object} 상태 변경된 태스크 정보
 */
router.patch('/:taskId/status', validateId, taskController.updateTaskStatus);

/**
 * @route   PATCH /api/tasks/:taskId/assignee
 * @desc    태스크 담당자 변경
 * @access  Private
 * @param   {string} taskId - 태스크 ID
 * @body    {string} assigneeId - 새로운 담당자 ID (필수)
 * @body    {string} comment - 담당자 변경 코멘트
 * @returns {Object} 담당자 변경된 태스크 정보
 */
router.patch('/:taskId/assignee', validateId, taskController.updateTaskAssignee);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    태스크 삭제 (소프트 삭제)
 * @access  Private
 * @param   {string} taskId - 태스크 ID
 * @returns {Object} 삭제 결과 메시지
 */
router.delete('/:taskId', validateId, taskController.deleteTask);

/**
 * 하위 라우터들 (향후 확장용)
 */

// 태스크 코멘트 관련 라우트
// router.use('/:taskId/comments', taskCommentRoutes);

// 태스크 첨부파일 관련 라우트
// router.use('/:taskId/attachments', taskAttachmentRoutes);

// 태스크 활동 로그 관련 라우트
// router.use('/:taskId/activity', taskActivityRoutes);

// 태스크 템플릿 관련 라우트
// router.use('/templates', taskTemplateRoutes);

// 태스크 자동화 관련 라우트
// router.use('/automation', taskAutomationRoutes);

export default router; 