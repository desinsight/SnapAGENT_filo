import EventEmitter from 'events';
import { NaturalLanguageProcessor } from './NaturalLanguageProcessor.js';
import { AdvancedNLP } from './AdvancedNLP.js';
import { FileSystemAnalyzer } from './FileSystemAnalyzer.js';
import { IntelligentFileAnalyzer } from './IntelligentFileAnalyzer.js';
import { IntelligentSearchEngine } from './IntelligentSearchEngine.js';
import { ErrorRecoverySystem } from './ErrorRecoverySystem.js';
import { ContextLearningEngine } from './ContextLearningEngine.js';
import { MultiModelAIOrchestrator } from './MultiModelAIOrchestrator.js';
import { PredictiveUIEngine } from './PredictiveUIEngine.js';
import { AdvancedMemorySystem } from './AdvancedMemorySystem.js';
import { LocalCache } from '../utils/LocalCache.js';
import { logger } from '../utils/logger.js';

/**
 * AI 코파일럿 코어 엔진 (Enhanced)
 * 고급 AI 기능과 지능형 학습을 통한 차세대 파일 관리 시스템
 * - 다중 언어 자연어 처리
 * - 컨텍스트 학습 및 개인화
 * - 지능형 파일 분석 및 추천
 * - 다중 AI 모델 통합
 * - 예측적 사용자 인터페이스
 * - 고급 대화 메모리 시스템
 * @class AICopilotCore
 */
export class AICopilotCore extends EventEmitter {
  constructor() {
    super();
    
    // 기본 모듈 초기화
    this.nlp = new NaturalLanguageProcessor();
    this.fileAnalyzer = new FileSystemAnalyzer();
    this.searchEngine = new IntelligentSearchEngine();
    this.errorRecovery = new ErrorRecoverySystem();
    this.cache = new LocalCache('ai-copilot');
    
    // 고급 AI 모듈 초기화
    this.advancedNLP = new AdvancedNLP();
    this.intelligentFileAnalyzer = new IntelligentFileAnalyzer();
    this.contextLearning = new ContextLearningEngine();
    this.aiOrchestrator = new MultiModelAIOrchestrator();
    this.predictiveUI = new PredictiveUIEngine();
    this.memorySystem = new AdvancedMemorySystem();
    
    // 상태 관리
    this.state = {
      isProcessing: false,
      lastCommand: null,
      history: [],
      activeOperations: new Map(),
      currentSession: null,
      userProfile: null,
      contextHistory: [],
      learningMode: true,
      intelligenceLevel: 'advanced'
    };
    
    this.initialize();
  }

  /**
   * 시스템 초기화
   */
  async initialize() {
    try {
      logger.info('AI Copilot Core 초기화 시작');
      
      // 기본 모듈 초기화
      await Promise.all([
        this.nlp.initialize(),
        this.fileAnalyzer.initialize(),
        this.searchEngine.initialize(),
        this.errorRecovery.initialize()
      ]);
      
      // 고급 AI 모듈 초기화
      await Promise.all([
        this.advancedNLP.initialize(),
        this.intelligentFileAnalyzer.initialize(),
        this.contextLearning.initialize(),
        this.aiOrchestrator.initialize(),
        this.predictiveUI.initialize(),
        this.memorySystem.initialize()
      ]);
      
      // 세션 및 사용자 프로필 초기화
      await this.initializeUserSession();
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      // 백그라운드 작업 시작
      this.startBackgroundTasks();
      
      logger.info('AI Copilot Core 초기화 완료');
      this.emit('initialized');
    } catch (error) {
      logger.error('AI Copilot Core 초기화 실패:', error);
      await this.errorRecovery.handleInitError(error);
    }
  }

