import React, { useCallback } from 'react';
import FileItem from './FileItem';
import { useDropzone } from 'react-dropzone';

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
  onFileDrop
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
      return 'flex flex-col space-y-1';
    }
    return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4';
  };

  return (
    <div 
      {...getRootProps()} 
      className={`flex-1 overflow-auto ${isDragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
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
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg">폴더가 비어있습니다</p>
          <p className="text-sm mt-2">파일을 드래그하여 추가하세요</p>
        </div>
      ) : (
        <div className={getGridClassName()}>
          {files.map((file) => (
            <FileItem
              key={file.path}
              file={file}
              viewMode={viewMode}
              isSelected={selectedFiles.some(f => f.path === file.path)}
              onClick={onFileClick}
              onDoubleClick={onFileDoubleClick}
              onSelect={onFileSelect}
              onContextMenu={onContextMenu}
              fileIcon={fileIcons[file.path]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileGrid;