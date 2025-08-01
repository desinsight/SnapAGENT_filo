import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * 컨텍스트 학습 및 사용자 패턴 분석 엔진
 * 사용자의 작업 패턴을 학습하고 개인화된 경험 제공
 */
export class ContextLearningEngine {
  constructor() {
    this.cache = new LocalCache('context-learning');
    this.userProfiles = new Map();
    this.projectContexts = new Map();
    this.sessionMemory = new Map();
    
    // 학습 설정
    this.learningConfig = {
      sessionTimeoutMs: 30 * 60 * 1000, // 30분
      maxHistoryLength: 1000,
      patternConfidenceThreshold: 0.7,
      learningRate: 0.1
    };
    
    this.initializeLearningEngine();
  }

  async initializeLearningEngine() {
    try {
      logger.info('컨텍스트 학습 엔진 초기화 중...');
      
      // 기존 사용자 프로필 로드
      await this.loadUserProfiles();
      
      // 프로젝트 컨텍스트 로드
      await this.loadProjectContexts();
      
      // 실시간 학습 시작
      this.startRealtimeLearning();
      
      logger.info('컨텍스트 학습 엔진 초기화 완료');
    } catch (error) {
      logger.error('컨텍스트 학습 엔진 초기화 실패:', error);
    }
  }

  /**
   * 사용자 상호작용 기록 및 학습
   */
  async recordUserInteraction(sessionId, interaction) {
    try {
      const timestamp = Date.now();
      const session = this.getOrCreateSession(sessionId);
      
      // 상호작용 기록
      const record = {
        timestamp,
        command: interaction.command,
        intent: interaction.intent,
        context: interaction.context,
        success: interaction.success,
        executionTime: interaction.executionTime,
        userSatisfaction: interaction.userSatisfaction
      };
      
      session.interactions.push(record);
      
      // 실시간 패턴 분석
      await this.analyzeInteractionPattern(sessionId, record);
      
      // 세션 기반 학습
      await this.updateSessionLearning(sessionId);
      
      // 장기 학습 (비동기)
      setImmediate(() => this.performLongTermLearning(sessionId, record));
      
    } catch (error) {
      logger.error('사용자 상호작용 기록 실패:', error);
    }
  }

  /**
   * 프로젝트 컨텍스트 자동 감지 및 학습
   */
  async detectProjectContext(currentPath, fileList) {
    try {
      const context = {
        path: currentPath,
        detectedAt: Date.now(),
        projectType: 'unknown',
        structure: {},
        technologies: [],
        patterns: {},
        confidence: 0
      };
      
      // 1. 프로젝트 타입 감지
      context.projectType = await this.detectProjectType(currentPath, fileList);
      
      // 2. 기술 스택 분석
      context.technologies = await this.analyzeTechStack(fileList);
      
      // 3. 프로젝트 구조 분석
      context.structure = await this.analyzeProjectStructure(currentPath, fileList);
      
      // 4. 파일 패턴 분석
      context.patterns = await this.analyzeFilePatterns(fileList);
      
      // 5. 컨텍스트 신뢰도 계산
      context.confidence = this.calculateContextConfidence(context);
      
      // 6. 프로젝트 컨텍스트 저장
      this.projectContexts.set(currentPath, context);
      
      logger.info(`프로젝트 컨텍스트 감지: ${context.projectType} (신뢰도: ${context.confidence})`);
      
      return context;
      
    } catch (error) {
      logger.error('프로젝트 컨텍스트 감지 실패:', error);
      return null;
    }
  }

  /**
   * 개인화된 추천 생성
   */
  async generatePersonalizedRecommendations(sessionId, currentContext) {
    try {
      const session = this.getSession(sessionId);
      const userProfile = await this.getUserProfile(sessionId);
      
      const recommendations = {
        quickActions: [],
        smartSuggestions: [],
        workflowOptimizations: [],
        contextualTips: []
      };
      
      // 1. 사용자 패턴 기반 퀵 액션
      recommendations.quickActions = await this.generateQuickActions(userProfile, currentContext);
      
      // 2. AI 기반 스마트 제안
      recommendations.smartSuggestions = await this.generateSmartSuggestions(session, currentContext);
      
      // 3. 워크플로우 최적화 제안
      recommendations.workflowOptimizations = await this.generateWorkflowOptimizations(userProfile);
      
      // 4. 컨텍스트 기반 팁
      recommendations.contextualTips = await this.generateContextualTips(currentContext);
      
      return recommendations;
      
    } catch (error) {
      logger.error('개인화 추천 생성 실패:', error);
      return this.getDefaultRecommendations();
    }
  }

