/**
 * Documents Service Backend - Main Application Entry Point
 * 문서 서비스 백엔드 메인 애플리케이션 진입점
 * 
 * @description
 * - Express 서버 설정 및 미들웨어 구성
 * - 데이터베이스 연결 (MongoDB, Redis)
 * - API 라우트 등록
 * - 에러 핸들링 및 로깅
 * - 실시간 기능 (Socket.io)
 * - 보안 설정
 * 
 * @author Your Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 환경 변수 로드
dotenv.config();

// ES6 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정 파일들 import
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupLogger } from './config/logger.js';
import { setupElasticsearch } from './config/elasticsearch.js';

// 미들웨어 import
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/auth.js';

// 라우트 import (CommonJS 형식으로 변경)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const documentRoutes = require('./routes/documents.js');
const templateRoutes = require('./routes/templates.js');
const fileRoutes = require('./routes/files.js');
const collaborationRoutes = require('./routes/collaboration.js');
const notificationRoutes = require('./routes/notifications.js');
const advancedSearchRoutes = require('./routes/advancedSearch.js');
const recommendationRoutes = require('./routes/recommendation.js');
const statisticsRoutes = require('./routes/statistics.js');

// 서비스 import
import { setupSocketIO } from './services/socketService.js';
import { setupCronJobs } from './services/cronService.js';
import { setupFileWatcher } from './services/fileWatcherService.js';
import collaborationService from './services/collaborationService.js';
import notificationService from './services/notificationService.js';

// 유틸리티 import
import { validateEnvironment } from './utils/environmentValidator.js';

/**
 * 애플리케이션 클래스
 * 서버 설정, 미들웨어, 라우트를 관리하는 메인 클래스
 */
class DocumentsServiceApp {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    });
    
    this.port = process.env.PORT || 3001;
    this.host = process.env.HOST || 'localhost';
    
    // 로거 설정
    this.logger = setupLogger();
    
    // 초기화
    this.initializeApp();
  }

  /**
   * 애플리케이션 초기화
   * 미들웨어, 라우트, 서비스 설정
   */
  async initializeApp() {
    try {
      this.logger.info('🚀 Documents Service Backend 초기화 시작...');

      // 환경 변수 검증
      validateEnvironment();

      // 기본 미들웨어 설정
      this.setupBasicMiddleware();

      // 보안 미들웨어 설정
      this.setupSecurityMiddleware();

      // 요청 제한 설정
      this.setupRateLimiting();

      // 정적 파일 서빙 설정
      this.setupStaticFiles();

      // API 라우트 설정
      this.setupRoutes();

      // 에러 핸들링 미들웨어 설정
      this.setupErrorHandling();

      // 데이터베이스 연결
      await this.connectDatabases();

      // 실시간 기능 설정
      this.setupRealTimeFeatures();

      // 백그라운드 서비스 설정
      this.setupBackgroundServices();

      this.logger.info('✅ 애플리케이션 초기화 완료');
    } catch (error) {
      this.logger.error('❌ 애플리케이션 초기화 실패:', error);
      process.exit(1);
    }
  }

  /**
   * 기본 미들웨어 설정
   * CORS, 압축, 로깅 등 기본적인 미들웨어 설정
   */
  setupBasicMiddleware() {
    // CORS 설정
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // JSON 파싱
    this.app.use(express.json({ 
      limit: process.env.MAX_FILE_SIZE || '10mb' 
    }));
    
    // URL 인코딩 파싱
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.MAX_FILE_SIZE || '10mb' 
    }));

    // 압축 미들웨어
    this.app.use(compression());

    // 로깅 미들웨어
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => this.logger.info(message.trim())
        }
      }));
    }

    // 커스텀 요청 로거
    this.app.use(requestLogger);

    this.logger.info('✅ 기본 미들웨어 설정 완료');
  }

  /**
   * 보안 미들웨어 설정
   * Helmet, 보안 헤더 등 보안 관련 미들웨어 설정
   */
  setupSecurityMiddleware() {
    // Helmet 보안 헤더 설정
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // XSS 방지
    this.app.use(helmet.xssFilter());

    // MIME 타입 스니핑 방지
    this.app.use(helmet.noSniff());

    // 클릭재킹 방지
    this.app.use(helmet.frameguard({ action: 'deny' }));

    this.logger.info('✅ 보안 미들웨어 설정 완료');
  }

  /**
   * 요청 제한 설정
   * Rate limiting을 통한 API 요청 제한 설정
   */
  setupRateLimiting() {
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 최대 100개 요청
      message: {
        error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // API 라우트에 rate limiting 적용
    this.app.use('/api', limiter);

    this.logger.info('✅ 요청 제한 설정 완료');
  }

  /**
   * 정적 파일 서빙 설정
   * 업로드된 파일, 문서 등을 정적 파일로 서빙
   */
  setupStaticFiles() {
    // 업로드된 파일 서빙
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
      maxAge: '1d',
      etag: true
    }));

    // 문서 파일 서빙
    this.app.use('/documents', express.static(path.join(__dirname, '../uploads/documents'), {
      maxAge: '1h',
      etag: true
    }));

    this.logger.info('✅ 정적 파일 서빙 설정 완료');
  }

  /**
   * API 라우트 설정
   * 각 기능별 라우트 등록
   */
  setupRoutes() {
    // 헬스체크 라우트 (인증 불필요)
    this.app.use('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // API 버전 관리
    this.app.use('/api/v1', (req, res, next) => {
      req.apiVersion = 'v1';
      next();
    });

    // 인증이 필요한 라우트들
    this.app.use('/api/v1/documents', documentRoutes);
    this.app.use('/api/v1/templates', templateRoutes);
    this.app.use('/api/v1/files', fileRoutes);
    this.app.use('/api/v1/collaboration', collaborationRoutes);
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/search', advancedSearchRoutes);
    this.app.use('/api/v1/recommendation', recommendationRoutes);
    this.app.use('/api/v1/statistics', statisticsRoutes);

    // API 루트 엔드포인트
    this.app.get('/api', (req, res) => {
      res.json({
        message: 'Documents Service Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          documents: '/api/v1/documents',
          templates: '/api/v1/templates',
          files: '/api/v1/files',
          collaboration: '/api/v1/collaboration',
          notifications: '/api/v1/notifications',
          search: '/api/v1/search',
          recommendation: '/api/v1/recommendation',
          statistics: '/api/v1/statistics',
          health: '/health'
        }
      });
    });

    this.logger.info('✅ API 라우트 설정 완료');
  }

  /**
   * 에러 핸들링 미들웨어 설정
   * 404 에러 및 전역 에러 핸들러 설정
   */
  setupErrorHandling() {
    // 404 에러 핸들러
    this.app.use(notFoundHandler);

    // 전역 에러 핸들러
    this.app.use(errorHandler);

    this.logger.info('✅ 에러 핸들링 설정 완료');
  }

  /**
   * 데이터베이스 연결
   * MongoDB, Redis, Elasticsearch 연결 설정
   */
  async connectDatabases() {
    try {
      // MongoDB 연결
      await connectDatabase();
      this.logger.info('✅ MongoDB 연결 완료');

      // Redis 연결
      await connectRedis();
      this.logger.info('✅ Redis 연결 완료');

      // Elasticsearch 연결 (선택사항)
      if (process.env.ELASTICSEARCH_URL) {
        await setupElasticsearch();
        this.logger.info('✅ Elasticsearch 연결 완료');
      }

    } catch (error) {
      this.logger.error('❌ 데이터베이스 연결 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 기능 설정
   * Socket.io를 통한 실시간 협업 기능 설정
   */
  setupRealTimeFeatures() {
    if (process.env.ENABLE_REAL_TIME_COLLABORATION === 'true') {
      // 협업 서비스 초기화
      collaborationService.initialize(this.io);
      this.logger.info('✅ 실시간 협업 기능 설정 완료');
    }
  }

  /**
   * 백그라운드 서비스 설정
   * 크론 작업, 파일 감시 등 백그라운드 서비스 설정
   */
  setupBackgroundServices() {
    // 크론 작업 설정
    setupCronJobs();

    // 파일 감시 서비스 설정
    setupFileWatcher();

    // 알림 서비스 스케줄러 설정
    this.setupNotificationScheduler();

    this.logger.info('✅ 백그라운드 서비스 설정 완료');
  }

  /**
   * 알림 서비스 스케줄러 설정
   * 스케줄된 알림 및 만료된 알림 처리
   */
  setupNotificationScheduler() {
    // 스케줄된 알림 처리 (5분마다)
    setInterval(async () => {
      try {
        await notificationService.processScheduledNotifications();
      } catch (error) {
        this.logger.error('스케줄된 알림 처리 실패:', error);
      }
    }, 5 * 60 * 1000);

    // 만료된 알림 처리 (10분마다)
    setInterval(async () => {
      try {
        await notificationService.processExpiredNotifications();
      } catch (error) {
        this.logger.error('만료된 알림 처리 실패:', error);
      }
    }, 10 * 60 * 1000);

    this.logger.info('✅ 알림 서비스 스케줄러 설정 완료');
  }

  /**
   * 서버 시작
   * HTTP 서버를 시작하고 포트에서 리스닝
   */
  start() {
    this.server.listen(this.port, this.host, () => {
      this.logger.info(`🚀 Documents Service Backend 서버가 시작되었습니다!`);
      this.logger.info(`📍 서버 주소: http://${this.host}:${this.port}`);
      this.logger.info(`🌍 환경: ${process.env.NODE_ENV}`);
      this.logger.info(`📅 시작 시간: ${new Date().toISOString()}`);
      
      // API 엔드포인트 정보 출력
      this.logger.info('📚 사용 가능한 API 엔드포인트:');
      this.logger.info(`   - 헬스체크: http://${this.host}:${this.port}/health`);
      this.logger.info(`   - API 루트: http://${this.host}:${this.port}/api`);
      this.logger.info(`   - 문서 관리: http://${this.host}:${this.port}/api/v1/documents`);
      this.logger.info(`   - 템플릿 관리: http://${this.host}:${this.port}/api/v1/templates`);
      this.logger.info(`   - 파일 관리: http://${this.host}:${this.port}/api/v1/files`);
      this.logger.info(`   - 실시간 협업: http://${this.host}:${this.port}/api/v1/collaboration`);
      this.logger.info(`   - 알림 시스템: http://${this.host}:${this.port}/api/v1/notifications`);
      this.logger.info(`   - 고급 검색: http://${this.host}:${this.port}/api/v1/search`);
      this.logger.info(`   - 추천/연관 문서: http://${this.host}:${this.port}/api/v1/recommendation`);
      this.logger.info(`   - 통계: http://${this.host}:${this.port}/api/v1/statistics`);
    });

    // Graceful shutdown 처리
    this.setupGracefulShutdown();
  }

  /**
   * Graceful Shutdown 설정
   * 서버 종료 시 안전하게 리소스 정리
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      this.logger.info(`📴 ${signal} 신호를 받았습니다. 서버를 안전하게 종료합니다...`);
      
      this.server.close(() => {
        this.logger.info('✅ HTTP 서버가 종료되었습니다.');
        process.exit(0);
      });

      // 30초 후 강제 종료
      setTimeout(() => {
        this.logger.error('❌ 강제 종료: 30초 타임아웃');
        process.exit(1);
      }, 30000);
    };

    // 종료 신호 처리
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 예상치 못한 에러 처리
    process.on('uncaughtException', (error) => {
      this.logger.error('❌ 예상치 못한 에러:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('❌ 처리되지 않은 Promise 거부:', reason);
      process.exit(1);
    });
  }
}

// 애플리케이션 인스턴스 생성 및 시작
const app = new DocumentsServiceApp();

// 서버 시작
app.start();

export default app; 