/**
 * Organization Controller - 조직 컨트롤러
 * 조직 관리 API 엔드포인트 처리
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import organizationService from '../services/organizationService.js';

/**
 * 조직 컨트롤러 클래스
 */
class OrganizationController {
  /**
   * 조직 생성
   */
  async createOrganization(req, res) {
    try {
      const organizationData = req.body;
      const creatorId = req.user._id;

      const organization = await organizationService.createOrganization(
        organizationData,
        creatorId
      );

      res.status(201).json({
        success: true,
        data: { organization },
        message: '조직이 성공적으로 생성되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 조직 생성 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '조직을 생성할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 목록 조회
   */
  async getOrganizations(req, res) {
    try {
      const filters = req.query;
      const result = await organizationService.getOrganizations(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('❌ 조직 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '조직 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 상세 조회
   */
  async getOrganizationById(req, res) {
    try {
      const { organizationId } = req.params;
      const organization = await organizationService.getOrganizationById(organizationId);

      res.json({
        success: true,
        data: { organization }
      });

    } catch (error) {
      logger.error('❌ 조직 상세 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '조직을 찾을 수 없습니다.'
      });
    }
  }

  /**
   * 조직 수정
   */
  async updateOrganization(req, res) {
    try {
      const { organizationId } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const organization = await organizationService.updateOrganization(
        organizationId,
        updateData,
        userId
      );

      res.json({
        success: true,
        data: { organization },
        message: '조직이 성공적으로 수정되었습니다.'
      });

    } catch (error) {
      logger.error('❌ 조직 수정 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '조직을 수정할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 삭제
   */
  async deleteOrganization(req, res) {
    try {
      const { organizationId } = req.params;
      const userId = req.user._id;

      const result = await organizationService.deleteOrganization(
        organizationId,
        userId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 조직 삭제 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '조직을 삭제할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 멤버 초대
   */
  async inviteMember(req, res) {
    try {
      const { organizationId } = req.params;
      const inviteData = req.body;
      const inviterId = req.user._id;

      const result = await organizationService.inviteMember(
        organizationId,
        inviteData,
        inviterId
      );

      res.status(201).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 조직 멤버 초대 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '멤버를 초대할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 멤버 추가
   */
  async addMember(req, res) {
    try {
      const { organizationId } = req.params;
      const { userId, role } = req.body;
      const addedBy = req.user._id;

      const result = await organizationService.addMember(
        organizationId,
        userId,
        role,
        addedBy
      );

      res.status(201).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 조직 멤버 추가 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '멤버를 추가할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 멤버 제거
   */
  async removeMember(req, res) {
    try {
      const { organizationId, userId } = req.params;
      const removerId = req.user._id;

      const result = await organizationService.removeMember(
        organizationId,
        userId,
        removerId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 조직 멤버 제거 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '멤버를 제거할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 멤버 역할 변경
   */
  async updateMemberRole(req, res) {
    try {
      const { organizationId, userId } = req.params;
      const { role } = req.body;
      const updaterId = req.user._id;

      const result = await organizationService.updateMemberRole(
        organizationId,
        userId,
        role,
        updaterId
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('❌ 조직 멤버 역할 변경 컨트롤러 실패:', error);
      res.status(400).json({
        success: false,
        message: error.message || '멤버 역할을 변경할 수 없습니다.'
      });
    }
  }

  /**
   * 사용자가 속한 조직 목록 조회
   */
  async getUserOrganizations(req, res) {
    try {
      const userId = req.user._id;
      const organizations = await organizationService.getUserOrganizations(userId);

      res.json({
        success: true,
        data: { organizations }
      });

    } catch (error) {
      logger.error('❌ 사용자 조직 목록 조회 컨트롤러 실패:', error);
      res.status(500).json({
        success: false,
        message: '조직 목록을 조회할 수 없습니다.'
      });
    }
  }

  /**
   * 조직 통계 조회
   */
  async getOrganizationStatistics(req, res) {
    try {
      const { organizationId } = req.params;
      const statistics = await organizationService.getOrganizationStatistics(organizationId);

      res.json({
        success: true,
        data: { statistics }
      });

    } catch (error) {
      logger.error('❌ 조직 통계 조회 컨트롤러 실패:', error);
      res.status(404).json({
        success: false,
        message: error.message || '조직 통계를 조회할 수 없습니다.'
      });
    }
  }
}

const organizationController = new OrganizationController();
export default organizationController; 