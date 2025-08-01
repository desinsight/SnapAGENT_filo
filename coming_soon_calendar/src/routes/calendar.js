// 캘린더 서비스 라우트
// 캘린더/이벤트 관련 API 엔드포인트 정의
// controllers/calendarController.js와 연동

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const auth = require('../middlewares/auth');
const templateController = require('../controllers/templateController');
const { singleUpload } = require('../middlewares/upload');

// 모든 캘린더/이벤트 API에 인증 적용
router.use(auth.authenticate);

// 캘린더 목록 조회
router.get('/', calendarController.getCalendars);
// 캘린더 생성
router.post('/', calendarController.createCalendar);

// 일정(이벤트) 목록 조회
router.get('/events', calendarController.getEvents);
// 일정(이벤트) 생성
router.post('/events', calendarController.createEvent);

// 캘린더 상세조회 (id는 UUID v4 형식만 허용)
router.get('/:id([0-9a-fA-F\-]{36})', calendarController.getCalendarById);
// 캘린더 수정
router.put('/:id([0-9a-fA-F\-]{36})', calendarController.updateCalendar);
// 캘린더 삭제
router.delete('/:id([0-9a-fA-F\-]{36})', calendarController.deleteCalendar);

// 이벤트 상세조회 (id는 UUID v4 형식만 허용)
router.get('/events/:id([0-9a-fA-F\-]{36})', calendarController.getEventById);
// 이벤트 수정
router.put('/events/:id([0-9a-fA-F\-]{36})', calendarController.updateEvent);
// 이벤트 삭제
router.delete('/events/:id([0-9a-fA-F\-]{36})', calendarController.deleteEvent);

// 반복 일정 발생일(예: 한 달치) 조회 - 고도화
router.get('/events/:id/recurring-dates', calendarController.getRecurringDates);

// 일정 충돌 감지 및 해결
router.post('/events/conflicts', calendarController.detectConflicts); // 일정 충돌 감지
router.post('/events/conflicts/resolutions', calendarController.suggestConflictResolutions); // 충돌 해결 제안

// 알림(Notification) 관련 라우트
router.get('/events/:eventId/notifications', calendarController.getNotifications); // 알림 목록 조회
router.post('/events/:eventId/notifications', calendarController.addNotification); // 알림 추가
router.put('/events/:eventId/notifications/:notificationId', calendarController.updateNotification); // 알림 수정
router.delete('/events/:eventId/notifications/:notificationId', calendarController.deleteNotification); // 알림 삭제

// 참석자(Attendee) 관련 라우트
router.post('/events/:eventId/attendees', calendarController.addAttendee); // 참석자 초대
router.put('/events/:eventId/attendees/:userId', calendarController.setAttendeeStatus); // 참석자 상태 변경
router.get('/events/:eventId/attendees/:userId', calendarController.getAttendeeStatus); // 특정 참석자 상태 조회
router.get('/events/:eventId/attendees', calendarController.getAllAttendeeStatus); // 전체 참석자 상태 목록

// 태그(Tag) 관련 라우트
router.post('/events/:eventId/tags', calendarController.addTagToEvent); // 태그 추가
router.delete('/events/:eventId/tags/:tag', calendarController.removeTagFromEvent); // 태그 제거
router.get('/tags', calendarController.getAllTags); // 전체 태그 목록

// 카테고리(Category) 관련 라우트
router.post('/events/:eventId/category', calendarController.addCategoryToEvent); // 카테고리 지정
router.delete('/events/:eventId/category', calendarController.removeCategoryFromEvent); // 카테고리 제거
router.get('/categories', calendarController.getAllCategories); // 전체 카테고리 목록

// 고급 검색/필터/정렬: 일정(Event) 목록
router.get('/events/search', calendarController.searchEvents);

// 일정을 템플릿으로 저장
router.post('/:id/save-as-template', templateController.saveEventAsTemplate);

// 캘린더 공유/권한 관련 라우트
router.post('/:id([0-9a-fA-F\-]{36})/share', calendarController.shareCalendar); // 공유(권한 부여)
router.delete('/:id([0-9a-fA-F\-]{36})/share', calendarController.unshareCalendar); // 공유 해제(권한 회수)
router.patch('/:id([0-9a-fA-F\-]{36})/share', calendarController.updateShareRole); // 권한(role) 변경
router.get('/:id([0-9a-fA-F\-]{36})/role', calendarController.getUserRole); // 특정 사용자의 권한 확인

// 첨부파일 관련 라우트
router.post('/events/:eventId/attachments', singleUpload, calendarController.uploadAttachment); // 파일 업로드
router.get('/events/:eventId/attachments', calendarController.listAttachments); // 파일 목록
router.get('/events/:eventId/attachments/:filename', calendarController.downloadAttachment); // 파일 다운로드
router.delete('/events/:eventId/attachments/:filename', calendarController.deleteAttachment); // 파일 삭제

