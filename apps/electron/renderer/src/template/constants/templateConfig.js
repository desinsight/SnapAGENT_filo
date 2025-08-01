/**
 * 템플릿 관련 상수 및 설정
 * 
 * @description 템플릿 타입, 카테고리, 기본 설정값 등을 정의
 * @author AI Assistant
 * @version 1.0.0
 */

// 템플릿 타입
export const TEMPLATE_TYPES = {
  MARKDOWN: 'markdown',
  HTML: 'html',
  CHECKLIST: 'checklist',
  EMAIL: 'email',
  FORM: 'form',
  DOCUMENT: 'document'
};

// 템플릿 카테고리
export const TEMPLATE_CATEGORIES = {
  DOCUMENT: 'document',
  FORM: 'form',
  EMAIL: 'email',
  REPORT: 'report',
  MEETING: 'meeting',
  PROJECT: 'project',
  PERSONAL: 'personal'
};

// 카테고리 정보
export const CATEGORY_INFO = {
  [TEMPLATE_CATEGORIES.DOCUMENT]: {
    name: '문서',
    icon: '📄',
    color: 'blue',
    description: '일반 문서 템플릿'
  },
  [TEMPLATE_CATEGORIES.FORM]: {
    name: '양식',
    icon: '📋',
    color: 'green',
    description: '체크리스트 및 양식 템플릿'
  },
  [TEMPLATE_CATEGORIES.EMAIL]: {
    name: '이메일',
    icon: '📧',
    color: 'purple',
    description: '이메일 작성 템플릿'
  },
  [TEMPLATE_CATEGORIES.REPORT]: {
    name: '보고서',
    icon: '📊',
    color: 'orange',
    description: '업무 보고서 템플릿'
  },
  [TEMPLATE_CATEGORIES.MEETING]: {
    name: '회의',
    icon: '👥',
    color: 'indigo',
    description: '회의록 및 회의 관련 템플릿'
  },
  [TEMPLATE_CATEGORIES.PROJECT]: {
    name: '프로젝트',
    icon: '🚀',
    color: 'red',
    description: '프로젝트 관리 템플릿'
  },
  [TEMPLATE_CATEGORIES.PERSONAL]: {
    name: '개인',
    icon: '👤',
    color: 'gray',
    description: '개인용 템플릿'
  }
};

// 기본 템플릿 내용
export const DEFAULT_TEMPLATE_CONTENT = {
  [TEMPLATE_TYPES.MARKDOWN]: `# 제목

## 개요

## 내용

## 결론
`,
  [TEMPLATE_TYPES.CHECKLIST]: `# 체크리스트

## 할 일
- [ ] 항목 1
- [ ] 항목 2
- [ ] 항목 3

## 완료된 일
- [x] 완료된 항목
`,
  [TEMPLATE_TYPES.EMAIL]: `제목: 

안녕하세요,

내용을 입력하세요.

감사합니다.

[서명]
`,
  [TEMPLATE_TYPES.FORM]: `# 양식 제목

**이름**: 
**날짜**: 
**부서**: 

## 상세 내용

**항목 1**: 
**항목 2**: 
**항목 3**: 

## 기타 사항

`,
  [TEMPLATE_TYPES.DOCUMENT]: `# 문서 제목

## 목적

## 배경

## 내용

## 결론 및 향후 계획
`,
  [TEMPLATE_TYPES.HTML]: `<!DOCTYPE html>
<html>
<head>
    <title>제목</title>
</head>
<body>
    <h1>제목</h1>
    <p>내용을 입력하세요.</p>
</body>
</html>`
};

// 템플릿 정렬 옵션
export const SORT_OPTIONS = [
  { value: 'updatedAt', label: '수정일' },
  { value: 'createdAt', label: '생성일' },
  { value: 'name', label: '이름' },
  { value: 'category', label: '카테고리' },
  { value: 'usageCount', label: '사용 횟수' }
];

// 뷰 모드 옵션
export const VIEW_MODES = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
  SPACIOUS: 'spacious'
};

// 필터 옵션
export const FILTER_OPTIONS = {
  ALL: 'all',
  PERSONAL: 'personal',
  SHARED: 'shared',
  RECENT: 'recent'
};

// 템플릿 기본 설정
export const TEMPLATE_DEFAULTS = {
  type: TEMPLATE_TYPES.MARKDOWN,
  category: TEMPLATE_CATEGORIES.DOCUMENT,
  isShared: false,
  tags: [],
  content: DEFAULT_TEMPLATE_CONTENT[TEMPLATE_TYPES.MARKDOWN]
};

// 유효성 검사 규칙
export const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  description: {
    required: false,
    maxLength: 500
  },
  content: {
    required: true,
    minLength: 1
  },
  tags: {
    maxItems: 10,
    maxLength: 20
  }
};

// 색상 매핑
export const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
};