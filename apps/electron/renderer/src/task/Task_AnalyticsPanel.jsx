/**
 * Task_AnalyticsPanel - 태스크 분석 메인 패널
 * 
 * @description
 * Microsoft Teams 스타일의 모던하고 전문적인 분석 대시보드입니다.
 * 태스크, 프로젝트, 팀의 성과를 시각화하고 AI 기반 인사이트를 제공합니다.
 * 
 * @features
 * - 헤더 기반 탭 네비게이션 (Overview, Productivity, Performance, Workload, Team, Time, AI Insights)
 * - 실시간 KPI 카드와 차트 위젯
 * - AI 기반 인사이트 카드
 * - 기간 필터 및 데이터 내보내기
 * - 다크 모드 지원
 * - 반응형 디자인
 * 
 * @author AI Assistant
 * @version 3.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  CogIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  CubeIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon 
} from '@heroicons/react/24/solid';

// 분석 컴포넌트 import
import KPICard from './components/analytics/KPICard';
import ChartWidget from './components/analytics/ChartWidget';
import InsightCard from './components/analytics/InsightCard';

// 훅 import
import useAnalytics from './hooks/useAnalytics';
/**
 * 탭 네비게이션 정의
 * 각 탭은 분석의 다른 측면을 다룹니다
 */
const ANALYTICS_TABS = [
  { 
    id: 'overview', 
    label: '대시보드', 
    icon: Squares2X2Icon
  },
  { 
    id: 'productivity', 
    label: '생산성', 
    icon: ArrowTrendingUpIcon
  },
  { 
    id: 'performance', 
    label: '성과 지표', 
    icon: ChartBarSquareIcon
  },
  { 
    id: 'workload', 
    label: '업무 분배', 
    icon: CubeIcon
  },
  { 
    id: 'team', 
    label: '팀 현황', 
    icon: UserGroupIcon
  },
  { 
    id: 'reports', 
    label: '리포트', 
    icon: DocumentChartBarIcon
  }
];

/**
 * 기간 필터 옵션
 */
const PERIOD_OPTIONS = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '3개월' },
  { value: '1y', label: '1년' },
  { value: 'custom', label: '사용자 지정' }
];

const TaskAnalyticsPanel = ({ 
  activePanel, 
  onNotification, 
  children,
  tasks = [],
  projects = [],
  users = []
}) => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, chart
  const [showFilters, setShowFilters] = useState(false);

  // 커스텀 훅으로 분석 데이터 관리
  const {
    kpiData,
    chartData,
    insights,
    loading,
    refreshData
  } = useAnalytics({
    tasks,
    projects,
    users,
    period: selectedPeriod
  });

  // 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      onNotification?.('데이터가 새로고침되었습니다.', 'success');
    } catch (error) {
      onNotification?.('데이터 새로고침에 실패했습니다.', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [refreshData, onNotification]);

  // 내보내기 핸들러
  const handleExport = useCallback((format) => {
    onNotification?.(`${format.toUpperCase()} 파일로 내보내기를 시작합니다.`, 'info');
    setShowExportOptions(false);
    
    // 실제 내보내기 로직은 여기에 구현
    setTimeout(() => {
      onNotification?.(`${format.toUpperCase()} 파일 내보내기가 완료되었습니다.`, 'success');
    }, 2000);
  }, [onNotification]);

  // Mock 데이터 - 실용적이고 깔끔한 스타일
  const mockKPIData = useMemo(() => [
    {
      title: 'Completed Tasks',
      subtitle: '완료된 작업',
      value: Math.floor((tasks.length || 156) * 0.68),
      change: '+12%',
      trend: 'up',
      icon: CheckIcon,
      color: 'slate'
    },
    {
      title: 'Avg Processing Time',
      subtitle: '평균 처리시간',
      value: '3.2일',
      change: '-18%',
      trend: 'up',
      icon: ClockIcon,
      color: 'slate'
    },
    {
      title: 'Team Efficiency',
      subtitle: '팀 효율성',
      value: '87%',
      change: '+5%',
      trend: 'up',
      icon: BoltIcon,
      color: 'slate'
    },
    {
      title: 'Progress Rate',
      subtitle: '진행률',
      value: '64%',
      change: '+8%',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'slate'
    }
  ], [tasks]);

  const mockInsights = useMemo(() => [
    {
      type: 'info',
      title: 'Goal Achievement',
      subtitle: '목표 초과 달성',
      description: '이번 달 작업 완료율이 목표 대비 15% 상회했습니다.',
      metadata: {
        confidence: 5,
        source: 'Performance Analysis',
        timestamp: new Date(Date.now() - 30 * 60000)
      },
      actions: [
        { label: 'Details', variant: 'primary', onClick: () => setActiveTab('performance'), showArrow: true }
      ]
    },
    {
      type: 'warning',
      title: 'Workload Imbalance',
      subtitle: '업무 불균형 감지',
      description: '개발팀 업무량이 다른 팀 대비 30% 높은 상태입니다.',
      metadata: {
        confidence: 4,
        source: 'Workload Analysis',
        timestamp: new Date(Date.now() - 60 * 60000)
      },
      actions: [
        { label: 'Check Distribution', variant: 'primary', onClick: () => setActiveTab('workload'), showArrow: true }
      ]
    },
    {
      type: 'info',
      title: 'Efficiency Improvement',
      subtitle: '효율성 개선',
      description: '자동화 도구 도입으로 처리 시간이 25% 단축되었습니다.',
      priority: 'normal',
      metadata: {
        confidence: 5,
        source: 'AI Analysis',
        timestamp: new Date(Date.now() - 10 * 60000)
      },
      actions: [
        { label: 'View Results', variant: 'primary', onClick: () => setActiveTab('insights'), showArrow: true }
      ]
    }
  ], [setActiveTab]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* 컴팩트 헤더 - Teams 스타일 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* 상단 툴바 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{tasks.length} Tasks</span>
              <span>•</span>
              <span>{projects.length} Projects</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 컴팩트 기간 선택 */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label}</span>
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  {PERIOD_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedPeriod(option.value);
                        setShowPeriodDropdown(false);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              className={`p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button onClick={() => handleExport('pdf')} className="w-full px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">PDF</button>
                  <button onClick={() => handleExport('excel')} className="w-full px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Excel</button>
                  <button onClick={() => handleExport('csv')} className="w-full px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">CSV</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 컴팩트 탭 네비게이션 */}
        <div className="px-6 py-2">
          <div className="flex space-x-1">
            {ANALYTICS_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 - 풀 위드 레이아웃 */}
      <div className="flex-1 overflow-auto">
        <div className="h-full px-6 py-4">
          {renderTabContent()}
        </div>
      </div>
      
      {children}
    </div>
  );

  /**
   * 탭별 컨텐츠 렌더링 함수
   * 각 탭에 맞는 분석 뷰를 렌더링합니다
   */
  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'productivity':
        return renderProductivityTab();
      case 'performance':
        return renderPerformanceTab();
      case 'workload':
        return renderWorkloadTab();
      case 'team':
        return renderTeamTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderOverviewTab();
    }
  }

  /**
   * 개요 탭 렌더링 - 새로운 모던 레이아웃
   */
  function renderOverviewTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 상단 KPI 스트립 */}
        <div className="grid grid-cols-4 gap-4">
          {mockKPIData.map((kpi, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <kpi.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{kpi.title}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</div>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </span>
                    <span className="text-xs text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 메인 차트 영역 - Teams 스타일 가로 레이아웃 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          {/* 메인 차트 - 8컬럼 */}
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Task Completion Trend</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monthly progress overview</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">View Details</button>
              </div>
            </div>
            <div className="p-4 h-64">
              <ChartWidget
                title=""
                subtitle=""
                type="line"
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Completed Tasks',
                    data: [65, 78, 90, 85, 92, 108],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  }]
                }}
                loading={loading}
                height="sm"
              />
            </div>
          </div>
          
          {/* 사이드 패널 - 4컬럼 */}
          <div className="col-span-4 space-y-4">
            {/* 팀 분포 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Team Distribution</h4>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Development</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Design</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Marketing</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Operations</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">20%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-xs text-gray-900 dark:text-white font-medium">Task completed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-xs text-gray-900 dark:text-white font-medium">New project started</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-xs text-gray-900 dark:text-white font-medium">Team meeting scheduled</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 인사이트 스트립 */}
        <div className="grid grid-cols-3 gap-4">
          {mockInsights.map((insight, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  insight.type === 'warning' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {insight.type}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
              <button 
                onClick={insight.actions[0]?.onClick}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {insight.actions[0]?.label} →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * 생산성 탭 렌더링
   */
  function renderProductivityTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 상단 메트릭 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BoltIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Velocity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">8.5</p>
                <p className="text-xs text-green-600">+12% this week</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Response Time</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">2.3h</p>
                <p className="text-xs text-blue-600">-15% improved</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Focus Score</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">92%</p>
                <p className="text-xs text-purple-600">+5% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Productivity Trends</h3>
            </div>
            <div className="p-4">
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Productivity Chart Placeholder</p>
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Top Performers</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">John Smith</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Sarah Johnson</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Mike Chen</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">91%</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recommendations</h4>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">• Schedule shorter meetings</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Implement focus blocks</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Reduce context switching</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 성과 탭 렌더링
   */
  function renderPerformanceTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* KPI 요약 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Revenue Growth</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+23%</p>
              <p className="text-xs text-gray-500">vs last quarter</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">94%</p>
              <p className="text-xs text-gray-500">+2% this month</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Market Share</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">18.5%</p>
              <p className="text-xs text-gray-500">+1.2% growth</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Team Performance</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">87%</p>
              <p className="text-xs text-gray-500">above target</p>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Trends</h3>
            </div>
            <div className="p-4">
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Performance Chart Placeholder</p>
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Goal Progress</h4>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Q4 Revenue</span>
                    <span className="text-gray-900 dark:text-white font-medium">89%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Customer Retention</span>
                    <span className="text-gray-900 dark:text-white font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Product Launch</span>
                    <span className="text-gray-900 dark:text-white font-medium">76%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '76%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 업무량 탭 렌더링
   */
  function renderWorkloadTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 팀별 업무량 요약 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Development</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-xs text-blue-600">32 active tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CubeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Design</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">5</p>
                <p className="text-xs text-purple-600">18 active tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ChartBarSquareIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Marketing</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
                <p className="text-xs text-green-600">12 active tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CogIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Operations</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">3</p>
                <p className="text-xs text-orange-600">8 active tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Workload Distribution</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Dev</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Development Team</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">8 members • 32 tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">85%</p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">UI</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Design Team</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">5 members • 18 tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">72%</p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '72%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MK</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Marketing Team</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">4 members • 12 tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">60%</p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">OP</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Operations Team</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">3 members • 8 tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">45%</p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Overloaded Members</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">JS</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">John Smith</span>
                  </div>
                  <span className="text-xs font-medium text-red-600">120%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Mike Chen</span>
                  </div>
                  <span className="text-xs font-medium text-yellow-600">95%</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recommendations</h4>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">• Redistribute tasks from Dev team</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Consider hiring for Marketing</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Review John Smith's workload</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 팀 분석 탭 렌더링
   */
  function renderTeamTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 팀 성과 요약 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Team Efficiency</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">87%</p>
              <p className="text-xs text-gray-500">Overall average</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Active Members</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">20</p>
              <p className="text-xs text-gray-500">out of 23 total</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Collaboration Score</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">92%</p>
              <p className="text-xs text-gray-500">+8% this month</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Meetings This Week</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">12</p>
              <p className="text-xs text-gray-500">-3 vs last week</p>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Performance Overview</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Dev</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Development Team</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">8 Members • 32 Active Tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">95%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">28</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">UI</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Design Team</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">5 Members • 18 Active Tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">88%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">15</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">MK</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Marketing Team</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">4 Members • 12 Active Tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">91%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">10</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Top Contributors</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">JS</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">John Smith</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SJ</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Sarah Johnson</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Mike Chen</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">91%</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Team Actions</h4>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  Schedule Meeting
                </button>
                <button className="w-full p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50">
                  View Timesheets
                </button>
                <button className="w-full p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 리포트 탭 렌더링
   */
  function renderReportsTab() {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 리포트 타입별 요약 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Weekly Reports</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-xs text-blue-600">3 scheduled</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Performance</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-xs text-green-600">2 pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TableCellsIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Custom Exports</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">24</p>
                <p className="text-xs text-purple-600">5 this week</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Auto Reports</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">6</p>
                <p className="text-xs text-orange-600">daily/weekly</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Available Reports</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <DocumentChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Summary</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Task progress & team performance</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last generated: 2 hours ago</span>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Generate</button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Report</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Individual & team metrics</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last generated: 1 day ago</span>
                    <button className="text-xs text-green-600 hover:text-green-700 font-medium">Generate</button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TableCellsIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Custom Export</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Configurable data export</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Templates: 5 available</span>
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">Configure</button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Time Tracking</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hours spent & productivity</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Auto-scheduled: Daily</span>
                    <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">View</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Reports</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Weekly Summary</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">View</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Performance Q4</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">View</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Team Metrics</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 days ago</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">View</button>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h4>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  Generate Summary
                </button>
                <button className="w-full p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50">
                  Export Data
                </button>
                <button className="w-full p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50">
                  Schedule Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default TaskAnalyticsPanel;