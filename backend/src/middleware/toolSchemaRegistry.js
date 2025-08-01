/**
 * Tool Schema Registry - 4단계
 * AI Tool들의 JSON Schema 관리 및 유효성 검증
 * 구독 기반 Tool 메타데이터 제공
 */

// import Ajv from 'ajv';
// import addFormats from 'ajv-formats';

export class ToolSchemaRegistry {
  constructor() {
    // JSON Schema 검증기 초기화 (AJV 대신 간단한 검증 구현)
    this.ajv = null; // AJV 라이브러리가 설치되지 않음
    
    // Tool 스키마 저장소
    this.toolSchemas = new Map();
    this.compiledValidators = new Map();
    
    // 구독 서비스 참조 (의존성 주입)
    this.subscriptionService = null;
    
    // 캐시 시스템
    this.schemaCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분
    
    console.log('📋 ToolSchemaRegistry 초기화됨');
  }

  /**
   * 구독 서비스 설정
   */
  setSubscriptionService(subscriptionService) {
    this.subscriptionService = subscriptionService;
    console.log('🔗 ToolSchemaRegistry에 구독 서비스 연결됨');
  }

  /**
   * Tool 스키마 등록
   */
  registerToolSchema(toolName, schema, subscriptionInfo = null) {
    try {
      // Claude API 형식으로 스키마 저장
      const toolSchema = {
        name: toolName,
        description: schema.description || `${toolName} 도구`,
        input_schema: schema.input_schema || schema
      };

      // 간단한 스키마 검증기 생성 (AJV 대신)
      const validator = this.createSimpleValidator(toolSchema.input_schema);
      
      // 스키마 저장
      this.toolSchemas.set(toolName, {
        schema: toolSchema,
        subscriptionInfo: subscriptionInfo,
        registeredAt: new Date().toISOString(),
        version: '1.0.0'
      });
      
      // 검증기 저장
      this.compiledValidators.set(toolName, validator);
      
      console.log(`✅ Tool 스키마 등록: ${toolName} (${toolSchema.description})`);
      return true;
      
    } catch (error) {
      console.error(`❌ Tool 스키마 등록 실패 [${toolName}]:`, error.message);
      return false;
    }
  }

  /**
   * 간단한 스키마 검증기 생성 (AJV 대신)
   */
  createSimpleValidator(schema) {
    return (data) => {
      try {
        const errors = [];
        
        // 기본 타입 체크
        if (schema.type === 'object' && typeof data !== 'object') {
          errors.push('data must be an object');
          return { valid: false, errors };
        }
        
        // 필수 필드 체크
        if (schema.required && Array.isArray(schema.required)) {
          for (const field of schema.required) {
            if (!(field in data)) {
              errors.push(`missing required field: ${field}`);
            }
          }
        }
        
        // 프로퍼티 체크
        if (schema.properties && typeof data === 'object') {
          for (const [key, value] of Object.entries(data)) {
            const propSchema = schema.properties[key];
            if (propSchema) {
              // 타입 체크
              if (propSchema.type && typeof value !== propSchema.type) {
                errors.push(`${key} must be ${propSchema.type}, got ${typeof value}`);
              }
              
              // enum 체크
              if (propSchema.enum && !propSchema.enum.includes(value)) {
                errors.push(`${key} must be one of: ${propSchema.enum.join(', ')}`);
              }
            }
          }
        }
        
        return { valid: errors.length === 0, errors };
        
      } catch (error) {
        return { valid: false, errors: [`validation error: ${error.message}`] };
      }
    };
  }

  /**
   * Tool 파라미터 유효성 검증
   */
  validateToolParameters(toolName, parameters) {
    try {
      const validator = this.compiledValidators.get(toolName);
      
      if (!validator) {
        return {
          valid: false,
          errors: [`Tool '${toolName}' 스키마가 등록되지 않음`]
        };
      }

      const isValid = validator(parameters);
      
      return {
        valid: isValid.valid,
        errors: isValid.valid ? [] : isValid.errors
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [`검증 중 오류 발생: ${error.message}`]
      };
    }
  }

