// calendarController.js
// 캘린더 및 이벤트 관련 API 비즈니스 로직 담당
// 서비스 계층(calendarService) 활용으로 리팩터링
// 확장성, 연동성, 주석, 테스트, 문서화, 플러그인화 원칙 준수

const calendarService = require('../services/calendarService');
const response = require('../utils/response');
const path = require('path');
const fs = require('fs');
const { buildRRuleString, parseRRuleString, getRRuleExamples } = require('../utils/rruleUtils');
const locationService = require('../services/locationService');
const sharingService = require('../services/sharingService');
const attendeeService = require('../services/attendeeService');

/**
 * 캘린더 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 사용자의 캘린더 목록
 */
exports.getCalendars = async (req, res) => {
  try {
    // 사용자 ID 검증
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const calendars = await calendarService.getCalendarsByUser(userId);
    res.json(response.success({ calendars }));
  } catch (error) {
    console.error('캘린더 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 캘린더 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 캘린더 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 캘린더 정보
 */
exports.createCalendar = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const ownerId = req.user?.id;

    // 입력값 검증
    if (!ownerId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json(response.error('캘린더 이름은 필수이며 비어있을 수 없습니다.'));
    }
    if (name.trim().length > 100) {
      return res.status(400).json(response.error('캘린더 이름은 100자를 초과할 수 없습니다.'));
    }
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json(response.error('올바른 색상 형식이 아닙니다. (예: #FF0000)'));
    }
    if (description && description.length > 500) {
      return res.status(400).json(response.error('설명은 500자를 초과할 수 없습니다.'));
    }

    const calendar = await calendarService.createCalendar({ 
      ownerId, 
      name: name.trim(), 
      color: color || '#3B82F6',
      description: description?.trim() 
    });
    res.status(201).json(response.success({ calendar }));
  } catch (error) {
    console.error('캘린더 생성 오류:', error);
    res.status(500).json(response.error('서버 오류로 캘린더를 생성할 수 없습니다.'));
  }
};

/**
 * 캘린더 상세조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 캘린더 상세 정보
 */
exports.getCalendarById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('캘린더 ID는 필수입니다.'));
    }

    const calendar = await calendarService.getCalendarById(id);
    if (!calendar) {
      return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
    }

    // 권한 확인 (소유자 또는 공유된 사용자)
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 캘린더에 접근할 권한이 없습니다.'));
    }

    res.json(response.success({ calendar }));
  } catch (error) {
    console.error('캘린더 상세조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 캘린더를 조회할 수 없습니다.'));
  }
};

/**
 * 캘린더 수정
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 수정된 캘린더 정보
 */
exports.updateCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description, sharedWith } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('캘린더 ID는 필수입니다.'));
    }
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json(response.error('캘린더 이름은 비어있을 수 없습니다.'));
    }
    if (name && name.trim().length > 100) {
      return res.status(400).json(response.error('캘린더 이름은 100자를 초과할 수 없습니다.'));
    }
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json(response.error('올바른 색상 형식이 아닙니다. (예: #FF0000)'));
    }
    if (description && description.length > 500) {
      return res.status(400).json(response.error('설명은 500자를 초과할 수 없습니다.'));
    }

    const calendar = await calendarService.updateCalendar(id, { 
      name: name?.trim(), 
      color, 
      description: description?.trim(),
      sharedWith 
    });
    if (!calendar) {
      return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
    }

    // 권한 확인 (소유자만 수정 가능)
    if (calendar.ownerId !== userId) {
      return res.status(403).json(response.error('캘린더를 수정할 권한이 없습니다.'));
    }

    res.json(response.success({ calendar }));
  } catch (error) {
    console.error('캘린더 수정 오류:', error);
    res.status(500).json(response.error('서버 오류로 캘린더를 수정할 수 없습니다.'));
  }
};

/**
 * 캘린더 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제 성공 여부
 */
exports.deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('캘린더 ID는 필수입니다.'));
    }

    // 권한 확인 (소유자만 삭제 가능)
    const calendar = await calendarService.getCalendarById(id);
    if (!calendar) {
      return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
    }
    if (calendar.ownerId !== userId) {
      return res.status(403).json(response.error('캘린더를 삭제할 권한이 없습니다.'));
    }

    const success = await calendarService.deleteCalendar(id);
    if (!success) {
      return res.status(500).json(response.error('캘린더 삭제에 실패했습니다.'));
    }
    res.json(response.success({ success: true }));
  } catch (error) {
    console.error('캘린더 삭제 오류:', error);
    res.status(500).json(response.error('서버 오류로 캘린더를 삭제할 수 없습니다.'));
  }
};

/**
 * 일정(이벤트) 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 이벤트 목록
 */
exports.getEvents = async (req, res) => {
  try {
    const { calendarId, start, end, limit, offset } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (calendarId && typeof calendarId !== 'string') {
      return res.status(400).json(response.error('캘린더 ID는 문자열이어야 합니다.'));
    }
    if (start && isNaN(Date.parse(start))) {
      return res.status(400).json(response.error('올바른 시작일 형식이 아닙니다.'));
    }
    if (end && isNaN(Date.parse(end))) {
      return res.status(400).json(response.error('올바른 종료일 형식이 아닙니다.'));
    }
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json(response.error('limit은 1-100 사이의 숫자여야 합니다.'));
    }
    if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json(response.error('offset은 0 이상의 숫자여야 합니다.'));
    }

    const events = calendarId
      ? await calendarService.getEventsByCalendarId(calendarId, { start, end, limit, offset })
      : await calendarService.getAllEvents({ start, end, limit, offset });
    res.json(response.success({ events }));
  } catch (error) {
    console.error('이벤트 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 이벤트 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 일정(이벤트) 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 이벤트 정보
 * @example
 * {
 *   "title": "격주 금요일 회의",
 *   "start": "2024-06-14T10:00:00Z",
 *   "end": "2024-06-14T11:00:00Z",
 *   "recurrence": "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
 *   "excludeHolidays": true
 * }
 */
exports.createEvent = async (req, res) => {
  try {
    const { calendarId, title, description, start, end, location, recurrence, excludeHolidays, excludeDates } = req.body;
    
    // 입력값 검증
    if (!calendarId || !title || !start || !end) {
      return response.error(res, '필수 필드가 누락되었습니다.', 400);
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate >= endDate) {
      return response.error(res, '시작일은 종료일보다 이전이어야 합니다.', 400);
    }
    
    // 캘린더 존재 확인
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      return response.error(res, '캘린더를 찾을 수 없습니다.', 404);
    }
    
    // 고급 옵션 구성
    const options = {
      excludeHolidays: excludeHolidays || false,
      excludeDates: excludeDates || []
    };
    
    // 충돌 감지
    const conflicts = await calendarService.detectConflicts(calendarId, startDate, endDate, null, options);
    
    if (conflicts.length > 0) {
      // 충돌 해결 제안
      const suggestions = await calendarService.suggestConflictResolutions(conflicts, startDate, endDate, options);
      
      return response.success(res, {
        message: '일정 충돌이 감지되었습니다.',
        conflicts: conflicts.map(c => ({
          id: c.id,
          title: c.title,
          start: c.conflictStart || c.start,
          end: c.conflictEnd || c.end
        })),
        suggestions: suggestions.map(s => ({
          type: s.type,
          start: s.start,
          end: s.end,
          description: s.description
        }))
      }, 409);
    }
    
    // 일정 생성
    const eventData = {
      calendarId,
      title,
      description,
      start: startDate,
      end: endDate,
      location,
      recurrence,
      excludeHolidays,
      excludeDates
    };
    
    const event = await calendarService.createEvent(eventData);
    
    return response.success(res, {
      message: '일정이 성공적으로 생성되었습니다.',
      event
    }, 201);
    
  } catch (error) {
    logger.error('일정 생성 오류:', error);
    return response.error(res, '일정 생성 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 이벤트 상세조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 이벤트 상세 정보
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    const event = await calendarService.getEventById(id);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }

    // 권한 확인 (캘린더 접근 권한 확인)
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    res.json(response.success({ event }));
  } catch (error) {
    console.error('이벤트 상세조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 이벤트를 조회할 수 없습니다.'));
  }
};

/**
 * 이벤트 수정 (고급 반복 옵션 지원)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, location, recurrence, excludeHolidays, excludeDates } = req.body;
    
    // 기존 일정 조회
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return response.error(res, '일정을 찾을 수 없습니다.', 404);
    }
    
    // 입력값 검증
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (startDate >= endDate) {
        return response.error(res, '시작일은 종료일보다 이전이어야 합니다.', 400);
      }
    }
    
    // 고급 옵션 구성
    const options = {
      excludeHolidays: excludeHolidays || false,
      excludeDates: excludeDates || []
    };
    
    // 충돌 감지 (자신 제외)
    if (start && end) {
      const conflicts = await calendarService.detectConflicts(
        existingEvent.calendarId, 
        new Date(start), 
        new Date(end), 
        id, 
        options
      );
      
      if (conflicts.length > 0) {
        // 충돌 해결 제안
        const suggestions = await calendarService.suggestConflictResolutions(
          conflicts, 
          new Date(start), 
          new Date(end), 
          options
        );
        
        return response.success(res, {
          message: '일정 충돌이 감지되었습니다.',
          conflicts: conflicts.map(c => ({
            id: c.id,
            title: c.title,
            start: c.conflictStart || c.start,
            end: c.conflictEnd || c.end
          })),
          suggestions: suggestions.map(s => ({
            type: s.type,
            start: s.start,
            end: s.end,
            description: s.description
          }))
        }, 409);
      }
    }
    
    // 일정 수정
    const updateData = {
      title,
      description,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      location,
      recurrence,
      excludeHolidays,
      excludeDates
    };
    
    // undefined 값 제거
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const updatedEvent = await calendarService.updateEvent(id, updateData);
    
    return response.success(res, {
      message: '일정이 성공적으로 수정되었습니다.',
      event: updatedEvent
    });
    
  } catch (error) {
    logger.error('일정 수정 오류:', error);
    return response.error(res, '일정 수정 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 이벤트 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제 성공 여부
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    // 권한 확인
    const existingEvent = await calendarService.getEventById(id);
    if (!existingEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(existingEvent.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasDeleteAccess = calendar.ownerId === userId || 
                           (calendar.sharedWith && calendar.sharedWith.some(share => 
                             share.userId === userId && share.role === 'admin'));
    if (!hasDeleteAccess) {
      return res.status(403).json(response.error('이벤트를 삭제할 권한이 없습니다.'));
    }

    const success = await calendarService.deleteEvent(id);
    if (!success) {
      return res.status(500).json(response.error('이벤트 삭제에 실패했습니다.'));
    }
    res.json(response.success({ success: true }));
  } catch (error) {
    console.error('이벤트 삭제 오류:', error);
    res.status(500).json(response.error('서버 오류로 이벤트를 삭제할 수 없습니다.'));
  }
};

/**
 * 반복 일정의 실제 발생일(고급 옵션 지원)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 발생일 목록
 * @example
 * GET /events/:id/recurring-dates?until=2024-12-31&excludeHolidays=true
 */
exports.getRecurringDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { until, excludeHolidays, excludeDates, includeDates, maxOccurrences } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (until && isNaN(Date.parse(until))) {
      return res.status(400).json(response.error('올바른 until 날짜 형식이 아닙니다.'));
    }
    if (maxOccurrences && (isNaN(maxOccurrences) || parseInt(maxOccurrences) < 1 || parseInt(maxOccurrences) > 1000)) {
      return res.status(400).json(response.error('maxOccurrences는 1-1000 사이의 숫자여야 합니다.'));
    }

    const event = await calendarService.getEventById(id);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }

    // 권한 확인
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    // 반복 설정이 없는 경우
    if (!event.recurrence) {
      return res.status(400).json(response.error('이 이벤트는 반복 설정이 없습니다.'));
    }

    // 고급 옵션 구성
    const options = {
      excludeHolidays: excludeHolidays === 'true',
      excludeDates: excludeDates ? excludeDates.split(',').map(d => new Date(d)) : [],
      includeDates: includeDates ? includeDates.split(',').map(d => new Date(d)) : [],
      maxOccurrences: maxOccurrences ? parseInt(maxOccurrences) : undefined
    };
    
    const dates = await calendarService.getRecurringDates(event, until ? new Date(until) : undefined, options);
    res.json(response.success({ dates }));
  } catch (error) {
    console.error('반복 일정 발생일 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 반복 일정 발생일을 조회할 수 없습니다.'));
  }
};

