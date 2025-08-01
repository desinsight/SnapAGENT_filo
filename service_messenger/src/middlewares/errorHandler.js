// 전역 에러 핸들링 미들웨어
// 모든 에러를 포맷팅하여 JSON으로 반환, 콘솔 로깅

const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // 기본 에러 정보
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || '서버 내부 오류가 발생했습니다.';
  
  // 커스텀 에러 처리
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      break;
    case 'PermissionError':
      statusCode = 403;
      break;
    case 'NotFoundError':
      statusCode = 404;
      break;
    case 'AuthenticationError':
      statusCode = 401;
      break;
    case 'ConflictError':
      statusCode = 409;
      break;
    case 'MongoError':
      if (err.code === 11000) {
        statusCode = 409;
        message = '중복된 데이터입니다.';
      }
      break;
    case 'CastError':
      statusCode = 400;
      message = '잘못된 데이터 형식입니다.';
      break;
    case 'JsonWebTokenError':
      statusCode = 401;
      message = '유효하지 않은 토큰입니다.';
      break;
    case 'TokenExpiredError':
      statusCode = 401;
      message = '토큰이 만료되었습니다.';
      break;
    default:
      statusCode = 500;
  }
  
  // 로그 기록
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`, {
    error: err.stack,
    user: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // 응답
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        name: err.name 
      })
    }
  });
}; 