/**
 * 템플릿 패널 - 문서 템플릿 관리 인터페이스
 * 
 * @description 노트 템플릿과 양식을 생성, 관리, 사용할 수 있는 인터페이스
 * @design Office 365 스타일의 단일 패널 테이블 중심 인터페이스
 * @layout 세로 스택 레이아웃 (헤더 → 필터바 → 테이블) - 사이드바 없음
 * @colors 모노톤 디자인, 미니멀 액센트
 * @author AI Assistant
 * @version 1.0.0 - Template Management Interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTemplates } from './hooks/useTemplates';

// UI 컴포넌트들
import TemplateList from './components/template/TemplateList';

// 기본 설정
import { TEMPLATE_TYPES, TEMPLATE_CATEGORIES } from './constants/templateConfig';

const TemplatePanel = ({ 
  activePanel = 'templates',
  onNotification,
  userId = 'anonymous'
}) => {
  // 템플릿 관련 상태 및 함수
  const {
    templates,
    categories,
    stats,
    loading,
    error,
    selectedTemplate,
    loadTemplates,
    loadCategories,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setSelectedTemplate,
    clearError,
    refreshTemplates
  } = useTemplates();

  // UI 상태 관리 - Office 365 템플릿 인터페이스
  const [searchQuery, setSearchQuery] = useState(''); // 검색 쿼리
  const [selectedTemplates, setSelectedTemplates] = useState([]); // 선택된 템플릿 (체크박스)
  const [showFilters, setShowFilters] = useState(false); // 필터 칩 영역 표시
  const [activeFilters, setActiveFilters] = useState([]); // 활성 필터 목록
  const [sortColumn, setSortColumn] = useState('updatedAt'); // 정렬 컬럼
  const [sortDirection, setSortDirection] = useState('desc'); // 정렬 방향
  const [tableView, setTableView] = useState('comfortable'); // 테이블 뷰: comfortable, compact, spacious

  // 알림 도우미 함수
  const notify = useCallback((message, type = 'info') => {
    if (onNotification) {
      onNotification(message, type);
    }
  }, [onNotification]);

  /**
   * 템플릿 생성 핸들러
   */
  const handleCreateTemplate = useCallback(async (templateData) => {
    try {
      await createTemplate(templateData);
      await refreshTemplates();
      notify('템플릿이 생성되었습니다.', 'success');
      setShowEditor(false);
    } catch (error) {
      notify(`템플릿 생성 실패: ${error.message}`, 'error');
    }
  }, [createTemplate, refreshTemplates, notify]);

  /**
   * 템플릿 업데이트 핸들러
   */
  const handleUpdateTemplate = useCallback(async (templateId, templateData) => {
    try {
      await updateTemplate(templateId, templateData);
      await refreshTemplates();
      notify('템플릿이 업데이트되었습니다.', 'success');
    } catch (error) {
      notify(`템플릿 업데이트 실패: ${error.message}`, 'error');
    }
  }, [updateTemplate, refreshTemplates, notify]);

  /**
   * 템플릿 삭제 핸들러
   */
  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      await deleteTemplate(templateId);
      await refreshTemplates();
      notify('템플릿이 삭제되었습니다.', 'success');
    } catch (error) {
      notify(`템플릿 삭제 실패: ${error.message}`, 'error');
    }
  }, [deleteTemplate, refreshTemplates, notify]);

  /**
   * 템플릿 복제 핸들러
   */
  const handleDuplicateTemplate = useCallback(async (templateId) => {
    try {
      await duplicateTemplate(templateId);
      await refreshTemplates();
      notify('템플릿이 복제되었습니다.', 'success');
    } catch (error) {
      notify(`템플릿 복제 실패: ${error.message}`, 'error');
    }
  }, [duplicateTemplate, refreshTemplates, notify]);

  /**
   * 검색 핸들러 - Office 365 스타일 실시간 검색
   */
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  /**
   * 필터 추가/제거 핸들러
   */
  const handleFilterToggle = useCallback((filterType, filterValue) => {
    const filterId = `${filterType}:${filterValue}`;
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(f => f !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  }, []);

  /**
   * 테이블 정렬 핸들러
   */
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  /**
   * 체크박스 선택 핸들러
   */
  const handleSelectTemplate = useCallback((templateId, checked) => {
    setSelectedTemplates(prev => {
      if (checked) {
        return [...prev, templateId];
      } else {
        return prev.filter(id => id !== templateId);
      }
    });
  }, []);

  /**
   * 전체 선택/해제 핸들러
   */
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const filtered = templates.filter(template => {
        // 활성 필터 적용
        for (const filterId of activeFilters) {
          const [type, value] = filterId.split(':');
          switch (type) {
            case 'category':
              if (template.category !== value) return false;
              break;
            case 'type':
              if (template.type !== value) return false;
              break;
            case 'shared':
              if (!template.isShared) return false;
              break;
          }
        }
        return true;
      });
      setSelectedTemplates(filtered.map(t => t._id));
    } else {
      setSelectedTemplates([]);
    }
  }, [templates, activeFilters]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      notify(`오류 발생: ${error}`, 'error');
      clearError();
    }
  }, [error, notify, clearError]);

  // 초기 데이터 로드
  useEffect(() => {
    if (activePanel === 'templates') {
      loadTemplates();
      loadCategories();
      // loadStats는 loadTemplates에서 자동으로 호출됨
    }
  }, [activePanel, loadTemplates, loadCategories]);

  // 템플릿 패널이 아닌 경우 렌더링하지 않음
  if (activePanel !== 'templates') {
    return null;
  }

  // 필터링된 템플릿 계산 - Office 365 스타일 다중 필터
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // 검색 쿼리 적용
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !template.name.toLowerCase().includes(query) &&
          !template.description?.toLowerCase().includes(query) &&
          !template.tags?.some(tag => tag.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // 활성 필터 적용
      for (const filterId of activeFilters) {
        const [type, value] = filterId.split(':');
        switch (type) {
          case 'category':
            if (template.category !== value) return false;
            break;
          case 'type':
            if (template.type !== value) return false;
            break;
          case 'shared':
            if (!template.isShared) return false;
            break;
        }
      }
      return true;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [templates, searchQuery, activeFilters, sortColumn, sortDirection]);

  // 통계 계산
  const statsData = {
    total: templates.length,
    personal: templates.filter(t => !t.isShared).length,
    shared: templates.filter(t => t.isShared).length,
    categories: categories.length,
    thisWeek: templates.filter(t => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(t.createdAt) > weekAgo;
    }).length
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full min-h-0">
      {/* Office 365 스타일 명령 바 (Command Bar) */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* 메인 헤더 영역 */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 좌측: 제목과 경로 */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">템플릿</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {filteredTemplates.length}개 항목
              </div>
            </div>
            
            {/* 우측: 명령 버튼들 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => notify('새 템플릿 기능은 개발 중입니다.', 'info')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                ➕ 새 템플릿
              </button>
              <button
                onClick={() => refreshTemplates()}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                ↻ 새로고침
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ⚙ 필터
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 도구 모음 영역 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between space-x-4">
            {/* 검색창 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="템플릿 검색..."
                />
              </div>
            </div>

            {/* 뷰 및 정렬 옵션 */}
            <div className="flex items-center space-x-3">
              {/* 테이블 뷰 선택 */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { mode: 'comfortable', label: '편안함', icon: '☰' },
                  { mode: 'compact', label: '컴팩트', icon: '≡' },
                  { mode: 'spacious', label: '여유롭게', icon: '▤' }
                ].map(view => (
                  <button
                    key={view.mode}
                    onClick={() => setTableView(view.mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      tableView === view.mode
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={view.label}
                  >
                    {view.icon}
                  </button>
                ))}
              </div>

              {/* 정렬 선택 */}
              <select
                value={sortColumn}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updatedAt">수정일</option>
                <option value="name">이름</option>
                <option value="createdAt">생성일</option>
                <option value="category">카테고리</option>
                <option value="type">타입</option>
              </select>
            </div>
          </div>
        </div>

        {/* 필터 칩 영역 */}
        {showFilters && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">필터:</span>
              {[
                { type: 'category', value: 'document', label: '문서', count: templates.filter(t => t.category === 'document').length },
                { type: 'category', value: 'form', label: '양식', count: templates.filter(t => t.category === 'form').length },
                { type: 'category', value: 'email', label: '이메일', count: templates.filter(t => t.category === 'email').length },
                { type: 'shared', value: 'true', label: '공유 템플릿', count: statsData.shared }
              ].map(filter => {
                const filterId = `${filter.type}:${filter.value}`;
                const isActive = activeFilters.includes(filterId);
                return (
                  <button
                    key={filterId}
                    onClick={() => handleFilterToggle(filter.type, filter.value)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter.label}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Office 365 스타일 데이터 테이블 영역 */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-h-0">
        {/* 선택된 항목 정보 바 */}
        {selectedTemplates.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedTemplates.length}개 항목 선택됨
                </span>
                <button
                  onClick={() => setSelectedTemplates([])}
                  className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                >
                  선택 해제
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg">
                  일괄 편집
                </button>
                <button className="px-3 py-1.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 메인 테이블 컨테이너 */}
        <div className="flex-1 min-h-0">
          <TemplateList
            templates={filteredTemplates}
            viewMode={tableView}
            selectedTemplates={selectedTemplates}
            bulkActionMode={selectedTemplates.length > 0}
            onSelectTemplate={handleSelectTemplate}
            onSelectAll={handleSelectAll}
            onEditTemplate={(template) => {
              // TODO: 템플릿 편집 기능 구현
              notify('템플릿 편집 기능은 개발 중입니다.', 'info');
            }}
            onDeleteTemplate={handleDeleteTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            loading={loading}
            error={error}
            emptyMessage="필터 조건에 맞는 템플릿이 없습니다."
          />
        </div>
      </div>

    </div>
  );
};

export default TemplatePanel;