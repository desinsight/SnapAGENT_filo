/**
 * 성능 모니터링 훅
 * 
 * @description 컴포넌트 렌더링 성능과 메모리 사용량을 모니터링하는 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useEffect, useRef, useCallback } from 'react';

export const usePerformanceMonitor = (componentName, options = {}) => {
  const {
    enabled = false, // 개발 모드에서도 비활성화
    logRenderTime = true,
    logMemoryUsage = true,
    logRerenderCount = true,
    threshold = 16 // 60fps 기준
  } = options;

  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const memoryUsageRef = useRef(null);

  // 렌더링 시간 측정
  const measureRenderTime = useCallback(() => {
    if (!enabled || !logRenderTime) return;

    const now = performance.now();
    const renderTime = now - lastRenderTimeRef.current;
    
    if (renderTime > threshold) {
      // console.warn(
      //   `[Performance] ${componentName} 렌더링 시간: ${renderTime.toFixed(2)}ms (임계값: ${threshold}ms)`
      // );
    }
    
    lastRenderTimeRef.current = now;
  }, [enabled, logRenderTime, componentName, threshold]);

  // 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    if (!enabled || !logMemoryUsage || !performance.memory) return;

    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    
    const usagePercent = (usedMB / limitMB) * 100;
    
    if (usagePercent > 80) {
      // console.warn(
      //   `[Performance] ${componentName} 메모리 사용량: ${usedMB}MB/${totalMB}MB (${usagePercent.toFixed(1)}%)`
      // );
    }
    
    memoryUsageRef.current = { usedMB, totalMB, limitMB, usagePercent };
  }, [enabled, logMemoryUsage, componentName]);

  // 리렌더링 횟수 측정
  const measureRerenderCount = useCallback(() => {
    if (!enabled || !logRerenderCount) return;

    renderCountRef.current++;
    
    if (renderCountRef.current % 10 === 0) {
      // console.log(
      //   `[Performance] ${componentName} 리렌더링 횟수: ${renderCountRef.current}회`
      // );
    }
  }, [enabled, logRerenderCount, componentName]);

  // 성능 측정 실행 (매 렌더링마다 실행하지 않음)
  useEffect(() => {
    if (!enabled) return;

    // RAF를 사용하여 성능 측정을 다음 프레임으로 지연
    const rafId = requestAnimationFrame(() => {
      measureRenderTime();
      measureMemoryUsage();
      measureRerenderCount();
    });

    return () => cancelAnimationFrame(rafId);
  });

  // 컴포넌트 언마운트 시 최종 통계
  useEffect(() => {
    return () => {
      if (!enabled) return;

      // console.log(
      //   `[Performance] ${componentName} 최종 통계:`,
      //   {
      //     totalRenders: renderCountRef.current,
      //     finalMemoryUsage: memoryUsageRef.current
      //   }
      // );
    };
  }, [enabled, componentName]);

  // 성능 데이터 반환
  const getPerformanceData = useCallback(() => ({
    renderCount: renderCountRef.current,
    memoryUsage: memoryUsageRef.current,
    lastRenderTime: lastRenderTimeRef.current
  }), []);

  // 성능 리셋
  const resetPerformanceData = useCallback(() => {
    renderCountRef.current = 0;
    lastRenderTimeRef.current = 0;
    memoryUsageRef.current = null;
  }, []);

  return {
    getPerformanceData,
    resetPerformanceData,
    measureRenderTime,
    measureMemoryUsage,
    measureRerenderCount
  };
};

export default usePerformanceMonitor; 