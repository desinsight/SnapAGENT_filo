/**
 * 📝 Request Logger Middleware
 * 
 * 요청/응답 로깅 미들웨어
 * 세무 서비스의 모든 API 요청을 상세히 로깅
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import logger from '../utils/logger.js';

/**
 * 일반적인 API 요청 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // 요청 정보 로깅
  logger.info('API 요청 시작', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    timestamp: new Date().toISOString()
  });

  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    logger[logLevel]('API 요청 완료', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * 회계 관련 요청 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const logAccountingRequest = (req, res, next) => {
  const action = req.params.action || req.body.action || 'unknown';
  const amount = req.body.amount || req.query.amount;
  const transactionId = req.params.transactionId || req.body.transactionId;

  logger.info('회계 요청', {
    action,
    amount: amount ? parseFloat(amount) : undefined,
    transactionId,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * 세무 관련 요청 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const logTaxRequest = (req, res, next) => {
  const action = req.params.action || req.body.action || 'unknown';
  const taxType = req.body.taxType || req.query.taxType;
  const period = req.body.period || req.query.period;
  const year = req.body.year || req.query.year;

  logger.info('세무 요청', {
    action,
    taxType,
    period,
    year,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * 영수증 관련 요청 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const logReceiptRequest = (req, res, next) => {
  const action = req.params.action || req.body.action || 'unknown';
  const receiptId = req.params.receiptId || req.body.receiptId;
  const fileSize = req.file?.size;
  const fileName = req.file?.originalname;

  logger.info('영수증 요청', {
    action,
    receiptId,
    fileSize,
    fileName,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * 보안 이벤트 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const logSecurityEvent = (req, res, next) => {
  const securityEvents = [
    'login',
    'logout',
    'password_change',
    'permission_change',
    'sensitive_data_access',
    'file_upload',
    'file_download',
    'data_export',
    'admin_action'
  ];

  const eventType = req.body.eventType || req.query.eventType;
  
  if (securityEvents.includes(eventType)) {
    logger.warn('보안 이벤트', {
      eventType,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * 성능 모니터링 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // 밀리초
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // 성능 임계값 체크
    if (duration > 1000) { // 1초 이상
      logger.warn('느린 요청 감지', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }

    // 메모리 사용량 체크
    if (memoryDiff.heapUsed > 50 * 1024 * 1024) { // 50MB 이상 증가
      logger.warn('높은 메모리 사용량', {
        method: req.method,
        url: req.originalUrl,
        memoryIncrease: `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }

    // 성능 메트릭 로깅
    logger.debug('성능 메트릭', {
      method: req.method,
      url: req.originalUrl,
      duration: `${duration.toFixed(2)}ms`,
      memoryDiff,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * 데이터 접근 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const dataAccessLogger = (req, res, next) => {
  const sensitiveEndpoints = [
    '/api/accounting/reports',
    '/api/tax/reports',
    '/api/receipts',
    '/api/users',
    '/api/organizations'
  ];

  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
    req.originalUrl.includes(endpoint)
  );

  if (isSensitiveEndpoint) {
    logger.info('민감한 데이터 접근', {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * 파일 업로드 로깅 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const fileUploadLogger = (req, res, next) => {
  if (req.file || req.files) {
    const files = req.files || [req.file];
    
    files.forEach(file => {
      logger.info('파일 업로드', {
        originalName: file.originalname,
        fileName: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    });
  }

  next();
};

/**
 * 요청 ID 생성 함수
 * @returns {string} 고유한 요청 ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 요청 본문 크기 제한 체크 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const requestSizeMonitor = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    logger.warn('큰 요청 본문 감지', {
      contentLength: `${(contentLength / 1024 / 1024).toFixed(2)}MB`,
      maxSize: `${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * API 사용량 추적 미들웨어
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const apiUsageTracker = (req, res, next) => {
  // TODO: Redis를 사용한 API 사용량 추적 구현
  // 현재는 기본 로깅만 제공
  
  const endpoint = req.originalUrl;
  const method = req.method;
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId;

  logger.debug('API 사용량 추적', {
    endpoint,
    method,
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });

  next();
};

export default {
  requestLogger,
  logAccountingRequest,
  logTaxRequest,
  logReceiptRequest,
  logSecurityEvent,
  performanceMonitor,
  dataAccessLogger,
  fileUploadLogger,
  requestSizeMonitor,
  apiUsageTracker
}; 