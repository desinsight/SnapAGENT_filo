import { useState, useCallback } from 'react';

const mockNotifications = [
  {
    id: '1',
    type: 'task_assigned',
    title: '새 태스크가 할당되었습니다',
    message: '김개발님이 "사용자 인증 시스템 구현" 태스크를 할당했습니다.',
    read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
    data: { task_id: '1', assignee_id: 'user1' }
  },
  {
    id: '2',
    type: 'comment_added',
    title: '새 댓글이 추가되었습니다',
    message: '박디비님이 댓글을 남겼습니다: "성능 테스트 결과를 확인해주세요"',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    data: { task_id: '2', comment_id: 'comment1' }
  },
  {
    id: '3',
    type: 'due_date_reminder',
    title: '마감일 알림',
    message: '"UI/UX 리뷰 미팅" 태스크의 마감일이 내일입니다.',
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    data: { task_id: '3' }
  }
];

const useNotifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      // 실제로는 API에서 알림 데이터를 가져옴
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      read: false,
      created_at: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };
};

export default useNotifications;