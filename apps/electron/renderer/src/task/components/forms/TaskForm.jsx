import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  TagIcon,
  PaperClipIcon,
  ClockIcon,
  ArrowPathIcon,
  LinkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, TASK_TYPE_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../constants/taskConfig';

const TaskForm = ({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  projects = [],
  organizations = [],
  teams = [],
  mode = 'create',
  onShowDependencies,
  onShowRecurring,
  onShowTimeTracking,
  onShowFiles
}) => {
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: TASK_CONFIG.TASK_TYPES.TODO,
    status: TASK_CONFIG.TASK_STATUS.PENDING,
    priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
    assignee_id: '',
    project_id: '',
    organization_id: '',
    team_id: '',
    due_date: '',
    estimated_hours: '',
    tags: [],
    category: TASK_CONFIG.TASK_CATEGORIES.WORK
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 태스크 데이터로 폼 초기화
  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || TASK_CONFIG.TASK_TYPES.TODO,
        status: task.status || TASK_CONFIG.TASK_STATUS.PENDING,
        priority: task.priority || TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
        assignee_id: task.assignee?.id || '',
        project_id: task.project_id || '',
        organization_id: task.organization_id || '',
        team_id: task.team_id || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        estimated_hours: task.estimated_hours || '',
        tags: task.tags || [],
        category: task.category || TASK_CONFIG.TASK_CATEGORIES.WORK
      });
    }
  }, [task, mode]);

  // 입력 변경 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 태그 추가
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.find(tag => tag.name === newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, { name: newTag.trim(), color: 'blue' }]
      }));
      setNewTag('');
    }
  };

  // 태그 제거
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagToRemove.name)
    }));
  };

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours < 0)) {
      newErrors.estimated_hours = '올바른 시간을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('태스크 저장 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
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
    return icons[type] || CheckCircleIcon;
  };

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      high: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      medium: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      low: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    };
    return colors[priority] || colors.medium;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === 'create' ? '새 태스크 만들기' : '태스크 편집'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mode === 'create' ? '새로운 태스크를 생성합니다' : '기존 태스크를 수정합니다'}
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

        {/* 폼 컨텐츠 */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-180px)]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 왼쪽 컬럼 - 기본 정보 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="태스크 제목을 입력하세요"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                  )}
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                    placeholder="태스크에 대한 상세 설명을 입력하세요"
                  />
                </div>

                {/* 태스크 타입과 카테고리 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      태스크 유형
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TASK_TYPE_LABELS).map(([type, label]) => {
                        const Icon = getTaskTypeIcon(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleInputChange('type', type)}
                            className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                              formData.type === type
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      {Object.entries(TASK_CONFIG.TASK_CATEGORIES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value === 'work' ? '업무' :
                           value === 'personal' ? '개인' :
                           value === 'learning' ? '학습' :
                           value === 'health' ? '건강' :
                           value === 'finance' ? '재무' : '기타'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    태그
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                      >
                        <TagIcon className="w-3 h-3" />
                        <span>{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="태그 입력 후 Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>

              {/* 오른쪽 컬럼 - 메타 정보 */}
              <div className="space-y-6">
                {/* 상태와 우선순위 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      {Object.entries(TASK_STATUS_LABELS).map(([status, label]) => (
                        <option key={status} value={status}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      우선순위
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => handleInputChange('priority', priority)}
                          className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                            formData.priority === priority
                              ? getPriorityColor(priority) + ' border-2'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <FlagIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 배정 정보 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      담당자
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.assignee_id}
                        onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="">담당자 선택</option>
                        <option value="user1">김개발</option>
                        <option value="user2">박디비</option>
                        <option value="user3">이디자인</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      프로젝트
                    </label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => handleInputChange('project_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">프로젝트 선택</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 일정 정보 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      마감일
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      예상 소요시간 (시간)
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimated_hours}
                        onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          errors.estimated_hours ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="8"
                      />
                    </div>
                    {errors.estimated_hours && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.estimated_hours}</p>
                    )}
                  </div>
                </div>

                {/* 고급 기능 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">고급 설정</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={onShowDependencies}
                      className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-sm">종속성 설정</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={onShowRecurring}
                      className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span className="text-sm">반복 설정</span>
                    </button>

                    <button
                      type="button"
                      onClick={onShowTimeTracking}
                      className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm">시간 추적</span>
                    </button>

                    <button
                      type="button"
                      onClick={onShowFiles}
                      className="w-full flex items-center space-x-3 p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                      <span className="text-sm">파일 첨부</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              * 필수 입력 항목
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{mode === 'create' ? '태스크 생성' : '변경사항 저장'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;