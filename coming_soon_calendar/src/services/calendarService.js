// calendarService.js
// 캘린더/이벤트 관련 비즈니스 로직 담당
// 컨트롤러와 분리하여 유지보수성, 테스트성, 확장성 강화
// 확장성, 연동성, 주석, 테스트, 문서화, 플러그인화 원칙 준수

const { v4: uuidv4 } = require('uuid');
const { RRule, RRuleSet, rrulestr } = require('rrule');
const { getKoreanHolidays } = require('../utils/holidayUtils');
const Calendar = require('../models/Calendar');
const Event = require('../models/Event');

// 에러 클래스 정의
class CalendarServiceError extends Error {
  constructor(message, code = 'CALENDAR_SERVICE_ERROR') {
    super(message);
    this.name = 'CalendarServiceError';
    this.code = code;
  }
}

/**
 * 사용자별 캘린더 목록 조회 (DB)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 캘린더 목록
 * @throws {CalendarServiceError} 사용자 ID가 유효하지 않은 경우
 */
exports.getCalendarsByUser = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new CalendarServiceError('유효하지 않은 사용자 ID입니다.', 'INVALID_USER_ID');
    }

    const calendars = await Calendar.find({
      $or: [
        { ownerId: userId },
        { 'sharedWith.userId': userId }
      ]
    }).lean();

    return calendars;
  } catch (error) {
    if (error instanceof CalendarServiceError) {
      throw error;
    }
    throw new CalendarServiceError('캘린더 목록 조회 중 오류가 발생했습니다.', 'DB_ERROR');
  }
};

/**
 * 캘린더 생성 (DB)
 * @param {Object} calendarData - 캘린더 데이터
 * @param {string} calendarData.ownerId - 소유자 ID
 * @param {string} calendarData.name - 캘린더 이름
 * @param {string} [calendarData.color] - 캘린더 색상
 * @param {string} [calendarData.description] - 캘린더 설명
 * @returns {Promise<Object>} 생성된 캘린더
 * @throws {CalendarServiceError} 필수 데이터가 누락된 경우
 */
exports.createCalendar = async ({ ownerId, name, color, description }) => {
  try {
    if (!ownerId || typeof ownerId !== 'string') {
      throw new CalendarServiceError('소유자 ID는 필수입니다.', 'MISSING_OWNER_ID');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new CalendarServiceError('캘린더 이름은 필수입니다.', 'MISSING_NAME');
    }
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      throw new CalendarServiceError('올바른 색상 형식이 아닙니다.', 'INVALID_COLOR');
    }

    const newCalendar = await Calendar.create({
      id: uuidv4(),
      ownerId,
      name: name.trim(),
      color: color || '#1976d2',
      description: description?.trim(),
      sharedWith: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return newCalendar.toObject();
  } catch (error) {
    if (error instanceof CalendarServiceError) {
      throw error;
    }
    throw new CalendarServiceError('캘린더 생성 중 오류가 발생했습니다.', 'DB_ERROR');
  }
};

/**
 * 일정(이벤트) 생성 (DB)
 */
exports.createEvent = async ({ calendarId, title, description, start, end, attendees, tags, color, allDay, recurrence, notifications, category }) => {
  const newEvent = await Event.create({
    id: uuidv4(),
    calendarId,
    title,
    description: description || '',
    start: new Date(start),
    end: new Date(end),
    attendees: attendees || [],
    tags: tags || [],
    color: color || '#1976d2',
    allDay: !!allDay,
    recurrence: recurrence || null,
    notifications: notifications || [],
    category: category || null
  });
  return newEvent.toObject();
};

/**
 * 캘린더 상세조회 (DB)
 */
exports.getCalendarById = async (id) => {
  return await Calendar.findOne({ id }).lean();
};

/**
 * 캘린더 수정 (DB)
 */
exports.updateCalendar = async (id, { name, color, sharedWith }) => {
  const update = {};
  if (name) update.name = name;
  if (color) update.color = color;
  if (sharedWith) update.sharedWith = sharedWith;
  update.updatedAt = new Date();
  const result = await Calendar.findOneAndUpdate(
    { id },
    { $set: update },
    { new: true }
  ).lean();
  return result;
};

/**
 * 캘린더 삭제 (DB)
 */
exports.deleteCalendar = async (id) => {
  const result = await Calendar.deleteOne({ id });
  return result.deletedCount > 0;
};

/**
 * 이벤트 상세조회 (DB)
 */
exports.getEventById = async (id) => {
  return await Event.findOne({ id }).lean();
};

/**
 * 이벤트 수정 (DB)
 */
exports.updateEvent = async (id, { title, description, start, end, attendees, tags, color, allDay, recurrence, notifications, category }) => {
  const update = {};
  if (title) update.title = title;
  if (description) update.description = description;
  if (start) update.start = new Date(start);
  if (end) update.end = new Date(end);
  if (attendees) update.attendees = attendees;
  if (tags) update.tags = tags;
  if (color) update.color = color;
  if (allDay !== undefined) update.allDay = !!allDay;
  if (recurrence) update.recurrence = recurrence;
  if (notifications) update.notifications = notifications;
  if (category) update.category = category;
  update.updatedAt = new Date();
  const result = await Event.findOneAndUpdate(
    { id },
    { $set: update },
    { new: true }
  ).lean();
  return result;
};

/**
 * 이벤트 삭제 (DB)
 */
exports.deleteEvent = async (id) => {
  const result = await Event.deleteOne({ id });
  return result.deletedCount > 0;
};

/**
 * 특정 캘린더의 이벤트 목록 조회 (DB)
 */
exports.getEventsByCalendarId = async (calendarId) => {
  return await Event.find({ calendarId }).lean();
};

/**
 * 전체 이벤트 목록 조회 (DB)
 */
exports.getAllEvents = async () => {
  return await Event.find({}).lean();
};

/**
 * 반복 일정 인스턴스 생성 (RRULE 파싱) - 고도화 (공휴일 API 연동)
 * @param {string} rruleStr - RRULE 문자열
 * @param {Date} dtstart - 시작일
 * @param {Object} options - 추가 옵션 (공휴일 제외, 특정일 제외 등)
 * @returns {Promise<RRule|null>}
 */
async function parseRRuleAsync(rruleStr, dtstart, options = {}) {
  try {
    let rule = rrulestr(`DTSTART:${dtstart.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').replace('T', 'T')}
${rruleStr}`);
    // 공휴일 제외 옵션 (API 연동)
    if (options.excludeHolidays) {
      const holidays = await getKoreanHolidays(dtstart.getFullYear());
      rule = rule.exdate(holidays);
    }
    if (options.excludeDates && options.excludeDates.length > 0) {
      rule = rule.exdate(options.excludeDates);
    }
    if (options.includeDates && options.includeDates.length > 0) {
      rule = rule.rdate(options.includeDates);
    }
    return rule;
  } catch (e) {
    console.error('RRULE 파싱 오류:', e);
    return null;
  }
}

/**
 * 반복 일정의 모든 발생일(예: 한 달치) 조회 - 고도화 (비동기)
 * @param {Object} event - 이벤트 객체
 * @param {Date} [until] - 조회 종료일(기본: 한 달 뒤)
 * @param {Object} [options] - 추가 옵션
 * @returns {Promise<Date[]>}
 */
exports.getRecurringDates = async (event, until, options = {}) => {
  if (!event.recurrence || !event.start) return [];
  const dtstart = new Date(event.start);
  const rule = await parseRRuleAsync(event.recurrence, dtstart, options);
  if (!rule) return [];
  const end = until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return rule.between(dtstart, end, true);
};

/**
 * 일정 충돌 감지 (고급 반복/공휴일/특정일 제외 지원)
 * @param {string} calendarId - 캘린더 ID
 * @param {Date} start - 시작일
 * @param {Date} end - 종료일
 * @param {string} [excludeEventId] - 제외할 이벤트 ID
 * @param {Object} [options] - 고급 옵션 (공휴일 제외 등)
 * @returns {Promise<Array>} 충돌하는 이벤트 목록
 */
exports.detectConflicts = async (calendarId, start, end, excludeEventId = null, options = {}) => {
  // DB에서 해당 캘린더의 모든 이벤트 조회
  const events = await Event.find({ calendarId }).lean();
  const conflicts = [];
  for (const event of events) {
    if (event.id === excludeEventId) continue;
    // 반복 일정인 경우: 실제 발생일별로 충돌 감지
    if (event.recurrence) {
      const recurringDates = await exports.getRecurringDates(event, end, options);
      for (const date of recurringDates) {
        const eventStart = new Date(date);
        const eventEnd = new Date(date.getTime() + (new Date(event.end) - new Date(event.start)));
        if (eventStart < end && eventEnd > start) {
          conflicts.push({
            ...event,
            conflictDate: date,
            conflictStart: eventStart,
            conflictEnd: eventEnd
          });
          break;
        }
      }
    } else {
      // 단일 일정 충돌 체크
      if (new Date(event.start) < end && new Date(event.end) > start) {
        conflicts.push(event);
      }
    }
  }
  return conflicts;
};

/**
 * 일정 충돌 해결 제안 (고급화)
 * @param {Array} conflicts - 충돌 이벤트 목록
 * @param {Date} start - 원하는 시작일
 * @param {Date} end - 원하는 종료일
 * @param {Object} [options] - 고급 옵션 (공휴일 제외 등)
 * @returns {Promise<Array>} 해결 방안 제안
 */
exports.suggestConflictResolutions = async (conflicts, start, end, options = {}) => {
  const suggestions = [];
  const duration = end - start;
  // 1. 같은 주 내 다른 시간대 제안 (09~18시)
  const sameWeekSuggestions = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let hour = 9; hour <= 18; hour++) {
      const suggestedStart = new Date(start);
      suggestedStart.setDate(suggestedStart.getDate() + dayOffset);
      suggestedStart.setHours(hour, 0, 0, 0);
      const suggestedEnd = new Date(suggestedStart.getTime() + duration);
      // 공휴일 제외 옵션 적용
      if (options.excludeHolidays) {
        const holidays = await getKoreanHolidays(suggestedStart.getFullYear());
        if (holidays.some(h => h.toDateString() === suggestedStart.toDateString())) continue;
      }
      // 충돌 체크
      const hasConflict = conflicts.some(conflict => {
        const conflictStart = conflict.conflictStart || new Date(conflict.start);
        const conflictEnd = conflict.conflictEnd || new Date(conflict.end);
        return conflictStart < suggestedEnd && conflictEnd > suggestedStart;
      });
      if (!hasConflict) {
        sameWeekSuggestions.push({
          type: 'same_week',
          start: suggestedStart,
          end: suggestedEnd,
          description: `${suggestedStart.toLocaleDateString()} ${hour}시로 이동`
        });
      }
    }
  }
  if (sameWeekSuggestions.length > 0) {
    suggestions.push(...sameWeekSuggestions.slice(0, 3));
  }
  // 2. 다음 주/이전 주 제안
  for (const weekOffset of [1, -1]) {
    const base = new Date(start);
    base.setDate(base.getDate() + weekOffset * 7);
    const baseEnd = new Date(base.getTime() + duration);
    // 공휴일 제외 옵션 적용
    if (options.excludeHolidays) {
      const holidays = await getKoreanHolidays(base.getFullYear());
      if (holidays.some(h => h.toDateString() === base.toDateString())) continue;
    }
    suggestions.push({
      type: weekOffset === 1 ? 'next_week' : 'prev_week',
      start: base,
      end: baseEnd,
      description: weekOffset === 1 ? '다음 주로 이동' : '이전 주로 이동'
    });
  }
  return suggestions;
};

