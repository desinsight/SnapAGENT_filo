/**
 * ChartWidget - 차트 위젯 컴포넌트
 * 
 * @description
 * Microsoft Teams 스타일의 모던한 차트 위젯입니다.
 * 다양한 차트 타입을 지원하며, 인터랙티브한 기능들을 제공합니다.
 * 전문적이고 직관적인 디자인으로 데이터 시각화를 효과적으로 표현합니다.
 * 
 * @features
 * - 다양한 차트 타입 지원 (Line, Bar, Doughnut, Area 등)
 * - 로딩 스켈레톤 애니메이션
 * - 차트 액션 (확대, 설정, 새로고침)
 * - 반응형 디자인
 * - 데이터 요약 표시
 * - 다크 모드 지원
 * 
 * @author AI Assistant
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import {
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * 차트 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.title - 차트 제목
 * @param {string} props.subtitle - 차트 부제목
 * @param {string} props.type - 차트 타입
 * @param {Object} props.data - 차트 데이터
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.height - 높이 설정
 * @param {Function} props.onExpand - 확대 핸들러
 * @param {Function} props.onConfigure - 설정 핸들러
 * @param {Function} props.onRefresh - 새로고침 핸들러
 */
const ChartWidget = ({
  title,
  subtitle,
  type = 'line',
  data,
  loading = false,
  height = 'md',
  onExpand,
  onConfigure,
  onRefresh,
  showLegend = true,
  showTooltip = true,
  className = ''
}) => {
  // 높이 설정
  const heightClasses = {
    sm: 'h-64',
    md: 'h-80',
    lg: 'h-96',
    xl: 'h-[28rem]'
  };

  const chartHeight = heightClasses[height] || heightClasses.md;

  // 차트 타입별 아이콘
  const getChartIcon = () => {
    const iconProps = { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" };
    
    switch (type) {
      case 'line':
      case 'area':
        return <ChartBarIcon {...iconProps} />;
      case 'bar':
        return <ChartBarIcon {...iconProps} />;
      case 'doughnut':
      case 'pie':
        return <ChartBarIcon {...iconProps} />;
      default:
        return <ChartBarIcon {...iconProps} />;
    }
  };

  // 로딩 스켈레톤 생성
  const LoadingSkeleton = useMemo(() => {
    switch (type) {
      case 'line':
      case 'area':
        return (
          <div className="animate-pulse h-full flex flex-col justify-end">
            <div className="relative h-full">
              {/* 그리드 라인 */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-px bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
              {/* 데이터 포인트들 */}
              <div className="absolute inset-0 flex items-end justify-between px-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <div
                      className="bg-emerald-200 dark:bg-emerald-800 rounded-full opacity-60"
                      style={{
                        height: `${Math.random() * 120 + 20}px`,
                        width: '3px'
                      }}
                    />
                    <div className="w-6 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'bar':
        return (
          <div className="animate-pulse h-full flex items-end justify-between space-x-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                <div
                  className="bg-blue-200 dark:bg-blue-800 rounded-t-sm w-full opacity-60"
                  style={{ height: `${Math.random() * 70 + 30}%` }}
                />
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        );
      
      case 'doughnut':
      case 'pie':
        return (
          <div className="animate-pulse h-full flex items-center justify-center">
            <div className="relative">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white dark:bg-gray-800 rounded-full" />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="animate-pulse h-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
        );
    }
  }, [type]);

  // 목업 차트 데이터 (실제 차트 라이브러리로 대체될 부분)
  const renderMockChart = () => {
    if (!data || loading) return null;

    switch (type) {
      case 'line':
        return (
          <div className="h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* 그리드 */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* 라인 차트 */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points="20,150 60,120 100,80 140,100 180,60 220,90 260,40 300,70 340,30 380,50"
              />
              
              {/* 데이터 포인트 */}
              {[20,60,100,140,180,220,260,300,340,380].map((x, i) => {
                const y = [150,120,80,100,60,90,40,70,30,50][i];
                return (
                  <circle key={i} cx={x} cy={y} r="4" fill="#10b981" className="hover:r-6 transition-all" />
                );
              })}
            </svg>
          </div>
        );
      
      case 'bar':
        return (
          <div className="h-full flex items-end justify-between space-x-2 px-4">
            {data.datasets?.[0]?.data?.map((value, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                <div
                  className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-sm w-full cursor-pointer"
                  style={{ height: `${(value / Math.max(...data.datasets[0].data)) * 100}%` }}
                  title={`${data.labels?.[i]}: ${value}`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {data.labels?.[i]}
                </span>
              </div>
            ))}
          </div>
        );
      
      case 'doughnut':
        return (
          <div className="h-full flex items-center justify-between">
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                  />
                  {/* 임시 세그먼트들 */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray="126 377"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray="94 409"
                    strokeDashoffset="-126"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray="63 440"
                    strokeDashoffset="-220"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.total || '100%'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      전체
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 범례 */}
            {showLegend && data.labels && (
              <div className="ml-6 space-y-3">
                {data.labels.map((label, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: data.datasets?.[0]?.backgroundColor?.[i] || '#6b7280'
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.datasets?.[0]?.data?.[i] || 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>차트를 표시할 수 없습니다</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* 차트 아이콘 */}
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            {getChartIcon()}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="새로고침"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          )}
          
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="확대 보기"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
          )}
          
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="설정"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          )}
          
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 차트 영역 */}
      <div className={`p-6 ${chartHeight}`}>
        {loading ? (
          <div className="h-full">
            {LoadingSkeleton}
          </div>
        ) : (
          <div className="h-full">
            {renderMockChart()}
          </div>
        )}
      </div>
      
      {/* 하단 인사이트 또는 요약 정보 */}
      {!loading && data?.insights && (
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mt-4">
            <InformationCircleIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {data.insights}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartWidget;