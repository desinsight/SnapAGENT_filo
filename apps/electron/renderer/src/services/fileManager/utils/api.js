// API utility functions for both web and electron environments

const API_BASE_URL = 'http://localhost:5001';  // 통합 백엔드 서버 (MCP 포함)
const WEB_API_BASE_URL = 'http://localhost:5001';  // 동일한 서버

// Mock data for offline functionality
const mockFavorites = [
  { path: 'C:\\Users\\Documents\\Project', name: 'Project', modifiedAt: new Date().toISOString() },
  { path: 'C:\\Users\\Downloads', name: 'Downloads', modifiedAt: new Date().toISOString() },
  { path: 'C:\\Important Files', name: 'Important Files', modifiedAt: new Date().toISOString() }
];

const mockRecentFiles = [
  { path: 'C:\\Users\\Documents\\readme.txt', name: 'readme.txt', modifiedAt: new Date().toISOString() },
  { path: 'C:\\Users\\Documents\\project.json', name: 'project.json', modifiedAt: new Date().toISOString() },
  { path: 'C:\\Users\\Desktop\\notes.md', name: 'notes.md', modifiedAt: new Date().toISOString() }
];

// API endpoints
export const getFavorites = async () => {
  try {
    // Electron 환경에서는 IPC를 통해 즐겨찾기 가져오기
    if (isElectron()) {
      return await window.electronAPI.getFavorites();
    }
    
    // 웹 환경에서는 API 서버 사용
    const response = await apiFetch('/api/favorites');
    const data = await response.json();
    return data.favorites || mockFavorites;
  } catch (error) {
    // Backend API not available, using mock data
    return mockFavorites;
  }
};

export const getRecentFiles = async () => {
  try {
    const response = await apiFetch('/api/recent-files');
    const data = await response.json();
    return data.recentFiles || mockRecentFiles;
  } catch (error) {
    // Backend API not available, using mock data
    return mockRecentFiles;
  }
};

export const addToFavorites = async (path) => {
  try {
    const response = await apiFetch('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ path })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to add to favorites:', error);
    return { success: false, error: error.message };
  }
};

export const removeFromFavorites = async (path) => {
  try {
    const response = await apiFetch('/api/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
    return { success: false, error: error.message };
  }
};

// 최근 파일에 추가
export const addToRecentFiles = async (filePath, fileName, isDirectory = false) => {
  try {
    const fileData = {
      path: filePath,
      name: fileName,
      isDirectory,
      accessedAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    
    const response = await apiFetch('/api/recent-files', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    return await response.json();
  } catch (error) {
    // Failed to add to recent files
    return { success: false, error: error.message };
  }
};

// 최근 파일 목록에서 제거
export const removeFromRecentFiles = async (path) => {
  try {
    // Electron 환경에서는 IPC를 통해 최근 파일 제거
    if (isElectron()) {
      return await window.electronAPI.removeFromRecentFiles(path);
    }
    
    // 웹 환경에서는 API 서버 사용
    const response = await apiFetch('/api/recent-files', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to remove from recent files:', error);
    return { success: false, error: error.message };
  }
};

// Check if running in electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

// Electron 환경에서도 백엔드 API 사용 (최근 파일 등의 기능을 위해)
const shouldUseBackendAPI = () => {
  return true; // 항상 백엔드 API 사용
};

// Generic fetch wrapper with error handling
export const apiFetch = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    // API 서버가 없을 때는 조용히 실패
    if (error.message === 'Failed to fetch') {
      throw error;
    }
    console.error('API fetch error:', error);
    throw error;
  }
};

// AI API functions
export const getAISummary = async (file) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/summary`, {
      method: 'POST',
      body: JSON.stringify({
        file: {
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.extension
        }
      })
    });

    const data = await response.json();
    return data.summary || '파일 요약을 생성할 수 없습니다.';
  } catch (error) {
    console.error('AI summary error:', error);
    return `${file.name}은(는) ${file.isDirectory ? '폴더' : '파일'}입니다. ${file.size ? `크기: ${formatFileSize(file.size)}` : ''}`;
  }
};

export const getAIPlan = async (files, context) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/plan`, {
      method: 'POST',
      body: JSON.stringify({
        files: files.map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
          type: f.extension,
          isDirectory: f.isDirectory
        })),
        context
      })
    });

    const data = await response.json();
    return data.plan || '계획을 생성할 수 없습니다.';
  } catch (error) {
    console.error('AI plan error:', error);
    return '선택된 파일들에 대한 권장 작업을 생성할 수 없습니다.';
  }
};

