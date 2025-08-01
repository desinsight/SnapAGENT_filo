import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RecentActivity = () => {
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('today');

  const activities = [
    {
      id: 1,
      type: 'file',
      action: 'created',
      target: 'Q4_재무보고서.pdf',
      user: '김철수',
      time: '10:24',
      date: '오늘',
      size: '2.4 MB',
      department: '재무팀',
      details: '새 보고서 파일을 생성했습니다',
    },
    {
      id: 2,
      type: 'chat',
      action: 'conversation',
      target: 'AI 비서와 대화',
      user: '이영희',
      time: '09:45',
      date: '오늘',
      messages: 42,
      department: '마케팅팀',
      details: '마케팅 전략에 대해 AI와 상담했습니다',
    },
    {
      id: 3,
      type: 'calendar',
      action: 'scheduled',
      target: '경영진 전략 회의',
      user: '박민수',
      time: '09:15',
      date: '오늘',
      attendees: 8,
      department: '경영지원팀',
      details: '주간 경영진 회의 일정을 등록했습니다',
    },
    {
      id: 4,
      type: 'file',
      action: 'modified',
      target: '2024_예산계획.xlsx',
      user: '정미경',
      time: '08:30',
      date: '오늘',
      size: '5.8 MB',
      department: '기획팀',
      details: '예산 계획 문서를 수정했습니다',
    },
    {
      id: 5,
      type: 'task',
      action: 'completed',
      target: '신제품 출시 계획 검토',
      user: '최준호',
      time: '17:45',
      date: '어제',
      priority: 'high',
      department: '제품팀',
      details: '중요 작업을 완료했습니다',
    },
    {
      id: 6,
      type: 'file',
      action: 'shared',
      target: '디자인_가이드라인_v3.fig',
      user: '송지원',
      time: '16:20',
      date: '어제',
      sharedWith: 12,
      department: '디자인팀',
      details: '팀원들과 파일을 공유했습니다',
    },
    {
      id: 7,
      type: 'messenger',
      action: 'announcement',
      target: '전사 공지사항',
      user: '관리자',
      time: '15:00',
      date: '어제',
      recipients: 156,
      department: '인사팀',
      details: '신규 정책 안내 메시지를 발송했습니다',
    },
    {
      id: 8,
      type: 'security',
      action: 'permission',
      target: '기밀 문서 접근 권한',
      user: '보안팀',
      time: '14:30',
      date: '어제',
      level: 'high',
      department: '보안팀',
      details: '새로운 접근 권한을 설정했습니다',
    },
  ];

  const filterOptions = [
    { value: 'all', label: '전체', count: activities.length },
    { value: 'file', label: '파일', count: activities.filter(a => a.type === 'file').length },
    { value: 'chat', label: 'AI 대화', count: activities.filter(a => a.type === 'chat').length },
    { value: 'calendar', label: '일정', count: activities.filter(a => a.type === 'calendar').length },
    { value: 'task', label: '작업', count: activities.filter(a => a.type === 'task').length },
    { value: 'security', label: '보안', count: activities.filter(a => a.type === 'security').length },
  ];

  const timeRangeOptions = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
  ];

  const activityData = [
    { time: '06:00', count: 2 },
    { time: '08:00', count: 8 },
    { time: '10:00', count: 15 },
    { time: '12:00', count: 12 },
    { time: '14:00', count: 18 },
    { time: '16:00', count: 22 },
    { time: '18:00', count: 14 },
    { time: '20:00', count: 6 },
  ];

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  const getActionIcon = (type) => {
    const icons = {
      file: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      chat: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      task: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      messenger: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      security: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    };
    return icons[type] || icons.file;
  };

  const getActionColor = (type) => {
    const colors = {
      file: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      chat: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
      calendar: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      task: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
      messenger: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',
      security: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    };
    return colors[type] || colors.file;
  };

  const departmentStats = [
    { name: '재무팀', activities: 24, percentage: 18 },
    { name: '마케팅팀', activities: 32, percentage: 24 },
    { name: '개발팀', activities: 45, percentage: 34 },
    { name: '인사팀', activities: 15, percentage: 11 },
    { name: '기획팀', activities: 18, percentage: 13 },
  ];

  return (
    <div className="w-full">
      <div className="p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            활동 기록
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            조직 전체의 실시간 활동을 모니터링하세요
          </p>
        </motion.div>

        {/* Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                활동 추이
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">실시간 모니터링</p>
            </div>
            <div className="flex items-center space-x-1 bg-gray-100/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-1">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timeRange === option.value
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
            <div className="relative h-full">
              <div className="flex items-end justify-center space-x-3 h-full">
                {activityData.map((point, index) => (
                  <div key={index} className="flex flex-col items-center group">
                    <div className="relative mb-2">
                      <div 
                        className="w-4 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500 hover:from-purple-500 hover:to-blue-500 group-hover:scale-110"
                        style={{ height: `${Math.max(point.count * 3, 8)}px` }}
                      ></div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded">
                          {point.count}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {point.time.substring(0, 2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 right-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>데이터 수집 중</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 w-fit"
        >
          {filterOptions.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.02, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                filter === option.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {option.label}
              <span className={`ml-2 text-xs ${
                filter === option.value ? 'text-gray-300' : 'text-gray-400'
              }`}>
                {option.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Activity List */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  최근 활동
                </h2>
              </div>
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="p-4 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getActionColor(activity.type)}`}>
                        {getActionIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.target}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.date} {activity.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.details}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="flex items-center text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {activity.user}
                          </span>
                          <span className="flex items-center text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {activity.department}
                          </span>
                          {activity.size && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {activity.size}
                            </span>
                          )}
                          {activity.priority && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full">
                              중요
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Department Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                부서별 활동
              </h2>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {dept.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {dept.activities}건
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700 group-hover:from-purple-500 group-hover:to-blue-500"
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Activity Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                활동 요약
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:scale-105 transition-transform duration-200">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    156
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    오늘 활동
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:scale-105 transition-transform duration-200">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    89%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    활동 증가율
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:scale-105 transition-transform duration-200">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    42
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    AI 상담
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:scale-105 transition-transform duration-200">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    28
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    완료 작업
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Users */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                활발한 사용자
              </h2>
              <div className="space-y-3">
                {['김철수', '이영희', '박민수', '정미경', '최준호'].map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white group-hover:scale-110 transition-transform duration-200 ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {user}
                      </span>
                      {index < 3 && (
                        <div className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                          TOP {index + 1}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {15 - index * 2}건
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Additional Analytics */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">상세 분석</h2>
          
          {/* Weekly Activity Trend */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">주간 활동 추이</h3>
            <div className="grid grid-cols-7 gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</div>
                  <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-end p-1">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded transition-all duration-500 hover:from-purple-500 hover:to-blue-500"
                      style={{ height: `${Math.random() * 70 + 10}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{Math.floor(Math.random() * 50 + 10)}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Service Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">서비스 사용률</h3>
              <div className="space-y-3">
                {[
                  { service: '파일 관리', usage: 78, color: 'from-blue-400 to-blue-600' },
                  { service: 'AI 어시스턴트', usage: 65, color: 'from-purple-400 to-purple-600' },
                  { service: '일정 관리', usage: 45, color: 'from-green-400 to-green-600' },
                  { service: '작업 관리', usage: 38, color: 'from-orange-400 to-orange-600' },
                ].map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.service}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-700 group-hover:animate-pulse`}
                        style={{ width: `${item.usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">시간대별 활동</h3>
              <div className="space-y-3">
                {[
                  { time: '09:00 - 12:00', activity: '고강도', count: 45 },
                  { time: '12:00 - 14:00', activity: '중간', count: 28 },
                  { time: '14:00 - 18:00', activity: '고강도', count: 52 },
                  { time: '18:00 - 20:00', activity: '낮음', count: 15 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.time}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.activity} 활동</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{item.count}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">이벤트</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Projects */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 프로젝트</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: '신제품 개발', progress: 78, team: '개발팀', status: '진행중' },
                { name: '마케팅 캐페인', progress: 45, team: '마케팅팀', status: '기획중' },
                { name: 'UI/UX 리뉴얼', progress: 92, team: '디자인팀', status: '마무리' },
              ].map((project, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === '진행중' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                      project.status === '기획중' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                    }`}>{project.status}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{project.team}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Footer spacer for better scrolling */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default RecentActivity;