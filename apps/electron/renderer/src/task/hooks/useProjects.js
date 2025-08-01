import { useState, useEffect, useCallback } from 'react';
import { TASK_CONFIG } from '../constants/taskConfig';

// Mock 프로젝트 데이터
const mockProjects = [
  {
    id: 'project1',
    name: 'TaskManager 2.0',
    description: '차세대 태스크 관리 시스템 개발',
    type: TASK_CONFIG.PROJECT_TYPES.INTERNAL,
    status: TASK_CONFIG.PROJECT_STATUS.ACTIVE,
    organization_id: 'org1',
    owner_id: 'user1',
    members: [
      { id: 'user1', name: '김개발', role: 'owner' },
      { id: 'user2', name: '박디비', role: 'member' }
    ],
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    budget: 100000000,
    progress: 65,
    task_count: 45,
    completed_tasks: 29,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-07-08T00:00:00Z'
  },
  {
    id: 'project2',
    name: 'UI/UX 리뉴얼',
    description: '사용자 경험 개선을 위한 인터페이스 리디자인',
    type: TASK_CONFIG.PROJECT_TYPES.CLIENT,
    status: TASK_CONFIG.PROJECT_STATUS.PLANNING,
    organization_id: 'org1',
    owner_id: 'user3',
    members: [
      { id: 'user3', name: '이디자인', role: 'owner' },
      { id: 'user1', name: '김개발', role: 'member' }
    ],
    start_date: '2024-06-01',
    end_date: '2024-10-31',
    budget: 50000000,
    progress: 25,
    task_count: 18,
    completed_tasks: 4,
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2024-07-01T00:00:00Z'
  }
];

const useProjects = (organizationId = null) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 프로젝트 로드
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filteredProjects = [...mockProjects];
      
      if (organizationId) {
        filteredProjects = filteredProjects.filter(
          project => project.organization_id === organizationId
        );
      }
      
      setProjects(filteredProjects);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // 프로젝트 생성
  const createProject = useCallback(async (projectData) => {
    setLoading(true);
    try {
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        progress: 0,
        task_count: 0,
        completed_tasks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProjects(prevProjects => [newProject, ...prevProjects]);
      return newProject;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로젝트 업데이트
  const updateProject = useCallback(async (projectId, updates) => {
    setLoading(true);
    try {
      const updatedProject = {
        ...projects.find(project => project.id === projectId),
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? updatedProject : project
        )
      );
      
      return updatedProject;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projects]);

  // 프로젝트 삭제
  const deleteProject = useCallback(async (projectId) => {
    setLoading(true);
    try {
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== projectId)
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로젝트 통계 조회
  const getProjectStats = useCallback(async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;

      return {
        total_tasks: project.task_count,
        completed_tasks: project.completed_tasks,
        in_progress_tasks: Math.floor((project.task_count - project.completed_tasks) * 0.6),
        pending_tasks: Math.floor((project.task_count - project.completed_tasks) * 0.4),
        progress_percentage: project.progress,
        budget_used: project.budget * (project.progress / 100),
        days_remaining: Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      };
    } catch (err) {
      setError(err);
      return null;
    }
  }, [projects]);

  useEffect(() => {
    if (organizationId) {
      loadProjects();
    }
  }, [organizationId, loadProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
    getProjectStats
  };
};

export default useProjects;