# 📁 Web MCP Server - 폴더 구조 가이드 (실제 구현 기반)

> **이 문서는 현재 실제 구현된 프로젝트 구조를 기반으로 작성되었습니다.**
> 
> AI가 모든 서비스에 접근하여 사용자 요청에 따라 다양한 서비스를 동시에 넘나들며 작업하는 통합 플랫폼입니다.

---

## 🏠 최상위 폴더 구조

```
Web_MCP_Server/
├── ai/                    # 🧠 AI 엔진 (실제 구현됨)
├── apps/                  # 🚀 프론트엔드 애플리케이션들
├── backend/               # 🔧 백엔드 서버
├── packages/              # 📦 패키지화된 서비스들
├── shared/                # 🤝 공통 유틸리티
├── docker/                # 🐳 배포 설정
├── data/                  # 📊 데이터 저장소
├── config.js              # ⚙️ 전역 설정
└── 문서 파일들            # 📋 README, 가이드 등
```

---

## 🧠 ai/ 폴더 구조 (실제 구현)

```
ai/
├── common/                # 🔧 공통 유틸리티, 인프라, 범용 기능
│   ├── Logger.js          # ✅ 통합 로깅 시스템 (완성)
│   ├── CacheManager.js    # ✅ 범용 캐시 관리 (완성)
│   ├── LifecycleManager.js # ✅ 생명주기 관리 (완성)
│   ├── ErrorHandler.js    # ✅ 에러 처리 및 복구 (완성)
│   └── index.js           # ✅ 공통 모듈 통합 export (완성)
├── core/                  # 🛠️ AI 오케스트레이션, 서비스 조율, 플랫폼 핵심 로직
│   ├── AIOrchestrator.js  # ✅ AI 오케스트레이션 (의존성 주입 적용)
│   ├── ServiceRegistry.js # ✅ 서비스 레지스트리 (의존성 주입 적용)
│   ├── ToolSchemaRegistry.js # ✅ 도구 스키마 관리 (완성)
│   └── MCPConnector.js    # ✅ MCP 연결 관리 (완성)
├── providers/             # 🤖 AI 제공자 관리
│   ├── AIProviderManager.js
│   ├── BaseAIProvider.js
│   ├── ClaudeProvider.js
│   └── OpenAIProvider.js
└── services/              # 🎯 서비스별 AI 모듈
    ├── filesystem/        # 📁 파일 시스템 AI (완성)
    │   ├── FileSystemService.js
    │   ├── FileOperations.js
    │   ├── FileFormatter.js
    │   ├── FileSummary.js
    │   ├── PathResolver.js
    │   ├── PathMappings.js
    │   └── FormatHelper.js
    ├── calendar/          # 📅 캘린더 AI (구조만)
    ├── contacts/          # 👥 연락처 AI (구조만)
    ├── messenger/         # 💬 메신저 AI (구조만)
    ├── notes/             # 📝 노트 AI (구조만)
    └── tasks/             # ✅ 작업 관리 AI (구조만)
```

---

## 🚀 apps/ 폴더 구조

