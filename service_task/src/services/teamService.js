/**
 * Team Service - 팀 서비스
 * 팀 관리 비즈니스 로직
 *
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Team from '../models/Team.js';
import Organization from '../models/Organization.js';

class TeamService {
  /**
   * 팀 생성
   */
  async createTeam(teamData, creatorId, organizationId) {
    try {
      // 조직 존재 확인
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('조직을 찾을 수 없습니다.');
      }

      // 조직 멤버 권한 확인
      const member = organization.members.find(m => m.userId.toString() === creatorId);
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('팀을 생성할 권한이 없습니다.');
      }

      const team = new Team({
        ...teamData,
        organizationId,
        createdBy: creatorId,
        members: [{
          userId: creatorId,
          role: 'leader',
          joinedAt: new Date(),
          status: 'active'
        }]
      });

      await team.save();

      // 조직에 팀 추가
      organization.teams.push(team._id);
      await organization.save();

      logger.info(`👥 팀 생성: ${team.name} (${organizationId})`);
      return team;

    } catch (error) {
      logger.error('❌ 팀 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 목록 조회
   */
  async getTeams(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20, sort = '-createdAt', search, organizationId, status } = filters;
      
      const query = {};
      
      if (organizationId) {
        query.organizationId = organizationId;
      }
      
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
      const total = await Team.countDocuments(query);
      
      const teams = await Team.find(query)
        .populate('organizationId', 'name')
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      return {
        teams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('❌ 팀 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 상세 조회
   */
  async getTeamById(teamId) {
    try {
      const team = await Team.findById(teamId)
        .populate('organizationId', 'name')
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .populate('projects', 'name description status');

      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      return team;

    } catch (error) {
      logger.error('❌ 팀 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 수정
   */
  async updateTeam(teamId, updateData, userId) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      // 권한 확인 (팀 리더 또는 조직 관리자만 수정 가능)
      const member = team.members.find(m => m.userId.toString() === userId);
      if (!member || !['leader', 'admin'].includes(member.role)) {
        throw new Error('팀을 수정할 권한이 없습니다.');
      }

      const updatedTeam = await Team.findByIdAndUpdate(
        teamId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('organizationId', 'name')
       .populate('createdBy', 'name email avatar')
       .populate('members.userId', 'name email avatar');

      logger.info(`✏️ 팀 수정: ${teamId} (${userId})`);
      return updatedTeam;

    } catch (error) {
      logger.error('❌ 팀 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 삭제
   */
  async deleteTeam(teamId, userId) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      // 권한 확인 (팀 리더만 삭제 가능)
      const member = team.members.find(m => m.userId.toString() === userId);
      if (!member || member.role !== 'leader') {
        throw new Error('팀을 삭제할 권한이 없습니다.');
      }

      // 조직에서 팀 제거
      const organization = await Organization.findById(team.organizationId);
      if (organization) {
        organization.teams = organization.teams.filter(t => t.toString() !== teamId);
        await organization.save();
      }

      await Team.findByIdAndDelete(teamId);

      logger.info(`🗑️ 팀 삭제: ${teamId} (${userId})`);
      return { success: true, message: '팀이 성공적으로 삭제되었습니다.' };

    } catch (error) {
      logger.error('❌ 팀 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 멤버 추가
   */
  async addMember(teamId, userId, role = 'member', addedBy) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      // 권한 확인 (팀 리더만 멤버 추가 가능)
      const adder = team.members.find(m => m.userId.toString() === addedBy);
      if (!adder || adder.role !== 'leader') {
        throw new Error('팀 멤버를 추가할 권한이 없습니다.');
      }

      // 이미 멤버인지 확인
      const existingMember = team.members.find(m => 
        m.userId.toString() === userId
      );
      if (existingMember) {
        throw new Error('이미 팀의 멤버입니다.');
      }

      // 조직 멤버인지 확인
      const organization = await Organization.findById(team.organizationId);
      const orgMember = organization.members.find(m => m.userId.toString() === userId);
      if (!orgMember) {
        throw new Error('조직의 멤버만 팀에 추가할 수 있습니다.');
      }

      // 멤버 추가
      team.members.push({
        userId,
        role,
        joinedAt: new Date(),
        status: 'active',
        addedBy
      });

      await team.save();

      logger.info(`👤 팀 멤버 추가: ${teamId} -> ${userId} (${addedBy})`);
      return { success: true, message: '멤버가 성공적으로 추가되었습니다.' };

    } catch (error) {
      logger.error('❌ 팀 멤버 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 멤버 제거
   */
  async removeMember(teamId, userId, removerId) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      // 권한 확인 (팀 리더만 멤버 제거 가능)
      const remover = team.members.find(m => m.userId.toString() === removerId);
      if (!remover || remover.role !== 'leader') {
        throw new Error('팀 멤버를 제거할 권한이 없습니다.');
      }

      // 자기 자신을 제거하려는 경우 리더는 제거 불가
      const targetMember = team.members.find(m => m.userId.toString() === userId);
      if (targetMember && targetMember.role === 'leader' && userId === removerId) {
        throw new Error('팀 리더는 자신을 제거할 수 없습니다.');
      }

      // 멤버 제거
      team.members = team.members.filter(m => 
        m.userId.toString() !== userId
      );

      await team.save();

      logger.info(`👤 팀 멤버 제거: ${teamId} -> ${userId} (${removerId})`);
      return { success: true, message: '멤버가 성공적으로 제거되었습니다.' };

    } catch (error) {
      logger.error('❌ 팀 멤버 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 멤버 역할 변경
   */
  async updateMemberRole(teamId, userId, newRole, updaterId) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      // 권한 확인 (팀 리더만 역할 변경 가능)
      const updater = team.members.find(m => m.userId.toString() === updaterId);
      if (!updater || updater.role !== 'leader') {
        throw new Error('팀 멤버 역할을 변경할 권한이 없습니다.');
      }

      const member = team.members.find(m => m.userId.toString() === userId);
      if (!member) {
        throw new Error('팀 멤버를 찾을 수 없습니다.');
      }

      // 리더 역할을 변경하려는 경우
      if (member.role === 'leader' && newRole !== 'leader') {
        throw new Error('팀 리더의 역할을 변경할 수 없습니다.');
      }

      member.role = newRole;
      member.updatedAt = new Date();

      await team.save();

      logger.info(`🔄 팀 멤버 역할 변경: ${teamId} -> ${userId} (${newRole})`);
      return { success: true, message: '멤버 역할이 성공적으로 변경되었습니다.' };

    } catch (error) {
      logger.error('❌ 팀 멤버 역할 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자가 속한 팀 목록 조회
   */
  async getUserTeams(userId) {
    try {
      const teams = await Team.find({
        'members.userId': userId,
        'members.status': 'active'
      }).populate('organizationId', 'name')
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .sort('-createdAt');

      return teams;

    } catch (error) {
      logger.error('❌ 사용자 팀 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 팀 통계 조회
   */
  async getTeamStatistics(teamId) {
    try {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('팀을 찾을 수 없습니다.');
      }

      const memberCount = team.members.length;
      const activeMemberCount = team.members.filter(m => m.status === 'active').length;
      const projectCount = team.projects ? team.projects.length : 0;

      return {
        memberCount,
        activeMemberCount,
        projectCount,
        createdAt: team.createdAt,
        status: team.status
      };

    } catch (error) {
      logger.error('❌ 팀 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조직의 모든 팀 조회
   */
  async getOrganizationTeams(organizationId) {
    try {
      const teams = await Team.find({ organizationId })
        .populate('createdBy', 'name email avatar')
        .populate('members.userId', 'name email avatar')
        .sort('-createdAt');

      return teams;

    } catch (error) {
      logger.error('❌ 조직 팀 목록 조회 실패:', error);
      throw error;
    }
  }
}

const teamService = new TeamService();
export default teamService; 