/**
 * 일정 충돌 감지
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 충돌하는 일정 목록
 */
exports.detectConflicts = async (req, res) => {
  try {
    const { calendarId, start, end, excludeEventId } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!calendarId || typeof calendarId !== 'string') {
      return res.status(400).json(response.error('캘린더 ID는 필수입니다.'));
    }
    if (!start || isNaN(Date.parse(start))) {
      return res.status(400).json(response.error('올바른 시작일 형식이 아닙니다.'));
    }
    if (!end || isNaN(Date.parse(end))) {
      return res.status(400).json(response.error('올바른 종료일 형식이 아닙니다.'));
    }
    if (new Date(start) >= new Date(end)) {
      return res.status(400).json(response.error('종료일은 시작일보다 늦어야 합니다.'));
    }
    if (excludeEventId && typeof excludeEventId !== 'string') {
      return res.status(400).json(response.error('excludeEventId는 문자열이어야 합니다.'));
    }

    // 권한 확인
    const calendar = await calendarService.getCalendarById(calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 캘린더에 접근할 권한이 없습니다.'));
    }
    
    const conflicts = await calendarService.detectConflicts(calendarId, new Date(start), new Date(end), excludeEventId);
    res.json(response.success({ conflicts }));
  } catch (error) {
    console.error('일정 충돌 감지 오류:', error);
    res.status(500).json(response.error('서버 오류로 일정 충돌을 감지할 수 없습니다.'));
  }
};

/**
 * 일정 충돌 해결 제안
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 충돌 해결 제안 목록
 */
exports.suggestConflictResolutions = async (req, res) => {
  try {
    const { conflicts, start, end, calendarId } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0) {
      return res.status(400).json(response.error('충돌 목록은 필수이며 배열이어야 합니다.'));
    }
    if (!start || isNaN(Date.parse(start))) {
      return res.status(400).json(response.error('올바른 시작일 형식이 아닙니다.'));
    }
    if (!end || isNaN(Date.parse(end))) {
      return res.status(400).json(response.error('올바른 종료일 형식이 아닙니다.'));
    }
    if (new Date(start) >= new Date(end)) {
      return res.status(400).json(response.error('종료일은 시작일보다 늦어야 합니다.'));
    }
    if (calendarId && typeof calendarId !== 'string') {
      return res.status(400).json(response.error('캘린더 ID는 문자열이어야 합니다.'));
    }

    // 권한 확인 (캘린더가 있는 경우)
    if (calendarId) {
      const calendar = await calendarService.getCalendarById(calendarId);
      if (!calendar) {
        return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
      }
      const hasAccess = calendar.ownerId === userId || 
                       (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
      if (!hasAccess) {
        return res.status(403).json(response.error('이 캘린더에 접근할 권한이 없습니다.'));
      }
    }
    
    const suggestions = await calendarService.suggestConflictResolutions(conflicts, new Date(start), new Date(end));
    res.json(response.success({ suggestions }));
  } catch (error) {
    console.error('충돌 해결 제안 오류:', error);
    res.status(500).json(response.error('서버 오류로 충돌 해결 제안을 생성할 수 없습니다.'));
  }
};

/**
 * 이벤트의 알림 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 알림 목록
 */
exports.getNotifications = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    const notifications = await calendarService.getNotifications(eventId);
    res.json(response.success({ notifications }));
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 알림 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 이벤트에 알림 추가
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 알림 정보
 */
exports.addNotification = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, time, message, email, push } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!type || !['before', 'at', 'after'].includes(type)) {
      return res.status(400).json(response.error('알림 타입은 before, at, after 중 하나여야 합니다.'));
    }
    if (!time || isNaN(parseInt(time)) || parseInt(time) < 0) {
      return res.status(400).json(response.error('알림 시간은 0 이상의 숫자여야 합니다.'));
    }
    if (message && message.length > 200) {
      return res.status(400).json(response.error('알림 메시지는 200자를 초과할 수 없습니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const notificationData = {
      type,
      time: parseInt(time),
      message: message?.trim(),
      email: Boolean(email),
      push: Boolean(push),
      createdBy: userId
    };

    const notification = await calendarService.addNotification(eventId, notificationData);
    if (!notification) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.status(201).json(response.success({ notification }));
  } catch (error) {
    console.error('알림 추가 오류:', error);
    res.status(500).json(response.error('서버 오류로 알림을 추가할 수 없습니다.'));
  }
};

/**
 * 이벤트의 알림 수정
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 수정된 알림 정보
 */
