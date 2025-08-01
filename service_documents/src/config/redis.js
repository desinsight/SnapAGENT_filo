/**
 * Redis Configuration - Redis 연결 설정
 * Redis 캐시 및 세션 관리
 * 
 * @description
 * - Redis 연결 설정 및 관리
 * - 캐싱 기능
 * - 세션 저장소
 * - 실시간 기능 지원
 * - 연결 풀 관리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import Redis from 'redis';
import { setupLogger } from './logger.js';

const logger = setupLogger();

/**
 * Redis 클라이언트 인스턴스
 * 전역에서 사용할 Redis 클라이언트
 */
let redisClient = null;
let redisPublisher = null;
let redisSubscriber = null;

/**
 * Redis 연결 옵션
 * 성능 최적화 및 안정성을 위한 설정
 */
const redisOptions = {
  // 연결 설정
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // 인증 설정
  password: process.env.REDIS_PASSWORD || undefined,
  
  // 데이터베이스 선택
  database: parseInt(process.env.REDIS_DB) || 0,
  
  // 연결 풀 설정
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    connectTimeout: 10000,        // 연결 타임아웃 (10초)
    lazyConnect: true,            // 지연 연결
    keepAlive: 30000,             // Keep-alive 간격 (30초)
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('❌ Redis 재연결 시도 횟수 초과');
        return new Error('Redis 재연결 실패');
      }
      return Math.min(retries * 100, 3000); // 최대 3초 간격
    }
  },
  
  // 명령 타임아웃
  commandTimeout: 5000,           // 명령 타임아웃 (5초)
  
  // 재연결 설정
  retryDelayOnFailover: 100,      // 장애 복구 시 재시도 지연
  maxRetriesPerRequest: 3,        // 요청당 최대 재시도 횟수
  
  // 기타 설정
  legacyMode: false,              // 레거시 모드 비활성화
  enableReadyCheck: true,         // 준비 상태 확인 활성화
  maxLoadingTimeout: 10000,       // 로딩 타임아웃 (10초)
  
  // 클러스터 설정 (필요시)
  enableOfflineQueue: true,       // 오프라인 큐 활성화
  enableAutoPipelining: true,     // 자동 파이프라인 활성화
};

/**
 * Redis 연결 함수
 * Redis 서버에 연결하고 클라이언트를 초기화
 * 
 * @returns {Promise<Redis.RedisClientType>} Redis 클라이언트 객체
 */
export const connectRedis = async () => {
  try {
    // 이미 연결된 경우 기존 클라이언트 반환
    if (redisClient && redisClient.isReady) {
      logger.info('✅ Redis 이미 연결되어 있습니다.');
      return redisClient;
    }

    logger.info('🔄 Redis 연결 시도 중...');
    logger.info(`📍 연결 URL: ${redisOptions.url.replace(/\/\/.*@/, '//***:***@')}`); // 비밀번호 마스킹

    // Redis 클라이언트 생성
    redisClient = Redis.createClient(redisOptions);
    
    // 이벤트 리스너 설정
    setupRedisEventListeners(redisClient);

    // 연결
    await redisClient.connect();

    logger.info('✅ Redis 연결 성공!');
    logger.info(`📊 데이터베이스: ${redisOptions.database}`);
    logger.info(`🌐 호스트: ${redisOptions.socket.host}`);
    logger.info(`🔌 포트: ${redisOptions.socket.port}`);

    // Publisher/Subscriber 클라이언트 생성 (실시간 기능용)
    await setupPubSubClients();

    return redisClient;

  } catch (error) {
    logger.error('❌ Redis 연결 실패:', error);
    throw error;
  }
};

/**
 * Redis 이벤트 리스너 설정
 * 연결 상태 변화를 모니터링하고 적절한 조치 수행
 * 
 * @param {Redis.RedisClientType} client - Redis 클라이언트
 */
const setupRedisEventListeners = (client) => {
  // 연결 성공 이벤트
  client.on('connect', () => {
    logger.info('✅ Redis 연결됨');
  });

  // 연결 해제 이벤트
  client.on('disconnect', () => {
    logger.warn('⚠️ Redis 연결 해제됨');
  });

  // 재연결 시도 이벤트
  client.on('reconnecting', () => {
    logger.info('🔄 Redis 재연결 시도 중...');
  });

  // 재연결 성공 이벤트
  client.on('ready', () => {
    logger.info('✅ Redis 준비됨');
  });

  // 연결 에러 이벤트
  client.on('error', (error) => {
    logger.error('❌ Redis 에러:', error);
  });

  // 연결 종료 이벤트
  client.on('end', () => {
    logger.warn('🔒 Redis 연결 종료됨');
  });

  // 프로세스 종료 시 연결 정리
  process.on('SIGINT', async () => {
    try {
      await client.quit();
      logger.info('✅ Redis 연결이 안전하게 종료되었습니다.');
    } catch (error) {
      logger.error('❌ Redis 연결 종료 중 에러:', error);
    }
  });
};

/**
 * Publisher/Subscriber 클라이언트 설정
 * 실시간 기능을 위한 Pub/Sub 클라이언트 생성
 * 
 * @returns {Promise<void>}
 */
const setupPubSubClients = async () => {
  try {
    // Publisher 클라이언트
    redisPublisher = Redis.createClient(redisOptions);
    await redisPublisher.connect();
    logger.info('✅ Redis Publisher 연결 완료');

    // Subscriber 클라이언트
    redisSubscriber = Redis.createClient(redisOptions);
    await redisSubscriber.connect();
    logger.info('✅ Redis Subscriber 연결 완료');

  } catch (error) {
    logger.error('❌ Redis Pub/Sub 클라이언트 설정 실패:', error);
    throw error;
  }
};

/**
 * Redis 연결 상태 확인
 * 현재 연결 상태를 반환
 * 
 * @returns {Object} 연결 상태 정보
 */
export const getRedisStatus = () => {
  if (!redisClient) {
    return {
      isConnected: false,
      status: 'not_initialized',
      message: 'Redis 클라이언트가 초기화되지 않았습니다.'
    };
  }

  return {
    isConnected: redisClient.isReady,
    status: redisClient.isReady ? 'connected' : 'disconnected',
    isOpen: redisClient.isOpen,
    isReady: redisClient.isReady,
    host: redisOptions.socket.host,
    port: redisOptions.socket.port,
    database: redisOptions.database,
    publisher: redisPublisher?.isReady || false,
    subscriber: redisSubscriber?.isReady || false
  };
};

/**
 * Redis 연결 해제
 * 안전하게 Redis 연결을 종료
 * 
 * @returns {Promise<void>}
 */
export const disconnectRedis = async () => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.quit();
      logger.info('✅ Redis 클라이언트 연결이 안전하게 종료되었습니다.');
    }

    if (redisPublisher && redisPublisher.isReady) {
      await redisPublisher.quit();
      logger.info('✅ Redis Publisher 연결이 안전하게 종료되었습니다.');
    }

    if (redisSubscriber && redisSubscriber.isReady) {
      await redisSubscriber.quit();
      logger.info('✅ Redis Subscriber 연결이 안전하게 종료되었습니다.');
    }

  } catch (error) {
    logger.error('❌ Redis 연결 종료 중 에러:', error);
    throw error;
  }
};

/**
 * Redis 헬스체크
 * Redis 연결 상태를 확인하는 헬스체크 함수
 * 
 * @returns {Promise<Object>} 헬스체크 결과
 */
export const healthCheck = async () => {
  try {
    if (!redisClient || !redisClient.isReady) {
      return {
        status: 'unhealthy',
        service: 'Redis',
        error: 'Redis 클라이언트가 연결되지 않았습니다.',
        timestamp: new Date().toISOString()
      };
    }

    const startTime = Date.now();
    
    // PING 명령으로 연결 상태 확인
    await redisClient.ping();
    
    const responseTime = Date.now() - startTime;

    // 메모리 사용량 확인
    const info = await redisClient.info('memory');
    const memoryInfo = parseRedisInfo(info);

    return {
      status: 'healthy',
      service: 'Redis',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        ...getRedisStatus(),
        memory: memoryInfo
      }
    };

  } catch (error) {
    logger.error('❌ Redis 헬스체크 실패:', error);
    
    return {
      status: 'unhealthy',
      service: 'Redis',
      error: error.message,
      timestamp: new Date().toISOString(),
      details: getRedisStatus()
    };
  }
};

/**
 * Redis INFO 명령 결과 파싱
 * Redis 서버 정보를 파싱하여 객체로 변환
 * 
 * @param {string} info - Redis INFO 명령 결과
 * @returns {Object} 파싱된 정보
 */
const parseRedisInfo = (info) => {
  const lines = info.split('\r\n');
  const result = {};

  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      result[key] = value;
    }
  });

  return result;
};

/**
 * 캐시 설정 함수
 * Redis를 사용한 캐시 기능
 * 
 * @param {string} key - 캐시 키
 * @param {any} value - 캐시할 값
 * @param {number} ttl - TTL (초)
 * @returns {Promise<void>}
 */
export const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    }

    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, ttl, serializedValue);
    
    logger.debug(`✅ 캐시 설정 완료: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error(`❌ 캐시 설정 실패: ${key}`, error);
    throw error;
  }
};

/**
 * 캐시 조회 함수
 * Redis에서 캐시된 값을 조회
 * 
 * @param {string} key - 캐시 키
 * @returns {Promise<any>} 캐시된 값
 */
export const getCache = async (key) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    }

    const value = await redisClient.get(key);
    
    if (value === null) {
      return null;
    }

    // JSON 파싱 시도
    try {
      return JSON.parse(value);
    } catch {
      return value; // 문자열 그대로 반환
    }

  } catch (error) {
    logger.error(`❌ 캐시 조회 실패: ${key}`, error);
    throw error;
  }
};

/**
 * 캐시 삭제 함수
 * Redis에서 캐시된 값을 삭제
 * 
 * @param {string} key - 캐시 키
 * @returns {Promise<number>} 삭제된 키 개수
 */
export const deleteCache = async (key) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    }

    const result = await redisClient.del(key);
    logger.debug(`✅ 캐시 삭제 완료: ${key}`);
    return result;

  } catch (error) {
    logger.error(`❌ 캐시 삭제 실패: ${key}`, error);
    throw error;
  }
};

/**
 * 패턴으로 캐시 삭제 함수
 * 패턴에 맞는 모든 캐시 키를 삭제
 * 
 * @param {string} pattern - 삭제할 키 패턴
 * @returns {Promise<number>} 삭제된 키 개수
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    const result = await redisClient.del(keys);
    logger.debug(`✅ 패턴 캐시 삭제 완료: ${pattern} (${result}개)`);
    return result;

  } catch (error) {
    logger.error(`❌ 패턴 캐시 삭제 실패: ${pattern}`, error);
    throw error;
  }
};

/**
 * Publisher/Subscriber 기능
 * 실시간 메시지 발행 및 구독
 */

/**
 * 메시지 발행
 * 
 * @param {string} channel - 채널명
 * @param {any} message - 발행할 메시지
 * @returns {Promise<number>} 구독자 수
 */
export const publishMessage = async (channel, message) => {
  try {
    if (!redisPublisher || !redisPublisher.isReady) {
      throw new Error('Redis Publisher가 연결되지 않았습니다.');
    }

    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    const subscribers = await redisPublisher.publish(channel, serializedMessage);
    
    logger.debug(`✅ 메시지 발행 완료: ${channel} (구독자: ${subscribers}명)`);
    return subscribers;

  } catch (error) {
    logger.error(`❌ 메시지 발행 실패: ${channel}`, error);
    throw error;
  }
};

/**
 * 메시지 구독
 * 
 * @param {string} channel - 채널명
 * @param {Function} callback - 메시지 수신 시 호출될 콜백
 * @returns {Promise<void>}
 */
export const subscribeToChannel = async (channel, callback) => {
  try {
    if (!redisSubscriber || !redisSubscriber.isReady) {
      throw new Error('Redis Subscriber가 연결되지 않았습니다.');
    }

    await redisSubscriber.subscribe(channel, (message) => {
      try {
        // JSON 파싱 시도
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch {
        // 문자열 그대로 전달
        callback(message);
      }
    });

    logger.debug(`✅ 채널 구독 완료: ${channel}`);

  } catch (error) {
    logger.error(`❌ 채널 구독 실패: ${channel}`, error);
    throw error;
  }
};

// 기본 내보내기
export default {
  connectRedis,
  disconnectRedis,
  getRedisStatus,
  healthCheck,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  publishMessage,
  subscribeToChannel
}; 