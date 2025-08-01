import { useState, useEffect, useCallback } from 'react';
import { TASK_CONFIG } from '../constants/taskConfig';

// Mock 조직 데이터
const mockOrganizations = [
  {
    id: 'org1',
    name: 'TechCorp',
    description: '혁신적인 기술 솔루션을 제공하는 회사',
    type: TASK_CONFIG.ORGANIZATION_TYPES.COMPANY,
    logo: null,
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: 'medium', // small, medium, large
    location: '서울, 대한민국',
    timezone: 'Asia/Seoul',
    settings: {
      theme: 'light',
      language: 'ko',
      work_hours: {
        start: '09:00',
        end: '18:00',
        timezone: 'Asia/Seoul'
      },
      notification_preferences: {
        email: true,
        slack: true,
        in_app: true
      }
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      expires_at: '2024-12-31T23:59:59Z',
      features: ['unlimited_projects', 'advanced_analytics', 'api_access']
    },
    stats: {
      total_members: 25,
      total_projects: 8,
      total_teams: 4,
      total_tasks: 156,
      completed_tasks: 98
    },
    members: [
      {
        id: 'user1',
        name: '김대표',
        email: 'ceo@techcorp.com',
        role: TASK_CONFIG.ROLES.ORGANIZATION.OWNER,
        avatar: null,
        joined_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'user2',
        name: '박개발',
        email: 'dev@techcorp.com',
        role: TASK_CONFIG.ROLES.ORGANIZATION.ADMIN,
        avatar: null,
        joined_at: '2024-01-15T00:00:00Z'
      }
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-08T00:00:00Z'
  },
  {
    id: 'org2',
    name: 'Design Studio',
    description: '창의적인 디자인 서비스 전문 스튜디오',
    type: TASK_CONFIG.ORGANIZATION_TYPES.AGENCY,
    logo: null,
    website: 'https://designstudio.co.kr',
    industry: 'Design',
    size: 'small',
    location: '부산, 대한민국',
    timezone: 'Asia/Seoul',
    settings: {
      theme: 'dark',
      language: 'ko',
      work_hours: {
        start: '10:00',
        end: '19:00',
        timezone: 'Asia/Seoul'
      },
      notification_preferences: {
        email: true,
        slack: false,
        in_app: true
      }
    },
    subscription: {
      plan: 'basic',
      status: 'active',
      expires_at: '2024-09-30T23:59:59Z',
      features: ['limited_projects', 'basic_analytics']
    },
    stats: {
      total_members: 8,
      total_projects: 3,
      total_teams: 2,
      total_tasks: 42,
      completed_tasks: 31
    },
    members: [
      {
        id: 'user3',
        name: '이디자인',
        email: 'designer@studio.co.kr',
        role: TASK_CONFIG.ROLES.ORGANIZATION.OWNER,
        avatar: null,
        joined_at: '2024-03-01T00:00:00Z'
      }
    ],
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-07-05T00:00:00Z'
  }
];

const useOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 조직 로드
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setOrganizations(mockOrganizations);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 조직 생성
  const createOrganization = useCallback(async (organizationData) => {
    setLoading(true);
    try {
      const newOrganization = {
        id: Date.now().toString(),
        ...organizationData,
        settings: {
          theme: 'light',
          language: 'ko',
          work_hours: {
            start: '09:00',
            end: '18:00',
            timezone: 'Asia/Seoul'
          },
          notification_preferences: {
            email: true,
            slack: false,
            in_app: true
          },
          ...organizationData.settings
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
          features: ['limited_projects', 'basic_analytics']
        },
        stats: {
          total_members: 1,
          total_projects: 0,
          total_teams: 0,
          total_tasks: 0,
          completed_tasks: 0
        },
        members: [
          {
            id: 'current-user',
            name: organizationData.owner_name || '조직 관리자',
            email: organizationData.owner_email || 'admin@organization.com',
            role: TASK_CONFIG.ROLES.ORGANIZATION.OWNER,
            avatar: null,
            joined_at: new Date().toISOString()
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setOrganizations(prevOrgs => [newOrganization, ...prevOrgs]);
      return newOrganization;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 조직 업데이트
  const updateOrganization = useCallback(async (organizationId, updates) => {
    setLoading(true);
    try {
      const updatedOrganization = {
        ...organizations.find(org => org.id === organizationId),
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org.id === organizationId ? updatedOrganization : org
        )
      );
      
      return updatedOrganization;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organizations]);

  // 조직 삭제
  const deleteOrganization = useCallback(async (organizationId) => {
    setLoading(true);
    try {
      setOrganizations(prevOrgs => 
        prevOrgs.filter(org => org.id !== organizationId)
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 조직 통계 조회
  const getOrganizationStats = useCallback(async (organizationId) => {
    try {
      const organization = organizations.find(org => org.id === organizationId);
      if (!organization) return null;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      return {
        ...organization.stats,
        productivity_score: Math.round((organization.stats.completed_tasks / organization.stats.total_tasks) * 100) || 0,
        active_members: Math.floor(organization.stats.total_members * 0.8),
        monthly_tasks_completed: Math.floor(organization.stats.completed_tasks * 0.3),
        monthly_tasks_created: Math.floor(organization.stats.total_tasks * 0.4),
        average_task_completion_time: 3.5, // days
        overdue_tasks: Math.floor(organization.stats.total_tasks * 0.1),
        growth_metrics: {
          tasks_growth: 15.2, // percentage
          projects_growth: 8.7,
          members_growth: 12.5
        }
      };
    } catch (err) {
      setError(err);
      return null;
    }
  }, [organizations]);

  // 멤버 초대
  const inviteMember = useCallback(async (organizationId, memberData) => {
    setLoading(true);
    try {
      const newMember = {
        id: Date.now().toString(),
        ...memberData,
        role: memberData.role || TASK_CONFIG.ROLES.ORGANIZATION.MEMBER,
        avatar: null,
        joined_at: new Date().toISOString()
      };

      setOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org.id === organizationId 
            ? {
                ...org,
                members: [...org.members, newMember],
                stats: {
                  ...org.stats,
                  total_members: org.stats.total_members + 1
                },
                updated_at: new Date().toISOString()
              }
            : org
        )
      );

      return newMember;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 멤버 제거
  const removeMember = useCallback(async (organizationId, memberId) => {
    setLoading(true);
    try {
      setOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org.id === organizationId 
            ? {
                ...org,
                members: org.members.filter(member => member.id !== memberId),
                stats: {
                  ...org.stats,
                  total_members: Math.max(0, org.stats.total_members - 1)
                },
                updated_at: new Date().toISOString()
              }
            : org
        )
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 멤버 역할 업데이트
  const updateMemberRole = useCallback(async (organizationId, memberId, newRole) => {
    setLoading(true);
    try {
      setOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org.id === organizationId 
            ? {
                ...org,
                members: org.members.map(member => 
                  member.id === memberId 
                    ? { ...member, role: newRole }
                    : member
                ),
                updated_at: new Date().toISOString()
              }
            : org
        )
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  return {
    organizations,
    loading,
    error,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    loadOrganizations,
    getOrganizationStats,
    inviteMember,
    removeMember,
    updateMemberRole
  };
};

export default useOrganizations;