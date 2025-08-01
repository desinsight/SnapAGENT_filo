import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  UserIcon,
  TagIcon,
  FlagIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  CalendarIcon,
  BoltIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 일괄 작업 처리 패널
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 여러 태스크 선택 후 일괄 상태 변경
 * - 일괄 담당자 배정
 * - 일괄 우선순위 변경
 * - 일괄 마감일 설정
 * - 일괄 태그 추가/제거
 * - 일괄 삭제 및 아카이브
 * - 일괄 복사
 * - 실행 전 미리보기 및 확인
 */
const BulkActionsPanel = ({ 
  isOpen, 
  onClose, 
  selectedTasks = [], 
  onBulkAction, 
  onClearSelection,
  availableUsers = [],
  availableTags = [],
  availableProjects = []
}) => {
  // 액션 타입 상태
  const [selectedAction, setSelectedAction] = useState('');
  const [actionParams, setActionParams] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // 일괄 액션 옵션 정의
  const bulkActions = [
    {
      id: 'status',
      label: '상태 변경',
      icon: CheckCircleIcon,
      color: 'blue',
      description: '선택한 태스크들의 상태를 일괄 변경합니다',
      requiresParams: true,
      paramType: 'status'
    },
    {
      id: 'assignee',
      label: '담당자 배정',
      icon: UserIcon,
      color: 'green',
      description: '선택한 태스크들에 담당자를 일괄 배정합니다',
      requiresParams: true,
      paramType: 'user'
    },
    {
      id: 'priority',
      label: '우선순위 변경',
      icon: FlagIcon,
      color: 'orange',
      description: '선택한 태스크들의 우선순위를 일괄 변경합니다',
      requiresParams: true,
      paramType: 'priority'
    },
    {
      id: 'due_date',
      label: '마감일 설정',
      icon: CalendarIcon,
      color: 'purple',
      description: '선택한 태스크들의 마감일을 일괄 설정합니다',
      requiresParams: true,
      paramType: 'date'
    },
    {
      id: 'add_tags',
      label: '태그 추가',
      icon: TagIcon,
      color: 'indigo',
      description: '선택한 태스크들에 태그를 일괄 추가합니다',
      requiresParams: true,
      paramType: 'tags'
    },
    {
      id: 'project',
      label: '프로젝트 이동',
      icon: ArchiveBoxIcon,
      color: 'cyan',
      description: '선택한 태스크들을 다른 프로젝트로 이동합니다',
      requiresParams: true,
      paramType: 'project'
    },
    {
      id: 'duplicate',
      label: '복사',
      icon: DocumentDuplicateIcon,
      color: 'gray',
      description: '선택한 태스크들을 복사합니다',
      requiresParams: false
    },
    {
      id: 'archive',
      label: '아카이브',
      icon: ArchiveBoxIcon,
      color: 'yellow',
      description: '선택한 태스크들을 아카이브합니다',
      requiresParams: false,
      warning: true
    },
    {
      id: 'delete',
      label: '삭제',
      icon: TrashIcon,
      color: 'red',
      description: '선택한 태스크들을 영구 삭제합니다',
      requiresParams: false,
      warning: true,
      destructive: true
    }
  ];

  // 상태별 색상 및 라벨
  const statusOptions = Object.entries(TASK_CONFIG.TASK_STATUS).map(([key, value]) => ({
    value,
    label: {
      [TASK_CONFIG.TASK_STATUS.PENDING]: '대기중',
      [TASK_CONFIG.TASK_STATUS.IN_PROGRESS]: '진행중',
      [TASK_CONFIG.TASK_STATUS.REVIEW]: '검토중',
      [TASK_CONFIG.TASK_STATUS.COMPLETED]: '완료',
      [TASK_CONFIG.TASK_STATUS.CANCELLED]: '취소',
      [TASK_CONFIG.TASK_STATUS.OVERDUE]: '연체'
    }[value],
    color: {
      [TASK_CONFIG.TASK_STATUS.PENDING]: 'bg-gray-100 text-gray-800',
      [TASK_CONFIG.TASK_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [TASK_CONFIG.TASK_STATUS.REVIEW]: 'bg-yellow-100 text-yellow-800',
      [TASK_CONFIG.TASK_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
      [TASK_CONFIG.TASK_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
      [TASK_CONFIG.TASK_STATUS.OVERDUE]: 'bg-red-100 text-red-800'
    }[value]
  }));

  // 우선순위 옵션
  const priorityOptions = Object.entries(TASK_CONFIG.PRIORITY_LEVELS).map(([key, value]) => ({
    value,
    label: {
      [TASK_CONFIG.PRIORITY_LEVELS.URGENT]: '긴급',
      [TASK_CONFIG.PRIORITY_LEVELS.HIGH]: '높음',
      [TASK_CONFIG.PRIORITY_LEVELS.MEDIUM]: '보통',
      [TASK_CONFIG.PRIORITY_LEVELS.LOW]: '낮음'
    }[value],
    color: {
      [TASK_CONFIG.PRIORITY_LEVELS.URGENT]: 'bg-red-100 text-red-800',
      [TASK_CONFIG.PRIORITY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
      [TASK_CONFIG.PRIORITY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [TASK_CONFIG.PRIORITY_LEVELS.LOW]: 'bg-green-100 text-green-800'
    }[value]
  }));

  // 액션 선택 핸들러
  const handleActionSelect = useCallback((actionId) => {
    setSelectedAction(actionId);
    setActionParams({});
  }, []);

  // 파라미터 변경 핸들러
  const handleParamChange = useCallback((key, value) => {
    setActionParams(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // 일괄 작업 실행
  const handleExecute = useCallback(async () => {
    if (!selectedAction) return;

    const action = bulkActions.find(a => a.id === selectedAction);
    
    // 위험한 작업은 확인 단계 추가
    if (action?.warning && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsExecuting(true);
    try {
      const payload = {
        action: selectedAction,
        taskIds: selectedTasks.map(task => task.id),
        params: actionParams
      };

      await onBulkAction?.(payload);
      onClose();
      onClearSelection?.();
    } catch (error) {
      console.error('일괄 작업 실행 실패:', error);
    } finally {
      setIsExecuting(false);
      setShowConfirmation(false);
    }
  }, [selectedAction, selectedTasks, actionParams, onBulkAction, onClose, onClearSelection, showConfirmation, bulkActions]);

  // 액션 색상 가져오기
  const getActionColor = (color) => ({
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }[color] || 'bg-gray-100 text-gray-800');

  // 선택된 액션 정보
  const selectedActionInfo = bulkActions.find(a => a.id === selectedAction);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                일괄 작업
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTasks.length}개 태스크 선택됨
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

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 선택된 태스크 미리보기 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              선택된 태스크 ({selectedTasks.length}개)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {selectedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-900 dark:text-white truncate">{task.title}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      statusOptions.find(s => s.value === task.status)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {statusOptions.find(s => s.value === task.status)?.label || task.status}
                    </span>
                  </div>
                ))}
                {selectedTasks.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{selectedTasks.length - 5}개 더...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 액션 선택 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              수행할 작업 선택
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionSelect(action.id)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${getActionColor(action.color)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {action.label}
                        </p>
                      </div>
                      {action.destructive && (
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 액션 파라미터 설정 */}
          {selectedActionInfo?.requiresParams && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                작업 설정
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {selectedActionInfo.paramType === 'status' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      변경할 상태 선택
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleParamChange('status', status.value)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            actionParams.status === status.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActionInfo.paramType === 'priority' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      변경할 우선순위 선택
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {priorityOptions.map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => handleParamChange('priority', priority.value)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            actionParams.priority === priority.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <span className={`px-2 py-1 text-xs rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActionInfo.paramType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      담당자 선택
                    </label>
                    <select
                      value={actionParams.assignee || ''}
                      onChange={(e) => handleParamChange('assignee', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">담당자를 선택하세요</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedActionInfo.paramType === 'date' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      마감일 설정
                    </label>
                    <input
                      type="datetime-local"
                      value={actionParams.due_date || ''}
                      onChange={(e) => handleParamChange('due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}

                {selectedActionInfo.paramType === 'tags' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      추가할 태그 선택
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <label key={tag.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(actionParams.tags || []).includes(tag.id)}
                            onChange={(e) => {
                              const currentTags = actionParams.tags || [];
                              const newTags = e.target.checked
                                ? [...currentTags, tag.id]
                                : currentTags.filter(id => id !== tag.id);
                              handleParamChange('tags', newTags);
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActionInfo.paramType === 'project' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      이동할 프로젝트 선택
                    </label>
                    <select
                      value={actionParams.project || ''}
                      onChange={(e) => handleParamChange('project', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">프로젝트를 선택하세요</option>
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 확인 단계 */}
          {showConfirmation && selectedActionInfo && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h4 className="font-medium text-red-800 dark:text-red-300">
                  {selectedActionInfo.destructive ? '위험한 작업' : '주의 필요'}
                </h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {selectedActionInfo.destructive 
                  ? `${selectedTasks.length}개의 태스크가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
                  : `${selectedTasks.length}개의 태스크에 "${selectedActionInfo.label}" 작업을 수행합니다.`
                }
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                계속 진행하시겠습니까?
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedTasks.length}개 태스크에 작업을 수행합니다
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClearSelection}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              선택 해제
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleExecute}
              disabled={!selectedAction || isExecuting || (selectedActionInfo?.requiresParams && !Object.keys(actionParams).length)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>실행 중...</span>
                </>
              ) : showConfirmation ? (
                <span>확인 및 실행</span>
              ) : (
                <span>작업 실행</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsPanel;