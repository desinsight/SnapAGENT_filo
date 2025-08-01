/**
 * 공용노트 패널 메인 컴포넌트
 * 
 * @description 공용노트 서비스의 메인 컨테이너 - 공유 노트 및 협업 기능
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSharedNotes } from './hooks/useSharedNotes';
import { useCollaboration } from './hooks/useCollaboration';
import { useNoteEditor } from './hooks/useNoteEditor';

// UI 컴포넌트들
import SharedNoteHeader from './components/shared/SharedNoteHeader';
import SharedNoteList from './components/shared/SharedNoteList';
import NoteCreationPanel from './components/editor/NoteCreationPanel';
import CollaborationPanel from './components/shared/CollaborationPanel';
import ShareDialog from './components/shared/ShareDialog';
import InviteDialog from './components/shared/InviteDialog';
import NoteViewModal from './components/ui/NoteViewModal';
import { SelectionProvider } from './components/editor/selection/context/SelectionContext.jsx';

// 기본 설정
import { DEFAULT_SETTINGS } from './constants/noteConfig';

const SharedNotePanel = ({ 
  activePanel = 'shared-notes',
  onNotification,
  userId = 'anonymous'
}) => {
  // 공유 노트 관련 상태 및 함수
  const {
    sharedNotes,
    selectedNote,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    viewMode,
    loadSharedNotes,
    searchSharedNotes,
    createSharedNote,
    updateSharedNote,
    deleteSharedNote,
    selectNote,
    updateFilters,
    changePage,
    changeSortBy,
    changeViewMode,
    loadMoreNotes,
    refreshNotes,
    clearError,
    hasMoreNotes
  } = useSharedNotes();

  // 협업 관련 상태 및 함수
  const {
    activeCollaborators,
    invitations,
    collaborationHistory,
    shareNote,
    inviteCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    acceptInvitation,
    declineInvitation,
    startCollaboration,
    endCollaboration,
    isCollaborating,
    collaborationStats
  } = useCollaboration();

  // 에디터 관련 상태
  const [editingNote, setEditingNote] = useState(null);
  const [showCreationPanel, setShowCreationPanel] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  
  // 모달 상태
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  
  // 공유 및 초대 모달 상태
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);

  // AI 관련 상태
  const [aiLoading, setAiLoading] = useState({});

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

  /**
   * 노트 저장 핸들러
   */
  async function handleSaveNote(noteData) {
    try {
      let result;
      
      if (editingNote) {
        // 기존 노트 업데이트
        result = await updateSharedNote(editingNote._id, noteData);
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
      
      return result;
    } catch (error) {
      notify(`노트 저장 실패: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 새 공유 노트 생성 시작
   */
  const handleCreateNote = useCallback(() => {
    setShowCreationPanel(true);
  }, []);

  /**
   * 노트 편집 시작
   */
  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
    setShowCreationPanel(true);
  }, []);

  /**
   * AI 기능 사용 핸들러
   */
  const handleUseAI = useCallback(async (action, content) => {
    try {
      setAiLoading(prev => ({ ...prev, [action]: true }));
      
      // TODO: 실제 AI API 호출 구현
      // 여기서는 임시로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let result;
      switch (action) {
        case 'spellCheck':
          result = { corrected: content + ' (맞춤법 검사 완료)' };
          break;
        case 'tagRecommendation':
          result = { tags: ['추천태그1', '추천태그2'] };
          break;
        case 'summary':
          result = { summary: 'AI가 생성한 요약입니다.' };
          break;
        default:
          result = { message: 'AI 기능이 실행되었습니다.' };
      }
      
      notify(`AI ${action} 완료`, 'success');
      return result;
    } catch (error) {
      notify(`AI 기능 실패: ${error.message}`, 'error');
      throw error;
    } finally {
      setAiLoading(prev => ({ ...prev, [action]: false }));
    }
  }, [notify]);

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
   * 노트 삭제
   */
  const handleDeleteNote = useCallback(async (note) => {
    if (window.confirm('정말로 이 공유 노트를 삭제하시겠습니까?')) {
      try {
        await deleteSharedNote(note._id);
        notify('공유 노트가 삭제되었습니다.', 'success');
        
        // 현재 편집 중인 노트가 삭제된 경우 패널 닫기
        if (editingNote && editingNote._id === note._id) {
          setShowCreationPanel(false);
          setEditingNote(null);
        }
      } catch (error) {
        notify(`공유 노트 삭제 실패: ${error.message}`, 'error');
      }
    }
  }, [deleteSharedNote, notify, editingNote]);

  /**
   * 노트 공유 시작
   */
  const handleShareNote = useCallback((note) => {
    setNoteToShare(note);
    setShowShareDialog(true);
  }, []);

  /**
   * 협업자 초대
   */
  const handleInviteCollaborator = useCallback((note) => {
    setNoteToShare(note);
    setShowInviteDialog(true);
  }, []);

  /**
   * 협업 시작
   */
  const handleStartCollaboration = useCallback((note) => {
    setEditingNote(note);
    setShowCollaborationPanel(true);
    startCollaboration(note._id);
  }, [startCollaboration]);

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
    notify('공유 노트 목록이 새로고침되었습니다.', 'info');
  }, [refreshNotes, notify]);

  /**
   * 즐겨찾기 토글
   */
  const handleToggleFavorite = useCallback(async (note) => {
    try {
      // 노트 업데이트로 즐겨찾기 상태 변경
      const updatedNote = await updateSharedNote(note._id, { 
        isFavorite: !note.isFavorite,
        isBookmarked: !note.isFavorite 
      });
      
      notify(
        updatedNote.isFavorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.',
        'success'
      );
    } catch (error) {
      notify(`즐겨찾기 토글 실패: ${error.message}`, 'error');
    }
  }, [updateSharedNote, notify]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      notify(`오류 발생: ${error}`, 'error');
      clearError();
    }
  }, [error, notify, clearError]);

  // 패널 변경 시 패널 닫기
  useEffect(() => {
    if (activePanel !== 'shared-notes') {
      setShowCreationPanel(false);
      setEditingNote(null);
      setShowCollaborationPanel(false);
    }
  }, [activePanel]);

  // 공유노트 패널이 아닌 경우 아무것도 렌더링하지 않음
  if (activePanel !== 'shared-notes') {
    return null;
  }

  // 새 공유 노트 생성 또는 편집 패널 표시
  if (showCreationPanel) {
    return (
      <SelectionProvider>
        <NoteCreationPanel
          isOpen={true}
          onClose={() => {
            setShowCreationPanel(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          onUseAI={handleUseAI}
          aiLoading={aiLoading}
          initialNote={editingNote}
          onNotification={notify}
          isSharedNote={true}
          onShare={handleShareNote}
          collaborators={activeCollaborators}
          onToggleMode={(newIsSharedMode) => {
            if (!newIsSharedMode) {
              // 공유노트에서 개인노트로 전환하려고 할 때
              notify('공유노트 패널에서는 개인노트 모드로 전환할 수 없습니다. 개인노트 패널을 사용해주세요.', 'warning');
            }
          }}
        />
      </SelectionProvider>
    );
  }

  // 협업 패널 표시
  if (showCollaborationPanel) {
    return (
      <CollaborationPanel
        isOpen={true}
        onClose={() => setShowCollaborationPanel(false)}
        note={editingNote}
        collaborators={activeCollaborators}
        onSave={handleSaveNote}
        userId={userId}
      />
    );
  }

  return (
    <SelectionProvider>
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full">
      {/* 헤더 */}
      <div className="flex-shrink-0">
        <SharedNoteHeader
          title="공용노트"
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
          noteCount={sharedNotes.length}
          loading={loading}
          collaborationStats={collaborationStats}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 공유 노트 목록 */}
        <div className="w-full flex flex-col h-full">
          <SharedNoteList
            notes={sharedNotes}
            viewMode={viewMode}
            selectedNoteId={selectedNote?._id}
            onNoteSelect={handleSelectNote}
            onNoteView={handleViewNote}
            onNoteEdit={handleEditNote}
            onNoteDelete={handleDeleteNote}
            onNoteFavorite={handleToggleFavorite}
            onNoteShare={handleShareNote}
            onInviteCollaborator={handleInviteCollaborator}
            onStartCollaboration={handleStartCollaboration}
            loading={loading}
            error={error}
            hasMore={hasMoreNotes}
            onLoadMore={loadMoreNotes}
            isLoadingMore={loading}
            activeCollaborators={activeCollaborators}
            userId={userId}
          />
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
      
      {/* 공유 다이얼로그 */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        note={noteToShare}
        onShare={shareNote}
      />
      
      {/* 초대 다이얼로그 */}
      <InviteDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        note={noteToShare}
        onInvite={inviteCollaborator}
      />
    </div>
    </SelectionProvider>
  );
};

export default SharedNotePanel;