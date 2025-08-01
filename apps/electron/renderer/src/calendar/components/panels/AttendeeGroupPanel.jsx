import React, { useState, useEffect, useMemo } from 'react';

const AttendeeGroupPanel = ({
  isOpen,
  onClose,
  event,
  attendees = [],
  existingGroups = [],
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignToGroup,
  onRemoveFromGroup,
  onBulkGroupAction,
  availableUsers = [],
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('groups');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [draggedMember, setDraggedMember] = useState(null);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'department', // department, team, project, custom
    color: '#3B82F6',
    permissions: {
      canInvite: true,
      canModify: false,
      canViewAll: true
    },
    settings: {
      autoAssign: false,
      notifyChanges: true,
      allowSelfJoin: false
    }
  });

  // 그룹 타입 정의
  const groupTypes = [
    { value: 'department', label: '부서', icon: '🏢', color: 'blue' },
    { value: 'team', label: '팀', icon: '👥', color: 'green' },
    { value: 'project', label: '프로젝트', icon: '📁', color: 'purple' },
    { value: 'role', label: '역할', icon: '🎭', color: 'orange' },
    { value: 'location', label: '지역', icon: '📍', color: 'red' },
    { value: 'custom', label: '사용자 정의', icon: '⚙️', color: 'gray' }
  ];

  // 그룹 통계
  const groupStats = useMemo(() => {
    const stats = {
      totalGroups: existingGroups.length,
      totalMembers: attendees.length,
      ungrouped: 0,
      byType: {}
    };

    // 그룹이 없는 참석자 계산
    const groupedAttendeeIds = new Set();
    existingGroups.forEach(group => {
      group.members?.forEach(member => groupedAttendeeIds.add(member.id));
    });
    stats.ungrouped = attendees.length - groupedAttendeeIds.size;

    // 타입별 통계
    existingGroups.forEach(group => {
      const type = group.type || 'custom';
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, members: 0 };
      }
      stats.byType[type].count++;
      stats.byType[type].members += group.members?.length || 0;
    });

    return stats;
  }, [existingGroups, attendees]);

  // 필터링된 그룹
  const filteredGroups = useMemo(() => {
    let filtered = [...existingGroups];

    if (groupFilter !== 'all') {
      filtered = filtered.filter(group => group.type === groupFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [existingGroups, groupFilter, searchQuery]);

  // 그룹이 없는 참석자들
  const ungroupedAttendees = useMemo(() => {
    const groupedIds = new Set();
    existingGroups.forEach(group => {
      group.members?.forEach(member => groupedIds.add(member.id));
    });
    return attendees.filter(attendee => !groupedIds.has(attendee.id));
  }, [attendees, existingGroups]);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    const groupData = {
      ...newGroup,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      eventId: event.id,
      members: []
    };

    await onCreateGroup(groupData);
    setNewGroup({
      name: '',
      description: '',
      type: 'department',
      color: '#3B82F6',
      permissions: { canInvite: true, canModify: false, canViewAll: true },
      settings: { autoAssign: false, notifyChanges: true, allowSelfJoin: false }
    });
    setShowCreateForm(false);
  };

  const handleDragStart = (e, attendee) => {
    setDraggedMember(attendee);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, groupId) => {
    e.preventDefault();
    if (draggedMember) {
      await onAssignToGroup(groupId, draggedMember.id);
      setDraggedMember(null);
    }
  };

  const getTypeInfo = (type) => {
    return groupTypes.find(t => t.value === type) || groupTypes[groupTypes.length - 1];
  };

  const handleBulkAction = async (action) => {
    if (selectedMembers.size === 0) return;
    
    const memberIds = Array.from(selectedMembers);
    await onBulkGroupAction(action, memberIds);
    setSelectedMembers(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-gray-100">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">참석자 그룹 관리</h2>
              <p className="text-indigo-200 mt-1 font-medium">{event?.title}</p>
              <div className="flex items-center gap-6 mt-3 text-sm">
                <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  {groupStats.totalGroups}개 그룹
                </span>
                <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  {groupStats.totalMembers}명 참석자
                </span>
                <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                  {groupStats.ungrouped}명 미분류
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors font-medium"
              >
                + 그룹 생성
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-indigo-800 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 및 필터 */}
        <div className="px-8 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex bg-white rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'groups'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  그룹 관리
                </button>
                <button
                  onClick={() => setActiveTab('assignment')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'assignment'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  멤버 배정
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  통계 분석
                </button>
              </div>
              
              {activeTab === 'groups' && (
                <div className="flex items-center gap-3">
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">전체 그룹</option>
                    {groupTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="그룹 검색..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {selectedMembers.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {selectedMembers.size}명 선택됨
                </span>
                <button
                  onClick={() => handleBulkAction('moveToGroup')}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  그룹 이동
                </button>
                <button
                  onClick={() => handleBulkAction('removeFromGroups')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  그룹 해제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {/* 그룹 관리 탭 */}
          {activeTab === 'groups' && (
            <div className="h-full flex">
              {/* 그룹 목록 */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredGroups.map(group => {
                    const typeInfo = getTypeInfo(group.type);
                    return (
                      <div
                        key={group.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => setSelectedGroup(group)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, group.id)}
                      >
                        {/* 그룹 헤더 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-sm"
                              style={{ backgroundColor: group.color }}
                            >
                              {typeInfo.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span>{typeInfo.label}</span>
                                <span>•</span>
                                <span>{group.members?.length || 0}명</span>
                              </p>
                            </div>
                          </div>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>

                        {/* 그룹 설명 */}
                        {group.description && (
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {group.description}
                          </p>
                        )}

                        {/* 멤버 아바타 */}
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {group.members?.slice(0, 5).map((member, index) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                                title={member.name}
                              >
                                {member.name.charAt(0)}
                              </div>
                            ))}
                            {(group.members?.length || 0) > 5 && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-semibold">
                                +{(group.members?.length || 0) - 5}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              group.settings?.autoAssign ? 'bg-green-400' : 'bg-gray-300'
                            }`} title={group.settings?.autoAssign ? '자동 배정 활성' : '수동 배정'}></div>
                            <div className={`w-2 h-2 rounded-full ${
                              group.permissions?.canInvite ? 'bg-blue-400' : 'bg-gray-300'
                            }`} title={group.permissions?.canInvite ? '초대 가능' : '초대 불가'}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 미분류 참석자 */}
              <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">미분류 참석자</h3>
                  <p className="text-sm text-gray-600">{ungroupedAttendees.length}명이 그룹에 배정되지 않았습니다</p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ungroupedAttendees.map(attendee => (
                    <div
                      key={attendee.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, attendee)}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm cursor-move transition-all"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {attendee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{attendee.name}</p>
                        <p className="text-xs text-gray-500 truncate">{attendee.department || attendee.email}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 멤버 배정 탭 */}
          {activeTab === 'assignment' && (
            <div className="p-8">
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">스마트 멤버 배정</p>
                <p className="text-gray-600 mb-6">AI가 부서, 역할, 관심사를 분석하여 최적의 그룹을 제안합니다</p>
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                  자동 배정 실행
                </button>
              </div>
            </div>
          )}

          {/* 통계 분석 탭 */}
          {activeTab === 'analytics' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(groupStats.byType).map(([type, stats]) => {
                  const typeInfo = getTypeInfo(type);
                  return (
                    <div key={type} className="bg-white border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 bg-${typeInfo.color}-100 rounded-xl flex items-center justify-center`}>
                          <span className="text-lg">{typeInfo.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{typeInfo.label}</p>
                          <p className="text-sm text-gray-600">{stats.count}개 그룹</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{stats.members}</div>
                      <div className="text-sm text-gray-600">총 멤버 수</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 그룹 생성 모달 */}
        {showCreateForm && (
          <GroupCreateModal
            newGroup={newGroup}
            setNewGroup={setNewGroup}
            groupTypes={groupTypes}
            onCreate={handleCreateGroup}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
};

// 그룹 생성 모달 컴포넌트
const GroupCreateModal = ({ newGroup, setNewGroup, groupTypes, onCreate, onClose }) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">새 그룹 생성</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">그룹명 *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="예: 개발팀, 마케팅부서"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">그룹 타입</label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {groupTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="그룹에 대한 간단한 설명을 입력하세요"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">그룹 색상</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newGroup.color}
                  onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                  className="w-12 h-12 border border-gray-200 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={newGroup.color}
                  onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">권한 설정</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newGroup.permissions.canInvite}
                      onChange={(e) => setNewGroup({
                        ...newGroup,
                        permissions: { ...newGroup.permissions, canInvite: e.target.checked }
                      })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">멤버 초대 허용</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newGroup.permissions.canModify}
                      onChange={(e) => setNewGroup({
                        ...newGroup,
                        permissions: { ...newGroup.permissions, canModify: e.target.checked }
                      })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">그룹 수정 허용</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">고급 설정</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newGroup.settings.autoAssign}
                      onChange={(e) => setNewGroup({
                        ...newGroup,
                        settings: { ...newGroup.settings, autoAssign: e.target.checked }
                      })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">자동 배정</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newGroup.settings.notifyChanges}
                      onChange={(e) => setNewGroup({
                        ...newGroup,
                        settings: { ...newGroup.settings, notifyChanges: e.target.checked }
                      })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">변경사항 알림</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onCreate}
              disabled={!newGroup.name.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              그룹 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeGroupPanel;