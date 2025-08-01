/**
 * Task Service - 태스크 서비스
 * 태스크 관련 비즈니스 로직 처리
 * 
 * @description
 * - 태스크 CRUD 비즈니스 로직
 * - 데이터 검증 및 변환
 * - 외부 서비스 연동
 * - 캐싱 및 성능 최적화
 * - 이벤트 처리 및 알림
 * - 확장 가능한 서비스 구조
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler.js';

/**
 * 태스크 서비스 클래스
 * 태스크 관련 비즈니스 로직을 처리
 */
class TaskService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  /**
   * 태스크 목록 조회 (비즈니스 로직)
   * @param {Object} filters - 필터 조건
   * @param {Object} options - 조회 옵션
   * @param {Object} user - 사용자 정보
   * @returns {Object} 태스크 목록 및 페이지네이션 정보
   */
  async getTasks(filters = {}, options = {}, user) {
    try {
      // 캐시 키 생성
      const cacheKey = `tasks:${JSON.stringify(filters)}:${JSON.stringify(options)}:${user._id}`;
      
      // 캐시 확인
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('캐시된 태스크 목록 반환');
        return cached;
      }

      // 접근 가능한 태스크 쿼리 생성
      const query = await this.buildAccessibleTasksQuery(user);
      
      // 필터 조건 적용
      this.applyFilters(query, filters);
      
      // 정렬 조건 적용
      const sort = this.buildSortOptions(options.sortBy, options.sortOrder);
      
      // 페이지네이션 적용
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;
      
      // 태스크 조회
      const [tasks, total] = await Promise.all([
        Task.find(query)
          .populate('assignee.userId', 'name email avatar')
          .populate('creator.userId', 'name email avatar')
          .populate('organization.organizationId', 'name')
          .populate('team.teamId', 'name color')
          .populate('project.projectId', 'name color')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Task.countDocuments(query)
      ]);

      // 응답 데이터 구성
      const result = {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // 캐시 저장
      this.setCache(cacheKey, result);

      logger.info(`태스크 목록 조회 완료: ${tasks.length}개`);
      return result;

    } catch (error) {
      logger.error('태스크 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 상세 조회
   * @param {string} taskId - 태스크 ID
   * @param {Object} user - 사용자 정보
   * @returns {Object} 태스크 상세 정보
   */
  async getTaskById(taskId, user) {
    try {
      // 태스크 조회
      const task = await Task.findById(taskId)
        .populate('assignee.userId', 'name email avatar')
        .populate('creator.userId', 'name email avatar')
        .populate('organization.organizationId', 'name')
        .populate('team.teamId', 'name color')
        .populate('project.projectId', 'name color')
        .populate('parentTaskId', 'title status')
        .populate('subtasks', 'title status priority dueDate')
        .populate('comments.authorId', 'name avatar')
        .populate('attachments.uploadedBy', 'name')
        .populate('activityLog.userId', 'name avatar');

      if (!task) {
        throw new NotFoundError('태스크');
      }

      // 접근 권한 확인
      const hasAccess = await this.checkTaskAccess(task, user);
      if (!hasAccess) {
        throw new ValidationError('해당 태스크에 접근할 권한이 없습니다.');
      }

      // 조회수 증가
      task.viewCount = (task.viewCount || 0) + 1;
      await task.save();

      // 활동 로그 추가
      await task.addActivityLog('view', user._id, user.name, '태스크 조회');

      logger.info(`태스크 상세 조회 완료: ${taskId}`);
      return task;

    } catch (error) {
      logger.error('태스크 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 생성
   * @param {Object} taskData - 태스크 데이터
   * @param {Object} user - 사용자 정보
   * @returns {Object} 생성된 태스크
   */
  async createTask(taskData, user) {
    try {
      // 데이터 검증
      await this.validateTaskData(taskData, user);

      // 기본 태스크 데이터 설정
      const task = new Task({
        ...taskData,
        creator: {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        type: taskData.type || 'task',
        tags: taskData.tags || [],
        attachments: taskData.attachments || [],
        metadata: {
          createdVia: 'api',
          sessionId: taskData.sessionId
        }
      });

      // 조직/팀/프로젝트 정보 설정
      await this.setRelatedEntities(task, taskData);

      // 담당자 정보 설정
      if (taskData.assigneeId) {
        await this.setAssignee(task, taskData.assigneeId);
      }

      // 상위 태스크 확인 및 설정
      if (taskData.parentTaskId) {
        await this.setParentTask(task, taskData.parentTaskId);
      }

      // 태스크 저장
      await task.save();

      // 상위 태스크에 하위 태스크 추가
      if (taskData.parentTaskId) {
        await this.addSubtaskToParent(taskData.parentTaskId, task._id);
      }

      // 활동 로그 추가
      await task.addActivityLog('create', user._id, user.name, '태스크 생성');

      // 캐시 무효화
      this.invalidateUserCache(user._id);

      // 이벤트 발생 (알림 등)
      await this.emitTaskEvent('created', task, user);

      logger.info(`태스크 생성 완료: ${task.title} (${task._id})`);
      return task;

    } catch (error) {
      logger.error('태스크 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 수정
   * @param {string} taskId - 태스크 ID
   * @param {Object} updateData - 수정 데이터
   * @param {Object} user - 사용자 정보
   * @returns {Object} 수정된 태스크
   */
  async updateTask(taskId, updateData, user) {
    try {
      // 태스크 조회
      const task = await Task.findById(taskId);
      if (!task) {
        throw new NotFoundError('태스크');
      }

      // 수정 권한 확인
      const canEdit = await this.checkTaskEditPermission(task, user);
      if (!canEdit) {
        throw new ValidationError('태스크를 수정할 권한이 없습니다.');
      }

      // 이전 상태 저장 (변경 감지용)
      const previousStatus = task.status;
      const previousAssignee = task.assignee?.userId;

      // 데이터 검증
      await this.validateTaskUpdateData(updateData, task);

      // 태스크 업데이트
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'creator' && key !== 'createdAt') {
          task[key] = updateData[key];
        }
      });

      // 담당자 변경 시 정보 업데이트
      if (updateData.assigneeId && updateData.assigneeId !== previousAssignee?.toString()) {
        await this.setAssignee(task, updateData.assigneeId);
      }

      task.updatedAt = new Date();
      await task.save();

      // 활동 로그 추가
      const activityMessage = this.generateActivityMessage(updateData, previousStatus, previousAssignee);
      await task.addActivityLog('update', user._id, user.name, activityMessage);

      // 캐시 무효화
      this.invalidateUserCache(user._id);

      // 이벤트 발생
      await this.emitTaskEvent('updated', task, user, { previousStatus, previousAssignee });

      logger.info(`태스크 수정 완료: ${taskId}`);
      return task;

    } catch (error) {
      logger.error('태스크 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 삭제
   * @param {string} taskId - 태스크 ID
   * @param {Object} user - 사용자 정보
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteTask(taskId, user) {
    try {
      // 태스크 조회
      const task = await Task.findById(taskId);
      if (!task) {
        throw new NotFoundError('태스크');
      }

      // 삭제 권한 확인
      const canDelete = await this.checkTaskDeletePermission(task, user);
      if (!canDelete) {
        throw new ValidationError('태스크를 삭제할 권한이 없습니다.');
      }

      // 하위 태스크가 있는지 확인
      if (task.subtasks && task.subtasks.length > 0) {
        throw new ConflictError('하위 태스크가 있는 태스크는 삭제할 수 없습니다.');
      }

      // 상위 태스크에서 하위 태스크 제거
      if (task.parentTaskId) {
        await this.removeSubtaskFromParent(task.parentTaskId, taskId);
      }

      // 태스크 소프트 삭제
      await task.softDelete(user._id, user.name);

      // 활동 로그 추가
      await task.addActivityLog('delete', user._id, user.name, '태스크 삭제');

      // 캐시 무효화
      this.invalidateUserCache(user._id);

      // 이벤트 발생
      await this.emitTaskEvent('deleted', task, user);

      logger.info(`태스크 삭제 완료: ${taskId}`);
      return true;

    } catch (error) {
      logger.error('태스크 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 상태 변경
   * @param {string} taskId - 태스크 ID
   * @param {string} status - 새로운 상태
   * @param {string} comment - 상태 변경 코멘트
   * @param {Object} user - 사용자 정보
   * @returns {Object} 상태 변경된 태스크
   */
  async updateTaskStatus(taskId, status, comment, user) {
    try {
      // 태스크 조회
      const task = await Task.findById(taskId);
      if (!task) {
        throw new NotFoundError('태스크');
      }

      // 상태 변경 권한 확인
      const canUpdateStatus = await this.checkTaskStatusUpdatePermission(task, user);
      if (!canUpdateStatus) {
        throw new ValidationError('태스크 상태를 변경할 권한이 없습니다.');
      }

      const previousStatus = task.status;
      task.status = status;
      task.updatedAt = new Date();

      // 완료 상태로 변경 시 완료 시간 설정
      if (status === 'done' && previousStatus !== 'done') {
        task.completedAt = new Date();
        task.completedBy = {
          userId: user._id,
          name: user.name,
          email: user.email
        };
      }

      await task.save();

      // 코멘트 추가 (있는 경우)
      if (comment) {
        await task.addComment(user._id, user.name, comment, 'status_change');
      }

      // 활동 로그 추가
      await task.addActivityLog('status_change', user._id, user.name, `상태 변경: ${previousStatus} → ${status}`);

      // 캐시 무효화
      this.invalidateUserCache(user._id);

      // 이벤트 발생
      await this.emitTaskEvent('status_changed', task, user, { previousStatus });

      logger.info(`태스크 상태 변경 완료: ${taskId} (${previousStatus} → ${status})`);
      return task;

    } catch (error) {
      logger.error('태스크 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 태스크 통계 조회
   * @param {Object} filters - 필터 조건
   * @param {Object} user - 사용자 정보
   * @returns {Object} 태스크 통계 데이터
   */
  async getTaskStats(filters = {}, user) {
    try {
      // 캐시 키 생성
      const cacheKey = `task_stats:${JSON.stringify(filters)}:${user._id}`;
      
      // 캐시 확인
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 기본 쿼리 조건
      let query = await this.buildAccessibleTasksQuery(user);

      // 추가 필터 조건
      if (filters.organizationId) query['organization.organizationId'] = filters.organizationId;
      if (filters.teamId) query['team.teamId'] = filters.teamId;
      if (filters.projectId) query['project.projectId'] = filters.projectId;

      // 기간 필터
      const dateFilter = this.getDateFilter(filters.period);
      if (dateFilter) {
        query.createdAt = dateFilter;
      }

      // 통계 데이터 수집
      const [
        totalTasks,
        statusStats,
        priorityStats,
        typeStats,
        assigneeStats,
        creatorStats,
        completionStats,
        overdueStats
      ] = await Promise.all([
        Task.countDocuments(query),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$assignee.userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$creator.userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Task.aggregate([
          { $match: { ...query, status: 'done' } },
          {
            $group: {
              _id: {
                year: { $year: '$completedAt' },
                month: { $month: '$completedAt' },
                day: { $dayOfMonth: '$completedAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
          { $limit: 30 }
        ]),
        Task.countDocuments({
          ...query,
          dueDate: { $lt: new Date() },
          status: { $nin: ['done', 'cancelled'] }
        })
      ]);

      // 사용자 정보 조회
      const [assigneeUsers, creatorUsers] = await Promise.all([
        User.find({ _id: { $in: assigneeStats.map(s => s._id) } }).select('name email avatar'),
        User.find({ _id: { $in: creatorStats.map(s => s._id) } }).select('name email avatar')
      ]);

      // 응답 데이터 구성
      const result = {
        totalTasks,
        statusStats: statusStats.map(stat => ({
          status: stat._id,
          count: stat.count,
          percentage: ((stat.count / totalTasks) * 100).toFixed(1)
        })),
        priorityStats: priorityStats.map(stat => ({
          priority: stat._id,
          count: stat.count,
          percentage: ((stat.count / totalTasks) * 100).toFixed(1)
        })),
        typeStats: typeStats.map(stat => ({
          type: stat._id,
          count: stat.count,
          percentage: ((stat.count / totalTasks) * 100).toFixed(1)
        })),
        assigneeStats: assigneeStats.map(stat => {
          const user = assigneeUsers.find(u => u._id.toString() === stat._id.toString());
          return {
            userId: stat._id,
            name: user?.name || 'Unknown',
            email: user?.email,
            avatar: user?.avatar,
            count: stat.count,
            percentage: ((stat.count / totalTasks) * 100).toFixed(1)
          };
        }),
        creatorStats: creatorStats.map(stat => {
          const user = creatorUsers.find(u => u._id.toString() === stat._id.toString());
          return {
            userId: stat._id,
            name: user?.name || 'Unknown',
            email: user?.email,
            avatar: user?.avatar,
            count: stat.count,
            percentage: ((stat.count / totalTasks) * 100).toFixed(1)
          };
        }),
        completionStats: completionStats.map(stat => ({
          date: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}-${stat._id.day.toString().padStart(2, '0')}`,
          count: stat.count
        })),
        overdueTasks: overdueStats,
        period: filters.period
      };

      // 캐시 저장
      this.setCache(cacheKey, result);

      logger.info('태스크 통계 조회 완료');
      return result;

    } catch (error) {
      logger.error('태스크 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 접근 가능한 태스크 쿼리 생성
   * @param {Object} user - 사용자 객체
   * @returns {Object} MongoDB 쿼리 객체
   */
  async buildAccessibleTasksQuery(user) {
    const query = { status: { $ne: 'deleted' } };

    // 개인 태스크 (생성자 또는 담당자)
    const personalQuery = {
      $or: [
        { 'creator.userId': user._id },
        { 'assignee.userId': user._id }
      ]
    };

    // 조직 태스크
    const organizationIds = user.organizations
      .filter(org => org.status === 'active')
      .map(org => org.organizationId);

    // 팀 태스크
    const teamIds = user.teams
      .filter(team => team.status === 'active')
      .map(team => team.teamId);

    const organizationQuery = organizationIds.length > 0 ? {
      'organization.organizationId': { $in: organizationIds }
    } : {};

    const teamQuery = teamIds.length > 0 ? {
      'team.teamId': { $in: teamIds }
    } : {};

    // 최종 쿼리 조합
    query.$or = [
      personalQuery,
      organizationQuery,
      teamQuery
    ].filter(q => Object.keys(q).length > 0);

    return query;
  }

  /**
   * 필터 조건 적용
   * @param {Object} query - MongoDB 쿼리 객체
   * @param {Object} filters - 필터 조건
   */
  applyFilters(query, filters) {
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.assigneeId) query['assignee.userId'] = filters.assigneeId;
    if (filters.creatorId) query['creator.userId'] = filters.creatorId;
    if (filters.organizationId) query['organization.organizationId'] = filters.organizationId;
    if (filters.teamId) query['team.teamId'] = filters.teamId;
    if (filters.projectId) query['project.projectId'] = filters.projectId;
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
    }

    // 날짜 범위 필터
    if (filters.dueDateFrom || filters.dueDateTo) {
      query.dueDate = {};
      if (filters.dueDateFrom) query.dueDate.$gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) query.dueDate.$lte = new Date(filters.dueDateTo);
    }
  }

  /**
   * 정렬 옵션 생성
   * @param {string} sortBy - 정렬 기준
   * @param {string} sortOrder - 정렬 순서
   * @returns {Object} 정렬 객체
   */
  buildSortOptions(sortBy = 'createdAt', sortOrder = 'desc') {
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    return sort;
  }

  /**
   * 태스크 데이터 검증
   * @param {Object} taskData - 태스크 데이터
   * @param {Object} user - 사용자 정보
   */
  async validateTaskData(taskData, user) {
    // 필수 필드 검증
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new ValidationError('태스크 제목은 필수입니다.');
    }

    // 마감일 검증
    if (taskData.dueDate && new Date(taskData.dueDate) < new Date()) {
      throw new ValidationError('마감일은 현재 시간 이후여야 합니다.');
    }

    // 담당자 검증
    if (taskData.assigneeId) {
      const assignee = await User.findById(taskData.assigneeId);
      if (!assignee) {
        throw new ValidationError('유효하지 않은 담당자입니다.');
      }
    }

    // 상위 태스크 검증
    if (taskData.parentTaskId) {
      const parentTask = await Task.findById(taskData.parentTaskId);
      if (!parentTask) {
        throw new ValidationError('유효하지 않은 상위 태스크입니다.');
      }
    }
  }

  /**
   * 관련 엔티티 설정
   * @param {Object} task - 태스크 객체
   * @param {Object} taskData - 태스크 데이터
   */
  async setRelatedEntities(task, taskData) {
    if (taskData.organizationId) {
      const organization = await Organization.findById(taskData.organizationId);
      if (organization) {
        task.organization = {
          organizationId: organization._id,
          name: organization.name
        };
      }
    }

    if (taskData.teamId) {
      const team = await Team.findById(taskData.teamId);
      if (team) {
        task.team = {
          teamId: team._id,
          name: team.name,
          color: team.color
        };
      }
    }

    if (taskData.projectId) {
      const project = await Project.findById(taskData.projectId);
      if (project) {
        task.project = {
          projectId: project._id,
          name: project.name,
          color: project.color
        };
      }
    }
  }

  /**
   * 담당자 설정
   * @param {Object} task - 태스크 객체
   * @param {string} assigneeId - 담당자 ID
   */
  async setAssignee(task, assigneeId) {
    const assignee = await User.findById(assigneeId);
    if (assignee) {
      task.assignee = {
        userId: assignee._id,
        name: assignee.name,
        email: assignee.email,
        avatar: assignee.avatar
      };
    }
  }

  /**
   * 상위 태스크 설정
   * @param {Object} task - 태스크 객체
   * @param {string} parentTaskId - 상위 태스크 ID
   */
  async setParentTask(task, parentTaskId) {
    const parentTask = await Task.findById(parentTaskId);
    if (!parentTask) {
      throw new NotFoundError('상위 태스크');
    }
    task.parentTaskId = parentTask._id;
  }

  /**
   * 상위 태스크에 하위 태스크 추가
   * @param {string} parentTaskId - 상위 태스크 ID
   * @param {string} subtaskId - 하위 태스크 ID
   */
  async addSubtaskToParent(parentTaskId, subtaskId) {
    const parentTask = await Task.findById(parentTaskId);
    if (parentTask) {
      parentTask.subtasks.push(subtaskId);
      await parentTask.save();
    }
  }

  /**
   * 상위 태스크에서 하위 태스크 제거
   * @param {string} parentTaskId - 상위 태스크 ID
   * @param {string} subtaskId - 하위 태스크 ID
   */
  async removeSubtaskFromParent(parentTaskId, subtaskId) {
    const parentTask = await Task.findById(parentTaskId);
    if (parentTask) {
      parentTask.subtasks = parentTask.subtasks.filter(id => id.toString() !== subtaskId);
      await parentTask.save();
    }
  }

  /**
   * 태스크 접근 권한 확인
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @returns {boolean} 접근 권한 여부
   */
  async checkTaskAccess(task, user) {
    // 생성자 또는 담당자인 경우
    if (task.creator.userId.toString() === user._id.toString() ||
        (task.assignee && task.assignee.userId.toString() === user._id.toString())) {
      return true;
    }

    // 조직 태스크인 경우 조직 멤버 확인
    if (task.organization && task.organization.organizationId) {
      const orgMember = user.organizations.find(org => 
        org.organizationId.toString() === task.organization.organizationId.toString()
      );
      if (orgMember && orgMember.status === 'active') {
        return true;
      }
    }

    // 팀 태스크인 경우 팀 멤버 확인
    if (task.team && task.team.teamId) {
      const teamMember = user.teams.find(team => 
        team.teamId.toString() === task.team.teamId.toString()
      );
      if (teamMember && teamMember.status === 'active') {
        return true;
      }
    }

    return false;
  }

  /**
   * 태스크 수정 권한 확인
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @returns {boolean} 수정 권한 여부
   */
  async checkTaskEditPermission(task, user) {
    // 생성자인 경우
    if (task.creator.userId.toString() === user._id.toString()) {
      return true;
    }

    // 담당자인 경우
    if (task.assignee && task.assignee.userId.toString() === user._id.toString()) {
      return true;
    }

    return false;
  }

  /**
   * 태스크 삭제 권한 확인
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @returns {boolean} 삭제 권한 여부
   */
  async checkTaskDeletePermission(task, user) {
    // 생성자인 경우만 삭제 가능
    return task.creator.userId.toString() === user._id.toString();
  }

  /**
   * 태스크 상태 변경 권한 확인
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @returns {boolean} 상태 변경 권한 여부
   */
  async checkTaskStatusUpdatePermission(task, user) {
    // 생성자, 담당자
    if (task.creator.userId.toString() === user._id.toString() ||
        (task.assignee && task.assignee.userId.toString() === user._id.toString())) {
      return true;
    }

    return false;
  }

  /**
   * 활동 메시지 생성
   * @param {Object} updateData - 업데이트 데이터
   * @param {string} previousStatus - 이전 상태
   * @param {string} previousAssignee - 이전 담당자
   * @returns {string} 활동 메시지
   */
  generateActivityMessage(updateData, previousStatus, previousAssignee) {
    const changes = [];

    if (updateData.title) changes.push('제목 변경');
    if (updateData.description) changes.push('설명 변경');
    if (updateData.priority) changes.push('우선순위 변경');
    if (updateData.status && updateData.status !== previousStatus) {
      changes.push(`상태 변경: ${previousStatus} → ${updateData.status}`);
    }
    if (updateData.assigneeId && updateData.assigneeId !== previousAssignee?.toString()) {
      changes.push('담당자 변경');
    }
    if (updateData.dueDate) changes.push('마감일 변경');
    if (updateData.tags) changes.push('태그 변경');

    return changes.length > 0 ? changes.join(', ') : '태스크 수정';
  }

  /**
   * 날짜 필터 생성
   * @param {string} period - 기간 ('7d', '30d', '90d', '1y')
   * @returns {Object} 날짜 필터 객체
   */
  getDateFilter(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return null;
    }

    return { $gte: startDate, $lte: now };
  }

  /**
   * 캐시에서 데이터 조회
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} key - 캐시 키
   * @param {Object} data - 저장할 데이터
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 사용자 관련 캐시 무효화
   * @param {string} userId - 사용자 ID
   */
  invalidateUserCache(userId) {
    for (const [key] of this.cache) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 태스크 이벤트 발생
   * @param {string} event - 이벤트 타입
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @param {Object} metadata - 추가 메타데이터
   */
  async emitTaskEvent(event, task, user, metadata = {}) {
    // 이벤트 발생 로직 (구현 필요)
    // 예: 알림 전송, 웹훅 호출, 분석 데이터 수집 등
    logger.info(`태스크 이벤트 발생: ${event}`, {
      taskId: task._id,
      userId: user._id,
      metadata
    });
  }
}

// 서비스 인스턴스 생성 및 내보내기
const taskService = new TaskService();

export default taskService; 