  /**
   * 사용자별 Tool 메타데이터 제공 (구독 기반)
   */
  async getToolMetadataForUser(userId, toolName = null) {
    try {
      const cacheKey = `${userId}:${toolName || 'all'}`;
      
      // 캐시 확인
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      let toolMetadata = [];

      // 특정 Tool 요청
      if (toolName) {
        const metadata = await this.getSingleToolMetadata(userId, toolName);
        toolMetadata = metadata ? [metadata] : [];
      } else {
        // 모든 Tool 메타데이터
        for (const [name] of this.toolSchemas) {
          const metadata = await this.getSingleToolMetadata(userId, name);
          if (metadata) {
            toolMetadata.push(metadata);
          }
        }
      }

      // 캐시에 저장
      this.setCache(cacheKey, toolMetadata);

      return toolMetadata;
      
    } catch (error) {
      console.error('❌ Tool 메타데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 개별 Tool 메타데이터 생성
   */
  async getSingleToolMetadata(userId, toolName) {
    try {
      const toolInfo = this.toolSchemas.get(toolName);
      if (!toolInfo) {
        return null;
      }

      // 기본 메타데이터
      let metadata = {
        name: toolName,
        schema: toolInfo.schema,
        version: toolInfo.version,
        registeredAt: toolInfo.registeredAt,
        available: true
      };

      // 구독 정보 추가
      if (this.subscriptionService && userId) {
        const isSubscribed = await this.subscriptionService.checkUserSubscription(userId, toolName);
        const subscriptionTier = await this.subscriptionService.getUserSubscriptionTier(userId, toolName);
        
        metadata.subscription = {
          subscribed: isSubscribed,
          tier: subscriptionTier,
          required: !isSubscribed
        };

        // 구독되지 않은 경우 제한된 스키마 제공
        if (!isSubscribed) {
          metadata.available = false;
          metadata.subscription.message = '이 도구를 사용하려면 구독이 필요합니다.';
          
          // 구독 안내 정보
          if (this.subscriptionService.getSubscriptionRequiredMessage) {
            const subscriptionInfo = await this.subscriptionService.getSubscriptionRequiredMessage(toolName, userId);
            metadata.subscription.upgrade_info = subscriptionInfo;
          }
        }
      }

      return metadata;
      
    } catch (error) {
      console.error(`❌ Tool 메타데이터 생성 실패 [${toolName}]:`, error);
      return null;
    }
  }

  /**
   * 등록된 모든 Tool 목록
   */
  getRegisteredTools() {
    return Array.from(this.toolSchemas.keys());
  }

  /**
   * 모든 Tool 정보 가져오기 (Claude API 형식)
   */
  getAllTools() {
    const tools = [];
    for (const [name, toolInfo] of this.toolSchemas) {
      tools.push({
        name: name,
        description: toolInfo.schema.description || `${name} 도구`,
        input_schema: toolInfo.schema.input_schema || toolInfo.schema
      });
    }
    console.log(`🔍 getAllTools 반환: ${tools.length}개 도구`);
    return tools;
  }

  /**
   * 사용자별 사용 가능한 Tool 목록 (getToolsForUser 호환)
   */
  async getToolsForUser(userId = null, includeUnsubscribed = false) {
    try {
      const tools = [];
      
      for (const [name, toolInfo] of this.toolSchemas) {
        let isSubscribed = true;
        let subscriptionTier = 'free';
        
        // 구독 서비스가 있으면 구독 상태 확인
        if (this.subscriptionService && userId) {
          try {
            isSubscribed = await this.subscriptionService.checkUserSubscription(userId, name);
            subscriptionTier = await this.subscriptionService.getUserSubscriptionTier(userId, name);
          } catch (error) {
            console.warn(`⚠️ 구독 체크 실패 (${name}):`, error.message);
            isSubscribed = true; // 실패시 기본 허용
          }
        }
        
        // 구독되지 않은 도구는 제외 (includeUnsubscribed가 false인 경우)
        if (!isSubscribed && !includeUnsubscribed) {
          continue;
        }
        
        tools.push({
          name: name,
          description: toolInfo.schema.description || `${name} 도구`,
          input_schema: toolInfo.schema,
          version: toolInfo.version,
          category: 'general',
          subscription_tier: subscriptionTier,
          subscription_info: {
            subscribed: isSubscribed,
            current_tier: subscriptionTier,
            required_tier: toolInfo.subscriptionInfo?.required_tier || 'free'
          }
        });
      }
      
      return tools;
      
    } catch (error) {
      console.error('❌ getToolsForUser 오류:', error);
      return [];
    }
  }

  /**
   * 성능 메트릭 조회 (getMetrics 호환)
   */
  getMetrics() {
    return {
      schemasCount: this.toolSchemas.size,
      validatorsCount: this.compiledValidators.size,
      cacheSize: this.schemaCache.size,
      hasSubscriptionService: this.subscriptionService !== null,
      registeredTools: Array.from(this.toolSchemas.keys())
    };
  }

  /**
   * Tool 스키마 상세 정보
   */
  getToolSchema(toolName) {
    return this.toolSchemas.get(toolName);
  }

  /**
   * Tool 스키마 업데이트
   */
  updateToolSchema(toolName, newSchema, subscriptionInfo = null) {
    if (!this.toolSchemas.has(toolName)) {
      console.warn(`⚠️ Tool '${toolName}' 스키마가 존재하지 않음`);
      return false;
    }

    return this.registerToolSchema(toolName, newSchema, subscriptionInfo);
  }

  /**
   * Tool 스키마 제거
   */
  unregisterToolSchema(toolName) {
    const removed = this.toolSchemas.delete(toolName) && this.compiledValidators.delete(toolName);
    
    if (removed) {
      // 관련 캐시 무효화
      this.invalidateToolCache(toolName);
      console.log(`🗑️ Tool 스키마 제거: ${toolName}`);
    }
    
    return removed;
  }

  /**
   * 스키마 통계
   */
  getStatistics() {
    return {
      totalTools: this.toolSchemas.size,
      registeredTools: Array.from(this.toolSchemas.keys()),
      cacheSize: this.schemaCache.size,
      hasSubscriptionService: this.subscriptionService !== null
    };
  }

  /**
   * 캐시 관리
   */
  getFromCache(key) {
    const cached = this.schemaCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.schemaCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 캐시 크기 제한
    if (this.schemaCache.size > 100) {
      const oldestKey = this.schemaCache.keys().next().value;
      this.schemaCache.delete(oldestKey);
    }
  }

  invalidateToolCache(toolName) {
    const keysToDelete = [];
    for (const key of this.schemaCache.keys()) {
      if (key.includes(toolName) || key.includes('all')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.schemaCache.delete(key));
  }

  /**
   * 전체 캐시 무효화
   */
  clearCache() {
    this.schemaCache.clear();
    console.log('🗑️ Tool 스키마 캐시 전체 무효화');
  }

  /**
   * ServiceRegistry로부터 Tool들을 자동 등록
   */
  async registerToolsFromServiceRegistry(serviceRegistry) {
    try {
      console.log('🔄 ServiceRegistry로부터 Tool 스키마 자동 등록 중...');
      
      const services = serviceRegistry.getAvailableServices();
      let registeredCount = 0;

      for (const serviceInfo of services) {
        const service = serviceRegistry.getService(serviceInfo.name);
        
        if (service && service.parameters) {
          // Tool 메타데이터 추출
          const subscriptionInfo = service.getToolMetadata ? service.getToolMetadata() : null;
          
          // 스키마 등록
          const success = this.registerToolSchema(
            serviceInfo.name, 
            service.parameters,
            subscriptionInfo
          );
          
          if (success) {
            registeredCount++;
          }
        }
      }

      console.log(`✅ ServiceRegistry로부터 ${registeredCount}개 Tool 스키마 등록 완료`);
      return registeredCount;
      
    } catch (error) {
      console.error('❌ ServiceRegistry Tool 등록 실패:', error);
      return 0;
    }
  }

  /**
   * 정리 작업
   */
  cleanup() {
    this.toolSchemas.clear();
    this.compiledValidators.clear();
    this.clearCache();
    this.subscriptionService = null;
    console.log('✅ ToolSchemaRegistry 정리 완료');
  }
}

// 싱글톤 인스턴스
let toolSchemaRegistryInstance = null;

export const getToolSchemaRegistry = () => {
  if (!toolSchemaRegistryInstance) {
    toolSchemaRegistryInstance = new ToolSchemaRegistry();
  }
  return toolSchemaRegistryInstance;
};

export default ToolSchemaRegistry;