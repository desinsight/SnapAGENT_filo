/**
 * 즐겨찾기 통계 컴포넌트
 * 
 * @description 즐겨찾기 사용 통계와 인사이트를 표시하는 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';

const BookmarkStats = ({
  stats,
  loading,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  /**
   * 통계 데이터 기본값
   */
  const defaultStats = {
    totalBookmarks: 0,
    personalBookmarks: 0,
    sharedBookmarks: 0,
    quickAccessCount: 0,
    collectionsCount: 0,
    avgPriority: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    mostUsedTags: [],
    recentActivity: [],
    priorityDistribution: {
      high: 0,
      medium: 0,
      low: 0
    },
    categoryDistribution: [],
    bookmarkTrends: []
  };

  const currentStats = stats || defaultStats;

  /**
   * 우선순위 색상 가져오기
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  /**
   * 성장률 표시 컴포넌트
   */
  const GrowthIndicator = ({ value, label }) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
        value > 0 ? 'text-green-700 bg-green-100 dark:bg-green-900/20' :
        value < 0 ? 'text-red-700 bg-red-100 dark:bg-red-900/20' :
        'text-gray-700 bg-gray-100 dark:bg-gray-900/20'
      }`}>
        {value > 0 && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        )}
        {value < 0 && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        )}
        <span>{Math.abs(value)}%</span>
      </div>
    </div>
  );

  /**
   * 개요 탭 렌더링
   */
  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* 주요 메트릭 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">전체 즐겨찾기</h4>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {currentStats.totalBookmarks}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100">빠른 액세스</h4>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {currentStats.quickAccessCount}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">컬렉션</h4>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {currentStats.collectionsCount}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">평균 우선순위</h4>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {currentStats.avgPriority.toFixed(1)}
          </p>
        </div>
      </div>

      {/* 성장률 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">성장률</h4>
        <div className="space-y-2">
          <GrowthIndicator value={currentStats.weeklyGrowth} label="주간" />
          <GrowthIndicator value={currentStats.monthlyGrowth} label="월간" />
        </div>
      </div>

      {/* 노트 타입 분포 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">노트 타입 분포</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">개인노트</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ 
                    width: `${currentStats.totalBookmarks > 0 ? (currentStats.personalBookmarks / currentStats.totalBookmarks) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentStats.personalBookmarks}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">공유노트</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ 
                    width: `${currentStats.totalBookmarks > 0 ? (currentStats.sharedBookmarks / currentStats.totalBookmarks) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentStats.sharedBookmarks}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 트렌드 탭 렌더링
   */
  const renderTrendsTab = () => (
    <div className="space-y-4">
      {/* 우선순위 분포 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">우선순위 분포</h4>
        <div className="space-y-2">
          {Object.entries(currentStats.priorityDistribution).map(([priority, count]) => (
            <div key={priority} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority).split(' ')[1]}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {priority === 'high' ? '높음' : priority === 'medium' ? '중간' : '낮음'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 인기 태그 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">인기 태그</h4>
        <div className="flex flex-wrap gap-2">
          {currentStats.mostUsedTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            >
              #{tag.name}
              <span className="ml-1 text-blue-500 dark:text-blue-400">
                {tag.count}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">최근 활동</h4>
        <div className="space-y-2">
          {currentStats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {activity.action}
              </span>
              <span className="text-gray-500 dark:text-gray-500 text-xs">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">통계</h3>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
          title="새로고침"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          개요
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'trends'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          트렌드
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' ? renderOverviewTab() : renderTrendsTab()}
      </div>
    </div>
  );
};

export default BookmarkStats;