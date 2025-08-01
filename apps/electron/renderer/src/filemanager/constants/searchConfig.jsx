/**
 * 검색 관련 설정 상수
 */

// API 엔드포인트
export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:5000/api/tools/ultra-fast-search',
  INDEX: '/index',
  SAVE: '/save',
  LOAD: '/load',
  STOP: '/stop',
  SEARCH: '',
};

// 검색 설정
export const SEARCH_CONFIG = {
  // 결과 페이지네이션
  ITEMS_PER_PAGE: {
    LIST: 50,
    GRID: 48,
  },
  
  // 검색 히스토리
  HISTORY: {
    MAX_ITEMS: 20,
    STORAGE_KEY: 'fileSearchHistory',
  },
  
  // 검색 디바운스 (밀리초)
  DEBOUNCE_DELAY: 300,
  
  // 최대 검색 결과 수
  MAX_RESULTS: 10000,
  
  // 검색 타임아웃 (밀리초)
  SEARCH_TIMEOUT: 30000,
};

// 날짜 필터 프리셋
export const DATE_PRESETS = [
  {
    id: 'today',
    name: '오늘',
    days: 1,
    icon: '📅',
  },
  {
    id: 'yesterday',
    name: '어제',
    days: 2,
    from: -2,
    to: -1,
  },
  {
    id: 'week',
    name: '최근 7일',
    days: 7,
    icon: '📅',
  },
  {
    id: 'month',
    name: '최근 30일',
    days: 30,
    icon: '📅',
  },
  {
    id: 'quarter',
    name: '최근 3개월',
    days: 90,
    icon: '📅',
  },
  {
    id: 'year',
    name: '최근 1년',
    days: 365,
    icon: '📅',
  },
];

// 파일 크기 프리셋
export const SIZE_PRESETS = [
  {
    id: 'small',
    name: '작은 파일 (< 1MB)',
    max: 1024 * 1024,
    icon: '📄',
  },
  {
    id: 'medium',
    name: '중간 파일 (1MB - 10MB)',
    min: 1024 * 1024,
    max: 10 * 1024 * 1024,
    icon: '📄',
  },
  {
    id: 'large',
    name: '큰 파일 (10MB - 100MB)',
    min: 10 * 1024 * 1024,
    max: 100 * 1024 * 1024,
    icon: '📄',
  },
  {
    id: 'huge',
    name: '거대한 파일 (> 100MB)',
    min: 100 * 1024 * 1024,
    icon: '📄',
  },
];

// 정렬 옵션
export const SORT_OPTIONS = [
  {
    id: 'name',
    name: '이름',
    field: 'name',
    icon: '🔤',
  },
  {
    id: 'size',
    name: '크기',
    field: 'size',
    icon: '📏',
  },
  {
    id: 'date',
    name: '수정일',
    field: 'mtime',
    icon: '📅',
  },
  {
    id: 'extension',
    name: '확장자',
    field: 'ext',
    icon: '🏷️',
  },
];

// 뷰 모드
export const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid',
  CARD: 'card',
};

// 뷰 모드 옵션
export const VIEW_MODE_OPTIONS = [
  {
    id: VIEW_MODES.LIST,
    name: '리스트 뷰',
    icon: '📋',
  },
  {
    id: VIEW_MODES.GRID,
    name: '그리드 뷰',
    icon: '⚏',
  },
  {
    id: VIEW_MODES.CARD,
    name: '카드 뷰',
    icon: '🗃️',
  },
];

// 검색 필터 타입
export const FILTER_TYPES = {
  NAME: 'name',
  EXTENSION: 'ext',
  SIZE: 'size',
  DATE: 'date',
  CONTENT: 'content',
};

// 검색 연산자
export const SEARCH_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  EXACT: 'EXACT',
  WILDCARD: 'WILDCARD',
  REGEX: 'REGEX',
};

// 인덱스 상태
export const INDEX_STATUS = {
  NOT_LOADED: 'not-loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
};

// 검색 상태
export const SEARCH_STATUS = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  SUCCESS: 'success',
  ERROR: 'error',
};

// 오류 메시지
export const ERROR_MESSAGES = {
  NO_INDEX: '인덱스가 로드되지 않았습니다. 먼저 디렉토리를 인덱싱해주세요.',
  SEARCH_FAILED: '검색 중 오류가 발생했습니다.',
  INDEX_FAILED: '인덱싱 중 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  INVALID_PARAMS: '검색 조건이 올바르지 않습니다.',
  NO_RESULTS: '검색 결과가 없습니다.',
  TIMEOUT: '검색 시간이 초과되었습니다.',
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  INDEX_STARTED: '인덱싱이 시작되었습니다.',
  INDEX_SAVED: '인덱스가 저장되었습니다.',
  INDEX_LOADED: '인덱스가 로드되었습니다.',
  SEARCH_COMPLETED: '검색이 완료되었습니다.',
  WATCH_STARTED: '파일 감시가 시작되었습니다.',
  WATCH_STOPPED: '파일 감시가 중지되었습니다.',
};

// 정보 메시지
export const INFO_MESSAGES = {
  NO_SEARCH_TERMS: '검색 조건을 입력해주세요.',
  INDEXING_PROGRESS: '인덱싱 진행 중...',
  SEARCH_PROGRESS: '검색 진행 중...',
  EMPTY_DIRECTORY: '선택된 디렉토리가 비어있습니다.',
};

// 키보드 단축키
export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'Ctrl+F',
  CLEAR: 'Ctrl+L',
  TOGGLE_PANEL: 'Ctrl+B',
  PREVIOUS_PAGE: 'Ctrl+Left',
  NEXT_PAGE: 'Ctrl+Right',
  SELECT_ALL: 'Ctrl+A',
  COPY_PATH: 'Ctrl+C',
  OPEN_FILE: 'Enter',
  OPEN_FOLDER: 'Ctrl+Enter',
};

// 색상 테마
export const COLORS = {
  PRIMARY: 'blue',
  SECONDARY: 'gray',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'blue',
};

// 애니메이션 설정
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
  },
  EASING: {
    EASE_OUT: 'ease-out',
    EASE_IN: 'ease-in',
    EASE_IN_OUT: 'ease-in-out',
  },
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  SEARCH_HISTORY: 'fileSearchHistory',
  SEARCH_PREFERENCES: 'fileSearchPreferences',
  VIEW_MODE: 'fileSearchViewMode',
  SORT_SETTINGS: 'fileSearchSortSettings',
  FILTER_SETTINGS: 'fileSearchFilterSettings',
};

// 기본 설정
export const DEFAULT_SETTINGS = {
  viewMode: VIEW_MODES.LIST,
  sortBy: 'name',
  sortOrder: 'asc',
  itemsPerPage: SEARCH_CONFIG.ITEMS_PER_PAGE.LIST,
  showHidden: false,
  caseSensitive: false,
  useRegex: false,
  autoSearch: true,
  saveHistory: true,
};

export default {
  API_ENDPOINTS,
  SEARCH_CONFIG,
  DATE_PRESETS,
  SIZE_PRESETS,
  SORT_OPTIONS,
  VIEW_MODES,
  VIEW_MODE_OPTIONS,
  FILTER_TYPES,
  SEARCH_OPERATORS,
  INDEX_STATUS,
  SEARCH_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  KEYBOARD_SHORTCUTS,
  COLORS,
  ANIMATIONS,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
};