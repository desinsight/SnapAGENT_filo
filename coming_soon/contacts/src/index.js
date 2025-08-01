/**
 * 📞 Contacts Service Backend - Main Server Entry Point
 * 
 * AI-First 통합 서비스의 연락처 관리 백엔드 API
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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 환경 변수 로드
dotenv.config();

// ES6 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 앱 설정 import
import { connectDatabase } from './config/database.js';
import { initializeMiddleware } from './config/app.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// 라우트 import
import contactRoutes from './routes/contacts.js';
import projectRoutes from './routes/projects.js';
import searchRoutes from './routes/search.js';
import networkRoutes from './routes/network.js';

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 🚀 서버 초기화 및 시작
 */
async function startServer() {
  try {
    logger.info('🚀 Contacts Service Backend 시작 중...');
    
    // 데이터베이스 연결
    await connectDatabase();
    logger.info('✅ 데이터베이스 연결 완료');
    
    // 미들웨어 설정
    initializeMiddleware(app);
    logger.info('✅ 미들웨어 설정 완료');
    
    // 라우트 설정
    setupRoutes(app);
    logger.info('✅ 라우트 설정 완료');
    
    // 에러 핸들러 (마지막에 설정)
    app.use(errorHandler);
    
    // 서버 시작
    app.listen(PORT, () => {
      logger.info(`🎉 Contacts Service Backend 서버가 포트 ${PORT}에서 실행 중입니다.`);
      logger.info(`📊 환경: ${NODE_ENV}`);
      logger.info(`🔗 API 문서: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 헬스 체크: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

/**
 * 🛣️ 라우트 설정
 * @param {Express} app - Express 앱 인스턴스
 */
function setupRoutes(app) {
  // 헬스 체크 엔드포인트
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      service: 'Contacts Service Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // API 라우트
  app.use('/api/contacts', contactRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/network', networkRoutes);
  
  // 404 핸들러
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `경로 ${req.originalUrl}을 찾을 수 없습니다.`,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * 🔄 Graceful Shutdown 처리
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호 수신. 서버를 정상적으로 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT 신호 수신. 서버를 정상적으로 종료합니다...');
  process.exit(0);
});

// 예상치 못한 에러 처리
process.on('uncaughtException', (error) => {
  logger.error('예상치 못한 에러 발생:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

// 서버 시작
startServer();

export default app; 