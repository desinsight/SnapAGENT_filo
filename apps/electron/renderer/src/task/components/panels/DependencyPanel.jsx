import React, { useState, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  LinkIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  ArrowsRightLeftIcon,
  Square3Stack3DIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

/**
 * 태스크 종속성 관리 패널
 * Microsoft Teams 스타일의 모던한 기업용 UI로 구현
 * 
 * 주요 기능:
 * - 태스크 간 종속성 생성 및 관리 (선행 태스크, 후행 태스크)
 * - 종속성 유형 설정 (끝-시작, 시작-시작, 끝-끝, 시작-끝)
 * - 종속성 지연 시간 설정 (lag/lead time)
 * - 순환 종속성 감지 및 경고
 * - 크리티컬 패스 분석 및 시각화
 * - 종속성 위반 감지 및 알림
 * - 자동 일정 조정 제안
 * - 종속성 트리/그래프 시각화
 */
const DependencyPanel = ({ 
  isOpen, 
  onClose,
  taskId, // 현재 선택된 태스크 ID
  tasks = [], // 전체 태스크 목록
  dependencies = [], // 기존 종속성 목록
  onCreateDependency,
  onUpdateDependency,
  onDeleteDependency,
  onValidateDependencies,
  onAnalyzeCriticalPath,
  onSuggestScheduleAdjustment
}) => {
  // UI 상태
  const [activeTab, setActiveTab] = useState('overview'); // overview, create, analyze, settings
  const [selectedDependency, setSelectedDependency] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [viewMode, setViewMode] = useState('tree'); // tree, graph, list

  // 종속성 생성 상태
  const [newDependency, setNewDependency] = useState({
    fromTaskId: taskId || '',
    toTaskId: '',
    type: 'finish_to_start', // finish_to_start, start_to_start, finish_to_finish, start_to_finish
    lagDays: 0, // 지연 일수 (양수: 지연, 음수: 앞당김)
    lagHours: 0,
    description: '',
    isOptional: false, // 선택적 종속성 여부
    priority: 'normal' // low, normal, high, critical
  });

  // 분석 결과 상태
  const [analysisResults, setAnalysisResults] = useState({
    criticalPath: [],
    circularDependencies: [],
    violations: [],
    suggestions: []
  });

  // 필터 및 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, blocking, blocked, critical
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 종속성 유형 옵션
  const dependencyTypes = [
    {
      value: 'finish_to_start',
      label: '완료-시작 (FS)',
      description: '선행 태스크가 완료된 후 후행 태스크 시작',
      icon: ArrowRightIcon,
      common: true
    },
    {
      value: 'start_to_start',
      label: '시작-시작 (SS)',
      description: '선행 태스크가 시작될 때 후행 태스크도 시작',
      icon: ArrowsRightLeftIcon,
      common: false
    },
    {
      value: 'finish_to_finish',
      label: '완료-완료 (FF)',
      description: '선행 태스크가 완료될 때 후행 태스크도 완료',
      icon: CheckCircleIcon,
      common: false
    },
    {
      value: 'start_to_finish',
      label: '시작-완료 (SF)',
      description: '선행 태스크가 시작될 때 후행 태스크 완료',
      icon: BoltIcon,
      common: false
    }
  ];

  // 우선순위 옵션
  const priorityOptions = [
    { value: 'low', label: '낮음', color: 'text-gray-500', bgColor: 'bg-gray-100' },
    { value: 'normal', label: '보통', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'high', label: '높음', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { value: 'critical', label: '중요', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  // 현재 태스크의 종속성 분석
  const currentTaskDependencies = dependencies.filter(dep => 
    dep.fromTaskId === taskId || dep.toTaskId === taskId
  );

  const blockingDependencies = dependencies.filter(dep => dep.toTaskId === taskId);
  const blockedDependencies = dependencies.filter(dep => dep.fromTaskId === taskId);

  // 태스크 검색 및 필터링
  const getAvailableTasks = useCallback(() => {
    return tasks.filter(task => 
      task.id !== taskId && 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, taskId, searchQuery]);

  // 종속성 유효성 검사
  const validateNewDependency = useCallback(() => {
    const { fromTaskId, toTaskId } = newDependency;
    
    if (!fromTaskId || !toTaskId) {
      return { isValid: false, error: '선행 태스크와 후행 태스크를 모두 선택해주세요.' };
    }
    
    if (fromTaskId === toTaskId) {
      return { isValid: false, error: '태스크는 자기 자신에게 종속될 수 없습니다.' };
    }
    
    // 기존 종속성 중복 확인
    const exists = dependencies.some(dep => 
      dep.fromTaskId === fromTaskId && dep.toTaskId === toTaskId
    );
    
    if (exists) {
      return { isValid: false, error: '이미 존재하는 종속성입니다.' };
    }
    
    // 순환 종속성 검사 (간단한 직접 순환만 체크)
    const wouldCreateCycle = dependencies.some(dep => 
      dep.fromTaskId === toTaskId && dep.toTaskId === fromTaskId
    );
    
    if (wouldCreateCycle) {
      return { isValid: false, error: '순환 종속성이 감지되었습니다.' };
    }
    
    return { isValid: true };
  }, [newDependency, dependencies, taskId]);

  // 종속성 생성
  const handleCreateDependency = useCallback(async () => {
    const validation = validateNewDependency();
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    try {
      await onCreateDependency?.(newDependency);
      
      // 상태 초기화
      setNewDependency({
        fromTaskId: taskId || '',
        toTaskId: '',
        type: 'finish_to_start',
        lagDays: 0,
        lagHours: 0,
        description: '',
        isOptional: false,
        priority: 'normal'
      });
      
      setActiveTab('overview');
    } catch (error) {
      console.error('종속성 생성 실패:', error);
      alert('종속성 생성 중 오류가 발생했습니다.');
    }
  }, [newDependency, validateNewDependency, onCreateDependency, taskId]);

  // 크리티컬 패스 분석
  const analyzeCriticalPath = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const results = await onAnalyzeCriticalPath?.(taskId);
      setAnalysisResults(prev => ({
        ...prev,
        criticalPath: results?.criticalPath || [],
        suggestions: results?.suggestions || []
      }));
    } catch (error) {
      console.error('크리티컬 패스 분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [taskId, onAnalyzeCriticalPath]);

  // 종속성 위반 검사
  const validateDependencies = useCallback(async () => {
    try {
      const results = await onValidateDependencies?.(taskId);
      setAnalysisResults(prev => ({
        ...prev,
        violations: results?.violations || [],
        circularDependencies: results?.circularDependencies || []
      }));
    } catch (error) {
      console.error('종속성 검증 실패:', error);
    }
  }, [taskId, onValidateDependencies]);

  // 그룹 확장/축소
  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  // 태스크 이름 조회
  const getTaskName = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || `태스크 ${taskId}`;
  }, [tasks]);

  // 종속성 타입 라벨 조회
  const getDependencyTypeLabel = useCallback((type) => {
    const depType = dependencyTypes.find(dt => dt.value === type);
    return depType?.label || type;
  }, []);

  // 지연 시간 포맷팅
  const formatLagTime = useCallback((lagDays, lagHours) => {
    const totalHours = lagDays * 24 + lagHours;
    if (totalHours === 0) return '즉시';
    if (totalHours > 0) return `+${lagDays}일 ${lagHours}시간`;
    return `${lagDays}일 ${lagHours}시간`;
  }, []);

  useEffect(() => {
    if (isOpen && taskId) {
      validateDependencies();
    }
  }, [isOpen, taskId, validateDependencies]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                태스크 종속성 관리
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {taskId ? `"${getTaskName(taskId)}" 태스크의 종속성` : '태스크 종속성 분석'}
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
            <div className="p-4">
              <div className="space-y-1">
                {[
                  { id: 'overview', label: '종속성 개요', icon: Square3Stack3DIcon },
                  { id: 'create', label: '종속성 생성', icon: PlusIcon },
                  { id: 'analyze', label: '분석 및 최적화', icon: AdjustmentsHorizontalIcon },
                  { id: 'settings', label: '설정', icon: AdjustmentsHorizontalIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 요약 정보 */}
              {taskId && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    종속성 요약
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">차단 중</span>
                      <span className="font-medium text-gray-900 dark:text-white">{blockedDependencies.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">차단됨</span>
                      <span className="font-medium text-gray-900 dark:text-white">{blockingDependencies.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">총 종속성</span>
                      <span className="font-medium text-gray-900 dark:text-white">{currentTaskDependencies.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {/* 종속성 개요 탭 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <ArrowDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">차단 중</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{blockedDependencies.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">차단됨</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{blockingDependencies.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">총 종속성</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dependencies.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <ShieldExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">위반</p>
                          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{analysisResults.violations.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 차단 중인 태스크들 */}
                  {blockedDependencies.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => toggleGroup('blocking')}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <ArrowDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            이 태스크가 차단하고 있는 태스크들 ({blockedDependencies.length})
                          </span>
                        </div>
                        {expandedGroups.blocking ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedGroups.blocking && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {blockedDependencies.map((dep, index) => (
                            <div key={index} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {getTaskName(dep.toTaskId)}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                      {getDependencyTypeLabel(dep.type)}
                                    </span>
                                    {dep.lagDays !== 0 || dep.lagHours !== 0 ? (
                                      <span className="text-xs text-orange-600 dark:text-orange-400">
                                        {formatLagTime(dep.lagDays, dep.lagHours)}
                                      </span>
                                    ) : null}
                                  </div>
                                  {dep.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dep.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => onDeleteDependency?.(dep.id)}
                                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 차단하고 있는 태스크들 */}
                  {blockingDependencies.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => toggleGroup('blocked')}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            이 태스크를 차단하고 있는 태스크들 ({blockingDependencies.length})
                          </span>
                        </div>
                        {expandedGroups.blocked ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedGroups.blocked && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {blockingDependencies.map((dep, index) => (
                            <div key={index} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {getTaskName(dep.fromTaskId)}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                      {getDependencyTypeLabel(dep.type)}
                                    </span>
                                    {dep.lagDays !== 0 || dep.lagHours !== 0 ? (
                                      <span className="text-xs text-orange-600 dark:text-orange-400">
                                        {formatLagTime(dep.lagDays, dep.lagHours)}
                                      </span>
                                    ) : null}
                                  </div>
                                  {dep.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dep.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => onDeleteDependency?.(dep.id)}
                                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 위반 사항 */}
                  {analysisResults.violations.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">종속성 위반 감지</h3>
                          <ul className="space-y-1">
                            {analysisResults.violations.map((violation, index) => (
                              <li key={index} className="text-sm text-red-700 dark:text-red-300">
                                • {violation.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 종속성 생성 탭 */}
              {activeTab === 'create' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">새 종속성 생성</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* 선행 태스크 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          선행 태스크 (먼저 완료되어야 할 태스크)
                        </label>
                        <select
                          value={newDependency.fromTaskId}
                          onChange={(e) => setNewDependency(prev => ({ ...prev, fromTaskId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">선행 태스크 선택</option>
                          {tasks.filter(t => t.id !== newDependency.toTaskId).map(task => (
                            <option key={task.id} value={task.id}>{task.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* 후행 태스크 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          후행 태스크 (나중에 시작될 태스크)
                        </label>
                        <select
                          value={newDependency.toTaskId}
                          onChange={(e) => setNewDependency(prev => ({ ...prev, toTaskId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">후행 태스크 선택</option>
                          {tasks.filter(t => t.id !== newDependency.fromTaskId).map(task => (
                            <option key={task.id} value={task.id}>{task.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 종속성 유형 */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        종속성 유형
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {dependencyTypes.map(type => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.value}
                              onClick={() => setNewDependency(prev => ({ ...prev, type: type.value }))}
                              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                newDependency.type === type.value
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <Icon className={`w-5 h-5 mt-0.5 ${
                                  newDependency.type === type.value 
                                    ? 'text-purple-600 dark:text-purple-400' 
                                    : 'text-gray-400'
                                }`} />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`font-medium ${
                                      newDependency.type === type.value 
                                        ? 'text-purple-900 dark:text-purple-100' 
                                        : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {type.label}
                                    </span>
                                    {type.common && (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        일반적
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 지연 시간 설정 */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          지연 일수
                        </label>
                        <input
                          type="number"
                          value={newDependency.lagDays}
                          onChange={(e) => setNewDependency(prev => ({ ...prev, lagDays: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          양수: 지연, 음수: 앞당김
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          지연 시간
                        </label>
                        <input
                          type="number"
                          value={newDependency.lagHours}
                          onChange={(e) => setNewDependency(prev => ({ ...prev, lagHours: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0"
                          min="0"
                          max="23"
                        />
                      </div>
                    </div>

                    {/* 우선순위 및 옵션 */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          우선순위
                        </label>
                        <select
                          value={newDependency.priority}
                          onChange={(e) => setNewDependency(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newDependency.isOptional}
                            onChange={(e) => setNewDependency(prev => ({ ...prev, isOptional: e.target.checked }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">선택적 종속성</span>
                        </label>
                      </div>
                    </div>

                    {/* 설명 */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        설명 (선택사항)
                      </label>
                      <textarea
                        value={newDependency.description}
                        onChange={(e) => setNewDependency(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="종속성에 대한 추가 설명..."
                      />
                    </div>

                    {/* 생성 버튼 */}
                    <div className="mt-6">
                      <button
                        onClick={handleCreateDependency}
                        disabled={!newDependency.fromTaskId || !newDependency.toTaskId}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                      >
                        종속성 생성
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 분석 및 최적화 탭 */}
              {activeTab === 'analyze' && (
                <div className="space-y-6">
                  {/* 분석 도구 */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">분석 도구</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={analyzeCriticalPath}
                        disabled={isAnalyzing}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <BoltIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">크리티컬 패스</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">최장 경로 분석</p>
                      </button>

                      <button
                        onClick={validateDependencies}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ShieldExclamationIcon className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">위반 검사</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">순환 및 충돌 검사</p>
                      </button>

                      <button
                        onClick={() => onSuggestScheduleAdjustment?.(taskId)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">일정 최적화</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">자동 조정 제안</p>
                      </button>
                    </div>
                  </div>

                  {/* 크리티컬 패스 결과 */}
                  {analysisResults.criticalPath.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4">
                        크리티컬 패스
                      </h3>
                      <div className="space-y-2">
                        {analysisResults.criticalPath.map((taskId, index) => (
                          <div key={taskId} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center text-xs font-medium text-orange-800 dark:text-orange-200">
                              {index + 1}
                            </div>
                            <span className="text-orange-900 dark:text-orange-100">{getTaskName(taskId)}</span>
                            {index < analysisResults.criticalPath.length - 1 && (
                              <ArrowRightIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 최적화 제안 */}
                  {analysisResults.suggestions.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                        최적화 제안
                      </h3>
                      <ul className="space-y-2">
                        {analysisResults.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <span className="text-blue-900 dark:text-blue-100">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 설정 탭 */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">종속성 설정</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">자동 일정 조정 허용</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">순환 종속성 자동 감지</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">종속성 위반 알림</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  종속성 관리를 통해 프로젝트 일정을 체계적으로 관리하세요
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependencyPanel;