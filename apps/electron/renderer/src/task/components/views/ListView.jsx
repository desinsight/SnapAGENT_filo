import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import { TASK_CONFIG, TASK_STATUS_LABELS, PRIORITY_LABELS, TASK_TYPE_LABELS } from '../../constants/taskConfig';

const ListView = ({
  tasks = [],
  selectedTask,
  selectedTasks = [],
  onTaskSelect,
  onTaskEdit,
  onTaskCreate,
  onTaskDelete,
  onSelectionChange,
  loading = false,
  error = null,
  projects = [],
  organizations = [],
  teams = [],
  currentProject,
  currentOrganization,
  currentTeam
}) => {
  const [hoveredTask, setHoveredTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // 우선순위별 색상 매핑
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      high: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    };
    return colors[priority] || colors.medium;
  };

  // 상태별 색상 매핑
  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
      in_progress: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      review: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
      completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      cancelled: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      overdue: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    };
    return colors[status] || colors.pending;
  };

  // 태스크 타입별 아이콘
  const getTaskTypeIcon = (type) => {
    const icons = {
      todo: CheckCircleIcon,
      bug: ExclamationTriangleIcon,
      feature: PlayIcon,
      document: PaperClipIcon,
      meeting: UserIcon,
      survey: ChatBubbleLeftIcon,
      review: ArrowPathIcon
    };
    return icons[type] || CheckCircleIcon;
  };

  // 태스크 선택 핸들러
  const handleTaskSelection = (task, isSelected) => {
    if (isSelected) {
      onSelectionChange([...selectedTasks, task.id]);
    } else {
      onSelectionChange(selectedTasks.filter(id => id !== task.id));
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tasks.map(task => task.id));
    }
  };

  // 마감일 포맷팅
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}일 연체`, className: 'text-red-600 dark:text-red-400' };
    } else if (diffDays === 0) {
      return { text: '오늘', className: 'text-orange-600 dark:text-orange-400' };
    } else if (diffDays === 1) {
      return { text: '내일', className: 'text-yellow-600 dark:text-yellow-400' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}일 후`, className: 'text-blue-600 dark:text-blue-400' };
    } else {
      return { text: date.toLocaleDateString(), className: 'text-gray-600 dark:text-gray-400' };
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 overflow-hidden p-6">
        <div className="space-y-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16" />
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <ExclamationTriangleIconSolid className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            태스크를 불러올 수 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <CheckCircleIconSolid className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            태스크가 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            새로운 태스크를 만들어 시작해보세요.
          </p>
          <button
            onClick={() => onTaskCreate()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            첫 태스크 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 테이블 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedTasks.length === tasks.length && tasks.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-4">태스크</div>
            <div className="col-span-2">상태</div>
            <div className="col-span-2">우선순위</div>
            <div className="col-span-2">담당자</div>
            <div className="col-span-1">마감일</div>
            <div className="col-span-1">액션</div>
          </div>
        </div>
      </div>

      {/* 태스크 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-2">
          {tasks.map((task) => {
            const isSelected = selectedTasks.includes(task.id);
            const isHovered = hoveredTask === task.id;
            const dueDate = formatDueDate(task.due_date);
            const TypeIcon = getTaskTypeIcon(task.type);

            return (
              <div
                key={task.id}
                className={`
                  bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
                  transition-all duration-200 cursor-pointer
                  ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-600' : ''}
                  ${isHovered ? 'shadow-md' : 'shadow-sm'}
                  hover:shadow-md
                `}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={() => onTaskSelect(task)}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* 체크박스 */}
                    <div
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleTaskSelection(task, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1 grid grid-cols-12 gap-4 min-w-0">
                      {/* 태스크 정보 */}
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-start space-x-2">
                          <TypeIcon className={`w-4 h-4 mt-1 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            {/* 태그와 메타 정보 */}
                            <div className="flex items-center space-x-3 mt-2">
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <TagIcon className="w-3 h-3 text-gray-400" />
                                  <div className="flex space-x-1">
                                    {task.tags.slice(0, 3).map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                      >
                                        {tag.name || tag}
                                      </span>
                                    ))}
                                    {task.tags.length > 3 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{task.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* 첨부파일 */}
                              {task.attachments && task.attachments.length > 0 && (
                                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                  <PaperClipIcon className="w-3 h-3" />
                                  <span className="text-xs">{task.attachments.length}</span>
                                </div>
                              )}

                              {/* 댓글 */}
                              {task.comments_count > 0 && (
                                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                  <ChatBubbleLeftIcon className="w-3 h-3" />
                                  <span className="text-xs">{task.comments_count}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 상태 */}
                      <div className="col-span-2 flex items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                      </div>

                      {/* 우선순위 */}
                      <div className="col-span-2 flex items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>

                      {/* 담당자 */}
                      <div className="col-span-2 flex items-start">
                        {task.assignee ? (
                          <div className="flex items-center space-x-2">
                            {task.assignee.avatar ? (
                              <img
                                src={task.assignee.avatar}
                                alt={task.assignee.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">미할당</span>
                        )}
                      </div>

                      {/* 마감일 */}
                      <div className="col-span-1 flex items-start">
                        {dueDate ? (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs ${dueDate.className}`}>
                              {dueDate.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </div>

                      {/* 액션 */}
                      <div className="col-span-1 flex items-start">
                        <div 
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              // 메뉴 토글 로직
                            }}
                          >
                            <EllipsisHorizontalIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하위 태스크 표시 */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3 ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        하위 태스크 {task.subtasks.length}개
                      </div>
                      <div className="space-y-1">
                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${subtask.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <span className={`text-xs ${subtask.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                        {task.subtasks.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{task.subtasks.length - 3}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListView;