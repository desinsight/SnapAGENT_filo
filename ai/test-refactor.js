/**
 * 리팩토링 테스트 스크립트
 */

import { Logger, CacheManager, LifecycleManager, ErrorHandler } from './common/index.js';
import { ServiceRegistry } from './core/ServiceRegistry.js';

async function testRefactoredCode() {
  console.log('🧪 리팩토링된 코드 테스트 시작...\n');

  try {
    // 1. 공통 모듈 테스트
    console.log('1️⃣ 공통 모듈 테스트');
    
    // Logger 테스트
    Logger.log('테스트 메시지', '📝');
    Logger.success('성공 메시지', '✅');
    Logger.error('에러 메시지', new Error('테스트 에러'), '❌');
    
    // 컴포넌트별 로거 테스트
    const componentLogger = Logger.component('TestComponent');
    componentLogger.log('컴포넌트 로그', '🔧');
    
    // CacheManager 테스트
    const cache = new CacheManager(5000); // 5초
    cache.set('test-key', 'test-value');
    console.log('캐시 값:', cache.get('test-key'));
    console.log('캐시 메트릭:', cache.getMetrics());
    
    // LifecycleManager 테스트
    const lifecycle = new LifecycleManager();
    await lifecycle.initialize(() => console.log('초기화 완료'));
    console.log('생명주기 상태:', lifecycle.getStatus());
    
    // ErrorHandler 테스트
    const errorHandler = new ErrorHandler();
    const result = await errorHandler.safeExecute(() => {
      throw new Error('테스트 에러');
    }, { component: 'TestComponent' });
    console.log('에러 처리 결과:', result.success);
    
    console.log('\n2️⃣ ServiceRegistry 리팩토링 테스트');
    
    // ServiceRegistry 테스트 (의존성 주입)
    const serviceRegistry = new ServiceRegistry(
      null, // subscriptionService
      Logger.component('ServiceRegistry'),
      new CacheManager(2 * 60 * 1000),
      new LifecycleManager()
    );
    
    await serviceRegistry.initialize();
    console.log('ServiceRegistry 초기화 완료');
    
    const services = serviceRegistry.getAvailableServices();
    console.log(`등록된 서비스: ${services.length}개`);
    
    await serviceRegistry.cleanup();
    console.log('ServiceRegistry 정리 완료');
    
    console.log('\n✅ 모든 테스트 통과!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 테스트 실행
testRefactoredCode(); 