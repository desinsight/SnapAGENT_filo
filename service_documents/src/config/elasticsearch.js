/**
 * Elasticsearch Configuration - Elasticsearch 연결 설정
 * Elasticsearch 검색 엔진 연결 및 인덱스 관리
 * 
 * @description
 * - Elasticsearch 연결 설정
 * - 인덱스 생성 및 관리
 * - 검색 기능 설정
 * - 문서 인덱싱
 * - 검색 쿼리 최적화
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { Client } from '@elastic/elasticsearch';
import { setupLogger } from './logger.js';

const logger = setupLogger();

/**
 * Elasticsearch 클라이언트 인스턴스
 * 전역에서 사용할 Elasticsearch 클라이언트
 */
let esClient = null;

/**
 * Elasticsearch 연결 옵션
 * 성능 최적화 및 안정성을 위한 설정
 */
const esOptions = {
  // 연결 설정
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  
  // 인증 설정
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  },
  
  // SSL 설정
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  
  // 연결 풀 설정
  maxRetries: 3,
  requestTimeout: 30000,        // 요청 타임아웃 (30초)
  sniffOnStart: false,          // 시작 시 스니핑 비활성화
  sniffInterval: false,         // 스니핑 간격 비활성화
  
  // 압축 설정
  compression: 'gzip',
  
  // 로깅 설정
  log: process.env.NODE_ENV === 'development' ? 'info' : 'error'
};

/**
 * 문서 서비스 인덱스 설정
 * 문서 검색을 위한 인덱스 매핑 및 설정
 */
const documentIndexSettings = {
  index: process.env.ELASTICSEARCH_INDEX || 'documents',
  
  // 인덱스 설정
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    
    // 분석기 설정
    analysis: {
      analyzer: {
        // 한국어 분석기
        korean_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'trim', 'korean_stop', 'korean_stemmer']
        },
        // 영문 분석기
        english_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'trim', 'english_stop', 'english_stemmer']
        },
        // 통합 분석기
        multilingual_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'trim', 'stop', 'stemmer']
        }
      },
      
      // 필터 설정
      filter: {
        korean_stop: {
          type: 'stop',
          stopwords: ['그', '이', '저', '것', '수', '등', '및', '또는', '그리고']
        },
        korean_stemmer: {
          type: 'stemmer',
          language: 'light_korean'
        },
        english_stop: {
          type: 'stop',
          stopwords: '_english_'
        },
        english_stemmer: {
          type: 'stemmer',
          language: 'english'
        }
      }
    }
  },
  
  // 매핑 설정
  mappings: {
    properties: {
      // 기본 정보
      id: { type: 'keyword' },
      title: { 
        type: 'text',
        analyzer: 'multilingual_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          korean: { type: 'text', analyzer: 'korean_analyzer' },
          english: { type: 'text', analyzer: 'english_analyzer' }
        }
      },
      content: { 
        type: 'text',
        analyzer: 'multilingual_analyzer',
        fields: {
          korean: { type: 'text', analyzer: 'korean_analyzer' },
          english: { type: 'text', analyzer: 'english_analyzer' }
        }
      },
      description: { 
        type: 'text',
        analyzer: 'multilingual_analyzer'
      },
      
      // 문서 유형 및 분류
      type: { type: 'keyword' },
      category: { type: 'keyword' },
      tags: { type: 'keyword' },
      
      // 상태 및 권한
      status: { type: 'keyword' },
      visibility: { type: 'keyword' },
      permissions: {
        type: 'nested',
        properties: {
          userId: { type: 'keyword' },
          role: { type: 'keyword' },
          permissions: { type: 'keyword' }
        }
      },
      
      // 메타데이터
      createdBy: { type: 'keyword' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      version: { type: 'integer' },
      
      // 파일 정보
      attachments: {
        type: 'nested',
        properties: {
          id: { type: 'keyword' },
          filename: { type: 'text' },
          contentType: { type: 'keyword' },
          size: { type: 'long' },
          content: { 
            type: 'text',
            analyzer: 'multilingual_analyzer'
          }
        }
      },
      
      // 승인 정보
      approvalStatus: { type: 'keyword' },
      approvalHistory: {
        type: 'nested',
        properties: {
          userId: { type: 'keyword' },
          action: { type: 'keyword' },
          comment: { type: 'text' },
          timestamp: { type: 'date' }
        }
      },
      
      // 검색 최적화
      searchScore: { type: 'float' },
      lastAccessed: { type: 'date' },
      accessCount: { type: 'integer' }
    }
  }
};

/**
 * Elasticsearch 연결 함수
 * Elasticsearch 서버에 연결하고 클라이언트를 초기화
 * 
 * @returns {Promise<Client>} Elasticsearch 클라이언트 객체
 */
export const setupElasticsearch = async () => {
  try {
    // 이미 연결된 경우 기존 클라이언트 반환
    if (esClient) {
      logger.info('✅ Elasticsearch 이미 연결되어 있습니다.');
      return esClient;
    }

    logger.info('🔄 Elasticsearch 연결 시도 중...');
    logger.info(`📍 연결 URL: ${esOptions.node}`);

    // Elasticsearch 클라이언트 생성
    esClient = new Client(esOptions);

    // 연결 테스트
    const info = await esClient.info();
    logger.info('✅ Elasticsearch 연결 성공!');
    logger.info(`📊 클러스터: ${info.cluster_name}`);
    logger.info(`🌐 버전: ${info.version.number}`);

    // 인덱스 설정
    await setupIndex();

    return esClient;

  } catch (error) {
    logger.error('❌ Elasticsearch 연결 실패:', error);
    throw error;
  }
};

/**
 * 인덱스 설정 함수
 * 문서 검색을 위한 인덱스를 생성하고 설정
 * 
 * @returns {Promise<void>}
 */
const setupIndex = async () => {
  try {
    const indexName = documentIndexSettings.index;
    
    // 인덱스 존재 여부 확인
    const indexExists = await esClient.indices.exists({
      index: indexName
    });

    if (!indexExists) {
      logger.info(`📝 인덱스 생성 중: ${indexName}`);
      
      // 인덱스 생성
      await esClient.indices.create({
        index: indexName,
        body: {
          settings: documentIndexSettings.settings,
          mappings: documentIndexSettings.mappings
        }
      });

      logger.info(`✅ 인덱스 생성 완료: ${indexName}`);
    } else {
      logger.info(`✅ 인덱스 이미 존재: ${indexName}`);
    }

  } catch (error) {
    logger.error('❌ 인덱스 설정 실패:', error);
    throw error;
  }
};

/**
 * 문서 인덱싱 함수
 * 문서를 Elasticsearch에 인덱싱
 * 
 * @param {Object} document - 인덱싱할 문서 객체
 * @returns {Promise<Object>} 인덱싱 결과
 */
export const indexDocument = async (document) => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    
    // 문서 인덱싱
    const result = await esClient.index({
      index: indexName,
      id: document.id,
      body: {
        ...document,
        indexedAt: new Date().toISOString()
      }
    });

    logger.debug(`✅ 문서 인덱싱 완료: ${document.id}`);
    return result;

  } catch (error) {
    logger.error(`❌ 문서 인덱싱 실패: ${document.id}`, error);
    throw error;
  }
};

/**
 * 문서 업데이트 함수
 * Elasticsearch의 문서를 업데이트
 * 
 * @param {string} documentId - 문서 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateDocument = async (documentId, updates) => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    
    // 문서 업데이트
    const result = await esClient.update({
      index: indexName,
      id: documentId,
      body: {
        doc: {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
    });

    logger.debug(`✅ 문서 업데이트 완료: ${documentId}`);
    return result;

  } catch (error) {
    logger.error(`❌ 문서 업데이트 실패: ${documentId}`, error);
    throw error;
  }
};

/**
 * 문서 삭제 함수
 * Elasticsearch에서 문서를 삭제
 * 
 * @param {string} documentId - 문서 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteDocument = async (documentId) => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    
    // 문서 삭제
    const result = await esClient.delete({
      index: indexName,
      id: documentId
    });

    logger.debug(`✅ 문서 삭제 완료: ${documentId}`);
    return result;

  } catch (error) {
    logger.error(`❌ 문서 삭제 실패: ${documentId}`, error);
    throw error;
  }
};

/**
 * 검색 함수
 * Elasticsearch에서 문서를 검색
 * 
 * @param {Object} searchQuery - 검색 쿼리
 * @param {Object} options - 검색 옵션
 * @returns {Promise<Object>} 검색 결과
 */
export const searchDocuments = async (searchQuery, options = {}) => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    const {
      from = 0,
      size = 20,
      sort = [{ createdAt: { order: 'desc' } }],
      filters = {},
      userId = null
    } = options;

    // 기본 검색 쿼리 구성
    let query = {
      bool: {
        must: [],
        filter: [],
        should: [],
        must_not: []
      }
    };

    // 텍스트 검색
    if (searchQuery.text) {
      query.bool.must.push({
        multi_match: {
          query: searchQuery.text,
          fields: ['title^3', 'content^2', 'description', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    // 필터 적용
    if (filters.type) {
      query.bool.filter.push({ term: { type: filters.type } });
    }
    if (filters.category) {
      query.bool.filter.push({ term: { category: filters.category } });
    }
    if (filters.status) {
      query.bool.filter.push({ term: { status: filters.status } });
    }
    if (filters.tags && filters.tags.length > 0) {
      query.bool.filter.push({ terms: { tags: filters.tags } });
    }
    if (filters.createdBy) {
      query.bool.filter.push({ term: { createdBy: filters.createdBy } });
    }

    // 날짜 범위 필터
    if (filters.dateRange) {
      query.bool.filter.push({
        range: {
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        }
      });
    }

    // 사용자 권한 필터
    if (userId) {
      query.bool.filter.push({
        bool: {
          should: [
            { term: { createdBy: userId } },
            { term: { visibility: 'public' } },
            {
              nested: {
                path: 'permissions',
                query: {
                  bool: {
                    must: [
                      { term: { 'permissions.userId': userId } },
                      { term: { 'permissions.permissions': 'read' } }
                    ]
                  }
                }
              }
            }
          ]
        }
      });
    }

    // 검색 실행
    const result = await esClient.search({
      index: indexName,
      body: {
        query,
        sort,
        from,
        size,
        highlight: {
          fields: {
            title: {},
            content: {},
            description: {}
          }
        },
        aggs: {
          types: {
            terms: { field: 'type' }
          },
          categories: {
            terms: { field: 'category' }
          },
          tags: {
            terms: { field: 'tags' }
          },
          statuses: {
            terms: { field: 'status' }
          }
        }
      }
    });

    logger.debug(`✅ 검색 완료: ${result.hits.total.value}개 결과`);
    return result;

  } catch (error) {
    logger.error('❌ 검색 실패:', error);
    throw error;
  }
};

/**
 * 자동완성 검색 함수
 * 제목 기반 자동완성 검색
 * 
 * @param {string} query - 검색어
 * @param {number} size - 결과 개수
 * @returns {Promise<Object>} 자동완성 결과
 */
export const suggestDocuments = async (query, size = 5) => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    
    const result = await esClient.search({
      index: indexName,
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: 'title',
              size,
              skip_duplicates: true
            }
          }
        }
      }
    });

    return result;

  } catch (error) {
    logger.error('❌ 자동완성 검색 실패:', error);
    throw error;
  }
};

/**
 * Elasticsearch 연결 상태 확인
 * 현재 연결 상태를 반환
 * 
 * @returns {Object} 연결 상태 정보
 */
export const getElasticsearchStatus = () => {
  if (!esClient) {
    return {
      isConnected: false,
      status: 'not_initialized',
      message: 'Elasticsearch 클라이언트가 초기화되지 않았습니다.'
    };
  }

  return {
    isConnected: true,
    status: 'connected',
    node: esOptions.node,
    index: documentIndexSettings.index
  };
};

/**
 * Elasticsearch 헬스체크
 * Elasticsearch 연결 상태를 확인하는 헬스체크 함수
 * 
 * @returns {Promise<Object>} 헬스체크 결과
 */
export const healthCheck = async () => {
  try {
    if (!esClient) {
      return {
        status: 'unhealthy',
        service: 'Elasticsearch',
        error: 'Elasticsearch 클라이언트가 연결되지 않았습니다.',
        timestamp: new Date().toISOString()
      };
    }

    const startTime = Date.now();
    
    // 클러스터 헬스 확인
    const health = await esClient.cluster.health();
    
    const responseTime = Date.now() - startTime;

    return {
      status: health.status === 'green' ? 'healthy' : 'warning',
      service: 'Elasticsearch',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        clusterStatus: health.status,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards,
        ...getElasticsearchStatus()
      }
    };

  } catch (error) {
    logger.error('❌ Elasticsearch 헬스체크 실패:', error);
    
    return {
      status: 'unhealthy',
      service: 'Elasticsearch',
      error: error.message,
      timestamp: new Date().toISOString(),
      details: getElasticsearchStatus()
    };
  }
};

/**
 * 인덱스 통계 함수
 * 인덱스 통계 정보를 반환하는 함수
 * 
 * @returns {Promise<Object>} 인덱스 통계
 */
export const getIndexStats = async () => {
  try {
    if (!esClient) {
      throw new Error('Elasticsearch 클라이언트가 연결되지 않았습니다.');
    }

    const indexName = documentIndexSettings.index;
    
    const stats = await esClient.indices.stats({
      index: indexName
    });

    return stats;

  } catch (error) {
    logger.error('❌ 인덱스 통계 조회 실패:', error);
    throw error;
  }
};

// 기본 내보내기
export default {
  setupElasticsearch,
  indexDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  suggestDocuments,
  getElasticsearchStatus,
  healthCheck,
  getIndexStats
}; 