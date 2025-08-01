/**
 * Validation Middleware - 검증 미들웨어
 * 입력 데이터 검증 및 스키마 검증 처리
 * 
 * @description
 * - Joi 스키마 검증
 * - 커스텀 검증 함수
 * - 에러 메시지 처리
 * - 타입 변환 및 정규화
 * - 확장 가능한 검증 시스템
 * 
 * @author Your Team
 * @version 1.0.0
 */

import Joi from 'joi';
import { logger } from '../config/logger.js';

/**
 * Joi 스키마 정의
 */
const schemas = {


  // 태스크 관련 스키마
  task: {
    create: Joi.object({
      title: Joi.string().min(1).max(200).required().messages({
        'string.min': '태스크 제목은 최소 1자 이상이어야 합니다.',
        'string.max': '태스크 제목은 최대 200자까지 가능합니다.',
        'any.required': '태스크 제목은 필수입니다.'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': '태스크 설명은 최대 2000자까지 가능합니다.'
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
        'any.only': '우선순위는 low, medium, high, urgent 중 하나여야 합니다.'
      }),
      status: Joi.string().valid('todo', 'in_progress', 'review', 'done', 'cancelled').default('todo').messages({
        'any.only': '상태는 todo, in_progress, review, done, cancelled 중 하나여야 합니다.'
      }),
      type: Joi.string().valid('task', 'bug', 'feature', 'improvement', 'research').default('task').messages({
        'any.only': '유형은 task, bug, feature, improvement, research 중 하나여야 합니다.'
      }),
      dueDate: Joi.date().iso().min('now').optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.',
        'date.min': '마감일은 현재 시간 이후여야 합니다.'
      }),
      estimatedHours: Joi.number().min(0.1).max(1000).optional().messages({
        'number.min': '예상 시간은 최소 0.1시간 이상이어야 합니다.',
        'number.max': '예상 시간은 최대 1000시간까지 가능합니다.'
      }),
      assigneeId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.'
      }),
      tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional().messages({
        'array.max': '태그는 최대 20개까지 가능합니다.',
        'string.min': '태그는 최소 1자 이상이어야 합니다.',
        'string.max': '태그는 최대 50자까지 가능합니다.'
      }),
      attachments: Joi.array().items(Joi.object({
        filename: Joi.string().required(),
        url: Joi.string().uri().required(),
        size: Joi.number().positive().required(),
        type: Joi.string().required()
      })).max(10).optional().messages({
        'array.max': '첨부파일은 최대 10개까지 가능합니다.'
      }),
      organizationId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 조직 ID를 입력해주세요.',
        'string.length': '조직 ID는 24자여야 합니다.'
      }),
      teamId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 팀 ID를 입력해주세요.',
        'string.length': '팀 ID는 24자여야 합니다.'
      }),
      projectId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 프로젝트 ID를 입력해주세요.',
        'string.length': '프로젝트 ID는 24자여야 합니다.'
      }),
      parentTaskId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 상위 태스크 ID를 입력해주세요.',
        'string.length': '상위 태스크 ID는 24자여야 합니다.'
      }),
      recurrence: Joi.object({
        type: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
        interval: Joi.number().integer().min(1).max(365).default(1),
        endDate: Joi.date().iso().min('now').optional(),
        daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).when('type', {
          is: 'weekly',
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
        dayOfMonth: Joi.number().min(1).max(31).when('type', {
          is: 'monthly',
          then: Joi.required(),
          otherwise: Joi.forbidden()
        })
      }).optional()
    }),

    update: Joi.object({
      title: Joi.string().min(1).max(200).optional().messages({
        'string.min': '태스크 제목은 최소 1자 이상이어야 합니다.',
        'string.max': '태스크 제목은 최대 200자까지 가능합니다.'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': '태스크 설명은 최대 2000자까지 가능합니다.'
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().messages({
        'any.only': '우선순위는 low, medium, high, urgent 중 하나여야 합니다.'
      }),
      status: Joi.string().valid('todo', 'in_progress', 'review', 'done', 'cancelled').optional().messages({
        'any.only': '상태는 todo, in_progress, review, done, cancelled 중 하나여야 합니다.'
      }),
      type: Joi.string().valid('task', 'bug', 'feature', 'improvement', 'research').optional().messages({
        'any.only': '유형은 task, bug, feature, improvement, research 중 하나여야 합니다.'
      }),
      dueDate: Joi.date().iso().optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.'
      }),
      estimatedHours: Joi.number().min(0.1).max(1000).optional().messages({
        'number.min': '예상 시간은 최소 0.1시간 이상이어야 합니다.',
        'number.max': '예상 시간은 최대 1000시간까지 가능합니다.'
      }),
      actualHours: Joi.number().min(0).max(1000).optional().messages({
        'number.min': '실제 시간은 0시간 이상이어야 합니다.',
        'number.max': '실제 시간은 최대 1000시간까지 가능합니다.'
      }),
      assigneeId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.'
      }),
      tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional().messages({
        'array.max': '태그는 최대 20개까지 가능합니다.',
        'string.min': '태그는 최소 1자 이상이어야 합니다.',
        'string.max': '태그는 최대 50자까지 가능합니다.'
      }),
      progress: Joi.number().min(0).max(100).optional().messages({
        'number.min': '진행률은 0% 이상이어야 합니다.',
        'number.max': '진행률은 100% 이하여야 합니다.'
      })
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': '페이지 번호는 숫자여야 합니다.',
        'number.min': '페이지 번호는 1 이상이어야 합니다.'
      }),
      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': '페이지 크기는 숫자여야 합니다.',
        'number.min': '페이지 크기는 1 이상이어야 합니다.',
        'number.max': '페이지 크기는 100 이하여야 합니다.'
      }),
      search: Joi.string().max(100).optional().messages({
        'string.max': '검색어는 최대 100자까지 가능합니다.'
      }),
      status: Joi.string().valid('todo', 'in_progress', 'review', 'done', 'cancelled').optional().messages({
        'any.only': '상태는 todo, in_progress, review, done, cancelled 중 하나여야 합니다.'
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().messages({
        'any.only': '우선순위는 low, medium, high, urgent 중 하나여야 합니다.'
      }),
      type: Joi.string().valid('task', 'bug', 'feature', 'improvement', 'research').optional().messages({
        'any.only': '유형은 task, bug, feature, improvement, research 중 하나여야 합니다.'
      }),
      assigneeId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.'
      }),
      creatorId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.'
      }),
      organizationId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 조직 ID를 입력해주세요.',
        'string.length': '조직 ID는 24자여야 합니다.'
      }),
      teamId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 팀 ID를 입력해주세요.',
        'string.length': '팀 ID는 24자여야 합니다.'
      }),
      projectId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 프로젝트 ID를 입력해주세요.',
        'string.length': '프로젝트 ID는 24자여야 합니다.'
      }),
      tags: Joi.array().items(Joi.string()).optional(),
      dueDateFrom: Joi.date().iso().optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.'
      }),
      dueDateTo: Joi.date().iso().optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.'
      }),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status').default('createdAt').messages({
        'any.only': '정렬 기준은 createdAt, updatedAt, dueDate, priority, title, status 중 하나여야 합니다.'
      }),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': '정렬 순서는 asc, desc 중 하나여야 합니다.'
      })
    })
  },

  // 조직 관련 스키마
  organization: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        'string.min': '조직명은 최소 2자 이상이어야 합니다.',
        'string.max': '조직명은 최대 100자까지 가능합니다.',
        'any.required': '조직명은 필수입니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '조직 설명은 최대 500자까지 가능합니다.'
      }),
      website: Joi.string().uri().optional().messages({
        'string.uri': '유효한 웹사이트 URL을 입력해주세요.'
      }),
      logo: Joi.string().uri().optional().messages({
        'string.uri': '유효한 로고 URL을 입력해주세요.'
      }),
      settings: Joi.object({
        allowPublicTasks: Joi.boolean().default(false),
        requireApproval: Joi.boolean().default(false),
        maxMembers: Joi.number().integer().min(1).max(10000).default(100),
        defaultTaskVisibility: Joi.string().valid('public', 'private', 'members').default('members')
      }).optional()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(100).optional().messages({
        'string.min': '조직명은 최소 2자 이상이어야 합니다.',
        'string.max': '조직명은 최대 100자까지 가능합니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '조직 설명은 최대 500자까지 가능합니다.'
      }),
      website: Joi.string().uri().optional().messages({
        'string.uri': '유효한 웹사이트 URL을 입력해주세요.'
      }),
      logo: Joi.string().uri().optional().messages({
        'string.uri': '유효한 로고 URL을 입력해주세요.'
      }),
      settings: Joi.object({
        allowPublicTasks: Joi.boolean().optional(),
        requireApproval: Joi.boolean().optional(),
        maxMembers: Joi.number().integer().min(1).max(10000).optional(),
        defaultTaskVisibility: Joi.string().valid('public', 'private', 'members').optional()
      }).optional()
    })
  },

  // 팀 관련 스키마
  team: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        'string.min': '팀명은 최소 2자 이상이어야 합니다.',
        'string.max': '팀명은 최대 100자까지 가능합니다.',
        'any.required': '팀명은 필수입니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '팀 설명은 최대 500자까지 가능합니다.'
      }),
      organizationId: Joi.string().hex().length(24).required().messages({
        'string.hex': '유효한 조직 ID를 입력해주세요.',
        'string.length': '조직 ID는 24자여야 합니다.',
        'any.required': '조직 ID는 필수입니다.'
      }),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
        'string.pattern.base': '유효한 색상 코드를 입력해주세요 (예: #FF0000).'
      }),
      settings: Joi.object({
        allowPublicTasks: Joi.boolean().default(false),
        requireApproval: Joi.boolean().default(false),
        maxMembers: Joi.number().integer().min(1).max(1000).default(50)
      }).optional()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(100).optional().messages({
        'string.min': '팀명은 최소 2자 이상이어야 합니다.',
        'string.max': '팀명은 최대 100자까지 가능합니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '팀 설명은 최대 500자까지 가능합니다.'
      }),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
        'string.pattern.base': '유효한 색상 코드를 입력해주세요 (예: #FF0000).'
      }),
      settings: Joi.object({
        allowPublicTasks: Joi.boolean().optional(),
        requireApproval: Joi.boolean().optional(),
        maxMembers: Joi.number().integer().min(1).max(1000).optional()
      }).optional()
    })
  },

  // 프로젝트 관련 스키마
  project: {
    create: Joi.object({
      title: Joi.string().min(2).max(200).required().messages({
        'string.min': '프로젝트 제목은 최소 2자 이상이어야 합니다.',
        'string.max': '프로젝트 제목은 최대 200자까지 가능합니다.',
        'any.required': '프로젝트 제목은 필수입니다.'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': '프로젝트 설명은 최대 2000자까지 가능합니다.'
      }),
      category: Joi.string().valid('development', 'design', 'marketing', 'sales', 'support', 'research', 'other').optional().messages({
        'any.only': '유효한 카테고리를 선택해주세요.'
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
        'any.only': '우선순위는 low, medium, high, urgent 중 하나여야 합니다.'
      }),
      status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived').default('planning').messages({
        'any.only': '상태는 planning, active, on_hold, completed, cancelled, archived 중 하나여야 합니다.'
      }),
      organization: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 조직 ID를 입력해주세요.',
        'string.length': '조직 ID는 24자여야 합니다.'
      }),
      team: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 팀 ID를 입력해주세요.',
        'string.length': '팀 ID는 24자여야 합니다.'
      }),
      assignedTo: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.'
      }),
      startDate: Joi.date().iso().optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.'
      }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
        'date.base': '유효한 날짜 형식을 입력해주세요.',
        'date.min': '종료일은 시작일 이후여야 합니다.'
      }),
      tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional().messages({
        'array.max': '태그는 최대 20개까지 가능합니다.',
        'string.min': '태그는 최소 1자 이상이어야 합니다.',
        'string.max': '태그는 최대 50자까지 가능합니다.'
      }),
      settings: Joi.object({
        visibility: Joi.string().valid('public', 'private', 'team', 'organization').default('private'),
        allowGuestAccess: Joi.boolean().default(false),
        requireApproval: Joi.boolean().default(false),
        autoArchive: Joi.boolean().default(false)
      }).optional()
    }),

    member: Joi.object({
      userId: Joi.string().hex().length(24).required().messages({
        'string.hex': '유효한 사용자 ID를 입력해주세요.',
        'string.length': '사용자 ID는 24자여야 합니다.',
        'any.required': '사용자 ID는 필수입니다.'
      }),
      role: Joi.string().valid('owner', 'admin', 'member', 'viewer').default('member').messages({
        'any.only': '역할은 owner, admin, member, viewer 중 하나여야 합니다.'
      }),
      permissions: Joi.array().items(Joi.string().valid('read', 'write', 'delete', 'admin')).optional().messages({
        'array.includesUnknownOnly': '유효한 권한을 선택해주세요.'
      })
    }),

    status: Joi.object({
      status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived').required().messages({
        'any.only': '상태는 planning, active, on_hold, completed, cancelled, archived 중 하나여야 합니다.',
        'any.required': '상태는 필수입니다.'
      }),
      reason: Joi.string().max(500).optional().messages({
        'string.max': '변경 이유는 최대 500자까지 가능합니다.'
      })
    })
  },

  // 공통 스키마
  common: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    id: Joi.object({
      id: Joi.string().hex().length(24).required().messages({
        'string.hex': '유효한 ID를 입력해주세요.',
        'string.length': 'ID는 24자여야 합니다.',
        'any.required': 'ID는 필수입니다.'
      })
    })
  },

  // 조직 관련 스키마
  organization: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': '조직 이름은 최소 1자 이상이어야 합니다.',
        'string.max': '조직 이름은 최대 100자까지 가능합니다.',
        'any.required': '조직 이름은 필수입니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '조직 설명은 최대 500자까지 가능합니다.'
      }),
      website: Joi.string().uri().optional().messages({
        'string.uri': '유효한 웹사이트 URL을 입력해주세요.'
      }),
      industry: Joi.string().max(50).optional().messages({
        'string.max': '산업 분야는 최대 50자까지 가능합니다.'
      }),
      size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional().messages({
        'any.only': '조직 규모는 startup, small, medium, large, enterprise 중 하나여야 합니다.'
      }),
      settings: Joi.object({
        allowPublicProjects: Joi.boolean().default(false),
        requireApprovalForTasks: Joi.boolean().default(false),
        maxTeamSize: Joi.number().integer().min(1).max(1000).default(50),
        allowExternalInvites: Joi.boolean().default(false)
      }).optional()
    }),

    update: Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': '조직 이름은 최소 1자 이상이어야 합니다.',
        'string.max': '조직 이름은 최대 100자까지 가능합니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '조직 설명은 최대 500자까지 가능합니다.'
      }),
      website: Joi.string().uri().optional().messages({
        'string.uri': '유효한 웹사이트 URL을 입력해주세요.'
      }),
      industry: Joi.string().max(50).optional().messages({
        'string.max': '산업 분야는 최대 50자까지 가능합니다.'
      }),
      size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional().messages({
        'any.only': '조직 규모는 startup, small, medium, large, enterprise 중 하나여야 합니다.'
      }),
      settings: Joi.object({
        allowPublicProjects: Joi.boolean().optional(),
        requireApprovalForTasks: Joi.boolean().optional(),
        maxTeamSize: Joi.number().integer().min(1).max(1000).optional(),
        allowExternalInvites: Joi.boolean().optional()
      }).optional()
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': '페이지 번호는 숫자여야 합니다.',
        'number.min': '페이지 번호는 1 이상이어야 합니다.'
      }),
      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': '페이지 크기는 숫자여야 합니다.',
        'number.min': '페이지 크기는 1 이상이어야 합니다.',
        'number.max': '페이지 크기는 100 이하여야 합니다.'
      }),
      search: Joi.string().max(100).optional().messages({
        'string.max': '검색어는 최대 100자까지 가능합니다.'
      }),
      status: Joi.string().valid('active', 'inactive', 'suspended').optional().messages({
        'any.only': '상태는 active, inactive, suspended 중 하나여야 합니다.'
      }),
      size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').optional().messages({
        'any.only': '조직 규모는 startup, small, medium, large, enterprise 중 하나여야 합니다.'
      }),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'memberCount').default('createdAt').messages({
        'any.only': '정렬 기준은 createdAt, updatedAt, name, memberCount 중 하나여야 합니다.'
      }),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': '정렬 순서는 asc, desc 중 하나여야 합니다.'
      })
    })
  },

  // 팀 관련 스키마
  team: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required().messages({
        'string.min': '팀 이름은 최소 1자 이상이어야 합니다.',
        'string.max': '팀 이름은 최대 100자까지 가능합니다.',
        'any.required': '팀 이름은 필수입니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '팀 설명은 최대 500자까지 가능합니다.'
      }),
      type: Joi.string().valid('development', 'design', 'marketing', 'sales', 'support', 'management', 'other').default('other').messages({
        'any.only': '팀 유형은 development, design, marketing, sales, support, management, other 중 하나여야 합니다.'
      }),
      settings: Joi.object({
        allowSelfAssignment: Joi.boolean().default(true),
        requireApprovalForTasks: Joi.boolean().default(false),
        maxConcurrentTasks: Joi.number().integer().min(1).max(100).default(10)
      }).optional()
    }),

    update: Joi.object({
      name: Joi.string().min(1).max(100).optional().messages({
        'string.min': '팀 이름은 최소 1자 이상이어야 합니다.',
        'string.max': '팀 이름은 최대 100자까지 가능합니다.'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': '팀 설명은 최대 500자까지 가능합니다.'
      }),
      type: Joi.string().valid('development', 'design', 'marketing', 'sales', 'support', 'management', 'other').optional().messages({
        'any.only': '팀 유형은 development, design, marketing, sales, support, management, other 중 하나여야 합니다.'
      }),
      settings: Joi.object({
        allowSelfAssignment: Joi.boolean().optional(),
        requireApprovalForTasks: Joi.boolean().optional(),
        maxConcurrentTasks: Joi.number().integer().min(1).max(100).optional()
      }).optional()
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': '페이지 번호는 숫자여야 합니다.',
        'number.min': '페이지 번호는 1 이상이어야 합니다.'
      }),
      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': '페이지 크기는 숫자여야 합니다.',
        'number.min': '페이지 크기는 1 이상이어야 합니다.',
        'number.max': '페이지 크기는 100 이하여야 합니다.'
      }),
      search: Joi.string().max(100).optional().messages({
        'string.max': '검색어는 최대 100자까지 가능합니다.'
      }),
      organizationId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 조직 ID를 입력해주세요.',
        'string.length': '조직 ID는 24자여야 합니다.'
      }),
      type: Joi.string().valid('development', 'design', 'marketing', 'sales', 'support', 'management', 'other').optional().messages({
        'any.only': '팀 유형은 development, design, marketing, sales, support, management, other 중 하나여야 합니다.'
      }),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'memberCount').default('createdAt').messages({
        'any.only': '정렬 기준은 createdAt, updatedAt, name, memberCount 중 하나여야 합니다.'
      }),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': '정렬 순서는 asc, desc 중 하나여야 합니다.'
      })
    })
  },

  // 멤버 초대 스키마
  memberInvite: {
    create: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': '유효한 이메일 주소를 입력해주세요.',
        'any.required': '이메일 주소는 필수입니다.'
      }),
      role: Joi.string().valid('member', 'admin', 'owner').default('member').messages({
        'any.only': '역할은 member, admin, owner 중 하나여야 합니다.'
      }),
      message: Joi.string().max(500).optional().messages({
        'string.max': '초대 메시지는 최대 500자까지 가능합니다.'
      })
    })
  },

  // 멤버 역할 변경 스키마
  memberRole: {
    update: Joi.object({
      role: Joi.string().valid('member', 'admin', 'owner').required().messages({
        'any.only': '역할은 member, admin, owner 중 하나여야 합니다.',
        'any.required': '역할은 필수입니다.'
      })
    })
  },

  // 댓글 관련 스키마
  comment: {
    create: Joi.object({
      content: Joi.string().min(1).max(2000).required().messages({
        'string.min': '댓글 내용은 최소 1자 이상이어야 합니다.',
        'string.max': '댓글 내용은 최대 2000자까지 가능합니다.',
        'any.required': '댓글 내용은 필수입니다.'
      }),
      relatedType: Joi.string().valid('task', 'project').required().messages({
        'any.only': '관련 타입은 task, project 중 하나여야 합니다.',
        'any.required': '관련 타입은 필수입니다.'
      }),
      relatedId: Joi.string().hex().length(24).required().messages({
        'string.hex': '유효한 관련 ID를 입력해주세요.',
        'string.length': '관련 ID는 24자여야 합니다.',
        'any.required': '관련 ID는 필수입니다.'
      }),
      parentCommentId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 부모 댓글 ID를 입력해주세요.',
        'string.length': '부모 댓글 ID는 24자여야 합니다.'
      })
    }),

    update: Joi.object({
      content: Joi.string().min(1).max(2000).required().messages({
        'string.min': '댓글 내용은 최소 1자 이상이어야 합니다.',
        'string.max': '댓글 내용은 최대 2000자까지 가능합니다.',
        'any.required': '댓글 내용은 필수입니다.'
      })
    }),

    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': '페이지 번호는 숫자여야 합니다.',
        'number.min': '페이지 번호는 1 이상이어야 합니다.'
      }),
      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': '페이지 크기는 숫자여야 합니다.',
        'number.min': '페이지 크기는 1 이상이어야 합니다.',
        'number.max': '페이지 크기는 100 이하여야 합니다.'
      }),
      parentCommentId: Joi.string().hex().length(24).optional().messages({
        'string.hex': '유효한 부모 댓글 ID를 입력해주세요.',
        'string.length': '부모 댓글 ID는 24자여야 합니다.'
      }),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'reactions').default('createdAt').messages({
        'any.only': '정렬 기준은 createdAt, updatedAt, reactions 중 하나여야 합니다.'
      }),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': '정렬 순서는 asc, desc 중 하나여야 합니다.'
      })
    })
  }
};

/**
 * 스키마 검증 미들웨어 생성 함수
 * @param {Object} schema - Joi 스키마
 * @param {string} source - 검증할 데이터 소스 ('body', 'query', 'params')
 * @returns {Function} Express 미들웨어 함수
 */
const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          code: detail.type
        }));

        logger.warn(`검증 실패: ${req.method} ${req.path}`, {
          errors: errorMessages,
          data: source === 'body' ? { ...data, password: '[HIDDEN]' } : data
        });

        return res.status(400).json({
          success: false,
          message: '입력 데이터가 유효하지 않습니다.',
          errors: errorMessages,
          code: 'VALIDATION_ERROR'
        });
      }

      // 검증된 데이터로 요청 객체 업데이트
      req[source] = value;
      next();

    } catch (error) {
      logger.error('검증 미들웨어 오류:', error);
      return res.status(500).json({
        success: false,
        message: '데이터 검증 중 오류가 발생했습니다.',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * 커스텀 검증 함수들
 */
const customValidators = {
  /**
   * 날짜 범위 검증
   * @param {Date} startDate - 시작일
   * @param {Date} endDate - 종료일
   * @returns {boolean} 유효성 여부
   */
  validateDateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  },

  /**
   * 파일 크기 검증
   * @param {number} size - 파일 크기 (bytes)
   * @param {number} maxSize - 최대 크기 (MB)
   * @returns {boolean} 유효성 여부
   */
  validateFileSize: (size, maxSize = 10) => {
    const maxSizeBytes = maxSize * 1024 * 1024; // MB to bytes
    return size <= maxSizeBytes;
  },

  /**
   * 파일 타입 검증
   * @param {string} mimeType - MIME 타입
   * @param {Array} allowedTypes - 허용된 타입 배열
   * @returns {boolean} 유효성 여부
   */
  validateFileType: (mimeType, allowedTypes = ['image/*', 'application/pdf', 'text/*']) => {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return mimeType.startsWith(type.slice(0, -1));
      }
      return mimeType === type;
    });
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
   * 이메일 도메인 검증
   * @param {string} email - 이메일 주소
   * @param {Array} allowedDomains - 허용된 도메인 배열
   * @returns {boolean} 유효성 여부
   */
  validateEmailDomain: (email, allowedDomains = []) => {
    if (allowedDomains.length === 0) return true;
    
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }
};

