/**
 * NotesService.js
 * 구독 기반 Tool 형식 노트 서비스 (8단계)
 * 
 * 🎯 8단계 변경사항:
 * - 구독 등급별 기능 제한 로직 추가
 * - Tool 메타데이터에 구독 정보 포함
 * - 자연어 포맷팅 제거, 순수 JSON 반환
 * - 서비스별 구독 체크 로직 구현
 */

export class NotesService {
  constructor() {
    // Tool 메타데이터 (8단계 요구사항)
    this.name = 'notes';
    this.description = '메모와 노트를 작성하고 관리합니다. 아이디어 저장, 할 일 메모, 중요 정보 기록 등이 가능합니다.';
    this.category = 'productivity';
    this.available = true;
    this.version = '1.0.0';
    
    // 구독 메타데이터 (8단계)
    this.subscription_tier = 'free';
    this.subscription_features = {
      free: {
        allowed_actions: ['create_note', 'read_note', 'search_notes'],
        daily_limit: 10,
        max_notes: 50,
        features: ['basic_notes', 'simple_search']
      },
      basic: {
        allowed_actions: ['create_note', 'list_notes', 'read_note', 'update_note', 'search_notes', 'organize_notes'],
        daily_limit: 100,
        max_notes: 500,
        features: ['basic_notes', 'advanced_search', 'categories', 'tags']
      },
      premium: {
        allowed_actions: '*',
        daily_limit: -1,
        max_notes: -1,
        features: ['all_features', 'backup', 'sync', 'collaboration']
      }
    };

    // Tool 파라미터 정의 (8단계)
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_note', 'list_notes', 'read_note', 'update_note', 'delete_note', 'search_notes', 'organize_notes'],
          description: '수행할 작업: create_note(노트 생성), list_notes(노트 목록), read_note(노트 읽기), update_note(노트 수정), delete_note(노트 삭제), search_notes(노트 검색), organize_notes(노트 정리)'
        },
        title: { type: 'string', maxLength: 200, description: '노트 제목' },
        content: { type: 'string', maxLength: 10000, description: '노트 내용' },
        noteId: { type: 'string', description: '노트 ID (읽기/수정/삭제 시 필요)' },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          maxItems: 20,
          description: '노트 태그'
        },
        category: { 
          type: 'string', 
          enum: ['개인', '업무', '학습', '아이디어', '할일', '기타'],
          description: '노트 카테고리'
        },
        query: { type: 'string', description: '검색 쿼리 (search_notes 시 필요)' }
      },
      required: ['action']
    };

    // 임시 노트 데이터 (개발용)
    this.mockNotes = [
      {
        id: 'note_1',
        title: '프로젝트 아이디어',
        content: 'AI 비서 기능 개선:\n- 자연어 처리 향상\n- 다중 서비스 연동\n- 실시간 동기화',
        tags: ['아이디어', '프로젝트'],
        category: '업무',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'note_2',
        title: '장보기 목록',
        content: '- 우유\n- 빵\n- 계란\n- 과일 (사과, 바나나)',
        tags: ['할일', '쇼핑'],
        category: '개인',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  async initialize() {
    try {
      console.log('📝 NotesService 초기화...');
      
      // TODO: 실제 노트 저장소 연결
      // TODO: 권한 확인
      
      console.log('✅ NotesService 초기화 완료');

    } catch (error) {
      console.error('❌ NotesService 초기화 실패:', error);
      this.available = false;
    }
  }

  /**
   * 서비스 실행 메인 함수 - AI가 호출 (8단계: 구독 기반)
   */
  async execute(args, context = {}) {
    try {
      console.log(`📝 NotesService 실행: ${args.action}`, args);

      // 8단계: 구독 등급별 기능 제한 체크
      const subscriptionCheck = await this.checkSubscriptionAccess(args.action, context);
      if (!subscriptionCheck.allowed) {
        return {
          success: false,
          error: 'subscription_required',
          message: subscriptionCheck.message,
          required_tier: subscriptionCheck.required_tier,
          current_tier: context.subscriptionTier || 'none',
          upgrade_benefits: subscriptionCheck.benefits
        };
      }

      // 8단계: 사용량 제한 체크
      const usageCheck = await this.checkUsageLimit(args.action, context);
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: 'usage_limit_exceeded',
          message: usageCheck.message,
          current_usage: usageCheck.current_usage,
          daily_limit: usageCheck.daily_limit,
          reset_time: usageCheck.reset_time
        };
      }

      // 실제 서비스 실행
      let result;
      switch (args.action) {
        case 'create_note':
          result = await this.createNote(args, context);
          break;
        
        case 'list_notes':
          result = await this.listNotes(args, context);
          break;
        
        case 'read_note':
          result = await this.readNote(args, context);
          break;
        
        case 'update_note':
          result = await this.updateNote(args, context);
          break;
        
        case 'delete_note':
          result = await this.deleteNote(args, context);
          break;
        
        case 'search_notes':
          result = await this.searchNotes(args, context);
          break;
        
        case 'organize_notes':
          result = await this.organizeNotes(args, context);
          break;
        
        default:
          throw new Error(`지원하지 않는 작업: ${args.action}`);
      }

      // 8단계: 자연어 포맷팅 제거, 순수 JSON 반환
      return this.formatJsonResponse(result, args.action, context);

    } catch (error) {
      console.error('❌ NotesService 실행 실패:', error);
      return {
        success: false,
        error: error.message,
        action: args.action,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 노트 생성
   */
  async createNote(args, context) {
    const { title, content, tags, category } = args;

    if (!title && !content) {
      throw new Error('제목이나 내용 중 하나는 필요합니다');
    }

    const noteTitle = title || this.generateTitle(content);
    console.log(`📝 노트 생성: ${noteTitle}`);

    // TODO: 실제 노트 생성 구현
    const newNote = {
      id: `note_${Date.now()}`,
      title: noteTitle,
      content: content || '',
      tags: tags || [],
      category: category || '일반',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockNotes.push(newNote);

    return {
      success: true,
      action: 'create_note',
      note: newNote,
      note_id: newNote.id,
      created_at: newNote.createdAt
    };
  }

  /**
   * 노트 목록
   */
  async listNotes(args, context) {
    const { category, tags } = args;

    console.log('📋 노트 목록 조회');

    let notes = [...this.mockNotes];

    // 카테고리 필터링
    if (category) {
      notes = notes.filter(n => n.category === category);
    }

    // 태그 필터링
    if (tags && tags.length > 0) {
      notes = notes.filter(n => 
        tags.some(tag => n.tags.includes(tag))
      );
    }

    // 최신순 정렬
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return {
      success: true,
      action: 'list_notes',
      notes: notes,
      count: notes.length,
      filters: { category, tags },
      sorted_by: 'updated_at_desc'
    };
  }

  /**
   * 노트 읽기
   */
  async readNote(args, context) {
    const { noteId, title } = args;

    let note;
    if (noteId) {
      note = this.mockNotes.find(n => n.id === noteId);
    } else if (title) {
      note = this.mockNotes.find(n => n.title === title);
    }

    if (!note) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    console.log(`📖 노트 읽기: ${note.title}`);

    return {
      success: true,
      action: 'read_note',
      note: note,
      note_id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
      created_at: note.createdAt,
      updated_at: note.updatedAt
    };
  }

  /**
   * 노트 검색
   */
  async searchNotes(args, context) {
    const { query } = args;

    if (!query) {
      throw new Error('검색어가 필요합니다');
    }

    console.log(`🔍 노트 검색: "${query}"`);

    const results = this.mockNotes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    return {
      success: true,
      action: 'search_notes',
      query: query,
      results: results,
      count: results.length,
      search_matches: results.map(note => ({
        id: note.id,
        title: note.title,
        content_preview: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
        tags: note.tags,
        category: note.category,
        relevance_score: this.calculateRelevanceScore(note, query)
      }))
    };
  }

  /**
   * 노트 수정
   */
  async updateNote(args, context) {
    const { noteId, title, content, tags, category } = args;

    if (!noteId) {
      throw new Error('노트 ID가 필요합니다');
    }

    const noteIndex = this.mockNotes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    console.log(`✏️ 노트 수정: ${noteId}`);

    // 변경사항 추적
    const originalNote = { ...this.mockNotes[noteIndex] };
    const changes = {};

    // 노트 업데이트
    const note = this.mockNotes[noteIndex];
    if (title !== undefined && title !== note.title) {
      changes.title = { from: note.title, to: title };
      note.title = title;
    }
    if (content !== undefined && content !== note.content) {
      changes.content = { from: note.content, to: content };
      note.content = content;
    }
    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(note.tags)) {
      changes.tags = { from: note.tags, to: tags };
      note.tags = tags;
    }
    if (category !== undefined && category !== note.category) {
      changes.category = { from: note.category, to: category };
      note.category = category;
    }
    note.updatedAt = new Date().toISOString();

    return {
      success: true,
      action: 'update_note',
      note_id: noteId,
      note: note,
      changes: changes,
      updated_at: note.updatedAt,
      changes_count: Object.keys(changes).length
    };
  }

  /**
   * 노트 삭제
   */
  async deleteNote(args, context) {
    const { noteId } = args;

    if (!noteId) {
      throw new Error('노트 ID가 필요합니다');
    }

    const noteIndex = this.mockNotes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    console.log(`🗑️ 노트 삭제: ${noteId}`);

    const deletedNote = this.mockNotes.splice(noteIndex, 1)[0];

    return {
      success: true,
      action: 'delete_note',
      note_id: noteId,
      deleted_note: {
        id: deletedNote.id,
        title: deletedNote.title,
        content_length: deletedNote.content.length,
        tags: deletedNote.tags,
        category: deletedNote.category,
        created_at: deletedNote.createdAt,
        deleted_at: new Date().toISOString()
      },
      remaining_notes_count: this.mockNotes.length
    };
  }

  /**
   * 노트 정리 (예시)
   */
  async organizeNotes(args, context) {
    console.log('📋 노트 정리 중...');
    const notes = [...this.mockNotes];

    // 카테고리별 분류
    const categorizedNotes = {};
    notes.forEach(note => {
      const category = note.category || '기타';
      if (!categorizedNotes[category]) {
        categorizedNotes[category] = [];
      }
      categorizedNotes[category].push(note);
    });

    // 카테고리별 정렬
    const sortedCategories = Object.keys(categorizedNotes).sort();
    const organizedNotes = sortedCategories.map(category => ({
      category: category,
      notes: categorizedNotes[category].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }));

    return {
      success: true,
      action: 'organize_notes',
      organized_notes: organizedNotes,
      total_notes: notes.length,
      total_categories: sortedCategories.length
    };
  }

  /**
   * 내용에서 제목 생성
   */
  generateTitle(content) {
    if (!content) return '제목 없음';
    
    const firstLine = content.split('\n')[0];
    const title = firstLine.substring(0, 30);
    return title + (firstLine.length > 30 ? '...' : '');
  }

  /**
   * 검색 관련성 점수 계산
   */
  calculateRelevanceScore(note, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // 제목 매칭 (가중치 높음)
    if (note.title.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // 내용 매칭
    if (note.content.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    // 태그 매칭
    const tagMatches = note.tags.filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    ).length;
    score += tagMatches * 3;
    
    // 카테고리 매칭
    if (note.category.toLowerCase().includes(lowerQuery)) {
      score += 2;
    }
    
    return score;
  }

  /**
   * 내용 요약
   */
  truncateContent(content, maxLength = 100) {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * 노트 목록 포맷팅
   */
  formatNoteList(notes, category = null, tags = null, searchTerm = null) {
    if (notes.length === 0) {
      if (searchTerm) return `"${searchTerm}"에 대한 검색 결과가 없습니다.`;
      if (category) return `"${category}" 카테고리에 노트가 없습니다.`;
      if (tags) return `"${tags.join(', ')}" 태그의 노트가 없습니다.`;
      return '노트가 없습니다.';
    }

    let formatted = '';
    if (searchTerm) {
      formatted = `🔍 "${searchTerm}" 검색 결과 (${notes.length}개):\n\n`;
    } else if (category) {
      formatted = `📂 ${category} 카테고리 (${notes.length}개):\n\n`;
    } else if (tags) {
      formatted = `🏷️ ${tags.join(', ')} 태그 (${notes.length}개):\n\n`;
    } else {
      formatted = `📝 전체 노트 (${notes.length}개):\n\n`;
    }

    notes.forEach((note, index) => {
      formatted += `${index + 1}. **${note.title}**\n`;
      formatted += `   ${this.truncateContent(note.content, 50)}\n`;
      if (note.tags.length > 0) {
        formatted += `   🏷️ ${note.tags.join(', ')}\n`;
      }
      formatted += `   📅 ${this.formatDate(note.updatedAt)}\n`;
      formatted += '\n';
    });

    return formatted.trim();
  }

  /**
   * 노트 상세 포맷팅
   */
  formatNoteDetail(note) {
    let formatted = `📝 **${note.title}**\n\n`;
    formatted += note.content + '\n\n';
    formatted += '---\n';
    formatted += `📂 카테고리: ${note.category}\n`;
    if (note.tags.length > 0) {
      formatted += `🏷️ 태그: ${note.tags.join(', ')}\n`;
    }
    formatted += `📅 생성: ${this.formatDate(note.createdAt)}\n`;
    formatted += `📅 수정: ${this.formatDate(note.updatedAt)}`;
    
    return formatted;
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 1시간 이내
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}분 전`;
    }
    // 24시간 이내
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}시간 전`;
    }
    // 7일 이내
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}일 전`;
    }
    
    // 그 외
    return date.toLocaleDateString('ko-KR');
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      description: this.description,
      noteCount: this.mockNotes.length
    };
  }

  /**
   * 🔒 구독 등급별 기능 접근 권한 체크 (8단계)
   */
  async checkSubscriptionAccess(action, context) {
    const userTier = context.subscriptionTier || 'none';
    
    // 구독 등급별 허용 액션 확인
    for (const [tier, config] of Object.entries(this.subscription_features)) {
      if (userTier === tier || (userTier === 'free' && tier === 'free')) {
        const allowedActions = config.allowed_actions;
        
        if (allowedActions === '*' || allowedActions.includes(action)) {
          return { allowed: true };
        }
        
        // 권한 없음 - 업그레이드 필요
        const requiredTiers = Object.keys(this.subscription_features).filter(t => {
          const tierConfig = this.subscription_features[t];
          return tierConfig.allowed_actions === '*' || tierConfig.allowed_actions.includes(action);
        });
        
        return {
          allowed: false,
          message: `${action} 기능은 ${requiredTiers.join(' 또는 ')} 구독이 필요합니다.`,
          required_tier: requiredTiers[0],
          benefits: this.getUpgradeBenefits(requiredTiers[0])
        };
      }
    }
    
    // 기본적으로 free 등급 권한 적용
    const freeActions = this.subscription_features.free.allowed_actions;
    if (freeActions.includes(action)) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      message: `${action} 기능을 사용하려면 구독이 필요합니다.`,
      required_tier: 'basic',
      benefits: this.getUpgradeBenefits('basic')
    };
  }

  /**
   * 📊 사용량 제한 체크 (8단계)
   */
  async checkUsageLimit(action, context) {
    const userTier = context.subscriptionTier || 'free';
    const tierConfig = this.subscription_features[userTier] || this.subscription_features.free;
    
    // 무제한 사용 등급
    if (tierConfig.daily_limit === -1) {
      return { allowed: true };
    }
    
    // 임시: 실제 사용량 체크 로직 (개발용)
    const currentUsage = Math.floor(Math.random() * tierConfig.daily_limit);
    
    if (currentUsage >= tierConfig.daily_limit) {
      return {
        allowed: false,
        message: `일일 사용량 한도를 초과했습니다. (${currentUsage}/${tierConfig.daily_limit})`,
        current_usage: currentUsage,
        daily_limit: tierConfig.daily_limit,
        reset_time: this.getNextResetTime()
      };
    }
    
    return { 
      allowed: true,
      current_usage: currentUsage,
      daily_limit: tierConfig.daily_limit
    };
  }

  /**
   * 🎯 순수 JSON 응답 포맷팅 (8단계: 자연어 제거)
   */
  formatJsonResponse(result, action, context) {
    // 자연어 포맷팅 필드 제거
    if (result.formatted) {
      delete result.formatted;
    }
    
    // 표준 응답 구조
    return {
      success: result.success !== false,
      action: action,
      data: result,
      metadata: {
        service: this.name,
        version: this.version,
        subscription_tier: context.subscriptionTier || 'free',
        timestamp: new Date().toISOString(),
        user_id: context.userId || null
      },
      // 성능 정보
      performance: {
        execution_time: result.execution_time || null,
        cached: result.cached || false
      }
    };
  }

  /**
   * 📈 구독 업그레이드 혜택 정보
   */
  getUpgradeBenefits(tier) {
    const benefits = {
      basic: [
        '월 100회 노트 작업',
        '500개 노트 저장',
        '고급 검색 기능',
        '카테고리 및 태그 관리'
      ],
      premium: [
        '무제한 노트 작업',
        '무제한 노트 저장', 
        '모든 기능 이용',
        '백업 및 동기화',
        '협업 기능'
      ]
    };
    
    return benefits[tier] || [];
  }

  /**
   * ⏰ 다음 리셋 시간 계산
   */
  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 🎯 Tool 메타데이터 가져오기 (8단계)
   */
  getToolMetadata() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      category: this.category,
      subscription_tier: this.subscription_tier,
      subscription_features: this.subscription_features,
      parameters: this.parameters
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      console.log('📝 NotesService 정리 중...');
      console.log('✅ NotesService 정리 완료');

    } catch (error) {
      console.error('❌ NotesService 정리 실패:', error);
    }
  }
}