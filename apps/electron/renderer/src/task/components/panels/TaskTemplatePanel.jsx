import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  FlagIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  HeartIcon,
  SparklesIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 태스크 템플릿 관리 패널
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 템플릿 라이브러리 (공식, 커뮤니티, 개인)
 * - 템플릿 생성 및 편집
 * - 템플릿 즐겨찾기 및 평가
 * - 템플릿 검색 및 필터링
 * - 체크리스트 템플릿 지원
 * - 템플릿 공유 및 가져오기
 * - 사용 통계 및 인기도
 */
const TaskTemplatePanel = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  templates = [],
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onToggleFavorite,
  onRateTemplate,
  onImportTemplate,
  onExportTemplate
}) => {
  // UI 상태
  const [activeTab, setActiveTab] = useState('browse'); // browse, create, edit, favorites
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, recent, name, rating
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // 새 템플릿 생성 상태
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    isPublic: false,
    taskData: {
      title: '',
      description: '',
      priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
      estimatedHours: 1,
      tags: [],
      checklist: []
    },
    variables: [] // {name, type, defaultValue, required}
  });

  // 템플릿 카테고리
  const categories = [
    { id: 'all', name: '전체', icon: FolderIcon, count: templates.length },
    { id: 'development', name: '개발', icon: DocumentDuplicateIcon, count: templates.filter(t => t.category === 'development').length },
    { id: 'design', name: '디자인', icon: SparklesIcon, count: templates.filter(t => t.category === 'design').length },
    { id: 'marketing', name: '마케팅', icon: HeartIcon, count: templates.filter(t => t.category === 'marketing').length },
    { id: 'general', name: '일반', icon: FolderIcon, count: templates.filter(t => t.category === 'general').length },
    { id: 'personal', name: '개인', icon: UserIcon, count: templates.filter(t => t.category === 'personal').length }
  ];

  // Mock 템플릿 데이터 (실제로는 props로 받음)
  const mockTemplates = templates.length > 0 ? templates : [
    {
      id: 'tpl1',
      name: '버그 수정 프로세스',
      description: '버그 발견부터 수정 완료까지의 표준 프로세스',
      category: 'development',
      author: '개발팀',
      isPublic: true,
      isFavorite: true,
      rating: 4.8,
      usageCount: 156,
      createdAt: '2024-07-01',
      taskData: {
        title: '[버그] {bug_title}',
        description: '버그 설명: {bug_description}\n\n재현 단계:\n1. {step1}\n2. {step2}\n3. {step3}',
        priority: TASK_CONFIG.PRIORITY_LEVELS.HIGH,
        estimatedHours: 4,
        tags: ['버그수정', 'QA'],
        checklist: [
          { text: '버그 재현 확인', completed: false },
          { text: '원인 분석', completed: false },
          { text: '수정 코드 작성', completed: false },
          { text: '테스트 진행', completed: false },
          { text: '코드 리뷰', completed: false },
          { text: '배포 확인', completed: false }
        ]
      },
      variables: [
        { name: 'bug_title', type: 'text', defaultValue: '', required: true },
        { name: 'bug_description', type: 'textarea', defaultValue: '', required: true },
        { name: 'step1', type: 'text', defaultValue: '', required: false },
        { name: 'step2', type: 'text', defaultValue: '', required: false },
        { name: 'step3', type: 'text', defaultValue: '', required: false }
      ]
    },
    {
      id: 'tpl2',
      name: '신입사원 온보딩',
      description: '신입사원 입사 첫날부터 한 달까지의 온보딩 프로세스',
      category: 'general',
      author: 'HR팀',
      isPublic: true,
      isFavorite: false,
      rating: 4.6,
      usageCount: 89,
      createdAt: '2024-06-15',
      taskData: {
        title: '{employee_name} 온보딩',
        description: '신입사원 {employee_name}님의 온보딩 프로세스입니다.\n부서: {department}\n시작일: {start_date}',
        priority: TASK_CONFIG.PRIORITY_LEVELS.HIGH,
        estimatedHours: 16,
        tags: ['온보딩', 'HR'],
        checklist: [
          { text: '사원증 발급', completed: false },
          { text: '장비 지급 (노트북, 모니터)', completed: false },
          { text: '계정 생성 (이메일, Slack, 시스템)', completed: false },
          { text: '오리엔테이션 참석', completed: false },
          { text: '멘토 배정', completed: false },
          { text: '팀 소개', completed: false },
          { text: '업무 환경 설명', completed: false },
          { text: '첫 주 일정 브리핑', completed: false }
        ]
      },
      variables: [
        { name: 'employee_name', type: 'text', defaultValue: '', required: true },
        { name: 'department', type: 'select', options: ['개발팀', '디자인팀', '마케팅팀', 'HR팀'], defaultValue: '개발팀', required: true },
        { name: 'start_date', type: 'date', defaultValue: '', required: true }
      ]
    },
    {
      id: 'tpl3',
      name: '코드 리뷰 요청',
      description: '코드 리뷰 요청 시 필요한 정보를 체계적으로 정리',
      category: 'development',
      author: '시니어 개발자',
      isPublic: true,
      isFavorite: true,
      rating: 4.9,
      usageCount: 234,
      createdAt: '2024-07-05',
      taskData: {
        title: '코드 리뷰 요청: {feature_name}',
        description: '기능: {feature_name}\nPR 링크: {pr_link}\n\n변경 사항:\n{changes}\n\n특별히 확인해주실 부분:\n{focus_areas}',
        priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
        estimatedHours: 2,
        tags: ['코드리뷰', '개발'],
        checklist: [
          { text: '코드 스타일 가이드 준수', completed: false },
          { text: '테스트 코드 작성', completed: false },
          { text: '문서 업데이트', completed: false },
          { text: '성능 영향 검토', completed: false },
          { text: '보안 이슈 확인', completed: false }
        ]
      },
      variables: [
        { name: 'feature_name', type: 'text', defaultValue: '', required: true },
        { name: 'pr_link', type: 'url', defaultValue: '', required: true },
        { name: 'changes', type: 'textarea', defaultValue: '', required: true },
        { name: 'focus_areas', type: 'textarea', defaultValue: '', required: false }
      ]
    }
  ];

  // 템플릿 필터링 및 정렬
  const filteredTemplates = mockTemplates
    .filter(template => {
      if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !template.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // 새 템플릿 입력 업데이트
  const updateNewTemplate = useCallback((path, value) => {
    setNewTemplate(prev => {
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

  // 체크리스트 항목 추가
  const addChecklistItem = useCallback(() => {
    setNewTemplate(prev => ({
      ...prev,
      taskData: {
        ...prev.taskData,
        checklist: [...prev.taskData.checklist, { text: '', completed: false }]
      }
    }));
  }, []);

  // 체크리스트 항목 제거
  const removeChecklistItem = useCallback((index) => {
    setNewTemplate(prev => ({
      ...prev,
      taskData: {
        ...prev.taskData,
        checklist: prev.taskData.checklist.filter((_, i) => i !== index)
      }
    }));
  }, []);

  // 체크리스트 항목 업데이트
  const updateChecklistItem = useCallback((index, text) => {
    setNewTemplate(prev => ({
      ...prev,
      taskData: {
        ...prev.taskData,
        checklist: prev.taskData.checklist.map((item, i) => 
          i === index ? { ...item, text } : item
        )
      }
    }));
  }, []);

  // 변수 추가
  const addVariable = useCallback(() => {
    setNewTemplate(prev => ({
      ...prev,
      variables: [...prev.variables, { name: '', type: 'text', defaultValue: '', required: false }]
    }));
  }, []);

  // 변수 제거
  const removeVariable = useCallback((index) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  }, []);

  // 변수 업데이트
  const updateVariable = useCallback((index, field, value) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  }, []);

  // 템플릿 생성
  const handleCreateTemplate = useCallback(async () => {
    try {
      await onCreateTemplate?.(newTemplate);
      setActiveTab('browse');
      // 초기화
      setNewTemplate({
        name: '',
        description: '',
        category: 'general',
        isPublic: false,
        taskData: {
          title: '',
          description: '',
          priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
          estimatedHours: 1,
          tags: [],
          checklist: []
        },
        variables: []
      });
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
    }
  }, [newTemplate, onCreateTemplate]);

  // 템플릿 사용
  const handleUseTemplate = useCallback((template) => {
    onSelectTemplate?.(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    const colors = {
      [TASK_CONFIG.PRIORITY_LEVELS.LOW]: 'bg-green-100 text-green-800',
      [TASK_CONFIG.PRIORITY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [TASK_CONFIG.PRIORITY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
      [TASK_CONFIG.PRIORITY_LEVELS.URGENT]: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors[TASK_CONFIG.PRIORITY_LEVELS.MEDIUM];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <DocumentDuplicateIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                태스크 템플릿
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'browse' && `${filteredTemplates.length}개의 템플릿`}
                {activeTab === 'create' && '새 템플릿 생성'}
                {activeTab === 'favorites' && '즐겨찾기 템플릿'}
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

        <div className="flex h-[calc(90vh-140px)]">
          {/* 사이드바 */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* 탭 메뉴 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                {[
                  { id: 'browse', label: '템플릿 찾기', icon: MagnifyingGlassIcon },
                  { id: 'favorites', label: '즐겨찾기', icon: StarIcon },
                  { id: 'create', label: '새 템플릿', icon: PlusIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 카테고리 */}
            {activeTab === 'browse' && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">카테고리</h3>
                <div className="space-y-1">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{category.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1 flex flex-col">
            {/* 템플릿 브라우저 */}
            {activeTab === 'browse' && (
              <>
                {/* 검색 및 필터 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="템플릿 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                        />
                      </div>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="popular">인기순</option>
                        <option value="rating">평점순</option>
                        <option value="recent">최신순</option>
                        <option value="name">이름순</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 템플릿 목록 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{template.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.description}</p>
                          </div>
                          <button
                            onClick={() => onToggleFavorite?.(template.id)}
                            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            {template.isFavorite ? (
                              <StarIconSolid className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <StarIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(template.taskData.priority)}`}>
                            {template.taskData.priority}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {template.taskData.estimatedHours}시간
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ⭐ {template.rating}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <UserIcon className="w-3 h-3" />
                            <span>{template.author}</span>
                            <span>•</span>
                            <span>{template.usageCount}회 사용</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleUseTemplate(template)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
                            >
                              사용
                            </button>
                            <button
                              onClick={() => setSelectedTemplate(template)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <DocumentDuplicateIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">조건에 맞는 템플릿이 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 즐겨찾기 탭 */}
            {activeTab === 'favorites' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {mockTemplates.filter(t => t.isFavorite).map((template) => (
                    <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                      >
                        사용
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 템플릿 생성 탭 */}
            {activeTab === 'create' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">기본 정보</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          템플릿 이름 *
                        </label>
                        <input
                          type="text"
                          value={newTemplate.name}
                          onChange={(e) => updateNewTemplate('name', e.target.value)}
                          placeholder="예: 버그 수정 프로세스"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          설명
                        </label>
                        <textarea
                          value={newTemplate.description}
                          onChange={(e) => updateNewTemplate('description', e.target.value)}
                          placeholder="템플릿에 대한 설명을 입력하세요"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            카테고리
                          </label>
                          <select
                            value={newTemplate.category}
                            onChange={(e) => updateNewTemplate('category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="general">일반</option>
                            <option value="development">개발</option>
                            <option value="design">디자인</option>
                            <option value="marketing">마케팅</option>
                            <option value="personal">개인</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newTemplate.isPublic}
                              onChange={(e) => updateNewTemplate('isPublic', e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">공개 템플릿</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 태스크 데이터 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">태스크 템플릿</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          태스크 제목 *
                        </label>
                        <input
                          type="text"
                          value={newTemplate.taskData.title}
                          onChange={(e) => updateNewTemplate('taskData.title', e.target.value)}
                          placeholder="예: [버그] {bug_title}"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {`{변수명}`} 형태로 변수를 사용할 수 있습니다
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          태스크 설명
                        </label>
                        <textarea
                          value={newTemplate.taskData.description}
                          onChange={(e) => updateNewTemplate('taskData.description', e.target.value)}
                          placeholder="태스크 설명을 입력하세요. {변수명}을 사용할 수 있습니다."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            우선순위
                          </label>
                          <select
                            value={newTemplate.taskData.priority}
                            onChange={(e) => updateNewTemplate('taskData.priority', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                            value={newTemplate.taskData.estimatedHours}
                            onChange={(e) => updateNewTemplate('taskData.estimatedHours', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* 체크리스트 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            체크리스트
                          </label>
                          <button
                            onClick={addChecklistItem}
                            className="flex items-center space-x-1 px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded text-sm transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span>항목 추가</span>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {newTemplate.taskData.checklist.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckIcon className="w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={item.text}
                                onChange={(e) => updateChecklistItem(index, e.target.value)}
                                placeholder="체크리스트 항목"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <button
                                onClick={() => removeChecklistItem(index)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 변수 설정 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">템플릿 변수</h3>
                      <button
                        onClick={addVariable}
                        className="flex items-center space-x-1 px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded text-sm transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>변수 추가</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newTemplate.variables.map((variable, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={variable.name}
                              onChange={(e) => updateVariable(index, 'name', e.target.value)}
                              placeholder="변수명"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <select
                              value={variable.type}
                              onChange={(e) => updateVariable(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                              <option value="text">텍스트</option>
                              <option value="textarea">긴 텍스트</option>
                              <option value="select">선택</option>
                              <option value="date">날짜</option>
                              <option value="url">URL</option>
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={variable.defaultValue}
                              onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                              placeholder="기본값"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={variable.required}
                                onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">필수</span>
                            </label>
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => removeVariable(index)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'create' && '템플릿을 생성하여 반복 작업을 효율화하세요'}
            {activeTab === 'browse' && '템플릿을 사용하여 빠르게 태스크를 생성하세요'}
          </div>
          
          <div className="flex items-center space-x-3">
            {activeTab === 'create' && (
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                취소
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
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name.trim() || !newTemplate.taskData.title.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
              >
                템플릿 생성
              </button>
            )}
          </div>
        </div>

        {/* 템플릿 미리보기 모달 */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">설명</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">태스크 제목</h4>
                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {selectedTemplate.taskData.title}
                    </p>
                  </div>
                  
                  {selectedTemplate.taskData.checklist.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">체크리스트</h4>
                      <div className="space-y-2">
                        {selectedTemplate.taskData.checklist.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTemplate.variables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">필요한 변수</h4>
                      <div className="space-y-2">
                        {selectedTemplate.variables.map((variable, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{variable.name}</span>
                            <span className="ml-2">({variable.type})</span>
                            {variable.required && <span className="ml-1 text-red-500">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      handleUseTemplate(selectedTemplate);
                      setSelectedTemplate(null);
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    이 템플릿 사용
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

export default TaskTemplatePanel;