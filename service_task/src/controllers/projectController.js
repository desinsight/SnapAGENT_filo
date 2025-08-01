/**
 * Project Controller - 프로젝트 컨트롤러
 * 프로젝트 관리 API를 처리하는 컨트롤러
 * 
 * @description
 * - 프로젝트 CRUD API
 * - 프로젝트 멤버 관리
 * - 권한 및 접근 제어
 * - 프로젝트 통계 및 분석
 * - 활동 로그 및 감사
 * - 확장성을 고려한 모듈화된 설계
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
import projectService from '../services/projectService.js';

/**
 * 프로젝트 컨트롤러 클래스
 * 프로젝트 관련 API 엔드포인트를 처리
 */
class ProjectController {
  /**
   * 프로젝트 목록 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getProjects(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = '-createdAt',
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
      } = req.query;

      // 서비스 호출
      const result = await projectService.getProjects({
        userId: req.user._id,
        filters: {
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
          includeArchived
        },
        options: {
          page: parseInt(page),
          limit: parseInt(limit),
          sort
        }
      });

      logger.info(`📋 프로젝트 목록 조회: ${req.user.name} (${result.data.projects.length}개)`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 목록을 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 상세 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getProject(req, res) {
    try {
      const { projectId } = req.params;
      const { includeTasks = true, includeMembers = true, includeStats = true } = req.query;

      // 서비스 호출
      const result = await projectService.getProject({
        projectId,
        userId: req.user._id,
        options: {
          includeTasks,
          includeMembers,
          includeStats
        }
      });

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      logger.info(`📋 프로젝트 상세 조회: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 상세 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 생성
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async createProject(req, res) {
    try {
      const projectData = {
        ...req.body,
        createdBy: req.user._id,
        owner: req.user._id
      };

      // 서비스 호출
      const result = await projectService.createProject({
        projectData,
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`📋 프로젝트 생성: ${req.user.name} -> ${result.data.project.title}`);
      res.status(201).json(result);

    } catch (error) {
      logger.error('프로젝트 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 생성할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 수정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const updateData = req.body;

      // 서비스 호출
      const result = await projectService.updateProject({
        projectId,
        updateData,
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`✏️ 프로젝트 수정: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 수정할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 삭제
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async deleteProject(req, res) {
    try {
      const { projectId } = req.params;
      const { force = false } = req.query;

      // 서비스 호출
      const result = await projectService.deleteProject({
        projectId,
        userId: req.user._id,
        userName: req.user.name,
        force: force === 'true'
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`🗑️ 프로젝트 삭제: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 삭제 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 삭제할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 상태 변경
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateProjectStatus(req, res) {
    try {
      const { projectId } = req.params;
      const { status, reason } = req.body;

      // 서비스 호출
      const result = await projectService.updateProjectStatus({
        projectId,
        status,
        reason,
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`🔄 프로젝트 상태 변경: ${req.user.name} -> ${projectId} (${status})`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 상태 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 상태를 변경할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 멤버 추가
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async addProjectMember(req, res) {
    try {
      const { projectId } = req.params;
      const { userId, role, permissions } = req.body;

      // 서비스 호출
      const result = await projectService.addProjectMember({
        projectId,
        userId,
        role,
        permissions,
        addedBy: req.user._id,
        addedByName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`👥 프로젝트 멤버 추가: ${req.user.name} -> ${projectId} (${userId})`);
      res.status(201).json(result);

    } catch (error) {
      logger.error('프로젝트 멤버 추가 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 멤버를 추가할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 멤버 제거
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async removeProjectMember(req, res) {
    try {
      const { projectId, userId } = req.params;
      const { reason } = req.body;

      // 서비스 호출
      const result = await projectService.removeProjectMember({
        projectId,
        userId,
        reason,
        removedBy: req.user._id,
        removedByName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`👥 프로젝트 멤버 제거: ${req.user.name} -> ${projectId} (${userId})`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 멤버 제거 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 멤버를 제거할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 멤버 권한 변경
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateProjectMemberRole(req, res) {
    try {
      const { projectId, userId } = req.params;
      const { role, permissions } = req.body;

      // 서비스 호출
      const result = await projectService.updateProjectMemberRole({
        projectId,
        userId,
        role,
        permissions,
        updatedBy: req.user._id,
        updatedByName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`👥 프로젝트 멤버 권한 변경: ${req.user.name} -> ${projectId} (${userId})`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 멤버 권한 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 멤버 권한을 변경할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 통계 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getProjectStats(req, res) {
    try {
      const { projectId } = req.params;
      const { period = 'all', startDate, endDate } = req.query;

      // 서비스 호출
      const result = await projectService.getProjectStats({
        projectId,
        userId: req.user._id,
        period,
        startDate,
        endDate
      });

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      logger.info(`📊 프로젝트 통계 조회: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 통계를 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 활동 로그 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getProjectActivityLog(req, res) {
    try {
      const { projectId } = req.params;
      const { 
        page = 1, 
        limit = 50, 
        action,
        userId,
        startDate,
        endDate,
        sort = '-timestamp'
      } = req.query;

      // 서비스 호출
      const result = await projectService.getProjectActivityLog({
        projectId,
        userId: req.user._id,
        filters: {
          action,
          userId,
          startDate,
          endDate
        },
        options: {
          page: parseInt(page),
          limit: parseInt(limit),
          sort
        }
      });

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      logger.info(`📝 프로젝트 활동 로그 조회: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 활동 로그 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 활동 로그를 조회할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 복사
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async copyProject(req, res) {
    try {
      const { projectId } = req.params;
      const { 
        title, 
        description, 
        includeTasks = true, 
        includeMembers = false,
        includeSettings = true 
      } = req.body;

      // 서비스 호출
      const result = await projectService.copyProject({
        projectId,
        newData: {
          title,
          description
        },
        options: {
          includeTasks,
          includeMembers,
          includeSettings
        },
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`📋 프로젝트 복사: ${req.user.name} -> ${projectId}`);
      res.status(201).json(result);

    } catch (error) {
      logger.error('프로젝트 복사 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 복사할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 아카이브/복원
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async toggleProjectArchive(req, res) {
    try {
      const { projectId } = req.params;
      const { action, reason } = req.body; // action: 'archive' | 'restore'

      // 서비스 호출
      const result = await projectService.toggleProjectArchive({
        projectId,
        action,
        reason,
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`📦 프로젝트 ${action}: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 아카이브/복원 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 상태를 변경할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 템플릿으로 저장
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async saveAsTemplate(req, res) {
    try {
      const { projectId } = req.params;
      const { 
        templateName, 
        templateDescription, 
        category,
        tags,
        isPublic = false 
      } = req.body;

      // 서비스 호출
      const result = await projectService.saveAsTemplate({
        projectId,
        templateData: {
          name: templateName,
          description: templateDescription,
          category,
          tags,
          isPublic
        },
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`📋 프로젝트 템플릿 저장: ${req.user.name} -> ${projectId}`);
      res.status(201).json(result);

    } catch (error) {
      logger.error('프로젝트 템플릿 저장 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트를 템플릿으로 저장할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 공유 설정
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async updateProjectSharing(req, res) {
    try {
      const { projectId } = req.params;
      const { 
        visibility, 
        allowGuestAccess, 
        guestPermissions,
        shareLink,
        password 
      } = req.body;

      // 서비스 호출
      const result = await projectService.updateProjectSharing({
        projectId,
        sharingSettings: {
          visibility,
          allowGuestAccess,
          guestPermissions,
          shareLink,
          password
        },
        userId: req.user._id,
        userName: req.user.name
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      logger.info(`🔗 프로젝트 공유 설정 변경: ${req.user.name} -> ${projectId}`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 공유 설정 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 공유 설정을 변경할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 프로젝트 검색
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async searchProjects(req, res) {
    try {
      const { 
        q, 
        page = 1, 
        limit = 20, 
        filters = {},
        sort = 'relevance'
      } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '검색어는 필수입니다.'
        });
      }

      // 서비스 호출
      const result = await projectService.searchProjects({
        query: q.trim(),
        userId: req.user._id,
        filters: JSON.parse(filters || '{}'),
        options: {
          page: parseInt(page),
          limit: parseInt(limit),
          sort
        }
      });

      logger.info(`🔍 프로젝트 검색: ${req.user.name} -> "${q}" (${result.data.projects.length}개)`);
      res.json(result);

    } catch (error) {
      logger.error('프로젝트 검색 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로젝트 검색을 수행할 수 없습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// 컨트롤러 인스턴스 생성 및 내보내기
const projectController = new ProjectController();

export default projectController; 