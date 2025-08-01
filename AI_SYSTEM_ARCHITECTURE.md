# AI 시스템 아키텍처 & 워크플로우 가이드

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [전체 워크플로우 흐름](#전체-워크플로우-흐름)
3. [아키텍처 구성 요소](#아키텍처-구성-요소)
4. [서비스 확장 가이드](#서비스-확장-가이드)
5. [문제 해결 사례](#문제-해결-사례)
6. [개발 가이드라인](#개발-가이드라인)

---

## 🏗️ 시스템 개요

### 핵심 설계 원칙
- **계층화된 아키텍처**: 사용자 요청부터 백엔드까지 명확한 계층 분리
- **표준화된 인터페이스**: 모든 서비스가 동일한 패턴 따름
- **MCP 통합**: 백엔드와의 일관된 통신 방식
- **구독 기반 접근 제어**: 사용자별 권한 관리

### 기술 스택
- **프론트엔드**: React/Electron
- **백엔드**: Node.js + Express
- **AI**: Claude API + Anthropic
- **통신**: MCP (Model Context Protocol)
- **파일 시스템**: Node.js fs 모듈

---

## 🔄 전체 워크플로우 흐름

### 1️⃣ 사용자 요청 시작
```
사용자: "바탕화면에 뭐있어?"
```

### 2️⃣ 프론트엔드 처리
```
🌐 프론트엔드 (웹/앱)
├── 사용자 입력 감지
├── API 요청 준비
└── POST /api/ai/chat-direct 호출
```

### 3️⃣ 백엔드 API 엔드포인트
```
🖥️ 백엔드 서버 (포트 5000)
├── POST /api/ai/chat-direct 수신
├── 요청 파싱 (message, provider, conversationHistory)
└── AIOrchestrator 호출
```

### 4️⃣ AIOrchestrator 처리
```
🧠 AIOrchestrator
├── 사용자 메시지 분석
├── Tool 사용 필요성 판단
├── filesystem Tool 선택
└── ToolOrchestrator.executeToolRequest() 호출
```

### 5️⃣ ToolOrchestrator 실행
```
🔧 ToolOrchestrator
├── 구독 체크 (개발 모드에서는 우회)
├── ServiceRegistry에서 filesystem 서비스 조회
├── FileSystemService.smartListFiles() 호출
└── 결과 수집
```

### 6️⃣ FileSystemService 처리
```
📁 FileSystemService
├── PathResolver로 경로 해석 ("바탕화면" → "C:\Users\hki\Desktop")
├── FileOperations.listFiles() 호출
└── 결과 포맷팅 및 반환
```

### 7️⃣ FileOperations 처리
```
⚙️ FileOperations
├── MCP 연결 상태 확인
├── MCP 연결됨 → listFilesViaMCP() 호출
├── MCP 연결 안됨 → listFilesViaAPI() 호출 (fallback)
└── 결과 반환
```

### 8️⃣ MCP 서버 처리
```
🔗 MCP 서버 (포트 5050)
├── listFiles 요청 수신
├── 백엔드 API 호출: GET /api/files?path=C:\Users\hki\Desktop
└── 파일 목록 반환
```

### 9️⃣ 백엔드 파일 시스템
```
💾 백엔드 FileSystem
├── 경로 매핑 및 해석
├── fs.readdir()로 디렉토리 읽기
├── fs.stat()로 파일 정보 수집
└── 27개 파일 정보 반환
```

### 🔄 응답 역순 처리

### 10️⃣ MCP → FileOperations
```
🔗 MCP 서버
└── 27개 파일 배열 반환
    ↓
⚙️ FileOperations.listFilesViaMCP()
├── Array.isArray(result) 체크 ✅
├── 배열 직접 반환
└── 27개 파일 전달
```

### 11️⃣ FileOperations → FileSystemService
```
📁 FileSystemService.smartListFiles()
├── 파일 배열 수신
├── applySmartFiltering() 적용
├── FormatHelper로 포맷팅
└── 구조화된 결과 반환
```

### 12️⃣ ToolOrchestrator → AIOrchestrator
```
🔧 ToolOrchestrator
├── Tool 실행 결과 수집
├── 성공/실패 상태 확인
└── 결과를 AIOrchestrator에 전달
```

### 13️⃣ AIOrchestrator → 백엔드 API
```
🧠 AIOrchestrator
├── Tool 결과 분석
├── Claude API에 Tool 결과와 함께 전달
└── 최종 응답 생성
```

### 14️⃣ 백엔드 → 프론트엔드
```
🖥️ 백엔드 서버
├── Claude API 응답 수신
├── JSON 응답 구성
└── 프론트엔드에 전송
```

### 15️⃣ 프론트엔드 → 사용자
```
🌐 프론트엔드
├── API 응답 수신
├── UI 업데이트
└── 사용자에게 파일 목록 표시
```

---

## 🧩 아키텍처 구성 요소

### 핵심 컴포넌트

#### 1️⃣ AIOrchestrator
- **역할**: 전체 AI 워크플로우 조율
- **위치**: `ai/core/AIOrchestrator.js`
- **주요 기능**:
  - 사용자 메시지 분석
  - Tool 선택 및 실행
  - Claude API 통신

#### 2️⃣ ToolOrchestrator
- **역할**: Tool 실행 관리
- **위치**: `ai/core/ToolOrchestrator.js`
- **주요 기능**:
  - 구독 체크
  - 서비스 실행
  - 결과 수집

#### 3️⃣ ServiceRegistry
- **역할**: 서비스 등록/관리
- **위치**: `ai/core/ServiceRegistry.js`
- **주요 기능**:
  - 서비스 등록
  - 구독 상태 관리
  - 서비스 조회

#### 4️⃣ FileSystemService
- **역할**: 파일 시스템 로직
- **위치**: `ai/services/filesystem/FileSystemService.js`
- **주요 기능**:
  - 경로 해석
  - 파일 작업 수행
  - 결과 포맷팅

#### 5️⃣ FileOperations
- **역할**: 실제 파일 작업 수행
- **위치**: `ai/services/filesystem/FileOperations.js`
- **주요 기능**:
  - MCP 통신
  - HTTP API fallback
  - 파일 시스템 접근

#### 6️⃣ MCP 서버
- **역할**: 백엔드와의 통신 중계
- **위치**: `packages/mcp-server/src/index.js`
- **주요 기능**:
  - 백엔드 API 호출
  - 응답 변환
  - 에러 처리

#### 7️⃣ 백엔드 FileSystem
- **역할**: 실제 파일 시스템 접근
- **위치**: `backend/src/tools/fileSystem.js`
- **주요 기능**:
  - 파일 시스템 읽기/쓰기
  - 경로 매핑
  - 파일 정보 수집

### 표준 인터페이스

```javascript
// 모든 서비스가 구현해야 하는 인터페이스
class BaseService {
  // 필수 메서드
  async execute(args, context) { ... }
  getToolMetadata() { ... }
  checkSubscriptionAccess() { ... }
  
  // 선택적 메서드
  async initialize() { ... }
  async cleanup() { ... }
}
```

---

## 🚀 서비스 확장 가이드

### 현재 서비스 목록
- **filesystem**: 파일 시스템 관리
- **messenger**: 메시징 서비스
- **contacts**: 연락처 관리
- **calendar**: 캘린더 관리
- **notes**: 노트 관리
- **tasks**: 작업 관리

### 새 서비스 추가 시 체크리스트

#### 1️⃣ ServiceRegistry 등록
```javascript
// ai/core/ServiceRegistry.js
const services = [
  new FileSystemService(mcpConnector),
  new MessengerService(mcpConnector),
  new CalendarService(mcpConnector),
  new NewService(mcpConnector)  // 새 서비스 추가
];
```

#### 2️⃣ 표준 인터페이스 구현
```javascript
class NewService {
  constructor(mcpConnector) {
    this.mcpConnector = mcpConnector;
    this.name = 'newservice';
    this.description = '새 서비스 설명';
    this.category = 'category_name';
    this.available = true;
    this.version = '1.0.0';
  }

  // 필수 메서드들
  async execute(args, context) { ... }
  getToolMetadata() { ... }
  checkSubscriptionAccess() { ... }
  
  // 선택적 메서드들
  async initialize() { ... }
  async cleanup() { ... }
}
```

#### 3️⃣ MCP 통합
```javascript
// MCP 서버에서 새 API 엔드포인트 추가
app.get('/api/new-service', async (req, res) => {
  // 백엔드 로직
});
```

#### 4️⃣ 구독 시스템 연동
```javascript
// 구독 기능 정의
this.subscription_features = {
  free: { 
    allowed_actions: ['basic_action'],
    daily_limit: 10 
  },
  premium: { 
    allowed_actions: ['*'],
    daily_limit: -1 
  }
};
```

### 예상되는 미래 서비스들
- **이메일 서비스** (Gmail, Outlook 연동)
- **클라우드 스토리지** (Google Drive, Dropbox)
- **소셜 미디어** (Twitter, LinkedIn)
- **프로젝트 관리** (Jira, Trello)
- **데이터베이스** (MySQL, MongoDB)

### 확장성 보장 사항

#### ✅ 잘 설계된 부분들
1. **계층화된 아키텍처**: 새 서비스 추가 시 기존 코드 수정 불필요
2. **표준화된 인터페이스**: 모든 서비스가 동일한 구조
3. **MCP 통합**: 일관된 통신 방식
4. **구독 시스템**: 사용자별 권한 관리

#### ⚠️ 주의해야 할 부분들
1. **응답 구조 일관성**: 모든 서비스가 동일한 응답 형식 사용
2. **에러 처리 표준화**: 통일된 에러 형식
3. **성능 최적화**: 캐싱, 병렬 처리 전략

---

## 🔧 문제 해결 사례

### 파일시스템 서비스 문제 해결

#### 문제 상황
- **백엔드**: 27개 파일을 정상적으로 반환 ✅
- **AI 서비스**: "폴더가 비어있다"고 잘못 응답 ❌

#### 원인 분석
```javascript
// 기존 코드 (문제가 있던 부분)
if (result && result.content && result.content[0]) {
  // result.content가 있을 때만 처리
} else {
  return []; // 빈 배열 반환
}
```

**문제점**:
1. MCP에서 받은 결과: `[파일1, 파일2, 파일3, ...]` (27개 파일 배열)
2. 조건문 체크: `result.content`가 없음 → `false`
3. 결과: 빈 배열 `[]` 반환

#### 해결 방법
```javascript
// 수정된 코드
if (Array.isArray(result)) {
  return result; // 배열이면 바로 반환
} else if (result && result.content && result.content[0]) {
  // 기존 로직 (fallback)
}
```

#### 핵심 교훈
- **응답 구조 가정하지 말기**: 실제 응답 구조를 먼저 확인
- **방어적 프로그래밍**: 다양한 응답 형태에 대비
- **디버깅 로그 활용**: 문제 추적을 위한 상세한 로그

---

## 📋 개발 가이드라인

### 코드 작성 원칙

#### 1️⃣ 응답 구조 표준화
```javascript
// ✅ 좋은 예 - 모든 서비스가 동일한 구조
{
  success: true,
  action: 'some_action',
  data: [...],
  count: 5,
  performance: {
    executionTime: '123.45ms',
    cached: false,
    optimized: true
  }
}

// ❌ 나쁜 예 - 서비스마다 다른 구조
{
  files: [...],      // filesystem만
  messages: [...],   // messenger만
  events: [...]      // calendar만
}
```

#### 2️⃣ 에러 처리 표준화
```javascript
// 모든 서비스가 동일한 에러 형식 사용
{
  success: false,
  error: '사용자 친화적 메시지',
  technical_error: '상세한 기술적 에러',
  suggestions: ['해결 방법 1', '해결 방법 2'],
  error_code: 'ERROR_CODE'
}
```

#### 3️⃣ 성능 최적화
```javascript
// 캐싱 전략
const cacheKey = `operation_${JSON.stringify(args)}`;
const cached = this.cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < 300000) {
  return cached.result;
}

// 병렬 처리
const promises = operations.map(op => this.executeOperation(op));
const results = await Promise.all(promises);
```

### 테스트 코드 작성
```javascript
// 각 서비스별 테스트
describe('NewService', () => {
  test('should handle basic operations', async () => {
    const result = await service.execute({ action: 'test' });
    expect(result.success).toBe(true);
  });

  test('should respect subscription limits', async () => {
    // 구독 제한 테스트
  });

  test('should handle errors gracefully', async () => {
    // 에러 처리 테스트
  });
});
```

### 문서화
- **API 문서**: 자동 생성
- **사용법 가이드**: 각 서비스별 상세 설명
- **트러블슈팅 가이드**: 일반적인 문제 해결 방법

### 모니터링 및 로깅
```javascript
// 성능 모니터링
const startTime = performance.now();
const result = await this.executeOperation(args);
const executionTime = performance.now() - startTime;

// 로깅
console.log(`🔍 [DEBUG] Operation completed in ${executionTime.toFixed(2)}ms`);
```

---

## 🎯 결론

### 현재 구조의 장점
1. **확장성**: 새 서비스 추가가 용이
2. **유지보수성**: 명확한 계층 분리
3. **안정성**: 표준화된 인터페이스
4. **성능**: 최적화된 워크플로우

### 앞으로의 방향
1. **구조 유지**: 현재의 계층화된 아키텍처 그대로 유지
2. **표준 준수**: 모든 새 서비스가 기존 패턴 따르기
3. **품질 보장**: 테스트 코드와 문서화 철저히
4. **성능 최적화**: 지속적인 모니터링과 개선

**이 구조를 잘 지키면, 서비스가 10개, 20개 늘어나도 안정적으로 운영할 수 있습니다!** 🚀

---

*마지막 업데이트: 2025-07-05*
*버전: 1.0.0* 