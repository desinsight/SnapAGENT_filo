import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import accessRouter from './routes/access.js';
import claudeRouter from './routes/claude.js';
import previewRouter from './routes/preview.js';
import searchRouter from './routes/search.js';
import sortFilterRouter from './routes/sortFilter.js';
import naturalLanguageRouter from './routes/naturalLanguage.js';
import aiRouter from './routes/ai.js';

// 실행 디렉토리, .env 경로, 존재 여부 출력
console.log('실행 디렉토리:', process.cwd());
const envPath = path.join(process.cwd(), '.env');
console.log('실제 .env 경로:', envPath);
console.log('.env 파일 존재 여부:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 인증 라우트 등록
app.use('/api/access', accessRouter);
app.use('/api/claude', claudeRouter);
app.use('/api/preview', previewRouter);
app.use('/api/search', searchRouter);
app.use('/api/sort-filter', sortFilterRouter);
app.use('/api/natural-language', naturalLanguageRouter);
app.use('/api/ai', aiRouter);

// 드라이브 목록 API
app.get('/api/drives', (req, res) => {
  try {
    const drives = [];
    const hostDrives = ['/host-c', '/host-d'];
    hostDrives.forEach(hostPath => {
      try {
        fs.accessSync(hostPath);
        const driveLetter = hostPath.replace('/host-', '').toUpperCase();
        drives.push({
          name: `${driveLetter}: 드라이브`,
          path: hostPath
        });
      } catch (e) {
        // 마운트 안 된 드라이브는 무시
      }
    });
    if (drives.length === 0) {
      drives.push({
        name: '루트 디렉토리',
        path: '/'
      });
    }
    res.json({ data: drives });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 파일 목록 API
app.get('/api/files', (req, res) => {
  try {
    const { path: dirPath } = req.query;
    console.log(`파일 목록 요청: ${dirPath}`);
    
    if (!dirPath) {
      return res.status(400).json({ 
        error: 'path 파라미터가 필요합니다' 
      });
    }
    
    // 보안: 상위 디렉토리 접근 방지
    if (dirPath.includes('..')) {
      return res.status(403).json({ 
        error: '상위 디렉토리 접근이 금지되어 있습니다' 
      });
    }
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const directories = [];
    const files = [];
    
    items.forEach(item => {
      try {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          directories.push({
            name: item.name,
            path: fullPath,
            type: 'directory'
          });
        } else {
          const stats = fs.statSync(fullPath);
          files.push({
            name: item.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime
          });
        }
      } catch (itemError) {
        console.warn(`항목 처리 실패: ${item.name}`, itemError.message);
      }
    });
    
    console.log(`디렉토리 ${directories.length}개, 파일 ${files.length}개 반환`);
    
    res.json({
      data: {
        directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    console.error('파일 목록 조회 실패:', error);
    res.status(500).json({ 
      error: '파일 목록을 불러올 수 없습니다.',
      details: error.message 
    });
  }
});

// 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Web MCP Server API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Web MCP Server API 시작 ===`);
  console.log(`포트: ${PORT}`);
  console.log(`환경: ${process.env.NODE_ENV}`);
  console.log(`시간: ${new Date().toISOString()}`);
  console.log(`플랫폼: ${os.platform()}`);
  console.log('================================');
});

// 종료 처리
process.on('SIGTERM', () => {
  console.log('서버 종료 신호 받음');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('서버 중단 신호 받음');
  process.exit(0);
});