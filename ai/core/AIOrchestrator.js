/**
 * ToolOrchestrator.js
 * 순수 도구 조율자 (Tool Orchestrator Only)
 * 
 * 🛠️ 역할:
 * - 도구들의 조율 및 실행만 담당
 * - JSON 결과만 반환 (자연어 처리 X)
 * - 구독 기반 권한 관리
 * 
 * ❌ 하지 않는 것:
 * - 자연어 처리 및 응답 생성
 * - AI 역할 흉내내기
 * - 복잡한 메시지 분석
 */

import { ServiceRegistry } from './ServiceRegistry.js';
import { Logger, CacheManager, LifecycleManager, ErrorHandler } from '../common/index.js';
import os from 'os';
import path from 'path';

export class ToolOrchestrator {
  constructor(serviceRegistry = null, subscriptionService = null, logger = null, cacheManager = null, lifecycleManager = null, errorHandler = null) {
    // 의존성 주입
    this.serviceRegistry = serviceRegistry || new ServiceRegistry(subscriptionService);
    this.subscriptionService = subscriptionService;
    this.logger = logger || Logger.component('ToolOrchestrator');
    this.cacheManager = cacheManager || new CacheManager();
    this.lifecycleManager = lifecycleManager || new LifecycleManager();
    this.errorHandler = errorHandler || new ErrorHandler();
    
    // 생명주기 관리자에 의존성 추가
    this.lifecycleManager.addDependency(this.serviceRegistry);
    
    // Tool 정의 (7단계 요구사항)
    this.toolDefinition = {
      name: "orchestrator",
      description: "여러 서비스를 조율하여 복잡한 작업을 수행하는 도구",
      version: "2.0.0",
      subscription_tier: "basic",
      category: "orchestration",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "services": {
            "type": "array",
            "description": "실행할 서비스 목록",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "description": "서비스 이름" },
                "parameters": { "type": "object", "description": "서비스 파라미터" }
              },
              "required": ["name", "parameters"]
            }
          },
          "workflow": {
            "type": "string",
            "enum": ["sequential", "parallel"],
            "description": "서비스 실행 방식",
            "default": "sequential"
          }
        },
        "required": ["services"]
      }
    };
  }

  async initialize() {
    return await this.lifecycleManager.initialize(async () => {
      this.logger.log('초기화 시작...', '🔧');

      // 서비스 레지스트리가 이미 초기화되지 않았다면 초기화 (생명주기 관리자가 처리)

      this.logger.success('초기화 완료', '✅');
      this.logger.info(`등록된 서비스: ${this.serviceRegistry.getAvailableServices().length}개`, '📦');
      this.logger.info(`구독 기반 권한 관리: ${this.subscriptionService ? '활성화' : '비활성화'}`, '🔒');
    });
  }

  /**
   * 🔒 구독된 서비스만 조율하는 핵심 메서드 (7단계 요구사항)
   */
  async executeTool(parameters, userId = null) {
    return await this.lifecycleManager.safeExecute(async () => {
      const startTime = performance.now();
      
      this.logger.log(`Tool 실행 시작: orchestrator (사용자: ${userId})`, '🎯');
      
      // 1. 사용자별 구독된 서비스 목록 가져오기
      const availableServices = await this.serviceRegistry.getServicesForAI(userId);
      const subscribedServices = availableServices.filter(s => s.function.subscription_info?.subscribed);
      
      this.logger.info(`사용 가능한 서비스: ${availableServices.length}개`, '📦');
      this.logger.info(`구독된 서비스: ${subscribedServices.length}개`, '✅');
      
      if (subscribedServices.length === 0) {
        return {
          success: false,
          error: 'subscription_required',
          message: '사용 가능한 구독 서비스가 없습니다.',
          available_services: availableServices.map(s => ({
            name: s.function.name,
            description: s.function.description,
            subscription_required: !s.function.subscribed
          }))
        };
      }

      // 2. 요청된 서비스들이 구독되어 있는지 확인
      const { services, workflow = 'sequential' } = parameters;
      const validServices = [];
      const invalidServices = [];

      for (const serviceCall of services) {
        const subscribedService = subscribedServices.find(s => s.function.name === serviceCall.name);
        if (subscribedService) {
          validServices.push(serviceCall);
        } else {
          invalidServices.push(serviceCall.name);
        }
      }

      if (invalidServices.length > 0) {
        return {
          success: false,
          error: 'subscription_required',
          message: `다음 서비스들에 대한 구독이 필요합니다: ${invalidServices.join(', ')}`,
          invalid_services: invalidServices,
          subscribed_services: subscribedServices.map(s => s.function.name)
        };
      }

      // 3. 구독된 서비스만으로 작업 조율
      const result = await this.orchestrateServices(validServices, subscribedServices, userId, workflow);
      
      const executionTime = performance.now() - startTime;
      this.logger.success(`Tool 실행 완료: orchestrator (${executionTime.toFixed(2)}ms)`, '✅');

      return {
        success: true,
        result: result,
        services_executed: validServices.map(s => s.name),
        workflow_type: workflow,
        execution_time: `${executionTime.toFixed(2)}ms`,
        subscription_status: 'verified'
      };
    });
  }

  /**
   * 🔄 서비스 조율 메서드 (구독 기반)
   */
  async orchestrateServices(serviceCalls, subscribedServices, userId, workflow = 'sequential') {
    this.logger.log(`서비스 조율 시작: ${workflow} 방식으로 ${serviceCalls.length}개 서비스 실행`, '🎼');
    
    const context = {
      userId: userId,
      timestamp: new Date().toISOString(),
      subscriptionTier: null
    };

    // 구독 등급 정보 추가
    if (this.subscriptionService && userId) {
      // 첫 번째 서비스의 구독 등급을 사용 (모든 서비스가 구독되어 있다고 가정)
      context.subscriptionTier = await this.subscriptionService.getUserSubscriptionTier(userId, serviceCalls[0]?.name);
    }

    if (workflow === 'parallel') {
      return await this.executeServicesInParallel(serviceCalls, subscribedServices, context);
    } else {
      return await this.executeServicesSequentially(serviceCalls, subscribedServices, context);
    }
  }

  /**
   * 순차 실행
   */
  async executeServicesSequentially(serviceCalls, subscribedServices, context) {
    const results = [];
    
    for (const call of serviceCalls) {
      const service = this.serviceRegistry.getService(call.name);
      if (!service) {
        results.push({
          serviceName: call.name,
          error: 'Service not found',
          success: false
        });
        continue;
      }

      try {
        this.logger.log(`서비스 실행: ${call.name}`, '🚀');
        const result = await service.execute(call.parameters, context);
        results.push({
          serviceName: call.name,
          result: result,
          success: true
        });
        
        // 사용량 기록
        if (this.subscriptionService && context.userId) {
          await this.subscriptionService.recordUsage(context.userId, call.name);
        }
        
      } catch (err) {
        this.logger.error(`서비스 실행 실패: ${call.name}`, err, '❌');
        results.push({
          serviceName: call.name,
          error: err.message,
          success: false
        });
      }
    }

    return results;
  }

  /**
   * 병렬 실행
   */
  async executeServicesInParallel(serviceCalls, subscribedServices, context) {
    const promises = serviceCalls.map(async (call) => {
      const service = this.serviceRegistry.getService(call.name);
      if (!service) {
        return {
          serviceName: call.name,
          error: 'Service not found',
          success: false
        };
      }

      try {
        this.logger.log(`서비스 병렬 실행: ${call.name}`, '🚀');
        const result = await service.execute(call.parameters, context);
        
        // 사용량 기록
        if (this.subscriptionService && context.userId) {
          await this.subscriptionService.recordUsage(context.userId, call.name);
        }
        
        return {
          serviceName: call.name,
          result: result,
          success: true
        };
      } catch (err) {
        this.logger.error(`서비스 병렬 실행 실패: ${call.name}`, err, '❌');
        return {
          serviceName: call.name,
          error: err.message,
          success: false
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * 🎯 Tool 메타데이터 가져오기 (7단계 요구사항)
   */
  getToolDefinition() {
    return this.toolDefinition;
  }

  /**
   * 🔧 사용 가능한 도구 목록 반환 (AI Chat Direct용)
   */
  async getAvailableTools(userId = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const availableServices = await this.serviceRegistry.getServicesForAI(userId);
      const tools = [];

      // 각 서비스를 도구로 변환
      for (const serviceInfo of availableServices) {
        const service = this.serviceRegistry.getService(serviceInfo.function.name);
        if (service && service.parameters) {
          tools.push({
            name: serviceInfo.function.name,
            description: serviceInfo.function.description,
            input_schema: service.parameters
          });
        }
      }

      this.logger.log(`ToolOrchestrator에서 ${tools.length}개 도구 반환: ${tools.map(t => t.name).join(', ')}`, '🔧');
      return tools;
      
    } catch (error) {
      this.logger.error('getAvailableTools 실패', error, '❌');
      return [];
    }
  }

  /**
   * 🚀 개별 도구 실행 (AI Chat Direct용)
   */
  async executeToolRequest(toolName, parameters, userId = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🚀 도구 실행 요청: ${toolName}`);
      console.log(`📋 파라미터:`, JSON.stringify(parameters, null, 2));

      const service = this.serviceRegistry.getService(toolName);
      if (!service) {
        throw new Error(`서비스 '${toolName}'을 찾을 수 없습니다.`);
      }

      // 구독 체크 (구독 서비스가 있는 경우)
      if (this.subscriptionService && userId) {
        const isSubscribed = await this.subscriptionService.checkUserSubscription(userId, toolName);
        if (!isSubscribed) {
          throw new Error(`서비스 '${toolName}'에 대한 구독이 필요합니다.`);
        }
      }

      // 서비스 실행
      const result = await service.execute(parameters, { userId });
      
      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, toolName);
      }

      console.log(`✅ 도구 실행 완료: ${toolName}`);
      return {
        success: true,
        result: result,
        service: toolName
      };
      
    } catch (error) {
      console.error(`❌ 도구 실행 실패: ${toolName}`, error);
      return {
        success: false,
        error: error.message,
        service: toolName
      };
    }
  }

  /**
   * 🔍 구독된 서비스 분석
   */
  async getSubscribedServicesForUser(userId) {
    if (!this.subscriptionService || !userId) {
      return [];
    }

    const availableServices = await this.serviceRegistry.getServicesForAI(userId);
    return availableServices.filter(s => s.function.subscription_info?.subscribed);
  }

  /**
   * 📊 서비스 조율 가능성 확인
   */
  async canOrchestrate(servicesToCheck, userId) {
    const subscribedServices = await this.getSubscribedServicesForUser(userId);
    const subscribedServiceNames = subscribedServices.map(s => s.function.name);
    
    const results = servicesToCheck.map(serviceName => ({
      service: serviceName,
      subscribed: subscribedServiceNames.includes(serviceName),
      available: !!this.serviceRegistry.getService(serviceName)
    }));

    const allSubscribed = results.every(r => r.subscribed);
    const allAvailable = results.every(r => r.available);

    return {
      can_orchestrate: allSubscribed && allAvailable,
      service_status: results,
      total_services: servicesToCheck.length,
      subscribed_count: results.filter(r => r.subscribed).length,
      available_count: results.filter(r => r.available).length
    };
  }

  /**
   * 📊 구독 기반 성능 메트릭 (7단계)
   */
  getPerformanceMetrics() {
    return {
      totalOrchestrations: this.performanceMetrics?.totalRequests || 0,
      averageResponseTime: this.performanceMetrics?.averageResponseTime || 0,
      successRate: this.performanceMetrics?.successRate || 100,
      serviceUsageStats: this.performanceMetrics?.serviceUsage || {},
      subscriptionStats: this.performanceMetrics?.subscriptionStats || {}
    };
  }

  /**
   * 📈 성능 메트릭 업데이트 (구독 기반)
   */
  updatePerformanceMetrics(responseTime, success, servicesUsed = [], userId = null) {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {
        totalRequests: 0,
        totalResponseTime: 0,
        successCount: 0,
        serviceUsage: {},
        subscriptionStats: {}
      };
    }

    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.totalResponseTime += responseTime;
    
    if (success) {
      this.performanceMetrics.successCount++;
    }

    // 서비스 사용량 통계 업데이트
    servicesUsed.forEach(serviceName => {
      this.performanceMetrics.serviceUsage[serviceName] = 
        (this.performanceMetrics.serviceUsage[serviceName] || 0) + 1;
    });

    // 구독 통계 업데이트
    if (userId) {
      if (!this.performanceMetrics.subscriptionStats[userId]) {
        this.performanceMetrics.subscriptionStats[userId] = {
          totalRequests: 0,
          servicesUsed: []
        };
      }
      this.performanceMetrics.subscriptionStats[userId].totalRequests++;
      this.performanceMetrics.subscriptionStats[userId].servicesUsed.push(...servicesUsed);
    }

    // 평균 계산
    this.performanceMetrics.averageResponseTime = 
      this.performanceMetrics.totalResponseTime / this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.successRate = 
      (this.performanceMetrics.successCount / this.performanceMetrics.totalRequests) * 100;
  }

  /**
   * 🌟 구독 기반 시스템 상태 (7단계)
   */
  getSystemStatus() {
    const performanceMetrics = this.getPerformanceMetrics();
    
    return {
      // Core Tool Orchestrator Status
      orchestrator: {
        initialized: this.isInitialized,
        version: '2.0.0-SubscriptionBased',
        status: this.isInitialized ? 'ONLINE' : 'INITIALIZING',
        uptime: process.uptime(),
        mode: 'Tool-Based-Orchestration'
      },

      // Tool Capabilities (7단계 요구사항)
      toolCapabilities: {
        toolDefinition: this.toolDefinition,
        subscriptionAware: !!this.subscriptionService,
        parallelExecution: true,
        sequentialExecution: true,
        subscriptionValidation: true,
        usageTracking: true
      },

      // Service Ecosystem (구독 기반)
      serviceEcosystem: {
        services: this.serviceRegistry.getAvailableServices().map(service => ({
          name: service.name,
          description: service.description,
          available: service.available,
          category: service.category || 'general',
          lastUsed: performanceMetrics.serviceUsageStats[service.name] ? 'Recently' : 'Never',
          subscriptionRequired: true // 모든 서비스는 구독 기반
        })),
        totalServices: this.serviceRegistry.getAvailableServices().length,
        activeServices: this.serviceRegistry.getAvailableServices().filter(s => s.available).length,
        subscriptionBasedAccess: true
      },

      // Performance Analytics (구독 기반)
      performance: {
        ...performanceMetrics,
        healthScore: this.calculateSubscriptionHealthScore(performanceMetrics),
        reliability: performanceMetrics.successRate >= 95 ? 'Excellent' : 
                    performanceMetrics.successRate >= 90 ? 'Good' : 'Needs Attention',
        scalability: 'Subscription-Based'
      },

      // System Capabilities (7단계)
      capabilities: {
        subscriptionOrchestration: true,
        serviceCoordination: true,
        parallelExecution: true,
        sequentialExecution: true,
        subscriptionValidation: true,
        usageTracking: true,
        gracefulSubscriptionFallbacks: true
      },

      // Timestamp and Version
      timestamp: new Date().toISOString(),
      systemVersion: '2.0.0-SubscriptionBased',
      buildInfo: {
        architecture: 'Subscription-Based Tool Orchestration',
        designPrinciples: ['Subscription Management', 'Service Coordination', 'Performance', 'Reliability'],
        targetMarket: 'Subscription-Based Services'
      }
    };
  }

  /**
   * 🏥 구독 기반 시스템 건강 점수 계산
   */
  calculateSubscriptionHealthScore(metrics) {
    let score = 100;
    
    // Success rate impact
    score = score * (metrics.successRate / 100);
    
    // Response time impact
    if (metrics.averageResponseTime > 5000) {
      score -= 20;
    } else if (metrics.averageResponseTime > 2000) {
      score -= 10;
    }
    
    // Service availability
    const availableServices = this.serviceRegistry.getAvailableServices().filter(s => s.available).length;
    const totalServices = this.serviceRegistry.getAvailableServices().length;
    const serviceHealthRatio = totalServices > 0 ? availableServices / totalServices : 1;
    score = score * serviceHealthRatio;
    
    // Subscription service availability
    if (!this.subscriptionService) {
      score -= 20; // 구독 서비스가 없으면 점수 감소
    }
    
    return Math.max(Math.round(score), 0);
  }

  /**
   * 정리 작업 (7단계)
   */
  async cleanup() {
    try {
      if (this.serviceRegistry) {
        await this.serviceRegistry.cleanup();
      }

      // 성능 메트릭 정리
      this.performanceMetrics = null;

      this.isInitialized = false;
      console.log('✅ Tool Orchestrator 정리 완료');

    } catch (error) {
      console.error('❌ Tool Orchestrator 정리 실패:', error);
    }
  }

  /**
   * 🎯 Tool 인터페이스 구현 (7단계 요구사항)
   * 다른 Tool들과 동일한 execute 인터페이스 제공
   */
  async execute(parameters, context = {}) {
    return await this.executeTool(parameters, context.userId);
  }

  /**
   * 🔧 도구 실행 요청 처리 (순수 도구 조율만)
   * 외부 AI가 분석한 도구 요청을 받아서 실행하고 JSON 결과만 반환
   */
  async executeToolRequest(toolName, parameters, userId = 'anonymous') {
    try {
      console.log(`🔧 ToolOrchestrator.executeToolRequest() 호출: ${toolName}`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 구독된 서비스 확인
      const availableServices = await this.serviceRegistry.getServicesForAI(userId);
      let subscribedServices = availableServices.filter(s => s.function.subscription_info?.subscribed);
      
      // 🧪 개발환경: 구독된 서비스가 없으면 모든 서비스 사용 허용
      if (subscribedServices.length === 0) {
        console.log('🧪 [DEV] 구독된 서비스가 없어서 모든 서비스를 구독된 것으로 처리합니다.');
        subscribedServices = availableServices.map(service => ({
          ...service,
          function: {
            ...service.function,
            subscription_info: { subscribed: true, tier: 'premium' }
          }
        }));
      }

      // 요청된 도구가 구독되어 있는지 확인
      const requestedService = subscribedServices.find(s => s.function.name === toolName);
      if (!requestedService) {
        return {
          success: false,
          error: 'subscription_required',
          message: `${toolName} 서비스에 대한 구독이 필요합니다.`,
          available_services: subscribedServices.map(s => s.function.name)
        };
      }

      // 단일 서비스 실행
      const serviceCalls = [{
        name: toolName,
        parameters: parameters
      }];

      const result = await this.orchestrateServices(
        serviceCalls, 
        subscribedServices, 
        userId, 
        'sequential'
      );

      // 순수 JSON 결과만 반환 (자연어 변환 X)
      const firstResult = result[0];
      return {
        success: true,
        tool_name: toolName,
        result: firstResult?.result || null, // 실제 결과 데이터만 반환
        execution_time: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ ToolOrchestrator.executeToolRequest() 실패:', error);
      
      return {
        success: false,
        error: error.message,
        tool_name: toolName
      };
    }
  }













}