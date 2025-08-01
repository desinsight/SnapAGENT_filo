import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';

/**
 * 다중 AI 모델 통합 및 전략적 선택 시스템
 * 작업 유형별 최적 모델 선택, 앙상블 추론, 성능 모니터링
 */
export class MultiModelAIOrchestrator {
  constructor() {
    this.cache = new LocalCache('ai-orchestrator');
    this.modelRegistry = new Map();
    this.performanceMetrics = new Map();
    this.modelSelectionStrategies = new Map();
    this.ensembleConfigs = new Map();
    
    // 오케스트레이터 설정
    this.config = {
      defaultTimeout: 30000,
      maxConcurrentRequests: 3,
      performanceWindowSize: 100,
      ensembleThreshold: 0.7,
      fallbackEnabled: true,
      adaptiveLearningRate: 0.1
    };
    
    // 작업 유형별 모델 전략
    this.taskStrategies = {
      'text_analysis': {
        primary: ['openai-gpt4', 'anthropic-claude'],
        fallback: ['local-nlp'],
        ensemble: true,
        weightByAccuracy: true
      },
      'code_analysis': {
        primary: ['openai-gpt4', 'anthropic-claude'],
        fallback: ['local-code-analyzer'],
        ensemble: false,
        preferAccuracy: true
      },
      'file_classification': {
        primary: ['local-classifier', 'openai-gpt3.5'],
        fallback: ['rule-based'],
        ensemble: true,
        preferSpeed: true
      },
      'translation': {
        primary: ['openai-gpt4', 'google-translate'],
        fallback: ['local-translator'],
        ensemble: true,
        weightByLanguage: true
      },
      'summarization': {
        primary: ['anthropic-claude', 'openai-gpt4'],
        fallback: ['local-summarizer'],
        ensemble: false,
        preferQuality: true
      },
      'intent_detection': {
        primary: ['local-nlp', 'openai-gpt3.5'],
        fallback: ['rule-based'],
        ensemble: true,
        preferSpeed: true
      }
    };
    
    this.initializeOrchestrator();
  }

  async initializeOrchestrator() {
    try {
      logger.info('다중 AI 모델 오케스트레이터 초기화 중...');
      
      // 등록된 모델들 로드
      await this.loadModelRegistry();
      
      // 성능 메트릭 로드
      await this.loadPerformanceMetrics();
      
      // 선택 전략 초기화
      this.initializeSelectionStrategies();
      
      // 앙상블 설정 로드
      await this.loadEnsembleConfigs();
      
      // 모델 상태 모니터링 시작
      this.startModelMonitoring();
      
      logger.info('AI 모델 오케스트레이터 초기화 완료');
    } catch (error) {
      logger.error('오케스트레이터 초기화 실패:', error);
    }
  }

  /**
   * AI 모델 등록
   */
  registerModel(modelConfig) {
    const {
      id,
      name,
      type,
      provider,
      capabilities,
      performance,
      cost,
      limitations,
      endpoint
    } = modelConfig;

    const model = {
      id,
      name,
      type, // 'cloud', 'local', 'hybrid'
      provider, // 'openai', 'anthropic', 'local', etc.
      capabilities, // ['text', 'code', 'translation', etc.]
      performance: {
        speed: performance.speed || 5, // 1-10 scale
        accuracy: performance.accuracy || 5,
        reliability: performance.reliability || 5,
        cost: cost || 5 // 1=expensive, 10=cheap
      },
      limitations: {
        maxTokens: limitations.maxTokens || 4000,
        rateLimit: limitations.rateLimit || 60,
        languages: limitations.languages || ['en', 'ko']
      },
      endpoint,
      status: 'active',
      lastChecked: Date.now(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        averageLatency: 0,
        errorRate: 0
      }
    };

    this.modelRegistry.set(id, model);
    this.initializeModelMetrics(id);
    
    logger.info(`AI 모델 등록 완료: ${name} (${id})`);
    return true;
  }

