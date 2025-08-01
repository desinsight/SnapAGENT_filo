/**
 * 즐겨찾기 설정 상수
 * 
 * @description 즐겨찾기 기능에서 사용되는 상수 및 설정값들
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 즐겨찾기 타입
 */
export const BOOKMARK_TYPES = {
  BOOKMARK: 'bookmark',
  FAVORITE: 'favorite',
  STAR: 'star'
};

/**
 * 뷰 모드
 */
export const BOOKMARK_VIEWS = {
  GRID: 'grid',
  LIST: 'list'
};

/**
 * 정렬 옵션
 */
export const SORT_OPTIONS = {
  BOOKMARKED_AT: 'bookmarkedAt',
  UPDATED_AT: 'updatedAt',
  CREATED_AT: 'createdAt',
  TITLE: 'title',
  PRIORITY: 'priority',
  VIEW_COUNT: 'viewCount'
};

/**
 * 우선순위 레벨
 */
export const PRIORITY_LEVELS = {
  VERY_HIGH: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  VERY_LOW: 1
};

/**
 * 우선순위 라벨
 */
export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.VERY_HIGH]: '매우 높음',
  [PRIORITY_LEVELS.HIGH]: '높음',
  [PRIORITY_LEVELS.MEDIUM]: '보통',
  [PRIORITY_LEVELS.LOW]: '낮음',
  [PRIORITY_LEVELS.VERY_LOW]: '매우 낮음'
};

/**
 * 우선순위 색상
 */
export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.VERY_HIGH]: {
    text: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-300',
    ring: 'ring-red-500'
  },
  [PRIORITY_LEVELS.HIGH]: {
    text: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    ring: 'ring-orange-500'
  },
  [PRIORITY_LEVELS.MEDIUM]: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    ring: 'ring-yellow-500'
  },
  [PRIORITY_LEVELS.LOW]: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-300',
    ring: 'ring-green-500'
  },
  [PRIORITY_LEVELS.VERY_LOW]: {
    text: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    ring: 'ring-blue-500'
  }
};

/**
 * 필터 옵션
 */
export const FILTER_OPTIONS = {
  TYPE: {
    ALL: '',
    PERSONAL: 'personal',
    SHARED: 'shared'
  },
  PRIORITY: {
    ALL: '',
    HIGH: '4,5',
    MEDIUM: '3',
    LOW: '1,2'
  },
  DATE_RANGE: {
    ALL: '',
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
  }
};

/**
 * 컬렉션 아이콘
 */
export const COLLECTION_ICONS = {
  BOOKMARK: {
    id: 'bookmark',
    name: '북마크',
    path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
  },
  FOLDER: {
    id: 'folder',
    name: '폴더',
    path: 'M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z'
  },
  HEART: {
    id: 'heart',
    name: '하트',
    path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
  },
  TAG: {
    id: 'tag',
    name: '태그',
    path: 'M7 7a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2V7zM4 12a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z'
  },
  LIGHTNING: {
    id: 'lightning',
    name: '번개',
    path: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  FIRE: {
    id: 'fire',
    name: '불꽃',
    path: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
  },
  ARCHIVE: {
    id: 'archive',
    name: '아카이브',
    path: 'M5 8a2 2 0 012-2h6a2 2 0 012 2v1a2 2 0 002 2h2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h2a2 2 0 002-2V8z'
  },
  COLLECTION: {
    id: 'collection',
    name: '컬렉션',
    path: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z'
  }
};

/**
 * 컬렉션 색상 팔레트
 */
export const COLLECTION_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#8B5A2B', // Brown
  '#6366F1', // Indigo
  '#059669'  // Green
];

/**
 * 페이지네이션 설정
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10
};

/**
 * 검색 설정
 */
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50
};

/**
 * 캐시 설정
 */
export const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5분
  MAX_SIZE: 100
};

/**
 * 애니메이션 설정
 */
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
};

/**
 * 키보드 단축키
 */
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_VIEW: 'v',
  SEARCH: '/',
  REFRESH: 'r',
  SELECT_ALL: 'a',
  DELETE: 'Delete',
  ESCAPE: 'Escape'
};

/**
 * 드래그 앤 드롭 설정
 */
export const DRAG_DROP_CONFIG = {
  TYPES: {
    BOOKMARK: 'bookmark',
    COLLECTION: 'collection'
  },
  DROP_ZONES: {
    COLLECTION: 'collection',
    TRASH: 'trash',
    QUICK_ACCESS: 'quick-access'
  }
};

/**
 * 익스포트/임포트 설정
 */
export const EXPORT_IMPORT_CONFIG = {
  FORMATS: {
    JSON: 'json',
    CSV: 'csv',
    HTML: 'html'
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.json', '.csv', '.html']
};

/**
 * 기본 설정값
 */
export const DEFAULT_SETTINGS = {
  viewMode: BOOKMARK_VIEWS.GRID,
  sortBy: SORT_OPTIONS.BOOKMARKED_AT,
  pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
  showQuickAccess: true,
  showStats: false,
  autoRefresh: false,
  refreshInterval: 30000, // 30초
  enableNotifications: true,
  enableAnimations: true
};

/**
 * 통계 차트 설정
 */
export const STATS_CONFIG = {
  CHART_TYPES: {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie',
    DOUGHNUT: 'doughnut'
  },
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    SUCCESS: '#059669',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4'
  }
};

/**
 * 알림 설정
 */
export const NOTIFICATION_CONFIG = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  DURATION: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 7000
  },
  POSITION: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left'
  }
};

/**
 * 접근성 설정
 */
export const ACCESSIBILITY_CONFIG = {
  FOCUS_VISIBLE_CLASS: 'focus-visible',
  SKIP_LINK_ID: 'skip-to-content',
  ARIA_LIVE_REGION_ID: 'aria-live-region',
  HIGH_CONTRAST_CLASS: 'high-contrast',
  REDUCED_MOTION_CLASS: 'reduced-motion'
};

/**
 * 반응형 브레이크포인트
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

/**
 * 로컬 스토리지 키
 */
export const STORAGE_KEYS = {
  VIEW_MODE: 'bookmarkViewMode',
  SORT_BY: 'bookmarkSortBy',
  FILTERS: 'bookmarkFilters',
  SETTINGS: 'bookmarkSettings',
  CACHE: 'bookmarkCache'
};