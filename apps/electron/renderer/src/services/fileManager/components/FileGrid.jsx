import React, { useCallback } from 'react';
import FileItem from './FileItem';
import { useDropzone } from 'react-dropzone';

// 스크롤바 스타일링을 위한 CSS
const scrollbarStyles = `
  .file-grid-scrollable::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .file-grid-scrollable::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .file-grid-scrollable::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .file-grid-scrollable::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .file-grid-scrollable::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }
`;

// 스타일 태그를 head에 추가
if (typeof document !== 'undefined' && !document.getElementById('file-grid-scrollbar-styles')) {
  const style = document.createElement('style');
  style.id = 'file-grid-scrollbar-styles';
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

const FileGrid = ({ 
  files, 
  viewMode, 
  selectedFiles, 
  onFileClick, 
  onFileDoubleClick,
  onFileSelect,
  onContextMenu,
  fileIcons,
  currentPath,
  onFileDrop,
  duplicateFiles, // 중복 파일 정보 추가
  favoritedFiles, // 즐겨찾기된 파일 정보 추가
  onFavoriteToggle // 즐겨찾기 토글 핸들러 추가
}) => {
  // 드래그 앤 드롭 핸들러
  const onDrop = useCallback((acceptedFiles) => {
    if (onFileDrop) {
      onFileDrop(acceptedFiles, currentPath);
    }
  }, [onFileDrop, currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  const getGridClassName = () => {
    if (viewMode === 'list') {
      return 'flex flex-col';
    }
    return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4';
  };

  const ListHeader = () => (
    <div className="grid grid-cols-12 gap-4 items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      <div className="col-span-1"></div> {/* 아이콘 */}
      <div className="col-span-6">이름</div>
      <div className="col-span-1 flex justify-center">즐겨찾기</div>
      <div className="col-span-2 text-right">크기</div>
      <div className="col-span-2 text-right">수정일</div>
    </div>
  );

  return (
    <div 
      {...getRootProps()} 
      className={`flex-1 file-grid-background file-grid-scrollable`} 
      style={{
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            파일을 여기에 놓으세요
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="h-full file-grid-background"></div>
      ) : (
        <div className={`${getGridClassName()} file-grid-background`}>
          {viewMode === 'list' && <ListHeader />}
          {files.map((file) => (
            <FileItem
              key={file.path}
              file={file}
              viewMode={viewMode}
              isSelected={selectedFiles.some(f => f.path === file.path)}
              isDuplicate={duplicateFiles && duplicateFiles.has(file.path)}
              isFavorited={favoritedFiles && favoritedFiles.has(file.path)}
              onClick={onFileClick}
              onDoubleClick={onFileDoubleClick}
              onSelect={onFileSelect}
              onContextMenu={onContextMenu}
              onFavoriteToggle={onFavoriteToggle}
              fileIcon={fileIcons[file.path]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileGrid;