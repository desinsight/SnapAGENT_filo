import React, { useEffect, useRef } from 'react';

// 아이콘 컴포넌트들
const OpenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PasteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RenameIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AIIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const ContextMenu = ({
  x,
  y,
  file,
  selectedFiles,
  clipboard,
  onClose,
  onAction
}) => {
  const menuRef = useRef(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 메뉴 위치 조정
  const getMenuStyle = () => {
    const menuWidth = 240;
    const menuHeight = 400; // 대략적인 메뉴 높이
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    // 화면 오른쪽 경계 확인
    if (x + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 10;
    }

    // 화면 하단 경계 확인
    if (y + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 10;
    }

    return {
      position: 'fixed',
      left: `${Math.max(10, left)}px`,
      top: `${Math.max(10, top)}px`,
      zIndex: 1000
    };
  };

  // 액션 핸들러
  const handleAction = (action) => {
    console.log('[DEBUG] ContextMenu handleAction 호출됨:', { action, file, selectedFiles });
    onAction(action, file, selectedFiles);
    onClose();
  };

  // 메뉴 아이템 정의
  const getMenuItems = () => {
    const isMultipleSelected = selectedFiles && selectedFiles.length > 1;
    const isDirectory = file?.isDirectory;
    const isBackground = !file; // 빈 영역 우클릭

    // 빈 영역 우클릭시 다른 메뉴
    if (isBackground) {
      return [
        {
          id: 'paste',
          label: `붙여넣기${clipboard?.files?.length ? ` (${clipboard.files.length}개 파일)` : ''}`,
          icon: <PasteIcon />,
          shortcut: 'Ctrl+V',
          disabled: !clipboard?.files?.length,
          action: () => {
            console.log('[DEBUG] ContextMenu paste action 클릭됨', clipboard);
            handleAction('paste');
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'refresh',
          label: '새로 고침',
          icon: <OpenIcon />, // 임시로 OpenIcon 사용
          shortcut: 'F5',
          action: () => handleAction('refresh')
        }
      ];
    }

    const items = [
      // 기본 액션
      {
        id: 'open',
        label: isDirectory ? '윈도우 탐색기로 열기' : '열기',
        icon: <OpenIcon />,
        shortcut: 'Enter',
        disabled: isMultipleSelected,
        action: () => handleAction('open')
      },
      {
        type: 'separator'
      },
      
      // 편집 액션
      {
        id: 'copy',
        label: `복사${isMultipleSelected ? ` (${selectedFiles.length}개)` : ''}`,
        icon: <CopyIcon />,
        shortcut: 'Ctrl+C',
        action: () => {
          console.log('[DEBUG] ContextMenu copy action 클릭됨', { file, selectedFiles });
          handleAction('copy');
        }
      },
      {
        id: 'cut',
        label: `잘라내기${isMultipleSelected ? ` (${selectedFiles.length}개)` : ''}`,
        icon: <CutIcon />,
        shortcut: 'Ctrl+X',
        action: () => handleAction('cut')
      },
      {
        id: 'paste',
        label: `붙여넣기${clipboard?.files?.length ? ` (${clipboard.files.length}개 파일)` : ''}`,
        icon: <PasteIcon />,
        shortcut: 'Ctrl+V',
        disabled: !clipboard?.files?.length,
        action: () => {
          console.log('[DEBUG] ContextMenu paste action 클릭됨 (파일 메뉴)', clipboard);
          handleAction('paste');
        }
      },
      {
        type: 'separator'
      },
      
      // 파일 관리
      {
        id: 'rename',
        label: '이름 바꾸기',
        icon: <RenameIcon />,
        shortcut: 'F2',
        disabled: isMultipleSelected,
        action: () => handleAction('rename')
      },
      {
        id: 'delete',
        label: `삭제${isMultipleSelected ? ` (${selectedFiles.length}개)` : ''}`,
        icon: <DeleteIcon />,
        shortcut: 'Delete',
        danger: true,
        action: () => handleAction('delete')
      },
      {
        type: 'separator'
      },
      
      // 즐겨찾기 및 공유
      {
        id: 'favorite',
        label: '즐겨찾기 추가',
        icon: <StarIcon />,
        disabled: isMultipleSelected,
        action: () => handleAction('favorite')
      },
      {
        id: 'share',
        label: '공유',
        icon: <ShareIcon />,
        disabled: isMultipleSelected,
        action: () => handleAction('share')
      },
      {
        type: 'separator'
      },
      
      // 파일 분석 기능
      {
        id: 'file-analyze',
        label: `파일 분석${isMultipleSelected ? ` (${selectedFiles.length}개)` : ''}`,
        icon: <AIIcon />,
        action: () => handleAction('file-analyze')
      },
      {
        type: 'separator'
      },
      
      // 정보
      {
        id: 'properties',
        label: '속성',
        icon: <InfoIcon />,
        disabled: isMultipleSelected,
        action: () => handleAction('properties')
      }
    ];

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div
      ref={menuRef}
      style={getMenuStyle()}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[240px] max-w-[280px]"
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={`separator-${index}`}
              className="my-1 border-t border-gray-200 dark:border-gray-700"
            />
          );
        }

        return (
          <button
            key={item.id}
            onClick={item.action}
            disabled={item.disabled}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
              ${item.disabled
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;