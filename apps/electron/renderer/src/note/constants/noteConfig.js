/**
 * 노트 서비스 설정 및 상수
 * 
 * @description 노트 기능의 기본 설정, 옵션, 상수값들을 정의
 * @author AI Assistant
 * @version 1.0.0
 */

// 노트 카테고리 정의
export const NOTE_CATEGORIES = [
  { id: '개인', label: '개인', color: 'blue', icon: 'UserIcon' },
  { id: '업무', label: '업무', color: 'green', icon: 'BriefcaseIcon' },
  { id: '학습', label: '학습', color: 'purple', icon: 'AcademicCapIcon' },
  { id: '아이디어', label: '아이디어', color: 'yellow', icon: 'LightBulbIcon' },
  { id: '할일', label: '할일', color: 'red', icon: 'CheckSquareIcon' },
  { id: '기타', label: '기타', color: 'gray', icon: 'FolderIcon' }
];

// 노트 상태
export const NOTE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// 뷰 모드 옵션
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

// 정렬 옵션
export const SORT_OPTIONS = [
  { id: 'updated_desc', label: '최근 수정순', field: 'updatedAt', order: 'desc' },
  { id: 'created_desc', label: '최근 생성순', field: 'createdAt', order: 'desc' },
  { id: 'title_asc', label: '제목순 (A-Z)', field: 'title', order: 'asc' },
  { id: 'title_desc', label: '제목순 (Z-A)', field: 'title', order: 'desc' },
  { id: 'category_asc', label: '카테고리순', field: 'category', order: 'asc' }
];

// 에디터 설정
export const EDITOR_CONFIG = {
  AUTO_SAVE_DELAY: 60000, // 60초 후 자동 저장
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 50000,
  MAX_SUMMARY_LENGTH: 500,
  PREVIEW_LENGTH: 150,
  SUPPORTED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'],
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
};

// AI 기능 설정
export const AI_FEATURES = {
  SPELL_CHECK: 'spell_check',
  TAG_RECOMMENDATION: 'tag_recommendation',
  SUMMARY_GENERATION: 'summary_generation',
  HIGHLIGHT_GENERATION: 'highlight_generation',
  FULL_ANALYSIS: 'full_analysis'
};

// 필터 옵션
export const FILTER_OPTIONS = [
  { id: 'all', label: '전체', icon: 'ViewGridIcon' },
  { id: 'favorites', label: '즐겨찾기', icon: 'StarIcon' },
  { id: 'recent', label: '최근 7일', icon: 'ClockIcon' },
  { id: 'encrypted', label: '암호화됨', icon: 'LockClosedIcon' },
  { id: 'shared', label: '공유됨', icon: 'ShareIcon' }
];

// 테마 색상
export const THEME_COLORS = {
  primary: 'blue',
  secondary: 'gray',
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  info: 'indigo'
};

// 기본 설정
export const DEFAULT_SETTINGS = {
  viewMode: VIEW_MODES.GRID,
  sortBy: 'updated_desc',
  autoSave: true,
  markdownPreview: true,
  showLineNumbers: false,
  enableAI: true,
  pageSize: 10 // 무한 스크롤 테스트를 위해 10개로 변경
};