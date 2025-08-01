/**
 * 🔍 시스템 유효성 검증
 * 모든 모듈의 정상 동작 확인 및 통합 테스트
 */

import { errorHandler } from './ErrorHandler.js';
import { initManager } from './InitializationManager.js';
import { performanceOptimizer } from './PerformanceOptimizer.js';

export class SystemValidator {
  constructor() {
    this.validationResults = new Map();
    this.testResults = new Map();
  }

  /**
   * 전체 시스템 유효성 검증
   */
  async validateSystem() {
    console.log('🔍 파일 시스템 서비스 유효성 검증 시작...');
    
    const results = {
      timestamp: new Date().toISOString(),
      modules: {},
      dependencies: {},
      performance: {},
      errors: [],
      warnings: []
    };

    try {
      // 1. 모듈 의존성 검증
      results.dependencies = await this.validateDependencies();
      
      // 2. 각 모듈 개별 검증
      results.modules = await this.validateAllModules();
      
      // 3. 성능 검증
      results.performance = await this.validatePerformance();
      
      // 4. 통합 테스트
      const integrationTest = await this.runIntegrationTests();
      results.integration = integrationTest;
      
      // 5. 결과 요약
      results.summary = this.generateSummary(results);
      
      console.log('✅ 시스템 유효성 검증 완료');
      return results;
      
    } catch (error) {
      const errorLog = errorHandler.logError(error, { 
        context: 'SystemValidator.validateSystem' 
      });
      results.errors.push(errorLog);
      throw error;
    }
  }

  /**
   * 의존성 검증
   */
  async validateDependencies() {
    const results = {
      circularDependencies: [],
      missingDependencies: [],
      valid: true
    };

    try {
      // 순환 의존성 검사
      const order = initManager.buildInitializationOrder();
      console.log('✅ 의존성 순서 검증 완료:', order);
      
      return {
        ...results,
        initializationOrder: order,
        valid: true
      };
      
    } catch (error) {
      results.valid = false;
      results.circularDependencies.push(error.message);
      return results;
    }
  }

  /**
   * 모든 모듈 검증
   */
  async validateAllModules() {
    const results = {};
    
    const modules = [
      'PathResolver',
      'FileOperations', 
      'FileSystemService',
      'FileSystemWatcher',
      'FormatHelper',
      'FileSummary',
      'UserIntentLearner',
      'AutoPathDetector',
      'PeriodicPathScanner',
      'UserPathLearner',
      'PathMapper',
      'AILearningManager'
    ];

    for (const moduleName of modules) {
      try {
        results[moduleName] = await this.validateModule(moduleName);
      } catch (error) {
        results[moduleName] = {
          valid: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * 개별 모듈 검증
   */
  async validateModule(moduleName) {
    const result = {
      name: moduleName,
      valid: false,
      methods: [],
      properties: [],
      errors: []
    };

    try {
      // 모듈 존재 확인
      const modulePath = `./${moduleName}.js`;
      const module = await import(modulePath);
      
      // 클래스 존재 확인
      const className = Object.keys(module).find(key => 
        typeof module[key] === 'function' && 
        module[key].name && 
        module[key].name.toLowerCase().includes(moduleName.toLowerCase())
      );
      
      if (!className) {
        result.errors.push('클래스를 찾을 수 없습니다.');
        return result;
      }

      const Class = module[className];
      
      // 필수 메서드 확인
      const requiredMethods = ['initialize', 'cleanup'];
      for (const method of requiredMethods) {
        if (typeof Class.prototype[method] === 'function') {
          result.methods.push(method);
        } else {
          result.errors.push(`필수 메서드 누락: ${method}`);
        }
      }

      // 인스턴스 생성 테스트
      const instance = new Class();
      result.valid = result.errors.length === 0;
      
      return result;
      
    } catch (error) {
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * 성능 검증
   */
  async validatePerformance() {
    const results = {
      memoryUsage: {},
      responseTime: {},
      cacheEfficiency: {},
      recommendations: []
    };

    try {
      // 메모리 사용량 확인
      const usage = process.memoryUsage();
      results.memoryUsage = {
        rss: usage.rss,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      };

      // 성능 메트릭 확인
      const perfReport = performanceOptimizer.generatePerformanceReport();
      results.responseTime = perfReport.metrics;
      results.cacheEfficiency = perfReport.cache;
      results.recommendations = perfReport.recommendations;

      return results;
      
    } catch (error) {
      results.errors = [error.message];
      return results;
    }
  }

  /**
   * 통합 테스트 실행
   */
  async runIntegrationTests() {
    const results = {
      pathResolution: false,
      fileOperations: false,
      errorHandling: false,
      performance: false
    };

    try {
      // 1. 경로 해석 테스트
      results.pathResolution = await this.testPathResolution();
      
      // 2. 파일 작업 테스트
      results.fileOperations = await this.testFileOperations();
      
      // 3. 에러 처리 테스트
      results.errorHandling = await this.testErrorHandling();
      
      // 4. 성능 테스트
      results.performance = await this.testPerformance();

      return results;
      
    } catch (error) {
      console.error('❌ 통합 테스트 실패:', error.message);
      return results;
    }
  }

  /**
   * 경로 해석 테스트
   */
  async testPathResolution() {
    try {
      // PathResolver 모듈 테스트
      const { PathResolver } = await import('./PathResolver.js');
      const resolver = new PathResolver();
      
      // 기본 경로 해석 테스트
      const testPaths = ['바탕화면', '문서', '다운로드'];
      for (const testPath of testPaths) {
        const result = await resolver.resolvePath(testPath);
        if (!Array.isArray(result) || result.length === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('경로 해석 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 파일 작업 테스트
   */
  async testFileOperations() {
    try {
      // FileOperations 모듈 테스트
      const { FileOperations } = await import('./FileOperations.js');
      const operations = new FileOperations();
      
      // 기본 초기화 테스트
      await operations.initialize();
      
      return true;
    } catch (error) {
      console.error('파일 작업 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 에러 처리 테스트
   */
  async testErrorHandling() {
    try {
      // 에러 핸들러 테스트
      const testError = new Error('테스트 에러');
      testError.code = 'ENOENT';
      
      const errorLog = errorHandler.logError(testError, { 
        context: 'test' 
      });
      
      return errorLog && errorLog.userFriendly && errorLog.userFriendly.message;
    } catch (error) {
      console.error('에러 처리 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 성능 테스트
   */
  async testPerformance() {
    try {
      // 성능 최적화 테스트
      const startTime = Date.now();
      
      // 간단한 작업 수행
      for (let i = 0; i < 100; i++) {
        performanceOptimizer.measureResponseTime('test', startTime);
      }
      
      const report = performanceOptimizer.generatePerformanceReport();
      return report && report.metrics;
    } catch (error) {
      console.error('성능 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 결과 요약 생성
   */
  generateSummary(results) {
    const totalModules = Object.keys(results.modules).length;
    const validModules = Object.values(results.modules).filter(m => m.valid).length;
    const passedTests = Object.values(results.integration).filter(t => t).length;
    const totalTests = Object.keys(results.integration).length;

    return {
      overall: {
        status: results.dependencies.valid && validModules === totalModules ? 'PASS' : 'FAIL',
        score: Math.round((validModules / totalModules) * 100)
      },
      modules: {
        total: totalModules,
        valid: validModules,
        invalid: totalModules - validModules
      },
      tests: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests
      },
      recommendations: results.performance.recommendations || []
    };
  }

  /**
   * 검증 결과 리포트 생성
   */
  generateValidationReport(results) {
    return {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      details: {
        dependencies: results.dependencies,
        modules: results.modules,
        performance: results.performance,
        integration: results.integration
      },
      recommendations: this.generateRecommendations(results)
    };
  }

  /**
   * 개선 권장사항 생성
   */
  generateRecommendations(results) {
    const recommendations = [];

    // 모듈 검증 실패 시
    const invalidModules = Object.values(results.modules).filter(m => !m.valid);
    if (invalidModules.length > 0) {
      recommendations.push(`${invalidModules.length}개 모듈 검증 실패 - 모듈 수정 필요`);
    }

    // 성능 권장사항
    if (results.performance.recommendations) {
      recommendations.push(...results.performance.recommendations);
    }

    // 통합 테스트 실패 시
    const failedTests = Object.values(results.integration).filter(t => !t);
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length}개 통합 테스트 실패 - 시스템 점검 필요`);
    }

    return recommendations;
  }

  /**
   * 🧹 메모리 정리
   */
  async cleanup() {
    try {
      console.log('🔍 SystemValidator 정리 중...');
      
      // 메모리 정리 (SystemValidator는 주로 검증 함수들이므로 특별한 정리 작업 없음)
      console.log('✅ SystemValidator 정리 완료');
      
    } catch (error) {
      console.error('❌ SystemValidator 정리 실패:', error);
    }
  }
}

// 전역 시스템 검증 인스턴스
export const systemValidator = new SystemValidator(); 