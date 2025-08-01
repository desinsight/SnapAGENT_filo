# Documents Service Backend API 문서

## 개요

Documents Service Backend는 문서 관리, 템플릿 관리, 파일 업로드/다운로드 기능을 제공하는 RESTful API입니다.

## 기본 정보

- **Base URL**: `http://localhost:3001/api/v1`
- **인증**: JWT 토큰 (Authorization 헤더에 Bearer 토큰 포함)
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8

## 인증

대부분의 API 엔드포인트는 JWT 토큰 인증이 필요합니다.

```http
Authorization: Bearer <your-jwt-token>
```

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다.",
  "data": {
    // 응답 데이터
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": "상세 에러 정보"
  }
}
```

### 페이징 응답
```json
{
  "success": true,
  "data": [
    // 데이터 배열
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 문서 관리 API

### 1. 문서 생성

**POST** `/documents`

새로운 문서를 생성합니다.

#### 요청 본문
```json
{
  "title": "문서 제목",
  "content": "문서 내용",
  "documentType": "specification",
  "tags": ["태그1", "태그2"],
  "description": "문서 설명",
  "priority": "normal",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

#### 응답
```json
{
  "success": true,
  "message": "문서가 성공적으로 생성되었습니다.",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "문서 제목",
    "content": "문서 내용",
    "documentType": "specification",
    "status": "draft",
    "currentVersion": 1,
    "createdBy": "64f8a1b2c3d4e5f6a7b8c9d1",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 문서 목록 조회

**GET** `/documents`

문서 목록을 조회합니다.

#### 쿼리 파라미터
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 20)
- `sortBy` (string): 정렬 기준 (기본값: createdAt)
- `sortOrder` (string): 정렬 순서 (asc/desc, 기본값: desc)
- `search` (string): 검색어
- `status` (string): 문서 상태 필터
- `documentType` (string): 문서 타입 필터
- `createdBy` (string): 작성자 ID 필터
- `tags` (string): 태그 필터 (쉼표로 구분)

#### 응답
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "문서 제목",
      "documentType": "specification",
      "status": "draft",
      "createdBy": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "사용자명",
        "email": "user@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 3. 문서 조회

**GET** `/documents/:id`

특정 문서의 상세 정보를 조회합니다.

#### 응답
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "문서 제목",
    "content": "문서 내용",
    "documentType": "specification",
    "status": "draft",
    "currentVersion": 1,
    "tags": ["태그1", "태그2"],
    "permissions": [
      {
        "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "role": "owner",
        "grantedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdBy": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "사용자명",
      "email": "user@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 문서 업데이트

**PUT** `/documents/:id`

문서를 업데이트합니다.

#### 요청 본문
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "tags": ["새태그1", "새태그2"],
  "description": "수정된 설명",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

### 5. 문서 삭제

**DELETE** `/documents/:id`

문서를 삭제합니다 (소프트 삭제).

### 6. 문서 상태 변경

**PATCH** `/documents/:id/status`

문서의 상태를 변경합니다.

#### 요청 본문
```json
{
  "status": "review",
  "comment": "검토 요청"
}
```

### 7. 문서 권한 관리

**PUT** `/documents/:id/permissions`

문서의 권한을 관리합니다.

#### 요청 본문
```json
{
  "permissions": [
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "role": "editor",
      "grantedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "userId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "role": "viewer",
      "grantedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 8. 문서 검색

**POST** `/documents/search`

고급 검색을 수행합니다.

#### 요청 본문
```json
{
  "query": "검색어",
  "filters": {
    "status": "draft",
    "documentType": "specification",
    "tags": ["태그1", "태그2"]
  },
  "options": {
    "page": 1,
    "limit": 20,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### 9. 문서 버전 히스토리

**GET** `/documents/:id/versions`

문서의 버전 히스토리를 조회합니다.

### 10. 특정 버전 조회

**GET** `/documents/:id/versions/:version`

특정 버전의 문서를 조회합니다.

### 11. 문서 첨부파일 업로드

**POST** `/documents/:id/attachments`

문서에 첨부파일을 업로드합니다.

#### 요청
- Content-Type: `multipart/form-data`
- 파일 필드명: `file`

### 12. 문서 첨부파일 목록

**GET** `/documents/:id/attachments`

문서의 첨부파일 목록을 조회합니다.

### 13. 문서 통계

**GET** `/documents/stats`

문서 관련 통계를 조회합니다.

## 템플릿 관리 API

### 1. 템플릿 생성

**POST** `/templates`

새로운 템플릿을 생성합니다.

#### 요청 본문
```json
{
  "title": "템플릿 제목",
  "content": "템플릿 내용",
  "documentType": "specification",
  "category": "기술문서",
  "tags": ["템플릿", "기술"],
  "description": "템플릿 설명",
  "isPublic": false
}
```

### 2. 템플릿 목록 조회

**GET** `/templates`

템플릿 목록을 조회합니다.

#### 쿼리 파라미터
- `page` (number): 페이지 번호
- `limit` (number): 페이지당 항목 수
- `search` (string): 검색어
- `category` (string): 카테고리 필터
- `documentType` (string): 문서 타입 필터
- `isPublic` (boolean): 공개 여부 필터
- `tags` (string): 태그 필터

### 3. 공개 템플릿 목록

**GET** `/templates/public`

공개 템플릿 목록을 조회합니다 (인증 불필요).

### 4. 템플릿 조회

**GET** `/templates/:id`

특정 템플릿의 상세 정보를 조회합니다.

### 5. 템플릿 업데이트

**PUT** `/templates/:id`

템플릿을 업데이트합니다.

### 6. 템플릿 삭제

**DELETE** `/templates/:id`

템플릿을 삭제합니다.

### 7. 템플릿 복사

**POST** `/templates/:id/copy`

템플릿을 복사합니다.

#### 요청 본문
```json
{
  "newTitle": "복사된 템플릿 제목"
}
```

### 8. 템플릿 다운로드

**POST** `/templates/:id/download`

템플릿을 다운로드합니다 (다운로드 통계 업데이트).

### 9. 템플릿 공개/비공개 설정

**PATCH** `/templates/:id/visibility`

템플릿의 공개 여부를 설정합니다.

#### 요청 본문
```json
{
  "isPublic": true
}
```

### 10. 템플릿 카테고리 목록

**GET** `/templates/categories`

사용 가능한 템플릿 카테고리 목록을 조회합니다.

### 11. 인기 템플릿

**GET** `/templates/popular`

인기 템플릿 목록을 조회합니다.

#### 쿼리 파라미터
- `limit` (number): 조회할 템플릿 수 (기본값: 10)

### 12. 템플릿 버전 히스토리

**GET** `/templates/:id/versions`

템플릿의 버전 히스토리를 조회합니다.

### 13. 특정 버전 템플릿

**GET** `/templates/:id/versions/:version`

특정 버전의 템플릿을 조회합니다.

### 14. 템플릿 통계

**GET** `/templates/stats`

템플릿 관련 통계를 조회합니다.

## 파일 관리 API

### 1. 파일 업로드

**POST** `/files/upload`

파일을 업로드합니다.

#### 요청
- Content-Type: `multipart/form-data`
- 파일 필드명: `file`
- 추가 필드: `documentId` (선택사항)

#### 응답
```json
{
  "success": true,
  "message": "파일이 성공적으로 업로드되었습니다.",
  "data": {
    "id": "file-uuid",
    "originalName": "example.pdf",
    "filename": "uuid-timestamp.pdf",
    "size": 1024000,
    "mimetype": "application/pdf",
    "extension": ".pdf",
    "hash": "sha256-hash",
    "uploadedBy": "user-id",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "documentId": "document-id",
    "isSafe": true
  }
}
```

### 2. 파일 다운로드

**GET** `/files/:id/download`

파일을 다운로드합니다.

### 3. 파일 정보 조회

**GET** `/files/:id`

파일의 메타데이터를 조회합니다.

### 4. 파일 미리보기

**GET** `/files/:id/preview`

이미지 파일의 미리보기를 제공합니다.

### 5. 파일 삭제

**DELETE** `/files/:id`

파일을 삭제합니다.

### 6. 파일 목록 조회

**GET** `/files`

파일 목록을 조회합니다.

#### 쿼리 파라미터
- `page` (number): 페이지 번호
- `limit` (number): 페이지당 항목 수
- `documentId` (string): 문서 ID 필터
- `uploadedBy` (string): 업로더 ID 필터
- `fileType` (string): 파일 타입 필터

### 7. 파일 업로드 설정

**GET** `/files/config`

파일 업로드 관련 설정을 조회합니다.

#### 응답
```json
{
  "success": true,
  "data": {
    "maxFileSize": 52428800,
    "allowedFileTypes": ["pdf", "doc", "docx", "jpg", "png"],
    "maxFilesPerRequest": 10
  }
}
```

### 8. 파일 검증

**POST** `/files/validate`

파일 업로드 전 검증을 수행합니다.

#### 요청 본문
```json
{
  "filename": "example.pdf",
  "size": 1024000,
  "mimetype": "application/pdf"
}
```

#### 응답
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### 9. 파일 통계

**GET** `/files/stats`

파일 관련 통계를 조회합니다.

### 10. 파일 다운로드 통계

**GET** `/files/:id/download-stats`

특정 파일의 다운로드 통계를 조회합니다.

### 11. 파일 정리

**POST** `/files/cleanup`

오래된 파일을 정리합니다 (관리자용).

#### 요청 본문
```json
{
  "daysToKeep": 30
}
```

## 헬스체크 API

### 1. 서버 상태 확인

**GET** `/health`

서버의 상태를 확인합니다.

#### 응답
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 에러 코드

### HTTP 상태 코드

- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증 실패
- `403` - 권한 없음
- `404` - 리소스를 찾을 수 없음
- `413` - 파일 크기 초과
- `500` - 서버 내부 오류

### 비즈니스 에러 코드

- `DOCUMENT_NOT_FOUND` - 문서를 찾을 수 없음
- `TEMPLATE_NOT_FOUND` - 템플릿을 찾을 수 없음
- `FILE_NOT_FOUND` - 파일을 찾을 수 없음
- `PERMISSION_DENIED` - 권한이 없음
- `INVALID_FILE_TYPE` - 지원하지 않는 파일 형식
- `FILE_SIZE_EXCEEDED` - 파일 크기 초과
- `VIRUS_DETECTED` - 바이러스 감지됨

## 제한사항

### 파일 업로드 제한
- 최대 파일 크기: 50MB
- 지원 파일 형식: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF
- 한 번에 업로드 가능한 파일 수: 10개

### API 요청 제한
- 분당 최대 요청 수: 100회
- 시간당 최대 요청 수: 1000회

### 검색 제한
- 검색 결과 최대 개수: 1000개
- 검색어 최대 길이: 100자

## 예제

### cURL 예제

#### 문서 생성
```bash
curl -X POST http://localhost:3001/api/v1/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새 문서",
    "content": "문서 내용",
    "documentType": "specification"
  }'
```

#### 파일 업로드
```bash
curl -X POST http://localhost:3001/api/v1/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "documentId=64f8a1b2c3d4e5f6a7b8c9d0"
```

#### 템플릿 복사
```bash
curl -X POST http://localhost:3001/api/v1/templates/64f8a1b2c3d4e5f6a7b8c9d0/copy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newTitle": "복사된 템플릿"
  }'
```

### JavaScript 예제

#### 문서 목록 조회
```javascript
const response = await fetch('http://localhost:3001/api/v1/documents?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const data = await response.json();
console.log(data);
```

#### 파일 업로드
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('documentId', '64f8a1b2c3d4e5f6a7b8c9d0');

const response = await fetch('http://localhost:3001/api/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

## 버전 관리

현재 API 버전: v1

API 버전은 URL 경로에 포함됩니다: `/api/v1/`

## 지원

API 관련 문의사항이나 버그 리포트는 개발팀에 연락해주세요. 