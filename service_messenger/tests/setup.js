/**
 * Jest 테스트 설정
 */

// 환경변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/service-messenger-test';

// MongoDB 연결
const mongoose = require('mongoose');

beforeAll(async () => {
  // 테스트용 MongoDB 연결
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // 테스트 완료 후 연결 종료
  await mongoose.connection.close();
});

// 각 테스트 후 데이터 정리
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(30000); 