import React, { useRef, useEffect } from 'react';
import { 
  SparklesIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  BoltIcon,
  BeakerIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';
import AISuggestionChips from './AISuggestionChips';
import AIThinkingIndicator from './AIThinkingIndicator';

const AICopilotPanel = ({
  chatHistory,
  chatInput,
  setChatInput,
  handleSendChat,
  aiThinking,
  aiSuggestions,
  onExecuteSuggestion,
  contextAwareness
}) => {
  const chatEndRef = useRef(null);

  // 채팅 스크롤 하단 유지
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const quickActions = [
    { icon: BoltIcon, text: '파일 정리하기', action: 'organize' },
    { icon: BeakerIcon, text: '중복 파일 찾기', action: 'duplicates' },
    { icon: RocketLaunchIcon, text: '최적화 추천', action: 'optimize' }
  ];

  const handleQuickAction = (action) => {
    let message = '';
    switch (action) {
      case 'organize':
        message = '현재 폴더의 파일들을 체계적으로 정리해주세요.';
        break;
      case 'duplicates':
        message = '중복된 파일들을 찾아주세요.';
        break;
      case 'optimize':
        message = '저장 공간을 최적화할 수 있는 방법을 추천해주세요.';
        break;
    }
    setChatInput(message);
    handleSendChat();
  };

  const formatMessage = (message) => {
    // 코드 블록 처리
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let formatted = message.replace(codeBlockRegex, (match, lang, code) => {
      return `<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // 볼드 텍스트 처리
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 리스트 처리
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>');

    return formatted;
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesSolidIcon className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold">AI Copilot</h2>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex items-center mr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              온라인
            </div>
          </div>
        </div>
        
        {/* 컨텍스트 정보 */}
        <div className="mt-2 text-xs text-gray-500">
          <p>현재 폴더: {contextAwareness.currentFolder || '/'}</p>
          <p>파일 수: {contextAwareness.fileCount}개</p>
        </div>
      </div>

      {/* 빠른 작업 버튼 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.action)}
              className="flex-1 flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={aiThinking}
            >
              <action.icon className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
              <span className="text-xs">{action.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI 제안 */}
      {aiSuggestions.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <AISuggestionChips
            suggestions={aiSuggestions}
            onExecute={onExecuteSuggestion}
          />
        </div>
      )}

      {/* 채팅 히스토리 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">AI Copilot이 파일 관리를 도와드립니다</p>
            <p className="text-xs mt-2">질문을 입력하거나 위의 빠른 작업을 선택하세요</p>
          </div>
        ) : (
          chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  chat.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {chat.type === 'ai' && (
                  <div className="flex items-center mb-1">
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs font-semibold">AI</span>
                  </div>
                )}
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMessage(chat.message) }}
                />
                <p className="text-xs mt-1 opacity-70">
                  {new Date(chat.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {aiThinking && <AIThinkingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="AI에게 질문하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              disabled={aiThinking}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || aiThinking}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        {/* 예시 질문 */}
        <div className="mt-2 flex flex-wrap gap-1">
          {['큰 파일 찾기', '최근 수정된 파일', '정리 방법'].map((example) => (
            <button
              key={example}
              onClick={() => setChatInput(example)}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              disabled={aiThinking}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICopilotPanel;