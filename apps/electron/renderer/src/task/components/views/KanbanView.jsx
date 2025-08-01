import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  PlusIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const KanbanView = ({
  tasks = [],
  onTaskSelect,
  onTaskEdit,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  loading = false,
  selectedTask,
  currentProject,
  currentOrganization,
  currentTeam
}) => {
  const [columns, setColumns] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState({});
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [draggedTask, setDraggedTask] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  // 상태별 칸반 컬럼 정의
  const kanbanColumns = [
    {
      id: TASK_CONFIG.TASK_STATUS.PENDING,
      title: TASK_STATUS_LABELS[TASK_CONFIG.TASK_STATUS.PENDING],
      color: 'bg-gray-100 dark:bg-gray-800',
      headerColor: 'bg-gray-200 dark:bg-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300',
      accentColor: 'border-gray-300 dark:border-gray-600'
    },
    {
      id: TASK_CONFIG.TASK_STATUS.IN_PROGRESS,
      title: TASK_STATUS_LABELS[TASK_CONFIG.TASK_STATUS.IN_PROGRESS],
      color: 'bg-blue-50 dark:bg-blue-900/20',
      headerColor: 'bg-blue-100 dark:bg-blue-900/40',
      textColor: 'text-blue-700 dark:text-blue-300',
      accentColor: 'border-blue-300 dark:border-blue-600'
    },
    {
      id: TASK_CONFIG.TASK_STATUS.REVIEW,
      title: TASK_STATUS_LABELS[TASK_CONFIG.TASK_STATUS.REVIEW],
      color: 'bg-purple-50 dark:bg-purple-900/20',
      headerColor: 'bg-purple-100 dark:bg-purple-900/40',
      textColor: 'text-purple-700 dark:text-purple-300',
      accentColor: 'border-purple-300 dark:border-purple-600'
    },
    {
      id: TASK_CONFIG.TASK_STATUS.COMPLETED,
      title: TASK_STATUS_LABELS[TASK_CONFIG.TASK_STATUS.COMPLETED],
      color: 'bg-green-50 dark:bg-green-900/20',
      headerColor: 'bg-green-100 dark:bg-green-900/40',
      textColor: 'text-green-700 dark:text-green-300',
      accentColor: 'border-green-300 dark:border-green-600'
    },
    {
      id: TASK_CONFIG.TASK_STATUS.CANCELLED,
      title: TASK_STATUS_LABELS[TASK_CONFIG.TASK_STATUS.CANCELLED],
      color: 'bg-red-50 dark:bg-red-900/20',
      headerColor: 'bg-red-100 dark:bg-red-900/40',
      textColor: 'text-red-700 dark:text-red-300',
      accentColor: 'border-red-300 dark:border-red-600'
    }
  ];

  // 태스크를 상태별로 그룹화
  useEffect(() => {
    const grouped = {};
    kanbanColumns.forEach(column => {
      grouped[column.id] = tasks.filter(task => task.status === column.id);
    });
    setTasksByStatus(grouped);
    setColumns(kanbanColumns);
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
    return <Icon className="w-4 h-4" />;
  };

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    };
    return colors[priority] || colors.medium;
  };

  // 마감일 포맷팅
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}일 연체`, className: 'text-red-500' };
    } else if (diffDays === 0) {
      return { text: '오늘', className: 'text-orange-500' };
    } else if (diffDays === 1) {
      return { text: '내일', className: 'text-yellow-500' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}일 후`, className: 'text-blue-500' };
    } else {
      return { text: date.toLocaleDateString(), className: 'text-gray-500' };
    }
  };

  // 컬럼 토글
  const toggleColumn = (columnId) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(columnId)) {
      newCollapsed.delete(columnId);
    } else {
      newCollapsed.add(columnId);
    }
    setCollapsedColumns(newCollapsed);
  };

  // 상태 변경 핸들러
  const handleStatusChange = (task, newStatus) => {
    onTaskUpdate(task.id, { status: newStatus });
  };

  // 태스크 카드 컴포넌트
  const TaskCard = ({ task, columnId }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'task',
      item: { id: task.id, status: task.status },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    const dueDate = formatDueDate(task.due_date);
    const isSelected = selectedTask?.id === task.id;
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const availableStatuses = kanbanColumns.filter(col => col.id !== task.status);

    return (
      <div
        ref={drag}
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
          p-4 mb-3 cursor-pointer transition-all duration-200 group
          hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600
          ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
          ${isSelected ? 'ring-2 ring-emerald-500' : ''}
        `}
        onClick={() => onTaskSelect(task)}
      >
        {/* 태스크 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getTaskTypeIcon(task.type)}
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {task.title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <FlagIcon className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(!showStatusMenu);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="상태 변경"
              >
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </button>
              
              {/* 상태 변경 메뉴 */}
              {showStatusMenu && (
                <div className="absolute right-0 top-8 z-50 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-48">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">상태 변경</div>
                    {availableStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task, status.id);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${status.textColor}`}
                      >
                        {status.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskEdit(task);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 태스크 설명 */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* 태그 */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                <TagIcon className="w-2 h-2 mr-1" />
                {tag.name}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <UserIcon className="w-3 h-3" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            {dueDate && (
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-3 h-3" />
                <span className={dueDate.className}>{dueDate.text}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <PaperClipIcon className="w-3 h-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-3 h-3" />
                <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* 진행률 바 */}
        {task.progress !== undefined && task.progress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {task.progress}% 완료
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">태스크 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 드롭 영역 컴포넌트
  const DropColumn = ({ column, children }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'task',
      drop: (item) => {
        if (item.status !== column.id) {
          onTaskUpdate(item.id, { status: column.id });
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    return (
      <div
        ref={drop}
        className={`
          h-full transition-colors duration-300
          ${isOver && canDrop ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
        `}
      >
        {children}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              칸반 보드
            </h3>
            {currentProject && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentProject.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              총 {tasks.length}개 태스크
            </span>
            <button
              onClick={() => onTaskCreate()}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>태스크 추가</span>
            </button>
          </div>
        </div>

        {/* 칸반 컬럼들 */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full min-w-max">
            {columns.map((column) => {
              const columnTasks = tasksByStatus[column.id] || [];
              const isCollapsed = collapsedColumns.has(column.id);

              return (
                <DropColumn key={column.id} column={column}>
                  <div className={`
                    w-80 flex-shrink-0 h-full flex flex-col
                    ${column.color}
                    ${isCollapsed ? 'w-12' : 'w-80'}
                    transition-all duration-300
                  `}>
                    {/* 컬럼 헤더 */}
                    <div className={`
                      ${column.headerColor} ${column.textColor}
                      p-4 border-b ${column.accentColor}
                      flex items-center justify-between
                    `}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${column.accentColor.replace('border-', 'bg-')}`} />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium">{column.title}</span>
                            <span className="text-sm opacity-75">
                              ({columnTasks.length})
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => toggleColumn(column.id)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                      >
                        {isCollapsed ? (
                          <ChevronUpIcon className="w-4 h-4 transform rotate-90" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 transform rotate-90" />
                        )}
                      </button>
                    </div>

                    {/* 컬럼 내용 */}
                    {!isCollapsed && (
                      <div className="flex-1 overflow-y-auto p-3">
                        {columnTasks.length > 0 ? (
                          <div className="space-y-0">
                            {columnTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                columnId={column.id}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 dark:text-gray-600 mb-2">
                              <CheckCircleIcon className="w-8 h-8 mx-auto" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {column.id === TASK_CONFIG.TASK_STATUS.PENDING ? 
                                '드래그해서 태스크를 추가하거나' :
                                '해당 상태의 태스크가 없습니다'
                              }
                            </p>
                            {column.id === TASK_CONFIG.TASK_STATUS.PENDING && (
                              <button
                                onClick={() => onTaskCreate()}
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                              >
                                + 태스크 추가
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DropColumn>
              );
            })}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default KanbanView;