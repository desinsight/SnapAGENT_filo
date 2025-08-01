/**
 * 노트 서비스 API 통신 유틸리티
 * 
 * @description 백엔드 노트 서비스와의 모든 API 통신을 담당
 * @author AI Assistant
 * @version 1.0.0
 */

// MongoDB 사용하므로 목업 데이터 제거

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const REQUEST_TIMEOUT = 10000; // 15초 → 10초로 감소
const MAX_RETRIES = 2; // 3 → 2로 감소

/**
 * API 요청을 위한 기본 헤더 설정
 */
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 타임아웃이 있는 fetch 래퍼
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`🔄 API 요청 시작: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log(`✅ API 요청 완료: ${url} - ${response.status}`);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`⏰ API 요청 타임아웃: ${url}`);
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    console.error(`❌ API 요청 실패: ${url}`, error);
    throw error;
  }
};

/**
 * 재시도 로직이 포함된 API 요청
 */
const apiRequest = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      
      // 재시도 전 잠시 대기 (지수 백오프) - 시간 증가
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

/**
 * 에러 처리 유틸리티
 */
export function handleApiError(error) {
  // 네트워크 에러
  if (error.message === 'Failed to fetch') {
    alert('서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.');
  } else if (error.response && error.response.data && error.response.data.error) {
    // 서버에서 내려준 에러 메시지
    alert(error.response.data.error);
  } else if (error.errors && Array.isArray(error.errors)) {
    // express-validator 등에서 내려준 에러 배열
    alert(error.errors.map(e => e.msg).join('\n'));
  } else {
    // 기타 에러
    alert('알 수 없는 오류가 발생했습니다.');
  }
  // 개발자 콘솔에는 상세 로그
  console.error('API Error:', error);
}

// ===== 노트 CRUD API =====

/**
 * 노트 목록 조회
 * @param {Object} params - 쿼리 파라미터 (page, limit, category, tags, etc.)
 * @param {AbortController} signal - 요청 취소를 위한 signal
 */
export const getNotes = async (params = {}, signal = null) => {
  try {
    console.log('API 요청:', `${API_BASE}/notes`, params);
    const queryString = new URLSearchParams(params).toString();
    
    const options = { headers: getHeaders() };
    if (signal) {
      options.signal = signal;
    }
    
    const response = await apiRequest(`${API_BASE}/notes?${queryString}`, options);
    
    console.log('API 응답:', response);
    
    // 응답 형식 통일
    return {
      data: response.data || [],
      totalCount: response.totalCount || response.total || 0,
      totalPages: response.totalPages || 1,
      success: response.success !== false
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('API 요청 취소됨');
      throw error;
    }
    console.error('getNotes 에러:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * 단일 노트 조회
 * @param {string} noteId - 노트 ID
 */
export const getNote = async (noteId) => {
  try {
    const response = await apiRequest(`${API_BASE}/notes/${noteId}`, { headers: getHeaders() });
    return response;
  } catch (error) {
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

/**
 * 새 노트 생성
 * @param {Object} noteData - 노트 데이터
 */
export const createNote = async (noteData) => {
  try {
    // userId 제거
    const response = await apiRequest(`${API_BASE}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(noteData)
    });
    return response;
  } catch (error) {
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

/**
 * 노트 수정
 * @param {string} noteId - 노트 ID
 * @param {Object} updateData - 수정할 데이터
 */
export const updateNote = async (noteId, updateData) => {
  try {
    console.log('🔄 노트 업데이트 요청:', { noteId, updateData });
    const response = await apiRequest(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ...updateData, userId: 'test' })
    });
    console.log('✅ 노트 업데이트 성공:', response);
    return response;
  } catch (error) {
    console.error('❌ 노트 업데이트 실패:', error);
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

/**
 * 노트 삭제
 * @param {string} noteId - 노트 ID
 * @param {boolean} permanent - 영구 삭제 여부 (기본값: false)
 */
export const deleteNote = async (noteId, permanent = false) => {
  try {
    const url = permanent 
      ? `${API_BASE}/notes/${noteId}?permanent=true&userId=test`
      : `${API_BASE}/notes/${noteId}?userId=test`;
      
    const response = await apiRequest(url, { method: 'DELETE', headers: getHeaders() });
    return response;
  } catch (error) {
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

// ===== 검색 API =====

/**
 * 노트 검색
 * @param {string} query - 검색어
 * @param {Object} options - 검색 옵션
 */
export const searchNotes = async (query, options = {}) => {
  try {
    console.log('🔍 노트 검색 요청:', { query, options });
    const params = { q: query, userId: 'test', ...options };
    const queryString = new URLSearchParams(params).toString();
    
    const response = await apiRequest(`${API_BASE}/notes/search?${queryString}`, { headers: getHeaders() });
    console.log('✅ 노트 검색 성공:', response);
    return response;
  } catch (error) {
    console.error('❌ 노트 검색 실패:', error);
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

/**
 * 노트 즐겨찾기 토글
 * @param {string} noteId - 노트 ID
 * @param {boolean} isFavorite - 즐겨찾기 상태
 */
export const toggleNoteFavorite = async (noteId, isFavorite) => {
  try {
    console.log('⭐ 즐겨찾기 토글 요청:', { noteId, isFavorite });
    const response = await apiRequest(`${API_BASE}/notes/${noteId}/favorite`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isFavorite, userId: 'test' })
    });
    console.log('✅ 즐겨찾기 토글 성공:', response);
    return response;
  } catch (error) {
    console.error('❌ 즐겨찾기 토글 실패:', error);
    handleApiError(error);
    throw error; // undefined 대신 에러를 throw
  }
};

// ===== AI 기능 API =====

/**
 * AI 맞춤법 검사
 * @param {string} text - 검사할 텍스트
 */
export const checkSpelling = async (text) => {
  try {
    const response = await apiRequest(`${API_BASE}/ai/spell-check`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * AI 태그 추천
 * @param {string} content - 노트 내용
 */
export const recommendTags = async (content) => {
  try {
    const response = await apiRequest(`${API_BASE}/ai/recommend-tags`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * AI 노트 요약 생성
 * @param {string} content - 노트 내용
 */
export const generateSummary = async (content) => {
  try {
    const response = await apiRequest(`${API_BASE}/ai/generate-summary`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * AI 통합 분석 (맞춤법, 태그, 요약, 하이라이트)
 * @param {string} content - 노트 내용
 */
export const analyzeNote = async (content) => {
  try {
    const response = await apiRequest(`${API_BASE}/ai/analyze-note`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};

// ===== 태그 관련 API =====

/**
 * 사용자의 모든 태그 조회
 */
export const getAllTags = async () => {
  try {
    const response = await apiRequest(`${API_BASE}/tags`, { headers: getHeaders() });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};

// ===== 통계 API =====

/**
 * 노트 통계 조회
 */
export const getNoteStats = async () => {
  try {
    const response = await apiRequest(`${API_BASE}/notes/stats`, { headers: getHeaders() });
    return response;
  } catch (error) {
    handleApiError(error);
  }
};