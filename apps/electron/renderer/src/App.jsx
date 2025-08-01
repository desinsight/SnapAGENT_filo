import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFileExplorer } from './services/fileManager/hooks/useFileExplorer';
import { useAIFeatures } from './hooks/useAIFeatures';
import { getAvailableTools } from './utils/api';
import { detectDuplicates } from './services/fileManager/utils/duplicateDetector';

// 컴포넌트들
import Sidebar from './components/layout/Sidebar';
import ServiceSelector from './components/layout/ServiceSelector';
import FileManagerTopBar from './services/fileManager/components/FileManagerTopBar';
import FileExplorerPanel from './services/fileManager/components/FileExplorerPanel';
import ExtensionFilterBar from './services/fileManager/components/ExtensionFilterBar';
// 기존 AICopilotFloating 사용 (Tool Calling 지원으로 개선됨)
import AICopilotFloating from './components/ai-ui/AICopilotFloating';
import SearchPanel from './filemanager/SearchPanel';
import AnalysisPanel from './filemanager/AnalysisPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import CompanyPanel from './components/company/CompanyPanel';
import PricingPanel from './components/pricing/PricingPanel';
import ContextMenu from './services/fileManager/components/ContextMenu';
import StatusBar from './components/layout/StatusBar';
import { getServicePanels } from './services/serviceConfig.js';
// 홈 서비스 컴포넌트들
import HomeContainer from './services/home/components/HomeContainer';
// 캘린더 서비스 컴포넌트들
import CalendarPanel from './calendar/CalendarPanel';
import CalendarSidebar from './calendar/components/sidebar/CalendarSidebar';
// 캘린더 훅들
import useCalendar from './calendar/hooks/useCalendar';
import useCalendarEvents from './calendar/hooks/useCalendarEvents';
import useCalendarUI from './calendar/hooks/useCalendarUI';
// 태스크 서비스 컴포넌트들
import TaskPanel from './task/TaskPanel';
import TaskSidebarContent from './task/components/sidebar/TaskSidebarContent';
import TaskAnalyticsPanel from './task/Task_AnalyticsPanel';
// 노트 서비스 컴포넌트들
import NotePanel from './note/NotePanel';
import BookmarkPanel from './note/BookmarkPanel';
// 템플릿 서비스 컴포넌트들
import TemplatePanel from './template/TemplatePanel';
// 연락처 서비스 컴포넌트들
import ContactsPanel from './services/contacts/ContactsPanel';
import ContactsSidebar from './services/contacts/components/sidebar/ContactsSidebar';
// 노트 서비스 사이드바
import NoteSidebar from './note/components/sidebar/NoteSidebar';

