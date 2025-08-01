/**
 * 🧠 사용자별 AI 의도 학습 시스템
 * 사용자의 패턴을 학습하고 개인화된 의도 파악 제공
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class UserIntentLearner {
  constructor() {
    this.userPatterns = new Map();
    this.conversationHistory = new Map();
    this.feedbackData = new Map();
    this.globalPatterns = new Map();
    
    // 📁 학습 데이터 저장 경로
    this.dataDir = path.join(process.cwd(), 'data', 'ai_learning');
    this.userPatternsFile = path.join(this.dataDir, 'user_patterns.json');
    this.conversationHistoryFile = path.join(this.dataDir, 'conversation_history.json');
    this.feedbackDataFile = path.join(this.dataDir, 'feedback_data.json');
    this.globalStatsFile = path.join(this.dataDir, 'global_stats.json');
    
    // 전역 패턴 (모든 사용자 공통)
    this.initializeGlobalPatterns();
    
    // 🔄 자동 저장 설정
    this.autoSaveInterval = 5 * 60 * 1000; // 5분마다 자동 저장
    this.lastSaveTime = Date.now();
    this.pendingChanges = false;
    
    // 자동 저장 타이머 시작
    this.startAutoSave();
  }

  /**
   * 🚀 초기화 및 데이터 로드
   */
  async initialize() {
    try {
      console.log('🧠 UserIntentLearner 초기화 시작...');
      
      // 데이터 디렉토리 생성
      await this.ensureDataDirectory();
      
      // 기존 학습 데이터 로드
      await this.loadAllData();
      
      console.log('✅ UserIntentLearner 초기화 완료');
      console.log(`📊 로드된 데이터: ${this.userPatterns.size}개 사용자 패턴, ${this.feedbackData.size}개 피드백`);
      
    } catch (error) {
      console.error('❌ UserIntentLearner 초기화 실패:', error);
      // 실패해도 기본 기능은 동작하도록
    }
  }

  /**
   * 📁 데이터 디렉토리 생성
   */
  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`📁 AI 학습 데이터 디렉토리 생성: ${this.dataDir}`);
    }
  }

  /**
   * 📥 모든 학습 데이터 로드
   */
  async loadAllData() {
    const loadPromises = [
      this.loadUserPatterns(),
      this.loadConversationHistory(),
      this.loadFeedbackData(),
      this.loadGlobalStats()
    ];
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * 📥 사용자 패턴 로드
   */
  async loadUserPatterns() {
    try {
      const data = await fs.readFile(this.userPatternsFile, 'utf8');
      const patterns = JSON.parse(data);
      this.userPatterns = new Map(Object.entries(patterns));
      console.log(`📥 사용자 패턴 로드: ${this.userPatterns.size}개`);
    } catch (error) {
      console.log('📥 사용자 패턴 파일 없음, 새로 시작');
    }
  }

  /**
   * 📥 대화 기록 로드
   */
  async loadConversationHistory() {
    try {
      const data = await fs.readFile(this.conversationHistoryFile, 'utf8');
      const history = JSON.parse(data);
      this.conversationHistory = new Map(Object.entries(history));
      console.log(`📥 대화 기록 로드: ${this.conversationHistory.size}개 사용자`);
    } catch (error) {
      console.log('📥 대화 기록 파일 없음, 새로 시작');
    }
  }

  /**
   * 📥 피드백 데이터 로드
   */
  async loadFeedbackData() {
    try {
      const data = await fs.readFile(this.feedbackDataFile, 'utf8');
      const feedback = JSON.parse(data);
      this.feedbackData = new Map(Object.entries(feedback));
      console.log(`📥 피드백 데이터 로드: ${this.feedbackData.size}개 사용자`);
    } catch (error) {
      console.log('📥 피드백 데이터 파일 없음, 새로 시작');
    }
  }

  /**
   * 📥 전역 통계 로드
   */
  async loadGlobalStats() {
    try {
      const data = await fs.readFile(this.globalStatsFile, 'utf8');
      this.globalStats = JSON.parse(data);
      console.log('📥 전역 통계 로드 완료');
    } catch (error) {
      this.globalStats = {
        totalUsers: 0,
        totalConversations: 0,
        totalFeedback: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
      console.log('📥 전역 통계 파일 없음, 새로 시작');
    }
  }

  /**
   * 💾 모든 학습 데이터 저장
   */
  async saveAllData() {
    try {
      const savePromises = [
        this.saveUserPatterns(),
        this.saveConversationHistory(),
        this.saveFeedbackData(),
        this.saveGlobalStats()
      ];
      
      await Promise.all(savePromises);
      this.pendingChanges = false;
      this.lastSaveTime = Date.now();
      
      console.log('💾 AI 학습 데이터 저장 완료');
      
    } catch (error) {
      console.error('❌ AI 학습 데이터 저장 실패:', error);
    }
  }

  /**
   * 💾 사용자 패턴 저장
   */
  async saveUserPatterns() {
    const data = Object.fromEntries(this.userPatterns);
    await fs.writeFile(this.userPatternsFile, JSON.stringify(data, null, 2));
  }

  /**
   * 💾 대화 기록 저장
   */
  async saveConversationHistory() {
    const data = Object.fromEntries(this.conversationHistory);
    await fs.writeFile(this.conversationHistoryFile, JSON.stringify(data, null, 2));
  }

  /**
   * 💾 피드백 데이터 저장
   */
  async saveFeedbackData() {
    const data = Object.fromEntries(this.feedbackData);
    await fs.writeFile(this.feedbackDataFile, JSON.stringify(data, null, 2));
  }

  /**
   * 💾 전역 통계 저장
   */
  async saveGlobalStats() {
    this.globalStats.lastUpdated = Date.now();
    this.globalStats.totalUsers = this.userPatterns.size;
    this.globalStats.totalConversations = Array.from(this.conversationHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    this.globalStats.totalFeedback = Array.from(this.feedbackData.values())
      .reduce((sum, feedback) => sum + Object.keys(feedback).length, 0);
    
    await fs.writeFile(this.globalStatsFile, JSON.stringify(this.globalStats, null, 2));
  }

  /**
   * 🔄 자동 저장 시작
   */
  startAutoSave() {
    setInterval(() => {
      if (this.pendingChanges && Date.now() - this.lastSaveTime > this.autoSaveInterval) {
        this.saveAllData();
      }
    }, this.autoSaveInterval);
  }

  /**
   * 📝 변경사항 표시
   */
  markAsChanged() {
    this.pendingChanges = true;
  }

  /**
   * 🌍 전역 패턴 초기화
   */
  initializeGlobalPatterns() {
    this.globalPatterns.set('kakao_received', {
      keywords: ['카카오톡', '카톡', 'kakaotalk'],
      commonPaths: ['Documents/카카오톡 받은 파일', 'Documents/KakaoTalk Received Files'],
      confidence: 0.8
    });
    
    this.globalPatterns.set('recycle_bin', {
      keywords: ['휴지통', '쓰레기통', 'recycle', 'trash'],
      commonPaths: ['$Recycle.Bin', 'Recycle Bin'],
      confidence: 0.7
    });
    
    this.globalPatterns.set('downloads', {
      keywords: ['다운로드', 'download', '받은파일'],
      commonPaths: ['Downloads', '다운로드'],
      confidence: 0.6
    });
  }

  /**
   * 👤 사용자별 의도 분석
   */
  async analyzeUserIntent(input, userId, context = {}) {
    const userPatterns = this.userPatterns.get(userId) || {};
    const conversationHistory = this.conversationHistory.get(userId) || [];
    
    // 1. 사용자별 패턴 우선 확인
    const userSpecificIntent = this.checkUserSpecificPatterns(input, userPatterns);
    if (userSpecificIntent.confidence > 0.8) {
      this.markAsChanged(); // 📝 변경사항 표시
      return userSpecificIntent;
    }
    
    // 2. 대화 컨텍스트 기반 추론
    const contextualIntent = this.analyzeConversationContext(input, conversationHistory, context);
    if (contextualIntent.confidence > 0.7) {
      this.markAsChanged(); // 📝 변경사항 표시
      return contextualIntent;
    }
    
    // 3. 전역 패턴 기반 추론
    const globalIntent = this.analyzeGlobalPatterns(input, context);
    
    // 4. 사용자 피드백 기반 조정
    const adjustedIntent = this.adjustWithUserFeedback(globalIntent, userId);
    
    // 📝 변경사항 표시 (자동 저장을 위해)
    this.markAsChanged();
    
    return adjustedIntent;
  }

  /**
   * 👤 사용자별 패턴 확인
   */
  checkUserSpecificPatterns(input, userPatterns) {
    const inputLower = input.toLowerCase();
    
    for (const [pattern, path] of Object.entries(userPatterns)) {
      if (inputLower.includes(pattern.toLowerCase())) {
        return {
          intent: 'user_specific',
          confidence: 0.9,
          paths: [path],
          source: 'user_pattern'
        };
      }
    }
    
    return { confidence: 0, paths: [] };
  }

  /**
   * 💬 대화 컨텍스트 분석
   */
  analyzeConversationContext(input, history, context) {
    if (history.length === 0) {
      return { confidence: 0, paths: [] };
    }
    
    // 최근 대화에서 언급된 경로들 확인
    const recentPaths = history.slice(-3).flatMap(h => h.mentionedPaths || []);
    const inputLower = input.toLowerCase();
    
    // 이전에 언급된 경로와 관련된 키워드가 있으면 추론
    for (const recentPath of recentPaths) {
      const pathKeywords = this.extractKeywordsFromPath(recentPath);
      for (const keyword of pathKeywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          return {
            intent: 'contextual',
            confidence: 0.75,
            paths: [recentPath],
            source: 'conversation_context'
          };
        }
      }
    }
    
    return { confidence: 0, paths: [] };
  }

  /**
   * 🌍 전역 패턴 분석
   */
  analyzeGlobalPatterns(input, context) {
    const inputLower = input.toLowerCase();
    let bestMatch = { confidence: 0, paths: [] };
    
    for (const [intentType, pattern] of this.globalPatterns) {
      const keywordMatch = pattern.keywords.some(keyword => 
        inputLower.includes(keyword.toLowerCase())
      );
      
      if (keywordMatch) {
        const confidence = this.calculateConfidence(input, pattern, context);
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: intentType,
            confidence: confidence,
            paths: pattern.commonPaths,
            source: 'global_pattern'
          };
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * 📊 신뢰도 계산
   */
  calculateConfidence(input, pattern, context) {
    let confidence = pattern.confidence;
    
    // 키워드 매칭 개수에 따른 조정
    const matchedKeywords = pattern.keywords.filter(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );
    confidence += matchedKeywords.length * 0.1;
    
    // 컨텍스트에 따른 조정
    if (context.language === 'ko' && pattern.keywords.some(k => /[가-힣]/.test(k))) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }

  /**
   * 🔄 사용자 피드백 기반 조정
   */
  adjustWithUserFeedback(intent, userId) {
    const userFeedback = this.feedbackData.get(userId) || {};
    
    // 이전에 사용자가 수정한 패턴이 있으면 적용
    for (const [pattern, correction] of Object.entries(userFeedback)) {
      if (intent.intent === pattern) {
        intent.paths = [correction.correctPath];
        intent.confidence = Math.min(0.98, intent.confidence + 0.1);
        intent.source = 'user_feedback';
      }
    }
    
    return intent;
  }

  /**
   * 📝 사용자 피드백 수집
   */
  recordUserFeedback(userId, originalIntent, userCorrection) {
    if (!this.feedbackData.has(userId)) {
      this.feedbackData.set(userId, {});
    }
    
    const userFeedback = this.feedbackData.get(userId);
    userFeedback[originalIntent.intent] = {
      correctPath: userCorrection,
      timestamp: Date.now(),
      originalPaths: originalIntent.paths
    };
    
    console.log(`📝 사용자 피드백 기록: ${userId} - ${originalIntent.intent} → ${userCorrection}`);
    
    // 📝 변경사항 표시 (자동 저장을 위해)
    this.markAsChanged();
  }

  /**
   * 💾 대화 기록 저장
   */
  recordConversation(userId, input, intent, result) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({
      input: input,
      intent: intent,
      result: result,
      timestamp: Date.now(),
      mentionedPaths: intent.paths || []
    });
    
    // 최근 100개만 유지 (10개에서 증가)
    if (history.length > 100) {
      history.shift();
    }
    
    // 📝 변경사항 표시 (자동 저장을 위해)
    this.markAsChanged();
  }

  /**
   * 🔍 경로에서 키워드 추출
   */
  extractKeywordsFromPath(path) {
    return path.split(/[\\\/]/).filter(part => part.length > 0);
  }

  /**
   * 📊 사용자 패턴 통계
   */
  getUserStats(userId) {
    const history = this.conversationHistory.get(userId) || [];
    const feedback = this.feedbackData.get(userId) || {};
    
    return {
      totalConversations: history.length,
      feedbackCount: Object.keys(feedback).length,
      commonIntents: this.getCommonIntents(history),
      lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null
    };
  }

  /**
   * 📈 자주 사용하는 의도 분석
   */
  getCommonIntents(history) {
    const intentCount = {};
    history.forEach(h => {
      if (h.intent && h.intent.intent) {
        intentCount[h.intent.intent] = (intentCount[h.intent.intent] || 0) + 1;
      }
    });
    
    return Object.entries(intentCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));
  }

  /**
   * 🧹 메모리 정리 및 자동 저장 중지
   */
  async cleanup() {
    try {
      console.log('🧠 UserIntentLearner 정리 중...');
      
      // 자동 저장 중지
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
      }
      
      // 마지막 데이터 저장
      await this.saveAllData();
      
      // 메모리 정리
      this.userPatterns.clear();
      this.conversationHistory.clear();
      this.feedbackData.clear();
      this.globalStats = {};
      
      console.log('✅ UserIntentLearner 정리 완료');
      
    } catch (error) {
      console.error('❌ UserIntentLearner 정리 실패:', error);
    }
  }
} 