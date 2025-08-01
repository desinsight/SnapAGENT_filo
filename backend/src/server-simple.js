import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
dotenv.config({ path: join(rootDir, '.env') });

const app = express();
const server = createServer(app);

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '서버가 실행 중입니다.' });
});

// 최근 파일 API (더미 데이터)
app.get('/api/recent-files', (req, res) => {
  res.json({ 
    success: true,
    recentFiles: []
  });
});

// 도구 목록 API (더미 데이터)
app.get('/api/ai/available-tools', (req, res) => {
  res.json({
    success: true,
    data: { tools: [] }
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || '서버 오류가 발생했습니다.' 
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 간단한 백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});