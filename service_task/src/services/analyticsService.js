/**
 * Analytics Service - 분석 서비스
 * 
 * @description
 * - 사용자 활동 분석
 * - 프로젝트 성과 분석
 * - 태스크 통계 및 인사이트
 * - 생산성 지표 계산
 * - 실시간 대시보드 데이터
 * - 예측 분석 및 추천
 * - 보고서 생성
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
    this.userAnalytics = new Map();
    this.globalStats = null;
    this.lastUpdate = null;
    
    this.initializeService();
  }

  /**
   * 서비스 초기화
   */
  async initializeService() {
    try {
      logger.info('📊 AnalyticsService 초기화...');
      
      // 데이터베이스 연결 확인
      if (!process.env.MONGODB_URI) {
        logger.warn('📊 데이터베이스 연결 없음 - AnalyticsService 기능 제한됨');
        return;
      }
      
      // 전역 통계 초기 로드
      await this.updateGlobalStatistics();
      
      // 캐시 정리 스케줄러 시작
      this.startCacheCleanup();
      
      logger.info('✅ AnalyticsService 초기화 완료');
      
    } catch (error) {
      logger.error('❌ AnalyticsService 초기화 실패:', error);
    }
  }

  /**
   * 캐시 정리 스케줄러
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
      logger.debug('🧹 분석 캐시 정리 완료');
    }, 10 * 60 * 1000); // 10분마다
  }

  /**
   * 전역 통계 업데이트
   */
  async updateGlobalStatistics() {
    try {
      // 데이터베이스 연결 확인
      if (!process.env.MONGODB_URI) {
        logger.debug('📊 데이터베이스 연결 없음 - 통계 업데이트 건너뜀');
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 기본 통계
      const [
        totalUsers,
        totalTasks,
        totalProjects,
        totalOrganizations,
        completedTasksToday,
        completedTasksWeek,
        completedTasksMonth,
        activeUsersToday,
        activeUsersWeek
      ] = await Promise.all([
        User.countDocuments(),
        Task.countDocuments(),
        Project.countDocuments(),
        Organization.countDocuments(),
        Task.countDocuments({
          status: 'done',
          completedAt: { $gte: startOfDay }
        }),
        Task.countDocuments({
          status: 'done',
          completedAt: { $gte: startOfWeek }
        }),
        Task.countDocuments({
          status: 'done',
          completedAt: { $gte: startOfMonth }
        }),
        User.countDocuments({
          lastActiveAt: { $gte: startOfDay }
        }),
        User.countDocuments({
          lastActiveAt: { $gte: startOfWeek }
        })
      ]);

      // 태스크 상태별 통계
      const taskStatusStats = await Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // 우선순위별 통계
      const priorityStats = await Task.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      // 프로젝트 상태별 통계
      const projectStatusStats = await Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      this.globalStats = {
        timestamp: now,
        overview: {
          totalUsers,
          totalTasks,
          totalProjects,
          totalOrganizations,
          activeUsersToday,
          activeUsersWeek
        },
        productivity: {
          completedTasksToday,
          completedTasksWeek,
          completedTasksMonth,
          completionRate: totalTasks > 0 ? (completedTasksMonth / totalTasks * 100).toFixed(2) : 0
        },
        taskStatus: taskStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        priority: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        projectStatus: projectStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };

      this.lastUpdate = now;
      logger.info('📈 전역 통계 업데이트 완료');

    } catch (error) {
      logger.error('❌ 전역 통계 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 전역 통계 조회
   */
  async getGlobalStatistics() {
    try {
      // 캐시된 통계가 있고 5분 이내라면 캐시 사용
      if (this.globalStats && this.lastUpdate && 
          Date.now() - this.lastUpdate.getTime() < this.cacheTimeout) {
        return this.globalStats;
      }

      // 통계 업데이트
      await this.updateGlobalStatistics();
      return this.globalStats;

    } catch (error) {
      logger.error('❌ 전역 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 활동 분석
   */
  async getUserActivityAnalytics(userId, timeRange = '30d') {
    try {
      const cacheKey = `user_activity_${userId}_${timeRange}`;
      
      // 캐시 확인
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);

      // 태스크 활동
      const taskActivity = await Task.aggregate([
        {
          $match: {
            $or: [
              { assigneeId: userId },
              { createdBy: userId },
              { 'comments.userId': userId }
            ],
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      // 프로젝트 활동
      const projectActivity = await Project.aggregate([
        {
          $match: {
            'members.userId': userId,
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      // 댓글 활동
      const commentActivity = await Task.aggregate([
        {
          $match: {
            'comments.userId': userId,
            'comments.createdAt': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $unwind: '$comments'
        },
        {
          $match: {
            'comments.userId': userId,
            'comments.createdAt': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$comments.createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      const analytics = {
        timeRange,
        taskActivity: this.formatActivityData(taskActivity),
        projectActivity: this.formatActivityData(projectActivity),
        commentActivity: this.formatActivityData(commentActivity),
        summary: {
          totalTasks: taskActivity.reduce((sum, item) => sum + item.count, 0),
          totalProjects: projectActivity.reduce((sum, item) => sum + item.count, 0),
          totalComments: commentActivity.reduce((sum, item) => sum + item.count, 0)
        }
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;

    } catch (error) {
      logger.error('❌ 사용자 활동 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 성과 분석
   */
  async getProjectPerformanceAnalytics(projectId, timeRange = '30d') {
    try {
      const cacheKey = `project_performance_${projectId}_${timeRange}`;
      
      // 캐시 확인
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);

      // 태스크 통계
      const taskStats = await Task.aggregate([
        {
          $match: {
            projectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]},
                  1, 0
                ]
              }
            },
            avgCompletionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'done'] },
                  { $subtract: ['$completedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        }
      ]);

      // 멤버별 성과
      const memberPerformance = await Task.aggregate([
        {
          $match: {
            projectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$assigneeId',
            totalAssigned: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            userName: '$user.name',
            userEmail: '$user.email',
            totalAssigned: 1,
            completed: 1,
            overdue: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completed', '$totalAssigned'] },
                100
              ]
            }
          }
        }
      ]);

      // 일별 진행 상황
      const dailyProgress = await Task.aggregate([
        {
          $match: {
            projectId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      const performance = {
        timeRange,
        projectId,
        taskStats: taskStats[0] || {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          avgCompletionTime: 0
        },
        memberPerformance,
        dailyProgress: this.formatActivityData(dailyProgress),
        metrics: {
          completionRate: taskStats[0] ? 
            (taskStats[0].completedTasks / taskStats[0].totalTasks * 100).toFixed(2) : 0,
          overdueRate: taskStats[0] ? 
            (taskStats[0].overdueTasks / taskStats[0].totalTasks * 100).toFixed(2) : 0,
          avgCompletionTimeDays: taskStats[0] && taskStats[0].avgCompletionTime ? 
            Math.round(taskStats[0].avgCompletionTime / (1000 * 60 * 60 * 24)) : 0
        }
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: performance,
        timestamp: Date.now()
      });

      return performance;

    } catch (error) {
      logger.error('❌ 프로젝트 성과 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 성과 분석
   */
  async getTeamPerformanceAnalytics(teamId, timeRange = '30d') {
    try {
      const cacheKey = `team_performance_${teamId}_${timeRange}`;
      
      // 캐시 확인
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);

      // 팀 프로젝트들 조회
      const teamProjects = await Project.find({
        teamId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('_id');

      const projectIds = teamProjects.map(p => p._id);

      // 팀 태스크 통계
      const teamTaskStats = await Task.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        }
      ]);

      // 팀 멤버별 성과
      const teamMemberStats = await Task.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$assigneeId',
            totalAssigned: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            userName: '$user.name',
            userEmail: '$user.email',
            totalAssigned: 1,
            completed: 1,
            overdue: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completed', '$totalAssigned'] },
                100
              ]
            }
          }
        }
      ]);

      const teamPerformance = {
        timeRange,
        teamId,
        taskStats: teamTaskStats[0] || {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0
        },
        memberStats: teamMemberStats,
        metrics: {
          completionRate: teamTaskStats[0] ? 
            (teamTaskStats[0].completedTasks / teamTaskStats[0].totalTasks * 100).toFixed(2) : 0,
          overdueRate: teamTaskStats[0] ? 
            (teamTaskStats[0].overdueTasks / teamTaskStats[0].totalTasks * 100).toFixed(2) : 0
        }
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: teamPerformance,
        timestamp: Date.now()
      });

      return teamPerformance;

    } catch (error) {
      logger.error('❌ 팀 성과 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 생산성 인사이트 생성
   */
  async generateProductivityInsights(userId, timeRange = '30d') {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);

      // 사용자 태스크 데이터
      const userTasks = await Task.find({
        assigneeId: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: 1 });

      // 시간대별 생산성 분석
      const hourlyProductivity = await Task.aggregate([
        {
          $match: {
            assigneeId: userId,
            status: 'done',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$completedAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // 요일별 생산성 분석
      const dailyProductivity = await Task.aggregate([
        {
          $match: {
            assigneeId: userId,
            status: 'done',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$completedAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // 우선순위별 완료율
      const priorityCompletion = await Task.aggregate([
        {
          $match: {
            assigneeId: userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$priority',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            priority: '$_id',
            total: 1,
            completed: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completed', '$total'] },
                100
              ]
            }
          }
        }
      ]);

      // 평균 완료 시간
      const avgCompletionTime = await Task.aggregate([
        {
          $match: {
            assigneeId: userId,
            status: 'done',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: {
              $avg: { $subtract: ['$completedAt', '$createdAt'] }
            }
          }
        }
      ]);

      const insights = {
        timeRange,
        userId,
        hourlyProductivity: hourlyProductivity.map(item => ({
          hour: item._id,
          completedTasks: item.count
        })),
        dailyProductivity: dailyProductivity.map(item => ({
          day: item._id,
          completedTasks: item.count
        })),
        priorityCompletion,
        avgCompletionTimeDays: avgCompletionTime[0] ? 
          Math.round(avgCompletionTime[0].avgTime / (1000 * 60 * 60 * 24)) : 0,
        recommendations: this.generateRecommendations(userTasks, hourlyProductivity, priorityCompletion)
      };

      return insights;

    } catch (error) {
      logger.error('❌ 생산성 인사이트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 추천사항 생성
   */
  generateRecommendations(userTasks, hourlyProductivity, priorityCompletion) {
    const recommendations = [];

    // 가장 생산적인 시간대 찾기
    const mostProductiveHour = hourlyProductivity.reduce((max, item) => 
      item.count > max.count ? item : max, { count: 0 });

    if (mostProductiveHour.count > 0) {
      recommendations.push({
        type: 'productivity_time',
        title: '가장 생산적인 시간대',
        description: `${mostProductiveHour._id}시에 가장 많은 태스크를 완료했습니다. 중요한 태스크를 이 시간대에 배치해보세요.`,
        priority: 'medium'
      });
    }

    // 우선순위별 완료율 분석
    const lowPriorityCompletion = priorityCompletion.find(p => p.priority === 'low');
    const highPriorityCompletion = priorityCompletion.find(p => p.priority === 'high');

    if (lowPriorityCompletion && highPriorityCompletion) {
      if (lowPriorityCompletion.completionRate > highPriorityCompletion.completionRate) {
        recommendations.push({
          type: 'priority_management',
          title: '우선순위 관리 개선',
          description: '높은 우선순위 태스크의 완료율이 낮습니다. 우선순위를 더 신중하게 설정해보세요.',
          priority: 'high'
        });
      }
    }

    // 마감일 준수율 분석
    const overdueTasks = userTasks.filter(task => 
      task.status !== 'done' && task.dueDate && task.dueDate < new Date()
    );

    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'deadline_management',
        title: '마감일 관리',
        description: `${overdueTasks.length}개의 태스크가 마감일을 지났습니다. 마감일 설정을 더 현실적으로 조정해보세요.`,
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * 활동 데이터 포맷팅
   */
  formatActivityData(activityData) {
    const formatted = {};
    
    activityData.forEach(item => {
      const date = item._id.date;
      if (!formatted[date]) {
        formatted[date] = {};
      }
      
      if (item._id.status) {
        formatted[date][item._id.status] = item.count;
      } else {
        formatted[date].total = item.count;
      }
    });

    return formatted;
  }

  /**
   * 시작 날짜 계산
   */
  getStartDate(timeRange) {
    const now = new Date();
    
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * 조직 통계 조회
   */
  async getOrganizationStatistics(organizationId, timeRange = '30d') {
    try {
      const cacheKey = `org_stats_${organizationId}_${timeRange}`;
      
      // 캐시 확인
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const endDate = new Date();
      const startDate = this.getStartDate(timeRange);

      // 조직 프로젝트들
      const organizationProjects = await Project.find({
        organizationId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('_id');

      const projectIds = organizationProjects.map(p => p._id);

      // 조직 태스크 통계
      const organizationTaskStats = await Task.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        }
      ]);

      // 팀별 성과
      const teamPerformance = await Project.aggregate([
        {
          $match: {
            organizationId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$teamId',
            projectCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'teams',
            localField: '_id',
            foreignField: '_id',
            as: 'team'
          }
        },
        {
          $unwind: '$team'
        },
        {
          $project: {
            teamId: '$_id',
            teamName: '$team.name',
            projectCount: 1
          }
        }
      ]);

      const orgStats = {
        timeRange,
        organizationId,
        taskStats: organizationTaskStats[0] || {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0
        },
        teamPerformance,
        projectCount: organizationProjects.length,
        metrics: {
          completionRate: organizationTaskStats[0] ? 
            (organizationTaskStats[0].completedTasks / organizationTaskStats[0].totalTasks * 100).toFixed(2) : 0,
          overdueRate: organizationTaskStats[0] ? 
            (organizationTaskStats[0].overdueTasks / organizationTaskStats[0].totalTasks * 100).toFixed(2) : 0
        }
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: orgStats,
        timestamp: Date.now()
      });

      return orgStats;

    } catch (error) {
      logger.error('❌ 조직 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 대시보드 데이터
   */
  async getRealTimeDashboardData(userId) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 오늘의 태스크
      const todayTasks = await Task.find({
        assigneeId: userId,
        createdAt: { $gte: startOfDay }
      }).count();

      // 오늘 완료된 태스크
      const todayCompleted = await Task.find({
        assigneeId: userId,
        status: 'done',
        completedAt: { $gte: startOfDay }
      }).count();

      // 마감일이 오늘인 태스크
      const todayDeadline = await Task.find({
        assigneeId: userId,
        status: { $ne: 'done' },
        dueDate: {
          $gte: startOfDay,
          $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }).count();

      // 지연된 태스크
      const overdueTasks = await Task.find({
        assigneeId: userId,
        status: { $ne: 'done' },
        dueDate: { $lt: now }
      }).count();

      // 진행 중인 프로젝트
      const activeProjects = await Project.find({
        'members.userId': userId,
        status: 'active'
      }).count();

      return {
        todayTasks,
        todayCompleted,
        todayDeadline,
        overdueTasks,
        activeProjects,
        completionRate: todayTasks > 0 ? (todayCompleted / todayTasks * 100).toFixed(1) : 0
      };

    } catch (error) {
      logger.error('❌ 실시간 대시보드 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 서비스 상태 조회
   */
  getServiceStatus() {
    return {
      isRunning: true,
      cacheSize: this.cache.size,
      lastUpdate: this.lastUpdate,
      globalStats: !!this.globalStats
    };
  }

  /**
   * 서비스 정리
   */
  async cleanup() {
    try {
      this.cache.clear();
      this.userAnalytics.clear();
      this.globalStats = null;
      this.lastUpdate = null;
      
      logger.info('🧹 AnalyticsService 정리 완료');
      
    } catch (error) {
      logger.error('❌ AnalyticsService 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성
const analyticsService = new AnalyticsService();

export default analyticsService; 