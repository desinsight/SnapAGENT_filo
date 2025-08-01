/**
 * MessengerService.js
 * 구독 기반 Tool 형식 메신저 서비스 (8단계)
 * 
 * 🎯 8단계 변경사항:
 * - 구독 등급별 기능 제한 로직 추가 (free, basic, premium)
 * - Tool 메타데이터에 구독 정보 포함
 * - 자연어 포맷팅 제거, 순수 JSON 반환
 * - 서비스별 구독 체크 로직 구현
 * - Premium 구독 권장 서비스로 설정
 */

export class MessengerService {
  constructor() {
    // Tool 메타데이터 (8단계 요구사항)
    this.name = 'messenger';
    this.description = '메시지를 보내고 채팅을 관리합니다. 연락처에서 사람을 찾아 메시지를 전송할 수 있습니다.';
    this.category = 'communication';
    this.available = true;
    this.version = '1.0.0';
    
    // 구독 메타데이터 (8단계) - Premium 구독 권장
    this.subscription_tier = 'premium';
    this.subscription_features = {
      free: {
        allowed_actions: ['read_messages', 'search_messages'],
        daily_limit: 5,
        max_messages: 10,
        features: ['basic_read', 'simple_search']
      },
      basic: {
        allowed_actions: ['read_messages', 'search_messages', 'send_message', 'list_chats'],
        daily_limit: 20,
        max_messages: 100,
        features: ['basic_messaging', 'chat_management', 'advanced_search']
      },
      premium: {
        allowed_actions: '*',
        daily_limit: 200,
        max_messages: -1,
        features: ['all_features', 'group_messaging', 'file_transfer', 'advanced_features', 'priority_support']
      }
    };

    // AI에게 제공할 파라미터 정의
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['send_message', 'read_messages', 'list_chats', 'search_messages', 'send_group_message', 'send_file', 'create_chat', 'manage_chat'],
          description: '수행할 작업: send_message(메시지 보내기), read_messages(메시지 읽기), list_chats(채팅 목록), search_messages(메시지 검색), send_group_message(그룹 메시지), send_file(파일 전송), create_chat(채팅방 생성), manage_chat(채팅방 관리)'
        },
        recipient: {
          type: 'string',
          description: '수신자 이름 또는 ID (예: 김철수, 이영희)'
        },
        message: {
          type: 'string',
          description: '전송할 메시지 내용'
        },
        chatId: {
          type: 'string',
          description: '채팅방 ID'
        },
        query: {
          type: 'string',
          description: '검색어'
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: '그룹 메시지 수신자 목록'
        },
        file: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' }
          },
          description: '전송할 파일 정보'
        },
        chatName: {
          type: 'string',
          description: '채팅방 이름'
        },
        limit: {
          type: 'number',
          description: '결과 개수 제한'
        }
      },
      required: ['action']
    };

    // 사용량 추적 (임시 메모리 기반)
    this.usage = {
      daily_count: 0,
      last_reset: new Date().toDateString(),
      total_messages: 0
    };

    // 임시 메시지 데이터 (개발용)
    this.mockMessages = [
      {
        id: 'msg_1',
        chatId: 'chat_1',
        sender: { id: 'user_1', name: '김철수' },
        content: '안녕하세요! 오늘 회의 시간이 언제인가요?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        read: false
      },
      {
        id: 'msg_2',
        chatId: 'chat_1',
        sender: { id: 'me', name: '나' },
        content: '오후 2시에 회의실 A에서 진행됩니다.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
        read: true
      },
      {
        id: 'msg_3',
        chatId: 'chat_2',
        sender: { id: 'user_2', name: '이영희' },
        content: '프로젝트 진행 상황은 어떤가요?',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'text',
        read: false
      }
    ];

    // 임시 채팅방 데이터 (개발용)
    this.mockChats = [
      {
        id: 'chat_1',
        name: '김철수',
        type: 'direct',
        participants: [{ id: 'user_1', name: '김철수' }],
        lastMessage: {
          content: '오후 2시에 회의실 A에서 진행됩니다.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          sender: '나'
        },
        unreadCount: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'chat_2',
        name: '이영희',
        type: 'direct',
        participants: [{ id: 'user_2', name: '이영희' }],
        lastMessage: {
          content: '프로젝트 진행 상황은 어떤가요?',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          sender: '이영희'
        },
        unreadCount: 1,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'chat_3',
        name: '개발팀',
        type: 'group',
        participants: [
          { id: 'user_1', name: '김철수' },
          { id: 'user_2', name: '이영희' },
          { id: 'user_3', name: '박민수' }
        ],
        lastMessage: {
          content: '내일 스프린트 리뷰 준비해주세요.',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          sender: '박민수'
        },
        unreadCount: 3,
        createdAt: new Date(Date.now() - 259200000).toISOString()
      }
    ];
  }

  async initialize() {
    try {
      console.log('💬 MessengerService 초기화...');
      
      // TODO: 실제 메신저 API 연결
      // TODO: 채팅 모듈 초기화
      
      console.log('✅ MessengerService 초기화 완료');

    } catch (error) {
      console.error('❌ MessengerService 초기화 실패:', error);
      this.available = false;
    }
  }

  // ==================== 8단계 구독 관련 메서드 ====================

  /**
   * 구독 등급별 접근 권한 확인 (8단계)
   */
  checkSubscriptionAccess(action, userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    if (!tierConfig) {
      return {
        allowed: false,
        reason: 'invalid_tier',
        message: '유효하지 않은 구독 등급입니다.'
      };
    }

    // 프리미엄 구독 권장 서비스 체크
    if (userTier === 'free' && this.subscription_tier === 'premium') {
      return {
        allowed: false,
        reason: 'premium_required',
        message: '이 서비스는 Premium 구독이 필요합니다.',
        upgrade_benefits: this.getUpgradeBenefits(userTier)
      };
    }

    // 허용된 액션 확인
    const allowedActions = tierConfig.allowed_actions;
    if (allowedActions !== '*' && !allowedActions.includes(action)) {
      return {
        allowed: false,
        reason: 'action_not_allowed',
        message: `${userTier} 구독에서는 ${action} 기능을 사용할 수 없습니다.`,
        upgrade_benefits: this.getUpgradeBenefits(userTier)
      };
    }

    return { allowed: true };
  }

  /**
   * 일일 사용량 제한 확인 (8단계)
   */
  checkUsageLimit(userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    // 일일 제한 체크
    if (tierConfig.daily_limit > 0 && this.usage.daily_count >= tierConfig.daily_limit) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        message: `일일 사용량 한도(${tierConfig.daily_limit}회)에 도달했습니다.`,
        reset_time: this.getNextResetTime(),
        upgrade_benefits: this.getUpgradeBenefits(userTier)
      };
    }

    // 최대 메시지 수 체크
    if (tierConfig.max_messages > 0 && this.usage.total_messages >= tierConfig.max_messages) {
      return {
        allowed: false,
        reason: 'storage_limit_exceeded',
        message: `최대 메시지 저장량(${tierConfig.max_messages}개)에 도달했습니다.`,
        upgrade_benefits: this.getUpgradeBenefits(userTier)
      };
    }

    return { allowed: true };
  }

  /**
   * 순수 JSON 응답 포맷팅 (8단계)
   */
  formatJsonResponse(data, action, userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    return {
      success: true,
      action: action,
      data: data,
      metadata: {
        subscription_tier: userTier,
        features_used: tierConfig.features,
        usage: {
          daily_count: this.usage.daily_count,
          daily_limit: tierConfig.daily_limit,
          remaining: tierConfig.daily_limit > 0 ? tierConfig.daily_limit - this.usage.daily_count : -1
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 구독 업그레이드 혜택 정보 (8단계)
   */
  getUpgradeBenefits(currentTier) {
    const benefits = {
      free: {
        next_tier: 'basic',
        benefits: [
          '메시지 전송 기능 활성화',
          '일일 사용량 20회로 증가',
          '채팅 관리 기능',
          '고급 검색 기능'
        ]
      },
      basic: {
        next_tier: 'premium',
        benefits: [
          '그룹 메시지 전송',
          '파일 전송 기능',
          '일일 사용량 200회로 증가',
          '무제한 메시지 저장',
          '고급 기능 및 우선 지원'
        ]
      }
    };

    return benefits[currentTier] || null;
  }

  /**
   * 다음 사용량 리셋 시간 (8단계)
   */
  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * Tool 메타데이터 반환 (8단계)
   */
  getToolMetadata(userTier = 'free') {
    const tierConfig = this.subscription_features[userTier];
    
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      subscription: {
        required_tier: this.subscription_tier,
        user_tier: userTier,
        features: tierConfig.features,
        limits: {
          daily_limit: tierConfig.daily_limit,
          max_messages: tierConfig.max_messages
        }
      },
      parameters: this.parameters
    };
  }

  /**
   * 사용량 업데이트 (8단계)
   */
  updateUsage() {
    const today = new Date().toDateString();
    
    // 날짜가 바뀌면 일일 카운트 리셋
    if (this.usage.last_reset !== today) {
      this.usage.daily_count = 0;
      this.usage.last_reset = today;
    }
    
    this.usage.daily_count++;
    this.usage.total_messages++;
  }

  /**
   * 서비스 실행 메인 함수 - AI가 호출 (8단계)
   */
  async execute(args, context = {}) {
    try {
      console.log(`💬 MessengerService 실행: ${args.action}`, args);

      // 사용자 구독 등급 확인 (기본값: free)
      const userTier = context.subscription?.tier || 'free';

      // 구독 접근 권한 확인
      const accessCheck = this.checkSubscriptionAccess(args.action, userTier);
      if (!accessCheck.allowed) {
        return {
          success: false,
          error: accessCheck.reason,
          message: accessCheck.message,
          upgrade_benefits: accessCheck.upgrade_benefits,
          action: args.action,
          metadata: {
            subscription_tier: userTier,
            required_tier: this.subscription_tier
          }
        };
      }

      // 사용량 제한 확인
      const usageCheck = this.checkUsageLimit(userTier);
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: usageCheck.reason,
          message: usageCheck.message,
          reset_time: usageCheck.reset_time,
          upgrade_benefits: usageCheck.upgrade_benefits,
          action: args.action,
          metadata: {
            subscription_tier: userTier,
            usage: this.usage
          }
        };
      }

      // 사용량 업데이트
      this.updateUsage();

      // 액션 실행
      switch (args.action) {
        case 'send_message':
          return await this.sendMessage(args, context);
        
        case 'read_messages':
          return await this.readMessages(args, context);
        
        case 'list_chats':
          return await this.listChats(args, context);
        
        case 'search_messages':
          return await this.searchMessages(args, context);
        
        case 'send_group_message':
          return await this.sendGroupMessage(args, context);
        
        case 'send_file':
          return await this.sendFile(args, context);
        
        case 'create_chat':
          return await this.createChat(args, context);
        
        case 'manage_chat':
          return await this.manageChat(args, context);
        
        default:
          throw new Error(`지원하지 않는 작업: ${args.action}`);
      }

    } catch (error) {
      console.error('❌ MessengerService 실행 실패:', error);
      return {
        success: false,
        error: error.message,
        action: args.action,
        metadata: {
          subscription_tier: context.subscription?.tier || 'free',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 메시지 전송 (8단계)
   */
  async sendMessage(args, context) {
    const { recipient, message } = args;
    const userTier = context.subscription?.tier || 'free';
    
    if (!recipient || !message) {
      throw new Error('수신자와 메시지 내용이 필요합니다');
    }

    console.log(`📤 메시지 전송: ${recipient}에게 "${message}"`);

    // 새 메시지 생성
    const newMessage = {
      id: `msg_${Date.now()}`,
      chatId: `chat_${recipient.toLowerCase().replace(/\s+/g, '_')}`,
      sender: { id: 'me', name: '나' },
      recipient: { id: recipient, name: recipient },
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
      read: false,
      delivered: true,
      status: 'sent'
    };

    // 임시 데이터에 추가
    this.mockMessages.push(newMessage);

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      message: newMessage,
      delivery_status: 'sent',
      recipient: recipient,
      chat_id: newMessage.chatId
    }, 'send_message', userTier);
  }

  /**
   * 메시지 읽기 (8단계)
   */
  async readMessages(args, context) {
    const { chatId, limit = 10 } = args;
    const userTier = context.subscription?.tier || 'free';

    console.log(`📥 메시지 읽기: ${chatId || '최근 메시지'}`);

    // 메시지 필터링
    let messages = this.mockMessages;
    if (chatId) {
      messages = messages.filter(msg => msg.chatId === chatId);
    }

    // 최신 메시지 우선 정렬
    messages = messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 제한 적용
    messages = messages.slice(0, limit);

    // 읽음 상태 업데이트
    messages.forEach(msg => {
      if (msg.sender.id !== 'me') {
        msg.read = true;
      }
    });

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      messages: messages,
      chat_id: chatId || 'all',
      total_count: messages.length,
      unread_count: messages.filter(msg => !msg.read).length
    }, 'read_messages', userTier);
  }

  /**
   * 채팅 목록 (8단계)
   */
  async listChats(args, context) {
    const userTier = context.subscription?.tier || 'free';
    const { limit = 20 } = args;

    console.log('💬 채팅 목록 조회');

    // 채팅 목록 정렬 (최신 메시지 기준)
    const sortedChats = this.mockChats.sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );

    // 제한 적용
    const chats = sortedChats.slice(0, limit);

    // 총 읽지 않은 메시지 수 계산
    const totalUnreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      chats: chats,
      total_chats: chats.length,
      total_unread_count: totalUnreadCount,
      chat_types: {
        direct: chats.filter(c => c.type === 'direct').length,
        group: chats.filter(c => c.type === 'group').length
      }
    }, 'list_chats', userTier);
  }

  /**
   * 메시지 검색 (8단계)
   */
  async searchMessages(args, context) {
    const { query, limit = 10 } = args;
    const userTier = context.subscription?.tier || 'free';

    if (!query) {
      throw new Error('검색어가 필요합니다');
    }

    console.log(`🔍 메시지 검색: "${query}"`);

    // 메시지 내용에서 검색
    const searchResults = this.mockMessages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.sender.name.toLowerCase().includes(query.toLowerCase())
    );

    // 최신 메시지 우선 정렬
    const sortedResults = searchResults.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // 제한 적용
    const results = sortedResults.slice(0, limit);

    // 검색 통계
    const searchStats = {
      total_matches: searchResults.length,
      returned_count: results.length,
      search_query: query,
      chat_matches: [...new Set(results.map(msg => msg.chatId))].length
    };

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      search_results: results,
      search_stats: searchStats,
      query: query
    }, 'search_messages', userTier);
  }

  /**
   * 그룹 메시지 전송 (Premium 전용)
   */
  async sendGroupMessage(args, context) {
    const { recipients, message, chatName } = args;
    const userTier = context.subscription?.tier || 'free';

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('수신자 목록이 필요합니다');
    }

    if (!message) {
      throw new Error('메시지 내용이 필요합니다');
    }

    console.log(`📤 그룹 메시지 전송: ${recipients.join(', ')}에게 "${message}"`);

    // 그룹 채팅방 생성 또는 찾기
    const groupChatId = chatName ? `group_${chatName.toLowerCase().replace(/\s+/g, '_')}` : `group_${Date.now()}`;

    // 그룹 메시지 생성
    const groupMessage = {
      id: `msg_${Date.now()}`,
      chatId: groupChatId,
      sender: { id: 'me', name: '나' },
      recipients: recipients.map(r => ({ id: r, name: r })),
      content: message,
      timestamp: new Date().toISOString(),
      type: 'group_text',
      read: false,
      delivered: true,
      status: 'sent'
    };

    // 임시 데이터에 추가
    this.mockMessages.push(groupMessage);

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      group_message: groupMessage,
      chat_id: groupChatId,
      recipients: recipients,
      delivery_status: 'sent',
      participants_count: recipients.length
    }, 'send_group_message', userTier);
  }

  /**
   * 파일 전송 (Premium 전용)
   */
  async sendFile(args, context) {
    const { recipient, file, message } = args;
    const userTier = context.subscription?.tier || 'free';

    if (!recipient) {
      throw new Error('수신자가 필요합니다');
    }

    if (!file || !file.name) {
      throw new Error('파일 정보가 필요합니다');
    }

    console.log(`📎 파일 전송: ${recipient}에게 "${file.name}"`);

    // 파일 메시지 생성
    const fileMessage = {
      id: `msg_${Date.now()}`,
      chatId: `chat_${recipient.toLowerCase().replace(/\s+/g, '_')}`,
      sender: { id: 'me', name: '나' },
      recipient: { id: recipient, name: recipient },
      content: message || `파일: ${file.name}`,
      timestamp: new Date().toISOString(),
      type: 'file',
      file: {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        path: file.path || null,
        url: `https://files.example.com/download/${file.name}`
      },
      read: false,
      delivered: true,
      status: 'sent'
    };

    // 임시 데이터에 추가
    this.mockMessages.push(fileMessage);

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      file_message: fileMessage,
      file_info: fileMessage.file,
      chat_id: fileMessage.chatId,
      recipient: recipient,
      delivery_status: 'sent'
    }, 'send_file', userTier);
  }

  /**
   * 채팅방 생성 (Premium 전용)
   */
  async createChat(args, context) {
    const { chatName, participants } = args;
    const userTier = context.subscription?.tier || 'free';

    if (!chatName) {
      throw new Error('채팅방 이름이 필요합니다');
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      throw new Error('참여자 목록이 필요합니다');
    }

    console.log(`🆕 채팅방 생성: "${chatName}" (참여자: ${participants.join(', ')})`);

    // 새 채팅방 생성
    const newChat = {
      id: `chat_${Date.now()}`,
      name: chatName,
      type: participants.length > 1 ? 'group' : 'direct',
      participants: participants.map(p => ({ id: p, name: p })),
      lastMessage: {
        content: '채팅방이 생성되었습니다.',
        timestamp: new Date().toISOString(),
        sender: '시스템'
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: { id: 'me', name: '나' }
    };

    // 임시 데이터에 추가
    this.mockChats.push(newChat);

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      chat: newChat,
      participants: participants,
      chat_type: newChat.type,
      created_by: 'me'
    }, 'create_chat', userTier);
  }

  /**
   * 채팅방 관리 (Premium 전용)
   */
  async manageChat(args, context) {
    const { chatId, action: chatAction, participants } = args;
    const userTier = context.subscription?.tier || 'free';

    if (!chatId) {
      throw new Error('채팅방 ID가 필요합니다');
    }

    if (!chatAction) {
      throw new Error('관리 작업이 필요합니다 (add_participant, remove_participant, leave_chat, delete_chat)');
    }

    console.log(`🛠️ 채팅방 관리: ${chatId} - ${chatAction}`);

    // 채팅방 찾기
    const chatIndex = this.mockChats.findIndex(chat => chat.id === chatId);
    if (chatIndex === -1) {
      throw new Error('채팅방을 찾을 수 없습니다');
    }

    const chat = this.mockChats[chatIndex];
    let result = {};

    switch (chatAction) {
      case 'add_participant':
        if (participants && participants.length > 0) {
          participants.forEach(p => {
            if (!chat.participants.find(existing => existing.id === p)) {
              chat.participants.push({ id: p, name: p });
            }
          });
          result = { added_participants: participants };
        }
        break;

      case 'remove_participant':
        if (participants && participants.length > 0) {
          participants.forEach(p => {
            const index = chat.participants.findIndex(existing => existing.id === p);
            if (index !== -1) {
              chat.participants.splice(index, 1);
            }
          });
          result = { removed_participants: participants };
        }
        break;

      case 'leave_chat':
        result = { left_chat: chatId, status: 'left' };
        break;

      case 'delete_chat':
        this.mockChats.splice(chatIndex, 1);
        result = { deleted_chat: chatId, status: 'deleted' };
        break;

      default:
        throw new Error(`지원하지 않는 채팅 관리 작업: ${chatAction}`);
    }

    // 순수 JSON 응답 (8단계)
    return this.formatJsonResponse({
      chat_id: chatId,
      management_action: chatAction,
      result: result,
      updated_chat: chatAction !== 'delete_chat' ? chat : null,
      participants_count: chat.participants ? chat.participants.length : 0
    }, 'manage_chat', userTier);
  }

  /**
   * 서비스 상태 확인 (8단계)
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      description: this.description,
      version: this.version,
      subscription_tier: this.subscription_tier,
      usage: this.usage
    };
  }

  /**
   * 정리 작업 (8단계)
   */
  async cleanup() {
    try {
      console.log('💬 MessengerService 정리 중...');
      
      // 사용량 통계 출력
      console.log(`📊 사용량 통계: 일일 ${this.usage.daily_count}회, 총 메시지 ${this.usage.total_messages}개`);
      
      // TODO: 실제 메신저 연결 정리
      // TODO: 캐시 정리
      
      console.log('✅ MessengerService 정리 완료');

    } catch (error) {
      console.error('❌ MessengerService 정리 실패:', error);
    }
  }
}