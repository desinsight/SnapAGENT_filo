import { useState, useEffect, useCallback, useMemo } from 'react';
import electronAPI from '../utils/electronAPI';
import { apiFetch } from '../utils/api';

export const useFileExplorer = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [fileIcons, setFileIcons] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drives, setDrives] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [aiSearchResults, setAiSearchResults] = useState(null);

  // 파일 목록 로드
  const loadFiles = useCallback(async (path = currentPath) => {
    setLoading(true);
    try {
      let filesData;
      if (electronAPI?.isElectronApp()) {
        filesData = await electronAPI.listFiles(path);
      } else {
        const response = await apiFetch(`/api/files?path=${encodeURIComponent(path)}`);
        filesData = await response.json();
      }
      
      setFiles(filesData);
      setCurrentPath(path);
      
      // 파일 아이콘 로드
      if (electronAPI?.isElectronApp()) {
        const icons = {};
        for (const file of filesData) {
          if (!file.isDirectory) {
            const icon = await electronAPI.getFileIcon(file.path);
            icons[file.path] = icon;
          }
        }
        setFileIcons(icons);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // 드라이브 목록 로드
  const loadDrives = useCallback(async () => {
    try {
      if (electronAPI?.isElectronApp()) {
        const driveList = await electronAPI.listDrives();
        setDrives(driveList);
      }
    } catch (error) {
      console.error('Failed to load drives:', error);
    }
  }, []);

  // 즐겨찾기 로드
  const loadFavorites = useCallback(async () => {
    try {
      const response = await apiFetch('/api/favorites');
      const favData = await response.json();
      setFavorites(favData);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  // 최근 파일 로드
  const loadRecentFiles = useCallback(async () => {
    try {
      const response = await apiFetch('/api/recent-files');
      const recentData = await response.json();
      setRecentFiles(recentData);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }, []);

  // 파일 선택 토글
  const toggleFileSelection = useCallback((file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      if (isSelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  // 모든 파일 선택/해제
  const toggleSelectAll = useCallback(() => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...files]);
    }
  }, [selectedFiles, files]);

  // 파일 정렬
  const sortFiles = useCallback((filesArray) => {
    const sorted = [...filesArray].sort((a, b) => {
      // 폴더를 항상 위에 표시
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          comparison = new Date(a.modifiedAt || 0) - new Date(b.modifiedAt || 0);
          break;
        case 'type':
          comparison = (a.extension || '').localeCompare(b.extension || '');
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [sortBy, sortOrder]);

  // 파일 필터링
  const filterFiles = useCallback((filesArray) => {
    if (filterType === 'all' && !searchQuery) return filesArray;

    return filesArray.filter(file => {
      // 검색어 필터
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 파일 타입 필터
      if (filterType !== 'all') {
        const ext = file.extension?.toLowerCase();
        switch (filterType) {
          case 'images':
            return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(file.name);
          case 'videos':
            return /\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i.test(file.name);
          case 'audio':
            return /\.(mp3|wav|flac|aac|ogg|wma|m4a)$/i.test(file.name);
          case 'documents':
            return /\.(pdf|doc|docx|txt|odt|rtf)$/i.test(file.name);
          case 'code':
            return /\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml)$/i.test(file.name);
          case 'archives':
            return /\.(zip|rar|7z|tar|gz|bz2)$/i.test(file.name);
          default:
            return true;
        }
      }

      return true;
    });
  }, [filterType, searchQuery]);

  // 파일 삭제
  const deleteFiles = useCallback(async (filesToDelete = selectedFiles) => {
    if (!filesToDelete.length) return;

    const confirmDelete = window.confirm(`정말로 ${filesToDelete.length}개의 파일을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      for (const file of filesToDelete) {
        if (electronAPI?.isElectronApp()) {
          await electronAPI.deleteFile(file.path);
        } else {
          await apiFetch('/api/files', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: file.path })
          });
        }
      }
      
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to delete files:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  }, [selectedFiles, loadFiles]);

  // AI 검색 결과 적용
  const applyAiSearchResults = useCallback((searchResults) => {
    console.log('🔍 AI 검색 결과 적용 시작:', searchResults);
    console.log('📊 적용 전 aiSearchResults:', aiSearchResults);
    
    // AI 검색 결과 설정
    setAiSearchResults(searchResults);
    
    // 확장자 필터가 있는 경우 filterType도 업데이트
    if (searchResults.type === 'extension' && searchResults.extension) {
      setFilterType(searchResults.extension);
      setSearchQuery(''); // 검색 쿼리 초기화
    }
    
    console.log('✅ AI 검색 결과 설정 완료:', searchResults.files?.length, '개 파일');
  }, []);

  // AI 검색 결과 초기화
  const clearAiSearchResults = useCallback(() => {
    setAiSearchResults(null);
  }, []);

  // 초기 로드
  useEffect(() => {
    loadDrives();
    loadFavorites();
    loadRecentFiles();
  }, [loadDrives, loadFavorites, loadRecentFiles]);

  useEffect(() => {
    if (currentPath) {
      loadFiles();
    }
  }, [currentPath, loadFiles]);

  // 처리된 파일 목록 (필터링 및 정렬 적용)
  const processedFiles = useMemo(() => {
    console.log('🔄 processedFiles 계산 중...');
    console.log('📊 aiSearchResults:', aiSearchResults ? `${aiSearchResults.type} - ${aiSearchResults.files?.length}개` : '없음');
    console.log('📊 original files:', files.length, '개');
    
    // AI 검색 결과가 있으면 해당 파일들을 사용
    const filesToProcess = aiSearchResults && aiSearchResults.files ? aiSearchResults.files : files;
    
    console.log('📊 처리할 파일:', filesToProcess.length, '개');
    
    // AI 검색 결과가 있을 때는 필터링을 건너뛰고 정렬만 적용
    if (aiSearchResults && aiSearchResults.files) {
      const sortedFiles = sortFiles(filesToProcess);
      console.log('✅ AI 검색 결과 정렬 완료:', sortedFiles.length, '개');
      return sortedFiles;
    }
    
    // 일반적인 경우: 필터링 후 정렬
    const filteredFiles = filterFiles(filesToProcess);
    const sortedFiles = sortFiles(filteredFiles);
    console.log('✅ 일반 파일 처리 완료:', sortedFiles.length, '개');
    return sortedFiles;
  }, [aiSearchResults, files, filterFiles, sortFiles]);
  
  // 디버깅 로그
  console.log('🔍 useFileExplorer 상태:', {
    aiSearchResults: aiSearchResults ? `${aiSearchResults.type} - ${aiSearchResults.files?.length}개 파일` : '없음',
    originalFiles: files.length,
    processedFiles: processedFiles.length,
    filterType,
    searchQuery,
    hasAiFiles: !!aiSearchResults?.files,
    aiFilesLength: aiSearchResults?.files?.length || 0
  });

  return {
    // State
    currentPath,
    files: processedFiles,
    fileIcons,
    loading,
    selectedFiles,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    filterType,
    isDarkMode,
    drives,
    favorites,
    recentFiles,
    aiSearchResults,
    
    // Actions
    setCurrentPath,
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
    setFilterType,
    setIsDarkMode,
    loadFiles,
    toggleFileSelection,
    toggleSelectAll,
    deleteFiles,
    loadFavorites,
    loadRecentFiles,
    applyAiSearchResults,
    clearAiSearchResults
  };
};