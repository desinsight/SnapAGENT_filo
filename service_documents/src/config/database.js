/**
 * Database Configuration - MongoDB 연결 설정
 * MongoDB 데이터베이스 연결 및 관리
 * 
 * @description
 * - MongoDB 연결 설정 및 관리
 * - 연결 풀 설정
 * - 재연결 로직
 * - 에러 핸들링
 * - 성능 모니터링
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { setupLogger } from './logger.js';

const logger = setupLogger();

/**
 * MongoDB 연결 옵션
 * 성능 최적화 및 안정성을 위한 설정
 */
const mongoOptions = {
  // 연결 풀 설정
  maxPoolSize: 10,                    // 최대 연결 풀 크기
  minPoolSize: 2,                     // 최소 연결 풀 크기
  maxIdleTimeMS: 30000,               // 최대 유휴 시간 (30초)
  
  // 타임아웃 설정
  serverSelectionTimeoutMS: 5000,     // 서버 선택 타임아웃 (5초)
  socketTimeoutMS: 45000,             // 소켓 타임아웃 (45초)
  connectTimeoutMS: 10000,            // 연결 타임아웃 (10초)
  
  // 재연결 설정
  autoReconnect: true,                // 자동 재연결 활성화
  reconnectTries: Number.MAX_VALUE,   // 재연결 시도 횟수 (무제한)
  reconnectInterval: 1000,            // 재연결 간격 (1초)
  
  // 쓰기 설정
  w: 'majority',                      // 쓰기 확인 레벨
  wtimeout: 10000,                    // 쓰기 타임아웃 (10초)
  
  // 읽기 설정
  readPreference: 'primary',          // 읽기 선호도
  readConcern: { level: 'local' },    // 읽기 일관성 레벨
  
  // 기타 설정
  bufferCommands: true,               // 버퍼 명령 활성화
  bufferMaxEntries: 0,                // 버퍼 최대 엔트리 (0 = 무제한)
  
  // SSL 설정 (프로덕션에서 필요시)
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: process.env.NODE_ENV === 'production',
  
  // 인증 설정
  auth: {
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD
  },
  
  // 데이터베이스 이름
  dbName: process.env.MONGODB_DB_NAME || 'documents_service'
};

/**
 * MongoDB 연결 함수
 * 데이터베이스에 연결하고 연결 상태를 관리
 * 
 * @returns {Promise<mongoose.Connection>} MongoDB 연결 객체
 */
export const connectDatabase = async () => {
  try {
    // 이미 연결된 경우 기존 연결 반환
    if (mongoose.connection.readyState === 1) {
      logger.info('✅ MongoDB 이미 연결되어 있습니다.');
      return mongoose.connection;
    }

    // 연결 문자열 구성
    const mongoUri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB 연결 URI가 설정되지 않았습니다. MONGODB_URI 환경변수를 확인해주세요.');
    }

    logger.info('🔄 MongoDB 연결 시도 중...');
    logger.info(`📍 연결 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // 비밀번호 마스킹

    // 데이터베이스 연결
    await mongoose.connect(mongoUri, mongoOptions);

    logger.info('✅ MongoDB 연결 성공!');
    logger.info(`📊 데이터베이스: ${mongoose.connection.name}`);
    logger.info(`🌐 호스트: ${mongoose.connection.host}`);
    logger.info(`🔌 포트: ${mongoose.connection.port}`);

    // 연결 이벤트 리스너 설정
    setupConnectionEventListeners();

    return mongoose.connection;

  } catch (error) {
    logger.error('❌ MongoDB 연결 실패:', error);
    throw error;
  }
};

/**
 * 연결 이벤트 리스너 설정
 * 연결 상태 변화를 모니터링하고 적절한 조치 수행
 */
const setupConnectionEventListeners = () => {
  const connection = mongoose.connection;

  // 연결 성공 이벤트
  connection.on('connected', () => {
    logger.info('✅ MongoDB 연결됨');
  });

  // 연결 해제 이벤트
  connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB 연결 해제됨');
  });

  // 재연결 시도 이벤트
  connection.on('reconnected', () => {
    logger.info('🔄 MongoDB 재연결됨');
  });

  // 연결 에러 이벤트
  connection.on('error', (error) => {
    logger.error('❌ MongoDB 연결 에러:', error);
  });

  // 연결 종료 이벤트
  connection.on('close', () => {
    logger.warn('🔒 MongoDB 연결 종료됨');
  });

  // 프로세스 종료 시 연결 정리
  process.on('SIGINT', async () => {
    try {
      await connection.close();
      logger.info('✅ MongoDB 연결이 안전하게 종료되었습니다.');
      process.exit(0);
    } catch (error) {
      logger.error('❌ MongoDB 연결 종료 중 에러:', error);
      process.exit(1);
    }
  });
};

/**
 * 데이터베이스 연결 상태 확인
 * 현재 연결 상태를 반환
 * 
 * @returns {Object} 연결 상태 정보
 */
export const getDatabaseStatus = () => {
  const connection = mongoose.connection;
  
  return {
    readyState: connection.readyState,
    readyStateText: getReadyStateText(connection.readyState),
    host: connection.host,
    port: connection.port,
    name: connection.name,
    isConnected: connection.readyState === 1,
    isConnecting: connection.readyState === 2,
    isDisconnected: connection.readyState === 0,
    isDisconnecting: connection.readyState === 3
  };
};

/**
 * 연결 상태 텍스트 변환
 * 숫자 상태 코드를 읽기 쉬운 텍스트로 변환
 * 
 * @param {number} readyState - 연결 상태 코드
 * @returns {string} 연결 상태 텍스트
 */
const getReadyStateText = (readyState) => {
  const states = {
    0: 'disconnected',    // 연결 해제됨
    1: 'connected',       // 연결됨
    2: 'connecting',      // 연결 중
    3: 'disconnecting'    // 연결 해제 중
  };
  
  return states[readyState] || 'unknown';
};

/**
 * 데이터베이스 연결 해제
 * 안전하게 데이터베이스 연결을 종료
 * 
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('✅ MongoDB 연결이 안전하게 종료되었습니다.');
    }
  } catch (error) {
    logger.error('❌ MongoDB 연결 종료 중 에러:', error);
    throw error;
  }
};

/**
 * 데이터베이스 성능 모니터링
 * 연결 풀 상태 및 성능 지표 모니터링
 * 
 * @returns {Object} 성능 지표
 */
export const getDatabaseMetrics = () => {
  const connection = mongoose.connection;
  
  return {
    readyState: connection.readyState,
    readyStateText: getReadyStateText(connection.readyState),
    collections: Object.keys(connection.collections).length,
    models: Object.keys(connection.models).length,
    // MongoDB 드라이버 버전 정보
    version: mongoose.version,
    // 연결 풀 정보 (MongoDB 4.4+)
    poolSize: connection.pool?.size || 'N/A',
    availableConnections: connection.pool?.available || 'N/A',
    pendingConnections: connection.pool?.pending || 'N/A'
  };
};

/**
 * 데이터베이스 헬스체크
 * 데이터베이스 연결 상태를 확인하는 헬스체크 함수
 * 
 * @returns {Promise<Object>} 헬스체크 결과
 */
export const healthCheck = async () => {
  try {
    const startTime = Date.now();
    
    // 간단한 쿼리 실행으로 연결 상태 확인
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      database: 'MongoDB',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: getDatabaseStatus()
    };
  } catch (error) {
    logger.error('❌ 데이터베이스 헬스체크 실패:', error);
    
    return {
      status: 'unhealthy',
      database: 'MongoDB',
      error: error.message,
      timestamp: new Date().toISOString(),
      details: getDatabaseStatus()
    };
  }
};

// 기본 내보내기
export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  getDatabaseMetrics,
  healthCheck
}; 