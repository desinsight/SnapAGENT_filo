/**
 * 구독 관리 시스템
 * 사용자별 서비스 구독 상태 관리, 권한 체크, 사용량 추적
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SubscriptionService {
  constructor() {
    // 구독 데이터 저장 경로
    this.dataDir = path.resolve(__dirname, '../../../data');
    this.subscriptionsFile = path.join(this.dataDir, 'subscriptions.json');
    this.usageFile = path.join(this.dataDir, 'usage-tracking.json');
    
    // 메모리 캐시
    this.subscriptionsCache = new Map();
    this.usageCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분
    this.lastCacheUpdate = 0;
    
    // 서비스 정의
    this.serviceDefinitions = {
      filesystem: {
        name: 'filesystem',
        displayName: '파일 시스템',
        description: '파일 탐색, 검색, 관리 기능',
        tiers: {
          free: {
            name: 'Free',
            price: 0,
            limits: {
              dailyRequests: 50,
              advancedFeatures: false,
              supportLevel: 'community'
            }
          },
          basic: {
            name: 'Basic',
            price: 9.99,
            limits: {
              dailyRequests: 500,
              advancedFeatures: true,
              supportLevel: 'email'
            }
          },
          premium: {
            name: 'Premium',
            price: 19.99,
            limits: {
              dailyRequests: -1, // unlimited
              advancedFeatures: true,
              supportLevel: 'priority'
            }
          }
        },
        defaultTier: 'free'
      },
      calendar: {
        name: 'calendar',
        displayName: '캘린더',
        description: '일정 관리 및 스케줄링',
        tiers: {
          free: {
            name: 'Free',
            price: 0,
            limits: {
              dailyRequests: 20,
              advancedFeatures: false
            }
          },
          premium: {
            name: 'Premium',
            price: 14.99,
            limits: {
              dailyRequests: -1,
              advancedFeatures: true
            }
          }
        },
        defaultTier: 'free'
      },
      contacts: {
        name: 'contacts',
        displayName: '연락처',
        description: '연락처 관리 및 조직화',
        tiers: {
          free: {
            name: 'Free',
            price: 0,
            limits: {
              dailyRequests: 30,
              advancedFeatures: false
            }
          },
          premium: {
            name: 'Premium',
            price: 12.99,
            limits: {
              dailyRequests: -1,
              advancedFeatures: true
            }
          }
        },
        defaultTier: 'free'
      },
      messenger: {
        name: 'messenger',
        displayName: '메신저',
        description: '메시지 관리 및 자동화',
        tiers: {
          premium: {
            name: 'Premium',
            price: 24.99,
            limits: {
              dailyRequests: -1,
              advancedFeatures: true
            }
          }
        },
        defaultTier: null // 프리미엄 전용
      },
      notes: {
        name: 'notes',
        displayName: '노트',
        description: '노트 작성 및 관리',
        tiers: {
          free: {
            name: 'Free',
            price: 0,
            limits: {
              dailyRequests: 40,
              advancedFeatures: false
            }
          },
          basic: {
            name: 'Basic',
            price: 7.99,
            limits: {
              dailyRequests: 200,
              advancedFeatures: true
            }
          }
        },
        defaultTier: 'free'
      },
      tasks: {
        name: 'tasks',
        displayName: '작업 관리',
        description: '할 일 및 프로젝트 관리',
        tiers: {
          free: {
            name: 'Free',
            price: 0,
            limits: {
              dailyRequests: 25,
              advancedFeatures: false
            }
          },
          premium: {
            name: 'Premium',
            price: 16.99,
            limits: {
              dailyRequests: -1,
              advancedFeatures: true
            }
          }
        },
        defaultTier: 'free'
      }
    };
    
    // 🧪 개발용 설정
    this.subscriptionMode = process.env.SUBSCRIPTION_MODE || 'production';
    this.bypassSubscription = process.env.BYPASS_SUBSCRIPTION === 'true';
    this.defaultDevTier = process.env.DEFAULT_DEV_TIER || 'premium';
    
    // 초기화
    this.initialized = this.initialize();
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      console.log('🏢 SubscriptionService 초기화 시작...');
      
      // 데이터 디렉토리 생성
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 초기 데이터 파일 생성
      await this.ensureDataFiles();
      
      // 캐시 로드
      await this.loadCache();
      
      console.log('✅ SubscriptionService 초기화 완료');
      console.log(`📦 등록된 서비스: ${Object.keys(this.serviceDefinitions).length}개`);
      
      // 🧪 개발 모드 로그
      if (this.subscriptionMode === 'development') {
        console.log('🧪 개발 모드 활성화됨');
        console.log(`   - 구독 우회: ${this.bypassSubscription ? 'ON' : 'OFF'}`);
        console.log(`   - 기본 등급: ${this.defaultDevTier}`);
        
        if (this.bypassSubscription) {
          console.log('⚠️ 경고: 모든 사용자가 프리미엄 서비스를 사용할 수 있습니다.');
        }
      }
      
    } catch (error) {
      console.error('❌ SubscriptionService 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터 파일 초기화
   */
  async ensureDataFiles() {
    try {
      // 구독 데이터 파일
      try {
        await fs.access(this.subscriptionsFile);
      } catch {
        const initialSubscriptions = {
          users: {},
          lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(this.subscriptionsFile, JSON.stringify(initialSubscriptions, null, 2));
        console.log('📄 구독 데이터 파일 생성됨');
      }
      
      // 사용량 추적 파일
      try {
        await fs.access(this.usageFile);
      } catch {
        const initialUsage = {
          daily: {},
          monthly: {},
          lastReset: new Date().toISOString()
        };
        await fs.writeFile(this.usageFile, JSON.stringify(initialUsage, null, 2));
        console.log('📊 사용량 추적 파일 생성됨');
      }
      
    } catch (error) {
      console.error('❌ 데이터 파일 초기화 실패:', error);
    }
  }

  /**
   * 캐시 로드
   */
  async loadCache() {
    await this.initialized;
    try {
      // 구독 데이터 로드
      const subscriptionData = await fs.readFile(this.subscriptionsFile, 'utf-8');
      const subscriptions = JSON.parse(subscriptionData);
      
      this.subscriptionsCache.clear();
      for (const [userId, userSubs] of Object.entries(subscriptions.users || {})) {
        this.subscriptionsCache.set(userId, userSubs);
      }
      
      // 사용량 데이터 로드
      const usageData = await fs.readFile(this.usageFile, 'utf-8');
      const usage = JSON.parse(usageData);
      
      this.usageCache.clear();
      for (const [key, value] of Object.entries(usage.daily || {})) {
        this.usageCache.set(key, value);
      }
      
      this.lastCacheUpdate = Date.now();
      console.log('🔄 구독 캐시 로드 완료');
      
    } catch (error) {
      console.error('❌ 캐시 로드 실패:', error);
    }
  }

  /**
   * 캐시 새로고침 (만료 시)
   */
  async refreshCacheIfNeeded() {
    await this.initialized;
    if (Date.now() - this.lastCacheUpdate > this.cacheExpiry) {
      await this.loadCache();
    }
  }

  /**
   * 사용자 구독 상태 확인
   */
  async checkUserSubscription(userId, serviceName) {
    await this.initialized;
    try {
      await this.refreshCacheIfNeeded();
      
      // 🧪 개발 모드: 구독 우회
      if (this.bypassSubscription) {
        console.log(`🧪 [DEV] ${userId} - ${serviceName}: 구독 우회 (${this.defaultDevTier})`);
        return true;
      }
      
      // 서비스 정의 확인
      const service = this.serviceDefinitions[serviceName];
      if (!service) {
        console.warn(`⚠️ 알 수 없는 서비스: ${serviceName}`);
        return false;
      }
      
      // 사용자 구독 정보 가져오기
      const userSubscriptions = this.subscriptionsCache.get(userId) || {};
      const subscription = userSubscriptions[serviceName];
      
      // 구독이 없으면 기본 등급 확인
      if (!subscription) {
        const hasDefaultTier = service.defaultTier !== null;
        console.log(`🔍 [${userId}] ${serviceName}: 구독 없음, 기본 등급: ${hasDefaultTier ? service.defaultTier : 'none'}`);
        return hasDefaultTier;
      }
      
      // 구독 유효성 확인
      const isActive = subscription.status === 'active';
      const isNotExpired = !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
      
      const isValid = isActive && isNotExpired;
      console.log(`🔍 [${userId}] ${serviceName}: ${subscription.tier} - ${isValid ? 'valid' : 'invalid'}`);
      
      return isValid;
      
    } catch (error) {
      console.error('❌ 구독 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 사용자 구독 등급 가져오기
   */
  async getUserSubscriptionTier(userId, serviceName) {
    await this.initialized;
    try {
      await this.refreshCacheIfNeeded();
      
      // 🧪 개발 모드: 기본 등급 반환
      if (this.bypassSubscription) {
        return this.defaultDevTier;
      }
      
      const service = this.serviceDefinitions[serviceName];
      if (!service) return null;
      
      const userSubscriptions = this.subscriptionsCache.get(userId) || {};
      const subscription = userSubscriptions[serviceName];
      
      // 구독이 있고 유효한 경우
      if (subscription && subscription.status === 'active') {
        const isNotExpired = !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
        if (isNotExpired) {
          return subscription.tier;
        }
      }
      
      // 기본 등급 반환
      return service.defaultTier;
      
    } catch (error) {
      console.error('❌ 구독 등급 조회 실패:', error);
      return null;
    }
  }

  /**
   * 구독 요구 메시지 생성
   */
  async getSubscriptionRequiredMessage(serviceName, userId = null) {
    await this.initialized;
    try {
      const service = this.serviceDefinitions[serviceName];
      if (!service) {
        return {
          error: "service_not_found",
          message: `서비스 '${serviceName}'를 찾을 수 없습니다.`
        };
      }
      
      // 현재 사용자의 등급 확인
      const currentTier = userId ? await this.getUserSubscriptionTier(userId, serviceName) : null;
      
      // 이용 가능한 등급들
      const availableTiers = Object.entries(service.tiers).map(([tierName, tierInfo]) => ({
        name: tierName,
        displayName: tierInfo.name,
        price: tierInfo.price,
        limits: tierInfo.limits
      }));
      
      // 무료 체험 가능 여부
      const hasFreeOption = service.defaultTier !== null;
      const trialAvailable = userId ? await this.hasTrialAvailable(userId, serviceName) : false;

      // 혜택 요약 생성
      const tierBenefits = availableTiers.map(tier => {
        let benefit = `- ${tier.displayName} (${tier.price === 0 ? '무료' : `${tier.price}원/월`})`;
        if (tier.limits.advancedFeatures) benefit += ' | 고급 기능 제공';
        if (tier.limits.dailyRequests === -1) benefit += ' | 무제한 사용';
        else benefit += ` | 일일 ${tier.limits.dailyRequests}회 사용 가능`;
        if (tier.limits.supportLevel) benefit += ` | 지원: ${tier.limits.supportLevel}`;
        return benefit;
      }).join('\n');

      // 안내 메시지 개선
      let message = `\uD83D\uDE22 아쉽게도 현재 [${service.displayName}] 서비스는 구독이 필요합니다.\n`;
      message += `\uD83D\uDCB0 구독하시면 아래와 같은 혜택을 모두 이용하실 수 있습니다!\n`;
      message += `${tierBenefits}\n`;
      if (trialAvailable) {
        message += `\uD83C\uDF89 신규 가입자라면 무료 체험이 가능합니다!\n`;
      }
      message += `\uD83D\uDCB3 구독 및 결제 안내: [여기서 구독하기](/subscribe/${serviceName})\n`;
      message += `\uD83D\uDCCB 자세한 요금제 안내: [요금제 보기](/pricing/${serviceName})\n`;
      message += `\u2753 궁금한 점이 있다면 언제든 고객센터로 문의해 주세요.`;

      return {
        error: "subscription_required",
        message,
        service: {
          name: serviceName,
          displayName: service.displayName,
          description: service.description,
          currentTier: currentTier
        },
        subscription: {
          available_tiers: availableTiers,
          has_free_option: hasFreeOption,
          trial_available: trialAvailable,
          subscription_url: `/subscribe/${serviceName}`,
          pricing_url: `/pricing/${serviceName}`
        },
        user: {
          id: userId,
          current_tier: currentTier
        }
      };
      
    } catch (error) {
      console.error('❌ 구독 메시지 생성 실패:', error);
      return {
        error: "internal_error",
        message: "구독 정보를 가져오는 중 오류가 발생했습니다."
      };
    }
  }

  /**
   * 무료 체험 가능 여부 확인
   */
  async hasTrialAvailable(userId, serviceName) {
    await this.initialized;
    try {
      const userSubscriptions = this.subscriptionsCache.get(userId) || {};
      const subscription = userSubscriptions[serviceName];
      
      // 이전에 구독한 적이 없으면 체험 가능
      if (!subscription) return true;
      
      // 체험 사용 이력 확인
      return !subscription.trialUsed;
      
    } catch (error) {
      console.error('❌ 체험 가능 여부 확인 실패:', error);
      return false;
    }
  }

  /**
   * 일일 사용량 확인
   */
  async checkDailyUsageLimit(userId, serviceName) {
    await this.initialized;
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageKey = `${userId}:${serviceName}:${today}`;
      
      const currentUsage = this.usageCache.get(usageKey) || 0;
      const tier = await this.getUserSubscriptionTier(userId, serviceName);
      
      if (!tier) return { allowed: false, reason: 'no_subscription' };
      
      const service = this.serviceDefinitions[serviceName];
      const tierInfo = service?.tiers[tier];
      
      if (!tierInfo) return { allowed: false, reason: 'invalid_tier' };
      
      const dailyLimit = tierInfo.limits.dailyRequests;
      
      // 무제한인 경우
      if (dailyLimit === -1) {
        return { allowed: true, unlimited: true };
      }
      
      // 제한 확인
      const allowed = currentUsage < dailyLimit;
      
      return {
        allowed,
        currentUsage,
        dailyLimit,
        remaining: Math.max(0, dailyLimit - currentUsage)
      };
      
    } catch (error) {
      console.error('❌ 사용량 제한 확인 실패:', error);
      return { allowed: false, reason: 'error' };
    }
  }

  /**
   * 사용량 기록
   */
  async recordUsage(userId, serviceName) {
    await this.initialized;
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageKey = `${userId}:${serviceName}:${today}`;
      
      const currentUsage = this.usageCache.get(usageKey) || 0;
      this.usageCache.set(usageKey, currentUsage + 1);
      
      // 주기적으로 파일에 저장 (매 10번째 호출마다)
      if (Math.random() < 0.1) {
        await this.saveUsageToFile();
      }
      
    } catch (error) {
      console.error('❌ 사용량 기록 실패:', error);
    }
  }

  /**
   * 사용량 파일 저장
   */
  async saveUsageToFile() {
    await this.initialized;
    try {
      const usageData = await fs.readFile(this.usageFile, 'utf-8');
      const usage = JSON.parse(usageData);
      
      // 캐시 데이터를 파일에 병합
      for (const [key, value] of this.usageCache) {
        usage.daily[key] = value;
      }
      
      usage.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.usageFile, JSON.stringify(usage, null, 2));
      
    } catch (error) {
      console.error('❌ 사용량 파일 저장 실패:', error);
    }
  }

  /**
   * 모든 서비스 목록 가져오기
   */
  getAllServices() {
    return Object.entries(this.serviceDefinitions).map(([name, service]) => ({
      name,
      displayName: service.displayName,
      description: service.description,
      tiers: Object.entries(service.tiers).map(([tierName, tierInfo]) => ({
        name: tierName,
        displayName: tierInfo.name,
        price: tierInfo.price
      })),
      defaultTier: service.defaultTier,
      hasFreeOption: service.defaultTier !== null
    }));
  }

  /**
   * 테스트용 구독 추가 (개발용)
   */
  async addTestSubscription(userId, serviceName, tier = 'premium', duration = 30) {
    await this.initialized;
    try {
      const userSubscriptions = this.subscriptionsCache.get(userId) || {};
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);
      
      userSubscriptions[serviceName] = {
        tier,
        status: 'active',
        startedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        trialUsed: false
      };
      
      this.subscriptionsCache.set(userId, userSubscriptions);
      
      // 파일에 저장
      await this.saveSubscriptionsToFile();
      
      console.log(`🧪 [TEST] ${userId}에게 ${serviceName} ${tier} 구독 추가 (${duration}일)`);
      
      return true;
      
    } catch (error) {
      console.error('❌ 테스트 구독 추가 실패:', error);
      return false;
    }
  }

  /**
   * 구독 데이터 파일 저장
   */
  async saveSubscriptionsToFile() {
    await this.initialized;
    try {
      const subscriptionData = {
        users: Object.fromEntries(this.subscriptionsCache),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.subscriptionsFile, JSON.stringify(subscriptionData, null, 2));
      
    } catch (error) {
      console.error('❌ 구독 데이터 저장 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
let subscriptionServiceInstance = null;

export const getSubscriptionService = async () => {
  if (!subscriptionServiceInstance) {
    subscriptionServiceInstance = new SubscriptionService();
    await subscriptionServiceInstance.initialized;
  }
  return subscriptionServiceInstance;
};

export default SubscriptionService;