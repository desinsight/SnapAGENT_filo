/**
 * Utils - 유틸리티 함수들
 * 공통적으로 사용되는 유틸리티 함수들을 모아놓은 모듈
 * 
 * @description
 * - 날짜 및 시간 처리
 * - 권한 검사 함수
 * - 알림 발송 함수
 * - 파일 처리 함수
 * - 데이터 검증 함수
 * - 암호화 및 보안 함수
 * - 확장 가능한 모듈화된 설계
 * 
 * @author Your Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import Notification from '../models/Notification.js';

/**
 * 날짜 및 시간 관련 유틸리티
 */
export const dateUtils = {
  /**
   * 현재 날짜를 ISO 형식으로 반환
   * @returns {string} ISO 형식 날짜 문자열
   */
  getCurrentDate: () => {
    return new Date().toISOString();
  },

  /**
   * 날짜를 포맷팅
   * @param {Date|string} date - 날짜
   * @param {string} format - 포맷 (YYYY-MM-DD, DD/MM/YYYY 등)
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  /**
   * 날짜 차이 계산 (일 단위)
   * @param {Date|string} date1 - 첫 번째 날짜
   * @param {Date|string} date2 - 두 번째 날짜
   * @returns {number} 일 단위 차이
   */
  getDaysDifference: (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * 날짜가 오늘인지 확인
   * @param {Date|string} date - 확인할 날짜
   * @returns {boolean} 오늘 여부
   */
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return dateUtils.formatDate(today) === dateUtils.formatDate(checkDate);
  },

  /**
   * 날짜가 과거인지 확인
   * @param {Date|string} date - 확인할 날짜
   * @returns {boolean} 과거 여부
   */
  isPast: (date) => {
    return new Date(date) < new Date();
  },

  /**
   * 날짜가 미래인지 확인
   * @param {Date|string} date - 확인할 날짜
   * @returns {boolean} 미래 여부
   */
  isFuture: (date) => {
    return new Date(date) > new Date();
  },

  /**
   * 상대적 시간 표시 (예: 2시간 전, 3일 전)
   * @param {Date|string} date - 날짜
   * @returns {string} 상대적 시간 문자열
   */
  getRelativeTime: (date) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}일 전`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 전`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분 전`;
    } else {
      return '방금 전';
    }
  },

  /**
   * 주어진 날짜로부터 특정 기간 후의 날짜 계산
   * @param {Date|string} date - 기준 날짜
   * @param {number} days - 추가할 일수
   * @returns {Date} 계산된 날짜
   */
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * 주어진 날짜로부터 특정 기간 전의 날짜 계산
   * @param {Date|string} date - 기준 날짜
   * @param {number} days - 빼할 일수
   * @returns {Date} 계산된 날짜
   */
  subtractDays: (date, days) => {
    return dateUtils.addDays(date, -days);
  }
};

/**
 * 권한 검사 관련 유틸리티
 */
export const permissionUtils = {
  /**
   * 사용자 권한 확인
   * @param {Array} userPermissions - 사용자 권한 배열
   * @param {string} requiredPermission - 필요한 권한
   * @returns {boolean} 권한 여부
   */
  hasPermission: (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }
    return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
  },

  /**
   * 역할 기반 권한 확인
   * @param {string} userRole - 사용자 역할
   * @param {string} requiredRole - 필요한 역할
   * @returns {boolean} 권한 여부
   */
  hasRole: (userRole, requiredRole) => {
    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  },

  /**
   * 리소스 소유자 확인
   * @param {string} resourceOwnerId - 리소스 소유자 ID
   * @param {string} userId - 확인할 사용자 ID
   * @returns {boolean} 소유자 여부
   */
  isOwner: (resourceOwnerId, userId) => {
    return resourceOwnerId.toString() === userId.toString();
  },

  /**
   * 조직 멤버 확인
   * @param {Object} organization - 조직 객체
   * @param {string} userId - 확인할 사용자 ID
   * @returns {boolean} 멤버 여부
   */
  isOrganizationMember: (organization, userId) => {
    if (!organization || !organization.members) {
      return false;
    }
    return organization.members.some(member => 
      member.userId.toString() === userId.toString()
    );
  },

  /**
   * 팀 멤버 확인
   * @param {Object} team - 팀 객체
   * @param {string} userId - 확인할 사용자 ID
   * @returns {boolean} 멤버 여부
   */
  isTeamMember: (team, userId) => {
    if (!team || !team.members) {
      return false;
    }
    return team.members.some(member => 
      member.userId.toString() === userId.toString()
    );
  }
};

/**
 * 알림 관련 유틸리티
 */
export const notificationUtils = {
  /**
   * 사용자 알림 발송
   * @param {string} userId - 수신자 ID
   * @param {Object} notificationData - 알림 데이터
   * @returns {Promise<Object>} 발송 결과
   */
  sendUserNotification: async (userId, notificationData) => {
    try {
      const notification = new Notification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        category: notificationData.category || 'general',
        recipients: [{
          userId,
          userName: notificationData.userName || 'User'
        }],
        sender: {
          isSystem: true
        },
        relatedResource: notificationData.relatedResource,
        priority: notificationData.priority || 'normal',
        delivery: {
          channels: ['in_app']
        }
      });

      await notification.save();
      await notification.send();

      logger.info(`알림 발송 완료: ${userId} -> ${notificationData.type}`);
      return { success: true, notificationId: notification._id };

    } catch (error) {
      logger.error('알림 발송 실패:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 다중 사용자 알림 발송
   * @param {Array} userIds - 수신자 ID 배열
   * @param {Object} notificationData - 알림 데이터
   * @returns {Promise<Object>} 발송 결과
   */
  sendBulkNotification: async (userIds, notificationData) => {
    try {
      const notifications = userIds.map(userId => ({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        category: notificationData.category || 'general',
        recipients: [{
          userId,
          userName: notificationData.userName || 'User'
        }],
        sender: {
          isSystem: true
        },
        relatedResource: notificationData.relatedResource,
        priority: notificationData.priority || 'normal',
        delivery: {
          channels: ['in_app']
        }
      }));

      const results = await Notification.insertMany(notifications);
      
      // 각 알림 전송
      for (const notification of results) {
        await notification.send();
      }

      logger.info(`다중 알림 발송 완료: ${userIds.length}명 -> ${notificationData.type}`);
      return { success: true, count: results.length };

    } catch (error) {
      logger.error('다중 알림 발송 실패:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 알림 템플릿 생성
   * @param {string} template - 템플릿 문자열
   * @param {Object} variables - 변수 객체
   * @returns {string} 치환된 문자열
   */
  createNotificationMessage: (template, variables = {}) => {
    let message = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, variables[key]);
    });
    return message;
  }
};

/**
 * 파일 처리 관련 유틸리티
 */
export const fileUtils = {
  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 크기
   * @returns {string} 포맷된 크기 문자열
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 파일 확장자 확인
   * @param {string} filename - 파일명
   * @returns {string} 확장자
   */
  getFileExtension: (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  /**
   * 허용된 파일 타입 확인
   * @param {string} filename - 파일명
   * @param {Array} allowedExtensions - 허용된 확장자 배열
   * @returns {boolean} 허용 여부
   */
  isAllowedFileType: (filename, allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']) => {
    const extension = fileUtils.getFileExtension(filename).toLowerCase();
    return allowedExtensions.includes(extension);
  },

  /**
   * 파일명 정리 (특수문자 제거)
   * @param {string} filename - 원본 파일명
   * @returns {string} 정리된 파일명
   */
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  },

  /**
   * 고유 파일명 생성
   * @param {string} originalName - 원본 파일명
   * @returns {string} 고유 파일명
   */
  generateUniqueFilename: (originalName) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileUtils.getFileExtension(originalName);
    const name = originalName.replace(`.${extension}`, '');
    
    return `${name}_${timestamp}_${random}.${extension}`;
  }
};

/**
 * 데이터 검증 관련 유틸리티
 */
export const validationUtils = {
  /**
   * 이메일 형식 검증
   * @param {string} email - 이메일 주소
   * @returns {boolean} 유효성 여부
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * URL 형식 검증
   * @param {string} url - URL
   * @returns {boolean} 유효성 여부
   */
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 전화번호 형식 검증
   * @param {string} phone - 전화번호
   * @returns {boolean} 유효성 여부
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^[0-9-+\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },

  /**
   * 비밀번호 강도 검증
   * @param {string} password - 비밀번호
   * @returns {Object} 검증 결과
   */
  validatePasswordStrength: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`비밀번호는 최소 ${minLength}자 이상이어야 합니다.`);
    }
    if (!hasUpperCase) {
      errors.push('대문자를 포함해야 합니다.');
    }
    if (!hasLowerCase) {
      errors.push('소문자를 포함해야 합니다.');
    }
    if (!hasNumbers) {
      errors.push('숫자를 포함해야 합니다.');
    }
    if (!hasSpecialChar) {
      errors.push('특수문자를 포함해야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    };
  },

  /**
   * MongoDB ObjectId 형식 검증
   * @param {string} id - ID 문자열
   * @returns {boolean} 유효성 여부
   */
  isValidObjectId: (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }
};

/**
 * 암호화 및 보안 관련 유틸리티
 */
export const securityUtils = {
  /**
   * 랜덤 문자열 생성
   * @param {number} length - 길이
   * @returns {string} 랜덤 문자열
   */
  generateRandomString: (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 토큰 생성
   * @param {number} length - 길이
   * @returns {string} 토큰
   */
  generateToken: (length = 64) => {
    return securityUtils.generateRandomString(length);
  },

  /**
   * IP 주소 마스킹
   * @param {string} ip - IP 주소
   * @returns {string} 마스킹된 IP 주소
   */
  maskIpAddress: (ip) => {
    if (!ip) return '';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip;
  },

  /**
   * 민감한 데이터 마스킹
   * @param {string} data - 원본 데이터
   * @param {number} visibleChars - 보여줄 문자 수
   * @returns {string} 마스킹된 데이터
   */
  maskSensitiveData: (data, visibleChars = 4) => {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
  }
};

/**
 * 문자열 처리 관련 유틸리티
 */
export const stringUtils = {
  /**
   * 문자열 자르기
   * @param {string} str - 원본 문자열
   * @param {number} length - 최대 길이
   * @param {string} suffix - 접미사
   * @returns {string} 자른 문자열
   */
  truncate: (str, length = 100, suffix = '...') => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  /**
   * 문자열에서 HTML 태그 제거
   * @param {string} str - 원본 문자열
   * @returns {string} 정리된 문자열
   */
  stripHtml: (str) => {
    return str.replace(/<[^>]*>/g, '');
  },

  /**
   * 문자열에서 특수문자 제거
   * @param {string} str - 원본 문자열
   * @returns {string} 정리된 문자열
   */
  stripSpecialChars: (str) => {
    return str.replace(/[^a-zA-Z0-9가-힣\s]/g, '');
  },

  /**
   * 카멜케이스로 변환
   * @param {string} str - 원본 문자열
   * @returns {string} 카멜케이스 문자열
   */
  toCamelCase: (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },

  /**
   * 스네이크케이스로 변환
   * @param {string} str - 원본 문자열
   * @returns {string} 스네이크케이스 문자열
   */
  toSnakeCase: (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  /**
   * 첫 글자 대문자로 변환
   * @param {string} str - 원본 문자열
   * @returns {string} 변환된 문자열
   */
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

/**
 * 배열 및 객체 처리 관련 유틸리티
 */
export const arrayUtils = {
  /**
   * 배열 중복 제거
   * @param {Array} array - 원본 배열
   * @returns {Array} 중복 제거된 배열
   */
  removeDuplicates: (array) => {
    return [...new Set(array)];
  },

  /**
   * 배열 그룹화
   * @param {Array} array - 원본 배열
   * @param {string} key - 그룹화할 키
   * @returns {Object} 그룹화된 객체
   */
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  /**
   * 배열 셔플
   * @param {Array} array - 원본 배열
   * @returns {Array} 셔플된 배열
   */
  shuffle: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * 배열에서 랜덤 요소 선택
   * @param {Array} array - 원본 배열
   * @returns {*} 랜덤 요소
   */
  randomElement: (array) => {
    return array[Math.floor(Math.random() * array.length)];
  }
};

/**
 * 이메일 발송 함수
 * @param {Object} emailData - 이메일 데이터
 * @returns {Promise} 발송 결과
 */
export const sendEmail = async (emailData) => {
  try {
    // 실제 이메일 발송 로직은 여기에 구현
    // 현재는 로깅만 수행
    logger.info(`📧 이메일 발송: ${emailData.to}`, {
      subject: emailData.subject,
      timestamp: new Date().toISOString()
    });

    // 성공 응답 시뮬레이션
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ 이메일 발송 실패:', error);
    throw error;
  }
};

/**
 * 푸시 알림 발송 함수
 * @param {Object} pushData - 푸시 알림 데이터
 * @returns {Promise} 발송 결과
 */
export const sendPushNotification = async (pushData) => {
  try {
    // 실제 푸시 알림 발송 로직은 여기에 구현
    // 현재는 로깅만 수행
    logger.info(`📱 푸시 알림 발송: ${pushData.tokens.length}개 토큰`, {
      title: pushData.title,
      timestamp: new Date().toISOString()
    });

    // 성공 응답 시뮬레이션
    return {
      success: true,
      messageId: `push_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ 푸시 알림 발송 실패:', error);
    throw error;
  }
};

// 모든 유틸리티를 하나의 객체로 내보내기
export default {
  dateUtils,
  permissionUtils,
  notificationUtils,
  fileUtils,
  validationUtils,
  securityUtils,
  stringUtils,
  arrayUtils,
  sendEmail,
  sendPushNotification
}; 