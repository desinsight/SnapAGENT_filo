import express from 'express';
import { OpenAIService } from '../../../mcp-server/src/ai-copilot/OpenAIService.js';
import { logger } from '../../../mcp-server/src/utils/logger.js';

const router = express.Router();

// OpenAI 서비스 인스턴스
let openaiService = null;

// 서비스 초기화
async function initializeService() {
  if (!openaiService) {
    try {
      openaiService = new OpenAIService();
      await openaiService.initialize();
      logger.info('OpenAI 서비스 API 라우트 초기화 완료');
    } catch (error) {
      logger.error('OpenAI 서비스 API 라우트 초기화 실패:', error);
    }
  }
  return openaiService;
}

// 미들웨어: 서비스 초기화 확인
async function ensureServiceInitialized(req, res, next) {
  try {
    await initializeService();
    if (!openaiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 서비스를 초기화할 수 없습니다'
      });
    }
    next();
  } catch (error) {
    logger.error('서비스 초기화 미들웨어 에러:', error);
    res.status(500).json({
      success: false,
      error: '서비스 초기화 실패'
    });
  }
}

/**
 * AI 서비스 상태 확인
 * GET /api/ai/status
 */
router.get('/status', async (req, res) => {
  try {
    await initializeService();
    
    const status = openaiService ? openaiService.getStatus() : {
      enabled: false,
      model: null,
      activeConversations: 0,
      totalRequests: 0
    };
    
    res.json({
      success: true,
      openai: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 일반 대화
 * POST /api/ai/chat/general
 */
router.post('/chat/general', ensureServiceInitialized, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다'
      });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: '메시지가 너무 깁니다 (최대 2000자)'
      });
    }
    
    const result = await openaiService.chatGeneral(
      message,
      sessionId || 'anonymous'
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('일반 대화 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '대화 처리 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * 파일 관리 대화
 * POST /api/ai/chat/file-management
 */
router.post('/chat/file-management', ensureServiceInitialized, async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다'
      });
    }
    
    const result = await openaiService.chatFileManagement(
      message,
      context || {},
      sessionId || 'anonymous'
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('파일 관리 대화 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '파일 관리 대화 처리 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * 혼합 모드 대화
 * POST /api/ai/chat/mixed
 */
router.post('/chat/mixed', ensureServiceInitialized, async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다'
      });
    }
    
    const result = await openaiService.chatMixed(
      message,
      context || {},
      sessionId || 'anonymous'
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('혼합 모드 대화 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '대화 처리 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * 대화 히스토리 클리어
 * DELETE /api/ai/chat/history
 */
router.delete('/chat/history', ensureServiceInitialized, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    openaiService.clearConversationHistory(sessionId);
    
    res.json({
      success: true,
      message: '대화 히스토리가 삭제되었습니다'
    });
    
  } catch (error) {
    logger.error('대화 히스토리 삭제 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '히스토리 삭제 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * AI 설정 업데이트
 * PUT /api/ai/config
 */
router.put('/config', ensureServiceInitialized, async (req, res) => {
  try {
    const { apiKey, model, maxTokens, temperature } = req.body;
    
    // 입력 검증
    if (apiKey && typeof apiKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'API 키는 문자열이어야 합니다'
      });
    }
    
    if (model && typeof model !== 'string') {
      return res.status(400).json({
        success: false,
        error: '모델명은 문자열이어야 합니다'
      });
    }
    
    if (maxTokens && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4000)) {
      return res.status(400).json({
        success: false,
        error: 'maxTokens는 1~4000 사이의 숫자여야 합니다'
      });
    }
    
    if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return res.status(400).json({
        success: false,
        error: 'temperature는 0~2 사이의 숫자여야 합니다'
      });
    }
    
    const updateConfig = {};
    if (apiKey) updateConfig.apiKey = apiKey;
    if (model) updateConfig.model = model;
    if (maxTokens) updateConfig.maxTokens = maxTokens;
    if (temperature !== undefined) updateConfig.temperature = temperature;
    
    const success = await openaiService.updateConfig(updateConfig);
    
    if (success) {
      res.json({
        success: true,
        message: 'AI 설정이 업데이트되었습니다'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '설정 업데이트에 실패했습니다'
      });
    }
    
  } catch (error) {
    logger.error('AI 설정 업데이트 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * 대화 통계
 * GET /api/ai/stats
 */
router.get('/stats', ensureServiceInitialized, async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    const status = openaiService.getStatus();
    
    // 기본 통계
    const stats = {
      totalConversations: status.activeConversations,
      totalRequests: status.totalRequests,
      modelUsed: status.model,
      enabled: status.enabled
    };
    
    // 세션별 통계가 필요한 경우
    if (sessionId) {
      const conversationHistory = openaiService.conversationHistory.get(sessionId) || [];
      stats.sessionStats = {
        messageCount: conversationHistory.length,
        lastActivity: conversationHistory.length > 0 ? 
          conversationHistory[conversationHistory.length - 1].timestamp : null
      };
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('대화 통계 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * 대화 제안 생성
 * POST /api/ai/suggestions
 */
router.post('/suggestions', ensureServiceInitialized, async (req, res) => {
  try {
    const { context, mode } = req.body;
    
    let suggestions = [];
    
    if (mode === 'general_chat') {
      suggestions = [
        '안녕하세요! 오늘 기분은 어떠세요?',
        '재미있는 이야기를 들려주세요',
        '오늘 날씨는 어떤가요?',
        '추천해주고 싶은 영화나 책이 있나요?',
        '프로그래밍에 대해 궁금한 것이 있어요'
      ];
    } else if (mode === 'file_management') {
      suggestions = [
        'PDF 파일을 찾아주세요',
        '중복 파일을 정리해주세요',
        '디스크 사용량을 분석해주세요',
        '큰 파일들을 찾아주세요',
        '최근 파일들을 보여주세요'
      ];
      
      // 컨텍스트 기반 제안 추가
      if (context?.selectedFiles?.length > 0) {
        suggestions.unshift('선택된 파일들을 정리해주세요');
      }
      
      if (context?.currentPath) {
        suggestions.unshift(`${context.currentPath} 폴더를 분석해주세요`);
      }
    } else {
      // mixed 모드
      suggestions = [
        '파일 관리: PDF 파일 찾아줘',
        '일반 대화: 안녕하세요!',
        '파일 관리: 중복 파일 정리해줘',
        '일반 대화: 오늘 날씨는?',
        '파일 관리: 용량 분석해줘'
      ];
    }
    
    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5), // 최대 5개
      mode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('제안 생성 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '제안 생성 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * AI 파일 분석 및 요약
 * POST /api/ai/analyze-files
 */
router.post('/analyze-files', ensureServiceInitialized, async (req, res) => {
  try {
    const { files, analysisType, context } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '분석할 파일 목록이 필요합니다'
      });
    }
    
    if (!analysisType || !['summary', 'classification', 'recommendation', 'duplicate', 'optimization'].includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: '유효한 분석 타입이 필요합니다 (summary, classification, recommendation, duplicate, optimization)'
      });
    }
    
    const result = await openaiService.analyzeFiles(
      files,
      analysisType,
      context || {}
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('AI 파일 분석 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '파일 분석 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * AI 검색 결과 분석
 * POST /api/ai/analyze-search-results
 */
router.post('/analyze-search-results', ensureServiceInitialized, async (req, res) => {
  try {
    const { searchResults, query, context } = req.body;
    
    if (!searchResults || !Array.isArray(searchResults)) {
      return res.status(400).json({
        success: false,
        error: '검색 결과가 필요합니다'
      });
    }
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다'
      });
    }
    
    const result = await openaiService.analyzeSearchResults(
      searchResults,
      query,
      context || {}
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('AI 검색 결과 분석 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '검색 결과 분석 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

/**
 * AI 파일 정리 추천
 * POST /api/ai/recommend-organization
 */
router.post('/recommend-organization', ensureServiceInitialized, async (req, res) => {
  try {
    const { files, currentPath, preferences } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: '파일 목록이 필요합니다'
      });
    }
    
    const result = await openaiService.recommendOrganization(
      files,
      currentPath || '.',
      preferences || {}
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('AI 파일 정리 추천 API 에러:', error);
    res.status(500).json({
      success: false,
      error: '파일 정리 추천 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 에러 핸들링 미들웨어
router.use((error, req, res, next) => {
  logger.error('AI API 라우트 에러:', error);
  
  res.status(500).json({
    success: false,
    error: 'AI 서비스 오류가 발생했습니다',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;