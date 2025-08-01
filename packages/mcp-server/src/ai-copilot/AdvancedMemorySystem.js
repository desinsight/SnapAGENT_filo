import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';

/**
 * 고급 대화 메모리 및 개인화 시스템
 * 장기 메모리, 감정 인식, 개인화, 컨텍스트 유지
 */
export class AdvancedMemorySystem {
  constructor() {
    this.cache = new LocalCache('memory-system');
    this.conversationMemory = new Map(); // 단기 메모리
    this.longTermMemory = new Map(); // 장기 메모리
    this.personalityProfiles = new Map(); // 성격 프로필
    this.emotionalStates = new Map(); // 감정 상태
    this.contextGraphs = new Map(); // 컨텍스트 그래프
    
    // 메모리 설정
    this.config = {
      shortTermWindow: 50, // 단기 메모리 윈도우
      longTermThreshold: 10, // 장기 메모리 임계값
      emotionalDecayRate: 0.95, // 감정 감소율
      personalityUpdateRate: 0.05, // 성격 업데이트율
      contextRetentionDays: 30, // 컨텍스트 보존 일수
      memoryConsolidationInterval: 3600000 // 1시간
    };
    
    // 감정 분석 모델
    this.emotionAnalyzer = {
      positive: ['좋다', '훌륭하다', '멋지다', '완벽하다', '최고다', 'good', 'great', 'excellent', 'perfect', 'amazing'],
      negative: ['나쁘다', '끔찍하다', '짜증나다', '실망이다', '최악이다', 'bad', 'terrible', 'annoying', 'disappointing', 'worst'],
      frustrated: ['안돼', '왜', '모르겠다', '어려워', '복잡해', "can't", 'why', "don't understand", 'difficult', 'complicated'],
      satisfied: ['고마워', '감사해', '도움됐어', '좋아', '완료', 'thanks', 'helpful', 'done', 'finished', 'appreciate'],
      excited: ['와', '대박', '신난다', '기대돼', '멋져', 'wow', 'awesome', 'excited', 'amazing', 'fantastic'],
      confused: ['뭐지', '어떻게', '이해안돼', '헷갈려', '모르겠어', 'what', 'how', "don't get it", 'confused', "don't know"]
    };
    
    // 성격 차원
    this.personalityDimensions = {
      technical: 0.5, // 기술적 vs 일반적
      formal: 0.5, // 격식적 vs 친근한
      detailed: 0.5, // 상세한 vs 간단한
      proactive: 0.5, // 적극적 vs 소극적
      creative: 0.5 // 창의적 vs 실용적
    };
    
    this.initializeMemorySystem();
  }

  async initializeMemorySystem() {
    try {
      logger.info('고급 메모리 시스템 초기화 중...');
      
      // 장기 메모리 로드
      await this.loadLongTermMemory();
      
      // 성격 프로필 로드
      await this.loadPersonalityProfiles();
      
      // 컨텍스트 그래프 로드
      await this.loadContextGraphs();
      
      // 메모리 통합 스케줄링
      this.scheduleMemoryConsolidation();
      
      // 감정 상태 모니터링 시작
      this.startEmotionalMonitoring();
      
      logger.info('고급 메모리 시스템 초기화 완료');
    } catch (error) {
      logger.error('메모리 시스템 초기화 실패:', error);
    }
  }

  /**
   * 대화 메모리 저장
   */
  async storeConversation(sessionId, userMessage, aiResponse, context = {}) {
    try {
      const timestamp = Date.now();
      const conversationEntry = {
        timestamp,
        userMessage,
        aiResponse,
        context,
        emotions: await this.analyzeEmotions(userMessage),
        intent: context.intent,
        satisfaction: context.satisfaction,
        topics: this.extractTopics(userMessage + ' ' + aiResponse),
        entities: this.extractEntities(userMessage),
        metadata: {
          messageLength: userMessage.length,
          responseTime: context.responseTime,
          successful: context.successful !== false
        }
      };

      // 단기 메모리에 저장
      await this.addToShortTermMemory(sessionId, conversationEntry);
      
      // 감정 상태 업데이트
      await this.updateEmotionalState(sessionId, conversationEntry.emotions);
      
      // 성격 프로필 업데이트
      await this.updatePersonalityProfile(sessionId, conversationEntry);
      
      // 컨텍스트 그래프 업데이트
      await this.updateContextGraph(sessionId, conversationEntry);
      
      // 장기 메모리 통합 검사
      await this.checkLongTermConsolidation(sessionId);

    } catch (error) {
      logger.error('대화 저장 실패:', error);
    }
  }

  /**
   * 컨텍스트 기반 메모리 검색
   */
  async retrieveRelevantMemories(sessionId, currentMessage, context = {}) {
    try {
      const relevantMemories = {
        recent: [],
        topical: [],
        emotional: [],
        personal: [],
        contextual: []
      };

      // 1. 최근 대화 메모리
      relevantMemories.recent = this.getRecentMemories(sessionId, 5);
      
      // 2. 주제별 관련 메모리
      relevantMemories.topical = await this.getTopicalMemories(sessionId, currentMessage);
      
      // 3. 감정적 맥락 메모리
      relevantMemories.emotional = await this.getEmotionalMemories(sessionId, currentMessage);
      
      // 4. 개인적 선호도 메모리
      relevantMemories.personal = await this.getPersonalMemories(sessionId);
      
      // 5. 컨텍스트 기반 메모리
      relevantMemories.contextual = await this.getContextualMemories(sessionId, context);

      return relevantMemories;

    } catch (error) {
      logger.error('메모리 검색 실패:', error);
      return this.getEmptyMemories();
    }
  }

  /**
   * 개인화된 응답 생성 지원
   */
  async generatePersonalizedContext(sessionId, currentMessage, context = {}) {
    try {
      const personalizedContext = {
        userProfile: await this.getUserProfile(sessionId),
        emotionalTone: await this.getEmotionalTone(sessionId),
        communicationStyle: await this.getCommunicationStyle(sessionId),
        preferences: await this.getUserPreferences(sessionId),
        historicalContext: await this.getHistoricalContext(sessionId, currentMessage),
        adaptationSuggestions: await this.getAdaptationSuggestions(sessionId)
      };

      return personalizedContext;

    } catch (error) {
      logger.error('개인화 컨텍스트 생성 실패:', error);
      return this.getDefaultPersonalizedContext();
    }
  }

  /**
   * 감정 분석
   */
  async analyzeEmotions(message) {
    const emotions = {
      primary: 'neutral',
      intensity: 0.5,
      confidence: 0.5,
      detected: []
    };

    let maxScore = 0;
    let primaryEmotion = 'neutral';

    // 각 감정별 점수 계산
    for (const [emotion, keywords] of Object.entries(this.emotionAnalyzer)) {
      let score = 0;
      const detectedKeywords = [];

      keywords.forEach(keyword => {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
          detectedKeywords.push(keyword);
        }
      });

      if (score > 0) {
        emotions.detected.push({
          emotion,
          score,
          keywords: detectedKeywords
        });

        if (score > maxScore) {
          maxScore = score;
          primaryEmotion = emotion;
        }
      }
    }

    emotions.primary = primaryEmotion;
    emotions.intensity = Math.min(maxScore / 3, 1.0);
    emotions.confidence = emotions.detected.length > 0 ? 0.7 : 0.3;

    // 문맥 기반 감정 조정
    emotions.intensity = this.adjustEmotionByContext(emotions, message);

