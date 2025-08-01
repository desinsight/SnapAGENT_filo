/**
 * ContactsService.js
 * 구독 기반 Tool 형식 연락처 서비스 (8단계)
 * 
 * 🎯 8단계 변경사항:
 * - 구독 등급별 기능 제한 로직 추가
 * - Tool 메타데이터에 구독 정보 포함
 * - 자연어 포맷팅 제거, 순수 JSON 반환
 * - 서비스별 구독 체크 로직 구현
 */

export class ContactsService {
  constructor() {
    // Tool 메타데이터 (8단계 요구사항)
    this.name = 'contacts';
    this.description = '연락처를 관리하고 검색합니다. 사람을 찾거나 연락처 정보를 조회할 수 있습니다.';
    this.category = 'personal_data';
    this.available = true;
    this.version = '1.0.0';
    
    // 구독 메타데이터 (8단계)
    this.subscription_tier = 'free';
    this.subscription_features = {
      free: {
        allowed_actions: ['search_contact', 'get_contact_detail'],
        daily_limit: 10,
        max_contacts: 100,
        features: ['basic_search', 'contact_view']
      },
      basic: {
        allowed_actions: ['search_contact', 'get_contact_detail', 'add_contact', 'update_contact', 'list_contacts'],
        daily_limit: 50,
        max_contacts: 1000,
        features: ['basic_search', 'contact_management', 'contact_groups']
      },
      premium: {
        allowed_actions: '*',
        daily_limit: -1,
        max_contacts: -1,
        features: ['all_features', 'advanced_search', 'contact_groups', 'contact_backup', 'contact_sync']
      }
    };

    // AI에게 제공할 파라미터 정의
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['search_contact', 'add_contact', 'update_contact', 'delete_contact', 'list_contacts', 'get_contact_detail', 'manage_groups'],
          description: '수행할 작업: search_contact(연락처 검색), add_contact(연락처 추가), update_contact(연락처 수정), delete_contact(연락처 삭제), list_contacts(전체 목록), get_contact_detail(상세 정보), manage_groups(그룹 관리)'
        },
        name: {
          type: 'string',
          description: '이름 (예: 김철수)'
        },
        phone: {
          type: 'string',
          description: '전화번호'
        },
        email: {
          type: 'string',
          description: '이메일 주소'
        },
        query: {
          type: 'string',
          description: '검색어'
        },
        contactId: {
          type: 'string',
          description: '연락처 ID'
        },
        contactInfo: {
          type: 'object',
          description: '연락처 정보 객체',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            company: { type: 'string' },
            notes: { type: 'string' },
            groups: { type: 'array', items: { type: 'string' } }
          }
        },
        groupName: {
          type: 'string',
          description: '그룹 이름'
        },
        filters: {
          type: 'object',
          description: '고급 검색 필터',
          properties: {
            company: { type: 'string' },
            group: { type: 'string' },
            hasEmail: { type: 'boolean' },
            hasPhone: { type: 'boolean' }
          }
        }
      },
      required: ['action']
    };

    // 임시 연락처 데이터 (개발용)
    this.mockContacts = [
      {
        id: 'contact_1',
        name: '김철수',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        company: '삼성전자',
        address: '서울시 강남구',
        groups: ['동료', '회사'],
        notes: '개발팀 매니저',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'contact_2',
        name: '이영희',
        phone: '010-9876-5432',
        email: 'lee@example.com',
        company: 'LG전자',
        address: '서울시 서초구',
        groups: ['동료', '친구'],
        notes: '디자이너',
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'contact_3',
        name: '박민수',
        phone: '010-5555-5555',
        email: 'park@example.com',
        company: '네이버',
        address: '경기도 성남시',
        groups: ['회사', '프로젝트'],
        notes: '백엔드 개발자',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'contact_4',
        name: '최지영',
        phone: '010-7777-7777',
        email: 'choi@example.com',
        company: '카카오',
        address: '제주도 제주시',
        groups: ['가족', '친구'],
        notes: '프로덕트 매니저',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    // 연락처 그룹 데이터
    this.mockGroups = [
      { id: 'group_1', name: '동료', contactIds: ['contact_1', 'contact_2'], createdAt: new Date().toISOString() },
      { id: 'group_2', name: '친구', contactIds: ['contact_2', 'contact_4'], createdAt: new Date().toISOString() },
      { id: 'group_3', name: '회사', contactIds: ['contact_1', 'contact_3'], createdAt: new Date().toISOString() },
      { id: 'group_4', name: '가족', contactIds: ['contact_4'], createdAt: new Date().toISOString() },
      { id: 'group_5', name: '프로젝트', contactIds: ['contact_3'], createdAt: new Date().toISOString() }
    ];
  }

  async initialize() {
    try {
      console.log('👥 ContactsService 초기화...');
      
      // TODO: 실제 연락처 DB 연결
      // TODO: 권한 확인
      
      console.log('✅ ContactsService 초기화 완료');

    } catch (error) {
      console.error('❌ ContactsService 초기화 실패:', error);
      this.available = false;
    }
  }

  /**
   * 서비스 실행 메인 함수 - AI가 호출 (8단계: 구독 기반)
   */
  async execute(args, context = {}) {
    try {
      console.log(`👥 ContactsService 실행: ${args.action}`, args);

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
        case 'search_contact':
          result = await this.searchContact(args, context);
          break;
        
        case 'add_contact':
          result = await this.addContact(args, context);
          break;
        
        case 'update_contact':
          result = await this.updateContact(args, context);
          break;
        
        case 'delete_contact':
          result = await this.deleteContact(args, context);
          break;
        
        case 'list_contacts':
          result = await this.listContacts(args, context);
          break;
        
        case 'get_contact_detail':
          result = await this.getContactDetail(args, context);
          break;
        
        case 'manage_groups':
          result = await this.manageGroups(args, context);
          break;
        
        default:
          throw new Error(`지원하지 않는 작업: ${args.action}`);
      }

      // 8단계: 자연어 포맷팅 제거, 순수 JSON 반환
      return this.formatJsonResponse(result, args.action, context);

    } catch (error) {
      console.error('❌ ContactsService 실행 실패:', error);
      return {
        success: false,
        error: error.message,
        action: args.action,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 연락처 검색
   */
  async searchContact(args, context) {
    const { query, name, filters } = args;
    const searchTerm = query || name;

    if (!searchTerm) {
      throw new Error('검색어가 필요합니다');
    }

    console.log(`🔍 연락처 검색: "${searchTerm}"`);

    // 기본 검색
    let results = this.mockContacts.filter(contact => 
      contact.name.includes(searchTerm) || 
      contact.phone.includes(searchTerm) ||
      contact.email.includes(searchTerm) ||
      contact.company?.includes(searchTerm) ||
      contact.notes?.includes(searchTerm)
    );

    // 고급 필터링 (premium 기능)
    if (filters && context.subscriptionTier === 'premium') {
      if (filters.company) {
        results = results.filter(contact => 
          contact.company?.toLowerCase().includes(filters.company.toLowerCase())
        );
      }
      if (filters.group) {
        results = results.filter(contact => 
          contact.groups?.some(group => 
            group.toLowerCase().includes(filters.group.toLowerCase())
          )
        );
      }
      if (filters.hasEmail !== undefined) {
        results = results.filter(contact => 
          filters.hasEmail ? contact.email : !contact.email
        );
      }
      if (filters.hasPhone !== undefined) {
        results = results.filter(contact => 
          filters.hasPhone ? contact.phone : !contact.phone
        );
      }
    }

    // 관련성 점수 계산 및 정렬
    const resultsWithScore = results.map(contact => ({
      ...contact,
      relevance_score: this.calculateRelevanceScore(contact, searchTerm)
    })).sort((a, b) => b.relevance_score - a.relevance_score);

    return {
      success: true,
      action: 'search_contact',
      query: searchTerm,
      results: resultsWithScore,
      count: resultsWithScore.length,
      search_metadata: {
        search_term: searchTerm,
        filters_applied: filters ? Object.keys(filters).length : 0,
        advanced_search: context.subscriptionTier === 'premium' && filters,
        execution_time: Date.now() % 100 // 임시 실행 시간
      }
    };
  }

  /**
   * 연락처 추가
   */
  async addContact(args, context) {
    const { contactInfo } = args;

    if (!contactInfo || !contactInfo.name) {
      throw new Error('연락처 정보와 이름이 필요합니다');
    }

    // 연락처 수량 제한 체크
    const userTier = context.subscriptionTier || 'free';
    const tierConfig = this.subscription_features[userTier];
    if (tierConfig.max_contacts !== -1 && this.mockContacts.length >= tierConfig.max_contacts) {
      throw new Error(`연락처 저장 한도를 초과했습니다. (${this.mockContacts.length}/${tierConfig.max_contacts})`);
    }

    console.log(`➕ 연락처 추가: ${contactInfo.name}`);

    const newContact = {
      id: `contact_${Date.now()}`,
      name: contactInfo.name,
      phone: contactInfo.phone || null,
      email: contactInfo.email || null,
      company: contactInfo.company || null,
      address: contactInfo.address || null,
      notes: contactInfo.notes || null,
      groups: contactInfo.groups || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 임시로 mockContacts에 추가
    this.mockContacts.push(newContact);

    return {
      success: true,
      action: 'add_contact',
      contact: newContact,
      contact_id: newContact.id,
      contacts_count: this.mockContacts.length,
      remaining_capacity: tierConfig.max_contacts === -1 ? 'unlimited' : tierConfig.max_contacts - this.mockContacts.length
    };
  }

  /**
   * 연락처 목록
   */
  async listContacts(args, context) {
    console.log('📋 전체 연락처 목록 조회');

    // 최근 업데이트 순으로 정렬
    const sortedContacts = [...this.mockContacts].sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    // 그룹별 분류 (premium 기능)
    const groupedContacts = {};
    if (context.subscriptionTier === 'premium') {
      sortedContacts.forEach(contact => {
        if (contact.groups && contact.groups.length > 0) {
          contact.groups.forEach(group => {
            if (!groupedContacts[group]) {
              groupedContacts[group] = [];
            }
            groupedContacts[group].push(contact);
          });
        } else {
          if (!groupedContacts['미분류']) {
            groupedContacts['미분류'] = [];
          }
          groupedContacts['미분류'].push(contact);
        }
      });
    }

    return {
      success: true,
      action: 'list_contacts',
      contacts: sortedContacts,
      count: sortedContacts.length,
      grouped_contacts: context.subscriptionTier === 'premium' ? groupedContacts : undefined,
      metadata: {
        total_contacts: this.mockContacts.length,
        has_grouping: context.subscriptionTier === 'premium',
        sort_order: 'updated_desc'
      }
    };
  }

  /**
   * 연락처 상세 정보
   */
  async getContactDetail(args, context) {
    const { contactId, name } = args;

    let contact;
    if (contactId) {
      contact = this.mockContacts.find(c => c.id === contactId);
    } else if (name) {
      contact = this.mockContacts.find(c => c.name === name);
    }

    if (!contact) {
      throw new Error('연락처를 찾을 수 없습니다');
    }

    console.log(`👤 연락처 상세 조회: ${contact.name}`);

    // 관련 그룹 정보 추가 (premium 기능)
    let relatedGroups = [];
    if (context.subscriptionTier === 'premium' && contact.groups) {
      relatedGroups = this.mockGroups.filter(group => 
        contact.groups.includes(group.name)
      );
    }

    return {
      success: true,
      action: 'get_contact_detail',
      contact: contact,
      related_groups: context.subscriptionTier === 'premium' ? relatedGroups : undefined,
      contact_statistics: {
        created_days_ago: Math.floor((Date.now() - new Date(contact.createdAt)) / (1000 * 60 * 60 * 24)),
        updated_days_ago: Math.floor((Date.now() - new Date(contact.updatedAt)) / (1000 * 60 * 60 * 24)),
        groups_count: contact.groups?.length || 0,
        has_complete_info: !!(contact.phone && contact.email && contact.company)
      }
    };
  }

  /**
   * 연락처 수정
   */
  async updateContact(args, context) {
    const { contactId, contactInfo } = args;

    if (!contactId || !contactInfo) {
      throw new Error('연락처 ID와 수정할 정보가 필요합니다');
    }

    const contactIndex = this.mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      throw new Error('연락처를 찾을 수 없습니다');
    }

    console.log(`✏️ 연락처 수정: ${contactId}`);

    const existingContact = this.mockContacts[contactIndex];
    const updatedContact = {
      ...existingContact,
      ...contactInfo,
      id: contactId, // ID는 변경되지 않음
      createdAt: existingContact.createdAt, // 생성일은 변경되지 않음
      updatedAt: new Date().toISOString()
    };

    // 변경된 필드 추적
    const changedFields = [];
    Object.keys(contactInfo).forEach(key => {
      if (existingContact[key] !== contactInfo[key]) {
        changedFields.push(key);
      }
    });

    this.mockContacts[contactIndex] = updatedContact;

    return {
      success: true,
      action: 'update_contact',
      contact_id: contactId,
      updated_contact: updatedContact,
      changed_fields: changedFields,
      change_count: changedFields.length,
      previous_version: {
        name: existingContact.name,
        updated_at: existingContact.updatedAt
      }
    };
  }

  /**
   * 연락처 삭제
   */
  async deleteContact(args, context) {
    const { contactId } = args;

    if (!contactId) {
      throw new Error('연락처 ID가 필요합니다');
    }

    const contactIndex = this.mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      throw new Error('연락처를 찾을 수 없습니다');
    }

    console.log(`🗑️ 연락처 삭제: ${contactId}`);

    const deletedContact = this.mockContacts.splice(contactIndex, 1)[0];

    return {
      success: true,
      action: 'delete_contact',
      contact_id: contactId,
      deleted_contact: {
        id: deletedContact.id,
        name: deletedContact.name,
        company: deletedContact.company,
        groups: deletedContact.groups,
        created_at: deletedContact.createdAt,
        deleted_at: new Date().toISOString()
      },
      remaining_contacts_count: this.mockContacts.length
    };
  }

  /**
   * 그룹 관리 (Premium 기능)
   */
  async manageGroups(args, context) {
    const { action, groupName, contactId } = args;

    if (!action) {
      throw new Error('그룹 관리 작업을 지정해야 합니다');
    }

    console.log(`👥 그룹 관리: ${action}`);

    switch (action) {
      case 'list_groups':
        return {
          success: true,
          action: 'manage_groups',
          groups: this.mockGroups,
          groups_count: this.mockGroups.length,
          total_contacts_in_groups: this.mockGroups.reduce((sum, group) => sum + group.contactIds.length, 0)
        };

      case 'create_group':
        if (!groupName) {
          throw new Error('그룹 이름이 필요합니다');
        }
        const newGroup = {
          id: `group_${Date.now()}`,
          name: groupName,
          contactIds: [],
          createdAt: new Date().toISOString()
        };
        this.mockGroups.push(newGroup);
        return {
          success: true,
          action: 'manage_groups',
          created_group: newGroup,
          groups_count: this.mockGroups.length
        };

      case 'add_to_group':
        if (!groupName || !contactId) {
          throw new Error('그룹 이름과 연락처 ID가 필요합니다');
        }
        const group = this.mockGroups.find(g => g.name === groupName);
        const contact = this.mockContacts.find(c => c.id === contactId);
        if (!group || !contact) {
          throw new Error('그룹 또는 연락처를 찾을 수 없습니다');
        }
        if (!group.contactIds.includes(contactId)) {
          group.contactIds.push(contactId);
        }
        if (!contact.groups.includes(groupName)) {
          contact.groups.push(groupName);
        }
        return {
          success: true,
          action: 'manage_groups',
          group_name: groupName,
          contact_id: contactId,
          group_size: group.contactIds.length
        };

      default:
        throw new Error(`지원하지 않는 그룹 관리 작업: ${action}`);
    }
  }

  /**
   * 검색 관련성 점수 계산
   */
  calculateRelevanceScore(contact, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // 이름 매칭 (가중치 높음)
    if (contact.name.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // 회사 매칭
    if (contact.company && contact.company.toLowerCase().includes(lowerQuery)) {
      score += 7;
    }
    
    // 전화번호 매칭
    if (contact.phone && contact.phone.includes(lowerQuery)) {
      score += 5;
    }
    
    // 이메일 매칭
    if (contact.email && contact.email.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    // 그룹 매칭
    if (contact.groups) {
      const groupMatches = contact.groups.filter(group => 
        group.toLowerCase().includes(lowerQuery)
      ).length;
      score += groupMatches * 3;
    }
    
    // 메모 매칭
    if (contact.notes && contact.notes.toLowerCase().includes(lowerQuery)) {
      score += 2;
    }
    
    return score;
  }

  /**
   * 🔒 구독 등급별 기능 접근 권한 체크 (8단계)
   */
  async checkSubscriptionAccess(action, context) {
    const userTier = context.subscriptionTier || 'free';
    const tierConfig = this.subscription_features[userTier];
    
    // 모든 기능 허용
    if (tierConfig.allowed_actions === '*') {
      return { allowed: true };
    }
    
    // 특정 액션 허용 여부 확인
    if (tierConfig.allowed_actions.includes(action)) {
      return { allowed: true };
    }
    
    // 기능별 필요 등급 결정
    let requiredTier = 'basic';
    if (['delete_contact', 'manage_groups'].includes(action)) {
      requiredTier = 'premium';
    }
    
    return {
      allowed: false,
      message: `${action} 기능을 사용하려면 ${requiredTier} 구독이 필요합니다.`,
      required_tier: requiredTier,
      benefits: this.getUpgradeBenefits(requiredTier)
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
        '월 50회 연락처 작업',
        '1,000개 연락처 저장',
        '연락처 생성/수정/삭제',
        '연락처 그룹 관리',
        '연락처 목록 조회'
      ],
      premium: [
        '무제한 연락처 작업',
        '무제한 연락처 저장',
        '모든 기능 이용',
        '고급 검색 및 필터링',
        '연락처 그룹 관리',
        '연락처 백업 및 동기화'
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
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      description: this.description,
      version: this.version,
      category: this.category,
      contact_count: this.mockContacts.length,
      groups_count: this.mockGroups.length,
      subscription_features: this.subscription_features,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      console.log('👥 ContactsService 정리 중...');
      // TODO: 실제 연락처 DB 연결 해제
      // TODO: 캐시 정리
      // TODO: 임시 파일 삭제
      console.log('✅ ContactsService 정리 완료');

    } catch (error) {
      console.error('❌ ContactsService 정리 실패:', error);
    }
  }
}