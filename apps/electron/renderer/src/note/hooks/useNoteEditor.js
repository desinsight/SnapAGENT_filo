/**
 * 노트 에디터 관리 훅
 * 
 * @description 노트 편집, 자동 저장, 마크다운 등 에디터 관련 기능을 관리
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { validateNoteData } from '../utils/noteHelpers';
import { EDITOR_CONFIG } from '../constants/noteConfig';

export const useNoteEditor = (initialNote = null, onSave = null) => {
  // 에디터 상태
  const [note, setNote] = useState(initialNote || {
    title: '',
    content: '',
    summary: '',
    category: '개인',
    tags: [],
    isMarkdown: true
  });
  
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // 에디터 모드 상태
  const [editorMode, setEditorMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [wordWrapEnabled, setWordWrapEnabled] = useState(true);
  
  // 자동 저장 타이머
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef(note.content);
  
  /**
   * 노트 데이터 업데이트
   */
  const updateNote = useCallback((updates) => {
    setNote(prev => {
      const updated = { ...prev, ...updates };
      
      // 내용이 변경되었는지 확인
      const contentChanged = updated.content !== lastContentRef.current;
      if (contentChanged) {
        setIsDirty(true);
        lastContentRef.current = updated.content;
      }
      
      return updated;
    });
  }, []);
  
  /**
   * 제목 업데이트
   */
  const updateTitle = useCallback((title) => {
    updateNote({ title });
  }, [updateNote]);
  
  /**
   * 내용 업데이트
   */
  const updateContent = useCallback((content) => {
    updateNote({ content });
  }, [updateNote]);
  
  /**
   * 요약 업데이트
   */
  const updateSummary = useCallback((summary) => {
    updateNote({ summary });
  }, [updateNote]);
  
  /**
   * 카테고리 업데이트
   */
  const updateCategory = useCallback((category) => {
    updateNote({ category });
  }, [updateNote]);
  
  /**
   * 태그 추가
   */
  const addTag = useCallback((tag) => {
    if (!tag || note.tags.includes(tag)) return;
    
    updateNote({ tags: [...note.tags, tag] });
  }, [note.tags, updateNote]);
  
  /**
   * 태그 제거
   */
  const removeTag = useCallback((tagToRemove) => {
    updateNote({ tags: note.tags.filter(tag => tag !== tagToRemove) });
  }, [note.tags, updateNote]);
  
  /**
   * 모든 태그 설정
   */
  const setTags = useCallback((tags) => {
    updateNote({ tags });
  }, [updateNote]);
  
  /**
   * 에디터 모드 변경
   */
  const changeEditorMode = useCallback((mode) => {
    setEditorMode(mode);
  }, []);
  
  /**
   * 노트 검증
   */
  const validateNote = useCallback(() => {
    const validation = validateNoteData(note);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [note]);
  
  /**
   * 노트 저장
   */
  const saveNote = useCallback(async (force = false) => {
    if (!isDirty && !force) return true;
    
    // 검증
    if (!validateNote()) {
      return false;
    }
    
    try {
      setIsSaving(true);
      
      if (onSave) {
        await onSave(note);
      }
      
      setIsDirty(false);
      setLastSaved(new Date());
      
      return true;
      
    } catch (error) {
      console.error('노트 저장 실패:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [note, isDirty, validateNote, onSave]);
  
  /**
   * 자동 저장 시작
   */
  const startAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isDirty && note.content.trim().length > 0) {
        setIsAutoSaving(true);
        await saveNote();
        setIsAutoSaving(false);
      }
    }, EDITOR_CONFIG.AUTO_SAVE_DELAY);
  }, [isDirty, note.content, saveNote]);
  
  /**
   * 자동 저장 중지
   */
  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);
  
  /**
   * 에디터 초기화
   */
  const resetEditor = useCallback((newNote = null) => {
    const resetNote = newNote || {
      title: '',
      content: '',
      summary: '',
      category: '개인',
      tags: [],
      isMarkdown: true
    };
    
    setNote(resetNote);
    setIsDirty(false);
    setValidationErrors([]);
    setLastSaved(null);
    lastContentRef.current = resetNote.content;
    stopAutoSave();
  }, [stopAutoSave]);
  
  /**
   * 마크다운 모드 토글
   */
  const toggleMarkdownMode = useCallback(() => {
    updateNote({ isMarkdown: !note.isMarkdown });
  }, [note.isMarkdown, updateNote]);
  
  /**
   * 커서 위치에 텍스트 삽입
   */
  const insertText = useCallback((text, cursorPosition = null) => {
    if (cursorPosition !== null) {
      const before = note.content.substring(0, cursorPosition);
      const after = note.content.substring(cursorPosition);
      updateContent(before + text + after);
    } else {
      updateContent(note.content + text);
    }
  }, [note.content, updateContent]);
  
  /**
   * 마크다운 포맷팅 적용
   */
  const applyMarkdownFormat = useCallback((format, selectedText = '', cursorPosition = null) => {
    let formattedText = selectedText;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      default:
        break;
    }
    
    if (cursorPosition !== null && selectedText) {
      const before = note.content.substring(0, cursorPosition);
      const after = note.content.substring(cursorPosition + selectedText.length);
      updateContent(before + formattedText + after);
    } else {
      insertText(formattedText, cursorPosition);
    }
  }, [note.content, updateContent, insertText]);
  
  // 자동 저장 트리거
  useEffect(() => {
    if (isDirty) {
      startAutoSave();
    }
    
    return stopAutoSave;
  }, [isDirty, startAutoSave, stopAutoSave]);
  
  // 초기 노트 설정
  useEffect(() => {
    if (initialNote) {
      resetEditor(initialNote);
    }
  }, [initialNote, resetEditor]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);
  
  return {
    // 노트 데이터
    note,
    
    // 상태
    isDirty,
    isAutoSaving,
    isSaving,
    lastSaved,
    validationErrors,
    editorMode,
    showLineNumbers,
    wordWrapEnabled,
    
    // 노트 수정 함수
    updateNote,
    updateTitle,
    updateContent,
    updateSummary,
    updateCategory,
    addTag,
    removeTag,
    setTags,
    
    // 에디터 제어 함수
    changeEditorMode,
    toggleMarkdownMode,
    setShowLineNumbers,
    setWordWrapEnabled,
    
    // 텍스트 편집 함수
    insertText,
    applyMarkdownFormat,
    
    // 저장 관련 함수
    saveNote,
    validateNote,
    resetEditor,
    
    // 유틸리티
    canSave: isDirty && validationErrors.length === 0,
    hasUnsavedChanges: isDirty,
    characterCount: note.content.length,
    wordCount: note.content.trim().split(/\s+/).filter(word => word.length > 0).length,
    isOverLimit: note.content.length > EDITOR_CONFIG.MAX_CONTENT_LENGTH
  };
};