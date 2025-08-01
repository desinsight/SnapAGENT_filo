import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { LocalCache } from '../utils/LocalCache.js';
import { AdvancedCommandParser } from './AdvancedCommandParser.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * OpenAI API 연동 서비스
 * 파일 관리와 일반 대화 모두 지원
 * @class OpenAIService
 */
export class OpenAIService {
  constructor() {
    this.client = null;
    this.config = null;
    this.cache = new LocalCache('openai-service');
    this.commandParser = new AdvancedCommandParser();
    
    // 대화 모드 설정
    this.conversationModes = {
      FILE_MANAGEMENT: 'file_management',
      GENERAL_CHAT: 'general_chat',
      MIXED: 'mixed'
    };
    
    // 시스템 프롬프트
    this.systemPrompts = {
      [this.conversationModes.FILE_MANAGEMENT]: `
당신은 전문적인 파일 관리 AI 어시스턴트입니다.

**주요 기능:**
- 파일/폴더 검색 및 분석
- 중복 파일 찾기 및 정리
- 파일 자동 분류 및 정리
- 디스크 사용량 분석
- 파일 이름 일괄 변경
- 폴더 구조 최적화
- 파일 내용 검색 및 요약

**응답 형식:**
사용자의 요청을 분석하여 다음과 같은 구조화된 응답을 제공하세요:

1. **이해한 내용**: 사용자가 요청한 내용을 정리
2. **실행 계획**: 구체적인 단계별 실행 방법
3. **주의사항**: 안전성 및 효율성 관련 주의사항
4. **추가 질문**: 더 정확한 결과를 위한 추가 정보 요청
5. **제안**: 관련된 추가 작업이나 최적화 방안

**파일 타입 인식:**
- 문서: PDF, Word, Excel, PowerPoint, 텍스트 파일
- 이미지: JPG, PNG, GIF, BMP, TIFF, WebP
- 비디오: MP4, AVI, MOV, WMV, FLV, MKV
- 오디오: MP3, WAV, FLAC, AAC, OGG
- 압축: ZIP, RAR, 7Z, TAR, GZ
- 코드: JavaScript, Python, Java, C++, HTML, CSS
- 3D/CAD: SKP, OBJ, FBX, DAE, 3DS, MAX, BLEND

**검색 조건:**
- 크기: 특정 크기 이상/이하 파일
- 날짜: 생성일, 수정일 기준
- 이름: 파일명 패턴 매칭
- 내용: 파일 내 텍스트 검색
- 태그: 사용자 정의 태그
- 중복: 동일한 내용의 파일
- 빈 파일: 크기가 0인 파일
- 숨김 파일: 시스템 숨김 파일

항상 안전하고 효율적인 방법을 제안하며, 한국어로 친근하게 대화합니다.
`,
      [this.conversationModes.GENERAL_CHAT]: `
당신은 도움이 되는 AI 어시스턴트입니다.
- 다양한 주제에 대해 자연스럽고 유익한 대화를 나눕니다
- 사용자의 질문에 정확하고 상세하게 답변합니다
- 친근하고 공감적인 톤으로 대화합니다
- 한국어로 자연스럽게 대화합니다
`,
      [this.conversationModes.MIXED]: `
당신은 파일 관리 전문가이면서 동시에 범용 AI 어시스턴트입니다.
- 파일 관리 요청이면 전문적으로 도움을 드립니다
- 일반적인 질문이면 친근하게 대화를 나눕니다
- 요청의 성격을 파악하여 적절한 모드로 응답합니다
- 한국어로 자연스럽게 대화합니다
`
    };
    
    // 대화 히스토리 관리
    this.conversationHistory = new Map(); // sessionId -> messages[]
    this.maxHistoryLength = 200; // 50에서 200으로 증가
    
    // 요청 제한 관리
    this.rateLimiter = {
      requests: new Map(), // userId -> [timestamps]
      maxRequestsPerMinute: 20,
      maxRequestsPerHour: 100
    };
    
    this.initialize();
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      logger.info('OpenAI 서비스 초기화 시작');
      
      // 설정 로드
      await this.loadConfig();
      
      // OpenAI 클라이언트 초기화
      if (this.config?.apiKey) {
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          timeout: 30000,
          maxRetries: 3
        });
        
        // API 연결 테스트
        await this.testConnection();
        
