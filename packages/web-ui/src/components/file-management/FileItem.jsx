import React from 'react';
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
  onClick, 
  onDoubleClick, 
  onSelect,
  onContextMenu,
  fileIcon 
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
    if (e.ctrlKey || e.metaKey) {
      onSelect(file);
    } else {
      onClick(file);
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick(file);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isSelected) {
      onClick(file);
    }
    onContextMenu(e, file);
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="w-6 h-6 mr-3 flex-shrink-0">
          {file.isDirectory ? (
            <FolderIcon className="w-full h-full text-blue-500" />
          ) : (
            <DocumentIcon className="w-full h-full text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-20 text-right">{formatFileSize(file.size)}</span>
          <span className="w-24">{formatDate(file.modifiedAt)}</span>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`group relative flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="relative">
        {fileIcon ? (
          <img src={fileIcon} alt={file.name} className="w-12 h-12" />
        ) : (
          getFileIcon()
        )}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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