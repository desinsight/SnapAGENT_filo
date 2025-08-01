/**
 * 성능 최적화 유틸리티
 * 
 * @description 디바운싱, 쓰로틀링, 메모이제이션 등 성능 최적화 유틸리티
 * @author AI Assistant
 * @version 1.0.0
 */

// 디바운싱 함수
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// 쓰로틀링 함수
export const throttle = (func, delay) => {
  let lastCall = 0;
  
  return function (...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

// RAF 쓰로틀링 (requestAnimationFrame 기반)
export const rafThrottle = (func) => {
  let ticking = false;
  
  return function (...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        func.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

// 메모이제이션 함수
export const memoize = (func) => {
  const cache = new Map();
  
  return function (...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
};

// 약한 참조 메모이제이션 (객체 키용)
export const weakMemoize = (func) => {
  const cache = new WeakMap();
  
  return function (obj, ...args) {
    if (!cache.has(obj)) {
      cache.set(obj, new Map());
    }
    
    const objCache = cache.get(obj);
    const key = JSON.stringify(args);
    
    if (objCache.has(key)) {
      return objCache.get(key);
    }
    
    const result = func.call(this, obj, ...args);
    objCache.set(key, result);
    
    return result;
  };
};

// 배치 업데이트 함수
export const batchUpdate = (updates, delay = 0) => {
  return new Promise((resolve) => {
    if (delay > 0) {
      setTimeout(() => {
        updates.forEach(update => update());
        resolve();
      }, delay);
    } else {
      // 동기 배치 업데이트
      updates.forEach(update => update());
      resolve();
    }
  });
};

// 성능 측정 함수
export const measurePerformance = (name, func) => {
  return function (...args) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
};

// 메모리 사용량 측정
export const measureMemoryUsage = (name) => {
  if (!performance.memory) {
    console.warn('[Performance] Memory API not available');
    return null;
  }
  
  const memory = performance.memory;
  const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
  const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
  
  console.log(`[Memory] ${name}: ${usedMB}MB/${totalMB}MB (${((usedMB / limitMB) * 100).toFixed(1)}%)`);
  
  return { usedMB, totalMB, limitMB };
};

// 이벤트 리스너 최적화
export const createOptimizedEventListener = (eventType, handler, options = {}) => {
  const {
    passive = true,
    capture = false,
    debounceDelay = 0,
    throttleDelay = 0
  } = options;
  
  let optimizedHandler = handler;
  
  if (debounceDelay > 0) {
    optimizedHandler = debounce(handler, debounceDelay);
  } else if (throttleDelay > 0) {
    optimizedHandler = throttle(handler, throttleDelay);
  }
  
  return {
    type: eventType,
    listener: optimizedHandler,
    options: { passive, capture }
  };
};

// DOM 쿼리 최적화
export const createOptimizedQuerySelector = (selector) => {
  let cachedElement = null;
  let lastQuery = null;
  
  return function (root = document) {
    if (lastQuery === root && cachedElement) {
      return cachedElement;
    }
    
    cachedElement = root.querySelector(selector);
    lastQuery = root;
    
    return cachedElement;
  };
};

// 스타일 계산 최적화
export const optimizeStyleCalculation = (element, styles) => {
  // 스타일 변경을 배치로 처리
  const styleEntries = Object.entries(styles);
  
  // 한 번에 모든 스타일 적용
  styleEntries.forEach(([property, value]) => {
    element.style[property] = value;
  });
};

// 리사이즈 옵저버 최적화
export const createOptimizedResizeObserver = (callback, options = {}) => {
  const { debounceDelay = 100 } = options;
  
  const debouncedCallback = debounce(callback, debounceDelay);
  
  return new ResizeObserver((entries) => {
    debouncedCallback(entries);
  });
};

// 인터섹션 옵저버 최적화
export const createOptimizedIntersectionObserver = (callback, options = {}) => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    debounceDelay = 50
  } = options;
  
  const debouncedCallback = debounce(callback, debounceDelay);
  
  return new IntersectionObserver((entries) => {
    debouncedCallback(entries);
  }, {
    root,
    rootMargin,
    threshold
  });
};

// 웹 워커를 통한 무거운 계산 최적화
export const createWorkerTask = (workerScript) => {
  const worker = new Worker(workerScript);
  
  return function (data) {
    return new Promise((resolve, reject) => {
      const messageHandler = (event) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        resolve(event.data);
      };
      
      const errorHandler = (error) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        reject(error);
      };
      
      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);
      
      worker.postMessage(data);
    });
  };
};

export default {
  debounce,
  throttle,
  rafThrottle,
  memoize,
  weakMemoize,
  batchUpdate,
  measurePerformance,
  measureMemoryUsage,
  createOptimizedEventListener,
  createOptimizedQuerySelector,
  optimizeStyleCalculation,
  createOptimizedResizeObserver,
  createOptimizedIntersectionObserver,
  createWorkerTask
}; 