# service-messenger

사내 메신저 및 자유게시판/공지 백엔드 서비스

---

## 서비스 목적
- 사내 팀/조직/전체 커뮤니케이션을 위한 메신저 및 자유게시판/공지 기능 제공
- MCP 플랫폼 내 다양한 서비스와의 연동 및 확장성 고려
- 인증/알림/설정 등은 플랫폼에서 통합 관리, 본 서비스는 백엔드 핵심 기능에 집중

## 주요 기능

### 메신저 기능
- JWT 인증 미들웨어(플랫폼 토큰 검증)
- 채팅방(1:1, 그룹, 전체) 관리 및 메시지 CRUD
- 파일 첨부(메타데이터만, 실제 파일 저장은 별도 연동)
- 실시간 알림 및 읽음 처리

### 게시판 기능
- 자유 게시판/공지(공개/비공개) 관리
- 게시글/댓글 CRUD (대댓글 지원)
- 파일 첨부 (최대 10개, 10MB 제한)
- 검색 및 페이징 기능
- 권한 기반 접근 제어
- 조회수 및 통계 기능

### 공통 기능
- 플러그인 구조(외부 서비스 연동, 확장성 중심)
- 조직/팀/사용자 정보는 플랫폼 연동(자체 DB 최소화)
- 통합 에러 처리 및 로깅
- API 문서화 (Swagger)

## 폴더 구조

```plaintext
src/
  config/         # 환경설정, DB 연결 등
  controllers/    # 라우터에서 호출하는 컨트롤러
  models/         # Mongoose 등 DB 모델
  routes/         # API 라우터
  services/       # 비즈니스 로직(메시지, 채팅방, 게시판 등)
  middlewares/    # 인증, 권한, 로깅, 파일업로드 등 미들웨어
  plugins/        # 확장/연동용 플러그인(예: 알림, 외부연동)
  utils/          # 유틸 함수 (에러 처리, 로깅, MCP 연동 등)
  docs/           # API 문서 (Swagger)
  uploads/        # 파일 업로드 저장소
  index.js        # 앱 엔트리포인트
tests/            # 테스트 코드
```

## 게시판 API 예시

### 게시판 생성
```bash
POST /api/boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "공지사항",
  "type": "notice",
  "description": "회사 공지사항 게시판",
  "isPublic": true
}
```

### 게시글 작성 (파일 첨부 포함)
```bash
POST /api/boards/{boardId}/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "월간 회의 안내",
  "content": "다음 주 월요일 오후 2시에 월간 회의가 있습니다.",
  "isPinned": true,
  "isNotice": true,
  "files": [파일1, 파일2, ...]
}
```

### 게시글 목록 조회
```bash
GET /api/boards/{boardId}/posts?page=1&limit=20&search=회의&sort=latest
Authorization: Bearer <token>
```

### 댓글 작성
```bash
POST /api/posts/{postId}/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "참석하겠습니다.",
  "parentComment": "댓글ID" // 대댓글인 경우
}
```

### 게시글 검색
```bash
GET /api/search/posts?keyword=회의&boardType=notice&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer <token>
```

## 설계 방향
- 모든 기능/모듈에 한글 주석 필수(확장/유지보수/AI 협업 고려)
- 플러그인/미들웨어 구조로 확장성 극대화
- MCP 및 타 서비스와의 연동을 위한 API/이벤트 구조 설계
- 테스트/문서화/로깅 등 기본 관리 기능 포함
- 권한 기반 접근 제어 및 보안 강화

## API 문서(Swagger)
- OpenAPI 3.0 기반 명세: `src/docs/swagger.yaml`
- Swagger UI 등으로 시각화 가능
- 예시: https://editor.swagger.io/ 에서 파일 업로드 후 확인
- 로컬 접속: `http://localhost:4001/api-docs`

## 테스트
```bash
# 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 테스트 커버리지
npm run test:coverage
```

## 헬스체크 API
- `/health`에서 서비스 상태, 버전, 환경, 빌드타임 등 확인 가능
- 예시 응답:
  ```json
  {
    "status": "ok",
    "service": "service-messenger",
    "version": "0.1.0",
    "env": "development",
    "buildTime": "2024-07-06T12:34:56.789Z",
    "timestamp": "2024-07-06T12:35:00.123Z"
  }
  ```

## 인증(MCP 연동)
- 모든 API는 플랫폼 JWT 토큰을 요구하며, 미들웨어에서 MCP 연동 유틸(`utils/mcpIntegration.js`)로 토큰 검증 및 사용자 정보를 처리함
- 실제 MCP API 연동은 해당 유틸에서 구현/확장 가능

## 파일 업로드
- 지원 파일 형식: 이미지, 문서, 압축파일 등
- 파일 크기 제한: 10MB
- 파일 개수 제한: 최대 10개
- 저장 경로: `src/uploads/` (파일 타입별 하위 디렉토리)

## 에러 처리
- 통합 에러 핸들러로 일관된 응답 형식 제공
- 커스텀 에러 클래스: ValidationError, PermissionError, NotFoundError 등
- 개발 환경에서는 스택 트레이스 포함, 프로덕션에서는 제외

---

> ⚠️ 인증/알림/설정 등은 플랫폼에서 통합 관리하므로, 본 서비스에서는 별도 구현하지 않음 