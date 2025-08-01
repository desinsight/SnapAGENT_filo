/**
 * Main Routes - 메인 라우터
 * 모든 API 라우터를 통합하고 관리하는 메인 라우터
 * 
 * @description
 * - API 버전 관리
 * - 라우터 통합
 * - 헬스체크 엔드포인트
 * - API 문서화
 * - 에러 핸들링
 * - 확장 가능한 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import { logger } from '../config/logger.js';

// 라우터 임포트
import taskRoutes from './tasks.js';
import projectRoutes from './projects.js';
import organizationRoutes from './organizations.js';
import teamRoutes from './teams.js';
import notificationRoutes from './notifications.js';
import commentRoutes from './comments.js';
// import analyticsRoutes from './analytics.js';

const router = express.Router();

/**
 * API 버전 정보
 */
const API_VERSION = 'v1';
const API_BASE_PATH = `/api/${API_VERSION}`;

/**
 * 헬스체크 엔드포인트
 * @route   GET /health
 * @desc    서비스 상태 확인
 * @access  Public
 * @returns {Object} 서비스 상태 정보
 */
router.get('/health', (req, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    services: {
      database: 'connected', // 실제로는 DB 연결 상태 확인 필요
      redis: 'connected',    // 실제로는 Redis 연결 상태 확인 필요
      external: 'connected'  // 실제로는 외부 서비스 연결 상태 확인 필요
    }
  };

  logger.info('헬스체크 요청:', { ip: req.ip, userAgent: req.get('User-Agent') });
  res.json(healthInfo);
});

/**
 * API 정보 엔드포인트
 * @route   GET /api
 * @desc    API 정보 및 버전 확인
 * @access  Public
 * @returns {Object} API 정보
 */
router.get('/api', (req, res) => {
  const apiInfo = {
    name: 'Task Manager API',
    version: API_VERSION,
    description: '개인 및 조직을 위한 태스크 관리 API',
    baseUrl: `${req.protocol}://${req.get('host')}${API_BASE_PATH}`,
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      tasks: `${API_BASE_PATH}/tasks`,
      organizations: `${API_BASE_PATH}/organizations`,
      teams: `${API_BASE_PATH}/teams`,
      projects: `${API_BASE_PATH}/projects`,
      notifications: `${API_BASE_PATH}/notifications`,
      analytics: `${API_BASE_PATH}/analytics`
    },
    features: [
      '태스크 CRUD 및 관리',
      '조직 및 팀 관리',
      '프로젝트 관리',
      '실시간 알림',
      '통계 및 분석',
      '파일 첨부',
      '태스크 템플릿',
      '자동화 및 워크플로우'
    ],
    limits: {
      rateLimit: '100 requests per minute',
      fileUpload: '10MB per file',
      maxFiles: '10 files per task',
      maxTags: '20 tags per task'
    }
  };

  res.json(apiInfo);
});

/**
 * API 문서 엔드포인트
 * @route   GET /api/docs
 * @desc    API 문서 (향후 Swagger/OpenAPI 문서로 대체)
 * @access  Public
 * @returns {Object} API 문서 정보
 */
router.get('/api/docs', (req, res) => {
  const docsInfo = {
    title: 'Task Manager API Documentation',
    version: API_VERSION,
    description: 'Task Manager API의 상세한 사용법과 엔드포인트 정보',
    baseUrl: `${req.protocol}://${req.get('host')}${API_BASE_PATH}`,
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: '모든 API 요청에는 유효한 JWT 토큰이 필요합니다.'
    },
    endpoints: {
      tasks: {
        description: '태스크 관리 API',
        basePath: `${API_BASE_PATH}/tasks`,
        methods: {
          'GET /': '태스크 목록 조회 (검색, 필터링, 정렬 지원)',
          'GET /stats': '태스크 통계 조회',
          'GET /:taskId': '태스크 상세 조회',
          'POST /': '태스크 생성',
          'PUT /:taskId': '태스크 수정',
          'PATCH /:taskId/status': '태스크 상태 변경',
          'PATCH /:taskId/assignee': '태스크 담당자 변경',
          'DELETE /:taskId': '태스크 삭제'
        }
      },

      organizations: {
        description: '조직 관리 API',
        basePath: `${API_BASE_PATH}/organizations`,
        methods: {
          'GET /': '조직 목록 조회',
          'POST /': '조직 생성',
          'GET /:organizationId': '조직 상세 조회',
          'PUT /:organizationId': '조직 수정',
          'DELETE /:organizationId': '조직 삭제',
          'GET /:organizationId/members': '조직 멤버 목록',
          'POST /:organizationId/members': '조직 멤버 초대'
        }
      },
      teams: {
        description: '팀 관리 API',
        basePath: `${API_BASE_PATH}/teams`,
        methods: {
          'GET /': '팀 목록 조회',
          'POST /': '팀 생성',
          'GET /:teamId': '팀 상세 조회',
          'PUT /:teamId': '팀 수정',
          'DELETE /:teamId': '팀 삭제',
          'GET /:teamId/members': '팀 멤버 목록',
          'POST /:teamId/members': '팀 멤버 추가'
        }
      },
      projects: {
        description: '프로젝트 관리 API',
        basePath: `${API_BASE_PATH}/projects`,
        methods: {
          'GET /': '프로젝트 목록 조회',
          'POST /': '프로젝트 생성',
          'GET /:projectId': '프로젝트 상세 조회',
          'PUT /:projectId': '프로젝트 수정',
          'DELETE /:projectId': '프로젝트 삭제',
          'GET /:projectId/tasks': '프로젝트 태스크 목록',
          'GET /:projectId/stats': '프로젝트 통계'
        }
      },

    },
    responseFormat: {
      success: {
        success: true,
        data: '응답 데이터',
        message: '성공 메시지 (선택사항)'
      },
      error: {
        success: false,
        message: '에러 메시지',
        code: '에러 코드',
        timestamp: '에러 발생 시간',
        path: '요청 경로',
        method: '요청 메서드'
      }
    },
    statusCodes: {
      200: 'OK - 요청 성공',
      201: 'Created - 리소스 생성 성공',
      400: 'Bad Request - 잘못된 요청',
      401: 'Unauthorized - 인증 필요',
      403: 'Forbidden - 권한 없음',
      404: 'Not Found - 리소스를 찾을 수 없음',
      409: 'Conflict - 리소스 충돌',
      429: 'Too Many Requests - 요청 한도 초과',
      500: 'Internal Server Error - 서버 오류'
    }
  };

  res.json(docsInfo);
});

/**
 * API 라우터 등록
 * 모든 API 엔드포인트는 /api/v1 경로 하위에 위치
 */
router.use(API_BASE_PATH, (req, res, next) => {
  // API 요청 로깅
  logger.info('API 요청:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id
  });
  next();
});

// 태스크 라우터
router.use(`${API_BASE_PATH}/tasks`, taskRoutes);

// 프로젝트 라우터
router.use(`${API_BASE_PATH}/projects`, projectRoutes);

// 조직 라우터
router.use(`${API_BASE_PATH}/organizations`, organizationRoutes);

// 팀 라우터
router.use(`${API_BASE_PATH}/teams`, teamRoutes);

// 알림 라우터
router.use(`${API_BASE_PATH}/notifications`, notificationRoutes);

// 댓글 라우터
router.use(`${API_BASE_PATH}/comments`, commentRoutes);

// 분석 라우터 (향후 구현)
// router.use(`${API_BASE_PATH}/analytics`, analyticsRoutes);

/**
 * 404 에러 핸들링 (API 경로)
 * API 경로에 해당하는 리소스를 찾을 수 없는 경우
 */
router.use(API_BASE_PATH, (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API 엔드포인트를 찾을 수 없습니다.',
    code: 'API_ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/tasks',
      '/organizations',
      '/teams',
      '/projects',
      '/notifications',
      '/analytics'
    ]
  });
});

/**
 * API 요청 통계 미들웨어 (선택사항)
 * API 사용량 및 성능 모니터링
 */
router.use(API_BASE_PATH, (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API 응답 완료:', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id
    });
  });
  
  next();
});

export default router; 