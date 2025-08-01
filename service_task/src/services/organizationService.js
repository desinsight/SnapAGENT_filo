/**
 * Organization Service - 조직 서비스
 * 조직 관리 비즈니스 로직
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';

class OrganizationService {
  /**
   * 조직 생성
   */
  async createOrganization(organizationData, creatorId) {
    try {
      const organization = new Organization({
        ...organizationData,
        createdBy: creatorId,
        members: [{
          userId: creatorId,
          role: 'owner',
          joinedAt: new Date(),
          status: 'active'
        }]
      });

      await organization.save();

      logger.info(`🏢 조직 생성: ${organization.name} (${creatorId})`);
      return organization;

    } catch (error) {
      logger.error('❌ 조직 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 목록 조회
   */
  async getOrganizations(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20, sort = '-createdAt', search, status } = filters;
      
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const total = await Organization.countDocuments(query);
      
      const organizations = await Organization.find(query)
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      return {
        organizations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ 조직 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 상세 조회
   */
  async getOrganizationById(organizationId) {
    try {
      const organization = await Organization.findById(organizationId)
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .populate('teams', 'name description memberCount');

      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      return organization;

    } catch (error) {
      logger.error('❌ 조직 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 수정
   */
  async updateOrganization(organizationId, updateData, userId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 권한 확인 (소유자 또는 관리자만 수정 가능)
      const member = organization.members.find(m => m.userId.toString() === userId);
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('조직을 수정할 권한이 없습니다.');
      }

      const updatedOrganization = await Organization.findByIdAndUpdate(
        organizationId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email avatar')
       .populate('members.userId', 'name email avatar');

      logger.info(`✏️ 조직 수정: ${organizationId} (${userId})`);
      return updatedOrganization;

    } catch (error) {
      logger.error('❌ 조직 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 삭제
   */
  async deleteOrganization(organizationId, userId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 권한 확인 (소유자만 삭제 가능)
      const member = organization.members.find(m => m.userId.toString() === userId);
      if (!member || member.role !== 'owner') {
        throw new Error('조직을 삭제할 권한이 없습니다.');
      }

      await Organization.findByIdAndDelete(organizationId);

      logger.info(`🗑️ 조직 삭제: ${organizationId} (${userId})`);
      return { success: true, message: '조직이 성공적으로 삭제되었습니다.' };

    } catch (error) {
      logger.error('❌ 조직 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 멤버 초대
   */
  async inviteMember(organizationId, inviteData, inviterId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 권한 확인 (소유자 또는 관리자만 초대 가능)
      const member = organization.members.find(m => m.userId.toString() === inviterId);
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('멤버를 초대할 권한이 없습니다.');
      }

      const { email, role = 'member' } = inviteData;

      // 이미 멤버인지 확인
      const existingMember = organization.members.find(m => 
        m.userId && m.userId.toString() === email
      );
      if (existingMember) {
        throw new Error('이미 조직의 멤버입니다.');
      }

      // 초대 추가
      organization.invitations.push({
        email,
        role,
        invitedBy: inviterId,
        invitedAt: new Date(),
        status: 'pending'
      });

      await organization.save();

      logger.info(`📧 조직 멤버 초대: ${organizationId} -> ${email} (${inviterId})`);
      return { success: true, message: '초대가 성공적으로 발송되었습니다.' };

    } catch (error) {
      logger.error('❌ 조직 멤버 초대 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 멤버 추가
   */
  async addMember(organizationId, userId, role = 'member', addedBy) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 이미 멤버인지 확인
      const existingMember = organization.members.find(m => 
        m.userId.toString() === userId
      );
      if (existingMember) {
        throw new Error('이미 조직의 멤버입니다.');
      }

      // 멤버 추가
      organization.members.push({
        userId,
        role,
        joinedAt: new Date(),
        status: 'active',
        addedBy
      });

      await organization.save();

      logger.info(`👤 조직 멤버 추가: ${organizationId} -> ${userId} (${addedBy})`);
      return { success: true, message: '멤버가 성공적으로 추가되었습니다.' };

    } catch (error) {
      logger.error('❌ 조직 멤버 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 멤버 제거
   */
  async removeMember(organizationId, userId, removerId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 권한 확인 (소유자 또는 관리자만 제거 가능)
      const remover = organization.members.find(m => m.userId.toString() === removerId);
      if (!remover || !['owner', 'admin'].includes(remover.role)) {
        throw new Error('멤버를 제거할 권한이 없습니다.');
      }

      // 자기 자신을 제거하려는 경우 소유자는 제거 불가
      const targetMember = organization.members.find(m => m.userId.toString() === userId);
      if (targetMember && targetMember.role === 'owner' && userId === removerId) {
        throw new Error('조직 소유자는 자신을 제거할 수 없습니다.');
      }

      // 멤버 제거
      organization.members = organization.members.filter(m => 
        m.userId.toString() !== userId
      );

      await organization.save();

      logger.info(`👤 조직 멤버 제거: ${organizationId} -> ${userId} (${removerId})`);
      return { success: true, message: '멤버가 성공적으로 제거되었습니다.' };

    } catch (error) {
      logger.error('❌ 조직 멤버 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 멤버 역할 변경
   */
  async updateMemberRole(organizationId, userId, newRole, updaterId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 권한 확인 (소유자만 역할 변경 가능)
      const updater = organization.members.find(m => m.userId.toString() === updaterId);
      if (!updater || updater.role !== 'owner') {
        throw new Error('멤버 역할을 변경할 권한이 없습니다.');
      }

      const member = organization.members.find(m => m.userId.toString() === userId);
      if (!member) {
        throw new Error('멤버를 찾을 수 없습니다.');
      }

      // 소유자 역할을 변경하려는 경우
      if (member.role === 'owner' && newRole !== 'owner') {
        throw new Error('조직 소유자의 역할을 변경할 수 없습니다.');
      }

      member.role = newRole;
      member.updatedAt = new Date();

      await organization.save();

      logger.info(`🔄 조직 멤버 역할 변경: ${organizationId} -> ${userId} (${newRole})`);
      return { success: true, message: '멤버 역할이 성공적으로 변경되었습니다.' };

    } catch (error) {
      logger.error('❌ 조직 멤버 역할 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자가 속한 조직 목록 조회
   */
  async getUserOrganizations(userId) {
    try {
      const organizations = await Organization.find({
        'members.userId': userId,
        'members.status': 'active'
      }).populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .sort('-createdAt');

      return organizations;

    } catch (error) {
      logger.error('❌ 사용자 조직 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조직 통계 조회
   */
  async getOrganizationStatistics(organizationId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      const memberCount = organization.members.length;
      const activeMemberCount = organization.members.filter(m => m.status === 'active').length;
      const teamCount = organization.teams ? organization.teams.length : 0;

      return {
        memberCount,
        activeMemberCount,
        teamCount,
        createdAt: organization.createdAt,
        status: organization.status
      };

    } catch (error) {
      logger.error('❌ 조직 통계 조회 실패:', error);
      throw error;
    }
  }
}

const organizationService = new OrganizationService();
export default organizationService; 