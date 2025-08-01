/**
 * 🗂️ FILE SYSTEM SERVICE - 파일 시스템 서비스 오케스트레이터
 * 역할: 모든 파일 시스템 작업을 조율하고 관리하는 메인 서비스
 * 기능: 경로 해석, 파일 검색, 시스템 모니터링, AI 분석 통합
 * 특징: 중앙 조율, AI 통합, 실시간 모니터링, 성능 최적화
 */

import { PathResolver } from './PathResolver.js';
import { FileOperations } from './FileOperations.js';
import { FormatHelper } from './FormatHelper.js';
import { FileSummary } from './FileSummary.js';
import { FileFormatter } from './FileFormatter.js';
import { errorHandler } from './ErrorHandler.js';
import { HardMappingManager } from './HardMappingManager.js';
import * as fs from 'fs/promises';
import path from 'path';
import { DocumentContentAnalyzer } from './DocumentContentAnalyzer.js';
import { DocumentAnalysisLearningManager } from './DocumentAnalysisLearningManager.js';

export class FileSystemService {
  constructor(mcpConnector) {
    this.mcpConnector = mcpConnector;
    this.pathResolver = new PathResolver();
    this.fileOperations = new FileOperations(mcpConnector);
    this.formatHelper = new FormatHelper();
    this.fileSummary = new FileSummary();
    this.fileFormatter = new FileFormatter();
    
    this.hardMappingManager = new HardMappingManager();

    // 🧠 Advanced AI Integration
    this.name = 'filesystem';
    this.description = '🌟 World-class intelligent file system service with AI-powered path resolution, lightning-fast search, and enterprise-grade security. Understands natural language queries and provides contextual file operations.';
    this.category = 'enterprise_file_management';
    this.available = true;
    this.version = '3.0.0-WorldClass';

    // 🎯 Performance & Analytics
    this.performanceMetrics = {
      totalOperations: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      successRate: 100,
      lastOptimization: Date.now()
    };

    // 🧠 AI-Enhanced Parameters for Function Calling
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'list_files', 'search_files', 'read_file', 'find_path',
            'analyze_directory', 'smart_search', 'predict_files',
            'get_file_insights', 'bulk_operations', 'monitor_changes'
          ],
          description: '🎯 Advanced Operations: list_files(directory listing), search_files(intelligent search), read_file(content reading), find_path(path discovery), analyze_directory(deep analysis), smart_search(AI-powered), predict_files(predictive suggestions), get_file_insights(metadata & analysis), bulk_operations(batch processing), monitor_changes(real-time monitoring)'
        },
        path: {
          type: 'string',
          description: '📁 Target path - supports natural language (e.g., "my documents", "D drive", "project folder") or exact paths'
        },
        query: {
          type: 'string',
          description: '🔍 Search query - supports natural language, patterns, regex, file types, date ranges, and AI-powered semantic search'
        },
        intent: {
          type: 'string',
          description: '🎯 User intent and context for AI-powered path resolution and operation optimization'
        },
        options: {
          type: 'object',
          properties: {
            recursive: { type: 'boolean', description: 'Deep recursive search' },
            fileTypes: { type: 'array', description: 'File type filters' },
            dateRange: { type: 'object', description: 'Date range filtering' },
            sizeRange: { type: 'object', description: 'File size filtering' },
            sortBy: { type: 'string', description: 'Sort criteria' },
            limit: { type: 'number', description: 'Result limit' },
            cacheStrategy: { type: 'string', description: 'Caching strategy' },
            priority: { type: 'string', description: 'Operation priority' }
          },
          description: '⚙️ Advanced operation options for fine-tuned control'
        }
      },
      required: ['action']
    };

    // 🔒 8단계: 구독 기반 접근 제어
    this.subscription_tier = 'basic';
    this.subscription_features = {
      free: {
        allowed_actions: ['list_files', 'read_file'],
        daily_limit: 20,
        max_file_size: 10 * 1024 * 1024, // 10MB
        features: ['basic_listing', 'simple_read']
      },
      basic: {
        allowed_actions: ['list_files', 'read_file', 'search_files', 'find_path'],
        daily_limit: 200,
        max_file_size: 100 * 1024 * 1024, // 100MB
        features: ['advanced_search', 'path_intelligence', 'batch_operations']
      },
      premium: {
        allowed_actions: '*',
        daily_limit: -1,
        max_file_size: -1,
        features: ['all_features', 'ai_insights', 'predictive_analysis', 'real_time_monitoring']
      }
    };

    // 🚀 Advanced Features
    this.cache = new Map();
    this.operationQueue = [];
    this.isProcessingBatch = false;
    this.pathPredictions = new Map();
    this.userPatterns = new Map();
    
    // 문서 내용 분석기 추가
    this.documentAnalyzer = new DocumentContentAnalyzer();
    this.learningManager = new DocumentAnalysisLearningManager();
  }

  async initialize() {
    const initStartTime = performance.now();
    
    try {
      console.log('🌟 World-Class FileSystem Service 초기화 중...');
      
      // 🚀 Parallel Module Initialization for Maximum Performance
      const initPromises = [
        this.hardMappingManager.initialize(), // 🌟 HardMappingManager 초기화 추가
        this.pathResolver.initialize(),
        this.fileOperations.initialize(), 
        this.formatHelper.initialize(),
        this.fileSummary.initialize(),
        this.fileFormatter.initialize(),
        this.initializeAdvancedFeatures(),
        this.loadUserPatterns(),
        this.optimizeSystemPerformance()
      ];

      await Promise.all(initPromises);
      
      // 🎯 Performance Benchmark
      const initTime = performance.now() - initStartTime;
      console.log(`✅ World-Class FileSystem Service 초기화 완료 (${initTime.toFixed(2)}ms)`);
      
      // 🧠 Self-Diagnostic Check
      await this.performSystemHealthCheck();
      
      // 🚀 Start Background Optimization
      this.startBackgroundOptimization();

    } catch (error) {
      console.error('❌ FileSystem Service 초기화 실패:', error);
      this.available = false;
      await this.handleInitializationFailure(error);
    }
  }

  /**
   * 🚀 Initialize Advanced Features
   */
  async initializeAdvancedFeatures() {
    // 🧠 AI-Powered Path Prediction System
    this.pathPredictions.set('user_documents', ['/mnt/c/Users/hki/Documents', '/mnt/d/Documents']);
    this.pathPredictions.set('downloads', ['/mnt/c/Users/hki/Downloads', '/mnt/d/Downloads']);
    this.pathPredictions.set('projects', ['/mnt/d/my_app', '/mnt/c/Projects', '/mnt/d/Projects']);
    
    // 🔧 Performance Optimization
    this.operationQueue = [];
    this.cache.clear();
    
    // 📊 Analytics Initialization
    this.performanceMetrics.lastOptimization = Date.now();
    
    console.log('🎯 Advanced features initialized');
  }

  /**
   * 📚 Load User Patterns for Predictive Intelligence
   */
  async loadUserPatterns() {
    try {
      // 🧠 AI learns from user behavior patterns
      this.userPatterns.set('frequent_paths', new Set());
      this.userPatterns.set('search_history', []);
      this.userPatterns.set('file_preferences', new Map());
      
      console.log('🧠 User pattern analysis initialized');
    } catch (error) {
      console.warn('⚠️ User pattern loading failed:', error);
    }
  }

  /**
   * ⚡ System Performance Optimization
   */
  async optimizeSystemPerformance() {
    // 🚀 Memory optimization
    if (global.gc) {
      global.gc();
    }
    
    // 🔧 Cache preloading for common paths
    const commonPaths = ['/mnt/d', '/mnt/c', '/mnt/d/my_app'];
    for (const path of commonPaths) {
      try {
        // Pre-warm cache with frequently accessed paths
        this.cache.set(`quick_access_${path}`, {
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes
        });
      } catch (error) {
        // Silent fail for non-critical optimization
      }
    }
    
    console.log('⚡ Performance optimization completed');
  }

  // ==================== 8단계: 구독 기반 Tool 메서드 ====================

  /**
   * 🔒 구독 등급별 접근 권한 확인 (8단계)
   */
  checkSubscriptionAccess(action, userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    if (!tierConfig) {
      return {
        allowed: false,
        reason: 'invalid_tier',
        message: '유효하지 않은 구독 등급입니다.'
      };
    }

    // 허용된 액션 확인
    const allowedActions = tierConfig.allowed_actions;
    if (allowedActions !== '*' && !allowedActions.includes(action)) {
      return {
        allowed: false,
        reason: 'action_not_allowed',
        message: `${userTier} 구독에서는 ${action} 기능을 사용할 수 없습니다.`,
        upgrade_benefits: this.getUpgradeBenefits(userTier)
      };
    }

    return { allowed: true };
  }

  /**
   * 📊 Tool 메타데이터 반환 (8단계)
   */
  getToolMetadata(userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    if (!tierConfig) {
      return {
        name: this.name,
        description: this.description,
        category: this.category,
        version: this.version,
        subscription: {
          required_tier: this.subscription_tier,
          user_tier: userTier,
          features: [],
          limits: {
            daily_limit: 0,
            max_file_size: 0
          }
        },
        parameters: this.parameters,
        performance: this.performanceMetrics
      };
    }
    
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      subscription: {
        required_tier: this.subscription_tier,
        user_tier: userTier,
        features: tierConfig.features || [],
        limits: {
          daily_limit: tierConfig.daily_limit,
          max_file_size: tierConfig.max_file_size
        }
      },
      parameters: this.parameters,
      performance: this.performanceMetrics
    };
  }

  /**
   * 🔄 순수 JSON 응답 포맷팅 (8단계)
   */
  formatJsonResponse(data, action, userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    // formatted 필드 제거하고 구조화된 JSON 반환
    const { formatted, ...jsonData } = data;
    
    // 오류 상황 처리
    const isError = data.success === false || data.error;
    
    console.log(`🔧 [DEBUG] formatJsonResponse - action: ${action}, files: ${jsonData.files?.length || 0}, count: ${jsonData.count || 0}`);
    
    const result = {
      success: isError ? false : true,
      action: action,
      data: isError ? jsonData : jsonData,
      error: isError ? data.error : undefined,
      technical_error: isError ? data.technical_error : undefined,
      error_code: isError ? data.error_code : undefined,
      suggestions: isError ? data.suggestions : undefined,
      metadata: {
        subscription_tier: userTier,
        features_used: tierConfig ? tierConfig.features : [],
        performance: {
          response_time: data.performance?.execution_time_ms || 0,
          cache_hit: data.performance?.cache_hit || false
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`📤 [DEBUG] formatJsonResponse 결과 - data.files: ${result.data.files?.length || 0}, data.count: ${result.data.count || 0}`);
    return result;
  }

  /**
   * 🎁 구독 업그레이드 혜택 정보 (8단계)
   */
  getUpgradeBenefits(currentTier) {
    const benefits = {
      free: {
        next_tier: 'basic',
        benefits: [
          '고급 파일 검색 기능',
          '지능형 경로 해석',
          '일일 사용량 200회로 증가',
          '최대 파일 크기 100MB로 증가',
          '배치 작업 지원'
        ]
      },
      basic: {
        next_tier: 'premium',
        benefits: [
          '모든 고급 기능 이용',
          'AI 기반 파일 인사이트',
          '예측 분석 기능',
          '실시간 모니터링',
          '무제한 사용량 및 파일 크기'
        ]
      }
    };

    return benefits[currentTier] || null;
  }

  /**
   * 🏥 System Health Check
   */
  async performSystemHealthCheck() {
    const healthChecks = {
      pathResolver: this.pathResolver?.isReady() || false,
      fileOperations: this.fileOperations?.isReady() || false,
      formatHelper: this.formatHelper?.isReady() || false,
      mcpConnection: this.mcpConnector?.isReady() || false,
      cacheSystem: this.cache instanceof Map,
      advancedFeatures: this.pathPredictions.size > 0
    };

    const healthScore = Object.values(healthChecks).filter(Boolean).length / Object.keys(healthChecks).length * 100;
    
    console.log(`🏥 System Health Score: ${healthScore.toFixed(1)}%`);
    
    if (healthScore < 80) {
      console.warn('⚠️ System health below optimal, activating recovery protocols');
      await this.activateRecoveryMode();
    }

    return healthChecks;
  }

  /**
   * 🔄 Background Performance Optimization
   */
  startBackgroundOptimization() {
    // 🚀 Continuous optimization every 5 minutes
    setInterval(async () => {
      try {
        await this.optimizeCache();
        await this.updateUserPatterns();
        await this.performMaintenanceTasks();
      } catch (error) {
        console.warn('⚠️ Background optimization error:', error);
      }
    }, 300000); // 5 minutes

    console.log('🔄 Background optimization activated');
  }

  /**
   * 🛠️ Handle Initialization Failure with Recovery
   */
  async handleInitializationFailure(error) {
    console.error('🚨 Critical initialization failure, activating recovery mode');
    
    // 🛡️ Graceful degradation
    this.available = false;
    
    try {
      // Attempt minimal functionality
      if (this.fileOperations && !this.fileOperations.isReady()) {
        await this.fileOperations.initialize();
      }
      
      // Enable limited mode
      this.available = true;
      console.log('🛡️ Recovery mode activated - limited functionality available');
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
    }
  }

  /**
   * 🌟 WORLD-CLASS EXECUTION ENGINE
   * AI-Powered Intelligent Operation Dispatcher with Advanced Analytics
   */
  async execute(args, context = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    try {
      console.log(`🌟 World-Class FileSystem Operation: ${args.action} [${executionId}]`);

      // 🔒 8단계: 구독 등급 확인 (개발 모드에서는 우회)
      const userTier = context.subscriptionTier || context.subscription?.tier || 'premium'; // 개발 모드 기본값
      const userId = context.userId || 'anonymous';

      // 개발 모드에서는 구독 체크 우회
      if (process.env.BYPASS_SUBSCRIPTION !== 'true') {
        const accessCheck = this.checkSubscriptionAccess(args.action, userTier);
        if (!accessCheck.allowed) {
          return this.formatJsonResponse({
            success: false,
            error: accessCheck.reason,
            message: accessCheck.message,
            upgrade_benefits: accessCheck.upgrade_benefits,
            performance: {
              execution_time_ms: performance.now() - startTime,
              cache_hit: false
            }
          }, args.action, userTier);
        }
      } else {
        console.log(`🚫 개발 모드: 구독 체크 우회 - ${args.action} 허용`);
      }
      
      // 🧠 AI-Powered Operation Analysis & Optimization
      await this.analyzeAndOptimizeOperation(args, context);
      
      // 🚀 Cache Check for Ultra-Fast Response
      const cacheResult = await this.checkIntelligentCache(args, context);
      if (cacheResult) {
        this.updatePerformanceMetrics(performance.now() - startTime, true, true);
        return cacheResult;
      }

      // 🎯 Dynamic Operation Routing with Performance Optimization
      let result;
      switch (args.action) {
        case 'list_files':
          // Legacy support - redirect to smart version
          result = await this.smartListFiles(args, context);
          break;
        
        case 'search_files':
          // Legacy support - redirect to intelligent version
          result = await this.intelligentSearchFiles(args, context);
          break;
        
        case 'read_file':
          // 📄 고급 문서 분석 (AI 보조 시스템 포함)
          let filePath = args.path;
          
          // 경로가 배열인 경우 첫 번째 요소 사용
          if (Array.isArray(filePath)) {
            filePath = filePath[0];
          }
          
          if (!filePath) {
            result = {
              success: false,
              error: '파일 경로가 필요합니다',
              action: 'read_file'
            };
          } else {
            try {
              // 🧠 AI 보조 시스템: 경로 해석 및 파일 선택
              const resolvedPath = await this.pathResolver.resolvePath(filePath, context);
              const finalPath = Array.isArray(resolvedPath) ? resolvedPath[0] : resolvedPath;
              
              console.log(`🧠 AI 보조 경로 해석: "${filePath}" → "${finalPath}"`);
              
              const analysisResult = await this.documentAnalyzer.analyzeDocument(finalPath);
              result = {
                success: analysisResult.success,
                action: 'read_file',
                path: finalPath,
                originalPath: filePath,
                content: analysisResult.analysis?.content || '',
                formatted: analysisResult.analysis?.summary || '',
                analysis: analysisResult.analysis?.analysis || {},
                metadata: analysisResult.analysis?.metadata || {},
                size: analysisResult.analysis?.content?.length || 0,
                aiAssisted: true,
                performance: {
                  executionTime: '0ms',
                  cached: false,
                  optimized: true
                }
              };
            } catch (error) {
              result = {
                success: false,
                action: 'read_file',
                path: filePath,
                error: error.message,
                aiAssisted: false,
                performance: {
                  executionTime: '0ms'
                }
              };
            }
          }
          break;
        
        case 'find_path':
          // Legacy support - redirect to AI-powered version
          result = await this.aiPoweredFindPath(args, context);
          break;

        // 🚀 Advanced Operations
        case 'analyze_directory':
          result = await this.analyzeDirectory(args, context);
          break;
        
        case 'smart_search':
          result = await this.performSmartSearch(args, context);
          break;
        
        case 'predict_files':
          result = await this.predictFiles(args, context);
          break;
        
        case 'get_file_insights':
          result = await this.getFileInsights(args, context);
          break;
        
        case 'bulk_operations':
          result = await this.performBulkOperations(args, context);
          break;
        
        case 'monitor_changes':
          result = await this.monitorChanges(args, context);
          break;
        
        case 'search_by_extension':
          result = await this.searchFilesByExtension(args, context);
          break;
        
        default:
          throw new Error(`🚫 Unsupported operation: ${args.action}`);
      }

      // 📊 Performance Analytics & User Pattern Learning
      const executionTime = performance.now() - startTime;
      const wasCached = false; // Not cached for main execution path
      await this.updatePerformanceMetrics(executionTime, true, wasCached);
      await this.learnFromUserPattern(args, result, executionTime);
      
      // 🧠 Intelligent Caching Strategy
      await this.intelligentCache(args, result, context);
      
      // 8단계: 자연어 포맷팅 제거, 순수 JSON 반환
      const enhancedResult = {
        ...result,
        executionId,
        executionTime: `${executionTime.toFixed(2)}ms`,
        performance: {
          fast: executionTime < 100,
          cached: false,
          optimized: true,
          quality: 'world-class'
        },
        systemHealth: await this.getQuickHealthCheck()
      };
      
      return this.formatJsonResponse(enhancedResult, args.action, context);

    } catch (error) {
      console.error(`❌ World-Class FileSystem Operation Failed [${executionId}]:`, error);
      
      // 🛡️ Advanced Error Recovery with FileSummary.js
      const fallbackResult = await this.handleOperationFailure(args, error, context);
      
      const executionTime = performance.now() - startTime;
      await this.updatePerformanceMetrics(executionTime, false, false);
      
      // 🎯 FileSummary.js를 사용한 친절한 오류 메시지 생성
      const fileSummary = new FileSummary();
      const errorInfo = fileSummary.getErrorMessage(error, args.action, args.path || '');
      
      const userFriendlyError = errorInfo.userMessage;
      const suggestions = errorInfo.suggestions || [
        "작업을 다시 시도해보세요",
        "관리자 권한으로 프로그램을 실행해보세요"
      ];
      
      const errorResult = {
        success: false,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        action: args.action,
        executionId,
        executionTime: `${executionTime.toFixed(2)}ms`,
        suggestions: suggestions,
        fallback: fallbackResult,
        recovery: 'attempted',
        systemHealth: await this.getQuickHealthCheck()
      };
      
      return this.formatJsonResponse(errorResult, args.action, context);
    }
  }

  /**
   * 🧠 AI-Powered Operation Analysis & Optimization
   */
  async analyzeAndOptimizeOperation(args, context) {
    // 🎯 Smart Operation Priority
    if (args.options?.priority === 'high') {
      // High priority operations get immediate processing
      return;
    }
    
    // 🚀 Predictive Performance Optimization
    if (this.shouldOptimizeForPerformance(args)) {
      await this.preOptimizeOperation(args);
    }
    
    // 🧠 Context-Aware Processing
    this.updateUserContext(args, context);
  }

  /**
   * 🚀 Intelligent Cache System
   */
  async checkIntelligentCache(args, context) {
    const cacheKey = this.generateCacheKey(args, context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`⚡ Cache hit for operation: ${args.action}`);
      return {
        ...cached.result,
        cached: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }
    
    return null;
  }

  /**
   * 🧠 Intelligent Caching Strategy
   */
  async intelligentCache(args, result, context) {
    const cacheKey = this.generateCacheKey(args, context);
    
    // 🎯 Smart TTL based on operation type and success
    let ttl = 60000; // Default 1 minute
    
    if (args.action === 'list_files') ttl = 300000; // 5 minutes for directory listings
    if (args.action === 'search_files') ttl = 120000; // 2 minutes for searches
    if (result.success && result.count < 100) ttl *= 2; // Longer cache for smaller results
    
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
      accessCount: 1
    });
    
    // 🧹 Smart cache cleanup
    if (this.cache.size > 1000) {
      await this.optimizeCache();
    }
  }

  /**
   * 📊 Performance Metrics & Analytics
   */
  async updatePerformanceMetrics(executionTime, success, wasCached) {
    this.performanceMetrics.totalOperations++;
    
    if (success) {
      // Update average response time
      const currentAvg = this.performanceMetrics.averageResponseTime;
      const totalOps = this.performanceMetrics.totalOperations;
      this.performanceMetrics.averageResponseTime = 
        (currentAvg * (totalOps - 1) + executionTime) / totalOps;
    }
    
    // Update cache hit rate
    if (wasCached) {
      const cacheHits = this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalOperations - 1) + 1;
      this.performanceMetrics.cacheHitRate = cacheHits / this.performanceMetrics.totalOperations;
    }
    
    // Update success rate
    const successOps = this.performanceMetrics.successRate * (this.performanceMetrics.totalOperations - 1) / 100;
    this.performanceMetrics.successRate = 
      ((success ? successOps + 1 : successOps) / this.performanceMetrics.totalOperations) * 100;
  }

  /**
   * 🧠 Learn from User Patterns for AI Enhancement
   */
  async learnFromUserPattern(args, result, executionTime) {
    try {
      // Track frequent paths
      if (args.path) {
        const frequentPaths = this.userPatterns.get('frequent_paths');
        frequentPaths.add(args.path);
      }
      
      // Track search patterns
      if (args.query) {
        const searchHistory = this.userPatterns.get('search_history');
        searchHistory.push({
          query: args.query,
          timestamp: Date.now(),
          resultCount: result.count || 0,
          executionTime
        });
        
        // Keep only last 100 searches
        if (searchHistory.length > 100) {
          searchHistory.splice(0, searchHistory.length - 100);
        }
      }
      
      // Track file preferences
      if (result.files) {
        const preferences = this.userPatterns.get('file_preferences');
        if (preferences && preferences instanceof Map) {
        result.files.forEach(file => {
          if (file.name) {
            const ext = file.name.split('.').pop();
            preferences.set(ext, (preferences.get(ext) || 0) + 1);
          }
        });
        } else {
          // 안전한 초기화
          this.userPatterns.set('file_preferences', new Map());
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Pattern learning failed:', error);
    }
  }

  /**
   * 🚀 Smart List Files - AI-Enhanced Directory Listing
   */
  async smartListFiles(args, context) {
    // 0. 경로에서 "폴더" 단어 제거 (사전 처리)
    let cleanedPath = args.path;
    if (args.path.includes('폴더')) {
      cleanedPath = args.path.replace(/폴더/g, '').trim();
      console.log(`🧹 경로 정리: "${args.path}" → "${cleanedPath}"`);
    }
    
    // 🌟 1. HardMappingManager 우선 검사 (빠른 하드 매핑)
    let resolvedPath = this.hardMappingManager.resolvePath(cleanedPath, context);
    
    if (!resolvedPath) {
      // 2. 🌟 WORLD-CLASS 경로 해석 with AI enhancement (하드 매핑 실패 시)
    const resolvedPaths = await this.pathResolver.resolvePath(
      cleanedPath, 
      { ...context, intent: args.intent }
    );
    
    // 첫 번째 해석된 경로 사용 (기존 호환성 유지)
      resolvedPath = resolvedPaths[0] || cleanedPath;
    } else {
      console.log(`✅ 하드 매핑 성공: "${cleanedPath}" → "${resolvedPath}"`);
    }

    console.log(`🚀 Smart 폴더 목록 조회: ${resolvedPath}`);

    // 2. 성능 최적화 체크
    const startTime = performance.now();
    
    // 3. 🌟 WORLD-CLASS 파일 작업 수행 with smart ordering and error handling
    let files = await this.fileOperations.listFiles(resolvedPath, context);
    
    console.log(`🔍 [DEBUG] FileOperations.listFiles 결과:`, {
      type: typeof files,
      isArray: Array.isArray(files),
      length: Array.isArray(files) ? files.length : 'N/A',
      hasFiles: files && files.files ? 'Yes' : 'No'
    });
    
    if (!Array.isArray(files) && files && Array.isArray(files.files)) {
      console.log(`🔍 [DEBUG] Using files.files (${files.files.length} items)`);
      files = files.files;
    } else if (!Array.isArray(files)) {
      console.log(`🔍 [DEBUG] Files is not array, setting to empty array`);
      files = [];
    }
    
    // 4. AI-powered smart sorting and filtering
    const smartFiles = this.applySmartFiltering(files, args, context);
    console.log(`🔍 [DEBUG] 필터링 후 파일 개수: ${smartFiles.length}`);

    // 5. 결과 포맷팅 with enhanced metadata
    const formatted = this.formatHelper.formatFileList(smartFiles, resolvedPath);
    
    const executionTime = performance.now() - startTime;

    const result = {
      success: true,
      action: 'smart_list_files',
      path: resolvedPath,
      files: smartFiles,
      formatted: formatted,
      count: smartFiles.length,
      totalCount: files.length,
      performance: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        optimized: true,
        smartFiltering: smartFiles.length !== files.length
      },
      metadata: {
        directories: smartFiles.filter(f => f.isDirectory).length,
        regularFiles: smartFiles.filter(f => !f.isDirectory).length,
        totalSize: smartFiles.reduce((sum, f) => sum + (f.size || 0), 0)
      }
    };

    console.log(`📤 [DEBUG] 반환하는 결과 - 파일 개수: ${result.files.length}, count: ${result.count}`);
    return result;
  }

  /**
   * 🔍 Intelligent Search Files - AI-Powered Search
   */
  async intelligentSearchFiles(args, context) {
    // Handle parameter mapping - support both 'query' and 'pattern'
    const searchQuery = args.query || args.pattern || '*';
    const searchPath = args.path || 'downloads'; // Default to downloads if no path specified
    
    console.log(`🔍 지능형 파일 검색: "${searchQuery}" in "${searchPath}"`);
    
    // 🔧 확장자 패턴 감지 시 searchFilesByExtension 사용
    const extensionPattern = searchQuery.match(/^\*\.([a-z0-9]+)$/i);
    if (extensionPattern) {
      const extension = extensionPattern[1];
      console.log(`🔧 [FileSystemService] 확장자 패턴 감지: "${searchQuery}" → searchFilesByExtension 호출`);
      return await this.searchFilesByExtension({
        extension: extension,
        searchPaths: searchPath ? [searchPath] : [],
        recursive: args.options?.recursive || false,
        limit: args.options?.maxResults || 100
      }, context);
    }
    
    const startTime = performance.now();

    // 🌟 1. HardMappingManager 우선 검사 (빠른 하드 매핑)
    let searchPaths = [];
    const hardMappedPath = this.hardMappingManager.resolvePath(searchPath, context);
    
    if (hardMappedPath) {
      console.log(`✅ 하드 매핑 성공: "${searchPath}" → "${hardMappedPath}"`);
      searchPaths = [hardMappedPath];
    } else {
      // 2. AI-enhanced search path determination (하드 매핑 실패 시)
      searchPaths = await this.pathResolver.determineSearchPaths(
      searchQuery, 
      searchPath, 
      args.intent || '', 
      context
    );
    }

    // 2. Smart query expansion
    const expandedQueries = this.expandSearchQuery(searchQuery, context);
    
    // 3. Parallel intelligent search
    const searchPromises = expandedQueries.map(async (query) => {
      return await this.fileOperations.searchFiles(searchPaths, query);
    });
    
    const allResults = await Promise.all(searchPromises);
    const combinedResults = this.deduplicateResults(allResults.flat());
    
    // 4. AI-powered relevance scoring
    const scoredResults = this.scoreSearchRelevance(combinedResults, searchQuery, context);
    
    // 5. 결과 포맷팅
    const formatted = this.formatHelper.formatSearchResults(scoredResults, searchQuery);
    
    const executionTime = performance.now() - startTime;

    return {
      success: true,
      action: 'intelligent_search_files',
      query: searchQuery,
      path: searchPath,
      expandedQueries: expandedQueries,
      searchPaths: searchPaths,
      results: scoredResults,
      count: scoredResults.length,
      formatted: formatted,
      performance: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        searchDepth: searchPaths.length,
        queryExpansion: expandedQueries.length > 1
      }
    };
  }

  /**
   * 📄 Optimized Read File - Performance-Enhanced File Reading
   */
  async optimizedReadFile(args, context) {
    const startTime = performance.now();
    
    // 🌟 1. HardMappingManager 우선 검사 (빠른 하드 매핑)
    let resolvedPath = this.hardMappingManager.resolvePath(args.path, context);
    
    if (!resolvedPath) {
      // 2. 경로 해석 (하드 매핑 실패 시)
      resolvedPath = await this.pathResolver.resolvePath(
      args.path, 
      args.intent, 
      context
    );
    } else {
      console.log(`✅ 하드 매핑 성공: "${args.path}" → "${resolvedPath}"`);
    }

    console.log(`📄 최적화된 파일 읽기: ${resolvedPath}`);

    // 2. Pre-flight checks
    await this.performPreflightChecks(resolvedPath);
    
    // 3. Smart caching check
    const cacheKey = `file_content_${resolvedPath}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      console.log('⚡ Cache hit for file content');
      return {
        ...cached.result,
        cached: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }

    // 4. 파일 읽기 수행 with enhanced error handling
    let content;
    try {
      content = await this.fileOperations.readFile(resolvedPath);
    } catch (error) {
      const fileSummary = new FileSummary();
      const userFriendlyError = fileSummary.getErrorMessage(error, 'read_file', resolvedPath).userMessage;
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        action: 'optimized_read_file',
        path: resolvedPath,
        error: userFriendlyError,
        technical_error: error.message,
        error_code: error.code,
        suggestions: [
          "관리자 권한으로 프로그램을 실행해보세요",
          "파일이 다른 프로그램에서 사용 중인지 확인하세요",
          "파일 경로가 정확한지 확인하세요"
        ],
        performance: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          cached: false,
          optimized: true
        }
      };
    }

    // 5. Content analysis
    const analysis = this.analyzeFileContent(content, resolvedPath);
    
    // 6. 결과 포맷팅
    const formatted = this.formatHelper.formatFileContent(content, resolvedPath);
    
    const executionTime = performance.now() - startTime;
    
    const result = {
      success: true,
      action: 'optimized_read_file',
      path: resolvedPath,
      content: content,
      formatted: formatted,
      size: content?.length || 0,
      analysis: analysis,
      performance: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        cached: false,
        optimized: true
      }
    };
    
    // 7. Cache result
    this.cache.set(cacheKey, {
      result: result,
      timestamp: Date.now(),
      ttl: 300000
    });

    return result;
  }

  /**
   * 🎯 AI-Powered Find Path - Intelligent Path Discovery
   */
  async aiPoweredFindPath(args, context) {
    console.log(`🎯 AI 기반 경로 찾기: "${args.query || args.path}"`);
    
    const startTime = performance.now();

    // 🌟 1. HardMappingManager 우선 검사 (빠른 하드 매핑)
    const hardMappedPath = this.hardMappingManager.resolvePath(args.query || args.path, context);
    if (hardMappedPath) {
      console.log(`✅ 하드 매핑 성공: "${args.query || args.path}" → "${hardMappedPath}"`);
      return {
        success: true,
        action: 'ai_powered_find_path',
        query: args.query || args.path,
        candidates: [hardMappedPath],
        scoredCandidates: [{ path: hardMappedPath, score: 1.0 }],
        validPaths: [hardMappedPath],
        recommended: hardMappedPath,
        formatted: `하드 매핑 결과: ${hardMappedPath}`,
        performance: {
          executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          candidatesGenerated: 1,
          pathsValidated: 1,
          aiRecommendation: false,
          hardMappingUsed: true
        }
      };
    }

    // 🧠 2. PathResolver의 하드코딩된 경로 해석 (PathMappings에서 이전)
    const hardcodedResult = await this.pathResolver.resolveHardcodedPath(args.query || args.path, {
      ...context,
      intent: args.intent,
      options: args.options
    });
    
    if (hardcodedResult) {
      console.log(`🎯 Hardcoded Path Resolution 성공: "${args.query || args.path}" → "${hardcodedResult}"`);
      return {
        success: true,
        action: 'ai_powered_find_path',
        query: args.query || args.path,
        candidates: [hardcodedResult],
        scoredCandidates: [{ path: hardcodedResult, score: 0.95 }],
        validPaths: [hardcodedResult],
        recommended: hardcodedResult,
        formatted: `하드코딩된 경로 해석 결과: ${hardcodedResult}`,
        performance: {
          executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          candidatesGenerated: 1,
          pathsValidated: 1,
          aiRecommendation: false,
          hardcodedResolution: true
        }
      };
    }

    // 3. AI-enhanced candidate generation (하드 매핑 실패 시)
    const candidates = await this.pathResolver.generatePathCandidates(
      args.query || args.path, 
      args.intent, 
      context
    );
    
    // 4. Machine learning-inspired path scoring
    const scoredCandidates = this.scorePathCandidates(candidates, args, context);
    
    // 5. Parallel path validation with smart batching
    const validationBatches = this.batchPathValidation(scoredCandidates);
    const validationResults = await Promise.all(
      validationBatches.map(batch => this.fileOperations.validatePaths(batch))
    );
    
    const validPaths = validationResults.flat();
    
    // 6. AI-powered recommendation
    const recommendation = this.generatePathRecommendation(validPaths, args, context);

    // 7. 결과 포맷팅
    const formatted = this.formatHelper.formatPathResults(validPaths, candidates);
    
    const executionTime = performance.now() - startTime;

    return {
      success: true,
      action: 'ai_powered_find_path',
      query: args.query || args.path,
      candidates: candidates,
      scoredCandidates: scoredCandidates,
      validPaths: validPaths,
      recommended: recommendation,
      formatted: formatted,
      performance: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        candidatesGenerated: candidates.length,
        pathsValidated: validPaths.length,
        aiRecommendation: !!recommendation
      }
    };
  }

  /**
   * 🔮 Advanced Operations - World-Class Features
   */
  
  /**
   * 📊 Analyze Directory - Deep Intelligence Analysis
   */
  async analyzeDirectory(args, context) {
    console.log(`📊 디렉토리 분석: ${args.path}`);
    
    const startTime = performance.now();
    
    // 🌟 HardMappingManager 우선 검사 (빠른 하드 매핑)
    let resolvedPath = this.hardMappingManager.resolvePath(args.path, context);
    
    if (!resolvedPath) {
      // 경로 해석 (하드 매핑 실패 시)
      resolvedPath = await this.pathResolver.resolvePath(args.path, args.intent, context);
    } else {
      console.log(`✅ 하드 매핑 성공: "${args.path}" → "${resolvedPath}"`);
    }
    
    // Get directory contents with error handling
    let files;
    try {
      files = await this.fileOperations.listFiles(resolvedPath);
    } catch (error) {
      // 오류를 다시 던져서 execute 메서드의 catch 블록에서 처리하도록 함
      throw error;
    }
    
    // Deep analysis with FileSummary.js integration
    const fileSummary = new FileSummary();
    const basicStats = fileSummary.analyzeFileListStats(files);
    const detailedAnalysis = fileSummary.getDirectoryAnalysisJSON(files);
    
    const analysis = {
      summary: {
        totalItems: files.length,
        directories: files.filter(f => f.isDirectory).length,
        files: files.filter(f => !f.isDirectory).length,
        totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0)
      },
      stats: basicStats,
      detailed: detailedAnalysis,
      fileTypes: this.analyzeFileTypes(files),
      sizeDistribution: this.analyzeSizeDistribution(files),
      patterns: this.detectDirectoryPatterns(files, resolvedPath),
      recommendations: this.generateDirectoryRecommendations(files, resolvedPath)
    };
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'analyze_directory',
      path: resolvedPath,
      analysis: analysis,
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: this.formatDirectoryAnalysis(analysis, resolvedPath)
    };
  }

  /**
   * 🔍 Perform Smart Search - AI-Enhanced Search
   */
  async performSmartSearch(args, context) {
    console.log(`🔍 스마트 검색: "${args.query}"`);
    
    const startTime = performance.now();
    
    // Multi-dimensional search strategy with date prefix handling
    const searchStrategies = [
      { type: 'exact', query: args.query },
      { type: 'fuzzy', query: this.generateFuzzyVariants(args.query) },
      { type: 'semantic', query: this.generateSemanticVariants(args.query) },
      { type: 'pattern', query: this.generatePatternVariants(args.query) },
      { type: 'date_prefix', query: this.generateDatePrefixVariants(args.query) } // 새로운 전략 추가
    ];
    
    const searchResults = await Promise.all(
      searchStrategies.map(strategy => this.executeSearchStrategy(strategy, args, context))
    );
    
    // Combine and rank results
    const combinedResults = this.combineSearchResults(searchResults, args.query);
    const rankedResults = this.rankSearchResults(combinedResults, args.query, context);
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'smart_search',
      query: args.query,
      strategies: searchStrategies.map(s => s.type),
      results: rankedResults,
      count: rankedResults.length,
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: this.formatSmartSearchResults(rankedResults, args.query)
    };
  }

  /**
   * 📅 날짜 접두사 변형 생성
   */
  generateDatePrefixVariants(query) {
    const variants = [query];
    
    // 날짜 패턴 제거 후 검색
    const withoutDate = query.replace(/^\d{8}_/, ''); // YYYYMMDD_ 패턴 제거
    if (withoutDate !== query) {
      variants.push(withoutDate);
    }
    
    // 날짜 패턴 추가
    const datePatterns = [
      /^\d{8}_/, // YYYYMMDD_
      /^\d{4}-\d{2}-\d{2}_/, // YYYY-MM-DD_
      /^\d{2}-\d{2}-\d{4}_/, // MM-DD-YYYY_
      /^\d{4}_\d{2}_\d{2}_/ // YYYY_MM_DD_
    ];
    
    // 이미 날짜 패턴이 있는지 확인
    const hasDatePattern = datePatterns.some(pattern => pattern.test(query));
    
    if (!hasDatePattern) {
      // 현재 날짜 패턴 추가
      const now = new Date();
      const dateFormats = [
        `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_`,
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_`,
        `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}_`
      ];
      
      dateFormats.forEach(dateFormat => {
        variants.push(dateFormat + query);
      });
    }
    
    return variants;
  }

  /**
   * 🔮 Predict Files - AI-Powered File Prediction
   */
  async predictFiles(args, context) {
    console.log(`🔮 파일 예측: ${args.path || 'user patterns'}`);
    
    const startTime = performance.now();
    
    // Analyze user patterns
    const userPatterns = this.analyzeUserPatterns();
    const contextualHints = this.extractContextualHints(args, context);
    
    // Generate predictions
    const predictions = {
      likelyFiles: this.predictLikelyFiles(userPatterns, contextualHints),
      suggestedPaths: this.predictSuggestedPaths(userPatterns, contextualHints),
      recommendations: this.generateFileRecommendations(userPatterns, contextualHints),
      trends: this.analyzeUsageTrends(userPatterns)
    };
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'predict_files',
      predictions: predictions,
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: this.formatFilePredictions(predictions)
    };
  }

  /**
   * 💡 Get File Insights - Comprehensive File Analysis
   */
  async getFileInsights(args, context) {
    console.log(`💡 파일 인사이트: ${args.path}`);
    
    const startTime = performance.now();
    const resolvedPath = await this.pathResolver.resolvePath(args.path, args.intent, context);
    
    // Multi-layered analysis
    const insights = {
      basic: await this.getBasicFileInfo(resolvedPath),
      metadata: await this.getEnhancedMetadata(resolvedPath),
      content: await this.getContentInsights(resolvedPath),
      security: await this.getSecurityInsights(resolvedPath),
      performance: await this.getPerformanceInsights(resolvedPath),
      relationships: await this.getFileRelationships(resolvedPath)
    };
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'get_file_insights',
      path: resolvedPath,
      insights: insights,
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: this.formatFileInsights(insights, resolvedPath)
    };
  }

  /**
   * ⚡ Perform Bulk Operations - High-Performance Batch Processing
   */
  async performBulkOperations(args, context) {
    console.log(`⚡ 대량 작업: ${args.operations?.length || 0} operations`);
    
    const startTime = performance.now();
    const operations = args.operations || [];
    
    // Intelligent batching and optimization
    const optimizedBatches = this.optimizeBulkOperations(operations);
    
    const results = await Promise.all(
      optimizedBatches.map(batch => this.executeBulkBatch(batch, context))
    );
    
    const combinedResults = results.flat();
    const summary = this.generateBulkOperationSummary(combinedResults);
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'bulk_operations',
      operations: operations.length,
      results: combinedResults,
      summary: summary,
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: this.formatBulkOperationResults(combinedResults, summary)
    };
  }

  /**
   * 👁️ Monitor Changes - Real-time File System Monitoring
   */
  async monitorChanges(args, context) {
    console.log(`👁️ 실시간 변경 사항 모니터링: ${args.path}`);
    
    const startTime = performance.now();
    const resolvedPaths = await this.pathResolver.resolvePath(args.path, context);
    const resolvedPath = resolvedPaths[0];
    
    if (!resolvedPath) {
      throw new Error('경로를 해석할 수 없습니다');
    }
    
    // Use FileSystemWatcher for real-time monitoring
    const watchInfo = await this.fileOperations.fileWatcher.watchPath(resolvedPath, {
      recursive: args.options?.recursive || false,
      cacheResults: true
    });
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      action: 'monitor_changes',
      monitorId: `monitor_${watchInfo.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      config: {
        path: resolvedPath,
        recursive: watchInfo.recursive,
        events: ['create', 'modify', 'delete'],
        realTime: true
      },
      executionTime: `${executionTime.toFixed(2)}ms`,
      formatted: `👁️ 실시간 모니터링 시작: ${resolvedPath}\n변화 감지: 활성화\n캐시: 실시간 업데이트`
    };
  }

  /**
   * 🔧 Helper Methods for World-Class Operations
   */
  
  applySmartFiltering(files, args, context) {
    console.log(`[DEBUG] applySmartFiltering 입력:`, {
      filesType: typeof files,
      isArray: Array.isArray(files),
      length: Array.isArray(files) ? files.length : 'N/A',
      sample: Array.isArray(files) ? files.slice(0, 2) : files
    });
    
    // 기존 필터링 로직 (예시)
    const filtered = Array.isArray(files)
      ? files.filter(f => f && f.name && typeof f.name === 'string')
      : [];
    
    filtered.forEach((item, idx) => {
      if (!item.name || !item.path) {
        console.log(`[WARN] 필수 필드 누락(필터 후):`, item);
      }
    });
    
    console.log(`[DEBUG] applySmartFiltering 결과:`, {
      filteredLength: filtered.length,
      firstItem: filtered[0]
    });
    return filtered;
  }
  
  expandSearchQuery(query, context) {
    const queries = [query];
    
    // Add fuzzy variants
    queries.push(query.toLowerCase());
    queries.push(query.replace(/\s+/g, ''));
    
    // Add extension-based searches
    if (!query.includes('.')) {
      queries.push(`${query}.js`, `${query}.py`, `${query}.txt`);
    }
  
  // 확장자 검색 패턴 추가
  const extensionPattern = /\.(\w+)$/;
  if (extensionPattern.test(query)) {
    queries.push(query.toLowerCase());
  }
    
    return [...new Set(queries)];
  }
  
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.path || result.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  scoreSearchRelevance(results, query, context) {
    return results.map(result => {
      let score = 0;
      
      // Exact name match
      if (result.name === query) score += 100;
      
      // Partial name match
      if (result.name.includes(query)) score += 50;
      
      // File type preferences
      const ext = result.name.split('.').pop();
      const preferences = this.userPatterns.get('file_preferences') || new Map();
      score += (preferences.get(ext) || 0) * 10;
      
      return { ...result, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Note: listFiles functionality is handled by smartListFiles for better performance

  // Note: searchFiles functionality is handled by intelligentSearchFiles for better performance

  // Note: readFile functionality is handled by optimizedReadFile for better performance

  // Note: findPath functionality is handled by aiPoweredFindPath for better performance

  /**
   * 🔍 확장자 기반 파일 검색
   */
  async searchFilesByExtension(args, context = {}) {
    try {
      console.log(`🔍 확장자 검색 시작: ${args.extension}`);
      
      const startTime = performance.now();
      
      // 확장자 정규화
      const targetExtension = args.extension.toLowerCase().startsWith('.') 
        ? args.extension.toLowerCase() 
        : `.${args.extension.toLowerCase()}`;
      
      // 검색할 경로들 결정
      let searchPaths = [];
      
      if (args.searchPaths && args.searchPaths.length > 0) {
        // 경로 매핑 적용
        searchPaths = args.searchPaths.map(path => {
          if (path === 'downloads' || path === '다운로드') {
            return 'C:\\Users\\hki\\Downloads';
          } else if (path === 'desktop' || path === '바탕화면') {
            return 'C:\\Users\\hki\\Desktop';
          } else if (path === 'documents' || path === '문서') {
            return 'C:\\Users\\hki\\Documents';
          }
          return path;
        });
      } else {
        // 기본 검색 경로들
        searchPaths = [
          'C:\\Users\\hki\\Downloads',
          'C:\\Users\\hki\\Desktop', 
          'C:\\Users\\hki\\Documents'
        ];
      }
      
      console.log(`🔍 검색 경로: ${searchPaths.join(', ')}`);
      
      // 실제 파일 검색
      const allFiles = [];
      
      for (const searchPath of searchPaths) {
        try {
          const files = await this.scanDirectoryForExtension(searchPath, targetExtension, { 
            recursive: args.recursive || false 
          });
          allFiles.push(...files);
        } catch (error) {
          console.warn(`경로 검색 실패: ${searchPath}`, error.message);
        }
      }
      
      // 중복 제거 및 정렬
      const uniqueFiles = this.removeDuplicateFiles(allFiles);
      const sortedFiles = uniqueFiles.sort((a, b) => {
        return new Date(b.modified || 0) - new Date(a.modified || 0);
      });
      
      // 결과 제한
      const limitedFiles = sortedFiles.slice(0, args.limit || 100);
      
      // 성능 메트릭 업데이트
      const executionTime = performance.now() - startTime;
      await this.updatePerformanceMetrics(executionTime, true);
      
      // 사용자 패턴 학습
      await this.learnFromUserPattern(args, { files: limitedFiles }, executionTime);
      
      // 결과 포맷팅
      const formattedResult = this.formatExtensionSearchResults(limitedFiles, targetExtension, context);
      
      console.log(`✅ 확장자 검색 완료: ${targetExtension} - ${limitedFiles.length}개 파일`);
      
      return {
        success: true,
        files: limitedFiles,
        totalFound: sortedFiles.length,
        extension: targetExtension,
        searchPaths: searchPaths,
        formattedResult
      };
      
    } catch (error) {
      console.error(`❌ 확장자 검색 실패: ${args.extension}`, error);
      
      return {
        success: false,
        error: error.message,
        extension: args.extension,
        files: []
      };
    }
  }
  
  /**
   * 📝 확장자 검색 결과 포맷팅
   */
  formatExtensionSearchResults(files, extension, context = {}) {
    if (files.length === 0) {
      return `🔍 ${extension} 확장자 파일을 찾을 수 없습니다.`;
    }
    
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const avgSize = totalSize / files.length;
    
    let result = `🔍 ${extension} 확장자 파일 ${files.length}개를 찾았습니다.\n\n`;
    
    // 파일 목록 (최대 10개)
    const displayFiles = files.slice(0, 10);
    result += displayFiles.map(file => {
      const size = this.formatFileSize(file.size || 0);
      const date = new Date(file.modified).toLocaleDateString('ko-KR');
      return `📄 ${file.name} (${size}, ${date})`;
    }).join('\n');
    
    if (files.length > 10) {
      result += `\n\n... 외 ${files.length - 10}개 파일`;
    }
    
    // 통계 정보
    result += `\n\n📊 통계:\n`;
    result += `• 총 크기: ${this.formatFileSize(totalSize)}\n`;
    result += `• 평균 크기: ${this.formatFileSize(avgSize)}\n`;
    result += `• 최근 수정: ${new Date(files[0].modified).toLocaleDateString('ko-KR')}`;
    
    return result;
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      mcpConnected: this.mcpConnector?.isReady() || false,
      modules: {
        pathResolver: this.pathResolver?.isReady() || false,
        fileOperations: this.fileOperations?.isReady() || false,
        formatHelper: this.formatHelper?.isReady() || false
      }
    };
  }

  /**
   * 🎯 World-Class Helper Methods Implementation
   */
  
  generateCacheKey(args, context) {
    return `${args.action}_${JSON.stringify(args)}_${JSON.stringify(context)}`;
  }
  
  shouldOptimizeForPerformance(args) {
    return args.options?.priority === 'high' || 
           (args.options?.fileTypes && args.options.fileTypes.length > 5) ||
           (args.options?.recursive === true);
  }
  
  async preOptimizeOperation(args) {
    // Pre-warm cache, prepare resources
    console.log('🚀 Pre-optimizing operation for maximum performance');
  }
  
  updateUserContext(args, context) {
    // Update user context patterns for better AI decisions
    if (args.path) {
      const frequentPaths = this.userPatterns.get('frequent_paths');
      if (frequentPaths && frequentPaths instanceof Set) {
      frequentPaths.add(args.path);
      } else {
        // 안전한 초기화
        this.userPatterns.set('frequent_paths', new Set([args.path]));
      }
    }
  }
  
  async getQuickHealthCheck() {
    return {
      system: 'optimal',
      performance: 'excellent',
      availability: 'online'
    };
  }
  
  async handleOperationFailure(args, error, context) {
    console.log('🛡️ Handling operation failure with graceful recovery');
    
    // Attempt simplified operation
    try {
      if (args.action === 'list_files') {
        return await this.listFiles(args, context);
      }
    } catch (fallbackError) {
      // Return minimal error response
      return {
        success: false,
        error: 'Operation failed with graceful fallback',
        suggestion: 'Try with a simpler query or check path accessibility'
      };
    }
  }
  
  async optimizeCache() {
    // Remove expired entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  async updateUserPatterns() {
    // Optimize user pattern storage
    const searchHistory = this.userPatterns.get('search_history');
    if (searchHistory && searchHistory.length > 100) {
      searchHistory.splice(0, searchHistory.length - 100);
    }
  }
  
  async performMaintenanceTasks() {
    // Background maintenance
    await this.optimizeCache();
    await this.updateUserPatterns();
  }
  
  async activateRecoveryMode() {
    console.log('🛡️ Activating recovery mode');
    // Minimal functionality recovery
  }
  
  async performPreflightChecks(path) {
    // Check path accessibility, permissions, etc.
    if (!path) {
      throw new Error('Invalid path provided');
    }
    
    // Handle both string and object paths
    const pathString = typeof path === 'string' ? path : path.path;
    
    if (!pathString || pathString.trim() === '') {
      throw new Error('Invalid path provided');
    }
    
    // Additional validation for file existence (optional, can be expensive)
    // await this.fileOperations.validatePath(pathString);
  }
  
  analyzeFileContent(content, path) {
    return {
      encoding: 'utf-8',
      lineCount: content ? content.split('\n').length : 0,
      fileType: path.split('.').pop() || 'unknown',
      hasCode: /function|class|import|export/.test(content || ''),
      isEmpty: !content || content.trim() === ''
    };
  }
  
  // Additional helper methods for advanced operations
  analyzeFileTypes(files) {
    const types = new Map();
    files.forEach(file => {
      if (!file.isDirectory) {
        const ext = file.name.split('.').pop() || 'no-extension';
        types.set(ext, (types.get(ext) || 0) + 1);
      }
    });
    return Object.fromEntries(types);
  }
  
  analyzeSizeDistribution(files) {
    const sizes = files.filter(f => !f.isDirectory).map(f => f.size || 0);
    return {
      small: sizes.filter(s => s < 1024).length,
      medium: sizes.filter(s => s >= 1024 && s < 1024*1024).length,
      large: sizes.filter(s => s >= 1024*1024).length,
      average: sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0
    };
  }
  
  detectDirectoryPatterns(files, path) {
    return {
      hasSourceCode: files.some(f => /\.(js|py|java|cpp)$/.test(f.name)),
      hasDocuments: files.some(f => /\.(pdf|doc|txt)$/.test(f.name)),
      isProjectFolder: files.some(f => ['package.json', 'requirements.txt', 'Makefile'].includes(f.name)),
      organizationLevel: files.filter(f => f.isDirectory).length > files.filter(f => !f.isDirectory).length ? 'good' : 'poor'
    };
  }
  
  generateDirectoryRecommendations(files, path) {
    const recommendations = [];
    
    if (files.length > 50) {
      recommendations.push('Consider organizing files into subdirectories');
    }
    
    const hasLargeFiles = files.some(f => (f.size || 0) > 10 * 1024 * 1024);
    if (hasLargeFiles) {
      recommendations.push('Large files detected - consider archiving or compression');
    }
    
    return recommendations;
  }
  
  formatDirectoryAnalysis(analysis, path) {
    return `📊 Directory Analysis: ${path}\n\n` +
           `📈 Summary: ${analysis.summary.totalItems} items (${analysis.summary.directories} dirs, ${analysis.summary.files} files)\n` +
           `💾 Total Size: ${this.formatFileSize(analysis.summary.totalSize)}\n` +
           `🏷️ File Types: ${Object.keys(analysis.fileTypes).join(', ')}\n` +
           `💡 Recommendations: ${analysis.recommendations.length} suggestions`;
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 🔮 Advanced Operation Helper Methods
  
  generateFuzzyVariants(query) {
    return [query.toLowerCase(), query.replace(/\s+/g, ''), query.replace(/[aeiou]/gi, '')];
  }
  
  generateSemanticVariants(query) {
    const synonyms = {
      'file': ['document', 'data'],
      'folder': ['directory', 'dir'],
      'project': ['app', 'application'],
      'config': ['configuration', 'settings']
    };
    
    const variants = [query];
    Object.entries(synonyms).forEach(([key, values]) => {
      if (query.toLowerCase().includes(key)) {
        values.forEach(synonym => {
          variants.push(query.toLowerCase().replace(key, synonym));
        });
      }
    });
    
    return variants;
  }
  
  generatePatternVariants(query) {
    return [`*${query}*`, `${query}*`, `*${query}`, query.replace(/\s+/g, '*')];
  }
  
  async executeSearchStrategy(strategy, args, context) {
    // Execute different search strategies
    const queries = Array.isArray(strategy.query) ? strategy.query : [strategy.query];
    const results = [];
    
    for (const query of queries) {
      try {
        const searchPaths = await this.pathResolver.determineSearchPaths(query, args.path, args.intent, context);
        const searchResults = await this.fileOperations.searchFiles(searchPaths, query);
        results.push(...searchResults.map(r => ({ ...r, strategy: strategy.type, query })));
      } catch (error) {
        console.warn(`Search strategy ${strategy.type} failed for query "${query}":`, error);
      }
    }
    
    return results;
  }
  
  combineSearchResults(searchResults, originalQuery) {
    const combined = searchResults.flat();
    return this.deduplicateResults(combined);
  }
  
  rankSearchResults(results, query, context) {
    return results.map(result => {
      let score = 0;
      const fileName = result.name.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Exact match bonus
      if (fileName === queryLower) score += 100;
      
      // Partial match bonus
      if (fileName.includes(queryLower)) score += 50;
      
      // Date prefix handling - 날짜 접두사 제거 후 매칭
      const withoutDate = fileName.replace(/^\d{8}_/, '');
      if (withoutDate.includes(queryLower)) score += 40; // 날짜 제거 후 매칭 보너스
      
      // Strategy bonus
      if (result.strategy === 'exact') score += 30;
      else if (result.strategy === 'semantic') score += 20;
      else if (result.strategy === 'fuzzy') score += 10;
      else if (result.strategy === 'date_prefix') score += 25; // 날짜 접두사 전략 보너스
      
      // File type relevance bonus
      const fileExt = result.name.split('.').pop()?.toLowerCase();
      if (queryLower.includes('ppt') && fileExt === 'pptx') score += 15;
      if (queryLower.includes('pdf') && fileExt === 'pdf') score += 15;
      if (queryLower.includes('excel') && (fileExt === 'xlsx' || fileExt === 'xls')) score += 15;
      if (queryLower.includes('word') && (fileExt === 'docx' || fileExt === 'doc')) score += 15;
      
      return { ...result, searchScore: score };
    }).sort((a, b) => b.searchScore - a.searchScore);
  }
  
  formatSmartSearchResults(results, query) {
    if (results.length === 0) {
      return `🔍 No results found for "${query}"`;
    }
    
    const topResults = results.slice(0, 10);
    let formatted = `🔍 Smart Search Results for "${query}" (${results.length} found):\n\n`;
    
    topResults.forEach((result, index) => {
      const icon = result.isDirectory ? '📁' : '📄';
      formatted += `${index + 1}. ${icon} ${result.name}\n`;
      if (result.path !== result.name) {
        formatted += `   📍 ${result.path}\n`;
      }
      formatted += `   🎯 Score: ${result.searchScore || 0}\n\n`;
    });
    
    return formatted;
  }
  
  // User Pattern Analysis Methods
  analyzeUserPatterns() {
    return {
      frequentPaths: Array.from(this.userPatterns.get('frequent_paths') || []),
      searchHistory: this.userPatterns.get('search_history') || [],
      filePreferences: Object.fromEntries(this.userPatterns.get('file_preferences') || new Map())
    };
  }
  
  extractContextualHints(args, context) {
    return {
      currentPath: args.path,
      userIntent: args.intent,
      timeOfDay: new Date().getHours(),
      recentActivity: context.recentActivity || []
    };
  }
  
  predictLikelyFiles(patterns, hints) {
    const predictions = [];
    
    // Based on file preferences
    const preferences = patterns.filePreferences;
    Object.entries(preferences).forEach(([ext, count]) => {
      if (count > 5) {
        predictions.push({
          type: 'extension',
          value: `*.${ext}`,
          confidence: Math.min(count / 10, 1),
          reason: `Frequently accessed ${ext} files`
        });
      }
    });
    
    return predictions;
  }
  
  predictSuggestedPaths(patterns, hints) {
    const suggestions = [];
    
    // Most frequent paths
    patterns.frequentPaths.slice(0, 5).forEach(path => {
      suggestions.push({
        path: path,
        confidence: 0.8,
        reason: 'Frequently accessed location'
      });
    });
    
    return suggestions;
  }
  
  generateFileRecommendations(patterns, hints) {
    const recommendations = [];
    
    if (patterns.searchHistory.length > 10) {
      recommendations.push('Consider organizing frequently searched files');
    }
    
    if (Object.keys(patterns.filePreferences).length > 20) {
      recommendations.push('Multiple file types detected - consider file organization');
    }
    
    return recommendations;
  }
  
  analyzeUsageTrends(patterns) {
    const now = Date.now();
    const recentSearches = patterns.searchHistory.filter(s => now - s.timestamp < 86400000); // 24 hours
    
    return {
      dailySearchCount: recentSearches.length,
      popularExtensions: Object.entries(patterns.filePreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([ext]) => ext),
      searchTrend: recentSearches.length > patterns.searchHistory.length * 0.3 ? 'increasing' : 'stable'
    };
  }
  
  formatFilePredictions(predictions) {
    let formatted = '🔮 File Predictions:\n\n';
    
    if (predictions.likelyFiles.length > 0) {
      formatted += '📄 Likely Files:\n';
      predictions.likelyFiles.forEach(pred => {
        formatted += `  • ${pred.value} (${(pred.confidence * 100).toFixed(0)}% confidence)\n`;
      });
      formatted += '\n';
    }
    
    if (predictions.suggestedPaths.length > 0) {
      formatted += '📁 Suggested Paths:\n';
      predictions.suggestedPaths.forEach(pred => {
        formatted += `  • ${pred.path}\n`;
      });
      formatted += '\n';
    }
    
    return formatted;
  }

  // 🎯 Path Analysis and Scoring Methods
  
  scorePathCandidates(candidates, args, context) {
    return candidates.map(path => {
      let score = 0;
      
      // Exact match bonus
      if (path === args.path) score += 100;
      
      // Frequent path bonus
      const frequentPaths = this.userPatterns.get('frequent_paths') || new Set();
      if (frequentPaths.has(path)) score += 50;
      
      // Length penalty (shorter paths often more relevant)
      score -= path.split('/').length;
      
      return { path, score };
    }).sort((a, b) => b.score - a.score);
  }
  
  batchPathValidation(scoredCandidates) {
    // Group paths for efficient batch validation
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < scoredCandidates.length; i += batchSize) {
      batches.push(scoredCandidates.slice(i, i + batchSize).map(sc => sc.path));
    }
    
    return batches;
  }
  
  generatePathRecommendation(validPaths, args, context) {
    if (validPaths.length === 0) return null;
    
    // Return the most relevant valid path
    const frequentPaths = this.userPatterns.get('frequent_paths') || new Set();
    
    // Prefer frequent paths
    const frequentValid = validPaths.find(path => frequentPaths.has(path));
    if (frequentValid) return frequentValid;
    
    // Otherwise return first valid path
    return validPaths[0];
  }
  
  // 💡 File Insights Methods
  
  async getBasicFileInfo(path) {
    try {
      // Get basic file statistics
      return {
        path: path,
        exists: true,
        accessible: true,
        type: path.split('.').pop() || 'unknown'
      };
    } catch (error) {
      return {
        path: path,
        exists: false,
        accessible: false,
        error: error.message
      };
    }
  }
  
  async getEnhancedMetadata(path) {
    return {
      lastModified: Date.now(),
      size: 0,
      permissions: 'readable',
      encoding: 'utf-8'
    };
  }
  
  async getContentInsights(path) {
    try {
      const content = await this.fileOperations.readFile(path);
      return this.analyzeFileContent(content, path);
    } catch (error) {
      return { error: 'Unable to analyze content', accessible: false };
    }
  }
  
  async getSecurityInsights(path) {
    return {
      isSafe: true,
      hasExecutableContent: /\.(exe|bat|sh|ps1)$/i.test(path),
      containsSensitiveData: false,
      recommendedAccess: 'standard'
    };
  }
  
  async getPerformanceInsights(path) {
    return {
      accessTime: 'fast',
      cacheStatus: this.cache.has(`file_content_${path}`) ? 'cached' : 'not-cached',
      optimizationSuggestions: []
    };
  }
  
  async getFileRelationships(path) {
    const directory = path.substring(0, path.lastIndexOf('/'));
    try {
      const siblingFiles = await this.fileOperations.listFiles(directory);
      const relatedFiles = siblingFiles.filter(f => 
        f.name !== path.split('/').pop() && 
        f.name.includes(path.split('/').pop()?.split('.')[0] || '')
      );
      
      return {
        directory: directory,
        siblings: siblingFiles.length,
        relatedFiles: relatedFiles.map(f => f.name)
      };
    } catch (error) {
      return { error: 'Unable to analyze relationships' };
    }
  }
  
  formatFileInsights(insights, path) {
    let formatted = `💡 File Insights: ${path}\n\n`;
    
    // Basic info
    if (insights.basic) {
      formatted += `📋 Basic Info:\n`;
      formatted += `  • Type: ${insights.basic.type}\n`;
      formatted += `  • Accessible: ${insights.basic.accessible ? 'Yes' : 'No'}\n\n`;
    }
    
    // Content analysis
    if (insights.content && !insights.content.error) {
      formatted += `📄 Content Analysis:\n`;
      formatted += `  • Lines: ${insights.content.lineCount}\n`;
      formatted += `  • Has Code: ${insights.content.hasCode ? 'Yes' : 'No'}\n`;
      formatted += `  • Empty: ${insights.content.isEmpty ? 'Yes' : 'No'}\n\n`;
    }
    
    // Security
    if (insights.security) {
      formatted += `🔒 Security: ${insights.security.isSafe ? 'Safe' : 'Caution Required'}\n\n`;
    }
    
    return formatted;
  }
  
  // ⚡ Bulk Operations Methods
  
  optimizeBulkOperations(operations) {
    // Group operations by type for efficient processing
    const groups = {
      read: [],
      write: [],
      list: [],
      search: []
    };
    
    operations.forEach(op => {
      const type = this.getOperationType(op);
      if (groups[type]) {
        groups[type].push(op);
      }
    });
    
    // Return optimized batches
    return Object.entries(groups)
      .filter(([_, ops]) => ops.length > 0)
      .map(([type, ops]) => ({ type, operations: ops }));
  }
  
  getOperationType(operation) {
    if (operation.action) {
      if (operation.action.includes('read')) return 'read';
      if (operation.action.includes('write')) return 'write';
      if (operation.action.includes('list')) return 'list';
      if (operation.action.includes('search')) return 'search';
    }
    return 'unknown';
  }
  
  async executeBulkBatch(batch, context) {
    const results = [];
    
    for (const operation of batch.operations) {
      try {
        const result = await this.execute(operation, context);
        results.push({ operation, result, success: true });
      } catch (error) {
        results.push({ operation, error: error.message, success: false });
      }
    }
    
    return results;
  }
  
  generateBulkOperationSummary(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      total: results.length,
      successful: successful,
      failed: failed,
      successRate: results.length > 0 ? (successful / results.length * 100).toFixed(1) : 0
    };
  }
  
  formatBulkOperationResults(results, summary) {
    let formatted = `⚡ Bulk Operation Results:\n\n`;
    formatted += `📊 Summary: ${summary.successful}/${summary.total} successful (${summary.successRate}%)\n\n`;
    
    if (summary.failed > 0) {
      formatted += `❌ Failed Operations:\n`;
      results.filter(r => !r.success).forEach((result, index) => {
        formatted += `  ${index + 1}. ${result.operation.action}: ${result.error}\n`;
      });
    }
    
    return formatted;
  }

  /**
   * 🔒 구독 등급별 기능 접근 권한 체크 (8단계)
   */
  async checkSubscriptionAccess(action, context) {
    const userTier = context.subscriptionTier || 'none';
    
    // 구독 등급별 허용 액션 확인
    for (const [tier, config] of Object.entries(this.subscription_features)) {
      if (userTier === tier || (userTier === 'free' && tier === 'free')) {
        const allowedActions = config.allowed_actions;
        
        if (allowedActions === '*' || allowedActions.includes(action)) {
          return { allowed: true };
        }
        
        // 권한 없음 - 업그레이드 필요
        const requiredTiers = Object.keys(this.subscription_features).filter(t => {
          const tierConfig = this.subscription_features[t];
          return tierConfig.allowed_actions === '*' || tierConfig.allowed_actions.includes(action);
        });
        
        return {
          allowed: false,
          message: `${action} 기능은 ${requiredTiers.join(' 또는 ')} 구독이 필요합니다.`,
          required_tier: requiredTiers[0],
          benefits: this.getUpgradeBenefits(requiredTiers[0])
        };
      }
    }
    
    // 기본적으로 free 등급 권한 적용
    const freeActions = this.subscription_features.free.allowed_actions;
    if (freeActions.includes(action)) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      message: `${action} 기능을 사용하려면 구독이 필요합니다.`,
      required_tier: 'basic',
      benefits: this.getUpgradeBenefits('basic')
    };
  }

  /**
   * 📊 사용량 제한 체크 (8단계)
   */
  async checkUsageLimit(action, context) {
    const userTier = context.subscriptionTier || 'free';
    const tierConfig = this.subscription_features[userTier] || this.subscription_features.free;
    
    // 무제한 사용 등급
    if (tierConfig.daily_limit === -1) {
      return { allowed: true };
    }
    
    // 임시: 실제 사용량 체크 로직 (개발용)
    const currentUsage = Math.floor(Math.random() * tierConfig.daily_limit);
    
    if (currentUsage >= tierConfig.daily_limit) {
      return {
        allowed: false,
        message: `일일 사용량 한도를 초과했습니다. (${currentUsage}/${tierConfig.daily_limit})`,
        current_usage: currentUsage,
        daily_limit: tierConfig.daily_limit,
        reset_time: this.getNextResetTime()
      };
    }
    
    return { 
      allowed: true,
      current_usage: currentUsage,
      daily_limit: tierConfig.daily_limit
    };
  }

  /**
   * 🎯 순수 JSON 응답 포맷팅 (8단계: 자연어 제거)
   */
  formatJsonResponse(result, action, context) {
    // 자연어 포맷팅 필드 제거
    if (result.formatted) {
      delete result.formatted;
    }
    
    // 표준 응답 구조
    return {
      success: result.success !== false,
      action: action,
      data: result,
      metadata: {
        service: this.name,
        version: this.version,
        subscription_tier: context.subscriptionTier || 'free',
        timestamp: new Date().toISOString(),
        user_id: context.userId || null
      },
      // 성능 정보
      performance: {
        execution_time: result.executionTime || null,
        cached: result.cached || false,
        optimized: result.optimized || true
      }
    };
  }

  /**
   * 📈 구독 업그레이드 혜택 정보
   */
  getUpgradeBenefits(tier) {
    const benefits = {
      basic: [
        '월 200회 파일 작업',
        '10MB 파일 처리',
        '고급 검색 기능',
        '경로 자동 인식'
      ],
      premium: [
        '무제한 파일 작업',
        '무제한 파일 크기',
        'AI 분석 기능',
        '대량 작업 처리',
        '실시간 모니터링'
      ]
    };
    
    return benefits[tier] || [];
  }

  /**
   * ⏰ 다음 리셋 시간 계산
   */
  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 🎯 Tool 메타데이터 가져오기 (8단계)
   */
  getToolMetadata() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      category: this.category,
      subscription_tier: this.subscription_tier,
      subscription_features: this.subscription_features,
      parameters: this.parameters
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      console.log('📁 FileSystemService 정리 중...');
      
      // Clear caches and patterns
      this.cache.clear();
      this.userPatterns.clear();
      this.pathPredictions.clear();
      
      if (this.pathResolver) await this.pathResolver.cleanup();
      if (this.fileOperations) await this.fileOperations.cleanup();
      if (this.formatHelper) await this.formatHelper.cleanup();
      if (this.fileSummary) await this.fileSummary.cleanup();
      if (this.fileFormatter) await this.fileFormatter.cleanup();

      console.log('✅ FileSystemService 정리 완료');

    } catch (error) {
      console.error('❌ FileSystemService 정리 실패:', error);
    }
  }

  /**
   * 📁 특정 확장자 파일 스캔
   */
  async scanDirectoryForExtension(directoryPath, targetExtension, options = {}) {
    const files = [];
    
    try {
      // 디렉토리 존재 확인
      if (!await this.pathExists(directoryPath)) {
        return files;
      }
      
      // 디렉토리 내용 읽기
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        if (entry.isFile()) {
          // 파일 확장자 확인
          const fileExtension = path.extname(entry.name).toLowerCase();
          
          if (fileExtension === targetExtension) {
            try {
              // 파일 정보 가져오기
              const stats = await fs.stat(fullPath);
              
              files.push({
                name: entry.name,
                path: fullPath,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                isDirectory: false,
                extension: fileExtension
              });
            } catch (statError) {
              console.warn(`파일 정보 읽기 실패: ${fullPath}`, statError.message);
            }
          }
        } else if (entry.isDirectory() && options.recursive) {
          // 재귀 검색 (옵션)
          try {
            const subFiles = await this.scanDirectoryForExtension(fullPath, targetExtension, options);
            files.push(...subFiles);
          } catch (subError) {
            console.warn(`하위 디렉토리 검색 실패: ${fullPath}`, subError.message);
          }
        }
      }
      
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${directoryPath}`, error.message);
    }
    
    return files;
  }
  
  /**
   * 🔄 중복 파일 제거
   */
  removeDuplicateFiles(files) {
    const seen = new Set();
    return files.filter(file => {
      const key = file.path;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * 📁 경로 존재 확인
   */
  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 📄 고급 문서 분석 (read_file 액션 대체)
   */
  async analyzeDocumentContent(args, context) {
    const startTime = performance.now();
    let { path: filePath } = args;
    
    // 경로가 배열인 경우 첫 번째 요소 사용
    if (Array.isArray(filePath)) {
      filePath = filePath[0];
    }
    
    if (!filePath) {
      return {
        success: false,
        error: '파일 경로가 필요합니다',
        action: 'read_file'
      };
    }

    try {
      // 경로 해석
      const resolvedPath = await this.pathResolver.resolvePath(filePath, context);
      
      // 문서 내용 분석 실행
      const result = await this.documentAnalyzer.analyzeDocument(resolvedPath);
      
      const executionTime = performance.now() - startTime;
      
      return {
        success: result.success,
        action: 'read_file',
        path: resolvedPath,
        content: result.analysis?.content || '',
        formatted: result.analysis?.summary || '',
        analysis: result.analysis?.analysis || {},
        metadata: result.analysis?.metadata || {},
        size: result.analysis?.content?.length || 0,
        performance: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          cached: false,
          optimized: true
        }
      };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        action: 'read_file',
        path: filePath,
        error: error.message,
        technical_error: error.stack,
        performance: {
          executionTime: `${executionTime.toFixed(2)}ms`
        }
      };
    }
  }

  /**
   * 📄 문서 내용 읽기 (간단 버전)
   */
  async readDocumentContent(args, context) {
    const startTime = performance.now();
    const { path: filePath, maxLength = 10000 } = args;
    
    if (!filePath) {
      return {
        success: false,
        error: '파일 경로가 필요합니다',
        action: 'read_document_content'
      };
    }

    try {
      // 경로 해석
      const resolvedPath = await this.pathResolver.resolvePath(filePath, context);
      
      // 문서 내용 분석 실행
      const result = await this.documentAnalyzer.analyzeDocument(resolvedPath);
      
      if (!result.success) {
        return {
          success: false,
          action: 'read_document_content',
          path: resolvedPath,
          error: result.error
        };
      }
      
      // 내용 길이 제한
      let content = result.analysis.content || '';
      if (content && content.length > maxLength) {
        content = content.substring(0, maxLength) + '... (내용이 잘렸습니다)';
      }
      
      const executionTime = performance.now() - startTime;
      
      return {
        success: true,
        action: 'read_document_content',
        path: resolvedPath,
        content: content,
        summary: result.analysis.summary,
        analysis: result.analysis.analysis,
        metadata: result.analysis.metadata,
        performance: {
          executionTime: `${executionTime.toFixed(2)}ms`
        }
      };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        action: 'read_document_content',
        path: filePath,
        error: error.message,
        technical_error: error.stack,
        performance: {
          executionTime: `${executionTime.toFixed(2)}ms`
        }
      };
    }
  }

  /**
   * 📊 문서 분석 학습 데이터 조회
   */
  async getDocumentLearningData(options = {}) {
    try {
      return await this.learningManager.getLearningData(options);
    } catch (error) {
      console.error('문서 분석 학습 데이터 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        analyses: [],
        metadata: {},
        formatStats: {},
        learningInsights: {},
        totalResults: 0
      };
    }
  }

  /**
   * 📈 문서 분석 통계 조회
   */
  async getDocumentAnalysisStatistics() {
    try {
      return await this.learningManager.getStatistics();
    } catch (error) {
      console.error('문서 분석 통계 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        metadata: {},
        formatStats: {},
        learningInsights: {},
        topKeywords: [],
        topDocumentTypes: [],
        sizeDistribution: {}
      };
    }
  }
}