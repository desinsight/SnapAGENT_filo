import React from 'react';
import { FiTool, FiCheckCircle, FiXCircle, FiLoader, FiLock } from 'react-icons/fi';

/**
 * Tool 실행 상태를 표시하는 컴포넌트
 */
export const ToolExecutionDisplay = ({ toolExecutions = [] }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <FiLoader className="animate-spin text-blue-500" />;
      case 'success':
        return <FiCheckCircle className="text-green-500" />;
      case 'error':
        return <FiXCircle className="text-red-500" />;
      case 'subscription_required':
        return <FiLock className="text-yellow-500" />;
      default:
        return <FiTool className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return '실행 중...';
      case 'success':
        return '완료';
      case 'error':
        return '오류';
      case 'subscription_required':
        return '구독 필요';
      default:
        return '대기';
    }
  };

  if (toolExecutions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-700">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
        <FiTool className="mr-1" />
        도구 실행 상태
      </h4>
      <div className="space-y-2">
        {toolExecutions.map((execution, index) => (
          <div
            key={execution.id || index}
            className="flex items-start space-x-2 text-xs"
          >
            <div className="mt-0.5">
              {getStatusIcon(execution.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                  {execution.toolName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {getStatusText(execution.status)}
                </span>
              </div>
              {execution.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {execution.description}
                </p>
              )}
              {execution.status === 'error' && execution.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                  오류: {execution.error}
                </p>
              )}
              {execution.status === 'subscription_required' && (
                <div className="mt-1">
                  <a
                    href={execution.subscriptionUrl || '#'}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      // 구독 모달이나 페이지 열기 로직 추가
                      console.log('구독 페이지 열기:', execution.subscriptionUrl);
                    }}
                  >
                    구독하여 사용하기
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 구독 안내 배너 컴포넌트 (간단한 버전)
 */
export const SubscriptionBanner = ({ message, subscriptionUrl, trialAvailable, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
      <div className="flex items-start space-x-2">
        <FiLock className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            프리미엄 기능
          </h4>
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
            {message}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // 구독 모달이나 페이지 열기 로직
                console.log('구독 페이지 열기:', subscriptionUrl);
              }}
              className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium rounded hover:from-yellow-600 hover:to-orange-600 transition-colors"
            >
              구독하기
            </button>
            {trialAvailable && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                무료 체험 가능
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 사용 가능한 도구 목록을 표시하는 컴포넌트
 */
export const AvailableToolsIndicator = ({ toolCount = 0, onClick }) => {
  if (toolCount === 0) return null;

  return (
    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
      <button
        onClick={onClick}
        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-full text-left"
      >
        🔧 사용 가능한 도구: {toolCount}개 
        <span className="ml-1 text-blue-500">자세히 보기</span>
      </button>
    </div>
  );
};

export default {
  ToolExecutionDisplay,
  SubscriptionBanner,
  AvailableToolsIndicator
};