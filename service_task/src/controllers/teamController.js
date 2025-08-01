/**
 * Team Controller - 팀 컨트롤러
 * 팀 관리 API 엔드포인트 처리
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import teamService from '../services/teamService.js';

/**
 * 팀 컨트롤러 클래스
 */
class TeamController {
  /**
   * 팀 생성
   */
  async createTeam(req, res) {
    try {
      const teamData = req.body;
      const { organizationId } = req.params;
      const creatorId = req.user._id;

      const team = await teamService.createTeam(
        teamData,
        creatorId,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: { team },
        message: '팀이 성공적으로 생성되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 팀 생성 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀을 생성할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 목록 조회
   */
  async getTeams(req, res) {
    try {
      const filters = req.query;
      const result = await teamService.getTeams(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 팀 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '팀 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 상세 조회
   */
  async getTeamById(req, res) {
    try {
      const { teamId } = req.params;
      const team = await teamService.getTeamById(teamId);

      res.json({
        success: true,
        data: { team }
      });

    } catch (error) {
      logger.error('❌ 팀 상세 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '팀을 찾을 수 없습니다.'
      });
    }
  }

  /**
   * 팀 수정
   */
  async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const team = await teamService.updateTeam(
        teamId,
        updateData,
        userId
      );

      res.json({
        success: true,
        data: { team },
        message: '팀이 성공적으로 수정되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 팀 수정 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀을 수정할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 삭제
   */
  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;
      const userId = req.user._id;

      const result = await teamService.deleteTeam(
        teamId,
        userId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 팀 삭제 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀을 삭제할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 멤버 추가
   */
  async addMember(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, role } = req.body;
      const addedBy = req.user._id;

      const result = await teamService.addMember(
        teamId,
        userId,
        role,
        addedBy
      );

      res.status(201).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 팀 멤버 추가 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀 멤버를 추가할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 멤버 제거
   */
  async removeMember(req, res) {
    try {
      const { teamId, userId } = req.params;
      const removerId = req.user._id;

      const result = await teamService.removeMember(
        teamId,
        userId,
        removerId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 팀 멤버 제거 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀 멤버를 제거할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 멤버 역할 변경
   */
  async updateMemberRole(req, res) {
    try {
      const { teamId, userId } = req.params;
      const { role } = req.body;
      const updaterId = req.user._id;

      const result = await teamService.updateMemberRole(
        teamId,
        userId,
        role,
        updaterId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 팀 멤버 역할 변경 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '팀 멤버 역할을 변경할 수 없습니다.'
      });
    }
  }

  /**
   * 사용자가 속한 팀 목록 조회
   */
  async getUserTeams(req, res) {
    try {
      const userId = req.user._id;
      const teams = await teamService.getUserTeams(userId);

      res.json({
        success: true,
        data: { teams }
      });

    } catch (error) {
      logger.error('❌ 사용자 팀 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '팀 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 팀 통계 조회
   */
  async getTeamStatistics(req, res) {
    try {
      const { teamId } = req.params;
      const statistics = await teamService.getTeamStatistics(teamId);

      res.json({
        success: true,
        data: { statistics }
      });

    } catch (error) {
      logger.error('❌ 팀 통계 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '팀 통계를 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 조직의 모든 팀 조회
   */
  async getOrganizationTeams(req, res) {
    try {
      const { organizationId } = req.params;
      const teams = await teamService.getOrganizationTeams(organizationId);

      res.json({
        success: true,
        data: { teams }
      });

    } catch (error) {
      logger.error('❌ 조직 팀 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '조직의 팀 목록을 조회할 수 없습니다.'
      });
    }
  }
}

const teamController = new TeamController();
export default teamController; 