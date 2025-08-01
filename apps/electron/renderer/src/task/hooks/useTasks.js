import { useState, useEffect, useCallback, useMemo } from 'react';
import { TASK_CONFIG } from '../constants/taskConfig';

// Mock API - 실제 구현에서는 API 호출로 대체
const mockTasks = [
  {
    id: '1',
    title: '사용자 인증 시스템 구현',
    description: 'JWT 기반 인증 시스템을 구현하고 보안 정책을 적용합니다.',
    type: TASK_CONFIG.TASK_TYPES.FEATURE,
    status: TASK_CONFIG.TASK_STATUS.IN_PROGRESS,
    priority: TASK_CONFIG.PRIORITY_LEVELS.HIGH,
    assignee: {
      id: 'user1',
      name: '김개발',
      email: 'dev@example.com',
      avatar: null
    },
    project_id: 'project1',
    organization_id: 'org1',
    team_id: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [
      { name: '인증', color: 'blue' },
      { name: 'JWT', color: 'green' }
    ],
    attachments: [
      { id: 'att1', name: '요구사항서.pdf', size: 1024000 }
    ],
    comments_count: 3,
    estimated_hours: 40,
    logged_hours: 15,
    progress: 30,
    subtasks: [
      { id: 'sub1', title: 'JWT 라이브러리 설정', completed: true },
      { id: 'sub2', title: '로그인 API 구현', completed: false },
      { id: 'sub3', title: '토큰 재발급 로직', completed: false }
    ]
  },
  {
    id: '2',
    title: '데이터베이스 성능 최적화',
    description: '쿼리 성능을 개선하고 인덱스를 최적화합니다.',
    type: TASK_CONFIG.TASK_TYPES.BUG,
    status: TASK_CONFIG.TASK_STATUS.PENDING,
    priority: TASK_CONFIG.PRIORITY_LEVELS.URGENT,
    assignee: {
      id: 'user2',
      name: '박디비',
      email: 'db@example.com',
      avatar: null
    },
    project_id: 'project1',
    organization_id: 'org1',
    team_id: 'team1',
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 연체
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [
      { name: '성능', color: 'red' },
      { name: '데이터베이스', color: 'purple' }
    ],
    attachments: [],
    comments_count: 7,
    estimated_hours: 16,
    logged_hours: 0,
    progress: 0,
    subtasks: []
  },
  {
    id: '3',
    title: 'UI/UX 리뷰 미팅',
    description: '새로운 디자인 가이드라인에 대한 팀 리뷰 세션을 진행합니다.',
    type: TASK_CONFIG.TASK_TYPES.MEETING,
    status: TASK_CONFIG.TASK_STATUS.COMPLETED,
    priority: TASK_CONFIG.PRIORITY_LEVELS.MEDIUM,
    assignee: {
      id: 'user3',
      name: '이디자인',
      email: 'design@example.com',
      avatar: null
    },
    project_id: 'project2',
    organization_id: 'org1',
    team_id: 'team2',
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [
      { name: 'UI', color: 'pink' },
      { name: '미팅', color: 'gray' }
    ],
    attachments: [
      { id: 'att2', name: '디자인가이드.figma', size: 5120000 },
      { id: 'att3', name: '회의록.md', size: 2048 }
    ],
    comments_count: 12,
    estimated_hours: 2,
    logged_hours: 2,
    progress: 100,
    subtasks: [
      { id: 'sub4', title: '참석자 확인', completed: true },
      { id: 'sub5', title: '자료 준비', completed: true },
      { id: 'sub6', title: '회의록 작성', completed: true }
    ]
  }
];

const useTasks = (projectId = null, organizationId = null, teamId = null) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: [],
    project: [],
    tag: [],
    type: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // 태스크 로드
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 실제 API 호출 대신 mock 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
      
      let filteredMockTasks = [...mockTasks];
      
      // 컨텍스트별 필터링
      if (projectId) {
        filteredMockTasks = filteredMockTasks.filter(task => task.project_id === projectId);
      }
      if (organizationId) {
        filteredMockTasks = filteredMockTasks.filter(task => task.organization_id === organizationId);
      }
      if (teamId) {
        filteredMockTasks = filteredMockTasks.filter(task => task.team_id === teamId);
      }
      
      setTasks(filteredMockTasks);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, organizationId, teamId]);

  // 태스크 생성
  const createTask = useCallback(async (taskData) => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 mock 구현
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments_count: 0,
        attachments: [],
        subtasks: [],
        progress: 0,
        logged_hours: 0
      };
      
      setTasks(prevTasks => [newTask, ...prevTasks]);
      return newTask;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 태스크 업데이트
  const updateTask = useCallback(async (taskId, updates) => {
    setLoading(true);
    try {
      const updatedTask = {
        ...tasks.find(task => task.id === taskId),
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
      
      return updatedTask;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  // 태스크 삭제
  const deleteTask = useCallback(async (taskId) => {
    setLoading(true);
    try {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 일괄 업데이트
  const bulkUpdateTasks = useCallback(async (taskIds, updates) => {
    setLoading(true);
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          taskIds.includes(task.id) 
            ? { ...task, ...updates, updated_at: new Date().toISOString() }
            : task
        )
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 태스크 검색
  const searchTasks = useCallback(async (query) => {
    setSearchQuery(query);
  }, []);

  // 필터된 태스크 계산
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // 검색 쿼리 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.name.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // 상태 필터 적용
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    // 우선순위 필터 적용
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }

    // 타입 필터 적용
    if (filters.type.length > 0) {
      filtered = filtered.filter(task => filters.type.includes(task.type));
    }

    // 담당자 필터 적용
    if (filters.assignee.length > 0) {
      filtered = filtered.filter(task => 
        task.assignee && filters.assignee.includes(task.assignee.id)
      );
    }

    // 태그 필터 적용
    if (filters.tag.length > 0) {
      filtered = filtered.filter(task => 
        task.tags?.some(tag => filters.tag.includes(tag.name))
      );
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // 날짜 필드 처리
      if (sortBy.includes('date') || sortBy.includes('_at')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // 우선순위 정렬을 위한 수치 변환
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[aValue];
        bValue = priorityOrder[bValue];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, searchQuery, filters, sortBy, sortOrder]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  // 새로고침
  const refreshTasks = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  // 초기 로드
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    filteredTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    searchTasks,
    filters,
    updateFilters,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loadTasks,
    refreshTasks
  };
};

export default useTasks;