/**
 * 이벤트의 알림 목록 조회
 */
exports.getNotifications = (eventId) => {
  const event = exports.getEventById(eventId);
  return event ? (event.notifications || []) : [];
};

/**
 * 이벤트에 알림 추가
 */
exports.addNotification = (eventId, { minutesBefore, type }) => {
  const event = exports.getEventById(eventId);
  if (!event) return null;
  if (!event.notifications) event.notifications = [];
  const notification = {
    id: uuidv4(),
    minutesBefore,
    type: type || 'push'
  };
  event.notifications.push(notification);
  event.updatedAt = new Date();
  return notification;
};

/**
 * 이벤트의 알림 수정
 */
exports.updateNotification = (eventId, notificationId, { minutesBefore, type }) => {
  const event = exports.getEventById(eventId);
  if (!event || !event.notifications) return null;
  const notification = event.notifications.find(n => n.id === notificationId);
  if (!notification) return null;
  if (minutesBefore !== undefined) notification.minutesBefore = minutesBefore;
  if (type) notification.type = type;
  event.updatedAt = new Date();
  return notification;
};

/**
 * 이벤트의 알림 삭제
 */
exports.deleteNotification = (eventId, notificationId) => {
  const event = exports.getEventById(eventId);
  if (!event || !event.notifications) return false;
  const idx = event.notifications.findIndex(n => n.id === notificationId);
  if (idx === -1) return false;
  event.notifications.splice(idx, 1);
  event.updatedAt = new Date();
  return true;
};

