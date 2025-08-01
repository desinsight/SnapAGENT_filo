// MongoDB(Mongoose) 연결 설정 - 프로덕션 레벨
const mongoose = require('mongoose');

// 환경별 설정
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_NAME = process.env.DB_NAME || 'calendar_service';
const MONGO_URI = process.env.MONGO_URI || `mongodb://localhost:27017/${DB_NAME}`;

// 연결 옵션 - 프로덕션 레벨
const connectionOptions = {
  // 연결 풀 설정
  maxPoolSize: 10,
  minPoolSize: 2,
  
  // 타임아웃 설정
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // 재연결 설정
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  
  // 쓰기 설정
  w: 'majority',
  wtimeout: 10000,
  
  // 읽기 설정
  readPreference: 'primary',
  
  // 보안 설정
  ssl: NODE_ENV === 'production',
  sslValidate: NODE_ENV === 'production',
  
  // 기타 설정
  bufferCommands: false,
  bufferMaxEntries: 0
};

let isConnected = false;
let connectionPromise = null;

function connectDB() {
  // 이미 연결 중이면 기존 프로미스 반환
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    console.log(`🔄 MongoDB 연결 시도: ${MONGO_URI}`);
    
    mongoose.connect(MONGO_URI, connectionOptions);

    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('✅ MongoDB 연결 성공');
      console.log(`📊 연결 정보: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      resolve(mongoose.connection);
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('❌ MongoDB 연결 오류:', err);
      reject(err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('⚠️ MongoDB 연결 해제됨');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('🔄 MongoDB 재연결 성공');
    });

    // 프로세스 종료 시 정리
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB 연결 종료');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB 연결 종료');
      process.exit(0);
    });
  });

  return connectionPromise;
}

// 연결 상태 확인
function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// 연결 해제
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    connectionPromise = null;
    console.log('🛑 MongoDB 연결 해제 완료');
  }
}

// 헬스체크
async function healthCheck() {
  try {
    if (!isDBConnected()) {
      return { status: 'disconnected', message: 'DB 연결 없음' };
    }
    
    // 간단한 쿼리로 연결 상태 확인
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', message: 'DB 연결 정상' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
  healthCheck,
  connection: mongoose.connection
}; 