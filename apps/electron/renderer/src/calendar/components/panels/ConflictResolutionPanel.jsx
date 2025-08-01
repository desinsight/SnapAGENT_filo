// 충돌 감지 및 해결 패널
import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const ConflictResolutionPanel = ({
  isOpen,
  onClose,
  conflicts = [],
  newEvent,
  onResolveConflict,
  onIgnoreConflict,
  calendars = []
}) => {
  const [selectedResolution, setSelectedResolution] = useState('auto');
  const [customResolutions, setCustomResolutions] = useState({});
  const [showDetails, setShowDetails] = useState({});

  // 해결 방법 옵션
  const resolutionOptions = [
    {
      id: 'auto',
      title: '자동 조정',
      description: '시스템이 최적의 시간을 자동으로 찾아 조정합니다',
      icon: '🤖'
    },
    {
      id: 'reschedule_new',
      title: '새 이벤트 시간 변경',
      description: '추가하려는 새 이벤트의 시간을 변경합니다',
      icon: '📅'
    },
    {
      id: 'reschedule_existing',
      title: '기존 이벤트 시간 변경',
      description: '충돌하는 기존 이벤트의 시간을 변경합니다',
      icon: '🔄'
    },
    {
      id: 'shorten_duration',
      title: '이벤트 시간 단축',
      description: '이벤트들의 지속 시간을 단축하여 충돌을 해결합니다',
      icon: '⏰'
    },
    {
      id: 'different_calendar',
      title: '다른 캘린더로 이동',
      description: '새 이벤트를 다른 캘린더로 이동합니다',
      icon: '📋'
    },
    {
      id: 'force_overlap',
      title: '겹침 허용',
      description: '충돌을 무시하고 이벤트를 겹쳐서 생성합니다',
      icon: '⚠️'
    }
  ];

  // 충돌 유형 분석
  const analyzeConflicts = () => {
    const analysis = {
      total: conflicts.length,
      types: {
        time_overlap: 0,
        resource_conflict: 0,
        calendar_conflict: 0,
        attendee_conflict: 0
      },
      severity: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    conflicts.forEach(conflict => {
      // 충돌 유형 분류
      if (conflict.type === 'time_overlap') analysis.types.time_overlap++;
      else if (conflict.type === 'resource_conflict') analysis.types.resource_conflict++;
      else if (conflict.type === 'calendar_conflict') analysis.types.calendar_conflict++;
      else if (conflict.type === 'attendee_conflict') analysis.types.attendee_conflict++;

      // 심각도 분류
      if (conflict.severity === 'high') analysis.severity.high++;
      else if (conflict.severity === 'medium') analysis.severity.medium++;
      else analysis.severity.low++;
    });

    return analysis;
  };

  // 자동 해결 제안
  const getAutoResolutionSuggestions = () => {
    const suggestions = [];

    conflicts.forEach((conflict, index) => {
      const suggestion = {
        conflictIndex: index,
        conflict,
        recommendations: []
      };

      // 시간 겹침 해결 제안
      if (conflict.type === 'time_overlap') {
        // 30분 후로 미루기
        const newStartTime = new Date(newEvent.start);
        newStartTime.setMinutes(newStartTime.getMinutes() + 30);
        const newEndTime = new Date(newEvent.end);
        newEndTime.setMinutes(newEndTime.getMinutes() + 30);

        suggestion.recommendations.push({
          action: 'reschedule_new',
          description: '새 이벤트를 30분 후로 이동',
          newTime: { start: newStartTime, end: newEndTime },
          impact: 'low'
        });

        // 기존 이벤트 30분 후로 미루기
        const existingNewStart = new Date(conflict.event.start);
        existingNewStart.setMinutes(existingNewStart.getMinutes() + 30);
        const existingNewEnd = new Date(conflict.event.end);
        existingNewEnd.setMinutes(existingNewEnd.getMinutes() + 30);

        suggestion.recommendations.push({
          action: 'reschedule_existing',
          description: `"${conflict.event.title}" 이벤트를 30분 후로 이동`,
          newTime: { start: existingNewStart, end: existingNewEnd },
          impact: 'medium'
        });

        // 이벤트 시간 단축
        const shortenedEnd = new Date(newEvent.start);
        shortenedEnd.setMinutes(shortenedEnd.getMinutes() + 30);

        suggestion.recommendations.push({
          action: 'shorten_duration',
          description: '새 이벤트 시간을 30분으로 단축',
          newTime: { start: newEvent.start, end: shortenedEnd },
          impact: 'low'
        });
      }

      suggestions.push(suggestion);
    });

    return suggestions;
  };

  // 충돌 해결 실행
  const handleResolveConflict = (resolutionType, customData = null) => {
    const resolution = {
      type: resolutionType,
      conflicts,
      newEvent,
      customData
    };

    onResolveConflict?.(resolution);
  };

  const analysis = analyzeConflicts();
  const suggestions = getAutoResolutionSuggestions();

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">일정 충돌 감지</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {analysis.total}개의 충돌이 발견되었습니다. 해결 방법을 선택하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* 왼쪽: 충돌 목록 */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">충돌 상세 정보</h3>
              
              {/* 충돌 분석 요약 */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-red-800 dark:text-red-200">충돌 유형</div>
                    <div className="space-y-1 mt-2">
                      {analysis.types.time_overlap > 0 && (
                        <div className="flex justify-between text-red-700 dark:text-red-300">
                          <span>시간 겹침</span>
                          <span>{analysis.types.time_overlap}개</span>
                        </div>
                      )}
                      {analysis.types.resource_conflict > 0 && (
                        <div className="flex justify-between text-red-700 dark:text-red-300">
                          <span>리소스 충돌</span>
                          <span>{analysis.types.resource_conflict}개</span>
                        </div>
                      )}
                      {analysis.types.attendee_conflict > 0 && (
                        <div className="flex justify-between text-red-700 dark:text-red-300">
                          <span>참석자 충돌</span>
                          <span>{analysis.types.attendee_conflict}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-red-800 dark:text-red-200">심각도</div>
                    <div className="space-y-1 mt-2">
                      {analysis.severity.high > 0 && (
                        <div className="flex justify-between text-red-700 dark:text-red-300">
                          <span>높음</span>
                          <span>{analysis.severity.high}개</span>
                        </div>
                      )}
                      {analysis.severity.medium > 0 && (
                        <div className="flex justify-between text-orange-700 dark:text-orange-300">
                          <span>보통</span>
                          <span>{analysis.severity.medium}개</span>
                        </div>
                      )}
                      {analysis.severity.low > 0 && (
                        <div className="flex justify-between text-yellow-700 dark:text-yellow-300">
                          <span>낮음</span>
                          <span>{analysis.severity.low}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 충돌 목록 */}
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            conflict.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            conflict.severity === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {conflict.severity === 'high' ? '높음' : conflict.severity === 'medium' ? '보통' : '낮음'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {conflict.type === 'time_overlap' ? '시간 겹침' :
                             conflict.type === 'resource_conflict' ? '리소스 충돌' :
                             conflict.type === 'attendee_conflict' ? '참석자 충돌' : '기타'}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {conflict.event.title}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {formatDate(conflict.event.start, 'MM/DD')} {formatTime(conflict.event.start)} - {formatTime(conflict.event.end)}
                            </span>
                          </div>
                          {conflict.event.location && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span>{conflict.event.location.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDetails(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className={`w-4 h-4 transform transition-transform ${showDetails[index] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* 충돌 상세 정보 */}
                    {showDetails[index] && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="mb-2">
                            <span className="font-medium">충돌 설명:</span>
                            <p className="mt-1">{conflict.description}</p>
                          </div>
                          {conflict.impact && (
                            <div className="mb-2">
                              <span className="font-medium">영향도:</span>
                              <span className="ml-2">{conflict.impact}</span>
                            </div>
                          )}
                          {conflict.suggestions && conflict.suggestions.length > 0 && (
                            <div>
                              <span className="font-medium">제안 사항:</span>
                              <ul className="mt-1 space-y-1">
                                {conflict.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="text-blue-500">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 해결 방법 */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">해결 방법 선택</h3>
              
              {/* 해결 방법 옵션 */}
              <div className="space-y-3 mb-6">
                {resolutionOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedResolution === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedResolution(option.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={selectedResolution === option.id}
                            onChange={() => setSelectedResolution(option.id)}
                            className="text-blue-600"
                          />
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {option.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 자동 해결 제안 */}
              {selectedResolution === 'auto' && suggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">🤖 자동 해결 제안</h4>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="space-y-2">
                        <div className="font-medium text-blue-800 dark:text-blue-200">
                          충돌 #{index + 1}: {suggestion.conflict.event.title}
                        </div>
                        {suggestion.recommendations.map((rec, recIndex) => (
                          <div
                            key={recIndex}
                            className="flex items-center justify-between bg-white dark:bg-gray-700 rounded p-3"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {rec.description}
                              </div>
                              {rec.newTime && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {formatTime(rec.newTime.start)} - {formatTime(rec.newTime.end)}
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rec.impact === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {rec.impact === 'low' ? '낮은 영향' : rec.impact === 'medium' ? '보통 영향' : '높은 영향'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 사용자 정의 옵션 */}
              {selectedResolution === 'reschedule_new' && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">새 시간 설정</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        시작 시간
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        종료 시간
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => onIgnoreConflict?.()}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              충돌 무시하고 계속
            </button>
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleResolveConflict(selectedResolution)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                충돌 해결
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionPanel;