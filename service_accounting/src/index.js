/**
 * 💰 Accounting Service Backend - Main Server Entry Point
 * 
 * AI-First Accounting & Tax Management Service Backend API
 * 세무, 회계, 급여 관리를 위한 통합 백엔드 서비스
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 * @description AI가 주도하는 통합 세무/회계 플랫폼의 핵심 백엔드
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config();

// 미들웨어 임포트
import { authenticateToken, requireRole } from './middlewares/auth.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { 
  requestLogger, 
  performanceMonitor, 
  dataAccessLogger,
  apiUsageTracker 
} from './middlewares/requestLogger.js';

// 라우터 임포트
import accountingRoutes from './routes/accounting.js';
import taxRoutes from './routes/tax.js';
import receiptRoutes from './routes/receipts.js';

// 유틸리티 임포트
import logger from './utils/logger.js';

// 앱 생성
const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
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

// CORS 설정
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// 압축 미들웨어
app.use(compression());

// 요청 속도 제한
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 본문 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 로깅 미들웨어
app.use(requestLogger);
app.use(performanceMonitor);
app.use(dataAccessLogger);
app.use(apiUsageTracker);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '서비스가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 버전 정보
app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    name: 'Accounting Service',
    description: '국내 최고 수준의 세무 서비스 API',
    timestamp: new Date().toISOString()
  });
});

// API 라우터 설정
app.use('/api/accounting', authenticateToken, accountingRoutes);
app.use('/api/tax', authenticateToken, taxRoutes);
app.use('/api/receipts', authenticateToken, receiptRoutes);

// 관리자 전용 엔드포인트
app.get('/api/admin/status', authenticateToken, requireRole(['admin']), (req, res) => {
  res.status(200).json({
    success: true,
    message: '관리자 권한으로 접근했습니다.',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// 404 에러 핸들러
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(errorHandler);

// MongoDB 연결
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting_service';
    
    await mongoose.connect(mongoUri);

    logger.info('MongoDB 연결 성공', {
      uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // 비밀번호 마스킹
      database: mongoose.connection.name
    });

    // 데이터베이스 연결 이벤트 리스너
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB 연결 오류', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 연결이 끊어졌습니다.');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB 재연결 성공');
    });

  } catch (error) {
    logger.error('MongoDB 연결 실패', { error: error.message });
    process.exit(1);
  }
}

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결
    await connectDatabase();

    // 서버 시작
    const server = app.listen(PORT, () => {
      logger.info('서버 시작 성공', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });

      console.log(`
🚀 세무 서비스 서버가 시작되었습니다!

📍 서버 정보:
   - 포트: ${PORT}
   - 환경: ${process.env.NODE_ENV || 'development'}
   - 시간: ${new Date().toLocaleString('ko-KR')}

🔗 API 엔드포인트:
   - 헬스 체크: http://localhost:${PORT}/health
   - API 버전: http://localhost:${PORT}/api/version
   - 회계 API: http://localhost:${PORT}/api/accounting
   - 세무 API: http://localhost:${PORT}/api/tax
   - 영수증 API: http://localhost:${PORT}/api/receipts

📊 모니터링:
   - 로그 파일: ./logs/
   - 데이터베이스: MongoDB
   - 성능 모니터링: 활성화

🛡️ 보안:
   - CORS: 설정됨
   - Rate Limiting: 활성화
   - Helmet: 활성화
   - JWT 인증: 활성화

✨ 서비스가 정상적으로 실행 중입니다!
      `);
    });

    // 서버 종료 처리
    process.on('SIGTERM', () => {
      logger.info('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
      server.close(() => {
        logger.info('서버가 정상적으로 종료되었습니다.');
        mongoose.connection.close(() => {
          logger.info('데이터베이스 연결이 종료되었습니다.');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT 신호를 받았습니다. 서버를 종료합니다.');
      server.close(() => {
        logger.info('서버가 정상적으로 종료되었습니다.');
        mongoose.connection.close(() => {
          logger.info('데이터베이스 연결이 종료되었습니다.');
          process.exit(0);
        });
      });
    });

    // 예상치 못한 에러 처리
    process.on('uncaughtException', (error) => {
      logger.error('예상치 못한 에러 발생', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('처리되지 않은 Promise 거부', {
        reason: reason?.message || reason,
        promise: promise
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('서버 시작 실패', { error: error.message });
    process.exit(1);
  }
}

// 서버 시작
startServer();

export default app; 