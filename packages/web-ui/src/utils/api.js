export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  const isAuthApi = url.includes('/api/access/login') || url.includes('/api/access/register');
  const headers = {
    ...(options.headers || {}),
    ...(!isAuthApi && token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !isAuthApi) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');
  }
  return res;
}

export async function getAISummary(resultData) {
  const res = await apiFetch('/api/claude/summary', {
    method: 'POST',
    body: JSON.stringify({ resultData })
  });
  const { summary } = await res.json();
  return summary;
}

export async function getAIPlan(userInput) {
  try {
    const res = await apiFetch('/api/claude/plan', {
      method: 'POST',
      body: JSON.stringify({ userInput })
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('API Error:', error);
      throw new Error(`API returned ${res.status}: ${error}`);
    }
    
    const data = await res.json();
    
    // 에러 처리
    if (data.error) {
      console.error('Plan API Error:', data.error);
      return data.plan || { action: 'invalid', description: data.error };
    }
    
    // 성공 시 plan 반환 (searchResults 포함 가능)
    return data.plan || data;
  } catch (error) {
    console.error('getAIPlan 오류:', error);
    throw error;
  }
}

// 새로운 AI 기능들
export async function chatWithAI(message, mode = 'mixed', context = {}) {
  const res = await apiFetch('/api/ai/chat-direct', {
    method: 'POST',
    body: JSON.stringify({ message, context })
  });
  return await res.json();
}

export async function analyzeFilesAI(files, analysisType, context = {}) {
  const res = await apiFetch('/api/ai/analyze-files', {
    method: 'POST',
    body: JSON.stringify({ files, analysisType, context })
  });
  return await res.json();
}

export async function analyzeSearchResultsAI(searchResults, query, context = {}) {
  const res = await apiFetch('/api/ai/analyze-search-results', {
    method: 'POST',
    body: JSON.stringify({ searchResults, query, context })
  });
  return await res.json();
}

export async function recommendOrganizationAI(files, currentPath, preferences = {}) {
  const res = await apiFetch('/api/ai/recommend-organization', {
    method: 'POST',
    body: JSON.stringify({ files, currentPath, preferences })
  });
  return await res.json();
}

export async function getAIStatus() {
  const res = await apiFetch('/api/ai/status');
  return await res.json();
}

export async function getAISuggestions(context, mode) {
  const res = await apiFetch('/api/ai/suggestions', {
    method: 'POST',
    body: JSON.stringify({ context, mode })
  });
  return await res.json();
}

export async function clearAIHistory() {
  const res = await apiFetch('/api/ai/chat/history', {
    method: 'DELETE'
  });
  return await res.json();
}

export async function updateAIConfig(config) {
  const res = await apiFetch('/api/ai/config', {
    method: 'PUT',
    body: JSON.stringify(config)
  });
  return await res.json();
}

export async function getAIStats(sessionId = null) {
  const url = sessionId ? `/api/ai/stats?sessionId=${sessionId}` : '/api/ai/stats';
  const res = await apiFetch(url);
  return await res.json();
}

// 이름 포함 검색 함수
export async function searchByName(userInput, searchPath = null) {
  try {
    const res = await apiFetch('/api/claude/name-search', {
      method: 'POST',
      body: JSON.stringify({ userInput, searchPath })
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Name Search API Error:', error);
      throw new Error(`API returned ${res.status}: ${error}`);
    }
    
    const data = await res.json();
    
    // 에러 처리
    if (data.error) {
      console.error('Name Search Error:', data.error);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('searchByName 오류:', error);
    throw error;
  }
}

// 검색 결과 없음 체크 함수
export function hasNoSearchResults(searchData) {
  if (!searchData) return true;
  
  // 직접적인 noResults 플래그 체크
  if (searchData.noResults === true) return true;
  
  // searchResults 객체 내부 체크
  if (searchData.searchResults?.noResults === true) return true;
  
  // 파일 개수 체크
  const totalCount = searchData.totalCount || searchData.searchResults?.totalCount || 0;
  if (totalCount === 0) return true;
  
  // 파일 배열 체크
  const files = searchData.results || searchData.files || searchData.searchResults?.files || [];
  if (Array.isArray(files) && files.length === 0) return true;
  
  return false;
}

// 검색 결과 없음 메시지 추출 함수
export function getNoResultsMessage(searchData) {
  if (!searchData) return '검색 결과가 없습니다.';
  
  // 커스텀 메시지 우선
  if (searchData.message) return searchData.message;
  if (searchData.searchResults?.message) return searchData.searchResults.message;
  
  // 키워드 기반 기본 메시지
  const query = searchData.nameQuery || searchData.query || searchData.searchResults?.query;
  if (query) {
    return `"${query}"가 포함된 파일을 찾을 수 없습니다.`;
  }
  
  return '검색 결과가 없습니다.';
}

// 검색 제안 추출 함수
export function getSearchSuggestions(searchData) {
  if (!searchData) return [];
  
  return searchData.suggestions || 
         searchData.searchResults?.suggestions || 
         ['다른 키워드로 검색해보세요', '다른 폴더에서 검색해보세요'];
} 