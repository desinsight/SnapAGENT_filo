// templateController.js
// 일정 템플릿 관련 API 컨트롤러 - 완전 비동기 처리
// 편의성 극대화 기능들
// 확장성, 연동성, 주석, 테스트, 문서화, 플러그인화 원칙 준수

const templateService = require('../services/templateService');
const responseUtil = require('../utils/response');

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: 템플릿 목록 조회
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [personal, team, public]
 *         description: 템플릿 타입 필터
 *     responses:
 *       200:
 *         description: 템플릿 목록 조회 성공
 */
/**
 * 템플릿 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 템플릿 목록
 */
exports.getTemplates = async (req, res) => {
  try {
    const { type, category, limit, offset } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (type && !['personal', 'team', 'public'].includes(type)) {
      return res.status(400).json(responseUtil.error('템플릿 타입은 personal, team, public 중 하나여야 합니다.'));
    }
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json(responseUtil.error('limit은 1-100 사이의 숫자여야 합니다.'));
    }
    if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json(responseUtil.error('offset은 0 이상의 숫자여야 합니다.'));
    }
    
    const templates = await templateService.getTemplates(userId, { type, category, limit, offset });
    
    res.json(responseUtil.success({ templates }));
  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿 목록을 조회할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: 템플릿 상세 조회
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 템플릿 상세 조회 성공
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
/**
 * 템플릿 상세 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 템플릿 상세 정보
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 ID는 필수입니다.'));
    }

    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json(responseUtil.error('템플릿을 찾을 수 없습니다.'));
    }

    // 권한 확인 (개인 템플릿은 소유자만, 팀/공개 템플릿은 접근 가능)
    if (template.type === 'personal' && template.ownerId !== userId) {
      return res.status(403).json(responseUtil.error('이 템플릿에 접근할 권한이 없습니다.'));
    }
    
    res.json(responseUtil.success({ template }));
  } catch (error) {
    console.error('템플릿 상세 조회 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿을 조회할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: 템플릿 생성
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - template
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, team, public]
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               template:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   duration:
 *                     type: number
 *                   color:
 *                     type: string
 *     responses:
 *       201:
 *         description: 템플릿 생성 성공
 *       400:
 *         description: 필수 필드 누락
 */
/**
 * 템플릿 생성
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 템플릿 정보
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, type, category, tags, template } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 이름은 필수입니다.'));
    }
    if (name.trim().length > 100) {
      return res.status(400).json(responseUtil.error('템플릿 이름은 100자를 초과할 수 없습니다.'));
    }
    if (description && description.length > 500) {
      return res.status(400).json(responseUtil.error('설명은 500자를 초과할 수 없습니다.'));
    }
    if (type && !['personal', 'team', 'public'].includes(type)) {
      return res.status(400).json(responseUtil.error('템플릿 타입은 personal, team, public 중 하나여야 합니다.'));
    }
    if (category && category.length > 50) {
      return res.status(400).json(responseUtil.error('카테고리는 50자를 초과할 수 없습니다.'));
    }
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || tag.length > 30))) {
      return res.status(400).json(responseUtil.error('태그는 문자열 배열이며 각 태그는 30자를 초과할 수 없습니다.'));
    }
    if (!template || typeof template !== 'object') {
      return res.status(400).json(responseUtil.error('템플릿 데이터는 필수입니다.'));
    }

    const templateData = {
      name: name.trim(),
      description: description?.trim(),
      type: type || 'personal',
      category: category?.trim(),
      tags: tags?.map(tag => tag.trim()).filter(tag => tag.length > 0),
      template,
      ownerId: userId
    };
    
    const createdTemplate = await templateService.createTemplate(templateData);
    
    res.status(201).json(responseUtil.success({ template: createdTemplate }));
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿을 생성할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/{id}/create-event:
 *   post:
 *     summary: 템플릿에서 일정 생성 (복사/붙여넣기)
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start:
 *                 type: string
 *                 format: date-time
 *               end:
 *                 type: string
 *                 format: date-time
 *               calendarId:
 *                 type: string
 *               customData:
 *                 type: object
 *     responses:
 *       201:
 *         description: 일정 생성 성공
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
/**
 * 템플릿에서 일정 생성 (복사/붙여넣기)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 일정 정보
 */
exports.createEventFromTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, calendarId, customData } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 ID는 필수입니다.'));
    }
    if (!start || isNaN(Date.parse(start))) {
      return res.status(400).json(response.error('올바른 시작일 형식이 아닙니다.'));
    }
    if (end && isNaN(Date.parse(end))) {
      return res.status(400).json(response.error('올바른 종료일 형식이 아닙니다.'));
    }
    if (start && end && new Date(start) >= new Date(end)) {
      return res.status(400).json(response.error('종료일은 시작일보다 늦어야 합니다.'));
    }
    if (calendarId && typeof calendarId !== 'string') {
      return res.status(400).json(response.error('캘린더 ID는 문자열이어야 합니다.'));
    }

    // 템플릿 존재 및 권한 확인
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json(responseUtil.error('템플릿을 찾을 수 없습니다.'));
    }
    if (template.type === 'personal' && template.ownerId !== userId) {
      return res.status(403).json(responseUtil.error('이 템플릿에 접근할 권한이 없습니다.'));
    }

    // 캘린더 권한 확인 (캘린더가 지정된 경우)
    if (calendarId) {
      const calendarService = require('../services/calendarService');
      const calendar = await calendarService.getCalendarById(calendarId);
      if (!calendar) {
        return res.status(404).json(responseUtil.error('캘린더를 찾을 수 없습니다.'));
      }
      const hasWriteAccess = calendar.ownerId === userId || 
                            (calendar.sharedWith && calendar.sharedWith.some(share => 
                              share.userId === userId && ['writer', 'admin'].includes(share.role)));
      if (!hasWriteAccess) {
        return res.status(403).json(responseUtil.error('이 캘린더에 일정을 생성할 권한이 없습니다.'));
      }
    }
    
    const event = await templateService.createEventFromTemplate(id, {
      start: new Date(start),
      end: end ? new Date(end) : null,
      calendarId,
      customData,
      createdBy: userId
    });
    
    res.status(201).json(responseUtil.success({ event }));
  } catch (error) {
    console.error('템플릿에서 일정 생성 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 일정을 생성할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/recommendations:
 *   get:
 *     summary: 스마트 템플릿 추천
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: 템플릿 추천 성공
 */
/**
 * 스마트 템플릿 추천
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 추천 템플릿 목록
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { limit, category } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 50)) {
      return res.status(400).json(responseUtil.error('limit은 1-50 사이의 숫자여야 합니다.'));
    }

    const recommendations = await templateService.getSmartRecommendations(userId, { limit, category });
    
    res.json(responseUtil.success({ recommendations }));
  } catch (error) {
    console.error('템플릿 추천 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿 추천을 받을 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/calendar/{eventId}/save-as-template:
 *   post:
 *     summary: 기존 일정을 템플릿으로 저장
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, team, public]
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: 템플릿 저장 성공
 *       404:
 *         description: 일정을 찾을 수 없음
 */
/**
 * 기존 일정을 템플릿으로 저장
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 템플릿 정보
 */
exports.saveEventAsTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, type, category, tags } = req.body;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      return res.status(400).json(responseUtil.error('이벤트 ID는 필수입니다.'));
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 이름은 필수입니다.'));
    }
    if (name.trim().length > 100) {
      return res.status(400).json(responseUtil.error('템플릿 이름은 100자를 초과할 수 없습니다.'));
    }
    if (description && description.length > 500) {
      return res.status(400).json(responseUtil.error('설명은 500자를 초과할 수 없습니다.'));
    }
    if (type && !['personal', 'team', 'public'].includes(type)) {
      return res.status(400).json(responseUtil.error('템플릿 타입은 personal, team, public 중 하나여야 합니다.'));
    }
    if (category && category.length > 50) {
      return res.status(400).json(responseUtil.error('카테고리는 50자를 초과할 수 없습니다.'));
    }
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || tag.length > 30))) {
      return res.status(400).json(responseUtil.error('태그는 문자열 배열이며 각 태그는 30자를 초과할 수 없습니다.'));
    }

    // 이벤트 존재 및 권한 확인
    const calendarService = require('../services/calendarService');
    const event = await calendarService.getEventById(eventId);
    if (!event) {
      return res.status(404).json(responseUtil.error('이벤트를 찾을 수 없습니다.'));
    }
    const calendar = await calendarService.getCalendarById(event.calendarId);
    if (!calendar) {
      return res.status(404).json(responseUtil.error('연관된 캘린더를 찾을 수 없습니다.'));
    }
    const hasAccess = calendar.ownerId === userId || 
                     (calendar.sharedWith && calendar.sharedWith.some(share => share.userId === userId));
    if (!hasAccess) {
      return res.status(403).json(responseUtil.error('이 이벤트에 접근할 권한이 없습니다.'));
    }

    const templateData = {
      name: name.trim(),
      description: description?.trim(),
      type: type || 'personal',
      category: category?.trim(),
      tags: tags?.map(tag => tag.trim()).filter(tag => tag.length > 0),
      ownerId: userId
    };
    
    const template = await templateService.saveEventAsTemplate(eventId, templateData);
    
    res.status(201).json(responseUtil.success({ template }));
  } catch (error) {
    console.error('일정을 템플릿으로 저장 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿을 저장할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/{id}/favorite:
 *   post:
 *     summary: 템플릿 즐겨찾기 토글
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 즐겨찾기 토글 성공
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
/**
 * 템플릿 즐겨찾기 토글
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 템플릿 정보
 */
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 ID는 필수입니다.'));
    }

    // 템플릿 존재 및 권한 확인
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json(responseUtil.error('템플릿을 찾을 수 없습니다.'));
    }
    if (template.type === 'personal' && template.ownerId !== userId) {
      return res.status(403).json(responseUtil.error('이 템플릿에 접근할 권한이 없습니다.'));
    }

    const updatedTemplate = await templateService.toggleFavorite(id, userId);
    
    res.json(responseUtil.success({ template: updatedTemplate }));
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 즐겨찾기를 토글할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: 템플릿 삭제
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 템플릿 삭제 성공
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
/**
 * 템플릿 삭제
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제 성공 메시지
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 ID는 필수입니다.'));
    }

    // 템플릿 존재 및 권한 확인
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json(responseUtil.error('템플릿을 찾을 수 없습니다.'));
    }
    if (template.ownerId !== userId) {
      return res.status(403).json(responseUtil.error('템플릿을 삭제할 권한이 없습니다.'));
    }
    
    await templateService.deleteTemplate(id, userId);
    
    res.json(responseUtil.success({ message: '템플릿이 삭제되었습니다' }));
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿을 삭제할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/search:
 *   get:
 *     summary: 템플릿 검색
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 템플릿 검색 성공
 */
/**
 * 템플릿 검색
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 검색된 템플릿 목록
 */
exports.searchTemplates = async (req, res) => {
  try {
    const { q, type, category, limit, offset } = req.query;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json(responseUtil.error('검색어를 입력해주세요'));
    }
    if (q.trim().length > 100) {
      return res.status(400).json(responseUtil.error('검색어는 100자를 초과할 수 없습니다.'));
    }
    if (type && !['personal', 'team', 'public'].includes(type)) {
      return res.status(400).json(responseUtil.error('템플릿 타입은 personal, team, public 중 하나여야 합니다.'));
    }
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json(responseUtil.error('limit은 1-100 사이의 숫자여야 합니다.'));
    }
    if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json(responseUtil.error('offset은 0 이상의 숫자여야 합니다.'));
    }
    
    const templates = await templateService.searchTemplates(q.trim(), userId, { type, category, limit, offset });
    
    res.json(responseUtil.success({ templates }));
  } catch (error) {
    console.error('템플릿 검색 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿을 검색할 수 없습니다.'));
  }
};

/**
 * @swagger
 * /api/templates/{id}/usage:
 *   post:
 *     summary: 템플릿 사용 통계 업데이트
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용 통계 업데이트 성공
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
/**
 * 템플릿 사용 통계 업데이트
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 템플릿 정보
 */
exports.updateTemplateUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 입력값 검증
    if (!userId) {
      return res.status(401).json(responseUtil.error('인증이 필요합니다.'));
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json(responseUtil.error('템플릿 ID는 필수입니다.'));
    }

    // 템플릿 존재 및 권한 확인
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json(responseUtil.error('템플릿을 찾을 수 없습니다.'));
    }
    if (template.type === 'personal' && template.ownerId !== userId) {
      return res.status(403).json(responseUtil.error('이 템플릿에 접근할 권한이 없습니다.'));
    }

    const updatedTemplate = await templateService.updateTemplateUsage(id, userId);
    
    res.json(responseUtil.success({ template: updatedTemplate }));
  } catch (error) {
    console.error('템플릿 사용 통계 업데이트 오류:', error);
    res.status(500).json(responseUtil.error('서버 오류로 템플릿 사용 통계를 업데이트할 수 없습니다.'));
  }
}; 