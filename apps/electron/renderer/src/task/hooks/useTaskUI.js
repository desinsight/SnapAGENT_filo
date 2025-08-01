import { useState, useCallback } from 'react';
import { TASK_CONFIG } from '../constants/taskConfig';

const useTaskUI = () => {
  // UI 설정 상태
  const [uiSettings, setUISettings] = useState({
    theme: TASK_CONFIG.DEFAULT_SETTINGS.theme,
    compactMode: TASK_CONFIG.DEFAULT_SETTINGS.compactMode,
    showCompleted: TASK_CONFIG.DEFAULT_SETTINGS.showCompleted,
    autoSave: TASK_CONFIG.DEFAULT_SETTINGS.autoSave,
    density: TASK_CONFIG.UI_SETTINGS.DENSITY.COMFORTABLE
  });

  // 활성 필터 상태
  const [activeFilters, setActiveFilters] = useState(TASK_CONFIG.DEFAULT_SETTINGS.filters);

  // 뷰 설정 상태
  const [viewSettings, setViewSettings] = useState({
    view: TASK_CONFIG.DEFAULT_SETTINGS.view,
    sorting: TASK_CONFIG.DEFAULT_SETTINGS.sorting,
    pagination: TASK_CONFIG.DEFAULT_SETTINGS.pagination
  });

  // 퀵 필터 상태
  const [quickFilters, setQuickFilters] = useState({
    my_tasks: false,
    overdue: false,
    today: false,
    this_week: false,
    urgent: false,
    in_progress: false
  });

  // UI 설정 업데이트
  const updateUISettings = useCallback((newSettings) => {
    setUISettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('taskUI_settings', JSON.stringify({
        ...uiSettings,
        ...newSettings
      }));
    } catch (error) {
      console.error('UI 설정 저장 실패:', error);
    }
  }, [uiSettings]);

  // 뷰 설정 업데이트
  const updateViewSettings = useCallback((newViewSettings) => {
    setViewSettings(prevSettings => ({
      ...prevSettings,
      ...newViewSettings
    }));
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('taskUI_viewSettings', JSON.stringify({
        ...viewSettings,
        ...newViewSettings
      }));
    } catch (error) {
      console.error('뷰 설정 저장 실패:', error);
    }
  }, [viewSettings]);

  // 테마 토글
  const toggleTheme = useCallback(() => {
    const newTheme = uiSettings.theme === 'light' ? 'dark' : 'light';
    updateUISettings({ theme: newTheme });
  }, [uiSettings.theme, updateUISettings]);

  // 컴팩트 모드 토글
  const toggleCompactMode = useCallback(() => {
    updateUISettings({ compactMode: !uiSettings.compactMode });
  }, [uiSettings.compactMode, updateUISettings]);

  // 완료된 태스크 표시 토글
  const toggleShowCompleted = useCallback(() => {
    updateUISettings({ showCompleted: !uiSettings.showCompleted });
  }, [uiSettings.showCompleted, updateUISettings]);

  // 자동 저장 토글
  const toggleAutoSave = useCallback(() => {
    updateUISettings({ autoSave: !uiSettings.autoSave });
  }, [uiSettings.autoSave, updateUISettings]);

  // 밀도 설정 변경
  const changeDensity = useCallback((density) => {
    updateUISettings({ density });
  }, [updateUISettings]);

  // 필터 리셋
  const resetFilters = useCallback(() => {
    setActiveFilters(TASK_CONFIG.DEFAULT_SETTINGS.filters);
    setQuickFilters({
      my_tasks: false,
      overdue: false,
      today: false,
      this_week: false,
      urgent: false,
      in_progress: false
    });
  }, []);

  // 설정 리셋
  const resetSettings = useCallback(() => {
    setUISettings({
      theme: TASK_CONFIG.DEFAULT_SETTINGS.theme,
      compactMode: TASK_CONFIG.DEFAULT_SETTINGS.compactMode,
      showCompleted: TASK_CONFIG.DEFAULT_SETTINGS.showCompleted,
      autoSave: TASK_CONFIG.DEFAULT_SETTINGS.autoSave,
      density: TASK_CONFIG.UI_SETTINGS.DENSITY.COMFORTABLE
    });
    
    setViewSettings({
      view: TASK_CONFIG.DEFAULT_SETTINGS.view,
      sorting: TASK_CONFIG.DEFAULT_SETTINGS.sorting,
      pagination: TASK_CONFIG.DEFAULT_SETTINGS.pagination
    });
    
    resetFilters();
    
    // 로컬 스토리지 클리어
    try {
      localStorage.removeItem('taskUI_settings');
      localStorage.removeItem('taskUI_viewSettings');
    } catch (error) {
      console.error('설정 초기화 실패:', error);
    }
  }, [resetFilters]);

  // 설정 내보내기
  const exportSettings = useCallback(() => {
    const settingsData = {
      uiSettings,
      viewSettings,
      activeFilters,
      quickFilters,
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(settingsData, null, 2);
  }, [uiSettings, viewSettings, activeFilters, quickFilters]);

  // 설정 가져오기
  const importSettings = useCallback((settingsJson) => {
    try {
      const settingsData = JSON.parse(settingsJson);
      
      if (settingsData.uiSettings) {
        setUISettings(settingsData.uiSettings);
      }
      
      if (settingsData.viewSettings) {
        setViewSettings(settingsData.viewSettings);
      }
      
      if (settingsData.activeFilters) {
        setActiveFilters(settingsData.activeFilters);
      }
      
      if (settingsData.quickFilters) {
        setQuickFilters(settingsData.quickFilters);
      }
      
      return true;
    } catch (error) {
      console.error('설정 가져오기 실패:', error);
      return false;
    }
  }, []);

  // 로컬 스토리지에서 설정 로드 (초기화 시)
  const loadSettings = useCallback(() => {
    try {
      const savedUISettings = localStorage.getItem('taskUI_settings');
      if (savedUISettings) {
        setUISettings(JSON.parse(savedUISettings));
      }
      
      const savedViewSettings = localStorage.getItem('taskUI_viewSettings');
      if (savedViewSettings) {
        setViewSettings(JSON.parse(savedViewSettings));
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  }, []);

  return {
    uiSettings,
    updateUISettings,
    activeFilters,
    setActiveFilters,
    viewSettings,
    updateViewSettings,
    quickFilters,
    setQuickFilters,
    toggleTheme,
    toggleCompactMode,
    toggleShowCompleted,
    toggleAutoSave,
    changeDensity,
    resetFilters,
    resetSettings,
    exportSettings,
    importSettings,
    loadSettings
  };
};

export default useTaskUI;