import React, { useState } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  TagIcon,
  PaperClipIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  DocumentTextIcon,
  HeartIcon,
  FaceSmileIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';
import { TASK_CONFIG, TASK_TYPE_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const TaskDetail = ({
  isOpen,
  task,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  comments = [],
  activity = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCreateMention,
  onShowCollaboration,
  onShowTimeTracking,
  onShowFiles
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
    return <Icon className="w-5 h-5" />;
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      review: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    return colors[status] || colors.pending;
  };

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 dark:text-red-400',
      high: 'text-orange-600 dark:text-orange-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      low: 'text-green-600 dark:text-green-400'
    };
    return colors[priority] || colors.medium;
  };

  // 댓글 추가
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('댓글 추가 실패:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 진행률 계산
  const getProgress = () => {
    if (task.status === TASK_CONFIG.TASK_STATUS.COMPLETED) return 100;
    if (task.status === TASK_CONFIG.TASK_STATUS.IN_PROGRESS) return task.progress || 30;
    if (task.status === TASK_CONFIG.TASK_STATUS.REVIEW) return 80;
    return 0;
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

  if (!isOpen || !task) return null;

  const progress = getProgress();
  const dueDate = formatDueDate(task.due_date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getTaskTypeIcon(task.type)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {task.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>#{task.id}</span>
                <span>{TASK_TYPE_LABELS[task.type]}</span>
                {task.assignee && (
                  <span className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3" />
                    <span>{task.assignee.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              title="편집"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDuplicate(task)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="복제"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="삭제"
            >
              <TrashIcon className="w-5 h-5" />
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
              { id: 'overview', label: '개요', icon: DocumentTextIcon },
              { id: 'comments', label: `댓글 (${comments.length})`, icon: ChatBubbleLeftIcon },
              { id: 'activity', label: `활동 (${activity.length})`, icon: ClockIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
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
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="h-[calc(90vh-280px)] overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽 컬럼 - 상세 정보 */}
                <div className="lg:col-span-2 space-y-6">
                  {/* 설명 */}
                  {task.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">설명</h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 진행률 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">진행률</h3>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 하위 태스크 */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        하위 태스크 ({task.subtasks.length})
                      </h3>
                      <div className="space-y-2">
                        {task.subtasks.map((subtask, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className={`w-4 h-4 rounded-full ${subtask.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <span className={`flex-1 ${subtask.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 첨부파일 */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        첨부파일 ({task.attachments.length})
                      </h3>
                      <div className="space-y-2">
                        {task.attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <PaperClipIcon className="w-4 h-4 text-gray-500" />
                            <span className="flex-1 text-gray-900 dark:text-white">{file.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽 컬럼 - 메타 정보 */}
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">기본 정보</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">우선순위</span>
                        <div className="flex items-center space-x-1">
                          <FlagIcon className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>
                      </div>

                      {task.assignee && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">담당자</span>
                          <div className="flex items-center space-x-2">
                            {task.assignee.avatar ? (
                              <img src={task.assignee.avatar} alt={task.assignee.name} className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">{task.assignee.name}</span>
                          </div>
                        </div>
                      )}

                      {dueDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">마감일</span>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${dueDate.className}`}>{dueDate.text}</span>
                          </div>
                        </div>
                      )}

                      {task.estimated_hours && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">예상시간</span>
                          <span className="text-sm text-gray-900 dark:text-white">{task.estimated_hours}시간</span>
                        </div>
                      )}

                      {task.logged_hours !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">소요시간</span>
                          <span className="text-sm text-gray-900 dark:text-white">{task.logged_hours}시간</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 태그 */}
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">태그</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                          >
                            <TagIcon className="w-3 h-3" />
                            <span>{tag.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 빠른 액션 */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">빠른 액션</h4>
                    <div className="space-y-2">
                      <button
                        onClick={onShowTimeTracking}
                        className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm">시간 추적</span>
                      </button>
                      
                      <button
                        onClick={onShowFiles}
                        className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <PaperClipIcon className="w-4 h-4" />
                        <span className="text-sm">파일 관리</span>
                      </button>

                      <button
                        onClick={onShowCollaboration}
                        className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <UsersIcon className="w-4 h-4" />
                        <span className="text-sm">협업</span>
                      </button>
                    </div>
                  </div>

                  {/* 생성/수정 정보 */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>생성일: {new Date(task.created_at).toLocaleString()}</div>
                    <div>수정일: {new Date(task.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="h-[calc(90vh-280px)] flex flex-col">
              {/* 댓글 목록 */}
              <div className="flex-1 overflow-y-auto p-6">
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">{comment.author.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs">
                                <HandThumbUpIcon className="w-3 h-3" />
                                <span>좋아요</span>
                              </button>
                              <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs">
                                답글
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">아직 댓글이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 댓글 입력 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {isSubmittingComment ? '등록 중...' : '댓글 등록'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="h-[calc(90vh-280px)] overflow-y-auto p-6">
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white text-sm">
                          <span className="font-medium">{item.user.name}</span>님이 {item.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">활동 기록이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;