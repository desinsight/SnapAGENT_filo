/**
 * 📊 Database Configuration
 * 
 * MongoDB 연결 설정 및 관리
 * 플랫폼 통합 운영을 위한 설정
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// 환경 변수
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web_mcp_accounting';
const MONGODB_OPTIONS = {
  maxPoolSize: 10, // 연결 풀 크기
  serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
  socketTimeoutMS: 45000, // 소켓 타임아웃
  bufferMaxEntries: 0, // 버퍼 최대 엔트리
  bufferCommands: false, // 버퍼 명령 비활성화
};

/**
 * 데이터베이스 연결 함수
 * 플랫폼 통합 MongoDB에 연결
 */
export const connectDatabase = async () => {
  try {
    // 기존 연결이 있으면 재사용
    if (mongoose.connection.readyState === 1) {
      logger.info('✅ Database already connected');
      return mongoose.connection;
    }

    // 새로운 연결 생성
    const connection = await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);
    
    logger.info('✅ MongoDB connected successfully');
    logger.info(`📊 Database: ${connection.connection.name}`);
    logger.info(`🔗 Host: ${connection.connection.host}`);
    logger.info(`🚪 Port: ${connection.connection.port}`);

    // 연결 이벤트 리스너 설정
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB connection disconnected');
    });

    // 애플리케이션 종료 시 연결 정리
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📊 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return connection;

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 상태 확인
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    collections: Object.keys(mongoose.connection.collections).length
  };
};

/**
 * 데이터베이스 연결 종료
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

/**
 * 데이터베이스 통계 정보
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      database: stats.db,
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      avgObjSize: stats.avgObjSize,
      objects: stats.objects
    };
  } catch (error) {
    logger.error('❌ Failed to get database stats:', error);
    return null;
  }
};

/**
 * 컬렉션별 통계 정보
 */
export const getCollectionStats = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const stats = {};

    for (const collection of collections) {
      const collectionStats = await mongoose.connection.db.collection(collection.name).stats();
      stats[collection.name] = {
        count: collectionStats.count,
        size: collectionStats.size,
        avgObjSize: collectionStats.avgObjSize,
        storageSize: collectionStats.storageSize,
        indexes: collectionStats.nindexes,
        indexSize: collectionStats.totalIndexSize
      };
    }

    return stats;
  } catch (error) {
    logger.error('❌ Failed to get collection stats:', error);
    return {};
  }
};

/**
 * 데이터베이스 성능 모니터링
 */
export const monitorDatabasePerformance = () => {
  const startTime = Date.now();
  
  return {
    getQueryTime: () => Date.now() - startTime,
    getConnectionPool: () => mongoose.connection.pool,
    getActiveConnections: () => mongoose.connection.pool?.active || 0,
    getPendingConnections: () => mongoose.connection.pool?.pending || 0
  };
};

export default {
  connectDatabase,
  getDatabaseStatus,
  disconnectDatabase,
  getDatabaseStats,
  getCollectionStats,
  monitorDatabasePerformance
}; 