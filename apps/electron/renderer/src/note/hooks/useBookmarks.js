/**
 * 즐겨찾기 관리 커스텀 훅
 * 
 * @description 즐겨찾기 데이터 관리, API 호출, 상태 관리를 담당하는 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBookmarks, 
  toggleBookmark, 
  getBookmarkCollections, 
  createBookmarkCollection,
  updateBookmarkCollection,
  deleteBookmarkCollection,
  addToBookmarkCollection,
  removeFromBookmarkCollection,
  setQuickAccess,
  getQuickAccessItems,
  getBookmarkStats,
  mockApi,
  useMockApi
} from '../utils/bookmarkApi';
import { addStateChangeListener } from '../utils/stateSync';

export const useBookmarks = () => {
  // 기본 상태
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [quickAccess, setQuickAccessItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI 상태
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [sortBy, setSortBy] = useState('bookmarkedAt'); // 'bookmarkedAt', 'updatedAt', 'title', 'priority'
  const [filters, setFilters] = useState({
    search: '',
    type: '', // 'personal', 'shared'
    priority: '',
    isQuickAccess: false
  });
  const [selectedCollection, setSelectedCollection] = useState(null);

  // 캐시 및 최적화
  const cacheRef = useRef({
    bookmarks: new Map(),
    collections: new Map(),
    lastFetch: null
  });
  const abortControllerRef = useRef(null);

  /**
   * 에러 상태 클리어
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 로딩 상태 관리
   */
  const withLoading = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err.message || '오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 즐겨찾기 목록 로드
   */
  const loadBookmarks = useCallback(async (options = {}) => {
    return withLoading(async () => {
      try {
        // Mock API 사용 여부 확인
        if (useMockApi) {
          const response = await mockApi.getBookmarks(options);
          setBookmarks(response.data || []);
          
          // 캐시 업데이트
          response.data?.forEach(bookmark => {
            cacheRef.current.bookmarks.set(bookmark._id, bookmark);
          });
          
          cacheRef.current.lastFetch = Date.now();
          return response;
        }

        // 실제 API 사용
        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        const params = {
          ...filters,
          sortBy,
          ...options,
          signal: abortControllerRef.current.signal
        };

        const response = await getBookmarks(params);
        
        if (!abortControllerRef.current.signal.aborted) {
          setBookmarks(response.data || []);
          
          // 캐시 업데이트
          response.data?.forEach(bookmark => {
            cacheRef.current.bookmarks.set(bookmark._id, bookmark);
          });
          
          cacheRef.current.lastFetch = Date.now();
        }
        
        return response;
      } catch (error) {
        // AbortError는 무시 (정상적인 취소)
        if (error.name === 'AbortError' || error.message.includes('취소')) {
          console.log('북마크 로드 요청이 취소되었습니다.');
          return { data: [] };
        }
        throw error;
      }
    });
  }, [filters, sortBy, withLoading]);

  /**
   * 즐겨찾기 토글
   */
  const toggleBookmarkItem = useCallback(async (noteId, isBookmarked) => {
    return withLoading(async () => {
      // Mock API 사용 시에는 간단히 로컬 상태만 업데이트
      if (useMockApi) {
        console.log(`Mock: 즐겨찾기 ${isBookmarked ? '추가' : '제거'} - ${noteId}`);
        
        // Mock 데이터 생성
        const mockBookmark = {
          _id: noteId,
          title: `테스트 노트 ${noteId}`,
          content: '테스트 내용입니다.',
          type: 'personal',
          priority: 3,
          isQuickAccess: false,
          bookmarkedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 로컬 상태 업데이트
        setBookmarks(prev => {
          if (isBookmarked) {
            // 즐겨찾기 추가
            return [...prev, mockBookmark];
          } else {
            // 즐겨찾기 제거
            return prev.filter(bookmark => bookmark._id !== noteId);
          }
        });
        
        return { data: mockBookmark };
      }

      // 실제 API 호출
      const response = await toggleBookmark(noteId, isBookmarked);
      
      // 로컬 상태 업데이트
      setBookmarks(prev => {
        if (isBookmarked) {
          // 즐겨찾기 추가
          return [...prev, response.data];
        } else {
          // 즐겨찾기 제거
          return prev.filter(bookmark => bookmark._id !== noteId);
        }
      });
      
      // 캐시 업데이트
      if (isBookmarked) {
        cacheRef.current.bookmarks.set(noteId, response.data);
      } else {
        cacheRef.current.bookmarks.delete(noteId);
      }
      
      return response;
    });
  }, [withLoading]);

  /**
   * 컬렉션 목록 로드
   */
  const loadCollections = useCallback(async () => {
    return withLoading(async () => {
      try {
        // Mock API 사용
        if (useMockApi) {
          const response = await mockApi.getBookmarkCollections();
          setCollections(response.data || []);
          
          // 캐시 업데이트
          response.data?.forEach(collection => {
            cacheRef.current.collections.set(collection._id, collection);
          });
          
          return response;
        }

        // 실제 API 호출
        const response = await getBookmarkCollections();
        setCollections(response.data || []);
        
        // 캐시 업데이트
        response.data?.forEach(collection => {
          cacheRef.current.collections.set(collection._id, collection);
        });
        
        return response;
      } catch (error) {
        console.warn('컬렉션 로드 실패, 빈 배열로 설정:', error);
        setCollections([]);
        return { data: [] };
      }
    });
  }, [withLoading]);

  /**
   * 컬렉션 생성
   */
  const createCollection = useCallback(async (collectionData) => {
    return withLoading(async () => {
      const response = await createBookmarkCollection(collectionData);
      
      // 로컬 상태 업데이트
      setCollections(prev => [...prev, response.data]);
      
      // 캐시 업데이트
      cacheRef.current.collections.set(response.data._id, response.data);
      
      return response;
    });
  }, [withLoading]);

  /**
   * 컬렉션 업데이트
   */
  const updateCollection = useCallback(async (collectionId, updates) => {
    return withLoading(async () => {
      const response = await updateBookmarkCollection(collectionId, updates);
      
      // 로컬 상태 업데이트
      setCollections(prev => 
        prev.map(collection => 
          collection._id === collectionId 
            ? { ...collection, ...response.data }
            : collection
        )
      );
      
      // 캐시 업데이트
      cacheRef.current.collections.set(collectionId, response.data);
      
      return response;
    });
  }, [withLoading]);

  /**
   * 컬렉션 삭제
   */
  const deleteCollection = useCallback(async (collectionId) => {
    return withLoading(async () => {
      await deleteBookmarkCollection(collectionId);
      
      // 로컬 상태 업데이트
      setCollections(prev => prev.filter(collection => collection._id !== collectionId));
      
      // 선택된 컬렉션이 삭제된 경우 선택 해제
      if (selectedCollection?._id === collectionId) {
        setSelectedCollection(null);
      }
      
      // 캐시 업데이트
      cacheRef.current.collections.delete(collectionId);
    });
  }, [withLoading, selectedCollection]);

  /**
   * 컬렉션에 북마크 추가
   */
  const addToCollection = useCallback(async (collectionId, noteId) => {
    return withLoading(async () => {
      const response = await addToBookmarkCollection(collectionId, noteId);
      
      // 로컬 상태 업데이트 (컬렉션 목록 새로고침)
      await loadCollections();
      
      return response;
    });
  }, [withLoading, loadCollections]);

  /**
   * 컬렉션에서 북마크 제거
   */
  const removeFromCollection = useCallback(async (collectionId, noteId) => {
    return withLoading(async () => {
      const response = await removeFromBookmarkCollection(collectionId, noteId);
      
      // 로컬 상태 업데이트
      setCollections(prev => 
        prev.map(collection => 
          collection._id === collectionId 
            ? {
                ...collection,
                notes: collection.notes?.filter(note => note.noteId !== noteId) || []
              }
            : collection
        )
      );
      
      return response;
    });
  }, [withLoading]);

  /**
   * 빠른 액세스 목록 로드
   */
  const loadQuickAccess = useCallback(async () => {
    return withLoading(async () => {
      try {
        // Mock API 사용
        if (useMockApi) {
          const response = await mockApi.getQuickAccessItems();
          setQuickAccessItems(response.data || []);
          return response;
        }

        // 실제 API 호출
        const response = await getQuickAccessItems();
        setQuickAccessItems(response.data || []);
        return response;
      } catch (error) {
        console.warn('빠른 액세스 로드 실패, 빈 배열로 설정:', error);
        setQuickAccessItems([]);
        return { data: [] };
      }
    });
  }, [withLoading]);

  /**
   * 빠른 액세스 설정/해제
   */
  const setQuickAccessItem = useCallback(async (noteId, isQuickAccess) => {
    return withLoading(async () => {
      const response = await setQuickAccess(noteId, isQuickAccess);
      
      // 로컬 상태 업데이트
      if (isQuickAccess) {
        // 빠른 액세스 추가
        setQuickAccessItems(prev => [...prev, response.data]);
      } else {
        // 빠른 액세스 제거
        setQuickAccessItems(prev => prev.filter(item => item._id !== noteId));
      }
      
      // 북마크 목록에서도 상태 업데이트
      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark._id === noteId 
            ? { ...bookmark, isQuickAccess }
            : bookmark
        )
      );
      
      return response;
    });
  }, [withLoading]);

  /**
   * 통계 로드
   */
  const loadStats = useCallback(async () => {
    return withLoading(async () => {
      try {
        // Mock API 사용
        if (useMockApi) {
          const response = await mockApi.getBookmarkStats();
          setStats(response.data);
          return response;
        }

        // 실제 API 호출
        const response = await getBookmarkStats();
        setStats(response.data);
        return response;
      } catch (error) {
        console.warn('통계 로드 실패, 기본값으로 설정:', error);
        setStats({
          totalBookmarks: 0,
          personalBookmarks: 0,
          sharedBookmarks: 0,
          quickAccessCount: 0,
          collectionsCount: 0,
          avgPriority: 0,
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          mostUsedTags: [],
          recentActivity: [],
          priorityDistribution: { high: 0, medium: 0, low: 0 }
        });
        return { data: {} };
      }
    });
  }, [withLoading]);

  /**
   * 필터 업데이트
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * 정렬 방식 변경
   */
  const changeSortBy = useCallback((newSortBy) => {
    setSortBy(newSortBy);
  }, []);

  /**
   * 뷰 모드 변경
   */
  const changeViewMode = useCallback((newViewMode) => {
    setViewMode(newViewMode);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('bookmarkViewMode', newViewMode);
  }, []);

  /**
   * 컬렉션 선택
   */
  const selectCollection = useCallback((collection) => {
    setSelectedCollection(collection);
  }, []);

  /**
   * 전체 새로고침
   */
  const refreshBookmarks = useCallback(async () => {
    return withLoading(async () => {
      // 캐시 클리어
      cacheRef.current.bookmarks.clear();
      cacheRef.current.collections.clear();
      cacheRef.current.lastFetch = null;
      
      // 모든 데이터 새로고침
      await Promise.all([
        loadBookmarks(),
        loadCollections(),
        loadQuickAccess(),
        loadStats()
      ]);
    });
  }, [withLoading, loadBookmarks, loadCollections, loadQuickAccess, loadStats]);

  /**
   * 캐시된 데이터 확인
   */
  const getCachedBookmark = useCallback((noteId) => {
    return cacheRef.current.bookmarks.get(noteId);
  }, []);

  /**
   * 캐시 유효성 검사
   */
  const isCacheValid = useCallback((maxAge = 5 * 60 * 1000) => { // 5분
    const lastFetch = cacheRef.current.lastFetch;
    return lastFetch && (Date.now() - lastFetch) < maxAge;
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    // 로컬 스토리지에서 뷰 모드 복원
    const savedViewMode = localStorage.getItem('bookmarkViewMode');
    if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
  }, []);

  // 필터나 정렬이 변경될 때마다 북마크 재로드 (의존성 최소화)
  useEffect(() => {
    if (!isCacheValid()) {
      loadBookmarks().catch(error => {
        console.warn('북마크 자동 로드 실패:', error);
      });
    }
  }, [filters, sortBy]); // loadBookmarks와 isCacheValid 의존성 제거

  // 상태 동기화 리스너 등록
  useEffect(() => {
    const cleanup = addStateChangeListener((detail) => {
      // 노트 상태 변경 시 북마크 목록 업데이트
      if (detail.type === 'noteUpdate' || detail.type === 'noteDelete') {
        // 캐시 무효화하여 다음 로드 시 새로고침
        cacheRef.current.lastFetch = null;
      }
    });

    return () => {
      cleanup();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // 데이터
    bookmarks,
    collections,
    quickAccess,
    stats,
    
    // 상태
    loading,
    error,
    viewMode,
    sortBy,
    filters,
    selectedCollection,
    
    // 액션
    loadBookmarks,
    toggleBookmark: toggleBookmarkItem,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    loadQuickAccess,
    setQuickAccess: setQuickAccessItem,
    loadStats,
    updateFilters,
    changeSortBy,
    changeViewMode,
    selectCollection,
    refreshBookmarks,
    clearError,
    
    // 유틸리티
    getCachedBookmark,
    isCacheValid
  };
};