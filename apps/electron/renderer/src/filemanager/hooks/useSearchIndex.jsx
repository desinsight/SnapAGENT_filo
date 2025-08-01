import { useState, useEffect, useCallback } from 'react';

/**
 * useSearchIndex - 파일 인덱스 관리 훅
 * 
 * 기능:
 * - 디렉토리 인덱싱
 * - 인덱스 저장/불러오기
 * - 실시간 파일 감시 제어
 * - 인덱스 상태 관리
 */
const useSearchIndex = (onIndexComplete) => {
  // 인덱스 상태
  const [indexStatus, setIndexStatus] = useState('not-loaded'); // 'not-loaded', 'loading', 'loaded'
  const [isWatching, setIsWatching] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);

  // API 기본 URL
  const API_BASE_URL = '/api/tools/ultra-fast-search';

  /**
   * 기존 인덱스 상태 확인 및 로드
   */
  const loadIndexStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/info?user_id=test`);
      const data = await response.json();
      
      if (data.success && data.indexedPaths && data.indexedPaths.length > 0) {
        setIndexStatus('loaded');
        setTotalFiles(data.totalFiles || 0);
        setIsWatching(data.watchedPaths && data.watchedPaths.length > 0);
        setLastUpdateTime(new Date());
        console.log('기존 인덱스 상태 로드 완료:', data.indexedPaths.length, '개 경로');
      } else {
        setIndexStatus('not-loaded');
        setTotalFiles(0);
        setIsWatching(false);
        setLastUpdateTime(null);
      }
    } catch (error) {
      console.error('인덱스 상태 로드 실패:', error);
      setIndexStatus('not-loaded');
      setTotalFiles(0);
      setIsWatching(false);
      setLastUpdateTime(null);
    }
  }, [API_BASE_URL]);

  /**
   * 디렉토리 인덱싱 시작
   * @param {string} directory - 인덱싱할 디렉토리 경로
   */
  const indexDirectory = useCallback(async (directory) => {
    if (!directory) return;

    setIsIndexing(true);
    setIndexStatus('loading');

    try {
      const response = await fetch(`${API_BASE_URL}/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootDir: directory }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 인덱싱이 백그라운드에서 시작됨 - 즉시 완료로 표시하지 않음
        setIsWatching(true);
        setCurrentDirectory(directory);
        setLastUpdateTime(new Date());
        
        console.log('인덱싱 시작됨 (백그라운드에서 진행):', data.message);
        
        // 인덱싱이 백그라운드에서 진행되므로 isIndexing을 true로 유지
        // 실제 완료는 IndexManagement 컴포넌트의 상태 체크에서 감지
        
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || '인덱싱 실패');
      }
    } catch (error) {
      console.error('인덱싱 오류:', error);
      setIndexStatus('not-loaded');
      setIsWatching(false);
      setIsIndexing(false);
      // 에러 메시지만 throw
      throw error.message || String(error);
    }
    // finally 블록 제거 - 인덱싱이 백그라운드에서 진행되므로 즉시 false로 설정하지 않음
  }, [API_BASE_URL, onIndexComplete]);

  /**
   * 인덱스 파일 저장
   */
  const saveIndex = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('인덱스 저장 완료:', data.message);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || '인덱스 저장 실패');
      }
    } catch (error) {
      console.error('인덱스 저장 오류:', error);
      throw error;
    }
  }, [API_BASE_URL]);

  /**
   * 인덱스 파일 불러오기
   * @param {string} directory - 인덱스를 불러올 디렉토리 경로
   */
  const loadIndex = useCallback(async (directory) => {
    if (!directory) return;

    setIndexStatus('loading');

    try {
      const response = await fetch(`${API_BASE_URL}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootDir: directory }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIndexStatus('loaded');
        setIsWatching(true);
        setTotalFiles(data.total || 0);
        setCurrentDirectory(directory);
        setLastUpdateTime(new Date());
        
        console.log('인덱스 불러오기 완료:', data.message);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || '인덱스 불러오기 실패');
      }
    } catch (error) {
      console.error('인덱스 불러오기 오류:', error);
      setIndexStatus('not-loaded');
      setIsWatching(false);
      throw error;
    }
  }, [API_BASE_URL]);

  /**
   * 파일 감시 시작/중지 토글
   */
  const toggleWatching = useCallback(async () => {
    if (!currentDirectory) return;

    try {
      if (isWatching) {
        // 감시 중지
        const response = await fetch(`${API_BASE_URL}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsWatching(false);
          console.log('파일 감시 중지:', data.message);
        } else {
          throw new Error(data.message || '감시 중지 실패');
        }
      } else {
        // 감시 시작 (인덱스 다시 로드)
        await loadIndex(currentDirectory);
      }
    } catch (error) {
      console.error('감시 상태 변경 오류:', error);
      throw error;
    }
  }, [currentDirectory, isWatching, loadIndex, API_BASE_URL]);

  /**
   * 인덱스 상태 초기화
   */
  const resetIndex = useCallback(() => {
    setIndexStatus('not-loaded');
    setIsWatching(false);
    setTotalFiles(0);
    setCurrentDirectory('');
    setLastUpdateTime(null);
    setIsIndexing(false);
  }, []);

  // 컴포넌트 마운트 시 기존 인덱스 상태 로드
  useEffect(() => {
    loadIndexStatus();
  }, [loadIndexStatus]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 필요한 경우 정리 작업 수행
    };
  }, []);

  // 주기적 상태 확인 (옵션)
  useEffect(() => {
    let interval;
    
    if (isWatching && indexStatus === 'loaded') {
      // 10초마다 상태 확인 (실제 환경에서는 더 긴 간격 사용)
      interval = setInterval(() => {
        // 필요한 경우 백엔드에서 상태 정보 가져오기
        // 현재는 클라이언트 상태만 관리
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, indexStatus]);

  return {
    // 상태
    indexStatus,
    isWatching,
    totalFiles,
    currentDirectory,
    lastUpdateTime,
    isIndexing,
    
    // 액션
    indexDirectory,
    saveIndex,
    loadIndex,
    toggleWatching,
    resetIndex,
  };
};

export default useSearchIndex;