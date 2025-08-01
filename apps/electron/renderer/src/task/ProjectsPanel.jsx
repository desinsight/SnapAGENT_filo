import React from 'react';

const ProjectsPanel = ({ activePanel, onNotification, children }) => {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">프로젝트 관리</h2>
        <p className="text-gray-500 dark:text-gray-400">조직, 프로젝트, 팀 관리 기능이 여기에 들어갑니다.</p>
        <div className="mt-8 text-center">
          <div className="text-blue-600 dark:text-blue-400 text-lg">🚧 구현 예정</div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ProjectsPanel;