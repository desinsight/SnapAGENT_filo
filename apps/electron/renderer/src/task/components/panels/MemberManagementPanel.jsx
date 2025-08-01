import React, { useState, useRef, useCallback } from 'react';
import {
  XMarkIcon,
  UserGroupIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon,
  EyeIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { TASK_CONFIG } from '../../constants/taskConfig';

const MemberManagementPanel = ({ 
  isOpen, 
  onClose,
  organization,
  team = null,
  members = [],
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onUpdateMemberPermissions,
  onSendMessage,
  onViewProfile,
  onExportMembers,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('members'); // members, invitations, roles, settings
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, pending, inactive
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: TASK_CONFIG.ROLES.ORGANIZATION.MEMBER,
    message: ''
  });

  // Mock 초대 목록 (실제로는 props나 hook에서 가져옴)
  const [invitations] = useState([
    {
      id: 'inv1',
      email: 'newuser@example.com',
      role: TASK_CONFIG.ROLES.ORGANIZATION.MEMBER,
      invited_by: 'current-user',
      invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 'inv2',
      email: 'manager@example.com',
      role: TASK_CONFIG.ROLES.ORGANIZATION.ADMIN,
      invited_by: 'current-user',
      invited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    }
  ]);

  // 역할별 색상
  const getRoleColor = (role) => {
    const colors = {
      [TASK_CONFIG.ROLES.ORGANIZATION.OWNER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      [TASK_CONFIG.ROLES.ORGANIZATION.ADMIN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      [TASK_CONFIG.ROLES.ORGANIZATION.MEMBER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      [TASK_CONFIG.ROLES.ORGANIZATION.VIEWER]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[role] || colors[TASK_CONFIG.ROLES.ORGANIZATION.MEMBER];
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors.active;
  };

  // 멤버 필터링 및 정렬
  const filteredAndSortedMembers = React.useMemo(() => {
    let filtered = [...members];
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    }
    
    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }
    
    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'joined':
          aValue = new Date(a.joined_at);
          bValue = new Date(b.joined_at);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [members, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  // 멤버 초대
  const handleInviteMember = useCallback(async () => {
    if (!newInvitation.email.trim()) return;
    
    try {
      await onInviteMember?.(newInvitation);
      setNewInvitation({ email: '', role: TASK_CONFIG.ROLES.ORGANIZATION.MEMBER, message: '' });
      setShowInviteModal(false);
    } catch (error) {
      console.error('멤버 초대 실패:', error);
    }
  }, [newInvitation, onInviteMember]);

  // 멤버 제거
  const handleRemoveMember = useCallback(async (memberId) => {
    if (window.confirm('이 멤버를 제거하시겠습니까?')) {
      try {
        await onRemoveMember?.(memberId);
      } catch (error) {
        console.error('멤버 제거 실패:', error);
      }
    }
  }, [onRemoveMember]);

  // 역할 변경
  const handleRoleChange = useCallback(async (memberId, newRole) => {
    try {
      await onUpdateMemberRole?.(memberId, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('역할 변경 실패:', error);
    }
  }, [onUpdateMemberRole]);

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now - time) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월 전`;
    return `${Math.floor(diffInDays / 365)}년 전`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">멤버 관리</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {team ? `${team.name} 팀` : organization?.name} - {members.length}명의 멤버
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>멤버 초대</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'members', label: `멤버 (${members.length})`, icon: UserGroupIcon },
              { id: 'invitations', label: `초대 (${invitations.length})`, icon: EnvelopeIcon },
              { id: 'roles', label: '역할 관리', icon: ShieldCheckIcon },
              { id: 'settings', label: '설정', icon: CogIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 h-[calc(90vh-200px)] overflow-hidden flex flex-col">
          {activeTab === 'members' && (
            <>
              {/* 필터 및 검색 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="멤버 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">모든 역할</option>
                    <option value={TASK_CONFIG.ROLES.ORGANIZATION.OWNER}>소유자</option>
                    <option value={TASK_CONFIG.ROLES.ORGANIZATION.ADMIN}>관리자</option>
                    <option value={TASK_CONFIG.ROLES.ORGANIZATION.MEMBER}>멤버</option>
                    <option value={TASK_CONFIG.ROLES.ORGANIZATION.VIEWER}>뷰어</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">이름순</option>
                    <option value="email">이메일순</option>
                    <option value="role">역할순</option>
                    <option value="joined">가입일순</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedMembers.length > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMembers.length}명 선택됨
                    </span>
                  )}
                  <button
                    onClick={() => onExportMembers?.()}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="text-sm">내보내기</span>
                  </button>
                </div>
              </div>

              {/* 멤버 목록 */}
              <div className="flex-1 overflow-y-auto">
                {filteredAndSortedMembers.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, member.id]);
                                } else {
                                  setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                              ) : (
                                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                                  {TASK_CONFIG.ROLE_LABELS[member.role]}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status || 'active')}`}>
                                  {member.status === 'pending' ? '대기중' : member.status === 'inactive' ? '비활성' : '활성'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                가입일: {formatTime(member.joined_at)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onViewProfile?.(member)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="프로필 보기"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onSendMessage?.(member)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="메시지 보내기"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowRoleModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="역할 변경"
                            >
                              <ShieldCheckIcon className="w-4 h-4" />
                            </button>
                            {member.role !== TASK_CONFIG.ROLES.ORGANIZATION.OWNER && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="멤버 제거"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">멤버가 없습니다.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">새 멤버를 초대해보세요.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'invitations' && (
            <div className="flex-1 overflow-y-auto p-4">
              {invitations.length > 0 ? (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <EnvelopeIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{invitation.email}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(invitation.role)}`}>
                                {TASK_CONFIG.ROLE_LABELS[invitation.role]}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                초대일: {formatTime(invitation.invited_at)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                만료: {formatTime(invitation.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm transition-colors">
                            재전송
                          </button>
                          <button className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm transition-colors">
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <EnvelopeIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">대기 중인 초대가 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(TASK_CONFIG.ROLES.ORGANIZATION).map(([key, role]) => (
                  <div key={role} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(role)}`}>
                          {TASK_CONFIG.ROLE_LABELS[role]}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {members.filter(m => m.role === role).length}명
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {TASK_CONFIG.ROLE_DESCRIPTIONS[role]}
                    </p>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">권한:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {TASK_CONFIG.ROLE_PERMISSIONS[role]?.map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">멤버 설정</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">자동 초대 승인</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">초대된 멤버가 자동으로 승인됩니다</p>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">멤버 가시성</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">모든 멤버가 다른 멤버를 볼 수 있습니다</p>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">프로필 편집 허용</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">멤버가 자신의 프로필을 편집할 수 있습니다</p>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">알림 설정</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">새 멤버 가입 알림</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">새로운 멤버가 가입했을 때 알림을 받습니다</p>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">역할 변경 알림</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">멤버의 역할이 변경되었을 때 알림을 받습니다</p>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 멤버 초대 모달 */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">멤버 초대</h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      이메일 주소
                    </label>
                    <input
                      type="email"
                      value={newInvitation.email}
                      onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                      placeholder="example@company.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      역할
                    </label>
                    <select
                      value={newInvitation.role}
                      onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={TASK_CONFIG.ROLES.ORGANIZATION.MEMBER}>멤버</option>
                      <option value={TASK_CONFIG.ROLES.ORGANIZATION.ADMIN}>관리자</option>
                      <option value={TASK_CONFIG.ROLES.ORGANIZATION.VIEWER}>뷰어</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      초대 메시지 (선택사항)
                    </label>
                    <textarea
                      value={newInvitation.message}
                      onChange={(e) => setNewInvitation({ ...newInvitation, message: e.target.value })}
                      placeholder="초대 메시지를 입력하세요..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={handleInviteMember}
                    disabled={!newInvitation.email.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    초대 보내기
                  </button>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 역할 변경 모달 */}
        {showRoleModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">역할 변경</h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedMember.name}의 역할을 변경합니다.
                  </p>
                  
                  <div className="space-y-3">
                    {Object.entries(TASK_CONFIG.ROLES.ORGANIZATION).map(([key, role]) => (
                      <label key={role} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={selectedMember.role === role}
                          onChange={() => setSelectedMember({ ...selectedMember, role })}
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}>
                              {TASK_CONFIG.ROLE_LABELS[role]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {TASK_CONFIG.ROLE_DESCRIPTIONS[role]}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleRoleChange(selectedMember.id, selectedMember.role)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    변경
                  </button>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagementPanel;