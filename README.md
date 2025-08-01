# Web MCP Server - 통합 개발 환경

## 📋 프로젝트 개요

Web MCP Server는 파일 관리, AI 기능, 메신저, 캘린더, 노트, 태스크 관리 등을 통합한 데스크톱 애플리케이션입니다.

## 🏗️ 프로젝트 구조

```
Web_MCP_Server-main/
├── ai/                    # AI 엔진 및 서비스
├── apps/
│   ├── electron/         # Electron 데스크톱 앱
│   └── web/             # 웹 버전
├── backend/              # 백엔드 API 서버
├── packages/             # 공유 패키지들
│   ├── mcp-server/      # MCP 서버
│   ├── web-api/         # 웹 API
│   └── web-ui/          # 웹 UI
└── shared/              # 공유 유틸리티
```

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Git**: 최신 버전

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd Web_MCP_Server-main
   ```

2. **의존성 설치**
   ```bash
   # 루트 의존성 설치
   npm install
   
   # Electron 앱 의존성 설치
   cd apps/electron && npm install
   
   # 백엔드 의존성 설치
   cd ../../backend && npm install
   ```

3. **개발 서버 실행**

   **Electron 앱 (macOS 권장)**
   ```bash
   cd apps/electron
   npm run dev
   ```

   **웹 버전**
   ```bash
   cd apps/web
   npm run dev
   ```

   **백엔드 API**
   ```bash
   cd backend
   npm run dev
   ```

## 🛠️ 개발 가이드

### Electron 앱 개발

```bash
cd apps/electron

# 개발 모드
npm run dev

# 빌드
npm run build

# 패키징
npm run pack
```

### 주요 스크립트

- `npm run dev`: 개발 서버 실행 (Vite + Electron)
- `npm run build`: 프로덕션 빌드
- `npm run pack`: 앱 패키징
- `npm run dist`: 배포용 빌드

### 환경 설정

#### macOS 특별 고려사항

1. **파일 권한**: macOS 샌드박스 환경 고려
2. **코드 서명**: 개발자 인증서 필요 (배포 시)
3. **공증**: Apple 공증 필요 (Mac App Store 배포 시)

#### 환경 변수

```bash
# .env 파일 생성
NODE_ENV=development
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Web MCP Server
```

## 📦 빌드 및 배포

### Electron 앱 빌드

```bash
cd apps/electron

# 개발 빌드
npm run build

# 배포 빌드
npm run dist
```

### 플랫폼별 빌드

```bash
# macOS
npm run dist -- --mac

# Windows
npm run dist -- --win

# Linux
npm run dist -- --linux
```

## 🔧 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   - Vite 서버: 5174
   - 백엔드 API: 5000
   - 포트가 사용 중이면 다른 포트로 변경

2. **의존성 문제**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Electron 빌드 실패**
   ```bash
   # 캐시 클리어
   npm run clean
   npm install
   ```

### macOS 특정 문제

1. **file-icon 모듈 오류**
   - macOS 전용 모듈이므로 주석 처리됨
   - 대안: Electron 내장 아이콘 API 사용

2. **권한 문제**
   ```bash
   # 파일 권한 확인
   ls -la
   chmod +x scripts/*
   ```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 특정 테스트
npm run test:unit
npm run test:integration
```

## 📚 API 문서

### 주요 API 엔드포인트

- `GET /api/files`: 파일 목록 조회
- `POST /api/files/upload`: 파일 업로드
- `GET /api/ai/chat`: AI 채팅
- `GET /api/notes`: 노트 목록

## 🤝 기여 가이드

1. Fork 저장소
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. [Issues](https://github.com/your-repo/issues) 페이지
2. [Wiki](https://github.com/your-repo/wiki) 문서
3. 개발팀에 문의

---

**버전**: 1.0.0  
**최종 업데이트**: 2025년 1월
