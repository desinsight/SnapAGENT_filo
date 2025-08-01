import React from 'react';
import {
  Bars3Icon,
  PlusIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  FolderIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG, VIEW_TYPE_LABELS } from '../../constants/taskConfig';

const TaskHeader = ({
  currentView,
  onViewChange,
  onCreateTask,
  onCreateProject,
  onCreateOrganization,
  onCreateTeam,
  onShowNotifications,
  onShowAnalytics,
  onShowSettings,
  onShowSearch,
  onShowTemplates,
  onShowMembers,
  selectedProject,
  selectedOrganization,
  selectedTeam,
  unreadNotifications = 0,
  selectedTasksCount = 0,
  onShowBulkActions
}) => {
  const viewButtons = [
    { type: TASK_CONFIG.VIEW_TYPES.LIST, label: VIEW_TYPE_LABELS[TASK_CONFIG.VIEW_TYPES.LIST], icon: Bars3Icon },
    { type: TASK_CONFIG.VIEW_TYPES.KANBAN, label: VIEW_TYPE_LABELS[TASK_CONFIG.VIEW_TYPES.KANBAN], icon: DocumentDuplicateIcon },
    { type: TASK_CONFIG.VIEW_TYPES.CALENDAR, label: VIEW_TYPE_LABELS[TASK_CONFIG.VIEW_TYPES.CALENDAR], icon: ChartBarIcon },
    { type: TASK_CONFIG.VIEW_TYPES.GANTT, label: VIEW_TYPE_LABELS[TASK_CONFIG.VIEW_TYPES.GANTT], icon: ChartBarIcon },
    { type: TASK_CONFIG.VIEW_TYPES.TIMELINE, label: VIEW_TYPE_LABELS[TASK_CONFIG.VIEW_TYPES.TIMELINE], icon: ChartBarIcon }
  ];

  const getCurrentContext = () => {
    if (selectedTeam) {
      return {
        type: 'team',
        name: selectedTeam.name,
        subtitle: selectedOrganization?.name || ''
      };
    }
    if (selectedProject) {
      return {
        type: 'project',
        name: selectedProject.name,
        subtitle: selectedOrganization?.name || ''
      };
    }
    if (selectedOrganization) {
      return {
        type: 'organization',
        name: selectedOrganization.name,
        subtitle: '조직 대시보드'
      };
    }
    return {
      type: 'default',
      name: 'Tasks',
      subtitle: '전체 태스크'
    };
  };

  const currentContext = getCurrentContext();

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* 좌측 영역 - 컨텍스트 정보 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {currentContext.type === 'organization' && <BuildingOfficeIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          {currentContext.type === 'team' && <UserGroupIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          {currentContext.type === 'project' && <FolderIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          {currentContext.type === 'default' && <Bars3Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentContext.name}
            </h1>
            {currentContext.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentContext.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* 선택된 태스크 카운터 */}
        {selectedTasksCount > 0 && (
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
              {selectedTasksCount}개 선택됨
            </div>
            <button
              onClick={onShowBulkActions}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              일괄 작업
            </button>
          </div>
        )}
      </div>

      {/* 중앙 영역 - 뷰 선택 */}
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {viewButtons.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onViewChange(type)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${currentView === type
                ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
              }
            `}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* 우측 영역 - 액션 버튼들 */}
      <div className="flex items-center space-x-2">
        {/* 검색 버튼 */}
        <button
          onClick={onShowSearch}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="검색"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>

        {/* 템플릿 버튼 */}
        <button
          onClick={onShowTemplates}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="템플릿"
        >
          <DocumentDuplicateIcon className="w-5 h-5" />
        </button>

        {/* 멤버 관리 버튼 - 조직이나 팀이 선택된 경우에만 표시 */}
        {(selectedOrganization || selectedTeam) && (
          <button
            onClick={onShowMembers}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="멤버 관리"
          >
            <UserGroupIcon className="w-5 h-5" />
          </button>
        )}

        {/* 생성 버튼 드롭다운 */}
        <div className="relative group">
          <button
            onClick={onCreateTask}
            className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            title="새 태스크"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden lg:inline">태스크</span>
            <EllipsisHorizontalIcon className="w-4 h-4 lg:hidden" />
          </button>

          {/* 드롭다운 메뉴 */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-1">
              <button
                onClick={onCreateTask}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>새 태스크</span>
              </button>
              <button
                onClick={onCreateProject}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <FolderIcon className="w-4 h-4" />
                <span>새 프로젝트</span>
              </button>
              <button
                onClick={onCreateTeam}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <UserGroupIcon className="w-4 h-4" />
                <span>새 팀</span>
              </button>
              <button
                onClick={onCreateOrganization}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>새 조직</span>
              </button>
            </div>
          </div>
        </div>

        {/* 알림 버튼 */}
        <button
          onClick={onShowNotifications}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="알림"
        >
          <BellIcon className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* 분석 버튼 */}
        <button
          onClick={onShowAnalytics}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="분석"
        >
          <ChartBarIcon className="w-5 h-5" />
        </button>

        {/* 설정 버튼 */}
        <button
          onClick={onShowSettings}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="설정"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TaskHeader;