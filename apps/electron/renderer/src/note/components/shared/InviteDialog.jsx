/**
 * 협업자 초대 다이얼로그 컴포넌트
 * 
 * @description 협업자를 초대하기 위한 다이얼로그 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MOCK_USERS } from '../../utils/sharedNoteMockData';

const InviteDialog = ({
  isOpen = false,
  onClose,
  note,
  onInvite
}) => {
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'viewer',
    message: ''
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const emailInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 다이얼로그가 열릴 때 이메일 입력에 포커스
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isOpen]);

  // 기본 초대 메시지 설정
  useEffect(() => {
    if (note) {
      setInviteForm(prev => ({
        ...prev,
        message: `"${note.title}" 문서에 협업 초대드립니다. 함께 작업해보세요!`
      }));
    }
  }, [note]);

  /**
   * 이메일 검색 및 자동완성
   */
  const searchUsers = useCallback((query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 기존 협업자 제외
    const existingEmails = note?.collaborators?.map(c => c.user.email) || [];
    
    const filteredUsers = MOCK_USERS.filter(user =>
      (user.email.toLowerCase().includes(query.toLowerCase()) ||
       user.name.toLowerCase().includes(query.toLowerCase())) &&
      !existingEmails.includes(user.email) &&
      !selectedUsers.some(selected => selected.email === user.email)
    );

    setSuggestions(filteredUsers);
    setShowSuggestions(true);
  }, [note, selectedUsers]);

  /**
   * 폼 업데이트
   */
  const updateForm = useCallback((field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 이메일 필드의 경우 자동완성 검색
    if (field === 'email') {
      searchUsers(value);
    }
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [searchUsers, errors]);

  /**
   * 사용자 선택 (자동완성에서)
   */
  const selectUser = useCallback((user) => {
    setInviteForm(prev => ({
      ...prev,
      email: user.email,
      name: user.name
    }));
    
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  /**
   * 사용자 추가
   */
  const addUser = useCallback(() => {
    if (!inviteForm.email.trim()) return;
    
    // 이메일 중복 확인
    if (selectedUsers.some(user => user.email === inviteForm.email)) {
      setErrors({ email: '이미 추가된 사용자입니다.' });
      return;
    }
    
    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      setErrors({ email: '올바른 이메일 주소를 입력해주세요.' });
      return;
    }
    
    const newUser = {
      email: inviteForm.email,
      name: inviteForm.name || inviteForm.email,
      role: inviteForm.role
    };
    
    setSelectedUsers(prev => [...prev, newUser]);
    setInviteForm(prev => ({
      ...prev,
      email: '',
      name: '',
      role: 'viewer'
    }));
    setErrors({});
    
    // 포커스 다시 이메일 입력으로
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [inviteForm, selectedUsers]);

  /**
   * 사용자 제거
   */
  const removeUser = useCallback((userToRemove) => {
    setSelectedUsers(prev => 
      prev.filter(user => user.email !== userToRemove.email)
    );
  }, []);

  /**
   * 사용자 역할 변경
   */
  const updateUserRole = useCallback((userEmail, newRole) => {
    setSelectedUsers(prev => 
      prev.map(user => 
        user.email === userEmail ? { ...user, role: newRole } : user
      )
    );
  }, []);

  /**
   * 초대 전송
   */
  const sendInvitations = useCallback(async () => {
    if (selectedUsers.length === 0) {
      setErrors({ general: '최소 한 명의 사용자를 선택해주세요.' });
      return;
    }
    
    try {
      setInviting(true);
      setErrors({});
      
      // 각 사용자에 대해 초대 전송
      for (const user of selectedUsers) {
        const inviteData = {
          email: user.email,
          name: user.name,
          role: user.role,
          message: inviteForm.message
        };
        
        await onInvite(note._id, inviteData);
      }
      
      // 성공 시 초기화
      setSelectedUsers([]);
      setInviteForm({
        email: '',
        name: '',
        role: 'viewer',
        message: `"${note.title}" 문서에 협업 초대드립니다. 함께 작업해보세요!`
      });
      
      onClose();
      
    } catch (error) {
      console.error('초대 전송 실패:', error);
      setErrors({ general: '초대 전송 중 오류가 발생했습니다.' });
    } finally {
      setInviting(false);
    }
  }, [selectedUsers, inviteForm.message, onInvite, note, onClose]);

  /**
   * 키보드 핸들러
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addUser();
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [addUser]);

  /**
   * 외부 클릭 감지
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            협업자 초대
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* 노트 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {note.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              이 노트에 협업자를 초대하여 함께 작업할 수 있습니다.
            </p>
          </div>

          {/* 사용자 추가 폼 */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일 주소
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="협업자 이메일을 입력하세요"
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  
                  {/* 자동완성 제안 */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto"
                    >
                      {suggestions.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: `hsl(${user.id.charCodeAt(0) * 137.5 % 360}, 70%, 50%)` }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email} • {user.department}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <select
                  value={inviteForm.role}
                  onChange={(e) => updateForm('role', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">보기</option>
                  <option value="editor">편집</option>
                  <option value="admin">관리</option>
                </select>
                
                <button
                  onClick={addUser}
                  disabled={!inviteForm.email.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  추가
                </button>
              </div>
              
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* 이름 입력 (옵션) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이름 (선택사항)
              </label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="협업자 이름"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 선택된 사용자 목록 */}
          {selectedUsers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                초대할 사용자 ({selectedUsers.length}명)
              </h4>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: `hsl(${user.email.charCodeAt(0) * 137.5 % 360}, 70%, 50%)` }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.email, e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="viewer">보기</option>
                        <option value="editor">편집</option>
                        <option value="admin">관리</option>
                      </select>
                      
                      <button
                        onClick={() => removeUser(user)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 초대 메시지 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              초대 메시지
            </label>
            <textarea
              value={inviteForm.message}
              onChange={(e) => updateForm('message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="초대 메시지를 입력하세요..."
            />
          </div>

          {/* 에러 메시지 */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            취소
          </button>
          <button
            onClick={sendInvitations}
            disabled={inviting || selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {inviting ? '초대 중...' : `${selectedUsers.length}명 초대`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteDialog;