const Document = require('../models/Document');
const User = require('../models/User');
const logger = require('../config/logger');
const { createClient } = require('redis');
const { Client } = require('@elastic/elasticsearch');

class DocumentService {
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.elasticsearch = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
  }

  /**
   * 새 문서 생성
   */
  async createDocument(documentData, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const document = new Document({
        ...documentData,
        createdBy: userId,
        currentVersion: 1,
        versions: [{
          version: 1,
          content: documentData.content,
          modifiedBy: userId,
          modifiedAt: new Date(),
          changeLog: '초기 문서 생성'
        }],
        permissions: [{
          userId: userId,
          role: 'owner',
          grantedAt: new Date()
        }],
        status: 'draft'
      });

      await document.save();
      
      // Elasticsearch에 인덱싱
      await this.indexDocument(document);
      
      // Redis 캐시 업데이트
      await this.updateDocumentCache(document._id, document);

      logger.info(`문서 생성됨: ${document._id} by user: ${userId}`);
      return document;
    } catch (error) {
      logger.error('문서 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 조회 (권한 검증 포함)
   */
  async getDocument(documentId, userId) {
    try {
      // Redis 캐시 확인
      const cached = await this.getDocumentFromCache(documentId);
      if (cached) {
        return cached;
      }

      const document = await Document.findById(documentId)
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email')
        .populate('permissions.userId', 'name email role');

      if (!document) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasAccess = await this.checkDocumentAccess(document, userId);
      if (!hasAccess) {
        throw new Error('문서에 접근할 권한이 없습니다.');
      }

      // Redis 캐시 저장
      await this.updateDocumentCache(documentId, document);

      return document;
    } catch (error) {
      logger.error('문서 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 목록 조회 (필터링, 정렬, 페이징)
   */
  async getDocuments(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        status,
        documentType,
        createdBy,
        tags
      } = options;

      let query = {};

      // 검색 필터
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // 상태 필터
      if (status) {
        query.status = status;
      }

      // 문서 타입 필터
      if (documentType) {
        query.documentType = documentType;
      }

      // 작성자 필터
      if (createdBy) {
        query.createdBy = createdBy;
      }

      // 태그 필터
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const documents = await Document.find(query)
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Document.countDocuments(query);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('문서 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 업데이트 (버전 관리 포함)
   */
  async updateDocument(documentId, updateData, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasEditAccess = await this.checkEditAccess(document, userId);
      if (!hasEditAccess) {
        throw new Error('문서를 수정할 권한이 없습니다.');
      }

      // 새 버전 생성
      const newVersion = document.currentVersion + 1;
      const versionData = {
        version: newVersion,
        content: updateData.content,
        modifiedBy: userId,
        modifiedAt: new Date(),
        changeLog: updateData.changeLog || '문서 업데이트'
      };

      // 문서 업데이트
      const updatedDocument = await Document.findByIdAndUpdate(
        documentId,
        {
          ...updateData,
          currentVersion: newVersion,
          $push: { versions: versionData },
          modifiedBy: userId,
          modifiedAt: new Date()
        },
        { new: true }
      ).populate('createdBy', 'name email')
       .populate('modifiedBy', 'name email');

      // Elasticsearch 인덱스 업데이트
      await this.indexDocument(updatedDocument);

      // Redis 캐시 업데이트
      await this.updateDocumentCache(documentId, updatedDocument);

      logger.info(`문서 업데이트됨: ${documentId} by user: ${userId}`);
      return updatedDocument;
    } catch (error) {
      logger.error('문서 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 삭제 (소프트 삭제)
   */
  async deleteDocument(documentId, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // 권한 검증
      const hasDeleteAccess = await this.checkDeleteAccess(document, userId);
      if (!hasDeleteAccess) {
        throw new Error('문서를 삭제할 권한이 없습니다.');
      }

      // 소프트 삭제
      const deletedDocument = await Document.findByIdAndUpdate(
        documentId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          status: 'deleted'
        },
        { new: true }
      );

      // Elasticsearch에서 제거
      await this.removeDocumentFromIndex(documentId);

      // Redis 캐시 제거
      await this.removeDocumentFromCache(documentId);

      logger.info(`문서 삭제됨: ${documentId} by user: ${userId}`);
      return deletedDocument;
    } catch (error) {
      logger.error('문서 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 상태 변경
   */
  async updateDocumentStatus(documentId, newStatus, userId, comment = '') {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // 상태 변경 권한 검증
      const canChangeStatus = await this.checkStatusChangePermission(document, userId, newStatus);
      if (!canChangeStatus) {
        throw new Error('문서 상태를 변경할 권한이 없습니다.');
      }

      const updatedDocument = await Document.findByIdAndUpdate(
        documentId,
        {
          status: newStatus,
          modifiedBy: userId,
          modifiedAt: new Date(),
          $push: {
            statusHistory: {
              status: newStatus,
              changedBy: userId,
              changedAt: new Date(),
              comment
            }
          }
        },
        { new: true }
      ).populate('createdBy', 'name email')
       .populate('modifiedBy', 'name email');

      // Redis 캐시 업데이트
      await this.updateDocumentCache(documentId, updatedDocument);

      logger.info(`문서 상태 변경: ${documentId} -> ${newStatus} by user: ${userId}`);
      return updatedDocument;
    } catch (error) {
      logger.error('문서 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 권한 관리
   */
  async updateDocumentPermissions(documentId, permissions, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // 권한 관리 권한 검증
      const isOwner = document.permissions.some(p => 
        p.userId.toString() === userId && p.role === 'owner'
      );
      if (!isOwner) {
        throw new Error('권한을 관리할 권한이 없습니다.');
      }

      const updatedDocument = await Document.findByIdAndUpdate(
        documentId,
        {
          permissions,
          modifiedBy: userId,
          modifiedAt: new Date()
        },
        { new: true }
      ).populate('permissions.userId', 'name email role');

      // Redis 캐시 업데이트
      await this.updateDocumentCache(documentId, updatedDocument);

      logger.info(`문서 권한 업데이트: ${documentId} by user: ${userId}`);
      return updatedDocument;
    } catch (error) {
      logger.error('문서 권한 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 고급 검색 (Elasticsearch)
   */
  async searchDocuments(searchQuery, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchQuery,
                  fields: ['title^2', 'content', 'tags'],
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: []
          }
        },
        sort: [
          { [sortBy]: { order: sortOrder } }
        ],
        from: (page - 1) * limit,
        size: limit
      };

      // 필터 적용
      if (filters.status) {
        searchBody.query.bool.filter.push({ term: { status: filters.status } });
      }
      if (filters.documentType) {
        searchBody.query.bool.filter.push({ term: { documentType: filters.documentType } });
      }
      if (filters.createdBy) {
        searchBody.query.bool.filter.push({ term: { createdBy: filters.createdBy } });
      }
      if (filters.tags && filters.tags.length > 0) {
        searchBody.query.bool.filter.push({ terms: { tags: filters.tags } });
      }

      const result = await this.elasticsearch.search({
        index: 'documents',
        body: searchBody
      });

      const documents = result.body.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }));

      return {
        documents,
        total: result.body.hits.total.value,
        pagination: {
          page,
          limit,
          total: result.body.hits.total.value,
          pages: Math.ceil(result.body.hits.total.value / limit)
        }
      };
    } catch (error) {
      logger.error('문서 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 문서 접근 권한 확인
   */
  async checkDocumentAccess(document, userId) {
    // 소유자 확인
    if (document.createdBy.toString() === userId) {
      return true;
    }

    // 명시적 권한 확인
    const permission = document.permissions.find(p => 
      p.userId.toString() === userId
    );
    if (permission) {
      return true;
    }

    // 조직 권한 확인 (구현 필요)
    // const user = await User.findById(userId);
    // if (user.organization === document.organization) {
    //   return true;
    // }

    return false;
  }

  /**
   * 문서 수정 권한 확인
   */
  async checkEditAccess(document, userId) {
    // 소유자 확인
    if (document.createdBy.toString() === userId) {
      return true;
    }

    // 편집 권한 확인
    const permission = document.permissions.find(p => 
      p.userId.toString() === userId && 
      ['owner', 'editor', 'approver'].includes(p.role)
    );
    if (permission) {
      return true;
    }

    return false;
  }

  /**
   * 문서 삭제 권한 확인
   */
  async checkDeleteAccess(document, userId) {
    // 소유자만 삭제 가능
    return document.createdBy.toString() === userId;
  }

  /**
   * 상태 변경 권한 확인
   */
  async checkStatusChangePermission(document, userId, newStatus) {
    // 소유자 확인
    if (document.createdBy.toString() === userId) {
      return true;
    }

    // 승인자 권한 확인
    const permission = document.permissions.find(p => 
      p.userId.toString() === userId && 
      ['owner', 'approver'].includes(p.role)
    );
    if (permission) {
      return true;
    }

    return false;
  }

  /**
   * Elasticsearch 인덱싱
   */
  async indexDocument(document) {
    try {
      await this.elasticsearch.index({
        index: 'documents',
        id: document._id.toString(),
        body: {
          title: document.title,
          content: document.content,
          documentType: document.documentType,
          status: document.status,
          tags: document.tags,
          createdBy: document.createdBy,
          createdAt: document.createdAt,
          modifiedAt: document.modifiedAt
        }
      });
    } catch (error) {
      logger.error('Elasticsearch 인덱싱 실패:', error);
    }
  }

  /**
   * Elasticsearch에서 문서 제거
   */
  async removeDocumentFromIndex(documentId) {
    try {
      await this.elasticsearch.delete({
        index: 'documents',
        id: documentId.toString()
      });
    } catch (error) {
      logger.error('Elasticsearch에서 문서 제거 실패:', error);
    }
  }

  /**
   * Redis 캐시에서 문서 조회
   */
  async getDocumentFromCache(documentId) {
    try {
      const cached = await this.redis.get(`document:${documentId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Redis 캐시 조회 실패:', error);
      return null;
    }
  }

  /**
   * Redis 캐시 업데이트
   */
  async updateDocumentCache(documentId, document) {
    try {
      await this.redis.setex(
        `document:${documentId}`,
        3600, // 1시간 캐시
        JSON.stringify(document)
      );
    } catch (error) {
      logger.error('Redis 캐시 업데이트 실패:', error);
    }
  }

  /**
   * Redis 캐시에서 문서 제거
   */
  async removeDocumentFromCache(documentId) {
    try {
      await this.redis.del(`document:${documentId}`);
    } catch (error) {
      logger.error('Redis 캐시 제거 실패:', error);
    }
  }
}

module.exports = new DocumentService(); 