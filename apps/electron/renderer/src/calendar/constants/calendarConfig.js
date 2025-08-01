// 캘린더 설정 상수
export const CALENDAR_CONFIG = {
  // 뷰 타입
  VIEW_TYPES: {
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day',
    LIST: 'list',
    AGENDA: 'agenda'
  },

  // 이벤트 우선순위
  PRIORITY_LEVELS: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
    CRITICAL: 'critical'
  },

  // 이벤트 타입
  EVENT_TYPES: {
    MEETING: 'meeting',
    APPOINTMENT: 'appointment',
    REMINDER: 'reminder',
    TASK: 'task',
    EVENT: 'event',
    HOLIDAY: 'holiday'
  },

  // 알림 타입
  NOTIFICATION_TYPES: {
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms',
    IN_APP: 'in_app'
  },

  // 반복 패턴
  RECURRENCE_PATTERNS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
  },

  // 참석자 상태
  ATTENDEE_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    TENTATIVE: 'tentative'
  },

  // 캘린더 권한
  CALENDAR_PERMISSIONS: {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    MANAGE: 'manage',
    ADMIN: 'admin'
  },

  // 시간 형식
  TIME_FORMATS: {
    '12H': '12h',
    '24H': '24h'
  },

  // 주 시작일
  WEEK_START: {
    SUNDAY: 0,
    MONDAY: 1
  },

  // 색상 팔레트
  COLOR_PALETTE: [
    '#3B82F6', // 파란색
    '#10B981', // 초록색
    '#F59E0B', // 주황색
    '#EF4444', // 빨간색
    '#8B5CF6', // 보라색
    '#EC4899', // 핑크색
    '#06B6D4', // 청록색
    '#84CC16', // 라임색
    '#F97316', // 오렌지색
    '#6366F1'  // 인디고색
  ],

  // 기본 설정
  DEFAULT_SETTINGS: {
    view: 'month',
    timeFormat: '24h',
    weekStart: 1, // 월요일
    showWeekNumbers: false,
    showHolidays: true,
    defaultEventDuration: 60, // 분
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    timezone: 'Asia/Seoul'
  },

  // 애니메이션 지속시간
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },

  // 반응형 브레이크포인트
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280
  }
};

// 한국어 로케일 설정
export const KOREAN_LOCALE = {
  months: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthsShort: [
    '1', '2', '3', '4', '5', '6',
    '7', '8', '9', '10', '11', '12'
  ],
  weekdays: [
    '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'
  ],
  weekdaysShort: [
    '일', '월', '화', '수', '목', '금', '토'
  ],
  weekdaysMin: [
    '일', '월', '화', '수', '목', '금', '토'
  ],
  today: '오늘',
  clear: '지우기',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'YYYY-MM-DD HH:mm'
};

// 모듈 카테고리
export const MODULE_CATEGORIES = {
  BUSINESS: 'business',
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare',
  GOVERNMENT: 'government',
  NONPROFIT: 'nonprofit',
  PERSONAL: 'personal',
  CUSTOM: 'custom'
};