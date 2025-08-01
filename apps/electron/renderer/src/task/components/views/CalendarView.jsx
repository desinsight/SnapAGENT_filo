import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  FlagIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const CalendarView = ({
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [tasksByDate, setTasksByDate] = useState({});

  // 한국어 요일
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 태스크를 날짜별로 그룹화
  useEffect(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    setTasksByDate(grouped);
  }, [tasks]);

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
    return <Icon className="w-3 h-3" />;
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

  // 월의 첫 번째 날과 마지막 날 가져오기
  const getMonthBounds = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // 첫 주의 시작일 (일요일)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // 마지막 주의 마지막일 (토요일)
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    return { startDate, endDate, firstDay, lastDay };
  };

  // 캘린더 날짜들 생성
  const generateCalendarDays = () => {
    const { startDate, endDate } = getMonthBounds(currentDate);
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 날짜 이동
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 날짜가 현재 월에 속하는지 확인
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 오늘인지 확인
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 선택된 날짜인지 확인
  const isSelectedDate = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // 날짜의 태스크들 가져오기
  const getTasksForDate = (date) => {
    return tasksByDate[date.toDateString()] || [];
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="w-8 h-8 animate-pulse text-emerald-500 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">캘린더 로딩 중...</p>
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
              태스크 캘린더
            </h3>
            {currentProject && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentProject.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              오늘
            </button>
            <button
              onClick={() => onTaskCreate({ due_date: selectedDate?.toISOString() })}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>태스크 추가</span>
            </button>
          </div>
        </div>

        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {months[currentDate.getMonth()]}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            총 {tasks.length}개 태스크
          </div>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-sm font-medium text-center ${
                  index === 0 ? 'text-red-600 dark:text-red-400' : 
                  index === 6 ? 'text-blue-600 dark:text-blue-400' : 
                  'text-gray-700 dark:text-gray-300'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 날짜들 */}
          <div className="flex-1 grid grid-cols-7 gap-0">
            {calendarDays.map((date) => {
              const dayTasks = getTasksForDate(date);
              const isCurrentMonthDate = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const isSelected = isSelectedDate(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`
                    border-r border-b border-gray-200 dark:border-gray-700 min-h-[120px] p-2 cursor-pointer
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    ${!isCurrentMonthDate ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                    ${isSelected ? 'ring-2 ring-emerald-500' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-sm font-medium
                        ${!isCurrentMonthDate ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                        ${isTodayDate ? 'bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : ''}
                      `}
                    >
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* 태스크 목록 */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskSelect(task);
                        }}
                      >
                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-1 hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            {getTaskTypeIcon(task.type)}
                            <span className="text-xs text-gray-900 dark:text-white truncate flex-1">
                              {task.title}
                            </span>
                          </div>
                          {task.assignee && (
                            <div className="flex items-center space-x-1 mt-1">
                              <UserIcon className="w-2 h-2 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {task.assignee.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* 더 많은 태스크가 있을 때 */}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                        +{dayTasks.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 선택된 날짜의 태스크 목록 (사이드바) */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })} 태스크
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {getTasksForDate(selectedDate).map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onTaskSelect(task)}
              >
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                {getTaskTypeIcon(task.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </div>
                  {task.assignee && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      담당: {task.assignee.name}
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === TASK_CONFIG.TASK_STATUS.COMPLETED ? 
                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                  task.status === TASK_CONFIG.TASK_STATUS.IN_PROGRESS ?
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>
            ))}
            
            {getTasksForDate(selectedDate).length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                이 날에는 태스크가 없습니다.
                <button
                  onClick={() => onTaskCreate({ due_date: selectedDate.toISOString() })}
                  className="block mt-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  + 태스크 추가
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;