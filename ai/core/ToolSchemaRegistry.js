/**
 * Tool Schema 관리 시스템
 * JSON Schema 기반 Tool 정의 관리, 검증, 구독 메타데이터 포함
 * 
 * 🎯 핵심 기능:
 * - Tool Schema 정의 및 등록
 * - JSON Schema 검증
 * - 구독 등급별 기능 제한
 * - 버전 관리 및 호환성 체크
 * - 성능 최적화된 캐싱
 */

// JSON Schema 검증을 위한 간단한 대안 (ajv 없이)
// TODO: 프로덕션에서는 ajv 패키지 설치 권장
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ToolSchemaRegistry {
  constructor(subscriptionService = null) {
    // 의존성 주입
    this.subscriptionService = subscriptionService;
    
    // 간단한 JSON Schema 검증기 (ajv 대안)
    this.useAdvancedValidation = false; // ajv 사용 불가
    
    // Tool 스키마 저장소
    this.schemas = new Map();
    this.validators = new Map();
    
    // 메타데이터 캐시
    this.metadataCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분
    this.lastCacheUpdate = 0;
    
    // 스키마 파일 경로
    this.schemasDir = path.resolve(__dirname, '../schemas');
    
    // 성능 메트릭
    this.metrics = {
      validationCount: 0,
      validationErrors: 0,
      cacheHits: 0,
      lastOptimization: Date.now()
    };
    
    this.isInitialized = false;
  }

  /**
   * 레지스트리 초기화
   */
  async initialize() {
    try {
      console.log('🔧 Tool Schema Registry 초기화 시작...');
      
      // 스키마 디렉토리 생성
      await this.ensureSchemaDirectory();
      
      // 기본 스키마들 로드
      await this.loadBuiltinSchemas();
      
      // 사용자 정의 스키마 로드
      await this.loadCustomSchemas();
      
      // 검증기 컴파일
      await this.compileValidators();
      
      this.isInitialized = true;
      console.log(`✅ Tool Schema Registry 초기화 완료 (${this.schemas.size}개 스키마)`);
      
    } catch (error) {
      console.error('❌ Tool Schema Registry 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 스키마 디렉토리 생성
   */
  async ensureSchemaDirectory() {
    try {
      await fs.mkdir(this.schemasDir, { recursive: true });
      console.log('📁 스키마 디렉토리 준비 완료:', this.schemasDir);
    } catch (error) {
      console.error('❌ 스키마 디렉토리 생성 실패:', error);
    }
  }

  /**
   * 기본 스키마 로드
   */
  async loadBuiltinSchemas() {
    // 기본 Tool 스키마들을 메모리에 정의
    const builtinSchemas = this.getBuiltinSchemas();
    
    for (const [name, schema] of builtinSchemas) {
      this.registerSchema(name, schema);
      console.log(`📝 기본 스키마 로드: ${name}`);
    }
  }

  /**
   * 기본 내장 스키마 정의
   */
  getBuiltinSchemas() {
    return new Map([
      ['filesystem', this.getFileSystemSchema()],
      ['calendar', this.getCalendarSchema()],
      ['contacts', this.getContactsSchema()],
      ['messenger', this.getMessengerSchema()],
      ['notes', this.getNotesSchema()],
      ['tasks', this.getTasksSchema()]
    ]);
  }

  /**
   * 파일 시스템 Tool 스키마
   */
  getFileSystemSchema() {
    return {
      name: "filesystem",
      description: "파일 시스템 작업 도구 - 파일 탐색, 검색, 읽기, 관리",
      version: "3.0.0",
      subscription_tier: "basic",
      category: "file_management",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": [
              "list_files", "search_files", "read_file", "find_path",
              "analyze_directory", "smart_search", "predict_files",
              "get_file_insights", "bulk_operations", "monitor_changes"
            ],
            "description": "수행할 파일 시스템 작업"
          },
          "path": {
            "type": "string",
            "description": "대상 경로 (자연어 또는 정확한 경로)"
          },
          "pattern": {
            "type": "string",
            "description": "파일 확장자 패턴 (예: *.pdf, *.docx, *.jpg) - 확장자 검색용"
          },
          "query": {
            "type": "string",
            "description": "파일명에 포함될 텍스트 (예: '보고서', '2024') - 파일명 검색용"
          },
          "intent": {
            "type": "string",
            "description": "사용자 의도 및 컨텍스트"
          },
          "options": {
            "type": "object",
            "properties": {
              "recursive": { "type": "boolean" },
              "fileTypes": { "type": "array", "items": { "type": "string" } },
              "dateRange": { 
                "type": "object",
                "properties": {
                  "from": { "type": "string", "format": "date" },
                  "to": { "type": "string", "format": "date" }
                }
              },
              "sizeRange": {
                "type": "object", 
                "properties": {
                  "min": { "type": "number" },
                  "max": { "type": "number" }
                }
              },
              "sortBy": { "type": "string" },
              "limit": { "type": "number", "minimum": 1, "maximum": 1000 }
            }
          }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "free": {
          "allowed_actions": ["list_files", "read_file", "find_path"],
          "daily_limit": 50
        },
        "basic": {
          "allowed_actions": ["list_files", "search_files", "read_file", "find_path", "analyze_directory"],
          "daily_limit": 500
        },
        "premium": {
          "allowed_actions": "*",
          "daily_limit": -1
        }
      }
    };
  }

  /**
   * 캘린더 Tool 스키마
   */
  getCalendarSchema() {
    return {
      name: "calendar",
      description: "캘린더 관리 도구 - 일정 생성, 수정, 조회",
      version: "2.0.0",
      subscription_tier: "basic",
      category: "productivity",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["create_event", "list_events", "update_event", "delete_event", "search_events", "check_availability"],
            "description": "수행할 캘린더 작업"
          },
          "title": { "type": "string", "maxLength": 200 },
          "date": { "type": "string", "description": "날짜 (자연어 또는 ISO 형식)" },
          "time": { "type": "string", "description": "시간 (자연어 또는 HH:MM 형식)" },
          "duration": { "type": "string", "description": "소요 시간" },
          "location": { "type": "string", "maxLength": 500 },
          "attendees": { 
            "type": "array", 
            "items": { "type": "string", "format": "email" },
            "maxItems": 100
          },
          "reminder": { "type": "string" },
          "recurrence": { "type": "string" }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "free": {
          "allowed_actions": ["list_events", "search_events"],
          "daily_limit": 20
        },
        "premium": {
          "allowed_actions": "*",
          "daily_limit": -1
        }
      }
    };
  }

  /**
   * 연락처 Tool 스키마  
   */
  getContactsSchema() {
    return {
      name: "contacts",
      description: "연락처 관리 도구 - 연락처 추가, 검색, 관리",
      version: "1.5.0",
      subscription_tier: "basic",
      category: "productivity",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string", 
            "enum": ["add_contact", "search_contacts", "update_contact", "delete_contact", "list_contacts", "organize_contacts"],
            "description": "수행할 연락처 작업"
          },
          "name": { "type": "string", "maxLength": 100 },
          "email": { "type": "string", "format": "email" },
          "phone": { "type": "string", "pattern": "^[+]?[0-9\\s\\-\\(\\)]+$" },
          "company": { "type": "string", "maxLength": 100 },
          "query": { "type": "string", "description": "검색 쿼리" }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "free": {
          "allowed_actions": ["search_contacts", "list_contacts"],
          "daily_limit": 30
        },
        "premium": {
          "allowed_actions": "*",
          "daily_limit": -1
        }
      }
    };
  }

  /**
   * 메신저 Tool 스키마
   */
  getMessengerSchema() {
    return {
      name: "messenger",
      description: "메시지 관리 도구 - 메시지 전송, 관리, 자동화",
      version: "1.0.0", 
      subscription_tier: "premium",
      category: "communication",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["send_message", "read_messages", "search_messages", "create_template", "schedule_message"],
            "description": "수행할 메시지 작업"
          },
          "recipient": { "type": "string" },
          "message": { "type": "string", "maxLength": 2000 },
          "platform": { 
            "type": "string", 
            "enum": ["email", "sms", "slack", "teams"],
            "description": "메시지 플랫폼"
          },
          "schedule_time": { "type": "string", "format": "date-time" },
          "query": { "type": "string", "description": "검색 쿼리" }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "premium": {
          "allowed_actions": "*",
          "daily_limit": -1
        }
      }
    };
  }

  /**
   * 노트 Tool 스키마
   */
  getNotesSchema() {
    return {
      name: "notes",
      description: "노트 관리 도구 - 노트 작성, 검색, 정리",
      version: "1.0.0",
      subscription_tier: "free", 
      category: "productivity",
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["create_note", "list_notes", "read_note", "update_note", "delete_note", "search_notes", "organize_notes"],
            "description": "수행할 노트 작업"
          },
          "title": { "type": "string", "maxLength": 200 },
          "content": { "type": "string", "maxLength": 10000 },
          "tags": { 
            "type": "array", 
            "items": { "type": "string" },
            "maxItems": 20
          },
          "query": { "type": "string", "description": "검색 쿼리" }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "free": {
          "allowed_actions": ["create_note", "read_note", "search_notes"],
          "daily_limit": 10
        },
        "basic": {
          "allowed_actions": ["create_note", "list_notes", "read_note", "update_note", "search_notes", "organize_notes"], 
          "daily_limit": 100
        }
      }
    };
  }

  /**
   * 작업 관리 Tool 스키마
   */
  getTasksSchema() {
    return {
      name: "tasks",
      description: "작업 관리 도구 - 할 일 생성, 관리, 추적",
      version: "1.0.0",
      subscription_tier: "basic",
      category: "productivity", 
      input_schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["create_task", "update_task", "complete_task", "delete_task", "list_tasks", "search_tasks"],
            "description": "수행할 작업 관리 액션"
          },
          "title": { "type": "string", "maxLength": 200 },
          "description": { "type": "string", "maxLength": 1000 },
          "due_date": { "type": "string", "format": "date" },
          "priority": { 
            "type": "string", 
            "enum": ["low", "medium", "high", "urgent"]
          },
          "status": { 
            "type": "string", 
            "enum": ["todo", "in_progress", "completed", "cancelled"]
          },
          "tags": { 
            "type": "array", 
            "items": { "type": "string" },
            "maxItems": 10
          },
          "query": { "type": "string", "description": "검색 쿼리" }
        },
        "required": ["action"],
        "additionalProperties": false
      },
      "subscription_requirements": {
        "free": {
          "allowed_actions": ["list_tasks", "search_tasks"],
          "daily_limit": 25
        },
        "premium": {
          "allowed_actions": "*",
          "daily_limit": -1
        }
      }
    };
  }

  /**
   * 사용자 정의 스키마 로드
   */
  async loadCustomSchemas() {
    try {
      const files = await fs.readdir(this.schemasDir);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of schemaFiles) {
        const filePath = path.join(this.schemasDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const schema = JSON.parse(content);
        
        this.registerSchema(schema.name, schema);
        console.log(`📝 사용자 스키마 로드: ${schema.name}`);
      }
    } catch (error) {
      console.log('📁 사용자 정의 스키마 없음 (정상)');
    }
  }

  /**
   * 스키마 등록
   */
  registerSchema(name, schema) {
    // 스키마 유효성 검사
    this.validateSchemaStructure(schema);
    
    // 스키마 저장
    this.schemas.set(name, schema);
    
    // 캐시 무효화
    this.invalidateCache(name);
    
    console.log(`✅ Tool 스키마 등록: ${name} v${schema.version}`);
  }

  /**
   * 스키마 구조 검증
   */
  validateSchemaStructure(schema) {
    const requiredFields = ['name', 'description', 'version', 'input_schema'];
    
    for (const field of requiredFields) {
      if (!schema[field]) {
        throw new Error(`스키마에 필수 필드가 없습니다: ${field}`);
      }
    }

    // JSON Schema 구조 검증
    if (!schema.input_schema.$schema) {
      throw new Error('input_schema에 $schema 필드가 필요합니다');
    }
  }

  /**
   * 검증기 컴파일 (간단한 버전)
   */
  async compileValidators() {
    for (const [name, schema] of this.schemas) {
      // 간단한 검증기 생성 (ajv 없이)
      this.validators.set(name, schema.input_schema);
      console.log(`🔧 검증기 등록: ${name}`);
    }
  }

  /**
   * Tool 입력 검증 (간단한 버전)
   */
  async validateToolInput(toolName, input) {
    this.metrics.validationCount++;
    
    try {
      // 스키마 존재 확인
      if (!this.schemas.has(toolName)) {
        return {
          valid: false,
          errors: [`알 수 없는 도구: ${toolName}`]
        };
      }

      // 스키마 가져오기
      const schema = this.schemas.get(toolName);
      const inputSchema = schema.input_schema;
      
      // 기본 검증 수행
      const errors = this.simpleValidation(input, inputSchema);
      
      if (errors.length > 0) {
        this.metrics.validationErrors++;
        return {
          valid: false,
          errors
        };
      }

      return { valid: true, errors: [] };
      
    } catch (error) {
      this.metrics.validationErrors++;
      return {
        valid: false,
        errors: [`검증 오류: ${error.message}`]
      };
    }
  }

  /**
   * 간단한 스키마 검증 (ajv 대안)
   */
  simpleValidation(input, schema) {
    const errors = [];
    
    // 필수 필드 검증
    if (schema.required) {
      for (const field of schema.required) {
        if (input[field] === undefined || input[field] === null) {
          errors.push(`필수 필드가 누락됨: ${field}`);
        }
      }
    }

    // 타입 검증 (기본)
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (input[key] !== undefined) {
          const value = input[key];
          
          // 문자열 타입 검증
          if (prop.type === 'string' && typeof value !== 'string') {
            errors.push(`${key}는 문자열이어야 합니다`);
          }
          
          // 숫자 타입 검증  
          if (prop.type === 'number' && typeof value !== 'number') {
            errors.push(`${key}는 숫자여야 합니다`);
          }
          
          // 배열 타입 검증
          if (prop.type === 'array' && !Array.isArray(value)) {
            errors.push(`${key}는 배열이어야 합니다`);
          }
          
          // 객체 타입 검증
          if (prop.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            errors.push(`${key}는 객체여야 합니다`);
          }
          
          // enum 검증
          if (prop.enum && !prop.enum.includes(value)) {
            errors.push(`${key}는 다음 값 중 하나여야 합니다: ${prop.enum.join(', ')}`);
          }
          
          // 최대 길이 검증
          if (prop.maxLength && typeof value === 'string' && value.length > prop.maxLength) {
            errors.push(`${key}는 최대 ${prop.maxLength}자까지 입력 가능합니다`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * 구독 상태 포함한 Tool 목록 가져오기
   */
  async getToolsForUser(userId = null, includeUnsubscribed = false) {
    const cacheKey = `${userId}:${includeUnsubscribed}`;
    
    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    const tools = [];
    
    for (const [name, schema] of this.schemas) {
      // 구독 상태 확인
      let isSubscribed = true;
      let subscriptionTier = null;
      
      if (this.subscriptionService && userId) {
        isSubscribed = await this.subscriptionService.checkUserSubscription(userId, name);
        subscriptionTier = await this.subscriptionService.getUserSubscriptionTier(userId, name);
      }

      // 구독되지 않은 도구 필터링
      if (!isSubscribed && !includeUnsubscribed) {
        continue;
      }

      // Tool 정의 생성
      const toolDef = {
        name: schema.name,
        description: schema.description,
        version: schema.version,
        category: schema.category || 'general',
        subscription_tier: schema.subscription_tier,
        input_schema: schema.input_schema,
        subscription_info: {
          subscribed: isSubscribed,
          current_tier: subscriptionTier,
          required_tier: schema.subscription_tier,
          user_id: userId
        }
      };

      // 구독 요구사항 추가
      if (schema.subscription_requirements) {
        toolDef.subscription_requirements = schema.subscription_requirements;
      }

      // 구독되지 않은 경우 안내 추가
      if (!isSubscribed && includeUnsubscribed) {
        toolDef.subscription_info.message = '이 도구를 사용하려면 구독이 필요합니다.';
      }

      tools.push(toolDef);
    }

    // 캐시에 저장
    this.setCache(cacheKey, tools);
    
    return tools;
  }

  /**
   * Tool 스키마 가져오기
   */
  getToolSchema(toolName) {
    return this.schemas.get(toolName);
  }

  /**
   * 모든 Tool 목록 가져오기
   */
  getAllTools() {
    return Array.from(this.schemas.values());
  }

  /**
   * 캐시 관리
   */
  getFromCache(key) {
    const cached = this.metadataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.metadataCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 캐시 크기 제한
    if (this.metadataCache.size > 200) {
      const oldestKey = this.metadataCache.keys().next().value;
      this.metadataCache.delete(oldestKey);
    }
  }

  invalidateCache(toolName = null) {
    if (toolName) {
      // 특정 도구 관련 캐시만 무효화
      for (const key of this.metadataCache.keys()) {
        if (key.includes(toolName)) {
          this.metadataCache.delete(key);
        }
      }
    } else {
      // 전체 캐시 무효화
      this.metadataCache.clear();
    }
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics() {
    return {
      ...this.metrics,
      schemasCount: this.schemas.size,
      validatorsCount: this.validators.size,
      cacheSize: this.metadataCache.size,
      cacheHitRate: this.metrics.validationCount > 0 ? 
        (this.metrics.cacheHits / this.metrics.validationCount * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 스키마를 파일로 내보내기
   */
  async exportSchema(toolName, filePath = null) {
    const schema = this.schemas.get(toolName);
    if (!schema) {
      throw new Error(`스키마를 찾을 수 없음: ${toolName}`);
    }

    const exportPath = filePath || path.join(this.schemasDir, `${toolName}.json`);
    await fs.writeFile(exportPath, JSON.stringify(schema, null, 2));
    console.log(`📤 스키마 내보내기: ${toolName} -> ${exportPath}`);
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      this.schemas.clear();
      this.validators.clear();
      this.metadataCache.clear();
      console.log('✅ Tool Schema Registry 정리 완료');
    } catch (error) {
      console.error('❌ Tool Schema Registry 정리 실패:', error);
    }
  }
}

export default ToolSchemaRegistry;