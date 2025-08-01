/**
 * KPICard - 핵심 성과 지표 카드 컴포넌트
 * 
 * @description
 * Microsoft Teams 스타일의 모던하고 깔끔한 KPI 카드입니다.
 * 주요 비즈니스 메트릭을 시각적으로 효과적으로 표시하며,
 * 트렌드 정보와 함께 인사이트를 제공합니다.
 * 
 * @features
 * - 깔끔하고 전문적인 디자인
 * - 트렌드 표시 (상승/하락/중립)
 * - 색상 테마 지원
 * - 로딩 상태 애니메이션
 * - 호버 효과 및 인터랙션
 * - 다크 모드 지원
 * 
 * @author AI Assistant
 * @version 2.0.0
 */

import React from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/20/solid';

/**
 * KPI 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.title - KPI 제목
 * @param {string|number} props.value - 주요 값
 * @param {string} props.change - 변화량 (예: "+12%", "-5%")
 * @param {string} props.trend - 트렌드 방향 ('up', 'down', 'neutral')
 * @param {React.Component} props.icon - 아이콘 컴포넌트
 * @param {string} props.color - 색상 테마
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.description - 추가 설명
 * @param {Function} props.onClick - 클릭 핸들러
 */
const KPICard = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'emerald',
  loading = false,
  description,
  onClick
}) => {
  // 색상 테마 정의 - Microsoft Teams 스타일
  const colorThemes = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      accent: 'bg-emerald-600'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-600'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      accent: 'bg-purple-600'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      accent: 'bg-orange-600'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      accent: 'bg-red-600'
    }
  };

  const theme = colorThemes[color] || colorThemes.emerald;

  // 트렌드 아이콘 및 색상 결정
  const getTrendDisplay = () => {
    if (!change) return null;

    const trendConfig = {
      up: {
        icon: ArrowUpIcon,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
      },
      down: {
        icon: ArrowDownIcon,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30'
      },
      neutral: {
        icon: MinusIcon,
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700/30'
      }
    };

    const config = trendConfig[trend] || trendConfig.neutral;
    const TrendIcon = config.icon;

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color} ${config.bgColor}`}>
        <TrendIcon className="w-3 h-3 mr-1" />
        {change}
      </div>
    );
  };

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-32">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
        p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      {/* 상단 액센트 바 */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.accent} rounded-t-xl`}></div>
      
      {/* 헤더 영역 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {/* KPI 제목 */}
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
            {title}
          </h3>
          
          {/* 메인 값 */}
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
          </div>
        </div>
        
        {/* 아이콘 */}
        {Icon && (
          <div className={`flex-shrink-0 p-2 ${theme.iconBg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${theme.iconColor}`} />
          </div>
        )}
      </div>
      
      {/* 하단 트렌드 및 설명 영역 */}
      <div className="flex items-center justify-between">
        {/* 트렌드 표시 */}
        <div className="flex items-center space-x-2">
          {getTrendDisplay()}
        </div>
        
        {/* 추가 설명 */}
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24">
            {description}
          </span>
        )}
      </div>
      
      {/* 호버 효과를 위한 오버레이 */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 dark:to-gray-700/20 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none"></div>
      )}
    </div>
  );
};

export default KPICard;