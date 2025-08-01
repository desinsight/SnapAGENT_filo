/**
 * ai/common/index.js
 * 공통 모듈들의 통합 내보내기
 */

export { Logger } from './Logger.js';
export { CacheManager } from './CacheManager.js';
export { LifecycleManager } from './LifecycleManager.js';
export { ErrorHandler } from './ErrorHandler.js';

// 편의를 위한 기본 인스턴스들
import { Logger } from './Logger.js';
import { CacheManager } from './CacheManager.js';
import { LifecycleManager } from './LifecycleManager.js';
import { ErrorHandler } from './ErrorHandler.js';

// 기본 설정으로 인스턴스 생성
export const defaultLogger = Logger;
export const defaultCacheManager = new CacheManager();
export const defaultLifecycleManager = new LifecycleManager();
export const defaultErrorHandler = new ErrorHandler();

// 기본 복구 전략 등록
defaultErrorHandler.registerDefaultStrategies(); 