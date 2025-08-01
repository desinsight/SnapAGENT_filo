# 📄 Documents Service Backend

AI-First Documents Management Service Backend API  
문서 작성, 템플릿 관리, 승인 프로세스, 협업 기능을 제공하는 백엔드 서비스

## 🚀 주요 기능

### 1. 기본 문서 관리 기능
- ✅ 문서 생성/수정/삭제/조회 (CRUD)
- ✅ 다양한 문서 유형 지원 (시방서, 지출결의서, 계약서 등)
- ✅ 템플릿 관리 (양식 등록/수정/삭제, 미리보기)
- ✅ 첨부파일 업로드/다운로드 (이미지, PDF, 한글, 엑셀 등)
- ✅ 문서 버전 관리 (이력, 복원)
- ✅ 문서 상태 관리 (임시저장, 제출, 승인, 반려 등)

### 2. 협업 및 승인 프로세스
- ✅ 다단계 결재 (결재선 지정, 승인/반려/의견)
- ✅ 실시간 협업 (여러 명이 동시에 편집, 코멘트, 태그)
- ✅ 알림 시스템 (이메일, 푸시, 슬랙 등)
- ✅ 문서 공유 (내부/외부, 링크, 권한 설정)
- ✅ 문서 이력/로그 (누가 언제 무엇을 했는지)

### 3. 고급 검색 및 필터링
- ✅ 문서 내용/제목/작성자/상태 등 다양한 조건 검색
- ✅ 태그, 카테고리, 기간별 필터
- ✅ 첨부파일 내 텍스트 검색 (OCR, PDF/한글/엑셀 등)

### 4. 보안 및 권한 관리
- ✅ 사용자/조직/부서별 권한 (읽기/쓰기/승인/관리)
- ✅ 문서 암호화/접근제어
- ✅ 감사 로그 (모든 행위 기록)
- ✅ 외부 공유/다운로드 제한

### 5. 외부 연동 및 확장성
- ✅ 네트워크 드라이브 (raidrive 등) 연동
- ✅ ERP/그룹웨어/메일/메신저 등 외부 시스템 연동
- ✅ API 제공 (외부 서비스에서 문서 생성/조회 등)
- ✅ 모바일/웹/데스크탑 지원

### 6. 기타 고급 기능
- ✅ 문서 템플릿 마켓 (사내/외부 템플릿 공유)
- ✅ 문서 통계/분석 (작성량, 승인률, 지연 등)
- ✅ 타 서비스와의 연계 (일정/태스크/노트 등)
- ✅ 다국어 지원 (한/영/중 등)

## 🛠 기술 스택

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis
- **Authentication:** JWT
- **File Upload:** Multer
- **Real-time:** Socket.io
- **Search:** Elasticsearch
- **Document Processing:** PDF-lib, Mammoth, XLSX
- **Image Processing:** Sharp, Tesseract.js (OCR)
- **Validation:** Joi
- **Testing:** Jest, Supertest
- **Documentation:** Swagger

## 📁 프로젝트 구조

```
service_documents/
├── src/
│   ├── config/           # 설정 파일들
│   ├── controllers/      # 컨트롤러 (비즈니스 로직)
│   ├── models/          # 데이터 모델 (Mongoose 스키마)
│   ├── routes/          # API 라우트 정의
│   ├── services/        # 서비스 레이어 (비즈니스 로직)
│   ├── middleware/      # 미들웨어 (인증, 검증, 로깅 등)
│   ├── utils/           # 유틸리티 함수들
│   ├── validators/      # 데이터 검증 스키마
│   └── index.js         # 애플리케이션 진입점
├── scripts/             # 스크립트 (설정, 시드 데이터 등)
├── tests/               # 테스트 파일들
├── docs/                # API 문서
├── uploads/             # 업로드된 파일들
├── logs/                # 로그 파일들
├── package.json
└── README.md
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 필요한 설정값 입력
```

### 3. 데이터베이스 설정
```bash
# MongoDB 연결 설정
# Redis 연결 설정
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 서버 실행
```bash
npm start
```

## 📚 API 문서

### 기본 엔드포인트
- `GET /api/v1/documents` - 문서 목록 조회
- `POST /api/v1/documents` - 새 문서 생성
- `GET /api/v1/documents/:id` - 특정 문서 조회
- `PUT /api/v1/documents/:id` - 문서 수정
- `DELETE /api/v1/documents/:id` - 문서 삭제
- `PATCH /api/v1/documents/:id/status` - 문서 상태 변경
- `PUT /api/v1/documents/:id/permissions` - 문서 권한 관리

### 템플릿 관리
- `GET /api/v1/templates` - 템플릿 목록 조회
- `POST /api/v1/templates` - 새 템플릿 생성
- `GET /api/v1/templates/:id` - 특정 템플릿 조회
- `PUT /api/v1/templates/:id` - 템플릿 수정
- `DELETE /api/v1/templates/:id` - 템플릿 삭제
- `POST /api/v1/templates/:id/copy` - 템플릿 복사
- `POST /api/v1/templates/:id/download` - 템플릿 다운로드
- `PATCH /api/v1/templates/:id/visibility` - 템플릿 공개/비공개 설정

### 파일 관리
- `POST /api/v1/files/upload` - 파일 업로드
- `GET /api/v1/files/:id/download` - 파일 다운로드
- `GET /api/v1/files/:id/preview` - 파일 미리보기
- `DELETE /api/v1/files/:id` - 파일 삭제
- `GET /api/v1/files/config` - 파일 업로드 설정 조회

### 문서 첨부파일
- `POST /api/v1/documents/:id/attachments` - 첨부파일 업로드
- `GET /api/v1/documents/:id/attachments` - 첨부파일 목록 조회

### 검색 및 통계
- `POST /api/v1/documents/search` - 고급 검색
- `GET /api/v1/documents/stats` - 문서 통계
- `GET /api/v1/templates/stats` - 템플릿 통계
- `GET /api/v1/files/stats` - 파일 통계

### 헬스체크
- `GET /health` - 서버 상태 확인

자세한 API 문서는 [docs/API.md](docs/API.md)를 참조하세요.

## 🔧 개발 가이드

### 코드 스타일
- ESLint 규칙 준수
- JSDoc 주석 필수
- 함수/변수명은 명확하고 의미있게

### 테스트
```bash
npm test              # 전체 테스트 실행
npm run test:watch    # 테스트 감시 모드
npm run test:coverage # 테스트 커버리지 확인
```

### 데이터베이스 마이그레이션
```bash
npm run migrate       # 데이터베이스 마이그레이션
npm run seed          # 시드 데이터 생성
```

## 🔒 보안

- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- API 요청 제한 (Rate Limiting)
- 입력 데이터 검증 및 sanitization
- HTTPS 강제 적용 (프로덕션)

## 📊 모니터링

- Winston을 통한 로깅
- 에러 추적 및 알림
- 성능 모니터링
- API 사용량 통계

## 🤝 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 지원

- 이슈 리포트: [GitHub Issues](your-issues-url)
- 이메일: your-email@example.com
- 문서: [API Documentation](your-docs-url) 