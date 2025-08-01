/**
 * 협업 관리 훅
 * 
 * @description 공용노트 협업 기능 관리를 담당하는 커스텀 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  MOCK_COLLABORATION_SESSIONS, 
  MOCK_INVITATIONS, 
  MOCK_USERS,
  USE_SHARED_NOTE_MOCK_DATA 
} from '../utils/sharedNoteMockData';

/**
 * 협업 관리 훅
 */
export const useCollaboration = () => {
  // 협업 상태
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [collaborationHistory, setCollaborationHistory] = useState([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [currentCollaborationSession, setCurrentCollaborationSession] = useState(null);
  
  // 협업 통계
  const [collaborationStats, setCollaborationStats] = useState({
    activeSessions: 0,
    activeUsers: 0,
    editingUsers: 0,
    totalCollaborators: 0
  });

  /**
   * 협업 통계 업데이트
   */
  const updateCollaborationStats = useCallback(() => {
    if (USE_SHARED_NOTE_MOCK_DATA) {
      const activeSessions = MOCK_COLLABORATION_SESSIONS.filter(session => session.status === 'active');
      const activeUsers = new Set();
      const editingUsers = new Set();
      
      activeSessions.forEach(session => {
        session.participants.forEach(participant => {
          activeUsers.add(participant.userId);
          if (participant.isTyping) {
            editingUsers.add(participant.userId);
          }
        });
      });
      
      setCollaborationStats({
        activeSessions: activeSessions.length,
        activeUsers: activeUsers.size,
        editingUsers: editingUsers.size,
        totalCollaborators: MOCK_USERS.length
      });
    }
  }, []);

  /**
   * 노트 공유
   */
  const shareNote = useCallback(async (noteId, shareData) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 목업 공유 처리
        console.log('공유 처리:', { noteId, shareData });
        
        // 실제로는 이메일 발송, 링크 생성 등의 처리가 필요
        const shareResult = {
          success: true,
          shareId: `share-${Date.now()}`,
          shareUrl: `${window.location.origin}/shared-note/${noteId}`,
          expiresAt: shareData.expiresAt,
          permissions: shareData.permissions
        };
        
        return shareResult;
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shareData),
        });
        
        if (!response.ok) {
          throw new Error('노트 공유에 실패했습니다.');
        }
        
        return await response.json();
      }
      
    } catch (error) {
      console.error('노트 공유 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업자 초대
   */
  const inviteCollaborator = useCallback(async (noteId, inviteData) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newInvitation = {
          id: `invitation-${Date.now()}`,
          noteId: noteId,
          inviter: MOCK_USERS[0], // 현재 사용자 (임시)
          invitee: {
            email: inviteData.email,
            name: inviteData.name || inviteData.email
          },
          role: inviteData.role || 'viewer',
          status: 'pending',
          message: inviteData.message || '',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후 만료
        };
        
        MOCK_INVITATIONS.push(newInvitation);
        setInvitations(prev => [...prev, newInvitation]);
        
        return newInvitation;
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inviteData),
        });
        
        if (!response.ok) {
          throw new Error('협업자 초대에 실패했습니다.');
        }
        
        const invitation = await response.json();
        setInvitations(prev => [...prev, invitation]);
        
        return invitation;
      }
      
    } catch (error) {
      console.error('협업자 초대 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업자 제거
   */
  const removeCollaborator = useCallback(async (noteId, userId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 목업에서 협업자 제거
        setActiveCollaborators(prev => prev.filter(c => c.userId !== userId));
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/collaborators/${userId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('협업자 제거에 실패했습니다.');
        }
        
        setActiveCollaborators(prev => prev.filter(c => c.userId !== userId));
        
        return await response.json();
      }
      
    } catch (error) {
      console.error('협업자 제거 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업자 권한 수정
   */
  const updateCollaboratorRole = useCallback(async (noteId, userId, newRole) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setActiveCollaborators(prev => prev.map(c => 
          c.userId === userId ? { ...c, role: newRole } : c
        ));
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/collaborators/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        });
        
        if (!response.ok) {
          throw new Error('협업자 권한 수정에 실패했습니다.');
        }
        
        const updatedCollaborator = await response.json();
        setActiveCollaborators(prev => prev.map(c => 
          c.userId === userId ? updatedCollaborator : c
        ));
        
        return updatedCollaborator;
      }
      
    } catch (error) {
      console.error('협업자 권한 수정 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 초대 수락
   */
  const acceptInvitation = useCallback(async (invitationId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const invitationIndex = MOCK_INVITATIONS.findIndex(inv => inv.id === invitationId);
        if (invitationIndex !== -1) {
          MOCK_INVITATIONS[invitationIndex].status = 'accepted';
          setInvitations(prev => prev.map(inv => 
            inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
          ));
        }
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/invitations/${invitationId}/accept`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('초대 수락에 실패했습니다.');
        }
        
        const result = await response.json();
        setInvitations(prev => prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
        ));
        
        return result;
      }
      
    } catch (error) {
      console.error('초대 수락 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 초대 거절
   */
  const declineInvitation = useCallback(async (invitationId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const invitationIndex = MOCK_INVITATIONS.findIndex(inv => inv.id === invitationId);
        if (invitationIndex !== -1) {
          MOCK_INVITATIONS[invitationIndex].status = 'declined';
          setInvitations(prev => prev.map(inv => 
            inv.id === invitationId ? { ...inv, status: 'declined' } : inv
          ));
        }
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/invitations/${invitationId}/decline`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('초대 거절에 실패했습니다.');
        }
        
        const result = await response.json();
        setInvitations(prev => prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'declined' } : inv
        ));
        
        return result;
      }
      
    } catch (error) {
      console.error('초대 거절 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업 세션 시작
   */
  const startCollaboration = useCallback(async (noteId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const session = MOCK_COLLABORATION_SESSIONS.find(s => s.noteId === noteId);
        if (session) {
          setCurrentCollaborationSession(session);
          setIsCollaborating(true);
          setActiveCollaborators(session.participants);
        }
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/collaboration/start`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('협업 세션 시작에 실패했습니다.');
        }
        
        const session = await response.json();
        setCurrentCollaborationSession(session);
        setIsCollaborating(true);
        setActiveCollaborators(session.participants);
        
        return session;
      }
      
    } catch (error) {
      console.error('협업 세션 시작 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업 세션 종료
   */
  const endCollaboration = useCallback(async (noteId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentCollaborationSession(null);
        setIsCollaborating(false);
        setActiveCollaborators([]);
        
        return { success: true };
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/collaboration/end`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('협업 세션 종료에 실패했습니다.');
        }
        
        setCurrentCollaborationSession(null);
        setIsCollaborating(false);
        setActiveCollaborators([]);
        
        return await response.json();
      }
      
    } catch (error) {
      console.error('협업 세션 종료 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 협업 히스토리 로드
   */
  const loadCollaborationHistory = useCallback(async (noteId) => {
    try {
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 목업 데이터에서 해당 노트의 히스토리 찾기
        const note = MOCK_SHARED_NOTES.find(n => n._id === noteId);
        if (note && note.collaborationHistory) {
          setCollaborationHistory(note.collaborationHistory);
        }
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}/collaboration/history`);
        
        if (!response.ok) {
          throw new Error('협업 히스토리 로드에 실패했습니다.');
        }
        
        const history = await response.json();
        setCollaborationHistory(history);
      }
      
    } catch (error) {
      console.error('협업 히스토리 로드 실패:', error);
      throw error;
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (USE_SHARED_NOTE_MOCK_DATA) {
      setInvitations(MOCK_INVITATIONS);
      updateCollaborationStats();
    }
  }, [updateCollaborationStats]);

  // 협업 통계 주기적 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      updateCollaborationStats();
    }, 5000); // 5초마다 업데이트
    
    return () => clearInterval(interval);
  }, [updateCollaborationStats]);

  return {
    // 상태
    activeCollaborators,
    invitations,
    collaborationHistory,
    isCollaborating,
    currentCollaborationSession,
    collaborationStats,
    
    // 액션
    shareNote,
    inviteCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    acceptInvitation,
    declineInvitation,
    startCollaboration,
    endCollaboration,
    loadCollaborationHistory,
    updateCollaborationStats
  };
};