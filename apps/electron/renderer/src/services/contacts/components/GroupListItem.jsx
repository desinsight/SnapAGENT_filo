/**
 * 그룹 리스트 아이템 컴포넌트 (아코디언 방식)
 */

import React, { useState } from 'react';

const GroupListItem = ({ group, isExpanded, onToggle, onEdit, onDelete, onNotification }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);

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

  // 멤버 선택 토글
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 전체 선택/해제
  const toggleAllMembers = () => {
    if (selectedMembers.length === group.members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(group.members.map(member => member.id));
    }
  };

  // 선택된 멤버 삭제
  const handleRemoveMembers = () => {
    if (selectedMembers.length === 0) return;
    
    const count = selectedMembers.length;
    if (window.confirm(`선택한 ${count}명의 멤버를 그룹에서 제거하시겠습니까?`)) {
      // 실제로는 API 호출
      setSelectedMembers([]);
      onNotification?.(`${count}명의 멤버가 그룹에서 제거되었습니다.`, 'success');
    }
  };

  // 멤버 액션 (전화, 이메일, 메시지)
  const handleMemberAction = (member, action) => {
    switch (action) {
      case 'call':
        onNotification?.(`${member.name}에게 전화를 겁니다.`, 'info');
        break;
      case 'email':
        onNotification?.(`${member.name}에게 이메일을 보냅니다.`, 'info');
        break;
      case 'message':
        onNotification?.(`${member.name}에게 메시지를 보냅니다.`, 'info');
        break;
      default:
        break;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* 그룹 헤더 */}
      <div 
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 펼치기/접기 아이콘 */}
            <button className="text-gray-400 hover:text-gray-600">
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* 그룹 아이콘 */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: group.color }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            {/* 그룹 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-500">{group.description}</p>
            </div>
          </div>
          
          {/* 그룹 액션 */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {group.memberCount}명
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
        </div>
      </div>

      {/* 펼쳐진 멤버 목록 */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          {/* 멤버 관리 도구 */}
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === group.members.length && group.members.length > 0}
                    onChange={toggleAllMembers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {selectedMembers.length > 0 ? `${selectedMembers.length}명 선택됨` : '전체 선택'}
                  </span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedMembers.length > 0 && (
                  <button
                    onClick={handleRemoveMembers}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    그룹에서 제거
                  </button>
                )}
                <button
                  onClick={() => onNotification?.('멤버 추가 기능은 준비 중입니다.', 'info')}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  멤버 추가
                </button>
              </div>
            </div>
          </div>

          {/* 멤버 목록 */}
          <div className="divide-y divide-gray-200">
            {group.members.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-1">멤버가 없습니다</p>
                <p className="text-sm text-gray-500">이 그룹에 첫 번째 멤버를 추가해보세요.</p>
              </div>
            ) : (
              group.members.map((member) => (
                <div key={member.id} className="p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          {member.company && (
                            <p className="text-xs text-gray-400">{member.company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMemberAction(member, 'call')}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="전화"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMemberAction(member, 'email')}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="이메일"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMemberAction(member, 'message')}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="메시지"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupListItem;