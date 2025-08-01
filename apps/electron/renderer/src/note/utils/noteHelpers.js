/**
 * 노트 관련 헬퍼 유틸리티
 * 
 * @description 노트 데이터 처리, 포맷팅, 검증 등을 담당하는 유틸리티 함수들
 * @author AI Assistant
 * @version 1.0.0
 */

import { NOTE_CATEGORIES, EDITOR_CONFIG } from '../constants/noteConfig';

/**
 * XSS 방지를 위한 텍스트 정화
 * @param {string} text - 정화할 텍스트
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // 기본적인 HTML 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim();
};

/**
 * 안전한 HTML 생성 (마크다운 변환용)
 * @param {string} markdown - 마크다운 텍스트
 */
export const safeMarkdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  // 기본적인 마크다운 변환 (실제로는 DOMPurify 같은 라이브러리 사용 권장)
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // 안전한 마크다운 변환만 허용
  html = html
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  return html;
};

/**
 * 텍스트에서 미리보기 생성
 * @param {string} content - 원본 텍스트
 * @param {number} length - 미리보기 길이 (기본값: 150)
 */
export const generatePreview = (content, length = EDITOR_CONFIG.PREVIEW_LENGTH) => {
  if (!content || typeof content !== 'string') return '';
  
  // 안전한 텍스트로 변환
  let preview = sanitizeText(content)
    .replace(/#{1,6}\s+/g, '') // 헤더
    .replace(/\*\*(.*?)\*\*/g, '$1') // 볼드
    .replace(/\*(.*?)\*/g, '$1') // 이탤릭
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크
    .replace(/`(.*?)`/g, '$1') // 인라인 코드
    .replace(/```[\s\S]*?```/g, '') // 코드 블록
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .trim();
  
  return preview.length > length ? preview.substring(0, length) + '...' : preview;
};

/**
 * 카테고리 정보 가져오기
 * @param {string} categoryId - 카테고리 ID
 */
export const getCategoryInfo = (categoryId) => {
  return NOTE_CATEGORIES.find(cat => cat.id === categoryId) || NOTE_CATEGORIES[5]; // 기타
};

/**
 * 카테고리 색상 클래스 생성
 * @param {string} categoryId - 카테고리 ID
 * @param {string} type - 색상 타입 ('bg', 'text', 'border')
 */
export const getCategoryColorClass = (categoryId, type = 'bg') => {
  const category = getCategoryInfo(categoryId);
  const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  };
  
  return colorMap[category.color]?.[type] || colorMap.gray[type];
};

/**
 * 날짜 포맷팅
 * @param {string|Date} date - 포맷할 날짜
 * @param {string} format - 포맷 타입 ('relative', 'short', 'long')
 */
export const formatDate = (date, format = 'relative') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  switch (format) {
    case 'relative':
      if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          return diffInMinutes <= 1 ? '방금 전' : `${diffInMinutes}분 전`;
        }
        return `${diffInHours}시간 전`;
      } else if (diffInDays === 1) {
        return '어제';
      } else if (diffInDays < 7) {
        return `${diffInDays}일 전`;
      } else {
        return dateObj.toLocaleDateString('ko-KR');
      }
    
    case 'short':
      return dateObj.toLocaleDateString('ko-KR');
    
    case 'long':
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    
    default:
      return dateObj.toLocaleDateString('ko-KR');
  }
};

/**
 * 읽기 시간 계산 (분 단위)
 * @param {string} content - 텍스트 내용
 * @param {number} wordsPerMinute - 분당 읽기 단어 수 (기본값: 200)
 */
export const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content) return 0;
  
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return minutes;
};

/**
 * 파일 크기 포맷팅
 * @param {number} bytes - 바이트 크기
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * 태그 텍스트 정규화
 * @param {string} tag - 태그 텍스트
 */
export const normalizeTag = (tag) => {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
};

/**
 * 노트 데이터 검증
 * @param {Object} noteData - 검증할 노트 데이터
 */
export const validateNoteData = (noteData) => {
  const errors = [];
  
  // 기본 타입 검증
  if (!noteData || typeof noteData !== 'object') {
    errors.push('유효하지 않은 노트 데이터입니다.');
    return { isValid: false, errors };
  }
  
  // 제목 검증
  if (!noteData.title || typeof noteData.title !== 'string' || noteData.title.trim().length === 0) {
    errors.push('제목은 필수입니다.');
  } else if (noteData.title.length > EDITOR_CONFIG.MAX_TITLE_LENGTH) {
    errors.push(`제목은 ${EDITOR_CONFIG.MAX_TITLE_LENGTH}자를 초과할 수 없습니다.`);
  }
  
  // 내용 검증
  if (!noteData.content || typeof noteData.content !== 'string' || noteData.content.trim().length === 0) {
    errors.push('내용은 필수입니다.');
  } else if (noteData.content.length > EDITOR_CONFIG.MAX_CONTENT_LENGTH) {
    errors.push(`내용은 ${EDITOR_CONFIG.MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`);
  }
  
  // 요약 검증
  if (noteData.summary && (typeof noteData.summary !== 'string' || noteData.summary.length > EDITOR_CONFIG.MAX_SUMMARY_LENGTH)) {
    errors.push(`요약은 ${EDITOR_CONFIG.MAX_SUMMARY_LENGTH}자를 초과할 수 없습니다.`);
  }
  
  // 카테고리 검증
  if (noteData.category && typeof noteData.category !== 'string') {
    errors.push('카테고리는 문자열이어야 합니다.');
  } else if (noteData.category && !NOTE_CATEGORIES.find(cat => cat.id === noteData.category)) {
    errors.push('유효하지 않은 카테고리입니다.');
  }
  
  // 태그 검증
  if (noteData.tags) {
    if (!Array.isArray(noteData.tags)) {
      errors.push('태그는 배열이어야 합니다.');
    } else {
      const invalidTags = noteData.tags.filter(tag => 
        typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50
      );
      if (invalidTags.length > 0) {
        errors.push('태그는 1-50자의 문자열이어야 합니다.');
      }
      if (noteData.tags.length > 20) {
        errors.push('태그는 최대 20개까지 설정할 수 있습니다.');
      }
    }
  }
  
  // XSS 방지를 위한 내용 검증
  if (noteData.title && noteData.title.includes('<script>')) {
    errors.push('제목에 스크립트 태그가 포함되어 있습니다.');
  }
  
  if (noteData.content && noteData.content.includes('<script>')) {
    errors.push('내용에 스크립트 태그가 포함되어 있습니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 노트 목록 필터링
 * @param {Array} notes - 노트 목록
 * @param {Object} filters - 필터 조건
 */
export const filterNotes = (notes, filters) => {
  if (!notes || notes.length === 0) return [];
  
  let filtered = [...notes];
  
  // 검색어 필터
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // 카테고리 필터
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(note => note.category === filters.category);
  }
  
  // 태그 필터
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(note => 
      note.tags?.some(tag => filters.tags.includes(tag))
    );
  }
  
  // 즐겨찾기 필터
  if (filters.favorites) {
    filtered = filtered.filter(note => note.isFavorite);
  }
  
  // 최근 7일 필터
  if (filters.recent) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filtered = filtered.filter(note => new Date(note.updatedAt) >= sevenDaysAgo);
  }
  
  return filtered;
};

/**
 * 노트 목록 정렬
 * @param {Array} notes - 노트 목록
 * @param {string} sortBy - 정렬 기준
 */
export const sortNotes = (notes, sortBy) => {
  if (!notes || notes.length === 0) return [];
  
  const sorted = [...notes];
  
  switch (sortBy) {
    case 'updated_desc':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case 'created_desc':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'title_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'category_asc':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return sorted;
  }
};

/**
 * 마크다운을 HTML로 간단 변환 (미리보기용)
 * @param {string} markdown - 마크다운 텍스트
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n$/gim, '<br />');
};