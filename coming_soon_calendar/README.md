# 📅 Coming Soon Calendar Service Backend

## 개요
- 다양한 서비스(캘린더, 일정, 알림, 태그, 카테고리 등)를 지원하는 확장형 백엔드
- 구조화된 API, 표준화된 응답, 자동화 테스트, DB 연동 확장성, AI 연동 최적화

---

## 주요 기능
- 캘린더 CRUD (생성/조회/수정/삭제)
- 이벤트(일정) CRUD
- 알림(Notification) 추가/조회/수정/삭제
- 참석자(Attendee) 초대/상태변경/조회
- 태그(Tag) 추가/제거/전체조회
- 카테고리(Category) 지정/제거/전체조회
- 고급 검색/필터/정렬
- 반복 일정(RRULE) 지원
- 표준화된 API 응답(success/data)
- 인증/에러 핸들러 미들웨어
- 자동화 테스트(Jest + Supertest)
- DB 연동 확장성(Mongoose 스타일)

---

## 폴더 구조
```
coming_soon_calendar/
  src/
    controllers/   # API 컨트롤러
    services/      # 비즈니스 로직
    models/        # 데이터 모델(DB 확장성)
    routes/        # 라우트 정의
    middlewares/   # 인증/에러 등 미들웨어
    utils/         # 공통 유틸리티
    config/        # 환경설정(확장용)
    index.js       # 서버 진입점
  tests/           # 자동화 테스트
  README.md        # 문서
  package.json     # 의존성/스크립트
```

---

## 표준 API 응답 구조
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
- 성공: `success: true`, 데이터는 `data` 필드에 포함
- 실패: `success: false`, 에러 메시지는 `error` 필드에 포함

---

## 주요 API 엔드포인트 예시

### 캘린더
- `POST   /api/calendar`           : 캘린더 생성
- `GET    /api/calendar`           : 캘린더 목록 조회
- `GET    /api/calendar/:id`       : 캘린더 상세 조회
- `PUT    /api/calendar/:id`       : 캘린더 수정
- `DELETE /api/calendar/:id`       : 캘린더 삭제

### 이벤트(일정)
- `POST   /api/calendar/events`           : 일정 생성
- `GET    /api/calendar/events`           : 일정 목록 조회
- `GET    /api/calendar/events/:id`       : 일정 상세 조회
- `PUT    /api/calendar/events/:id`       : 일정 수정
- `DELETE /api/calendar/events/:id`       : 일정 삭제
- `GET    /api/calendar/events/search`    : 고급 검색/필터/정렬

### 알림(Notification)
- `POST   /api/calendar/events/:eventId/notifications`           : 알림 추가
- `GET    /api/calendar/events/:eventId/notifications`           : 알림 목록 조회
- `PUT    /api/calendar/events/:eventId/notifications/:notificationId` : 알림 수정
- `DELETE /api/calendar/events/:eventId/notifications/:notificationId` : 알림 삭제

### 참석자(Attendee)
- `POST   /api/calendar/events/:eventId/attendees`           : 참석자 초대
- `PUT    /api/calendar/events/:eventId/attendees/:userId`   : 참석자 상태 변경
- `GET    /api/calendar/events/:eventId/attendees/:userId`   : 특정 참석자 상태 조회
- `GET    /api/calendar/events/:eventId/attendees`           : 전체 참석자 상태 목록

### 태그/카테고리
- `POST   /api/calendar/events/:eventId/tags`        : 태그 추가
- `DELETE /api/calendar/events/:eventId/tags/:tag`   : 태그 제거
- `GET    /api/calendar/tags`                        : 전체 태그 목록
- `POST   /api/calendar/events/:eventId/category`    : 카테고리 지정
- `DELETE /api/calendar/events/:eventId/category`     : 카테고리 제거
- `GET    /api/calendar/categories`                  : 전체 카테고리 목록

---

## 테스트 방법
```bash
cd coming_soon_calendar
npm install
npm test
```
- Jest + Supertest 기반 자동화 테스트
- 모든 주요 기능에 대한 테스트 코드 포함

---

## DB 연동 확장성
- models/ 폴더 내 Mongoose 스타일 스키마/모델 예시 포함
- 실제 DB 연동 시 mongoose 등 ODM 라이브러리 적용 가능

---

## Swagger(OpenAPI) 문서화 (예정)
- 추후 `/api-docs` 엔드포인트에서 실시간 API 문서 제공 예정
- swagger-jsdoc, swagger-ui-express 등 도입 가능

---

## 문의/기여
- 구조/기능/확장/문서화 등 궁금한 점은 언제든 문의 바랍니다.

---

## 📅 서비스 개요
- 세계 최고 수준의 캘린더 서비스 백엔드
- 플랫폼 내 여러 서비스(메신저, 노트, 파일 등)와 연동 예정
- AI가 읽고 쓰기 쉬운 구조로 설계
- Node.js + Express 기반 RESTful API

## 📁 폴더 구조
```
coming_soon_calendar/
  ├─ src/
  │   ├─ config/           # 환경설정, DB, 외부 API 연동 등
  │   ├─ controllers/      # 라우터별 컨트롤러
  │   ├─ models/           # DB/데이터 모델
  │   ├─ routes/           # API 라우트
  │   ├─ services/         # 비즈니스 로직, 외부 연동
  │   ├─ utils/            # 유틸리티 함수
  │   └─ middlewares/      # 인증, 에러처리 등 미들웨어
  ├─ tests/                # 테스트 코드
  ├─ README.md             # 서비스 설명 및 API 문서
  ├─ package.json
  └─ .env.example          # 환경변수 예시
```

## 🛠️ 주요 기능 (예정)
- 캘린더 생성/수정/삭제
- 일정(이벤트) 생성/수정/삭제/조회 (반복, 알림, 참석자 등)
- 일정 카테고리/색상/태그
- 일정 초대/공유(다른 사용자, 그룹)
- 일정 검색/필터/정렬
- 일정 알림(푸시, 이메일 등)
- 외부 캘린더 API 연동(구글, 애플 등)
- AI 기반 일정 추천/자동 생성/요약/분석(추후)
- 다른 서비스와의 연동(메신저, 파일, 노트 등)

## 🧑‍💻 개발 규칙
- 이 폴더 내에서만 작업 (상위 플랫폼 코드에 영향 X)
- 코드에 상세 주석 필수 (함수/클래스/파일 단위)
- 서비스/기능별로 파일 분리, 체계적 구조 유지
- API/모델/서비스 설계 시 연동성, AI 활용성 고려
- 테스트 코드 작성 권장

## 🔗 연동/확장성
- 모든 데이터 구조는 AI 및 타 서비스가 쉽게 읽고 쓸 수 있도록 설계
- 추후 플랫폼 내 인증/권한 시스템과 연동 예정
- 서비스별 고유 식별자, 표준화된 API 응답 구조 사용

## ✨ 참고
- 구글 캘린더, 애플 캘린더, 아웃룩 등 주요 캘린더 서비스 벤치마킹
- 플랫폼 내 다른 서비스(contacts, notes, tasks 등)와의 연동성 최우선 고려

---

> ⚠️ 이 폴더 외부의 코드는 수정하지 마세요. 플랫폼 전체에 영향이 갈 수 있습니다. 

## 고급 반복 설정 및 충돌 감지 기능

### 1. 고급 반복 설정

#### 1.1 공휴일 제외 반복 일정
```javascript
// 공휴일을 제외한 주간 반복 일정
{
  "calendarId": "calendar_id",
  "title": "주간 회의 (공휴일 제외)",
  "start": "2024-01-01T09:00:00Z",
  "end": "2024-01-01T10:00:00Z",
  "recurrence": {
    "freq": "WEEKLY",
    "interval": 1,
    "byweekday": ["MO"]
  },
  "excludeHolidays": true
}
```

#### 1.2 특정 날짜 제외 반복 일정
```javascript
// 특정 날짜를 제외한 월간 반복 일정
{
  "calendarId": "calendar_id",
  "title": "월간 회의 (특정일 제외)",
  "start": "2024-01-01T14:00:00Z",
  "end": "2024-01-01T15:00:00Z",
  "recurrence": {
    "freq": "MONTHLY",
    "interval": 1,
    "bymonthday": [1]
  },
  "excludeDates": ["2024-02-01", "2024-03-01"]
}
```

#### 1.3 고급 RRULE 옵션
```javascript
// 복잡한 반복 패턴
{
  "recurrence": {
    "freq": "WEEKLY",
    "interval": 2,
    "byweekday": ["MO", "WE", "FR"],
    "bymonth": [1, 2, 3, 9, 10, 11, 12],
    "until": "2024-12-31T23:59:59Z"
  }
}
```

### 2. 일정 충돌 감지 및 자동 조정

#### 2.1 충돌 감지
일정 생성/수정 시 자동으로 충돌을 감지하고 해결 방안을 제안합니다.

```javascript
// 충돌이 감지된 경우 응답 (409 상태코드)
{
  "success": true,
  "message": "일정 충돌이 감지되었습니다.",
  "data": {
    "conflicts": [
      {
        "id": "event_id",
        "title": "기존 일정",
        "start": "2024-01-15T10:00:00Z",
        "end": "2024-01-15T11:00:00Z"
      }
    ],
    "suggestions": [
      {
        "type": "same_week",
        "start": "2024-01-16T09:00:00Z",
        "end": "2024-01-16T10:00:00Z",
        "description": "2024-01-16 9시로 이동"
      },
      {
        "type": "next_week",
        "start": "2024-01-22T10:30:00Z",
        "end": "2024-01-22T11:30:00Z",
        "description": "다음 주로 이동"
      }
    ]
  }
}
```

#### 2.2 충돌 해결 제안 조회 API
```
GET /api/conflicts/suggestions?calendarId=xxx&start=xxx&end=xxx&excludeHolidays=true&excludeDates=2024-01-01,2024-01-02
```

#### 2.3 반복 일정 충돌 감지
반복 일정의 각 발생일별로 충돌을 세밀하게 감지합니다.

```javascript
// 반복 일정과 충돌하는 일정 생성 시
{
  "calendarId": "calendar_id",
  "title": "충돌 일정",
  "start": "2024-01-08T09:30:00Z", // 반복 일정의 두 번째 발생일과 충돌
  "end": "2024-01-08T10:30:00Z"
}
```

### 3. API 엔드포인트

#### 3.1 일정 생성 (충돌 감지 포함)
```
POST /api/events
Content-Type: application/json

{
  "calendarId": "calendar_id",
  "title": "일정 제목",
  "start": "2024-01-01T09:00:00Z",
  "end": "2024-01-01T10:00:00Z",
  "recurrence": { ... },
  "excludeHolidays": true,
  "excludeDates": ["2024-01-01"]
}
```

#### 3.2 일정 수정 (충돌 감지 포함)
```
PUT /api/events/:id
Content-Type: application/json

{
  "start": "2024-01-15T10:30:00Z",
  "end": "2024-01-15T11:30:00Z",
  "excludeHolidays": true
}
```

#### 3.3 충돌 해결 제안 조회
```
GET /api/conflicts/suggestions?calendarId=xxx&start=xxx&end=xxx&excludeHolidays=true
```

### 4. 고급 기능

#### 4.1 한국 공휴일 API 연동
- 공공데이터포털의 공휴일 정보를 자동으로 가져옵니다
- `excludeHolidays: true` 옵션 시 공휴일을 자동으로 제외합니다

#### 4.2 RRULE 고도화
- RFC 5545 표준을 준수하는 RRULE 파싱/생성
- 복잡한 반복 패턴 지원 (요일, 월, 특정일 등)
- 반복 종료 조건 (until, count) 지원

#### 4.3 스마트 충돌 해결
- 같은 주 내 다른 시간대 제안
- 다음/이전 주 제안
- 공휴일 제외 옵션을 고려한 제안

### 5. 테스트

고급 반복 및 충돌 감지 기능 테스트:
```bash
npm test -- --grep "고급 반복 및 충돌 감지"
```

---

## 테스트 방법
```bash
cd coming_soon_calendar
npm install
npm test
```
- Jest + Supertest 기반 자동화 테스트
- 모든 주요 기능에 대한 테스트 코드 포함

---

## DB 연동 확장성
- models/ 폴더 내 Mongoose 스타일 스키마/모델 예시 포함
- 실제 DB 연동 시 mongoose 등 ODM 라이브러리 적용 가능

---

## Swagger(OpenAPI) 문서화 (예정)
- 추후 `/api-docs` 엔드포인트에서 실시간 API 문서 제공 예정
- swagger-jsdoc, swagger-ui-express 등 도입 가능

---

## 문의/기여
- 구조/기능/확장/문서화 등 궁금한 점은 언제든 문의 바랍니다.

---

## 📅 서비스 개요
- 세계 최고 수준의 캘린더 서비스 백엔드
- 플랫폼 내 여러 서비스(메신저, 노트, 파일 등)와 연동 예정
- AI가 읽고 쓰기 쉬운 구조로 설계
- Node.js + Express 기반 RESTful API

## 📁 폴더 구조
```
coming_soon_calendar/
  ├─ src/
  │   ├─ config/           # 환경설정, DB, 외부 API 연동 등
  │   ├─ controllers/      # 라우터별 컨트롤러
  │   ├─ models/           # DB/데이터 모델
  │   ├─ routes/           # API 라우트
  │   ├─ services/         # 비즈니스 로직, 외부 연동
  │   ├─ utils/            # 유틸리티 함수
  │   └─ middlewares/      # 인증, 에러처리 등 미들웨어
  ├─ tests/                # 테스트 코드
  ├─ README.md             # 서비스 설명 및 API 문서
  ├─ package.json
  └─ .env.example          # 환경변수 예시
```

## 🛠️ 주요 기능 (예정)
- 캘린더 생성/수정/삭제
- 일정(이벤트) 생성/수정/삭제/조회 (반복, 알림, 참석자 등)
- 일정 카테고리/색상/태그
- 일정 초대/공유(다른 사용자, 그룹)
- 일정 검색/필터/정렬
- 일정 알림(푸시, 이메일 등)
- 외부 캘린더 API 연동(구글, 애플 등)
- AI 기반 일정 추천/자동 생성/요약/분석(추후)
- 다른 서비스와의 연동(메신저, 파일, 노트 등)

## 🧑‍💻 개발 규칙
- 이 폴더 내에서만 작업 (상위 플랫폼 코드에 영향 X)
- 코드에 상세 주석 필수 (함수/클래스/파일 단위)
- 서비스/기능별로 파일 분리, 체계적 구조 유지
- API/모델/서비스 설계 시 연동성, AI 활용성 고려
- 테스트 코드 작성 권장

## 🔗 연동/확장성
- 모든 데이터 구조는 AI 및 타 서비스가 쉽게 읽고 쓸 수 있도록 설계
- 추후 플랫폼 내 인증/권한 시스템과 연동 예정
- 서비스별 고유 식별자, 표준화된 API 응답 구조 사용

## ✨ 참고
- 구글 캘린더, 애플 캘린더, 아웃룩 등 주요 캘린더 서비스 벤치마킹
- 플랫폼 내 다른 서비스(contacts, notes, tasks 등)와의 연동성 최우선 고려

---

> ⚠️ 이 폴더 외부의 코드는 수정하지 마세요. 플랫폼 전체에 영향이 갈 수 있습니다. 