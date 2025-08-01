/**
 * 노트 서비스 설정
 * 메인 백엔드에 통합된 노트 서비스 설정
 * 
 * @author Your Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

/**
 * MongoDB 연결 함수 (노트 서비스용)
 */
export const connectNotesDB = async () => {
  try {
    if (isConnected) {
      logger.info('노트 서비스 MongoDB 이미 연결되어 있습니다');
      return true;
    }

    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/web_mcp_server';

    console.log('MongoDB 연결 URI:', mongoURI);

    // 최신 MongoDB 버전에 맞는 옵션으로 수정
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,  // 2초 → 5초로 증가
      socketTimeoutMS: 30000,          // 30초 유지
      connectTimeoutMS: 5000,          // 2초 → 5초로 증가
      bufferCommands: true,
      // buffermaxentries 옵션 제거 (최신 버전에서 지원되지 않음)
    };

    await mongoose.connect(mongoURI, options);
    
    isConnected = true;
    logger.info(`✅ 노트 서비스 MongoDB 연결 성공: ${mongoURI.split('@')[1] || mongoURI}`);
    
    // 연결 이벤트 리스너 설정 (연결 성공 후에만)
    mongoose.connection.on('error', (error) => {
      logger.error('노트 서비스 MongoDB 연결 에러:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('노트 서비스 MongoDB 연결이 끊어졌습니다');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('노트 서비스 MongoDB 재연결 성공');
      isConnected = true;
    });
    
    return true;

  } catch (error) {
    logger.error('❌ 노트 서비스 MongoDB 연결 실패:', error);
    console.log('⚠️ 개발 모드: MongoDB 연결 없이 서버가 계속 실행됩니다.');
    console.log('⚠️ 목업 데이터를 사용하여 노트 기능이 작동합니다.');
    // 개발 모드에서는 연결 실패를 무시하고 계속 진행
    isConnected = false;  // 명시적으로 연결 상태를 false로 설정
    return false;
  }
};

/**
 * 노트 서비스 연결 상태 확인
 */
export const getNotesConnectionStatus = () => {
  return {
    isConnected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

export default mongoose; 