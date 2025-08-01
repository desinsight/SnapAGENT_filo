/**
 * LifecycleManager.js
 * 공통 생명주기 관리 모듈 - 모든 AI 코어 컴포넌트에서 사용
 * 초기화, 정리, 상태 관리 표준화
 */

export class LifecycleManager {
  constructor() {
    this.isInitialized = false;
    this.isCleaningUp = false;
    this.initializationTime = null;
    this.cleanupTime = null;
    this.dependencies = new Set();
    this.hooks = {
      beforeInitialize: [],
      afterInitialize: [],
      beforeCleanup: [],
      afterCleanup: []
    };
  }

  /**
   * 초기화 상태 확인
   */
  get initialized() {
    return this.isInitialized;
  }

  /**
   * 정리 중 상태 확인
   */
  get cleaningUp() {
    return this.isCleaningUp;
  }

  /**
   * 의존성 추가
   */
  addDependency(dependency) {
    this.dependencies.add(dependency);
  }

  /**
   * 의존성 제거
   */
  removeDependency(dependency) {
    this.dependencies.delete(dependency);
  }

  /**
   * 초기화 전 훅 등록
   */
  onBeforeInitialize(callback) {
    this.hooks.beforeInitialize.push(callback);
  }

  /**
   * 초기화 후 훅 등록
   */
  onAfterInitialize(callback) {
    this.hooks.afterInitialize.push(callback);
  }

  /**
   * 정리 전 훅 등록
   */
  onBeforeCleanup(callback) {
    this.hooks.beforeCleanup.push(callback);
  }

  /**
   * 정리 후 훅 등록
   */
  onAfterCleanup(callback) {
    this.hooks.afterCleanup.push(callback);
  }

  /**
   * 훅 실행
   */
  async executeHooks(hookType, ...args) {
    const hooks = this.hooks[hookType] || [];
    
    for (const hook of hooks) {
      try {
        if (typeof hook === 'function') {
          await hook(...args);
        }
      } catch (error) {
        console.error(`훅 실행 실패 (${hookType}):`, error);
      }
    }
  }

  /**
   * 초기화
   */
  async initialize(initializationFunction = null) {
    if (this.isInitialized) {
      return true;
    }

    if (this.isCleaningUp) {
      throw new Error('정리 중에는 초기화할 수 없습니다');
    }

    try {
      // 초기화 전 훅 실행
      await this.executeHooks('beforeInitialize');

      // 의존성 초기화
      for (const dependency of this.dependencies) {
        if (dependency && typeof dependency.initialize === 'function') {
          await dependency.initialize();
        }
      }

      // 사용자 정의 초기화 함수 실행
      if (initializationFunction && typeof initializationFunction === 'function') {
        await initializationFunction();
      }

      this.isInitialized = true;
      this.initializationTime = Date.now();

      // 초기화 후 훅 실행
      await this.executeHooks('afterInitialize');

      return true;

    } catch (error) {
      this.isInitialized = false;
      this.initializationTime = null;
      throw error;
    }
  }

  /**
   * 정리
   */
  async cleanup(cleanupFunction = null) {
    if (this.isCleaningUp) {
      return true;
    }

    this.isCleaningUp = true;

    try {
      // 정리 전 훅 실행
      await this.executeHooks('beforeCleanup');

      // 사용자 정의 정리 함수 실행
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        await cleanupFunction();
      }

      // 의존성 정리 (역순)
      const dependenciesArray = Array.from(this.dependencies).reverse();
      for (const dependency of dependenciesArray) {
        if (dependency && typeof dependency.cleanup === 'function') {
          await dependency.cleanup();
        }
      }

      this.isInitialized = false;
      this.cleanupTime = Date.now();

      // 정리 후 훅 실행
      await this.executeHooks('afterCleanup');

      return true;

    } catch (error) {
      throw error;
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * 상태 정보 반환
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      cleaningUp: this.isCleaningUp,
      initializationTime: this.initializationTime,
      cleanupTime: this.cleanupTime,
      dependenciesCount: this.dependencies.size,
      hooksCount: {
        beforeInitialize: this.hooks.beforeInitialize.length,
        afterInitialize: this.hooks.afterInitialize.length,
        beforeCleanup: this.hooks.beforeCleanup.length,
        afterCleanup: this.hooks.afterCleanup.length
      }
    };
  }

  /**
   * 강제 재초기화
   */
  async reinitialize(initializationFunction = null) {
    if (this.isInitialized) {
      await this.cleanup();
    }
    return await this.initialize(initializationFunction);
  }

  /**
   * 안전한 실행 (초기화 확인 후 실행)
   */
  async safeExecute(executionFunction) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (typeof executionFunction === 'function') {
      return await executionFunction();
    }
  }
} 