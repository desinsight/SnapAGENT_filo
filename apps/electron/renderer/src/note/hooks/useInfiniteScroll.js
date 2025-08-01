/**
 * 무한 스크롤 훅
 * 
 * @description 스크롤 기반 무한 로딩 기능을 제공
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = ({
  loadMore,
  hasMore = true,
  loading = false,
  threshold = 100, // 하단에서 몇 px 전에 로딩 시작
  rootMargin = '100px', // Intersection Observer 마진
  enabled = true
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  
  /**
   * 더 많은 데이터 로드
   */
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || isLoadingMore || !enabled) {
      return;
    }
    
    try {
      setIsLoadingMore(true);
      await loadMore();
    } catch (error) {
      console.error('무한 스크롤 로딩 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, loading, isLoadingMore, enabled, loadMore]);

  /**
   * Intersection Observer 설정
   */
  useEffect(() => {
    if (!enabled || !sentinelRef.current) {
      return;
    }

    const sentinel = sentinelRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection Observer:', { 
          isIntersecting: entry.isIntersecting, 
          hasMore, 
          loading, 
          isLoadingMore 
        });
        if (entry.isIntersecting && hasMore && !loading && !isLoadingMore) {
          console.log('Triggering handleLoadMore');
          handleLoadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, loading, isLoadingMore, handleLoadMore, rootMargin]);

  /**
   * 스크롤 기반 감지 (fallback)
   */
  const handleScroll = useCallback((event) => {
    if (!enabled || hasMore === false || loading || isLoadingMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const bottomOffset = scrollHeight - scrollTop - clientHeight;
    
    if (bottomOffset < threshold) {
      handleLoadMore();
    }
  }, [enabled, hasMore, loading, isLoadingMore, threshold, handleLoadMore]);

  /**
   * 수동 로딩 트리거
   */
  const triggerLoadMore = useCallback(() => {
    if (enabled && hasMore && !loading && !isLoadingMore) {
      handleLoadMore();
    }
  }, [enabled, hasMore, loading, isLoadingMore, handleLoadMore]);

  return {
    // 상태
    isLoadingMore,
    
    // 참조
    sentinelRef,
    
    // 핸들러
    handleScroll,
    triggerLoadMore,
    
    // 유틸리티
    canLoadMore: enabled && hasMore && !loading && !isLoadingMore
  };
};