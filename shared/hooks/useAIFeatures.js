import { useState, useCallback } from 'react';
import { 
  getAISummary, 
  getAIPlan, 
  analyzeFilesAI, 
  analyzeSearchResultsAI, 
  recommendOrganizationAI, 
  chatWithAI,
  analyzeDocument
} from '../utils/api';

export const useAIFeatures = () => {
  const [aiResult, setAiResult] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [contextAwareness, setContextAwareness] = useState({
    currentFolder: '',
    fileCount: 0,
    fileTypes: [],
    recentActivity: []
  });

  // AI 분석 요청
  const handleAIAnalysis = useCallback(async (file) => {
    setAiThinking(true);
    setAiResult(null);
    
    try {
      const summary = await getAISummary(file);
      setAiResult(summary);
      
      // 채팅 기록에 추가
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: `파일 "${file.name}"을 분석했습니다.\n\n${summary}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiResult('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiThinking(false);
    }
  }, []);

  // AI 채팅
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || aiThinking) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // 사용자 메시지 추가
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);

    setAiThinking(true);

    try {
      // 사용자 요청을 외부 AI API에 바로 전달
      // AI가 요청을 이해하고 필요한 백엔드 기능을 호출하도록 함
      const response = await chatWithAI(userMessage, {
        conversationHistory: chatHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.message
        })),
        // 컨텍스트 정보도 함께 전달
        context: {
          ...contextAwareness,
          availableTools: [
            'filesystem_search',
            'filesystem_read',
            'filesystem_analyze',
            'document_analysis',
            'file_operations'
          ]
        }
      });
      
      // AI 응답 처리 - AI가 이미 백엔드 기능을 호출하고 결과를 받아서 답변한 상태
      if (response && response.success && response.data) {
        const aiMessage = response.data.response?.[0]?.text || '응답을 생성할 수 없습니다.';
        
        // AI 응답 추가
        setChatHistory(prev => [...prev, {
          type: 'ai',
          message: aiMessage,
          timestamp: new Date()
        }]);

        // 응답에서 파일 작업 제안 추출
        const suggestions = extractSuggestionsFromResponse(aiMessage);
        if (suggestions.length > 0) {
          setAiSuggestions(suggestions);
        }
      } else {
        // 오류 응답 처리
        setChatHistory(prev => [...prev, {
          type: 'ai',
          message: '죄송합니다. 응답 생성 중 오류가 발생했습니다.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('AI chat failed:', error);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: '죄송합니다. 응답 생성 중 오류가 발생했습니다.',
        timestamp: new Date()
      }]);
    } finally {
      setAiThinking(false);
    }
  }, [chatInput, aiThinking, contextAwareness, chatHistory]);

  // 파일 그룹 AI 분석
  const analyzeFileGroup = useCallback(async (files) => {
    setAiThinking(true);
    try {
      const analysis = await analyzeFilesAI(files);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: analysis,
        timestamp: new Date()
      }]);
      return analysis;
    } catch (error) {
      console.error('File group analysis failed:', error);
      return null;
    } finally {
      setAiThinking(false);
    }
  }, []);

  // 검색 결과 AI 분석
  const analyzeSearchResults = useCallback(async (results, query) => {
    setAiThinking(true);
    try {
      const analysis = await analyzeSearchResultsAI(results, query);
      return analysis;
    } catch (error) {
      console.error('Search results analysis failed:', error);
      return null;
    } finally {
      setAiThinking(false);
    }
  }, []);

  // 파일 정리 추천
  const getOrganizationRecommendations = useCallback(async (files, currentPath) => {
    setAiThinking(true);
    try {
      const recommendations = await recommendOrganizationAI(files, currentPath);
      setAiSuggestions(recommendations.suggestions || []);
      return recommendations;
    } catch (error) {
      console.error('Organization recommendations failed:', error);
      return null;
    } finally {
      setAiThinking(false);
    }
  }, []);



  // AI 제안 실행
  const executeSuggestion = useCallback(async (suggestion) => {
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: `AI 제안 실행: ${suggestion.description}`,
      timestamp: new Date()
    }]);

    // 여기에 실제 제안 실행 로직 구현
    // suggestion.action에 따라 다른 동작 수행
    switch (suggestion.action) {
      case 'organize':
        // 파일 정리 로직
        break;
      case 'rename':
        // 파일 이름 변경 로직
        break;
      case 'move':
        // 파일 이동 로직
        break;
      case 'delete':
        // 파일 삭제 로직
        break;
      default:
        console.log('Unknown suggestion action:', suggestion.action);
    }
  }, []);

  // 컨텍스트 업데이트
  const updateContext = useCallback((updates) => {
    setContextAwareness(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // 채팅 기록 초기화
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setAiSuggestions([]);
    setAiResult(null);
  }, []);

  return {
    // State
    aiResult,
    chatInput,
    chatHistory,
    aiThinking,
    aiSuggestions,
    contextAwareness,
    
    // Actions
    setChatInput,
    handleAIAnalysis,
    handleSendChat,
    analyzeFileGroup,
    analyzeSearchResults,
    getOrganizationRecommendations,
    analyzeDocument,
    executeSuggestion,
    updateContext,
    clearChatHistory
  };
};

// 하드코딩된 답변 생성 함수들 제거
// generateEnhancedDocumentAnalysis, analyzeUserIntent, generatePDFAnalysis, 
// generateExcelAnalysis, generateWordAnalysis, generateHwpAnalysis, 
// generateGenericAnalysis, generateAdditionalInsights 함수들 삭제

// 파일 크기 포맷팅 (필요시 사용)
function formatFileSize(bytes) {
  if (!bytes) return '알 수 없음';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// 응답에서 제안 추출하는 헬퍼 함수
function extractSuggestionsFromResponse(response) {
  const suggestions = [];
  
  // 간단한 패턴 매칭으로 제안 추출
  const patterns = [
    { regex: /정리.*폴더/gi, action: 'organize', type: '폴더 정리' },
    { regex: /이름.*변경/gi, action: 'rename', type: '이름 변경' },
    { regex: /이동.*폴더/gi, action: 'move', type: '파일 이동' },
    { regex: /삭제.*파일/gi, action: 'delete', type: '파일 삭제' },
    { regex: /백업.*생성/gi, action: 'backup', type: '백업 생성' }
  ];

  patterns.forEach(({ regex, action, type }) => {
    if (regex.test(response)) {
      suggestions.push({
        id: Math.random().toString(36).substr(2, 9),
        action,
        type,
        description: `AI가 ${type}을(를) 제안했습니다`,
        confidence: 0.8
      });
    }
  });

  return suggestions;
}