  /**
   * 고급 자연어 명령 처리 (Enhanced)
   * - 다중 언어 지원
   * - 컨텍스트 인식
   * - 사용자 학습
   * - AI 모델 자동 선택
   * - 예측적 추천
   * @param {string} command - 사용자의 자연어 명령
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과
   */
  async processCommand(command, context = {}) {
    const operationId = this.generateOperationId();
    
    try {
      this.state.isProcessing = true;
      this.state.lastCommand = command;
      
      // 명령어 캐시 확인
      const cachedResult = await this.cache.get(`cmd:${command}`);
      if (cachedResult && !context.forceRefresh) {
        logger.info('캐시된 결과 반환:', command);
        return cachedResult;
      }
      
      // 고급 자연어 분석 (다중 언어, 컨텍스트 인식)
      const enhancedContext = await this.enrichContext(context);
      const intent = await this.advancedNLP.analyzeMultiLayer(command, enhancedContext);
      
      // AI 모델 전략적 선택
      const selectedModel = await this.aiOrchestrator.selectOptimalModel('intent_detection', {
        command,
        context: enhancedContext,
        userProfile: this.state.userProfile
      });
      
      logger.info('고급 명령 의도 분석 완료:', intent);
      
      // 사용자 상호작용 기록 (학습용)
      await this.recordUserInteraction(command, intent, enhancedContext);
      
      // 실행 플랜 생성
      const executionPlan = await this.createExecutionPlan(intent, context);
      
      // 플랜 검증
      await this.validatePlan(executionPlan);
      
      // 플랜 실행
      const result = await this.executePlan(executionPlan, operationId);
      
      // 결과 캐싱
      await this.cache.set(`cmd:${command}`, result, 300); // 5분 캐시
      
      // 히스토리 저장
      this.saveToHistory(command, intent, result);
      
      // 대화 메모리에 저장 (개인화)
      await this.memorySystem.storeConversation(
        this.state.currentSession,
        command,
        result,
        {
          intent,
          context: enhancedContext,
          successful: result.success,
          responseTime: Date.now() - performance.now()
        }
      );
      
      // 컨텍스트 학습 업데이트
      await this.contextLearning.recordUserInteraction(this.state.currentSession, {
        command,
        intent: intent.action,
        context: enhancedContext,
        success: result.success,
        executionTime: Date.now() - performance.now(),
        userSatisfaction: context.userSatisfaction
      });
      
      return {
        success: true,
        command,
        intent,
        result,
        operationId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('명령 처리 중 오류:', error);
      return await this.errorRecovery.handleCommandError(error, command, context);
    } finally {
      this.state.isProcessing = false;
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * 실행 플랜 생성
   * @private
   */
  async createExecutionPlan(intent, context) {
    const plan = {
      id: this.generateOperationId(),
      intent,
      context,
      steps: [],
      metadata: {
        createdAt: new Date().toISOString(),
        estimatedTime: 0,
        requiredPermissions: [],
        fallbackStrategies: []
      }
    };

    // 의도에 따른 실행 단계 구성
    switch (intent.action) {
      case 'SEARCH':
        plan.steps = await this.createSearchPlan(intent, context);
        break;
        
      case 'ORGANIZE':
        plan.steps = await this.createOrganizePlan(intent, context);
        break;
        
      case 'ANALYZE':
        plan.steps = await this.createAnalyzePlan(intent, context);
        break;
        
      case 'CLEAN':
        plan.steps = await this.createCleanPlan(intent, context);
        break;
        
      case 'RECOMMEND':
        plan.steps = await this.createRecommendPlan(intent, context);
        break;
        
      default:
        plan.steps = await this.createGenericPlan(intent, context);
    }

    // 예상 실행 시간 계산
    plan.metadata.estimatedTime = this.calculateEstimatedTime(plan.steps);
    
    // 필요 권한 확인
    plan.metadata.requiredPermissions = this.checkRequiredPermissions(plan.steps);
    
    // 대체 전략 준비
    plan.metadata.fallbackStrategies = this.prepareFallbackStrategies(plan);

    return plan;
  }

  /**
   * 검색 플랜 생성
   * @private
   */
  async createSearchPlan(intent, context) {
    const steps = [];
    
    // 1. 검색 범위 결정
    steps.push({
      type: 'DETERMINE_SCOPE',
      action: 'analyzeSearchScope',
      params: {
        query: intent.query,
        filters: intent.filters,
        context: context.currentPath
      }
    });
    
    // 2. 인덱스 검색
    steps.push({
      type: 'INDEX_SEARCH',
      action: 'searchIndex',
      params: {
        query: intent.query,
        filters: intent.filters,
        fuzzy: true,
        limit: 100
      }
    });
    
    // 3. 내용 검색 (필요한 경우)
    if (intent.searchContent) {
      steps.push({
        type: 'CONTENT_SEARCH',
        action: 'searchFileContent',
        params: {
          query: intent.query,
          fileTypes: intent.fileTypes,
          maxSize: 10 * 1024 * 1024 // 10MB
        }
      });
    }
    
    // 4. AI 분석 및 순위 조정
    steps.push({
      type: 'AI_RANKING',
      action: 'rankResults',
      params: {
        criteria: intent.rankingCriteria,
        userPreferences: context.userPreferences
      }
    });
    
    // 5. 결과 포맷팅
    steps.push({
      type: 'FORMAT_RESULTS',
      action: 'formatSearchResults',
      params: {
        groupBy: intent.groupBy,
        sortBy: intent.sortBy,
        limit: intent.limit || 50
      }
    });
    
    return steps;
  }

  /**
   * 정리 플랜 생성
   * @private
   */
  async createOrganizePlan(intent, context) {
    const steps = [];
    
    // 1. 현재 구조 분석
    steps.push({
      type: 'ANALYZE_STRUCTURE',
      action: 'analyzeCurrentStructure',
      params: {
        path: intent.targetPath,
        depth: intent.depth || 3
      }
    });
    
    // 2. AI 분류 규칙 생성
    steps.push({
      type: 'GENERATE_RULES',
      action: 'generateClassificationRules',
      params: {
        categories: intent.categories,
        customRules: intent.customRules,
        aiSuggestions: true
      }
    });
    
    // 3. 시뮬레이션 실행
    steps.push({
      type: 'SIMULATE',
      action: 'simulateOrganization',
      params: {
        dryRun: true,
        showPreview: true
      }
    });
    
    // 4. 사용자 확인
    steps.push({
      type: 'USER_CONFIRM',
      action: 'requestUserConfirmation',
      params: {
        timeout: 60000,
        allowModification: true
      }
    });
    
    // 5. 실제 정리 실행
    steps.push({
      type: 'EXECUTE_ORGANIZATION',
      action: 'executeOrganization',
      params: {
        createBackup: true,
        preserveOriginal: intent.preserveOriginal,
        parallel: true
      }
    });
    
    return steps;
  }

  /**
   * 플랜 실행
   * @private
   */
  async executePlan(plan, operationId) {
    const results = {
      planId: plan.id,
      operationId,
      steps: [],
      summary: null,
      errors: [],
      warnings: []
    };
    
    this.activeOperations.set(operationId, {
      plan,
      status: 'running',
      progress: 0,
      startTime: Date.now()
    });
    
    try {
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const stepResult = await this.executeStep(step, plan.context);
        
        results.steps.push({
          ...step,
          result: stepResult,
          duration: stepResult.duration
        });
        
        // 진행률 업데이트
        const progress = ((i + 1) / plan.steps.length) * 100;
        this.updateOperationProgress(operationId, progress);
        
        // 중간 결과 이벤트 발생
        this.emit('stepComplete', {
          operationId,
          step: i + 1,
          total: plan.steps.length,
          result: stepResult
        });
        
        // 오류 발생 시 처리
        if (stepResult.error && !step.optional) {
          throw new Error(`Step ${step.type} failed: ${stepResult.error}`);
        }
      }
      
      // 결과 요약 생성
      results.summary = await this.generateSummary(results);
      
      return results;
      
    } catch (error) {
      logger.error('플랜 실행 중 오류:', error);
      
      // 롤백 가능한 경우 롤백 시도
      if (plan.metadata.rollbackable) {
        await this.rollbackPlan(plan, results);
      }
      
      throw error;
    }
  }

  /**
   * 개별 단계 실행
   * @private
   */
  async executeStep(step, context) {
    const startTime = Date.now();
    
    try {
      let result;
      
      // 액션에 따른 실행
      switch (step.action) {
        case 'searchIndex':
          result = await this.searchEngine.search(step.params);
          break;
          
        case 'analyzeCurrentStructure':
          result = await this.fileAnalyzer.analyzeStructure(step.params);
          break;
          
        case 'intelligentFileAnalysis':
          result = await this.performIntelligentFileAnalysis(step.params.files, step.params.options);
          break;
          
        case 'generateAIRecommendations':
          result = await this.generateFileRecommendations(step.params.analysisResult);
          break;
          
        case 'predictUserIntent':
          result = await this.contextLearning.predictUserIntent(
            this.state.currentSession,
            step.params.command,
            step.params.context
          );
          break;
          
        case 'generateClassificationRules':
          result = await this.generateAIRules(step.params);
          break;
          
        case 'simulateOrganization':
          result = await this.simulateFileOrganization(step.params);
          break;
          
        case 'executeOrganization':
          result = await this.executeFileOrganization(step.params);
          break;
          
        default:
          result = await this.executeGenericAction(step);
      }
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      logger.error(`Step 실행 실패 (${step.type}):`, error);
      
      // 대체 전략 시도
      if (step.fallback) {
        return await this.executeFallback(step, error);
      }
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 백그라운드 작업 시작
   * @private
   */
  startBackgroundTasks() {
    // 인덱스 업데이트
    setInterval(() => {
      this.fileAnalyzer.updateIndex().catch(error => {
        logger.error('인덱스 업데이트 실패:', error);
      });
    }, 5 * 60 * 1000); // 5분마다
    
    // 지능형 학습 및 컨텍스트 업데이트
    setInterval(() => {
      this.detectAndUpdateContext().catch(error => {
        logger.error('컨텍스트 업데이트 실패:', error);
      });
    }, 10 * 60 * 1000); // 10분마다
    
    // 사용자 프로필 동기화
    setInterval(() => {
      this.syncUserProfile().catch(error => {
        logger.error('사용자 프로필 동기화 실패:', error);
      });
    }, 15 * 60 * 1000); // 15분마다
    
    // 캐시 정리
    setInterval(() => {
      this.cache.cleanup().catch(error => {
        logger.error('캐시 정리 실패:', error);
      });
    }, 60 * 60 * 1000); // 1시간마다
    
    // 통계 수집
    setInterval(() => {
      this.collectStatistics().catch(error => {
        logger.error('통계 수집 실패:', error);
      });
    }, 10 * 60 * 1000); // 10분마다
  }

  /**
   * 유틸리티 메서드들
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 사용자 세션 초기화
   */
  async initializeUserSession() {
    try {
      this.state.currentSession = this.generateSessionId();
      
      // 기존 사용자 프로필 로드 또는 새로 생성
      this.state.userProfile = await this.contextLearning.getUserProfile(this.state.currentSession);
      
      // 현재 컨텍스트 감지
      await this.detectAndUpdateContext();
      
      logger.info('사용자 세션 초기화 완료:', this.state.currentSession);
    } catch (error) {
      logger.error('사용자 세션 초기화 실패:', error);
    }
  }
  
  /**
   * 컨텍스트 풍부화
   */
  async enrichContext(context) {
    const enrichedContext = {
      ...context,
      timestamp: Date.now(),
      sessionId: this.state.currentSession,
      userProfile: this.state.userProfile,
      projectContext: null,
      predictions: null
    };
    
    // 프로젝트 컨텍스트 감지
    if (context.currentPath) {
      const fileList = context.fileList || [];
      enrichedContext.projectContext = await this.contextLearning.detectProjectContext(
        context.currentPath,
        fileList
      );
    }
    
    return enrichedContext;
  }
  
  /**
   * 사용자 상호작용 기록
   */
  async recordUserInteraction(command, intent, context) {
    try {
      // 감정 및 사용자 상태 분석
      const userEmotions = await this.memorySystem.analyzeEmotions(command);
      
      // 컨텍스트 학습 엔진에 기록
      await this.contextLearning.recordUserInteraction(this.state.currentSession, {
        command,
        intent: intent.action,
        context,
        emotions: userEmotions,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('사용자 상호작용 기록 실패:', error);
    }
  }
  
  /**
   * 예측적 추천 생성
   */
  async generatePredictiveRecommendations(command, context) {
    try {
      // 명령어 예측
      const predictions = await this.predictiveUI.predictCommands(command, context);
      
      // 개인화된 추천
      const recommendations = await this.contextLearning.generatePersonalizedRecommendations(
        this.state.currentSession,
        context
      );
      
      return {
        predictions,
        recommendations
      };
    } catch (error) {
      logger.error('예측적 추천 생성 실패:', error);
      return { predictions: [], recommendations: [] };
    }
  }
  
  /**
   * 지능형 파일 분석 수행
   */
  async performIntelligentFileAnalysis(filePaths, options = {}) {
    try {
      // 고급 파일 분석 수행
      const analysisResult = await this.intelligentFileAnalyzer.analyzeFiles(filePaths, options);
      
      // AI 추천 사항 생성
      const recommendations = await this.generateFileRecommendations(analysisResult);
      
      return {
        ...analysisResult,
        aiRecommendations: recommendations
      };
    } catch (error) {
      logger.error('지능형 파일 분석 실패:', error);
      return null;
    }
  }
  
  /**
   * AI 추천 사항 생성
   */
  async generateFileRecommendations(analysisResult) {
    const recommendations = [];
    
    // 중복 파일 처리 추천
    if (analysisResult.duplicates.length > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        action: 'remove_duplicates',
        description: `${analysisResult.duplicates.length}개의 중복 파일을 정리하여 저장 공간을 절약하세요.`,
        estimatedSavings: this.calculateSpaceSavings(analysisResult.duplicates)
      });
    }
    
    // 파일 정리 추천
    if (analysisResult.categories && Object.keys(analysisResult.categories).length > 5) {
      recommendations.push({
        type: 'organization',
        priority: 'medium',
        action: 'auto_organize',
        description: '파일들을 카테고리별로 자동 정리하는 것을 추천합니다.',
        categories: Object.keys(analysisResult.categories)
      });
    }
    
    // 보안 추천
    const securityIssues = this.detectSecurityIssues(analysisResult);
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        action: 'security_review',
        description: '보안 문제가 발견된 파일들을 검토해주세요.',
        issues: securityIssues
      });
    }
    
    return recommendations;
  }
  
  /**
   * 컨텍스트 감지 및 업데이트
   */
  async detectAndUpdateContext() {
    try {
      // 현재 작업 디렉토리 분석
      const currentContext = await this.contextLearning.detectProjectContext(
        process.cwd(),
        [] // 실제 구현에서는 현재 디렉토리의 파일 목록을 전달
      );
      
      this.state.contextHistory.push({
        timestamp: Date.now(),
        context: currentContext
      });
      
      // 컨텍스트 히스토리를 최대 10개로 제한
      if (this.state.contextHistory.length > 10) {
        this.state.contextHistory = this.state.contextHistory.slice(-10);
      }
      
    } catch (error) {
      logger.error('컨텍스트 감지 실패:', error);
    }
  }
  
  /**
   * 세션 ID 생성
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 저장 공간 절약량 계산
   */
  calculateSpaceSavings(duplicates) {
    return duplicates.reduce((total, dup) => total + (dup.size || 0), 0);
  }
  
  /**
   * 보안 이슈 감지
   */
  detectSecurityIssues(analysisResult) {
    const issues = [];
    
    // 예시: 대용량 실행 파일, 의심스러운 확장자 등
    analysisResult.fileAnalysis?.forEach(file => {
      if (file.size > 100 * 1024 * 1024 && file.executable) {
        issues.push({
          file: file.path,
          type: 'large_executable',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }
  
  updateOperationProgress(operationId, progress) {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.progress = progress;
      this.emit('progressUpdate', { operationId, progress });
    }
  }
  
  saveToHistory(command, intent, result) {
    this.state.history.push({
      command,
      intent,
      result,
      timestamp: new Date().toISOString()
    });
    
    // 최대 100개 유지
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(-100);
    }
  }
  
  /**
   * 사용자 프로필 동기화
   */
  async syncUserProfile() {
    try {
      if (this.state.currentSession) {
        this.state.userProfile = await this.contextLearning.getUserProfile(this.state.currentSession);
      }
    } catch (error) {
      logger.error('사용자 프로필 동기화 실패:', error);
    }
  }
  
  /**
   * 실시간 명령어 예측 API
   */
  async getPredictiveCompletions(partialCommand, context = {}) {
    try {
      const enrichedContext = await this.enrichContext(context);
      return await this.predictiveUI.predictCommands(partialCommand, enrichedContext);
    } catch (error) {
      logger.error('명령어 예측 실패:', error);
      return { completions: [], suggestions: [], workflows: [] };
    }
  }
  
  /**
   * 사용자 의도 예측 API
   */
  async predictUserIntent(partialCommand, context = {}) {
    try {
      const enrichedContext = await this.enrichContext(context);
      return await this.contextLearning.predictUserIntent(
        this.state.currentSession,
        partialCommand,
        enrichedContext
      );
    } catch (error) {
      logger.error('사용자 의도 예측 실패:', error);
      return { likelyIntents: [], completionSuggestions: [], contextualActions: [], confidence: 0 };
    }
  }
  
  /**
   * AI 모델 상태 정보 얻기
   */
  getAIModelStatus() {
    return {
      advancedNLP: this.advancedNLP?.isInitialized || false,
      intelligentFileAnalyzer: this.intelligentFileAnalyzer?.isInitialized || false,
      contextLearning: this.contextLearning?.isInitialized || false,
      aiOrchestrator: this.aiOrchestrator?.isInitialized || false,
      predictiveUI: this.predictiveUI?.isInitialized || false,
      memorySystem: this.memorySystem?.isInitialized || false,
      currentSession: this.state.currentSession,
      intelligenceLevel: this.state.intelligenceLevel
    };
  }
  
  /**
   * 세션 통계 정보 얻기
   */
  getSessionStatistics() {
    return {
      sessionId: this.state.currentSession,
      commandsProcessed: this.state.history.length,
      activeOperations: this.state.activeOperations.size,
      contextHistory: this.state.contextHistory.length,
      userProfile: {
        totalInteractions: this.state.userProfile?.learning?.totalInteractions || 0,
        preferredLanguage: this.state.userProfile?.preferences?.language || 'ko',
        learningRate: this.state.userProfile?.learning?.learningRate || 0.1
      }
    };
  }
}

/**
 * Semaphore 클래스 (병렬 작업 제어용)
 */
class Semaphore {
  constructor(count) {
    this.count = count;
    this.waiting = [];
  }
  
  async acquire() {
    return new Promise((resolve) => {
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }
  
  release() {
    this.count++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      this.count--;
      resolve();
    }
  }
}

/**
 * Trie 노드 클래스 (자동완성용)
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.metadata = {};
  }
  
  insert(word, frequency = 1, metadata = {}) {
    let current = this;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }
    current.isEndOfWord = true;
    current.frequency = frequency;
    current.metadata = metadata;
  }
  
  search(prefix) {
    let current = this;
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char);
    }
    
    const results = [];
    this._collectWords(current, prefix, results);
    return results.sort((a, b) => b.frequency - a.frequency);
  }
  
  _collectWords(node, prefix, results) {
    if (node.isEndOfWord) {
      results.push({
        word: prefix,
        frequency: node.frequency,
        metadata: node.metadata
      });
    }
    
    for (const [char, childNode] of node.children) {
      this._collectWords(childNode, prefix + char, results);
    }
  }
}

export default AICopilotCore;