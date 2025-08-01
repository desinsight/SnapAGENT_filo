// MongoDB 연결 모듈
// 환경변수(MONGO_URI) 기반 연결, 확장성 고려

const mongoose = require('mongoose');

/**
 * MongoDB 연결 함수
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB 연결 성공');
  } catch (err) {
    console.error('MongoDB 연결 실패:', err);
    throw err;
  }
}

module.exports = connectDB; 