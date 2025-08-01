import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  FlagIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const GanttView = ({
  tasks = [],
  onTaskSelect,
  onTaskEdit,
  onTaskCreate,
  loading = false,
  selectedTask,
  currentProject,
  currentOrganization,
  currentTeam
}) => {
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // 시간 범위별 설정
  const timeRangeConfig = {
    week: { days: 7, unit: 'day', format: 'dd' },
    month: { days: 30, unit: 'day', format: 'dd' },
    quarter: { days: 90, unit: 'week', format: 'MMM w주' }
  };

  // 태스크 타입 아이콘
  const getTaskTypeIcon = (type) => {
    const icons = {
      todo: CheckCircleIcon,
      bug: ExclamationTriangleIcon,
      feature: SparklesIcon,
      document: DocumentTextIcon,
      meeting: UsersIcon,
      survey: ClipboardDocumentListIcon,
      review: EyeIcon
    };
    const Icon = icons[type] || CheckCircleIcon;
    return <Icon className="w-4 h-4" />;
  };

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority] || colors.medium;
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-400',
      in_progress: 'bg-blue-500',
      review: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || colors.pending;
  };

  // 시간 범위 생성
  const generateTimeRange = () => {
    const config = timeRangeConfig[timeRange];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - Math.floor(config.days / 2));
    
    const dates = [];
    for (let i = 0; i < config.days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // 태스크 필터링 및 정렬
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => task.due_date || task.start_date)
      .sort((a, b) => {
        // 우선순위별 정렬
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // 시작일/마감일별 정렬
        const aDate = new Date(a.start_date || a.due_date);
        const bDate = new Date(b.start_date || b.due_date);
        return aDate - bDate;
      });
  }, [tasks]);

  // 태스크의 시작일과 종료일 계산
  const getTaskDates = (task) => {
    const startDate = task.start_date ? new Date(task.start_date) : null;
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    
    if (startDate && dueDate) {
      return { start: startDate, end: dueDate };
    } else if (dueDate) {
      // 마감일만 있으면 예상 시간 기준으로 시작일 계산
      const estimatedDays = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 1;
      const calculatedStart = new Date(dueDate);
      calculatedStart.setDate(dueDate.getDate() - estimatedDays);
      return { start: calculatedStart, end: dueDate };
    } else if (startDate) {
      // 시작일만 있으면 예상 시간 기준으로 종료일 계산
      const estimatedDays = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 1;
      const calculatedEnd = new Date(startDate);
      calculatedEnd.setDate(startDate.getDate() + estimatedDays);
      return { start: startDate, end: calculatedEnd };
    }
    
    return null;
  };

  // 태스크 바의 위치와 크기 계산
  const getTaskBarStyle = (task, timelineDates) => {
    const taskDates = getTaskDates(task);
    if (!taskDates) return null;
    
    const startDate = timelineDates[0];
    const endDate = timelineDates[timelineDates.length - 1];
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    
    const taskStart = Math.max(0, (taskDates.start - startDate) / (1000 * 60 * 60 * 24));
    const taskEnd = Math.min(totalDays, (taskDates.end - startDate) / (1000 * 60 * 60 * 24));
    const taskDuration = taskEnd - taskStart;
    
    if (taskDuration <= 0) return null;
    
    return {
      left: `${(taskStart / totalDays) * 100}%`,
      width: `${(taskDuration / totalDays) * 100}%`
    };
  };

  // 시간 범위 변경
  const changeTimeRange = (newRange) => {
    setTimeRange(newRange);
  };

  // 날짜 이동
  const navigateDate = (direction) => {
    const config = timeRangeConfig[timeRange];
    const newDate = new Date(currentDate);
    
    if (timeRange === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (timeRange === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (timeRange === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction * 3));
    }
    
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const timelineDates = generateTimeRange();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-emerald-500 rounded mx-auto mb-2"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">간트차트 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              간트차트
            </h3>
            {currentProject && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentProject.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 시간 범위 선택 */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {['week', 'month', 'quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => changeTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    timeRange === range
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range === 'week' ? '주' : range === 'month' ? '월' : '분기'}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => onTaskCreate()}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>태스크 추가</span>
            </button>
          </div>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 dark:text-white min-w-[200px] text-center">
              {timeRange === 'week' && `${timelineDates[0].toLocaleDateString()} - ${timelineDates[6].toLocaleDateString()}`}
              {timeRange === 'month' && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
              {timeRange === 'quarter' && `${currentDate.getFullYear()}년 ${Math.floor(currentDate.getMonth() / 3) + 1}분기`}
            </h2>
            
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              오늘
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              총 {filteredTasks.length}개 태스크
            </span>
          </div>
        </div>
      </div>

      {/* 간트차트 영역 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 왼쪽 태스크 목록 */}
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">태스크</h4>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedTaskId === task.id ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-2 border-emerald-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    onTaskSelect(task);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    {getTaskTypeIcon(task.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {task.assignee && (
                          <div className="flex items-center space-x-1">
                            <UserIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                        {task.estimated_hours && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.estimated_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskEdit(task);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">일정이 있는 태스크가 없습니다.</p>
                  <button
                    onClick={() => onTaskCreate()}
                    className="mt-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm"
                  >
                    + 태스크 추가
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 타임라인 */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* 시간축 헤더 */}
              <div className="h-16 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <div className="flex-1 grid grid-cols-30 gap-0">
                  {timelineDates.map((date, index) => (
                    <div
                      key={index}
                      className="text-center py-2 border-r border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400"
                    >
                      {timeRange === 'week' || timeRange === 'month' ? 
                        date.getDate() : 
                        `${date.getMonth() + 1}/${date.getDate()}`
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* 태스크 바들 */}
              <div className="relative">
                {filteredTasks.map((task, index) => {
                  const barStyle = getTaskBarStyle(task, timelineDates);
                  if (!barStyle) return null;

                  return (
                    <div
                      key={task.id}
                      className="h-16 border-b border-gray-200 dark:border-gray-700 relative flex items-center"
                    >
                      <div className="flex-1 grid grid-cols-30 gap-0 relative">
                        <div
                          className={`absolute top-2 bottom-2 rounded ${getStatusColor(task.status)} cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2`}
                          style={barStyle}
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            onTaskSelect(task);
                          }}
                        >
                          <span className="text-white text-xs font-medium truncate">
                            {task.title}
                          </span>
                          {task.progress && (
                            <div className="ml-2 text-xs text-white opacity-75">
                              {task.progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttView;