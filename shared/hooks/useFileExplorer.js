import { useState, useEffect, useCallback } from 'react';
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

  // 파일 목록 로드
  const loadFiles = useCallback(async (path = currentPath) => {
    setLoading(true);
    try {
      console.log('🔍 loadFiles 호출됨:', { path, currentPath });
      
      let filesData;
      if (electronAPI?.isElectronApp()) {
        filesData = await electronAPI.listFiles(path);
      } else {
        const response = await apiFetch(`/api/files?path=${encodeURIComponent(path)}`);
        filesData = await response.json();
      }
      
      console.log('📁 파일 목록 로드 결과:', { 
        path, 
        filesCount: filesData?.length || 0,
        success: !!filesData 
      });
      
      setFiles(filesData);
      
      // AI 응답에서 받은 경로인 경우에만 setCurrentPath 호출
      if (path !== currentPath) {
        console.log('📍 경로 변경:', { from: currentPath, to: path });
        setCurrentPath(path);
      }
      
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
      console.error('❌ Failed to load files:', error);
      console.error('❌ 에러 상세:', { path, currentPath, error: error.message });
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
      setFavorites([]); // 오류 시 빈 배열로 설정
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
      setRecentFiles([]); // 오류 시 빈 배열로 설정
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

  // 초기 로드 (한 번만 실행)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadDrives();
        await loadFavorites();
        await loadRecentFiles();
        
        // 사용자별 기본 경로 설정
        await setDefaultPath();
      } catch (error) {
        console.error('초기화 실패:', error);
      }
    };
    
    initializeApp();
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 사용자별 기본 경로 설정
  const setDefaultPath = async () => {
    try {
      if (electronAPI?.isElectronApp()) {
        // 일렉트론 환경: 사용자별 바탕화면 경로
        const userDirs = await electronAPI.getUserDirectories();
        setCurrentPath(userDirs.desktop);
      } else {
        // 웹 환경: 루트 경로
        setCurrentPath('/');
      }
    } catch (error) {
      console.error('기본 경로 설정 실패:', error);
      // 폴백: 드라이브 목록에서 첫 번째 선택
      if (drives.length > 0) {
        setCurrentPath(drives[0].path);
      }
    }
  };

  // currentPath 변경 시 자동으로 loadFiles 호출하지 않음
  // AI 응답에서 받은 경로로 직접 loadFiles 호출하도록 변경
  // useEffect(() => {
  //   if (currentPath) {
  //     loadFiles();
  //   }
  // }, [currentPath, loadFiles]);

  // 처리된 파일 목록 (필터링 및 정렬 적용)
  const processedFiles = sortFiles(filterFiles(files));

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
    loadRecentFiles
  };
};