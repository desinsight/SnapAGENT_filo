/**
 * 검색 서비스
 * 고급 검색 기능 및 검색 최적화
 * 
 * @author Your Team
 * @version 1.0.0
 */

import logger from '../../utils/logger.js';
import { getCache, setCache } from '../../config/redis.js';
import { searchDocuments } from '../../config/elasticsearch.js';

class SearchService {
  constructor() {
    this.name = 'search';
    this.available = true;
    this.version = '1.0.0';
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      logger.info('🔍 SearchService 초기화...');
      
      this.available = true;
      logger.info('✅ SearchService 초기화 완료');

    } catch (error) {
      logger.error('❌ SearchService 초기화 실패:', error);
      this.available = false;
      throw error;
    }
  }

  /**
   * 고급 검색
   */
  async advancedSearch(query, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('고급 검색 실행:', { query, userId, options });

      // 캐시 키 생성
      const cacheKey = `search:${userId}:${JSON.stringify({ query, options })}`;
      const cachedResults = await getCache(cacheKey);
      
      if (cachedResults) {
        return {
          success: true,
          data: cachedResults,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }

      // 검색 실행
      const results = await this.executeSearch(query, userId, options);
      
      // 캐시에 저장 (5분)
      await setCache(cacheKey, results, 300);
      
      return {
        success: true,
        data: results,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('고급 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 검색 실행
   */
  async executeSearch(query, userId, options = {}) {
    const searchOptions = {
      userId,
      size: options.limit || 20,
      from: options.offset || 0,
      category: options.category,
      tags: options.tags,
      isShared: options.isShared,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo
    };

    try {
      // Elasticsearch 검색 시도
      const results = await searchDocuments('notes', query, searchOptions);
      return results;
    } catch (error) {
      logger.warn('Elasticsearch 검색 실패, MongoDB 검색으로 대체:', error);
      // MongoDB 검색으로 fallback
      return await this.mongoSearch(query, userId, searchOptions);
    }
  }

  /**
   * MongoDB 검색 (fallback)
   */
  async mongoSearch(query, userId, options) {
    const { Note } = await import('../models/Note.js');
    
    const searchQuery = {
      $and: [
        {
          $or: [
            { userId },
            { 'collaborators.userId': userId },
            { visibility: 'public' }
          ]
        },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } },
            { searchKeywords: { $in: [new RegExp(query, 'i')] } }
          ]
        },
        { deletedAt: null }
      ]
    };

    // 필터 적용
    if (options.category) {
      searchQuery.$and.push({ category: options.category });
    }

    if (options.tags && options.tags.length > 0) {
      searchQuery.$and.push({ tags: { $in: options.tags } });
    }

    if (options.isShared !== undefined) {
      searchQuery.$and.push({ isShared: options.isShared });
    }

    if (options.dateFrom || options.dateTo) {
      const dateFilter = {};
      if (options.dateFrom) dateFilter.$gte = new Date(options.dateFrom);
      if (options.dateTo) dateFilter.$lte = new Date(options.dateTo);
      searchQuery.$and.push({ updatedAt: dateFilter });
    }

    const notes = await Note.find(searchQuery)
      .sort({ updatedAt: -1 })
      .limit(options.size)
      .skip(options.from);

    return {
      hits: {
        hits: notes.map(note => ({ _source: note.toObject() })),
        total: { value: notes.length }
      }
    };
  }

  /**
   * 검색 제안
   */
  async getSearchSuggestions(query, userId) {
    try {
      // 캐시에서 제안 확인
      const cacheKey = `suggestions:${userId}:${query}`;
      const cachedSuggestions = await getCache(cacheKey);
      
      if (cachedSuggestions) {
        return {
          success: true,
          data: cachedSuggestions,
          fromCache: true
        };
      }

      // 검색 제안 생성
      const suggestions = await this.generateSuggestions(query, userId);
      
      // 캐시에 저장 (10분)
      await setCache(cacheKey, suggestions, 600);
      
      return {
        success: true,
        data: suggestions
      };

    } catch (error) {
      logger.error('검색 제안 생성 실패:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * 검색 제안 생성
   */
  async generateSuggestions(query, userId) {
    const { Note } = await import('../models/Note.js');
    
    // 사용자의 노트에서 제안 생성
    const notes = await Note.find({
      $or: [
        { userId },
        { 'collaborators.userId': userId }
      ],
      deletedAt: null
    }).select('title tags category').limit(100);

    const suggestions = new Set();

    // 제목에서 제안
    notes.forEach(note => {
      if (note.title && note.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(note.title);
      }
    });

    // 태그에서 제안
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    // 카테고리에서 제안
    const categories = ['개인', '업무', '학습', '아이디어', '할일', '기타'];
    categories.forEach(category => {
      if (category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(category);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * 인기 검색어
   */
  async getPopularSearches(userId) {
    try {
      const cacheKey = `popular_searches:${userId}`;
      const cachedPopular = await getCache(cacheKey);
      
      if (cachedPopular) {
        return {
          success: true,
          data: cachedPopular,
          fromCache: true
        };
      }

      // 인기 검색어 생성 (간단한 구현)
      const popularSearches = [
        '프로젝트',
        '회의록',
        '아이디어',
        '할일',
        '학습',
        '업무',
        '개인'
      ];

      // 캐시에 저장 (1시간)
      await setCache(cacheKey, popularSearches, 3600);
      
      return {
        success: true,
        data: popularSearches
      };

    } catch (error) {
      logger.error('인기 검색어 조회 실패:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * 검색 통계
   */
  async getSearchStats(userId) {
    try {
      const { Note } = await import('../models/Note.js');
      
      const stats = await Note.aggregate([
        {
          $match: {
            $or: [
              { userId },
              { 'collaborators.userId': userId }
            ],
            deletedAt: null
          }
        },
        {
          $group: {
            _id: null,
            totalNotes: { $sum: 1 },
            categories: { $addToSet: '$category' },
            tags: { $addToSet: '$tags' },
            avgViewCount: { $avg: '$viewCount' },
            avgEditCount: { $avg: '$editCount' }
          }
        }
      ]);

      return {
        success: true,
        data: stats[0] || {
          totalNotes: 0,
          categories: [],
          tags: [],
          avgViewCount: 0,
          avgEditCount: 0
        }
      };

    } catch (error) {
      logger.error('검색 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      available: this.available,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 서비스 정리
   */
  async cleanup() {
    logger.info('SearchService 정리 중...');
    this.available = false;
  }
}

export default SearchService; 