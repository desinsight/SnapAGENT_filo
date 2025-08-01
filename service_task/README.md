# Task Manager Service

개인 및 조직을 위한 통합 태스크 관리 서비스

## 📋 개요

Task Manager Service는 개인과 조직 모두를 위한 완전한 태스크 관리 솔루션입니다. 할일 관리부터 프로젝트 협업까지 모든 작업을 효율적으로 관리할 수 있습니다.

## ✨ 주요 기능

### 🎯 태스크 관리 (Core)
- **태스크 CRUD**: 생성, 조회, 수정, 삭제
- **태스크 유형**: 할일, 버그, 기능요청, 문서작업, 회의, 설문, 리뷰
- **상태 관리**: 대기중 → 진행중 → 검토중 → 완료 (커스텀 상태 가능)
- **우선순위**: 긴급/높음/보통/낮음
- **마감일 관리**: 날짜 + 시간, 알림 설정
- **반복 태스크**: 매일/주/월/년, 특정 요일 반복
- **하위 태스크**: 체크리스트, 단계별 진행
- **태스크 템플릿**: 자주 사용하는 태스크 패턴 저장

### 👥 조직/팀 관리
- **조직 생성/관리**: 조직 정보, 로고, 설정
- **팀 관리**: 조직 내 팀 생성, 멤버 관리
- **프로젝트 관리**: 팀별 프로젝트, 프로젝트별 태스크 그룹화
- **멤버 역할**: 소유자, 관리자, 편집자, 뷰어
- **권한 시스템**: 태스크 생성/수정/삭제/할당 권한
- **초대 시스템**: 이메일 초대, 링크 공유

### 🏷️ 분류 및 필터링
- **태그/라벨**: 색상별 라벨, 자동 라벨링
- **카테고리**: 업무, 개인, 학습, 건강 등
- **프로젝트별 분류**: 프로젝트별 태스크 그룹화
- **담당자별 분류**: 내가 만든 것, 내가 담당한 것
- **상태별 필터**: 진행중인 것만, 완료된 것만
- **마감일 필터**: 오늘, 이번주, 지연된 것
- **고급 검색**: 제목, 설명, 태그, 담당자 검색

### 💬 협업 기능
- **댓글 시스템**: 태스크별 토론, @멘션
- **파일 첨부**: 문서, 이미지, 링크 첨부
- **활동 로그**: 누가 언제 무엇을 했는지 기록
- **변경 이력**: 태스크 수정 내역 추적
- **실시간 알림**: 댓글, 상태 변경, 할당 알림
- **공유 링크**: 태스크별 공유 링크 생성

### 📊 시각화 및 보기
- **리스트 뷰**: 기본 목록 형태
- **칸반 보드**: 드래그 앤 드롭으로 상태 변경
- **캘린더 뷰**: 마감일 기준 캘린더 표시
- **간트 차트**: 프로젝트 일정 시각화
- **대시보드**: 진행률, 통계 요약
- **타임라인**: 시간순 활동 기록

### 📈 분석 및 통계
- **개인 통계**: 완료율, 생산성, 지연율
- **팀 통계**: 팀별 진행률, 멤버별 기여도
- **프로젝트 통계**: 프로젝트별 진행상황
- **시간 추적**: 태스크별 소요 시간 기록
- **성과 리포트**: 주간/월간 성과 요약
- **트렌드 분석**: 시간별 완료율 변화

### 🔔 알림 시스템
- **마감일 알림**: 이메일, 푸시 알림
- **할당 알림**: 새로 할당된 태스크 알림
- **댓글 알림**: @멘션, 댓글 알림
- **상태 변경 알림**: 담당 태스크 상태 변경
- **반복 알림**: 반복 태스크 리마인더
- **알림 설정**: 개인별 알림 설정

### 🔄 자동화 및 워크플로우
- **자동 상태 변경**: 마감일 지나면 자동 지연 상태
- **자동 할당**: 규칙에 따른 자동 담당자 지정
- **자동 라벨링**: 키워드 기반 자동 태그
- **워크플로우 템플릿**: 프로젝트별 표준 워크플로우
- **조건부 액션**: 특정 조건 만족시 자동 실행
- **스케줄링**: 정기적 태스크 자동 생성

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.0.0 이상
- MongoDB 4.4 이상
- Redis (선택사항, 캐싱용)

### 설치

1. **저장소 클론**
```bash
git clone <repository-url>
cd service_task
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp env.example .env
```

`.env` 파일을 편집하여 필요한 설정을 입력하세요:

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/task_manager

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@taskmanager.com

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Redis Configuration (for caching and sessions)
REDIS_URL=redis://localhost:6379

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/task-service.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your_session_secret_here
```

4. **데이터베이스 설정**
```bash
# MongoDB 시작
mongod

# 또는 Docker 사용
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **서버 시작**
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 성공적으로 시작되면 다음 URL에서 접근할 수 있습니다:
- API: http://localhost:3003/api
- 헬스 체크: http://localhost:3003/health

## 📚 API 문서

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/forgot-password` - 비밀번호 찾기
- `POST /api/auth/reset-password` - 비밀번호 재설정

### 사용자 API
- `GET /api/users/profile` - 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `GET /api/users/settings` - 설정 조회
- `PUT /api/users/settings` - 설정 수정
- `GET /api/users/statistics` - 사용자 통계

### 태스크 API
- `GET /api/tasks` - 태스크 목록 조회
- `POST /api/tasks` - 태스크 생성
- `GET /api/tasks/:id` - 태스크 상세 조회
- `PUT /api/tasks/:id` - 태스크 수정
- `DELETE /api/tasks/:id` - 태스크 삭제
- `PATCH /api/tasks/:id/status` - 태스크 상태 변경
- `PATCH /api/tasks/:id/assign` - 태스크 할당
- `POST /api/tasks/:id/comments` - 댓글 추가
- `POST /api/tasks/:id/attachments` - 파일 첨부

### 프로젝트 API
- `GET /api/projects` - 프로젝트 목록 조회
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/:id` - 프로젝트 상세 조회
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제
- `POST /api/projects/:id/members` - 멤버 추가
- `DELETE /api/projects/:id/members/:userId` - 멤버 제거

