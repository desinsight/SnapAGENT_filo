import { useState, useEffect, useCallback } from 'react';
import { TASK_CONFIG } from '../constants/taskConfig';

const mockTeams = [
  {
    id: 'team1',
    name: '개발팀',
    description: '제품 개발을 담당하는 핵심 팀',
    type: TASK_CONFIG.TEAM_TYPES.DEVELOPMENT,
    organization_id: 'org1',
    leader_id: 'user1',
    members: [
      { id: 'user1', name: '김개발', role: 'leader' },
      { id: 'user2', name: '박디비', role: 'member' }
    ],
    task_count: 28,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-07-08T00:00:00Z'
  },
  {
    id: 'team2',
    name: '디자인팀',
    description: 'UI/UX 디자인 전담 팀',
    type: TASK_CONFIG.TEAM_TYPES.DESIGN,
    organization_id: 'org1',
    leader_id: 'user3',
    members: [
      { id: 'user3', name: '이디자인', role: 'leader' }
    ],
    task_count: 12,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-07-05T00:00:00Z'
  }
];

const useTeams = (organizationId = null) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let filteredTeams = [...mockTeams];
      if (organizationId) {
        filteredTeams = filteredTeams.filter(team => team.organization_id === organizationId);
      }
      
      setTeams(filteredTeams);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createTeam = useCallback(async (teamData) => {
    const newTeam = {
      id: Date.now().toString(),
      ...teamData,
      task_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTeams(prevTeams => [newTeam, ...prevTeams]);
    return newTeam;
  }, []);

  const updateTeam = useCallback(async (teamId, updates) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, ...updates, updated_at: new Date().toISOString() }
          : team
      )
    );
  }, []);

  const deleteTeam = useCallback(async (teamId) => {
    setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
  }, []);

  const getTeamStats = useCallback(async (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? {
      total_tasks: team.task_count,
      members_count: team.members.length,
      productivity_score: Math.floor(Math.random() * 100)
    } : null;
  }, [teams]);

  useEffect(() => {
    if (organizationId) {
      loadTeams();
    }
  }, [organizationId, loadTeams]);

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    loadTeams,
    getTeamStats
  };
};

export default useTeams;