/**
 * 미들웨어 내보내기
 */
export const validationMiddleware = {
  // 태스크 관련 검증
  validateTaskCreate: validateSchema(schemas.task.create),
  validateTaskUpdate: validateSchema(schemas.task.update),
  validateTaskQuery: validateSchema(schemas.task.query, 'query'),

  // 조직 관련 검증
  validateOrganizationCreate: validateSchema(schemas.organization.create),
  validateOrganizationUpdate: validateSchema(schemas.organization.update),

  // 팀 관련 검증
  validateTeamCreate: validateSchema(schemas.team.create),
  validateTeamUpdate: validateSchema(schemas.team.update),

  // 프로젝트 관련 검증
  validateProject: validateSchema(schemas.project.create),
  validateProjectMember: validateSchema(schemas.project.member),
  validateProjectStatus: validateSchema(schemas.project.status),

  // 공통 검증
  validatePagination: validateSchema(schemas.common.pagination, 'query'),
  validateId: validateSchema(schemas.common.id, 'params'),

  // 커스텀 검증 함수들
  customValidators
};

// 개별 export 추가
export const validateId = validateSchema(schemas.common.id, 'params');
export const validateTaskCreate = validateSchema(schemas.task.create);
export const validateTaskUpdate = validateSchema(schemas.task.update);
export const validateTaskQuery = validateSchema(schemas.task.query, 'query');
export const validateProject = validateSchema(schemas.project.create);
export const validateProjectMember = validateSchema(schemas.project.member);
export const validateProjectStatus = validateSchema(schemas.project.status);

// 조직 관련 검증
export const validateOrganization = validateSchema(schemas.organization.create);
export const validateOrganizationUpdate = validateSchema(schemas.organization.update);
export const validateOrganizationQuery = validateSchema(schemas.organization.query, 'query');

// 팀 관련 검증
export const validateTeam = validateSchema(schemas.team.create);
export const validateTeamUpdate = validateSchema(schemas.team.update);
export const validateTeamQuery = validateSchema(schemas.team.query, 'query');

// 멤버 관련 검증
export const validateMemberInvite = validateSchema(schemas.memberInvite.create);
export const validateMemberRole = validateSchema(schemas.memberRole.update);

// 댓글 관련 검증
export const validateComment = validateSchema(schemas.comment.create);
export const validateCommentUpdate = validateSchema(schemas.comment.update);
export const validateCommentQuery = validateSchema(schemas.comment.query, 'query');

export default validationMiddleware; 