# 🧠 백엔드 학습 시스템

백엔드 전용 고유한 학습 시스템으로, API 호출 패턴, 보안 위험, 서버 성능을 실시간으로 분석하고 최적화 제안을 제공합니다.

## 📋 목차

- [시스템 개요](#시스템-개요)
- [주요 기능](#주요-기능)
- [설치 및 초기화](#설치-및-초기화)
- [사용법](#사용법)
- [API 문서](#api-문서)
- [구성 요소](#구성-요소)
- [예제](#예제)

## 🎯 시스템 개요

백엔드 학습 시스템은 다음과 같은 고유한 기능을 제공합니다:

- **API 호출 패턴 학습**: 엔드포인트별 사용 패턴, 성능 패턴, 사용자별 패턴 분석
- **보안 패턴 분석**: SQL 인젝션, XSS, 이상 행동 탐지 및 보안 점수 관리
- **서버 성능 최적화**: CPU, 메모리, 디스크, 네트워크 모니터링 및 최적화 제안
- **실시간 분석**: 메모리 기반 실시간 학습 및 분석
- **자동 정리**: 오래된 데이터 자동 정리 및 메모리 관리

## 🚀 주요 기능

### 1. API 호출 패턴 학습기 (`APICallPatternLearner`)
- 엔드포인트별 사용 통계 (호출 횟수, 성공률, 에러율)
- 사용자별 API 사용 패턴 분석
- 성능 병목 지점 탐지
- 시간대별 사용 패턴 분석
- 파라미터 패턴 분석

### 2. 보안 패턴 분석기 (`SecurityPatternAnalyzer`)
- SQL 인젝션, XSS, 경로 순회 공격 탐지
- 이상 행동 탐지 (과도한 요청, 다양한 엔드포인트 접근)
- IP별 위험 점수 계산
- 사용자별 보안 점수 관리
- 보안 이벤트 로그 및 알림

### 3. 서버 성능 최적화기 (`ServerPerformanceOptimizer`)
- CPU, 메모리, 디스크, 네트워크 실시간 모니터링
- 성능 병목 자동 탐지
- 최적화 제안 생성
- 성능 알림 시스템
- 메모리 누수 탐지

## 📦 설치 및 초기화

### 1. 기본 초기화

```javascript
import { initializeBackendLearning } from './src/learning/index.js';

// 기본 설정으로 초기화
const manager = initializeBackendLearning();
```

### 2. 커스텀 설정으로 초기화

```javascript
const config = {
  learningEnabled: true,
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24시간
  maxLearningData: 10000,
  learningRate: 0.1
};

const manager = initializeBackendLearning(config);
```

### 3. Express.js 미들웨어 적용

```javascript
import express from 'express';
import { createLearningMiddleware } from './src/learning/index.js';

const app = express();

// 학습 미들웨어 적용 (모든 API 요청/응답 자동 학습)
app.use(createLearningMiddleware());
```

## 💡 사용법

### 1. 수동 API 호출 학습

```javascript
import { learnAPICall } from './src/learning/index.js';

// API 호출 학습
learnAPICall(
  'user123',           // 사용자 ID
  '/api/users',        // 엔드포인트
  'GET',               // HTTP 메서드
  { page: 1 },         // 파라미터
  150,                 // 응답 시간 (ms)
  200                  // 상태 코드
);
```

### 2. 보안 이벤트 학습

```javascript
import { learnSecurityEvent } from './src/learning/index.js';

const securityEvent = {
  userId: 'user123',
  ip: '192.168.1.100',
  endpoint: '/api/login',
  method: 'POST',
  userAgent: 'Mozilla/5.0...',
  requestBody: { username: 'admin', password: 'test' },
  responseCode: 401,
  timestamp: Date.now()
};

learnSecurityEvent(securityEvent);
```

### 3. 성능 이벤트 학습

```javascript
import { learnPerformanceEvent } from './src/learning/index.js';

const performanceEvent = {
  type: 'api_performance',
  endpoint: '/api/data',
  method: 'GET',
  responseTime: 2500,
  statusCode: 200,
  timestamp: Date.now()
};

learnPerformanceEvent(performanceEvent);
```

### 4. 분석 결과 조회

```javascript
import { getAnalysis, getUserAnalysis, getEndpointAnalysis } from './src/learning/index.js';

// 종합 분석 결과
const analysis = getAnalysis();
console.log('시스템 건강도:', analysis.systemHealth);

// 사용자별 분석
const userAnalysis = getUserAnalysis('user123');
console.log('사용자 위험도:', userAnalysis.riskLevel);

// 엔드포인트별 분석
const endpointAnalysis = getEndpointAnalysis('/api/users', 'GET');
console.log('엔드포인트 건강도:', endpointAnalysis.healthScore);
```

## 📚 API 문서

### 학습 시스템 관리

#### `POST /api/learning/initialize`
학습 시스템 초기화

**요청 본문:**
```json
{
  "config": {
    "learningEnabled": true,
    "autoCleanup": true,
    "cleanupInterval": 86400000
  }
}
```

#### `GET /api/learning/status`
시스템 상태 확인

**응답:**
```json
{
  "success": true,
  "status": "running",
  "message": "백엔드 학습 시스템이 정상적으로 실행 중입니다.",
  "stats": {
    "uptime": "2시간 30분",
    "totalEvents": 1250,
    "eventsPerHour": "500.00",
    "lastCleanup": "2024-01-15 10:30:00"
  }
}
```

### 분석 결과 조회

#### `GET /api/learning/analysis`
종합 분석 결과 조회

**응답:**
```json
{
  "success": true,
  "analysis": {
    "learningStats": { ... },
    "apiAnalysis": { ... },
    "securityAnalysis": { ... },
    "performanceAnalysis": { ... },
    "systemHealth": {
      "overall": "good",
      "api": "excellent",
      "security": "good",
      "performance": "fair",
      "scores": {
        "overall": "75.50",
        "api": "85.20",
        "security": "78.30",
        "performance": "63.00"
      }
    },
    "recommendations": [
      {
        "type": "performance_optimization",
        "priority": "high",
        "title": "API 성능 최적화",
        "description": "평균 응답 시간이 2.5초로 높습니다.",
        "action": "캐싱 도입 및 데이터베이스 쿼리 최적화"
      }
    ]
  }
}
```

#### `GET /api/learning/user/:userId`
사용자별 분석 조회

#### `GET /api/learning/endpoint?endpoint=/api/users&method=GET`
엔드포인트별 분석 조회

### 패턴 분석

#### `GET /api/learning/patterns/api`
API 패턴 분석 조회

#### `GET /api/learning/patterns/security`
보안 패턴 분석 조회

#### `GET /api/learning/patterns/performance`
성능 패턴 분석 조회

### 시스템 관리

#### `GET /api/learning/health`
시스템 건강도 조회

#### `GET /api/learning/recommendations`
권장사항 조회

#### `GET /api/learning/export`
학습 데이터 내보내기

#### `POST /api/learning/reset`
학습 데이터 초기화

#### `PUT /api/learning/config`
설정 업데이트

#### `POST /api/learning/shutdown`
학습 시스템 종료

## 🏗️ 구성 요소

### 1. BackendLearningManager
- 모든 학습 컴포넌트를 통합 관리
- 학습 통계 및 설정 관리
- 종합 분석 결과 생성

### 2. APICallPatternLearner
- API 호출 패턴 학습
- 엔드포인트별 통계 분석
- 사용자별 패턴 분석

### 3. SecurityPatternAnalyzer
- 보안 위험 패턴 탐지
- 이상 행동 분석
- 보안 점수 관리

### 4. ServerPerformanceOptimizer
- 서버 리소스 모니터링
- 성능 병목 탐지
- 최적화 제안 생성

## 📝 예제

### Express.js 서버에 통합

```javascript
import express from 'express';
import { 
  initializeBackendLearning, 
  createLearningMiddleware 
} from './src/learning/index.js';
import learningRoutes from './src/routes/learning.js';

const app = express();

// 학습 시스템 초기화
initializeBackendLearning({
  learningEnabled: true,
  autoCleanup: true
});

// 미들웨어 적용
app.use(express.json());
app.use(createLearningMiddleware());

// 학습 API 라우트
app.use('/api/learning', learningRoutes);

// 기존 API 라우트들
app.get('/api/users', (req, res) => {
  // API 로직...
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});
```

### 수동 학습 예제

```javascript
import { 
  learnAPICall, 
  getAnalysis, 
  getUserAnalysis 
} from './src/learning/index.js';

// API 호출 시뮬레이션
const simulateAPICalls = () => {
  // 정상 API 호출
  learnAPICall('user1', '/api/users', 'GET', { page: 1 }, 120, 200);
  learnAPICall('user1', '/api/users', 'GET', { page: 2 }, 150, 200);
  
  // 느린 API 호출
  learnAPICall('user2', '/api/data', 'POST', { data: 'large' }, 3500, 200);
  
  // 에러 API 호출
  learnAPICall('user3', '/api/invalid', 'GET', {}, 50, 404);
};

// 분석 결과 확인
const checkAnalysis = () => {
  const analysis = getAnalysis();
  console.log('시스템 건강도:', analysis.systemHealth);
  console.log('권장사항:', analysis.recommendations);
  
  const userAnalysis = getUserAnalysis('user1');
  console.log('사용자 분석:', userAnalysis);
};

// 실행
simulateAPICalls();
setTimeout(checkAnalysis, 1000);
```

## 🔧 설정 옵션

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `learningEnabled` | `true` | 학습 시스템 활성화 여부 |
| `autoCleanup` | `true` | 자동 정리 활성화 여부 |
| `cleanupInterval` | `86400000` | 정리 간격 (24시간) |
| `maxLearningData` | `10000` | 최대 학습 데이터 수 |
| `learningRate` | `0.1` | 학습률 |

## ⚠️ 주의사항

1. **메모리 사용량**: 학습 데이터는 메모리에 저장되므로 대용량 데이터 처리 시 메모리 사용량을 모니터링하세요.
2. **성능 영향**: 미들웨어 사용 시 약간의 성능 오버헤드가 있을 수 있습니다.
3. **데이터 지속성**: 메모리 기반이므로 서버 재시작 시 데이터가 초기화됩니다.
4. **보안**: 민감한 데이터가 학습에 포함될 수 있으므로 적절한 필터링을 적용하세요.

## 🤝 기여

백엔드 학습 시스템은 지속적으로 개선되고 있습니다. 버그 리포트, 기능 제안, 코드 기여를 환영합니다.

---

**백엔드 학습 시스템** - 더 스마트한 백엔드 운영을 위한 AI 기반 학습 시스템 🧠 