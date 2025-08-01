/**
 * ⚡ 성능 최적화 시스템
 * 메모리 관리, 캐시 최적화, 중복 코드 제거
 */

import { errorHandler } from './ErrorHandler.js';

export class PerformanceOptimizer {
  constructor() {
    this.memoryUsage = new Map();
    this.cacheStats = new Map();
    this.performanceMetrics = {
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    };
    
    // 메모리 모니터링
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
    this.gcInterval = 5 * 60 * 1000; // 5분
    
    // 자동 최적화 시작
    this.startAutoOptimization();
  }

  /**
   * 메모리 사용량 모니터링
   */
  monitorMemoryUsage(moduleName) {
    const usage = process.memoryUsage();
    this.memoryUsage.set(moduleName, {
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      timestamp: Date.now()
    });

    // 메모리 임계값 초과 시 경고
    if (usage.heapUsed > this.memoryThreshold) {
      console.warn(`⚠️ 메모리 사용량 높음: ${moduleName} - ${this.formatBytes(usage.heapUsed)}`);
      this.triggerMemoryOptimization();
    }
  }

  /**
   * 캐시 성능 모니터링
   */
  updateCacheStats(moduleName, hit, miss) {
    if (!this.cacheStats.has(moduleName)) {
      this.cacheStats.set(moduleName, { hits: 0, misses: 0 });
    }
    
    const stats = this.cacheStats.get(moduleName);
    if (hit) stats.hits++;
    if (miss) stats.misses++;
    
    const hitRate = stats.hits / (stats.hits + stats.misses);
    this.performanceMetrics.cacheHitRate = hitRate;
  }

  /**
   * 응답 시간 측정
   */
  measureResponseTime(operation, startTime) {
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.totalOperations++;
    
    // 평균 응답 시간 업데이트
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalOps = this.performanceMetrics.totalOperations;
    this.performanceMetrics.averageResponseTime = 
      (currentAvg * (totalOps - 1) + responseTime) / totalOps;
    
    return responseTime;
  }

  /**
   * 메모리 최적화 트리거
   */
  triggerMemoryOptimization() {
    console.log('🧹 메모리 최적화 시작...');
    
    // 가비지 컬렉션 요청
    if (global.gc) {
      global.gc();
      console.log('✅ 가비지 컬렉션 완료');
    }
    
    // 캐시 정리
    this.clearExpiredCaches();
    
    // 메모리 사용량 재측정
    const usage = process.memoryUsage();
    console.log(`📊 메모리 사용량: ${this.formatBytes(usage.heapUsed)}`);
  }

  /**
   * 만료된 캐시 정리
   */
  clearExpiredCaches() {
    const now = Date.now();
    const cacheTimeout = 30 * 60 * 1000; // 30분
    
    // 각 모듈의 캐시 정리
    for (const [moduleName, cache] of this.cacheStats.entries()) {
      if (cache.lastAccess && (now - cache.lastAccess) > cacheTimeout) {
        console.log(`🗑️ 만료된 캐시 정리: ${moduleName}`);
        this.cacheStats.delete(moduleName);
      }
    }
  }

  /**
   * 자동 최적화 시작
   */
  startAutoOptimization() {
    // 주기적 메모리 최적화
    setInterval(() => {
      this.triggerMemoryOptimization();
    }, this.gcInterval);
    
    // 주기적 성능 메트릭 업데이트
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // 1분마다
  }

  /**
   * 성능 메트릭 업데이트
   */
  updatePerformanceMetrics() {
    const usage = process.memoryUsage();
    this.performanceMetrics.memoryUsage = usage.heapUsed;
    
    // 성능 경고 체크
    if (this.performanceMetrics.averageResponseTime > 1000) {
      console.warn('⚠️ 평균 응답 시간이 1초를 초과했습니다.');
    }
    
    if (this.performanceMetrics.cacheHitRate < 0.5) {
      console.warn('⚠️ 캐시 적중률이 50% 미만입니다.');
    }
  }

  /**
   * 성능 리포트 생성
   */
  generatePerformanceReport() {
    const usage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      metrics: this.performanceMetrics,
      memory: {
        rss: this.formatBytes(usage.rss),
        heapUsed: this.formatBytes(usage.heapUsed),
        heapTotal: this.formatBytes(usage.heapTotal),
        external: this.formatBytes(usage.external)
      },
      cache: {
        modules: Array.from(this.cacheStats.keys()),
        totalHits: Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.hits, 0),
        totalMisses: Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.misses, 0)
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 성능 개선 권장사항 생성
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.performanceMetrics.averageResponseTime > 1000) {
      recommendations.push('응답 시간 최적화가 필요합니다.');
    }
    
    if (this.performanceMetrics.cacheHitRate < 0.5) {
      recommendations.push('캐시 전략을 개선해야 합니다.');
    }
    
    const usage = process.memoryUsage();
    if (usage.heapUsed > this.memoryThreshold) {
      recommendations.push('메모리 사용량을 줄여야 합니다.');
    }
    
    return recommendations;
  }

  /**
   * 바이트 단위 포맷팅
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 성능 최적화 팁 제공
   */
  getOptimizationTips() {
    return {
      memory: [
        '불필요한 객체 참조 제거',
        '큰 데이터 구조 사용 후 즉시 해제',
        '스트림 사용 시 적절한 버퍼 크기 설정'
      ],
      cache: [
        '자주 사용되는 데이터 캐싱',
        '캐시 만료 시간 적절히 설정',
        '캐시 크기 제한 설정'
      ],
      response: [
        '비동기 작업 최대한 활용',
        '불필요한 계산 제거',
        '데이터베이스 쿼리 최적화'
      ]
    };
  }

  /**
   * 정리
   */
  cleanup() {
    console.log('🧹 성능 최적화 시스템 정리 중...');
    
    // 메모리 사용량 초기화
    this.memoryUsage.clear();
    this.cacheStats.clear();
    
    // 메트릭 초기화
    this.performanceMetrics = {
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    };
    
    console.log('✅ 성능 최적화 시스템 정리 완료');
  }
}

// 전역 성능 최적화 인스턴스
export const performanceOptimizer = new PerformanceOptimizer(); 