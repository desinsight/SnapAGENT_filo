// 태스크 메인 패널 컴포넌트
import React, { useState, useEffect, useCallback } from 'react';
import { TASK_CONFIG } from './constants/taskConfig';

// 컴포넌트 import
import TaskHeader from './components/ui/TaskHeader';
import TaskToolbar from './components/ui/TaskToolbar';
import ListView from './components/views/ListView';
import KanbanView from './components/views/KanbanView';
import CalendarView from './components/views/CalendarView';
import GanttView from './components/views/GanttView';
import TimelineView from './components/views/TimelineView';
import TaskForm from './components/forms/TaskForm';
import TaskDetail from './components/forms/TaskDetail';
import ProjectForm from './components/forms/ProjectForm';
import OrganizationForm from './components/forms/OrganizationForm';
import TeamForm from './components/forms/TeamForm';
import TaskTemplatePanel from './components/panels/TaskTemplatePanel';
import CollaborationPanel from './components/panels/CollaborationPanel';
import AnalyticsPanel from './components/panels/AnalyticsPanel';
import NotificationPanel from './components/panels/NotificationPanel';
import BulkActionsPanel from './components/panels/BulkActionsPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import SearchPanel from './components/panels/SearchPanel';
import FileAttachmentPanel from './components/panels/FileAttachmentPanel';
import RecurringTaskPanel from './components/panels/RecurringTaskPanel';
import DependencyPanel from './components/panels/DependencyPanel';
import TimeTrackingPanel from './components/panels/TimeTrackingPanel';
import MemberManagementPanel from './components/panels/MemberManagementPanel';

// 훅 import
import useTasks from './hooks/useTasks';
import useProjects from './hooks/useProjects';
import useOrganizations from './hooks/useOrganizations';
import useTeams from './hooks/useTeams';
import useTaskUI from './hooks/useTaskUI';
import useNotifications from './hooks/useNotifications';
import useCollaboration from './hooks/useCollaboration';
import useAnalytics from './hooks/useAnalytics';

