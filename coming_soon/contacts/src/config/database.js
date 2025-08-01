/**
 * 🗄️ Database Configuration
 * 
 * MongoDB 및 Redis 연결 설정
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import Redis from 'redis';
import logger from '../utils/logger.js';

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contacts_service';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis 클라이언트
let redisClient = null;

/**
 * 🔗 MongoDB 연결
 */
export async function connectDatabase() {
  try {
    // MongoDB 연결 옵션
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };

    // MongoDB 연결
    await mongoose.connect(MONGODB_URI, options);
    
    logger.info('✅ MongoDB 연결 성공');
    
    // 연결 이벤트 리스너
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB 연결 에러:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB 연결 끊어짐');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB 재연결 성공');
    });
    
  } catch (error) {
    logger.error('❌ MongoDB 연결 실패:', error);
    throw error;
  }
}

/**
 * 🔗 Redis 연결
 */
export async function connectRedis() {
  try {
    redisClient = Redis.createClient({
      url: REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('❌ Redis 서버 연결 거부');
          return new Error('Redis 서버 연결 거부');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('❌ Redis 재시도 시간 초과');
          return new Error('Redis 재시도 시간 초과');
        }
        if (options.attempt > 10) {
          logger.error('❌ Redis 최대 재시도 횟수 초과');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
    
    await redisClient.connect();
    logger.info('✅ Redis 연결 성공');
    
    // Redis 이벤트 리스너
    redisClient.on('error', (error) => {
      logger.error('❌ Redis 에러:', error);
    });
    
    redisClient.on('connect', () => {
      logger.info('🔄 Redis 연결됨');
    });
    
    redisClient.on('ready', () => {
      logger.info('✅ Redis 준비 완료');
    });
    
    redisClient.on('end', () => {
      logger.warn('⚠️ Redis 연결 종료');
    });
    
  } catch (error) {
    logger.error('❌ Redis 연결 실패:', error);
    // Redis 연결 실패해도 앱은 계속 실행
  }
}

/**
 * 🔌 데이터베이스 연결 종료
 */
export async function disconnectDatabase() {
  try {
    // MongoDB 연결 종료
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('✅ MongoDB 연결 종료');
    }
    
    // Redis 연결 종료
    if (redisClient && redisClient.isReady) {
      await redisClient.quit();
      logger.info('✅ Redis 연결 종료');
    }
    
  } catch (error) {
    logger.error('❌ 데이터베이스 연결 종료 실패:', error);
  }
}

/**
 * 📊 데이터베이스 상태 확인
 */
export async function checkDatabaseHealth() {
  const health = {
    mongodb: false,
    redis: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // MongoDB 상태 확인
    if (mongoose.connection.readyState === 1) {
      health.mongodb = true;
    }
    
    // Redis 상태 확인
    if (redisClient && redisClient.isReady) {
      await redisClient.ping();
      health.redis = true;
    }
    
  } catch (error) {
    logger.error('❌ 데이터베이스 상태 확인 실패:', error);
  }
  
  return health;
}

/**
 * 🗃️ Redis 클라이언트 가져오기
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * 🔄 Redis 캐시 유틸리티
 */
export class CacheManager {
  constructor() {
    this.client = redisClient;
    this.defaultTTL = 3600; // 1시간
  }
  
  /**
   * 캐시에 데이터 저장
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.client || !this.client.isReady) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('❌ 캐시 저장 실패:', error);
      return false;
    }
  }
  
  /**
   * 캐시에서 데이터 가져오기
   */
  async get(key) {
    if (!this.client || !this.client.isReady) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('❌ 캐시 조회 실패:', error);
      return null;
    }
  }
  
  /**
   * 캐시에서 데이터 삭제
   */
  async del(key) {
    if (!this.client || !this.client.isReady) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('❌ 캐시 삭제 실패:', error);
      return false;
    }
  }
  
  /**
   * 패턴으로 캐시 삭제
   */
  async delPattern(pattern) {
    if (!this.client || !this.client.isReady) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('❌ 패턴 캐시 삭제 실패:', error);
      return false;
    }
  }
}

// 캐시 매니저 인스턴스 export
export const cacheManager = new CacheManager();

// 초기 연결
connectRedis(); 