// 반복 이벤트 관리 패널
import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const RecurrencePanel = ({
  isOpen,
  onClose,
  event,
  onUpdateRecurrence,
  onDeleteSeries,
  onDeleteSingle,
  recurringEvents = [],
  mode = 'view' // 'view', 'edit', 'create'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(new Set());

  // 반복 설정 상태
  const [recurrenceConfig, setRecurrenceConfig] = useState({
    frequency: 'weekly', // daily, weekly, monthly, yearly, custom
    interval: 1, // 매 N번째
    days_of_week: [], // 요일 선택 (weekly)
    day_of_month: null, // 월의 몇째 날 (monthly)
    week_of_month: null, // 월의 몇째 주 (monthly)
    month_of_year: null, // 연의 몇째 월 (yearly)
    end_type: 'never', // never, count, date
    end_count: 10,
    end_date: null,
    exceptions: [], // 예외 날짜들
    custom_pattern: null // 커스텀 패턴 (RRule)
  });

  // 요일 정보
  const weekdays = [
    { id: 0, name: '일', short: '일' },
    { id: 1, name: '월', short: '월' },
    { id: 2, name: '화', short: '화' },
    { id: 3, name: '수', short: '수' },
    { id: 4, name: '목', short: '목' },
    { id: 5, name: '금', short: '금' },
    { id: 6, name: '토', short: '토' }
  ];

  // 이벤트별 통계 계산
  const getEventStats = () => {
    if (!recurringEvents.length) return null;

    const now = new Date();
    const past = recurringEvents.filter(e => new Date(e.start) < now);
    const future = recurringEvents.filter(e => new Date(e.start) >= now);
    const exceptions = recurringEvents.filter(e => e.is_exception);
    const modified = recurringEvents.filter(e => e.is_modified);

    return {
      total: recurringEvents.length,
      past: past.length,
      future: future.length,
      exceptions: exceptions.length,
      modified: modified.length,
      nextEvent: future.length > 0 ? future[0] : null,
      lastEvent: past.length > 0 ? past[past.length - 1] : null
    };
  };

  // 반복 패턴 설명 생성
  const getRecurrenceDescription = (config) => {
    const { frequency, interval, days_of_week, end_type, end_count, end_date } = config;
    
    let description = '';
    
    // 빈도 설명
    if (frequency === 'daily') {
      description = interval === 1 ? '매일' : `${interval}일마다`;
    } else if (frequency === 'weekly') {
      if (interval === 1) {
        if (days_of_week.length === 0) {
          description = '매주';
        } else if (days_of_week.length === 7) {
          description = '매일';
        } else {
          const dayNames = days_of_week.map(day => weekdays[day].name).join(', ');
          description = `매주 ${dayNames}요일`;
        }
      } else {
        description = `${interval}주마다`;
      }
    } else if (frequency === 'monthly') {
      description = interval === 1 ? '매월' : `${interval}개월마다`;
    } else if (frequency === 'yearly') {
      description = interval === 1 ? '매년' : `${interval}년마다`;
    }
    
    // 종료 조건 설명
    if (end_type === 'count') {
      description += ` (총 ${end_count}회)`;
    } else if (end_type === 'date' && end_date) {
      description += ` (${formatDate(end_date)}까지)`;
    }
    
    return description;
  };

  // 이벤트 선택 토글
  const toggleEventSelection = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedEvents.size === recurringEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(recurringEvents.map(e => e.id)));
    }
  };

  // 일괄 수정 적용
  const applyBulkEdit = (changes) => {
    const eventIds = Array.from(selectedEvents);
    onUpdateRecurrence?.(eventIds, changes);
    setBulkEditMode(false);
    setSelectedEvents(new Set());
  };

  // 예외 추가
  const addException = (date) => {
    const newConfig = {
      ...recurrenceConfig,
      exceptions: [...recurrenceConfig.exceptions, date]
    };
    setRecurrenceConfig(newConfig);
  };

  // 예외 제거
  const removeException = (date) => {
    const newConfig = {
      ...recurrenceConfig,
      exceptions: recurrenceConfig.exceptions.filter(d => d !== date)
    };
    setRecurrenceConfig(newConfig);
  };

  const stats = getEventStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">반복 이벤트 관리</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {event?.title || '반복 이벤트'} - {stats ? `총 ${stats.total}개 이벤트` : '새 반복 이벤트'}
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

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('pattern')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pattern'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            반복 패턴
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            이벤트 목록 {stats && `(${stats.total})`}
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'exceptions'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            예외 관리 {stats && stats.exceptions > 0 && `(${stats.exceptions})`}
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="p-6 overflow-y-auto">
              {stats ? (
                <div className="space-y-6">
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">총 이벤트</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.future}</div>
                          <div className="text-sm text-green-700 dark:text-green-300">예정된 이벤트</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.past}</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">완료된 이벤트</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.modified}</div>
                          <div className="text-sm text-orange-700 dark:text-orange-300">수정된 이벤트</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 반복 패턴 요약 */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">반복 패턴</h3>
                    <div className="text-gray-600 dark:text-gray-400">
                      {event?.recurrence ? getRecurrenceDescription(event.recurrence) : '반복 패턴이 설정되지 않았습니다.'}
                    </div>
                  </div>

                  {/* 다음/마지막 이벤트 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats.nextEvent && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">다음 이벤트</h3>
                        <div className="space-y-2">
                          <div className="font-medium text-blue-800 dark:text-blue-200">{stats.nextEvent.title}</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {formatDate(stats.nextEvent.start)} {formatTime(stats.nextEvent.start)}
                          </div>
                          {stats.nextEvent.location && (
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                              📍 {stats.nextEvent.location.name}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {stats.lastEvent && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">마지막 이벤트</h3>
                        <div className="space-y-2">
                          <div className="font-medium text-gray-800 dark:text-gray-200">{stats.lastEvent.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(stats.lastEvent.start)} {formatTime(stats.lastEvent.start)}
                          </div>
                          {stats.lastEvent.location && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              📍 {stats.lastEvent.location.name}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">새 반복 이벤트</h3>
                  <p className="text-gray-500 dark:text-gray-400">반복 패턴을 설정하여 이벤트를 생성하세요.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pattern' && (
            <div className="p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* 기본 반복 설정 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">반복 빈도</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        반복 유형
                      </label>
                      <select
                        value={recurrenceConfig.frequency}
                        onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="monthly">매월</option>
                        <option value="yearly">매년</option>
                        <option value="custom">커스텀</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        간격
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurrenceConfig.interval}
                        onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* 주별 반복 시 요일 선택 */}
                  {recurrenceConfig.frequency === 'weekly' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        반복할 요일
                      </label>
                      <div className="flex space-x-2">
                        {weekdays.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => {
                              const newDays = recurrenceConfig.days_of_week.includes(day.id)
                                ? recurrenceConfig.days_of_week.filter(d => d !== day.id)
                                : [...recurrenceConfig.days_of_week, day.id];
                              setRecurrenceConfig(prev => ({ ...prev, days_of_week: newDays }));
                            }}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                              recurrenceConfig.days_of_week.includes(day.id)
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 패턴 미리보기 */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">미리보기</div>
                    <div className="text-purple-700 dark:text-purple-300">
                      {getRecurrenceDescription(recurrenceConfig)}
                    </div>
                  </div>
                </div>

                {/* 종료 조건 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">종료 조건</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="never"
                        name="end_type"
                        checked={recurrenceConfig.end_type === 'never'}
                        onChange={() => setRecurrenceConfig(prev => ({ ...prev, end_type: 'never' }))}
                        className="text-purple-600"
                      />
                      <label htmlFor="never" className="text-gray-700 dark:text-gray-300">종료하지 않음</label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="count"
                        name="end_type"
                        checked={recurrenceConfig.end_type === 'count'}
                        onChange={() => setRecurrenceConfig(prev => ({ ...prev, end_type: 'count' }))}
                        className="text-purple-600"
                      />
                      <label htmlFor="count" className="text-gray-700 dark:text-gray-300">반복 횟수</label>
                      {recurrenceConfig.end_type === 'count' && (
                        <input
                          type="number"
                          min="1"
                          value={recurrenceConfig.end_count}
                          onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, end_count: parseInt(e.target.value) }))}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                                     bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                     focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="date"
                        name="end_type"
                        checked={recurrenceConfig.end_type === 'date'}
                        onChange={() => setRecurrenceConfig(prev => ({ ...prev, end_type: 'date' }))}
                        className="text-purple-600"
                      />
                      <label htmlFor="date" className="text-gray-700 dark:text-gray-300">종료 날짜</label>
                      {recurrenceConfig.end_type === 'date' && (
                        <input
                          type="date"
                          value={recurrenceConfig.end_date || ''}
                          onChange={(e) => setRecurrenceConfig(prev => ({ ...prev, end_date: e.target.value }))}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded
                                     bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                     focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => onUpdateRecurrence?.(recurrenceConfig)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    반복 설정 저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="flex flex-col h-full">
              {/* 일괄 편집 툴바 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setBulkEditMode(!bulkEditMode)}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        bulkEditMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {bulkEditMode ? '일괄 편집 완료' : '일괄 편집'}
                    </button>
                    
                    {bulkEditMode && (
                      <>
                        <button
                          onClick={toggleSelectAll}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {selectedEvents.size === recurringEvents.length ? '전체 해제' : '전체 선택'}
                        </button>
                        
                        {selectedEvents.size > 0 && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedEvents.size}개 선택됨
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {bulkEditMode && selectedEvents.size > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => applyBulkEdit({ status: 'cancelled' })}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => applyBulkEdit({ reminder_enabled: true })}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        알림 설정
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 이벤트 목록 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {recurringEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        bulkEditMode && selectedEvents.has(event.id)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                      } ${
                        new Date(event.start) < new Date() ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {bulkEditMode && (
                            <input
                              type="checkbox"
                              checked={selectedEvents.has(event.id)}
                              onChange={() => toggleEventSelection(event.id)}
                              className="text-purple-600"
                            />
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {event.title}
                              </h4>
                              {event.is_exception && (
                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                                  예외
                                </span>
                              )}
                              {event.is_modified && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  수정됨
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(event.start)} {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                            {event.location && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                📍 {event.location.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(event.id)}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {recurringEvents.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">반복 이벤트가 없습니다</p>
                      <p className="text-sm text-gray-500">반복 패턴을 설정하여 이벤트를 생성하세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* 예외 추가 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">예외 날짜 추가</h3>
                  <div className="flex space-x-4">
                    <input
                      type="date"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => addException(new Date().toISOString().split('T')[0])}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    해당 날짜에는 반복 이벤트가 생성되지 않습니다.
                  </p>
                </div>

                {/* 예외 목록 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">예외 목록</h3>
                  {recurrenceConfig.exceptions.length > 0 ? (
                    <div className="space-y-2">
                      {recurrenceConfig.exceptions.map((date, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-600 rounded">
                          <span className="text-gray-900 dark:text-gray-100">{formatDate(date)}</span>
                          <button
                            onClick={() => removeException(date)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">예외 날짜가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        {stats && (
          <div className="border-t border-gray-200 dark:border-gray-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => onDeleteSeries?.()}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  전체 시리즈 삭제
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">이벤트 삭제</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                이 이벤트를 삭제하시겠습니까?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onDeleteSingle?.(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  이 이벤트만 삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrencePanel;