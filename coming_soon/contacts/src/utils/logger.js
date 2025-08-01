/**
 * 📝 Logger Utility
 * 
 * Winston 기반 로깅 시스템
 * 
 * @author Your Team
 * @version 1.0.0
 */

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES6 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 로그 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// 색상 활성화
winston.addColors(colors);

// 로그 포맷 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 파일 로그 포맷 (색상 제외)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 로그 파일 경로
const logDir = join(__dirname, '../../logs');

// 개발 환경 로거
const developmentLogger = winston.createLogger({
  level: 'debug',
  levels,
  format,
  transports: [
    // 콘솔 출력
    new winston.transports.Console(),
    // 파일 출력
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({
      filename: join(logDir, 'combined.log'),
      format: fileFormat
    })
  ]
});

// 프로덕션 환경 로거
const productionLogger = winston.createLogger({
  level: 'info',
  levels,
  format: fileFormat,
  transports: [
    // 에러 로그
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 전체 로그
    new winston.transports.File({
      filename: join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 환경에 따른 로거 선택
const logger = process.env.NODE_ENV === 'production' 
  ? productionLogger 
  : developmentLogger;

// 로그 파일 디렉토리 생성 확인
import fs from 'fs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 📊 로그 통계
 */
class LogStats {
  constructor() {
    this.stats = {
      error: 0,
      warn: 0,
      info: 0,
      http: 0,
      debug: 0
    };
  }

  increment(level) {
    if (this.stats[level] !== undefined) {
      this.stats[level]++;
    }
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      error: 0,
      warn: 0,
      info: 0,
      http: 0,
      debug: 0
    };
  }
}

const logStats = new LogStats();

// 로그 통계를 위한 래퍼 함수들
const originalLog = logger.log.bind(logger);

logger.log = (level, message, ...meta) => {
  logStats.increment(level);
  return originalLog(level, message, ...meta);
};

// 편의 메서드들
logger.error = (message, ...meta) => {
  logStats.increment('error');
  return logger.log('error', message, ...meta);
};

logger.warn = (message, ...meta) => {
  logStats.increment('warn');
  return logger.log('warn', message, ...meta);
};

logger.info = (message, ...meta) => {
  logStats.increment('info');
  return logger.log('info', message, ...meta);
};

logger.http = (message, ...meta) => {
  logStats.increment('http');
  return logger.log('http', message, ...meta);
};

logger.debug = (message, ...meta) => {
  logStats.increment('debug');
  return logger.log('debug', message, ...meta);
};

/**
 * 📈 로그 통계 가져오기
 */
logger.getStats = () => logStats.getStats();

/**
 * 🔄 로그 통계 리셋
 */
logger.resetStats = () => logStats.reset();

/**
 * 🧹 로그 파일 정리
 */
logger.cleanup = async () => {
  try {
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30일

    for (const file of files) {
      const filePath = join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`오래된 로그 파일 삭제: ${file}`);
      }
    }
  } catch (error) {
    logger.error('로그 파일 정리 실패:', error);
  }
};

// 주기적 로그 정리 (매일 자정)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      logger.cleanup();
    }
  }, 60 * 1000); // 1분마다 체크
}

export default logger; 