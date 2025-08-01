// 캘린더 메인 패널 컴포넌트
import React, { useState, useEffect, useCallback } from 'react';
import { CALENDAR_CONFIG } from './constants/calendarConfig';

// 컴포넌트 import
import CalendarHeader from './components/ui/CalendarHeader';
import CalendarToolbar from './components/ui/CalendarToolbar';
import MonthView from './components/views/MonthView';
import WeekView from './components/views/WeekView';
import DayView from './components/views/DayView';
import ListView from './components/views/ListView';
import EventForm from './components/events/EventForm';
import EventDetail from './components/events/EventDetail';
import ModulePanel from './components/panels/ModulePanel';
import QuickEventForm from './components/events/QuickEventForm';
import EventTemplatePanel from './components/panels/EventTemplatePanel';
import ConflictResolutionPanel from './components/panels/ConflictResolutionPanel';
import RecurrencePanel from './components/panels/RecurrencePanel';
import AttendeeManagementPanel from './components/panels/AttendeeManagementPanel';
import SharingPermissionPanel from './components/panels/SharingPermissionPanel';
import ExternalSyncPanel from './components/panels/ExternalSyncPanel';
import TagCategoryPanel from './components/panels/TagCategoryPanel';
import AdvancedSearchPanel from './components/panels/AdvancedSearchPanel';
import AttendeeStatsPanel from './components/panels/AttendeeStatsPanel';
import AttendeeGroupPanel from './components/panels/AttendeeGroupPanel';
import DevelopmentPreviewPanel from './components/panels/DevelopmentPreviewPanel';

// 훅 import
import useCalendar from './hooks/useCalendar';
import useCalendarEvents from './hooks/useCalendarEvents';
import useCalendarUI from './hooks/useCalendarUI';

