/**
 * Project Service - 프로젝트 서비스
 * 프로젝트 관리 비즈니스 로직을 처리하는 서비스
 * 
 * @description
 * - 프로젝트 CRUD 비즈니스 로직
 * - 프로젝트 멤버 관리
 * - 권한 및 접근 제어
 * - 프로젝트 통계 및 분석
 * - 캐싱 및 성능 최적화
 * - 이벤트 처리 및 알림
 * - 확장 가능한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';

/**
 * 프로젝트 서비스 클래스
 * 프로젝트 관련 비즈니스 로직을 처리
 */
class ProjectService {
  /**
   * 프로젝트 목록 조회
   * @param {Object} params - 조회 파라미터
   * @returns {Object} 조회 결과
   */
  async getProjects({ userId, filters = {}, options = {} }) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt'
      } = options;

      const {
        status,
        priority,
        category,
        search,
        organization,
        team,
        assignedTo,
        createdBy,
        startDate,
        endDate,
        includeArchived = false
      } = filters;

      // 쿼리 조건 구성
      const query = {};

      // 사용자 접근 가능한 프로젝트 필터링
      const userProjects = await this.getUserAccessibleProjects(userId);
      query._id = { $in: userProjects };

      // 상태 필터
      if (status) {
        query.status = status;
      } else if (!includeArchived) {
        query.status = { $ne: 'archived' };
      }

      // 우선순위 필터
      if (priority) {
        query.priority = priority;
      }

      // 카테고리 필터
      if (category) {
        query.category = category;
      }

      // 검색어 필터
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // 조직 필터
      if (organization) {
        query.organization = organization;
      }

      // 팀 필터
      if (team) {
        query.team = team;
      }

      // 담당자 필터
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }

      // 생성자 필터
      if (createdBy) {
        query.createdBy = createdBy;
      }

      // 날짜 필터
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // 페이지네이션
      const skip = (page - 1) * limit;
      const total = await Project.countDocuments(query);
      const projects = await Project.find(query)
        .populate('createdBy', 'name avatar')
        .populate('assignedTo', 'name avatar')
        .populate('organization', 'name')
        .populate('team', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // 통계 계산
      const stats = await this.calculateProjectStats(userId, query);

      return {
        success: true,
        data: {
          projects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          stats
        }
      };

    } catch (error) {
      logger.error('프로젝트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 상세 조회
   * @param {Object} params - 조회 파라미터
   * @returns {Object} 조회 결과
   */
  async getProject({ projectId, userId, options = {} }) {
    try {
      const {
        includeTasks = true,
        includeMembers = true,
        includeStats = true
      } = options;

      // 프로젝트 조회
      const project = await Project.findById(projectId)
        .populate('createdBy', 'name avatar email')
        .populate('assignedTo', 'name avatar email')
        .populate('organization', 'name description')
        .populate('team', 'name description')
        .populate('members.userId', 'name avatar email role');

      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 접근 권한 확인
      const hasAccess = await this.checkProjectAccess(project, userId);
      if (!hasAccess) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트에 접근할 권한이 없습니다.'
        };
      }

      const result = {
        success: true,
        data: {
          project
        }
      };

      // 태스크 포함
      if (includeTasks) {
        const tasks = await Task.find({ project: projectId, status: { $ne: 'deleted' } })
          .populate('assignedTo', 'name avatar')
          .populate('createdBy', 'name avatar')
          .sort('-createdAt')
          .limit(50);
        
        result.data.tasks = tasks;
      }

      // 멤버 상세 정보 포함
      if (includeMembers) {
        const memberDetails = await this.getProjectMemberDetails(projectId);
        result.data.memberDetails = memberDetails;
      }

      // 통계 포함
      if (includeStats) {
        const stats = await this.getProjectStats({ projectId, userId });
        result.data.stats = stats.data;
      }

      return result;

    } catch (error) {
      logger.error('프로젝트 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 생성
   * @param {Object} params - 생성 파라미터
   * @returns {Object} 생성 결과
   */
  async createProject({ projectData, userId, userName }) {
    try {
      // 입력 검증
      if (!projectData.title || projectData.title.trim().length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: '프로젝트 제목은 필수입니다.'
        };
      }

      // 조직/팀 권한 확인
      if (projectData.organization) {
        const hasOrgAccess = await this.checkOrganizationAccess(projectData.organization, userId);
        if (!hasOrgAccess) {
          return {
            success: false,
            statusCode: 403,
            message: '해당 조직에 프로젝트를 생성할 권한이 없습니다.'
          };
        }
      }

      if (projectData.team) {
        const hasTeamAccess = await this.checkTeamAccess(projectData.team, userId);
        if (!hasTeamAccess) {
          return {
            success: false,
            statusCode: 403,
            message: '해당 팀에 프로젝트를 생성할 권한이 없습니다.'
          };
        }
      }

      // 프로젝트 생성
      const project = new Project({
        ...projectData,
        createdBy: userId,
        owner: userId,
        members: [{
          userId,
          role: 'owner',
          permissions: ['read', 'write', 'delete', 'admin'],
          joinedAt: new Date()
        }]
      });

      await project.save();

      // 활동 로그 추가
      await project.addAuditLog('create', userId, userName, '프로젝트 생성');

      // 알림 발송 (조직/팀 멤버에게)
      await this.sendProjectNotification(project, 'project_created', userId, userName);

      logger.info(`📋 프로젝트 생성 완료: ${project.title} (${project._id})`);

      return {
        success: true,
        data: {
          project: await Project.findById(project._id)
            .populate('createdBy', 'name avatar')
            .populate('organization', 'name')
            .populate('team', 'name')
        },
        message: '프로젝트가 성공적으로 생성되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 수정
   * @param {Object} params - 수정 파라미터
   * @returns {Object} 수정 결과
   */
  async updateProject({ projectId, updateData, userId, userName }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 수정 권한 확인
      const canEdit = await this.checkProjectEditPermission(project, userId);
      if (!canEdit) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트를 수정할 권한이 없습니다.'
        };
      }

      // 수정 제한 필드 확인
      const restrictedFields = ['createdBy', 'owner', 'auditLog'];
      const filteredUpdateData = {};
      
      Object.keys(updateData).forEach(key => {
        if (!restrictedFields.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });

      // 프로젝트 수정
      Object.assign(project, filteredUpdateData);
      project.updatedAt = new Date();
      await project.save();

      // 활동 로그 추가
      await project.addAuditLog('update', userId, userName, '프로젝트 수정');

      // 알림 발송
      await this.sendProjectNotification(project, 'project_updated', userId, userName);

      logger.info(`✏️ 프로젝트 수정 완료: ${project.title} (${project._id})`);

      return {
        success: true,
        data: {
          project: await Project.findById(project._id)
            .populate('createdBy', 'name avatar')
            .populate('assignedTo', 'name avatar')
            .populate('organization', 'name')
            .populate('team', 'name')
        },
        message: '프로젝트가 성공적으로 수정되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 삭제
   * @param {Object} params - 삭제 파라미터
   * @returns {Object} 삭제 결과
   */
  async deleteProject({ projectId, userId, userName, force = false }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 삭제 권한 확인
      const canDelete = await this.checkProjectDeletePermission(project, userId);
      if (!canDelete) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트를 삭제할 권한이 없습니다.'
        };
      }

      // 강제 삭제가 아닌 경우 태스크 확인
      if (!force) {
        const taskCount = await Task.countDocuments({ 
          project: projectId, 
          status: { $nin: ['completed', 'cancelled'] } 
        });
        
        if (taskCount > 0) {
          return {
            success: false,
            statusCode: 400,
            message: `진행 중인 태스크가 ${taskCount}개 있습니다. 강제 삭제를 원하시면 force=true를 추가하세요.`
          };
        }
      }

      // 프로젝트 삭제
      if (force) {
        // 강제 삭제: 관련 태스크도 함께 삭제
        await Task.deleteMany({ project: projectId });
        await Project.findByIdAndDelete(projectId);
      } else {
        // 소프트 삭제
        project.status = 'deleted';
        await project.save();
        await project.addAuditLog('delete', userId, userName, '프로젝트 삭제');
      }

      // 알림 발송
      await this.sendProjectNotification(project, 'project_deleted', userId, userName);

      logger.info(`🗑️ 프로젝트 삭제 완료: ${project.title} (${project._id})`);

      return {
        success: true,
        message: '프로젝트가 성공적으로 삭제되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 상태 변경
   * @param {Object} params - 상태 변경 파라미터
   * @returns {Object} 변경 결과
   */
  async updateProjectStatus({ projectId, status, reason, userId, userName }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 상태 변경 권한 확인
      const canUpdateStatus = await this.checkProjectEditPermission(project, userId);
      if (!canUpdateStatus) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트 상태를 변경할 권한이 없습니다.'
        };
      }

      // 상태 변경
      const oldStatus = project.status;
      project.status = status;
      project.updatedAt = new Date();
      await project.save();

      // 활동 로그 추가
      await project.addAuditLog('update', userId, userName, `상태 변경: ${oldStatus} → ${status}${reason ? ` (${reason})` : ''}`);

      // 알림 발송
      await this.sendProjectNotification(project, 'project_status_changed', userId, userName, { oldStatus, newStatus: status });

      logger.info(`🔄 프로젝트 상태 변경 완료: ${project.title} (${oldStatus} → ${status})`);

      return {
        success: true,
        data: { project },
        message: '프로젝트 상태가 성공적으로 변경되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 멤버 추가
   * @param {Object} params - 멤버 추가 파라미터
   * @returns {Object} 추가 결과
   */
  async addProjectMember({ projectId, userId, role, permissions, addedBy, addedByName }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 멤버 추가 권한 확인
      const canAddMember = await this.checkProjectAdminPermission(project, addedBy);
      if (!canAddMember) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트 멤버를 추가할 권한이 없습니다.'
        };
      }

      // 사용자 존재 확인
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: '사용자를 찾을 수 없습니다.'
        };
      }

      // 이미 멤버인지 확인
      const existingMember = project.members.find(m => m.userId.toString() === userId);
      if (existingMember) {
        return {
          success: false,
          statusCode: 400,
          message: '이미 프로젝트 멤버입니다.'
        };
      }

      // 멤버 추가
      project.members.push({
        userId,
        role: role || 'member',
        permissions: permissions || ['read'],
        joinedAt: new Date(),
        addedBy
      });

      await project.save();

      // 활동 로그 추가
      await project.addAuditLog('member_add', addedBy, addedByName, `${user.name} 멤버 추가`);

      // 알림 발송
      await this.sendUserNotification(userId, {
        type: 'project_invitation',
        title: '프로젝트 초대',
        message: `${addedByName}님이 프로젝트 "${project.title}"에 초대했습니다.`,
        data: {
          projectId,
          projectTitle: project.title,
          role,
          permissions
        }
      });

      logger.info(`👥 프로젝트 멤버 추가 완료: ${user.name} -> ${project.title}`);

      return {
        success: true,
        data: {
          member: {
            userId: user._id,
            userName: user.name,
            userAvatar: user.avatar,
            role,
            permissions,
            joinedAt: new Date()
          }
        },
        message: '프로젝트 멤버가 성공적으로 추가되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 멤버 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 멤버 제거
   * @param {Object} params - 멤버 제거 파라미터
   * @returns {Object} 제거 결과
   */
  async removeProjectMember({ projectId, userId, reason, removedBy, removedByName }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 멤버 제거 권한 확인
      const canRemoveMember = await this.checkProjectAdminPermission(project, removedBy);
      if (!canRemoveMember) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트 멤버를 제거할 권한이 없습니다.'
        };
      }

      // 사용자 정보 조회
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: '사용자를 찾을 수 없습니다.'
        };
      }

      // 멤버인지 확인
      const memberIndex = project.members.findIndex(m => m.userId.toString() === userId);
      if (memberIndex === -1) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트 멤버가 아닙니다.'
        };
      }

      // 소유자는 제거할 수 없음
      if (project.owner.toString() === userId) {
        return {
          success: false,
          statusCode: 400,
          message: '프로젝트 소유자는 제거할 수 없습니다.'
        };
      }

      // 멤버 제거
      project.members.splice(memberIndex, 1);
      await project.save();

      // 활동 로그 추가
      await project.addAuditLog('member_remove', removedBy, removedByName, `${user.name} 멤버 제거${reason ? ` (${reason})` : ''}`);

      // 알림 발송
      await this.sendUserNotification(userId, {
        type: 'project_removed',
        title: '프로젝트에서 제거됨',
        message: `${removedByName}님이 프로젝트 "${project.title}"에서 제거했습니다.${reason ? ` (${reason})` : ''}`,
        data: {
          projectId,
          projectTitle: project.title,
          reason
        }
      });

      logger.info(`👥 프로젝트 멤버 제거 완료: ${user.name} -> ${project.title}`);

      return {
        success: true,
        message: '프로젝트 멤버가 성공적으로 제거되었습니다.'
      };

    } catch (error) {
      logger.error('프로젝트 멤버 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 통계 조회
   * @param {Object} params - 통계 조회 파라미터
   * @returns {Object} 통계 결과
   */
  async getProjectStats({ projectId, userId, period = 'all', startDate, endDate }) {
    try {
      // 프로젝트 조회
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          statusCode: 404,
          message: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 접근 권한 확인
      const hasAccess = await this.checkProjectAccess(project, userId);
      if (!hasAccess) {
        return {
          success: false,
          statusCode: 403,
          message: '프로젝트에 접근할 권한이 없습니다.'
        };
      }

      // 날짜 필터 설정
      let dateFilter = {};
      if (period !== 'all') {
        const now = new Date();
        switch (period) {
          case 'week':
            dateFilter = {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            };
            break;
          case 'month':
            dateFilter = {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1)
            };
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            dateFilter = {
              $gte: new Date(now.getFullYear(), quarter * 3, 1)
            };
            break;
          case 'year':
            dateFilter = {
              $gte: new Date(now.getFullYear(), 0, 1)
            };
            break;
        }
      } else if (startDate || endDate) {
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
      }

      // 태스크 통계
      const taskStats = await Task.aggregate([
        {
          $match: {
            project: project._id,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalHours: { $sum: '$estimatedHours' },
            completedHours: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$actualHours', 0]
              }
            }
          }
        }
      ]);

      // 멤버별 통계
      const memberStats = await Task.aggregate([
        {
          $match: {
            project: project._id,
            assignedTo: { $exists: true, $ne: null },
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          }
        },
        {
          $group: {
            _id: '$assignedTo',
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalHours: { $sum: '$estimatedHours' },
            completedHours: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$actualHours', 0]
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
            userAvatar: '$user.avatar',
            totalTasks: 1,
            completedTasks: 1,
            totalHours: 1,
            completedHours: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedTasks', '$totalTasks'] },
                100
              ]
            }
          }
        }
      ]);

      // 진행률 계산
      const totalTasks = taskStats.reduce((sum, stat) => sum + stat.count, 0);
      const completedTasks = taskStats.find(stat => stat._id === 'completed')?.count || 0;
      const progressRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // 시간 통계
      const totalEstimatedHours = taskStats.reduce((sum, stat) => sum + stat.totalHours, 0);
      const totalCompletedHours = taskStats.reduce((sum, stat) => sum + stat.completedHours, 0);

      const stats = {
        overview: {
          totalTasks,
          completedTasks,
          inProgressTasks: taskStats.find(stat => stat._id === 'in_progress')?.count || 0,
          pendingTasks: taskStats.find(stat => stat._id === 'pending')?.count || 0,
          overdueTasks: taskStats.find(stat => stat._id === 'overdue')?.count || 0,
          progressRate: Math.round(progressRate * 100) / 100,
          totalEstimatedHours,
          totalCompletedHours,
          efficiencyRate: totalEstimatedHours > 0 ? (totalCompletedHours / totalEstimatedHours) * 100 : 0
        },
        byStatus: taskStats.map(stat => ({
          status: stat._id,
          count: stat.count,
          percentage: totalTasks > 0 ? (stat.count / totalTasks) * 100 : 0
        })),
        byMember: memberStats,
        period: {
          type: period,
          startDate: dateFilter.$gte,
          endDate: dateFilter.$lte
        }
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      logger.error('프로젝트 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자가 접근 가능한 프로젝트 ID 목록 조회
   * @param {String} userId - 사용자 ID
   * @returns {Array} 프로젝트 ID 배열
   */
  async getUserAccessibleProjects(userId) {
    try {
      const projects = await Project.find({
        $or: [
          { owner: userId },
          { createdBy: userId },
          { 'members.userId': userId },
          { assignedTo: userId }
        ],
        status: { $ne: 'deleted' }
      }).select('_id');

      return projects.map(p => p._id);
    } catch (error) {
      logger.error('사용자 접근 가능 프로젝트 조회 실패:', error);
      return [];
    }
  }

  /**
   * 프로젝트 접근 권한 확인
   * @param {Object} project - 프로젝트 객체
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 접근 권한 여부
   */
  async checkProjectAccess(project, userId) {
    // 소유자 확인
    if (project.owner.toString() === userId) {
      return true;
    }

    // 생성자 확인
    if (project.createdBy.toString() === userId) {
      return true;
    }

    // 담당자 확인
    if (project.assignedTo && project.assignedTo.toString() === userId) {
      return true;
    }

    // 멤버 확인
    const member = project.members.find(m => m.userId.toString() === userId);
    if (member) {
      return true;
    }

    // 조직 멤버 확인
    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org && org.members.some(m => m.userId.toString() === userId)) {
        return true;
      }
    }

    // 팀 멤버 확인
    if (project.team) {
      const team = await Team.findById(project.team);
      if (team && team.members.some(m => m.userId.toString() === userId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 프로젝트 수정 권한 확인
   * @param {Object} project - 프로젝트 객체
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 수정 권한 여부
   */
  async checkProjectEditPermission(project, userId) {
    // 소유자/생성자는 수정 가능
    if (project.owner.toString() === userId || project.createdBy.toString() === userId) {
      return true;
    }

    // 멤버 권한 확인
    const member = project.members.find(m => m.userId.toString() === userId);
    if (member && member.permissions.includes('write')) {
      return true;
    }

    return false;
  }

  /**
   * 프로젝트 관리자 권한 확인
   * @param {Object} project - 프로젝트 객체
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 관리자 권한 여부
   */
  async checkProjectAdminPermission(project, userId) {
    // 소유자/생성자는 관리자 권한
    if (project.owner.toString() === userId || project.createdBy.toString() === userId) {
      return true;
    }

    // 멤버 관리자 권한 확인
    const member = project.members.find(m => m.userId.toString() === userId);
    if (member && member.permissions.includes('admin')) {
      return true;
    }

    return false;
  }

  /**
   * 프로젝트 삭제 권한 확인
   * @param {Object} project - 프로젝트 객체
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 삭제 권한 여부
   */
  async checkProjectDeletePermission(project, userId) {
    // 소유자만 삭제 가능
    return project.owner.toString() === userId;
  }

  /**
   * 조직 접근 권한 확인
   * @param {String} organizationId - 조직 ID
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 접근 권한 여부
   */
  async checkOrganizationAccess(organizationId, userId) {
    const org = await Organization.findById(organizationId);
    if (!org) return false;

    return org.members.some(m => m.userId.toString() === userId);
  }

  /**
   * 팀 접근 권한 확인
   * @param {String} teamId - 팀 ID
   * @param {String} userId - 사용자 ID
   * @returns {Boolean} 접근 권한 여부
   */
  async checkTeamAccess(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) return false;

    return team.members.some(m => m.userId.toString() === userId);
  }

  /**
   * 프로젝트 멤버 상세 정보 조회
   * @param {String} projectId - 프로젝트 ID
   * @returns {Array} 멤버 상세 정보 배열
   */
  async getProjectMemberDetails(projectId) {
    try {
      const project = await Project.findById(projectId)
        .populate('members.userId', 'name avatar email role status');

      if (!project) return [];

      return project.members.map(member => ({
        userId: member.userId._id,
        userName: member.userId.name,
        userAvatar: member.userId.avatar,
        userEmail: member.userId.email,
        userRole: member.userId.role,
        userStatus: member.userId.status,
        projectRole: member.role,
        projectPermissions: member.permissions,
        joinedAt: member.joinedAt,
        addedBy: member.addedBy
      }));
    } catch (error) {
      logger.error('프로젝트 멤버 상세 정보 조회 실패:', error);
      return [];
    }
  }

  /**
   * 프로젝트 통계 계산
   * @param {String} userId - 사용자 ID
   * @param {Object} query - 쿼리 조건
   * @returns {Object} 통계 정보
   */
  async calculateProjectStats(userId, query) {
    try {
      const stats = await Project.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            overdueProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        overdueProjects: 0
      };
    } catch (error) {
      logger.error('프로젝트 통계 계산 실패:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        overdueProjects: 0
      };
    }
  }

  /**
   * 프로젝트 알림 발송
   * @param {Object} project - 프로젝트 객체
   * @param {String} type - 알림 타입
   * @param {String} userId - 발송자 ID
   * @param {String} userName - 발송자 이름
   * @param {Object} additionalData - 추가 데이터
   */
  async sendProjectNotification(project, type, userId, userName, additionalData = {}) {
    try {
      const recipients = project.members
        .filter(member => member.userId.toString() !== userId)
        .map(member => member.userId);

      if (recipients.length === 0) return;

      const notification = new Notification({
        title: this.getNotificationTitle(type, project.title),
        message: this.getNotificationMessage(type, userName, project.title, additionalData),
        type,
        category: 'project',
        recipients: recipients.map(recipientId => ({
          userId: recipientId,
          userName: 'User' // 실제 사용자 이름은 별도 조회 필요
        })),
        sender: {
          userId,
          userName,
          isSystem: false
        },
        relatedResource: {
          type: 'project',
          id: project._id,
          title: project.title
        },
        organization: project.organization,
        team: project.team,
        priority: this.getNotificationPriority(type)
      });

      await notification.save();
      await notification.send();

    } catch (error) {
      logger.error('프로젝트 알림 발송 실패:', error);
    }
  }

  /**
   * 사용자 알림 발송
   * @param {String} userId - 사용자 ID
   * @param {Object} notificationData - 알림 데이터
   */
  async sendUserNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        category: 'project',
        recipients: [{
          userId,
          userName: 'User'
        }],
        sender: {
          isSystem: true
        },
        relatedResource: notificationData.data,
        priority: 'normal'
      });

      await notification.save();
      await notification.send();

    } catch (error) {
      logger.error('사용자 알림 발송 실패:', error);
    }
  }

  /**
   * 알림 제목 생성
   * @param {String} type - 알림 타입
   * @param {String} projectTitle - 프로젝트 제목
   * @returns {String} 알림 제목
   */
  getNotificationTitle(type, projectTitle) {
    const titles = {
      project_created: '새 프로젝트 생성',
      project_updated: '프로젝트 수정',
      project_deleted: '프로젝트 삭제',
      project_status_changed: '프로젝트 상태 변경',
      project_invitation: '프로젝트 초대',
      project_removed: '프로젝트에서 제거됨'
    };

    return titles[type] || '프로젝트 알림';
  }

  /**
   * 알림 메시지 생성
   * @param {String} type - 알림 타입
   * @param {String} userName - 사용자 이름
   * @param {String} projectTitle - 프로젝트 제목
   * @param {Object} additionalData - 추가 데이터
   * @returns {String} 알림 메시지
   */
  getNotificationMessage(type, userName, projectTitle, additionalData = {}) {
    const messages = {
      project_created: `${userName}님이 프로젝트 "${projectTitle}"를 생성했습니다.`,
      project_updated: `${userName}님이 프로젝트 "${projectTitle}"를 수정했습니다.`,
      project_deleted: `${userName}님이 프로젝트 "${projectTitle}"를 삭제했습니다.`,
      project_status_changed: `${userName}님이 프로젝트 "${projectTitle}"의 상태를 ${additionalData.oldStatus}에서 ${additionalData.newStatus}로 변경했습니다.`,
      project_invitation: `${userName}님이 프로젝트 "${projectTitle}"에 초대했습니다.`,
      project_removed: `${userName}님이 프로젝트 "${projectTitle}"에서 제거했습니다.`
    };

    return messages[type] || '프로젝트 관련 알림이 있습니다.';
  }

  /**
   * 알림 우선순위 결정
   * @param {String} type - 알림 타입
   * @returns {String} 우선순위
   */
  getNotificationPriority(type) {
    const priorities = {
      project_deleted: 'high',
      project_status_changed: 'normal',
      project_invitation: 'normal',
      project_removed: 'normal',
      project_created: 'low',
      project_updated: 'low'
    };

    return priorities[type] || 'normal';
  }
}

// 서비스 인스턴스 생성 및 내보내기
const projectService = new ProjectService();

export default projectService; 