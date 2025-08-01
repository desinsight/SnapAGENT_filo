// 캘린더 타입 정의

// 캘린더 타입
export const CalendarType = {
  id: 'string',
  name: 'string',
  description: 'string',
  color: 'string',
  ownerId: 'string',
  isVisible: 'boolean',
  isDefault: 'boolean',
  permissions: 'array',
  sharedWith: 'array',
  createdAt: 'date',
  updatedAt: 'date'
};

// 이벤트 타입
export const EventType = {
  id: 'string',
  calendarId: 'string',
  title: 'string',
  description: 'string',
  start: 'date',
  end: 'date',
  allDay: 'boolean',
  location: 'object',
  attendees: 'array',
  reminders: 'array',
  recurrence: 'object',
  priority: 'string',
  status: 'string',
  tags: 'array',
  category: 'string',
  attachments: 'array',
  createdBy: 'string',
  createdAt: 'date',
  updatedAt: 'date'
};

// 참석자 타입
export const AttendeeType = {
  id: 'string',
  name: 'string',
  email: 'string',
  status: 'string', // pending, accepted, declined, tentative
  role: 'string', // organizer, attendee, optional
  responseDate: 'date',
  comment: 'string'
};

// 알림 타입
export const ReminderType = {
  id: 'string',
  type: 'string', // email, push, sms, popup
  minutes: 'number', // 이벤트 전 몇 분
  message: 'string',
  isEnabled: 'boolean'
};

// 반복 타입
export const RecurrenceType = {
  frequency: 'string', // daily, weekly, monthly, yearly
  interval: 'number',
  daysOfWeek: 'array',
  endDate: 'date',
  count: 'number',
  byMonthDay: 'array',
  byMonth: 'array',
  exceptions: 'array'
};

// 위치 타입
export const LocationType = {
  name: 'string',
  address: 'string',
  latitude: 'number',
  longitude: 'number',
  placeId: 'string',
  notes: 'string'
};

// 캘린더 뷰 타입
export const CalendarViewType = {
  type: 'string', // month, week, day, list, agenda
  date: 'date',
  selectedDate: 'date',
  selectedEvent: 'object',
  filters: 'object',
  settings: 'object'
};

// 알림 타입
export const NotificationType = {
  id: 'string',
  title: 'string',
  message: 'string',
  type: 'string',
  priority: 'string',
  channels: 'object',
  recipients: 'array',
  scheduledAt: 'date',
  sentAt: 'date',
  status: 'string',
  isRead: 'boolean',
  actions: 'array'
};

// 모듈 타입
export const ModuleType = {
  id: 'string',
  name: 'string',
  displayName: 'string',
  description: 'string',
  category: 'string',
  type: 'string',
  version: 'string',
  isEnabled: 'boolean',
  isInstalled: 'boolean',
  configuration: 'object',
  features: 'array',
  dependencies: 'array',
  permissions: 'array'
};

// 템플릿 타입
export const TemplateType = {
  id: 'string',
  name: 'string',
  description: 'string',
  category: 'string',
  type: 'string',
  template: 'object',
  isPublic: 'boolean',
  usageCount: 'number',
  rating: 'number',
  tags: 'array',
  createdBy: 'string',
  createdAt: 'date'
};

// UI 상태 타입
export const UIStateType = {
  currentView: 'string',
  currentDate: 'date',
  selectedDate: 'date',
  selectedEvent: 'object',
  selectedCalendar: 'string',
  isLoading: 'boolean',
  showEventForm: 'boolean',
  showCalendarForm: 'boolean',
  showNotificationPanel: 'boolean',
  showModulePanel: 'boolean',
  sidebarExpanded: 'boolean',
  filters: 'object',
  searchQuery: 'string'
};

// 에러 타입
export const ErrorType = {
  code: 'string',
  message: 'string',
  field: 'string',
  timestamp: 'date',
  stack: 'string'
};

// API 응늵 타입
export const APIResponseType = {
  success: 'boolean',
  data: 'any',
  error: 'object',
  message: 'string',
  timestamp: 'date'
};

// 페이지네이션 타입
export const PaginationType = {
  page: 'number',
  limit: 'number',
  total: 'number',
  totalPages: 'number',
  hasNext: 'boolean',
  hasPrev: 'boolean'
};

// 필터 타입
export const FilterType = {
  calendars: 'array',
  eventTypes: 'array',
  priorities: 'array',
  dateRange: 'object',
  tags: 'array',
  categories: 'array',
  attendees: 'array',
  status: 'array'
};

// 정렬 타입
export const SortType = {
  field: 'string',
  direction: 'string', // asc, desc
  priority: 'number'
};

// 사용자 설정 타입
export const UserSettingsType = {
  defaultView: 'string',
  timeFormat: 'string',
  weekStart: 'number',
  timezone: 'string',
  language: 'string',
  theme: 'string',
  notifications: 'object',
  workingHours: 'object',
  holidayCalendar: 'string',
  autoSave: 'boolean',
  showWeekNumbers: 'boolean',
  compactMode: 'boolean'
};