const CalendarPanel = ({ activePanel, onNotification, initialDate, onDateChange }) => {
  // 상태 관리
  const [currentView, setCurrentView] = useState(CALENDAR_CONFIG.DEFAULT_SETTINGS.view);
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showModulePanel, setShowModulePanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quickEventDate, setQuickEventDate] = useState(null);
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  // 새로운 패널 상태
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showRecurrencePanel, setShowRecurrencePanel] = useState(false);
  const [showAttendeePanel, setShowAttendeePanel] = useState(false);
  const [showSharingPanel, setShowSharingPanel] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [showTagCategoryPanel, setShowTagCategoryPanel] = useState(false);
  const [showAdvancedSearchPanel, setShowAdvancedSearchPanel] = useState(false);
  const [showAttendeeStatsPanel, setShowAttendeeStatsPanel] = useState(false);
  const [showAttendeeGroupPanel, setShowAttendeeGroupPanel] = useState(false);
  const [showLocationAdvanced, setShowLocationAdvanced] = useState(false);
  const [showModuleAdvanced, setShowModuleAdvanced] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [recurringEventData, setRecurringEventData] = useState(null);
  const [attendeeEventData, setAttendeeEventData] = useState(null);
  const [sharingData, setSharingData] = useState(null);

  // 커스텀 훅 사용
  const {
    calendars,
    selectedCalendars,
    toggleCalendar,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    shareCalendar,
    loadCalendars,
    isLoading: calendarsLoading
  } = useCalendar();

  const {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    filteredEvents,
    searchEvents,
    filters,
    updateFilters,
    searchQuery,
    setSearchQuery,
    isLoading: eventsLoading
  } = useCalendarEvents(selectedCalendars);

  const {
    notifications,
    modules,
    urgentNotices,
    unreadCount,
    activeModules,
    loadNotifications,
    markNotificationRead,
    deleteNotification,
    loadModules,
    toggleModule
  } = useCalendarUI();

  // initialDate 변경 시 currentDate 동기화
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  // 초기 데이터 로드
  useEffect(() => {
    loadCalendars();
    loadEvents();
    loadNotifications();
    loadModules();
  }, []);

  // 뷰 변경 핸들러
  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    
    // 뷰에 따른 날짜 조정
    if (view === CALENDAR_CONFIG.VIEW_TYPES.DAY) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  // 날짜 네비게이션
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case CALENDAR_CONFIG.VIEW_TYPES.MONTH:
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case CALENDAR_CONFIG.VIEW_TYPES.WEEK:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case CALENDAR_CONFIG.VIEW_TYPES.DAY:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  }, [currentDate, currentView]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onDateChange?.(today);
  }, [onDateChange]);

  // 이벤트 선택 핸들러
  const handleEventSelect = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  }, []);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    onDateChange?.(date);
  }, [onDateChange]);

  // 빠른 이벤트 생성
  const handleQuickEvent = useCallback((date, timeSlot) => {
    setQuickEventDate({ date, timeSlot });
    setShowQuickEventForm(true);
  }, []);

  // 이벤트 폼 닫기
  const handleCloseEventForm = useCallback(() => {
    setShowEventForm(false);
    setSelectedEvent(null);
  }, []);

  // 이벤트 상세 닫기
  const handleCloseEventDetail = useCallback(() => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  }, []);

  // 빠른 이벤트 폼 닫기
  const handleCloseQuickEventForm = useCallback(() => {
    setShowQuickEventForm(false);
    setQuickEventDate(null);
  }, []);

  // 이벤트 저장
  const handleSaveEvent = useCallback(async (eventData) => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
        onNotification?.('일정이 수정되었습니다.', 'success');
      } else {
        await createEvent(eventData);
        onNotification?.('새 일정이 생성되었습니다.', 'success');
      }
      handleCloseEventForm();
      handleCloseQuickEventForm();
      await loadEvents(); // 이벤트 목록 새로고침
    } catch (error) {
      console.error('이벤트 저장 실패:', error);
      onNotification?.('일정 저장에 실패했습니다.', 'error');
    }
  }, [selectedEvent, createEvent, updateEvent, loadEvents, onNotification]);

  // 이벤트 삭제
  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      await deleteEvent(eventId);
      handleCloseEventForm();
      handleCloseEventDetail();
      await loadEvents();
      onNotification?.('일정이 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('이벤트 삭제 실패:', error);
      onNotification?.('일정 삭제에 실패했습니다.', 'error');
    }
  }, [deleteEvent, loadEvents, onNotification]);

  // 이벤트 편집 (상세에서 편집 버튼 클릭시)
  const handleEditEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventDetail(false);
    setShowEventForm(true);
  }, []);

  // 이벤트 복제
  const handleDuplicateEvent = useCallback((event) => {
    const duplicatedEvent = {
      ...event,
      id: undefined,
      title: `${event.title} (복제)`
    };
    setSelectedEvent(duplicatedEvent);
    setShowEventDetail(false);
    setShowEventForm(true);
  }, []);

  // 참석자 관리 패널 열기
  const handleShowAttendeePanel = useCallback((event) => {
    setAttendeeEventData(event);
    setShowAttendeePanel(true);
  }, []);


  // 공유 관리 패널 열기
  const handleShowSharingPanel = useCallback((data) => {
    setSharingData(data);
    setShowSharingPanel(true);
  }, []);

  // 뷰 컴포넌트 렌더링
  const renderCalendarView = () => {
    const commonProps = {
      events: filteredEvents,
      currentDate,
      selectedDate,
      onEventSelect: handleEventSelect,
      onDateSelect: handleDateSelect,
      onQuickEvent: handleQuickEvent,
      calendars,
      selectedCalendars,
      isLoading: eventsLoading
    };

    switch (currentView) {
      case CALENDAR_CONFIG.VIEW_TYPES.MONTH:
        return <MonthView {...commonProps} />;
      case CALENDAR_CONFIG.VIEW_TYPES.WEEK:
        return <WeekView {...commonProps} />;
      case CALENDAR_CONFIG.VIEW_TYPES.DAY:
        return <DayView {...commonProps} />;
      case CALENDAR_CONFIG.VIEW_TYPES.LIST:
        return <ListView {...commonProps} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 헤더 */}
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onViewChange={handleViewChange}
        onNavigate={navigateDate}
        onToday={goToToday}
        onCreateEvent={() => setShowEventForm(true)}
        onShowModules={() => setShowModulePanel(true)}
        onShowTemplates={() => setShowTemplatePanel(true)}
        onShowRecurrence={() => setShowRecurrencePanel(true)}
        onShowAttendees={() => setShowAttendeePanel(true)}
        onShowSharing={() => setShowSharingPanel(true)}
        onShowSync={() => setShowSyncPanel(true)}
        onShowTagCategory={() => setShowTagCategoryPanel(true)}
        onShowAttendeeStats={() => setShowAttendeeStatsPanel(true)}
        onShowAttendeeGroups={() => setShowAttendeeGroupPanel(true)}
        onShowLocationAdvanced={() => setShowLocationAdvanced(true)}
      />

      {/* 툴바 */}
      <CalendarToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filters={filters}
        onUpdateFilters={updateFilters}
        calendars={calendars}
        selectedCalendars={selectedCalendars}
        onToggleCalendar={toggleCalendar}
        onRefresh={() => {
          loadEvents();
          loadCalendars();
        }}
        isLoading={eventsLoading || calendarsLoading}
        onShowAdvancedSearch={() => setShowAdvancedSearchPanel(true)}
      />

      {/* 캘린더 뷰 */}
      <div className="flex-1 overflow-hidden">
        {renderCalendarView()}
      </div>

      {/* 이벤트 폼 모달 */}
      {showEventForm && (
        <EventForm
          isOpen={showEventForm}
          onClose={handleCloseEventForm}
          onSubmit={handleSaveEvent}
          event={selectedEvent}
          calendars={calendars}
          selectedCalendar={selectedCalendars[0]}
          mode={selectedEvent ? 'edit' : 'create'}
        />
      )}

      {/* 이벤트 상세 모달 */}
      {showEventDetail && selectedEvent && (
        <EventDetail
          isOpen={showEventDetail}
          event={selectedEvent}
          calendar={calendars.find(cal => cal.id === selectedEvent.calendarId)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onClose={handleCloseEventDetail}
          onDuplicate={handleDuplicateEvent}
          onManageAttendees={handleShowAttendeePanel}
          onManageSharing={handleShowSharingPanel}
          onToggleStatus={(eventId, status) => {
            // 이벤트 상태 토글 로직
            const updatedEvent = { ...selectedEvent, status };
            handleSaveEvent(updatedEvent);
          }}
        />
      )}

      {/* 빠른 이벤트 생성 폼 */}
      {showQuickEventForm && quickEventDate && (
        <QuickEventForm
          isOpen={showQuickEventForm}
          onClose={handleCloseQuickEventForm}
          onSubmit={handleSaveEvent}
          initialDate={quickEventDate.date}
          initialTime={quickEventDate.timeSlot}
          calendars={calendars}
          selectedCalendar={selectedCalendars[0]}
        />
      )}

      {/* 모듈 패널 */}
      {showModulePanel && (
        <ModulePanel
          isOpen={showModulePanel}
          onClose={() => setShowModulePanel(false)}
          modules={modules}
          activeModules={activeModules}
          onToggleModule={toggleModule}
        />
      )}

      {/* 이벤트 템플릿 패널 */}
      {showTemplatePanel && (
        <EventTemplatePanel
          isOpen={showTemplatePanel}
          onClose={() => setShowTemplatePanel(false)}
        />
      )}

      {/* 충돌 해결 패널 */}
      {showConflictPanel && conflictData && (
        <ConflictResolutionPanel
          isOpen={showConflictPanel}
          onClose={() => setShowConflictPanel(false)}
          conflictData={conflictData}
        />
      )}

      {/* 반복 일정 패널 */}
      {showRecurrencePanel && (
        <RecurrencePanel
          isOpen={showRecurrencePanel}
          onClose={() => setShowRecurrencePanel(false)}
          eventData={recurringEventData}
        />
      )}

      {/* 참석자 관리 패널 */}
      {showAttendeePanel && (
        <AttendeeManagementPanel
          isOpen={showAttendeePanel}
          onClose={() => setShowAttendeePanel(false)}
          eventData={attendeeEventData}
        />
      )}

      {/* 공유 권한 패널 */}
      {showSharingPanel && (
        <SharingPermissionPanel
          isOpen={showSharingPanel}
          onClose={() => setShowSharingPanel(false)}
          sharingData={sharingData}
        />
      )}

      {/* 외부 동기화 패널 */}
      {showSyncPanel && (
        <ExternalSyncPanel
          isOpen={showSyncPanel}
          onClose={() => setShowSyncPanel(false)}
        />
      )}

      {/* 태그/카테고리 패널 */}
      {showTagCategoryPanel && (
        <TagCategoryPanel
          isOpen={showTagCategoryPanel}
          onClose={() => setShowTagCategoryPanel(false)}
        />
      )}

      {/* 고급 검색 패널 */}
      {showAdvancedSearchPanel && (
        <AdvancedSearchPanel
          isOpen={showAdvancedSearchPanel}
          onClose={() => setShowAdvancedSearchPanel(false)}
          events={events}
          calendars={calendars}
        />
      )}

      {/* 참석자 통계 패널 */}
      {showAttendeeStatsPanel && (
        <AttendeeStatsPanel
          isOpen={showAttendeeStatsPanel}
          onClose={() => setShowAttendeeStatsPanel(false)}
        />
      )}

      {/* 참석자 그룹 패널 */}
      {showAttendeeGroupPanel && (
        <AttendeeGroupPanel
          isOpen={showAttendeeGroupPanel}
          onClose={() => setShowAttendeeGroupPanel(false)}
        />
      )}

      {/* 개발 미리보기 패널 */}
      {showLocationAdvanced && (
        <DevelopmentPreviewPanel
          isOpen={showLocationAdvanced}
          onClose={() => setShowLocationAdvanced(false)}
        />
      )}
    </div>
  );
};

export default CalendarPanel;

