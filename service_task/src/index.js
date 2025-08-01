/**
 * Task Manager Service - 메인 서버 파일
 * Express 서버 설정 및 미들웨어, 라우터 연결
 * 
 * @description
 * - Express 서버 초기화
 * - 미들웨어 설정 (CORS, 보안, 로깅 등)
 * - 데이터베이스 연결
 * - 라우터 연결
 * - 에러 핸들링
 * - 서버 시작 및 종료 처리
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
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 환경 변수 로드
dotenv.config();

// 설정 및 유틸리티 임포트
import { connectDatabase, isDatabaseConnected } from './config/database.js';
import { logger, requestLogger } from './config/logger.js';

// 라우터 임포트
import routes from './routes/index.js';

// 미들웨어 임포트
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// 서비스 임포트
import notificationService from './services/notificationService.js';
import analyticsService from './services/analyticsService.js';

/**
 * Express 앱 생성
 */
const app = express();
const server = createServer(app);

/**
 * Socket.io 설정 (실시간 알림용)
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io 연결 관리
io.on('connection', (socket) => {
  logger.info(`🔌 Socket 연결: ${socket.id}`);
  
  // 사용자 인증
  socket.on('authenticate', (data) => {
    if (data.userId) {
      socket.join(`user:${data.userId}`);
      socket.join(`organization:${data.organizationId}`);
      logger.info(`👤 사용자 인증: ${data.userId}`);
    }
  });
  
  // 실시간 알림 구독
  socket.on('subscribe', (data) => {
    if (data.type === 'task' && data.taskId) {
      socket.join(`task:${data.taskId}`);
    }
    if (data.type === 'project' && data.projectId) {
      socket.join(`project:${data.projectId}`);
    }
    if (data.type === 'team' && data.teamId) {
      socket.join(`team:${data.teamId}`);
    }
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket 연결 해제: ${socket.id}`);
  });
});

// Socket.io를 서비스에서 사용할 수 있도록 설정
notificationService.setSocketIO(io);

/**
 * 보안 미들웨어
 */
app.use(helmet({
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

/**
 * CORS 설정
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * 압축 미들웨어
 */
app.use(compression());

/**
 * 요청 파싱 미들웨어
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 로깅 미들웨어
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 최대 100개 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/**
 * 정적 파일 서빙
 */
app.use('/uploads', express.static('uploads'));

/**
 * 헬스 체크 엔드포인트
 */
app.get('/health', async (req, res) => {
  try {
    const dbStatus = isDatabaseConnected();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      database: dbStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('헬스 체크 실패:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * 메인 라우터 연결
 */
app.use('/', routes);

/**
 * 404 에러 핸들러
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method
  });
});

/**
 * 전역 에러 핸들러
 */
app.use(errorHandler);

/**
 * 서버 시작 함수
 */
const startServer = async () => {
  try {
    // 포트 설정
    const PORT = process.env.PORT || 3003;
    
    // 데이터베이스 연결 (선택적)
    if (process.env.MONGODB_URI) {
      try {
        await connectDatabase();
        logger.info('📦 데이터베이스 연결 완료');
      } catch (dbError) {
        logger.warn('📦 데이터베이스 연결 실패, 서버는 계속 실행됩니다:', dbError.message);
      }
    } else {
      logger.warn('📦 MONGODB_URI가 설정되지 않아 데이터베이스 연결을 건너뜁니다.');
    }
    
    // 서버 시작
    server.listen(PORT, () => {
      logger.info(`🚀 Task Manager Service 서버가 포트 ${PORT}에서 시작되었습니다.`);
      logger.info(`📊 환경: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
      logger.info(`💚 헬스 체크: http://localhost:${PORT}/health`);
      if (!process.env.MONGODB_URI) {
        logger.warn('⚠️ 데이터베이스 없이 실행 중 - 일부 기능이 제한될 수 있습니다.');
      }
    });
    
    // 정기적인 통계 업데이트 (매시간) - 데이터베이스 연결 시에만
    if (process.env.MONGODB_URI) {
      setInterval(async () => {
        try {
          await analyticsService.updateGlobalStatistics();
          logger.debug('📈 전역 통계 업데이트 완료');
        } catch (error) {
          logger.error('📈 전역 통계 업데이트 실패:', error);
        }
      }, 60 * 60 * 1000); // 1시간
      
      // 정기적인 알림 처리 (매 5분)
      setInterval(async () => {
        try {
          await notificationService.processScheduledNotifications();
          logger.debug('🔔 예약된 알림 처리 완료');
        } catch (error) {
          logger.error('🔔 예약된 알림 처리 실패:', error);
        }
      }, 5 * 60 * 1000); // 5분
    }
    
  } catch (error) {
    logger.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

/**
 * 서버 종료 처리
 */
const gracefulShutdown = async (signal) => {
  logger.info(`🛑 ${signal} 신호를 받았습니다. 서버를 종료합니다...`);
  
  try {
    // Socket.io 연결 종료
    io.close(() => {
      logger.info('🔌 Socket.io 서버 종료 완료');
    });
    
    // HTTP 서버 종료
    server.close(() => {
      logger.info('🌐 HTTP 서버 종료 완료');
    });
    
    // 데이터베이스 연결 종료
    await disconnectDatabase();
    logger.info('📦 데이터베이스 연결 종료 완료');
    
    logger.info('✅ 서버가 안전하게 종료되었습니다.');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ 서버 종료 중 오류 발생:', error);
    process.exit(1);
  }
};

// 프로세스 종료 신호 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 예상치 못한 오류 처리
process.on('uncaughtException', (error) => {
  logger.error('❌ 예상치 못한 오류:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ 처리되지 않은 Promise 거부:', reason);
  gracefulShutdown('unhandledRejection');
});

// 서버 시작
startServer();

export default app; 