### 조직 API
- `GET /api/organizations` - 조직 목록 조회
- `POST /api/organizations` - 조직 생성
- `GET /api/organizations/:id` - 조직 상세 조회
- `PUT /api/organizations/:id` - 조직 수정
- `DELETE /api/organizations/:id` - 조직 삭제
- `POST /api/organizations/:id/invite` - 멤버 초대
- `POST /api/organizations/:id/accept-invitation` - 초대 수락

### 팀 API
- `GET /api/teams` - 팀 목록 조회
- `POST /api/teams` - 팀 생성
- `GET /api/teams/:id` - 팀 상세 조회
- `PUT /api/teams/:id` - 팀 수정
- `DELETE /api/teams/:id` - 팀 삭제
- `POST /api/teams/:id/members` - 멤버 추가
- `DELETE /api/teams/:id/members/:userId` - 멤버 제거

### 분석 API
- `GET /api/analytics/dashboard` - 대시보드 통계
- `GET /api/analytics/tasks` - 태스크 분석
- `GET /api/analytics/projects` - 프로젝트 분석
- `GET /api/analytics/teams` - 팀 분석
- `GET /api/analytics/users` - 사용자 분석
- `GET /api/analytics/reports` - 리포트 생성

### 알림 API
- `GET /api/notifications` - 알림 목록 조회
- `PATCH /api/notifications/:id/read` - 알림 읽음 처리
- `DELETE /api/notifications/:id` - 알림 삭제
- `PUT /api/notifications/settings` - 알림 설정 수정

## 🏗️ 프로젝트 구조

```
service_task/
├── src/
│   ├── config/           # 설정 파일
│   │   ├── database.js   # 데이터베이스 설정
│   │   └── logger.js     # 로깅 설정
│   ├── controllers/      # 컨트롤러
│   │   ├── taskController.js
│   │   ├── projectController.js
│   │   ├── organizationController.js
│   │   ├── teamController.js
│   │   ├── userController.js
│   │   ├── authController.js
│   │   ├── analyticsController.js
│   │   └── notificationController.js
│   ├── middleware/       # 미들웨어
│   │   ├── auth.js       # 인증 미들웨어
│   │   ├── validation.js # 유효성 검사
│   │   └── errorHandler.js # 에러 핸들러
│   ├── models/          # 데이터 모델
│   │   ├── Task.js
│   │   ├── Project.js
│   │   ├── Organization.js
│   │   ├── Team.js
│   │   └── User.js
│   ├── routes/          # 라우터
│   │   ├── tasks.js
│   │   ├── projects.js
│   │   ├── organizations.js
│   │   ├── teams.js
│   │   ├── users.js
│   │   ├── auth.js
│   │   ├── analytics.js
│   │   └── notifications.js
│   ├── services/        # 비즈니스 로직
│   │   ├── taskService.js
│   │   ├── projectService.js
│   │   ├── organizationService.js
│   │   ├── teamService.js
│   │   ├── userService.js
│   │   ├── authService.js
│   │   ├── analyticsService.js
│   │   ├── notificationService.js
│   │   ├── emailService.js
│   │   └── fileService.js
│   ├── utils/           # 유틸리티
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── constants.js
│   └── index.js         # 메인 서버 파일
├── uploads/             # 업로드된 파일
├── logs/                # 로그 파일
├── tests/               # 테스트 파일
├── package.json
├── env.example
└── README.md
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 특정 테스트 파일 실행
npm test -- --testNamePattern="Task API"
```

## 📦 배포

### Docker 사용

1. **Docker 이미지 빌드**
```bash
docker build -t task-manager-service .
```

2. **Docker 컨테이너 실행**
```bash
docker run -d -p 3003:3003 --name task-manager task-manager-service
```

### Docker Compose 사용

```yaml
version: '3.8'
services:
  task-manager:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/task_manager
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

## 🔧 개발

### 코드 스타일

이 프로젝트는 ESLint를 사용하여 코드 스타일을 관리합니다.

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix
```

### 새로운 기능 추가

1. **모델 생성**: `src/models/` 디렉토리에 새 모델 추가
2. **서비스 생성**: `src/services/` 디렉토리에 비즈니스 로직 추가
3. **컨트롤러 생성**: `src/controllers/` 디렉토리에 API 로직 추가
4. **라우터 생성**: `src/routes/` 디렉토리에 엔드포인트 추가
5. **테스트 작성**: `tests/` 디렉토리에 테스트 코드 추가

### 환경별 설정

- **개발 환경**: `NODE_ENV=development`
- **테스트 환경**: `NODE_ENV=test`
- **프로덕션 환경**: `NODE_ENV=production`

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면 다음 방법으로 연락해주세요:

- 이슈 생성: [GitHub Issues](https://github.com/your-repo/issues)
- 이메일: support@taskmanager.com
- 문서: [API Documentation](https://docs.taskmanager.com)

## 🔄 업데이트 로그

### v1.0.0 (2024-01-XX)
- 초기 릴리스
- 기본 태스크 관리 기능
- 조직 및 팀 관리
- 사용자 인증 및 권한 관리
- 실시간 알림 시스템
- 분석 및 통계 기능

---

**Task Manager Service** - 효율적인 작업 관리의 시작 