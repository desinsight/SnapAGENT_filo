/**
 * 📝 Logger Configuration
 * 
 * Winston 기반 로깅 시스템
 * 세무 서비스에 특화된 로깅 기능
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 로그 디렉토리 생성
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 로그 레벨별 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 콘솔 포맷 (개발 환경용)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 로거 인스턴스 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports: [
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 전체 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 회계 관련 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'accounting.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 세무 관련 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'tax.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 영수증 관련 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'receipt.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // 보안 관련 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    })
  ]
});

// 개발 환경에서는 콘솔 출력 추가
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * 회계 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logAccounting = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'accounting' });
};

/**
 * 세무 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logTax = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'tax' });
};

/**
 * 영수증 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logReceipt = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'receipt' });
};

/**
 * 보안 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logSecurity = (message, meta = {}) => {
  logger.warn(message, { ...meta, category: 'security' });
};

/**
 * 성능 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logPerformance = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'performance' });
};

/**
 * 외부 API 호출 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logExternalAPI = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'external_api' });
};

/**
 * 데이터베이스 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logDatabase = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'database' });
};

/**
 * 파일 처리 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logFileProcessing = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'file_processing' });
};

/**
 * AI 처리 관련 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logAIProcessing = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'ai_processing' });
};

/**
 * 사용자 활동 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logUserActivity = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'user_activity' });
};

/**
 * 시스템 이벤트 로깅 함수
 * @param {string} message - 로그 메시지
 * @param {Object} meta - 추가 메타데이터
 */
export const logSystemEvent = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'system_event' });
};

/**
 * 로그 파일 정리 함수 (오래된 로그 파일 삭제)
 * @param {number} daysToKeep - 보관할 일수
 */
export const cleanupLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        logger.info(`오래된 로그 파일 삭제: ${file}`);
      }
    });
  } catch (error) {
    logger.error('로그 파일 정리 중 오류 발생', { error: error.message });
  }
};

/**
 * 로그 통계 조회 함수
 * @returns {Object} 로그 통계 정보
 */
export const getLogStats = () => {
  try {
    const stats = {};
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      stats[file] = {
        size: stats.size,
        modified: stats.mtime,
        sizeInMB: (stats.size / 1024 / 1024).toFixed(2)
      };
    });
    
    return stats;
  } catch (error) {
    logger.error('로그 통계 조회 중 오류 발생', { error: error.message });
    return {};
  }
};

/**
 * 로그 레벨 변경 함수
 * @param {string} level - 새로운 로그 레벨
 */
export const setLogLevel = (level) => {
  if (levels[level] !== undefined) {
    logger.level = level;
    logger.info(`로그 레벨이 ${level}로 변경되었습니다.`);
  } else {
    logger.warn(`유효하지 않은 로그 레벨: ${level}`);
  }
};

// 주기적으로 로그 파일 정리 (매일 자정)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    cleanupLogs();
  }
}, 60000); // 1분마다 체크

export default logger; 