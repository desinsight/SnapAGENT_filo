/**
 * CalendarService.js
 * 캘린더 서비스의 메인 진입점
 * 일정 관리, 이벤트 생성, 알림 등을 처리
 */

export class CalendarService {
  constructor() {
    // AI Function Calling을 위한 서비스 정의
    this.name = 'calendar';
    this.description = '일정을 관리하고 이벤트를 생성합니다. 미팅 예약, 일정 확인, 알림 설정 등이 가능합니다.';
    this.category = 'productivity';
    this.available = true;
    this.version = '1.0.0';
    
    // 8단계: 구독 메타데이터
    this.subscription_tier = 'free';
    this.subscription_features = {
      free: {
        allowed_actions: ['list_events', 'search_events'],
        daily_limit: 10,
        max_events: 20,
        features: ['basic_calendar', 'simple_search']
      },
      basic: {
        allowed_actions: ['create_event', 'list_events', 'update_event', 'search_events', 'check_availability'],
        daily_limit: 100,
        max_events: 200,
        features: ['event_management', 'availability_check', 'reminders']
      },
      premium: {
        allowed_actions: '*',
        daily_limit: -1,
        max_events: -1,
        features: ['all_features', 'recurring_events', 'team_calendar', 'integrations']
      }
    };

    // AI에게 제공할 파라미터 정의
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_event', 'list_events', 'update_event', 'delete_event', 'search_events', 'check_availability'],
          description: '수행할 작업: create_event(일정 생성), list_events(일정 목록), update_event(일정 수정), delete_event(일정 삭제), search_events(일정 검색), check_availability(시간 확인)'
        },
        title: {
          type: 'string',
          description: '일정 제목'
        },
        date: {
          type: 'string',
          description: '날짜 (예: 2024-12-25, 내일, 다음주 월요일)'
        },
        time: {
          type: 'string',
          description: '시간 (예: 14:00, 오후 2시)'
        },
        duration: {
          type: 'string',
          description: '소요 시간 (예: 1시간, 30분)'
        },
        location: {
          type: 'string',
          description: '장소'
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: '참석자 목록'
        },
        reminder: {
          type: 'string',
          description: '알림 시간 (예: 15분 전, 1시간 전)'
        },
        eventId: {
          type: 'string',
          description: '일정 ID'
        },
        query: {
          type: 'string',
          description: '검색어'
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          description: '날짜 범위'
        }
      },
      required: ['action']
    };

    // 임시 일정 데이터 (개발용)
    this.mockEvents = [
      {
        id: 'event_1',
        title: '팀 미팅',
        date: '2024-12-20',
        time: '10:00',
        duration: '1시간',
        location: '회의실 A',
        attendees: ['김철수', '이영희'],
        reminder: '15분 전'
      },
      {
        id: 'event_2',
        title: '프로젝트 발표',
        date: '2024-12-22',
        time: '14:00',
        duration: '2시간',
        location: '대회의실',
        attendees: ['전체 팀'],
        reminder: '1시간 전'
      }
    ];
  }

  async initialize() {
    try {
      console.log('📅 CalendarService 초기화...');
      
      // TODO: 실제 캘린더 API 연결
      // TODO: 권한 확인
      
      console.log('✅ CalendarService 초기화 완료');

    } catch (error) {
      console.error('❌ CalendarService 초기화 실패:', error);
      this.available = false;
    }
  }

  /**
   * 서비스 실행 메인 함수 - AI가 호출 (8단계: 구독 기반)
   */
  async execute(args, context = {}) {
    try {
      console.log(`📅 CalendarService 실행: ${args.action}`, args);

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
        case 'create_event':
          result = await this.createEvent(args, context);
          break;
        
        case 'list_events':
          result = await this.listEvents(args, context);
          break;
        
        case 'update_event':
          result = await this.updateEvent(args, context);
          break;
        
        case 'delete_event':
          result = await this.deleteEvent(args, context);
          break;
        
        case 'search_events':
          result = await this.searchEvents(args, context);
          break;
        
        case 'check_availability':
          result = await this.checkAvailability(args, context);
          break;
        
        default:
          throw new Error(`지원하지 않는 작업: ${args.action}`);
      }

      // 8단계: 자연어 포매팅 제거, 순수 JSON 반환
      return this.formatJsonResponse(result, args.action, context);

    } catch (error) {
      console.error('❌ CalendarService 실행 실패:', error);
      const errorResult = {
        success: false,
        error: error.message,
        action: args.action,
        timestamp: new Date().toISOString()
      };
      return this.formatJsonResponse(errorResult, args.action, context);
    }
  }

  /**
   * 일정 생성
   */
  async createEvent(args, context) {
    const { title, date, time, duration, location, attendees, reminder } = args;

    if (!title || !date) {
      throw new Error('일정 제목과 날짜가 필요합니다');
    }

    console.log(`➕ 일정 생성: ${title}`);

    // 날짜 파싱 (자연어 처리)
    const parsedDate = this.parseDate(date);
    
    // TODO: 실제 일정 생성 구현
    const newEvent = {
      id: `event_${Date.now()}`,
      title,
      date: parsedDate,
      time: time || '09:00',
      duration: duration || '1시간',
      location,
      attendees: attendees || [],
      reminder: reminder || '15분 전',
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      action: 'create_event',
      event: newEvent,
      event_id: newEvent.id,
      created_at: newEvent.createdAt
    };
  }

  /**
   * 일정 목록
   */
  async listEvents(args, context) {
    const { date, dateRange } = args;

    console.log('📋 일정 목록 조회');

    // TODO: 실제 일정 조회 구현
    let events = this.mockEvents;

    // 날짜 필터링
    if (date) {
      const targetDate = this.parseDate(date);
      events = events.filter(e => e.date === targetDate);
    }

    return {
      success: true,
      action: 'list_events',
      events: events,
      count: events.length,
      filter_date: date,
      total_available: this.mockEvents.length
    };
  }

  /**
   * 일정 검색
   */
  async searchEvents(args, context) {
    const { query } = args;

    if (!query) {
      throw new Error('검색어가 필요합니다');
    }

    console.log(`🔍 일정 검색: "${query}"`);

    // TODO: 실제 일정 검색 구현
    const results = this.mockEvents.filter(event =>
      event.title.includes(query) ||
      event.location?.includes(query) ||
      event.attendees?.some(a => a.includes(query))
    );

    return {
      success: true,
      action: 'search_events',
      query: query,
      results: results,
      count: results.length,
      search_matches: results.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        relevance_score: this.calculateEventRelevance(event, query)
      }))
    };
  }

  /**
   * 일정 수정
   */
  async updateEvent(args, context) {
    const { eventId, ...updates } = args;

    if (!eventId) {
      throw new Error('일정 ID가 필요합니다');
    }

    console.log(`✏️ 일정 수정: ${eventId}`);

    // TODO: 실제 일정 수정 구현
    return {
      success: true,
      action: 'update_event',
      event_id: eventId,
      updates: updates,
      updated_at: new Date().toISOString(),
      changes_count: Object.keys(updates).length
    };
  }

  /**
   * 일정 삭제
   */
  async deleteEvent(args, context) {
    const { eventId } = args;

    if (!eventId) {
      throw new Error('일정 ID가 필요합니다');
    }

    console.log(`🗑️ 일정 삭제: ${eventId}`);

    // TODO: 실제 일정 삭제 구현
    return {
      success: true,
      action: 'delete_event',
      event_id: eventId,
      deleted_at: new Date().toISOString(),
      remaining_events_count: this.mockEvents.length
    };
  }

  /**
   * 시간 가용성 확인
   */
  async checkAvailability(args, context) {
    const { date, time, duration } = args;

    if (!date) {
      throw new Error('날짜가 필요합니다');
    }

    console.log(`🕐 시간 확인: ${date} ${time || ''}`);

    const parsedDate = this.parseDate(date);
    
    // TODO: 실제 가용성 확인 구현
    const conflicts = this.mockEvents.filter(e => e.date === parsedDate);

    return {
      success: true,
      action: 'check_availability',
      date: parsedDate,
      time: time,
      duration: duration,
      available: conflicts.length === 0,
      conflicts: conflicts,
      conflict_count: conflicts.length,
      suggested_times: conflicts.length > 0 ? this.suggestAlternativeTimes(parsedDate, time) : []
    };
  }

  /**
   * 날짜 파싱 (자연어 처리)
   */
  parseDate(dateStr) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 간단한 자연어 처리
    const lowerDate = dateStr.toLowerCase();
    
    if (lowerDate === '오늘') {
      return today.toISOString().split('T')[0];
    }
    if (lowerDate === '내일') {
      return tomorrow.toISOString().split('T')[0];
    }
    if (lowerDate.includes('다음주')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // ISO 형식이면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // 기본값: 오늘
    return today.toISOString().split('T')[0];
  }

  /**
   * 생성된 일정 포맷팅
   */
  formatEventCreated(event) {
    let formatted = `✅ 일정이 생성되었습니다!\n\n`;
    formatted += `📅 **${event.title}**\n`;
    formatted += `📆 날짜: ${event.date}\n`;
    formatted += `🕐 시간: ${event.time}\n`;
    formatted += `⏱️ 소요시간: ${event.duration}\n`;
    if (event.location) formatted += `📍 장소: ${event.location}\n`;
    if (event.attendees?.length > 0) formatted += `👥 참석자: ${event.attendees.join(', ')}\n`;
    formatted += `🔔 알림: ${event.reminder}`;
    
    return formatted;
  }

  /**
   * 일정 목록 포맷팅
   */
  formatEventList(events, date = null, searchTerm = null) {
    if (events.length === 0) {
      if (searchTerm) return `"${searchTerm}"에 대한 검색 결과가 없습니다.`;
      if (date) return `${date}에 일정이 없습니다.`;
      return '일정이 없습니다.';
    }

    let formatted = '';
    if (searchTerm) {
      formatted = `🔍 "${searchTerm}" 검색 결과 (${events.length}개):\n\n`;
    } else if (date) {
      formatted = `📅 ${date} 일정 (${events.length}개):\n\n`;
    } else {
      formatted = `📅 전체 일정 (${events.length}개):\n\n`;
    }

    events.forEach((event, index) => {
      formatted += `${index + 1}. **${event.title}**\n`;
      formatted += `   📆 ${event.date} ${event.time}\n`;
      formatted += `   ⏱️ ${event.duration}\n`;
      if (event.location) formatted += `   📍 ${event.location}\n`;
      if (event.attendees?.length > 0) formatted += `   👥 ${event.attendees.join(', ')}\n`;
      formatted += '\n';
    });

    return formatted.trim();
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      description: this.description,
      eventCount: this.mockEvents.length
    };
  }

  /**
   * 이벤트 관련성 점수 계산
   */
  calculateEventRelevance(event, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // 제목 매칭 (가중치 높음)
    if (event.title.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // 장소 매칭
    if (event.location && event.location.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    // 참석자 매칭
    if (event.attendees && event.attendees.some(a => a.toLowerCase().includes(lowerQuery))) {
      score += 3;
    }
    
    return score;
  }

  /**
   * 대안 시간 제안
   */
  suggestAlternativeTimes(date, requestedTime) {
    const suggestions = [];
    const baseHour = requestedTime ? parseInt(requestedTime.split(':')[0]) : 9;
    
    // 1시간 앞/뒤 시간 제안
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const suggestedHour = baseHour + i;
      if (suggestedHour >= 8 && suggestedHour <= 18) {
        suggestions.push(`${suggestedHour.toString().padStart(2, '0')}:00`);
      }
    }
    
    return suggestions;
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
        '월 100회 캘린더 작업',
        '200개 이벤트 저장',
        '일정 생성 및 수정',
        '시간 가용성 확인',
        '알림 기능'
      ],
      premium: [
        '무제한 캘린더 작업',
        '무제한 이벤트 저장',
        '모든 기능 이용',
        '반복 일정',
        '팀 캘린더',
        '외부 캘린더 연동'
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
      console.log('📅 CalendarService 정리 중...');
      console.log('✅ CalendarService 정리 완료');

    } catch (error) {
      console.error('❌ CalendarService 정리 실패:', error);
    }
  }
}