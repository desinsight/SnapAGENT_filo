import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FileGrid from './FileGrid';
import { detectDuplicates } from '../utils/duplicateDetector';

// 아이콘 컴포넌트들
const FolderIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const DocumentIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ImageIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const AudioIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const ArchiveIcon = ({ size = 'w-8 h-8' }) => (
  <svg className={`${size} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const FileExplorerPanel = ({
  currentPath,
  files,
  loading,
  selectedFiles,
  viewMode,
  sortBy,
  sortOrder,
  onNavigate,
  onFileSelect,
  onViewModeChange,
  onSortChange,
  onSortOrderChange,
  onFileAction,
  onContextMenu,
  onNotification,
  favoritedFiles,
  onFavoriteToggle
}) => {
  // Props 로깅
  useEffect(() => {
    console.log('[FileExplorerPanel] selectedFiles prop 변경:', selectedFiles.map(f => f.name), '개수:', selectedFiles.length);
  }, [selectedFiles]);

  // 렌더링 시마다 로그
  console.log('[FileExplorerPanel] 렌더링됨, selectedFiles:', selectedFiles.map(f => f.name));
  
  // selectedFiles의 최신 값을 ref로 추적
  const selectedFilesRef = useRef(selectedFiles);
  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);
  
  const [dragOver, setDragOver] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState([]);
  const containerRef = useRef(null);
  
  // 드래그 선택 상태
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState(null);
  const [dragSelectEnd, setDragSelectEnd] = useState(null);
  const [dragSelectBox, setDragSelectBox] = useState(null);

  // 중복 파일 감지
  const duplicateFiles = useMemo(() => {
    if (!files || files.length === 0) {
      return new Set();
    }
    const { duplicateFiles } = detectDuplicates(files);
    return duplicateFiles;
  }, [files]);

  // 파일 아이콘 상태 및 캐시
  const [fileIcons, setFileIcons] = useState({});
  const [loadingIcons, setLoadingIcons] = useState(new Set());
  const iconCacheRef = useRef(new Map()); // 영구 캐시

  // files가 변경될 때 파일 아이콘 로드 (캐싱 및 중복 방지)
  useEffect(() => {
    const loadFileIcons = async () => {
      if (!files || files.length === 0) {
        setFileIcons({});
        return;
      }

      // Electron 환경에서만 파일 아이콘 로드
      if (!window.electronAPI) {
        return;
      }

      const icons = { ...fileIcons }; // 기존 아이콘 보존
      const filesToLoad = [];

      // 로드가 필요한 파일들만 선별
      for (const file of files) {
        if (!file.isDirectory && 
            !icons[file.path] && 
            !iconCacheRef.current.has(file.path) && 
            !loadingIcons.has(file.path)) {
          filesToLoad.push(file);
        } else if (iconCacheRef.current.has(file.path)) {
          // 캐시에서 아이콘 복원
          icons[file.path] = iconCacheRef.current.get(file.path);
        }
      }

      if (filesToLoad.length === 0) {
        setFileIcons(icons);
        return;
      }

      console.log('Loading file icons for', filesToLoad.length, 'new files');
      
      // 로딩 중인 파일들 표시
      const newLoadingSet = new Set(loadingIcons);
      filesToLoad.forEach(file => newLoadingSet.add(file.path));
      setLoadingIcons(newLoadingSet);

      // 병렬로 아이콘 로드
      const loadPromises = filesToLoad.map(async (file) => {
        try {
          const icon = await window.electronAPI.getFileIcon(file.path);
          if (icon) {
            iconCacheRef.current.set(file.path, icon); // 캐시에 저장
            icons[file.path] = icon;
            console.log('Icon loaded for:', file.name);
          }
        } catch (iconError) {
          console.warn('Failed to load icon for', file.path, iconError);
        } finally {
          newLoadingSet.delete(file.path);
        }
      });

      await Promise.all(loadPromises);
      
      setFileIcons(icons);
      setLoadingIcons(new Set(newLoadingSet));
    };

    loadFileIcons();
  }, [files]); // fileIcons를 dependency에서 제거하여 무한 루프 방지

  // 파일 드롭 핸들러
  const handleFileDrop = useCallback((droppedFiles, targetPath) => {
    if (onFileAction) {
      onFileAction('upload', { files: droppedFiles, targetPath });
    }
  }, [onFileAction]);

  // 파일 아이콘 반환
  const getFileIcon = (file) => {
    if (file.isDirectory) {
      return <FolderIcon />;
    }

    const ext = file.extension?.toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];

    if (imageExts.includes(ext)) return <ImageIcon />;
    if (videoExts.includes(ext)) return <VideoIcon />;
    if (audioExts.includes(ext)) return <AudioIcon />;
    if (archiveExts.includes(ext)) return <ArchiveIcon />;
    
    return <DocumentIcon />;
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  // 마지막 선택된 파일 추적 (Shift+클릭용)
  const [lastSelectedFile, setLastSelectedFile] = useState(null);

  // 파일 클릭 핸들러
  const handleFileClick = useCallback((file, event) => {
    console.log('[DEBUG] handleFileClick:', { 
      fileName: file.name, 
      ctrlKey: event.ctrlKey, 
      shiftKey: event.shiftKey,
      currentSelectedCount: selectedFilesRef.current.length,
      lastSelectedFile: lastSelectedFile?.name,
      selectedFilesNames: selectedFilesRef.current.map(f => f.name)
    });

    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 클릭: 다중 선택 토글
      console.log('[DEBUG] Ctrl+클릭: 다중 선택 토글');
      onFileSelect(file);
      setLastSelectedFile(file); // 마지막 선택 파일 업데이트
    } else if (event.shiftKey && lastSelectedFile) {
      // Shift + 클릭: 범위 선택 (selectedFiles.length 대신 lastSelectedFile 사용)
      console.log('[DEBUG] Shift+클릭: 범위 선택');
      const currentIndex = files.findIndex(f => f.path === file.path);
      const lastIndex = files.findIndex(f => f.path === lastSelectedFile.path);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        // 기존 선택 모두 해제
        onFileSelect(null, true);
        
        // 범위 선택
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        console.log(`[DEBUG] 범위 선택: ${start}부터 ${end}까지`);
        for (let i = start; i <= end; i++) {
          onFileSelect(files[i]);
        }
        setLastSelectedFile(file); // 마지막 선택 파일 업데이트
      }
    } else {
      // 일반 클릭: 단일 선택만 (폴더/파일 구분 없이)
      console.log('[DEBUG] 일반 클릭: 단일 선택');
      onFileSelect(null, true); // 기존 선택 해제
      onFileSelect(file); // 새로 선택
      setLastSelectedFile(file); // 마지막 선택 파일 업데이트
    }
  }, [lastSelectedFile, files, onFileSelect]); // selectedFiles를 의존성에서 제거

  // 파일 더블클릭 핸들러
  const handleFileDoubleClick = (file) => {
    // 드래그 앤 드롭 이동 이벤트 처리
    if (file.type === 'move') {
      onFileAction('move', {
        source: file.source,
        destination: file.destination,
        file: file.sourceFile
      });
      onNotification(`${file.sourceFile.name} 파일을 ${file.targetFolder.name} 폴더로 이동했습니다`, 'success');
      return;
    }
    
    // 일반 더블클릭 처리
    if (file.isDirectory) {
      onNavigate(file.path);
    } else {
      onFileAction('open', file);
    }
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (event, file) => {
    event.preventDefault();
    
    onContextMenu({
      x: event.clientX,
      y: event.clientY,
      file,
      selectedFiles
    });
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (event, file) => {
    setDraggedFiles([file]);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', file.path);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    // 외부 파일 드롭 처리
    const externalFiles = Array.from(event.dataTransfer.files);
    if (externalFiles.length > 0) {
      onFileAction('upload', externalFiles, currentPath);
      onNotification(`${externalFiles.length}개 파일 업로드 시작`, 'info');
      return;
    }

    // 내부 파일 이동 처리
    const draggedData = event.dataTransfer.getData('application/json');
    if (draggedData) {
      try {
        const data = JSON.parse(draggedData);
        if (data.type === 'file' && data.source === 'fileManager') {
          const sourceFile = data.file;
          // 같은 폴더 내에서의 이동은 무시
          if (sourceFile.path.includes(currentPath)) {
            return;
          }
          
          // 파일 이동 액션
          onFileAction('move', {
            source: sourceFile.path,
            destination: currentPath,
            file: sourceFile
          });
          onNotification(`${sourceFile.name} 파일을 이동했습니다`, 'success');
        }
      } catch (error) {
        console.warn('Failed to parse drag data:', error);
      }
    }
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event) => {
    if (event.key === 'Delete' && selectedFiles.length > 0) {
      onFileAction('delete', selectedFiles);
    }
    if (event.key === 'Enter' && selectedFiles.length === 1) {
      const file = selectedFiles[0];
      if (file.isDirectory) {
        onNavigate(file.path);
      } else {
        onFileAction('open', file);
      }
    }
  };

  // 파일이 선택되었는지 확인
  const isFileSelected = (file) => {
    return selectedFiles.some(f => f.path === file.path);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">파일을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 빈 폴더 - 빈 화면만 표시
  if (files.length === 0) {
    return (
      <div 
        className="flex-1 file-grid-background"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      </div>
    );
  }

  // 빈 곳 클릭시 선택 해제
  const handleBackgroundClick = (e) => {
    // 파일/폴더가 아닌 빈 곳을 클릭했을 때만 선택 해제
    // file-item이나 file-path를 가진 요소를 클릭한 경우는 제외
    if (e.target.closest('[data-file-path]')) {
      return; // 파일 아이템 클릭이면 아무것도 하지 않음
    }
    
    // 배경이나 빈 영역 클릭 감지 (조건 완화)
    if (e.target === e.currentTarget || 
        e.target.classList.contains('file-grid-background') ||
        e.target.closest('.file-grid-background')) {
      console.log('[DEBUG] 빈 곳 클릭 감지 - 선택 해제');
      onFileSelect(null, true); // 두 번째 파라미터로 전체 선택 해제 신호
      setLastSelectedFile(null); // 마지막 선택 파일도 초기화
    }
  };

  // 빈 영역 우클릭 컨텍스트 메뉴
  const handleBackgroundContextMenu = (event) => {
    event.preventDefault();
    
    // 빈 영역에서는 폴더 관련 컨텍스트 메뉴만 표시
    onContextMenu({
      x: event.clientX,
      y: event.clientY,
      file: null, // 빈 영역이므로 파일 없음
      selectedFiles: [],
      isBackground: true // 빈 영역임을 표시
    });
  };

  // 드래그 선택 시작
  const handleMouseDown = (e) => {
    // 파일 아이템을 클릭한 경우는 드래그 선택 시작하지 않음
    if (e.target.closest('[data-file-path]')) {
      return;
    }
    
    // 빈 공간에서 마우스 다운 시 드래그 선택 시작
    if (e.target === e.currentTarget) {
      setIsDragSelecting(true);
      const rect = containerRef.current.getBoundingClientRect();
      const startPos = {
        x: e.clientX - rect.left + containerRef.current.scrollLeft,
        y: e.clientY - rect.top + containerRef.current.scrollTop
      };
      setDragSelectStart(startPos);
      setDragSelectEnd(startPos);
      onFileSelect(null, true); // 선택 초기화
    }
  };

  // 드래그 선택 중
  const handleMouseMove = (e) => {
    if (!isDragSelecting || !dragSelectStart) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const endPos = {
      x: e.clientX - rect.left + containerRef.current.scrollLeft,
      y: e.clientY - rect.top + containerRef.current.scrollTop
    };
    setDragSelectEnd(endPos);
    
    // 선택 박스 계산
    const box = {
      left: Math.min(dragSelectStart.x, endPos.x),
      top: Math.min(dragSelectStart.y, endPos.y),
      width: Math.abs(endPos.x - dragSelectStart.x),
      height: Math.abs(endPos.y - dragSelectStart.y)
    };
    setDragSelectBox(box);
    
    // 선택 박스와 겹치는 파일들 선택
    selectFilesInBox(box);
  };

  // 드래그 선택 종료
  const handleMouseUp = () => {
    setIsDragSelecting(false);
    setDragSelectStart(null);
    setDragSelectEnd(null);
    setDragSelectBox(null);
  };

  // 선택 박스와 겹치는 파일 선택
  const selectFilesInBox = (box) => {
    const fileElements = containerRef.current.querySelectorAll('[data-file-path]');
    const selectedPaths = [];
    
    fileElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const fileBox = {
        left: rect.left - containerRect.left + containerRef.current.scrollLeft,
        top: rect.top - containerRect.top + containerRef.current.scrollTop,
        right: rect.right - containerRect.left + containerRef.current.scrollLeft,
        bottom: rect.bottom - containerRect.top + containerRef.current.scrollTop
      };
      
      // 박스와 겹치는지 확인
      if (
        fileBox.left < box.left + box.width &&
        fileBox.right > box.left &&
        fileBox.top < box.top + box.height &&
        fileBox.bottom > box.top
      ) {
        selectedPaths.push(element.getAttribute('data-file-path'));
      }
    });
    
    // 선택된 파일들을 한번에 업데이트
    const filesToSelect = files.filter(f => selectedPaths.includes(f.path));
    filesToSelect.forEach(file => onFileSelect(file));
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 relative ${dragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      onClick={handleBackgroundClick}
      onContextMenu={handleBackgroundContextMenu}
      onMouseDown={handleMouseDown}
      onMouseDownCapture={(e) => {
        // 캡처 단계에서 파일 클릭 감지
        if (e.target.closest('[data-file-path]')) {
          console.log('[DEBUG] onMouseDownCapture: 파일 클릭 감지, 이벤트 차단');
          e.stopPropagation();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      tabIndex={0}
    >
      {/* 드래그 선택 박스 */}
      {isDragSelecting && dragSelectBox && (
        <div
          className="absolute bg-blue-500 bg-opacity-20 border border-blue-500 pointer-events-none z-10"
          style={{
            left: `${dragSelectBox.left}px`,
            top: `${dragSelectBox.top}px`,
            width: `${dragSelectBox.width}px`,
            height: `${dragSelectBox.height}px`
          }}
        />
      )}
      
      {/* FileGrid 컴포넌트 사용 - 실제 파일 아이콘 지원 */}
      <FileGrid
        files={files}
        viewMode={viewMode}
        selectedFiles={selectedFiles}
        onFileClick={handleFileClick}
        onFileDoubleClick={handleFileDoubleClick}
        onFileSelect={onFileSelect}
        onContextMenu={handleContextMenu}
        fileIcons={fileIcons}
        currentPath={currentPath}
        onFileDrop={handleFileDrop}
        duplicateFiles={duplicateFiles}
        favoritedFiles={favoritedFiles}
        onFavoriteToggle={onFavoriteToggle}
      />
    </div>
  );
};

export default FileExplorerPanel;