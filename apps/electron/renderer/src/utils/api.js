// API utility functions for both web and electron environments

// 환경별 API 서버 설정
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001'  // 개발: 로컬 서버
  : 'http://localhost:5001'; // 프로덕션: 동일 (로컬 데스크톱 앱)

const WEB_API_BASE_URL = API_BASE_URL;

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
    const response = await apiFetch(`${API_BASE_URL}/api/favorites`);
    const data = await response.json();
    return data.favorites || mockFavorites;
  } catch (error) {
    // Backend API not available, using mock data
    return mockFavorites;
  }
};

export const getRecentFiles = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/recent-files`);
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
    if (error.message !== 'Failed to fetch') {
      console.error('API fetch error:', error);
    }
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
    return data.data?.summary || '파일 요약을 생성할 수 없습니다.';
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
    return data.data?.plan || '계획을 생성할 수 없습니다.';
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
    return data.data?.analysis || '파일 분석 결과를 가져올 수 없습니다.';
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
    return data.data?.analysis || '검색 결과 분석을 생성할 수 없습니다.';
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
      recommendations: data.data?.recommendations || '정리 방법을 제안할 수 없습니다.',
      suggestions: data.data?.suggestions || []
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

// Tool 실행 함수
const executeTool = async (toolName, parameters, userId = 'anonymous') => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/tools/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      body: JSON.stringify({
        tool_name: toolName,    // tool → tool_name으로 변경
        parameters: parameters, // 그대로 유지
        user_id: userId        // user_id 추가
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // 구독 필요 에러 처리
      if (data.error === 'subscription_required') {
        return {
          error: true,
          subscription_required: true,
          message: data.message,
          subscription_url: data.subscription_url
        };
      }
      throw new Error(data.message || 'Tool 실행 실패');
    }
    
    return data.data;
  } catch (error) {
    console.error(`Tool 실행 에러 (${toolName}):`, error);
    throw error;
  }
};

export const chatWithAI = async (message, context) => {
  try {
    const userId = context.userId || 'anonymous';
    const provider = context.provider || 'claude';
    const conversationHistory = context.conversationHistory || [];
    
    // 🔍 프론트엔드 디버깅: 전송할 데이터 확인
    const requestBody = {
      message,
      provider,
      conversationHistory
    };
    
    console.log('🚀 [API] chatWithAI 호출 시작');
    console.log('📤 [API] 전송할 body:', requestBody);
    console.log('📤 [API] message 타입:', typeof message, 'length:', message?.length);
    console.log('📤 [API] provider:', provider);
    console.log('📤 [API] conversationHistory length:', conversationHistory?.length);
    
    // JSON.stringify 결과 확인
    const bodyString = JSON.stringify(requestBody);
    console.log('📤 [API] JSON.stringify 결과:', bodyString);
    console.log('📤 [API] bodyString 길이:', bodyString.length);
    
    // 1. AI Chat API 호출 (chat-direct 엔드포인트 사용)
    console.log('📤 [API] 최종 요청 옵션:', {
      method: 'POST',
      url: `${API_BASE_URL}/api/ai/chat-direct`,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      bodyLength: bodyString.length
    });
    
    const response = await apiFetch(`${API_BASE_URL}/api/ai/chat-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      body: JSON.stringify({
        message,
        provider,
        conversationHistory
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'AI 응답 생성 실패');
    }
    
    // 🎯 전체 응답 구조 반환 (UI 필터 정보 포함)
    return data;
  } catch (error) {
    console.error('AI chat error:', error);
    
    // 🚫 실제 오류 메시지 반환 (가짜 응답 제거)
    throw new Error(`AI 서비스에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.\n\n오류: ${error.message}`);
  }
};

/**
 * 📄 문서 내용 분석 (AI 백엔드 연동)
 * @param {string} filePath - 분석할 파일의 전체 경로
 * @param {object} [options={}] - 분석 옵션
 * @param {number} [options.maxLength=10000] - 최대 읽기 길이
 * @returns {Promise<object>} 백엔드 분석 결과 전체
 */
export const analyzeDocumentContent = async (filePath, options = {}) => {
  try {
    const { maxLength = 10000, saveDir } = options;
    const encodedPath = encodeURIComponent(filePath);
    let url = `${API_BASE_URL}/api/analyze/document/${encodedPath}?maxLength=${maxLength}`;
    if (saveDir) {
      url += `&saveDir=${encodeURIComponent(saveDir)}`;
    }
    const response = await apiFetch(url);
    return await response.json();
  } catch (error) {
    console.error('문서 내용 분석 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 📄 문서 내용 읽기 (간단 버전, AI 백엔드 연동)
 * @param {string} filePath - 읽을 파일의 전체 경로
 * @param {number} [maxLength=10000] - 최대 읽기 길이(옵션)
 * @returns {Promise<object>} 백엔드 읽기 결과 전체
 */
export const readDocumentContent = async (filePath, maxLength = 10000) => {
  try {
    const encodedPath = encodeURIComponent(filePath);
    const response = await apiFetch(`${API_BASE_URL}/api/read/document/${encodedPath}?maxLength=${maxLength}`);
    return await response.json();
  } catch (error) {
    console.error('문서 내용 읽기 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 확장자별 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeByExtension = async (targetPath, includeSubfolders = false) => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/extension`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders })
    });
    return await response.json();
  } catch (error) {
    console.error('확장자별 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 날짜별 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeByDate = async (targetPath, includeSubfolders = false) => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/date`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders })
    });
    return await response.json();
  } catch (error) {
    console.error('날짜별 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 중복 파일 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeByDuplicate = async (targetPath, includeSubfolders = false) => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders })
    });
    return await response.json();
  } catch (error) {
    console.error('중복 파일 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 임시파일 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeByTemp = async (targetPath, includeSubfolders = false) => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/temp`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders })
    });
    return await response.json();
  } catch (error) {
    console.error('임시파일 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 대용량 파일 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @param {number} sizeThreshold - 용량 기준(바이트)
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeBySize = async (targetPath, includeSubfolders = false, sizeThreshold = 100 * 1024 * 1024) => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/size`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders, sizeThreshold })
    });
    return await response.json();
  } catch (error) {
    console.error('대용량 파일 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * AI 추천 기반 정리 API 호출
 * @param {string} targetPath - 정리할 경로
 * @param {boolean} [includeSubfolders=false] - 하위 폴더 포함 여부
 * @param {string} userRequest - 사용자 정리 요청
 * @returns {Promise<object>} - 정리 결과
 */
export const organizeByAI = async (targetPath, includeSubfolders = false, userRequest = '') => {
  try {
    const response = await apiFetch(`/api/tools/smart_organize/ai`, {
      method: 'POST',
      body: JSON.stringify({ targetPath, includeSubfolders, userRequest })
    });
    return await response.json();
  } catch (error) {
    console.error('AI 추천 정리 API 호출 오류:', error);
    return { success: false, error: error.message };
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

// 사용 가능한 도구 목록 가져오기
export const getAvailableTools = async (userId = 'anonymous') => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/ai/available-tools`, {
      headers: {
        'X-User-Id': userId
      }
    });
    
    const data = await response.json();
    return data.data?.tools || [];
  } catch (error) {
    // 도구 목록 조회 실패시 빈 배열 반환
    return [];
  }
};

// 다양한 AI 파일 목록 응답 구조에서 안전하게 파일 배열을 추출하는 유틸
export function extractFileListFromAIResult(aiResult) {
  if (!aiResult) return [];
  if (Array.isArray(aiResult)) return aiResult;
  if (aiResult.files && Array.isArray(aiResult.files)) return aiResult.files;
  if (aiResult.data && Array.isArray(aiResult.data)) return aiResult.data;
  if (aiResult.result && Array.isArray(aiResult.result)) return aiResult.result;
  if (aiResult.result && aiResult.result.files && Array.isArray(aiResult.result.files)) return aiResult.result.files;
  if (aiResult.data && aiResult.data.files && Array.isArray(aiResult.data.files)) return aiResult.data.files;
  return [];
}

// 연관 분석 API 함수들
export const searchSimilarFiles = async (keywords, fileType = null, limit = 10) => {
  try {
    const queryParams = new URLSearchParams();
    if (keywords && keywords.length > 0) {
      queryParams.append('name', keywords.join(' '));
    }
    if (fileType) {
      queryParams.append('ext', fileType);
    }
    
    const response = await apiFetch(`/api/tools/ultra-fast-search?${queryParams.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      return data.results.slice(0, limit);
    } else {
      throw new Error(data.message || '검색 실패');
    }
  } catch (error) {
    console.error('유사 파일 검색 실패:', error);
    return [];
  }
};

export const getIndexedFilesInfo = async () => {
  try {
    const response = await apiFetch('/api/tools/ultra-fast-search/info');
    const data = await response.json();
    
    if (data.success) {
      return {
        totalFiles: data.totalFiles,
        totalSize: data.totalSize,
        indexedPaths: data.indexedPaths,
        watchedPaths: data.watchedPaths
      };
    } else {
      throw new Error(data.message || '인덱스 정보 조회 실패');
    }
  } catch (error) {
    console.error('인덱스 정보 조회 실패:', error);
    return {
      totalFiles: 0,
      totalSize: '0 B',
      indexedPaths: [],
      watchedPaths: []
    };
  }
};

export const searchByContent = async (content, fileTypes = null, limit = 10) => {
  try {
    // 키워드 추출 (간단한 방식)
    const words = content.split(/\s+/).filter(word => word.length > 2);
    const keywords = words.slice(0, 5); // 상위 5개 단어만 사용
    
    // 내용 검색 API 사용
    const response = await apiFetch('/api/search/content', {
      method: 'POST',
      body: JSON.stringify({
        keywords: keywords,
        targetDirectory: '/', // 전체 시스템 검색
        fileTypes: fileTypes ? [fileTypes] : ['text', 'document']
      })
    });
    
    const data = await response.json();
    
    if (data.results) {
      return data.results.slice(0, limit).map(result => ({
        name: result.name || path.basename(result.path),
        path: result.path,
        size: result.size || 0,
        modifiedAt: result.modified || new Date().toISOString(),
        score: result.score || 0,
        matches: result.matches || []
      }));
    } else {
      throw new Error('내용 검색 결과가 없습니다');
    }
  } catch (error) {
    console.error('내용 기반 검색 실패:', error);
    return [];
  }
};

export const searchByMetadata = async (metadata, limit = 10) => {
  try {
    const queryParams = new URLSearchParams();
    
    // 파일 크기 기반 검색
    if (metadata.size) {
      const sizeMB = Math.round(metadata.size / (1024 * 1024));
      if (sizeMB < 1) {
        queryParams.append('size', 'small');
      } else if (sizeMB < 10) {
        queryParams.append('size', 'medium');
      } else {
        queryParams.append('size', 'large');
      }
    }
    
    // 확장자 기반 검색
    if (metadata.extension) {
      queryParams.append('ext', metadata.extension);
    }
    
    const response = await apiFetch(`/api/tools/ultra-fast-search?${queryParams.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      return data.results.slice(0, limit);
    } else {
      throw new Error(data.message || '메타데이터 기반 검색 실패');
    }
  } catch (error) {
    console.error('메타데이터 기반 검색 실패:', error);
    return [];
  }
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
  chatWithAI,
  getAvailableTools,
  executeTool,
  analyzeDocumentContent,
  readDocumentContent,
  organizeByExtension,
  organizeByDate,
  organizeByDuplicate,
  organizeByTemp,
  organizeBySize,
  organizeByAI
};