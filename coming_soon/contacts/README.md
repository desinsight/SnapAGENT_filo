# 📞 Contacts Service Backend

## 📋 서비스 개요

AI-First 통합 서비스의 연락처 관리 백엔드 API  
- 개인/비즈니스 연락처 통합 관리
- 프로젝트 연동 및 업계 네트워킹
- Remember.me 스타일의 공개/비공개 모드
- **AI 기능은 별도 ai/ 디렉토리에서 처리**
- **독립적인 백엔드 API (파일시스템과는 나중에 연결)**

## 🏗️ 폴더 구조

```
coming_soon/contacts/
├── README.md                    # 이 파일
├── package.json                 # 의존성 관리
├── src/                         # 소스 코드
│   ├── index.js                 # 서버 진입점
│   ├── config/                  # 설정 관리
│   │   ├── database.js          # DB 설정
│   │   ├── auth.js              # 인증 설정
│   │   └── app.js               # 앱 설정
│   ├── models/                  # 데이터 모델
│   │   ├── Contact.js           # 연락처 모델
│   │   ├── Project.js           # 프로젝트 모델
│   │   ├── Industry.js          # 업계 모델
│   │   ├── Tag.js               # 태그 모델
│   │   └── User.js              # 사용자 모델
│   ├── controllers/             # 비즈니스 로직
│   │   ├── contactController.js # 연락처 CRUD
│   │   ├── projectController.js # 프로젝트 관리
│   │   ├── searchController.js  # 검색 기능
│   │   └── networkController.js # 네트워킹
│   ├── routes/                  # API 라우트
│   │   ├── contacts.js          # 연락처 API
│   │   ├── projects.js          # 프로젝트 API
│   │   ├── search.js            # 검색 API
│   │   └── network.js           # 네트워킹 API
│   ├── middleware/              # 미들웨어
│   │   ├── auth.js              # 인증
│   │   ├── validation.js        # 입력 검증
│   │   ├── rateLimit.js         # 요청 제한
│   │   └── errorHandler.js      # 에러 처리
│   ├── services/                # 비즈니스 서비스
│   │   ├── contactService.js    # 연락처 서비스
│   │   ├── projectService.js    # 프로젝트 서비스
│   │   ├── searchService.js     # 검색 서비스
│   │   └── notificationService.js # 알림 서비스
│   ├── utils/                   # 유틸리티
│   │   ├── database.js          # DB 유틸리티
│   │   ├── validation.js        # 검증 유틸리티
│   │   ├── logger.js            # 로깅
│   │   └── helpers.js           # 헬퍼 함수
│   └── tests/                   # 테스트
│       ├── unit/                # 단위 테스트
│       ├── integration/         # 통합 테스트
│       └── fixtures/            # 테스트 데이터
├── docs/                        # API 문서
│   ├── api.md                   # API 스펙
│   ├── database.md              # DB 스키마
│   └── integration.md           # AI 통합 가이드
└── scripts/                     # 스크립트
    ├── setup.js                 # 초기 설정
    ├── seed.js                  # 샘플 데이터
    └── migrate.js               # DB 마이그레이션
```

## 🎯 핵심 기능 (AI 제외)

### 1. 연락처 관리 (Contact Management)
- **개인/비즈니스 연락처 통합 관리**
- **다중 연락처 정보** (이메일, 전화, SNS, 주소 등)
- **프로필 이미지 및 명함 스캔**
- **태그 및 카테고리 분류**
- **중복 연락처 감지 및 병합**

### 2. 프로젝트 연동 (Project Integration)
- **프로젝트별 연락처 그룹핑**
- **프로젝트 히스토리 및 역할 관리**
- **프로젝트 기반 연락처 검색**
- **프로젝트 완료 후 관계 유지 관리**

### 3. 업계 네트워킹 (Industry Networking)
- **업계별 연락처 분류 및 검색**
- **공개/비공개 모드 설정**
- **업계별 전문가 검색**
- **비즈니스 기회 매칭**

### 4. 검색 및 필터링
- **고급 검색 (이름, 회사, 업계, 태그 등)**
- **지역별 검색**
- **프로젝트 기반 검색**
- **실시간 검색**

## 🔧 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (연락처), Redis (캐시)
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi
- **Testing**: Jest
- **Documentation**: Swagger

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# 또는 아래 내용으로 .env 파일을 직접 생성

# 데이터베이스 설정
npm run setup

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test
```

### 🔧 환경 변수 설정

`.env` 파일을 생성하고 다음 설정을 추가하세요:

```env
# 서버 설정
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/contacts_service
REDIS_URL=redis://localhost:6379

# 인증
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

# 로깅
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# 파일 업로드
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 📝 API 엔드포인트

### 연락처 관리
- `POST /api/contacts` - 연락처 생성
- `GET /api/contacts` - 연락처 목록 조회
- `GET /api/contacts/:id` - 연락처 상세 조회
- `PUT /api/contacts/:id` - 연락처 수정
- `DELETE /api/contacts/:id` - 연락처 삭제
- `POST /api/contacts/:id/duplicate-check` - 중복 확인

### 프로젝트 관리
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects` - 프로젝트 목록
- `GET /api/projects/:id` - 프로젝트 상세
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제
- `POST /api/projects/:id/contacts` - 프로젝트에 연락처 추가

### 검색
- `GET /api/search/contacts` - 연락처 검색
- `GET /api/search/industry` - 업계별 검색
- `GET /api/search/projects` - 프로젝트 기반 검색
- `GET /api/search/advanced` - 고급 검색

### 네트워킹
- `GET /api/network/public` - 공개 연락처 검색
- `POST /api/network/connect` - 연락처 연결 요청
- `GET /api/network/recommendations` - 네트워킹 추천
- `PUT /api/contacts/:id/visibility` - 공개/비공개 설정

## 🔐 보안 및 권한

- **JWT 기반 인증**
- **연락처별 공개/비공개 설정**
- **업계별 접근 권한 관리**
- **API 요청 제한 (Rate Limiting)**
- **데이터 암호화**

## 🤖 AI 통합 준비

### AI 호출 인터페이스
```javascript
// ai/capabilities/contacts/ 에서 호출할 수 있는 표준 인터페이스
class ContactService {
  async create(contactData) { /* ... */ }
  async search(searchParams) { /* ... */ }
  async merge(contactIds) { /* ... */ }
  async generateTags(contactId) { /* ... */ }
  async recommendContacts(userId) { /* ... */ }
}
```

### AI 연동 포인트
- **중복 감지**: AI가 중복 가능성 분석 후 병합 제안
- **태그 생성**: AI가 연락처 정보 기반 자동 태그 생성
- **추천 시스템**: AI가 프로젝트/업계 기반 연락처 추천
- **자연어 검색**: AI가 자연어 쿼리를 구조화된 검색으로 변환

## 📊 데이터베이스 스키마

### Contact (연락처)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // 소유자
  name: String,               // 이름
  company: String,            // 회사
  position: String,           // 직책
  industry: String,           // 업계
  emails: [String],           // 이메일 목록
  phones: [String],           // 전화번호 목록
  addresses: [Object],        // 주소 목록
  socialMedia: Object,        // SNS 정보
  tags: [String],             // 태그
  projects: [ObjectId],       // 관련 프로젝트
  isPublic: Boolean,          // 공개 여부
  profileImage: String,       // 프로필 이미지
  notes: String,              // 메모
  lastContact: Date,          // 마지막 연락일
  createdAt: Date,
  updatedAt: Date
}
```

### Project (프로젝트)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // 소유자
  name: String,               // 프로젝트명
  description: String,        // 설명
  startDate: Date,            // 시작일
  endDate: Date,              // 종료일
  status: String,             // 상태 (active, completed, cancelled)
  contacts: [ObjectId],       // 관련 연락처
  tags: [String],             // 태그
  budget: Number,             // 예산
  location: String,           // 위치
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 확장 가능한 설계

- **모듈화된 구조**로 새로운 기능 쉽게 추가
- **AI 서비스와의 표준 인터페이스** 준비
- **마이크로서비스 준비** 구조
- **실시간 기능** (WebSocket) 준비
- **모바일 API** 최적화

## 🔗 향후 통합 계획

### 1단계: 독립 백엔드 완성 ✅
- ✅ 순수 백엔드 API 구현
- ✅ 데이터베이스 설계 및 구현 (MongoDB + Redis)
- ✅ 기본 CRUD 기능 완성
- ✅ 인증 및 보안 시스템
- ✅ 유효성 검사 및 에러 핸들링
- ✅ 로깅 및 모니터링
- ✅ API 문서화 (Swagger)

### 2단계: 파일시스템 연동 🔄
- MCP 파일시스템과 연동
- 명함 스캔 및 이미지 처리
- 파일 업로드/다운로드 기능

### 3단계: AI 브레인 통합 🧠
- ai/ 디렉토리의 AI 브레인과 연결
- Function Calling 기반 통합
- 지능형 연락처 관리 기능

## 📊 현재 구현 상태

### ✅ 완료된 기능
- **서버 설정**: Express.js 기반 서버, 미들웨어, 보안 설정
- **데이터베이스**: MongoDB 연결, Redis 캐시, 연결 관리
- **인증 시스템**: JWT 기반 인증, 권한 관리, 토큰 갱신
- **연락처 관리**: 완전한 CRUD 작업, 중복 감지, 병합 기능
- **유효성 검사**: Joi 기반 입력 검증, 스키마 정의
- **에러 핸들링**: 통합 에러 처리, 로깅, 통계
- **API 문서**: Swagger 기반 자동 문서 생성
- **로깅**: Winston 기반 로깅, 파일 관리, 통계
- **캐싱**: Redis 기반 캐시 관리, 성능 최적화

### 🔄 준비된 구조 (501 Not Implemented)
- **프로젝트 관리**: 프로젝트 CRUD, 연락처 연동
- **검색 시스템**: 고급 검색, 필터링, 자동완성
- **네트워킹**: 공개 연락처, 연결 요청, 추천 시스템

### 🚧 다음 단계
1. **프로젝트 모델 및 컨트롤러 구현**
2. **검색 엔진 구현 (Elasticsearch 연동)**
3. **네트워킹 기능 구현**
4. **파일시스템 연동 (MCP)**
5. **AI 브레인 통합**

---

**이 설계는 AI-First 통합 서비스의 연락처 백엔드 API를 제공하며,  
나중에 ai/ 디렉토리의 AI 브레인과 완벽하게 통합될 수 있도록 준비됩니다.** 