exports.updateNotification = async (req, res) => {
  try {
    const { eventId, notificationId } = req.params;
    const { type, time, message, email, push } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!notificationId || typeof notificationId !== 'string' || notificationId.trim().length === 0) {
      return res.status(400).json(response.error('알림 ID는 필수입니다.'));
    }
    if (type && !['before', 'at', 'after'].includes(type)) {
      return res.status(400).json(response.error('알림 타입은 before, at, after 중 하나여야 합니다.'));
    }
    if (time !== undefined && (isNaN(parseInt(time)) || parseInt(time) < 0)) {
      return res.status(400).json(response.error('알림 시간은 0 이상의 숫자여야 합니다.'));
    }
    if (message && message.length > 200) {
      return res.status(400).json(response.error('알림 메시지는 200자를 초과할 수 없습니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updateData = {
      type,
      time: time !== undefined ? parseInt(time) : undefined,
      message: message?.trim(),
      email: email !== undefined ? Boolean(email) : undefined,
      push: push !== undefined ? Boolean(push) : undefined,
      updatedBy: userId
    };

    const notification = await calendarService.updateNotification(eventId, notificationId, updateData);
    if (!notification) {
      return res.status(404).json(response.error('알림을 찾을 수 없습니다.'));
    }
    res.json(response.success({ notification }));
  } catch (error) {
    console.error('알림 수정 오류:', error);
    res.status(500).json(response.error('서버 오류로 알림을 수정할 수 없습니다.'));
  }
};

/**
 * 이벤트의 알림 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제 성공 여부
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { eventId, notificationId } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!notificationId || typeof notificationId !== 'string' || notificationId.trim().length === 0) {
      return res.status(400).json(response.error('알림 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const success = await calendarService.deleteNotification(eventId, notificationId);
    if (!success) {
      return res.status(404).json(response.error('알림을 찾을 수 없습니다.'));
    }
    res.json(response.success({ success: true }));
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    res.status(500).json(response.error('서버 오류로 알림을 삭제할 수 없습니다.'));
  }
};

/**
 * 이벤트에 참석자(Attendee) 초대
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.addAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, email, name, role } = req.body;
    const currentUserId = req.user?.id;

    // 입력값 검증
    if (!currentUserId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!userId && !email) {
      return res.status(400).json(response.error('사용자 ID 또는 이메일은 필수입니다.'));
    }
    if (userId && typeof userId !== 'string') {
      return res.status(400).json(response.error('사용자 ID는 문자열이어야 합니다.'));
    }
    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return res.status(400).json(response.error('올바른 이메일 형식이 아닙니다.'));
    }
    if (name && name.length > 100) {
      return res.status(400).json(response.error('이름은 100자를 초과할 수 없습니다.'));
    }
    if (role && !['attendee', 'organizer', 'optional'].includes(role)) {
      return res.status(400).json(response.error('역할은 attendee, organizer, optional 중 하나여야 합니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === currentUserId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === currentUserId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const attendeeData = {
      userId,
      email,
      name: name?.trim(),
      role: role || 'attendee',
      invitedBy: currentUserId
    };

    const updatedEvent = await calendarService.addAttendee(eventId, attendeeData);
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.status(201).json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('참석자 추가 오류:', error);
    res.status(500).json(response.error('서버 오류로 참석자를 추가할 수 없습니다.'));
  }
};

/**
 * 참석자 상태 변경(수락/거절 등)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.setAttendeeStatus = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { status, comment } = req.body;
    const currentUserId = req.user?.id;

    // 입력값 검증
    if (!currentUserId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json(response.error('사용자 ID는 필수입니다.'));
    }
    if (!status || !['accepted', 'declined', 'tentative', 'needs-action'].includes(status)) {
      return res.status(400).json(response.error('상태는 accepted, declined, tentative, needs-action 중 하나여야 합니다.'));
    }
    if (comment && comment.length > 500) {
      return res.status(400).json(response.error('코멘트는 500자를 초과할 수 없습니다.'));
    }

    // 권한 확인 (본인 또는 이벤트 소유자만 상태 변경 가능)
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const isOwner = calendar.ownerId === currentUserId;
    const isSelf = userId === currentUserId;
    if (!isOwner && !isSelf) {
      return res.status(403).json(response.error('참석자 상태를 변경할 권한이 없습니다.'));
    }

    const statusData = {
      status,
      comment: comment?.trim(),
      updatedAt: new Date(),
      updatedBy: currentUserId
    };

    const updatedEvent = await calendarService.setAttendeeStatus(eventId, userId, statusData);
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트 또는 참석자를 찾을 수 없습니다.'));
    }
    res.json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('참석자 상태 변경 오류:', error);
    res.status(500).json(response.error('서버 오류로 참석자 상태를 변경할 수 없습니다.'));
  }
};

/**
 * 특정 참석자의 상태 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 참석자 상태 정보
 */
exports.getAttendeeStatus = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const currentUserId = req.user?.id;

    // 입력값 검증
    if (!currentUserId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json(response.error('사용자 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === currentUserId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === currentUserId)) ||
                     userId === currentUserId;
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    const status = await calendarService.getAttendeeStatus(eventId, userId);
    if (!status) {
      return res.status(404).json(response.error('참석자 상태를 찾을 수 없습니다.'));
    }
    res.json(response.success({ status }));
  } catch (error) {
    console.error('참석자 상태 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 참석자 상태를 조회할 수 없습니다.'));
  }
};

/**
 * 전체 참석자 상태 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 전체 참석자 상태 목록
 */
exports.getAllAttendeeStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const currentUserId = req.user?.id;

    // 입력값 검증
    if (!currentUserId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === currentUserId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === currentUserId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    const statusMap = await calendarService.getAllAttendeeStatus(eventId);
    res.json(response.success({ attendeeStatus: statusMap }));
  } catch (error) {
    console.error('전체 참석자 상태 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 참석자 상태 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 고급 검색/필터/정렬: 일정(Event) 목록
 * 쿼리스트링으로 조건 전달 (dateFrom, dateTo, keyword, tags, attendee, color, sortBy, sortOrder 등)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 검색된 이벤트 목록
 */
exports.searchEvents = async (req, res) => {
  try {
    const {
      dateFrom, dateTo, keyword, tags, attendee, color, sortBy, sortOrder,
      calendarId, limit, offset, allDay, recurrence
    } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res.status(400).json(response.error('올바른 시작일 형식이 아닙니다.'));
    }
    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(400).json(response.error('올바른 종료일 형식이 아닙니다.'));
    }
    if (dateFrom && dateTo && new Date(dateFrom) >= new Date(dateTo)) {
      return res.status(400).json(response.error('종료일은 시작일보다 늦어야 합니다.'));
    }
    if (keyword && keyword.length > 200) {
      return res.status(400).json(response.error('검색어는 200자를 초과할 수 없습니다.'));
    }
    if (attendee && attendee.length > 100) {
      return res.status(400).json(response.error('참석자 검색어는 100자를 초과할 수 없습니다.'));
    }
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json(response.error('올바른 색상 형식이 아닙니다.'));
    }
    if (sortBy && !['title', 'start', 'end', 'createdAt', 'updatedAt'].includes(sortBy)) {
      return res.status(400).json(response.error('정렬 기준은 title, start, end, createdAt, updatedAt 중 하나여야 합니다.'));
    }
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json(response.error('정렬 순서는 asc, desc 중 하나여야 합니다.'));
    }
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json(response.error('limit은 1-100 사이의 숫자여야 합니다.'));
    }
    if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json(response.error('offset은 0 이상의 숫자여야 합니다.'));
    }

    // 권한 확인 (캘린더가 지정된 경우)
    if (calendarId) {
      const calendar = await calendarService.getCalendarById(calendarId);
      if (!calendar) {
        return res.status(404).json(response.error('캘린더를 찾을 수 없습니다.'));
      }
      const hasAccess = calendar.ownerId === userId || 
                       (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
      if (!hasAccess) {
        return res.status(403).json(response.error('이 캘린더에 접근할 권한이 없습니다.'));
      }
    }

    const options = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      keyword: keyword?.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined,
      attendee: attendee?.trim(),
      color,
      sortBy: sortBy || 'start',
      sortOrder: sortOrder || 'asc',
      calendarId,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      allDay: allDay !== undefined ? allDay === 'true' : undefined,
      recurrence: recurrence !== undefined ? recurrence === 'true' : undefined
    };

    const events = await calendarService.searchEvents(options);
    res.json(response.success({ events }));
  } catch (error) {
    console.error('이벤트 검색 오류:', error);
    res.status(500).json(response.error('서버 오류로 이벤트를 검색할 수 없습니다.'));
  }
};

/**
 * 일정(Event)에 태그 추가
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.addTagToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { tag } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return res.status(400).json(response.error('태그는 필수입니다.'));
    }
    if (tag.trim().length > 50) {
      return res.status(400).json(response.error('태그는 50자를 초과할 수 없습니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updatedEvent = await calendarService.addTagToEvent(eventId, tag.trim());
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.status(201).json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('태그 추가 오류:', error);
    res.status(500).json(response.error('서버 오류로 태그를 추가할 수 없습니다.'));
  }
};

/**
 * 일정(Event)에서 태그 제거
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.removeTagFromEvent = async (req, res) => {
  try {
    const { eventId, tag } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return res.status(400).json(response.error('태그는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updatedEvent = await calendarService.removeTagFromEvent(eventId, tag.trim());
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('태그 제거 오류:', error);
    res.status(500).json(response.error('서버 오류로 태그를 제거할 수 없습니다.'));
  }
};

/**
 * 전체 태그 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 전체 태그 목록
 */
exports.getAllTags = async (req, res) => {
  try {
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const tags = await calendarService.getAllTags();
    res.json(response.success({ tags }));
  } catch (error) {
    console.error('태그 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 태그 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 일정(Event)에 카테고리 지정
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.addCategoryToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { category } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json(response.error('카테고리는 필수입니다.'));
    }
    if (category.trim().length > 100) {
      return res.status(400).json(response.error('카테고리는 100자를 초과할 수 없습니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updatedEvent = await calendarService.addCategoryToEvent(eventId, category.trim());
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.status(201).json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    res.status(500).json(response.error('서버 오류로 카테고리를 추가할 수 없습니다.'));
  }
};

/**
 * 일정(Event)에서 카테고리 제거
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 이벤트 정보
 */
exports.removeCategoryFromEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updatedEvent = await calendarService.removeCategoryFromEvent(eventId);
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('카테고리 제거 오류:', error);
    res.status(500).json(response.error('서버 오류로 카테고리를 제거할 수 없습니다.'));
  }
};

/**
 * 전체 카테고리 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 전체 카테고리 목록
 */
exports.getAllCategories = async (req, res) => {
  try {
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const categories = await calendarService.getAllCategories();
    res.json(response.success({ categories }));
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 카테고리 목록을 조회할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/calendar/{id}/share:
 *   post:
 *     summary: 캘린더 공유(권한 부여)
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 캘린더 ID(UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [reader, writer, admin]
 *     responses:
 *       200:
 *         description: 공유된 캘린더 정보
 *   delete:
 *     summary: 캘린더 공유 해제(권한 회수)
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 캘린더 ID(UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 공유 해제된 캘린더 정보
 *   patch:
 *     summary: 캘린더 공유 사용자 권한(role) 변경
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 캘린더 ID(UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [reader, writer, admin]
 *     responses:
 *       200:
 *         description: 권한 변경된 캘린더 정보
 */

/**
 * @swagger
 * /api/calendar/{id}/role:
 *   get:
 *     summary: 특정 사용자의 캘린더 내 권한(role) 확인
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 캘린더 ID(UUID)
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 권한 정보
 */

/**
 * 캘린더 공유(권한 부여)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 공유된 캘린더 정보
 */
exports.shareCalendar = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { users } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return response.error(res, '공유할 사용자 목록이 필요합니다.', 400);
    }

    const result = await sharingService.shareCalendar(calendarId, users, userId);

    return response.success(res, {
      message: '캘린더 공유가 완료되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('캘린더 공유 오류:', error);
    return response.error(res, '캘린더 공유 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공유 초대 응답
 */
exports.respondToInvite = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { response } = req.body; // 'accept' 또는 'decline'
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!['accept', 'decline'].includes(response)) {
      return response.error(res, '유효하지 않은 응답입니다.', 400);
    }

    const result = await sharingService.respondToInvite(calendarId, userId, response);

    return response.success(res, {
      message: `초대를 ${response === 'accept' ? '수락' : '거절'}했습니다.`,
      data: result
    });

  } catch (error) {
    logger.error('초대 응답 처리 오류:', error);
    return response.error(res, '초대 응답 처리 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공유 권한 수정
 */
exports.updateSharingPermissions = async (req, res) => {
  try {
    const { calendarId, userId } = req.params;
    const { permissions } = req.body;
    const modifierId = req.user?.id;

    if (!modifierId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!permissions || typeof permissions !== 'object') {
      return response.error(res, '권한 정보가 필요합니다.', 400);
    }

    const result = await sharingService.updateSharingPermissions(
      calendarId, 
      userId, 
      permissions, 
      modifierId
    );

    return response.success(res, {
      message: '공유 권한이 수정되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('공유 권한 수정 오류:', error);
    return response.error(res, '공유 권한 수정 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공유 해제
 */
exports.revokeSharing = async (req, res) => {
  try {
    const { calendarId, userId } = req.params;
    const revokerId = req.user?.id;

    if (!revokerId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const result = await sharingService.revokeSharing(calendarId, userId, revokerId);

    return response.success(res, {
      message: '공유가 해제되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('공유 해제 오류:', error);
    return response.error(res, '공유 해제 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공개 링크 생성
 */
exports.createPublicLink = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { permissions, expiresAt } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const result = await sharingService.createPublicLink(
      calendarId, 
      { permissions, expiresAt }, 
      creatorId
    );

    return response.success(res, {
      message: '공개 링크가 생성되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('공개 링크 생성 오류:', error);
    return response.error(res, '공개 링크 생성 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공개 링크 접근
 */
exports.accessPublicLink = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await sharingService.accessPublicLink(token);

    return response.success(res, {
      message: '공개 링크에 접근했습니다.',
      data: result
    });

  } catch (error) {
    logger.error('공개 링크 접근 오류:', error);
    return response.error(res, '공개 링크 접근 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 공유된 캘린더 목록 조회
 */
exports.getSharedCalendars = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const calendars = await sharingService.getSharedCalendars(userId);

    return response.success(res, {
      message: '공유된 캘린더 목록을 조회했습니다.',
      data: calendars
    });

  } catch (error) {
    logger.error('공유된 캘린더 조회 오류:', error);
    return response.error(res, '공유된 캘린더 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 캘린더 공유 상태 조회
 */
exports.getSharingStatus = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const status = await sharingService.getSharingStatus(calendarId, userId);

    return response.success(res, {
      message: '캘린더 공유 상태를 조회했습니다.',
      data: status
    });

  } catch (error) {
    logger.error('공유 상태 조회 오류:', error);
    return response.error(res, '공유 상태 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 권한 확인 미들웨어
 */
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const { calendarId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return response.error(res, '인증이 필요합니다.', 401);
      }

      const calendar = await Calendar.findById(calendarId);
      if (!calendar) {
        return response.error(res, '캘린더를 찾을 수 없습니다.', 404);
      }

      const hasPermission = sharingService.hasPermission(calendar, userId, permission);
      if (!hasPermission) {
        return response.error(res, '해당 작업을 수행할 권한이 없습니다.', 403);
      }

      req.calendar = calendar;
      next();
    } catch (error) {
      logger.error('권한 확인 오류:', error);
      return response.error(res, '권한 확인 중 오류가 발생했습니다.', 500);
    }
  };
};

/**
 * 이벤트 첨부파일 업로드
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업로드된 파일 정보
 */
exports.uploadAttachment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!req.file) {
      return res.status(400).json(response.error('파일이 필요합니다.'));
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json(response.error('파일 크기는 10MB를 초과할 수 없습니다.'));
    }

    // 허용된 파일 타입 검증
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json(response.error('지원하지 않는 파일 형식입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const fileMeta = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    const updatedEvent = await calendarService.addAttachment(eventId, fileMeta);
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    res.status(201).json(response.success({ attachment: fileMeta, event: updatedEvent }));
  } catch (error) {
    console.error('첨부파일 업로드 오류:', error);
    res.status(500).json(response.error('서버 오류로 첨부파일을 업로드할 수 없습니다.'));
  }
};

/**
 * 이벤트 첨부파일 다운로드
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 파일 다운로드
 */
exports.downloadAttachment = async (req, res) => {
  try {
    const { eventId, filename } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      return res.status(400).json(response.error('파일명은 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    const file = (event.attachments || []).find(f => f.filename === filename);
    if (!file) {
      return res.status(404).json(response.error('파일을 찾을 수 없습니다.'));
    }

    // 파일 존재 여부 확인
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(response.error('파일이 서버에 존재하지 않습니다.'));
    }

    res.download(filePath, file.originalName || file.filename);
  } catch (error) {
    console.error('첨부파일 다운로드 오류:', error);
    res.status(500).json(response.error('서버 오류로 첨부파일을 다운로드할 수 없습니다.'));
  }
};

/**
 * 이벤트 첨부파일 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제된 이벤트 정보
 */
exports.deleteAttachment = async (req, res) => {
  try {
    const { eventId, filename } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }
    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      return res.status(400).json(response.error('파일명은 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasWriteAccess = calendar.ownerId === userId || 
                          (calendar.sharedWith && calendar.sharedWith.some(share => 
                            share.userId === userId && ['writer', 'admin'].includes(share.role)));
    if (!hasWriteAccess) {
      return res.status(403).json(response.error('이벤트를 수정할 권한이 없습니다.'));
    }

    const updatedEvent = await calendarService.removeAttachment(eventId, filename);
    if (!updatedEvent) {
      return res.status(404).json(response.error('이벤트/파일을 찾을 수 없습니다.'));
    }

    // 실제 파일 삭제
    try {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('파일 삭제 오류:', fileError);
      // 파일 삭제 실패해도 DB에서 제거된 것으로 처리
    }

    res.json(response.success({ event: updatedEvent }));
  } catch (error) {
    console.error('첨부파일 삭제 오류:', error);
    res.status(500).json(response.error('서버 오류로 첨부파일을 삭제할 수 없습니다.'));
  }
};

/**
 * 이벤트 첨부파일 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 첨부파일 목록
 */
exports.listAttachments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(response.error('이벤트 ID는 필수입니다.'));
    }

    // 권한 확인
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(response.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(response.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(response.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    res.json(response.success({ attachments: event.attachments || [] }));
  } catch (error) {
    console.error('첨부파일 목록 조회 오류:', error);
    res.status(500).json(response.error('서버 오류로 첨부파일 목록을 조회할 수 없습니다.'));
  }
};

/**
 * 충돌 해결 제안 조회
 */
exports.getConflictSuggestions = async (req, res) => {
  try {
    const { calendarId, start, end, excludeHolidays, excludeDates } = req.query;
    
    if (!calendarId || !start || !end) {
      return response.error(res, '필수 파라미터가 누락되었습니다.', 400);
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate >= endDate) {
      return response.error(res, '시작일은 종료일보다 이전이어야 합니다.', 400);
    }
    
    // 고급 옵션 구성
    const options = {
      excludeHolidays: excludeHolidays === 'true',
      excludeDates: excludeDates ? excludeDates.split(',') : []
    };
    
    // 충돌 감지
    const conflicts = await calendarService.detectConflicts(calendarId, startDate, endDate, null, options);
    
    if (conflicts.length === 0) {
      return response.success(res, {
        message: '충돌이 없습니다.',
        conflicts: [],
        suggestions: []
      });
    }
    
    // 충돌 해결 제안
    const suggestions = await calendarService.suggestConflictResolutions(conflicts, startDate, endDate, options);
    
    return response.success(res, {
      message: '충돌 해결 제안을 조회했습니다.',
      conflicts: conflicts.map(c => ({
        id: c.id,
        title: c.title,
        start: c.conflictStart || c.start,
        end: c.conflictEnd || c.end
      })),
      suggestions: suggestions.map(s => ({
        type: s.type,
        start: s.start,
        end: s.end,
        description: s.description
      }))
    });
    
  } catch (error) {
    logger.error('충돌 제안 조회 오류:', error);
    return response.error(res, '충돌 제안 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 주소를 좌표로 변환 (Geocoding)
 */
exports.geocodeAddress = async (req, res) => {
  try {
    const { address, provider = 'google' } = req.body;
    
    if (!address) {
      return response.error(res, '주소는 필수입니다.', 400);
    }
    
    const result = await locationService.geocodeAddress(address, provider);
    
    return response.success(res, {
      message: '주소 좌표 변환이 완료되었습니다.',
      data: result
    });
    
  } catch (error) {
    logger.error('주소 좌표 변환 오류:', error);
    return response.error(res, '주소 좌표 변환 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 */
exports.reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude, provider = 'google' } = req.body;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return response.error(res, '유효한 좌표가 필요합니다.', 400);
    }
    
    const result = await locationService.reverseGeocode(latitude, longitude, provider);
    
    return response.success(res, {
      message: '좌표 주소 변환이 완료되었습니다.',
      data: result
    });
    
  } catch (error) {
    logger.error('좌표 주소 변환 오류:', error);
    return response.error(res, '좌표 주소 변환 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 장소 검색
 */
exports.searchPlaces = async (req, res) => {
  try {
    const { query, latitude, longitude, radius, type } = req.query;
    
    if (!query) {
      return response.error(res, '검색어는 필수입니다.', 400);
    }
    
    const options = {};
    if (latitude && longitude) {
      options.latitude = parseFloat(latitude);
      options.longitude = parseFloat(longitude);
    }
    if (radius) {
      options.radius = parseInt(radius);
    }
    if (type) {
      options.type = type;
    }
    
    const results = await locationService.searchPlaces(query, options);
    
    return response.success(res, {
      message: '장소 검색이 완료되었습니다.',
      data: {
        query,
        results,
        total: results.length
      }
    });
    
  } catch (error) {
    logger.error('장소 검색 오류:', error);
    return response.error(res, '장소 검색 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 장소 상세 정보 조회
 */
exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return response.error(res, '장소 ID는 필수입니다.', 400);
    }
    
    const details = await locationService.getPlaceDetails(placeId);
    
    return response.success(res, {
      message: '장소 상세 정보를 조회했습니다.',
      data: details
    });
    
  } catch (error) {
    logger.error('장소 상세 정보 조회 오류:', error);
    return response.error(res, '장소 상세 정보 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 경로 안내 조회
 */
exports.getDirections = async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return response.error(res, '출발지와 목적지는 필수입니다.', 400);
    }
    
    const directions = await locationService.getDirections(origin, destination, mode);
    
    return response.success(res, {
      message: '경로 안내를 조회했습니다.',
      data: directions
    });
    
  } catch (error) {
    logger.error('경로 안내 조회 오류:', error);
    return response.error(res, '경로 안내 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 주변 교통 정보 조회
 */
exports.getNearbyTransportation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;
    
    if (!latitude || !longitude) {
      return response.error(res, '좌표는 필수입니다.', 400);
    }
    
    const transportation = await locationService.getNearbyTransportation(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );
    
    return response.success(res, {
      message: '주변 교통 정보를 조회했습니다.',
      data: transportation
    });
    
  } catch (error) {
    logger.error('주변 교통 정보 조회 오류:', error);
    return response.error(res, '주변 교통 정보 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 위치 정보 검증
 */
exports.validateLocation = async (req, res) => {
  try {
    const locationData = req.body;
    
    const validation = locationService.validateLocation(locationData);
    
    return response.success(res, {
      message: '위치 정보 검증이 완료되었습니다.',
      data: validation
    });
    
  } catch (error) {
    logger.error('위치 정보 검증 오류:', error);
    return response.error(res, '위치 정보 검증 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 초대
 */
exports.inviteAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees, options } = req.body;
    const inviterId = req.user?.id;

    if (!inviterId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return response.error(res, '초대할 참석자 목록이 필요합니다.', 400);
    }

    const result = await attendeeService.inviteAttendees(eventId, attendees, options, inviterId);

    return response.success(res, {
      message: '참석자 초대가 완료되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 초대 오류:', error);
    return response.error(res, '참석자 초대 중 오류가 발생했습니다.', 500);
  }
};

/**
 * RSVP 응답 처리
 */
exports.respondToRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendeeId, status, message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!['yes', 'no', 'maybe'].includes(status)) {
      return response.error(res, '유효하지 않은 RSVP 상태입니다.', 400);
    }

    const result = await attendeeService.respondToRSVP(eventId, attendeeId, {
      status,
      message
    });

    return response.success(res, {
      message: 'RSVP 응답이 처리되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('RSVP 응답 처리 오류:', error);
    return response.error(res, 'RSVP 응답 처리 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 코멘트 추가
 */
exports.addAttendeeComment = async (req, res) => {
  try {
    const { eventId, attendeeId } = req.params;
    const { content, isPrivate } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!content || content.trim().length === 0) {
      return response.error(res, '코멘트 내용이 필요합니다.', 400);
    }

    const result = await attendeeService.addComment(eventId, attendeeId, {
      content: content.trim(),
      isPrivate: isPrivate || false
    }, authorId);

    return response.success(res, {
      message: '코멘트가 추가되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 코멘트 추가 오류:', error);
    return response.error(res, '코멘트 추가 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 코멘트 수정
 */
exports.updateAttendeeComment = async (req, res) => {
  try {
    const { eventId, attendeeId, commentIndex } = req.params;
    const { content, isPrivate } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!content || content.trim().length === 0) {
      return response.error(res, '코멘트 내용이 필요합니다.', 400);
    }

    const result = await attendeeService.updateComment(
      eventId, 
      attendeeId, 
      parseInt(commentIndex), 
      {
        content: content.trim(),
        isPrivate: isPrivate || false
      }, 
      authorId
    );

    return response.success(res, {
      message: '코멘트가 수정되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 코멘트 수정 오류:', error);
    return response.error(res, '코멘트 수정 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 출석 상태 업데이트
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { eventId, attendeeId } = req.params;
    const { status, notes } = req.body;
    const recorderId = req.user?.id;

    if (!recorderId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!['attended', 'no_show', 'late', 'left_early'].includes(status)) {
      return response.error(res, '유효하지 않은 출석 상태입니다.', 400);
    }

    const result = await attendeeService.updateAttendance(eventId, attendeeId, {
      status,
      notes: notes?.trim()
    }, recorderId);

    return response.success(res, {
      message: '출석 상태가 업데이트되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 출석 상태 업데이트 오류:', error);
    return response.error(res, '출석 상태 업데이트 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 그룹 생성
 */
exports.createAttendeeGroup = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, type, members, permissions } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    if (!name || name.trim().length === 0) {
      return response.error(res, '그룹 이름이 필요합니다.', 400);
    }

    if (!['department', 'team', 'project', 'role', 'custom'].includes(type)) {
      return response.error(res, '유효하지 않은 그룹 타입입니다.', 400);
    }

    const result = await attendeeService.createAttendeeGroup(eventId, {
      name: name.trim(),
      description: description?.trim(),
      type,
      members: members || [],
      permissions
    }, creatorId);

    return response.success(res, {
      message: '참석자 그룹이 생성되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 그룹 생성 오류:', error);
    return response.error(res, '참석자 그룹 생성 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 통계 조회
 */
exports.getAttendeeStatistics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const result = await attendeeService.getAttendeeStatistics(eventId);

    return response.success(res, {
      message: '참석자 통계를 조회했습니다.',
      data: result
    });

  } catch (error) {
    logger.error('참석자 통계 조회 오류:', error);
    return response.error(res, '참석자 통계 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 목록 조회
 */
exports.getAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, role, includeComments } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return response.error(res, '이벤트를 찾을 수 없습니다.', 404);
    }

    let attendees = event.attendees;

    // 상태별 필터링
    if (status) {
      attendees = attendees.filter(a => a.status === status);
    }

    // 역할별 필터링
    if (role) {
      attendees = attendees.filter(a => a.role === role);
    }

    // 코멘트 포함 여부
    if (includeComments !== 'true') {
      attendees = attendees.map(a => {
        const { comments, ...attendeeWithoutComments } = a.toObject();
        return attendeeWithoutComments;
      });
    }

    return response.success(res, {
      message: '참석자 목록을 조회했습니다.',
      data: {
        total: attendees.length,
        attendees: attendees
      }
    });

  } catch (error) {
    logger.error('참석자 목록 조회 오류:', error);
    return response.error(res, '참석자 목록 조회 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 참석자 상세 정보 조회
 */
exports.getAttendeeDetails = async (req, res) => {
  try {
    const { eventId, attendeeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return response.error(res, '인증이 필요합니다.', 401);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return response.error(res, '이벤트를 찾을 수 없습니다.', 404);
    }

    const attendee = event.attendees.find(
      a => a.userId?.toString() === attendeeId || a.email === attendeeId
    );

    if (!attendee) {
      return response.error(res, '참석자를 찾을 수 없습니다.', 404);
    }

    return response.success(res, {
      message: '참석자 상세 정보를 조회했습니다.',
      data: attendee
    });

  } catch (error) {
    logger.error('참석자 상세 정보 조회 오류:', error);
    return response.error(res, '참석자 상세 정보 조회 중 오류가 발생했습니다.', 500);
  }
};

// 서비스 계층에 getEventsByCalendarId, getAllEvents 함수가 없으면 추가 필요 

/**
 * 캘린더 공유 해제
 */
exports.unshareCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const result = await sharingService.unshareCalendar(id, userId);
    res.json(response.success({ message: '캘린더 공유가 해제되었습니다.', data: result }));
  } catch (error) {
    console.error('캘린더 공유 해제 오류:', error);
    res.status(500).json(response.error('캘린더 공유 해제 중 오류가 발생했습니다.'));
  }
};

/**
 * 공유 권한 변경
 */
exports.updateShareRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId, role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const result = await sharingService.updateShareRole(id, targetUserId, role, userId);
    res.json(response.success({ message: '공유 권한이 변경되었습니다.', data: result }));
  } catch (error) {
    console.error('공유 권한 변경 오류:', error);
    res.status(500).json(response.error('공유 권한 변경 중 오류가 발생했습니다.'));
  }
};

/**
 * 사용자 권한 확인
 */
exports.getUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const role = await sharingService.getUserRole(id, targetUserId || userId);
    res.json(response.success({ role }));
  } catch (error) {
    console.error('사용자 권한 확인 오류:', error);
    res.status(500).json(response.error('사용자 권한 확인 중 오류가 발생했습니다.'));
  }
};

/**
 * 이벤트 충돌 확인
 */
exports.checkEventConflicts = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { start, end, excludeEventId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const conflicts = await calendarService.checkEventConflicts(calendarId, { start, end, excludeEventId });
    res.json(response.success({ conflicts }));
  } catch (error) {
    console.error('이벤트 충돌 확인 오류:', error);
    res.status(500).json(response.error('이벤트 충돌 확인 중 오류가 발생했습니다.'));
  }
};

/**
 * 이벤트 충돌 해결
 */
exports.resolveEventConflicts = async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { eventId, resolution } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const result = await calendarService.resolveEventConflicts(calendarId, eventId, resolution, userId);
    res.json(response.success({ message: '이벤트 충돌이 해결되었습니다.', data: result }));
  } catch (error) {
    console.error('이벤트 충돌 해결 오류:', error);
    res.status(500).json(response.error('이벤트 충돌 해결 중 오류가 발생했습니다.'));
  }
};

/**
 * 위치 검색
 */
exports.searchLocation = async (req, res) => {
  try {
    const { query, type } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const locations = await locationService.searchLocations(query, type);
    res.json(response.success({ locations }));
  } catch (error) {
    console.error('위치 검색 오류:', error);
    res.status(500).json(response.error('위치 검색 중 오류가 발생했습니다.'));
  }
};

/**
 * 위치 상세 정보 조회
 */
exports.getLocationDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const details = await locationService.getLocationDetails(placeId);
    res.json(response.success({ details }));
  } catch (error) {
    console.error('위치 상세 정보 조회 오류:', error);
    res.status(500).json(response.error('위치 상세 정보 조회 중 오류가 발생했습니다.'));
  }
};

/**
 * 교통 정보 조회
 */
exports.getTransportInfo = async (req, res) => {
  try {
    const { location, radius } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(response.error('인증이 필요합니다.'));
    }

    const transportInfo = await locationService.getTransportInfo(location, radius);
    res.json(response.success({ transportInfo }));
  } catch (error) {
    console.error('교통 정보 조회 오류:', error);
    res.status(500).json(response.error('교통 정보 조회 중 오류가 발생했습니다.'));
  }
};