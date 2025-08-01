import { useState, useCallback } from 'react';

const useCollaboration = (taskId = null) => {
  const [comments, setComments] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      // Mock 댓글 데이터
      const mockComments = [
        {
          id: 'comment1',
          content: '초기 구현이 완료되었습니다. 리뷰 부탁드립니다.',
          author: { id: 'user1', name: '김개발', avatar: null },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: null,
          mentions: [],
          attachments: []
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setComments(mockComments);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const loadActivity = useCallback(async () => {
    if (!taskId) return;
    
    try {
      const mockActivity = [
        {
          id: 'activity1',
          type: 'status_changed',
          message: '상태를 "진행중"으로 변경했습니다',
          user: { id: 'user1', name: '김개발' },
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setActivity(mockActivity);
    } catch (error) {
      console.error('활동 로드 실패:', error);
    }
  }, [taskId]);

  const addComment = useCallback(async (content, mentions = []) => {
    const newComment = {
      id: Date.now().toString(),
      content,
      author: { id: 'current-user', name: '현재 사용자', avatar: null },
      created_at: new Date().toISOString(),
      updated_at: null,
      mentions,
      attachments: []
    };
    
    setComments(prev => [newComment, ...prev]);
    return newComment;
  }, []);

  const updateComment = useCallback(async (commentId, content) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              content, 
              updated_at: new Date().toISOString() 
            }
          : comment
      )
    );
  }, []);

  const deleteComment = useCallback(async (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  }, []);

  const createMention = useCallback(async (userId, context) => {
    const newMention = {
      id: Date.now().toString(),
      user_id: userId,
      context,
      created_at: new Date().toISOString()
    };
    
    setMentions(prev => [newMention, ...prev]);
    return newMention;
  }, []);

  return {
    comments,
    mentions,
    activity,
    loading,
    loadComments,
    loadActivity,
    addComment,
    updateComment,
    deleteComment,
    createMention
  };
};

export default useCollaboration;