// 태스크 관리 시스템 설정 상수
export const TASK_CONFIG = {
  // 뷰 타입 정의
  VIEW_TYPES: {
    LIST: 'list',
    KANBAN: 'kanban',
    CALENDAR: 'calendar',
    GANTT: 'gantt',
    TIMELINE: 'timeline',
    TABLE: 'table'
  },

  // 태스크 타입 정의
  TASK_TYPES: {
    TODO: 'todo',
    BUG: 'bug',
    FEATURE: 'feature',
    DOCUMENT: 'document',
    MEETING: 'meeting',
    SURVEY: 'survey',
    REVIEW: 'review'
  },

  // 태스크 상태 정의
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    OVERDUE: 'overdue'
  },

  // 우선순위 정의
  PRIORITY_LEVELS: {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },

  // 태스크 카테고리 정의
  TASK_CATEGORIES: {
    WORK: 'work',
    PERSONAL: 'personal',
    LEARNING: 'learning',
    HEALTH: 'health',
    FINANCE: 'finance',
    OTHER: 'other'
  },

  // 조직 타입 정의
  ORGANIZATION_TYPES: {
    COMPANY: 'company',
    STARTUP: 'startup',
    AGENCY: 'agency',
    NONPROFIT: 'nonprofit',
    PERSONAL: 'personal'
  },

  // 팀 타입 정의
  TEAM_TYPES: {
    DEVELOPMENT: 'development',
    DESIGN: 'design',
    MARKETING: 'marketing',
    SALES: 'sales',
    SUPPORT: 'support',
    HR: 'hr',
    FINANCE: 'finance',
    OPERATIONS: 'operations'
  },

  // 프로젝트 타입 정의
  PROJECT_TYPES: {
    CLIENT: 'client',
    INTERNAL: 'internal',
    PERSONAL: 'personal',
    OPEN_SOURCE: 'open_source'
  },

  // 프로젝트 상태 정의
  PROJECT_STATUS: {
    PLANNING: 'planning',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // 권한 레벨 정의
  PERMISSION_LEVELS: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
    VIEWER: 'viewer'
  },

  // 역할 정의
  ROLES: {
    ORGANIZATION: {
      OWNER: 'owner',
      ADMIN: 'admin',
      MANAGER: 'manager',
      MEMBER: 'member',
      VIEWER: 'viewer'
    },
    TEAM: {
      LEADER: 'leader',
      SENIOR: 'senior',
      MEMBER: 'member',
      INTERN: 'intern'
    },
    PROJECT: {
      OWNER: 'owner',
      ADMIN: 'admin',
      MEMBER: 'member',
      VIEWER: 'viewer'
    }
  },

  // 반복 패턴 정의
  RECURRENCE_PATTERNS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
  },

  // 알림 타입 정의
  NOTIFICATION_TYPES: {
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    TASK_COMPLETED: 'task_completed',
    TASK_OVERDUE: 'task_overdue',
    COMMENT_ADDED: 'comment_added',
    MENTION: 'mention',
    DUE_DATE_REMINDER: 'due_date_reminder',
    PROJECT_UPDATE: 'project_update',
    TEAM_ACTIVITY: 'team_activity'
  },

  // 알림 채널 정의
  NOTIFICATION_CHANNELS: {
    IN_APP: 'in_app',
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms',
    SLACK: 'slack',
    TEAMS: 'teams',
    WEBHOOK: 'webhook'
  },

  // 파일 타입 정의
  ALLOWED_FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    TEXT: ['text/plain', 'text/csv', 'text/markdown'],
    ARCHIVE: ['application/zip', 'application/x-rar-compressed']
  },

  // 기본 설정
  DEFAULT_SETTINGS: {
    view: 'list',
    theme: 'light',
    language: 'ko',
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    compactMode: false,
    showCompleted: true,
    autoSave: true,
    notifications: {
      in_app: true,
      email: true,
      push: false,
      sms: false
    },
    filters: {
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tag: []
    },
    sorting: {
      field: 'created_at',
      order: 'desc'
    },
    pagination: {
      pageSize: 50,
      showPagination: true
    }
  },

  // UI 설정
  UI_SETTINGS: {
    SIDEBAR_WIDTH: {
      MIN: 240,
      MAX: 480,
      DEFAULT: 320
    },
    HEADER_HEIGHT: 64,
    TOOLBAR_HEIGHT: 56,
    CARD_SIZES: {
      SMALL: 'small',
      MEDIUM: 'medium',
      LARGE: 'large'
    },
    DENSITY: {
      COMPACT: 'compact',
      COMFORTABLE: 'comfortable',
      SPACIOUS: 'spacious'
    }
  },

  // 색상 테마 정의
  COLORS: {
    PRIMARY: 'emerald',
    SECONDARY: 'teal',
    STATUS: {
      pending: 'gray',
      in_progress: 'blue',
      review: 'yellow',
      completed: 'green',
      cancelled: 'red',
      overdue: 'red'
    },
    PRIORITY: {
      urgent: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green'
    },
    TYPE: {
      todo: 'blue',
      bug: 'red',
      feature: 'green',
      document: 'purple',
      meeting: 'indigo',
      survey: 'pink',
      review: 'yellow'
    }
  },

  // 아이콘 매핑
  ICONS: {
    TASK_TYPES: {
      todo: 'CheckCircleIcon',
      bug: 'BugAntIcon',
      feature: 'SparklesIcon',
      document: 'DocumentTextIcon',
      meeting: 'UsersIcon',
      survey: 'ClipboardDocumentListIcon',
      review: 'EyeIcon'
    },
    STATUS: {
      pending: 'ClockIcon',
      in_progress: 'ArrowPathIcon',
      review: 'EyeIcon',
      completed: 'CheckCircleIcon',
      cancelled: 'XCircleIcon',
      overdue: 'ExclamationTriangleIcon'
    },
    PRIORITY: {
      urgent: 'ExclamationTriangleIcon',
      high: 'ChevronUpIcon',
      medium: 'MinusIcon',
      low: 'ChevronDownIcon'
    }
  },

  // 검색 설정
  SEARCH_SETTINGS: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_RESULTS: 100,
    SEARCHABLE_FIELDS: [
      'title',
      'description',
      'tags',
      'assignee',
      'project',
      'organization',
      'team'
    ]
  },

  // 성능 설정
  PERFORMANCE_SETTINGS: {
    VIRTUAL_SCROLLING_THRESHOLD: 100,
    LAZY_LOADING_THRESHOLD: 50,
    CACHE_TTL: 300000, // 5분
    BATCH_SIZE: 25,
    DEBOUNCE_DELAY: 300
  },

  // 분석 메트릭 정의
  ANALYTICS_METRICS: {
    PRODUCTIVITY: {
      TASKS_COMPLETED: 'tasks_completed',
      AVERAGE_COMPLETION_TIME: 'average_completion_time',
      OVERDUE_RATE: 'overdue_rate',
      PRODUCTIVITY_SCORE: 'productivity_score'
    },
    TEAM: {
      COLLABORATION_SCORE: 'collaboration_score',
      WORKLOAD_DISTRIBUTION: 'workload_distribution',
      TEAM_VELOCITY: 'team_velocity',
      BURNDOWN_RATE: 'burndown_rate'
    },
    PROJECT: {
      PROGRESS_RATE: 'progress_rate',
      BUDGET_UTILIZATION: 'budget_utilization',
      MILESTONE_COMPLETION: 'milestone_completion',
      RESOURCE_ALLOCATION: 'resource_allocation'
    }
  },

  // 시간 추적 설정
  TIME_TRACKING: {
    MINIMUM_DURATION: 60000, // 1분
    MAXIMUM_DURATION: 28800000, // 8시간
    AUTO_STOP_DURATION: 1800000, // 30분
    BREAK_THRESHOLD: 300000, // 5분
    ROUNDING_INTERVAL: 300000 // 5분 단위로 반올림
  },

  // 협업 설정
  COLLABORATION: {
    MAX_MENTIONS_PER_COMMENT: 10,
    MAX_COMMENT_LENGTH: 2000,
    MAX_ATTACHMENTS_PER_TASK: 20,
    MAX_FILE_SIZE: 52428800, // 50MB
    ACTIVITY_RETENTION_DAYS: 365,
    COMMENT_EDIT_TIME_LIMIT: 1800000 // 30분
  },

  // 백업 및 동기화 설정
  SYNC_SETTINGS: {
    AUTO_SYNC_INTERVAL: 30000, // 30초
    OFFLINE_STORAGE_LIMIT: 10000, // 10,000개 태스크
    CONFLICT_RESOLUTION: 'server_wins',
    SYNC_RETRY_COUNT: 3,
    SYNC_TIMEOUT: 30000 // 30초
  }
};

// 태스크 타입 라벨 매핑
export const TASK_TYPE_LABELS = {
  [TASK_CONFIG.TASK_TYPES.TODO]: 'To-Do',
  [TASK_CONFIG.TASK_TYPES.BUG]: 'Bug',
  [TASK_CONFIG.TASK_TYPES.FEATURE]: 'Feature',
  [TASK_CONFIG.TASK_TYPES.DOCUMENT]: 'Document',
  [TASK_CONFIG.TASK_TYPES.MEETING]: 'Meeting',
  [TASK_CONFIG.TASK_TYPES.SURVEY]: 'Survey',
  [TASK_CONFIG.TASK_TYPES.REVIEW]: 'Review'
};

// 태스크 상태 라벨 매핑
export const TASK_STATUS_LABELS = {
  [TASK_CONFIG.TASK_STATUS.PENDING]: '대기',
  [TASK_CONFIG.TASK_STATUS.IN_PROGRESS]: '진행중',
  [TASK_CONFIG.TASK_STATUS.REVIEW]: '검토중',
  [TASK_CONFIG.TASK_STATUS.COMPLETED]: '완료',
  [TASK_CONFIG.TASK_STATUS.CANCELLED]: '취소',
  [TASK_CONFIG.TASK_STATUS.OVERDUE]: '연체'
};

// 우선순위 라벨 매핑
export const PRIORITY_LABELS = {
  [TASK_CONFIG.PRIORITY_LEVELS.URGENT]: '긴급',
  [TASK_CONFIG.PRIORITY_LEVELS.HIGH]: '높음',
  [TASK_CONFIG.PRIORITY_LEVELS.MEDIUM]: '보통',
  [TASK_CONFIG.PRIORITY_LEVELS.LOW]: '낮음'
};

// 뷰 타입 라벨 매핑
export const VIEW_TYPE_LABELS = {
  [TASK_CONFIG.VIEW_TYPES.LIST]: '리스트',
  [TASK_CONFIG.VIEW_TYPES.KANBAN]: '칸반',
  [TASK_CONFIG.VIEW_TYPES.CALENDAR]: '캘린더',
  [TASK_CONFIG.VIEW_TYPES.GANTT]: '간트차트',
  [TASK_CONFIG.VIEW_TYPES.TIMELINE]: '타임라인',
  [TASK_CONFIG.VIEW_TYPES.TABLE]: '테이블'
};

// 프로젝트 타입 라벨 매핑
export const PROJECT_TYPE_LABELS = {
  [TASK_CONFIG.PROJECT_TYPES.CLIENT]: '클라이언트',
  [TASK_CONFIG.PROJECT_TYPES.INTERNAL]: '내부',
  [TASK_CONFIG.PROJECT_TYPES.PERSONAL]: '개인',
  [TASK_CONFIG.PROJECT_TYPES.OPEN_SOURCE]: '오픈소스'
};

// 조직 타입 라벨 매핑
export const ORGANIZATION_TYPE_LABELS = {
  [TASK_CONFIG.ORGANIZATION_TYPES.COMPANY]: '회사',
  [TASK_CONFIG.ORGANIZATION_TYPES.STARTUP]: '스타트업',
  [TASK_CONFIG.ORGANIZATION_TYPES.AGENCY]: '에이전시',
  [TASK_CONFIG.ORGANIZATION_TYPES.NONPROFIT]: '비영리',
  [TASK_CONFIG.ORGANIZATION_TYPES.PERSONAL]: '개인'
};

// 팀 타입 라벨 매핑
export const TEAM_TYPE_LABELS = {
  [TASK_CONFIG.TEAM_TYPES.DEVELOPMENT]: '개발',
  [TASK_CONFIG.TEAM_TYPES.DESIGN]: '디자인',
  [TASK_CONFIG.TEAM_TYPES.MARKETING]: '마케팅',
  [TASK_CONFIG.TEAM_TYPES.SALES]: '영업',
  [TASK_CONFIG.TEAM_TYPES.SUPPORT]: '지원',
  [TASK_CONFIG.TEAM_TYPES.HR]: '인사',
  [TASK_CONFIG.TEAM_TYPES.FINANCE]: '재무',
  [TASK_CONFIG.TEAM_TYPES.OPERATIONS]: '운영'
};

// 역할 라벨 매핑
TASK_CONFIG.ROLE_LABELS = {
  [TASK_CONFIG.ROLES.ORGANIZATION.OWNER]: '소유자',
  [TASK_CONFIG.ROLES.ORGANIZATION.ADMIN]: '관리자',
  [TASK_CONFIG.ROLES.ORGANIZATION.MANAGER]: '매니저',
  [TASK_CONFIG.ROLES.ORGANIZATION.MEMBER]: '멤버',
  [TASK_CONFIG.ROLES.ORGANIZATION.VIEWER]: '뷰어'
};

// 역할 설명 매핑
TASK_CONFIG.ROLE_DESCRIPTIONS = {
  [TASK_CONFIG.ROLES.ORGANIZATION.OWNER]: '조직의 모든 권한을 가지며, 조직 설정과 결제를 관리할 수 있습니다.',
  [TASK_CONFIG.ROLES.ORGANIZATION.ADMIN]: '조직 관리 권한을 가지며, 멤버와 프로젝트를 관리할 수 있습니다.',
  [TASK_CONFIG.ROLES.ORGANIZATION.MANAGER]: '팀과 프로젝트를 관리하며, 태스크를 할당하고 진행상황을 추적할 수 있습니다.',
  [TASK_CONFIG.ROLES.ORGANIZATION.MEMBER]: '태스크를 생성하고 편집하며, 프로젝트에 참여할 수 있습니다.',
  [TASK_CONFIG.ROLES.ORGANIZATION.VIEWER]: '읽기 전용 권한으로 태스크와 프로젝트를 볼 수 있습니다.'
};

// 역할별 권한 매핑
TASK_CONFIG.ROLE_PERMISSIONS = {
  [TASK_CONFIG.ROLES.ORGANIZATION.OWNER]: [
    '조직 설정 관리',
    '결제 및 구독 관리',
    '모든 멤버 관리',
    '모든 프로젝트 관리',
    '모든 태스크 관리',
    '분석 및 리포트 접근',
    '백업 및 복원',
    'API 키 관리'
  ],
  [TASK_CONFIG.ROLES.ORGANIZATION.ADMIN]: [
    '멤버 초대 및 제거',
    '역할 권한 변경',
    '프로젝트 생성 및 삭제',
    '팀 관리',
    '태스크 관리',
    '분석 및 리포트 접근',
    '조직 설정 일부 변경'
  ],
  [TASK_CONFIG.ROLES.ORGANIZATION.MANAGER]: [
    '팀 멤버 관리',
    '프로젝트 관리',
    '태스크 할당',
    '진행상황 추적',
    '팀 분석 접근',
    '워크플로우 관리'
  ],
  [TASK_CONFIG.ROLES.ORGANIZATION.MEMBER]: [
    '태스크 생성 및 편집',
    '파일 첨부',
    '댓글 작성',
    '시간 추적',
    '개인 대시보드 접근',
    '프로젝트 참여'
  ],
  [TASK_CONFIG.ROLES.ORGANIZATION.VIEWER]: [
    '태스크 및 프로젝트 조회',
    '댓글 조회',
    '파일 다운로드',
    '기본 분석 조회'
  ]
};

export default TASK_CONFIG;