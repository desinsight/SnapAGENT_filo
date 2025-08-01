import React, { useState } from 'react';
import { 
  FolderIcon, 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon, 
  ArchiveBoxIcon,
  CodeBracketIcon,
  FilmIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid';

const FileItem = ({ 
  file, 
  viewMode, 
  isSelected, 
  isDuplicate,
  onClick, 
  onDoubleClick, 
  onSelect,
  onContextMenu,
  fileIcon,
  isFavorited = false,
  onFavoriteToggle
}) => {
  const getFileIcon = () => {
    if (file.isDirectory) {
      return <FolderSolidIcon className="w-12 h-12 text-blue-500" />;
    }

    const ext = file.extension?.toLowerCase();
    
    // 이미지 파일
    if (/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(file.name)) {
      return <PhotoIcon className="w-12 h-12 text-green-500" />;
    }
    
    // 비디오 파일
    if (/\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i.test(file.name)) {
      return <VideoCameraIcon className="w-12 h-12 text-purple-500" />;
    }
    
    // 오디오 파일
    if (/\.(mp3|wav|flac|aac|ogg|wma|m4a)$/i.test(file.name)) {
      return <MusicalNoteIcon className="w-12 h-12 text-pink-500" />;
    }
    
    // 코드 파일
    if (/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml)$/i.test(file.name)) {
      return <CodeBracketIcon className="w-12 h-12 text-orange-500" />;
    }
    
    // 문서 파일
    if (/\.(pdf|doc|docx|txt|odt|rtf)$/i.test(file.name)) {
      return <DocumentTextIcon className="w-12 h-12 text-red-500" />;
    }
    
    // 압축 파일
    if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(file.name)) {
      return <ArchiveBoxIcon className="w-12 h-12 text-yellow-600" />;
    }
    
    // 프레젠테이션
    if (/\.(ppt|pptx|odp)$/i.test(file.name)) {
      return <PresentationChartLineIcon className="w-12 h-12 text-orange-600" />;
    }
    
    // 3D/모델 파일
    if (/\.(obj|fbx|stl|3ds|dae)$/i.test(file.name)) {
      return <CubeIcon className="w-12 h-12 text-indigo-500" />;
    }

    return <DocumentIcon className="w-12 h-12 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleClick = (e) => {
    console.log('[FileItem] handleClick 호출됨:', file.name);
    e.stopPropagation();
    e.preventDefault(); // 기본 동작도 막기
    
    // onClick prop이 있으면 사용 (FileExplorerPanel의 handleFileClick)
    if (onClick) {
      console.log('[FileItem] onClick prop 호출');
      onClick(file, e);
    } else {
      // fallback: 기본 선택 동작
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + 클릭: 다중 선택
        onSelect(file);
      } else {
        // 일반 클릭: 파일/폴더 선택만 (폴더는 더블클릭으로 들어가게)
        onSelect(file);
      }
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (file.isDirectory) {
      // 폴더: 네비게이션
      onDoubleClick(file);
    } else {
      // 파일: 실행/열기
      onDoubleClick(file);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 바로 컨텍스트 메뉴 표시 (선택 없이도 가능)
    onContextMenu(e, file);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'file',
      file: file,
      source: 'fileManager'
    }));
    
    // 드래그 중인 파일에 시각적 피드백
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    // 드래그 종료 시 시각적 피드백 제거
    e.target.style.opacity = '1';
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    if (file.isDirectory) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (file.isDirectory) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    if (!file.isDirectory) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const draggedData = e.dataTransfer.getData('application/json');
    if (draggedData) {
      try {
        const data = JSON.parse(draggedData);
        if (data.type === 'file' && data.source === 'fileManager') {
          const sourceFile = data.file;
          // 자기 자신으로 드롭하거나 같은 경로인 경우 무시
          if (sourceFile.path === file.path || sourceFile.path.includes(file.path)) {
            return;
          }
          
          // 폴더로 파일 이동 - onDoubleClick으로 이동 이벤트 전달
          if (onDoubleClick) {
            onDoubleClick({
              type: 'move',
              source: sourceFile.path,
              destination: file.path,
              sourceFile: sourceFile,
              targetFolder: file
            });
          }
        }
      } catch (error) {
        console.warn('Failed to parse drag data in folder drop:', error);
      }
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(file);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`grid grid-cols-12 gap-4 items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
        } ${isDragOver ? 'bg-green-100 dark:bg-green-900 ring-2 ring-green-500' : ''}`}
        data-file-path={file.path}
        draggable={true}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ height: '48px', maxHeight: '48px', alignSelf: 'flex-start' }}
      >
        {/* 아이콘 섹션 */}
        <div className="col-span-1 flex justify-start">
          <div className="w-5 h-5 flex-shrink-0">
            {file.isDirectory ? (
              <FolderIcon className="w-full h-full text-blue-500" />
            ) : (
              <DocumentIcon className="w-full h-full text-gray-500" />
            )}
          </div>
        </div>
        
        {/* 파일명 섹션 */}
        <div className="col-span-6">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
        </div>
        
        {/* 즐겨찾기 섹션 */}
        <div className="col-span-1 flex justify-center">
          <button
            onClick={handleFavoriteClick}
            className={`w-5 h-5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors ${
              isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={isFavorited ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
          >
            <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
        
        {/* 파일 크기 섹션 */}
        <div className="col-span-2 text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </span>
        </div>
        
        {/* 수정일 섹션 */}
        <div className="col-span-2 text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(file.modifiedAt)}
          </span>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`group relative flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
      } ${isDuplicate ? 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20' : ''} ${
        isDragOver ? 'bg-green-100 dark:bg-green-900 ring-2 ring-green-500 scale-105' : ''
      }`}
      data-file-path={file.path}
      draggable={true}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ height: '120px', maxHeight: '120px', alignSelf: 'flex-start' }}
    >
      <div className="relative">
        {fileIcon ? (
          <img 
            src={fileIcon} 
            alt={file.name} 
            className="w-12 h-12 object-contain" 
            style={{ imageRendering: 'auto' }}
            onError={(e) => {
              console.warn('Failed to load file icon for:', file.name);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div style={{ display: fileIcon ? 'none' : 'block' }}>
          {getFileIcon()}
        </div>
        
        {/* 즐겨찾기 별표 - 우측 상단 */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute -top-3 -right-5 w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 group-hover:opacity-100 ${
            isFavorited ? 'opacity-100 text-yellow-500' : 'opacity-0 text-gray-400 hover:text-yellow-500'
          }`}
          title={isFavorited ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
        >
          <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {isSelected && (
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {isDuplicate && !isSelected && (
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center" title="중복 파일">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-center text-gray-700 dark:text-gray-300 w-full truncate">
        {file.name}
      </p>
      {!file.isDirectory && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
      )}
    </div>
  );
};

export default FileItem;