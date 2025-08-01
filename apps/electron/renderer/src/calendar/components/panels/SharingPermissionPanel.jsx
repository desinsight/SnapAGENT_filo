// 고급 공유 및 권한 관리 패널
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '../../utils/dateHelpers';

const SharingPermissionPanel = ({
  isOpen,
  onClose,
  calendar,
  event,
  sharedUsers = [],
  availableUsers = [],
  onShareWithUser,
  onUpdatePermissions,
  onRevokeAccess,
  onCreatePublicLink,
  onUpdatePublicLink,
  onDeletePublicLink,
  onSendInvitation,
  onBulkPermissionUpdate,
  currentUser,
  isOrganizer = false
}) => {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'links', 'settings', 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [inviteSettings, setInviteSettings] = useState({
    permission: 'view',
    message: '',
    expiresAt: null,
    requireApproval: false,
    allowReshare: false,
    notifyByEmail: true
  });
  const [publicLinks, setPublicLinks] = useState([]);
  const [linkSettings, setLinkSettings] = useState({
    permission: 'view',
    expiresAt: null,
    password: '',
    allowDownload: true,
    trackAccess: true,
    maxAccess: null
  });
  const [permissionTemplates, setPermissionTemplates] = useState([]);
  const [sharingHistory, setSharingHistory] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // 권한 레벨 정의
  const PERMISSION_LEVELS = {
    owner: {
      label: '소유자',
      description: '모든 권한 (삭제, 공유 관리 포함)',
      color: 'text-purple-700 bg-purple-100',
      actions: ['view', 'edit', 'delete', 'share', 'manage']
    },
    admin: {
      label: '관리자',
      description: '편집, 공유 관리 (삭제 제외)',
      color: 'text-red-700 bg-red-100',
      actions: ['view', 'edit', 'share', 'manage']
    },
    editor: {
      label: '편집자',
      description: '보기, 편집 권한',
      color: 'text-blue-700 bg-blue-100',
      actions: ['view', 'edit']
    },
    commenter: {
      label: '댓글 작성자',
      description: '보기, 댓글 작성 권한',
      color: 'text-green-700 bg-green-100',
      actions: ['view', 'comment']
    },
    viewer: {
      label: '보기 전용',
      description: '보기만 가능',
      color: 'text-gray-700 bg-gray-100',
      actions: ['view']
    }
  };

  // 사용자 검색 및 필터링
  const filteredAvailableUsers = useMemo(() => {
    if (!searchQuery) return availableUsers.slice(0, 20);
    
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [availableUsers, searchQuery]);

  // 공유된 사용자 통계
  const sharingStats = useMemo(() => {
    const stats = {
      total: sharedUsers.length,
      byPermission: {},
      byDepartment: {},
      recentlyAdded: 0
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    sharedUsers.forEach(user => {
      // 권한별 통계
      if (user.permission in stats.byPermission) {
        stats.byPermission[user.permission]++;
      } else {
        stats.byPermission[user.permission] = 1;
      }

      // 부서별 통계
      if (user.department) {
        if (user.department in stats.byDepartment) {
          stats.byDepartment[user.department]++;
        } else {
          stats.byDepartment[user.department] = 1;
        }
      }

      // 최근 추가된 사용자
      if (new Date(user.sharedAt) > oneWeekAgo) {
        stats.recentlyAdded++;
      }
    });

    return stats;
  }, [sharedUsers]);

  // 사용자 초대
  const handleInviteUsers = useCallback(async () => {
    if (selectedUsers.size === 0) return;

    try {
      const invitations = Array.from(selectedUsers).map(userId => {
        const user = availableUsers.find(u => u.id === userId);
        return {
          userId,
          user,
          permission: inviteSettings.permission,
          message: inviteSettings.message,
          expiresAt: inviteSettings.expiresAt,
          requireApproval: inviteSettings.requireApproval,
          allowReshare: inviteSettings.allowReshare
        };
      });

      await onShareWithUser?.(invitations);

      if (inviteSettings.notifyByEmail) {
        await onSendInvitation?.(invitations);
      }

      setSelectedUsers(new Set());
      setShowInviteModal(false);
      
      // 공유 히스토리에 추가
      setSharingHistory(prev => [
        {
          id: Date.now().toString(),
          action: 'invite',
          users: invitations.map(inv => inv.user),
          permission: inviteSettings.permission,
          timestamp: new Date().toISOString(),
          by: currentUser
        },
        ...prev
      ]);

    } catch (error) {
      console.error('사용자 초대 실패:', error);
      alert('사용자 초대에 실패했습니다.');
    }
  }, [selectedUsers, availableUsers, inviteSettings, onShareWithUser, onSendInvitation, currentUser]);

  // 권한 변경
  const handlePermissionChange = useCallback(async (userId, newPermission) => {
    try {
      await onUpdatePermissions?.(userId, newPermission);
      
      // 히스토리 추가
      const user = sharedUsers.find(u => u.id === userId);
      setSharingHistory(prev => [
        {
          id: Date.now().toString(),
          action: 'permission_change',
          users: [user],
          permission: newPermission,
          previousPermission: user.permission,
          timestamp: new Date().toISOString(),
          by: currentUser
        },
        ...prev
      ]);

    } catch (error) {
      console.error('권한 변경 실패:', error);
      alert('권한 변경에 실패했습니다.');
    }
  }, [sharedUsers, onUpdatePermissions, currentUser]);

  // 접근 권한 철회
  const handleRevokeAccess = useCallback(async (userId) => {
    if (!confirm('이 사용자의 접근 권한을 철회하시겠습니까?')) return;

    try {
      await onRevokeAccess?.(userId);
      
      // 히스토리 추가
      const user = sharedUsers.find(u => u.id === userId);
      setSharingHistory(prev => [
        {
          id: Date.now().toString(),
          action: 'revoke',
          users: [user],
          timestamp: new Date().toISOString(),
          by: currentUser
        },
        ...prev
      ]);

    } catch (error) {
      console.error('접근 권한 철회 실패:', error);
      alert('접근 권한 철회에 실패했습니다.');
    }
  }, [sharedUsers, onRevokeAccess, currentUser]);

  // 공개 링크 생성
  const handleCreatePublicLink = useCallback(async () => {
    try {
      const linkData = {
        permission: linkSettings.permission,
        expiresAt: linkSettings.expiresAt,
        password: linkSettings.password,
        allowDownload: linkSettings.allowDownload,
        trackAccess: linkSettings.trackAccess,
        maxAccess: linkSettings.maxAccess
      };

      const newLink = await onCreatePublicLink?.(linkData);
      
      setPublicLinks(prev => [...prev, newLink]);
      setShowLinkModal(false);

      // 히스토리 추가
      setSharingHistory(prev => [
        {
          id: Date.now().toString(),
          action: 'create_link',
          linkId: newLink.id,
          permission: linkSettings.permission,
          timestamp: new Date().toISOString(),
          by: currentUser
        },
        ...prev
      ]);

    } catch (error) {
      console.error('공개 링크 생성 실패:', error);
      alert('공개 링크 생성에 실패했습니다.');
    }
  }, [linkSettings, onCreatePublicLink, currentUser]);

  // 일괄 권한 변경
  const handleBulkAction = useCallback(async (action, permission = null) => {
    if (selectedUsers.size === 0) return;

    const userIds = Array.from(selectedUsers);
    
    try {
      if (action === 'update_permission' && permission) {
        await onBulkPermissionUpdate?.(userIds, permission);
      } else if (action === 'revoke') {
        if (!confirm(`선택한 ${userIds.length}명의 사용자 접근 권한을 철회하시겠습니까?`)) return;
        
        for (const userId of userIds) {
          await onRevokeAccess?.(userId);
        }
      }

      setSelectedUsers(new Set());
      setBulkAction('');

      // 히스토리 추가
      const users = sharedUsers.filter(u => userIds.includes(u.id));
      setSharingHistory(prev => [
        {
          id: Date.now().toString(),
          action: action === 'update_permission' ? 'bulk_permission_change' : 'bulk_revoke',
          users,
          permission: permission,
          timestamp: new Date().toISOString(),
          by: currentUser
        },
        ...prev
      ]);

    } catch (error) {
      console.error('일괄 작업 실패:', error);
      alert('일괄 작업에 실패했습니다.');
    }
  }, [selectedUsers, sharedUsers, onBulkPermissionUpdate, onRevokeAccess, currentUser]);

  // 권한 템플릿 적용
  const applyPermissionTemplate = useCallback((template) => {
    setInviteSettings(prev => ({
      ...prev,
      permission: template.permission,
      expiresAt: template.defaultExpiry,
      requireApproval: template.requireApproval,
      allowReshare: template.allowReshare
    }));
  }, []);

  // 권한 레벨 아이콘
  const getPermissionIcon = (permission) => {
    const icons = {
      owner: '👑',
      admin: '⚡',
      editor: '✏️',
      commenter: '💬',
      viewer: '👁️'
    };
    return icons[permission] || '👤';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">공유 및 권한 관리</h2>
            <p className="text-sm text-gray-500 mt-1">
              {calendar?.name || event?.title} - {sharingStats.total}명이 접근 가능
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'users', label: '사용자 관리', count: sharingStats.total },
              { id: 'links', label: '공개 링크', count: publicLinks.length },
              { id: 'settings', label: '공유 설정' },
              { id: 'history', label: '활동 기록', count: sharingHistory.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 내용 */}
        <div className="flex-1 overflow-hidden">
          {/* 사용자 관리 탭 */}
          {activeTab === 'users' && (
            <div className="h-full flex flex-col">
              {/* 도구 모음 */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      사용자 초대
                    </button>

                    {selectedUsers.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{selectedUsers.size}명 선택</span>
                        <select
                          value={bulkAction}
                          onChange={(e) => setBulkAction(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">일괄 작업</option>
                          <option value="update_permission">권한 변경</option>
                          <option value="revoke">접근 철회</option>
                        </select>
                        {bulkAction === 'update_permission' && (
                          <select
                            onChange={(e) => e.target.value && handleBulkAction('update_permission', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">권한 선택</option>
                            {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                              <option key={key} value={key}>{level.label}</option>
                            ))}
                          </select>
                        )}
                        {bulkAction === 'revoke' && (
                          <button
                            onClick={() => handleBulkAction('revoke')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            철회
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 권한별 통계 */}
                  <div className="flex items-center space-x-4 text-sm">
                    {Object.entries(sharingStats.byPermission).map(([permission, count]) => (
                      <div key={permission} className="flex items-center">
                        <span className="mr-1">{getPermissionIcon(permission)}</span>
                        <span className="text-gray-600">{PERMISSION_LEVELS[permission]?.label}: {count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 사용자 목록 */}
              <div className="flex-1 overflow-y-auto">
                {sharedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-500">공유된 사용자가 없습니다</p>
                    <p className="text-sm text-gray-400 mt-1">사용자를 초대하여 공유를 시작하세요</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow ${
                          selectedUsers.has(user.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.id);
                              } else {
                                newSelected.delete(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                            className="mr-4"
                          />

                          {/* 사용자 아바타 */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                            {user.name.charAt(0)}
                          </div>

                          {/* 사용자 정보 */}
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{user.name}</h4>
                              {user.id === currentUser?.id && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  나
                                </span>
                              )}
                              {user.isOnline && (
                                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-gray-500">{user.department}</p>
                            )}
                          </div>
                        </div>

                        {/* 권한 및 액션 */}
                        <div className="flex items-center space-x-3">
                          {/* 권한 배지 */}
                          <div className="flex items-center">
                            <span className="mr-1 text-lg">{getPermissionIcon(user.permission)}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${PERMISSION_LEVELS[user.permission]?.color}`}>
                              {PERMISSION_LEVELS[user.permission]?.label}
                            </span>
                          </div>

                          {/* 권한 변경 */}
                          {isOrganizer && user.id !== currentUser?.id && (
                            <select
                              value={user.permission}
                              onChange={(e) => handlePermissionChange(user.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                                <option key={key} value={key}>{level.label}</option>
                              ))}
                            </select>
                          )}

                          {/* 마지막 접근 시간 */}
                          {user.lastAccessedAt && (
                            <div className="text-xs text-gray-500 text-right">
                              <p>마지막 접근:</p>
                              <p>{formatDate(user.lastAccessedAt, 'MM-DD HH:mm')}</p>
                            </div>
                          )}

                          {/* 제거 버튼 */}
                          {isOrganizer && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              title="접근 권한 철회"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 공개 링크 탭 */}
          {activeTab === 'links' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  공개 링크 생성
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {publicLinks.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p className="text-lg font-medium text-gray-500">생성된 공개 링크가 없습니다</p>
                    <p className="text-sm text-gray-400 mt-1">공개 링크를 생성하여 쉽게 공유하세요</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publicLinks.map((link) => (
                      <div key={link.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">공개 링크</h4>
                            <p className="text-sm text-gray-600">
                              권한: {PERMISSION_LEVELS[link.permission]?.label}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(link.url)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                            >
                              복사
                            </button>
                            <button
                              onClick={() => onDeletePublicLink?.(link.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <code className="text-sm text-gray-700 break-all">{link.url}</code>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>생성일: {formatDate(link.createdAt, 'YYYY-MM-DD HH:mm')}</p>
                            {link.expiresAt && (
                              <p>만료일: {formatDate(link.expiresAt, 'YYYY-MM-DD HH:mm')}</p>
                            )}
                          </div>
                          <div>
                            <p>접근 횟수: {link.accessCount || 0}회</p>
                            {link.maxAccess && (
                              <p>최대 접근: {link.maxAccess}회</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 공유 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">공유 설정</h3>
                
                {/* 기본 권한 설정 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">기본 권한 설정</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        새 사용자 기본 권한
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                          <option key={key} value={key}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">새 사용자 초대 시 승인 필요</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm text-gray-700">초대 시 이메일 알림 전송</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 보안 설정 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">보안 설정</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">외부 사용자 공유 제한</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm text-gray-700">공유 링크에 비밀번호 필수</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm text-gray-700">접근 로그 기록</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 알림 설정 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">알림 설정</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm text-gray-700">새 사용자 참여 시 알림</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">권한 변경 시 알림</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm text-gray-700">공유 링크 접근 시 알림</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 활동 기록 탭 */}
          {activeTab === 'history' && (
            <div className="p-4 h-full overflow-y-auto">
              {sharingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-500">활동 기록이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharingHistory.map((entry) => (
                    <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                            <h4 className="font-medium text-gray-900">
                              {entry.action === 'invite' && '사용자 초대'}
                              {entry.action === 'permission_change' && '권한 변경'}
                              {entry.action === 'revoke' && '접근 권한 철회'}
                              {entry.action === 'create_link' && '공개 링크 생성'}
                              {entry.action === 'bulk_permission_change' && '일괄 권한 변경'}
                              {entry.action === 'bulk_revoke' && '일괄 접근 철회'}
                            </h4>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {entry.users && `${entry.users.map(u => u.name).join(', ')}`}
                            {entry.permission && ` - ${PERMISSION_LEVELS[entry.permission]?.label}`}
                            {entry.previousPermission && ` (이전: ${PERMISSION_LEVELS[entry.previousPermission]?.label})`}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{formatDate(entry.timestamp, 'YYYY-MM-DD HH:mm')}</span>
                            <span className="mx-2">•</span>
                            <span>실행자: {entry.by?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              총 {sharingStats.total}명이 접근 가능 • 최근 일주일간 {sharingStats.recentlyAdded}명 추가
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">사용자 초대</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 사용자 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사용자 검색</label>
                <input
                  type="text"
                  placeholder="이름, 이메일 또는 부서로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 사용자 목록 */}
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {filteredAvailableUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                      className="mr-3"
                    />
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-3">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* 초대 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                  <select
                    value={inviteSettings.permission}
                    onChange={(e) => setInviteSettings(prev => ({ ...prev, permission: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                      <option key={key} value={key}>{level.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">만료일</label>
                  <input
                    type="date"
                    value={inviteSettings.expiresAt || ''}
                    onChange={(e) => setInviteSettings(prev => ({ ...prev, expiresAt: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">초대 메시지</label>
                <textarea
                  value={inviteSettings.message}
                  onChange={(e) => setInviteSettings(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="초대와 함께 전송할 메시지를 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inviteSettings.requireApproval}
                    onChange={(e) => setInviteSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">승인 후 접근 허용</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inviteSettings.notifyByEmail}
                    onChange={(e) => setInviteSettings(prev => ({ ...prev, notifyByEmail: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">이메일로 초대장 전송</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedUsers(new Set());
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleInviteUsers}
                disabled={selectedUsers.size === 0}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {selectedUsers.size}명 초대
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공개 링크 생성 모달 */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">공개 링크 생성</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                <select
                  value={linkSettings.permission}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, permission: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">보기 전용</option>
                  <option value="commenter">댓글 작성 가능</option>
                  <option value="editor">편집 가능</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">만료일</label>
                <input
                  type="datetime-local"
                  value={linkSettings.expiresAt || ''}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, expiresAt: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (선택)</label>
                <input
                  type="password"
                  value={linkSettings.password}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="비밀번호를 설정하면 보안이 강화됩니다"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={linkSettings.allowDownload}
                    onChange={(e) => setLinkSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">다운로드 허용</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={linkSettings.trackAccess}
                    onChange={(e) => setLinkSettings(prev => ({ ...prev, trackAccess: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">접근 기록 추적</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreatePublicLink}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                링크 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharingPermissionPanel;