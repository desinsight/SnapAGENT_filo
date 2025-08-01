import React from 'react';

const TeamForm = ({ isOpen, onClose, onSubmit, organizations = [], selectedOrganization }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">새 팀 만들기</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-amber-600 dark:text-amber-400">🚧 Phase 2에서 구현 예정</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400">취소</button>
          <button onClick={onClose} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">저장</button>
        </div>
      </div>
    </div>
  );
};

export default TeamForm;