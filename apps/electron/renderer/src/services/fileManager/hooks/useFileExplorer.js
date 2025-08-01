import { useState, useEffect, useCallback, useMemo } from 'react';
import electronAPI from '../utils/electronAPI';
import { apiFetch, getFavorites, getRecentFiles, addToRecentFiles } from '../utils/api';

export const useFileExplorer = () => {
  // 초기 경로는 null로 설정하고, 드라이브 로드 후 설정
  const [currentPath, setCurrentPathBase] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileIcons, setFileIcons] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQueryBase] = useState('');
  const [filterType, setFilterTypeBase] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drives, setDrives] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [aiSearchResults, setAiSearchResults] = useState(null);
  // 확장자 필터 상태 (다중 선택) - AI 검색과 UI 연동을 위해 추가
  const [selectedExtensions, setSelectedExtensions] = useState([]);
  // 즐겨찾기 파일 목록 상태
  const [favoritedFiles, setFavoritedFiles] = useState(new Set());
  // 하위 폴더 포함 검색 상태
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  // 하위 폴더 검색 결과
  const [subfolderResults, setSubfolderResults] = useState([]);
  // 클립보드 상태 (copy/cut 작업용)
  const [clipboard, setClipboard] = useState({ files: [], operation: null }); // operation: 'copy' | 'cut'

  // 한글 초성 추출 함수
  const getKoreanInitials = (text) => {
    const initials = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
        // 한글 유니코드 범위
        const syllable = charCode - 0xAC00;
        const initial = Math.floor(syllable / (21 * 28)) + 0x1100;
        initials.push(String.fromCharCode(initial));
      } else {
        initials.push(text[i]);
      }
    }
    return initials.join('');
  };

  // 경로 이동 시 AI 검색 결과 및 하위 폴더 검색 결과 초기화
  const setCurrentPath = useCallback((path) => {
    setCurrentPathBase(path);
    setAiSearchResults(null);
    setSubfolderResults([]);
  }, []);

  // 필터 조작 시 AI 검색 결과 초기화
  const setFilterType = useCallback((type) => {
    setFilterTypeBase(type);
    setAiSearchResults(null);
  }, []);
  
  const setSearchQuery = useCallback((query) => {
    setSearchQueryBase(query);
    setAiSearchResults(null);
    // 검색어가 비어있으면 하위 폴더 검색 결과도 초기화
    if (!query) {
      setSubfolderResults([]);
    }
  }, []);

  // 하위 폴더 포함 옵션 변경 시 처리
  const setIncludeSubfoldersWithReset = useCallback((include) => {
    setIncludeSubfolders(include);
    if (!include) {
      setSubfolderResults([]);
    }
  }, []);

  // 파일 목록 로드
  const loadFiles = useCallback(async (path = currentPath) => {
    if (!path) return;
    
    setLoading(true);
    try {
      let filesData;
      if (electronAPI?.isElectronApp()) {
        filesData = await electronAPI.listFiles(path);
      } else {
        // 웹 환경에서는 Web API 서버 사용
        try {
          const response = await fetch(`http://localhost:5000/api/files?path=${encodeURIComponent(path)}`);
          if (response.ok) {
            filesData = await response.json();
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (apiError) {
          console.warn('File API not available, using mock data:', apiError);
          // API 실패 시 mock 데이터 사용
          filesData = [
            {
              name: 'Documents',
              path: path + 'Documents',
              isDirectory: true,
              size: 0,
              modifiedAt: new Date().toISOString(),
              extension: null
            },
            {
              name: 'Downloads',
              path: path + 'Downloads',
              isDirectory: true,
              size: 0,
              modifiedAt: new Date().toISOString(),
              extension: null
            },
            {
              name: 'example.txt',
              path: path + 'example.txt',
              isDirectory: false,
              size: 1024,
              modifiedAt: new Date().toISOString(),
              extension: 'txt'
            },
            {
              name: 'readme.md',
              path: path + 'readme.md',
              isDirectory: false,
              size: 2048,
              modifiedAt: new Date().toISOString(),
              extension: 'md'
            }
          ];
        }
      }
      
      setFiles(filesData);
      setCurrentPath(path);
      
      // 파일 아이콘 로드 (Electron 환경에서만)
      if (electronAPI?.isElectronApp()) {
        const icons = {};
        for (const file of filesData) {
          if (!file.isDirectory) {
            try {
              const icon = await electronAPI.getFileIcon(file.path);
              icons[file.path] = icon;
            } catch (iconError) {
              console.warn('Failed to load icon for', file.path, iconError);
            }
          }
        }
        setFileIcons(icons);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      // 오류 발생 시 빈 배열로 설정
      setFiles([]);
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
        
        // 초기 경로가 설정되지 않은 경우 홈 디렉토리로 설정
        if (!currentPath) {
          try {
            const userDirs = await electronAPI.getUserDirectories();
            setCurrentPathBase(userDirs.home);
          } catch (error) {
            // 홈 디렉토리를 가져올 수 없으면 기본 경로 사용
            setCurrentPathBase('/');
          }
        }
      } else {
        // 웹 환경에서는 기본 드라이브 목록 제공
        setDrives([
          { name: '/', path: '/', type: 'local' },
          { name: 'Documents', path: '/Users/Documents', type: 'folder' },
          { name: 'Downloads', path: '/Users/Downloads', type: 'folder' }
        ]);
        
        // 초기 경로가 설정되지 않은 경우 기본 경로 설정
        if (!currentPath) {
          setCurrentPathBase('/');
        }
      }
    } catch (error) {
      console.error('Failed to load drives:', error);
      // 오류 시 기본 드라이브 설정
      setDrives([
        { name: '/', path: '/', type: 'local' },
        { name: 'Documents', path: '/Users/Documents', type: 'folder' }
      ]);
      
      // 초기 경로가 설정되지 않은 경우 기본 경로 설정
      if (!currentPath) {
        setCurrentPathBase('/');
      }
    }
  }, [currentPath]);

  // 즐겨찾기 로드
  const loadFavorites = useCallback(async () => {
    try {
      const favData = await getFavorites();
      setFavorites(favData);
      
      // 즐겨찾기된 파일 경로 세트 생성
      const favoritePaths = new Set(favData.map(fav => fav.path));
      setFavoritedFiles(favoritePaths);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(async (file) => {
    try {
      const isFavorited = favoritedFiles.has(file.path);
      
      if (isFavorited) {
        // 즐겨찾기에서 제거
        if (electronAPI?.isElectronApp()) {
          await electronAPI.removeFavorite(file.path);
        } else {
          await apiFetch('/api/favorites', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: file.path })
          });
        }
        
        setFavoritedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.path);
          return newSet;
        });
        
        setFavorites(prev => prev.filter(fav => fav.path !== file.path));
      } else {
        // 즐겨찾기에 추가
        const favoriteData = {
          name: file.name,
          path: file.path,
          isDirectory: file.isDirectory,
          addedAt: new Date().toISOString()
        };
        
        if (electronAPI?.isElectronApp()) {
          await electronAPI.addFavorite(favoriteData);
        } else {
          await apiFetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(favoriteData)
          });
        }
        
        setFavoritedFiles(prev => new Set([...prev, file.path]));
        setFavorites(prev => [...prev, favoriteData]);
      }
      
      return !isFavorited;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, [favoritedFiles]);

  // 최근 파일 로드
  const loadRecentFiles = useCallback(async () => {
    try {
      const recentData = await getRecentFiles();
      setRecentFiles(recentData);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }, []);

  // 파일을 최근 파일 목록에 추가
  const addFileToRecent = useCallback(async (file) => {
    try {
      await addToRecentFiles(file.path, file.name, file.isDirectory);
      
      // 로컬 상태 즉시 업데이트
      setRecentFiles(prev => {
        // 이미 존재하는 파일인지 확인
        const exists = prev.find(item => item.path === file.path);
        if (exists) {
          // 기존 파일을 맨 앞으로 이동 (최근 액세스된 것으로 업데이트)
          return [
            { ...file, accessedAt: new Date().toISOString() },
            ...prev.filter(item => item.path !== file.path)
          ].slice(0, 10); // 최대 10개까지만 유지
        } else {
          // 새 파일을 맨 앞에 추가
          return [
            { ...file, accessedAt: new Date().toISOString() },
            ...prev
          ].slice(0, 10); // 최대 10개까지만 유지
        }
      });
      
      console.log('파일이 최근 파일 목록에 추가되었습니다:', file.name);
    } catch (error) {
      console.error('Failed to add file to recent files:', error);
    }
  }, []);

  // AI 검색 결과 적용
  const applyAiSearchResults = useCallback((searchResults) => {
    console.log('🔍 [FileExplorer] AI 검색 결과 적용 시작:', searchResults);
    setAiSearchResults(searchResults);
    
    // 경로 이동
    if (searchResults && searchResults.searchPaths && searchResults.searchPaths.length > 0) {
      setCurrentPathBase(searchResults.searchPaths[0]);
    }
    
    // 확장자 필터 적용 (UI와 연동)
    if (searchResults && searchResults.extensions && searchResults.extensions.length > 0) {
      const normalizedExtensions = searchResults.extensions.map(ext => 
        ext.startsWith('.') ? ext : `.${ext}`
      );
      setSelectedExtensions(normalizedExtensions);
      setFilterTypeBase(normalizedExtensions.length === 1 ? normalizedExtensions[0] : 'custom-multi');
      setSearchQueryBase('');
      console.log('🎯 [FileExplorer] 확장자 필터 적용:', normalizedExtensions);
    }
    
    // 기존 filterType 업데이트 (하위 호환성)
    if (searchResults && searchResults.type === 'extension' && searchResults.extension) {
      setFilterTypeBase(searchResults.extension);
      setSearchQueryBase('');
    }
    
    console.log('✅ [FileExplorer] AI 검색 결과 적용 완료');
  }, []);

  // 파일 선택 토글
  const toggleFileSelection = useCallback((file, clearAll = false) => {
    
    if (clearAll || file === null) {
      // 빈 곳 클릭이나 전체 선택 해제
      setSelectedFiles([]);
      return;
    }
    
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      
      if (isSelected) {
        const newSelection = prev.filter(f => f.path !== file.path);
        return newSelection;
      } else {
        const newSelection = [...prev, file];
        return newSelection;
      }
    });
  }, []); // 의존성 배열에서 selectedFiles 제거

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
    
    if (filterType === 'all' && !searchQuery) {
      return filesArray;
    }

    const filtered = filesArray.filter(file => {
      // 검색어 필터
      if (searchQuery) {
        const fileName = file.name.toLowerCase();
        const searchTerm = searchQuery.toLowerCase();
        
        // 스마트 검색 함수 (한글 지원 개선)
        const smartSearch = (text, query) => {
          
          // 1. 기본 검색 (대소문자 무시)
          if (text.includes(query)) {
            return true;
          }
          
          // 2. 공백/특수문자 제거 검색
          const cleanText = text.replace(/[\s_\-\._]/g, '');
          const cleanQuery = query.replace(/[\s_\-\._]/g, '');
          if (cleanText.includes(cleanQuery)) {
            return true;
          }
          
          // 3. 단어별 분할 검색 (한글 단어 분리 개선)
          const queryWords = query.split(/[\s_\-\._]+/).filter(w => w.length > 0);
          
          if (queryWords.length > 1) {
            // 모든 단어가 포함되어야 함
            const allWordsMatch = queryWords.every(word => {
              const wordMatch = text.includes(word) || cleanText.includes(word.replace(/[\s_\-\._]/g, ''));
              return wordMatch;
            });
            if (allWordsMatch) {
              return true;
            }
          }
          
          // 4. 부분 매칭 (각 단어가 어디든 있으면 됨)
          if (queryWords.length > 0) {
            const someWordsMatch = queryWords.some(word => {
              if (word.length < 2) return false; // 너무 짧은 단어는 제외
              const wordMatch = text.includes(word) || cleanText.includes(word.replace(/[\s_\-\._]/g, ''));
              return wordMatch;
            });
            if (someWordsMatch && queryWords.length === 1) {
              return true;
            }
          }
          
          // 5. 한글 초성 검색 (추가)
          const koreanInitials = getKoreanInitials(query);
          if (koreanInitials && text.includes(koreanInitials)) {
            return true;
          }
          
          return false;
        };
        
        const isMatch = smartSearch(fileName, searchTerm);
        
        if (!isMatch) {
          return false;
        }
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
    
    return filtered;
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

  // 하위 폴더 검색 함수
  const searchSubfolders = useCallback(async (basePath, searchTerm) => {
    
    if (!searchTerm || !includeSubfolders) {
      setSubfolderResults([]);
      return;
    }
    
    const searchInDirectory = async (dirPath, depth = 0) => {
      
      if (depth > 10) { // 최대 10단계까지 검색
        return [];
      }
      
      try {
        let filesData;
        if (electronAPI?.isElectronApp()) {
          try {
            filesData = await electronAPI.listFiles(dirPath);
          } catch (electronError) {
            console.warn(`[ERROR] Electron API 실패 (${dirPath}):`, electronError.message || electronError);
            return [];
          }
        } else {
          try {
            const response = await fetch(`http://localhost:5000/api/files?path=${encodeURIComponent(dirPath)}`);
            if (response.ok) {
              filesData = await response.json();
            } else {
              console.warn(`[ERROR] API 응답 실패 (${dirPath}): ${response.status} ${response.statusText}`);
              return [];
            }
          } catch (fetchError) {
            console.warn(`[ERROR] API 호출 실패 (${dirPath}):`, fetchError.message || fetchError);
            return [];
          }
        }


        let results = [];
        
        // 모든 파일에서 검색 (현재 디렉토리 포함)
        const searchTermLower = searchTerm.toLowerCase();
        
        // "보람유치원" 파일이 있는지 특별히 확인
        const targetFile = filesData.find(f => f.name.includes('보람') || f.name.includes('유치원') || f.name.includes('인테리어'));
        if (targetFile) {
        } else {
        }
        
        const matchingFiles = filesData.filter(file => {
          const fileName = file.name.toLowerCase();
          const searchTerm = searchTermLower;
          
          // 스마트 검색 함수 (한글 지원 개선)
          const smartSearch = (text, query) => {
            
            // 1. 기본 검색 (대소문자 무시)
            if (text.includes(query)) {
              return true;
            }
            
            // 2. 공백/특수문자 제거 검색
            const cleanText = text.replace(/[\s_\-\._]/g, '');
            const cleanQuery = query.replace(/[\s_\-\._]/g, '');
            if (cleanText.includes(cleanQuery)) {
              return true;
            }
            
            // 3. 단어별 분할 검색 (한글 단어 분리 개선)
            const queryWords = query.split(/[\s_\-\._]+/).filter(w => w.length > 0);
            
            if (queryWords.length > 1) {
              // 모든 단어가 포함되어야 함
              const allWordsMatch = queryWords.every(word => {
                const wordMatch = text.includes(word) || cleanText.includes(word.replace(/[\s_\-\._]/g, ''));
                return wordMatch;
              });
              if (allWordsMatch) {
                return true;
              }
            }
            
            // 4. 부분 매칭 (각 단어가 어디든 있으면 됨)
            if (queryWords.length > 0) {
              const someWordsMatch = queryWords.some(word => {
                if (word.length < 2) return false; // 너무 짧은 단어는 제외
                const wordMatch = text.includes(word) || cleanText.includes(word.replace(/[\s_\-\._]/g, ''));
                return wordMatch;
              });
              if (someWordsMatch && queryWords.length === 1) {
                return true;
              }
            }
            
            // 5. 한글 초성 검색 (추가)
            const koreanInitials = getKoreanInitials(query);
            if (koreanInitials && text.includes(koreanInitials)) {
              return true;
            }
            
            return false;
          };
          
          const isMatch = smartSearch(fileName, searchTerm);
          
          if (isMatch) {
          }
          
          return isMatch;
        });
        
        if (matchingFiles.length > 0) {
          results.push(...matchingFiles);
        } else {
        }

        // 하위 디렉토리들 병렬 재귀 검색
        const subdirectories = filesData.filter(file => file.isDirectory);
        
        // 병렬 처리로 모든 하위 디렉토리 동시 검색
        const searchPromises = subdirectories.map(async (subdir) => {
          try {
            const subResults = await searchInDirectory(subdir.path, depth + 1);
            if (subResults.length > 0) {
            }
            return subResults;
          } catch (error) {
            console.warn(`[ERROR] 검색 실패: ${subdir.path}`, error);
            return [];
          }
        });
        
        // 모든 병렬 검색 완료 대기
        const allSubResults = await Promise.all(searchPromises);
        allSubResults.forEach(subResults => {
          results.push(...subResults);
        });

        return results;
      } catch (error) {
        console.warn(`디렉토리 검색 실패: ${dirPath}`, error);
        return [];
      }
    };

    try {
      const results = await searchInDirectory(basePath);
      setSubfolderResults(results);
    } catch (error) {
      console.error('하위 폴더 검색 실패:', error);
      setSubfolderResults([]);
    }
  }, [includeSubfolders]);

  // 검색어나 하위폴더 옵션 변경 시 하위 폴더 검색 실행
  useEffect(() => {
    
    // 즉시 실행 (디바운스 제거)
    searchSubfolders(currentPath, searchQuery);
  }, [searchQuery, includeSubfolders, currentPath, searchSubfolders]);

  // 처리된 파일 목록 (AI 검색 결과 우선, 아니면 필터링된 전체 파일 + 하위 폴더 검색 결과)
  const processedFiles = useMemo(() => {
    if (aiSearchResults && aiSearchResults.files) {
      return aiSearchResults.files;
    }
    
    let allFiles = [...files];
    
    // 하위 폴더 검색 결과 추가 (중복 제거)
    if (searchQuery && includeSubfolders && subfolderResults.length > 0) {
      const currentPaths = new Set(files.map(f => f.path));
      const uniqueSubfolderResults = subfolderResults.filter(f => !currentPaths.has(f.path));
      allFiles = [...files, ...uniqueSubfolderResults];
    }
    
    // 일반 필터링/정렬 적용
    const result = sortFiles(filterFiles(allFiles));
    return result;
  }, [aiSearchResults, files, subfolderResults, searchQuery, includeSubfolders, sortFiles, filterFiles]);

  // 확장자 목록 (항상 전체 files에서 추출)
  const extensionList = useMemo(() => {
    const allFiles = files.filter(f => !f.isDirectory);
    const extSet = new Set(allFiles.map(f => f.extension?.toLowerCase()).filter(Boolean));
    return Array.from(extSet);
  }, [files]);

  // 클립보드 작업 함수들
  const copyFiles = useCallback((filesToCopy = selectedFiles) => {
    const newClipboard = { files: [...filesToCopy], operation: 'copy' };
    setClipboard(newClipboard);
    return filesToCopy.length;
  }, [selectedFiles]);

  const cutFiles = useCallback((filesToCut = selectedFiles) => {
    setClipboard({ files: [...filesToCut], operation: 'cut' });
    return filesToCut.length;
  }, [selectedFiles]);

  const pasteFiles = useCallback(async (targetPath = currentPath) => {
    if (!clipboard.files.length) {
      return { success: false, error: '클립보드가 비어있습니다.' };
    }


    try {
      for (const file of clipboard.files) {
        if (clipboard.operation === 'copy') {
          // 파일 복사 - 대상 경로는 폴더로 전달 (main process에서 파일명 처리)
          if (electronAPI?.isElectronApp()) {
            await electronAPI.copyFile(file.path, targetPath);
          } else {
            // 웹 환경에서는 API 호출
            const response = await apiFetch('/api/files/copy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: file.path, destination: targetPath })
            });
          }
        } else if (clipboard.operation === 'cut') {
          // 파일 이동 - 대상 경로는 폴더로 전달 (main process에서 파일명 처리)
          if (electronAPI?.isElectronApp()) {
            await electronAPI.moveFile(file.path, targetPath);
          } else {
            // 웹 환경에서는 API 호출
            await apiFetch('/api/files/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: file.path, destination: targetPath })
            });
          }
        }
      }

      // cut 작업 후에는 클립보드 비우기
      if (clipboard.operation === 'cut') {
        setClipboard({ files: [], operation: null });
      }

      // 파일 목록 새로고침 (현재 경로와 대상 경로가 같을 때만)
      if (targetPath === currentPath) {
        await loadFiles(currentPath);
      } else {
      }
      
      return { 
        success: true, 
        count: clipboard.files.length,
        operation: clipboard.operation 
      };
    } catch (error) {
      console.error('[ERROR] 파일 붙여넣기 실패:', error);
      return { success: false, error: error.message || '파일 작업에 실패했습니다.' };
    }
  }, [clipboard, currentPath, loadFiles]);

  const clearClipboard = useCallback(() => {
    setClipboard({ files: [], operation: null });
  }, []);

  // 파일 이름 변경
  const renameFile = useCallback(async (file, newName) => {
    if (!file || !newName || newName.trim() === '') {
      return { success: false, error: '새 이름을 입력해주세요.' };
    }

    const trimmedName = newName.trim();
    if (trimmedName === file.name) {
      return { success: false, error: '이름이 변경되지 않았습니다.' };
    }


    try {
      const oldPath = file.path;
      const pathParts = oldPath.split(/[\\/]/);
      pathParts[pathParts.length - 1] = trimmedName;
      const newPath = pathParts.join(process.platform === 'win32' ? '\\' : '/');

      if (electronAPI?.isElectronApp()) {
        await electronAPI.renameFile(oldPath, newPath);
      } else {
        // 웹 환경에서는 API 호출
        await apiFetch('/api/files/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath, newPath })
        });
      }

      
      // 파일 목록 새로고침
      await loadFiles(currentPath);
      
      return { success: true, newName: trimmedName };
    } catch (error) {
      console.error('[ERROR] 파일 이름 변경 실패:', error);
      return { 
        success: false, 
        error: error.message || '파일 이름 변경에 실패했습니다.' 
      };
    }
  }, [currentPath, loadFiles]);

  return {
    // State
    currentPath,
    files,
    processedFiles,
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
    extensionList,
    selectedExtensions,
    favoritedFiles,
    clipboard,
    
    // Actions
    navigateToPath: setCurrentPath,
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
    setFilterType,
    setIsDarkMode,
    toggleFileSelection,
    selectAllFiles: toggleSelectAll,
    clearSelection: () => setSelectedFiles([]),
    deleteFiles,
    loadFiles,
    loadDrives,
    loadFavorites,
    loadRecentFiles,
    addFileToRecent,
    applyAiSearchResults,
    setSelectedExtensions,
    toggleFavorite,
    setCurrentPath,
    includeSubfolders,
    setIncludeSubfolders: setIncludeSubfoldersWithReset,
    copyFiles,
    cutFiles,
    pasteFiles,
    clearClipboard,
    renameFile
  };
};