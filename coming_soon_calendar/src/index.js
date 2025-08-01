// 캘린더 서비스 백엔드 진입점
// 플랫폼 연동, AI 활용, 확장성 고려

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, healthCheck } = require('./config/database');
require('dotenv').config();
const errorHandler = require('./middlewares/errorHandler');
const calendarRouter = require('./routes/calendar');
const templateRoutes = require('./routes/templates');
const notificationRoutes = require('./routes/notifications');
const moduleRoutes = require('./routes/modules');
const locationRoutes = require('./routes/location');

// Swagger(OpenAPI) 문서화 추가
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Coming Soon Calendar API',
    version: '1.0.0',
    description: '캘린더/일정/알림/태그/카테고리 등 API 명세 (자동 문서화)',
  },
  servers: [
    { url: 'http://localhost:4000', description: '로컬 개발 서버' }
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // JSDoc 주석 기반 자동 문서화
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 설정
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const status = dbHealth.status === 'healthy' ? 200 : 503;
    
    res.status(status).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 캘린더 서비스 라우트 연결 (가장 먼저 등록)
app.use('/api/calendar', calendarRouter);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/location', locationRoutes);

// Swagger UI 엔드포인트
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
    path: req.originalUrl
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('🚨 서버 에러:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '서버 내부 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 서버 시작
async function startServer() {
  try {
    // DB 연결
    await connectDB();
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`📊 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API 문서: http://localhost:${PORT}/api-docs`);
      console.log(`💚 헬스체크: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// 테스트 환경이 아닐 때만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// 테스트 및 외부에서 app 객체 사용 가능하게 export
module.exports = app; 