    return emotions;
  }

  /**
   * 성격 프로필 업데이트
   */
  async updatePersonalityProfile(sessionId, conversationEntry) {
    let profile = this.personalityProfiles.get(sessionId) || {
      ...this.personalityDimensions,
      interactionCount: 0,
      lastUpdated: Date.now()
    };

    profile.interactionCount++;

    // 기술적 성향 분석
    const technicalKeywords = ['코드', '프로그래밍', '알고리즘', 'API', '데이터베이스', 'code', 'programming', 'algorithm'];
    if (technicalKeywords.some(kw => conversationEntry.userMessage.toLowerCase().includes(kw))) {
      profile.technical += this.config.personalityUpdateRate;
    }

    // 격식 수준 분석
    const formalIndicators = ['습니다', '하십시오', '부탁드립니다', 'please', 'could you', 'would you'];
    const informalIndicators = ['해줘', '좀', '야', 'hey', 'gonna', "don't"];
    
    if (formalIndicators.some(ind => conversationEntry.userMessage.includes(ind))) {
      profile.formal += this.config.personalityUpdateRate;
    } else if (informalIndicators.some(ind => conversationEntry.userMessage.includes(ind))) {
      profile.formal -= this.config.personalityUpdateRate;
    }

    // 상세함 선호도 분석
    if (conversationEntry.userMessage.length > 100) {
      profile.detailed += this.config.personalityUpdateRate;
    } else if (conversationEntry.userMessage.length < 20) {
      profile.detailed -= this.config.personalityUpdateRate;
    }

    // 적극성 분석
    const proactiveKeywords = ['빨리', '지금', '당장', '급해', 'quickly', 'now', 'urgent', 'fast'];
    if (proactiveKeywords.some(kw => conversationEntry.userMessage.toLowerCase().includes(kw))) {
      profile.proactive += this.config.personalityUpdateRate;
    }

    // 창의성 분석
    const creativeKeywords = ['새로운', '혁신적', '창의적', '독특한', 'creative', 'innovative', 'unique', 'new'];
    if (creativeKeywords.some(kw => conversationEntry.userMessage.toLowerCase().includes(kw))) {
      profile.creative += this.config.personalityUpdateRate;
    }

    // 값 정규화 (0-1 범위)
    Object.keys(this.personalityDimensions).forEach(key => {
      profile[key] = Math.max(0, Math.min(1, profile[key]));
    });

    profile.lastUpdated = Date.now();
    this.personalityProfiles.set(sessionId, profile);
  }

  /**
   * 감정 상태 업데이트
   */
  async updateEmotionalState(sessionId, emotions) {
    let emotionalState = this.emotionalStates.get(sessionId) || {
      currentEmotion: 'neutral',
      emotionHistory: [],
      moodTrend: 'stable',
      frustrationLevel: 0,
      satisfactionLevel: 0.5,
      lastUpdate: Date.now()
    };

    // 감정 히스토리 추가
    emotionalState.emotionHistory.push({
      emotion: emotions.primary,
      intensity: emotions.intensity,
      timestamp: Date.now()
    });

    // 히스토리 크기 제한
    if (emotionalState.emotionHistory.length > 20) {
      emotionalState.emotionHistory.shift();
    }

    // 현재 감정 업데이트
    emotionalState.currentEmotion = emotions.primary;

    // 좌절감 수준 업데이트
    if (emotions.primary === 'frustrated' || emotions.primary === 'negative') {
      emotionalState.frustrationLevel = Math.min(emotionalState.frustrationLevel + 0.2, 1.0);
    } else if (emotions.primary === 'satisfied' || emotions.primary === 'positive') {
      emotionalState.frustrationLevel = Math.max(emotionalState.frustrationLevel - 0.1, 0);
      emotionalState.satisfactionLevel = Math.min(emotionalState.satisfactionLevel + 0.1, 1.0);
    }

    // 자연적 감정 감소
    emotionalState.frustrationLevel *= this.config.emotionalDecayRate;
    
    // 기분 트렌드 분석
    emotionalState.moodTrend = this.analyzeMoodTrend(emotionalState.emotionHistory);

    emotionalState.lastUpdate = Date.now();
    this.emotionalStates.set(sessionId, emotionalState);
  }

  /**
   * 컨텍스트 그래프 업데이트
   */
  async updateContextGraph(sessionId, conversationEntry) {
    let contextGraph = this.contextGraphs.get(sessionId) || {
      nodes: new Map(), // 엔티티 노드
      edges: new Map(), // 관계 간선
      topics: new Map(), // 주제 클러스터
      lastUpdated: Date.now()
    };

    // 엔티티 노드 추가/업데이트
    conversationEntry.entities.forEach(entity => {
      if (contextGraph.nodes.has(entity.value)) {
        const node = contextGraph.nodes.get(entity.value);
        node.frequency++;
        node.lastMentioned = Date.now();
      } else {
        contextGraph.nodes.set(entity.value, {
          type: entity.type,
          value: entity.value,
          frequency: 1,
          firstMentioned: Date.now(),
          lastMentioned: Date.now(),
          contexts: []
        });
      }

      // 컨텍스트 정보 추가
      const node = contextGraph.nodes.get(entity.value);
      node.contexts.push({
        message: conversationEntry.userMessage.substring(0, 100),
        timestamp: Date.now(),
        intent: conversationEntry.intent
      });

      // 컨텍스트 크기 제한
      if (node.contexts.length > 5) {
        node.contexts.shift();
      }
    });

    // 주제 클러스터 업데이트
    conversationEntry.topics.forEach(topic => {
      if (contextGraph.topics.has(topic)) {
        const topicData = contextGraph.topics.get(topic);
        topicData.frequency++;
        topicData.lastDiscussed = Date.now();
      } else {
        contextGraph.topics.set(topic, {
          topic,
          frequency: 1,
          firstDiscussed: Date.now(),
          lastDiscussed: Date.now(),
          relatedEntities: []
        });
      }
    });

    // 엔티티 간 관계 생성
    this.createEntityRelations(contextGraph, conversationEntry);

    contextGraph.lastUpdated = Date.now();
    this.contextGraphs.set(sessionId, contextGraph);
  }

  /**
   * 단기 메모리에 추가
   */
  async addToShortTermMemory(sessionId, conversationEntry) {
    let memory = this.conversationMemory.get(sessionId) || [];
    memory.push(conversationEntry);

    // 윈도우 크기 제한
    if (memory.length > this.config.shortTermWindow) {
      // 오래된 항목 제거하되 중요한 항목은 보존
      const importantEntries = memory.filter(entry => 
        entry.metadata.successful && entry.emotions.intensity > 0.7
      );
      
      const recentEntries = memory.slice(-this.config.shortTermWindow + importantEntries.length);
      memory = [...importantEntries, ...recentEntries];
    }

    this.conversationMemory.set(sessionId, memory);
  }

  /**
   * 장기 메모리 통합 검사
   */
  async checkLongTermConsolidation(sessionId) {
    const shortTermMemory = this.conversationMemory.get(sessionId) || [];
    
    // 중요한 대화 식별
    const importantConversations = shortTermMemory.filter(entry => 
      entry.emotions.intensity > 0.7 || 
      entry.metadata.successful && entry.topics.length > 0
    );

    if (importantConversations.length >= this.config.longTermThreshold) {
      await this.consolidateToLongTerm(sessionId, importantConversations);
    }
  }

  /**
   * 장기 메모리로 통합
   */
  async consolidateToLongTerm(sessionId, conversations) {
    let longTerm = this.longTermMemory.get(sessionId) || {
      personalFacts: new Map(),
      preferences: new Map(),
      skillsAndKnowledge: new Map(),
      emotionalPatterns: new Map(),
      communicationStyle: {},
      importantConversations: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    // 개인적 사실 추출
    conversations.forEach(conv => {
      this.extractPersonalFacts(conv, longTerm.personalFacts);
      this.extractPreferences(conv, longTerm.preferences);
      this.extractSkillsAndKnowledge(conv, longTerm.skillsAndKnowledge);
    });

    // 감정 패턴 분석
    this.analyzeEmotionalPatterns(conversations, longTerm.emotionalPatterns);

    // 중요한 대화 보존
    const summaries = conversations.map(conv => ({
      timestamp: conv.timestamp,
      userMessage: conv.userMessage.substring(0, 200),
      topic: conv.topics[0] || 'general',
      emotion: conv.emotions.primary,
      successful: conv.metadata.successful
    }));

    longTerm.importantConversations.push(...summaries);

    // 크기 제한
    if (longTerm.importantConversations.length > 100) {
      longTerm.importantConversations = longTerm.importantConversations
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
    }

    longTerm.lastUpdated = Date.now();
    this.longTermMemory.set(sessionId, longTerm);
  }

  /**
   * 메모리 검색 메서드들
   */
  getRecentMemories(sessionId, count = 5) {
    const memory = this.conversationMemory.get(sessionId) || [];
    return memory.slice(-count);
  }

  async getTopicalMemories(sessionId, currentMessage) {
    const topics = this.extractTopics(currentMessage);
    const memory = this.conversationMemory.get(sessionId) || [];
    
    return memory.filter(entry => 
      entry.topics.some(topic => topics.includes(topic))
    ).slice(-5);
  }

  async getEmotionalMemories(sessionId, currentMessage) {
    const currentEmotion = await this.analyzeEmotions(currentMessage);
    const memory = this.conversationMemory.get(sessionId) || [];
    
    return memory.filter(entry => 
      entry.emotions.primary === currentEmotion.primary
    ).slice(-3);
  }

  async getPersonalMemories(sessionId) {
    const longTerm = this.longTermMemory.get(sessionId);
    if (!longTerm) return [];

    const personalMemories = [];
    
    // 선호도 기반 메모리
    for (const [key, value] of longTerm.preferences.entries()) {
      personalMemories.push({
        type: 'preference',
        key,
        value,
        relevance: 0.8
      });
    }

    return personalMemories.slice(0, 5);
  }

  async getContextualMemories(sessionId, context) {
    const contextGraph = this.contextGraphs.get(sessionId);
    if (!contextGraph) return [];

    const memories = [];
    
    // 현재 컨텍스트와 관련된 엔티티 찾기
    if (context.currentPath) {
      const pathNode = contextGraph.nodes.get(context.currentPath);
      if (pathNode) {
        memories.push(...pathNode.contexts);
      }
    }

    return memories.slice(0, 3);
  }

  /**
   * 사용자 프로필 생성
   */
  async getUserProfile(sessionId) {
    const personality = this.personalityProfiles.get(sessionId);
    const emotional = this.emotionalStates.get(sessionId);
    const longTerm = this.longTermMemory.get(sessionId);

    return {
      personality: personality || this.personalityDimensions,
      emotionalState: emotional?.currentEmotion || 'neutral',
      communicationPreferences: this.inferCommunicationPreferences(personality),
      interests: this.extractInterests(longTerm),
      expertise: this.extractExpertise(longTerm),
      interactionHistory: {
        totalConversations: personality?.interactionCount || 0,
        preferredTopics: this.getPreferredTopics(longTerm),
        averageSentiment: this.calculateAverageSentiment(emotional)
      }
    };
  }

  async getEmotionalTone(sessionId) {
    const emotional = this.emotionalStates.get(sessionId);
    if (!emotional) return 'neutral';

    return {
      primary: emotional.currentEmotion,
      intensity: this.calculateEmotionalIntensity(emotional),
      stability: this.calculateEmotionalStability(emotional),
      trend: emotional.moodTrend
    };
  }

  async getCommunicationStyle(sessionId) {
    const personality = this.personalityProfiles.get(sessionId);
    if (!personality) return this.getDefaultCommunicationStyle();

    return {
      formality: personality.formal > 0.6 ? 'formal' : 'casual',
      detail: personality.detailed > 0.6 ? 'detailed' : 'concise',
      technicality: personality.technical > 0.6 ? 'technical' : 'general',
      proactivity: personality.proactive > 0.6 ? 'proactive' : 'responsive',
      creativity: personality.creative > 0.6 ? 'creative' : 'practical'
    };
  }

  async getUserPreferences(sessionId) {
    const longTerm = this.longTermMemory.get(sessionId);
    if (!longTerm) return {};

    const preferences = {};
    for (const [key, data] of longTerm.preferences.entries()) {
      preferences[key] = data.value;
    }

    return preferences;
  }

  async getHistoricalContext(sessionId, currentMessage) {
    const topics = this.extractTopics(currentMessage);
    const longTerm = this.longTermMemory.get(sessionId);
    
    if (!longTerm) return {};

    return {
      relatedConversations: longTerm.importantConversations
        .filter(conv => topics.some(topic => conv.topic === topic))
        .slice(0, 3),
      previousExperience: this.findPreviousExperience(longTerm, topics),
      learnedPreferences: this.findRelatedPreferences(longTerm, topics)
    };
  }

  async getAdaptationSuggestions(sessionId) {
    const emotional = this.emotionalStates.get(sessionId);
    const personality = this.personalityProfiles.get(sessionId);
    
    const suggestions = [];

    if (emotional?.frustrationLevel > 0.7) {
      suggestions.push({
        type: 'emotion',
        suggestion: 'user_frustrated',
        action: 'be_more_supportive',
        priority: 'high'
      });
    }

    if (personality?.formal > 0.8) {
      suggestions.push({
        type: 'communication',
        suggestion: 'prefer_formal',
        action: 'use_formal_language',
        priority: 'medium'
      });
    }

    if (personality?.technical > 0.8) {
      suggestions.push({
        type: 'content',
        suggestion: 'technical_user',
        action: 'provide_technical_details',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * 유틸리티 메서드들
   */
  extractTopics(text) {
    const topics = [];
    
    // 간단한 키워드 기반 주제 추출
    const topicKeywords = {
      'file_management': ['파일', '폴더', '디렉토리', 'file', 'folder', 'directory'],
      'programming': ['코드', '프로그래밍', '개발', 'code', 'programming', 'development'],
      'data_analysis': ['데이터', '분석', '통계', 'data', 'analysis', 'statistics'],
      'system_admin': ['시스템', '서버', '관리', 'system', 'server', 'admin'],
      'security': ['보안', '암호', '인증', 'security', 'password', 'authentication']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  extractEntities(text) {
    const entities = [];
    
    // 파일 경로
    const pathPattern = /[A-Z]:\\[^\s<>:"|?*]+|\/[^\s<>:"|?*]+/g;
    const paths = text.match(pathPattern) || [];
    paths.forEach(path => {
      entities.push({ type: 'path', value: path });
    });

    // 파일 확장자
    const extPattern = /\.\w{2,4}\b/g;
    const extensions = text.match(extPattern) || [];
    extensions.forEach(ext => {
      entities.push({ type: 'extension', value: ext });
    });

    // 숫자 (크기, 개수 등)
    const numberPattern = /\d+(?:MB|GB|KB|개|번|시간|분)/g;
    const numbers = text.match(numberPattern) || [];
    numbers.forEach(num => {
      entities.push({ type: 'quantity', value: num });
    });

    return entities;
  }

  adjustEmotionByContext(emotions, message) {
    // 문장 길이에 따른 강도 조정
    let intensity = emotions.intensity;
    
    if (message.length > 100) {
      intensity *= 1.2; // 긴 메시지는 감정이 더 강할 수 있음
    }

    // 특수 문자에 따른 조정
    const exclamationCount = (message.match(/!/g) || []).length;
    const questionCount = (message.match(/\?/g) || []).length;
    
    intensity += exclamationCount * 0.1;
    intensity += questionCount * 0.05;

    return Math.min(intensity, 1.0);
  }

  analyzeMoodTrend(emotionHistory) {
    if (emotionHistory.length < 3) return 'stable';

    const recent = emotionHistory.slice(-3);
    const positiveEmotions = ['positive', 'satisfied', 'excited'];
    const negativeEmotions = ['negative', 'frustrated', 'confused'];

    let positiveCount = 0;
    let negativeCount = 0;

    recent.forEach(entry => {
      if (positiveEmotions.includes(entry.emotion)) positiveCount++;
      if (negativeEmotions.includes(entry.emotion)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'improving';
    if (negativeCount > positiveCount) return 'declining';
    return 'stable';
  }

  createEntityRelations(contextGraph, conversationEntry) {
    const entities = conversationEntry.entities;
    
    // 같은 대화에서 언급된 엔티티들 간의 관계 생성
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i].value;
        const entity2 = entities[j].value;
        const edgeKey = `${entity1}-${entity2}`;

        if (contextGraph.edges.has(edgeKey)) {
          const edge = contextGraph.edges.get(edgeKey);
          edge.weight++;
          edge.lastSeen = Date.now();
        } else {
          contextGraph.edges.set(edgeKey, {
            from: entity1,
            to: entity2,
            weight: 1,
            type: 'co_occurrence',
            firstSeen: Date.now(),
            lastSeen: Date.now()
          });
        }
      }
    }
  }

  extractPersonalFacts(conversation, personalFacts) {
    // 간단한 사실 추출 (실제로는 더 복잡한 NLP 필요)
    const factPatterns = [
      /나는 (.+)이다|I am (.+)/g,
      /내가 (.+)한다|I (.+)/g,
      /우리 (.+)는 (.+)이다|Our (.+) is (.+)/g
    ];

    factPatterns.forEach(pattern => {
      const matches = conversation.userMessage.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const key = `fact_${Date.now()}_${Math.random()}`;
          personalFacts.set(key, {
            fact: match,
            confidence: 0.7,
            timestamp: Date.now(),
            source: 'conversation'
          });
        });
      }
    });
  }

  extractPreferences(conversation, preferences) {
    // 선호도 추출
    const preferenceIndicators = [
      '좋아한다', '선호한다', '싫어한다', 'like', 'prefer', 'hate', 'love', 'dislike'
    ];

    preferenceIndicators.forEach(indicator => {
      if (conversation.userMessage.includes(indicator)) {
        const key = `preference_${indicator}`;
        const existing = preferences.get(key) || { count: 0, lastMentioned: 0 };
        existing.count++;
        existing.lastMentioned = Date.now();
        existing.value = indicator;
        preferences.set(key, existing);
      }
    });
  }

  extractSkillsAndKnowledge(conversation, skillsAndKnowledge) {
    // 기술과 지식 추출
    const skillIndicators = [
      '할 수 있다', '알고 있다', '경험이 있다', 'can do', 'know how', 'experienced'
    ];

    skillIndicators.forEach(indicator => {
      if (conversation.userMessage.includes(indicator)) {
        const skill = conversation.topics[0] || 'general';
        const existing = skillsAndKnowledge.get(skill) || { level: 0, mentions: 0 };
        existing.mentions++;
        existing.level = Math.min(existing.level + 0.1, 1.0);
        existing.lastMentioned = Date.now();
        skillsAndKnowledge.set(skill, existing);
      }
    });
  }

  analyzeEmotionalPatterns(conversations, emotionalPatterns) {
    const emotions = conversations.map(c => c.emotions.primary);
    const emotionCounts = {};

    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    for (const [emotion, count] of Object.entries(emotionCounts)) {
      const existing = emotionalPatterns.get(emotion) || { frequency: 0, trend: 'stable' };
      existing.frequency = count;
      existing.lastObserved = Date.now();
      emotionalPatterns.set(emotion, existing);
    }
  }

  // 헬퍼 메서드들
  inferCommunicationPreferences(personality) {
    if (!personality) return {};

    return {
      responseLength: personality.detailed > 0.6 ? 'detailed' : 'concise',
      technicalLevel: personality.technical > 0.6 ? 'high' : 'medium',
      formalityLevel: personality.formal > 0.6 ? 'formal' : 'casual'
    };
  }

  extractInterests(longTerm) {
    if (!longTerm) return [];

    const interests = [];
    for (const [topic, data] of longTerm.skillsAndKnowledge.entries()) {
      if (data.mentions > 2) {
        interests.push({
          topic,
          level: data.level,
          frequency: data.mentions
        });
      }
    }

    return interests.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }

  extractExpertise(longTerm) {
    if (!longTerm) return [];

    const expertise = [];
    for (const [skill, data] of longTerm.skillsAndKnowledge.entries()) {
      if (data.level > 0.7) {
        expertise.push({
          skill,
          level: data.level,
          confidence: Math.min(data.mentions / 10, 1.0)
        });
      }
    }

    return expertise;
  }

  getPreferredTopics(longTerm) {
    if (!longTerm) return [];

    const topicCounts = {};
    longTerm.importantConversations.forEach(conv => {
      topicCounts[conv.topic] = (topicCounts[conv.topic] || 0) + 1;
    });

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  calculateAverageSentiment(emotional) {
    if (!emotional || !emotional.emotionHistory.length) return 0.5;

    const sentimentScores = {
      positive: 0.8,
      satisfied: 0.7,
      excited: 0.9,
      neutral: 0.5,
      confused: 0.3,
      frustrated: 0.2,
      negative: 0.1
    };

    const totalScore = emotional.emotionHistory.reduce((sum, entry) => {
      return sum + (sentimentScores[entry.emotion] || 0.5);
    }, 0);

    return totalScore / emotional.emotionHistory.length;
  }

  calculateEmotionalIntensity(emotional) {
    if (!emotional || !emotional.emotionHistory.length) return 0.5;

    const recentEmotions = emotional.emotionHistory.slice(-5);
    const avgIntensity = recentEmotions.reduce((sum, entry) => sum + entry.intensity, 0) / recentEmotions.length;
    
    return avgIntensity;
  }

  calculateEmotionalStability(emotional) {
    if (!emotional || emotional.emotionHistory.length < 3) return 0.5;

    const recent = emotional.emotionHistory.slice(-5);
    const emotionVariance = this.calculateVariance(recent.map(e => e.intensity));
    
    return Math.max(0, 1 - emotionVariance);
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getDefaultCommunicationStyle() {
    return {
      formality: 'casual',
      detail: 'balanced',
      technicality: 'medium',
      proactivity: 'responsive',
      creativity: 'practical'
    };
  }

  findPreviousExperience(longTerm, topics) {
    const experiences = [];
    
    topics.forEach(topic => {
      const skill = longTerm.skillsAndKnowledge.get(topic);
      if (skill) {
        experiences.push({
          topic,
          level: skill.level,
          mentions: skill.mentions
        });
      }
    });

    return experiences;
  }

  findRelatedPreferences(longTerm, topics) {
    const relatedPrefs = {};
    
    for (const [key, pref] of longTerm.preferences.entries()) {
      if (topics.some(topic => key.includes(topic))) {
        relatedPrefs[key] = pref.value;
      }
    }

    return relatedPrefs;
  }

  getEmptyMemories() {
    return {
      recent: [],
      topical: [],
      emotional: [],
      personal: [],
      contextual: []
    };
  }

  getDefaultPersonalizedContext() {
    return {
      userProfile: {
        personality: this.personalityDimensions,
        emotionalState: 'neutral',
        communicationPreferences: this.getDefaultCommunicationStyle(),
        interests: [],
        expertise: [],
        interactionHistory: { totalConversations: 0, preferredTopics: [], averageSentiment: 0.5 }
      },
      emotionalTone: { primary: 'neutral', intensity: 0.5, stability: 0.5, trend: 'stable' },
      communicationStyle: this.getDefaultCommunicationStyle(),
      preferences: {},
      historicalContext: {},
      adaptationSuggestions: []
    };
  }

  // 메모리 관리 메서드들
  async loadLongTermMemory() {
    try {
      const memory = await this.cache.get('long-term-memory') || {};
      Object.entries(memory).forEach(([sessionId, data]) => {
        // Map 객체들 복원
        data.personalFacts = new Map(Object.entries(data.personalFacts || {}));
        data.preferences = new Map(Object.entries(data.preferences || {}));
        data.skillsAndKnowledge = new Map(Object.entries(data.skillsAndKnowledge || {}));
        data.emotionalPatterns = new Map(Object.entries(data.emotionalPatterns || {}));
        
        this.longTermMemory.set(sessionId, data);
      });
    } catch (error) {
      logger.warn('장기 메모리 로드 실패:', error);
    }
  }

  async loadPersonalityProfiles() {
    try {
      const profiles = await this.cache.get('personality-profiles') || {};
      Object.entries(profiles).forEach(([sessionId, profile]) => {
        this.personalityProfiles.set(sessionId, profile);
      });
    } catch (error) {
      logger.warn('성격 프로필 로드 실패:', error);
    }
  }

  async loadContextGraphs() {
    try {
      const graphs = await this.cache.get('context-graphs') || {};
      Object.entries(graphs).forEach(([sessionId, graph]) => {
        // Map 객체들 복원
        graph.nodes = new Map(Object.entries(graph.nodes || {}));
        graph.edges = new Map(Object.entries(graph.edges || {}));
        graph.topics = new Map(Object.entries(graph.topics || {}));
        
        this.contextGraphs.set(sessionId, graph);
      });
    } catch (error) {
      logger.warn('컨텍스트 그래프 로드 실패:', error);
    }
  }

  scheduleMemoryConsolidation() {
    setInterval(async () => {
      try {
        await this.performMemoryConsolidation();
      } catch (error) {
        logger.error('메모리 통합 실패:', error);
      }
    }, this.config.memoryConsolidationInterval);
  }

  async performMemoryConsolidation() {
    // 모든 세션의 메모리 통합
    for (const sessionId of this.conversationMemory.keys()) {
      await this.checkLongTermConsolidation(sessionId);
    }

    // 메모리 저장
    await this.saveMemoryToCache();
  }

  startEmotionalMonitoring() {
    setInterval(() => {
      // 감정 상태 자연 감소
      for (const [sessionId, emotional] of this.emotionalStates.entries()) {
        emotional.frustrationLevel *= this.config.emotionalDecayRate;
        this.emotionalStates.set(sessionId, emotional);
      }
    }, 60000); // 1분마다
  }

  async saveMemoryToCache() {
    try {
      // 장기 메모리 저장 (Map을 Object로 변환)
      const longTermObj = {};
      for (const [sessionId, data] of this.longTermMemory.entries()) {
        longTermObj[sessionId] = {
          ...data,
          personalFacts: Object.fromEntries(data.personalFacts.entries()),
          preferences: Object.fromEntries(data.preferences.entries()),
          skillsAndKnowledge: Object.fromEntries(data.skillsAndKnowledge.entries()),
          emotionalPatterns: Object.fromEntries(data.emotionalPatterns.entries())
        };
      }
      await this.cache.set('long-term-memory', longTermObj, 86400 * 90); // 90일

      // 성격 프로필 저장
      const profilesObj = Object.fromEntries(this.personalityProfiles.entries());
      await this.cache.set('personality-profiles', profilesObj, 86400 * 30); // 30일

      // 컨텍스트 그래프 저장
      const graphsObj = {};
      for (const [sessionId, graph] of this.contextGraphs.entries()) {
        graphsObj[sessionId] = {
          ...graph,
          nodes: Object.fromEntries(graph.nodes.entries()),
          edges: Object.fromEntries(graph.edges.entries()),
          topics: Object.fromEntries(graph.topics.entries())
        };
      }
      await this.cache.set('context-graphs', graphsObj, 86400 * this.config.contextRetentionDays);

    } catch (error) {
      logger.error('메모리 캐시 저장 실패:', error);
    }
  }
}

export default AdvancedMemorySystem;