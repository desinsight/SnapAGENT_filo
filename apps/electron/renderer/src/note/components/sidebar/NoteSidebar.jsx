/**
 * 노트 서비스 전용 사이드바 컴포넌트
 * 
 * @description 노트 필터링, 폴더, 태그, 통계 등을 표시하는 사이드바
 */

import React, { useState, useMemo } from 'react';

// 폴더 색상 시스템
const FOLDER_COLORS = {
  personal: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' },
  work: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20' },
  ideas: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-900/20' },
  study: { bg: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20' },
  projects: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20' },
  archive: { bg: 'from-gray-500 to-gray-600', text: 'text-gray-600', light: 'bg-gray-50 dark:bg-gray-900/20' }
};

const NoteSidebar = ({ 
  notes = [], 
  filters = {}, 
  onFiltersChange,
  activePanel,
  onNotification
}) => {
  const [expandedSections, setExpandedSections] = useState({
    quickStats: true,
    folders: true,
    tags: true,
    recent: true
  });

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 통계 계산
  const stats = useMemo(() => {
    if (!notes || notes.length === 0) {
      return {
        total: 0,
        favorites: 0,
        shared: 0,
        recent: 0,
        byFolder: {},
        topTags: []
      };
    }

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    const byFolder = notes.reduce((acc, note) => {
      const folder = note.folder || note.category || 'personal';
      acc[folder] = (acc[folder] || 0) + 1;
      return acc;
    }, {});

    // 태그 빈도 계산
    const tagCounts = notes.reduce((acc, note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      total: notes.length,
      favorites: notes.filter(n => n.isFavorite).length,
      recent: notes.filter(n => new Date(n.updatedAt).getTime() > dayAgo).length,
      byFolder,
      topTags
    };
  }, [notes]);

  // 최근 노트
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [notes]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFolderClick = (folder) => {
    onFiltersChange?.({ folder });
  };

  const handleTagClick = (tag) => {
    onFiltersChange?.({ tags: [tag] });
  };

  const handleQuickFilter = (filterType) => {
    switch (filterType) {
      case 'all':
        onFiltersChange?.({ folder: null, tags: [], isFavorite: false });
        break;
      case 'favorites':
        onFiltersChange?.({ isFavorite: true });
        break;
      case 'recent':
        onFiltersChange?.({ recent: true });
        break;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      {/* 통계 요약 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => handleQuickFilter('all')}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">전체 노트</p>
          </div>

          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => handleQuickFilter('recent')}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.recent}</span>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">최근 24시간</p>
          </div>

          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => handleQuickFilter('favorites')}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.favorites}</span>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">즐겨찾기</p>
          </div>


        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">

        {/* 폴더 섹션 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toggleSection('folders')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <span>폴더</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${expandedSections.folders ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {expandedSections.folders && (
            <div className="space-y-2">
              {Object.entries(stats.byFolder).map(([folder, count]) => {
                const color = FOLDER_COLORS[folder] || FOLDER_COLORS.personal;
                const isActive = filters.folder === folder;
                
                return (
                  <button
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? `${color.light} ${color.text} border border-current` 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center mr-3`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <span className="flex-1 text-left capitalize">{folder}</span>
                    <span className={`text-xs ${isActive ? 'font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 태그 섹션 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toggleSection('tags')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <span>인기 태그</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${expandedSections.tags ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {expandedSections.tags && (
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map(({ tag, count }) => {
                const isActive = filters.tags?.includes(tag);
                
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 최근 노트 섹션 */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('recent')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <span>최근 노트</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${expandedSections.recent ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {expandedSections.recent && (
            <div className="space-y-2">
              {recentNotes.map((note) => (
                <div
                  key={note._id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                    {note.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {note.summary || note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    {note.isFavorite && (
                      <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl transition-all duration-200">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 폴더 만들기
        </button>
      </div>
    </div>
  );
};

export default NoteSidebar;