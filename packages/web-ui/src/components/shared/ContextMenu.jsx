import React, { useEffect, useRef } from 'react';
import { 
  FolderOpenIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  StarIcon,
  ShareIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ContextMenu = ({ 
  x, 
  y, 
  file, 
  selectedFiles, 
  onClose, 
  onDelete, 
  onToggleFavorite, 
  onAIAnalysis 
}) => {
  const menuRef = useRef(null);
  const isMultiSelect = selectedFiles.length > 1;
  const targetFiles = isMultiSelect ? selectedFiles : [file];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuItems = [
    {
      icon: FolderOpenIcon,
      label: file.isDirectory ? '폴더 열기' : '파일 열기',
      action: () => {
        console.log('Open:', file);
        onClose();
      },
      show: !isMultiSelect
    },
    {
      icon: EyeIcon,
      label: '미리보기',
      action: () => {
        console.log('Preview:', file);
        onClose();
      },
      show: !isMultiSelect && !file.isDirectory
    },
    {
      divider: true,
      show: !isMultiSelect
    },
    {
      icon: SparklesIcon,
      label: 'AI 분석',
      action: () => {
        onAIAnalysis(file);
        onClose();
      },
      show: !isMultiSelect && !file.isDirectory,
      className: 'text-purple-600 hover:bg-purple-50'
    },
    {
      divider: true,
      show: !isMultiSelect && !file.isDirectory
    },
    {
      icon: PencilIcon,
      label: '이름 바꾸기',
      action: () => {
        console.log('Rename:', file);
        onClose();
      },
      show: !isMultiSelect
    },
    {
      icon: DocumentDuplicateIcon,
      label: isMultiSelect ? `${targetFiles.length}개 복사` : '복사',
      action: () => {
        console.log('Copy:', targetFiles);
        onClose();
      }
    },
    {
      icon: DocumentDuplicateIcon,
      label: '바로가기 만들기',
      action: () => {
        console.log('Create shortcut:', file);
        onClose();
      },
      show: !isMultiSelect
    },
    {
      divider: true
    },
    {
      icon: StarIcon,
      label: '즐겨찾기에 추가',
      action: () => {
        onToggleFavorite(file);
        onClose();
      },
      show: !isMultiSelect
    },
    {
      icon: ShareIcon,
      label: '공유',
      action: () => {
        console.log('Share:', file);
        onClose();
      },
      show: !isMultiSelect
    },
    {
      icon: ArrowDownTrayIcon,
      label: isMultiSelect ? `${targetFiles.length}개 다운로드` : '다운로드',
      action: () => {
        console.log('Download:', targetFiles);
        onClose();
      }
    },
    {
      divider: true
    },
    {
      icon: TrashIcon,
      label: isMultiSelect ? `${targetFiles.length}개 삭제` : '삭제',
      action: () => {
        onDelete(targetFiles);
        onClose();
      },
      className: 'text-red-600 hover:bg-red-50'
    },
    {
      divider: true,
      show: !isMultiSelect
    },
    {
      icon: InformationCircleIcon,
      label: '속성',
      action: () => {
        console.log('Properties:', file);
        onClose();
      },
      show: !isMultiSelect
    }
  ];

  const filteredItems = menuItems.filter(item => item.show !== false);

  // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
  const adjustPosition = () => {
    if (!menuRef.current) return { x, y };

    const rect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > windowWidth) {
      adjustedX = windowWidth - rect.width - 10;
    }

    if (y + rect.height > windowHeight) {
      adjustedY = windowHeight - rect.height - 10;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = adjustPosition();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {filteredItems.map((item, index) => {
        if (item.divider) {
          return (
            <hr 
              key={index} 
              className="my-1 border-gray-200 dark:border-gray-700" 
            />
          );
        }

        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.action}
            className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
              item.className || ''
            }`}
          >
            <Icon className="w-4 h-4 mr-3" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;