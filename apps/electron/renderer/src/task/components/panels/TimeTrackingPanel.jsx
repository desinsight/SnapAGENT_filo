import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

const TimeTrackingPanel = ({ 
  isOpen, 
  onClose,
  task,
  timeEntries = [],
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onAddTimeEntry,
  onUpdateTimeEntry,
  onDeleteTimeEntry,
  onExportTimeLog,
  currentTimer = null,
  isTimerRunning = false
}) => {
  const [activeTab, setActiveTab] = useState('timer'); // timer, entries, reports
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    description: '',
    start_time: '',
    end_time: '',
    duration: 0,
    category: 'work',
    billable: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('week'); // today, week, month, all
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualDuration, setManualDuration] = useState({ hours: 0, minutes: 0 });
  const timerRef = useRef(null);

  // Mock 타이머 상태 (실제로는 props나 hook에서 가져옴)
  const [timer, setTimer] = useState(currentTimer || {
    task_id: task?.id,
    start_time: null,
    elapsed_time: 0,
    is_running: isTimerRunning,
    description: ''
  });

  // Mock 시간 엔트리 데이터
  const [entries] = useState([
    {
      id: 'entry1',
      task_id: task?.id,
      description: 'UI 컴포넌트 개발',
      start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      duration: 7200000, // 2시간
      category: 'development',
      billable: true,
      user: { id: 'user1', name: '개발자', avatar: null },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'entry2',
      task_id: task?.id,
      description: '코드 리뷰 및 테스트',
      start_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      duration: 3600000, // 1시간
      category: 'review',
      billable: true,
      user: { id: 'user1', name: '개발자', avatar: null },
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'entry3',
      task_id: task?.id,
      description: '회의 참석',
      start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      duration: 3600000, // 1시간
      category: 'meeting',
      billable: false,
      user: { id: 'user1', name: '개발자', avatar: null },
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // 시간 카테고리
  const timeCategories = {
    development: { label: '개발', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    design: { label: '디자인', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    meeting: { label: '회의', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    review: { label: '리뷰', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    documentation: { label: '문서화', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    testing: { label: '테스트', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    planning: { label: '기획', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    work: { label: '작업', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' }
  };

  // 시간 포맷팅
  const formatDuration = (milliseconds) => {
    if (!milliseconds) return '0분';
    
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 시간 포맷팅 (HH:MM 형식)
  const formatTime = (milliseconds) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return date.toLocaleDateString();
  };

  // 타이머 시작
  const handleStartTimer = useCallback(async () => {
    try {
      const startTime = new Date().toISOString();
      setTimer({
        ...timer,
        start_time: startTime,
        is_running: true,
        elapsed_time: 0
      });
      await onStartTimer?.(task?.id, startTime);
    } catch (error) {
      console.error('타이머 시작 실패:', error);
    }
  }, [timer, task?.id, onStartTimer]);

  // 타이머 정지
  const handleStopTimer = useCallback(async () => {
    if (!timer.start_time) return;
    
    try {
      const endTime = new Date().toISOString();
      const duration = timer.elapsed_time + (new Date() - new Date(timer.start_time));
      
      setTimer({
        ...timer,
        is_running: false,
        elapsed_time: 0,
        start_time: null
      });
      
      await onStopTimer?.(timer.task_id, endTime, duration);
    } catch (error) {
      console.error('타이머 정지 실패:', error);
    }
  }, [timer, onStopTimer]);

  // 타이머 일시정지
  const handlePauseTimer = useCallback(async () => {
    if (!timer.start_time) return;
    
    try {
      const elapsed = timer.elapsed_time + (new Date() - new Date(timer.start_time));
      setTimer({
        ...timer,
        is_running: false,
        elapsed_time: elapsed,
        start_time: null
      });
      
      await onPauseTimer?.(timer.task_id, elapsed);
    } catch (error) {
      console.error('타이머 일시정지 실패:', error);
    }
  }, [timer, onPauseTimer]);

  // 타이머 재개
  const handleResumeTimer = useCallback(async () => {
    try {
      const startTime = new Date().toISOString();
      setTimer({
        ...timer,
        start_time: startTime,
        is_running: true
      });
      
      await onResumeTimer?.(timer.task_id, startTime);
    } catch (error) {
      console.error('타이머 재개 실패:', error);
    }
  }, [timer, onResumeTimer]);

  // 수동 시간 추가
  const handleAddTimeEntry = useCallback(async () => {
    if (!newEntry.description.trim()) return;
    
    try {
      const duration = (manualDuration.hours * 60 + manualDuration.minutes) * 60 * 1000;
      const entry = {
        ...newEntry,
        task_id: task?.id,
        duration,
        start_time: newEntry.start_time || new Date().toISOString(),
        end_time: newEntry.end_time || new Date(Date.now() + duration).toISOString()
      };
      
      await onAddTimeEntry?.(entry);
      
      setNewEntry({
        description: '',
        start_time: '',
        end_time: '',
        duration: 0,
        category: 'work',
        billable: true
      });
      setManualDuration({ hours: 0, minutes: 0 });
      setShowAddEntryModal(false);
    } catch (error) {
      console.error('시간 엔트리 추가 실패:', error);
    }
  }, [newEntry, manualDuration, task?.id, onAddTimeEntry]);

  // 시간 엔트리 편집
  const handleEditTimeEntry = useCallback(async () => {
    if (!selectedEntry) return;
    
    try {
      await onUpdateTimeEntry?.(selectedEntry.id, selectedEntry);
      setShowEditEntryModal(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('시간 엔트리 수정 실패:', error);
    }
  }, [selectedEntry, onUpdateTimeEntry]);

  // 시간 엔트리 삭제
  const handleDeleteTimeEntry = useCallback(async (entryId) => {
    if (window.confirm('이 시간 기록을 삭제하시겠습니까?')) {
      try {
        await onDeleteTimeEntry?.(entryId);
      } catch (error) {
        console.error('시간 엔트리 삭제 실패:', error);
      }
    }
  }, [onDeleteTimeEntry]);

  // 현재 타이머 시간 계산
  const getCurrentTimerTime = useCallback(() => {
    if (!timer.is_running || !timer.start_time) {
      return timer.elapsed_time || 0;
    }
    return timer.elapsed_time + (new Date() - new Date(timer.start_time));
  }, [timer]);

  // 타이머 업데이트
  useEffect(() => {
    if (timer.is_running) {
      timerRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer.is_running]);

  // 시간 통계 계산
  const calculateStats = useCallback(() => {
    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableTime = entries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration, 0);
    const todayEntries = entries.filter(e => {
      const entryDate = new Date(e.start_time).toDateString();
      const today = new Date().toDateString();
      return entryDate === today;
    });
    const todayTime = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    
    return {
      totalTime,
      billableTime,
      todayTime,
      averageDaily: entries.length > 0 ? totalTime / Math.max(1, Math.ceil((new Date() - new Date(entries[entries.length - 1].start_time)) / (1000 * 60 * 60 * 24))) : 0
    };
  }, [entries]);

  const stats = calculateStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">시간 추적</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {task?.title} - 총 {formatDuration(stats.totalTime)} 기록됨
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportTimeLog?.()}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="text-sm">내보내기</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'timer', label: '타이머', icon: PlayIcon },
              { id: 'entries', label: `기록 (${entries.length})`, icon: DocumentTextIcon },
              { id: 'reports', label: '리포트', icon: ChartBarIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 h-[calc(90vh-200px)] overflow-hidden flex flex-col">
          {activeTab === 'timer' && (
            <div className="flex-1 p-6">
              {/* 현재 타이머 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-4">
                    {formatTime(getCurrentTimerTime())}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    {!timer.is_running ? (
                      timer.elapsed_time > 0 ? (
                        <>
                          <button
                            onClick={handleResumeTimer}
                            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            <PlayIcon className="w-5 h-5" />
                            <span>계속</span>
                          </button>
                          <button
                            onClick={handleStopTimer}
                            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <StopIcon className="w-5 h-5" />
                            <span>완료</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleStartTimer}
                          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <PlayIcon className="w-5 h-5" />
                          <span>시작</span>
                        </button>
                      )
                    ) : (
                      <>
                        <button
                          onClick={handlePauseTimer}
                          className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                          <PauseIcon className="w-5 h-5" />
                          <span>일시정지</span>
                        </button>
                        <button
                          onClick={handleStopTimer}
                          className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <StopIcon className="w-5 h-5" />
                          <span>완료</span>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {timer.is_running && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>기록 중...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 수동 시간 추가 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">수동 시간 추가</h3>
                  <button
                    onClick={() => setShowAddEntryModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>시간 추가</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stats.todayTime)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">오늘</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stats.totalTime)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">총 시간</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stats.billableTime)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">청구 가능</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDuration(stats.averageDaily)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">일평균</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entries' && (
            <>
              {/* 필터 및 검색 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="기록 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="all">전체</option>
                  </select>
                  
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">모든 카테고리</option>
                    {Object.entries(timeCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowAddEntryModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>시간 추가</span>
                </button>
              </div>

              {/* 시간 기록 목록 */}
              <div className="flex-1 overflow-y-auto">
                {entries.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {entries.map((entry) => (
                      <div key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <ClockIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {entry.description}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${timeCategories[entry.category]?.color || timeCategories.work.color}`}>
                                  {timeCategories[entry.category]?.label || '작업'}
                                </span>
                                {entry.billable && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    청구 가능
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>{formatDate(entry.start_time)}</span>
                                <span>{new Date(entry.start_time).toLocaleTimeString()} - {new Date(entry.end_time).toLocaleTimeString()}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatDuration(entry.duration)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowEditEntryModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="편집"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTimeEntry(entry.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">시간 기록이 없습니다.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">타이머를 시작하거나 수동으로 시간을 추가하세요.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'reports' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 카테고리별 시간 분포 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">카테고리별 시간</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      entries.reduce((acc, entry) => {
                        acc[entry.category] = (acc[entry.category] || 0) + entry.duration;
                        return acc;
                      }, {})
                    ).map(([category, duration]) => {
                      const percentage = stats.totalTime > 0 ? (duration / stats.totalTime) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${timeCategories[category]?.color || timeCategories.work.color}`}>
                              {timeCategories[category]?.label || category}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDuration(duration)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 청구 가능 vs 불가능 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">청구 분석</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">청구 가능</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatDuration(stats.billableTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">청구 불가능</span>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        {formatDuration(stats.totalTime - stats.billableTime)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">청구율</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stats.totalTime > 0 ? ((stats.billableTime / stats.totalTime) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시간 요약 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">시간 요약</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {entries.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">총 기록</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {formatDuration(stats.totalTime).split(' ')[0]}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">총 시간</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {entries.length > 0 ? formatDuration(stats.totalTime / entries.length).split(' ')[0] : '0'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">평균 시간</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {stats.totalTime > 0 ? ((stats.billableTime / stats.totalTime) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">청구율</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 시간 추가 모달 */}
        {showAddEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">시간 기록 추가</h3>
                  <button
                    onClick={() => setShowAddEntryModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      작업 설명
                    </label>
                    <input
                      type="text"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="무엇을 작업했나요?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        시간
                      </label>
                      <input
                        type="number"
                        value={manualDuration.hours}
                        onChange={(e) => setManualDuration({ ...manualDuration, hours: parseInt(e.target.value) || 0 })}
                        placeholder="시간"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        분
                      </label>
                      <input
                        type="number"
                        value={manualDuration.minutes}
                        onChange={(e) => setManualDuration({ ...manualDuration, minutes: parseInt(e.target.value) || 0 })}
                        placeholder="분"
                        min="0"
                        max="59"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      카테고리
                    </label>
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {Object.entries(timeCategories).map(([key, category]) => (
                        <option key={key} value={key}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="billable"
                      checked={newEntry.billable}
                      onChange={(e) => setNewEntry({ ...newEntry, billable: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="billable" className="text-sm text-gray-700 dark:text-gray-300">
                      청구 가능한 시간
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={handleAddTimeEntry}
                    disabled={!newEntry.description.trim() || (manualDuration.hours === 0 && manualDuration.minutes === 0)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                  >
                    시간 추가
                  </button>
                  <button
                    onClick={() => setShowAddEntryModal(false)}
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

export default TimeTrackingPanel;