const App = () => {
  // 파일 탐색기 상태
  const {
    currentPath,
    files,
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
    processedFiles,
    navigateToPath,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
    setFilterType,
    setIsDarkMode,
    deleteSelectedFiles,
    loadFiles,
    applyAiSearchResults,
    selectedExtensions,
    setSelectedExtensions,
    setCurrentPath,
    favoritedFiles,
    toggleFavorite,
    addFileToRecent,
    includeSubfolders,
    setIncludeSubfolders,
    clipboard,
    copyFiles,
    cutFiles,
    pasteFiles,
    clearClipboard,
    renameFile
  } = useFileExplorer();

  // selectedFiles 상태 변경 추적
  useEffect(() => {
  }, [selectedFiles]);

  // UI 상태
  const [activePanel, setActivePanel] = useState('dashboard');
  const [activeService, setActiveService] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isAIFloatingOpen, setIsAIFloatingOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState(null); // { file, show: true }
  const [analysisFiles, setAnalysisFiles] = useState([]); // 분석할 파일 목록
  const [analysisResults, setAnalysisResults] = useState([]); // 분석 결과 유지
  const [analysisHistory, setAnalysisHistory] = useState([]); // 분석 히스토리
  // 캘린더 상태
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  // 태스크 관리 mock 상태
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  // 도구 목록 상태
  const [tools, setTools] = useState([]);
  
  // 캘린더 훅들 (항상 사용, React Hook Rules 준수)
  const {
    calendars,
    selectedCalendars,
    toggleCalendar,
    createCalendar,
    loadCalendars: loadCalendarsData
  } = useCalendar();
  
  const {
    events,
    filteredEvents
  } = useCalendarEvents(selectedCalendars);
  
  const {
    urgentNotices,
    activeModules
  } = useCalendarUI();

  // AI 기능 상태
  const {
    aiResult,
    chatInput,
    chatHistory,
    aiThinking,
    aiSuggestions,
    contextAwareness,
    setChatInput,
    handleSendChat,
    handleAIAnalysis,
    handleFileOperation,
    handleSearchAnalysis,
    handleOrganizationPlan,
    applySuggestion,
    updateContext,
    clearChatHistory
  } = useAIFeatures(tools, setTools, applyAiSearchResults);

  // AI 응답 처리 함수
  const handleAIResponse = async (response) => {
    
    try {
      // frontendAction이 있는지 확인
      if (response.data?.frontendAction) {
        const { type, extensions, searchPaths } = response.data.frontendAction;
        
        
        if (type === 'navigate_to_extension_search') {
          // 파일 매니저로 서비스 변경
          setActiveService('file-manager');
          setActivePanel('files');
          
          // 경로 이동
          if (searchPaths && searchPaths.length > 0) {
            const targetPath = searchPaths[0];
            
            // 명시적으로 경로 설정 후 파일 로드
            setCurrentPath(targetPath);
            await loadFiles(targetPath);
          }
          
          // 확장자 필터 적용
          if (extensions && extensions.length > 0) {
            const normalizedExtensions = extensions.map(ext => 
              ext.startsWith('.') ? ext : `.${ext}`
            );
            setSelectedExtensions(normalizedExtensions);
          }
          
        }
      }
    } catch (error) {
    }
  };

  // 확장자 필터가 적용된 파일 목록 (다중 선택)
  const filteredFiles = useMemo(() => {
    if (!processedFiles) return [];
    
    // 필터가 선택되지 않았거나 '전체'만 선택된 경우
    if (selectedExtensions.length === 0 || (selectedExtensions.length === 1 && selectedExtensions[0] === 'all')) {
      return processedFiles;
    }
    
    return processedFiles.filter(file => {
      // 선택된 필터 중 하나라도 매치되면 포함
      return selectedExtensions.some(selectedExt => {
        if (selectedExt === 'all') {
          return true;
        } else if (selectedExt === 'duplicate') {
          // 중복 파일 체크
          const { duplicateFiles } = detectDuplicates(processedFiles);
          return !file.isDirectory && duplicateFiles.has(file.path);
        } else if (selectedExt === 'folder') {
          return file.isDirectory;
        } else if (selectedExt === 'no-ext') {
          return !file.isDirectory && (!file.extension || file.extension === '');
        } else {
          return !file.isDirectory && file.extension?.toLowerCase() === selectedExt;
        }
      });
    });
  }, [processedFiles, selectedExtensions]);

  // 컨텍스트 업데이트
  useEffect(() => {
    updateContext({
      currentFolder: currentPath,
      fileCount: files.length,
      fileTypes: [...new Set(files.map(f => f.extension).filter(Boolean))],
      recentActivity: []
    });
  }, [currentPath, files.length, updateContext]);

  // 다크 모드 클래스 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            selectAllFiles();
            break;
          case 'f':
            e.preventDefault();
            setActivePanel('search');
            break;
          case 'i':
            e.preventDefault();
            setIsAIFloatingOpen(!isAIFloatingOpen);
            break;
          case 'd':
            e.preventDefault();
            setIsDarkMode(!isDarkMode);
            break;
          case 'r':
            e.preventDefault();
            loadFiles();
            break;
          case 'Delete':
            e.preventDefault();
            if (selectedFiles.length > 0) {
              deleteSelectedFiles();
            }
            break;
        }
      }
      
      // 백스페이스로 뒤로가기
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey) {
        // 입력 필드에 포커스가 있을 때는 백스페이스 동작 방지
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return;
        }
        
        e.preventDefault();
        
        // 서비스별 뒤로가기 처리
        switch (activeService) {
          case 'fileManager':
          case 'file-manager':
            // 파일매니저: 상위 폴더로 이동
            if (currentPath && currentPath !== 'C:\\' && currentPath !== '/') {
              const separator = currentPath.includes('\\') ? '\\' : '/';
              const rootPath = separator === '\\' ? 'C:\\' : '/';
              const parentPath = currentPath.split(/[\\/]/).slice(0, -1).join(separator) || rootPath;
              navigateToPath(parentPath);
            }
            break;
            
          case 'home':
            // 홈: dashboard로 이동
            if (activePanel !== 'dashboard') {
              setActivePanel('dashboard');
            }
            break;
            
          default:
            // 다른 서비스들: 첫 번째 패널로 이동
            const panels = getServicePanels(activeService);
            if (panels.length > 0 && activePanel !== panels[0].id) {
              setActivePanel(panels[0].id);
            }
            break;
        }
      }
      
      // ESC 키로 패널 닫기
      if (e.key === 'Escape') {
        setContextMenu(null);
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, isDarkMode, selectAllFiles, clearSelection, deleteSelectedFiles, loadFiles, setIsDarkMode, activeService, activePanel, currentPath, navigateToPath]);

  // AI 확장자 검색 이벤트 리스너 (useRef 사용으로 의존성 문제 해결)
  const handleExtensionSearchActionRef = useRef();
  
  useEffect(() => {
    const handleExtensionSearchEvent = (event) => {
      if (handleExtensionSearchActionRef.current) {
        handleExtensionSearchActionRef.current(event);
      }
    };

    window.addEventListener('extensionSearchAction', handleExtensionSearchEvent);
    return () => window.removeEventListener('extensionSearchAction', handleExtensionSearchEvent);
  }, []);

  // 확장자 검색 결과를 받아 처리하는 함수 (임시로 addNotification 의존성 제거)
  const handleExtensionSearchAction = useCallback(async (event) => {
    
    const { extensions, searchPaths } = event.detail;
    const targetPath = searchPaths?.[0];

    setActiveService('file-manager');
    setActivePanel('files');

    if (targetPath) {
      // 명시적으로 경로 설정 후 파일 로드
      setCurrentPath(targetPath);
      await loadFiles(targetPath);
    } else {
    }
    
    if (extensions && extensions.length > 0) {
      const normalizedExtensions = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
      setSelectedExtensions(normalizedExtensions);
    } else {
    }
    
    // 확장자 검색 결과 처리
  }, [currentPath, setCurrentPath, loadFiles, setSelectedExtensions]);
  
  // 앱 시작 시 도구 목록 동기화
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const userId = window.electronAPI?.getUserId?.() || 'anonymous';
        const availableTools = await getAvailableTools(userId);
        setTools(availableTools);
      } catch (error) {
      }
    };
    fetchTools();
  }, []);

  // 캘린더 서비스 데이터 로드
  useEffect(() => {
    if (activeService === 'calendar') {
      loadCalendarsData();
    }
  }, [activeService, loadCalendarsData]);

  // 알림 추가 함수
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // 분석 패널에 파일 추가
  const handleAddFileToAnalysis = useCallback((filePath) => {
    try {
      // 파일 정보 생성
      const fileName = filePath.split('\\').pop();
      const fileExt = fileName.split('.').pop().toLowerCase();
      
      const fileInfo = {
        name: fileName,
        path: filePath,
        size: 0, // 실제 크기는 나중에 가져올 수 있음
        ext: fileExt,
        mtime: new Date().toISOString()
      };
      
      // 중복 체크 - 함수형 업데이트를 사용하여 현재 상태에 접근
      setAnalysisFiles(prev => {
        const isDuplicate = prev.some(file => file.path === filePath);
        if (!isDuplicate) {
          addNotification(`분석 목록에 추가되었습니다: ${fileName}`, 'success');
          return [...prev, fileInfo];
        } else {
          addNotification(`이미 분석 목록에 있습니다: ${fileName}`, 'info');
          return prev;
        }
      });
      
      // 파일 매니저 서비스로 변경하고 분석 패널로 이동
      setActiveService('file-manager');
      setActivePanel('analysis');
      
    } catch (error) {
      console.error('분석 파일 추가 실패:', error);
      addNotification('분석 파일 추가에 실패했습니다.', 'error');
    }
  }, [addNotification]);

  // handleExtensionSearchAction을 addNotification이 정의된 후에 다시 업데이트
  const handleExtensionSearchActionWithNotification = useCallback(async (event) => {
    
    const { extensions, searchPaths } = event.detail;
    const targetPath = searchPaths?.[0];

    setActiveService('file-manager');
    setActivePanel('files');

    if (targetPath) {
      // 명시적으로 경로 설정 후 파일 로드
      setCurrentPath(targetPath);
      await loadFiles(targetPath);
    } else {
    }
    
    if (extensions && extensions.length > 0) {
      const normalizedExtensions = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
      setSelectedExtensions(normalizedExtensions);
    } else {
    }
    
    addNotification(`확장자 검색 결과를 확인하세요: ${extensions?.join(', ')}`, 'success');
  }, [currentPath, setCurrentPath, loadFiles, setSelectedExtensions, addNotification]);

  // ref에 함수 할당
  useEffect(() => {
    handleExtensionSearchActionRef.current = handleExtensionSearchActionWithNotification;
  }, [handleExtensionSearchActionWithNotification]);

  // 서비스 변경 핸들러
  const handleServiceChange = (serviceId) => {
    setActiveService(serviceId);
    const panels = getServicePanels(serviceId);
    if (panels.length > 0) {
      setActivePanel(panels[0].id);
    }
    
    // 각 서비스별 초기화 처리
    switch (serviceId) {
      case 'fileManager':
      case 'file-manager':
        // 파일매니저 초기화
        clearSelection();
        setSelectedExtensions([]);
        setSearchQuery('');
        setFilterType('all');
        // 홈 디렉토리로 이동
        if (window.electronAPI?.getHomeDirectory) {
          window.electronAPI.getHomeDirectory().then(homeDir => {
            navigateToPath(homeDir);
          }).catch(() => {
            navigateToPath(typeof process !== 'undefined' && process.platform === 'win32' ? 'C:\\' : '/');
          });
        } else {
          navigateToPath(typeof process !== 'undefined' && process.platform === 'win32' ? 'C:\\' : '/');
        }
        break;
        
      case 'home':
        // 홈 서비스는 dashboard가 기본
        setActivePanel('dashboard');
        break;
        
      case 'chatbot':
        // 챗봇 서비스 초기화
        clearChatHistory();
        setChatInput('');
        break;
        
      case 'calendar':
        // 캘린더 서비스는 calendar 패널이 기본
        setActivePanel('calendar');
        break;
        
      case 'notifications':
        // 알림 서비스는 inbox가 기본
        setActivePanel('inbox');
        break;
        
      case 'task-manager':
        // 작업 관리자는 tasks가 기본
        setActivePanel('tasks');
        break;
        
      case 'note-taking':
        // 노트 서비스는 개인노트가 기본
        console.log('📝 노트 서비스 선택됨, personal-notes 패널로 설정');
        setActivePanel('personal-notes');
        break;
        
      case 'tax-service':
        // 세무서비스는 tax 패널이 기본
        setActivePanel('tax');
        break;
        
      case 'messenger':
        // 메신저는 chats가 기본
        setActivePanel('chats');
        break;
        
      case 'contacts':
        // 연락처는 contacts-list가 기본
        setActivePanel('contacts-list');
        break;
        
      case 'documents':
        // 문서는 documents가 기본
        setActivePanel('documents');
        break;
        
      default:
        // 기본적으로 첫 번째 패널로 이동
        break;
    }
  };
  
  // 파일 작업 핸들러 래퍼 - 작업 후 파일 목록 새로고침
  const handleFileOperationWrapper = async (action, data, selectedFiles) => {
    try {
      // 클립보드 작업 처리
      if (action === 'copy') {
        const filesToCopy = selectedFiles?.length > 0 ? selectedFiles : [data];
        const count = copyFiles(filesToCopy);
        addNotification(`${count}개 파일을 복사했습니다.`, 'success');
        return;
      }
      
      if (action === 'cut') {
        const filesToCut = selectedFiles?.length > 0 ? selectedFiles : [data];
        const count = cutFiles(filesToCut);
        addNotification(`${count}개 파일을 잘라냈습니다.`, 'success');
        return;
      }
      
      if (action === 'paste') {
        const result = await pasteFiles(currentPath);
        if (result.success) {
          addNotification(`${result.count}개 파일을 ${result.operation === 'copy' ? '복사' : '이동'}했습니다.`, 'success');
          // 강제로 파일 목록 새로고침
          await loadFiles(currentPath);
        } else {
          addNotification(result.error, 'error');
        }
        return;
      }
      
      // 기타 액션들
      if (action === 'favorite') {
        try {
          await toggleFavorite(data);
          addNotification('즐겨찾기가 변경되었습니다.', 'success');
        } catch (error) {
          addNotification('즐겨찾기 변경에 실패했습니다.', 'error');
        }
        return;
      }
      
      if (action === 'rename') {
        // 이름 변경 다이얼로그 표시
        setRenameDialog({ file: data, show: true });
        return;
      }
      
      if (action === 'delete') {
        // 삭제 확인 및 실행
        const filesToDelete = selectedFiles?.length > 0 ? selectedFiles : [data];
        const fileCount = filesToDelete.length;
        const fileNames = filesToDelete.map(f => f.name).join(', ');
        
        const confirmMessage = fileCount === 1 
          ? `"${fileNames}"을(를) 정말 삭제하시겠습니까?`
          : `선택한 ${fileCount}개 파일을 정말 삭제하시겠습니까?`;
        
        if (window.confirm(confirmMessage)) {
          try {
            const result = await handleFileOperation('delete', filesToDelete);
            await loadFiles(currentPath);
            addNotification(`${fileCount}개 파일이 삭제되었습니다.`, 'success');
            // 선택 해제
            clearSelection();
          } catch (error) {
            addNotification('파일 삭제에 실패했습니다.', 'error');
          }
        }
        return;
      }
      
      if (action === 'refresh') {
        // 파일 목록 새로고침
        await loadFiles(currentPath);
        addNotification('파일 목록이 새로고침되었습니다.', 'success');
        return;
      }
      
      // 파일 열기 액션일 때 최근 파일에 추가
      if (action === 'open' && data && !data.isDirectory) {
        await addFileToRecent(data);
        console.log('파일이 최근 파일 목록에 추가됨:', data.name);
      }
      
      const result = await handleFileOperation(action, data);
      
      // 특별한 반환값이 있는 경우 처리
      if (result && typeof result === 'object') {
        if (result.action === 'rename') {
          // 이름 변경 UI 표시 (향후 구현)
          addNotification('이름 변경 기능은 곧 추가될 예정입니다.', 'info');
          return;
        }
        if (result.action === 'properties') {
          // 속성 창 표시 (향후 구현)
          addNotification('속성 보기 기능은 곧 추가될 예정입니다.', 'info');
          return;
        }
        if (result.action === 'share') {
          // 공유 UI 표시 (향후 구현)
          addNotification('공유 기능은 곧 추가될 예정입니다.', 'info');
          return;
        }
        if (result.action === 'file-analyze') {
          // 파일 분석 패널로 이동
          setActivePanel('analysis');
          // 선택된 파일들을 분석 패널에 전달
          if (result.files && result.files.length > 0) {
            addNotification(`${result.files.length}개 파일을 분석 패널로 전송했습니다.`, 'success');
          }
          return;
        }
      }
      
      // 이동, 삭제 등의 작업 후 파일 목록 새로고침
      if (action === 'move' || action === 'delete' || action === 'upload') {
        await loadFiles(currentPath);
        addNotification('파일 작업이 완료되었습니다.', 'success');
      }
    } catch (error) {
      console.error('파일 작업 오류:', error);
      addNotification('파일 작업 중 오류가 발생했습니다.', 'error');
    }
  };

  // 폴더 네비게이션 핸들러 - 폴더를 최근 파일에 추가
  const handleNavigateToPath = async (path) => {
    try {
      // 폴더 정보를 찾아서 최근 파일에 추가
      const folderInfo = files.find(f => f.path === path && f.isDirectory);
      if (folderInfo) {
        await addFileToRecent(folderInfo);
        console.log('폴더가 최근 파일 목록에 추가됨:', folderInfo.name);
      }
      
      // 실제 네비게이션 수행
      navigateToPath(path);
    } catch (error) {
      console.error('네비게이션 중 오류:', error);
      // 오류가 있어도 네비게이션은 수행
      navigateToPath(path);
    }
  };

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = async (file) => {
    try {
      const wasAdded = await toggleFavorite(file);
      addNotification(
        wasAdded ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.',
        'success'
      );
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
      addNotification('즐겨찾기 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 서비스별 상태 정보 생성
  const getStatusItems = () => {
    switch (activePanel) {
      case 'files':
      case 'search':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
            label: '파일',
            value: `${files.length || 0}개`,
            color: 'text-blue-600 dark:text-blue-400'
          },
          ...(selectedFiles.length > 0 ? [{
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
            label: '선택됨',
            value: `${selectedFiles.length}개`,
            color: 'text-green-600 dark:text-green-400'
          }] : []),
          ...(currentPath ? [{
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            label: '경로',
            value: currentPath.split(/[\\/]/).pop() || currentPath,
            color: 'text-gray-600 dark:text-gray-400'
          }] : [])
        ];


      case 'company':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
            label: '회사',
            value: 'Web MCP Solutions',
            color: 'text-indigo-600 dark:text-indigo-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>,
            label: '위치',
            value: '서울 강남구',
            color: 'text-gray-600 dark:text-gray-400'
          }
        ];

      case 'pricing':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '플랜',
            value: '3가지 요금제',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
            label: '무료체험',
            value: '14일',
            color: 'text-blue-600 dark:text-blue-400'
          }
        ];

      case 'settings':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            label: '테마',
            value: isDarkMode ? '다크' : '라이트',
            color: 'text-gray-600 dark:text-gray-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '상태',
            value: '정상',
            color: 'text-green-600 dark:text-green-400'
          }
        ];

      // 기타 서비스들
      case 'chat':
      case 'history':
      case 'prompts':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
            label: '대화',
            value: '5개 활성',
            color: 'text-blue-600 dark:text-blue-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
            label: '프롬프트',
            value: '12개 저장됨',
            color: 'text-purple-600 dark:text-purple-400'
          }
        ];

      case 'calendar':
      case 'events':
      case 'reminders':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            label: '오늘 일정',
            value: '3개',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '다음 이벤트',
            value: '2시간 후',
            color: 'text-orange-600 dark:text-orange-400'
          }
        ];

      case 'inbox':
      case 'notifications-settings':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
            label: '읽지 않음',
            value: '7개',
            color: 'text-red-600 dark:text-red-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
            label: '마지막 업데이트',
            value: '방금 전',
            color: 'text-gray-600 dark:text-gray-400'
          }
        ];

      case 'tasks':
      case 'projects':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
            label: '진행 중',
            value: '8개 작업',
            color: 'text-yellow-600 dark:text-yellow-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            label: '완료율',
            value: '68%',
            color: 'text-green-600 dark:text-green-400'
          }
        ];

      case 'task-analytics':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            label: '분석 대시보드',
            value: '실시간 데이터',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
            label: '생산성 점수',
            value: '87점',
            color: 'text-purple-600 dark:text-purple-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            label: '팀 효율성',
            value: '92%',
            color: 'text-blue-600 dark:text-blue-400'
          }
        ];

      case 'personal-notes':
      case 'shared-notes':
      case 'bookmarks':
      case 'templates':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
            label: activePanel === 'bookmarks' ? '즐겨찾기' : '노트',
            value: activePanel === 'bookmarks' ? '15개' : '24개',
            color: activePanel === 'bookmarks' ? 'text-yellow-600 dark:text-yellow-400' : 'text-pink-600 dark:text-pink-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '최근 편집',
            value: '10분 전',
            color: 'text-gray-600 dark:text-gray-400'
          }
        ];

      case 'sync':
      case 'storage':
      case 'backup':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
            label: '동기화',
            value: '완료',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
            label: '저장소',
            value: '2개 연결됨',
            color: 'text-blue-600 dark:text-blue-400'
          }
        ];

      case 'chats':
      case 'contacts-messenger':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
            label: '활성 대화',
            value: '4개',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            label: '온라인',
            value: '12명',
            color: 'text-blue-600 dark:text-blue-400'
          }
        ];

      case 'contacts-list':
      case 'groups':
      case 'recent':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            label: '연락처',
            value: '156명',
            color: 'text-purple-600 dark:text-purple-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            label: '그룹',
            value: '8개',
            color: 'text-indigo-600 dark:text-indigo-400'
          }
        ];

      case 'documents':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            label: '문서',
            value: '48개',
            color: 'text-emerald-600 dark:text-emerald-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
            label: '템플릿',
            value: '15개',
            color: 'text-orange-600 dark:text-orange-400'
          }
        ];

      // 홈 서비스 패널들
      case 'dashboard':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" /></svg>,
            label: '홈',
            value: '대시보드',
            color: 'text-orange-600 dark:text-orange-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            label: '활동',
            value: '모든 서비스',
            color: 'text-amber-600 dark:text-amber-400'
          }
        ];

      case 'quick-access':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            label: '빠른 액세스',
            value: '즐겨찾기 & 바로가기',
            color: 'text-orange-600 dark:text-orange-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '최근 사용',
            value: '앱 & 파일',
            color: 'text-amber-600 dark:text-amber-400'
          }
        ];

      case 'recent-activity':
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
            label: '최근 활동',
            value: '모든 작업 내역',
            color: 'text-orange-600 dark:text-orange-400'
          },
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            label: '통계',
            value: '사용 패턴 분석',
            color: 'text-amber-600 dark:text-amber-400'
          }
        ];

      default:
        return [
          {
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: '서비스',
            value: activePanel || '알 수 없음',
            color: 'text-gray-600 dark:text-gray-400'
          }
        ];
    }
  };

  // 메인 패널 렌더링
  const renderMainPanel = () => {
    switch (activePanel) {
      case 'files':
        return (
          <FileExplorerPanel
            currentPath={currentPath}
            files={filteredFiles}
            loading={loading}
            selectedFiles={selectedFiles}
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onNavigate={handleNavigateToPath}
            onFileSelect={toggleFileSelection}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
            onSortOrderChange={setSortOrder}
            onFileAction={handleFileOperationWrapper}
            onContextMenu={setContextMenu}
            onNotification={addNotification}
            favoritedFiles={favoritedFiles}
            onFavoriteToggle={handleFavoriteToggle}
          />
        );
      case 'search':
        return (
          <SearchPanel
            activePanel={activePanel}
            onNotification={addNotification}
            onAddFileToAnalysis={handleAddFileToAnalysis}
          />
        );
      case 'analysis':
        return (
          <AnalysisPanel
            activePanel={activePanel}
            onNotification={addNotification}
            selectedFiles={selectedFiles}
            currentPath={currentPath}
            analysisFiles={analysisFiles}
            setAnalysisFiles={setAnalysisFiles}
            analysisResults={analysisResults}
            setAnalysisResults={setAnalysisResults}
            analysisHistory={analysisHistory}
            setAnalysisHistory={setAnalysisHistory}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            isDarkMode={isDarkMode}
            onDarkModeChange={setIsDarkMode}
            onNotification={addNotification}
          />
        );
      case 'company':
        return (
          <CompanyPanel
            onNotification={addNotification}
          />
        );
      case 'pricing':
        return (
          <PricingPanel
            onNotification={addNotification}
          />
        );
      // 홈 서비스 패널들
      case 'dashboard':
      case 'quick-access':
      case 'recent-activity':
        return (
          <HomeContainer
            activePanel={activePanel}
            onNotification={addNotification}
          />
        );
      // 캘린더 서비스 패널들
      case 'calendar':
      case 'events':
      case 'reminders':
        return (
          <CalendarPanel
            activePanel={activePanel}
            onNotification={addNotification}
            initialDate={calendarCurrentDate}
            onDateChange={setCalendarCurrentDate}
          />
        );
      // 태스크 서비스 패널들
      case 'tasks':
      case 'projects':
      case 'teams':
      case 'organizations':
        return (
          <TaskPanel
            activePanel={activePanel}
            onNotification={addNotification}
          />
        );
      // 태스크 분석 패널 (별도 컴포넌트)
      case 'task-analytics':
        return (
          <TaskAnalyticsPanel
            activePanel={activePanel}
            onNotification={addNotification}
            tasks={[]}
            projects={[]}
            users={[]}
          />
        );
      // 노트 서비스 패널들
      case 'personal-notes':
        return (
          <NotePanel
            activePanel={activePanel}
            onNotification={addNotification}
            userId={window.electronAPI?.getUserId?.() || 'anonymous'}
          />
        );
      case 'templates':
        return (
          <TemplatePanel
            activePanel={activePanel}
            onNotification={addNotification}
            userId={window.electronAPI?.getUserId?.() || 'anonymous'}
          />
        );

      case 'bookmarks':
        return (
          <BookmarkPanel
            activePanel={activePanel}
            onNotification={addNotification}
            userId={window.electronAPI?.getUserId?.() || 'anonymous'}
          />
        );
      // 연락처 서비스 패널들
      case 'contacts-list':
      case 'groups':
      case 'network':
      case 'contacts':
      case 'recent':
        return (
          <ContactsPanel
            activePanel={activePanel}
            onNotification={addNotification}
          />
        );
      default:
        return null;
    }
  };

  // 전체 화면 모드 (홈, 회사 소개, 요금제, 설정)
  // 캘린더는 사이드바가 필요하므로 fullscreen mode에서 제외
  const isFullScreenMode = activePanel === 'dashboard' || activePanel === 'quick-access' || activePanel === 'recent-activity' || activePanel === 'company' || activePanel === 'pricing' || activePanel === 'settings';

  // 확장자 검색 액션 이벤트 리스너 등록 (중복 제거 - 이미 라인 370에서 처리됨)
  // useEffect(() => {
  //   window.addEventListener('extensionSearchAction', handleExtensionSearchAction);
  //   return () => {
  //     window.removeEventListener('extensionSearchAction', handleExtensionSearchAction);
  //   };
  // }, [handleExtensionSearchAction]);

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* 전체 컨테이너 */}
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-gray-900">
        {/* 왼쪽 사이드바 - 전체 화면 모드에서는 ServiceSelector만 표시 */}
        {isFullScreenMode ? (
          <ServiceSelector
            activeService={activeService}
            onServiceChange={handleServiceChange}
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            onAIToggle={() => setIsAIFloatingOpen(!isAIFloatingOpen)}
            isAIOpen={isAIFloatingOpen}
          />
        ) : (
          <Sidebar
            activeService={activeService}
            onServiceChange={handleServiceChange}
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            drives={drives}
            favorites={favorites}
            recentFiles={recentFiles}
            currentPath={currentPath}
            onNavigate={handleNavigateToPath}
            onNotification={addNotification}
            onAIToggle={() => setIsAIFloatingOpen(!isAIFloatingOpen)}
            isAIOpen={isAIFloatingOpen}
          >
            {/* 캘린더 서비스일 때만 CalendarSidebar를 children으로 전달 */}
            {activeService === 'calendar' && (
              <CalendarSidebar 
                calendars={calendars}
                selectedCalendars={selectedCalendars}
                onToggleCalendar={toggleCalendar}
                onCreateCalendar={(newCalendar) => {
                  createCalendar(newCalendar);
                  addNotification('새 캘린더가 생성되었습니다.', 'success');
                }}
                currentDate={calendarCurrentDate}
                onDateSelect={setCalendarCurrentDate}
                recentEvents={filteredEvents.slice(0, 5)}
                urgentNotices={urgentNotices}
                activeModules={activeModules}
                onCreateEvent={() => {
                  // 새 이벤트 생성 (CalendarPanel의 상태는 직접 접근할 수 없으므로 이벤트 발생)
                  addNotification('새 이벤트 만들기를 위해 헤더의 "새 일정" 버튼을 클릭하세요.', 'info');
                }}
                onShowTemplates={() => {
                  addNotification('템플릿 관리를 위해 헤더의 템플릿 버튼을 클릭하세요.', 'info');
                }}
                onShowRecurrence={() => {
                  addNotification('반복 이벤트 관리를 위해 헤더의 반복 버튼을 클릭하세요.', 'info');
                }}
                onShowModules={() => {
                  addNotification('모듈 관리를 위해 헤더의 모듈 버튼을 클릭하세요.', 'info');
                }}
              />
            )}

            {/* 태스크 서비스일 때만 TaskSidebarContent를 children으로 전달 */}
            {(activeService === 'task-manager' || 
              activePanel === 'tasks' || 
              activePanel === 'projects' || 
              activePanel === 'teams' || 
              activePanel === 'organizations' || 
              activePanel === 'task-analytics') && (
              <TaskSidebarContent
                organizations={[
                  {
                    id: 'org1',
                    name: 'TechCorp',
                    stats: { total_tasks: 156, completed_tasks: 98 }
                  }
                ]}
                projects={[
                  {
                    id: 'project1',
                    name: 'TaskManager 2.0',
                    organization_id: 'org1',
                    progress: 65,
                    task_count: 45
                  }
                ]}
                teams={[
                  {
                    id: 'team1',
                    name: '개발팀',
                    organization_id: 'org1',
                    task_count: 28
                  }
                ]}
                selectedOrganization={selectedOrganization}
                selectedProject={selectedProject}
                selectedTeam={selectedTeam}
                onOrganizationSelect={setSelectedOrganization}
                onProjectSelect={setSelectedProject}
                onTeamSelect={setSelectedTeam}
                onCreateOrganization={() => addNotification('조직 생성 기능이 곧 출시됩니다.', 'info')}
                onCreateProject={() => addNotification('프로젝트 생성 기능이 곧 출시됩니다.', 'info')}
                onCreateTeam={() => addNotification('팀 생성 기능이 곧 출시됩니다.', 'info')}
                analytics={{
                  total_tasks: 156,
                  completed_tasks: 98
                }}
                loading={false}
              />
            )}

            {/* 연락처 서비스일 때만 ContactsSidebar를 children으로 전달 */}
            {(activeService === 'contacts' || 
              activePanel === 'contacts-list' || 
              activePanel === 'groups' || 
              activePanel === 'network' || 
              activePanel === 'contacts' ||
              activePanel === 'recent') && (
              <ContactsSidebar
                activePanel={activePanel}
                onPanelChange={setActivePanel}
                onNotification={addNotification}
              />
            )}

            {/* 노트 서비스일 때만 NoteSidebar를 children으로 전달 */}
            {(activeService === 'note-taking' || 
              activePanel === 'personal-notes' || 
              activePanel === 'shared-notes' || 
              activePanel === 'bookmarks' || 
              activePanel === 'templates') && (
              <NoteSidebar
                activePanel={activePanel}
                onPanelChange={setActivePanel}
                onNotification={addNotification}
              />
            )}
          </Sidebar>
        )}

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 상단 바 - 전체 화면 모드에서는 숨김, 파일매니저에서만 표시 (검색 패널 제외) */}
          {!isFullScreenMode && activePanel === 'files' && (
            <FileManagerTopBar
              currentPath={currentPath}
              selectedFiles={selectedFiles}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNavigate={handleNavigateToPath}
              onNotification={addNotification}
              reloadFiles={loadFiles}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              includeSubfolders={includeSubfolders}
              onIncludeSubfoldersChange={setIncludeSubfolders}
            />
          )}

          {/* 확장자 필터바 - 파일매니저에서만 표시 */}
          {!isFullScreenMode && activePanel === 'files' && (
            <>
              <ExtensionFilterBar
                files={processedFiles}
                selectedExtensions={selectedExtensions}
                onExtensionChange={setSelectedExtensions}
                isDarkMode={isDarkMode}
              />
            </>
          )}

          {/* 메인 패널 */}
          <div className={`flex-1 ${isFullScreenMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {renderMainPanel()}
            {/* 태스크 서비스에서만 태스크 분석 패널 표시 */}
            {(activeService === 'task-manager' ||
              activePanel === 'task-analytics' ||
              activePanel === 'tasks' ||
              activePanel === 'projects' ||
              activePanel === 'teams' ||
              activePanel === 'organizations') && (
              <TaskAnalyticsPanel
                activePanel={activePanel}
                onNotification={addNotification}
                tasks={[]}
                projects={[]}
                users={[]}
              />
            )}
          </div>

          {/* 하단 상태바 - 전체 화면 모드에서는 숨김, 고급 파일 검색 패널(search)에서는 숨김 */}
          {!isFullScreenMode && activePanel !== 'search' && (
            <StatusBar
              statusItems={getStatusItems()}
              notifications={notifications}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* 이름 변경 다이얼로그 */}
      {renameDialog?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              이름 바꾸기
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newName = formData.get('fileName');
                
                const result = await renameFile(renameDialog.file, newName);
                if (result.success) {
                  addNotification(`"${result.newName}"로 이름이 변경되었습니다.`, 'success');
                  setRenameDialog(null);
                } else {
                  addNotification(result.error, 'error');
                }
              }}
            >
              <input
                type="text"
                name="fileName"
                defaultValue={renameDialog.file.name}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onFocus={(e) => {
                  // 확장자 제외하고 파일명만 선택
                  const fileName = e.target.value;
                  const lastDotIndex = fileName.lastIndexOf('.');
                  if (lastDotIndex > 0) {
                    e.target.setSelectionRange(0, lastDotIndex);
                  } else {
                    e.target.select();
                  }
                }}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setRenameDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                           bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 
                           rounded-md transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                           rounded-md transition-colors"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          clipboard={clipboard}
          onClose={() => setContextMenu(null)}
          onAction={(action, file, selectedFiles) => {
            setContextMenu(null);
            handleFileOperationWrapper(action, file, selectedFiles);
          }}
        />
      )}

      {/* AI 코파일럿 플로팅 팝업 (Tool Calling 지원으로 개선됨) */}
      <AICopilotFloating
        isOpen={isAIFloatingOpen}
        onClose={() => setIsAIFloatingOpen(false)}
        chatInput={chatInput}
        chatHistory={chatHistory}
        aiThinking={aiThinking}
        aiSuggestions={aiSuggestions}
        aiResult={aiResult}
        contextAwareness={contextAwareness}
        selectedFiles={selectedFiles}
        onChatInputChange={setChatInput}
        onSendChat={handleSendChat}
        onFileAnalysis={handleAIAnalysis}
        onOrganizationPlan={handleOrganizationPlan}
        onApplySuggestion={applySuggestion}
        onClearHistory={clearChatHistory}
        onNotification={addNotification}
      />

      {/* 알림 토스트 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={`${notification.id}-${index}`}
            className={`
              px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300
              ${notification.type === 'success' ? 'bg-green-500' : 
                notification.type === 'error' ? 'bg-red-500' : 
                notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}
              text-white
            `}
          >
            <p className="text-sm font-medium">{notification.message}</p>
            <p className="text-xs opacity-75">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;