/**
 * 이벤트에 참석자(Attendee) 추가
 */
exports.addAttendee = (eventId, userId) => {
  const event = exports.getEventById(eventId);
  if (!event) return null;
  if (!event.attendees) event.attendees = [];
  if (!event.attendeeStatus) event.attendeeStatus = {};
  if (!event.attendees.includes(userId)) {
    event.attendees.push(userId);
    event.attendeeStatus[userId] = 'pending';
    event.updatedAt = new Date();
  }
  return event;
};

/**
 * 참석자 상태 변경(수락/거절 등)
 */
exports.setAttendeeStatus = (eventId, userId, status) => {
  const event = exports.getEventById(eventId);
  if (!event || !event.attendees || !event.attendeeStatus) return null;
  if (!event.attendees.includes(userId)) return null;
  event.attendeeStatus[userId] = status;
  event.updatedAt = new Date();
  return event;
};

/**
 * 특정 참석자의 상태 조회
 */
exports.getAttendeeStatus = (eventId, userId) => {
  const event = exports.getEventById(eventId);
  if (!event || !event.attendeeStatus) return null;
  return event.attendeeStatus[userId] || null;
};

/**
 * 전체 참석자 상태 목록 조회
 */
exports.getAllAttendeeStatus = (eventId) => {
  const event = exports.getEventById(eventId);
  if (!event || !event.attendeeStatus) return {};
  return event.attendeeStatus;
};

/**
 * 고급 검색/필터/정렬: 일정(Event) 목록 (DB)
 */
exports.searchEvents = async (options = {}) => {
  const query = {};
  if (options.dateFrom) query.start = { $gte: new Date(options.dateFrom) };
  if (options.dateTo) query.end = Object.assign(query.end || {}, { $lte: new Date(options.dateTo) });
  if (options.keyword) {
    query.$or = [
      { title: { $regex: options.keyword, $options: 'i' } },
      { description: { $regex: options.keyword, $options: 'i' } }
    ];
  }
  if (options.tags && options.tags.length) query.tags = { $all: options.tags };
  if (options.attendee) query.attendees = options.attendee;
  if (options.color) query.color = options.color;
  // TODO: 카테고리 등 추가 가능
  let cursor = Event.find(query);
  // 정렬
  if (options.sortBy) {
    const order = options.sortOrder === 'desc' ? -1 : 1;
    cursor = cursor.sort({ [options.sortBy]: order });
  }
  return await cursor.lean();
};

/**
 * 일정(Event)에 태그 추가 (DB)
 */
exports.addTagToEvent = async (eventId, tag) => {
  const event = await Event.findOne({ id: eventId });
  if (!event) return null;
  event.tags = event.tags || [];
  if (!event.tags.includes(tag)) {
    event.tags.push(tag);
    event.updatedAt = new Date();
    await event.save();
  }
  return event.toObject();
};

/**
 * 일정(Event)에서 태그 제거 (DB)
 */
exports.removeTagFromEvent = async (eventId, tag) => {
  const event = await Event.findOne({ id: eventId });
  if (!event || !event.tags) return null;
  event.tags = event.tags.filter(t => t !== tag);
  event.updatedAt = new Date();
  await event.save();
  return event.toObject();
};

