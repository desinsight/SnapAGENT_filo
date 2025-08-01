/**
 * 그룹 카드 컴포넌트
 */

import React from 'react';

const GroupCard = ({ group, onSelect, onEdit, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`)) {
      onDelete(group.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(group);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      {/* 그룹 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: group.color }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            <p className="text-sm text-gray-500">{group.memberCount}명</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 그룹 설명 */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {group.description}
      </p>

      {/* 그룹 정보 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>생성일: {group.createdAt}</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>최근 활동</span>
        </div>
      </div>

      {/* 멤버 프리뷰 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            {group.members.slice(0, 3).map((member, index) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 80%)` }}
              >
                {member.name.charAt(0)}
              </div>
            ))}
            {group.memberCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{group.memberCount - 3}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {group.memberCount === 0 ? '멤버 없음' : `${group.memberCount}명의 멤버`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;