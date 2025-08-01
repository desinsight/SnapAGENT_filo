/**
 * 연락처 그룹 관리 패널
 */

import React, { useState } from 'react';
import GroupListItem from './GroupListItem';
import CreateGroupModal from './CreateGroupModal';
import EditGroupModal from './EditGroupModal';

const ContactGroupPanel = ({ activePanel, onNotification }) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set()); // 펼쳐진 그룹들
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 임시 그룹 데이터
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: '동료',
      description: '함께 일하는 동료들',
      color: '#3b82f6',
      memberCount: 12,
      createdAt: '2024-01-15',
      members: [
        { id: 1, name: '김철수', email: 'kim@company.com', phone: '010-1234-5678', company: 'Samsung' },
        { id: 2, name: '이영희', email: 'lee@company.com', phone: '010-2345-6789', company: 'Naver' },
        { id: 3, name: '박민수', email: 'park@company.com', phone: '010-3456-7890', company: 'Kakao' },
      ]
    },
    {
      id: 2,
      name: '고객',
      description: '중요한 고객 연락처',
      color: '#10b981',
      memberCount: 8,
      createdAt: '2024-01-20',
      members: [
        { id: 4, name: '최지혜', email: 'choi@client.com', phone: '010-4567-8901', company: 'Client A' },
        { id: 5, name: '정수현', email: 'jung@client.com', phone: '010-5678-9012', company: 'Client B' },
      ]
    },
    {
      id: 3,
      name: '파트너',
      description: '비즈니스 파트너들',
      color: '#8b5cf6',
      memberCount: 5,
      createdAt: '2024-02-01',
      members: [
        { id: 6, name: '한민구', email: 'han@partner.com', phone: '010-6789-0123', company: 'Partner Co' },
      ]
    },
    {
      id: 4,
      name: '친구',
      description: '개인적인 친구들',
      color: '#f59e0b',
      memberCount: 15,
      createdAt: '2024-01-10',
      members: [
        { id: 7, name: '송미경', email: 'song@friend.com', phone: '010-7890-1234', company: '' },
        { id: 8, name: '윤대현', email: 'yoon@friend.com', phone: '010-8901-2345', company: '' },
      ]
    },
    {
      id: 5,
      name: '가족',
      description: '가족 구성원들',
      color: '#ef4444',
      memberCount: 6,
      createdAt: '2024-01-05',
      members: [
        { id: 9, name: '김아버지', email: 'father@family.com', phone: '010-9012-3456', company: '' },
        { id: 10, name: '김어머니', email: 'mother@family.com', phone: '010-0123-4567', company: '' },
      ]
    }
  ]);

  // 그룹 생성
  const handleCreateGroup = (groupData) => {
    const newGroup = {
      id: Date.now(),
      ...groupData,
      memberCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      members: []
    };
    setGroups([...groups, newGroup]);
    setIsCreateModalOpen(false);
    onNotification?.('새 그룹이 생성되었습니다.', 'success');
  };

  // 그룹 수정
  const handleEditGroup = (groupData) => {
    setGroups(groups.map(group => 
      group.id === editingGroup.id ? { ...group, ...groupData } : group
    ));
    setIsEditModalOpen(false);
    setEditingGroup(null);
    onNotification?.('그룹이 수정되었습니다.', 'success');
  };

  // 그룹 삭제
  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter(group => group.id !== groupId));
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
      setViewMode('groups');
    }
    onNotification?.('그룹이 삭제되었습니다.', 'success');
  };

  // 그룹 펼치기/접기 토글
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // 그룹 편집 모달 열기
  const handleEditClick = (group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  // 검색 필터링
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
            <p className="text-sm text-gray-600">
              총 {filteredGroups.length}개의 그룹
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 그룹
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mt-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="그룹 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredGroups.map((group) => (
            <GroupListItem
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              onToggle={() => toggleGroupExpansion(group.id)}
              onEdit={() => handleEditClick(group)}
              onDelete={() => handleDeleteGroup(group.id)}
              onNotification={onNotification}
            />
          ))}
        </div>
      </div>

      {/* 모달들 */}
      {isCreateModalOpen && (
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
        />
      )}

      {isEditModalOpen && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          group={editingGroup}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingGroup(null);
          }}
          onSubmit={handleEditGroup}
        />
      )}
    </div>
  );
};

export default ContactGroupPanel;