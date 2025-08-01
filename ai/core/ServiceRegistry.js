/**
 * ServiceRegistry.js
 * 모든 서비스들을 등록하고 관리하는 중앙 레지스트리
 * 각 서비스별 폴더에서 서비스들을 로드하여 AI에게 제공
 */

import { FileSystemService } from '../services/filesystem/FileSystemService.js';
import { MessengerService } from '../services/messenger/MessengerService.js';
import { ContactsService } from '../services/contacts/ContactsService.js';
import { CalendarService } from '../services/calendar/CalendarService.js';
import { NotesService } from '../services/notes/NotesService.js';
import { TasksService } from '../services/tasks/TasksService.js';
import { MCPConnector } from './MCPConnector.js';
import { Logger, CacheManager, LifecycleManager } from '../common/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ServiceRegistry {
  constructor(subscriptionService = null, logger = null, cacheManager = null, lifecycleManager = null) {
    // 의존성 주입
    this.subscriptionService = subscriptionService;
    this.logger = logger || Logger.component('ServiceRegistry');
    this.cacheManager = cacheManager || new CacheManager(2 * 60 * 1000); // 2분
    this.lifecycleManager = lifecycleManager || new LifecycleManager();
    
    // 서비스 관리
    this.services = new Map();
    this.mcpConnector = new MCPConnector();
    
    // 생명주기 관리자에 의존성 추가
    this.lifecycleManager.addDependency(this.mcpConnector);
  }

  async initialize() {
    return await this.lifecycleManager.initialize(async () => {
      this.logger.log('초기화 시작...', '📦');

      // 1. MCP 커넥터 초기화 (생명주기 관리자가 처리)
      
      // 2. 구독 서비스 확인 (의존성 주입됨)
      if (this.subscriptionService) {
        this.logger.success('구독 서비스 연결됨 (의존성 주입)', '✅');
      } else {
        this.logger.warn('구독 서비스 없음, 기본 모드로 동작', '⚠️');
      }

      // 3. 핵심 서비스들 등록
      await this.registerCoreServices();

      // 4. 향후 확장: 다른 서비스들 자동 로드
      // await this.registerExtendedServices();

      this.logger.success(`초기화 완료 - 등록된 서비스: ${this.services.size}개`, '✅');
    });
  }


  /**
   * 핵심 서비스들 등록
   */
  async registerCoreServices() {
    this.logger.log('핵심 서비스들 등록 중...', '📁');

    // 파일시스템 서비스
    const fileSystemService = new FileSystemService(this.mcpConnector);
    await this.registerService(fileSystemService);

    // 메신저 서비스
    const messengerService = new MessengerService();
    await this.registerService(messengerService);
    
    // 연락처 서비스
    const contactsService = new ContactsService();
    await this.registerService(contactsService);
    
    // 캘린더 서비스
    const calendarService = new CalendarService();
    await this.registerService(calendarService);
    
    // 노트 서비스
    const notesService = new NotesService();
    await this.registerService(notesService);
    
    // 작업 관리 서비스
    const tasksService = new TasksService();
    await this.registerService(tasksService);
  }

  /**
   * 개별 서비스 등록
   */
  async registerService(service) {
    try {
      // 서비스 초기화
      if (typeof service.initialize === 'function') {
        await service.initialize();
      }

      // 서비스 유효성 검사
      if (!service.name || !service.description || typeof service.execute !== 'function') {
        throw new Error(`유효하지 않은 서비스: ${service.name || 'unknown'}`);
      }

      this.services.set(service.name, service);
      this.logger.success(`서비스 등록 완료: ${service.name}`, '✅');

    } catch (error) {
      this.logger.error(`서비스 등록 실패: ${service.name}`, error, '❌');
    }
  }

  /**
   * AI Function Calling을 위한 서비스 목록 생성 (구독 기반)
   * @param {string|null} userId - 사용자 ID (null이면 기존 방식)
   * @param {boolean} includeUnsubscribed - 구독되지 않은 서비스도 포함 (구독 안내용)
   */
  async getServicesForAI(userId = null, includeUnsubscribed = false) {
    try {
      // 사용자 ID가 없으면 기존 방식으로 모든 서비스 반환
      if (!userId) {
        return this.getAllServicesForAI();
      }

      // 캐시 확인
      const cacheKey = `${userId}:${includeUnsubscribed}`;
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.log(`[${userId}] 사용자별 서비스 목록 생성 중...`, '🔍');

      const aiServices = [];

      for (const [name, service] of this.services) {
        if (service.available === false) continue;

        // 구독 상태 확인
        let isSubscribed = true;
        let subscriptionTier = null;
        let subscriptionRequired = false;

        if (this.subscriptionService) {
          isSubscribed = await this.subscriptionService.checkUserSubscription(userId, name);
          subscriptionTier = await this.subscriptionService.getUserSubscriptionTier(userId, name);
          subscriptionRequired = !isSubscribed;
        }

        // 구독되지 않은 서비스 처리
        if (!isSubscribed && !includeUnsubscribed) {
          this.logger.log(`[${userId}] ${name}: 구독 없음, 제외됨`, '🚫');
          continue;
        }

        // Tool 정의 생성
        const toolDefinition = {
          type: 'function',
          function: {
            name: service.name,
            description: service.description,
            parameters: service.parameters || {
              type: 'object',
              properties: {},
              required: []
            },
            
            // 구독 메타데이터 추가
            subscription_info: {
              subscribed: isSubscribed,
              subscription_required: subscriptionRequired,
              tier: subscriptionTier,
              user_id: userId
            }
          }
        };

        // 구독되지 않은 서비스는 설명에 안내 추가
        if (!isSubscribed && includeUnsubscribed) {
          toolDefinition.function.description += ' [구독 필요]';
          toolDefinition.function.subscription_info.message = '이 기능을 사용하려면 구독이 필요합니다.';
        }

        aiServices.push(toolDefinition);

        this.logger.success(`[${userId}] ${name}: ${isSubscribed ? `구독됨(${subscriptionTier})` : '구독 필요'}`, '✅');
      }

      // 캐시에 저장
      this.cacheManager.set(cacheKey, aiServices);

      this.logger.success(`[${userId}] 서비스 목록 생성 완료: ${aiServices.length}개 (구독: ${aiServices.filter(s => s.function.subscription_info.subscribed).length}개)`, '📦');

      return aiServices;

    } catch (error) {
      this.logger.error('getServicesForAI 실패', error, '❌');
      // 실패 시 기본 서비스 목록 반환
      return this.getAllServicesForAI();
    }
  }

  /**
   * 기존 방식: 모든 서비스 반환 (구독 체크 없음)
   */
  getAllServicesForAI() {
    const aiServices = [];

    for (const [name, service] of this.services) {
      if (service.available !== false) {
        aiServices.push({
          type: 'function',
          function: {
            name: service.name,
            description: service.description,
            parameters: service.parameters || {
              type: 'object',
              properties: {},
              required: []
            }
          }
        });
      }
    }

    return aiServices;
  }

  /**
   * 사용자 캐시 무효화
   */
  invalidateUserCache(userId) {
    const pattern = `${userId}:`;
    const count = this.cacheManager.invalidate(pattern);
    this.logger.log(`사용자 캐시 무효화: ${userId} (${count}개)`, '🗑️');
  }

  /**
   * 서비스 가져오기
   */
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  /**
   * 사용 가능한 서비스 목록
   */
  getAvailableServices() {
    return Array.from(this.services.values()).map(service => ({
      name: service.name,
      description: service.description,
      available: service.available !== false,
      category: service.category || 'general'
    }));
  }

  /**
   * MCP 커넥터 반환 (서비스들이 사용할 수 있도록)
   */
  getMCPConnector() {
    return this.mcpConnector;
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    return await this.lifecycleManager.cleanup(async () => {
      // 모든 서비스들 정리
      for (const [name, service] of this.services) {
        if (typeof service.cleanup === 'function') {
          await service.cleanup();
        }
      }

      this.services.clear();
      this.logger.success('정리 완료', '✅');
    });
  }
}