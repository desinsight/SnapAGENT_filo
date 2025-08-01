/**
 * 템플릿 목록 컴포넌트
 * 
 * @description 템플릿들을 테이블 형태로 표시하는 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { CATEGORY_INFO, COLOR_MAP } from '../../constants/templateConfig';

const TemplateList = ({
  templates,
  viewMode = 'comfortable',
  selectedTemplates,
  bulkActionMode,
  onSelectTemplate,
  onSelectAll,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  loading,
  error,
  emptyMessage
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  /**
   * 전체 선택/해제 핸들러
   */
  const handleSelectAll = useCallback((e) => {
    onSelectAll(e.target.checked);
  }, [onSelectAll]);

  /**
   * 개별 선택 핸들러
   */
  const handleSelectTemplate = useCallback((templateId, selected) => {
    onSelectTemplate(templateId, selected);
  }, [onSelectTemplate]);

  /**
   * 날짜 포맷팅
   */
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * 카테고리 배지 렌더링
   */
  const renderCategoryBadge = (category) => {
    const categoryInfo = CATEGORY_INFO[category];
    if (!categoryInfo) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[categoryInfo.color]}`}>
        <span className="mr-1">{categoryInfo.icon}</span>
        {categoryInfo.name}
      </span>
    );
  };

  /**
   * 공유 상태 배지 렌더링
   */
  const renderSharedBadge = (isShared) => {
    if (!isShared) return null;

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        👥 공유
      </span>
    );
  };

  /**
   * 액션 버튼 렌더링
   */
  const renderActionButtons = (template) => {
    return (
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEditTemplate(template)}
          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors duration-200"
          title="편집"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={() => onDuplicateTemplate(template._id)}
          className="p-1.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
          title="복제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        
        <button
          onClick={() => onDeleteTemplate(template._id)}
          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
          title="삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">템플릿을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            템플릿 로드 실패
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (templates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            템플릿이 없습니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {emptyMessage}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            '새 템플릿' 버튼을 클릭하여 첫 번째 템플릿을 만들어보세요.
          </p>
        </div>
      </div>
    );
  }

  const rowPadding = viewMode === 'compact' ? 'py-2' : viewMode === 'spacious' ? 'py-6' : 'py-4';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 일괄 작업 모드 헤더 */}
      {bulkActionMode && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTemplates.length === templates.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                전체 선택
              </span>
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTemplates.length}/{templates.length}개 선택됨
            </span>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            선택한 항목에 대해 일괄 작업을 수행할 수 있습니다.
          </div>
        </div>
      )}

      {/* 템플릿 테이블 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="min-w-full bg-white dark:bg-gray-900">
          {/* 테이블 헤더 */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-3">
              <div className="flex items-center space-x-4">
                {bulkActionMode && (
                  <div className="w-4"></div>
                )}
                <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-4">이름</div>
                  <div className="col-span-2">카테고리</div>
                  <div className="col-span-2">타입</div>
                  <div className="col-span-2">수정일</div>
                  <div className="col-span-1">사용</div>
                  <div className="col-span-1">액션</div>
                </div>
              </div>
            </div>
          </div>

          {/* 테이블 바디 */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <div
                key={template._id}
                className={`group px-6 ${rowPadding} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
                  selectedTemplates.includes(template._id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                    : ''
                }`}
                onMouseEnter={() => setHoveredTemplate(template._id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <div className="flex items-center space-x-4">
                  {/* 체크박스 */}
                  {bulkActionMode && (
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template._id)}
                        onChange={(e) => handleSelectTemplate(template._id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* 메인 컨텐츠 */}
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    {/* 이름 */}
                    <div className="col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-sm">📄</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {renderSharedBadge(template.isShared)}
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {template.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {template.tags.length > 2 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{template.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 카테고리 */}
                    <div className="col-span-2">
                      {renderCategoryBadge(template.category)}
                    </div>

                    {/* 타입 */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {template.type}
                      </span>
                    </div>

                    {/* 수정일 */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(template.updatedAt)}
                      </span>
                    </div>

                    {/* 사용 횟수 */}
                    <div className="col-span-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {template.usageCount || 0}
                      </span>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="col-span-1">
                      {renderActionButtons(template)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateList;