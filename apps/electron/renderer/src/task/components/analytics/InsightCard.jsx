/**
 * InsightCard - AI 인사이트 및 알림 카드 컴포넌트
 * 
 * @description
 * Microsoft Teams 스타일의 모던한 인사이트 카드입니다.
 * AI 분석 결과, 중요한 알림, 성과 지표 등을 시각적으로 표현하며,
 * 전문적이고 직관적인 디자인으로 비즈니스 인사이트를 효과적으로 전달합니다.
 * 
 * @features
 * - 다양한 인사이트 타입 지원 (성공, 경고, 정보, 트렌드 등)
 * - 신뢰도 표시 및 메타데이터 지원
 * - 액션 버튼 및 인터랙션
 * - 애니메이션 및 호버 효과
 * - 다크 모드 지원
 * - 접근성 고려
 * 
 * @author AI Assistant
 * @version 2.0.0
 */

import React from 'react';
import {
  LightBulbIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FireIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

/**
 * 인사이트 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.type - 인사이트 타입
 * @param {string} props.title - 카드 제목
 * @param {string} props.description - 상세 설명
 * @param {React.Component} props.icon - 커스텀 아이콘
 * @param {Object} props.metadata - 메타데이터
 * @param {Array} props.actions - 액션 버튼들
 * @param {Function} props.onDismiss - 닫기 핸들러
 * @param {Function} props.onClick - 클릭 핸들러
 * @param {boolean} props.dismissible - 닫기 가능 여부
 */
const InsightCard = ({
  type = 'info',
  title,
  description,
  icon: CustomIcon,
  metadata,
  actions = [],
  onDismiss,
  onClick,
  dismissible = false,
  priority = 'normal', // low, normal, high, urgent
  className = ''
}) => {
  // 타입별 설정 - Microsoft Teams 컬러 팔레트
  const typeConfigs = {
    success: {
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
      border: 'border-emerald-200 dark:border-emerald-700',
      icon: StarIcon,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      titleColor: 'text-emerald-900 dark:text-emerald-100',
      descColor: 'text-emerald-700 dark:text-emerald-300',
      accent: 'bg-emerald-500'
    },
    warning: {
      gradient: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      border: 'border-amber-200 dark:border-amber-700',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      titleColor: 'text-amber-900 dark:text-amber-100',
      descColor: 'text-amber-700 dark:text-amber-300',
      accent: 'bg-amber-500'
    },
    error: {
      gradient: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-700',
      icon: FireIcon,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      titleColor: 'text-red-900 dark:text-red-100',
      descColor: 'text-red-700 dark:text-red-300',
      accent: 'bg-red-500'
    },
    info: {
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-700',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      titleColor: 'text-blue-900 dark:text-blue-100',
      descColor: 'text-blue-700 dark:text-blue-300',
      accent: 'bg-blue-500'
    },
    trend_up: {
      gradient: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border-green-200 dark:border-green-700',
      icon: ArrowTrendingUpIcon,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      titleColor: 'text-green-900 dark:text-green-100',
      descColor: 'text-green-700 dark:text-green-300',
      accent: 'bg-green-500'
    },
    trend_down: {
      gradient: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20',
      border: 'border-rose-200 dark:border-rose-700',
      icon: ArrowTrendingDownIcon,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      titleColor: 'text-rose-900 dark:text-rose-100',
      descColor: 'text-rose-700 dark:text-rose-300',
      accent: 'bg-rose-500'
    },
    ai_insight: {
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border-purple-200 dark:border-purple-700',
      icon: SparklesIcon,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      titleColor: 'text-purple-900 dark:text-purple-100',
      descColor: 'text-purple-700 dark:text-purple-300',
      accent: 'bg-purple-500'
    },
    performance: {
      gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
      border: 'border-indigo-200 dark:border-indigo-700',
      icon: BoltIcon,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
      titleColor: 'text-indigo-900 dark:text-indigo-100',
      descColor: 'text-indigo-700 dark:text-indigo-300',
      accent: 'bg-indigo-500'
    }
  };

  const config = typeConfigs[type] || typeConfigs.info;
  const IconComponent = CustomIcon || config.icon;

  // 우선순위별 스타일
  const priorityStyles = {
    urgent: 'animate-pulse shadow-lg',
    high: 'shadow-md',
    normal: '',
    low: 'opacity-90'
  };

  const priorityIndicator = {
    urgent: <FireIconSolid className="w-4 h-4 text-red-500 animate-bounce" />,
    high: <StarIconSolid className="w-4 h-4 text-orange-500" />,
    normal: null,
    low: null
  };

  return (
    <div 
      className={`
        relative ${config.gradient} border ${config.border} rounded-xl p-6 
        transition-all duration-300 hover:shadow-lg hover:scale-[1.02] 
        ${onClick ? 'cursor-pointer' : ''} 
        ${priorityStyles[priority]}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {/* 우선순위 액센트 바 */}
      {(priority === 'urgent' || priority === 'high') && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${config.accent} rounded-t-xl`} />
      )}
      
      {/* 닫기 버튼 */}
      {dismissible && onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
          aria-label="인사이트 카드 닫기"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start space-x-4">
        {/* 아이콘 영역 */}
        <div className={`flex-shrink-0 p-3 ${config.iconBg} rounded-xl`}>
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 min-w-0">
          {/* 제목과 우선순위 */}
          <div className="flex items-center space-x-2 mb-2">
            <h4 className={`font-semibold text-base ${config.titleColor} leading-tight`}>
              {title}
            </h4>
            {priorityIndicator[priority]}
          </div>
          
          {/* 설명 */}
          {description && (
            <p className={`text-sm ${config.descColor} leading-relaxed mb-4`}>
              {description}
            </p>
          )}

          {/* 메타데이터 */}
          {metadata && (
            <div className="space-y-2 mb-4">
              {metadata.confidence && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    신뢰도:
                  </span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < metadata.confidence 
                            ? config.accent 
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.source && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  출처: {metadata.source}
                </div>
              )}
              
              {metadata.timestamp && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(metadata.timestamp).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          {actions.length > 0 && (
            <div className="flex items-center space-x-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick?.();
                  }}
                  className={`
                    inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium 
                    rounded-lg transition-all duration-200 
                    ${action.variant === 'primary' 
                      ? `${config.iconColor} bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <span>{action.label}</span>
                  {action.showArrow && <ArrowRightIcon className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 호버 시 글로우 효과 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default InsightCard;