/**
 * CacheManager.js
 * 공통 캐시 관리 모듈 - 모든 AI 코어 컴포넌트에서 사용
 * Map 기반 캐시, 만료 시간, 패턴 기반 무효화 지원
 */

export class CacheManager {
  constructor(expiryMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.expiryMs = expiryMs;
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };
  }

  /**
   * 캐시에서 값 가져오기
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.metrics.misses++;
      return null;
    }

    // 만료 시간 체크
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return item.value;
  }

  /**
   * 캐시에 값 저장하기
   */
  set(key, value, customExpiryMs = null) {
    const expiry = Date.now() + (customExpiryMs || this.expiryMs);
    this.cache.set(key, { value, expiry });
    this.metrics.sets++;
  }

  /**
   * 특정 키 삭제
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.invalidations++;
    }
    return deleted;
  }

  /**
   * 패턴 기반 캐시 무효화
   */
  invalidate(pattern) {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string') {
        // 문자열 패턴 (포함)
        if (key.includes(pattern)) {
          this.cache.delete(key);
          count++;
        }
      } else if (pattern instanceof RegExp) {
        // 정규식 패턴
        if (pattern.test(key)) {
          this.cache.delete(key);
          count++;
        }
      } else if (typeof pattern === 'function') {
        // 함수 패턴
        if (pattern(key)) {
          this.cache.delete(key);
          count++;
        }
      }
    }

    this.metrics.invalidations += count;
    return count;
  }

  /**
   * 만료된 항목들 정리
   */
  cleanup() {
    const now = Date.now();
    let count = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 전체 캐시 비우기
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.metrics.invalidations += size;
    return size;
  }

  /**
   * 캐시 크기 반환
   */
  size() {
    return this.cache.size;
  }

  /**
   * 캐시에 키가 있는지 확인
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 메트릭 반환
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      currentSize: this.cache.size,
      expiryMs: this.expiryMs
    };
  }

  /**
   * 메트릭 초기화
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };
  }
} 