```
apps/
├── electron/              # 🖥️ 일렉트론 데스크톱 앱
│   ├── main/              # 메인 프로세스
│   │   ├── main.js        # ✅ 일렉트론 메인
│   │   └── preload.js     # ✅ 프리로드 스크립트
│   ├── renderer/          # 렌더러 프로세스
│   │   ├── src/
│   │   │   ├── App.jsx    # ✅ 메인 앱 컴포넌트
│   │   │   ├── components/ # UI 컴포넌트들
│   │   │   │   ├── ai-ui/ # 🧠 AI UI 컴포넌트
│   │   │   │   │   ├── AICopilotFloating.jsx
│   │   │   │   │   ├── AISuggestionChips.jsx
│   │   │   │   │   └── AIThinkingIndicator.jsx
│   │   │   │   ├── layout/ # 레이아웃 컴포넌트
│   │   │   │   └── file-management/ # 파일 관리 UI
│   │   │   ├── services/  # 서비스별 UI 모듈
│   │   │   │   ├── fileManager/ # 📁 파일 관리 (완성)
│   │   │   │   │   ├── components/ # 실제 JSX 컴포넌트들
│   │   │   │   │   ├── hooks/useFileExplorer.js
│   │   │   │   │   └── utils/api.js
│   │   │   │   ├── calendar/ # 📅 캘린더 (구조만)
│   │   │   │   ├── contacts/ # 👥 연락처 (구조만)
│   │   │   │   ├── messenger/ # 💬 메신저 (구조만)
│   │   │   │   ├── notes/ # 📝 노트 (구조만)
│   │   │   │   └── taskManager/ # ✅ 작업 관리 (구조만)
│   │   │   ├── hooks/useAIFeatures.js
│   │   │   └── utils/api.js
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── tailwind.config.js
│   └── package.json
└── web/                   # 🌐 웹 애플리케이션
    ├── src/
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🔧 backend/ 폴더 구조

```
backend/
├── src/
│   ├── server-mcp.js      # ✅ MCP 서버 (완성)
│   ├── routes/
│   │   ├── ai.js          # ✅ AI 라우트 (완성)
│   │   ├── ai-chat-direct.js
│   │   └── ai-chat-new.js
│   ├── services/
│   │   ├── mcpService.js  # ✅ MCP 서비스 (완성)
│   │   ├── dataSync.js    # 데이터 동기화
│   │   └── subscriptionService.js # 구독 서비스
│   ├── middleware/
│   │   ├── toolLogger.js  # 도구 로깅
│   │   └── toolSchemaRegistry.js # 도구 스키마 레지스트리
│   └── tools/             # 🔧 백엔드 도구들
│       ├── fileSystem.js  # 파일 시스템 도구
│       ├── fileManager.js # 파일 관리 도구
│       ├── accessControl.js # 접근 제어
│       ├── cloudStorage.js # 클라우드 저장소
│       ├── fileEncryption.js # 파일 암호화
│       ├── fileOptimizer.js # 파일 최적화
│       ├── filePreview.js # 파일 미리보기
│       ├── fileSync.js    # 파일 동기화
│       ├── versionControl.js # 버전 관리
│       ├── backupSystem.js # 백업 시스템
│       ├── advancedSearch.js # 고급 검색
│       └── adaptiveLearningCache.js # 적응형 학습 캐시
│   ├── utils/
│   │   ├── pathResolver.js # 경로 해석
│   │   └── toolExecution.js # 도구 실행
│   ├── package.json
│   └── package-lock.json
├── data/
│   ├── tags.json
│   └── subscriptions.json
└── logs/
```

---

## 📦 packages/ 폴더 구조

```
packages/
├── mcp-server/            # 🧠 MCP 서버 패키지
│   ├── src/
│   │   ├── ai-copilot/    # 🤖 AI 코파일럿 엔진
│   │   │   ├── AICopilotCore.js # ✅ AI 코어 (완성)
│   │   │   ├── AdvancedNLP.js # 고급 자연어 처리
│   │   │   ├── FileSystemAnalyzer.js # 파일 시스템 분석
│   │   │   ├── IntelligentSearchEngine.js # 지능형 검색
│   │   │   ├── AdvancedMemorySystem.js # 고급 메모리 시스템
│   │   │   ├── PredictiveUIEngine.js # 예측 UI 엔진
│   │   │   ├── MultiModelAIOrchestrator.js # 다중 모델 오케스트레이션
│   │   │   ├── ContextLearningEngine.js # 컨텍스트 학습
│   │   │   ├── ErrorRecoverySystem.js # 오류 복구
│   │   │   └── IntelligentFileAnalyzer.js # 지능형 파일 분석
│   │   ├── core/          # 핵심 시스템
│   │   │   ├── FileSystemCore.js
│   │   │   ├── FileSystemEngine.js
│   │   │   ├── BackpressureSystem.js
│   │   │   └── StreamingChunkEngine.js
│   │   ├── search/        # 검색 시스템
│   │   │   ├── SearchEngine.js
│   │   │   └── ContentIndexer.js
│   │   ├── organize/      # 정리 시스템
│   │   │   └── OrganizeSystem.js
│   │   ├── optimize/      # 최적화 시스템
│   │   │   ├── PerformanceManager.js
│   │   │   └── PerformanceOptimizer.js
│   │   ├── analysis/      # 분석 시스템
│   │   │   └── AnalysisEngine.js
│   │   ├── tag/           # 태그 시스템
│   │   │   └── TagManager.js
│   │   ├── batch/         # 배치 처리
│   │   │   └── BatchManager.js
│   │   ├── plugin/        # 플러그인 시스템
│   │   │   └── PluginManager.js
│   │   ├── workers/       # 워커 시스템
│   │   │   ├── fileSystemWorker.js
│   │   │   ├── searchWorker.js
│   │   │   ├── organizeWorker.js
│   │   │   ├── optimizeWorker.js
│   │   │   ├── analysisWorker.js
│   │   │   ├── tagWorker.js
│   │   │   ├── batchWorker.js
│   │   │   ├── pluginWorker.js
│   │   │   └── fileWorker.js
│   │   ├── utils/         # 유틸리티
│   │   │   ├── logger.js
│   │   │   ├── LocalCache.js
│   │   │   └── db.js
│   │   ├── models/        # 데이터 모델
│   │   │   └── user.js
│   │   ├── routes/        # 라우트
│   │   │   └── auth.js
│   │   ├── server/        # 서버
│   │   │   └── WebServer.js
│   │   ├── cli/           # CLI
│   │   │   └── CLI.js
│   │   ├── ai/            # AI 인터페이스
│   │   │   ├── AIInterface.js
│   │   │   └── ai-cli.js
│   │   ├── config.js      # 설정
│   │   └── index.js       # 진입점
│   ├── data/              # 데이터
│   │   ├── metadata.json
│   │   └── tags.json
│   ├── logs/              # 로그
│   ├── package.json
│   └── config.json
├── web-api/               # 🌐 웹 API 패키지
│   ├── src/
│   │   ├── index.js       # 메인 서버
│   │   ├── routes/        # API 라우트
│   │   │   ├── access.js
│   │   │   ├── ai.js
│   │   │   ├── claude.js
│   │   │   ├── files.js
│   │   │   ├── search.js
│   │   │   └── tools.js
│   │   └── services/      # 서비스 로직
│   │       ├── advancedSearchService.js
│   │       ├── claudeService.js
│   │       ├── commandMacroProcessor.js
│   │       ├── fileService.js
│   │       ├── searchService.js
│   │       └── toolService.js
│   ├── logs/
│   ├── package.json
│   └── README.md
└── web-ui/                # 🌐 웹 UI 패키지
    ├── src/
    │   ├── App.jsx        # 메인 앱
    │   ├── AuthContext.jsx # 인증 컨텍스트
    │   ├── components/    # UI 컴포넌트
    │   │   ├── AdvancedSearch.jsx
    │   │   ├── ai/        # AI UI 컴포넌트
    │   │   │   ├── AICopilotPanel.jsx
    │   │   │   ├── AISuggestionChips.jsx
    │   │   │   └── AIThinkingIndicator.jsx
    │   │   ├── ErrorBoundary.jsx
    │   │   ├── file-management/ # 파일 관리 UI
    │   │   │   ├── FileGrid.jsx
    │   │   │   ├── FileItem.jsx
    │   │   │   └── FilePreview.jsx
    │   │   ├── FileAnalytics.jsx
    │   │   └── shared/    # 공통 컴포넌트
    │   │       ├── ContextMenu.jsx
    │   │       └── HeaderBar.jsx
    │   ├── constants/
    │   │   └── colors.js
    │   ├── hooks/         # 커스텀 훅
    │   │   ├── useAIFeatures.js
    │   │   └── useFileExplorer.js
    │   ├── pages/         # 페이지 컴포넌트
    │   │   ├── Analysis.jsx
    │   │   ├── Backup.jsx
    │   │   ├── Download.jsx
    │   │   ├── Files.jsx
    │   │   ├── Home.jsx
    │   │   ├── Search.jsx
    │   │   ├── Settings.jsx
    │   │   ├── Upload.jsx
    │   │   └── Upload.css
    │   ├── utils/         # 유틸리티
    │   │   ├── api.js
    │   │   └── electronAPI.js
    │   ├── index.css
    │   └── main.jsx
    ├── public/
    │   └── index.html
    ├── package.json
    ├── postcss.config.js
    └── index.html
```

---

## 🤝 shared/ 폴더 구조

```
shared/
├── hooks/                 # 공통 커스텀 훅
│   ├── useAIFeatures.js
│   └── useFileExplorer.js
└── utils/                 # 공통 유틸리티
    ├── api.js
    └── electronAPI.js
```

---

## 🐳 docker/ 폴더 구조

```
docker/
├── docker-compose.yml     # 컨테이너 오케스트레이션
├── mcp-server.Dockerfile  # MCP 서버 컨테이너
├── web-api.Dockerfile     # 웹 API 컨테이너
└── web-ui.Dockerfile      # 웹 UI 컨테이너
```

---

## 📊 data/ 폴더 구조

```
data/
├── metadata.json          # 메타데이터
├── subscriptions.json     # 구독 정보
└── tags.json             # 태그 데이터
```

---

## 🚀 coming_soon/ 폴더 구조 (개발 중인 서비스들)

```
coming_soon/
├── contacts/              # 👥 연락처 서비스 (개발 중)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── logs/
│   ├── package.json
│   └── README.md
└── coming_soon_calendar/  # 📅 캘린더 서비스 (개발 중)
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middlewares/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    ├── tests/
    ├── uploads/
    ├── logs/
    ├── package.json
    └── NOTIFICATION_MODULE_FEATURES.md
