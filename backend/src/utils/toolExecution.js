/**
 * Tool 실행 유틸리티
 * Tool 실행을 위한 공통 로직 및 보안 기능
 */

import { getToolSchemaRegistry } from '../middleware/toolSchemaRegistry.js';
import { FileSystemTools } from '../tools/fileSystem.js';

/**
 * Tool 실행을 위한 유틸리티 클래스
 */
export class ToolExecutionManager {
  constructor(subscriptionService = null) {
    this.subscriptionService = subscriptionService;
    this.schemaRegistry = null;
    this.serviceRegistry = null;
    this.fileSystemTools = null;
    this.isInitialized = false;
  }

  /**
   * 초기화
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Tool Execution Manager 초기화 중...');

      // 1. Schema Registry 초기화 (backend의 싱글톤 사용)
      this.schemaRegistry = getToolSchemaRegistry();
      if (this.subscriptionService) {
        this.schemaRegistry.setSubscriptionService(this.subscriptionService);
      }
      console.log('✅ Schema Registry 초기화 완료');

      // 2. 파일시스템 도구 초기화
      this.fileSystemTools = new FileSystemTools();
      await this.fileSystemTools.initialize();
      console.log('✅ 파일시스템 도구 초기화 완료');

      // 3. 기본 Tool 스키마 등록
      await this.registerDefaultTools();
      console.log('✅ 기본 Tool 스키마 등록 완료');

      this.isInitialized = true;
      console.log('✅ Tool Execution Manager 초기화 완료');

    } catch (error) {
      console.error('❌ Tool Execution Manager 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 Tool 스키마 등록
   */
  async registerDefaultTools() {
    try {
      // 파일시스템 도구 스키마 등록
      const filesystemSchema = {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: '수행할 작업',
            enum: ['list_files', 'search_files', 'read_file', 'write_file', 'create_directory', 'delete_file', 'move_file', 'copy_file', 'analyze_file', 'get_drives']
          },
          path: {
            type: 'string',
            description: '파일 또는 디렉토리 경로'
          },
          query: {
            type: 'string',
            description: '검색 쿼리'
          },
          pattern: {
            type: 'string',
            description: '파일 패턴 (예: *.pdf)'
          },
          content: {
            type: 'string',
            description: '파일 내용'
          },
          options: {
            type: 'object',
            description: '추가 옵션'
          }
        },
        required: ['action'],
        description: '파일 시스템 관리 도구'
      };

      this.schemaRegistry.registerToolSchema('filesystem', filesystemSchema, {
        tier: 'free',
        required_tier: 'free'
      });