export const analyzeFilesAI = async (files) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      body: JSON.stringify({
        files: files.map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
          type: f.extension,
          isDirectory: f.isDirectory,
          modifiedAt: f.modifiedAt
        }))
      })
    });

    const data = await response.json();
    return data.analysis || '파일 분석 결과를 가져올 수 없습니다.';
  } catch (error) {
    console.error('AI analyze files error:', error);
    return `${files.length}개의 파일을 분석했습니다. 다양한 형태의 파일들이 포함되어 있습니다.`;
  }
};

export const analyzeSearchResultsAI = async (results, query) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/search-analysis`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        results: results.map(r => ({
          name: r.name,
          path: r.path,
          size: r.size,
          type: r.type
        }))
      })
    });

    const data = await response.json();
    return data.analysis || '검색 결과 분석을 생성할 수 없습니다.';
  } catch (error) {
    console.error('AI search analysis error:', error);
    return `"${query}" 검색으로 ${results.length}개의 결과를 찾았습니다.`;
  }
};

export const recommendOrganizationAI = async (files, currentPath) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/organize`, {
      method: 'POST',
      body: JSON.stringify({
        files: files.map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
          type: f.extension,
          isDirectory: f.isDirectory
        })),
        currentPath
      })
    });

    const data = await response.json();
    return {
      recommendations: data.recommendations || '정리 방법을 제안할 수 없습니다.',
      suggestions: data.suggestions || []
    };
  } catch (error) {
    console.error('AI organization error:', error);
    return {
      recommendations: '파일들을 유형별로 분류하여 정리하는 것을 권장합니다.',
      suggestions: [
        { action: 'organize', description: '파일 유형별 폴더 생성' },
        { action: 'rename', description: '일관된 명명 규칙 적용' }
      ]
    };
  }
};

export const chatWithAI = async (message, context) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        context: {
          currentFolder: context.currentFolder,
          fileCount: context.fileCount,
          fileTypes: context.fileTypes,
          recentActivity: context.recentActivity
        }
      })
    });

    const data = await response.json();
    return data.response || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('AI chat error:', error);
    
    // Fallback responses based on message content
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('정리') || lowerMessage.includes('organize')) {
      return '파일을 정리하는 방법을 알려드리겠습니다:\n\n1. 파일 유형별로 폴더를 생성하세요\n2. 날짜별로 분류하세요\n3. 프로젝트별로 구분하세요\n4. 불필요한 파일은 삭제하세요';
    }
    
    if (lowerMessage.includes('검색') || lowerMessage.includes('search')) {
      return '파일 검색 팁:\n\n1. 파일명의 일부만 입력해도 찾을 수 있습니다\n2. 확장자로 필터링하세요\n3. 날짜 범위를 지정하세요\n4. 고급 검색 옵션을 활용하세요';
    }
    
    if (lowerMessage.includes('팁') || lowerMessage.includes('도움')) {
      return `현재 폴더(${context.currentFolder || 'root'})에 ${context.fileCount || 0}개의 파일이 있습니다.\n\n파일 관리 팁:\n- 정기적으로 불필요한 파일을 정리하세요\n- 의미있는 파일명을 사용하세요\n- 백업을 주기적으로 하세요\n- 폴더 구조를 체계적으로 관리하세요`;
    }
    
    return '안녕하세요! 파일 관리에 관한 질문이나 도움이 필요하시면 언제든 말씀해 주세요.';
  }
};

// Helper function for file size formatting
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  apiFetch,
  getFavorites,
  getRecentFiles,
  addToFavorites,
  removeFromFavorites,
  getAISummary,
  getAIPlan,
  analyzeFilesAI,
  analyzeSearchResultsAI,
  recommendOrganizationAI,
  chatWithAI
};