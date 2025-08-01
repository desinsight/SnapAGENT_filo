/**
 * AdvancedSearchService - 고급 통합 검색 및 분석 서비스
 * Elasticsearch 기반의 문서/알림/코멘트 등 통합 검색 및 통계 분석 서비스
 *
 * @description
 * - 다양한 인덱스(문서, 알림, 코멘트 등)에 대한 통합 검색 지원
 * - 필터, 정렬, 하이라이트, 페이징, 통계 등 고급 검색 기능 제공
 * - Elasticsearch 쿼리 DSL 기반 동적 쿼리 생성
 * - 검색 결과 하이라이트 및 통계 데이터 반환
 * - 추후 AI 추천, 연관 문서, 사용자별 맞춤 검색 등 확장 고려
 *
 * @author Your Team
 * @version 1.0.0
 */

const { getElasticsearchClient } = require('../config/elasticsearch');
const { logger } = require('../config/logger');
const SearchLog = require('../models/SearchLog');

/**
 * 고급 검색 서비스 클래스
 * 다양한 인덱스에 대한 통합 검색 및 분석 기능 제공
 */
class AdvancedSearchService {
  constructor() {
    this.client = getElasticsearchClient();
    // 인덱스명 정의 (확장 가능)
    this.indexMap = {
      document: 'documents',
      notification: 'notifications',
      comment: 'comments'
    };
  }

  /**
   * 통합 검색 실행
   * @param {Object} params - 검색 파라미터
   * @param {string} params.q - 검색어
   * @param {string[]} params.indices - 검색 대상 인덱스 배열 (예: ['document', 'notification'])
   * @param {Object} params.filters - 필터 조건 (예: { type: 'report', status: 'active' })
   * @param {Object} params.sort - 정렬 조건 (예: { createdAt: 'desc' })
   * @param {number} params.page - 페이지 번호 (1부터 시작)
   * @param {number} params.limit - 페이지당 결과 수
   * @param {Object} params.highlight - 하이라이트 옵션
   * @param {Object} params.options - 추가 옵션 (userId, sessionId, ip 등)
   * @returns {Promise<Object>} 검색 결과 및 통계
   */
  async search({ q = '', indices = ['document'], filters = {}, sort = {}, page = 1, limit = 20, highlight = {}, options = {} }) {
    const startTime = Date.now();
    try {
      // 실제 사용할 인덱스명 배열로 변환
      const esIndices = indices.map(idx => this.indexMap[idx] || idx);
      const from = (page - 1) * limit;

      // 동적 쿼리 DSL 생성
      const esQuery = {
        bool: {
          must: [],
          filter: []
        }
      };

      // 검색어 쿼리
      if (q && q.trim().length > 0) {
        esQuery.bool.must.push({
          multi_match: {
            query: q,
            fields: [
              'title^3',
              'content^2',
              'message',
              'comment',
              'tags',
              'authorName',
              'recipientName'
            ],
            fuzziness: 'AUTO',
            type: 'best_fields'
          }
        });
      }

      // 필터 조건
      for (const [field, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          esQuery.bool.filter.push({ terms: { [field]: value } });
        } else {
          esQuery.bool.filter.push({ term: { [field]: value } });
        }
      }

      // 정렬 조건
      const esSort = [];
      for (const [field, direction] of Object.entries(sort)) {
        esSort.push({ [field]: { order: direction } });
      }
      if (esSort.length === 0) {
        esSort.push({ createdAt: { order: 'desc' } });
      }

      // 하이라이트 옵션
      const esHighlight = highlight && Object.keys(highlight).length > 0 ? highlight : {
        fields: {
          title: {},
          content: {},
          message: {},
          comment: {}
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      };

      // Elasticsearch 검색 요청
      const response = await this.client.search({
        index: esIndices,
        from,
        size: limit,
        body: {
          query: esQuery,
          sort: esSort,
          highlight: esHighlight,
          aggs: {
            by_type: { terms: { field: '_index' } },
            by_status: { terms: { field: 'status' } },
            by_author: { terms: { field: 'authorId' } },
            by_date: { date_histogram: { field: 'createdAt', calendar_interval: 'day' } }
          }
        }
      });

      // 결과 파싱
      const hits = response.body.hits.hits.map(hit => ({
        id: hit._id,
        index: hit._index,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight
      }));
      const total = response.body.hits.total.value;
      const aggs = response.body.aggregations;

      // 검색 로그 기록
      try {
        await SearchLog.create({
          userId: options.userId,
          sessionId: options.sessionId,
          ip: options.ip,
          query: q,
          indices,
          filters,
          sort,
          highlight,
          resultCount: total,
          results: hits.slice(0, 10).map(r => ({ id: r.id, index: r.index, score: r.score })),
          durationMs: Date.now() - startTime,
          metadata: options.metadata
        });
      } catch (logError) {
        logger.warn('검색 로그 기록 실패:', logError);
      }

      return {
        success: true,
        data: {
          results: hits,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          aggregations: aggs
        }
      };
    } catch (error) {
      logger.error('고급 검색 실패:', error);
      return {
        success: false,
        message: '검색 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * 단일 인덱스(문서/알림/코멘트 등) 전용 검색
   * @param {string} index - 인덱스명 (document/notification/comment)
   * @param {Object} params - 검색 파라미터
   * @returns {Promise<Object>} 검색 결과
   */
  async searchByIndex(index, params) {
    return this.search({ ...params, indices: [index] });
  }

  /**
   * 통계/분석 데이터 조회 (예: 일별 생성량, 상태별 분포 등)
   * @param {string[]} indices - 분석 대상 인덱스 배열
   * @param {Object} aggs - 집계 쿼리 정의
   * @returns {Promise<Object>} 통계 결과
   */
  async getAggregations(indices = ['document'], aggs = {}) {
    try {
      const esIndices = indices.map(idx => this.indexMap[idx] || idx);
      const response = await this.client.search({
        index: esIndices,
        size: 0,
        body: {
          aggs: aggs || {
            by_type: { terms: { field: '_index' } },
            by_status: { terms: { field: 'status' } },
            by_author: { terms: { field: 'authorId' } },
            by_date: { date_histogram: { field: 'createdAt', calendar_interval: 'day' } }
          }
        }
      });
      return {
        success: true,
        data: response.body.aggregations
      };
    } catch (error) {
      logger.error('검색 통계/분석 실패:', error);
      return {
        success: false,
        message: '통계/분석 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const advancedSearchService = new AdvancedSearchService();
module.exports = advancedSearchService; 