// 충돌 해결 제안 조회
router.get('/conflicts/suggestions', calendarController.getConflictSuggestions);

// 위치 정보 및 지도 연동 라우트
router.post('/geocode', calendarController.geocodeAddress); // 주소를 좌표로 변환
router.post('/reverse-geocode', calendarController.reverseGeocode); // 좌표를 주소로 변환
router.get('/places/search', calendarController.searchPlaces); // 장소 검색
router.get('/places/:placeId', calendarController.getPlaceDetails); // 장소 상세 정보
router.post('/directions', calendarController.getDirections); // 경로 안내
router.get('/transportation/nearby', calendarController.getNearbyTransportation); // 주변 교통 정보
router.post('/location/validate', calendarController.validateLocation); // 위치 정보 검증

// 공유 캘린더 관련 라우트
router.post('/:calendarId/share', auth.authenticate, calendarController.shareCalendar);
router.post('/:calendarId/invite/respond', auth.authenticate, calendarController.respondToInvite);
router.put('/:calendarId/share/:userId/permissions', auth.authenticate, calendarController.updateSharingPermissions);
router.delete('/:calendarId/share/:userId', auth.authenticate, calendarController.revokeSharing);

// 공개 링크 관련 라우트
router.post('/:calendarId/public-link', auth.authenticate, calendarController.createPublicLink);
router.get('/public/:token', calendarController.accessPublicLink);

// 공유 상태 조회 라우트
router.get('/shared', auth.authenticate, calendarController.getSharedCalendars);
router.get('/:calendarId/sharing-status', auth.authenticate, calendarController.getSharingStatus);

// 권한별 접근 제어가 필요한 라우트들
router.get('/:calendarId', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getCalendarById);
router.put('/:calendarId', auth.authenticate, calendarController.checkPermission('manageCalendar'), calendarController.updateCalendar);
router.delete('/:calendarId', auth.authenticate, calendarController.checkPermission('manageCalendar'), calendarController.deleteCalendar);

// 이벤트 관련 라우트 (권한별 접근 제어 적용)
router.post('/:calendarId/events', auth.authenticate, calendarController.checkPermission('createEvents'), calendarController.createEvent);
router.get('/:calendarId/events', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getEvents);
router.get('/:calendarId/events/:eventId', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getEventById);
router.put('/:calendarId/events/:eventId', auth.authenticate, calendarController.checkPermission('editEvents'), calendarController.updateEvent);
router.delete('/:calendarId/events/:eventId', auth.authenticate, calendarController.checkPermission('deleteEvents'), calendarController.deleteEvent);

// 충돌 감지 라우트 (권한별 접근 제어 적용)
router.post('/:calendarId/events/check-conflicts', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.checkEventConflicts);
router.post('/:calendarId/events/resolve-conflicts', auth.authenticate, calendarController.checkPermission('editEvents'), calendarController.resolveEventConflicts);

// 위치 정보 관련 라우트 (권한별 접근 제어 적용)
router.get('/:calendarId/events/:eventId/location/search', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.searchLocation);
router.get('/:calendarId/events/:eventId/location/details', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getLocationDetails);
router.get('/:calendarId/events/:eventId/location/directions', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getDirections);
router.get('/:calendarId/events/:eventId/location/transport', auth.authenticate, calendarController.checkPermission('viewEvents'), calendarController.getTransportInfo);

// 참석자 관리 관련 라우트
router.post('/:calendarId/events/:eventId/attendees/invite', auth.authenticate, calendarController.inviteAttendees);
router.post('/:calendarId/events/:eventId/rsvp', auth.authenticate, calendarController.respondToRSVP);
router.get('/:calendarId/events/:eventId/attendees', auth.authenticate, calendarController.getAttendees);
router.get('/:calendarId/events/:eventId/attendees/:attendeeId', auth.authenticate, calendarController.getAttendeeDetails);
router.get('/:calendarId/events/:eventId/attendees/statistics', auth.authenticate, calendarController.getAttendeeStatistics);

// 참석자 코멘트 관련 라우트
router.post('/:calendarId/events/:eventId/attendees/:attendeeId/comments', auth.authenticate, calendarController.addAttendeeComment);
router.put('/:calendarId/events/:eventId/attendees/:attendeeId/comments/:commentIndex', auth.authenticate, calendarController.updateAttendeeComment);

// 참석자 출석 관리 라우트
router.put('/:calendarId/events/:eventId/attendees/:attendeeId/attendance', auth.authenticate, calendarController.updateAttendance);

// 참석자 그룹 관리 라우트
router.post('/:calendarId/events/:eventId/attendee-groups', auth.authenticate, calendarController.createAttendeeGroup);

// TODO: 캘린더/이벤트 수정, 삭제, 상세조회 등 추가

module.exports = router; 