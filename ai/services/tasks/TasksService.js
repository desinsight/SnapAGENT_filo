/**
 * TasksService.js
 * 작업 관리 서비스의 메인 진입점
 * 할 일 관리, 프로젝트 추적, 우선순위 설정 등을 처리
 * 
 * 구독 등급별 제한:
 * - free: 작업 조회, 기본 목록 보기만 가능 (일일 제한 10회, 최대 20개 작업)
 * - basic: 작업 생성, 수정, 완료 표시 (일일 제한 50회, 최대 100개 작업)
 * - premium: 모든 기능, 프로젝트 관리, 팀 작업, 고급 분석 (무제한)
 */

export class TasksService {
  constructor() {
    // AI Function Calling을 위한 서비스 정의
    this.name = 'tasks';
    this.description = '할 일과 작업을 관리합니다. 작업 생성, 우선순위 설정, 진행 상황 추적 등이 가능합니다.';
    this.category = 'productivity';
    this.available = true;

    // 구독 등급별 제한 설정
    this.subscriptionLimits = {
      free: {
        dailyLimit: 10,
        maxTasks: 20,
        features: ['list_tasks', 'search_tasks'],
        restrictions: {
          projectManagement: false,
          teamCollaboration: false,
          advancedAnalytics: false,
          priorityFiltering: false,
          customTags: false
        }
      },
      basic: {
        dailyLimit: 50,
        maxTasks: 100,
        features: ['create_task', 'list_tasks', 'update_task', 'complete_task', 'search_tasks'],
        restrictions: {
          projectManagement: true,
          teamCollaboration: false,
          advancedAnalytics: false,
          priorityFiltering: true,
          customTags: true
        }
      },
      premium: {
        dailyLimit: Infinity,
        maxTasks: Infinity,
        features: ['create_task', 'list_tasks', 'update_task', 'complete_task', 'delete_task', 'search_tasks', 'analytics', 'team_management'],
        restrictions: {
          projectManagement: true,
          teamCollaboration: true,
          advancedAnalytics: true,
          priorityFiltering: true,
          customTags: true
        }
      }
    };

    // 사용량 추적 (실제로는 데이터베이스에 저장)
    this.usageTracking = new Map();

    // AI에게 제공할 파라미터 정의
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_task', 'list_tasks', 'update_task', 'complete_task', 'delete_task', 'search_tasks'],
          description: '수행할 작업: create_task(작업 생성), list_tasks(작업 목록), update_task(작업 수정), complete_task(작업 완료), delete_task(작업 삭제), search_tasks(작업 검색)'
        },
        title: {
          type: 'string',
          description: '작업 제목'
        },
        description: {
          type: 'string',
          description: '작업 설명'
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: '우선순위 (high, medium, low)'
        },
        dueDate: {
          type: 'string',
          description: '마감일 (예: 2024-12-25, 내일, 다음주)'
        },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'completed', 'cancelled'],
          description: '상태 (todo, in_progress, completed, cancelled)'
        },
        project: {
          type: 'string',
          description: '프로젝트명'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '태그 목록'
        },
        taskId: {
          type: 'string',
          description: '작업 ID'
        },
        query: {
          type: 'string',
          description: '검색어'
        }
      },
      required: ['action']
    };

    // 임시 작업 데이터 (개발용)
    this.mockTasks = [
      {
        id: 'task_1',
        title: 'AI 서비스 통합 완료',
        description: '모든 서비스를 AIOrchestrator에 연결',
        priority: 'high',
        status: 'in_progress',
        project: 'AI Assistant',
        tags: ['개발', '긴급'],
        dueDate: '2024-12-25',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_2',
        title: '주간 보고서 작성',
        description: '이번 주 진행 상황 정리',
        priority: 'medium',
        status: 'todo',
        project: '업무',
        tags: ['보고서'],
        dueDate: '2024-12-22',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  }

  async initialize() {
    try {
      console.log('✔️ TasksService 초기화...');
      
      // TODO: 실제 작업 관리 시스템 연결
      // TODO: 권한 확인
      
      console.log('✅ TasksService 초기화 완료');

    } catch (error) {
      console.error('❌ TasksService 초기화 실패:', error);
      this.available = false;
    }
  }

  /**
   * Tool 메타데이터 반환
   */
  getToolMetadata() {
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      available: this.available,
      version: '1.0.0',
      author: 'Humanscape',
      subscription: {
        required: true,
        minimumTier: 'free',
        tierBenefits: {
          free: {
            actions: ['list_tasks', 'search_tasks'],
            limits: {
              daily: 10,
              maxTasks: 20
            }
          },
          basic: {
            actions: ['create_task', 'list_tasks', 'update_task', 'complete_task', 'search_tasks'],
            limits: {
              daily: 50,
              maxTasks: 100
            }
          },
          premium: {
            actions: ['all'],
            limits: {
              daily: 'unlimited',
              maxTasks: 'unlimited'
            }
          }
        }
      },
      parameters: this.parameters
    };
  }

  /**
   * 구독 접근 권한 확인
   */
  checkSubscriptionAccess(action, subscriptionTier = 'free') {
    const tierLimits = this.subscriptionLimits[subscriptionTier];
    
    if (!tierLimits) {
      return {
        allowed: false,
        reason: 'invalid_subscription_tier',
        message: '유효하지 않은 구독 등급입니다.'
      };
    }

    if (!tierLimits.features.includes(action)) {
      return {
        allowed: false,
        reason: 'feature_not_available',
        message: `'${action}' 기능은 ${subscriptionTier} 등급에서 사용할 수 없습니다.`,
        requiredTier: this.getRequiredTier(action),
        upgradeBenefits: this.getUpgradeBenefits(subscriptionTier, action)
      };
    }

    return { allowed: true };
  }

  /**
   * 사용량 제한 확인
   */
  checkUsageLimit(userId, subscriptionTier = 'free') {
    const tierLimits = this.subscriptionLimits[subscriptionTier];
    const userUsage = this.getUserUsage(userId);
    const today = new Date().toDateString();

    // 일일 사용량 확인
    const dailyUsage = userUsage.daily[today] || 0;
    if (dailyUsage >= tierLimits.dailyLimit) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        message: `일일 사용 한도(${tierLimits.dailyLimit}회)를 초과했습니다.`,
        resetTime: this.getNextResetTime(),
        currentUsage: dailyUsage,
        limit: tierLimits.dailyLimit
      };
    }

    // 최대 작업 수 확인
    const totalTasks = this.mockTasks.filter(task => task.userId === userId).length;
    if (totalTasks >= tierLimits.maxTasks) {
      return {
        allowed: false,
        reason: 'max_tasks_exceeded',
        message: `최대 작업 수(${tierLimits.maxTasks}개)를 초과했습니다.`,
        currentTasks: totalTasks,
        limit: tierLimits.maxTasks
      };
    }

    return { allowed: true };
  }

  /**
   * 사용자 사용량 가져오기
   */
  getUserUsage(userId) {
    if (!this.usageTracking.has(userId)) {
      this.usageTracking.set(userId, {
        daily: {},
        total: 0
      });
    }
    return this.usageTracking.get(userId);
  }

  /**
   * 사용량 기록
   */
  recordUsage(userId) {
    const usage = this.getUserUsage(userId);
    const today = new Date().toDateString();
    
    usage.daily[today] = (usage.daily[today] || 0) + 1;
    usage.total += 1;
  }

  /**
   * 필요한 구독 등급 확인
   */
  getRequiredTier(action) {
    for (const [tier, limits] of Object.entries(this.subscriptionLimits)) {
      if (limits.features.includes(action)) {
        return tier;
      }
    }
    return 'premium';
  }

  /**
   * 업그레이드 혜택 정보
   */
  getUpgradeBenefits(currentTier, requestedAction) {
    const benefits = {
      free_to_basic: {
        features: [
          '작업 생성 및 수정 기능',
          '일일 50회 사용 가능',
          '최대 100개 작업 관리',
          '프로젝트별 분류',
          '커스텀 태그 지원'
        ],
        price: '$9.99/월'
      },
      basic_to_premium: {
        features: [
          '무제한 작업 관리',
          '팀 협업 기능',
          '고급 분석 및 리포트',
          '작업 삭제 권한',
          'API 접근 권한'
        ],
        price: '$29.99/월'
      }
    };

    if (currentTier === 'free') {
      return benefits.free_to_basic;
    } else if (currentTier === 'basic') {
      return benefits.basic_to_premium;
    }
    return null;
  }

  /**
   * 다음 리셋 시간 계산
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const hoursLeft = Math.floor((tomorrow - now) / (1000 * 60 * 60));
    const minutesLeft = Math.floor(((tomorrow - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      timestamp: tomorrow.toISOString(),
      hoursLeft,
      minutesLeft,
      formatted: `${hoursLeft}시간 ${minutesLeft}분 후`
    };
  }

  /**
   * JSON 응답 포맷팅
   */
  formatJsonResponse(data) {
    // formatted 필드 제거하고 구조화된 JSON 반환
    const { formatted, ...jsonData } = data;
    return jsonData;
  }

  /**
   * 서비스 실행 메인 함수 - AI가 호출
   */
  async execute(args, context = {}) {
    try {
      console.log(`✔️ TasksService 실행: ${args.action}`, args);

      // 구독 등급 확인 (context에서 가져오거나 기본값 사용)
      const subscriptionTier = context.subscriptionTier || 'free';
      const userId = context.userId || 'anonymous';

      // 1. 구독 접근 권한 확인
      const accessCheck = this.checkSubscriptionAccess(args.action, subscriptionTier);
      if (!accessCheck.allowed) {
        return this.formatJsonResponse({
          success: false,
          error: accessCheck
        });
      }

      // 2. 사용량 제한 확인
      const usageCheck = this.checkUsageLimit(userId, subscriptionTier);
      if (!usageCheck.allowed) {
        return this.formatJsonResponse({
          success: false,
          error: usageCheck
        });
      }

      // 3. 사용량 기록
      this.recordUsage(userId);

      // 4. 액션 실행
      let result;
      switch (args.action) {
        case 'create_task':
          result = await this.createTask(args, context);
          break;
        
        case 'list_tasks':
          result = await this.listTasks(args, context);
          break;
        
        case 'update_task':
          result = await this.updateTask(args, context);
          break;
        
        case 'complete_task':
          result = await this.completeTask(args, context);
          break;
        
        case 'delete_task':
          result = await this.deleteTask(args, context);
          break;
        
        case 'search_tasks':
          result = await this.searchTasks(args, context);
          break;
        
        default:
          throw new Error(`지원하지 않는 작업: ${args.action}`);
      }

      // 5. JSON 형식으로 반환
      return this.formatJsonResponse({
        ...result,
        subscription: {
          tier: subscriptionTier,
          usage: {
            daily: this.getUserUsage(userId).daily[new Date().toDateString()] || 0,
            limit: this.subscriptionLimits[subscriptionTier].dailyLimit
          }
        }
      });

    } catch (error) {
      console.error('❌ TasksService 실행 실패:', error);
      return this.formatJsonResponse({
        success: false,
        error: {
          reason: 'execution_error',
          message: error.message
        },
        action: args.action
      });
    }
  }

  /**
   * 작업 생성
   */
  async createTask(args, context) {
    const { title, description, priority, dueDate, project, tags } = args;
    const subscriptionTier = context.subscriptionTier || 'free';

    if (!title) {
      throw new Error('작업 제목이 필요합니다');
    }

    // 구독 등급별 제한 확인
    const tierLimits = this.subscriptionLimits[subscriptionTier];
    
    // 프로젝트 관리 권한 확인
    if (project && project !== '일반' && !tierLimits.restrictions.projectManagement) {
      throw new Error('프로젝트 관리는 Basic 이상 등급에서 사용 가능합니다');
    }

    // 커스텀 태그 권한 확인
    if (tags && tags.length > 0 && !tierLimits.restrictions.customTags) {
      throw new Error('커스텀 태그는 Basic 이상 등급에서 사용 가능합니다');
    }

    console.log(`➕ 작업 생성: ${title}`);

    // 마감일 파싱
    const parsedDueDate = dueDate ? this.parseDate(dueDate) : null;

    // TODO: 실제 작업 생성 구현
    const newTask = {
      id: `task_${Date.now()}`,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'todo',
      project: project || '일반',
      tags: tags || [],
      dueDate: parsedDueDate,
      userId: context.userId || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockTasks.push(newTask);

    return {
      success: true,
      action: 'create_task',
      task: newTask
    };
  }

  /**
   * 작업 목록
   */
  async listTasks(args, context) {
    const { status, project, priority } = args;
    const subscriptionTier = context.subscriptionTier || 'free';
    const userId = context.userId || 'anonymous';

    console.log('📋 작업 목록 조회');

    // 사용자의 작업만 필터링
    let tasks = this.mockTasks.filter(t => t.userId === userId);

    // 구독 등급별 제한
    const tierLimits = this.subscriptionLimits[subscriptionTier];
    
    // Free 등급은 우선순위 필터링 불가
    if (priority && !tierLimits.restrictions.priorityFiltering) {
      return {
        success: false,
        action: 'list_tasks',
        error: {
          reason: 'feature_restricted',
          message: '우선순위 필터링은 Basic 이상 등급에서 사용 가능합니다'
        }
      };
    }

    // 상태 필터링
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    // 프로젝트 필터링
    if (project) {
      tasks = tasks.filter(t => t.project === project);
    }

    // 우선순위 필터링
    if (priority && tierLimits.restrictions.priorityFiltering) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    // 우선순위와 마감일 기준 정렬
    tasks.sort((a, b) => {
      // 우선순위 정렬
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 마감일 정렬
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a.dueDate ? -1 : 1;
    });

    // Free 등급은 최대 20개까지만 표시
    if (subscriptionTier === 'free' && tasks.length > 20) {
      tasks = tasks.slice(0, 20);
    }

    return {
      success: true,
      action: 'list_tasks',
      tasks: tasks,
      count: tasks.length,
      filters: { status, project, priority }
    };
  }

  /**
   * 작업 검색
   */
  async searchTasks(args, context) {
    const { query } = args;
    const userId = context.userId || 'anonymous';

    if (!query) {
      throw new Error('검색어가 필요합니다');
    }

    console.log(`🔍 작업 검색: "${query}"`);

    const results = this.mockTasks.filter(task =>
      task.userId === userId && (
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase()) ||
        task.project.toLowerCase().includes(query.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    );

    return {
      success: true,
      action: 'search_tasks',
      query: query,
      results: results,
      count: results.length
    };
  }

  /**
   * 작업 수정
   */
  async updateTask(args, context) {
    const { taskId, title, description, priority, dueDate, status, project, tags } = args;
    const userId = context.userId || 'anonymous';

    if (!taskId) {
      throw new Error('작업 ID가 필요합니다');
    }

    const taskIndex = this.mockTasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      throw new Error('작업을 찾을 수 없습니다');
    }

    console.log(`✏️ 작업 수정: ${taskId}`);

    // 작업 업데이트
    const task = this.mockTasks[taskIndex];
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = this.parseDate(dueDate);
    if (status !== undefined) task.status = status;
    if (project !== undefined) task.project = project;
    if (tags !== undefined) task.tags = tags;
    task.updatedAt = new Date().toISOString();

    return {
      success: true,
      action: 'update_task',
      taskId: taskId,
      task: task
    };
  }

  /**
   * 작업 완료
   */
  async completeTask(args, context) {
    const { taskId } = args;
    const userId = context.userId || 'anonymous';

    if (!taskId) {
      throw new Error('작업 ID가 필요합니다');
    }

    const taskIndex = this.mockTasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      throw new Error('작업을 찾을 수 없습니다');
    }

    console.log(`✅ 작업 완료: ${taskId}`);

    const task = this.mockTasks[taskIndex];
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    return {
      success: true,
      action: 'complete_task',
      taskId: taskId,
      task: task
    };
  }

  /**
   * 작업 삭제
   */
  async deleteTask(args, context) {
    const { taskId } = args;
    const userId = context.userId || 'anonymous';

    if (!taskId) {
      throw new Error('작업 ID가 필요합니다');
    }

    const taskIndex = this.mockTasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      throw new Error('작업을 찾을 수 없습니다');
    }

    console.log(`🗑️ 작업 삭제: ${taskId}`);

    const deletedTask = this.mockTasks.splice(taskIndex, 1)[0];

    return {
      success: true,
      action: 'delete_task',
      taskId: taskId,
      deletedTask: deletedTask
    };
  }

  /**
   * 날짜 파싱 (자연어 처리)
   */
  parseDate(dateStr) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    return null;
  }

  /**
   * 마감일까지 남은 일수 계산
   */
  getDaysUntilDue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      name: this.name,
      available: this.available,
      description: this.description,
      taskCount: this.mockTasks.length,
      stats: {
        todo: this.mockTasks.filter(t => t.status === 'todo').length,
        in_progress: this.mockTasks.filter(t => t.status === 'in_progress').length,
        completed: this.mockTasks.filter(t => t.status === 'completed').length
      },
      subscription: {
        tiers: Object.keys(this.subscriptionLimits),
        features: this.subscriptionLimits
      }
    };
  }

  /**
   * 정리 작업
   */
  async cleanup() {
    try {
      console.log('✔️ TasksService 정리 중...');
      console.log('✅ TasksService 정리 완료');

    } catch (error) {
      console.error('❌ TasksService 정리 실패:', error);
    }
  }
}