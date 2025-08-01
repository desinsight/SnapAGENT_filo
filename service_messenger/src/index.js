// service-messenger 백엔드 서버 엔트리포인트
// 주요 미들웨어/라우터/DB 연결 등 초기화

require('dotenv').config(); // 환경변수 로드
const express = require('express');
const connectDB = require('./config/db'); // DB 연결 모듈
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(__dirname + '/docs/swagger.yaml');

const app = express();

// CORS 및 JSON 파싱 미들웨어 적용
app.use(cors());
app.use(express.json());

// JWT 인증 미들웨어 (플랫폼 토큰 검증)
const authMiddleware = require('./middlewares/auth');
app.use(authMiddleware); // 모든 API에 인증 적용 (특정 라우터만 적용하려면 위치 조정)

// 라우터 엔트리포인트 연결
const apiRouter = require('./routes');
app.use('/api', apiRouter);

// Swagger UI 라우터 연결 (/api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 서버 상태 확인용 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-messenger' });
});

// 전역 에러 핸들링 미들웨어 (항상 마지막에 위치)
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// 빌드타임 환경변수 자동 주입 (없으면 현재 시각)
if (!process.env.BUILD_TIME) {
  process.env.BUILD_TIME = new Date().toISOString();
}

// 서버 시작 함수
const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 4001;
    const server = app.listen(port, () => {
      console.log(`service-messenger 서버가 ${port}번 포트에서 실행 중`);
    });
    return server;
  } catch (err) {
    console.error('서버 시작 실패:', err);
    process.exit(1);
  }
};

// 개발 환경에서만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; 