// templateService.js
// 일정 템플릿 관련 비즈니스 로직 - 완전 DB 기반
// 스마트 추천, 자동 학습, 편의성 극대화

const { v4: uuidv4 } = require('uuid');
const EventTemplate = require('../models/EventTemplate');
const Event = require('../models/Event');
const logger = require('../utils/logger');

// 커스텀 에러 클래스 정의
class TemplateServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'TemplateServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * 입력값 검증 유틸리티 함수들
 */
const validateTemplateData = (templateData) => {
  if (!templateData || typeof templateData !== 'object') {
    throw new TemplateServiceError('템플릿 데이터가 유효하지 않습니다', 400);
  }
  
  if (!templateData.title || typeof templateData.title !== 'string' || templateData.title.trim().length === 0) {
    throw new TemplateServiceError('템플릿 제목은 필수이며 비어있을 수 없습니다', 400);
  }
  
  if (templateData.title.length > 200) {
    throw new TemplateServiceError('템플릿 제목은 200자를 초과할 수 없습니다', 400);
  }
  
  if (templateData.description && typeof templateData.description !== 'string') {
    throw new TemplateServiceError('템플릿 설명은 문자열이어야 합니다', 400);
  }
  
  if (templateData.description && templateData.description.length > 1000) {
    throw new TemplateServiceError('템플릿 설명은 1000자를 초과할 수 없습니다', 400);
  }
  
  if (templateData.duration && (typeof templateData.duration !== 'number' || templateData.duration <= 0)) {
    throw new TemplateServiceError('템플릿 지속시간은 양수여야 합니다', 400);
  }
  
  if (templateData.color && !/^#[0-9A-Fa-f]{6}$/.test(templateData.color)) {
    throw new TemplateServiceError('템플릿 색상은 유효한 16진수 색상 코드여야 합니다', 400);
  }
  
  if (templateData.tags && !Array.isArray(templateData.tags)) {
    throw new TemplateServiceError('템플릿 태그는 배열이어야 합니다', 400);
  }
  
  if (templateData.tags && templateData.tags.some(tag => typeof tag !== 'string')) {
    throw new TemplateServiceError('템플릿 태그는 모두 문자열이어야 합니다', 400);
  }
  
  if (templateData.notifications && !Array.isArray(templateData.notifications)) {
    throw new TemplateServiceError('알림 설정은 배열이어야 합니다', 400);
  }
};

const validateTemplateParams = (params) => {
  if (!params.ownerId || typeof params.ownerId !== 'string') {
    throw new TemplateServiceError('소유자 ID는 필수입니다', 400);
  }
  
  if (!params.name || typeof params.name !== 'string' || params.name.trim().length === 0) {
    throw new TemplateServiceError('템플릿 이름은 필수입니다', 400);
  }
  
  if (params.name.length > 100) {
    throw new TemplateServiceError('템플릿 이름은 100자를 초과할 수 없습니다', 400);
  }
  
  if (params.type && !['personal', 'team', 'public'].includes(params.type)) {
    throw new TemplateServiceError('템플릿 타입은 personal, team, public 중 하나여야 합니다', 400);
  }
  
  if (params.category && typeof params.category !== 'string') {
    throw new TemplateServiceError('카테고리는 문자열이어야 합니다', 400);
  }
};

/**
 * 일정 템플릿 서비스
 * 템플릿 생성, 조회, 수정, 삭제, 복사, 재사용 기능 제공
 */
class TemplateService {
  /**
   * 템플릿 생성
   * @param {Object} templateData - 템플릿 데이터
   * @param {string} userId - 생성자 ID
   * @returns {Promise<Object>} 생성된 템플릿
   */
  async createTemplate(templateData, userId) {
    try {
      const template = new EventTemplate({
        ...templateData,
        createdBy: userId
      });
      
      await template.save();
      logger.info(`템플릿 생성 완료: ${template._id} by ${userId}`);
      
      return template;
    } catch (error) {
      logger.error('템플릿 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 기존 일정에서 템플릿 생성
   * @param {string} eventId - 일정 ID
   * @param {Object} templateInfo - 템플릿 정보
   * @param {string} userId - 생성자 ID
   * @returns {Promise<Object>} 생성된 템플릿
   */
  async createTemplateFromEvent(eventId, templateInfo, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('일정을 찾을 수 없습니다.');
      }

      // 일정 데이터를 템플릿 형식으로 변환
      const eventData = {
        title: event.title,
        description: event.description,
        location: event.location,
        color: event.color || '#3788d8',
        excludeHolidays: event.excludeHolidays || false,
        excludeDates: event.excludeDates || [],
        reminders: event.reminders || [],
        attendees: event.attendees || [],
        isPublic: event.isPublic || false,
        
        // 시간 정보
        duration: Math.round((new Date(event.end) - new Date(event.start)) / 60000), // 분 단위
        timeSlot: {
          startHour: new Date(event.start).getHours(),
          startMinute: new Date(event.start).getMinutes(),
          preferredDays: [],
          preferredTimeRanges: []
        },
        
        // 반복 정보
        recurrence: event.recurrence || null
      };

      const template = new EventTemplate({
        name: templateInfo.name,
        description: templateInfo.description,
        category: templateInfo.category || '기타',
        tags: templateInfo.tags || [],
        eventData,
        createdBy: userId,
        metadata: {
          source: 'manual',
          originalEventId: eventId
        }
      });

      await template.save();
      logger.info(`일정에서 템플릿 생성 완료: ${template._id} from event ${eventId}`);
      
      return template;
    } catch (error) {
      logger.error('일정에서 템플릿 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 조회 (단일)
   * @param {string} templateId - 템플릿 ID
   * @param {string} userId - 조회자 ID
   * @returns {Promise<Object>} 템플릿 정보
   */
  async getTemplate(templateId, userId) {
    try {
      const template = await EventTemplate.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { 'sharing.sharedWith.userId': userId },
          { 'sharing.isShared': true }
        ],
        isActive: true
      });

      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      return template;
    } catch (error) {
      logger.error('템플릿 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 목록 조회
   * @param {Object} filters - 필터 조건
   * @param {string} userId - 조회자 ID
   * @returns {Promise<Array>} 템플릿 목록
   */
  async getTemplates(filters = {}, userId) {
    try {
      const query = {
        $or: [
          { createdBy: userId },
          { 'sharing.sharedWith.userId': userId },
          { 'sharing.isShared': true }
        ],
        isActive: true
      };

      // 카테고리 필터
      if (filters.category) {
        query.category = filters.category;
      }

      // 태그 필터
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      // 검색어 필터
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // 정렬
      let sort = {};
      switch (filters.sortBy) {
        case 'popular':
          sort = { 'usageStats.useCount': -1 };
          break;
        case 'rating':
          sort = { 'usageStats.averageRating': -1 };
          break;
        case 'recent':
          sort = { 'usageStats.lastUsed': -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }

      const templates = await EventTemplate.find(query)
        .sort(sort)
        .limit(filters.limit || 20)
        .skip(filters.skip || 0);

      return templates;
    } catch (error) {
      logger.error('템플릿 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 인기 템플릿 조회
   * @param {number} limit - 조회 개수
   * @returns {Promise<Array>} 인기 템플릿 목록
   */
  async getPopularTemplates(limit = 10) {
    try {
      return await EventTemplate.findPopular(limit);
    } catch (error) {
      logger.error('인기 템플릿 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 최근 사용 템플릿 조회
   * @param {string} userId - 사용자 ID
   * @param {number} limit - 조회 개수
   * @returns {Promise<Array>} 최근 사용 템플릿 목록
   */
  async getRecentlyUsedTemplates(userId, limit = 10) {
    try {
      return await EventTemplate.findRecentlyUsed(userId, limit);
    } catch (error) {
      logger.error('최근 사용 템플릿 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 수정
   * @param {string} templateId - 템플릿 ID
   * @param {Object} updateData - 수정 데이터
   * @param {string} userId - 수정자 ID
   * @returns {Promise<Object>} 수정된 템플릿
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      const template = await EventTemplate.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!template) {
        throw new Error('템플릿을 찾을 수 없거나 수정 권한이 없습니다.');
      }

      // 버전 증가
      updateData.version = template.version + 1;

      const updatedTemplate = await EventTemplate.findByIdAndUpdate(
        templateId,
        updateData,
        { new: true, runValidators: true }
      );

      logger.info(`템플릿 수정 완료: ${templateId} by ${userId}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('템플릿 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 삭제
   * @param {string} templateId - 템플릿 ID
   * @param {string} userId - 삭제자 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteTemplate(templateId, userId) {
    try {
      const template = await EventTemplate.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!template) {
        throw new Error('템플릿을 찾을 수 없거나 삭제 권한이 없습니다.');
      }

      // 소프트 삭제
      template.isActive = false;
      await template.save();

      logger.info(`템플릿 삭제 완료: ${templateId} by ${userId}`);
      return true;
    } catch (error) {
      logger.error('템플릿 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 복사
   * @param {string} templateId - 원본 템플릿 ID
   * @param {Object} copyInfo - 복사 정보
   * @param {string} userId - 복사자 ID
   * @returns {Promise<Object>} 복사된 템플릿
   */
  async copyTemplate(templateId, copyInfo, userId) {
    try {
      const originalTemplate = await EventTemplate.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { 'sharing.sharedWith.userId': userId },
          { 'sharing.isShared': true }
        ],
        isActive: true
      });

      if (!originalTemplate) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      const copiedTemplate = new EventTemplate({
        name: copyInfo.name || `${originalTemplate.name} (복사본)`,
        description: copyInfo.description || originalTemplate.description,
        category: copyInfo.category || originalTemplate.category,
        tags: copyInfo.tags || [...originalTemplate.tags],
        eventData: originalTemplate.eventData,
        createdBy: userId,
        metadata: {
          source: 'manual',
          originalEventId: originalTemplate.metadata.originalEventId
        }
      });

      await copiedTemplate.save();
      logger.info(`템플릿 복사 완료: ${originalTemplate._id} -> ${copiedTemplate._id} by ${userId}`);
      
      return copiedTemplate;
    } catch (error) {
      logger.error('템플릿 복사 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿에서 일정 생성
   * @param {string} templateId - 템플릿 ID
   * @param {Date} targetDate - 대상 날짜
   * @param {string} calendarId - 캘린더 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 일정
   */
  async createEventFromTemplate(templateId, targetDate, calendarId, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);
      
      // 템플릿에서 일정 데이터 생성
      const eventData = template.createEventFromTemplate(targetDate, calendarId);
      
      // 일정 생성
      const event = new Event({
        ...eventData,
        createdBy: userId
      });
      
      await event.save();
      
      // 템플릿 사용 통계 업데이트
      await template.incrementUsage();
      
      logger.info(`템플릿에서 일정 생성 완료: ${template._id} -> ${event._id} by ${userId}`);
      
      return event;
    } catch (error) {
      logger.error('템플릿에서 일정 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 공유 설정
   * @param {string} templateId - 템플릿 ID
   * @param {Object} sharingData - 공유 설정
   * @param {string} userId - 설정자 ID
   * @returns {Promise<Object>} 업데이트된 템플릿
   */
  async updateSharing(templateId, sharingData, userId) {
    try {
      const template = await EventTemplate.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!template) {
        throw new Error('템플릿을 찾을 수 없거나 권한이 없습니다.');
      }

      const updateData = {
        'sharing.isShared': sharingData.isShared || false
      };

      if (sharingData.sharedWith) {
        updateData['sharing.sharedWith'] = sharingData.sharedWith;
      }

      const updatedTemplate = await EventTemplate.findByIdAndUpdate(
        templateId,
        { $set: updateData },
        { new: true }
      );

      logger.info(`템플릿 공유 설정 업데이트: ${templateId} by ${userId}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('템플릿 공유 설정 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 평점 추가
   * @param {string} templateId - 템플릿 ID
   * @param {number} rating - 평점 (0-5)
   * @param {string} userId - 평가자 ID
   * @returns {Promise<Object>} 업데이트된 템플릿
   */
  async addRating(templateId, rating, userId) {
    try {
      const template = await EventTemplate.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { 'sharing.sharedWith.userId': userId },
          { 'sharing.isShared': true }
        ],
        isActive: true
      });

      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      await template.addRating(rating);
      logger.info(`템플릿 평점 추가: ${templateId} rating ${rating} by ${userId}`);
      
      return template;
    } catch (error) {
      logger.error('템플릿 평점 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 검색
   * @param {string} searchTerm - 검색어
   * @param {Object} filters - 추가 필터
   * @param {string} userId - 검색자 ID
   * @returns {Promise<Array>} 검색 결과
   */
  async searchTemplates(searchTerm, filters = {}, userId) {
    try {
      const query = {
        $or: [
          { createdBy: userId },
          { 'sharing.sharedWith.userId': userId },
          { 'sharing.isShared': true }
        ],
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      };

      if (filters.category) {
        query.category = filters.category;
      }

      const templates = await EventTemplate.find(query)
        .sort({ 'usageStats.useCount': -1, 'usageStats.averageRating': -1 })
        .limit(filters.limit || 20);

      return templates;
    } catch (error) {
      logger.error('템플릿 검색 오류:', error);
      throw error;
    }
  }
}

module.exports = new TemplateService(); 