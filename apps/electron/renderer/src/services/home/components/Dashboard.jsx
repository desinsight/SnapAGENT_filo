import React from 'react';
import { motion } from 'framer-motion';
import ServiceCard from './cards/ServiceCard';
import PerformanceCard from './cards/PerformanceCard';
import ScheduleCard from './cards/ScheduleCard';
import { useSystemStats } from '../hooks/useSystemStats';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { servicesData, schedulesData, notificationsData, storageData } from '../data/mockData';

const Dashboard = () => {
  const { systemStats, performanceData } = useSystemStats();
  const currentTime = useCurrentTime();

  const handleServiceClick = (service) => {
    console.log('Service clicked:', service.title);
    if (service.action) {
      service.action();
    }
  };

  const recentFiles = [
    { name: 'Q4_Financial_Report.pdf', time: '2 hours ago', size: '2.4 MB', type: 'pdf' },
    { name: 'Board_Meeting_Minutes.docx', time: '5 hours ago', size: '156 KB', type: 'doc' },
    { name: 'Revenue_Analysis_2024.xlsx', time: '1 day ago', size: '3.8 MB', type: 'excel' },
    { name: 'Product_Roadmap.pptx', time: '2 days ago', size: '5.2 MB', type: 'ppt' },
  ];

  const getFileIcon = (type) => {
    const iconClass = "w-4 h-4";
    const icons = {
      pdf: <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
      </svg>,
      doc: <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
      </svg>,
      excel: <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
      </svg>,
      ppt: <svg className={`${iconClass} text-orange-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
      </svg>,
      default: <svg className={`${iconClass} text-gray-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
      </svg>
    };
    return icons[type] || icons.default;
  };

  return (
    <div className="w-full">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                좋은 {currentTime.getHours() < 12 ? '아침' : currentTime.getHours() < 18 ? '오후' : '저녁'}입니다!
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                오늘도 효율적인 업무를 위해 AI가 도와드리겠습니다.
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono text-gray-900 dark:text-white">
                {currentTime.toLocaleTimeString('ko-KR')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Service Cards Slider */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">서비스 개요</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1">
              <span>전체 보기</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 pb-4" style={{ width: 'max-content' }}>
              {servicesData.map((service, index) => (
                <ServiceCard
                  key={index}
                  service={service}
                  index={index}
                  onClick={handleServiceClick}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* System Performance */}
          <div className="lg:col-span-1">
            <PerformanceCard 
              systemStats={systemStats} 
              performanceData={performanceData} 
            />
          </div>

          {/* Storage Overview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  저장소 사용량
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">디스크 분석</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">78%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">사용 중</div>
              </div>
            </div>
            
            <div className="space-y-4">
              {storageData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ 
                          width: `${item.value}%`, 
                          backgroundColor: item.color 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {item.value}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Files */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                최근 파일
              </h2>
              <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
                전체 보기
              </button>
            </div>
            
            <div className="space-y-3">
              {recentFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50/60 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{file.time}</span>
                      <span>•</span>
                      <span>{file.size}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Schedule and Notifications */}
        <ScheduleCard schedules={schedulesData} notifications={notificationsData} />

        {/* Additional Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Team Performance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">팀 성과</h3>
            <div className="space-y-3">
              {[
                { team: '개발팀', score: 92, color: 'blue' },
                { team: '디자인팀', score: 88, color: 'purple' },
                { team: '마케팅팀', score: 85, color: 'green' },
                { team: '영업팀', score: 90, color: 'orange' },
              ].map((team, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{team.team}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`bg-${team.color}-500 h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${team.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-8">{team.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">주요 지표</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '활성 사용자', value: '1,234', change: '+12%', color: 'text-green-600' },
                { label: '완료된 작업', value: '856', change: '+8%', color: 'text-blue-600' },
                { label: '새 프로젝트', value: '23', change: '+15%', color: 'text-purple-600' },
                { label: '수익', value: '₩45M', change: '+22%', color: 'text-orange-600' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                  <div className={`text-xs font-medium ${stat.color}`}>{stat.change}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">다가오는 이벤트</h3>
            <div className="space-y-3">
              {[
                { event: '분기별 리뷰', date: '내일', time: '14:00' },
                { event: '팀 워크샵', date: '2일 후', time: '09:00' },
                { event: '클라이언트 프레젠테이션', date: '3일 후', time: '15:30' },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50/60 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{event.event}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{event.date} • {event.time}</div>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Project Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">프로젝트 현황</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'AI 챗봇 개발', progress: 78, status: '진행중', team: '개발팀' },
              { name: '웹사이트 리뉴얼', progress: 45, status: '기획중', team: '디자인팀' },
              { name: '마케팅 캠페인', progress: 92, status: '마무리', team: '마케팅팀' },
              { name: '데이터 분석 시스템', progress: 23, status: '시작', team: '데이터팀' },
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="p-4 bg-gray-50/60 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/60 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{project.name}</h4>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{project.team}</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === '진행중' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                  project.status === '기획중' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                  project.status === '마무리' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>{project.status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Footer spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Dashboard;