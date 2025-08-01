/**
 * 노트 목록 컴포넌트
 * 
 * @description 노트들을 그리드, 리스트, 카드 형태로 표시하는 목록 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import NoteCard from './NoteCard';
import { VIEW_MODES } from '../../constants/noteConfig';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { ObjectId } from 'bson';

// 목업 데이터 생성 함수 (NoteCard에서 import)
const generateMockNotes = () => {
  const mockCollaborators = [
    { name: '김철수', avatar: null },
    { name: '이영희', avatar: null },
    { name: '박민수', avatar: null },
    { name: '정수진', avatar: null },
    { name: '최지원', avatar: null },
    { name: '한소영', avatar: null }
  ];

  return [
    {
      _id: '1',
      title: '개인 노트 - 작성자만',
      content: '이 노트는 작성자만 있는 개인 노트입니다.',
      category: '개인',
      tags: ['개인', '테스트'],
      isFavorite: true,
      isShared: false,
      isSecret: false,
      isLocked: false,
      author: { name: '김철수', avatar: null },
      authorId: 'user1',
      collaborators: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      editCount: 2
    },
    {
      _id: '2',
      title: '2명 협업 노트',
      content: '이 노트는 2명이 협업하는 노트입니다.',
      category: '업무',
      tags: ['업무', '협업'],
      isFavorite: false,
      isShared: true,
      isSecret: false,
      isLocked: false,
      author: { name: '이영희', avatar: null },
      authorId: 'user2',
      collaborators: [mockCollaborators[1]],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      editCount: 8
    },
    {
      _id: '2-locked',
      title: '잠금 협업 노트',
      content: '이 노트는 잠금 노트입니다. 카드는 보이지만 참여하려면 승인이 필요합니다.',
      category: '잠금',
      tags: ['잠금', '승인필요'],
      isFavorite: true,
      isShared: true,
      isSecret: false,
      isLocked: true,
      author: { name: '이영희', avatar: null },
      authorId: 'user2',
      collaborators: [mockCollaborators[1]],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      editCount: 8
    },
    {
      _id: '2-secret',
      title: '비밀 협업 노트',
      content: '이 노트는 비밀 노트입니다. 초대받기 전까지는 카드가 보이지 않습니다.',
      category: '비밀',
      tags: ['비밀', '초대필요'],
      isFavorite: true,
      isShared: true,
      isSecret: true,
      isLocked: false,
      author: { name: '이영희', avatar: null },
      authorId: 'user2',
      collaborators: [mockCollaborators[1]],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      editCount: 8
    },
    {
      _id: '3',
      title: '3명 협업 노트',
      content: '이 노트는 3명이 협업하는 노트입니다.',
      category: '프로젝트',
      tags: ['프로젝트', '팀워크'],
      isFavorite: true,
      isShared: true,
      isSecret: false,
      isLocked: false,
      author: { name: '박민수', avatar: null },
      authorId: 'user3',
      collaborators: [mockCollaborators[2], mockCollaborators[3]],
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      editCount: 15
    },
    {
      _id: '4',
      title: '4명 협업 노트',
      content: '이 노트는 4명이 협업하는 노트입니다. 프로필이 3명까지만 표시되고 나머지는 +1로 표시됩니다.',
      category: '학습',
      tags: ['학습', '그룹스터디'],
      isFavorite: false,
      isShared: true,
      author: { name: '정수진', avatar: null },
      collaborators: [mockCollaborators[4], mockCollaborators[5], mockCollaborators[0]],
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
      editCount: 22
    },
    {
      _id: '5',
      title: '5명 협업 노트',
      content: '이 노트는 5명이 협업하는 노트입니다. 프로필이 3명까지만 표시되고 나머지는 +2로 표시됩니다.',
      category: '아이디어',
      tags: ['아이디어', '브레인스토밍'],
      isFavorite: true,
      isShared: true,
      author: { name: '최지원', avatar: null },
      collaborators: [mockCollaborators[1], mockCollaborators[2], mockCollaborators[3], mockCollaborators[4]],
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
      editCount: 31
    },
    {
      _id: '6',
      title: '6명 협업 노트',
      content: '이 노트는 6명이 협업하는 노트입니다. 프로필이 3명까지만 표시되고 나머지는 +3으로 표시됩니다.',
      category: '할일',
      tags: ['할일', '팀프로젝트'],
      isFavorite: false,
      isShared: true,
      author: { name: '한소영', avatar: null },
      collaborators: [mockCollaborators[0], mockCollaborators[1], mockCollaborators[2], mockCollaborators[3], mockCollaborators[4]],
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      updatedAt: new Date(Date.now() - 18000000).toISOString(),
      editCount: 45
    }
  ];
};

const NoteList = ({
  notes = [],
  viewMode = VIEW_MODES.GRID,
  selectedNoteId = null,
  onNoteSelect,
  onNoteView,
  onNoteEdit,
  onNoteDelete,
  onNoteFavorite,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  showNoteType = false, // 노트 타입 표시 여부
  useMockData = true, // 목업 데이터 사용 여부 (테스트용)
  currentUserId = null, // 현재 사용자 ID
  isParticipant = false, // 참여 여부 (기본값)
  invitedNoteIds = [] // 초대받은 비밀노트 ID 목록
}) => {
  // 목업 데이터 상태
  const [mockNotes, setMockNotes] = useState([]);
  
  // 목업 데이터 초기화
  useEffect(() => {
    if (useMockData) {
      setMockNotes(generateMockNotes());
    }
  }, [useMockData]);
  
  // 테스트용 데이터 (실제로는 props로 받아야 함)
  const testCurrentUserId = currentUserId || 'user1'; // 테스트용 사용자 ID
  const testInvitedNoteIds = invitedNoteIds.length > 0 ? invitedNoteIds : ['2-secret']; // 테스트용 초대받은 노트 ID

  // 노트 필터링 함수
  const filterNotes = (noteList) => {
    return noteList.filter(note => {
      // 비밀노트인 경우 초대받았거나 작성자인 경우만 표시
      if (note.isSecret) {
        const isAuthor = note.authorId === testCurrentUserId;
        const isInvited = testInvitedNoteIds.includes(note._id || note.id);
        return isAuthor || isInvited;
      }
      // 잠금노트와 일반노트는 모두 표시
      return true;
    });
  };

  // 실제 노트 또는 목업 노트 사용 (필터링 적용)
  const displayNotes = useMockData ? filterNotes(mockNotes) : filterNotes(notes);

  // 무한 스크롤 훅
  const { 
    sentinelRef, 
    handleScroll, 
    isLoadingMore: infiniteScrollLoading 
  } = useInfiniteScroll({
    loadMore: onLoadMore,
    hasMore,
    loading,
    enabled: !!onLoadMore
  });

  /**
   * 로딩 스켈레톤 렌더링
   */
  const renderLoadingSkeleton = () => {
    const skeletonCount = viewMode === VIEW_MODES.LIST ? 5 : 8;
    
    return (
      <div className={getContainerClasses()}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse ${getSkeletonClasses()}`}
          >
            {/* 스켈레톤 내용 */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * 에러 상태 렌더링
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        오류가 발생했습니다
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {error || '노트를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.'}
      </p>
    </div>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        노트가 없습니다
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        첫 번째 노트를 작성해보세요. 아이디어, 할 일, 메모 등 무엇이든 기록할 수 있습니다.
      </p>
      <button
        onClick={() => onNoteEdit?.(null)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        첫 노트 작성하기
      </button>
    </div>
  );

  /**
   * 컨테이너 CSS 클래스 생성
   */
  const getContainerClasses = () => {
    const baseClasses = "p-6";
    
    switch (viewMode) {
      case VIEW_MODES.GRID:
        return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`;
      
      case VIEW_MODES.LIST:
        return `${baseClasses} space-y-2`;
      
      default:
        return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`;
    }
  };

  /**
   * 스켈레톤 CSS 클래스 생성
   */
  const getSkeletonClasses = () => {
    const baseClasses = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4";
    
    switch (viewMode) {
      case VIEW_MODES.GRID:
        return `${baseClasses} aspect-[4/3]`;
      
      case VIEW_MODES.LIST:
        return `${baseClasses} h-20`;
      
      default:
        return `${baseClasses} aspect-[4/3]`;
    }
  };

  /**
   * 노트 핸들러들
   */
  const handleNoteClick = (note) => {
    if (onNoteSelect) {
      onNoteSelect(note);
    }
  };

  const handleNoteDoubleClick = (note) => {
    if (onNoteView) {
      onNoteView(note);
    }
  };

  const handleNoteFavoriteToggle = (note, event) => {
    event.stopPropagation(); // 상위 클릭 이벤트 방지
    if (onNoteFavorite) {
      onNoteFavorite(note);
    }
  };

  const handleNoteDelete = (note, event) => {
    event.stopPropagation(); // 상위 클릭 이벤트 방지
    if (onNoteDelete) {
      onNoteDelete(note);
    }
  };

  // 로딩 상태 처리
  if (loading) {
    return renderLoadingSkeleton();
  }

  // 에러 상태 처리
  if (error) {
    return renderError();
  }

  // 빈 상태 처리
  if (!displayNotes || displayNotes.length === 0) {
    return renderEmpty();
  }

  /**
   * 로딩 더 보기 스켈레톤 렌더링
   */
  const renderLoadMoreSkeleton = () => (
    <div className={getContainerClasses()}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={`animate-pulse ${getSkeletonClasses()}`}
        >
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 노트 목록 렌더링
  return (
    <div 
      className="flex-1 overflow-y-auto custom-scrollbar h-full"
      onScroll={handleScroll}
    >
      <div className={getContainerClasses()}>
        {displayNotes.map((note) => {
          const key = note._id || note.id || new ObjectId().toString();
          return (
            <NoteCard
              key={key}
              note={note}
              viewMode={viewMode}
              isSelected={selectedNoteId === (note._id || note.id)}
              onClick={() => handleNoteClick(note)}
              onDoubleClick={() => handleNoteDoubleClick(note)}
              onFavoriteToggle={(event) => handleNoteFavoriteToggle(note, event)}
              onDelete={(event) => handleNoteDelete(note, event)}
              onEdit={(note) => onNoteEdit?.(note)}
              showNoteType={showNoteType}
              currentUserId={testCurrentUserId}
              isParticipant={isParticipant}
            />
          );
        })}
        
        {/* 무한 스크롤 센티널 */}
        {hasMore && (
          <div 
            ref={sentinelRef} 
            className="w-full h-20 flex items-center justify-center"
          >
            <div className="text-sm text-gray-400 dark:text-gray-500">
              아래로 스크롤하여 더 보기
            </div>
          </div>
        )}
        
        {/* 로딩 더 보기 */}
        {(isLoadingMore || infiniteScrollLoading) && renderLoadMoreSkeleton()}
        
        {/* 더 이상 로드할 데이터가 없을 때 */}
        {!hasMore && displayNotes.length > 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span>모든 노트를 불러왔어요</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;