const Calendar = require('../models/Calendar');
const crypto = require('crypto');
const logger = require('../utils/logger');
const response = require('../utils/response');

/**
 * 공유 캘린더 및 권한 관리 서비스
 * 캘린더 공유, 권한 관리, 접근 제어 기능 제공
 */
class SharingService {
  /**
   * 캘린더 공유 (권한 부여)
   * @param {string} calendarId - 캘린더 ID
   * @param {string} ownerId - 소유자 ID
   * @param {string} userId - 공유할 사용자 ID
   * @param {string} role - 권한 (reader, writer, admin)
   * @returns {Object} 공유 결과
   */
  async shareCalendar(calendarId, ownerId, userId, role = 'reader') {
    try {
      const calendar = await Calendar.findById(calendarId);
      
      if (!calendar) {
        throw new Error('캘린더를 찾을 수 없습니다.');
      }
      
      // 소유자 확인
      if (calendar.owner.toString() !== ownerId) {
        throw new Error('캘린더 공유 권한이 없습니다.');
      }
      
      // 이미 공유된 사용자인지 확인
      const existingShare = calendar.sharedWith.find(
        share => share.userId.toString() === userId
      );
      
      if (existingShare) {
        // 기존 권한 업데이트
        existingShare.role = role;
        existingShare.updatedAt = new Date();
      } else {
        // 새로운 공유 추가
        calendar.sharedWith.push({
          userId,
          role,
          sharedAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await calendar.save();
      
      return {
        success: true,
        message: '캘린더가 성공적으로 공유되었습니다.',
        data: {
          calendarId,
          userId,
          role,
          sharedAt: new Date()
        }
      };
    } catch (error) {
      console.error('캘린더 공유 오류:', error);
      throw error;
    }
  }

  /**
   * 캘린더 공유 해제 (권한 회수)
   * @param {string} calendarId - 캘린더 ID
   * @param {string} ownerId - 소유자 ID
   * @param {string} userId - 공유 해제할 사용자 ID
   * @returns {Object} 공유 해제 결과
   */
  async unshareCalendar(calendarId, ownerId, userId) {
    try {
      const calendar = await Calendar.findById(calendarId);
      
      if (!calendar) {
        throw new Error('캘린더를 찾을 수 없습니다.');
      }
      
      // 소유자 확인
      if (calendar.owner.toString() !== ownerId) {
        throw new Error('캘린더 공유 해제 권한이 없습니다.');
      }
      
      // 공유된 사용자 찾기
      const shareIndex = calendar.sharedWith.findIndex(
        share => share.userId.toString() === userId
      );
      
      if (shareIndex === -1) {
        throw new Error('공유되지 않은 사용자입니다.');
      }
      
      // 공유 제거
      calendar.sharedWith.splice(shareIndex, 1);
      await calendar.save();
      
      return {
        success: true,
        message: '캘린더 공유가 해제되었습니다.',
        data: {
          calendarId,
          userId,
          unsharedAt: new Date()
        }
      };
    } catch (error) {
      console.error('캘린더 공유 해제 오류:', error);
      throw error;
    }
  }

  /**
   * 공유 권한 변경
   * @param {string} calendarId - 캘린더 ID
   * @param {string} ownerId - 소유자 ID
   * @param {string} userId - 권한 변경할 사용자 ID
   * @param {string} newRole - 새로운 권한
   * @returns {Object} 권한 변경 결과
   */
  async updateShareRole(calendarId, ownerId, userId, newRole) {
    try {
      const calendar = await Calendar.findById(calendarId);
      
      if (!calendar) {
        throw new Error('캘린더를 찾을 수 없습니다.');
      }
      
      // 소유자 확인
      if (calendar.owner.toString() !== ownerId) {
        throw new Error('권한 변경 권한이 없습니다.');
      }
      
      // 공유된 사용자 찾기
      const share = calendar.sharedWith.find(
        share => share.userId.toString() === userId
      );
      
      if (!share) {
        throw new Error('공유되지 않은 사용자입니다.');
      }
      
      // 권한 변경
      share.role = newRole;
      share.updatedAt = new Date();
      await calendar.save();
      
      return {
        success: true,
        message: '공유 권한이 변경되었습니다.',
        data: {
          calendarId,
          userId,
          role: newRole,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('공유 권한 변경 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 권한 확인
   * @param {string} calendarId - 캘린더 ID
   * @param {string} userId - 확인할 사용자 ID
   * @returns {Object} 권한 정보
   */
  async getUserRole(calendarId, userId) {
    try {
      const calendar = await Calendar.findById(calendarId);
      
      if (!calendar) {
        throw new Error('캘린더를 찾을 수 없습니다.');
      }
      
      // 소유자인지 확인
      if (calendar.owner.toString() === userId) {
        return {
          success: true,
          data: {
            role: 'owner',
            permissions: ['read', 'write', 'delete', 'share', 'admin']
          }
        };
      }
      
      // 공유된 사용자인지 확인
      const share = calendar.sharedWith.find(
        share => share.userId.toString() === userId
      );
      
      if (!share) {
        return {
          success: true,
          data: {
            role: 'none',
            permissions: []
          }
        };
      }
      
      // 권한별 허용된 작업 정의
      const permissions = this.getPermissionsByRole(share.role);
      
      return {
        success: true,
        data: {
          role: share.role,
          permissions,
          sharedAt: share.sharedAt,
          updatedAt: share.updatedAt
        }
      };
    } catch (error) {
      console.error('사용자 권한 확인 오류:', error);
      throw error;
    }
  }

  /**
   * 권한별 허용된 작업 반환
   * @param {string} role - 권한
   * @returns {Array} 허용된 작업 목록
   */
  getPermissionsByRole(role) {
    const permissions = {
      reader: ['read'],
      writer: ['read', 'write'],
      admin: ['read', 'write', 'delete', 'share'],
      owner: ['read', 'write', 'delete', 'share', 'admin']
    };
    
    return permissions[role] || [];
  }

  /**
   * 공유된 캘린더 목록 조회
   * @param {string} userId - 사용자 ID
   * @returns {Object} 공유된 캘린더 목록
   */
  async getSharedCalendars(userId) {
    try {
      const calendars = await Calendar.find({
        $or: [
          { owner: userId },
          { 'sharedWith.userId': userId }
        ]
      }).populate('owner', 'name email');
      
      const result = calendars.map(calendar => {
        const isOwner = calendar.owner._id.toString() === userId;
        const share = calendar.sharedWith.find(
          s => s.userId.toString() === userId
        );
        
        return {
          id: calendar._id,
          name: calendar.name,
          color: calendar.color,
          description: calendar.description,
          role: isOwner ? 'owner' : share?.role || 'none',
          permissions: this.getPermissionsByRole(isOwner ? 'owner' : share?.role),
          sharedAt: share?.sharedAt,
          owner: {
            id: calendar.owner._id,
            name: calendar.owner.name,
            email: calendar.owner.email
          }
        };
      });
      
      return {
        success: true,
        data: {
          calendars: result,
          total: result.length
        }
      };
    } catch (error) {
      console.error('공유된 캘린더 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 공유 상태 조회
   * @param {string} calendarId - 캘린더 ID
   * @param {string} userId - 사용자 ID
   * @returns {Object} 공유 상태 정보
   */
  async getSharingStatus(calendarId, userId) {
    try {
      const calendar = await Calendar.findById(calendarId);
      
      if (!calendar) {
        throw new Error('캘린더를 찾을 수 없습니다.');
      }
      
      const isOwner = calendar.owner.toString() === userId;
      const share = calendar.sharedWith.find(
        s => s.userId.toString() === userId
      );
      
      return {
        success: true,
        data: {
          calendarId,
          isOwner,
          role: isOwner ? 'owner' : share?.role || 'none',
          permissions: this.getPermissionsByRole(isOwner ? 'owner' : share?.role),
          sharedWith: calendar.sharedWith.map(s => ({
            userId: s.userId,
            role: s.role,
            sharedAt: s.sharedAt,
            updatedAt: s.updatedAt
          })),
          totalShared: calendar.sharedWith.length
        }
      };
    } catch (error) {
      console.error('공유 상태 조회 오류:', error);
      throw error;
    }
  }
}

// 서비스 인스턴스 생성 및 내보내기
const sharingService = new SharingService();

module.exports = sharingService; 