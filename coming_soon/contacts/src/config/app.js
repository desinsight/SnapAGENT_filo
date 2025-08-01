/**
 * ⚙️ App Configuration
 * 
 * Express 앱 미들웨어 및 보안 설정
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
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

/**
 * 🔒 Rate Limiting 설정
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * 📝 Swagger 설정
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contacts Service API',
      version: '1.0.0',
      description: 'AI-First Contacts Management Service Backend API',
      contact: {
        name: 'Your Team',
        email: 'support@yourcompany.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

/**
 * ⚙️ 미들웨어 설정
 * @param {Express} app - Express 앱 인스턴스
 */
export function setupMiddleware(app) {
  // 기본 미들웨어
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // 압축
  app.use(compression());
  
  // CORS 설정
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
  
  // 보안 헤더
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // 로깅
  const morganFormat = process.env.NODE_ENV === 'production' 
    ? 'combined' 
    : 'dev';
  app.use(morgan(morganFormat));
  
  // Rate Limiting
  // 전체 API 제한
  app.use('/api/', createRateLimit(
    15 * 60 * 1000, // 15분
    100, // 최대 100개 요청
    'API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  ));
  
  // 인증 관련 제한
  app.use('/api/auth/', createRateLimit(
    15 * 60 * 1000, // 15분
    5, // 최대 5개 요청
    '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  ));
  
  // 검색 제한
  app.use('/api/search/', createRateLimit(
    1 * 60 * 1000, // 1분
    30, // 최대 30개 요청
    '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  ));
  
  // Swagger 문서
  const specs = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Contacts Service API Documentation'
  }));
  
  // API 정보 엔드포인트
  app.get('/api', (req, res) => {
    res.json({
      name: 'Contacts Service Backend',
      version: '1.0.0',
      description: 'AI-First Contacts Management Service',
      endpoints: {
        contacts: '/api/contacts',
        projects: '/api/projects',
        search: '/api/search',
        network: '/api/network',
        docs: '/api-docs'
      },
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * 🔧 개발 환경 설정
 * @param {Express} app - Express 앱 인스턴스
 */
export function setupDevelopment(app) {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서만 추가 미들웨어
    app.use((req, res, next) => {
      console.log(`🔍 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }
}

/**
 * 🛡️ 보안 미들웨어
 * @param {Express} app - Express 앱 인스턴스
 */
export function setupSecurity(app) {
  // XSS 방지
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  // 요청 크기 제한
  app.use((req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({
        error: 'Payload Too Large',
        message: '요청 크기가 너무 큽니다.',
        timestamp: new Date().toISOString()
      });
    }
    next();
  });
}

/**
 * 📊 모니터링 미들웨어
 * @param {Express} app - Express 앱 인스턴스
 */
export function setupMonitoring(app) {
  // 응답 시간 측정
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      if (duration > 1000) {
        console.warn('⚠️ 느린 요청:', logData);
      }
    });
    
    next();
  });
  
  // 에러율 모니터링
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.error('❌ 에러 응답:', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        });
      }
      originalSend.call(this, data);
    };
    next();
  });
}

/**
 * 🔄 미들웨어 초기화
 * @param {Express} app - Express 앱 인스턴스
 */
export function initializeMiddleware(app) {
  setupMiddleware(app);
  setupSecurity(app);
  setupMonitoring(app);
  
  if (process.env.NODE_ENV === 'development') {
    setupDevelopment(app);
  }
} 