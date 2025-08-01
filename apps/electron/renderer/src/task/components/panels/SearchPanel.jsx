import React, { useState, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  FolderIcon,
  CalendarIcon,
  FlagIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 고급 검색 패널
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 복합 조건 검색 (제목, 설명, 태그, 담당자 등)
 * - 날짜 범위 검색 (생성일, 마감일, 수정일)
 * - 상태 및 우선순위 필터
 * - 저장된 검색 쿼리 관리
 * - 검색 히스토리
 * - 실시간 검색 결과 미리보기
 * - 고급 연산자 지원 (AND, OR, NOT)
 */
const SearchPanel = ({ 
  isOpen, 
  onClose, 
  onSearch,
  savedSearches = [],
  onSaveSearch,
  onDeleteSearch,
  searchHistory = [],
  availableUsers = [],
  availableTags = [],
  availableProjects = []
}) => {
  // 검색 조건 상태
  const [searchQuery, setSearchQuery] = useState({
    text: '',
    title: '',
    description: '',
    tags: [],
    assignee: '',
    project: '',
    status: [],
    priority: [],
    dateRange: {
      type: 'created', // created, due, updated
      start: '',
      end: ''
    },
    advanced: {
      includeArchived: false,
      includeCompleted: true,
      caseSensitive: false,
      exactMatch: false
    }
  });

  // UI 상태
  const [activeTab, setActiveTab] = useState('basic'); // basic, advanced, saved, history
  const [expandedSections, setExpandedSections] = useState({
    date: false,
    advanced: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // 상태 옵션
  const statusOptions = Object.entries(TASK_CONFIG.TASK_STATUS).map(([key, value]) => ({
    value,
    label: {
      [TASK_CONFIG.TASK_STATUS.PENDING]: '대기중',
      [TASK_CONFIG.TASK_STATUS.IN_PROGRESS]: '진행중',
      [TASK_CONFIG.TASK_STATUS.REVIEW]: '검토중',
      [TASK_CONFIG.TASK_STATUS.COMPLETED]: '완료',
      [TASK_CONFIG.TASK_STATUS.CANCELLED]: '취소',
      [TASK_CONFIG.TASK_STATUS.OVERDUE]: '연체'
    }[value]
  }));

  // 우선순위 옵션
  const priorityOptions = Object.entries(TASK_CONFIG.PRIORITY_LEVELS).map(([key, value]) => ({
    value,
    label: {
      [TASK_CONFIG.PRIORITY_LEVELS.URGENT]: '긴급',
      [TASK_CONFIG.PRIORITY_LEVELS.HIGH]: '높음',
      [TASK_CONFIG.PRIORITY_LEVELS.MEDIUM]: '보통',
      [TASK_CONFIG.PRIORITY_LEVELS.LOW]: '낮음'
    }[value]
  }));

  // 검색 조건 업데이트
  const updateSearchQuery = useCallback((path, value) => {
    setSearchQuery(prev => {
      const newQuery = { ...prev };
      const keys = path.split('.');
      let current = newQuery;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newQuery;
    });
  }, []);

  // 배열 필드 토글
  const toggleArrayField = useCallback((field, value) => {
    setSearchQuery(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  }, []);

  // 섹션 확장/축소
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // 검색 실행
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await onSearch?.(searchQuery);
      setSearchResults(results || []);
    } catch (error) {
      console.error('검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onSearch]);

  // 검색 저장
  const handleSaveSearch = useCallback(async () => {
    if (!saveSearchName.trim()) return;
    
    try {
      await onSaveSearch?.({
        name: saveSearchName,
        query: searchQuery,
        createdAt: new Date().toISOString()
      });
      setSaveSearchName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('검색 저장 실패:', error);
    }
  }, [saveSearchName, searchQuery, onSaveSearch]);

  // 저장된 검색 로드
  const loadSavedSearch = useCallback((savedSearch) => {
    setSearchQuery(savedSearch.query);
    setActiveTab('basic');
  }, []);

  // 검색 조건 초기화
  const resetSearch = useCallback(() => {
    setSearchQuery({
      text: '',
      title: '',
      description: '',
      tags: [],
      assignee: '',
      project: '',
      status: [],
      priority: [],
      dateRange: {
        type: 'created',
        start: '',
        end: ''
      },
      advanced: {
        includeArchived: false,
        includeCompleted: true,
        caseSensitive: false,
        exactMatch: false
      }
    });
    setSearchResults([]);
  }, []);

  // 검색 조건 유효성 검사
  const isSearchValid = useCallback(() => {
    return !!(
      searchQuery.text.trim() ||
      searchQuery.title.trim() ||
      searchQuery.description.trim() ||
      searchQuery.tags.length ||
      searchQuery.assignee ||
      searchQuery.project ||
      searchQuery.status.length ||
      searchQuery.priority.length ||
      searchQuery.dateRange.start ||
      searchQuery.dateRange.end
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                고급 검색
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                세부 조건으로 태스크를 검색하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* 사이드바 */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              <div className="space-y-1">
                {[
                  { id: 'basic', label: '기본 검색', icon: MagnifyingGlassIcon },
                  { id: 'advanced', label: '고급 검색', icon: AdjustmentsHorizontalIcon },
                  { id: 'saved', label: '저장된 검색', icon: BookmarkIcon },
                  { id: 'history', label: '검색 기록', icon: ClockIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {/* 기본 검색 탭 */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* 텍스트 검색 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      전체 텍스트 검색
                    </label>
                    <input
                      type="text"
                      value={searchQuery.text}
                      onChange={(e) => updateSearchQuery('text', e.target.value)}
                      placeholder="제목, 설명, 댓글에서 검색..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 필터 조건 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 담당자 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        담당자
                      </label>
                      <select
                        value={searchQuery.assignee}
                        onChange={(e) => updateSearchQuery('assignee', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">모든 담당자</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 프로젝트 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        프로젝트
                      </label>
                      <select
                        value={searchQuery.project}
                        onChange={(e) => updateSearchQuery('project', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">모든 프로젝트</option>
                        {availableProjects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 상태 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      상태
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map(status => (
                        <button
                          key={status.value}
                          onClick={() => toggleArrayField('status', status.value)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            searchQuery.status.includes(status.value)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 우선순위 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      우선순위
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map(priority => (
                        <button
                          key={priority.value}
                          onClick={() => toggleArrayField('priority', priority.value)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            searchQuery.priority.includes(priority.value)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 태그 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      태그
                    </label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {availableTags.map(tag => (
                          <label key={tag.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={searchQuery.tags.includes(tag.id)}
                              onChange={() => toggleArrayField('tags', tag.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 고급 검색 탭 */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  {/* 개별 필드 검색 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        제목에서 검색
                      </label>
                      <input
                        type="text"
                        value={searchQuery.title}
                        onChange={(e) => updateSearchQuery('title', e.target.value)}
                        placeholder="제목 키워드..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        설명에서 검색
                      </label>
                      <input
                        type="text"
                        value={searchQuery.description}
                        onChange={(e) => updateSearchQuery('description', e.target.value)}
                        placeholder="설명 키워드..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 날짜 범위 검색 */}
                  <div>
                    <button
                      onClick={() => toggleSection('date')}
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                    >
                      {expandedSections.date ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      <span>날짜 범위 검색</span>
                    </button>

                    {expandedSections.date && (
                      <div className="pl-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            날짜 유형
                          </label>
                          <select
                            value={searchQuery.dateRange.type}
                            onChange={(e) => updateSearchQuery('dateRange.type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="created">생성일</option>
                            <option value="due">마감일</option>
                            <option value="updated">수정일</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              시작 날짜
                            </label>
                            <input
                              type="datetime-local"
                              value={searchQuery.dateRange.start}
                              onChange={(e) => updateSearchQuery('dateRange.start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              종료 날짜
                            </label>
                            <input
                              type="datetime-local"
                              value={searchQuery.dateRange.end}
                              onChange={(e) => updateSearchQuery('dateRange.end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 고급 옵션 */}
                  <div>
                    <button
                      onClick={() => toggleSection('advanced')}
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                    >
                      {expandedSections.advanced ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      <span>고급 옵션</span>
                    </button>

                    {expandedSections.advanced && (
                      <div className="pl-6 space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={searchQuery.advanced.includeArchived}
                            onChange={(e) => updateSearchQuery('advanced.includeArchived', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">아카이브된 태스크 포함</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={searchQuery.advanced.includeCompleted}
                            onChange={(e) => updateSearchQuery('advanced.includeCompleted', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">완료된 태스크 포함</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={searchQuery.advanced.caseSensitive}
                            onChange={(e) => updateSearchQuery('advanced.caseSensitive', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">대소문자 구분</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={searchQuery.advanced.exactMatch}
                            onChange={(e) => updateSearchQuery('advanced.exactMatch', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">정확히 일치</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 저장된 검색 탭 */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  {savedSearches.length > 0 ? (
                    savedSearches.map((saved, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{saved.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(saved.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => loadSavedSearch(saved)}
                              className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm transition-colors"
                            >
                              불러오기
                            </button>
                            <button
                              onClick={() => onDeleteSearch?.(index)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookmarkIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">저장된 검색이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 검색 기록 탭 */}
              {activeTab === 'history' && (
                <div className="space-y-2">
                  {searchHistory.length > 0 ? (
                    searchHistory.map((history, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(history.query)}
                        className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <p className="text-sm text-gray-900 dark:text-white">{history.text || '고급 검색'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(history.searchedAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">검색 기록이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetSearch}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    초기화
                  </button>
                  {isSearchValid() && (
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <BookmarkIcon className="w-4 h-4" />
                      <span>검색 저장</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={!isSearchValid() || isSearching}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>검색 중...</span>
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        <span>검색</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 저장 다이얼로그 */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  검색 저장
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    검색 이름
                  </label>
                  <input
                    type="text"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder="저장할 검색의 이름을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveSearch}
                    disabled={!saveSearchName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveSearchName('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;