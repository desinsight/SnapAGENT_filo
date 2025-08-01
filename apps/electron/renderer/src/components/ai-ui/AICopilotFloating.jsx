import React, { useState, useRef, useEffect } from 'react';
import { ToolExecutionDisplay, SubscriptionBanner, AvailableToolsIndicator } from './SubscriptionComponents';
import { getAvailableTools } from '../../utils/api';

const AICopilotFloating = ({
  isOpen,
  onClose,
  chatInput,
  chatHistory,
  aiThinking,
  aiSuggestions,
  aiResult,
  contextAwareness,
  selectedFiles,
  onChatInputChange,
  onSendChat,
  onFileAnalysis,
  onOrganizationPlan,
  onApplySuggestion,
  onClearHistory,
  onNotification
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 480, y: 100 });
  const [size, setSize] = useState({ width: 460, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [activeAIService] = useState('auto'); // 고정된 통합 AI 서비스
  
  // Tool Calling 관련 상태
  const [availableTools, setAvailableTools] = useState([]);
  const [toolExecutions, setToolExecutions] = useState([]);
  const [subscriptionNotice, setSubscriptionNotice] = useState(null);
  const [isToolListVisible, setIsToolListVisible] = useState(false);
  
  const panelRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

  // 사용 가능한 도구 목록 로드
  useEffect(() => {
    const loadTools = async () => {
      try {
        const userId = window.electronAPI?.getUserId?.() || 'anonymous';
        const tools = await getAvailableTools(userId);
        setAvailableTools(tools);
      } catch (error) {
        console.error('도구 목록 로드 실패:', error);
      }
    };

    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  // 통합 AI 서비스 정보
  const aiService = {
    id: 'auto',
    name: '통합 AI',
    icon: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'from-purple-500 to-indigo-600'
  };

  // 통합 AI 플레이스홀더
  const getPlaceholder = () => {
    return '파일 관리, 일정, 작업 등 무엇이든 물어보세요...';
  };

  // 드래그 시작
  const handleDragStart = (e) => {
    if (e.target.closest('.resize-handle')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // 드래그 중
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y));
    
    setPosition({ x: newX, y: newY });
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 크기 조절 시작
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY
    };
  };

  // 크기 조절 중
  const handleResizeMove = (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.current.x;
    const deltaY = e.clientY - resizeStart.current.y;
    
    const newWidth = Math.max(400, Math.min(800, resizeStart.current.width + deltaX));
    const newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.current.height + deltaY));
    
    setSize({ width: newWidth, height: newHeight });
  };

  // 크기 조절 종료
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // 이벤트 리스너 설정
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  // 포커스에 따른 투명도 조절
  useEffect(() => {
    const handleFocus = () => setOpacity(1);
    const handleBlur = () => setOpacity(0.85);
    
    if (panelRef.current) {
      panelRef.current.addEventListener('mouseenter', handleFocus);
      panelRef.current.addEventListener('mouseleave', handleBlur);
    }
    
    return () => {
      if (panelRef.current) {
        panelRef.current.removeEventListener('mouseenter', handleFocus);
        panelRef.current.removeEventListener('mouseleave', handleBlur);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl transition-all duration-200 ${
        isDragging ? 'cursor-move' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '340px' : `${size.width}px`,
        height: isMinimized ? '60px' : `${size.height}px`,
        opacity,
        zIndex: 1000
      }}
    >
      {/* 헤더 */}
      <div
        className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-move rounded-t-lg bg-gradient-to-r ${aiService.color}`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center space-x-2">
          {aiService.icon()}
          <h3 className="text-white font-semibold">
            {aiService.name}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 최소화 버튼 */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 - 최소화 시 숨김 */}
      {!isMinimized && (
        <div className="flex flex-col h-full">
          {/* 사용 가능한 도구 표시 */}
          <AvailableToolsIndicator 
            toolCount={availableTools.length}
            onClick={() => setIsToolListVisible(!isToolListVisible)}
          />
          
          {/* 도구 목록 표시 (토글) */}
          {isToolListVisible && (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">구독된 도구들:</div>
              <div className="flex flex-wrap gap-1">
                {availableTools.map((tool, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                    title={tool.description}
                  >
                    {tool.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 대화 기록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 환영 메시지 - 채팅 히스토리가 없을 때만 표시 */}
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                {/* 환영 메시지 */}
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">안녕하세요! AI 코파일럿입니다</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">파일 관리, 일정, 작업 등 무엇이든 도움을 드릴 수 있습니다. 아래 버튼을 눌러보시거나 직접 질문해보세요!</p>
                </div>

                {/* 빠른 질문 버튼들 */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  <button
                    onClick={() => onChatInputChange('오늘 할 일을 정리해줘')}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">할 일 관리</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">업무 계획 세우기</p>
                  </button>

                  <button
                    onClick={() => onChatInputChange('창작 아이디어를 도와줘')}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">창작 도움</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">아이디어 발상</p>
                  </button>

                  <button
                    onClick={() => onChatInputChange('문서 작성을 도와줘')}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">문서 작성</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">보고서, 메일 등</p>
                  </button>

                  <button
                    onClick={() => onChatInputChange('정보를 찾아서 요약해줘')}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">정보 검색</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">조사 및 요약</p>
                  </button>
                </div>
              </div>
            )}

            {/* 채팅 메시지들 */}
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${(chat.role === 'user' || chat.type === 'user') ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    (chat.role === 'user' || chat.type === 'user')
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm">{chat.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {new Date(chat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Tool 실행 상태 표시 */}
            <ToolExecutionDisplay toolExecutions={toolExecutions} />
            
            {/* 구독 안내 배너 */}
            {subscriptionNotice && (
              <SubscriptionBanner 
                {...subscriptionNotice}
                onClose={() => setSubscriptionNotice(null)}
              />
            )}
            
            {/* AI 생각 중 표시 */}
            {aiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">AI가 생각하고 있습니다...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI 제안사항 */}
          {aiSuggestions.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">빠른 작업</h4>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onApplySuggestion(suggestion)}
                    className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendChat(chatInput, 'auto')}
                placeholder={getPlaceholder()}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={() => onSendChat(chatInput, 'auto')}
                disabled={aiThinking || !chatInput.trim()}
                className={`px-4 py-2 bg-gradient-to-r ${aiService.color} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* 크기 조절 핸들 */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
          >
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICopilotFloating;