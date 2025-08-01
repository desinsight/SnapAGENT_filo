import { useState, useCallback, useEffect } from 'react';

/**
 * useFileSearch - 파일 검색 기능 훅
 * 
 * 기능:
 * - 검색 파라미터 관리
 * - 검색 실행
 * - 검색 결과 관리
 * - 검색 히스토리 (추후 구현)
 */
const useFileSearch = () => {
  // 검색 파라미터
  const [searchParams, setSearchParams] = useState({
    name: '',       // 파일명
    ext: '',        // 확장자
    from: '',       // 시작 날짜
    to: '',         // 종료 날짜
    drive: '',      // 드라이브 선택
  });

  // 검색 상태
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastSearchTime, setLastSearchTime] = useState(null);

  // 검색 히스토리 (로컬 스토리지)
  const [searchHistory, setSearchHistory] = useState([]);

  // API 기본 URL
  const API_BASE_URL = 'http://localhost:5000/api/tools/ultra-fast-search';

  /**
   * 검색 파라미터 업데이트
   * @param {Object} newParams - 새로운 파라미터
   */
  const updateSearchParams = useCallback((newParams) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams
    }));
  }, []);

  /**
   * 검색 초기화
   */
  const clearSearch = useCallback(() => {
    setSearchParams({
      name: '',
      ext: '',
      from: '',
      to: '',
      drive: '',
    });
    setSearchResults([]);
    setTotalResults(0);
    setSearchError(null);
  }, []);

  /**
   * 검색 실행
   */
  const performSearch = useCallback(async () => {
    // 검색 조건 확인
    const hasSearchTerms = searchParams.name || searchParams.ext || searchParams.from || searchParams.to || searchParams.drive;
    
    if (!hasSearchTerms) {
      setSearchError('검색 조건을 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // 쿼리 파라미터 생성
      const queryParams = new URLSearchParams();
      
      if (searchParams.name) queryParams.append('name', searchParams.name);
      if (searchParams.ext) queryParams.append('ext', searchParams.ext);
      if (searchParams.from) queryParams.append('from', searchParams.from);
      if (searchParams.to) queryParams.append('to', searchParams.to);
      if (searchParams.drive) queryParams.append('drive', searchParams.drive);

      console.log('[DEBUG] 검색 요청:', `${API_BASE_URL}?${queryParams.toString()}`);

      // API 호출
      const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      console.log('[DEBUG] 검색 응답:', data);

      if (response.ok && data.success) {
        // 검색 결과에 추가 정보 포함
        const enhancedResults = (data.results || []).map(file => ({
          ...file,
          displayName: file.name,
          displayPath: file.path,
          displaySize: formatFileSize(file.size),
          displayDate: formatDate(file.mtime),
          isDirectory: file.isDirectory || false,
          extension: file.ext || getFileExtension(file.name)
        }));

        setSearchResults(enhancedResults);
        setTotalResults(data.total || 0);
        setLastSearchTime(new Date());
        
        // 검색 히스토리에 추가
        addToSearchHistory(searchParams);
        
        console.log('검색 완료:', data.total, '개 결과');
        return { success: true, results: enhancedResults, total: data.total };
      } else {
        throw new Error(data.message || '검색 실패');
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchError(error.message);
      setSearchResults([]);
      setTotalResults(0);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [searchParams, API_BASE_URL]);

  // 파일 크기 포맷팅 헬퍼 함수
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 날짜 포맷팅 헬퍼 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 파일 확장자 추출 헬퍼 함수
  const getFileExtension = (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  /**
   * 검색 히스토리에 추가
   * @param {Object} params - 검색 파라미터
   */
  const addToSearchHistory = useCallback((params) => {
    const historyItem = {
      id: Date.now(),
      params: { ...params },
      timestamp: new Date().toISOString(),
    };

    setSearchHistory(prev => {
      const newHistory = [historyItem, ...prev.filter(item => 
        JSON.stringify(item.params) !== JSON.stringify(params)
      )];
      
      // 최대 20개까지만 저장
      const limitedHistory = newHistory.slice(0, 20);
      
      // 로컬 스토리지에 저장
      try {
        localStorage.setItem('fileSearchHistory', JSON.stringify(limitedHistory));
      } catch (error) {
        console.warn('검색 히스토리 저장 실패:', error);
      }
      
      return limitedHistory;
    });
  }, []);

  /**
   * 검색 히스토리에서 검색
   * @param {Object} historyItem - 히스토리 아이템
   */
  const searchFromHistory = useCallback((historyItem) => {
    setSearchParams(historyItem.params);
    // 자동으로 검색 실행하지 않음 (사용자가 직접 검색 버튼 클릭)
  }, []);

  /**
   * 검색 히스토리 삭제
   * @param {number} id - 삭제할 아이템 ID
   */
  const removeFromHistory = useCallback((id) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      
      try {
        localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory));
      } catch (error) {
        console.warn('검색 히스토리 업데이트 실패:', error);
      }
      
      return newHistory;
    });
  }, []);

  /**
   * 검색 히스토리 전체 삭제
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('fileSearchHistory');
    } catch (error) {
      console.warn('검색 히스토리 삭제 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 검색 히스토리 로드
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('fileSearchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.warn('검색 히스토리 로드 실패:', error);
    }
  }, []);

  // 검색 파라미터 유효성 검사
  const isValidSearchParams = useCallback(() => {
    return !!(searchParams.name || searchParams.ext || searchParams.from || searchParams.to);
  }, [searchParams]);

  // 검색 파라미터 요약 생성
  const getSearchSummary = useCallback(() => {
    const parts = [];
    
    if (searchParams.name) parts.push(`파일명: "${searchParams.name}"`);
    if (searchParams.ext) parts.push(`확장자: .${searchParams.ext}`);
    if (searchParams.from) parts.push(`시작일: ${searchParams.from}`);
    if (searchParams.to) parts.push(`종료일: ${searchParams.to}`);
    
    return parts.length > 0 ? parts.join(', ') : '검색 조건 없음';
  }, [searchParams]);

  return {
    // 상태
    searchParams,
    searchResults,
    totalResults,
    isSearching,
    searchError,
    lastSearchTime,
    searchHistory,
    
    // 액션
    updateSearchParams,
    clearSearch,
    performSearch,
    searchFromHistory,
    removeFromHistory,
    clearSearchHistory,
    
    // 유틸리티
    isValidSearchParams,
    getSearchSummary,
  };
};

export default useFileSearch;