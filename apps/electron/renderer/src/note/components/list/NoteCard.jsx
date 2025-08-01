/**
 * 노트 카드 컴포넌트
 * 
 * @description 개별 노트를 표시하는 카드 컴포넌트 - 뷰모드에 따라 다른 레이아웃 제공
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { VIEW_MODES } from '../../constants/noteConfig';
import { formatDate, generatePreview, getCategoryColorClass, getCategoryInfo, calculateReadingTime } from '../../utils/noteHelpers';



// 부드러운 색상 팔레트 - 화이트 톤으로 변경
const SOFT_COLORS = {
  personal: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500/70'
  },
  work: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500/70'
  },
  ideas: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500/70'
  },
  study: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-green-500/10 text-green-600 dark:text-green-400',
    dot: 'bg-green-500/70'
  },
  projects: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500/70'
  },
  archive: { 
    bg: 'bg-white dark:bg-gray-900', 
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-500/70'
  }
};

// 사용자 아바타 생성 함수
const generateAvatar = (name, seed = 0) => {
  const colors = [
    'bg-gradient-to-br from-pink-200 to-rose-200',
    'bg-gradient-to-br from-blue-200 to-indigo-200', 
    'bg-gradient-to-br from-green-200 to-emerald-200',
    'bg-gradient-to-br from-purple-200 to-violet-200',
    'bg-gradient-to-br from-amber-200 to-orange-200',
    'bg-gradient-to-br from-teal-200 to-cyan-200'
  ];
  
  const colorIndex = (name?.charCodeAt(0) + seed) % colors.length;
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  
  return {
    color: colors[colorIndex],
    initial
  };
};

const NoteCard = ({
  note,
  viewMode = VIEW_MODES.GRID,
  isSelected = false,
  onClick,
  onDoubleClick,
  onFavoriteToggle,
  onDelete,
  onEdit,
  showNoteType = false,
  isParticipant = false, // 참여 여부
  currentUserId = null // 현재 사용자 ID
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // 노트 데이터 추출
  const {
    _id,
    title = '제목 없음',
    content = '',
    summary = '',
    category = 'personal',
    folder = 'personal',
    tags = [],
    isFavorite = false,
    createdAt,
    updatedAt,
    editCount = 0,
    isShared = false,
    collaborators = [],
    priority = 'normal',
    isSecret = false, // 비밀노트 여부 (초대받기 전까지 카드 숨김)
    isLocked = false, // 잠금노트 여부 (카드는 보이지만 참여 시 승인 필요)
    authorId = null // 작성자 ID
  } = note;

  // 유틸리티 데이터
  const folderTheme = SOFT_COLORS[folder || category] || SOFT_COLORS.personal;
  const preview = summary || generatePreview(content);
  const readingTime = calculateReadingTime(content);
  const hasAttachments = note.attachments && note.attachments.length > 0;
  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  
  // 작성자/협업자 정보 (기본값 설정)
  const author = note.author || { name: 'Anonymous', avatar: null };
  const allCollaborators = [author, ...(collaborators || [])];
  const visibleCollaborators = allCollaborators.slice(0, 3);
  const remainingCount = Math.max(0, allCollaborators.length - 3);

  /**
   * 카드 클릭 핸들러
   */
  const handleClick = (event) => {
    event.preventDefault();
    if (onClick) {
      onClick(note);
    }
  };

  /**
   * 카드 더블클릭 핸들러
   */
  const handleDoubleClick = (event) => {
    event.preventDefault();
    if (onDoubleClick) {
      onDoubleClick(note);
    }
  };

  /**
   * View 버튼 클릭 핸들러
   */
  const handleViewClick = (event) => {
    event.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(note);
    }
  };

  /**
   * 즐겨찾기 토글 핸들러
   */
  const handleFavoriteToggle = (event) => {
    event.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(event);
    }
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(event);
    }
  };

  /**
   * 편집 핸들러
   */
  const handleEdit = (event) => {
    event.stopPropagation();
    setShowMoreMenu(false);
    if (onEdit) {
      onEdit(note);
    }
  };

  /**
   * 더보기 메뉴 토글
   */
  const handleMoreClick = (event) => {
    event.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  };

  /**
   * 복사 핸들러
   */
  const handleCopy = (event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(content);
    setShowMoreMenu(false);
    // 알림 표시 로직 추가 가능
  };

  /**
   * 공유 핸들러
   */
  const handleShare = (event) => {
    event.stopPropagation();
    setShowMoreMenu(false);
    // 공유 모달 열기 로직 추가 가능
  };

  /**
   * 초대 핸들러
   */
  const handleInvite = (event) => {
    event.stopPropagation();
    setShowMoreMenu(false);
    // 초대 기능 구현
    console.log('초대:', note.title);
  };

  /**
   * 참여하기 핸들러
   */
  const handleJoin = (event) => {
    event.stopPropagation();
    setShowMoreMenu(false);
    
    if (isLocked) {
      // 잠금노트일 경우 작성자에게 승인 요청
      console.log('잠금노트 참여 승인 요청:', note.title, '작성자:', authorId);
      // TODO: 작성자에게 승인 요청 알림 전송
      alert(`${author.name}님에게 참여 승인을 요청했습니다.`);
    } else {
      // 일반 노트일 경우 바로 참여
      console.log('일반노트 참여:', note.title);
      // TODO: 바로 참여 처리
      alert('노트에 참여했습니다.');
    }
  };

  /**
   * 보관 핸들러
   */
  const handleArchive = (event) => {
    event.stopPropagation();
    setShowMoreMenu(false);
    // 보관 로직 추가 가능
  };

  /**
   * 그리드 뷰 렌더링
   */
  const renderGridView = () => (
    <div
      className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        isSelected 
          ? `${folderTheme.bg} ${folderTheme.border} border-2 shadow-lg` 
          : `${folderTheme.bg} ${folderTheme.border} border-2 hover:shadow-lg`
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          {/* 태그 - 좌측 상단 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full backdrop-blur-sm shadow-sm"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full backdrop-blur-sm shadow-sm">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* 즐겨찾기 버튼 */}
          <button
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-full transition-all duration-200 ${
              isFavorite 
                ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm'
            }`}
            title={isFavorite ? '북마크 해제' : '북마크 추가'}
          >
            <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          {/* 더보기 메뉴 버튼 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMoreClick}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 shadow-sm"
              title="더보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* 더보기 드롭다운 메뉴 */}
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded shadow-lg z-20 overflow-hidden">
                {isParticipant ? (
                  // 참여자일 경우: 초대하기, 공유하기, 편집하기, 삭제
                  <>
                    <button
                      onClick={handleInvite}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      초대하기
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 110-6 3 3 0 010 6zm6 6a3 3 0 110-6 3 3 0 010 6zM9 21a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                      공유하기
                    </button>
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      편집하기
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </button>
                    </div>
                  </>
                ) : (
                  // 참여자가 아닐 경우: 참여하기, 공유하기
                  <>
                    <button
                      onClick={handleJoin}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      참여하기
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 110-6 3 3 0 010 6zm6 6a3 3 0 110-6 3 3 0 010 6zM9 21a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                      공유하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View 버튼 - 오른쪽 하단 */}
      <button
        onClick={handleViewClick}
        className="absolute bottom-4 right-4 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-md"
        title="노트 보기"
      >
        View
      </button>

      {/* 제목 */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight mt-8">
        {title}
      </h3>

      {/* 미리보기 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 line-clamp-2 leading-relaxed min-h-[3rem]">
        {preview}
      </p>



      {/* 작성자/협업자 정보 */}
      <div className="flex items-center justify-between mb-4 min-h-[2.5rem]">
        <div className="flex items-center space-x-2">
          {/* 프로필 아바타들 */}
          <div className="flex -space-x-2">
            {visibleCollaborators.map((collaborator, index) => {
              const avatar = generateAvatar(collaborator.name, index);
              return (
                <div key={index} className="relative">
                  {collaborator.avatar ? (
                    <img 
                      src={collaborator.avatar} 
                      alt={collaborator.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                    />
                  ) : (
                                      <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-xs font-bold text-gray-700 ${avatar.color}`}>
                    {avatar.initial}
                  </div>
                  )}
                </div>
              );
            })}
            {remainingCount > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                +{remainingCount}
              </div>
            )}
          </div>
          
          {/* 작성자 이름 */}
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{author.name}</span>
            {isShared && allCollaborators.length > 1 && (
              <span className="text-gray-500 dark:text-gray-400 ml-1">외 {allCollaborators.length - 1}명</span>
            )}
          </div>
        </div>
        

      </div>

      {/* 메타데이터 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(updatedAt)}</span>
          </span>
          
          {readingTime > 0 && (
            <span className="flex items-center space-x-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{readingTime}분</span>
            </span>
          )}
          
          <span className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{wordCount}</span>
          </span>

          {/* 잠금노트 표시 */}
          {isLocked && (
            <span className="flex items-center space-x-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
          )}

          {hasAttachments && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </div>
        

      </div>

    </div>
  );

  /**
   * 리스트 뷰 렌더링
   */
  const renderListView = () => (
    <div
      className={`group flex items-center p-5 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg backdrop-blur-sm ${
        isSelected 
          ? `${folderTheme.bg} ${folderTheme.border} border-2 shadow-md` 
          : `${folderTheme.bg} ${folderTheme.border} border-2`
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* 좌측: 프로필 */}
      <div className="flex items-center flex-shrink-0 mr-5">
        {/* 작성자 아바타 */}
        <div className="flex -space-x-1">
          {visibleCollaborators.slice(0, 2).map((collaborator, index) => {
            const avatar = generateAvatar(collaborator.name, index);
            return (
              <div key={index} className="relative">
                {collaborator.avatar ? (
                  <img 
                    src={collaborator.avatar} 
                    alt={collaborator.name}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-xs font-bold text-gray-700 ${avatar.color}`}>
                    {avatar.initial}
                  </div>
                )}
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>

      {/* 중앙: 제목과 미리보기 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h3>

            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {preview}
            </p>
          </div>
        </div>
      </div>

      {/* 우측: 메타데이터 & 액션 */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {/* 태그 */}
        {tags.length > 0 && (
          <div className="hidden lg:flex space-x-2">
            {tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-full backdrop-blur-sm shadow-sm"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-500 rounded-full backdrop-blur-sm shadow-sm">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 수정일 */}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
          {formatDate(updatedAt)}
        </span>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1">
          {/* 즐겨찾기 버튼 */}
          <button
            onClick={handleFavoriteToggle}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              isFavorite 
                ? 'bg-white/80 dark:bg-gray-800/80 text-black dark:text-white shadow-sm' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 shadow-sm'
            }`}
            title={isFavorite ? '북마크 해제' : '북마크 추가'}
          >
            <svg className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          {/* 더보기 메뉴 버튼 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMoreClick}
              className="p-1.5 bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-full transition-all duration-200 shadow-sm"
              title="더보기"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* 더보기 드롭다운 메뉴 */}
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded shadow-lg z-20 overflow-hidden">
                {isParticipant ? (
                  // 참여자일 경우: 초대하기, 공유하기, 편집하기, 삭제
                  <>
                    <button
                      onClick={handleInvite}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      초대하기
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 110-6 3 3 0 010 6zm6 6a3 3 0 110-6 3 3 0 010 6zM9 21a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                      공유하기
                    </button>
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      편집하기
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </button>
                    </div>
                  </>
                ) : (
                  // 참여자가 아닐 경우: 참여하기, 공유하기
                  <>
                    <button
                      onClick={handleJoin}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      참여하기
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 15.938 18 15.482 18 15c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 110-6 3 3 0 010 6zm6 6a3 3 0 110-6 3 3 0 010 6zM9 21a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                      공유하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* View 버튼 - 리스트뷰 전용 */}
        <button
          onClick={handleViewClick}
          className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-sm"
          title="노트 보기"
        >
          View
        </button>
      </div>
    </div>
  );

  // 뷰 모드에 따른 렌더링
  switch (viewMode) {
    case VIEW_MODES.LIST:
      return renderListView();
    case VIEW_MODES.GRID:
    default:
      return renderGridView();
  }
};

export default NoteCard;