/**
 * 전체 태그 목록(중복 제거, DB)
 */
exports.getAllTags = async () => {
  const events = await Event.find({}, 'tags').lean();
  const tagSet = new Set();
  events.forEach(e => (e.tags || []).forEach(t => tagSet.add(t)));
  return Array.from(tagSet);
};

/**
 * 일정(Event)에 카테고리 지정 (DB)
 */
exports.addCategoryToEvent = async (eventId, category) => {
  const event = await Event.findOne({ id: eventId });
  if (!event) return null;
  event.category = category;
  event.updatedAt = new Date();
  await event.save();
  return event.toObject();
};

/**
 * 일정(Event)에서 카테고리 제거 (DB)
 */
exports.removeCategoryFromEvent = async (eventId) => {
  const event = await Event.findOne({ id: eventId });
  if (!event) return null;
  event.category = undefined;
  event.updatedAt = new Date();
  await event.save();
  return event.toObject();
};

/**
 * 전체 카테고리 목록(중복 제거, DB)
 */
exports.getAllCategories = async () => {
  const events = await Event.find({}, 'category').lean();
  const catSet = new Set();
  events.forEach(e => e.category && catSet.add(e.category));
  return Array.from(catSet);
};

/**
 * 캘린더에 사용자 공유(권한 부여)
 * @param {string} calendarId
 * @param {string} userId
 * @param {string} role ('reader'|'writer'|'admin')
 */
exports.addCalendarShare = async (calendarId, userId, role = 'reader') => {
  const calendar = await Calendar.findOne({ id: calendarId });
  if (!calendar) return null;
  // 이미 존재하면 role만 업데이트
  const idx = calendar.sharedWith.findIndex(s => s.userId === userId);
  if (idx >= 0) {
    calendar.sharedWith[idx].role = role;
  } else {
    calendar.sharedWith.push({ userId, role });
  }
  calendar.updatedAt = new Date();
  await calendar.save();
  return calendar.toObject();
};

/**
 * 캘린더 공유 사용자 삭제(권한 회수)
 */
exports.removeCalendarShare = async (calendarId, userId) => {
  const calendar = await Calendar.findOne({ id: calendarId });
  if (!calendar) return null;
  calendar.sharedWith = calendar.sharedWith.filter(s => s.userId !== userId);
  calendar.updatedAt = new Date();
  await calendar.save();
  return calendar.toObject();
};

/**
 * 캘린더 공유 사용자 권한(role) 변경
 */
exports.updateCalendarShareRole = async (calendarId, userId, newRole) => {
  const calendar = await Calendar.findOne({ id: calendarId });
  if (!calendar) return null;
  const idx = calendar.sharedWith.findIndex(s => s.userId === userId);
  if (idx >= 0) {
    calendar.sharedWith[idx].role = newRole;
    calendar.updatedAt = new Date();
    await calendar.save();
    return calendar.toObject();
  }
  return null;
};

/**
 * 특정 사용자의 캘린더 내 권한(role) 확인
 * @returns 'owner' | 'admin' | 'writer' | 'reader' | null
 */
exports.getUserCalendarRole = async (calendarId, userId) => {
  const calendar = await Calendar.findOne({ id: calendarId }).lean();
  if (!calendar) return null;
  if (calendar.ownerId === userId) return 'owner';
  const share = (calendar.sharedWith || []).find(s => s.userId === userId);
  return share ? share.role : null;
};

/**
 * 이벤트에 첨부파일 추가
 */
exports.addAttachment = async (eventId, fileMeta) => {
  const event = await Event.findOne({ id: eventId });
  if (!event) return null;
  event.attachments = event.attachments || [];
  event.attachments.push(fileMeta);
  event.updatedAt = new Date();
  await event.save();
  return event.toObject();
};

/**
 * 이벤트 첨부파일 삭제
 */
exports.removeAttachment = async (eventId, filename) => {
  const event = await Event.findOne({ id: eventId });
  if (!event) return null;
  event.attachments = (event.attachments || []).filter(f => f.filename !== filename);
  event.updatedAt = new Date();
  await event.save();
  return event.toObject();
};

// TODO: 수정, 삭제, 상세조회 등 추가 