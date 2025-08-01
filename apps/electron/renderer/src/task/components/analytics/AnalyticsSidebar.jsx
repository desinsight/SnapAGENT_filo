import React from 'react';
import {
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  FlagIcon,
  ClockIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CubeIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

/**
 * 분석 패널 사이드바 컴포넌트
 * 분석 섹션 간 네비게이션 제공
 * 
 * @param {Object} props
 * @param {string} props.activeSection - 현재 활성 섹션
 * @param {Function} props.onSectionChange - 섹션 변경 핸들러
 * @param {Object} props.sectionCounts - 각 섹션별 카운트 정보
 * @param {boolean} props.collapsed - 사이드바 축소 상태
 */
const AnalyticsSidebar = ({
  activeSection,
  onSectionChange,
  sectionCounts = {},
  collapsed = false
}) => {
  const sections = [
    {
      id: 'overview',
      label: '전체 개요',
      icon: DocumentChartBarIcon,
      description: '핵심 지표와 트렌드',
      count: sectionCounts.overview
    },
    {
      id: 'productivity',
      label: '생산성 분석',
      icon: ArrowTrendingUpIcon,
      description: '개인 및 팀 생산성',
      count: sectionCounts.productivity
    },
    {
      id: 'team',
      label: '팀 성과',
      icon: UserGroupIcon,
      description: '팀원별 성과 분석',
      count: sectionCounts.team
    },
    {
      id: 'projects',
      label: '프로젝트 상태',
      icon: FlagIcon,
      description: '프로젝트 진행 현황',
      count: sectionCounts.projects
    },
    {
      id: 'time',
      label: '시간 분석',
      icon: ClockIcon,
      description: '시간 사용 패턴',
      count: sectionCounts.time
    },
    {
      id: 'workload',
      label: '업무량 분석',
      icon: CubeIcon,
      description: '업무 분배 및 균형',
      count: sectionCounts.workload
    },
    {
      id: 'performance',
      label: '성과 지표',
      icon: BoltIcon,
      description: 'KPI 및 목표 달성률',
      count: sectionCounts.performance
    },
    {
      id: 'reports',
      label: '리포트',
      icon: PresentationChartLineIcon,
      description: '커스텀 리포트 관리',
      count: sectionCounts.reports
    },
    {
      id: 'settings',
      label: '설정',
      icon: Cog6ToothIcon,
      description: '대시보드 설정',
      count: sectionCounts.settings
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        {/* 섹션 제목 */}
        {!collapsed && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                분석 메뉴
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              다양한 관점에서 데이터를 분석하세요
            </p>
          </div>
        )}

        {/* 네비게이션 섹션들 */}
        <div className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors group ${
                  isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title={collapsed ? section.label : ''}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  isActive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`} />
                
                {!collapsed && (
                  <>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {section.label}
                        </span>
                        {section.count && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {section.count}
                          </span>
                        )}
                      </div>
                      
                      {section.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* 빠른 통계 (축소되지 않은 경우) */}
        {!collapsed && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              빠른 통계
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">총 대시보드</span>
                <span className="font-medium text-gray-900 dark:text-white">12</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">활성 위젯</span>
                <span className="font-medium text-gray-900 dark:text-white">28</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">마지막 업데이트</span>
                <span className="font-medium text-gray-900 dark:text-white">2분 전</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSidebar;