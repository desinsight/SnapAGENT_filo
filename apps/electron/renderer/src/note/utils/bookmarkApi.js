/**
 * 즐겨찾기 API 유틸리티
 * 
 * @description 즐겨찾기 관련 API 호출을 담당하는 유틸리티 함수들
 * @author AI Assistant
 * @version 1.0.0
 */

// API 기본 설정
const API_BASE_URL = '/api/v1';
const API_ENDPOINTS = {
  BOOKMARKS: `${API_BASE_URL}/bookmarks`,
  BOOKMARK_COLLECTIONS: `${API_BASE_URL}/bookmark-collections`,
  QUICK_ACCESS: `${API_BASE_URL}/quick-access`,
  BOOKMARK_STATS: `${API_BASE_URL}/analytics/bookmark-stats`
};

/**
 * HTTP 요청 헬퍼 함수
 */
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '서버 오류가 발생했습니다.' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('요청이 취소되었습니다.');
    }
    throw error;
  }
}

/**
 * 쿼리 파라미터 생성
 */
function buildQueryParams(params) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
}

/**
 * 즐겨찾기 목록 조회
 */
export async function getBookmarks(params = {}) {
  const queryString = buildQueryParams(params);
  const url = `${API_ENDPOINTS.BOOKMARKS}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET',
    signal: params.signal
  });
}

/**
 * 즐겨찾기 토글 (추가/제거)
 */
export async function toggleBookmark(noteId, isBookmarked) {
  if (isBookmarked) {
    // 즐겨찾기 추가
    return apiRequest(`${API_ENDPOINTS.BOOKMARKS}/${noteId}`, {
      method: 'POST',
      body: JSON.stringify({
        noteId,
        bookmarkType: 'bookmark'
      })
    });
  } else {
    // 즐겨찾기 제거
    return apiRequest(`${API_ENDPOINTS.BOOKMARKS}/${noteId}`, {
      method: 'DELETE'
    });
  }
}

/**
 * 즐겨찾기 우선순위 설정
 */
export async function setBookmarkPriority(noteId, priority) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARKS}/${noteId}/priority`, {
    method: 'PUT',
    body: JSON.stringify({ priority })
  });
}

/**
 * 북마크 컬렉션 목록 조회
 */
export async function getBookmarkCollections(params = {}) {
  const queryString = buildQueryParams(params);
  const url = `${API_ENDPOINTS.BOOKMARK_COLLECTIONS}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * 북마크 컬렉션 생성
 */
export async function createBookmarkCollection(collectionData) {
  return apiRequest(API_ENDPOINTS.BOOKMARK_COLLECTIONS, {
    method: 'POST',
    body: JSON.stringify(collectionData)
  });
}

/**
 * 북마크 컬렉션 업데이트
 */
export async function updateBookmarkCollection(collectionId, updates) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARK_COLLECTIONS}/${collectionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * 북마크 컬렉션 삭제
 */
export async function deleteBookmarkCollection(collectionId) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARK_COLLECTIONS}/${collectionId}`, {
    method: 'DELETE'
  });
}

/**
 * 컬렉션에 노트 추가
 */
export async function addToBookmarkCollection(collectionId, noteId) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARK_COLLECTIONS}/${collectionId}/notes/${noteId}`, {
    method: 'POST'
  });
}

/**
 * 컬렉션에서 노트 제거
 */
export async function removeFromBookmarkCollection(collectionId, noteId) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARK_COLLECTIONS}/${collectionId}/notes/${noteId}`, {
    method: 'DELETE'
  });
}

/**
 * 빠른 액세스 아이템 조회
 */
export async function getQuickAccessItems(params = {}) {
  const queryString = buildQueryParams(params);
  const url = `${API_ENDPOINTS.QUICK_ACCESS}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * 빠른 액세스 설정/해제
 */
export async function setQuickAccess(noteId, isQuickAccess) {
  if (isQuickAccess) {
    // 빠른 액세스 추가
    return apiRequest(`${API_ENDPOINTS.QUICK_ACCESS}/${noteId}`, {
      method: 'POST'
    });
  } else {
    // 빠른 액세스 제거
    return apiRequest(`${API_ENDPOINTS.QUICK_ACCESS}/${noteId}`, {
      method: 'DELETE'
    });
  }
}

/**
 * 즐겨찾기 통계 조회
 */
export async function getBookmarkStats(params = {}) {
  const queryString = buildQueryParams(params);
  const url = `${API_ENDPOINTS.BOOKMARK_STATS}${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * 인기 즐겨찾기 조회
 */
export async function getPopularBookmarks(params = {}) {
  const queryString = buildQueryParams(params);
  const url = `${API_BASE_URL}/analytics/popular-bookmarks${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * 즐겨찾기 검색
 */
export async function searchBookmarks(query, params = {}) {
  const searchParams = { ...params, q: query };
  const queryString = buildQueryParams(searchParams);
  const url = `${API_ENDPOINTS.BOOKMARKS}/search${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * 일괄 즐겨찾기 작업
 */
export async function bulkBookmarkAction(action, noteIds, data = {}) {
  return apiRequest(`${API_ENDPOINTS.BOOKMARKS}/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      noteIds,
      data
    })
  });
}

/**
 * 즐겨찾기 익스포트
 */
export async function exportBookmarks(format = 'json', params = {}) {
  const searchParams = { ...params, format };
  const queryString = buildQueryParams(searchParams);
  const url = `${API_ENDPOINTS.BOOKMARKS}/export${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('즐겨찾기 익스포트에 실패했습니다.');
  }
  
  return response.blob();
}

/**
 * 즐겨찾기 임포트
 */
export async function importBookmarks(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return apiRequest(`${API_ENDPOINTS.BOOKMARKS}/import`, {
    method: 'POST',
    body: formData,
    headers: {} // FormData는 Content-Type을 자동으로 설정
  });
}

/**
 * Mock API 함수들 (백엔드가 준비되지 않은 경우 사용)
 */
export const mockApi = {
  /**
   * Mock 즐겨찾기 데이터
   */
  async getBookmarks(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 500)); // 네트워크 지연 시뮬레이션
    
    const mockBookmarks = [
      {
        _id: '1',
        title: '프로젝트 계획서',
        content: '새로운 프로젝트의 전체적인 계획과 일정을 정리한 문서입니다.',
        summary: '프로젝트 전체 계획 및 일정 정리',
        category: 'work',
        tags: ['프로젝트', '계획', '일정'],
        type: 'personal',
        priority: 4,
        isQuickAccess: true,
        bookmarkedAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-20').toISOString(),
        collections: []
      },
      {
        _id: '2',
        title: '회의록 - 팀 미팅',
        content: '주간 팀 미팅에서 논의된 주요 안건들과 결정사항을 기록했습니다.',
        summary: '주간 팀 미팅 안건 및 결정사항',
        category: 'meeting',
        tags: ['회의', '팀', '미팅'],
        type: 'shared',
        priority: 3,
        isQuickAccess: false,
        bookmarkedAt: new Date('2024-01-18').toISOString(),
        updatedAt: new Date('2024-01-18').toISOString(),
        collections: ['collection1']
      }
    ];
    
    return {
      data: mockBookmarks,
      total: mockBookmarks.length,
      page: 1,
      limit: 20
    };
  },

  /**
   * Mock 컬렉션 데이터
   */
  async getBookmarkCollections() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCollections = [
      {
        _id: 'collection1',
        name: '업무 관련',
        description: '업무와 관련된 중요한 문서들',
        color: '#3B82F6',
        icon: 'folder',
        isDefault: false,
        notes: [
          { noteId: '2', addedAt: new Date().toISOString() }
        ]
      }
    ];
    
    return {
      data: mockCollections
    };
  },

  /**
   * Mock 빠른 액세스 데이터
   */
  async getQuickAccessItems() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockQuickAccess = [
      {
        _id: '1',
        title: '프로젝트 계획서',
        summary: '프로젝트 전체 계획 및 일정 정리',
        type: 'personal',
        priority: 4,
        updatedAt: new Date('2024-01-20').toISOString(),
        tags: ['프로젝트']
      }
    ];
    
    return {
      data: mockQuickAccess
    };
  },

  /**
   * Mock 통계 데이터
   */
  async getBookmarkStats() {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockStats = {
      totalBookmarks: 15,
      personalBookmarks: 10,
      sharedBookmarks: 5,
      quickAccessCount: 3,
      collectionsCount: 4,
      avgPriority: 3.2,
      weeklyGrowth: 12,
      monthlyGrowth: 35,
      mostUsedTags: [
        { name: '프로젝트', count: 5 },
        { name: '회의', count: 3 },
        { name: '아이디어', count: 2 }
      ],
      recentActivity: [
        { action: '새 즐겨찾기 추가', time: '2시간 전' },
        { action: '컬렉션 생성', time: '1일 전' },
        { action: '빠른 액세스 추가', time: '3일 전' }
      ],
      priorityDistribution: {
        high: 3,
        medium: 8,
        low: 4
      }
    };
    
    return {
      data: mockStats
    };
  }
};

// 개발 환경에서는 mock API 사용
const isDevelopment = process.env.NODE_ENV === 'development';

// 실제 API가 준비되지 않은 경우 mock 사용 (현재는 항상 mock 사용)
export const useMockApi = false;