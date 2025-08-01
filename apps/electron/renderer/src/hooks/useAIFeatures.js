import { useState, useCallback } from 'react';
import { 
  getAISummary, 
  getAIPlan, 
  analyzeFilesAI, 
  analyzeSearchResultsAI, 
  recommendOrganizationAI, 
  chatWithAI,
  getAvailableTools,
  extractFileListFromAIResult,
  analyzeDocumentContent,
  readDocumentContent
} from '../utils/api';

export const useAIFeatures = (tools, setTools, onUIFilterApply) => {
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
  const handleSendChat = useCallback(async (message, selectedService = 'auto') => {
    // 도구 목록이 비어 있으면 자동 동기화
    if (tools && tools.length === 0 && setTools) {
      try {
        const userId = window.electronAPI?.getUserId?.() || 'anonymous';
        const availableTools = await getAvailableTools(userId);
        setTools(availableTools);
        console.log('✅ [AI] 도구 목록 자동 동기화:', availableTools);
      } catch (error) {
        console.error('❌ [AI] 도구 목록 자동 동기화 실패:', error);
      }
    }
    const messageToSend = (typeof message === 'string' ? message : chatInput).trim();
    if (!messageToSend || aiThinking) return;

    // 채팅 전송 후 항상 입력창 지우기
    setChatInput('');
    
    // 사용자 메시지 추가
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    }]);

    setAiThinking(true);

    try {
      // 대화 기록 준비 (Claude API 형식)
      const conversationHistory = chatHistory.map(item => ({
        role: item.type === 'user' ? 'user' : 'assistant',
        content: item.content
      }));
      
      // 서비스에 따라 context 조정
      let context;
      if (selectedService === 'general') {
        context = {
          userId: window.electronAPI?.getUserId?.() || 'anonymous',
          provider: 'claude',
          conversationHistory,
          currentMessage: messageToSend,
          service: selectedService,
          timestamp: new Date().toISOString()
        };
      } else {
        context = {
          ...contextAwareness,
          userId: window.electronAPI?.getUserId?.() || 'anonymous',
          provider: 'claude',
          conversationHistory,
          currentMessage: messageToSend,
          service: selectedService
        };
      }
      
      // 실제로 message가 잘 전달되는지 로그
      console.log('[AI] chatWithAI 호출:', { messageToSend, context });
      const response = await chatWithAI(messageToSend, context);
      
      console.log('🤖 [AI] 응답 받음:', response);
      console.log('🤖 [AI] 응답 타입:', typeof response);
      console.log('🤖 [AI] 응답 구조 상세:', JSON.stringify(response, null, 2));
      
      // 파일 경로 감지 및 문서 분석 자동 실행
      let documentAnalysisResult = null;
      
      // 사용자가 분석을 요청했는지 확인
      const analysisKeywords = ['분석', '읽어', '파악', '요약', '검토', '확인', '보여', '알려'];
      const hasAnalysisRequest = analysisKeywords.some(keyword => 
        messageToSend.toLowerCase().includes(keyword.toLowerCase())
      );
      
      console.log('🔍 [AI] 분석 요청 키워드 체크:', {
        message: messageToSend,
        keywords: analysisKeywords,
        hasRequest: hasAnalysisRequest
      });
      
      // 분석 요청이 있을 때만 문서 분석 실행
      if (hasAnalysisRequest && response && response.data && response.data.toolResults) {
        for (const toolResult of response.data.toolResults) {
          try {
            const content = JSON.parse(toolResult.content);
            if (content.success && content.result && content.result.data && content.result.data.files) {
              const files = content.result.data.files;
              if (files.length > 0) {
                // 첫 번째 파일에 대해 문서 분석 실행
                const targetFile = files[0];
                console.log('📄 [AI] 문서 분석 자동 실행 (사용자 요청):', targetFile.path);
                
                try {
                  documentAnalysisResult = await analyzeDocumentContent(targetFile.path, { maxLength: 10000 });
                  console.log('✅ [AI] 문서 분석 완료:', documentAnalysisResult);
                } catch (analysisError) {
                  console.error('❌ [AI] 문서 분석 실패:', analysisError);
                  documentAnalysisResult = {
                    success: false,
                    error: `문서 분석 실패: ${analysisError.message}`
                  };
                }
                break;
              }
            }
          } catch (parseError) {
            console.warn('⚠️ [AI] ToolResult 파싱 실패:', parseError);
          }
        }
      } else if (response && response.data && response.data.toolResults) {
        console.log('📄 [AI] 분석 요청 없음 - 문서 분석 건너뜀');
      }
      
      // Claude API 응답 형태 처리
      let processedResponse = response;
      if (response && response.data && response.data.response) {
        // 백엔드에서 온 구조화된 응답
        const aiResponse = response.data.response;
        
        // Claude API가 {type: "text", text: "content"} 형태로 응답하는 경우 처리
        if (typeof aiResponse === 'object' && aiResponse.type === 'text' && aiResponse.text) {
          processedResponse = aiResponse.text;
        } else if (Array.isArray(aiResponse)) {
          // 배열 형태 응답 처리 (multiple content blocks)
          processedResponse = aiResponse.map(item => {
            if (typeof item === 'object' && item.type === 'text' && item.text) {
              return item.text;
            }
            return typeof item === 'string' ? item : JSON.stringify(item);
          }).join('\n');
        } else {
          processedResponse = aiResponse;
        }
      } else if (typeof response === 'object' && response.type === 'text' && response.text) {
        processedResponse = response.text;
      }
      
      // 문서 분석 결과가 있으면 응답에 추가
      if (documentAnalysisResult && documentAnalysisResult.success) {
        const analysisText = formatDocumentAnalysisResult(documentAnalysisResult);
        processedResponse += '\n\n' + analysisText;
      } else if (documentAnalysisResult && !documentAnalysisResult.success) {
        processedResponse += '\n\n' + `⚠️ 문서 분석 실패: ${documentAnalysisResult.error}`;
      }
      
      // UI 필터 정보 추출 및 처리
      console.log('🔍 [AI] UI 필터 추출 시작');
      const uiFilterInfo = extractUIFilterFromResponse(response);
      console.log('📊 [AI] 추출된 UI 필터 정보:', uiFilterInfo);
      
      if (uiFilterInfo && onUIFilterApply) {
        console.log('✅ [AI] UI 필터 적용 시작');
        // 다중 확장자 체크 지원
        let extensions = [];
        if (Array.isArray(uiFilterInfo.extension)) {
          extensions = uiFilterInfo.extension;
        } else if (uiFilterInfo.extension) {
          extensions = [uiFilterInfo.extension];
        }
        
        // onUIFilterApply를 통해 확장자 필터 적용
        if (extensions.length > 0 && typeof onUIFilterApply === 'function') {
          console.log('🔧 [AI] onUIFilterApply 호출 (확장자 필터):', extensions);
          onUIFilterApply({ 
            type: 'extension', 
            extensions: extensions 
          });
        } else {
          onUIFilterApply(uiFilterInfo);
        }
      }
      
      // AI 응답 추가
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: processedResponse,
        timestamp: new Date()
      }]);
      
      // 응답에서 파일 작업 제안 추출
      const suggestions = extractSuggestionsFromResponse(processedResponse);
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
      }
      
      // 확장자 검색 응답에서 frontendAction 처리
      if (typeof response === 'object' && response.data && response.data.frontendAction) {
        const frontendAction = response.data.frontendAction;
        console.log('🎯 [AI] Frontend Action 감지:', frontendAction);
        
        // 확장자 검색 결과 처리
        if (frontendAction.type === 'navigate_to_extension_search') {
          console.log('🎯 [AI] 확장자 검색 액션 처리 시작');
          
          // 확장자 정보 추출
          const extensions = frontendAction.extensions || [];
          const searchPaths = frontendAction.searchPaths || [];
          
          console.log('📁 [AI] 확장자:', extensions);
          console.log('🗂️ [AI] 검색 경로:', searchPaths);
          
          // 전역 상태 업데이트를 위한 이벤트 발생
          const extensionSearchEvent = new CustomEvent('extensionSearchAction', {
            detail: {
              type: frontendAction.type,
              extensions: extensions,
              searchPaths: searchPaths
            }
          });
          
          window.dispatchEvent(extensionSearchEvent);
          console.log('✅ [AI] 확장자 검색 이벤트 발생 완료');
          
          // onUIFilterApply도 함께 호출하여 확실히 필터 적용
          if (onUIFilterApply && typeof onUIFilterApply === 'function') {
            console.log('🔧 [AI] onUIFilterApply 호출');
            onUIFilterApply({
              type: 'extension',
              extensions: extensions,
              searchPaths: searchPaths
            });
          }
        }
      }
    } catch (error) {
      console.error('AI chat failed:', error);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: '죄송합니다. 응답 생성 중 오류가 발생했습니다.',
        timestamp: new Date()
      }]);
    } finally {
      setAiThinking(false);
    }
  }, [chatInput, aiThinking, contextAwareness, chatHistory, tools, setTools]);

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
    handleSendChat,
    handleAIAnalysis,
    handleFileOperation: async (action, data) => {
      console.log('File operation:', action, data);
      
      try {
        switch (action) {
          case 'open':
            // 파일 열기/실행
            if (window.electronAPI?.openFile) {
              await window.electronAPI.openFile(data.path);
              console.log('✅ 파일 열기 성공:', data.name);
            } else {
              console.warn('⚠️ Electron API 없음 - 웹 환경에서는 파일 실행 불가');
              // 웹 환경에서의 대안 처리
              if (data.extension) {
                const ext = data.extension.toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
                  // 이미지 파일은 새 탭에서 열기
                  window.open(data.path, '_blank');
                } else if (['.txt', '.md', '.json', '.js', '.html', '.css'].includes(ext)) {
                  // 텍스트 파일은 다운로드
                  const link = document.createElement('a');
                  link.href = data.path;
                  link.download = data.name;
                  link.click();
                }
              }
            }
            break;
            
          case 'upload':
            // 파일 업로드
            if (data.files && data.targetPath) {
              console.log('파일 업로드:', data.files.length, '개 파일을', data.targetPath, '로');
              // 실제 업로드 로직은 부모 컴포넌트에서 처리
            }
            break;
            
          case 'move':
            // 파일 이동
            if (window.electronAPI?.moveFile) {
              await window.electronAPI.moveFile(data.source, data.destination);
              console.log('✅ 파일 이동 성공:', data.source, '->', data.destination);
            } else {
              console.warn('⚠️ 파일 이동 기능 없음 - Electron API 필요');
            }
            break;
            
          case 'delete':
            // 파일 삭제
            if (window.electronAPI?.deleteFile) {
              if (Array.isArray(data)) {
                for (const file of data) {
                  await window.electronAPI.deleteFile(file.path);
                }
                console.log('✅ 파일 삭제 성공:', data.length, '개 파일');
              } else {
                await window.electronAPI.deleteFile(data.path);
                console.log('✅ 파일 삭제 성공:', data.name);
              }
            } else {
              console.warn('⚠️ 파일 삭제 기능 없음 - Electron API 필요');
            }
            break;
            
          case 'copy':
            // 파일 복사 (클립보드에 저장)
            console.log('📋 파일 복사:', Array.isArray(data) ? data.length + '개 파일' : data.name);
            // 실제 복사 로직은 useFileExplorer hook에서 처리
            return { action: 'copy', files: Array.isArray(data) ? data : [data] };
            
          case 'cut':
            // 파일 잘라내기 (클립보드에 저장)
            console.log('✂️ 파일 잘라내기:', Array.isArray(data) ? data.length + '개 파일' : data.name);
            // 실제 잘라내기 로직은 useFileExplorer hook에서 처리
            return { action: 'cut', files: Array.isArray(data) ? data : [data] };
            
          case 'paste':
            // 파일 붙여넣기
            console.log('📋 파일 붙여넣기 to:', data?.targetPath || '현재 경로');
            // 실제 붙여넣기 로직은 useFileExplorer hook에서 처리
            return { action: 'paste', targetPath: data?.targetPath };
            
          case 'rename':
            // 파일 이름 변경
            console.log('✏️ 파일 이름 변경:', data.name);
            // 실제 이름 변경 로직은 별도 구현 필요
            return { action: 'rename', file: data };
            
          case 'properties':
            // 파일 속성 보기
            console.log('ℹ️ 파일 속성:', data.name);
            return { action: 'properties', file: data };
            
          case 'favorite':
            // 즐겨찾기 토글
            console.log('⭐ 즐겨찾기 토글:', data.name);
            return { action: 'favorite', file: data };
            
          case 'share':
            // 파일 공유
            console.log('🔗 파일 공유:', data.name);
            return { action: 'share', file: data };
            
          case 'file-analyze':
            // 파일 분석
            console.log('📊 파일 분석:', Array.isArray(data) ? data.length + '개 파일' : data.name);
            return { action: 'file-analyze', files: Array.isArray(data) ? data : [data] };
            
          default:
            console.log('🔄 알 수 없는 파일 작업:', action);
        }
      } catch (error) {
        console.error('❌ 파일 작업 실패:', error);
        throw error;
      }
    },
    handleSearchAnalysis: analyzeSearchResults,
    handleOrganizationPlan: getOrganizationRecommendations,
    applySuggestion: executeSuggestion,
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
    console.log('🔍 [AI] UI 필터 추출 시작:', response);
    
    // response가 문자열인 경우 JSON 파싱 시도
    let responseData = response;
    if (typeof response === 'string') {
      try {
        responseData = JSON.parse(response);
      } catch (e) {
        console.log('📊 [AI] 문자열 응답 - JSON 파싱 실패, 문자열 그대로 사용');
        // 문자열 응답인 경우 null 반환하지 않고 계속 진행
        responseData = { rawText: response };
      }
    }
    
    console.log('📊 [AI] 파싱된 응답 데이터:', responseData);
    
    // 새로운 응답 구조에서 UI 필터 정보 추출 (우선순위 1)
    if (responseData && responseData.data && responseData.data.uiFilter) {
      const uiFilter = responseData.data.uiFilter;
      console.log('🎯 [AI] data.uiFilter 발견:', uiFilter);
      
      if (uiFilter.type === 'file_search' && uiFilter.extension) {
        const result = {
          type: 'extension',
          extension: uiFilter.extension,
          searchPaths: uiFilter.searchPaths || [],
          files: uiFilter.files || [],
          totalFound: uiFilter.totalCount || 0,
          action: uiFilter.action || 'apply_extension_filter'
        };
        console.log('✅ [AI] uiFilter에서 추출된 정보:', result);
        return result;
      }
    }
    
    // Tool 실행 결과에서 UI 필터 정보 추출 (우선순위 2)
    if (responseData && responseData.data && responseData.data.toolResults) {
      console.log('🔧 [AI] ToolResults 발견:', responseData.data.toolResults);
      
      for (const toolResult of responseData.data.toolResults) {
        try {
          const content = JSON.parse(toolResult.content);
          console.log('📁 [AI] ToolResult content:', content);
          
          if (content.success && content.result && content.result.data) {
            const data = content.result.data;
            console.log('📁 [AI] FileSystem 결과:', data);
            
            // 파일시스템 검색 결과인 경우
            if (data.files && Array.isArray(data.files)) {
              const uiFilterInfo = {
                type: 'extension',
                extension: data.extension,
                searchPaths: data.searchPaths || [],
                files: data.files,
                totalFound: data.files.length,
                action: 'apply_extension_filter'
              };
              console.log('✅ [AI] ToolResult에서 추출된 UI 필터 정보:', uiFilterInfo);
              return uiFilterInfo;
            }
          }
        } catch (parseError) {
          console.warn('⚠️ [AI] ToolResult 파싱 실패:', parseError);
        }
      }
    }
    
    // frontendAction에서 UI 필터 정보 추출 (우선순위 3)
    if (responseData && responseData.data && responseData.data.frontendAction) {
      const frontendAction = responseData.data.frontendAction;
      console.log('🎯 [AI] frontendAction 발견:', frontendAction);
      
      if (frontendAction.type === 'navigate_to_extension_search' && frontendAction.extensions) {
        const result = {
          type: 'extension',
          extension: frontendAction.extensions[0], // 첫 번째 확장자 사용
          extensions: frontendAction.extensions, // 전체 확장자 배열도 포함
          searchPaths: frontendAction.searchPaths || [],
          action: 'navigate_to_extension_search'
        };
        console.log('✅ [AI] frontendAction에서 추출된 정보:', result);
        return result;
      }
    }
    
    console.log('❌ [AI] UI 필터 정보를 찾을 수 없음');
    return null;
  } catch (error) {
    console.error('❌ [AI] UI 필터 추출 중 오류:', error);
    return null;
  }
}

// 문서 분석 결과를 포맷팅하는 헬퍼 함수
function formatDocumentAnalysisResult(result) {
  if (!result || !result.success) {
    return '문서 분석을 완료할 수 없습니다.';
  }
  
  let formatted = '📄 **문서 분석 결과**\n\n';
  
  // 요약 정보
  if (result.summary) {
    formatted += '📊 **요약 정보:**\n';
    if (result.summary.lines) formatted += `• 총 줄 수: ${result.summary.lines}\n`;
    if (result.summary.characters) formatted += `• 총 문자 수: ${result.summary.characters}\n`;
    if (result.summary.words) formatted += `• 총 단어 수: ${result.summary.words}\n`;
    if (result.summary.paragraphs) formatted += `• 총 단락 수: ${result.summary.paragraphs}\n`;
    if (result.summary.totalSheets) formatted += `• 총 시트 수: ${result.summary.totalSheets}\n`;
    if (result.summary.totalRows) formatted += `• 총 행 수: ${result.summary.totalRows}\n`;
    if (result.summary.totalCells) formatted += `• 총 셀 수: ${result.summary.totalCells}\n`;
    formatted += '\n';
  }
  
  // 분석 정보
  if (result.analysis) {
    formatted += '🔍 **분석 정보:**\n';
    if (result.analysis.language) formatted += `• 언어: ${result.analysis.language}\n`;
    if (result.analysis.keywords && result.analysis.keywords.length > 0) {
      formatted += `• 주요 키워드: ${result.analysis.keywords.slice(0, 10).join(', ')}\n`;
    }
    if (result.analysis.sentiment) formatted += `• 감정 분석: ${result.analysis.sentiment}\n`;
    if (result.analysis.readability) formatted += `• 가독성: ${result.analysis.readability}\n`;
    formatted += '\n';
  }
  
  // 메타데이터
  if (result.metadata) {
    formatted += '📋 **메타데이터:**\n';
    Object.entries(result.metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formatted += `• ${key}: ${value.join(', ')}\n`;
      } else {
        formatted += `• ${key}: ${value}\n`;
      }
    });
    formatted += '\n';
  }
  
  // 내용 미리보기 (처음 200자)
  if (result.content && result.content.length > 0) {
    const preview = result.content.length > 200 
      ? result.content.substring(0, 200) + '...'
      : result.content;
    formatted += '📝 **내용 미리보기:**\n';
    formatted += `${preview}\n\n`;
  }
  
  return formatted;
}