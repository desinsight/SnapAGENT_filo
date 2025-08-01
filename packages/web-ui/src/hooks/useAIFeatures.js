import { useState, useCallback } from 'react';
import { 
  getAISummary, 
  getAIPlan, 
  analyzeFilesAI, 
  analyzeSearchResultsAI, 
  recommendOrganizationAI, 
  chatWithAI 
} from '../utils/api';

export const useAIFeatures = (onUIFilterApply = null) => {
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
      // 컨텍스트 정보 포함하여 AI에 전송
      const context = {
        ...contextAwareness,
        currentMessage: userMessage
      };
      
      const response = await chatWithAI(userMessage, context);
      
      console.log('🤖 AI 응답 받음:', response);
      
      // AI 응답 추가 (응답이 객체인 경우 텍스트로 변환)
      const aiMessage = typeof response === 'string' ? response : 
                       response.message || response.content || JSON.stringify(response);
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: aiMessage,
        timestamp: new Date()
      }]);

      // 응답에서 파일 작업 제안 추출
      const suggestions = extractSuggestionsFromResponse(response);
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
      }

      // UI 필터 정보 추출 및 처리
      const uiFilterInfo = extractUIFilterFromResponse(response);
      console.log('🎯 추출된 UI 필터 정보:', uiFilterInfo);
      
      if (uiFilterInfo) {
        console.log('✅ UI 필터 적용 시작:', uiFilterInfo);
        // UI 필터 적용을 위한 콜백 호출
        if (onUIFilterApply) {
          onUIFilterApply(uiFilterInfo);
        }
      } else {
        console.log('❌ UI 필터 정보 없음');
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
  }, [chatInput, aiThinking, contextAwareness, onUIFilterApply]);

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
    executeSuggestion,
    updateContext,
    clearChatHistory
  };
};

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

// AI 응답에서 UI 필터 정보 추출하는 헬퍼 함수
function extractUIFilterFromResponse(response) {
  try {
    console.log('🔍 UI 필터 추출 시작:', response);
    
    // response가 문자열인 경우 JSON 파싱 시도
    let responseData = response;
    if (typeof response === 'string') {
      try {
        responseData = JSON.parse(response);
      } catch (e) {
        console.log('📝 JSON 파싱 실패, 문자열 그대로 사용');
        return null;
      }
    }

    console.log('📊 파싱된 응답 데이터:', responseData);

    // 새로운 응답 구조에서 UI 필터 정보 추출
    if (responseData && responseData.data && responseData.data.uiFilter) {
      const uiFilter = responseData.data.uiFilter;
      console.log('🎯 UI 필터 발견:', uiFilter);
      
      if (uiFilter.type === 'file_search' && uiFilter.extension) {
        return {
          type: 'extension',
          extension: uiFilter.extension,
          searchPaths: uiFilter.searchPaths,
          files: uiFilter.files,
          totalFound: uiFilter.totalCount,
          action: uiFilter.action
        };
      }
    }

    // Tool 실행 결과에서 UI 필터 정보 추출 (기존 구조)
    if (responseData && responseData.tool_result && responseData.tool_result.result) {
      const toolResult = responseData.tool_result.result;
      console.log('🔧 Tool 결과 발견:', toolResult);
      
      // 확장자 검색 결과인지 확인
      if (toolResult.data && toolResult.data.extension) {
        return {
          type: 'extension',
          extension: toolResult.data.extension,
          searchPaths: toolResult.data.searchPaths,
          files: toolResult.data.files,
          totalFound: toolResult.data.totalFound,
          formattedResult: toolResult.data.formattedResult
        };
      }
    }

    // data.toolResults 구조에서 추출 (새로운 구조)
    if (responseData && responseData.data && responseData.data.toolResults) {
      const toolResults = responseData.data.toolResults;
      console.log('🔧 ToolResults 발견:', toolResults);
      
      // filesystem 도구 결과에서 확장자 검색 결과 찾기
      if (toolResults.filesystem && toolResults.filesystem.data && toolResults.filesystem.data.extension) {
        const fsResult = toolResults.filesystem.data;
        console.log('📁 FileSystem 결과:', fsResult);
        
        return {
          type: 'extension',
          extension: fsResult.extension,
          searchPaths: fsResult.searchPaths,
          files: fsResult.files,
          totalFound: fsResult.totalFound,
          formattedResult: fsResult.formattedResult
        };
      }
    }

    // 일반 검색 결과인지 확인
    if (responseData && responseData.searchResults) {
      return {
        type: 'search',
        query: responseData.searchResults.query,
        files: responseData.searchResults.files,
        totalFound: responseData.searchResults.totalCount
      };
    }

    console.log('❌ UI 필터 정보를 찾을 수 없음');
    return null;
  } catch (error) {
    console.error('UI 필터 추출 오류:', error);
    return null;
  }
}