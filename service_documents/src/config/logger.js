/**
 * Logger Configuration - 로깅 시스템 설정
 * Winston을 사용한 로깅 시스템 구성
 * 
 * @description
 * - 파일 로깅 및 콘솔 로깅
 * - 로그 레벨 관리
 * - 에러 추적
 * - 로그 포맷팅
 * - 로그 로테이션
 * 
 * @author Your Team
 * @version 1.0.0
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 로그 레벨 정의
 * 개발/프로덕션 환경에 따른 로그 레벨 설정
 */
const logLevels = {
  error: 0,    // 에러
  warn: 1,     // 경고
  info: 2,     // 정보
  http: 3,     // HTTP 요청
  debug: 4,    // 디버그
  verbose: 5   // 상세 정보
};

/**
 * 로그 색상 정의
 * 콘솔 출력 시 로그 레벨별 색상 설정
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan'
};

// Winston에 색상 추가
winston.addColors(logColors);

/**
 * 로그 포맷 정의
 * 로그 메시지의 출력 형식 설정
 */
const logFormat = winston.format.combine(
  // 타임스탬프 추가
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  
  // 에러 스택 트레이스 포맷팅
  winston.format.errors({ stack: true }),
  
  // JSON 포맷 (프로덕션용)
  ...(process.env.NODE_ENV === 'production' 
    ? [winston.format.json()]
    : [
        // 개발 환경용 컬러 포맷
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          
          // 메타데이터가 있는 경우 추가
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          
          // 스택 트레이스가 있는 경우 추가
          if (stack) {
            log += `\n${stack}`;
          }
          
          return log;
        })
      ]
  )
);

/**
 * 로그 파일 경로 설정
 * 환경별 로그 파일 경로 구성
 */
const getLogFilePath = (filename) => {
  const logDir = process.env.LOG_FILE_PATH 
    ? path.dirname(process.env.LOG_FILE_PATH)
    : path.join(__dirname, '../../logs');
  
  return path.join(logDir, filename);
};

/**
 * 로거 설정 함수
 * Winston 로거 인스턴스를 생성하고 설정
 * 
 * @returns {winston.Logger} 설정된 로거 인스턴스
 */
export const setupLogger = () => {
  // 로그 레벨 결정
  const logLevel = process.env.LOG_LEVEL || 
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  // 로거 인스턴스 생성
  const logger = winston.createLogger({
    level: logLevel,
    levels: logLevels,
    format: logFormat,
    defaultMeta: {
      service: 'documents-service',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    transports: [
      // 콘솔 출력 (개발 환경)
      ...(process.env.NODE_ENV !== 'production' 
        ? [new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.simple()
            )
          })]
        : []
      ),
      
      // 일반 로그 파일
      new winston.transports.File({
        filename: getLogFilePath('app.log'),
        level: 'info',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      }),
      
      // 에러 로그 파일
      new winston.transports.File({
        filename: getLogFilePath('error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      }),
      
      // HTTP 요청 로그 파일 (프로덕션)
      ...(process.env.NODE_ENV === 'production' 
        ? [new winston.transports.File({
            filename: getLogFilePath('http.log'),
            level: 'http',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            tailable: true
          })]
        : []
      )
    ],
    
    // 예외 처리
    exceptionHandlers: [
      new winston.transports.File({
        filename: getLogFilePath('exceptions.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      })
    ],
    
    // Promise 거부 처리
    rejectionHandlers: [
      new winston.transports.File({
        filename: getLogFilePath('rejections.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      })
    ]
  });

  // 로거 초기화 로그
  logger.info('📝 로거 시스템 초기화 완료', {
    level: logLevel,
    environment: process.env.NODE_ENV,
    transports: logger.transports.map(t => t.name)
  });

  return logger;
};

/**
 * 요청 로거 미들웨어
 * HTTP 요청/응답 로깅을 위한 미들웨어
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @returns {Function} Express 미들웨어 함수
 */
export const createRequestLogger = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 응답 완료 시 로깅
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || 'anonymous'
      };

      // 상태 코드에 따른 로그 레벨 결정
      if (res.statusCode >= 500) {
        logger.error('HTTP 요청 에러', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('HTTP 요청 경고', logData);
      } else {
        logger.http('HTTP 요청', logData);
      }
    });

    next();
  };
};

/**
 * 에러 로거
 * 애플리케이션 에러를 로깅하는 전용 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @param {Error} error - 에러 객체
 * @param {Object} context - 에러 컨텍스트 정보
 */
export const logError = (logger, error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  };

  logger.error('애플리케이션 에러', errorData);
};

/**
 * 성능 로거
 * 성능 측정을 위한 로깅 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @param {string} operation - 작업명
 * @param {number} duration - 소요 시간 (ms)
 * @param {Object} metadata - 추가 메타데이터
 */
export const logPerformance = (logger, operation, duration, metadata = {}) => {
  const performanceData = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };

  // 성능 임계값에 따른 로그 레벨 결정
  const threshold = parseInt(process.env.PERFORMANCE_THRESHOLD) || 1000;
  
  if (duration > threshold) {
    logger.warn('성능 경고', performanceData);
  } else {
    logger.debug('성능 측정', performanceData);
  }
};

/**
 * 보안 로거
 * 보안 관련 이벤트를 로깅하는 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @param {string} event - 보안 이벤트
 * @param {Object} details - 이벤트 상세 정보
 */
export const logSecurity = (logger, event, details = {}) => {
  const securityData = {
    event,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userId: details.userId,
    userAgent: details.userAgent,
    ...details
  };

  logger.warn('보안 이벤트', securityData);
};

/**
 * 비즈니스 로직 로거
 * 비즈니스 로직 관련 로깅 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @param {string} action - 수행된 액션
 * @param {Object} data - 관련 데이터
 * @param {string} userId - 사용자 ID
 */
export const logBusiness = (logger, action, data = {}, userId = null) => {
  const businessData = {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  };

  logger.info('비즈니스 로직', businessData);
};

/**
 * 로그 정리 함수
 * 오래된 로그 파일을 정리하는 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @param {number} daysToKeep - 보관할 일수
 */
export const cleanupLogs = async (logger, daysToKeep = 30) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logDir = path.dirname(getLogFilePath('app.log'));
    const files = await fs.readdir(logDir);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let cleanedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
    }
    
    logger.info(`🧹 로그 정리 완료: ${cleanedCount}개 파일 삭제`);
    
  } catch (error) {
    logger.error('❌ 로그 정리 실패', { error: error.message });
  }
};

/**
 * 로그 통계 함수
 * 로그 파일 통계 정보를 반환하는 함수
 * 
 * @param {winston.Logger} logger - 로거 인스턴스
 * @returns {Promise<Object>} 로그 통계 정보
 */
export const getLogStats = async (logger) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logDir = path.dirname(getLogFilePath('app.log'));
    const files = await fs.readdir(logDir);
    
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      files: []
    };
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const fileStats = await fs.stat(filePath);
        
        stats.totalFiles++;
        stats.totalSize += fileStats.size;
        stats.files.push({
          name: file,
          size: fileStats.size,
          modified: fileStats.mtime
        });
      }
    }
    
    return stats;
    
  } catch (error) {
    logger.error('❌ 로그 통계 조회 실패', { error: error.message });
    return null;
  }
};

// 기본 내보내기
export default {
  setupLogger,
  createRequestLogger,
  logError,
  logPerformance,
  logSecurity,
  logBusiness,
  cleanupLogs,
  getLogStats
}; 