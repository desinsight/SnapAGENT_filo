import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/web_mcp_server';

function connectDB() {
  // MongoDB가 설정되지 않은 경우 연결 시도하지 않음
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.log('ℹ️ MongoDB URI가 설정되지 않아 데이터베이스 연결을 건너뜁니다.');
    console.log('ℹ️ 서버는 정상적으로 실행되지만 일부 기능이 제한될 수 있습니다.');
    return Promise.resolve();
  }

  return mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB 연결 성공');
      return true;
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB 연결 실패 (서버는 계속 실행됩니다):', err.message);
      console.log('ℹ️ 서버는 정상적으로 실행되지만 일부 기능이 제한될 수 있습니다.');
      return false;
    });
}

export default connectDB; 