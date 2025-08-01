/**
 * Task Controller - 태스크 컨트롤러
 * 태스크 관련 API 엔드포인트를 처리하는 컨트롤러
 * 
 * @description
 * - 태스크 CRUD API
 * - 태스크 검색 및 필터링
 * - 태스크 통계 및 분석
 * - 태스크 권한 관리
 * - 태스크 협업 기능
 * - 확장성을 고려한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import taskService from '../services/taskService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * 태스크 컨트롤러 클래스
 * 태스크 관련 API 엔드포인트를 처리
 */
class TaskController {
  /**
   * 태스크 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  getTasks = asyncHandler(async (req, res) => {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type,
      assigneeId: req.query.assigneeId,
      creatorId: req.query.creatorId,
      organizationId: req.query.organizationId,
      teamId: req.query.teamId,
      projectId: req.query.projectId,
      tags: req.query.tags,
      dueDateFrom: req.query.dueDateFrom,
      dueDateTo: req.query.dueDateTo
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await taskService.getTasks(filters, options, req.user);

    const response = {
      success: true,
      data: result
    };

    logger.info(`📋 태스크 목록 조회: ${req.user.name} (${result.tasks.length}개)`);
    res.json(response);
  });

  /**
   * 태스크 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  getTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const task = await taskService.getTaskById(taskId, req.user);

    const response = {
      success: true,
      data: { task }
    };

    logger.info(`👁️ 태스크 상세 조회: ${req.user.name} -> ${taskId}`);
    res.json(response);
  });

  /**
   * 태스크 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  createTask = asyncHandler(async (req, res) => {
    const taskData = req.body;
    const user = req.user;

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
        sessionId: req.sessionID
      }
    });

    // 조직/팀/프로젝트 정보 설정
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

    // 담당자 정보 설정
    if (taskData.assigneeId) {
      const assignee = await User.findById(taskData.assigneeId);
      if (assignee) {
        task.assignee = {
          userId: assignee._id,
          name: assignee.name,
          email: assignee.email,
          avatar: assignee.avatar
        };
      }
    }

    // 상위 태스크 확인
    if (taskData.parentTaskId) {
      const parentTask = await Task.findById(taskData.parentTaskId);
      if (!parentTask) {
        throw new NotFoundError('상위 태스크');
      }
      task.parentTaskId = parentTask._id;
    }

    // 태스크 저장
    await task.save();

    // 상위 태스크에 하위 태스크 추가
    if (taskData.parentTaskId) {
      const parentTask = await Task.findById(taskData.parentTaskId);
      parentTask.subtasks.push(task._id);
      await parentTask.save();
    }

    // 활동 로그 추가
    await task.addActivityLog('create', user._id, user.name, '태스크 생성');

    // 알림 전송 (구현 필요)
    if (task.assignee && task.assignee.userId.toString() !== user._id.toString()) {
      // await notificationService.sendTaskAssignmentNotification(task);
    }

    // 응답 데이터 구성
    const populatedTask = await Task.findById(task._id)
      .populate('assignee.userId', 'name email avatar')
      .populate('creator.userId', 'name email avatar')
      .populate('organization.organizationId', 'name')
      .populate('team.teamId', 'name color')
      .populate('project.projectId', 'name color');

    const response = {
      success: true,
      data: { task: populatedTask },
      message: '태스크가 성공적으로 생성되었습니다.'
    };

    logger.info(`✅ 태스크 생성: ${user.name} -> ${task.title}`);
    res.status(201).json(response);
  });

  /**
   * 태스크 수정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const updateData = req.body;
    const user = req.user;

    // 태스크 조회
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('태스크');
    }

    // 수정 권한 확인
    const canEdit = await this.checkTaskEditPermission(task, user);
    if (!canEdit) {
      throw new AuthorizationError('태스크를 수정할 권한이 없습니다.');
    }

    // 이전 상태 저장 (변경 감지용)
    const previousStatus = task.status;
    const previousAssignee = task.assignee?.userId;

    // 태스크 업데이트
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'creator' && key !== 'createdAt') {
        task[key] = updateData[key];
      }
    });

    // 담당자 변경 시 정보 업데이트
    if (updateData.assigneeId && updateData.assigneeId !== previousAssignee?.toString()) {
      const assignee = await User.findById(updateData.assigneeId);
      if (assignee) {
        task.assignee = {
          userId: assignee._id,
          name: assignee.name,
          email: assignee.email,
          avatar: assignee.avatar
        };
      }
    }

    task.updatedAt = new Date();
    await task.save();

    // 활동 로그 추가
    const activityMessage = this.generateActivityMessage(updateData, previousStatus, previousAssignee);
    await task.addActivityLog('update', user._id, user.name, activityMessage);

    // 상태 변경 알림 (구현 필요)
    if (previousStatus !== task.status) {
      // await notificationService.sendStatusChangeNotification(task, previousStatus);
    }

    // 담당자 변경 알림 (구현 필요)
    if (previousAssignee?.toString() !== task.assignee?.userId?.toString()) {
      // await notificationService.sendAssigneeChangeNotification(task, previousAssignee);
    }

    // 응답 데이터 구성
    const populatedTask = await Task.findById(task._id)
      .populate('assignee.userId', 'name email avatar')
      .populate('creator.userId', 'name email avatar')
      .populate('organization.organizationId', 'name')
      .populate('team.teamId', 'name color')
      .populate('project.projectId', 'name color');

    const response = {
      success: true,
      data: { task: populatedTask },
      message: '태스크가 성공적으로 수정되었습니다.'
    };

    logger.info(`✏️ 태스크 수정: ${user.name} -> ${taskId}`);
    res.json(response);
  });

  /**
   * 태스크 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const user = req.user;

    // 태스크 조회
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('태스크');
    }

    // 삭제 권한 확인
    const canDelete = await this.checkTaskDeletePermission(task, user);
    if (!canDelete) {
      throw new AuthorizationError('태스크를 삭제할 권한이 없습니다.');
    }

    // 하위 태스크가 있는지 확인
    if (task.subtasks && task.subtasks.length > 0) {
      throw new ConflictError('하위 태스크가 있는 태스크는 삭제할 수 없습니다.');
    }

    // 상위 태스크에서 하위 태스크 제거
    if (task.parentTaskId) {
      const parentTask = await Task.findById(task.parentTaskId);
      if (parentTask) {
        parentTask.subtasks = parentTask.subtasks.filter(id => id.toString() !== taskId);
        await parentTask.save();
      }
    }

    // 태스크 소프트 삭제
    await task.softDelete(user._id, user.name);

    // 활동 로그 추가
    await task.addActivityLog('delete', user._id, user.name, '태스크 삭제');

    const response = {
      success: true,
      message: '태스크가 성공적으로 삭제되었습니다.'
    };

    logger.info(`🗑️ 태스크 삭제: ${user.name} -> ${taskId}`);
    res.json(response);
  });

  /**
   * 태스크 상태 변경
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  updateTaskStatus = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { status, comment } = req.body;
    const user = req.user;

    // 태스크 조회
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('태스크');
    }

    // 상태 변경 권한 확인
    const canUpdateStatus = await this.checkTaskStatusUpdatePermission(task, user);
    if (!canUpdateStatus) {
      throw new AuthorizationError('태스크 상태를 변경할 권한이 없습니다.');
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

    // 상태 변경 알림 (구현 필요)
    // await notificationService.sendStatusChangeNotification(task, previousStatus);

    const response = {
      success: true,
      data: { task },
      message: `태스크 상태가 '${status}'로 변경되었습니다.`
    };

    logger.info(`🔄 태스크 상태 변경: ${user.name} -> ${taskId} (${previousStatus} → ${status})`);
    res.json(response);
  });

  /**
   * 태스크 담당자 변경
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  updateTaskAssignee = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { assigneeId, comment } = req.body;
    const user = req.user;

    // 태스크 조회
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('태스크');
    }

    // 담당자 변경 권한 확인
    const canUpdateAssignee = await this.checkTaskAssigneeUpdatePermission(task, user);
    if (!canUpdateAssignee) {
      throw new AuthorizationError('태스크 담당자를 변경할 권한이 없습니다.');
    }

    // 새 담당자 확인
    const newAssignee = await User.findById(assigneeId);
    if (!newAssignee) {
      throw new NotFoundError('담당자');
    }

    const previousAssignee = task.assignee?.userId;
    task.assignee = {
      userId: newAssignee._id,
      name: newAssignee.name,
      email: newAssignee.email,
      avatar: newAssignee.avatar
    };
    task.updatedAt = new Date();

    await task.save();

    // 코멘트 추가 (있는 경우)
    if (comment) {
      await task.addComment(user._id, user.name, comment, 'assignee_change');
    }

    // 활동 로그 추가
    await task.addActivityLog('assignee_change', user._id, user.name, `담당자 변경: ${previousAssignee ? '이전 담당자' : '담당자 없음'} → ${newAssignee.name}`);

    // 담당자 변경 알림 (구현 필요)
    // await notificationService.sendAssigneeChangeNotification(task, previousAssignee);

    const response = {
      success: true,
      data: { task },
      message: `태스크 담당자가 '${newAssignee.name}'으로 변경되었습니다.`
    };

    logger.info(`👤 태스크 담당자 변경: ${user.name} -> ${taskId} (${newAssignee.name})`);
    res.json(response);
  });

  /**
   * 태스크 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  getTaskStats = asyncHandler(async (req, res) => {
    const { organizationId, teamId, projectId, period = '30d' } = req.query;
    const user = req.user;

    // 기본 쿼리 조건
    let query = await this.buildAccessibleTasksQuery(user);

    // 추가 필터 조건
    if (organizationId) query['organization.organizationId'] = organizationId;
    if (teamId) query['team.teamId'] = teamId;
    if (projectId) query['project.projectId'] = projectId;

    // 기간 필터
    const dateFilter = this.getDateFilter(period);
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
      // 전체 태스크 수
      Task.countDocuments(query),
      
      // 상태별 통계
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 우선순위별 통계
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 유형별 통계
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // 담당자별 통계
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$assignee.userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // 생성자별 통계
      Task.aggregate([
        { $match: query },
        { $group: { _id: '$creator.userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // 완료 통계
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
      
      // 지연 태스크 통계
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
    const response = {
      success: true,
      data: {
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
        period
      }
    };

    logger.info(`📊 태스크 통계 조회: ${user.name}`);
    res.json(response);
  });

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

    // 프로젝트 태스크 (구현 필요)
    // const projectIds = await this.getUserProjectIds(user._id);

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

    // 프로젝트 태스크인 경우 프로젝트 멤버 확인 (구현 필요)
    if (task.project && task.project.projectId) {
      // const project = await Project.findById(task.project.projectId);
      // if (project && project.members.some(member => member.userId.toString() === user._id.toString())) {
      //   return true;
      // }
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

    // 조직 관리자인 경우 (구현 필요)
    // const orgMember = user.organizations.find(org => 
    //   org.organizationId.toString() === task.organization?.organizationId?.toString()
    // );
    // if (orgMember && ['owner', 'admin'].includes(orgMember.role)) {
    //   return true;
    // }

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
    // 생성자, 담당자, 조직 관리자
    if (task.creator.userId.toString() === user._id.toString() ||
        (task.assignee && task.assignee.userId.toString() === user._id.toString())) {
      return true;
    }

    return false;
  }

  /**
   * 태스크 담당자 변경 권한 확인
   * @param {Object} task - 태스크 객체
   * @param {Object} user - 사용자 객체
   * @returns {boolean} 담당자 변경 권한 여부
   */
  async checkTaskAssigneeUpdatePermission(task, user) {
    // 생성자, 조직 관리자
    if (task.creator.userId.toString() === user._id.toString()) {
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
}

// 컨트롤러 인스턴스 생성 및 내보내기
const taskController = new TaskController();

export default taskController; 