# 다중 채널 알림 및 분야별 맞춤 모듈 기능

## 📋 목차

1. [다중 채널 알림 시스템](#다중-채널-알림-시스템)
2. [분야별 맞춤 모듈 시스템](#분야별-맞춤-모듈-시스템)
3. [API 문서](#api-문서)
4. [설치 및 설정](#설치-및-설정)
5. [사용 예제](#사용-예제)
6. [테스트](#테스트)

---

## 🔔 다중 채널 알림 시스템

### 개요
다중 채널 알림 시스템은 이메일, 푸시 알림, SMS, 앱 내 알림을 통합하여 효율적인 커뮤니케이션을 제공합니다. 긴급 공지 기능을 통해 중요한 메시지를 즉시 전달할 수 있습니다.

### 주요 기능

#### 1. 다중 채널 지원
- **이메일**: HTML/텍스트 템플릿, 다양한 스타일 지원
- **푸시 알림**: FCM, APNS 연동, 액션 버튼 지원
- **SMS**: 문자 메시지 발송, 발신자 설정
- **앱 내 알림**: 실시간 알림, 자동 해제 설정

#### 2. 긴급 공지 시스템
- **배너/모달/토스트/전체화면** 표시 옵션
- **확인 필수** 설정
- **우선순위** 기반 표시
- **자동 스타일링** (색상, 아이콘)

#### 3. 스마트 수신자 관리
- 특정 사용자/그룹 대상
- 캘린더/이벤트 참석자 자동 선택
- 제외 사용자 설정
- 커스텀 쿼리 지원

#### 4. 고급 스케줄링
- 즉시/예약 발송
- 반복 알림 (일/주/월/년)
- 타임존 지원
- 최대 반복 횟수 설정

### 알림 타입

| 타입 | 설명 | 사용 사례 |
|------|------|-----------|
| `event_reminder` | 이벤트 알림 | 일정 시작 전 알림 |
| `event_update` | 이벤트 업데이트 | 일정 변경 알림 |
| `event_cancellation` | 이벤트 취소 | 일정 취소 알림 |
| `rsvp_request` | 참석 요청 | 초대장 발송 |
| `rsvp_response` | 참석 응답 | 참석 여부 알림 |
| `attendee_update` | 참석자 업데이트 | 참석자 변경 알림 |
| `calendar_share` | 캘린더 공유 | 캘린더 공유 알림 |
| `system_notice` | 시스템 공지 | 시스템 점검 알림 |
| `urgent_notice` | 긴급 공지 | 긴급한 공지사항 |
| `custom` | 커스텀 알림 | 사용자 정의 알림 |

### 우선순위 레벨

| 우선순위 | 설명 | 표시 스타일 |
|----------|------|-------------|
| `low` | 낮음 | 일반 스타일 |
| `normal` | 보통 | 기본 스타일 |
| `high` | 높음 | 강조 스타일 |
| `urgent` | 긴급 | 빨간색 배경 |
| `critical` | 중요 | 깜빡이는 효과 |

---

## 🧩 분야별 맞춤 모듈 시스템

### 개요
분야별 맞춤 모듈 시스템은 비즈니스, 교육, 의료, 정부 등 다양한 분야에 특화된 기능을 제공하는 확장 가능한 모듈 아키텍처입니다.

### 주요 기능

#### 1. 모듈 카테고리
- **비즈니스**: 회의 스케줄러, 자원 예약, 승인 워크플로우
- **교육**: 수업 스케줄링, 학생 출석, 시험 일정
- **의료**: 진료 예약, 의사 가용성, 환자 기록
- **정부**: 공무원 일정, 민원 처리, 공지사항
- **비영리**: 봉사 일정, 기부 관리, 이벤트 조직
- **개인**: 개인 일정, 목표 관리, 습관 추적
- **커스텀**: 사용자 정의 모듈

#### 2. 모듈 타입
- **calendar_extension**: 캘린더 기능 확장
- **event_template**: 이벤트 템플릿
- **workflow**: 워크플로우 자동화
- **integration**: 외부 시스템 연동
- **analytics**: 데이터 분석
- **automation**: 자동화 기능
- **custom**: 커스텀 모듈

#### 3. 고급 기능
- **동적 스키마 생성**: 모듈별 데이터베이스 스키마
- **API 자동 생성**: 모듈별 REST API 엔드포인트
- **워크플로우 엔진**: 비즈니스 프로세스 자동화
- **웹훅 시스템**: 실시간 이벤트 알림
- **분석 대시보드**: 모듈별 통계 및 분석
- **의존성 관리**: 모듈 간 의존성 처리

### 모듈 생명주기

1. **개발**: 모듈 생성 및 기능 구현
2. **검증**: 모듈 데이터 검증
3. **테스트**: 기능 테스트 및 품질 검증
4. **배포**: 공개 또는 비공개 배포
5. **설치**: 사용자별 모듈 설치
6. **활성화**: 모듈 기능 활성화
7. **모니터링**: 사용 현황 및 성능 모니터링
8. **업데이트**: 버전 업데이트 및 기능 개선

---

## 📚 API 문서

### 알림 API

#### 알림 생성
```http
POST /api/notifications
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "긴급 공지",
  "message": "시스템 점검이 예정되어 있습니다.",
  "type": "urgent_notice",
  "category": "announcement",
  "priority": "urgent",
  "channels": {
    "email": { "enabled": true, "template": "urgent" },
    "push": { "enabled": true, "sound": "urgent" },
    "sms": { "enabled": true },
    "inApp": { "enabled": true }
  },
  "recipients": {
    "type": "all_users"
  },
  "scheduling": { "sendImmediately": true },
  "urgentNotice": {
    "enabled": true,
    "displayType": "banner",
    "backgroundColor": "#ff4444",
    "requireAcknowledgment": true
  }
}
```

#### 알림 목록 조회
```http
GET /api/notifications?page=1&limit=20&priority=urgent&type=urgent_notice
Authorization: Bearer <token>
```

#### 긴급 공지 조회
```http
GET /api/notifications/urgent
Authorization: Bearer <token>
```

#### 알림 발송
```http
POST /api/notifications/:id/send
Authorization: Bearer <token>
```

### 모듈 API

#### 모듈 생성
```http
POST /api/modules
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "business_calendar",
  "displayName": "비즈니스 캘린더",
  "description": "기업용 캘린더 확장 모듈",
  "category": "business",
  "type": "calendar_extension",
  "features": [
    { "name": "meeting_scheduler", "description": "회의 스케줄러" },
    { "name": "resource_booking", "description": "자원 예약 시스템" }
  ],
  "configuration": {
    "isPublic": true,
    "maxUsers": 1000
  },
  "ui": {
    "icon": "business",
    "color": "#28a745",
    "position": "sidebar"
  }
}
```

#### 모듈 목록 조회
```http
GET /api/modules?category=business&type=calendar_extension&isPublic=true
Authorization: Bearer <token>
```

#### 모듈 설치
```http
POST /api/modules/:id/install
Authorization: Bearer <token>
```

#### 모듈 활성화/비활성화
```http
PATCH /api/modules/:id/toggle
Content-Type: application/json
Authorization: Bearer <token>

{
  "enabled": true
}
```

---

## ⚙️ 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```env
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/calendar
MONGODB_URI_TEST=mongodb://localhost:27017/calendar_test

# 이메일 서비스 (선택사항)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# 푸시 알림 (선택사항)
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_PRIVATE_KEY=your-apns-private-key

# SMS 서비스 (선택사항)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 3. 데이터베이스 초기화
```bash
npm run db:init
```

### 4. 서버 시작
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

---

## 💡 사용 예제

### 긴급 공지 발송
```javascript
const notificationData = {
  title: '🚨 긴급 공지',
  message: '시스템 점검이 오늘 밤 12시부터 2시간 동안 진행됩니다.',
  type: 'urgent_notice',
  category: 'maintenance',
  priority: 'urgent',
  channels: {
    email: { enabled: true, template: 'urgent' },
    push: { enabled: true, sound: 'urgent' },
    sms: { enabled: true },
    inApp: { enabled: true }
  },
  recipients: { type: 'all_users' },
  scheduling: { sendImmediately: true },
  urgentNotice: {
    enabled: true,
    displayType: 'banner',
    backgroundColor: '#ff4444',
    requireAcknowledgment: true
  }
};

const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(notificationData)
});
```

### 비즈니스 모듈 설치
```javascript
// 1. 모듈 생성
const moduleData = {
  name: 'meeting_manager',
  displayName: '회의 관리자',
  description: '회의 스케줄링 및 관리 모듈',
  category: 'business',
  type: 'calendar_extension',
  features: [
    { name: 'meeting_scheduler', description: '회의 스케줄러' },
    { name: 'room_booking', description: '회의실 예약' },
    { name: 'attendee_management', description: '참석자 관리' }
  ],
  configuration: {
    isPublic: true,
    maxUsers: 500
  }
};

const createResponse = await fetch('/api/modules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify(moduleData)
});

// 2. 모듈 설치
const moduleId = createResponse.data._id;
const installResponse = await fetch(`/api/modules/${moduleId}/install`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

### 예약 알림 설정
```javascript
const scheduledNotification = {
  title: '회의 알림',
  message: '30분 후 회의가 시작됩니다.',
  type: 'event_reminder',
  category: 'event',
  channels: {
    email: { enabled: true },
    push: { enabled: true },
    inApp: { enabled: true }
  },
  recipients: {
    type: 'event_attendees',
    eventIds: ['event-id-here']
  },
  scheduling: {
    sendImmediately: false,
    scheduledAt: new Date(Date.now() + 30 * 60 * 1000) // 30분 후
  }
};
```

---

## 🧪 테스트

### 테스트 실행
```bash
# 전체 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test notifications.api.test.js
npm test modules.api.test.js

# 테스트 커버리지 확인
npm run test:coverage
```

### 테스트 구조
```
tests/
├── notifications.api.test.js    # 알림 API 테스트
├── modules.api.test.js          # 모듈 API 테스트
└── integration/                 # 통합 테스트
    ├── notification-flow.test.js
    └── module-workflow.test.js
```

### 주요 테스트 케이스

#### 알림 시스템
- ✅ 알림 생성 및 발송
- ✅ 다중 채널 발송
- ✅ 긴급 공지 기능
- ✅ 예약 알림
- ✅ 수신자 필터링
- ✅ 알림 템플릿

#### 모듈 시스템
- ✅ 모듈 생성 및 관리
- ✅ 모듈 설치/제거
- ✅ 모듈 활성화/비활성화
- ✅ 의존성 관리
- ✅ 모듈 평가 시스템
- ✅ 카테고리별 분류

---

## 🔧 고급 설정

### 커스텀 알림 템플릿
```javascript
// 이메일 템플릿 커스터마이징
const customEmailTemplate = {
  template: 'custom',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">{{title}}</h2>
      <p style="color: #666;">{{message}}</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>발송 시간:</strong> {{sentAt}}</p>
        <p><strong>우선순위:</strong> {{priority}}</p>
      </div>
    </div>
  `
};
```

### 워크플로우 자동화
```javascript
// 모듈 워크플로우 정의
const workflow = {
  name: 'meeting_approval',
  description: '회의 승인 워크플로우',
  trigger: {
    type: 'event',
    event: 'meeting_created'
  },
  steps: [
    {
      name: 'manager_approval',
      type: 'action',
      config: {
        action: 'send_approval_request',
        recipients: 'managers',
        template: 'approval_request'
      },
      order: 1
    },
    {
      name: 'check_approval',
      type: 'condition',
      config: {
        condition: 'approval_status === approved',
        onTrue: 'schedule_meeting',
        onFalse: 'notify_cancellation'
      },
      order: 2
    }
  ]
};
```

---

## 📊 모니터링 및 분석

### 알림 통계
- 발송 성공률
- 채널별 성능
- 수신자 참여도
- 긴급 공지 효과

### 모듈 사용 현황
- 설치된 모듈 수
- 사용자별 모듈 사용량
- 모듈 평가 및 피드백
- 인기 모듈 순위

### 대시보드
```javascript
// 관리자 대시보드 데이터
const dashboardData = {
  notifications: {
    total: 1250,
    sent: 1200,
    failed: 50,
    successRate: 96.0
  },
  modules: {
    total: 45,
    active: 38,
    installations: 1250,
    averageRating: 4.2
  },
  urgentNotices: {
    sent: 15,
    acknowledged: 1200,
    acknowledgmentRate: 95.2
  }
};
```

---

## 🚀 성능 최적화

### 알림 발송 최적화
- 배치 처리로 대량 발송
- 채널별 병렬 처리
- 재시도 메커니즘
- 발송 속도 제한

### 모듈 성능 최적화
- 지연 로딩
- 캐싱 전략
- 데이터베이스 인덱싱
- 리소스 사용량 모니터링

---

## 🔒 보안 고려사항

### 알림 보안
- 수신자 권한 검증
- 발송 제한 설정
- 민감 정보 암호화
- 스팸 방지

### 모듈 보안
- 모듈 검증 및 승인
- 권한 기반 접근 제어
- 코드 실행 환경 격리
- 의존성 보안 검사

---

## 📞 지원 및 문의

### 기술 지원
- 이메일: support@calendar.com
- 문서: https://docs.calendar.com
- 커뮤니티: https://community.calendar.com

### 버그 리포트
- GitHub Issues: https://github.com/calendar/notifications/issues
- 기능 요청: https://github.com/calendar/notifications/feature-requests

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**© 2024 Calendar System. All rights reserved.** 