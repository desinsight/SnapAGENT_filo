// 캘린더 헤더 컴포넌트
import React from 'react';
import { CALENDAR_CONFIG } from '../../constants/calendarConfig';
import { formatDate } from '../../utils/dateHelpers';

const CalendarHeader = ({
  currentView,
  currentDate,
  onViewChange,
  onNavigate,
  onToday,
  onCreateEvent,
  onShowModules,
  onShowTemplates,
  onShowRecurrence,
  onShowAttendees,
  onShowSharing,
  onShowSync,
  onShowTagCategory,
  onShowAttendeeStats,
  onShowAttendeeGroups,
  onShowLocationAdvanced
}) => {
  // 뷰 타입별 타이틀 생성
  const getViewTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    switch (currentView) {
      case CALENDAR_CONFIG.VIEW_TYPES.MONTH:
        return `${year}년 ${month + 1}월`;
      case CALENDAR_CONFIG.VIEW_TYPES.WEEK: {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${year}년 ${month + 1}월 ${weekStart.getDate()}-${weekEnd.getDate()}일`;
        } else {
          return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getFullYear()}년 ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
        }
      }
      case CALENDAR_CONFIG.VIEW_TYPES.DAY:
        return formatDate(currentDate, 'YYYY년 MM월 DD일');
      case CALENDAR_CONFIG.VIEW_TYPES.LIST:
        return `${year}년 ${month + 1}월 일정 목록`;
      default:
        return `${year}년 ${month + 1}월`;
    }
  };

  const viewButtons = [
    { type: CALENDAR_CONFIG.VIEW_TYPES.MONTH, label: '월' },
    { type: CALENDAR_CONFIG.VIEW_TYPES.WEEK, label: '주' },
    { type: CALENDAR_CONFIG.VIEW_TYPES.DAY, label: '일' },
    { type: CALENDAR_CONFIG.VIEW_TYPES.LIST, label: '목록' }
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 타이틀 및 네비게이션 */}
        <div className="flex items-center space-x-4">
          {/* 네비게이션 버튼 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="이전"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={onToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              오늘
            </button>
            
            <button
              onClick={() => onNavigate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="다음"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 현재 날짜 표시 */}
          <h1 className="text-xl font-semibold text-gray-900">
            {getViewTitle()}
          </h1>
        </div>

        {/* 오른쪽: 뷰 선택 및 액션 버튼 */}
        <div className="flex items-center space-x-4">
          {/* 뷰 선택 버튼 그룹 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {viewButtons.map((view) => (
              <button
                key={view.type}
                onClick={() => onViewChange(view.type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentView === view.type
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* 분리선 */}
          <div className="h-6 w-px bg-gray-300" />


          {/* 템플릿 버튼 */}
          <button
            onClick={onShowTemplates}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="이벤트 템플릿"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* 반복 이벤트 버튼 */}
          <button
            onClick={onShowRecurrence}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="반복 이벤트 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 참석자 관리 버튼 */}
          <button
            onClick={onShowAttendees}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="참석자 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>


          {/* 공유 관리 버튼 */}
          <button
            onClick={onShowSharing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="공유 및 권한 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>

          {/* 외부 동기화 버튼 */}
          <button
            onClick={onShowSync}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="외부 캘린더 동기화"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 태그/카테고리 관리 버튼 */}
          <button
            onClick={onShowTagCategory}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="태그 & 카테고리 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>


          {/* 참석자 통계 버튼 */}
          <button
            onClick={onShowAttendeeStats}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="참석자 통계 & 출석 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>



          {/* 참석자 그룹 관리 버튼 */}
          <button
            onClick={onShowAttendeeGroups}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="참석자 그룹 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>


          {/* 스마트 위치 서비스 버튼 */}
          <button
            onClick={onShowLocationAdvanced}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="스마트 위치 서비스 (준비중)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* 모듈 버튼 */}
          <button
            onClick={onShowModules}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="모듈 관리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </button>

          {/* 새 일정 버튼 */}
          <button
            onClick={onCreateEvent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 일정
          </button>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;