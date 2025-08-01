/**
 * 협업 패널 컴포넌트
 * 
 * @description 실시간 협업 편집을 위한 패널 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNoteEditor } from '../../hooks/useNoteEditor';

const CollaborationPanel = ({
  isOpen = false,
  onClose,
  note,
  collaborators = [],
  onSave,
  userId
}) => {
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [cursorPositions, setCursorPositions] = useState({});
  const chatContainerRef = useRef(null);

  // 에디터 훅 사용
  const {
    note: editorNote,
    isDirty,
    isAutoSaving,
    isSaving,
    updateNote,
    saveNote,
    resetEditor
  } = useNoteEditor(note, onSave);

  // 초기 데이터 설정
  useEffect(() => {
    if (note) {
      resetEditor(note);
    }
  }, [note, resetEditor]);

  // 활성 협업자 시뮬레이션
  useEffect(() => {
    if (collaborators.length > 0) {
      const activeUsers = collaborators.filter(c => c.user.isOnline);
      setActiveCollaborators(activeUsers);
    }
  }, [collaborators]);

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  /**
   * 채팅 메시지 전송
   */
  const sendChatMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      userId: userId,
      user: {
        id: userId,
        name: '나',
        email: 'me@example.com'
      },
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  }, [newMessage, userId]);

  /**
   * 채팅 키 핸들러
   */
  const handleChatKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }, [sendChatMessage]);

  /**
   * 커서 위치 업데이트
   */
  const updateCursorPosition = useCallback((position) => {
    setCursorPositions(prev => ({
      ...prev,
      [userId]: position
    }));
  }, [userId]);

  /**
   * 협업자 커서 표시
   */
  const renderCollaboratorCursors = () => {
    return Object.entries(cursorPositions).map(([id, position]) => {
      if (id === userId) return null;
      
      const collaborator = activeCollaborators.find(c => c.userId === id);
      if (!collaborator) return null;
      
      return (
        <div
          key={id}
          className="absolute pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            backgroundColor: `hsl(${id.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
          }}
        >
          <div className="w-0.5 h-5 bg-current"></div>
          <div className="absolute top-0 left-1 px-2 py-1 text-xs text-white bg-current rounded whitespace-nowrap">
            {collaborator.user.name}
          </div>
        </div>
      );
    });
  };

  /**
   * 닫기 핸들러
   */
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              실시간 협업 편집
            </h2>
            
            {/* 협업 상태 표시 */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{activeCollaborators.length}명 협업 중</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 채팅 토글 */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showChat 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="채팅"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            {/* 저장 상태 */}
            {isAutoSaving && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>자동 저장 중...</span>
              </div>
            )}
            
            {isDirty && !isAutoSaving && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                저장되지 않음
              </span>
            )}
            
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex h-[calc(95vh-140px)]">
          {/* 에디터 영역 */}
          <div className={`${showChat ? 'w-3/4' : 'w-full'} flex flex-col`}>
            {/* 활성 협업자 표시 */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">협업 중인 사용자:</span>
                <div className="flex items-center space-x-2">
                  {activeCollaborators.map((collaborator) => (
                    <div
                      key={collaborator.userId}
                      className="flex items-center space-x-2 px-3 py-1 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${collaborator.userId.charCodeAt(0) * 137.5 % 360}, 70%, 50%)` }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {collaborator.user.name}
                      </span>
                      {collaborator.isTyping && (
                        <span className="text-xs text-green-600 dark:text-green-400">입력 중...</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 제목 편집 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={editorNote.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                placeholder="노트 제목을 입력하세요..."
                className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* 내용 편집 */}
            <div className="flex-1 px-6 py-4 relative">
              <textarea
                value={editorNote.content}
                onChange={(e) => updateNote({ content: e.target.value })}
                placeholder="노트 내용을 입력하세요..."
                className="w-full h-full text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                onSelect={(e) => {
                  const { selectionStart, selectionEnd } = e.target;
                  updateCursorPosition({
                    start: selectionStart,
                    end: selectionEnd,
                    top: 100, // 실제로는 계산해야 함
                    left: 100
                  });
                }}
              />
              
              {/* 협업자 커서 */}
              {renderCollaboratorCursors()}
            </div>

            {/* 하단 툴바 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{editorNote.content.length}자</span>
                  <span>•</span>
                  <span>단어 {editorNote.content.trim().split(/\s+/).filter(w => w).length}개</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => saveNote(true)}
                    disabled={isSaving || !editorNote.title.trim() || !editorNote.content.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 채팅 사이드바 */}
          {showChat && (
            <div className="w-1/4 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
              {/* 채팅 헤더 */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">채팅</h3>
              </div>

              {/* 채팅 메시지 */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    채팅으로 협업자와 소통해보세요.
                  </p>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`${
                        message.userId === userId ? 'ml-auto' : 'mr-auto'
                      } max-w-[80%]`}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {message.user.name} • {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        message.userId === userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 채팅 입력 */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="메시지 입력..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;