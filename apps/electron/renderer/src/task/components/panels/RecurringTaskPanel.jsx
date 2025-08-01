import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 반복 태스크 관리 패널
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 반복 패턴 생성 및 관리 (일간, 주간, 월간, 연간, 커스텀)
 * - 반복 태스크 일시정지/재개
 * - 반복 히스토리 및 예정 태스크 조회
 * - 반복 패턴 수정 및 삭제
 * - 개별 인스턴스 건너뛰기/수정
 * - 반복 종료 조건 설정
 */
const RecurringTaskPanel = ({ 
  isOpen, 
  onClose, 
  recurringTasks = [],
  onCreateRecurrence,
  onUpdateRecurrence,
  onDeleteRecurrence,
  onPauseRecurrence,
  onResumeRecurrence,
  onSkipInstance,
  onEditInstance
}) => {
  // UI 상태
  const [activeTab, setActiveTab] = useState('list'); // list, create, edit
  const [selectedRecurrence, setSelectedRecurrence] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  // 새 반복 패턴 상태
  const [newRecurrence, setNewRecurrence] = useState({
    taskTemplate: {
      title: '',
      description: '',
      priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
      assignee: '',
      tags: [],
      estimatedHours: 1
    },
    pattern: {
      type: TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY, // daily, weekly, monthly, yearly, custom
      interval: 1,
      daysOfWeek: [1], // 월요일
      dayOfMonth: 1,
      monthOfYear: 1,
      endCondition: {
        type: 'never', // never, date, count
        endDate: '',
        count: 10
      }
    },
    settings: {
      timezone: 'Asia/Seoul',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      createInAdvance: 7, // days
      autoAssign: true,
      notifyCreation: true
    }
  });

  // 반복 패턴 타입 옵션
  const recurrenceTypes = [
    {
      value: TASK_CONFIG.RECURRENCE_PATTERNS.DAILY,
      label: '매일',
      description: '매일 반복',
      icon: CalendarIcon
    },
    {
      value: TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY,
      label: '매주',
      description: '매주 지정된 요일에 반복',
      icon: CalendarIcon
    },
    {
      value: TASK_CONFIG.RECURRENCE_PATTERNS.MONTHLY,
      label: '매월',
      description: '매월 지정된 날짜에 반복',
      icon: CalendarIcon
    },
    {
      value: TASK_CONFIG.RECURRENCE_PATTERNS.YEARLY,
      label: '매년',
      description: '매년 지정된 날짜에 반복',
      icon: CalendarIcon
    },
    {
      value: TASK_CONFIG.RECURRENCE_PATTERNS.CUSTOM,
      label: '커스텀',
      description: '사용자 정의 반복 패턴',
      icon: ClockIcon
    }
  ];

  // 요일 옵션
  const daysOfWeek = [
    { value: 1, label: '월', fullLabel: '월요일' },
    { value: 2, label: '화', fullLabel: '화요일' },
    { value: 3, label: '수', fullLabel: '수요일' },
    { value: 4, label: '목', fullLabel: '목요일' },
    { value: 5, label: '금', fullLabel: '금요일' },
    { value: 6, label: '토', fullLabel: '토요일' },
    { value: 0, label: '일', fullLabel: '일요일' }
  ];

  // 새 반복 패턴 입력 업데이트
  const updateNewRecurrence = useCallback((path, value) => {
    setNewRecurrence(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  // 요일 토글
  const toggleDayOfWeek = useCallback((day) => {
    setNewRecurrence(prev => ({
      ...prev,
      pattern: {
        ...prev.pattern,
        daysOfWeek: prev.pattern.daysOfWeek.includes(day)
          ? prev.pattern.daysOfWeek.filter(d => d !== day)
          : [...prev.pattern.daysOfWeek, day].sort()
      }
    }));
  }, []);

  // 아이템 확장/축소
  const toggleExpanded = useCallback((id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // 반복 패턴 생성
  const handleCreateRecurrence = useCallback(async () => {
    try {
      await onCreateRecurrence?.(newRecurrence);
      setActiveTab('list');
      // 초기화
      setNewRecurrence({
        taskTemplate: {
          title: '',
          description: '',
          priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
          assignee: '',
          tags: [],
          estimatedHours: 1
        },
        pattern: {
          type: TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY,
          interval: 1,
          daysOfWeek: [1],
          dayOfMonth: 1,
          monthOfYear: 1,
          endCondition: {
            type: 'never',
            endDate: '',
            count: 10
          }
        },
        settings: {
          timezone: 'Asia/Seoul',
          startDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          createInAdvance: 7,
          autoAssign: true,
          notifyCreation: true
        }
      });
    } catch (error) {
      console.error('반복 패턴 생성 실패:', error);
    }
  }, [newRecurrence, onCreateRecurrence]);

  // 반복 패턴 설명 생성
  const getRecurrenceDescription = useCallback((pattern) => {
    const { type, interval, daysOfWeek, dayOfMonth } = pattern;
    
    switch (type) {
      case TASK_CONFIG.RECURRENCE_PATTERNS.DAILY:
        return interval === 1 ? '매일' : `${interval}일마다`;
      
      case TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY:
        const dayNames = daysOfWeek.map(day => 
          daysOfWeek.find(d => d.value === day)?.label || day
        ).join(', ');
        return interval === 1 ? `매주 ${dayNames}요일` : `${interval}주마다 ${dayNames}요일`;
      
      case TASK_CONFIG.RECURRENCE_PATTERNS.MONTHLY:
        return interval === 1 ? `매월 ${dayOfMonth}일` : `${interval}개월마다 ${dayOfMonth}일`;
      
      case TASK_CONFIG.RECURRENCE_PATTERNS.YEARLY:
        return interval === 1 ? '매년' : `${interval}년마다`;
      
      default:
        return '커스텀 패턴';
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ArrowPathIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                반복 태스크 관리
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'list' && `${recurringTasks.length}개의 반복 패턴`}
                {activeTab === 'create' && '새 반복 패턴 생성'}
                {activeTab === 'edit' && '반복 패턴 편집'}
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

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'list', label: '반복 목록', icon: ArrowPathIcon },
              { id: 'create', label: '새 반복 생성', icon: PlusIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
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

        {/* 컨텐츠 */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* 반복 목록 탭 */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {recurringTasks.length > 0 ? (
                recurringTasks.map((recurrence) => (
                  <div key={recurrence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleExpanded(recurrence.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              {expandedItems[recurrence.id] ? (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {recurrence.taskTemplate.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getRecurrenceDescription(recurrence.pattern)}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                recurrence.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {recurrence.isActive ? '활성' : '일시정지'}
                              </span>
                              
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                다음: {new Date(recurrence.nextRun).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-4">
                          {recurrence.isActive ? (
                            <button
                              onClick={() => onPauseRecurrence?.(recurrence.id)}
                              className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                              title="일시정지"
                            >
                              <PauseIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onResumeRecurrence?.(recurrence.id)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="재개"
                            >
                              <PlayIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedRecurrence(recurrence);
                              setActiveTab('edit');
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="편집"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => onDeleteRecurrence?.(recurrence.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 확장된 상세 정보 */}
                    {expandedItems[recurrence.id] && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">태스크 정보</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">설명:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {recurrence.taskTemplate.description || '설명 없음'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">우선순위:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {recurrence.taskTemplate.priority}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">예상 시간:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {recurrence.taskTemplate.estimatedHours}시간
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">반복 설정</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">시작일:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {new Date(recurrence.settings.startDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">시작 시간:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {recurrence.settings.startTime}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">종료 조건:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {recurrence.pattern.endCondition.type === 'never' && '무제한'}
                                  {recurrence.pattern.endCondition.type === 'date' && 
                                    `${new Date(recurrence.pattern.endCondition.endDate).toLocaleDateString()}까지`}
                                  {recurrence.pattern.endCondition.type === 'count' && 
                                    `${recurrence.pattern.endCondition.count}회`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 최근 생성된 태스크 */}
                        {recurrence.recentTasks?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">최근 생성된 태스크</h4>
                            <div className="space-y-2">
                              {recurrence.recentTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-900 dark:text-white">{task.title}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      task.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {task.status === 'completed' ? '완료' : '진행중'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ArrowPathIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">반복 태스크가 없습니다.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    새 반복 패턴 생성
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 새 반복 생성 탭 */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* 태스크 템플릿 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">태스크 템플릿</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      태스크 제목 *
                    </label>
                    <input
                      type="text"
                      value={newRecurrence.taskTemplate.title}
                      onChange={(e) => updateNewRecurrence('taskTemplate.title', e.target.value)}
                      placeholder="반복 태스크의 제목을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      설명
                    </label>
                    <textarea
                      value={newRecurrence.taskTemplate.description}
                      onChange={(e) => updateNewRecurrence('taskTemplate.description', e.target.value)}
                      placeholder="태스크 설명..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        우선순위
                      </label>
                      <select
                        value={newRecurrence.taskTemplate.priority}
                        onChange={(e) => updateNewRecurrence('taskTemplate.priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value={TASK_CONFIG.PRIORITY_LEVELS.LOW}>낮음</option>
                        <option value={TASK_CONFIG.PRIORITY_LEVELS.MEDIUM}>보통</option>
                        <option value={TASK_CONFIG.PRIORITY_LEVELS.HIGH}>높음</option>
                        <option value={TASK_CONFIG.PRIORITY_LEVELS.URGENT}>긴급</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        예상 시간 (시간)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newRecurrence.taskTemplate.estimatedHours}
                        onChange={(e) => updateNewRecurrence('taskTemplate.estimatedHours', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 반복 패턴 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">반복 패턴</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      반복 유형
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {recurrenceTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => updateNewRecurrence('pattern.type', type.value)}
                            className={`p-4 border rounded-lg text-left transition-colors ${
                              newRecurrence.pattern.type === type.value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5" />
                              <div>
                                <p className="font-medium">{type.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 간격 설정 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      반복 간격
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={newRecurrence.pattern.interval}
                        onChange={(e) => updateNewRecurrence('pattern.interval', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.DAILY && '일마다'}
                        {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY && '주마다'}
                        {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.MONTHLY && '개월마다'}
                        {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.YEARLY && '년마다'}
                      </span>
                    </div>
                  </div>

                  {/* 주간 반복 - 요일 선택 */}
                  {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.WEEKLY && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        반복 요일
                      </label>
                      <div className="flex space-x-2">
                        {daysOfWeek.map((day) => (
                          <button
                            key={day.value}
                            onClick={() => toggleDayOfWeek(day.value)}
                            className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                              newRecurrence.pattern.daysOfWeek.includes(day.value)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 월간 반복 - 날짜 선택 */}
                  {newRecurrence.pattern.type === TASK_CONFIG.RECURRENCE_PATTERNS.MONTHLY && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        반복 날짜
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={newRecurrence.pattern.dayOfMonth}
                        onChange={(e) => updateNewRecurrence('pattern.dayOfMonth', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">일</span>
                    </div>
                  )}

                  {/* 종료 조건 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      종료 조건
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="endCondition"
                          value="never"
                          checked={newRecurrence.pattern.endCondition.type === 'never'}
                          onChange={(e) => updateNewRecurrence('pattern.endCondition.type', e.target.value)}
                          className="border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">무제한 반복</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="endCondition"
                          value="date"
                          checked={newRecurrence.pattern.endCondition.type === 'date'}
                          onChange={(e) => updateNewRecurrence('pattern.endCondition.type', e.target.value)}
                          className="border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">날짜까지</span>
                        {newRecurrence.pattern.endCondition.type === 'date' && (
                          <input
                            type="date"
                            value={newRecurrence.pattern.endCondition.endDate}
                            onChange={(e) => updateNewRecurrence('pattern.endCondition.endDate', e.target.value)}
                            className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        )}
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="endCondition"
                          value="count"
                          checked={newRecurrence.pattern.endCondition.type === 'count'}
                          onChange={(e) => updateNewRecurrence('pattern.endCondition.type', e.target.value)}
                          className="border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">횟수</span>
                        {newRecurrence.pattern.endCondition.type === 'count' && (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="1"
                              value={newRecurrence.pattern.endCondition.count}
                              onChange={(e) => updateNewRecurrence('pattern.endCondition.count', parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">회</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 설정 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">추가 설정</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        시작 날짜
                      </label>
                      <input
                        type="date"
                        value={newRecurrence.settings.startDate}
                        onChange={(e) => updateNewRecurrence('settings.startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        시작 시간
                      </label>
                      <input
                        type="time"
                        value={newRecurrence.settings.startTime}
                        onChange={(e) => updateNewRecurrence('settings.startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      미리 생성 기간 (일)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newRecurrence.settings.createInAdvance}
                      onChange={(e) => updateNewRecurrence('settings.createInAdvance', parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">일 전에 태스크 생성</span>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRecurrence.settings.autoAssign}
                        onChange={(e) => updateNewRecurrence('settings.autoAssign', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">자동 담당자 배정</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRecurrence.settings.notifyCreation}
                        onChange={(e) => updateNewRecurrence('settings.notifyCreation', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">태스크 생성 시 알림</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'create' && '반복 패턴을 생성하면 자동으로 태스크가 생성됩니다'}
          </div>
          
          <div className="flex items-center space-x-3">
            {activeTab === 'create' && (
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                목록으로
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              닫기
            </button>
            {activeTab === 'create' && (
              <button
                onClick={handleCreateRecurrence}
                disabled={!newRecurrence.taskTemplate.title.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
              >
                반복 패턴 생성
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringTaskPanel;