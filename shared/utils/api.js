// 공통 API 유틸리티
// 웹과 일렉트론에서 모두 사용 가능

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'http://localhost:5000';

// 기본 fetch 래퍼
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
};

// AI 관련 API 함수들
export const getAISummary = async (file) => {
  const response = await apiFetch('/api/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ file }),
  });
  return response.json();
};

export const getAIPlan = async (request) => {
  const response = await apiFetch('/api/ai/plan', {
    method: 'POST',
    body: JSON.stringify({ request }),
  });
  return response.json();
};

export const analyzeFilesAI = async (files) => {
  const response = await apiFetch('/api/ai/analyze-files', {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
  return response.json();
};

export const analyzeSearchResultsAI = async (results, query) => {
  const response = await apiFetch('/api/ai/analyze-search', {
    method: 'POST',
    body: JSON.stringify({ results, query }),
  });
  return response.json();
};

export const recommendOrganizationAI = async (files, currentPath) => {
  const response = await apiFetch('/api/ai/recommend-organization', {
    method: 'POST',
    body: JSON.stringify({ files, currentPath }),
  });
  return response.json();
};

export const chatWithAI = async (message, context) => {
  const response = await apiFetch('/api/ai/chat-direct', {
    method: 'POST',
    body: JSON.stringify({ 
      message, 
      provider: 'claude',
      conversationHistory: context.conversationHistory || []
    }),
  });
  return response.json();
};

// 문서 분석 API
export const analyzeDocument = async (filePath, maxLength = 10000) => {
  const encodedPath = encodeURIComponent(filePath);
  const response = await apiFetch(`/api/analyze/document/${encodedPath}?maxLength=${maxLength}`);
  return response.json();
};

export const analyzeDocumentContent = async (filePath, options = {}) => {
  const encodedPath = encodeURIComponent(filePath);
  const params = new URLSearchParams(options);
  const response = await apiFetch(`/api/analyze/document/${encodedPath}?${params}`);
  return response.json();
};

// 파일 관리 API
export const searchFiles = async (query, filters = {}) => {
  const params = new URLSearchParams({
    q: query,
    ...filters
  });
  
  const response = await apiFetch(`/api/files/search?${params}`);
  return response.json();
};

export const createFolder = async (path, name) => {
  const response = await apiFetch('/api/files/folder', {
    method: 'POST',
    body: JSON.stringify({ path, name }),
  });
  return response.json();
};

export const moveFiles = async (files, targetPath) => {
  const response = await apiFetch('/api/files/move', {
    method: 'POST',
    body: JSON.stringify({ files, targetPath }),
  });
  return response.json();
};

export const copyFiles = async (files, targetPath) => {
  const response = await apiFetch('/api/files/copy', {
    method: 'POST',
    body: JSON.stringify({ files, targetPath }),
  });
  return response.json();
};

// 사용자 설정 API
export const getUserSettings = async () => {
  const response = await apiFetch('/api/user/settings');
  return response.json();
};

export const updateUserSettings = async (settings) => {
  const response = await apiFetch('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return response.json();
};

// 즐겨찾기 API
export const getFavorites = async () => {
  const response = await apiFetch('/api/favorites');
  return response.json();
};

export const addFavorite = async (item) => {
  const response = await apiFetch('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return response.json();
};

export const removeFavorite = async (id) => {
  const response = await apiFetch(`/api/favorites/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// 최근 파일 API
export const getRecentFiles = async (limit = 10) => {
  const response = await apiFetch(`/api/recent-files?limit=${limit}`);
  return response.json();
};

export const addRecentFile = async (file) => {
  const response = await apiFetch('/api/recent-files', {
    method: 'POST',
    body: JSON.stringify(file),
  });
  return response.json();
};