const TaskPanel = ({ activePanel, onNotification, children }) => {
  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState(TASK_CONFIG.DEFAULT_SETTINGS.view);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // 모달 상태 관리
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showBulkActionsPanel, setShowBulkActionsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);
  const [showDependencyPanel, setShowDependencyPanel] = useState(false);
  const [showTimeTrackingPanel, setShowTimeTrackingPanel] = useState(false);
  const [showMemberPanel, setShowMemberPanel] = useState(false);


  // 커스텀 훅 사용
  const {
    tasks,
    filteredTasks,
    loading: tasksLoading,
    error: tasksError,
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
  } = useTasks(selectedProject?.id, selectedOrganization?.id, selectedTeam?.id);

  const {
    projects,
    loading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
    getProjectStats
  } = useProjects(selectedOrganization?.id);

  const {
    organizations,
    loading: organizationsLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    loadOrganizations,
    getOrganizationStats
  } = useOrganizations();

  const {
    teams,
    loading: teamsLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    loadTeams,
    getTeamStats
  } = useTeams(selectedOrganization?.id);

  const {
    uiSettings,
    updateUISettings,
    activeFilters,
    setActiveFilters,
    viewSettings,
    updateViewSettings,
    quickFilters,
    setQuickFilters
  } = useTaskUI();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  } = useNotifications();

  const {
    comments,
    mentions,
    activity,
    addComment,
    updateComment,
    deleteComment,
    loadComments,
    loadActivity,
    createMention
  } = useCollaboration(selectedTask?.id);

  const {
    analytics,
    productivity,
    teamPerformance,
    projectProgress,
    loadAnalytics,
    generateReport,
    exportData
  } = useAnalytics(selectedOrganization?.id, selectedTeam?.id, selectedProject?.id);

  // 초기 데이터 로드
  useEffect(() => {
    loadOrganizations();
    loadNotifications();
    loadAnalytics();
  }, []);

  // 조직 선택 시 하위 데이터 로드
  useEffect(() => {
    if (selectedOrganization) {
      loadProjects();
      loadTeams();
    }
  }, [selectedOrganization]);

  // 프로젝트/팀 선택 시 태스크 로드
  useEffect(() => {
    if (selectedProject || selectedTeam) {
      loadTasks();
    }
  }, [selectedProject, selectedTeam]);

  // 태스크 선택 시 협업 데이터 로드
  useEffect(() => {
    if (selectedTask) {
      loadComments();
      loadActivity();
    }
  }, [selectedTask]);

  // 뷰 변경 핸들러
  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    updateViewSettings({ view });
  }, [updateViewSettings]);

  // 태스크 선택 핸들러
  const handleTaskSelect = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  }, []);

  // 태스크 편집 핸들러
  const handleTaskEdit = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  }, []);

  // 태스크 생성 핸들러
  const handleTaskCreate = useCallback((initialData = {}) => {
    setSelectedTask(initialData);
    setShowTaskForm(true);
  }, []);

  // 태스크 저장 핸들러
  const handleTaskSave = useCallback(async (taskData) => {
    try {
      if (selectedTask?.id) {
        await updateTask(selectedTask.id, taskData);
        onNotification?.('태스크가 업데이트되었습니다.', 'success');
      } else {
        await createTask(taskData);
        onNotification?.('새 태스크가 생성되었습니다.', 'success');
      }
      setShowTaskForm(false);
      setSelectedTask(null);
      refreshTasks();
    } catch (error) {
      console.error('태스크 저장 실패:', error);
      onNotification?.('태스크 저장에 실패했습니다.', 'error');
    }
  }, [selectedTask, createTask, updateTask, refreshTasks, onNotification]);

  // 태스크 삭제 핸들러
  const handleTaskDelete = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId);
      onNotification?.('태스크가 삭제되었습니다.', 'success');
      setShowTaskDetail(false);
      setSelectedTask(null);
      refreshTasks();
    } catch (error) {
      console.error('태스크 삭제 실패:', error);
      onNotification?.('태스크 삭제에 실패했습니다.', 'error');
    }
  }, [deleteTask, refreshTasks, onNotification]);

  // 프로젝트 선택 핸들러
  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setSelectedTeam(null);
  }, []);

  // 조직 선택 핸들러
  const handleOrganizationSelect = useCallback((organization) => {
    setSelectedOrganization(organization);
    setSelectedProject(null);
    setSelectedTask(null);
    setSelectedTeam(null);
  }, []);

  // 팀 선택 핸들러
  const handleTeamSelect = useCallback((team) => {
    setSelectedTeam(team);
    setSelectedTask(null);
    setSelectedProject(null);
  }, []);

  // 일괄 작업 핸들러
  const handleBulkAction = useCallback(async (action, taskIds) => {
    try {
      await bulkUpdateTasks(taskIds, action);
      onNotification?.(`${taskIds.length}개 태스크에 대한 작업이 완료되었습니다.`, 'success');
      setSelectedTasks([]);
      setShowBulkActionsPanel(false);
      refreshTasks();
    } catch (error) {
      console.error('일괄 작업 실패:', error);
      onNotification?.('일괄 작업에 실패했습니다.', 'error');
    }
  }, [bulkUpdateTasks, refreshTasks, onNotification]);

  // 검색 핸들러
  const handleSearch = useCallback((query, filters) => {
    setSearchQuery(query);
    updateFilters(filters);
  }, [setSearchQuery, updateFilters]);

  // 뷰 컴포넌트 렌더링
  const renderMainView = () => {
    const commonProps = {
      tasks: filteredTasks,
      selectedTask,
      selectedTasks,
      onTaskSelect: handleTaskSelect,
      onTaskEdit: handleTaskEdit,
      onTaskCreate: handleTaskCreate,
      onTaskDelete: handleTaskDelete,
      onSelectionChange: setSelectedTasks,
      loading: tasksLoading,
      error: tasksError,
      projects,
      organizations,
      teams,
      currentProject: selectedProject,
      currentOrganization: selectedOrganization,
      currentTeam: selectedTeam
    };

    switch (currentView) {
      case TASK_CONFIG.VIEW_TYPES.LIST:
        return <ListView {...commonProps} />;
      case TASK_CONFIG.VIEW_TYPES.KANBAN:
        return <KanbanView {...commonProps} onTaskUpdate={updateTask} />;
      case TASK_CONFIG.VIEW_TYPES.CALENDAR:
        return <CalendarView {...commonProps} />;
      case TASK_CONFIG.VIEW_TYPES.GANTT:
        return <GanttView {...commonProps} />;
      case TASK_CONFIG.VIEW_TYPES.TIMELINE:
        return <TimelineView {...commonProps} />;
      default:
        return <ListView {...commonProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 헤더 */}
      <TaskHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        onCreateTask={() => handleTaskCreate()}
        onCreateProject={() => setShowProjectForm(true)}
        onCreateOrganization={() => setShowOrganizationForm(true)}
        onCreateTeam={() => setShowTeamForm(true)}
        onShowNotifications={() => setShowNotificationPanel(true)}
        onShowAnalytics={() => setShowAnalyticsPanel(true)}
        onShowSettings={() => setShowSettingsPanel(true)}
        onShowSearch={() => setShowSearchPanel(true)}
        onShowTemplates={() => setShowTemplatePanel(true)}
        onShowMembers={() => setShowMemberPanel(true)}
        selectedProject={selectedProject}
        selectedOrganization={selectedOrganization}
        selectedTeam={selectedTeam}
        unreadNotifications={unreadCount}
        selectedTasksCount={selectedTasks.length}
        onShowBulkActions={() => setShowBulkActionsPanel(true)}
      />

      {/* 툴바 */}
      <TaskToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={updateFilters}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        quickFilters={quickFilters}
        onQuickFiltersChange={setQuickFilters}
        onRefresh={refreshTasks}
        loading={tasksLoading}
        totalTasks={filteredTasks.length}
        onAdvancedSearch={() => setShowSearchPanel(true)}
      />

      {/* 메인 뷰 */}
      <div className="flex-1 overflow-hidden">
        {renderMainView()}
      </div>

      {/* 태스크 폼 모달 */}
      {showTaskForm && (
        <TaskForm
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setSelectedTask(null);
          }}
          onSubmit={handleTaskSave}
          task={selectedTask}
          projects={projects}
          organizations={organizations}
          teams={teams}
          mode={selectedTask?.id ? 'edit' : 'create'}
          onShowDependencies={() => setShowDependencyPanel(true)}
          onShowRecurring={() => setShowRecurringPanel(true)}
          onShowTimeTracking={() => setShowTimeTrackingPanel(true)}
          onShowFiles={() => setShowFilePanel(true)}
        />
      )}

      {/* 태스크 상세 모달 */}
      {showTaskDetail && selectedTask && (
        <TaskDetail
          isOpen={showTaskDetail}
          task={selectedTask}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDelete}
          onDuplicate={(task) => handleTaskCreate({ ...task, id: null, title: `${task.title} (복사)` })}
          comments={comments}
          activity={activity}
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
          onCreateMention={createMention}
          onShowCollaboration={() => setShowCollaborationPanel(true)}
          onShowTimeTracking={() => setShowTimeTrackingPanel(true)}
          onShowFiles={() => setShowFilePanel(true)}
        />
      )}

      {/* 프로젝트 폼 모달 */}
      {showProjectForm && (
        <ProjectForm
          isOpen={showProjectForm}
          onClose={() => setShowProjectForm(false)}
          onSubmit={async (projectData) => {
            try {
              await createProject(projectData);
              onNotification?.('새 프로젝트가 생성되었습니다.', 'success');
              setShowProjectForm(false);
              loadProjects();
            } catch (error) {
              console.error('프로젝트 생성 실패:', error);
              onNotification?.('프로젝트 생성에 실패했습니다.', 'error');
            }
          }}
          organizations={organizations}
          selectedOrganization={selectedOrganization}
        />
      )}

      {/* 조직 폼 모달 */}
      {showOrganizationForm && (
        <OrganizationForm
          isOpen={showOrganizationForm}
          onClose={() => setShowOrganizationForm(false)}
          onSubmit={async (organizationData) => {
            try {
              await createOrganization(organizationData);
              onNotification?.('새 조직이 생성되었습니다.', 'success');
              setShowOrganizationForm(false);
              loadOrganizations();
            } catch (error) {
              console.error('조직 생성 실패:', error);
              onNotification?.('조직 생성에 실패했습니다.', 'error');
            }
          }}
        />
      )}

      {/* 팀 폼 모달 */}
      {showTeamForm && (
        <TeamForm
          isOpen={showTeamForm}
          onClose={() => setShowTeamForm(false)}
          onSubmit={async (teamData) => {
            try {
              await createTeam(teamData);
              onNotification?.('새 팀이 생성되었습니다.', 'success');
              setShowTeamForm(false);
              loadTeams();
            } catch (error) {
              console.error('팀 생성 실패:', error);
              onNotification?.('팀 생성에 실패했습니다.', 'error');
            }
          }}
          organizations={organizations}
          selectedOrganization={selectedOrganization}
        />
      )}

      {/* 템플릿 패널 */}
      {showTemplatePanel && (
        <TaskTemplatePanel
          isOpen={showTemplatePanel}
          onClose={() => setShowTemplatePanel(false)}
          onSelectTemplate={(template) => {
            handleTaskCreate(template);
            setShowTemplatePanel(false);
          }}
        />
      )}

      {/* 협업 패널 */}
      {showCollaborationPanel && (
        <CollaborationPanel
          isOpen={showCollaborationPanel}
          onClose={() => setShowCollaborationPanel(false)}
          task={selectedTask}
          comments={comments}
          activity={activity}
          mentions={mentions}
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
          onCreateMention={createMention}
        />
      )}

      {/* 분석 패널 */}
      {showAnalyticsPanel && (
        <AnalyticsPanel
          isOpen={showAnalyticsPanel}
          onClose={() => setShowAnalyticsPanel(false)}
          analytics={analytics}
          productivity={productivity}
          teamPerformance={teamPerformance}
          projectProgress={projectProgress}
          onGenerateReport={generateReport}
          onExportData={exportData}
        />
      )}

      {/* 알림 패널 */}
      {showNotificationPanel && (
        <NotificationPanel
          isOpen={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDeleteNotification={deleteNotification}
        />
      )}

      {/* 일괄 작업 패널 */}
      {showBulkActionsPanel && selectedTasks.length > 0 && (
        <BulkActionsPanel
          isOpen={showBulkActionsPanel}
          onClose={() => setShowBulkActionsPanel(false)}
          selectedTasks={selectedTasks}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedTasks([])}
        />
      )}

      {/* 설정 패널 */}
      {showSettingsPanel && (
        <SettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          uiSettings={uiSettings}
          onUpdateUISettings={updateUISettings}
          viewSettings={viewSettings}
          onUpdateViewSettings={updateViewSettings}
        />
      )}

      {/* 검색 패널 */}
      {showSearchPanel && (
        <SearchPanel
          isOpen={showSearchPanel}
          onClose={() => setShowSearchPanel(false)}
          onSearch={handleSearch}
          initialQuery={searchQuery}
          initialFilters={filters}
          projects={projects}
          organizations={organizations}
          teams={teams}
        />
      )}

      {/* 파일 첨부 패널 */}
      {showFilePanel && selectedTask && (
        <FileAttachmentPanel
          isOpen={showFilePanel}
          onClose={() => setShowFilePanel(false)}
          task={selectedTask}
          onFilesUpdate={(files) => {
            // 파일 업데이트 로직
            onNotification?.('파일이 업데이트되었습니다.', 'success');
          }}
        />
      )}

      {/* 반복 태스크 패널 */}
      {showRecurringPanel && selectedTask && (
        <RecurringTaskPanel
          isOpen={showRecurringPanel}
          onClose={() => setShowRecurringPanel(false)}
          task={selectedTask}
          onRecurrenceUpdate={(recurrence) => {
            // 반복 설정 업데이트 로직
            onNotification?.('반복 설정이 업데이트되었습니다.', 'success');
          }}
        />
      )}

      {/* 종속성 패널 */}
      {showDependencyPanel && selectedTask && (
        <DependencyPanel
          isOpen={showDependencyPanel}
          onClose={() => setShowDependencyPanel(false)}
          task={selectedTask}
          availableTasks={tasks}
          onDependenciesUpdate={(dependencies) => {
            // 종속성 업데이트 로직
            onNotification?.('종속성이 업데이트되었습니다.', 'success');
          }}
        />
      )}

      {/* 시간 추적 패널 */}
      {showTimeTrackingPanel && selectedTask && (
        <TimeTrackingPanel
          isOpen={showTimeTrackingPanel}
          onClose={() => setShowTimeTrackingPanel(false)}
          task={selectedTask}
          onTimeEntryUpdate={(timeEntry) => {
            // 시간 추적 업데이트 로직
            onNotification?.('시간 추적이 업데이트되었습니다.', 'success');
          }}
        />
      )}

      {/* 멤버 관리 패널 */}
      {showMemberPanel && (selectedOrganization || selectedTeam) && (
        <MemberManagementPanel
          isOpen={showMemberPanel}
          onClose={() => setShowMemberPanel(false)}
          organization={selectedOrganization}
          team={selectedTeam}
          members={selectedTeam ? selectedTeam.members : selectedOrganization?.members || []}
          onInviteMember={async (invitationData) => {
            // 멤버 초대 로직
            onNotification?.('멤버 초대가 전송되었습니다.', 'success');
          }}
          onRemoveMember={async (memberId) => {
            // 멤버 제거 로직
            onNotification?.('멤버가 제거되었습니다.', 'success');
          }}
          onUpdateMemberRole={async (memberId, newRole) => {
            // 멤버 역할 업데이트 로직
            onNotification?.('멤버 역할이 변경되었습니다.', 'success');
          }}
          onSendMessage={(member) => {
            // 메시지 보내기 로직
            onNotification?.(`${member.name}에게 메시지를 보냈습니다.`, 'success');
          }}
          onViewProfile={(member) => {
            // 프로필 보기 로직
            console.log('프로필 보기:', member);
          }}
          onExportMembers={() => {
            // 멤버 내보내기 로직
            onNotification?.('멤버 목록이 내보내기되었습니다.', 'success');
          }}
        />
      )}
    </div>
  );
};

export default TaskPanel;