        logger.info('OpenAI 서비스 초기화 완료');
      } else {
        logger.warn('OpenAI API 키가 설정되지 않았습니다');
      }
    } catch (error) {
      logger.error('OpenAI 서비스 초기화 실패:', error);
      // 초기화 실패해도 서비스는 계속 실행 (로컬 모드)
    }
  }

  /**
   * 설정 로드
   * @private
   */
  async loadConfig() {
    try {
      // 환경변수에서 먼저 로드
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
      const temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
      
      if (apiKey) {
        this.config = {
          apiKey,
          model,
          maxTokens,
          temperature,
          enabled: true
        };
        
        logger.info('OpenAI 설정 로드 완료 (환경변수):', {
          model: this.config.model,
          enabled: this.config.enabled
        });
        return;
      }
      
      // 환경변수에 없으면 config.json에서 로드 (fallback)
      const configPath = path.join(process.cwd(), 'config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      this.config = {
        apiKey: config.ai?.openai?.apiKey,
        model: config.ai?.openai?.model || 'gpt-4o-mini',
        maxTokens: config.ai?.openai?.maxTokens || 2000,
        temperature: config.ai?.openai?.temperature || 0.7,
        enabled: !!config.ai?.openai?.apiKey
      };
      
      logger.info('OpenAI 설정 로드 완료 (config.json):', {
        model: this.config.model,
        enabled: this.config.enabled
      });
    } catch (error) {
      logger.error('OpenAI 설정 로드 실패:', error);
      this.config = { enabled: false };
    }
  }

  /**
   * API 연결 테스트
   * @private
   */
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: '안녕하세요' }],
        max_tokens: 10
      });
      
      if (response.choices && response.choices.length > 0) {
        logger.info('OpenAI API 연결 테스트 성공');
        return true;
      }
    } catch (error) {
      logger.error('OpenAI API 연결 테스트 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 관리 대화
   * @param {string} message - 사용자 메시지
   * @param {Object} context - 파일 시스템 컨텍스트
   * @param {string} sessionId - 세션 ID
   * @returns {Promise<Object>} 응답 결과
   */
  async chatFileManagement(message, context = {}, sessionId = 'default') {
    if (!this.config.enabled) {
      return this.getLocalFallbackResponse(message, 'file_management');
    }

    try {
      // 요청 제한 확인
      if (!this.checkRateLimit(sessionId)) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 명령 파싱
      const commandPlan = this.commandParser.parseCommand(message, context);
      
      // 시스템 프롬프트와 컨텍스트 구성
      const systemMessage = this.buildFileManagementPrompt(context, commandPlan);
      
      // 대화 히스토리 가져오기
      const history = this.getConversationHistory(sessionId);
      
      // 메시지 구성
      const messages = [
        { role: 'system', content: systemMessage },
        ...history,
        { role: 'user', content: message }
      ];

      // OpenAI API 호출
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      // 대화 히스토리 업데이트
      this.updateConversationHistory(sessionId, [
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]);

      // 응답 분석 및 액션 추출
      const analyzedResponse = this.analyzeResponse(aiResponse, message, context);

      return {
        success: true,
        response: aiResponse,
        mode: 'file_management',
        commandPlan: commandPlan,
        analysis: analyzedResponse,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('파일 관리 대화 실패:', error);
      return this.handleChatError(error, message, 'file_management');
    }
  }

  /**
   * 일반 대화
   * @param {string} message - 사용자 메시지
   * @param {string} sessionId - 세션 ID
   * @returns {Promise<Object>} 응답 결과
   */
  async chatGeneral(message, sessionId = 'default') {
    if (!this.config.enabled) {
      return this.getLocalFallbackResponse(message, 'general');
    }

    try {
      // 요청 제한 확인
      if (!this.checkRateLimit(sessionId)) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 대화 히스토리 가져오기
      const history = this.getConversationHistory(sessionId);
      
      // 메시지 구성
      const messages = [
        { role: 'system', content: this.systemPrompts[this.conversationModes.GENERAL_CHAT] },
        ...history,
        { role: 'user', content: message }
      ];

      // OpenAI API 호출
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature + 0.1, // 일반 대화는 좀 더 창의적으로
        presence_penalty: 0.2,
        frequency_penalty: 0.2
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      // 대화 히스토리 업데이트
      this.updateConversationHistory(sessionId, [
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]);

      return {
        success: true,
        response: aiResponse,
        mode: 'general_chat',
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('일반 대화 실패:', error);
      return this.handleChatError(error, message, 'general');
    }
  }

  /**
   * 혼합 모드 대화 (파일 관리 여부 자동 판단)
   * @param {string} message - 사용자 메시지
   * @param {Object} context - 파일 시스템 컨텍스트
   * @param {string} sessionId - 세션 ID
   * @returns {Promise<Object>} 응답 결과
   */
  async chatMixed(message, context = {}, sessionId = 'default') {
    try {
      // 메시지 의도 분석
      const intentAnalysis = this.analyzeMessageIntent(message);
      
      if (intentAnalysis.isFileManagement) {
        return await this.chatFileManagement(message, context, sessionId);
      } else {
        return await this.chatGeneral(message, sessionId);
      }
    } catch (error) {
      logger.error('혼합 모드 대화 실패:', error);
      return this.handleChatError(error, message, 'mixed');
    }
  }

  /**
   * 파일 관리 시스템 프롬프트 구성
   * @private
   */
  buildFileManagementPrompt(context, commandPlan) {
    let prompt = this.systemPrompts[this.conversationModes.FILE_MANAGEMENT];
    
    // 현재 컨텍스트 정보 추가
    if (context.currentPath) {
      prompt += `\n현재 위치: ${context.currentPath}`;
    }
    
    if (context.selectedFiles && context.selectedFiles.length > 0) {
      prompt += `\n선택된 파일: ${context.selectedFiles.length}개`;
    }
    
    if (context.analysisResults) {
      prompt += `\n분석 정보: 총 ${context.analysisResults.totalFiles}개 파일`;
    }
    
    // 파싱된 명령 플랜 정보 추가
    if (commandPlan) {
      prompt += `\n\n**파싱된 명령 정보:**
- 원본 명령: ${commandPlan.originalCommand}
- 추출된 액션: ${commandPlan.action}
- 신뢰도: ${Math.round(commandPlan.confidence * 100)}%
- 확인 필요: ${commandPlan.needsConfirmation ? '예' : '아니오'}

- 대상 파일 타입: ${commandPlan.targets.map(t => t.value).join(', ') || '없음'}
- 검색 조건: ${Object.keys(commandPlan.conditions).join(', ') || '없음'}
- 제안 쿼리: ${commandPlan.suggestedQueries.join(', ') || '없음'}

이 정보를 참고하여 사용자에게 더 정확하고 구체적인 도움을 제공하세요.`;
    }
    
    // 가능한 액션들 명시
    prompt += `
    
가능한 파일 관리 작업:
- 파일/폴더 검색
- 중복 파일 찾기 및 정리
- 파일 자동 분류 및 정리
- 디스크 사용량 분석
- 파일 이름 일괄 변경
- 폴더 구조 최적화

응답할 때는 구체적인 실행 방법과 주의사항을 포함해주세요.`;
    
    return prompt;
  }

  /**
   * 메시지 의도 분석
   * @private
   */
  analyzeMessageIntent(message) {
    const fileManagementKeywords = [
      '파일', '폴더', '디렉토리', '검색', '찾기', '정리', '분류', '삭제', '이동', '복사',
      '중복', '용량', '크기', '분석', '정돈', '백업', '압축', '해제', '이름변경',
      'file', 'folder', 'directory', 'search', 'find', 'organize', 'clean', 'duplicate'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasFileKeywords = fileManagementKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // 파일 경로 패턴 확인
    const hasFilePath = /[a-zA-Z]:\\|\/[a-zA-Z]|\.\/|\.\\/.test(message);
    
    // 파일 확장자 패턴 확인
    const hasFileExtension = /\.(txt|pdf|jpg|png|mp4|doc|xls|zip|rar)/i.test(message);
    
    return {
      isFileManagement: hasFileKeywords || hasFilePath || hasFileExtension,
      confidence: hasFileKeywords ? 0.8 : (hasFilePath || hasFileExtension ? 0.6 : 0.2),
      keywords: fileManagementKeywords.filter(keyword => lowerMessage.includes(keyword))
    };
  }

  /**
   * 응답 분석 및 액션 추출
   * @private
   */
  analyzeResponse(response, userMessage, context) {
    const analysis = {
      suggestedActions: [],
      extractedPaths: [],
      confidence: 0.5,
      needsConfirmation: false
    };
    
    // 제안된 액션 추출
    const actionPatterns = [
      /검색해?보세요|찾아보세요/g,
      /정리해?보세요|분류해?보세요/g,
      /삭제해?보세요|제거해?보세요/g,
      /분석해?보세요|확인해?보세요/g
    ];
    
    actionPatterns.forEach(pattern => {
      if (pattern.test(response)) {
        analysis.suggestedActions.push(pattern.source);
      }
    });
    
    // 파일 경로 추출
    const pathPattern = /[a-zA-Z]:\\[^\\/:*?"<>|]+(?:\\[^\\/:*?"<>|]+)*|\/[^\/\s]+(?:\/[^\/\s]+)*/g;
    const paths = response.match(pathPattern) || [];
    analysis.extractedPaths = paths;
    
    // 확인 필요 여부 판단
    const confirmationKeywords = ['삭제', '제거', '이동', '변경', '수정'];
    analysis.needsConfirmation = confirmationKeywords.some(keyword => 
      response.includes(keyword)
    );
    
    return analysis;
  }

  /**
   * 대화 히스토리 관리
   * @private
   */
  getConversationHistory(sessionId) {
    const history = this.conversationHistory.get(sessionId) || [];
    // 최근 히스토리만 반환 (토큰 제한 고려)
    return history.slice(-10);
  }

  updateConversationHistory(sessionId, newMessages) {
    const history = this.conversationHistory.get(sessionId) || [];
    history.push(...newMessages);
    
    // 길이 제한
    if (history.length > this.maxHistoryLength) {
      history.splice(0, history.length - this.maxHistoryLength);
    }
    
    this.conversationHistory.set(sessionId, history);
  }

  /**
   * 요청 제한 확인
   * @private
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = this.rateLimiter.requests.get(userId) || [];
    
    // 1분 이내 요청 확인
    const recentRequests = userRequests.filter(timestamp => 
      now - timestamp < 60 * 1000
    );
    
    if (recentRequests.length >= this.rateLimiter.maxRequestsPerMinute) {
      return false;
    }
    
    // 1시간 이내 요청 확인
    const hourlyRequests = userRequests.filter(timestamp => 
      now - timestamp < 60 * 60 * 1000
    );
    
    if (hourlyRequests.length >= this.rateLimiter.maxRequestsPerHour) {
      return false;
    }
    
    // 새 요청 기록
    userRequests.push(now);
    this.rateLimiter.requests.set(userId, userRequests);
    
    return true;
  }

  /**
   * 로컬 대체 응답
   * @private
   */
  getLocalFallbackResponse(message, mode) {
    const responses = {
      file_management: {
        search: '로컬 검색 기능을 사용하여 파일을 찾아보세요.',
        organize: '파일 자동 정리 기능을 실행해보세요.',
        analyze: '디스크 분석 도구로 용량을 확인해보세요.',
        default: '파일 관리 기능을 이용해주세요. OpenAI API가 설정되지 않아 고급 AI 기능은 사용할 수 없습니다.'
      },
      general: {
        default: '죄송합니다. OpenAI API가 설정되지 않아 일반 대화 기능을 사용할 수 없습니다. 파일 관리 관련 질문만 도움드릴 수 있습니다.'
      }
    };
    
    const modeResponses = responses[mode] || responses.general;
    
    // 키워드 기반 응답 선택
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('검색') || lowerMessage.includes('찾')) {
      return { success: true, response: modeResponses.search || modeResponses.default, mode: 'local' };
    } else if (lowerMessage.includes('정리') || lowerMessage.includes('분류')) {
      return { success: true, response: modeResponses.organize || modeResponses.default, mode: 'local' };
    } else if (lowerMessage.includes('분석') || lowerMessage.includes('용량')) {
      return { success: true, response: modeResponses.analyze || modeResponses.default, mode: 'local' };
    }
    
    return { success: true, response: modeResponses.default, mode: 'local' };
  }

  /**
   * 대화 에러 처리
   * @private
   */
  handleChatError(error, message, mode) {
    logger.error('OpenAI 대화 에러:', error);
    
    let userMessage = '죄송합니다. 일시적인 문제가 발생했습니다.';
    
    if (error.message.includes('rate limit')) {
      userMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('API key')) {
      userMessage = 'API 키 설정에 문제가 있습니다.';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      userMessage = '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    }
    
    // 로컬 대체 응답 시도
    const fallbackResponse = this.getLocalFallbackResponse(message, mode);
    
    return {
      success: false,
      error: error.message,
      userMessage,
      fallback: fallbackResponse,
      mode: mode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 대화 히스토리 클리어
   */
  clearConversationHistory(sessionId) {
    if (sessionId) {
      this.conversationHistory.delete(sessionId);
    } else {
      this.conversationHistory.clear();
    }
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      model: this.config.model,
      activeConversations: this.conversationHistory.size,
      totalRequests: Array.from(this.rateLimiter.requests.values())
        .reduce((total, requests) => total + requests.length, 0)
    };
  }

  /**
   * 설정 업데이트
   */
  async updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      
      if (newConfig.apiKey) {
        this.client = new OpenAI({
          apiKey: newConfig.apiKey,
          timeout: 30000,
          maxRetries: 3
        });
        
        await this.testConnection();
      }
      
      logger.info('OpenAI 설정 업데이트 완료');
      return true;
    } catch (error) {
      logger.error('OpenAI 설정 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 파일 분석 및 요약
   * @param {Array} files - 분석할 파일 목록
   * @param {string} analysisType - 분석 타입
   * @param {Object} context - 컨텍스트
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeFiles(files, analysisType, context = {}) {
    if (!this.config.enabled) {
      return this.getLocalFallbackResponse('파일 분석', 'analysis');
    }

    try {
      // 요청 제한 확인
      if (!this.checkRateLimit('analysis')) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      const systemPrompt = this.buildAnalysisPrompt(analysisType, context);
      const userPrompt = this.buildFileAnalysisPrompt(files, analysisType);

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.3, // 분석은 정확성 중시
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      return {
        success: true,
        analysis: aiResponse,
        type: analysisType,
        fileCount: files.length,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('파일 분석 실패:', error);
      return this.handleChatError(error, '파일 분석', 'analysis');
    }
  }

  /**
   * 검색 결과 분석
   * @param {Array} searchResults - 검색 결과
   * @param {string} query - 검색 쿼리
   * @param {Object} context - 컨텍스트
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeSearchResults(searchResults, query, context = {}) {
    if (!this.config.enabled) {
      return this.getLocalFallbackResponse('검색 결과 분석', 'analysis');
    }

    try {
      // 요청 제한 확인
      if (!this.checkRateLimit('analysis')) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      const systemPrompt = `
당신은 검색 결과 분석 전문가입니다.
검색 결과를 분석하여 다음과 같은 정보를 제공하세요:

1. **검색 결과 요약**: 발견된 파일들의 주요 특징
2. **관련성 분석**: 검색어와 결과의 관련성 평가
3. **패턴 발견**: 파일들 간의 공통점이나 패턴
4. **추가 검색 제안**: 더 정확한 결과를 위한 검색어 제안
5. **정리 제안**: 발견된 파일들의 효율적인 정리 방법

한국어로 친근하고 구체적으로 답변해주세요.
`;

      const userPrompt = `
검색어: "${query}"
검색 결과: ${searchResults.length}개 파일

파일 목록:
${searchResults.map((file, index) => 
  `${index + 1}. ${file.name || file.path} (${file.size ? this.formatFileSize(file.size) : '크기 정보 없음'})`
).join('\n')}

이 검색 결과를 분석해주세요.
`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      return {
        success: true,
        analysis: aiResponse,
        query: query,
        resultCount: searchResults.length,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('검색 결과 분석 실패:', error);
      return this.handleChatError(error, '검색 결과 분석', 'analysis');
    }
  }

  /**
   * 파일 정리 추천
   * @param {Array} files - 파일 목록
   * @param {string} currentPath - 현재 경로
   * @param {Object} preferences - 사용자 선호도
   * @returns {Promise<Object>} 추천 결과
   */
  async recommendOrganization(files, currentPath, preferences = {}) {
    if (!this.config.enabled) {
      return this.getLocalFallbackResponse('파일 정리 추천', 'organization');
    }

    try {
      // 요청 제한 확인
      if (!this.checkRateLimit('organization')) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      const systemPrompt = `
당신은 파일 정리 및 조직화 전문가입니다.
주어진 파일들을 분석하여 효율적인 정리 방안을 제시하세요:

1. **분류 기준**: 파일 타입, 용도, 날짜 등에 따른 분류
2. **폴더 구조**: 논리적이고 직관적인 폴더 구조 제안
3. **이름 규칙**: 일관된 파일명 규칙 제안
4. **중복 처리**: 중복 파일 처리 방안
5. **백업 전략**: 중요한 파일들의 백업 방법

사용자의 선호도를 고려하여 실용적이고 실행 가능한 방안을 제시하세요.
한국어로 친근하고 구체적으로 답변해주세요.
`;

      const userPrompt = `
현재 경로: ${currentPath}
파일 개수: ${files.length}개

파일 목록:
${files.map((file, index) => 
  `${index + 1}. ${file.name || file.path} (${file.size ? this.formatFileSize(file.size) : '크기 정보 없음'})`
).join('\n')}

사용자 선호도:
${Object.entries(preferences).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '선호도 정보 없음'}

이 파일들을 효율적으로 정리하는 방법을 추천해주세요.
`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.4,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      return {
        success: true,
        recommendation: aiResponse,
        fileCount: files.length,
        currentPath: currentPath,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('파일 정리 추천 실패:', error);
      return this.handleChatError(error, '파일 정리 추천', 'organization');
    }
  }

  /**
   * 분석 프롬프트 구성
   * @private
   */
  buildAnalysisPrompt(analysisType, context) {
    const prompts = {
      summary: `
당신은 파일 분석 전문가입니다.
주어진 파일들을 분석하여 간결하고 유용한 요약을 제공하세요:

1. **파일 유형 분포**: 주요 파일 타입과 개수
2. **크기 분석**: 전체 용량과 파일 크기 분포
3. **날짜 패턴**: 생성/수정 날짜 패턴
4. **주요 특징**: 특이사항이나 주목할 점
5. **정리 제안**: 효율적인 정리 방안

한국어로 친근하고 구체적으로 답변해주세요.
`,
      classification: `
당신은 파일 분류 전문가입니다.
주어진 파일들을 논리적이고 효율적으로 분류하는 방안을 제시하세요:

1. **분류 기준**: 파일 타입, 용도, 프로젝트 등
2. **카테고리 제안**: 주요 카테고리와 하위 분류
3. **폴더 구조**: 계층적 폴더 구조 제안
4. **이름 규칙**: 일관된 명명 규칙
5. **자동화 방안**: 자동 분류 가능성

실용적이고 실행 가능한 분류 방안을 제시하세요.
`,
      recommendation: `
당신은 파일 관리 전문가입니다.
주어진 파일들을 분석하여 개선 방안을 제시하세요:

1. **현재 상태 평가**: 파일 관리의 장단점
2. **개선 방안**: 효율성 향상 방안
3. **도구 추천**: 유용한 파일 관리 도구
4. **습관 개선**: 좋은 파일 관리 습관
5. **자동화**: 반복 작업 자동화 방안

구체적이고 실행 가능한 제안을 해주세요.
`,
      duplicate: `
당신은 중복 파일 관리 전문가입니다.
중복 파일들을 분석하여 처리 방안을 제시하세요:

1. **중복 유형**: 완전 중복, 이름만 다른 중복 등
2. **위험도 평가**: 삭제 시 주의사항
3. **처리 방안**: 안전한 중복 제거 방법
4. **백업 전략**: 삭제 전 백업 방안
5. **재발 방지**: 향후 중복 방지 방법

안전하고 효율적인 중복 파일 처리를 도와주세요.
`,
      optimization: `
당신은 파일 시스템 최적화 전문가입니다.
파일 시스템을 분석하여 최적화 방안을 제시하세요:

1. **성능 분석**: 현재 시스템의 성능 병목
2. **공간 최적화**: 디스크 공간 효율화
3. **접근 최적화**: 파일 접근 속도 개선
4. **구조 개선**: 폴더 구조 최적화
5. **유지보수**: 지속적인 최적화 방안

시스템 성능과 사용성을 모두 고려한 최적화 방안을 제시하세요.
`
    };

    return prompts[analysisType] || prompts.summary;
  }

  /**
   * 파일 분석 프롬프트 구성
   * @private
   */
  buildFileAnalysisPrompt(files, analysisType) {
    const fileInfo = files.map((file, index) => 
      `${index + 1}. ${file.name || file.path} (${file.size ? this.formatFileSize(file.size) : '크기 정보 없음'})`
    ).join('\n');

    return `
분석 타입: ${analysisType}
파일 개수: ${files.length}개

파일 목록:
${fileInfo}

위 파일들을 분석해주세요.
`;
  }

  /**
   * 파일 크기 포맷팅
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default OpenAIService;