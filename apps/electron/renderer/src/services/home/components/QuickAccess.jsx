import React, { useState } from 'react';
import { motion } from 'framer-motion';

const QuickAccess = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: '전체', count: 48 },
    { id: 'recent', name: '최근 사용', count: 12 },
    { id: 'favorites', name: '즐겨찾기', count: 8 },
    { id: 'shared', name: '공유함', count: 15 },
    { id: 'downloads', name: '다운로드', count: 13 },
  ];

  const quickAccessItems = [
    {
      id: 1,
      name: '프로젝트 기획서',
      path: 'D:/Documents/Projects/2024',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '10분 전',
      size: '245 MB',
      items: 28,
      favorite: true,
      color: 'blue',
    },
    {
      id: 2,
      name: '회계 보고서',
      path: 'D:/Documents/Finance',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '1시간 전',
      size: '1.2 GB',
      items: 156,
      favorite: true,
      color: 'green',
    },
    {
      id: 3,
      name: '디자인 자료',
      path: 'D:/Creative/Designs',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '3시간 전',
      size: '3.8 GB',
      items: 89,
      favorite: false,
      color: 'purple',
    },
    {
      id: 4,
      name: '개발 문서',
      path: 'D:/Development/Docs',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '5시간 전',
      size: '567 MB',
      items: 234,
      favorite: true,
      color: 'orange',
    },
    {
      id: 5,
      name: '마케팅 자료',
      path: 'D:/Marketing/Campaigns',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '1일 전',
      size: '892 MB',
      items: 67,
      favorite: false,
      color: 'pink',
    },
    {
      id: 6,
      name: '인사 관리',
      path: 'D:/HR/Employee',
      type: 'folder',
      icon: 'folder',
      lastAccessed: '2일 전',
      size: '456 MB',
      items: 123,
      favorite: false,
      color: 'indigo',
    },
  ];

  const pinnedApps = [
    {
      id: 1,
      name: 'Microsoft Excel',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#107C41"/>
          <path d="M8 8h8M8 12h8M8 16h8" stroke="white" strokeWidth="1.5"/>
        </svg>
      ),
      action: () => console.log('Open Excel'),
    },
    {
      id: 2,
      name: 'VS Code',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#007ACC"/>
          <path d="M9 7l6 5-6 5" stroke="white" strokeWidth="1.5"/>
        </svg>
      ),
      action: () => console.log('Open VS Code'),
    },
    {
      id: 3,
      name: 'Chrome',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" fill="#4285F4"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      ),
      action: () => console.log('Open Chrome'),
    },
    {
      id: 4,
      name: 'Slack',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#4A154B"/>
          <path d="M8 10h2M14 10h2M8 14h2M14 14h2" stroke="white" strokeWidth="1.5"/>
        </svg>
      ),
      action: () => console.log('Open Slack'),
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colors[color] || 'bg-gray-500';
  };

  const filteredItems = selectedCategory === 'all' 
    ? quickAccessItems 
    : selectedCategory === 'favorites' 
    ? quickAccessItems.filter(item => item.favorite)
    : quickAccessItems;

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
            빠른 액세스
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            자주 사용하는 파일과 폴더에 빠르게 접근하세요
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="flex items-center space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 w-fit"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.02, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {category.name}
              <span className={`ml-2 text-xs ${
                selectedCategory === category.id ? 'text-gray-300' : 'text-gray-400'
              }`}>
                {category.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Access Folders */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${getColorClasses(item.color)} bg-opacity-10`}>
                        <svg className={`w-6 h-6 ${getColorClasses(item.color).replace('bg-', 'text-')}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.path}
                        </p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className={`w-5 h-5 ${item.favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">파일</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.items}개</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">크기</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">최근</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.lastAccessed}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pinned Applications */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                고정된 앱
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {pinnedApps.map((app, index) => (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={app.action}
                    className="flex flex-col items-center p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                  >
                    <div className="mb-2 group-hover:scale-110 transition-transform duration-300">
                      {app.icon}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {app.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 mt-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                빠른 작업
              </h2>
              <div className="space-y-2">
                <motion.button 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ x: 5 }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
                >
                  <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">새 폴더 만들기</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">빠른 폴더 생성</p>
                  </div>
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ x: 5 }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
                >
                  <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">파일 업로드</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">클라우드에 업로드</p>
                  </div>
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ x: 5 }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
                >
                  <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">백업 실행</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">중요 파일 백업</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* More Content for Scroll Testing */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">추가 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: '마케팅 자료', color: 'pink', desc: '주간 마켄팅 보고서와 자료' },
              { name: 'HR 관리', color: 'indigo', desc: '인사 관리 및 직원 정보' },
              { name: '개발 도구', color: 'green', desc: '친됨 친됨 미규 보안자국이에반서' },
              { name: '비용 관리', color: 'blue', desc: '예산 및 뚻칸최대 마훐병과의상신' },
              { name: '프로젝트 A', color: 'purple', desc: '오버라우형 (매화수는 아줄글)' },
              { name: '클라이언트 DB', color: 'orange', desc: '고객 데이터베이스 및 연락처' },
            ].map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg bg-${item.color}-500 bg-opacity-10`}>
                      <svg className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">파일</p>
                    <p className="font-medium text-gray-900 dark:text-white">{Math.floor(Math.random() * 200) + 50}개</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">크기</p>
                    <p className="font-medium text-gray-900 dark:text-white">{Math.floor(Math.random() * 500) + 100} MB</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">최근</p>
                    <p className="font-medium text-gray-900 dark:text-white">{Math.floor(Math.random() * 5) + 1}일 전</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Cloud Storage Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">클라우드 저장소 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Google Drive', used: '45.2 GB', total: '100 GB', percentage: 45, color: 'blue' },
              { name: 'OneDrive', used: '28.7 GB', total: '50 GB', percentage: 57, color: 'green' },
              { name: 'Dropbox', used: '12.3 GB', total: '25 GB', percentage: 49, color: 'purple' },
            ].map((storage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                className="text-center p-4 bg-gray-50/60 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/60 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{storage.name}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {storage.used} / {storage.total}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`bg-${storage.color}-500 h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${storage.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{storage.percentage}% 사용됨</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Collaborations */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 공동 작업</h3>
            <div className="space-y-3">
              {[
                { name: '프로젝트 제안서.docx', collaborators: ['김철수', '이영희'], time: '2시간 전' },
                { name: '마케팅 전략.pptx', collaborators: ['박민수', '정미경', '최준호'], time: '4시간 전' },
                { name: '예산 계획.xlsx', collaborators: ['송지원'], time: '1일 전' },
              ].map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.7 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50/60 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {file.collaborators.join(', ')} • {file.time}
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {file.collaborators.slice(0, 3).map((collaborator, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                      >
                        {collaborator.charAt(0)}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">파일 활동 통계</h3>
            <div className="space-y-4">
              {[
                { label: '오늘 생성된 파일', count: 12, icon: '📄' },
                { label: '공유된 파일', count: 8, icon: '🔗' },
                { label: '다운로드', count: 34, icon: '⬇️' },
                { label: '업로드', count: 18, icon: '⬆️' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50/60 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bookmarks & Shortcuts */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">북마크 & 바로가기</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { name: 'GitHub', url: 'github.com', color: 'gray' },
              { name: 'Gmail', url: 'gmail.com', color: 'red' },
              { name: 'Slack', url: 'slack.com', color: 'purple' },
              { name: 'Notion', url: 'notion.so', color: 'black' },
              { name: 'Figma', url: 'figma.com', color: 'pink' },
              { name: 'Drive', url: 'drive.google.com', color: 'yellow' },
            ].map((bookmark, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50/60 dark:hover:bg-gray-700/50 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 bg-${bookmark.color}-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-white font-bold text-sm">{bookmark.name.charAt(0)}</span>
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 text-center">{bookmark.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{bookmark.url}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* Footer spacer for better scrolling */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default QuickAccess;