  /**
   * 최적 모델 선택
   */
  async selectOptimalModel(taskType, context = {}) {
    try {
      const strategy = this.taskStrategies[taskType];
      if (!strategy) {
        throw new Error(`지원하지 않는 작업 유형: ${taskType}`);
      }

      // 컨텍스트 기반 필터링
      const availableModels = this.filterModelsByContext(strategy.primary, context);
      
      if (availableModels.length === 0) {
        return this.selectFallbackModel(strategy, context);
      }

      // 선택 전략 적용
      const selectedModel = await this.applySelectionStrategy(
        availableModels, 
        strategy, 
        context
      );

      if (!selectedModel) {
        return this.selectFallbackModel(strategy, context);
      }

      return selectedModel;

    } catch (error) {
      logger.error('모델 선택 실패:', error);
      return this.getDefaultModel();
    }
  }

  /**
   * 앙상블 추론 실행
   */
  async executeEnsemble(taskType, input, context = {}) {
    try {
      const strategy = this.taskStrategies[taskType];
      
      if (!strategy.ensemble) {
        // 앙상블이 비활성화된 경우 단일 모델 사용
        const model = await this.selectOptimalModel(taskType, context);
        return await this.executeSingleModel(model, input, context);
      }

      // 앙상블 실행
      const models = await this.selectEnsembleModels(taskType, context);
      const results = await this.executeMultipleModels(models, input, context);
      
      // 결과 통합
      const ensembledResult = await this.combineEnsembleResults(
        results, 
        strategy, 
        context
      );

      // 성능 메트릭 업데이트
      this.updateEnsembleMetrics(taskType, models, results);

      return ensembledResult;

    } catch (error) {
      logger.error('앙상블 실행 실패:', error);
      
      // 폴백 실행
      const fallbackModel = await this.selectOptimalModel(taskType, context);
      return await this.executeSingleModel(fallbackModel, input, context);
    }
  }

  /**
   * 적응형 모델 선택 (학습 기반)
   */
  async adaptiveModelSelection(taskType, input, context = {}) {
    try {
      // 과거 성능 데이터 분석
      const performanceHistory = await this.analyzePerformanceHistory(taskType, context);
      
      // 현재 시스템 상태 고려
      const systemLoad = await this.assessSystemLoad();
      
      // 컨텍스트 복잡도 분석
      const complexityScore = this.analyzeInputComplexity(input, taskType);
      
      // 적응형 점수 계산
      const adaptiveScores = await this.calculateAdaptiveScores(
        taskType,
        performanceHistory,
        systemLoad,
        complexityScore,
        context
      );

      // 최고 점수 모델 선택
      const selectedModel = this.selectByAdaptiveScore(adaptiveScores);
      
      return selectedModel;

    } catch (error) {
      logger.error('적응형 모델 선택 실패:', error);
      return await this.selectOptimalModel(taskType, context);
    }
  }

