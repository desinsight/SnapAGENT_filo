import React from 'react';

const TimelineView = ({
  tasks = [],
  selectedTask,
  selectedTasks = [],
  onTaskSelect,
  onTaskEdit,
  onTaskCreate,
  onTaskDelete,
  onSelectionChange,
  loading = false,
  error = null,
  projects = [],
  organizations = [],
  teams = [],
  currentProject,
  currentOrganization,
  currentTeam
}) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            타임라인 뷰
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            시간순으로 태스크 활동을 추적할 수 있습니다.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            🚧 Phase 3에서 구현 예정
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;