/**
 * 노트 패널 메인 컴포넌트
 * 
 * @description 노트 서비스의 메인 컨테이너 - 개인노트 패널의 최상위 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotes } from './hooks/useNotes';
import { useSharedNotes } from './hooks/useSharedNotes';
import { useAI } from './hooks/useAI';
import { useNoteEditor } from './hooks/useNoteEditor';

// UI 컴포넌트들
import NoteHeader from './components/ui/NoteHeader';
import NoteList from './components/list/NoteList';

import NoteCreationPanel from './components/editor/NoteCreationPanel';
import DeleteConfirmModal from './components/ui/DeleteConfirmModal';
import NoteViewModal from './components/ui/NoteViewModal';
import ShareDialog from './components/shared/ShareDialog';
import { SelectionProvider } from './components/editor/selection/context/SelectionContext.jsx';

// 기본 설정
import { DEFAULT_SETTINGS } from './constants/noteConfig';

const NotePanel = ({ 
  activePanel = 'personal-notes',
  onNotification,
  userId = 'anonymous'
}) => {
  // 노트 관련 상태 및 함수
  const {
    notes,
    setNotes,
    selectedNote,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    viewMode,
    loadNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    updateFilters,
    changePage,
    changeSortBy,
    changeViewMode,
    loadMoreNotes,
    refreshNotes,
    clearError,
    hasMoreNotes
  } = useNotes();

  // 공유노트 관련 상태 및 함수
  const {
    sharedNotes,
    createSharedNote,
    updateSharedNote,
    deleteSharedNote,
    loadSharedNotes,
    searchSharedNotes
  } = useSharedNotes();

  // AI 기능 관련 상태 및 함수
  const {
    loading: aiLoading,
    results: aiResults,
    error: aiError,
    checkSpelling,
    recommendTags,
    generateSummary,
    analyzeNote,
    clearError: clearAIError
  } = useAI();

  // 에디터 관련 상태
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showCreationPanel, setShowCreationPanel] = useState(false);
  const [isSharedMode, setIsSharedMode] = useState(false); // 공유노트 모드 여부
  
  // 공유노트 관련 상태
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'personal' 또는 'shared'
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);
  
  // 모달 상태
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deletingNote, setDeletingNote] = useState(false);

  // 에디터 훅
  const {
    note: editorNote,
    isDirty,
    isAutoSaving,
    isSaving,
    saveNote: saveEditorNote,
    resetEditor,
    updateNote: updateEditorNote
  } = useNoteEditor(editingNote, handleSaveNote);

  // 알림 도우미 함수
  const notify = useCallback((message, type = 'info') => {
    if (onNotification) {
      onNotification(message, type);
    }
  }, [onNotification]);

  // 에러 처리 도우미 함수
  const handleError = useCallback((error, context = '작업') => {
    const message = error?.message || error || '알 수 없는 오류가 발생했습니다.';
    notify(`${context} 실패: ${message}`, 'error');
    console.error(`[${context}] Error:`, error);
  }, [notify]);

  /**
   * 노트 저장 핸들러
   */
  async function handleSaveNote(noteData) {
    try {
      let result;
      
      if (isSharedMode) {
        // 공유노트 모드일 때
        if (editingNote) {
          // 기존 공유 노트 업데이트
          result = await updateSharedNote(editingNote._id, {
            ...noteData,
            isShared: true,
            visibility: 'shared'
          });
          notify('공유 노트가 성공적으로 수정되었습니다.', 'success');
        } else {
          // 새 공유 노트 생성
          result = await createSharedNote({
            ...noteData,
            isShared: true,
            visibility: 'shared'
          });
          notify('새 공유 노트가 생성되었습니다.', 'success');
        }
      } else {
        // 개인노트 모드일 때
        if (editingNote) {
          // 기존 노트 업데이트
          result = await updateNote(editingNote._id, noteData);
          notify('노트가 성공적으로 수정되었습니다.', 'success');
        } else {
          // 새 노트 생성
          result = await createNote(noteData);
          notify('새 노트가 생성되었습니다.', 'success');
        }
      }
      
      // 성공 후 패널 닫기
      setShowCreationPanel(false);
      setEditingNote(null);
      setIsSharedMode(false); // 모드 초기화
      
      return result;
    } catch (error) {
      notify(`노트 저장 실패: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 새 노트 생성 시작
   */
  const handleCreateNote = useCallback(() => {
    setShowCreationPanel(true);
    setIsSharedMode(false); // 기본적으로 개인노트 모드
  }, []);

  /**
   * 모드 전환 핸들러 (개인노트 ↔ 공유노트)
   */
  const handleToggleMode = useCallback((newIsSharedMode) => {
    setIsSharedMode(newIsSharedMode);
    
    if (newIsSharedMode) {
      notify('공유노트 모드로 전환되었습니다. 협업 기능을 사용할 수 있습니다.', 'info');
    } else {
      notify('개인노트 모드로 전환되었습니다.', 'info');
    }
  }, [notify]);

  /**
   * 탭 전환 핸들러
   */
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'shared' || tab === 'all') {
      loadSharedNotes();
    }
  }, [loadSharedNotes]);

  /**
   * 노트 공유 핸들러
   */
  const handleShareNote = useCallback((note) => {
    setNoteToShare(note);
    setShowShareDialog(true);
  }, []);

  /**
   * 공유노트 삭제 핸들러
   */
  const handleDeleteSharedNote = useCallback(async (noteId) => {
    try {
      await deleteSharedNote(noteId);
      notify('공유 노트가 삭제되었습니다.', 'success');
    } catch (error) {
      notify(`공유 노트 삭제 실패: ${error.message}`, 'error');
    }
  }, [deleteSharedNote, notify]);

  /**
   * 노트 편집 시작
   */
  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
    setShowCreationPanel(true);
  }, []);

  /**
   * 노트 선택 (단일 클릭 - API 호출 없이 로컬 상태만 업데이트)
   */
  const handleSelectNote = useCallback((note) => {
    // API 호출 없이 로컬에서만 선택 상태 관리
    // selectNote(note._id); // 이 줄을 주석 처리하여 API 호출 방지
  }, []);

  /**
   * 노트 더블클릭 (모달로 보기 - API 호출 없이 직접 모달 표시)
   */
  const handleViewNote = useCallback((note) => {
    // 이미 가지고 있는 노트 데이터로 바로 모달 표시
    setViewingNote(note);
    setShowViewModal(true);
  }, []);

  /**
   * 노트 삭제 시작
   */
  const handleDeleteNote = useCallback((note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  }, []);

  /**
   * 노트 삭제 확인
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!noteToDelete) return;
    
    setDeletingNote(true);
    try {
      await deleteNote(noteToDelete._id);
      notify('노트가 삭제되었습니다.', 'success');
      
      // 현재 편집 중인 노트가 삭제된 경우 에디터 닫기
      if (editingNote && editingNote._id === noteToDelete._id) {
        setShowEditor(false);
        setEditingNote(null);
      }
      
      setShowDeleteModal(false);
      setNoteToDelete(null);
    } catch (error) {
      notify(`노트 삭제 실패: ${error.message}`, 'error');
    } finally {
      setDeletingNote(false);
    }
  }, [deleteNote, notify, editingNote, noteToDelete]);

  /**
   * 노트 삭제 취소
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  }, []);

  /**
   * 노트 즐겨찾기 토글
   */
  const handleToggleFavorite = useCallback(async (note) => {
    const newFavoriteState = !note.isFavorite;
    
    // 낙관적 업데이트: UI 먼저 변경
    setNotes(prev => prev.map(n => 
      n._id === note._id 
        ? { ...n, isFavorite: newFavoriteState, isBookmarked: newFavoriteState }
        : n
    ));
    
    try {
      await updateNote(note._id, { 
        isFavorite: newFavoriteState,
        isBookmarked: newFavoriteState 
      });
      
      notify(
        newFavoriteState ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.',
        'success'
      );
    } catch (error) {
      // 실패 시 롤백
      setNotes(prev => prev.map(n => 
        n._id === note._id 
          ? { ...n, isFavorite: note.isFavorite, isBookmarked: note.isFavorite }
          : n
      ));
      handleError(error, '즐겨찾기 토글');
    }
  }, [updateNote, notify, handleError, setNotes]);

  /**
   * 검색 핸들러
   */
  const handleSearchChange = useCallback((query) => {
    updateFilters({ search: query });
  }, [updateFilters]);

  /**
   * 필터 변경 핸들러
   */
  const handleFiltersChange = useCallback((newFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = useCallback(() => {
    refreshNotes();
    notify('노트 목록이 새로고침되었습니다.', 'info');
  }, [refreshNotes, notify]);

  /**
   * 에디터 닫기
   */
  const handleCloseEditor = useCallback(() => {
    if (isDirty) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')) {
        setShowEditor(false);
        setEditingNote(null);
        resetEditor();
      }
    } else {
      setShowEditor(false);
      setEditingNote(null);
      resetEditor();
    }
  }, [isDirty, resetEditor]);

  /**
   * AI 기능 사용 핸들러
   */
  const handleUseAI = useCallback(async (feature, content) => {
    try {
      let result;
      
      switch (feature) {
        case 'spellCheck':
          result = await checkSpelling(content);
          break;
        case 'tagRecommendation':
          result = await recommendTags(content);
          break;
        case 'summary':
          result = await generateSummary(content);
          break;
        case 'analyze':
          result = await analyzeNote(content);
          break;
        default:
          break;
      }
      
      if (result) {
        notify('AI 분석이 완료되었습니다.', 'success');
      }
      
      return result;
    } catch (error) {
      notify(`AI 기능 사용 실패: ${error.message}`, 'error');
    }
  }, [checkSpelling, recommendTags, generateSummary, analyzeNote, notify]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      notify(`오류 발생: ${error}`, 'error');
      clearError();
    }
  }, [error, notify, clearError]);

  useEffect(() => {
    if (aiError) {
      notify(`AI 기능 오류: ${aiError}`, 'error');
      clearAIError();
    }
  }, [aiError, notify, clearAIError]);

  // 패널 변경 시 에디터 닫기
  useEffect(() => {
    if (activePanel !== 'personal-notes') {
      setShowEditor(false);
      setEditingNote(null);
    }
  }, [activePanel]);

  // 개인노트 패널이 아닌 경우 아무것도 렌더링하지 않음
  if (activePanel !== 'personal-notes') {
    console.log('🚫 NotePanel: activePanel이 personal-notes가 아님:', activePanel);
    return null;
  }

  console.log('✅ NotePanel: personal-notes 패널 렌더링 시작');
  console.log('📊 NotePanel 상태:', {
    notesCount: notes.length,
    loading,
    error,
    filters,
    sortBy,
    viewMode
  });
  
  // 태그 디버깅용 로그
  if (notes.length > 0) {
    console.log('🏷️ 노트 태그 확인:', notes.map(note => ({
      id: note._id,
      title: note.title,
      tags: note.tags,
      tagsType: typeof note.tags,
      tagsLength: note.tags?.length
    })));
  }

  // 새 노트 생성 또는 편집 패널 표시
  if (showCreationPanel) {
    return (
      <SelectionProvider>
        <NoteCreationPanel
          isOpen={true}
          onClose={() => {
            setShowCreationPanel(false);
            setEditingNote(null);
            setIsSharedMode(false); // 패널 닫을 때 모드 초기화
          }}
          onSave={handleSaveNote}
          onUseAI={handleUseAI}
          aiLoading={aiLoading}
          initialNote={editingNote}
          onNotification={notify}
          isSharedNote={isSharedMode}
          onToggleMode={handleToggleMode}
        />
      </SelectionProvider>
    );
  }

  return (
    <SelectionProvider>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 h-full">
        {/* 헤더 */}
        <div className="flex-shrink-0">
          <NoteHeader
            title={
              activeTab === 'all' ? "전체 노트" :
              activeTab === 'personal' ? "개인노트" : "공유노트"
            }
            searchQuery={filters.search}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sortBy={sortBy}
            onSortChange={changeSortBy}
            viewMode={viewMode}
            onViewModeChange={changeViewMode}
            onCreateNote={handleCreateNote}
            onRefresh={handleRefresh}
            noteCount={
              activeTab === 'all' ? notes.length + sharedNotes.length :
              activeTab === 'personal' ? notes.length : sharedNotes.length
            }
            loading={loading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sharedNoteCount={sharedNotes.length}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 노트 목록 */}
          <div className="w-full flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
            {activeTab === 'all' ? (
              /* 전체 노트 표시 - 개인노트와 공유노트를 통합 */
              <NoteList
                notes={[
                  ...notes.map(note => ({ ...note, noteType: 'personal' })),
                  ...sharedNotes.map(note => ({ ...note, noteType: 'shared' }))
                ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))}
                viewMode={viewMode}
                selectedNoteId={selectedNote?._id}
                onNoteSelect={handleSelectNote}
                onNoteView={handleViewNote}
                onNoteEdit={handleEditNote}
                onNoteDelete={(note) => {
                  // 노트 타입에 따라 적절한 삭제 함수 호출
                  if (note.noteType === 'shared') {
                    handleDeleteSharedNote(note._id);
                  } else {
                    handleDeleteNote(note);
                  }
                }}
                onNoteFavorite={handleToggleFavorite}
                loading={loading.main}
                error={error}
                hasMore={hasMoreNotes}
                onLoadMore={loadMoreNotes}
                isLoadingMore={loading.more}
                showNoteType={true} // 노트 타입 표시 플래그
              />
            ) : activeTab === 'personal' ? (
              <NoteList
                notes={notes}
                viewMode={viewMode}
                selectedNoteId={selectedNote?._id}
                onNoteSelect={handleSelectNote}
                onNoteView={handleViewNote}
                onNoteEdit={handleEditNote}
                onNoteDelete={handleDeleteNote}
                onNoteFavorite={handleToggleFavorite}
                loading={loading.main}
                error={error}
                hasMore={hasMoreNotes}
                onLoadMore={loadMoreNotes}
                isLoadingMore={loading.more}
              />
            ) : (
              <NoteList
                notes={sharedNotes.map(note => ({ ...note, noteType: 'shared' }))}
                viewMode={viewMode}
                selectedNoteId={selectedNote?._id}
                onNoteSelect={handleSelectNote}
                onNoteView={handleViewNote}
                onNoteEdit={handleEditNote}
                onNoteDelete={handleDeleteSharedNote}
                onNoteFavorite={handleToggleFavorite}
                loading={loading.main}
                error={error}
                hasMore={hasMoreNotes}
                onLoadMore={loadMoreNotes}
                isLoadingMore={loading.more}
                showNoteType={true}
              />
            )}
          </div>
        </div>
        
        {/* 노트 보기 모달 */}
        <NoteViewModal
          note={viewingNote}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingNote(null);
          }}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          onFavoriteToggle={handleToggleFavorite}
        />

        {/* 삭제 확인 모달 */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          noteTitle={noteToDelete?.title}
          loading={deletingNote}
        />

        {/* 공유 다이얼로그 */}
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          note={noteToShare}
          onShare={(shareData) => {
            // TODO: 실제 공유 로직 구현
            notify('노트가 공유되었습니다.', 'success');
            setShowShareDialog(false);
          }}
        />
      </div>
    </SelectionProvider>
  );
};

export default NotePanel;