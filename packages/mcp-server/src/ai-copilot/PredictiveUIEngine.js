import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';

/**
 * 예측적 사용자 인터페이스 및 자동완성 엔진
 * 실시간 명령어 예측, 워크플로우 예측, 스마트 자동완성
 */
export class PredictiveUIEngine {
  constructor() {
    this.cache = new LocalCache('predictive-ui');
    this.commandHistory = new Map();
    this.userPatterns = new Map();
    this.predictionModels = new Map();
    this.autocompleteTrie = new TrieNode();
    this.workflowPredictions = new Map();
    
    // 예측 엔진 설정
    this.config = {
      maxPredictions: 5,
      minConfidenceThreshold: 0.3,
      patternLearningWindow: 100,
      realtimeDebounceMs: 200,
      workflowPredictionDepth: 3,
      adaptiveLearningRate: 0.1,
      contextWindowSize: 10
    };
    
    // 예측 가중치
    this.predictionWeights = {
      frequencyScore: 0.3,
      recentUsage: 0.25,
      contextMatch: 0.25,
      patternMatch: 0.2
    };
    
    // 명령어 카테고리별 템플릿
    this.commandTemplates = {
      search: [
        '${keyword} 파일 찾아줘',
        '${extension} 파일 검색해줘',
        '${size} 이상인 파일 찾아줘',
        '최근 ${period} 동안 수정된 파일 보여줘'
      ],
      organize: [
        '${type} 파일들 정리해줘',
        '${location}에 있는 파일들 분류해줘',
        '중복 파일 찾아서 정리해줘',
        '프로젝트별로 파일 정리해줘'
      ],
      analyze: [
        '${directory} 분석해줘',
        '용량 사용량 분석해줘',
        '파일 패턴 분석해줘',
        '보안 검사해줘'
      ],
      clean: [
        '임시 파일 삭제해줘',
        '${size} 이하 파일 정리해줘',
        '빈 폴더 삭제해줘',
        '중복 파일 제거해줘'
      ]
    };
    
    this.initializePredictiveEngine();
  }

  async initializePredictiveEngine() {
    try {
      logger.info('예측적 UI 엔진 초기화 중...');
      
      // 명령어 히스토리 로드
      await this.loadCommandHistory();
      
      // 사용자 패턴 로드
      await this.loadUserPatterns();
      
      // 자동완성 트라이 구축
      await this.buildAutocompleteTrie();
      
      // 예측 모델 초기화
      this.initializePredictionModels();
      
      // 실시간 학습 시작
      this.startRealtimeLearning();
      
      logger.info('예측적 UI 엔진 초기화 완료');
    } catch (error) {
      logger.error('예측적 UI 엔진 초기화 실패:', error);
    }
  }

  /**
   * 실시간 명령어 예측
   */
  async predictCommands(partialInput, context = {}) {
    try {
      const predictions = {
        completions: [],
        suggestions: [],
        workflows: [],
        confidence: 0,
        meta: {
          inputLength: partialInput.length,
          processingTime: 0,
          strategies: []
        }
      };

      const startTime = Date.now();

      // 1. 자동완성 예측
      predictions.completions = await this.generateCompletions(partialInput, context);
      
      // 2. 컨텍스트 기반 제안
      predictions.suggestions = await this.generateContextualSuggestions(partialInput, context);
      
      // 3. 워크플로우 예측
      predictions.workflows = await this.predictWorkflows(partialInput, context);
      
      // 4. 전체 신뢰도 계산
      predictions.confidence = this.calculateOverallConfidence(predictions);
      
      // 5. 메타데이터 설정
      predictions.meta.processingTime = Date.now() - startTime;
      predictions.meta.strategies = this.getUsedStrategies(predictions);

      return predictions;

    } catch (error) {
      logger.error('명령어 예측 실패:', error);
      return this.getEmptyPredictions();
    }
  }

  /**
   * 자동완성 생성
   */
  async generateCompletions(partialInput, context) {
    const completions = [];

    // 1. 트라이 기반 자동완성
    const trieCompletions = this.searchTrie(partialInput);
    completions.push(...trieCompletions);

    // 2. 히스토리 기반 완성
    const historyCompletions = this.searchHistory(partialInput, context);
    completions.push(...historyCompletions);

    // 3. 템플릿 기반 완성
    const templateCompletions = this.generateTemplateCompletions(partialInput, context);
    completions.push(...templateCompletions);

    // 4. 패턴 기반 완성
    const patternCompletions = this.generatePatternCompletions(partialInput, context);
    completions.push(...patternCompletions);

    // 중복 제거 및 점수 정렬
    const uniqueCompletions = this.deduplicateAndRank(completions, partialInput);
    
    return uniqueCompletions.slice(0, this.config.maxPredictions);
  }

  /**
   * 컨텍스트 기반 제안 생성
   */
  async generateContextualSuggestions(partialInput, context) {
    const suggestions = [];

    // 1. 현재 위치 기반 제안
    if (context.currentPath) {
      const pathSuggestions = await this.generatePathBasedSuggestions(context.currentPath);
      suggestions.push(...pathSuggestions);
    }

    // 2. 선택된 파일 기반 제안
    if (context.selectedFiles && context.selectedFiles.length > 0) {
      const fileSuggestions = await this.generateFileBasedSuggestions(context.selectedFiles);
      suggestions.push(...fileSuggestions);
    }

    // 3. 시간 기반 제안
    const timeSuggestions = await this.generateTimeBasedSuggestions();
    suggestions.push(...timeSuggestions);

    // 4. 프로젝트 타입 기반 제안
    if (context.projectType) {
      const projectSuggestions = await this.generateProjectBasedSuggestions(context.projectType);
      suggestions.push(...projectSuggestions);
    }

    return this.rankSuggestions(suggestions, partialInput, context);
  }

  /**
   * 워크플로우 예측
   */
  async predictWorkflows(partialInput, context) {
    const workflows = [];
    const userId = context.userId || 'anonymous';
    const userPattern = this.userPatterns.get(userId);

    if (!userPattern) {
      return [];
    }

    // 1. 최근 명령어 시퀀스 분석
    const recentCommands = this.getRecentCommands(userId, this.config.contextWindowSize);
    
    // 2. 일반적인 워크플로우 패턴 매칭
    const commonWorkflows = await this.matchCommonWorkflows(recentCommands, partialInput);
    workflows.push(...commonWorkflows);

    // 3. 개인화된 워크플로우 예측
    const personalWorkflows = await this.predictPersonalWorkflows(userPattern, recentCommands, partialInput);
    workflows.push(...personalWorkflows);

    // 4. 시간 패턴 기반 워크플로우
    const timeBasedWorkflows = await this.predictTimeBasedWorkflows(userId, partialInput);
    workflows.push(...timeBasedWorkflows);

    return this.rankWorkflows(workflows, context);
  }

  /**
   * 명령어 학습 및 패턴 업데이트
   */
  async learnFromCommand(command, context = {}, success = true) {
    try {
      const userId = context.userId || 'anonymous';
      const timestamp = Date.now();

      // 1. 명령어 히스토리 업데이트
      this.updateCommandHistory(userId, command, timestamp, success);

      // 2. 자동완성 트라이 업데이트
      this.updateAutocompleteTrie(command);

      // 3. 사용자 패턴 학습
      await this.updateUserPatterns(userId, command, context, success);

      // 4. 워크플로우 패턴 학습
      await this.learnWorkflowPatterns(userId, command, context);

      // 5. 예측 모델 업데이트
      await this.updatePredictionModels(command, context, success);

    } catch (error) {
      logger.error('명령어 학습 실패:', error);
    }
  }

  /**
   * 스마트 자동완성 트라이 검색
   */
  searchTrie(prefix) {
    const completions = [];
    const results = this.autocompleteTrie.search(prefix.toLowerCase());
    
    results.forEach(result => {
      const completion = {
        text: result.word,
        type: 'autocomplete',
        score: result.frequency / (result.frequency + 10), // 정규화
        confidence: Math.min(result.frequency / 50, 1.0),
        source: 'trie'
      };
      
      completions.push(completion);
    });

    return completions;
  }

  /**
   * 히스토리 기반 검색
   */
  searchHistory(partialInput, context) {
    const completions = [];
    const userId = context.userId || 'anonymous';
    const userHistory = this.commandHistory.get(userId) || [];
    
    const recentCommands = userHistory
      .filter(entry => entry.success !== false)
      .slice(-this.config.patternLearningWindow);

    recentCommands.forEach(entry => {
      if (entry.command.toLowerCase().startsWith(partialInput.toLowerCase())) {
        const daysSince = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-daysSince / 30); // 30일 반감기
        
        completions.push({
          text: entry.command,
          type: 'history',
          score: recencyScore,
          confidence: recencyScore * 0.8,
          source: 'history',
          lastUsed: entry.timestamp
        });
      }
    });

    return completions;
  }

  /**
   * 템플릿 기반 완성 생성
   */
  generateTemplateCompletions(partialInput, context) {
    const completions = [];
    
    // 입력에서 의도 추출
    const intent = this.extractIntent(partialInput);
    if (!intent || !this.commandTemplates[intent]) {
      return completions;
    }

    const templates = this.commandTemplates[intent];
    
    templates.forEach(template => {
      // 템플릿 변수 채우기
      const filledTemplate = this.fillTemplate(template, context);
      
      if (filledTemplate.toLowerCase().includes(partialInput.toLowerCase())) {
        completions.push({
          text: filledTemplate,
          type: 'template',
          score: 0.7,
          confidence: 0.6,
          source: 'template',
          intent: intent
        });
      }
    });

    return completions;
  }

  /**
   * 패턴 기반 완성 생성
   */
  generatePatternCompletions(partialInput, context) {
    const completions = [];
    const userId = context.userId || 'anonymous';
    const userPattern = this.userPatterns.get(userId);
    
    if (!userPattern || !userPattern.commandPatterns) {
      return completions;
    }

    // 사용자의 명령어 패턴 분석
    userPattern.commandPatterns.forEach(pattern => {
      if (pattern.template.toLowerCase().includes(partialInput.toLowerCase())) {
        const filledPattern = this.fillPatternTemplate(pattern, context);
        
        completions.push({
          text: filledPattern,
          type: 'pattern',
          score: pattern.confidence,
          confidence: pattern.confidence * 0.9,
          source: 'user_pattern',
          frequency: pattern.frequency
        });
      }
    });

    return completions;
  }

  /**
   * 경로 기반 제안 생성
   */
  async generatePathBasedSuggestions(currentPath) {
    const suggestions = [];
    
    // 현재 경로에서 일반적인 작업들
    const pathActions = [
      `${currentPath}의 파일들 정리해줘`,
      `${currentPath}에서 중복 파일 찾아줘`,
      `${currentPath} 용량 분석해줘`,
      `${currentPath}의 최근 파일들 보여줘`
    ];

    pathActions.forEach((action, index) => {
      suggestions.push({
        text: action,
        type: 'contextual',
        score: 0.8 - (index * 0.1),
        confidence: 0.7,
        source: 'path_context',
        category: 'location_based'
      });
    });

    return suggestions;
  }

  /**
   * 파일 기반 제안 생성
   */
  async generateFileBasedSuggestions(selectedFiles) {
    const suggestions = [];
    const fileCount = selectedFiles.length;
    
    if (fileCount === 1) {
      const fileName = selectedFiles[0];
      suggestions.push(
        {
          text: `${fileName} 분석해줘`,
          type: 'contextual',
          score: 0.9,
          confidence: 0.8,
          source: 'file_context'
        },
        {
          text: `${fileName}과 비슷한 파일 찾아줘`,
          type: 'contextual',
          score: 0.8,
          confidence: 0.7,
          source: 'file_context'
        }
      );
    } else {
      suggestions.push(
        {
          text: `선택된 ${fileCount}개 파일 정리해줘`,
          type: 'contextual',
          score: 0.9,
          confidence: 0.8,
          source: 'file_context'
        },
        {
          text: `선택된 파일들 압축해줘`,
          type: 'contextual',
          score: 0.7,
          confidence: 0.6,
          source: 'file_context'
        }
      );
    }

    return suggestions;
  }

  /**
   * 시간 기반 제안 생성
   */
  async generateTimeBasedSuggestions() {
    const suggestions = [];
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // 시간대별 제안
    if (hour >= 9 && hour <= 17) {
      // 업무 시간
      suggestions.push({
        text: '프로젝트 파일들 정리해줘',
        type: 'contextual',
        score: 0.7,
        confidence: 0.6,
        source: 'time_context',
        reason: 'work_hours'
      });
    } else if (hour >= 18 || hour <= 6) {
      // 저녁/새벽 시간
      suggestions.push({
        text: '임시 파일 정리해줘',
        type: 'contextual',
        score: 0.6,
        confidence: 0.5,
        source: 'time_context',
        reason: 'cleanup_time'
      });
    }

    // 요일별 제안
    if (dayOfWeek === 1) { // 월요일
      suggestions.push({
        text: '지난 주 작업 파일들 백업해줘',
        type: 'contextual',
        score: 0.6,
        confidence: 0.5,
        source: 'time_context',
        reason: 'monday_routine'
      });
    }

    return suggestions;
  }

  /**
   * 프로젝트 기반 제안 생성
   */
  async generateProjectBasedSuggestions(projectType) {
    const suggestions = [];
    
    const projectSuggestions = {
      'web-frontend': [
        'node_modules 폴더 정리해줘',
        'dist 폴더 삭제해줘',
        '이미지 파일 최적화해줘',
        'CSS 파일들 정리해줘'
      ],
      'web-backend': [
        '로그 파일 정리해줘',
        'temp 폴더 정리해줘',
        '데이터베이스 백업해줘',
        'API 문서 파일들 정리해줘'
      ],
      'data-science': [
        '데이터셋 파일들 정리해줘',
        '모델 파일 백업해줘',
        'Jupyter 노트북 정리해줘',
        '그래프 이미지들 정리해줘'
      ]
    };

    const suggestions_list = projectSuggestions[projectType] || [];
    
    suggestions_list.forEach((suggestion, index) => {
      suggestions.push({
        text: suggestion,
        type: 'contextual',
        score: 0.8 - (index * 0.1),
        confidence: 0.7,
        source: 'project_context',
        projectType: projectType
      });
    });

    return suggestions;
  }

  /**
   * 일반적인 워크플로우 매칭
   */
  async matchCommonWorkflows(recentCommands, partialInput) {
    const workflows = [];
    
    const commonSequences = [
      ['검색', '정리', '삭제'],
      ['분석', '백업', '정리'],
      ['찾기', '분류', '이동'],
      ['스캔', '분석', '최적화']
    ];

    if (recentCommands.length > 0) {
      const lastCommand = recentCommands[recentCommands.length - 1];
      
      commonSequences.forEach(sequence => {
        const currentIndex = this.findCommandInSequence(lastCommand.command, sequence);
        if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
          const nextStep = sequence[currentIndex + 1];
          workflows.push({
            steps: sequence,
            currentStep: currentIndex,
            nextStep: nextStep,
            confidence: 0.7,
            type: 'common_workflow',
            description: `일반적으로 ${lastCommand.command} 후에 ${nextStep} 작업을 합니다`
          });
        }
      });
    }

    return workflows;
  }

  /**
   * 개인화된 워크플로우 예측
   */
  async predictPersonalWorkflows(userPattern, recentCommands, partialInput) {
    const workflows = [];
    
    if (!userPattern.workflowPatterns) {
      return workflows;
    }

    userPattern.workflowPatterns.forEach(workflow => {
      if (recentCommands.length > 0) {
        const lastCommand = recentCommands[recentCommands.length - 1];
        const matchIndex = workflow.sequence.findIndex(step => 
          this.commandSimilarity(lastCommand.command, step) > 0.7
        );

        if (matchIndex >= 0 && matchIndex < workflow.sequence.length - 1) {
          const nextStep = workflow.sequence[matchIndex + 1];
          workflows.push({
            steps: workflow.sequence,
            currentStep: matchIndex,
            nextStep: nextStep,
            confidence: workflow.confidence,
            type: 'personal_workflow',
            frequency: workflow.frequency,
            description: `당신은 보통 ${lastCommand.command} 후에 ${nextStep}을 실행합니다`
          });
        }
      }
    });

    return workflows;
  }

  /**
   * 시간 기반 워크플로우 예측
   */
  async predictTimeBasedWorkflows(userId, partialInput) {
    const workflows = [];
    const userHistory = this.commandHistory.get(userId) || [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // 같은 시간대의 과거 패턴 분석
    const sameTimeCommands = userHistory.filter(entry => {
      const commandHour = new Date(entry.timestamp).getHours();
      const commandDay = new Date(entry.timestamp).getDay();
      return Math.abs(commandHour - currentHour) <= 1 && commandDay === currentDay;
    });

    if (sameTimeCommands.length >= 3) {
      const timePattern = this.extractTimePattern(sameTimeCommands);
      if (timePattern.confidence > 0.6) {
        workflows.push({
          steps: timePattern.sequence,
          currentStep: -1,
          nextStep: timePattern.sequence[0],
          confidence: timePattern.confidence,
          type: 'time_based_workflow',
          description: `이 시간에 보통 ${timePattern.sequence.join(' → ')} 순으로 작업합니다`
        });
      }
    }

    return workflows;
  }

  /**
   * 유틸리티 메서드들
   */
  deduplicateAndRank(completions, partialInput) {
    const seen = new Set();
    const unique = [];

    completions.forEach(completion => {
      const key = completion.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        
        // 입력과의 유사도 보너스
        const similarity = this.calculateSimilarity(partialInput, completion.text);
        completion.score = (completion.score || 0.5) + (similarity * 0.3);
        
        // 신뢰도 조정
        completion.confidence = Math.min(completion.confidence * (1 + similarity), 1.0);
        
        unique.push(completion);
      }
    });

    return unique.sort((a, b) => b.score - a.score);
  }

  rankSuggestions(suggestions, partialInput, context) {
    return suggestions
      .filter(s => s.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => {
        // 복합 점수 계산
        const scoreA = this.calculateCompositeScore(a, partialInput, context);
        const scoreB = this.calculateCompositeScore(b, partialInput, context);
        return scoreB - scoreA;
      })
      .slice(0, this.config.maxPredictions);
  }

  rankWorkflows(workflows, context) {
    return workflows
      .filter(w => w.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxPredictions);
  }

  calculateOverallConfidence(predictions) {
    const allPredictions = [
      ...predictions.completions,
      ...predictions.suggestions,
      ...predictions.workflows
    ];

    if (allPredictions.length === 0) return 0;

    const avgConfidence = allPredictions.reduce((sum, p) => sum + p.confidence, 0) / allPredictions.length;
    const countBonus = Math.min(allPredictions.length / 10, 0.2);
    
    return Math.min(avgConfidence + countBonus, 1.0);
  }

  calculateCompositeScore(suggestion, partialInput, context) {
    let score = suggestion.score || 0.5;
    
    // 가중치 적용
    const weights = this.predictionWeights;
    
    // 빈도 점수
    if (suggestion.frequency) {
      score += (suggestion.frequency / 100) * weights.frequencyScore;
    }
    
    // 최근 사용 점수
    if (suggestion.lastUsed) {
      const daysSince = (Date.now() - suggestion.lastUsed) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.exp(-daysSince / 7); // 7일 반감기
      score += recencyScore * weights.recentUsage;
    }
    
    // 컨텍스트 매칭 점수
    const contextScore = this.calculateContextMatch(suggestion, context);
    score += contextScore * weights.contextMatch;
    
    // 패턴 매칭 점수
    const patternScore = this.calculatePatternMatch(suggestion, partialInput);
    score += patternScore * weights.patternMatch;
    
    return Math.min(score, 1.0);
  }

  calculateContextMatch(suggestion, context) {
    let score = 0;
    
    if (context.currentPath && suggestion.text.includes(context.currentPath)) {
      score += 0.3;
    }
    
    if (context.projectType && suggestion.projectType === context.projectType) {
      score += 0.3;
    }
    
    if (context.selectedFiles && suggestion.text.includes('선택')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  calculatePatternMatch(suggestion, partialInput) {
    return this.calculateSimilarity(partialInput, suggestion.text);
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getUsedStrategies(predictions) {
    const strategies = new Set();
    
    [...predictions.completions, ...predictions.suggestions].forEach(p => {
      strategies.add(p.source);
    });
    
    return Array.from(strategies);
  }

  getEmptyPredictions() {
    return {
      completions: [],
      suggestions: [],
      workflows: [],
      confidence: 0,
      meta: {
        inputLength: 0,
        processingTime: 0,
        strategies: []
      }
    };
  }

  extractIntent(input) {
    const intentKeywords = {
      search: ['찾', '검색', 'find', 'search'],
      organize: ['정리', '분류', 'organize', 'sort'],
      analyze: ['분석', '확인', 'analyze', 'check'],
      clean: ['삭제', '정리', '지워', 'delete', 'clean']
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => input.toLowerCase().includes(keyword))) {
        return intent;
      }
    }

    return null;
  }

  fillTemplate(template, context) {
    let filled = template;
    
    // 템플릿 변수 치환
    const substitutions = {
      '${keyword}': context.searchKeyword || 'PDF',
      '${extension}': context.fileExtension || '.js',
      '${size}': context.minSize || '10MB',
      '${period}': context.timePeriod || '일주일',
      '${type}': context.fileType || '이미지',
      '${location}': context.currentPath || '현재 폴더',
      '${directory}': context.currentPath || '이 디렉토리'
    };

    Object.entries(substitutions).forEach(([variable, value]) => {
      filled = filled.replace(variable, value);
    });

    return filled;
  }

  fillPatternTemplate(pattern, context) {
    // 사용자 패턴 템플릿 채우기
    return this.fillTemplate(pattern.template, context);
  }

  updateCommandHistory(userId, command, timestamp, success) {
    let history = this.commandHistory.get(userId) || [];
    
    history.push({
      command,
      timestamp,
      success
    });

    // 히스토리 크기 제한
    if (history.length > this.config.patternLearningWindow * 2) {
      history = history.slice(-this.config.patternLearningWindow);
    }

    this.commandHistory.set(userId, history);
  }

  updateAutocompleteTrie(command) {
    this.autocompleteTrie.insert(command.toLowerCase());
  }

  async updateUserPatterns(userId, command, context, success) {
    let pattern = this.userPatterns.get(userId) || {
      commandFrequency: {},
      workflowPatterns: [],
      commandPatterns: [],
      preferences: {}
    };

    // 명령어 빈도 업데이트
    pattern.commandFrequency[command] = (pattern.commandFrequency[command] || 0) + 1;

    // 성공률 기반 패턴 업데이트
    if (success) {
      this.updateSuccessfulPatterns(pattern, command, context);
    }

    this.userPatterns.set(userId, pattern);
  }

  updateSuccessfulPatterns(pattern, command, context) {
    // 성공적인 명령어 패턴 추출
    const commandPattern = this.extractCommandPattern(command);
    
    const existingPattern = pattern.commandPatterns.find(p => p.template === commandPattern);
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
    } else {
      pattern.commandPatterns.push({
        template: commandPattern,
        frequency: 1,
        confidence: 0.5
      });
    }
  }

  extractCommandPattern(command) {
    // 명령어에서 패턴 추출 (간단한 버전)
    return command
      .replace(/\d+/g, '${number}')
      .replace(/[A-Z]:/g, '${drive}')
      .replace(/\b\w+\.(jpg|png|pdf|txt|js|py)\b/gi, '${file}');
  }

  async learnWorkflowPatterns(userId, command, context) {
    const recentCommands = this.getRecentCommands(userId, this.config.workflowPredictionDepth);
    
    if (recentCommands.length >= 2) {
      const sequence = recentCommands.map(c => c.command);
      this.updateWorkflowPattern(userId, sequence);
    }
  }

  updateWorkflowPattern(userId, sequence) {
    let pattern = this.userPatterns.get(userId);
    if (!pattern) return;

    const sequenceKey = sequence.join(' → ');
    const existingWorkflow = pattern.workflowPatterns.find(w => w.key === sequenceKey);
    
    if (existingWorkflow) {
      existingWorkflow.frequency++;
      existingWorkflow.confidence = Math.min(existingWorkflow.confidence + this.config.adaptiveLearningRate, 1.0);
    } else {
      pattern.workflowPatterns.push({
        key: sequenceKey,
        sequence: sequence,
        frequency: 1,
        confidence: 0.3
      });
    }

    this.userPatterns.set(userId, pattern);
  }

  async updatePredictionModels(command, context, success) {
    // 예측 모델 성능 업데이트
    const modelKey = this.generateModelKey(context);
    let model = this.predictionModels.get(modelKey) || {
      predictions: 0,
      successes: 0,
      accuracy: 0.5
    };

    model.predictions++;
    if (success) {
      model.successes++;
    }
    model.accuracy = model.successes / model.predictions;

    this.predictionModels.set(modelKey, model);
  }

  generateModelKey(context) {
    return `${context.projectType || 'unknown'}_${context.timeOfDay || 'unknown'}`;
  }

  getRecentCommands(userId, limit) {
    const history = this.commandHistory.get(userId) || [];
    return history.slice(-limit);
  }

  findCommandInSequence(command, sequence) {
    return sequence.findIndex(step => 
      command.toLowerCase().includes(step.toLowerCase()) ||
      step.toLowerCase().includes(command.toLowerCase())
    );
  }

  commandSimilarity(cmd1, cmd2) {
    return this.calculateSimilarity(cmd1.toLowerCase(), cmd2.toLowerCase());
  }

  extractTimePattern(commands) {
    const sequence = commands.map(c => c.command);
    const frequency = commands.length;
    const confidence = Math.min(frequency / 10, 1.0);
    
    return {
      sequence: [...new Set(sequence)], // 중복 제거
      frequency,
      confidence
    };
  }

  async loadCommandHistory() {
    try {
      const history = await this.cache.get('command-history') || {};
      Object.entries(history).forEach(([userId, commands]) => {
        this.commandHistory.set(userId, commands);
      });
    } catch (error) {
      logger.warn('명령어 히스토리 로드 실패:', error);
    }
  }

  async loadUserPatterns() {
    try {
      const patterns = await this.cache.get('user-patterns') || {};
      Object.entries(patterns).forEach(([userId, pattern]) => {
        this.userPatterns.set(userId, pattern);
      });
    } catch (error) {
      logger.warn('사용자 패턴 로드 실패:', error);
    }
  }

  async buildAutocompleteTrie() {
    try {
      const commonCommands = [
        '파일 찾아줘', '정리해줘', '분석해줘', '삭제해줘', '백업해줘',
        '중복 파일 찾아줘', '용량 분석해줘', '최근 파일 보여줘',
        'PDF 파일 찾아줘', '이미지 정리해줘', '프로젝트 분석해줘'
      ];

      commonCommands.forEach(command => {
        this.autocompleteTrie.insert(command.toLowerCase());
      });
    } catch (error) {
      logger.warn('자동완성 트라이 구축 실패:', error);
    }
  }

  initializePredictionModels() {
    // 기본 예측 모델 초기화
    const defaultModels = [
      'web-frontend_morning',
      'web-backend_afternoon',
      'data-science_evening'
    ];

    defaultModels.forEach(modelKey => {
      this.predictionModels.set(modelKey, {
        predictions: 0,
        successes: 0,
        accuracy: 0.5
      });
    });
  }

  startRealtimeLearning() {
    // 실시간 학습 및 캐시 저장
    setInterval(async () => {
      try {
        await this.saveToCache();
      } catch (error) {
        logger.error('실시간 학습 데이터 저장 실패:', error);
      }
    }, 60000); // 1분마다
  }

  async saveToCache() {
    // 명령어 히스토리 저장
    const historyObj = Object.fromEntries(this.commandHistory.entries());
    await this.cache.set('command-history', historyObj, 86400 * 7); // 7일

    // 사용자 패턴 저장
    const patternsObj = Object.fromEntries(this.userPatterns.entries());
    await this.cache.set('user-patterns', patternsObj, 86400 * 30); // 30일

    // 예측 모델 저장
    const modelsObj = Object.fromEntries(this.predictionModels.entries());
    await this.cache.set('prediction-models', modelsObj, 86400 * 7); // 7일
  }
}

/**
 * 트라이 노드 클래스
 */
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.frequency = 0;
    this.word = null;
  }

  insert(word) {
    let current = this;
    
    for (const char of word) {
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    
    current.isEndOfWord = true;
    current.frequency++;
    current.word = word;
  }

  search(prefix) {
    let current = this;
    
    // 프리픽스 탐색
    for (const char of prefix) {
      if (!current.children[char]) {
        return [];
      }
      current = current.children[char];
    }
    
    // 모든 완성 가능한 단어 수집
    const results = [];
    this.collectWords(current, results);
    
    return results.sort((a, b) => b.frequency - a.frequency);
  }

  collectWords(node, results) {
    if (node.isEndOfWord) {
      results.push({
        word: node.word,
        frequency: node.frequency
      });
    }
    
    for (const child of Object.values(node.children)) {
      this.collectWords(child, results);
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

export { TrieNode };
export default PredictiveUIEngine;