  /**
   * 사용자 프로필 업데이트
   */
  async updateUserProfile(sessionId, interactionData) {
    try {
      const profile = await this.getUserProfile(sessionId);
      
      // 작업 선호도 업데이트
      this.updateWorkPreferences(profile, interactionData);
      
      // 시간 패턴 업데이트
      this.updateTimePatterns(profile, interactionData);
      
      // 디렉토리 선호도 업데이트
      this.updateDirectoryPreferences(profile, interactionData);
      
      // 파일 타입 선호도 업데이트
      this.updateFileTypePreferences(profile, interactionData);
      
      // 언어 및 스타일 선호도 업데이트
      this.updateLanguagePreferences(profile, interactionData);
      
      // 프로필 저장
      await this.saveUserProfile(sessionId, profile);
      
    } catch (error) {
      logger.error('사용자 프로필 업데이트 실패:', error);
    }
  }

  /**
   * 지능형 컨텍스트 예측
   */
  async predictUserIntent(sessionId, partialCommand, currentContext) {
    try {
      const session = this.getSession(sessionId);
      const userProfile = await this.getUserProfile(sessionId);
      
      const predictions = {
        likelyIntents: [],
        completionSuggestions: [],
        contextualActions: [],
        confidence: 0
      };
      
      // 1. 최근 패턴 기반 예측
      predictions.likelyIntents = await this.predictFromRecentPatterns(session, partialCommand);
      
      // 2. 사용자 히스토리 기반 자동완성
      predictions.completionSuggestions = await this.generateCompletions(userProfile, partialCommand);
      
      // 3. 컨텍스트 기반 액션 제안
      predictions.contextualActions = await this.suggestContextualActions(currentContext, partialCommand);
      
      // 4. 전체 신뢰도 계산
      predictions.confidence = this.calculatePredictionConfidence(predictions);
      
      return predictions;
      
    } catch (error) {
      logger.error('사용자 의도 예측 실패:', error);
      return { likelyIntents: [], completionSuggestions: [], contextualActions: [], confidence: 0 };
    }
  }

  /**
   * 프로젝트 타입 감지
   */
  async detectProjectType(currentPath, fileList) {
    const indicators = {
      'web-frontend': {
        files: ['package.json', 'index.html', 'webpack.config.js', 'vite.config.js'],
        extensions: ['.jsx', '.tsx', '.vue', '.svelte'],
        keywords: ['react', 'vue', 'angular', 'svelte']
      },
      'web-backend': {
        files: ['package.json', 'server.js', 'app.js', 'index.php', 'requirements.txt'],
        extensions: ['.py', '.js', '.php', '.rb', '.go'],
        keywords: ['express', 'django', 'flask', 'laravel']
      },
      'mobile': {
        files: ['pubspec.yaml', 'build.gradle', 'Info.plist', 'package.json'],
        extensions: ['.dart', '.kotlin', '.swift', '.java'],
        keywords: ['flutter', 'react-native', 'ionic']
      },
      'data-science': {
        files: ['requirements.txt', 'environment.yml', 'Pipfile'],
        extensions: ['.py', '.ipynb', '.r', '.R'],
        keywords: ['pandas', 'numpy', 'tensorflow', 'jupyter']
      },
      'desktop': {
        files: ['main.cpp', 'main.py', 'main.js', 'package.json'],
        extensions: ['.cpp', '.cs', '.py', '.js'],
        keywords: ['electron', 'qt', 'wpf', 'tkinter']
      }
    };
    
    let maxScore = 0;
    let detectedType = 'unknown';
    
    for (const [type, criteria] of Object.entries(indicators)) {
      let score = 0;
      
      // 파일 존재 확인
      criteria.files.forEach(file => {
        if (fileList.some(f => f.name === file)) {
          score += 3;
        }
      });
      
      // 확장자 확인
      criteria.extensions.forEach(ext => {
        const count = fileList.filter(f => f.name.endsWith(ext)).length;
        score += count * 2;
      });
      
      // 키워드 확인 (package.json 등에서)
      // 실제 구현에서는 파일 내용을 읽어서 확인
      
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }
    
    return detectedType;
  }

  /**
   * 기술 스택 분석
   */
  async analyzeTechStack(fileList) {
    const technologies = [];
    
    const techIndicators = {
      'React': ['.jsx', '.tsx', 'package.json'],
      'Vue': ['.vue', 'package.json'],
      'Angular': ['.ts', 'angular.json'],
      'Python': ['.py', 'requirements.txt'],
      'Node.js': ['package.json', '.js'],
      'Java': ['.java', 'pom.xml', 'build.gradle'],
      'C++': ['.cpp', '.hpp', 'CMakeLists.txt'],
      'C#': ['.cs', '.csproj', '.sln'],
      'Docker': ['Dockerfile', 'docker-compose.yml'],
      'Git': ['.git', '.gitignore']
    };
    
    for (const [tech, indicators] of Object.entries(techIndicators)) {
      let confidence = 0;
      
      indicators.forEach(indicator => {
        if (indicator.startsWith('.')) {
          // 확장자 체크
          const count = fileList.filter(f => f.name.endsWith(indicator)).length;
          confidence += count * 0.1;
        } else {
          // 파일명 체크
          if (fileList.some(f => f.name === indicator)) {
            confidence += 0.5;
          }
        }
      });
      
      if (confidence > 0.3) {
        technologies.push({
          name: tech,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }
    
    return technologies.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 프로젝트 구조 분석
   */
  async analyzeProjectStructure(currentPath, fileList) {
    const structure = {
      depth: 0,
      directoryCount: 0,
      fileCount: 0,
      organization: 'unknown',
      patterns: []
    };
    
    // 디렉토리와 파일 수 계산
    structure.directoryCount = fileList.filter(f => f.type === 'directory').length;
    structure.fileCount = fileList.filter(f => f.type === 'file').length;
    
    // 일반적인 프로젝트 구조 패턴 감지
    const commonStructures = {
      'mvc': ['models', 'views', 'controllers'],
      'src-based': ['src', 'public', 'dist'],
      'feature-based': ['components', 'services', 'utils'],
      'monorepo': ['packages', 'apps', 'libs']
    };
    
    for (const [pattern, directories] of Object.entries(commonStructures)) {
      const matchCount = directories.filter(dir => 
        fileList.some(f => f.type === 'directory' && f.name === dir)
      ).length;
      
      if (matchCount >= 2) {
        structure.organization = pattern;
        structure.patterns.push(pattern);
      }
    }
    
    return structure;
  }

  /**
   * 파일 패턴 분석
   */
  async analyzeFilePatterns(fileList) {
    const patterns = {
      namingConvention: 'mixed',
      fileTypes: {},
      sizeDist: { small: 0, medium: 0, large: 0 },
      ageDist: { recent: 0, old: 0 }
    };
    
    // 파일 타입 분포
    fileList.forEach(file => {
      if (file.type === 'file') {
        const ext = path.extname(file.name).toLowerCase();
        patterns.fileTypes[ext] = (patterns.fileTypes[ext] || 0) + 1;
        
        // 크기 분포
        if (file.size < 1024 * 100) patterns.sizeDist.small++;
        else if (file.size < 1024 * 1024) patterns.sizeDist.medium++;
        else patterns.sizeDist.large++;
        
        // 나이 분포
        const ageMs = Date.now() - (file.modified ? new Date(file.modified).getTime() : 0);
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays < 30) patterns.ageDist.recent++;
        else patterns.ageDist.old++;
      }
    });
    
    // 네이밍 컨벤션 감지
    const camelCaseCount = fileList.filter(f => /^[a-z][a-zA-Z0-9]*$/.test(f.name.split('.')[0])).length;
    const kebabCaseCount = fileList.filter(f => /^[a-z][a-z0-9-]*$/.test(f.name.split('.')[0])).length;
    const snakeCaseCount = fileList.filter(f => /^[a-z][a-z0-9_]*$/.test(f.name.split('.')[0])).length;
    
    const maxCount = Math.max(camelCaseCount, kebabCaseCount, snakeCaseCount);
    if (maxCount === camelCaseCount) patterns.namingConvention = 'camelCase';
    else if (maxCount === kebabCaseCount) patterns.namingConvention = 'kebab-case';
    else if (maxCount === snakeCaseCount) patterns.namingConvention = 'snake_case';
    
    return patterns;
  }

  /**
   * 유틸리티 메서드들
   */
  getOrCreateSession(sessionId) {
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, {
        id: sessionId,
        startTime: Date.now(),
        interactions: [],
        context: {},
        patterns: {}
      });
    }
    return this.sessionMemory.get(sessionId);
  }

  getSession(sessionId) {
    return this.sessionMemory.get(sessionId);
  }

  async getUserProfile(sessionId) {
    let profile = this.userProfiles.get(sessionId);
    
    if (!profile) {
      profile = {
        id: sessionId,
        created: Date.now(),
        preferences: {
          operations: {},
          directories: {},
          fileTypes: {},
          timePatterns: {},
          language: 'ko'
        },
        patterns: {
          commandFrequency: {},
          successRates: {},
          timeUsage: {}
        },
        learning: {
          totalInteractions: 0,
          learningRate: this.learningConfig.learningRate
        }
      };
      
      this.userProfiles.set(sessionId, profile);
    }
    
    return profile;
  }

  calculateContextConfidence(context) {
    let confidence = 0;
    
    // 프로젝트 타입 신뢰도
    if (context.projectType !== 'unknown') confidence += 0.3;
    
    // 기술 스택 신뢰도
    if (context.technologies.length > 0) {
      confidence += context.technologies[0].confidence * 0.3;
    }
    
    // 구조 신뢰도
    if (context.structure.organization !== 'unknown') confidence += 0.2;
    
    // 패턴 신뢰도
    if (Object.keys(context.patterns.fileTypes).length > 3) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  async analyzeInteractionPattern(sessionId, record) {
    const session = this.getSession(sessionId);
    
    // 명령어 빈도 분석
    session.patterns.commandFrequency = session.patterns.commandFrequency || {};
    session.patterns.commandFrequency[record.intent] = 
      (session.patterns.commandFrequency[record.intent] || 0) + 1;
    
    // 성공률 분석
    session.patterns.successRates = session.patterns.successRates || {};
    if (!session.patterns.successRates[record.intent]) {
      session.patterns.successRates[record.intent] = { success: 0, total: 0 };
    }
    session.patterns.successRates[record.intent].total++;
    if (record.success) {
      session.patterns.successRates[record.intent].success++;
    }
  }

  async updateSessionLearning(sessionId) {
    const session = this.getSession(sessionId);
    
    // 세션 기반 패턴 감지
    const recentInteractions = session.interactions.slice(-10);
    
    // 반복 패턴 감지
    const sequences = this.detectCommandSequences(recentInteractions);
    if (sequences.length > 0) {
      session.patterns.sequences = sequences;
    }
  }

  detectCommandSequences(interactions) {
    const sequences = [];
    
    for (let i = 0; i < interactions.length - 2; i++) {
      const sequence = interactions.slice(i, i + 3).map(int => int.intent);
      const sequenceStr = sequence.join('-');
      
      // 같은 시퀀스가 반복되는지 확인
      const occurrences = interactions.slice(i + 3).some((_, j) => {
        const nextSequence = interactions.slice(i + 3 + j, i + 6 + j).map(int => int.intent);
        return nextSequence.join('-') === sequenceStr;
      });
      
      if (occurrences) {
        sequences.push({
          pattern: sequence,
          confidence: 0.8
        });
      }
    }
    
    return sequences;
  }

  async performLongTermLearning(sessionId, record) {
    try {
      const userProfile = await this.getUserProfile(sessionId);
      
      // 장기 패턴 업데이트
      userProfile.learning.totalInteractions++;
      
      // 적응적 학습률 조정
      if (userProfile.learning.totalInteractions > 100) {
        userProfile.learning.learningRate *= 0.95; // 점진적 감소
      }
      
      // 프로필 저장 (배치 처리)
      await this.scheduleProfileSave(sessionId);
      
    } catch (error) {
      logger.error('장기 학습 처리 실패:', error);
    }
  }

  async scheduleProfileSave(sessionId) {
    // 배치 저장을 위한 스케줄링
    clearTimeout(this.saveTimers?.get(sessionId));
    
    const timer = setTimeout(async () => {
      await this.saveUserProfile(sessionId, this.userProfiles.get(sessionId));
    }, 5000); // 5초 후 저장
    
    if (!this.saveTimers) this.saveTimers = new Map();
    this.saveTimers.set(sessionId, timer);
  }

  async loadUserProfiles() {
    try {
      // 캐시에서 프로필 로드
      const profiles = await this.cache.get('user-profiles') || {};
      
      Object.entries(profiles).forEach(([sessionId, profile]) => {
        this.userProfiles.set(sessionId, profile);
      });
      
    } catch (error) {
      logger.warn('사용자 프로필 로드 실패:', error);
    }
  }

  async saveUserProfile(sessionId, profile) {
    try {
      const profiles = await this.cache.get('user-profiles') || {};
      profiles[sessionId] = profile;
      await this.cache.set('user-profiles', profiles, 86400 * 30); // 30일
      
    } catch (error) {
      logger.error('사용자 프로필 저장 실패:', error);
    }
  }

  async loadProjectContexts() {
    try {
      const contexts = await this.cache.get('project-contexts') || {};
      
      Object.entries(contexts).forEach(([path, context]) => {
        this.projectContexts.set(path, context);
      });
      
    } catch (error) {
      logger.warn('프로젝트 컨텍스트 로드 실패:', error);
    }
  }

  startRealtimeLearning() {
    // 실시간 학습 및 정리 작업
    setInterval(() => {
      this.performMaintenanceTasks();
    }, 60000); // 1분마다
  }

  async performMaintenanceTasks() {
    try {
      // 오래된 세션 정리
      const now = Date.now();
      for (const [sessionId, session] of this.sessionMemory.entries()) {
        if (now - session.startTime > this.learningConfig.sessionTimeoutMs) {
          this.sessionMemory.delete(sessionId);
        }
      }
      
      // 캐시 최적화
      await this.cache.cleanup();
      
    } catch (error) {
      logger.error('유지보수 작업 실패:', error);
    }
  }

  async generateQuickActions(userProfile, currentContext) {
    // 사용자 선호도 기반 퀵 액션 생성
    const actions = [];
    
    const topOperations = Object.entries(userProfile.preferences.operations || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    topOperations.forEach(([operation, frequency]) => {
      actions.push({
        type: 'quick_action',
        operation,
        label: this.getOperationLabel(operation),
        confidence: Math.min(frequency / 10, 1.0)
      });
    });
    
    return actions;
  }

  async generateSmartSuggestions(session, currentContext) {
    // AI 기반 스마트 제안
    const suggestions = [];
    
    if (session && session.patterns.sequences) {
      session.patterns.sequences.forEach(seq => {
        suggestions.push({
          type: 'workflow_sequence',
          sequence: seq.pattern,
          confidence: seq.confidence,
          description: `일반적으로 ${seq.pattern.join(' → ')} 순서로 작업합니다`
        });
      });
    }
    
    return suggestions;
  }

  async generateWorkflowOptimizations(userProfile) {
    const optimizations = [];
    
    // 성공률이 낮은 작업에 대한 최적화 제안
    Object.entries(userProfile.patterns.successRates || {}).forEach(([operation, stats]) => {
      const successRate = stats.success / stats.total;
      if (successRate < 0.7 && stats.total > 5) {
        optimizations.push({
          type: 'improvement',
          operation,
          issue: 'low_success_rate',
          suggestion: `${operation} 작업의 성공률이 낮습니다. 다른 방법을 시도해보세요.`,
          confidence: 0.8
        });
      }
    });
    
    return optimizations;
  }

  async generateContextualTips(currentContext) {
    const tips = [];
    
    if (currentContext.projectType) {
      tips.push({
        type: 'project_tip',
        content: this.getProjectTypeTip(currentContext.projectType),
        confidence: 0.7
      });
    }
    
    return tips;
  }

  getOperationLabel(operation) {
    const labels = {
      'search': '🔍 검색',
      'organize': '📁 정리',
      'clean': '🧹 정리',
      'analyze': '📊 분석',
      'backup': '💾 백업'
    };
    return labels[operation] || operation;
  }

  getProjectTypeTip(projectType) {
    const tips = {
      'web-frontend': '프론트엔드 프로젝트에서는 node_modules 폴더를 정기적으로 정리하는 것이 좋습니다.',
      'web-backend': '백엔드 프로젝트에서는 로그 파일을 주기적으로 관리하세요.',
      'data-science': '데이터 과학 프로젝트에서는 대용량 데이터셋을 별도로 관리하는 것이 좋습니다.',
      'mobile': '모바일 프로젝트에서는 빌드 아티팩트를 정리하여 용량을 절약하세요.'
    };
    return tips[projectType] || '프로젝트 구조를 정기적으로 검토하세요.';
  }

  getDefaultRecommendations() {
    return {
      quickActions: [
        { type: 'quick_action', operation: 'search', label: '🔍 검색', confidence: 0.5 },
        { type: 'quick_action', operation: 'organize', label: '📁 정리', confidence: 0.5 }
      ],
      smartSuggestions: [],
      workflowOptimizations: [],
      contextualTips: []
    };
  }

  updateWorkPreferences(profile, interactionData) {
    const operation = interactionData.intent;
    profile.preferences.operations[operation] = (profile.preferences.operations[operation] || 0) + 1;
  }

  updateTimePatterns(profile, interactionData) {
    const hour = new Date(interactionData.timestamp).getHours();
    profile.preferences.timePatterns[hour] = (profile.preferences.timePatterns[hour] || 0) + 1;
  }

  updateDirectoryPreferences(profile, interactionData) {
    if (interactionData.context.currentPath) {
      const dir = interactionData.context.currentPath;
      profile.preferences.directories[dir] = (profile.preferences.directories[dir] || 0) + 1;
    }
  }

  updateFileTypePreferences(profile, interactionData) {
    if (interactionData.context.selectedFiles) {
      interactionData.context.selectedFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (ext) {
          profile.preferences.fileTypes[ext] = (profile.preferences.fileTypes[ext] || 0) + 1;
        }
      });
    }
  }

  updateLanguagePreferences(profile, interactionData) {
    // 명령어 언어 감지 및 선호도 업데이트
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(interactionData.command);
    const hasEnglish = /[a-zA-Z]/.test(interactionData.command);
    
    if (hasKorean) {
      profile.preferences.language = 'ko';
    } else if (hasEnglish && !hasKorean) {
      profile.preferences.language = 'en';
    }
  }

  async predictFromRecentPatterns(session, partialCommand) {
    const predictions = [];
    
    if (session && session.interactions.length > 0) {
      const recentIntents = session.interactions.slice(-5).map(i => i.intent);
      const intentFreq = {};
      
      recentIntents.forEach(intent => {
        intentFreq[intent] = (intentFreq[intent] || 0) + 1;
      });
      
      Object.entries(intentFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([intent, freq]) => {
          predictions.push({
            intent,
            confidence: freq / 5,
            reason: 'recent_pattern'
          });
        });
    }
    
    return predictions;
  }

  async generateCompletions(userProfile, partialCommand) {
    const completions = [];
    
    // 사용자 히스토리에서 유사한 명령어 찾기
    const commonCommands = [
      '파일 정리해줘',
      '중복 파일 찾아줘',
      '최근 파일 보여줘',
      '프로젝트 분석해줘',
      '용량 큰 파일 찾아줘'
    ];
    
    commonCommands.forEach(cmd => {
      if (cmd.toLowerCase().includes(partialCommand.toLowerCase())) {
        completions.push({
          text: cmd,
          confidence: 0.6,
          type: 'common_command'
        });
      }
    });
    
    return completions;
  }

  async suggestContextualActions(currentContext, partialCommand) {
    const actions = [];
    
    if (currentContext.projectType) {
      const projectActions = {
        'web-frontend': ['node_modules 정리', 'dist 폴더 정리', '이미지 최적화'],
        'web-backend': ['로그 파일 정리', '임시 파일 삭제', '데이터베이스 백업'],
        'data-science': ['데이터셋 정리', '모델 파일 정리', '노트북 정리']
      };
      
      const suggestions = projectActions[currentContext.projectType] || [];
      suggestions.forEach(action => {
        actions.push({
          action,
          confidence: 0.7,
          type: 'project_specific'
        });
      });
    }
    
    return actions;
  }

  calculatePredictionConfidence(predictions) {
    const totalItems = predictions.likelyIntents.length + 
                      predictions.completionSuggestions.length + 
                      predictions.contextualActions.length;
    
    if (totalItems === 0) return 0;
    
    const avgConfidence = [
      ...predictions.likelyIntents.map(p => p.confidence),
      ...predictions.completionSuggestions.map(p => p.confidence),
      ...predictions.contextualActions.map(p => p.confidence)
    ].reduce((sum, conf) => sum + conf, 0) / totalItems;
    
    return avgConfidence;
  }
}

export default ContextLearningEngine;