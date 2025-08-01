/**
 * Database Configuration - 데이터베이스 연결 설정
 * MongoDB 연결 및 설정을 관리하는 모듈
 * 
 * @description
 * - MongoDB 연결 설정
 * - 연결 이벤트 핸들링
 * - 재연결 로직
 * - 개발/테스트 환경 분리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * MongoDB 연결 옵션
 */
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
  autoIndex: process.env.NODE_ENV === 'development',
  retryWrites: true,
  w: 'majority'
};

/**
 * 데이터베이스 연결 함수
 * @param {string} uri - MongoDB 연결 URI
 * @returns {Promise} 연결 결과
 */
export const connectDatabase = async (uri = process.env.MONGODB_URI) => {
  try {
    // 기존 연결이 있으면 재사용
    if (mongoose.connection.readyState === 1) {
      logger.info('📦 데이터베이스 이미 연결됨');
      return mongoose.connection;
    }

    // 새로운 연결 생성
    await mongoose.connect(uri, connectionOptions);
    
    logger.info('📦 MongoDB 연결 성공');
    
    // 연결 이벤트 리스너 설정
    mongoose.connection.on('error', (error) => {
      logger.error('📦 MongoDB 연결 오류:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('📦 MongoDB 연결 끊어짐');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('📦 MongoDB 재연결 성공');
    });

    // 프로세스 종료 시 연결 정리
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📦 MongoDB 연결 종료');
      process.exit(0);
    });

    return mongoose.connection;

  } catch (error) {
    logger.error('📦 MongoDB 연결 실패:', error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 해제
 * @returns {Promise} 해제 결과
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('📦 MongoDB 연결 해제 완료');
  } catch (error) {
    logger.error('📦 MongoDB 연결 해제 실패:', error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 상태 확인
 * @returns {boolean} 연결 상태
 */
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * 데이터베이스 통계 정보 조회
 * @returns {Object} 데이터베이스 통계
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    };
  } catch (error) {
    logger.error('📦 데이터베이스 통계 조회 실패:', error);
    return null;
  }
};

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseStats
}; 