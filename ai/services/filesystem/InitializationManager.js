/**
 * 🚀 초기화 관리 시스템
 * 의존성 기반 초기화 순서 관리 및 Fallback 메커니즘
 */

import { errorHandler } from './ErrorHandler.js';

export class InitializationManager {
  constructor() {
    this.modules = new Map();
    this.initializationOrder = [];
    this.initializedModules = new Set();
    this.failedModules = new Set();
    this.initializationPromises = new Map();
  }

  /**
   * 모듈 등록
   */
  registerModule(name, module, dependencies = [], options = {}) {
    this.modules.set(name, {
      module,
      dependencies,
      options: {
        required: options.required !== false,
        retryCount: options.retryCount || 3,
        timeout: options.timeout || 30000,
        fallback: options.fallback || null,
        ...options
      }
    });
  }

  /**
   * 의존성 그래프 생성 및 초기화 순서 결정
   */
  buildInitializationOrder() {
    const visited = new Set();
    const temp = new Set();
    const order = [];

    const visit = (moduleName) => {
      if (temp.has(moduleName)) {
        throw new Error(`순환 의존성 감지: ${moduleName}`);
      }
      if (visited.has(moduleName)) {
        return;
      }

      temp.add(moduleName);
      const module = this.modules.get(moduleName);
      
      if (module) {
        for (const dep of module.dependencies) {
          visit(dep);
        }
      }
      
      temp.delete(moduleName);
      visited.add(moduleName);
      order.push(moduleName);
    };

    for (const moduleName of this.modules.keys()) {
      if (!visited.has(moduleName)) {
        visit(moduleName);
      }
    }

    this.initializationOrder = order;
    return order;
  }

  /**
   * 모듈 초기화
   */
  async initializeModule(moduleName) {
    const moduleInfo = this.modules.get(moduleName);
    if (!moduleInfo) {
      throw new Error(`모듈을 찾을 수 없습니다: ${moduleName}`);
    }

    const { module, options } = moduleInfo;
    
    // 이미 초기화된 모듈은 건너뛰기
    if (this.initializedModules.has(moduleName)) {
      return { success: true, moduleName, cached: true };
    }

    // 의존성 확인
    for (const dep of moduleInfo.dependencies) {
      if (!this.initializedModules.has(dep)) {
        throw new Error(`의존성 모듈이 초기화되지 않았습니다: ${dep} -> ${moduleName}`);
      }
    }

    // 초기화 시도
    for (let attempt = 1; attempt <= options.retryCount; attempt++) {
      try {
        console.log(`🚀 ${moduleName} 초기화 시도 ${attempt}/${options.retryCount}...`);
        
        const initPromise = module.initialize();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('초기화 시간 초과')), options.timeout);
        });

        await Promise.race([initPromise, timeoutPromise]);
        
        this.initializedModules.add(moduleName);
        console.log(`✅ ${moduleName} 초기화 완료`);
        
        return { success: true, moduleName, attempt };
        
      } catch (error) {
        console.error(`❌ ${moduleName} 초기화 실패 (시도 ${attempt}/${options.retryCount}):`, error.message);
        
        if (attempt === options.retryCount) {
          // 최종 실패
          this.failedModules.add(moduleName);
          
          if (options.required) {
            throw new Error(`${moduleName} 초기화 실패: ${error.message}`);
          } else {
            // 선택적 모듈 실패 시 fallback 사용
            if (options.fallback) {
              console.log(`🔄 ${moduleName} fallback 사용`);
              return { success: true, moduleName, fallback: true };
            }
            return { success: false, moduleName, error };
          }
        }
        
        // 재시도 전 대기
        await this.delay(1000 * attempt);
      }
    }
  }

  /**
   * 전체 시스템 초기화
   */
  async initializeAll() {
    console.log('🚀 파일 시스템 서비스 초기화 시작...');
    
    try {
      // 초기화 순서 결정
      const order = this.buildInitializationOrder();
      console.log('📋 초기화 순서:', order);
      
      // 순차적 초기화
      for (const moduleName of order) {
        try {
          await this.initializeModule(moduleName);
        } catch (error) {
          const moduleInfo = this.modules.get(moduleName);
          if (moduleInfo?.options.required) {
            throw error;
          }
          // 선택적 모듈 실패는 계속 진행
          console.warn(`⚠️ 선택적 모듈 ${moduleName} 초기화 실패, 계속 진행`);
        }
      }
      
      console.log('✅ 모든 필수 모듈 초기화 완료');
      console.log(`📊 초기화 결과: ${this.initializedModules.size}개 성공, ${this.failedModules.size}개 실패`);
      
      return {
        success: true,
        initialized: Array.from(this.initializedModules),
        failed: Array.from(this.failedModules)
      };
      
    } catch (error) {
      const errorLog = errorHandler.logError(error, { 
        context: 'InitializationManager.initializeAll' 
      });
      
      console.error('❌ 시스템 초기화 실패:', errorLog.userFriendly.message);
      throw error;
    }
  }

  /**
   * 모듈 상태 확인
   */
  getModuleStatus(moduleName) {
    return {
      name: moduleName,
      initialized: this.initializedModules.has(moduleName),
      failed: this.failedModules.has(moduleName),
      hasDependencies: this.modules.get(moduleName)?.dependencies || []
    };
  }

  /**
   * 전체 상태 확인
   */
  getSystemStatus() {
    const status = {};
    for (const moduleName of this.modules.keys()) {
      status[moduleName] = this.getModuleStatus(moduleName);
    }
    
    return {
      totalModules: this.modules.size,
      initializedCount: this.initializedModules.size,
      failedCount: this.failedModules.size,
      modules: status
    };
  }

  /**
   * 모듈 재초기화
   */
  async reinitializeModule(moduleName) {
    this.initializedModules.delete(moduleName);
    this.failedModules.delete(moduleName);
    return await this.initializeModule(moduleName);
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 정리
   */
  async cleanup() {
    console.log('🧹 초기화 관리자 정리 중...');
    
    for (const moduleName of this.initializedModules) {
      const moduleInfo = this.modules.get(moduleName);
      if (moduleInfo?.module.cleanup) {
        try {
          await moduleInfo.module.cleanup();
        } catch (error) {
          console.warn(`⚠️ ${moduleName} 정리 실패:`, error.message);
        }
      }
    }
    
    this.initializedModules.clear();
    this.failedModules.clear();
    this.initializationPromises.clear();
    
    console.log('✅ 초기화 관리자 정리 완료');
  }
}

// 전역 초기화 관리자 인스턴스
export const initManager = new InitializationManager(); 