      console.log('✅ 기본 Tool 스키마 등록 완료');
      
    } catch (error) {
      console.error('❌ 기본 Tool 스키마 등록 실패:', error);
    }
  }

  /**
   * Tool 입력 검증
   */
  async validateToolInput(toolName, parameters) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.schemaRegistry.validateToolInput(toolName, parameters);
  }

  /**
   * 구독 상태 확인
   */
  async checkSubscription(userId, toolName) {
    if (!this.subscriptionService) {
      return { hasSubscription: true, tier: 'premium' }; // 구독 서비스 없으면 허용
    }

    const hasSubscription = await this.subscriptionService.checkUserSubscription(userId, toolName);
    const tier = await this.subscriptionService.getUserSubscriptionTier(userId, toolName);

    return { hasSubscription, tier };
  }

  /**
   * 구독 요구 메시지 생성
   */
  async getSubscriptionRequiredMessage(toolName, userId = null) {
    if (!this.subscriptionService) {
      return {
        error: "subscription_service_unavailable",
        message: "구독 서비스를 사용할 수 없습니다."
      };
    }

    return await this.subscriptionService.getSubscriptionRequiredMessage(toolName, userId);
  }

  /**
   * 안전한 Tool 실행
   */
  async executeToolSafely(toolName, parameters, userId = null) {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🚀 Tool 실행 시작: ${toolName} (사용자: ${userId})`);

      // 도구 이름 파싱 (filesystem.listFiles → filesystem)
      const [mainTool, subTool] = toolName.split('.');
      
      // 파일시스템 도구 처리
      if (mainTool === 'filesystem') {
        return await this.executeFileSystemTool(parameters, userId, startTime, subTool);
      }
      
      // 고급 검색 도구 처리
      if (mainTool === 'advancedSearch' || mainTool === 'search') {
        return await this.executeAdvancedSearchTool(parameters, userId, startTime, subTool);
      }
      
      // 클라우드 스토리지 도구 처리
      if (mainTool === 'cloudStorage' || mainTool === 'cloud') {
        return await this.executeCloudStorageTool(parameters, userId, startTime, subTool);
      }
      
      // 백업 시스템 도구 처리
      if (mainTool === 'backupSystem' || mainTool === 'backup') {
        return await this.executeBackupSystemTool(parameters, userId, startTime, subTool);
      }
      
      // 파일 암호화 도구 처리
      if (mainTool === 'fileEncryption' || mainTool === 'encryption') {
        return await this.executeFileEncryptionTool(parameters, userId, startTime, subTool);
      }
      
      // 접근 제어 도구 처리
      if (mainTool === 'accessControl' || mainTool === 'access') {
        return await this.executeAccessControlTool(parameters, userId, startTime, subTool);
      }
      
      // 파일 최적화 도구 처리
      if (mainTool === 'fileOptimizer' || mainTool === 'optimizer') {
        return await this.executeFileOptimizerTool(parameters, userId, startTime, subTool);
      }
      
      // 버전 관리 도구 처리
      if (mainTool === 'versionControl' || mainTool === 'version') {
        return await this.executeVersionControlTool(parameters, userId, startTime, subTool);
      }
      
      // 파일 미리보기 도구 처리
      if (mainTool === 'filePreview' || mainTool === 'preview') {
        return await this.executeFilePreviewTool(parameters, userId, startTime, subTool);
      }
      
      // 파일 동기화 도구 처리
      if (mainTool === 'fileSync' || mainTool === 'sync') {
        return await this.executeFileSyncTool(parameters, userId, startTime, subTool);
      }

      // 다른 도구들은 아직 구현되지 않음
      throw new Error(`도구 '${toolName}'은 아직 구현되지 않았습니다.`);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Tool 실행 실패: ${toolName} (${executionTime}ms)`, error);

      return {
        success: false,
        tool: toolName,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 파일시스템 도구 직접 실행
   */
  async executeFileSystemTool(parameters, userId, startTime, subTool = null) {
    try {
      // action과 operation 모두 지원 (호환성)
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation;
      
      // subTool이 있으면 우선 사용 (filesystem.listFiles → listFiles)
      if (subTool) {
        toolAction = subTool;
      }
      
      // 도구 이름 매핑 (listFiles → list_files)
      const actionMapping = {
        'listFiles': 'list_files',
        'listDirectory': 'list_directory',
        'searchFiles': 'search_files',
        'readFile': 'read_file',
        'writeFile': 'write_file',
        'createDirectory': 'create_directory',
        'deleteFile': 'delete_file',
        'moveFile': 'move_file',
        'copyFile': 'copy_file',
        'analyzeFile': 'analyze_file',
        'getDrives': 'get_drives',
        'findPath': 'find_path',
        'analyzeDirectory': 'analyze_directory',
        'smartSearch': 'smart_search',
        'predictFiles': 'predict_files',
        'getFileInsights': 'get_file_insights',
        'bulkOperations': 'bulk_operations',
        'monitorChanges': 'monitor_changes',
        'validateFile': 'validate_file',
        'generateReport': 'generate_report',
        'organizeFiles': 'organize_files'
      };
      
      const mappedAction = actionMapping[toolAction] || toolAction;
      
      if (!mappedAction) {
        throw new Error('파일시스템 도구 실행을 위해 action 또는 operation 파라미터가 필요합니다');
      }

      console.log(`🔧 파일시스템 도구 실행: ${mappedAction}`, { params });

      // 파일시스템 도구 직접 실행
      const result = await this.fileSystemTools.executeTool(mappedAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 파일시스템 도구 실행 완료: ${mappedAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'filesystem');
      }

      return {
        success: true,
        tool: 'filesystem',
        operation: mappedAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 파일시스템 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'filesystem',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 고급 검색 도구 실행
   */
  async executeAdvancedSearchTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'searchFiles';
      
      console.log(`🔧 고급 검색 도구 실행: ${toolAction}`, { params });

      // 고급 검색 도구 인스턴스 생성 및 실행
      const { AdvancedSearch } = await import('../tools/advancedSearch.js');
      const searchTool = new AdvancedSearch();
      await searchTool.initialize();
      
      const result = await searchTool.searchFiles(params.directory || process.cwd(), params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 고급 검색 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'advancedSearch');
      }

      return {
        success: true,
        tool: 'advancedSearch',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 고급 검색 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'advancedSearch',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 클라우드 스토리지 도구 실행
   */
  async executeCloudStorageTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'listFiles';
      
      console.log(`🔧 클라우드 스토리지 도구 실행: ${toolAction}`, { params });

      // 클라우드 스토리지 도구 인스턴스 생성 및 실행
      const { CloudStorage } = await import('../tools/cloudStorage.js');
      const cloudTool = new CloudStorage();
      
      const result = await cloudTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 클라우드 스토리지 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'cloudStorage');
      }

      return {
        success: true,
        tool: 'cloudStorage',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 클라우드 스토리지 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'cloudStorage',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 백업 시스템 도구 실행
   */
  async executeBackupSystemTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'createBackup';
      
      console.log(`🔧 백업 시스템 도구 실행: ${toolAction}`, { params });

      // 백업 시스템 도구 인스턴스 생성 및 실행
      const { BackupSystem } = await import('../tools/backupSystem.js');
      const backupTool = new BackupSystem();
      
      const result = await backupTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 백업 시스템 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'backupSystem');
      }

      return {
        success: true,
        tool: 'backupSystem',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 백업 시스템 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'backupSystem',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 파일 암호화 도구 실행
   */
  async executeFileEncryptionTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'encryptFile';
      
      console.log(`🔧 파일 암호화 도구 실행: ${toolAction}`, { params });

      // 파일 암호화 도구 인스턴스 생성 및 실행
      const { FileEncryption } = await import('../tools/fileEncryption.js');
      const encryptionTool = new FileEncryption();
      
      const result = await encryptionTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 파일 암호화 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'fileEncryption');
      }

      return {
        success: true,
        tool: 'fileEncryption',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 파일 암호화 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'fileEncryption',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 접근 제어 도구 실행
   */
  async executeAccessControlTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'checkPermission';
      
      console.log(`🔧 접근 제어 도구 실행: ${toolAction}`, { params });

      // 접근 제어 도구 인스턴스 생성 및 실행
      const { AccessControl } = await import('../tools/accessControl.js');
      const accessTool = new AccessControl();
      
      const result = await accessTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 접근 제어 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'accessControl');
      }

      return {
        success: true,
        tool: 'accessControl',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 접근 제어 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'accessControl',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 파일 최적화 도구 실행
   */
  async executeFileOptimizerTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'optimizeFile';
      
      console.log(`🔧 파일 최적화 도구 실행: ${toolAction}`, { params });

      // 파일 최적화 도구 인스턴스 생성 및 실행
      const { FileOptimizer } = await import('../tools/fileOptimizer.js');
      const optimizerTool = new FileOptimizer();
      
      const result = await optimizerTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 파일 최적화 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'fileOptimizer');
      }

      return {
        success: true,
        tool: 'fileOptimizer',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 파일 최적화 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'fileOptimizer',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 버전 관리 도구 실행
   */
  async executeVersionControlTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'checkVersion';
      
      console.log(`🔧 버전 관리 도구 실행: ${toolAction}`, { params });

      // 버전 관리 도구 인스턴스 생성 및 실행
      const { VersionControl } = await import('../tools/versionControl.js');
      const versionTool = new VersionControl();
      
      const result = await versionTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 버전 관리 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'versionControl');
      }

      return {
        success: true,
        tool: 'versionControl',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 버전 관리 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'versionControl',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 파일 미리보기 도구 실행
   */
  async executeFilePreviewTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'generatePreview';
      
      console.log(`🔧 파일 미리보기 도구 실행: ${toolAction}`, { params });

      // 파일 미리보기 도구 인스턴스 생성 및 실행
      const { FilePreview } = await import('../tools/filePreview.js');
      const previewTool = new FilePreview();
      
      const result = await previewTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 파일 미리보기 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'filePreview');
      }

      return {
        success: true,
        tool: 'filePreview',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 파일 미리보기 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'filePreview',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 파일 동기화 도구 실행
   */
  async executeFileSyncTool(parameters, userId, startTime, subTool = null) {
    try {
      const { action, operation, ...params } = parameters;
      let toolAction = action || operation || subTool || 'syncFiles';
      
      console.log(`🔧 파일 동기화 도구 실행: ${toolAction}`, { params });

      // 파일 동기화 도구 인스턴스 생성 및 실행
      const { FileSync } = await import('../tools/fileSync.js');
      const syncTool = new FileSync();
      
      const result = await syncTool.executeTool(toolAction, params);
      const executionTime = Date.now() - startTime;

      console.log(`✅ 파일 동기화 도구 실행 완료: ${toolAction} (${executionTime}ms)`);

      // 사용량 기록
      if (this.subscriptionService && userId) {
        await this.subscriptionService.recordUsage(userId, 'fileSync');
      }

      return {
        success: true,
        tool: 'fileSync',
        operation: toolAction,
        result: result,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ 파일 동기화 도구 실행 실패: ${executionTime}ms`, error);

      return {
        success: false,
        tool: 'fileSync',
        operation: parameters.action || parameters.operation,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        user_id: userId
      };
    }
  }

  /**
   * 사용량 제한 확인
   */
  async checkUsageLimit(userId, toolName) {
    if (!this.subscriptionService || !userId) {
      return { allowed: true, unlimited: true };
    }

    return await this.subscriptionService.checkDailyUsageLimit(userId, toolName);
  }

  /**
   * Tool 목록 가져오기 (구독 상태 포함)
   */
  async getAvailableTools(userId = null, includeUnsubscribed = false) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.schemaRegistry.getToolsForUser(userId, includeUnsubscribed);
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics() {
    const schemaMetrics = this.schemaRegistry ? this.schemaRegistry.getMetrics() : {};
    
    return {
      schema_registry: schemaMetrics,
      service_registry: {
        services_count: this.serviceRegistry ? this.serviceRegistry.getAvailableServices().length : 0,
        initialized: this.isInitialized
      },
      execution_manager: {
        initialized: this.isInitialized,
        subscription_service_available: !!this.subscriptionService
      }
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      if (this.schemaRegistry) {
        await this.schemaRegistry.cleanup();
      }
      if (this.serviceRegistry) {
        await this.serviceRegistry.cleanup();
      }
      if (this.fileSystemTools) {
        await this.fileSystemTools.cleanup();
      }
      this.isInitialized = false;
      console.log('✅ Tool Execution Manager 정리 완료');
    } catch (error) {
      console.error('❌ Tool Execution Manager 정리 실패:', error);
    }
  }
}

/**
 * 간단한 사용자 인증 미들웨어 (개발용)
 * TODO: 실제 JWT 또는 세션 기반 인증으로 교체
 */
export const authenticateUser = (req, res, next) => {
  try {
    // 개발 모드에서는 헤더 또는 쿼리에서 사용자 ID 추출
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId || 'anonymous';
    
    // 임시 사용자 객체 생성
    req.user = {
      id: userId,
      authenticated: userId !== 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    console.log(`👤 사용자 인증: ${userId} (${req.user.authenticated ? '인증됨' : '익명'})`);
    next();
    
  } catch (error) {
    console.error('❌ 사용자 인증 실패:', error);
    res.status(401).json({
      error: 'authentication_failed',
      message: '사용자 인증에 실패했습니다.'
    });
  }
};

/**
 * Tool 실행 권한 검증 미들웨어
 */
export const authorizeToolExecution = () => {
  return async (req, res, next) => {
    try {
      const { tool, user_id } = req.body;
      const userId = req.user?.id || user_id; // 개발/테스트용: user_id fallback

      if (!tool) {
        return res.status(400).json({
          error: 'missing_tool',
          message: 'tool 필드가 필요합니다.'
        });
      }

      // 런타임에 Tool Execution Manager 가져오기
      const toolExecutionManager = await getToolExecutionManager();
      
      if (!toolExecutionManager) {
        return res.status(503).json({
          error: 'service_unavailable',
          message: 'Tool 실행 서비스가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.'
        });
      }

      // 사용량 제한 확인
      const usageCheck = await toolExecutionManager.checkUsageLimit(userId, tool);
      if (!usageCheck.allowed) {
        return res.status(429).json({
          error: 'usage_limit_exceeded',
          message: '일일 사용량 한도를 초과했습니다.',
          current_usage: usageCheck.currentUsage,
          daily_limit: usageCheck.dailyLimit,
          remaining: usageCheck.remaining
        });
      }

      req.usageInfo = usageCheck;
      next();

    } catch (error) {
      console.error('❌ Tool 실행 권한 검증 실패:', error);
      console.error('❌ 요청 상세:', { 
        tool: req.body?.tool, 
        user_id: req.body?.user_id, 
        userId: req.user?.id || user_id
      });
      res.status(500).json({
        error: 'authorization_error',
        message: '권한 검증 중 오류가 발생했습니다.',
        debug: error.message  // 개발용 디버그 정보
      });
    }
  };
};

// 싱글톤 인스턴스
let toolExecutionManagerInstance = null;

/**
 * Tool Execution Manager 싱글톤 인스턴스 가져오기
 */
export const getToolExecutionManager = async (subscriptionService = null) => {
  if (!toolExecutionManagerInstance) {
    toolExecutionManagerInstance = new ToolExecutionManager(subscriptionService);
    await toolExecutionManagerInstance.initialize();
  }
  return toolExecutionManagerInstance;
};

export default ToolExecutionManager;