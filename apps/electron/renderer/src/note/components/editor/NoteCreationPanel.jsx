/**
 * 새 노트 생성 패널 컴포넌트
 * 
 * @description 새 노트 생성을 위한 전체 화면 패널 - 템플릿 선택 및 추가 옵션 포함
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { NOTE_CATEGORIES } from '../../constants/noteConfig';
import { NOTE_TEMPLATES } from '../../templates/index.js';
import { BlockEditor } from './BlockEditor';
import SingleProseMirrorEditor from './SingleProseMirrorEditor';
import { nanoid } from 'nanoid';
import NotionLikeToolbar from '../../../components/common/NotionLikeToolbar.jsx';
import './BlockEditor.css';
import { SelectionContext } from './selection/context/SelectionContext.jsx';
import { spellHardcodedFix } from '../../../common/spellHardcoded';
import SpellCheckDiffModal from './SpellCheckDiffModal';
import NoteCreationSidebar from './NoteCreationSidebar';

const NoteCreationPanel = ({
  isOpen,
  onClose,
  onSave,
  onUseAI,
  aiLoading = {},
  initialNote = null,
  onNotification,
  isSharedNote = false, // 공유노트 모드 여부
  onShare = null, // 공유 기능 (공유노트 모드에서만 사용)
  collaborators = [], // 협업자 목록 (공유노트 모드에서만 사용)
  onToggleMode = null // 모드 전환 함수 (개인노트 ↔ 공유노트)
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(NOTE_TEMPLATES[0]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBlocks, setNoteBlocks] = useState([]);
  const [singleEditorContent, setSingleEditorContent] = useState(''); // 단일 에디터용 컨텐츠
  const [noteOptions, setNoteOptions] = useState({
    category: isSharedNote ? '업무' : '개인',
    tags: [],
    isPrivate: !isSharedNote,
    enableAI: true,
    // 공유노트 전용 옵션들
    visibility: isSharedNote ? 'shared' : 'private',
    permissions: isSharedNote ? {
      canEdit: true,
      canComment: true,
      canShare: true
    } : null
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 포맷 설정 상태
  const [textFormat, setTextFormat] = useState({
    fontFamily: 'Inter',
    fontSize: '14',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: '1.5'
  });

  // 선택된 블록 상태
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [spellModalOpen, setSpellModalOpen] = useState(false);
  const [spellOriginal, setSpellOriginal] = useState('');
  const [spellCorrected, setSpellCorrected] = useState('');
  const titleInputRef = useRef(null);
  const blockEditorRef = useRef(null);

  const { selection, setSelection } = useContext(SelectionContext);

  // 제목 입력 핸들러
  const handleTitleChange = (e) => {
    setNoteTitle(e.target.value);
    setIsDirty(true);
  };

  // 제목에서 엔터 키 처리 (본문으로 포커스 이동)
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (blockEditorRef.current) {
        blockEditorRef.current.focusFirstBlock();
      }
    }
  };

  // 단일 에디터 컨텐츠 변경 핸들러
  const handleSingleEditorChange = (content, options = {}) => {
    setSingleEditorContent(content);
    setIsDirty(true);
  };

  // 편집 모드일 때 초기값 설정
  useEffect(() => {
    if (initialNote) {
      setNoteTitle(initialNote.title || '');
      
      // 단일 에디터 모드인지 확인
      if (initialNote.editorType === 'prosemirror-single') {
        setSingleEditorContent(initialNote.content || '');
      } else {
        setNoteBlocks(initialNote.blocks || [{ id: nanoid(), type: 'text', content: '', focused: false }]);
      }
      
      setNoteOptions({
        category: initialNote.category || '개인',
        tags: initialNote.tags || [],
        isPrivate: initialNote.isPrivate !== false,
        enableAI: initialNote.enableAI !== false
      });
      
      // 편집 모드에서는 템플릿 선택 없음
      setSelectedTemplate(null);
    } else {
      // 새 노트 작성 모드 - 템플릿에 따라 초기화
      if (selectedTemplate?.editorType === 'prosemirror-single') {
        setSingleEditorContent(selectedTemplate.content || '');
      } else {
        setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
      }
    }
  }, [initialNote, selectedTemplate]);

  /**
   * 노트 저장 핸들러
   */
  async function handleSaveNote() {
    if (!noteTitle.trim()) {
      if (onNotification) {
        onNotification('노트 제목을 입력해주세요.', 'error');
      } else {
        alert('노트 제목을 입력해주세요.');
      }
      return;
    }

    setIsSaving(true);
    
    // 단일 에디터인지 블록 에디터인지 확인
    const isSingleEditor = selectedTemplate?.editorType === 'prosemirror-single' || 
                          initialNote?.editorType === 'prosemirror-single';
    
    const finalNoteData = {
      title: noteTitle,
      ...(isSingleEditor ? 
        { 
          content: singleEditorContent,
          editorType: 'prosemirror-single'
        } : 
        { blocks: noteBlocks }
      ),
      ...noteOptions,
      template: selectedTemplate?.id || 'blank',
      createdAt: initialNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const result = await onSave(finalNoteData);
      setIsDirty(false);
      if (onNotification) {
        onNotification('노트가 성공적으로 저장되었습니다.', 'success');
      }
      onClose();
      return result;
    } catch (error) {
      console.error('노트 저장 중 오류 발생:', error);
      const errorMessage = '노트 저장에 실패했습니다. 다시 시도해주세요.';
      if (onNotification) {
        onNotification(errorMessage, 'error');
      } else {
        alert(errorMessage);
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * 템플릿 선택 핸들러
   */
  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template);
    // 제목을 빈 값으로 설정 (템플릿의 defaultTitle 사용)
    setNoteTitle(template.defaultTitle || '');
    
    // 템플릿 content를 블록으로 변환
    if (template.content) {
      if (Array.isArray(template.content)) {
        // 블록 배열이면 그대로 사용 (각 블록에 id 추가)
        const blocks = template.content.map(block => ({
          ...block,
          id: block.id || nanoid(),
          focused: false
        }));
        setNoteBlocks(blocks);
      } else if (typeof template.content === 'string') {
        // 문자열이면 줄 단위로 text 블록 생성
        const blocks = template.content.split('\n').map(line => ({
          id: nanoid(),
          type: 'text',
          content: line,
          focused: false
        }));
        setNoteBlocks(blocks);
      } else {
        setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
      }
    } else {
      setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
    }
    
    setIsDirty(true);
  }, []);

  /**
   * 모달 닫기
   */
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')) {
        setNoteTitle('');
        setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
        setSelectedTemplate(NOTE_TEMPLATES[0]);
        setIsDirty(false);
        onClose();
      }
    } else {
      setNoteTitle('');
      setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
      setSelectedTemplate(NOTE_TEMPLATES[0]);
      setIsDirty(false);
      onClose();
    }
  }, [isDirty, onClose]);

  /**
   * 옵션 변경 핸들러
   */
  const handleOptionChange = useCallback((key, value) => {
    setNoteOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * 태그 추가
   */
  const handleAddTag = useCallback((tag) => {
    setNoteOptions(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
  }, []);

  /**
   * 태그 제거
   */
  const handleRemoveTag = useCallback((tagIndex) => {
    setNoteOptions(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== tagIndex)
    }));
  }, []);

  /**
   * 포맷 변경 핸들러
   */
  const handleFormatChange = useCallback((cmd, value) => {
    if (cmd === 'blockColor') {
      setNoteBlocks(prevBlocks => prevBlocks.map(block =>
        selectedBlocks && selectedBlocks.includes(block.id)
          ? { ...block, metadata: { ...block.metadata, blockColor: value } }
          : block
      ));
    } else {
      setTextFormat(prev => ({
        ...prev,
        [cmd]: value
      }));
    }
  }, [selectedBlocks]);

  // 블록 변경 핸들러
  const handleBlocksChange = useCallback((blocks) => {
    setNoteBlocks(blocks);
    setIsDirty(true);
  }, []);

  // 텍스트 선택 변경 핸들러
  const handleSelectionChange = useCallback((selection) => {
    setSelection(selection);
  }, [setSelection]);

  // 모달이 열릴 때 초기화 (편집 모드가 아닐 때만)
  useEffect(() => {
    if (isOpen && !initialNote) {
      setNoteTitle('');
      setSelectedTemplate(NOTE_TEMPLATES[0]);
      setNoteBlocks([{ id: nanoid(), type: 'text', content: '', focused: false }]);
      setNoteOptions({
        category: '개인',
        tags: [],
        isPrivate: true,
        enableAI: true
      });
      setIsDirty(false);
    }
  }, [isOpen, initialNote]);

  // 툴바 표시 조건: selection context 값만 사용
  const showToolbar = selection && selection.text && selection.text.length > 0 && selection.rect;

  // content에서 텍스트 안전하게 추출
  function extractText(content) {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object' && Array.isArray(content.content)) {
      return content.content.map(node => node.text || extractText(node) || '').join('');
    }
    return '';
  }

  // 맞춤법 검사 버튼 핸들러
  const handleSpellCheck = () => {
    // 텍스트 계열 블록만 추출(type: text, heading1, heading2, heading3, quote, code 등)
    const text = noteBlocks
      .filter(b => [
        'text', 'heading1', 'heading2', 'heading3', 'quote', 'code'
      ].includes(b.type))
      .map(b => extractText(b.content))
      .filter(Boolean)
      .join('\n');
    const corrected = spellHardcodedFix(text);
    setSpellOriginal(text);
    setSpellCorrected(corrected);
    setSpellModalOpen(true);
  };

  // 맞춤법 교정 적용하기 핸들러
  const handleSpellApply = () => {
    // 텍스트 계열 블록만 따로 모아 교정된 줄을 1:1로 정확히 매칭해서 덮어쓰기
    const textBlockTypes = ['text', 'heading1', 'heading2', 'heading3', 'quote', 'code'];
    const textBlocks = noteBlocks.filter(b => textBlockTypes.includes(b.type));
    const correctedLines = spellCorrected.split('\n');
    let textIdx = 0;
    const newBlocks = noteBlocks.map(b => {
      if (textBlockTypes.includes(b.type)) {
        const newContent = correctedLines[textIdx] !== undefined ? correctedLines[textIdx] : '';
        textIdx++;
        return { ...b, content: newContent };
      }
      return b;
    });
    setNoteBlocks(newBlocks);
    setSpellModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleClose}
            className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialNote ? '노트 편집' : '새 노트 작성'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 모드 전환 버튼 */}
          {onToggleMode && (
            <button
              onClick={() => onToggleMode(!isSharedNote)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600"
              title={isSharedNote ? "개인노트로 전환" : "공유노트로 전환"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm">
                {isSharedNote ? "개인노트" : "공유노트"}
              </span>
            </button>
          )}
          
          <button
            onClick={handleSaveNote}
            disabled={isSaving || !noteTitle.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>저장</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 사이드바 */}
        <NoteCreationSidebar
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          showTemplates={!initialNote}
          noteOptions={noteOptions}
          onOptionChange={handleOptionChange}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          isSharedNote={isSharedNote}
          collaborators={collaborators}
        />

        {/* 에디터 영역 */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* 노션 스타일 제목 */}
            <div className="px-8 pt-8 pb-4">
              <input
                ref={titleInputRef}
                type="text"
                value={noteTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                placeholder="제목 없음"
                className="w-full text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500 focus:placeholder-gray-300 dark:focus:placeholder-gray-600 transition-colors duration-200 resize-none overflow-hidden"
                style={{
                  lineHeight: '1.2',
                  height: 'auto',
                  minHeight: '1.2em'
                }}
              />
            </div>

            {/* 에디터 영역 */}
            <div className="flex-1 overflow-y-auto">
              {selectedTemplate?.editorType === 'prosemirror-single' || initialNote?.editorType === 'prosemirror-single' ? (
                // 단일 ProseMirror 에디터
                <SingleProseMirrorEditor
                  content={singleEditorContent}
                  onChange={handleSingleEditorChange}
                  placeholder={selectedTemplate?.placeholder || "내용을 입력하세요..."}
                  className="h-full"
                />
              ) : (
                // 기존 블록 에디터
                <BlockEditor
                  ref={blockEditorRef}
                  initialBlocks={initialNote ? initialNote.blocks : noteBlocks}
                  onChange={handleBlocksChange}
                  onSelectionChange={handleSelectionChange}
                  onSelectionCleared={() => {
                    setSelection(null);
                    setSelectedBlocks([]);
                  }}
                  onSave={handleSaveNote}
                  placeholder={selectedTemplate?.placeholder || "내용을 입력하세요..."}
                  selectedBlocks={selectedBlocks}
                  setSelectedBlocks={setSelectedBlocks}
                  textFormat={textFormat}
                  onFormatChange={handleFormatChange}
                />
              )}
            </div>
          </div>

          {/* 하단 상태바 */}
          <div className="px-8 py-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{noteBlocks.length}개 블록</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
                  </svg>
                  <span>{noteBlocks.reduce((acc, block) => acc + (block.content?.length || 0), 0)}자</span>
                </div>
                {isDirty && (
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>저장되지 않음</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 공유노트 전용 기능 */}
                {isSharedNote && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onShare?.(noteOptions)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                      title="노트 공유"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                    
                    {collaborators.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">협업자:</span>
                        <div className="flex -space-x-2">
                          {collaborators.slice(0, 3).map((collaborator, index) => (
                            <div
                              key={collaborator.userId}
                              className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"
                              title={collaborator.name || collaborator.userId}
                            >
                              {(collaborator.name || collaborator.userId).charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {collaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs flex items-center justify-center border-2 border-white dark:border-gray-800">
                              +{collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* AI 도구 */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleSpellCheck}
                    disabled={aiLoading.spellCheck}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="맞춤법 검사"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onUseAI?.('tagRecommendation', noteBlocks.map(b => b.content).join('\n'))}
                    disabled={aiLoading.tagRecommendation}
                    className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="태그 추천"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onUseAI?.('summary', noteBlocks.map(b => b.content).join('\n'))}
                    disabled={aiLoading.summaryGeneration}
                    className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="요약 생성"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 노션 스타일 툴바 */}
      {showToolbar && (
        <NotionLikeToolbar
          selection={selection}
          currentFormat={textFormat}
          onFormatChange={handleFormatChange}
          onSelectionCleared={() => {
            setSelection(null);
            setSelectedBlocks([]);
          }}
        />
      )}
      {spellModalOpen && (
        <SpellCheckDiffModal
          originalText={spellOriginal}
          correctedText={spellCorrected}
          onClose={() => setSpellModalOpen(false)}
          onApply={handleSpellApply}
        />
      )}
    </div>
  );
};

export default NoteCreationPanel;