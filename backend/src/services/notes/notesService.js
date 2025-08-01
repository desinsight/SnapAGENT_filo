/**
 * 노트 서비스
 * 노트 CRUD 작업 및 비즈니스 로직 처리
 * 
 * @author Your Team
 * @version 1.0.0
 */

import Note from '../../models/notes/Note.js';
import { setCache, getCache, deleteCache } from '../../config/redis.js';
import { indexDocument, deleteDocument, updateDocument } from '../../config/elasticsearch.js';
import logger, { logBusiness, logDatabase } from '../../utils/logger.js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

class NotesService {
  constructor() {
    this.name = 'notes';
    this.available = true;
    this.version = '1.0.0';
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      logger.info('📝 NotesService 초기화...');
      
      // 마크다운 설정
      marked.setOptions({
        breaks: true,
        gfm: true
      });

      // HTML 정화 옵션
      this.sanitizeOptions = {
        allowedTags: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 's',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
          'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        allowedAttributes: {
          'a': ['href', 'title'],
          'img': ['src', 'alt', 'title']
        }
      };

      this.available = true;
      logger.info('✅ NotesService 초기화 완료');

    } catch (error) {
      logger.error('❌ NotesService 초기화 실패:', error);
      this.available = false;
      throw error;
    }
  }

  /**
   * 노트 생성
   */
  async createNote(noteData, userId) {
    const startTime = Date.now();
    
    try {
      logBusiness('create_note', { userId, title: noteData.title });

      // 마크다운을 HTML로 변환
      const contentHtml = this.convertMarkdownToHtml(noteData.content);
      
      // 노트 데이터 준비
      const note = new Note({
        ...noteData,
        userId,
        contentHtml,
        searchKeywords: this.generateSearchKeywords(noteData.title, noteData.content, noteData.tags)
      });

      // 노트 저장
      const savedNote = await note.save();
      
      // 캐시 업데이트
      await this.updateUserNotesCache(userId);
      
      // Elasticsearch 인덱싱
      await this.indexNoteForSearch(savedNote);
      
      logDatabase('create', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: savedNote,
        message: '노트가 성공적으로 생성되었습니다'
      };

    } catch (error) {
      logDatabase('create', 'notes', Date.now() - startTime, false);
      logger.error('노트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 노트 조회
   */
  async getNote(noteId, userId) {
    const startTime = Date.now();
    
    try {
      logBusiness('read_note', { userId, noteId });

      // 캐시에서 먼저 확인
      const cacheKey = `note:${noteId}`;
      const cachedNote = await getCache(cacheKey);
      
      if (cachedNote) {
        logDatabase('read', 'notes', Date.now() - startTime, true);
        return {
          success: true,
          data: cachedNote,
          fromCache: true
        };
      }

      // 데이터베이스에서 조회
      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('노트를 찾을 수 없습니다');
      }

      // 권한 확인
      if (!this.checkNoteAccess(note, userId)) {
        throw new Error('노트에 접근할 권한이 없습니다');
      }

      // 조회수 증가
      note.viewCount += 1;
      await note.save();

      // 캐시에 저장
      await setCache(cacheKey, note, 3600); // 1시간 캐시
      
      logDatabase('read', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: note
      };

    } catch (error) {
      logDatabase('read', 'notes', Date.now() - startTime, false);
      logger.error('노트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 노트 목록 조회
   */
  async getUserNotes(userId, options = {}) {
    const startTime = Date.now();
    
    try {
      logBusiness('list_notes', { userId, options });

      // 캐시 키 생성
      const cacheKey = `user_notes:${userId}:${JSON.stringify(options)}`;
      const cachedNotes = await getCache(cacheKey);
      
      if (cachedNotes) {
        logDatabase('read', 'notes', Date.now() - startTime, true);
        return {
          success: true,
          data: cachedNotes,
          fromCache: true
        };
      }

      // 데이터베이스에서 조회
      const notes = await Note.findByUser(userId, options);
      
      // 캐시에 저장
      await setCache(cacheKey, notes, 1800); // 30분 캐시
      
      logDatabase('read', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: notes,
        total: notes.length
      };

    } catch (error) {
      logDatabase('read', 'notes', Date.now() - startTime, false);
      logger.error('사용자 노트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 노트 수정
   */
  async updateNote(noteId, updateData, userId) {
    const startTime = Date.now();
    
    try {
      logBusiness('update_note', { userId, noteId });

      // 노트 조회
      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('노트를 찾을 수 없습니다');
      }

      // 권한 확인
      if (!this.checkNoteEditAccess(note, userId)) {
        throw new Error('노트를 수정할 권한이 없습니다');
      }

      // 마크다운을 HTML로 변환
      if (updateData.content) {
        updateData.contentHtml = this.convertMarkdownToHtml(updateData.content);
        updateData.searchKeywords = this.generateSearchKeywords(
          updateData.title || note.title,
          updateData.content,
          updateData.tags || note.tags
        );
      }

      // 노트 업데이트
      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        { ...updateData, editCount: note.editCount + 1 },
        { new: true, runValidators: true }
      );

      // 캐시 무효화
      await this.invalidateNoteCache(noteId, userId);
      
      // Elasticsearch 업데이트
      await this.updateNoteInSearch(updatedNote);
      
      logDatabase('update', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: updatedNote,
        message: '노트가 성공적으로 수정되었습니다'
      };

    } catch (error) {
      logDatabase('update', 'notes', Date.now() - startTime, false);
      logger.error('노트 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 노트 삭제
   */
  async deleteNote(noteId, userId, permanent = false) {
    const startTime = Date.now();
    
    try {
      logBusiness('delete_note', { userId, noteId, permanent });

      // 노트 조회
      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('노트를 찾을 수 없습니다');
      }

      // 권한 확인
      if (!this.checkNoteEditAccess(note, userId)) {
        throw new Error('노트를 삭제할 권한이 없습니다');
      }

      if (permanent) {
        // 영구 삭제
        await Note.findByIdAndDelete(noteId);
      } else {
        // 소프트 삭제
        note.softDelete();
        await note.save();
      }

      // 캐시 무효화
      await this.invalidateNoteCache(noteId, userId);
      
      // Elasticsearch에서 삭제
      await this.deleteNoteFromSearch(noteId);
      
      logDatabase('delete', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        message: permanent ? '노트가 영구적으로 삭제되었습니다' : '노트가 휴지통으로 이동되었습니다'
      };

    } catch (error) {
      logDatabase('delete', 'notes', Date.now() - startTime, false);
      logger.error('노트 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 노트 검색
   */
  async searchNotes(query, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      logBusiness('search_notes', { userId, query, options });

      // Elasticsearch 검색 시도
      try {
        const searchResults = await this.searchInElasticsearch(query, userId, options);
        if (searchResults.hits.hits.length > 0) {
          logDatabase('search', 'notes', Date.now() - startTime, true);
          return {
            success: true,
            data: searchResults.hits.hits.map(hit => hit._source),
            total: searchResults.hits.total.value,
            fromElasticsearch: true
          };
        }
      } catch (error) {
        logger.warn('Elasticsearch 검색 실패, MongoDB 검색으로 대체:', error);
      }

      // MongoDB 검색 (fallback)
      const notes = await Note.search(query, userId, options);
      
      logDatabase('search', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: notes,
        total: notes.length,
        fromElasticsearch: false
      };

    } catch (error) {
      logDatabase('search', 'notes', Date.now() - startTime, false);
      logger.error('노트 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 협업자 추가
   */
  async addCollaborator(noteId, collaboratorData, userId) {
    const startTime = Date.now();
    
    try {
      logBusiness('add_collaborator', { userId, noteId, collaboratorId: collaboratorData.userId });

      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('노트를 찾을 수 없습니다');
      }

      // 소유자만 협업자 추가 가능
      if (note.userId !== userId) {
        throw new Error('협업자를 추가할 권한이 없습니다');
      }

      note.addCollaborator(collaboratorData.userId, collaboratorData.role);
      await note.save();

      // 캐시 무효화
      await this.invalidateNoteCache(noteId, userId);
      
      logDatabase('update', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: note,
        message: '협업자가 성공적으로 추가되었습니다'
      };

    } catch (error) {
      logDatabase('update', 'notes', Date.now() - startTime, false);
      logger.error('협업자 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 협업자 제거
   */
  async removeCollaborator(noteId, collaboratorId, userId) {
    const startTime = Date.now();
    
    try {
      logBusiness('remove_collaborator', { userId, noteId, collaboratorId });

      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('노트를 찾을 수 없습니다');
      }

      // 소유자만 협업자 제거 가능
      if (note.userId !== userId) {
        throw new Error('협업자를 제거할 권한이 없습니다');
      }

      note.removeCollaborator(collaboratorId);
      await note.save();

      // 캐시 무효화
      await this.invalidateNoteCache(noteId, userId);
      
      logDatabase('update', 'notes', Date.now() - startTime, true);
      
      return {
        success: true,
        data: note,
        message: '협업자가 성공적으로 제거되었습니다'
      };

    } catch (error) {
      logDatabase('update', 'notes', Date.now() - startTime, false);
      logger.error('협업자 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 유틸리티 메서드들
   */

  /**
   * 마크다운을 HTML로 변환
   */
  convertMarkdownToHtml(markdown) {
    try {
      const html = marked(markdown);
      return sanitizeHtml(html, this.sanitizeOptions);
    } catch (error) {
      logger.error('마크다운 변환 실패:', error);
      return markdown; // 변환 실패 시 원본 반환
    }
  }

  /**
   * 검색 키워드 생성
   */
  generateSearchKeywords(title, content, tags = []) {
    const keywords = [];
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/\s+/));
    }
    
    if (content) {
      // 내용에서 주요 키워드 추출 (간단한 구현)
      const words = content.toLowerCase().split(/\s+/);
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const filteredWords = words.filter(word => 
        word.length > 2 && !commonWords.includes(word)
      );
      keywords.push(...filteredWords.slice(0, 20)); // 최대 20개
    }
    
    if (tags && tags.length > 0) {
      keywords.push(...tags.map(tag => tag.toLowerCase()));
    }
    
    return [...new Set(keywords)].sort();
  }

  /**
   * 노트 접근 권한 확인
   */
  checkNoteAccess(note, userId) {
    if (note.userId === userId) return true;
    if (note.visibility === 'public') return true;
    if (!note.isShared) return false;
    
    return note.collaborators.some(c => c.userId === userId);
  }

  /**
   * 노트 수정 권한 확인
   */
  checkNoteEditAccess(note, userId) {
    if (note.userId === userId) return true;
    if (!note.isShared) return false;
    
    const collaborator = note.collaborators.find(c => c.userId === userId);
    return collaborator && ['editor', 'admin'].includes(collaborator.role);
  }

  /**
   * 캐시 관리
   */
  async updateUserNotesCache(userId) {
    const cacheKey = `user_notes:${userId}`;
    await deleteCache(cacheKey);
  }

  async invalidateNoteCache(noteId, userId) {
    const cacheKeys = [
      `note:${noteId}`,
      `user_notes:${userId}`
    ];
    
    await Promise.all(cacheKeys.map(key => deleteCache(key)));
  }

  /**
   * Elasticsearch 연동
   */
  async indexNoteForSearch(note) {
    try {
      await indexDocument('notes', note._id.toString(), {
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
        userId: note.userId,
        isShared: note.isShared,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        collaborators: note.collaborators.map(c => c.userId)
      });
    } catch (error) {
      logger.warn('Elasticsearch 인덱싱 실패:', error);
    }
  }

  async updateNoteInSearch(note) {
    try {
      await updateDocument('notes', note._id.toString(), {
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
        updatedAt: note.updatedAt
      });
    } catch (error) {
      logger.warn('Elasticsearch 업데이트 실패:', error);
    }
  }

  async deleteNoteFromSearch(noteId) {
    try {
      await deleteDocument('notes', noteId.toString());
    } catch (error) {
      logger.warn('Elasticsearch 삭제 실패:', error);
    }
  }

  async searchInElasticsearch(query, userId, options) {
    const { Client } = await import('@elastic/elasticsearch');
    const client = new Client({ node: process.env.ELASTICSEARCH_NODE });
    
    const searchBody = {
      index: 'notes',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['title^2', 'content', 'tags'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: [
              {
                bool: {
                  should: [
                    { term: { userId: userId } },
                    { term: { isShared: true } },
                    { terms: { collaborators: [userId] } }
                  ]
                }
              }
            ]
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { updatedAt: { order: 'desc' } }
        ],
        size: options.size || 20,
        from: options.from || 0
      }
    };

    return await client.search(searchBody);
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
    logger.info('NotesService 정리 중...');
    this.available = false;
  }
}

export default NotesService; 