```

---

## 📋 구현 상태 요약

### ✅ **완성된 모듈**
- **AI 엔진**: `ai/core/` - AIOrchestrator, ServiceRegistry, MCPConnector
- **파일 시스템**: `ai/services/filesystem/` - 전체 파일 시스템 AI 서비스
- **백엔드**: `backend/` - MCP 서버, AI 라우트, 도구들
- **일렉트론 앱**: `apps/electron/` - 메인 프로세스, 렌더러, 파일 관리 UI
- **MCP 서버 패키지**: `packages/mcp-server/` - AI 코파일럿 엔진
- **웹 API**: `packages/web-api/` - API 서버
- **웹 UI**: `packages/web-ui/` - 웹 인터페이스

### 🟡 **구조만 있는 모듈**
- **캘린더**: `ai/services/calendar/`, `coming_soon_calendar/`
- **연락처**: `ai/services/contacts/`, `coming_soon/contacts/`
- **메신저**: `ai/services/messenger/`
- **노트**: `ai/services/notes/`
- **작업 관리**: `ai/services/tasks/`

### 🔄 **개발 중인 모듈**
- **캘린더 서비스**: 알림 시스템, 이벤트 관리
- **연락처 서비스**: 네트워크 관리, 프로젝트 관리

---

## 🎯 핵심 워크플로우

### 1. **AI 주도 파일 시스템 작업**
```
사용자 요청 → AIOrchestrator → FileSystemService → MCPConnector → Backend → 결과 반환
```

### 2. **복합 서비스 작업**
```
사용자 요청 → AIOrchestrator → 여러 서비스 조합 → 결과 통합 → 응답
```

### 3. **확장 가능한 구조**
```
새 서비스 추가 → ServiceRegistry 등록 → AIOrchestrator 자동 인식 → 즉시 사용 가능
```

---

## 🚀 개발 가이드라인

### 📁 **새 서비스 추가**
1. `ai/services/` 에 새 서비스 폴더 생성
2. `ServiceRegistry.js` 에 서비스 등록
3. `AIOrchestrator.js` 에 서비스 로직 추가
4. 백엔드 도구 추가 (필요시)
5. UI 컴포넌트 추가 (필요시)

### 🔧 **AI 도구 확장**
1. `ai/services/` 에 새 도구 모듈 생성
2. 표준 인터페이스 구현
3. `ServiceRegistry.js` 에 등록
4. 테스트 및 문서화

### 🌐 **프론트엔드 확장**
1. `apps/electron/renderer/src/services/` 에 새 서비스 UI 추가
2. 컴포넌트 및 훅 구현
3. 라우팅 및 네비게이션 추가
4. 스타일링 및 UX 개선

---

## 📚 관련 문서

- [AI-ENGINE-GUIDE.md](./AI-ENGINE-GUIDE.md) - AI 엔진 아키텍처 상세 가이드
- [API_SECURITY_UPDATE.md](./API_SECURITY_UPDATE.md) - API 보안 업데이트 가이드
- [README.md](./README.md) - 프로젝트 개요 및 시작 가이드

---

> **💡 이 구조는 AI가 주체가 되어 모든 서비스를 통합 제어하는 생태계를 구현합니다.**
> 
> **🎯 핵심: 단순한 파일매니저가 아닌, AI가 모든 서비스를 넘나들며 작업하는 통합 플랫폼입니다.**