  /**
   * 실시간 성능 모니터링 및 조정
   */
  async monitorAndAdjustModels() {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      
      // 성능 저하 모델 감지
      const underperformingModels = this.detectUnderperformingModels(currentMetrics);
      
      // 동적 가중치 조정
      await this.adjustModelWeights(currentMetrics);
      
      // 전략 최적화
      await this.optimizeSelectionStrategies();
      
      // 알러트 발생
      if (underperformingModels.length > 0) {
        this.alertUnderperformance(underperformingModels);
      }

    } catch (error) {
      logger.error('모델 모니터링 실패:', error);
    }
  }

  /**
   * 컨텍스트 기반 모델 필터링
   */
  filterModelsByContext(modelIds, context) {
    const filtered = [];

    modelIds.forEach(modelId => {
      const model = this.modelRegistry.get(modelId);
      if (!model || model.status !== 'active') return;

      // 언어 지원 확인
      if (context.language && !model.limitations.languages.includes(context.language)) {
        return;
      }

      // 토큰 제한 확인
      if (context.inputLength && context.inputLength > model.limitations.maxTokens) {
        return;
      }

      // 비용 제한 확인
      if (context.maxCost && model.performance.cost < context.maxCost) {
        return;
      }

      // 속도 요구사항 확인
      if (context.prioritySpeed && model.performance.speed < 7) {
        return;
      }

      // 정확도 요구사항 확인
      if (context.priorityAccuracy && model.performance.accuracy < 8) {
        return;
      }

      filtered.push(model);
    });

    return filtered;
  }

  /**
   * 선택 전략 적용
   */
  async applySelectionStrategy(models, strategy, context) {
    const scoredModels = [];

    for (const model of models) {
      const score = await this.calculateModelScore(model, strategy, context);
      scoredModels.push({ model, score });
    }

    // 점수 순으로 정렬
    scoredModels.sort((a, b) => b.score - a.score);

    // 상위 모델 선택
    return scoredModels[0]?.model || null;
  }

  /**
   * 모델 점수 계산
   */
  async calculateModelScore(model, strategy, context) {
    let score = 0;
    const metrics = this.performanceMetrics.get(model.id) || {};

    // 기본 성능 점수
    score += model.performance.accuracy * 0.3;
    score += model.performance.speed * 0.2;
    score += model.performance.reliability * 0.2;
    score += model.performance.cost * 0.1;

    // 과거 성능 반영
    if (metrics.recentAccuracy) {
      score += metrics.recentAccuracy * 0.1;
    }

    if (metrics.recentLatency) {
      const speedScore = Math.max(0, 10 - (metrics.recentLatency / 1000));
      score += speedScore * 0.1;
    }

    // 전략별 가중치 적용
    if (strategy.preferAccuracy) {
      score += model.performance.accuracy * 0.2;
    }

    if (strategy.preferSpeed) {
      score += model.performance.speed * 0.2;
    }

    if (strategy.preferQuality) {
      score += (model.performance.accuracy + model.performance.reliability) * 0.1;
    }

    // 컨텍스트별 보너스
    if (context.criticalTask && model.performance.reliability >= 9) {
      score += 1.0;
    }

    if (context.batchProcess && model.performance.speed >= 8) {
      score += 0.5;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * 앙상블 모델 선택
   */
  async selectEnsembleModels(taskType, context) {
    const strategy = this.taskStrategies[taskType];
    const availableModels = this.filterModelsByContext(strategy.primary, context);
    
    // 다양성을 위해 서로 다른 제공업체의 모델 선택
    const ensembleModels = [];
    const usedProviders = new Set();

    // 성능 순으로 정렬
    const sortedModels = availableModels.sort((a, b) => {
      const scoreA = this.getModelPerformanceScore(a);
      const scoreB = this.getModelPerformanceScore(b);
      return scoreB - scoreA;
    });

    // 최대 3개 모델, 서로 다른 제공업체
    for (const model of sortedModels) {
      if (ensembleModels.length >= 3) break;
      
      if (!usedProviders.has(model.provider)) {
        ensembleModels.push(model);
        usedProviders.add(model.provider);
      }
    }

    // 최소 2개 모델 필요
    if (ensembleModels.length < 2) {
      ensembleModels.push(...sortedModels.slice(0, 2));
    }

    return ensembleModels;
  }

  /**
   * 다중 모델 병렬 실행
   */
  async executeMultipleModels(models, input, context) {
    const results = [];
    const promises = models.map(async (model) => {
      try {
        const startTime = Date.now();
        const result = await this.executeSingleModel(model, input, context);
        const latency = Date.now() - startTime;
        
        return {
          modelId: model.id,
          result,
          latency,
          success: true
        };
      } catch (error) {
        logger.warn(`모델 ${model.id} 실행 실패:`, error.message);
        return {
          modelId: model.id,
          result: null,
          latency: this.config.defaultTimeout,
          success: false,
          error: error.message
        };
      }
    });

    const settledResults = await Promise.allSettled(promises);
    
    settledResults.forEach(settled => {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      }
    });

    return results;
  }

  /**
   * 단일 모델 실행
   */
  async executeSingleModel(model, input, context) {
    if (!model) {
      throw new Error('모델이 선택되지 않았습니다');
    }

    const startTime = Date.now();
    
    try {
      // 모델별 실행 로직
      let result;
      
      switch (model.provider) {
        case 'openai':
          result = await this.executeOpenAIModel(model, input, context);
          break;
        case 'anthropic':
          result = await this.executeAnthropicModel(model, input, context);
          break;
        case 'local':
          result = await this.executeLocalModel(model, input, context);
          break;
        default:
          throw new Error(`지원하지 않는 모델 제공업체: ${model.provider}`);
      }

      // 성능 메트릭 업데이트
      const latency = Date.now() - startTime;
      this.updateModelMetrics(model.id, true, latency);

      return result;

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateModelMetrics(model.id, false, latency);
      throw error;
    }
  }

  /**
   * 앙상블 결과 통합
   */
  async combineEnsembleResults(results, strategy, context) {
    const successfulResults = results.filter(r => r.success && r.result);
    
    if (successfulResults.length === 0) {
      throw new Error('모든 앙상블 모델이 실패했습니다');
    }

    if (successfulResults.length === 1) {
      return successfulResults[0].result;
    }

    // 통합 전략에 따라 결과 결합
    const combinedResult = await this.applyCombinationStrategy(
      successfulResults,
      strategy,
      context
    );

    return combinedResult;
  }

  /**
   * 결과 결합 전략 적용
   */
  async applyCombinationStrategy(results, strategy, context) {
    // 가중 투표 방식
    if (strategy.weightByAccuracy) {
      return this.weightedVoting(results);
    }

    // 신뢰도 기반 선택
    if (strategy.preferQuality) {
      return this.selectByConfidence(results);
    }

    // 합의 기반 결합
    if (strategy.ensemble && results.length >= 2) {
      return this.consensusBasedCombination(results);
    }

    // 기본: 가장 빠른 결과 선택
    return this.selectFastestResult(results);
  }

  /**
   * 가중 투표
   */
  weightedVoting(results) {
    const weights = results.map(r => {
      const model = this.modelRegistry.get(r.modelId);
      return model.performance.accuracy / 10;
    });

    // 결과가 텍스트인 경우 가장 높은 가중치의 결과 선택
    let maxWeight = 0;
    let bestResult = null;

    results.forEach((result, index) => {
      if (weights[index] > maxWeight) {
        maxWeight = weights[index];
        bestResult = result.result;
      }
    });

    return bestResult;
  }

  /**
   * 신뢰도 기반 선택
   */
  selectByConfidence(results) {
    // 결과에 신뢰도 점수가 있는 경우 최고 신뢰도 선택
    let maxConfidence = 0;
    let bestResult = null;

    results.forEach(r => {
      const confidence = r.result.confidence || 0.5;
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestResult = r.result;
      }
    });

    return bestResult || results[0].result;
  }

  /**
   * 합의 기반 결합
   */
  consensusBasedCombination(results) {
    // 유사한 결과들을 그룹화하고 가장 많은 합의를 얻은 결과 선택
    const resultGroups = new Map();

    results.forEach(r => {
      const resultKey = this.generateResultKey(r.result);
      if (!resultGroups.has(resultKey)) {
        resultGroups.set(resultKey, []);
      }
      resultGroups.get(resultKey).push(r);
    });

    // 가장 많은 투표를 받은 그룹 선택
    let maxVotes = 0;
    let consensusResult = null;

    for (const [key, group] of resultGroups.entries()) {
      if (group.length > maxVotes) {
        maxVotes = group.length;
        consensusResult = group[0].result;
      }
    }

    return consensusResult || results[0].result;
  }

  /**
   * 가장 빠른 결과 선택
   */
  selectFastestResult(results) {
    let minLatency = Infinity;
    let fastestResult = null;

    results.forEach(r => {
      if (r.latency < minLatency) {
        minLatency = r.latency;
        fastestResult = r.result;
      }
    });

    return fastestResult || results[0].result;
  }

  /**
   * 성능 히스토리 분석
   */
  async analyzePerformanceHistory(taskType, context) {
    const history = {};
    
    for (const [modelId, model] of this.modelRegistry.entries()) {
      const metrics = this.performanceMetrics.get(modelId);
      if (metrics) {
        history[modelId] = {
          averageAccuracy: metrics.recentAccuracy || model.performance.accuracy,
          averageLatency: metrics.recentLatency || 1000,
          successRate: metrics.successRate || 0.9,
          taskSpecificPerformance: metrics.taskPerformance?.[taskType] || {}
        };
      }
    }

    return history;
  }

  /**
   * 시스템 부하 평가
   */
  async assessSystemLoad() {
    // 간단한 시스템 부하 측정
    const activeRequests = this.getActiveRequestCount();
    const memoryUsage = process.memoryUsage();
    
    return {
      cpuLoad: 0.5, // 실제 구현에서는 os.loadavg() 사용
      memoryLoad: memoryUsage.heapUsed / memoryUsage.heapTotal,
      activeRequests,
      networkLatency: await this.measureNetworkLatency()
    };
  }

  /**
   * 입력 복잡도 분석
   */
  analyzeInputComplexity(input, taskType) {
    let complexity = 0;

    // 텍스트 길이 기반 복잡도
    if (typeof input === 'string') {
      const length = input.length;
      complexity += Math.min(length / 1000, 5); // 최대 5점
      
      // 문장 구조 복잡도
      const sentences = input.split(/[.!?]+/).length;
      const avgSentenceLength = length / sentences;
      complexity += Math.min(avgSentenceLength / 50, 3); // 최대 3점
    }

    // 작업 유형별 추가 복잡도
    switch (taskType) {
      case 'code_analysis':
        complexity += this.analyzeCodeComplexity(input);
        break;
      case 'text_analysis':
        complexity += this.analyzeTextComplexity(input);
        break;
    }

    return Math.min(complexity, 10);
  }

  /**
   * 적응형 점수 계산
   */
  async calculateAdaptiveScores(taskType, performanceHistory, systemLoad, complexityScore, context) {
    const scores = {};

    for (const [modelId, model] of this.modelRegistry.entries()) {
      let score = model.performance.accuracy; // 기본 점수
      
      // 성능 히스토리 반영
      const history = performanceHistory[modelId];
      if (history) {
        score = score * 0.7 + history.averageAccuracy * 0.3;
        
        // 지연시간 페널티
        const latencyPenalty = Math.max(0, (history.averageLatency - 1000) / 10000);
        score -= latencyPenalty;
        
        // 성공률 보너스
        score += history.successRate * 2;
      }

      // 시스템 부하 고려
      if (model.type === 'cloud' && systemLoad.networkLatency > 1000) {
        score -= 1; // 네트워크 지연 시 클라우드 모델 페널티
      }
      
      if (model.type === 'local' && systemLoad.cpuLoad > 0.8) {
        score -= 1; // CPU 부하 시 로컬 모델 페널티
      }

      // 복잡도 적응
      if (complexityScore > 7 && model.limitations.maxTokens < 8000) {
        score -= 2; // 복잡한 작업에 제한적인 모델 페널티
      }

      scores[modelId] = Math.max(0, score);
    }

    return scores;
  }

  /**
   * 적응형 점수로 모델 선택
   */
  selectByAdaptiveScore(adaptiveScores) {
    let maxScore = 0;
    let selectedModelId = null;

    for (const [modelId, score] of Object.entries(adaptiveScores)) {
      if (score > maxScore) {
        maxScore = score;
        selectedModelId = modelId;
      }
    }

    return selectedModelId ? this.modelRegistry.get(selectedModelId) : null;
  }

  /**
   * 성능 메트릭 업데이트
   */
  updateModelMetrics(modelId, success, latency) {
    let metrics = this.performanceMetrics.get(modelId);
    
    if (!metrics) {
      metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        totalLatency: 0,
        recentLatencies: [],
        recentSuccesses: [],
        lastUpdated: Date.now()
      };
    }

    metrics.totalRequests++;
    metrics.totalLatency += latency;
    
    if (success) {
      metrics.successfulRequests++;
    }

    // 최근 성능 추적 (슬라이딩 윈도우)
    metrics.recentLatencies.push(latency);
    metrics.recentSuccesses.push(success);

    if (metrics.recentLatencies.length > this.config.performanceWindowSize) {
      metrics.recentLatencies.shift();
      metrics.recentSuccesses.shift();
    }

    // 평균 계산
    metrics.averageLatency = metrics.totalLatency / metrics.totalRequests;
    metrics.recentLatency = metrics.recentLatencies.reduce((a, b) => a + b, 0) / metrics.recentLatencies.length;
    metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
    metrics.recentSuccessRate = metrics.recentSuccesses.filter(Boolean).length / metrics.recentSuccesses.length;

    metrics.lastUpdated = Date.now();
    this.performanceMetrics.set(modelId, metrics);
  }

  /**
   * 유틸리티 메서드들
   */
  selectFallbackModel(strategy, context) {
    if (!strategy.fallback || strategy.fallback.length === 0) {
      return this.getDefaultModel();
    }

    const fallbackModels = this.filterModelsByContext(strategy.fallback, context);
    return fallbackModels[0] || this.getDefaultModel();
  }

  getDefaultModel() {
    // 가장 신뢰할 수 있는 로컬 모델 반환
    for (const [id, model] of this.modelRegistry.entries()) {
      if (model.type === 'local' && model.status === 'active') {
        return model;
      }
    }
    
    // 로컬 모델이 없으면 첫 번째 활성 모델
    for (const [id, model] of this.modelRegistry.entries()) {
      if (model.status === 'active') {
        return model;
      }
    }

    return null;
  }

  getModelPerformanceScore(model) {
    const metrics = this.performanceMetrics.get(model.id);
    if (!metrics) return model.performance.accuracy;
    
    return (metrics.recentSuccessRate || 0.9) * 10 + 
           (10 - Math.min(metrics.recentLatency / 1000, 10));
  }

  generateResultKey(result) {
    if (typeof result === 'string') {
      return result.substring(0, 100);
    }
    
    if (typeof result === 'object') {
      return JSON.stringify(result).substring(0, 100);
    }
    
    return String(result);
  }

  analyzeCodeComplexity(input) {
    if (typeof input !== 'string') return 0;
    
    const lines = input.split('\n').length;
    const functions = (input.match(/function|def |class /g) || []).length;
    const conditionals = (input.match(/if |for |while |switch /g) || []).length;
    
    return Math.min((lines / 100) + (functions / 10) + (conditionals / 20), 5);
  }

  analyzeTextComplexity(input) {
    if (typeof input !== 'string') return 0;
    
    const words = input.split(/\s+/).length;
    const sentences = input.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    return Math.min((words / 500) + (avgWordsPerSentence / 20), 5);
  }

  getActiveRequestCount() {
    // 실제 구현에서는 활성 요청 수 추적
    return 0;
  }

  async measureNetworkLatency() {
    // 간단한 네트워크 지연 측정
    const start = Date.now();
    try {
      // 실제 구현에서는 핑 테스트
      await new Promise(resolve => setTimeout(resolve, 10));
      return Date.now() - start;
    } catch {
      return 5000; // 실패 시 높은 지연시간 반환
    }
  }

  initializeModelMetrics(modelId) {
    this.performanceMetrics.set(modelId, {
      totalRequests: 0,
      successfulRequests: 0,
      totalLatency: 0,
      recentLatencies: [],
      recentSuccesses: [],
      averageLatency: 0,
      recentLatency: 0,
      successRate: 1.0,
      recentSuccessRate: 1.0,
      lastUpdated: Date.now()
    });
  }

  initializeSelectionStrategies() {
    // 선택 전략 초기화
    this.modelSelectionStrategies.set('performance', {
      weight: { accuracy: 0.4, speed: 0.3, reliability: 0.2, cost: 0.1 }
    });
    
    this.modelSelectionStrategies.set('speed', {
      weight: { speed: 0.5, accuracy: 0.2, reliability: 0.2, cost: 0.1 }
    });
    
    this.modelSelectionStrategies.set('accuracy', {
      weight: { accuracy: 0.6, reliability: 0.3, speed: 0.05, cost: 0.05 }
    });
  }

  async loadModelRegistry() {
    try {
      const registry = await this.cache.get('model-registry') || {};
      Object.entries(registry).forEach(([id, model]) => {
        this.modelRegistry.set(id, model);
      });
    } catch (error) {
      logger.warn('모델 레지스트리 로드 실패:', error);
    }
  }

  async loadPerformanceMetrics() {
    try {
      const metrics = await this.cache.get('performance-metrics') || {};
      Object.entries(metrics).forEach(([id, metric]) => {
        this.performanceMetrics.set(id, metric);
      });
    } catch (error) {
      logger.warn('성능 메트릭 로드 실패:', error);
    }
  }

  async loadEnsembleConfigs() {
    try {
      const configs = await this.cache.get('ensemble-configs') || {};
      Object.entries(configs).forEach(([task, config]) => {
        this.ensembleConfigs.set(task, config);
      });
    } catch (error) {
      logger.warn('앙상블 설정 로드 실패:', error);
    }
  }

  startModelMonitoring() {
    // 정기적 모델 상태 모니터링
    setInterval(() => {
      this.monitorAndAdjustModels().catch(error => {
        logger.error('모델 모니터링 실패:', error);
      });
    }, 60000); // 1분마다
  }

  async collectCurrentMetrics() {
    const metrics = {};
    
    for (const [modelId, model] of this.modelRegistry.entries()) {
      const performanceData = this.performanceMetrics.get(modelId);
      metrics[modelId] = {
        ...performanceData,
        model: model
      };
    }

    return metrics;
  }

  detectUnderperformingModels(metrics) {
    const underperforming = [];
    
    for (const [modelId, data] of Object.entries(metrics)) {
      if (data.recentSuccessRate < 0.7 || data.recentLatency > 10000) {
        underperforming.push({
          modelId,
          issues: {
            lowSuccessRate: data.recentSuccessRate < 0.7,
            highLatency: data.recentLatency > 10000
          }
        });
      }
    }

    return underperforming;
  }

  async adjustModelWeights(metrics) {
    // 성능에 따른 동적 가중치 조정
    for (const [modelId, data] of Object.entries(metrics)) {
      const model = this.modelRegistry.get(modelId);
      if (model) {
        // 최근 성능을 반영하여 모델 점수 조정
        const adjustmentFactor = this.config.adaptiveLearningRate;
        
        if (data.recentSuccessRate > 0.9) {
          model.performance.reliability += adjustmentFactor;
        } else if (data.recentSuccessRate < 0.7) {
          model.performance.reliability -= adjustmentFactor;
        }

        // 점수 정규화
        model.performance.reliability = Math.max(1, Math.min(10, model.performance.reliability));
        
        this.modelRegistry.set(modelId, model);
      }
    }
  }

  async optimizeSelectionStrategies() {
    // 전략 최적화 로직
    for (const [taskType, strategy] of Object.entries(this.taskStrategies)) {
      const performanceData = await this.analyzeTaskPerformance(taskType);
      
      // 성능이 좋은 모델을 primary로 승격
      if (performanceData.bestModel && !strategy.primary.includes(performanceData.bestModel)) {
        strategy.primary.unshift(performanceData.bestModel);
        strategy.primary = strategy.primary.slice(0, 3); // 최대 3개 유지
      }
    }
  }

  async analyzeTaskPerformance(taskType) {
    // 작업별 성능 분석
    const taskMetrics = {};
    
    for (const [modelId, metrics] of this.performanceMetrics.entries()) {
      if (metrics.taskPerformance && metrics.taskPerformance[taskType]) {
        taskMetrics[modelId] = metrics.taskPerformance[taskType];
      }
    }

    // 최고 성능 모델 찾기
    let bestModel = null;
    let bestScore = 0;

    for (const [modelId, performance] of Object.entries(taskMetrics)) {
      const score = performance.accuracy * performance.successRate;
      if (score > bestScore) {
        bestScore = score;
        bestModel = modelId;
      }
    }

    return { bestModel, taskMetrics };
  }

  alertUnderperformance(underperformingModels) {
    logger.warn('성능 저하 모델 감지:', underperformingModels.map(m => ({
      model: m.modelId,
      issues: m.issues
    })));
    
    // 실제 구현에서는 알림 시스템 연동
  }

  async executeOpenAIModel(model, input, context) {
    // OpenAI 모델 실행 (실제 구현에서는 OpenAI SDK 사용)
    return { result: 'OpenAI 모델 결과', confidence: 0.9 };
  }

  async executeAnthropicModel(model, input, context) {
    // Anthropic 모델 실행 (실제 구현에서는 Anthropic SDK 사용)
    return { result: 'Anthropic 모델 결과', confidence: 0.85 };
  }

  async executeLocalModel(model, input, context) {
    // 로컬 모델 실행
    return { result: '로컬 모델 결과', confidence: 0.8 };
  }

  updateEnsembleMetrics(taskType, models, results) {
    // 앙상블 성능 메트릭 업데이트
    models.forEach((model, index) => {
      const result = results[index];
      if (result && result.success) {
        let metrics = this.performanceMetrics.get(model.id);
        if (!metrics.taskPerformance) {
          metrics.taskPerformance = {};
        }
        if (!metrics.taskPerformance[taskType]) {
          metrics.taskPerformance[taskType] = {
            requests: 0,
            successes: 0,
            totalLatency: 0,
            accuracy: 0.5
          };
        }

        const taskMetric = metrics.taskPerformance[taskType];
        taskMetric.requests++;
        if (result.success) {
          taskMetric.successes++;
        }
        taskMetric.totalLatency += result.latency;
        taskMetric.accuracy = taskMetric.successes / taskMetric.requests;

        this.performanceMetrics.set(model.id, metrics);
      }
    });
  }
}

export default MultiModelAIOrchestrator;