import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// 테스트 타임아웃 설정
jest.setTimeout(30000);

// 전역 테스트 설정
beforeAll(async () => {
  console.log('🧪 테스트 환경 초기화 시작...');
  
  // MongoDB 연결
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    console.log('✅ MongoDB 테스트 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 테스트 데이터베이스 연결 실패:', error);
    throw error;
  }

  // 외부 API 모킹 설정
  if (process.env.MOCK_EXTERNAL_APIS === 'true') {
    setupExternalAPIMocks();
  }

  // 로깅 레벨 설정
  process.env.LOG_LEVEL = 'error';
  
  console.log('✅ 테스트 환경 초기화 완료');
});

// 각 테스트 전 실행
beforeEach(async () => {
  // 데이터베이스 정리
  await clearTestDatabase();
  
  // 모킹 초기화
  jest.clearAllMocks();
  
  // 테스트 데이터 초기화
  await initializeTestData();
});

// 각 테스트 후 실행
afterEach(async () => {
  // 테스트 데이터 정리
  await cleanupTestData();
});

// 모든 테스트 완료 후 실행
afterAll(async () => {
  console.log('🧹 테스트 환경 정리 시작...');
  
  // MongoDB 연결 종료
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB 연결 종료');
  } catch (error) {
    console.error('❌ MongoDB 연결 종료 실패:', error);
  }

  // 임시 파일 정리
  await cleanupTempFiles();
  
  console.log('✅ 테스트 환경 정리 완료');
});

/**
 * 외부 API 모킹 설정
 */
function setupExternalAPIMocks() {
  // OpenAI API 모킹
  jest.mock('axios', () => ({
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    default: {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }
  }));

  // 파일 시스템 모킹
  jest.mock('fs', () => ({
    existsSync: jest.fn(),
    createReadStream: jest.fn(),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn()
  }));

  // FormData 모킹
  jest.mock('form-data', () => {
    return jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      getHeaders: jest.fn(() => ({})),
      pipe: jest.fn()
    }));
  });

  // 암호화 모킹
  jest.mock('crypto', () => ({
    createHmac: jest.fn(() => ({
      update: jest.fn(() => ({
        digest: jest.fn(() => 'mock-hash')
      }))
    }))
  }));

  console.log('✅ 외부 API 모킹 설정 완료');
}

/**
 * 테스트 데이터베이스 정리
 */
async function clearTestDatabase() {
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    
    console.log('✅ 테스트 데이터베이스 정리 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 정리 실패:', error);
  }
}

/**
 * 테스트 데이터 초기화
 */
async function initializeTestData() {
  try {
    // 기본 테스트 사용자 생성
    const User = mongoose.model('User');
    const testUser = new User({
      email: 'test@example.com',
      password: 'testpassword',
      name: '테스트 사용자',
      role: 'admin',
      organizationId: 'test-org-123',
      isActive: true
    });
    await testUser.save();

    // 기본 테스트 조직 생성
    const Organization = mongoose.model('Organization');
    const testOrg = new Organization({
      name: '테스트 조직',
      businessNumber: '123-45-67890',
      address: '서울시 강남구 테스트로 123',
      representativeName: '테스트 대표',
      organizationId: 'test-org-123'
    });
    await testOrg.save();

    console.log('✅ 테스트 데이터 초기화 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터 초기화 실패:', error);
  }
}

/**
 * 테스트 데이터 정리
 */
async function cleanupTestData() {
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    
    console.log('✅ 테스트 데이터 정리 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터 정리 실패:', error);
  }
}

/**
 * 임시 파일 정리
 */
async function cleanupTempFiles() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const tempDir = process.env.TEST_TEMP_DIR || './temp/test';
    
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
        } else if (stats.isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        }
      }
      
      console.log('✅ 임시 파일 정리 완료');
    }
  } catch (error) {
    console.error('❌ 임시 파일 정리 실패:', error);
  }
}

/**
 * 테스트 헬퍼 함수들
 */

// 테스트 사용자 생성
export async function createTestUser(userData = {}) {
  const User = mongoose.model('User');
  const defaultData = {
    email: 'test@example.com',
    password: 'testpassword',
    name: '테스트 사용자',
    role: 'user',
    organizationId: 'test-org-123',
    isActive: true
  };
  
  const user = new User({ ...defaultData, ...userData });
  return await user.save();
}

// 테스트 조직 생성
export async function createTestOrganization(orgData = {}) {
  const Organization = mongoose.model('Organization');
  const defaultData = {
    name: '테스트 조직',
    businessNumber: '123-45-67890',
    address: '서울시 강남구 테스트로 123',
    representativeName: '테스트 대표',
    organizationId: 'test-org-123'
  };
  
  const org = new Organization({ ...defaultData, ...orgData });
  return await org.save();
}

// 테스트 계정 생성
export async function createTestAccount(accountData = {}) {
  const Account = mongoose.model('Account');
  const defaultData = {
    name: '테스트 계정',
    type: 'asset',
    code: '1000',
    description: '테스트 계정입니다.',
    organizationId: 'test-org-123',
    isActive: true
  };
  
  const account = new Account({ ...defaultData, ...accountData });
  return await account.save();
}

// 테스트 거래 생성
export async function createTestTransaction(transactionData = {}) {
  const Transaction = mongoose.model('Transaction');
  const defaultData = {
    date: new Date(),
    description: '테스트 거래',
    amount: 10000,
    type: 'income',
    accountId: 'test-account-123',
    organizationId: 'test-org-123',
    createdBy: 'test-user-123'
  };
  
  const transaction = new Transaction({ ...defaultData, ...transactionData });
  return await transaction.save();
}

// 테스트 세무 신고서 생성
export async function createTestTaxReturn(taxReturnData = {}) {
  const TaxReturn = mongoose.model('TaxReturn');
  const defaultData = {
    type: 'vat',
    period: '2024-01',
    year: 2024,
    organizationId: 'test-org-123',
    status: 'draft',
    createdBy: 'test-user-123'
  };
  
  const taxReturn = new TaxReturn({ ...defaultData, ...taxReturnData });
  return await taxReturn.save();
}

// 테스트 영수증 생성
export async function createTestReceipt(receiptData = {}) {
  const Receipt = mongoose.model('Receipt');
  const defaultData = {
    date: new Date(),
    amount: 10000,
    businessName: '테스트 상점',
    businessNumber: '123-45-67890',
    category: 'office_supplies',
    organizationId: 'test-org-123',
    uploadedBy: 'test-user-123'
  };
  
  const receipt = new Receipt({ ...defaultData, ...receiptData });
  return await receipt.save();
}

// JWT 토큰 생성
export function generateTestToken(userId = 'test-user-123') {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// 테스트 요청 객체 생성
export function createTestRequest(data = {}) {
  return {
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    headers: data.headers || {},
    user: data.user || { id: 'test-user-123', role: 'admin' },
    method: data.method || 'GET',
    url: data.url || '/test',
    ip: data.ip || '127.0.0.1',
    get: jest.fn((name) => data.headers[name] || ''),
    ...data
  };
}

// 테스트 응답 객체 생성
export function createTestResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    get: jest.fn()
  };
  
  return res;
}

// 테스트 다음 함수 생성
export function createTestNext() {
  return jest.fn();
}

// API 응답 모킹
export function mockApiResponse(data, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  };
}

// API 에러 모킹
export function mockApiError(message, status = 500) {
  const error = new Error(message);
  error.response = {
    status,
    data: { message }
  };
  return error;
}

console.log('🧪 테스트 설정 파일이 로드되었습니다.'); 