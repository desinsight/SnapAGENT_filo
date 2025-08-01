import React, { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  FolderIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  PlayIcon,
  UserIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  PlayIcon as PlayIconSolid,
  FireIcon as FireIconSolid 
} from '@heroicons/react/24/solid';

const TaskSidebarContent = ({
  organizations = [],
  projects = [],
  teams = [],
  selectedOrganization,
  selectedProject,
  selectedTeam,
  onOrganizationSelect,
  onProjectSelect,
  onTeamSelect,
  onCreateOrganization,
  onCreateProject,
  onCreateTeam,
  onTaskSelect,
  analytics,
  loading = false,
  currentUser = { name: '사용자', avatar: null },
  recentTasks = [],
  todayTasks = [],
  teamMembers = [],
  recentActivity = []
}) => {
  const [expandedOrgs, setExpandedOrgs] = useState(new Set([selectedOrganization?.id]));
  const [activeTab, setActiveTab] = useState('workspace'); // workspace, activity, today
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1분마다 업데이트
    return () => clearInterval(timer);
  }, []);

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrgs(newExpanded);
  };

  // Mock 데이터
  const mockRecentTasks = recentTasks.length > 0 ? recentTasks : [
    { 
      id: '1', 
      title: 'UI 컴포넌트 개발',
      status: 'in_progress',
      priority: 'high',
      project: { name: '웹 프로젝트', color: 'blue' },
      due_date: new Date().toISOString(),
      progress: 60
    },
    { 
      id: '2', 
      title: 'API 문서 작성',
      status: 'pending',
      priority: 'medium',
      project: { name: '백엔드 API', color: 'green' },
      due_date: new Date(Date.now() + 24*60*60*1000).toISOString(),
      progress: 0
    },
    { 
      id: '3', 
      title: '코드 리뷰',
      status: 'completed',
      priority: 'low',
      project: { name: '웹 프로젝트', color: 'blue' },
      due_date: new Date(Date.now() - 24*60*60*1000).toISOString(),
      progress: 100
    }
  ];

  const mockTodayTasks = todayTasks.length > 0 ? todayTasks : [
    { id: '1', title: '팀 미팅 참석', time: '10:00', type: 'meeting', completed: false },
    { id: '2', title: '프로젝트 리뷰', time: '14:00', type: 'review', completed: false },
    { id: '3', title: '주간 보고서 작성', time: '16:00', type: 'document', completed: true }
  ];

  const mockTeamMembers = teamMembers.length > 0 ? teamMembers : [
    { id: '1', name: '김개발', status: 'online', avatar: null, current_task: 'UI 개발 중' },
    { id: '2', name: '박디자인', status: 'away', avatar: null, current_task: '디자인 검토' },
    { id: '3', name: '이기획', status: 'offline', avatar: null, current_task: null }
  ];

  const mockRecentActivity = recentActivity.length > 0 ? recentActivity : [
    { id: '1', type: 'task_completed', user: '김개발', action: '태스크를 완료했습니다', target: 'UI 컴포넌트 개발', time: '5분 전' },
    { id: '2', type: 'comment_added', user: '박디자인', action: '댓글을 추가했습니다', target: 'API 문서 작성', time: '10분 전' },
    { id: '3', type: 'task_assigned', user: '이기획', action: '태스크를 배정했습니다', target: '코드 리뷰', time: '30분 전' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIconSolid className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <PlayIconSolid className="w-3 h-3 text-blue-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />;
      default:
        return <ClockIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'comment_added':
        return <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />;
      case 'task_assigned':
        return <UserIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <DocumentIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderOrganizationItem = (org) => {
    const isExpanded = expandedOrgs.has(org.id);
    const isSelected = selectedOrganization?.id === org.id;
    const orgProjects = projects.filter(p => p.organization_id === org.id);
    const orgTeams = teams.filter(t => t.organization_id === org.id);

    return (
      <div key={org.id} className="mb-1">
        {/* 조직 헤더 */}
        <div
          className={`
            flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          onClick={() => onOrganizationSelect(org)}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(org.id);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
            <BuildingOfficeIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate text-sm font-medium">{org.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
              {orgProjects.length + orgTeams.length}
            </span>
          </div>
        </div>

        {/* 조직 하위 항목들 */}
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {/* 팀 섹션 */}
            {orgTeams.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teams ({orgTeams.length})
                  </span>
                  <button
                    onClick={() => onCreateTeam()}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
                {orgTeams.map(team => renderTeamItem(team))}
              </div>
            )}

            {/* 프로젝트 섹션 */}
            {orgProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Projects ({orgProjects.length})
                  </span>
                  <button
                    onClick={() => onCreateProject()}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
                {orgProjects.map(project => renderProjectItem(project))}
              </div>
            )}

            {/* 빈 상태 */}
            {orgTeams.length === 0 && orgProjects.length === 0 && (
              <div className="px-2 py-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  No teams or projects yet
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => onCreateTeam()}
                    className="w-full text-left px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    + Create Team
                  </button>
                  <button
                    onClick={() => onCreateProject()}
                    className="w-full text-left px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    + Create Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTeamItem = (team) => {
    const isSelected = selectedTeam?.id === team.id;
    const taskCount = team.task_count || 0;
    const onlineMembers = team.online_members || 0;

    return (
      <div
        key={team.id}
        className={`
          flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
        `}
        onClick={() => onTeamSelect(team)}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <UserGroupIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate text-sm">{team.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          {onlineMembers > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 dark:text-green-400">{onlineMembers}</span>
            </div>
          )}
          <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
            {taskCount}
          </span>
        </div>
      </div>
    );
  };

  const renderProjectItem = (project) => {
    const isSelected = selectedProject?.id === project.id;
    const taskCount = project.task_count || 0;
    const progress = project.progress || 0;
    const isOverdue = project.due_date && new Date(project.due_date) < new Date();

    return (
      <div
        key={project.id}
        className={`
          group px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
        `}
        onClick={() => onProjectSelect(project)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <FolderIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate text-sm">{project.name}</span>
            {isOverdue && <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
              {taskCount}
            </span>
          </div>
        </div>
        {progress > 0 && (
          <div className="mt-1.5 ml-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : 
                  progress >= 70 ? 'bg-blue-500' : 
                  progress >= 30 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 컴팩트 헤더 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-md" />
            ) : (
              <UserIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* 미니 통계 */}
        {analytics && (
          <div className="flex space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">{analytics.total_tasks || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 dark:text-green-400">{analytics.completed_tasks || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-600 dark:text-blue-400">{analytics.in_progress_tasks || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* 컴팩트 탭 네비게이션 */}
      <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'workspace', label: '워크스페이스', icon: BuildingOfficeIcon },
          { id: 'today', label: '오늘', icon: CalendarIcon },
          { id: 'activity', label: '활동', icon: ChatBubbleLeftIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'workspace' && (
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : organizations.length > 0 ? (
              <div className="space-y-2">
                {organizations.map(renderOrganizationItem)}
              </div>
            ) : (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  아직 조직이 없습니다
                </p>
                <button
                  onClick={onCreateOrganization}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                >
                  + 조직 만들기
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'today' && (
          <div className="p-4 space-y-4">
            {/* 오늘의 일정 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                오늘의 일정
              </h3>
              <div className="space-y-2">
                {mockTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      task.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'
                    } border border-gray-200 dark:border-gray-700`}
                  >
                    <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{task.time}</p>
                    </div>
                    {task.completed && <CheckCircleIconSolid className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 태스크 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                최근 태스크
              </h3>
              <div className="space-y-2">
                {mockRecentTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`w-2 h-2 rounded-full bg-${task.project.color}-500`} />
                        <span>{task.project.name}</span>
                        <FireIcon className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.progress}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4 space-y-4">
            {/* 팀 온라인 상태 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                팀 멤버
              </h3>
              <div className="space-y-2">
                {mockTeamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg">
                    <div className="relative">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <UserIcon className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800 ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                      {member.current_task && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.current_task}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 활동 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                최근 활동
              </h3>
              <div className="space-y-3">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span>님이{' '}
                        <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        {activity.target}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 액션 버튼들 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-1 py-2 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChartBarIcon className="w-3 h-3" />
            <span>분석</span>
          </button>
          <button className="flex items-center justify-center space-x-1 py-2 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <BellIcon className="w-3 h-3" />
            <span>알림</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSidebarContent;