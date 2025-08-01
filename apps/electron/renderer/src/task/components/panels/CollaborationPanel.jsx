import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  HeartIcon,
  HandThumbUpIcon,
  FaceSmileIcon,
  PlusIcon,
  AtSymbolIcon,
  PhotoIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

const CollaborationPanel = ({ 
  isOpen, 
  onClose,
  task,
  comments = [],
  activity = [],
  mentions = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCreateMention
}) => {
  const [activeTab, setActiveTab] = useState('comments'); // comments, activity, mentions
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef(null);

  // 멘션 가능한 사용자 목록 (실제로는 API에서 가져옴)
  const availableUsers = [
    { id: 1, name: '김개발', email: 'kim@example.com', avatar: null },
    { id: 2, name: '박디비', email: 'park@example.com', avatar: null },
    { id: 3, name: '이디자인', email: 'lee@example.com', avatar: null },
    { id: 4, name: '최기획', email: 'choi@example.com', avatar: null }
  ];

  // 댓글 추가
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        content: newComment,
        task_id: task.id,
        mentions: extractMentions(newComment)
      });
      setNewComment('');
    } catch (error) {
      console.error('댓글 추가 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await onUpdateComment(commentId, {
        content: editContent,
        mentions: extractMentions(editContent)
      });
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      try {
        await onDeleteComment(commentId);
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    }
  };

  // 멘션 추출
  const extractMentions = (content) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const user = availableUsers.find(u => u.name.includes(match[1]));
      if (user) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  };

  // 멘션 처리
  const handleMention = (user) => {
    const mention = `@${user.name} `;
    setNewComment(prev => prev + mention);
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  // 댓글 반응 토글
  const toggleReaction = async (commentId, reactionType) => {
    // 실제로는 API 호출
    console.log('Toggle reaction:', commentId, reactionType);
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return time.toLocaleDateString();
  };

  // 활동 아이콘
  const getActivityIcon = (activityType) => {
    const icons = {
      comment_added: ChatBubbleLeftIcon,
      task_updated: PencilIcon,
      status_changed: ExclamationTriangleIcon,
      assignee_changed: UserIcon,
      file_attached: PaperClipIcon
    };
    const Icon = icons[activityType] || ExclamationTriangleIcon;
    return <Icon className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">협업</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {task?.title} - 댓글 및 활동
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'comments', label: `댓글 (${comments.length})`, icon: ChatBubbleLeftIcon },
              { id: 'activity', label: `활동 (${activity.length})`, icon: ExclamationTriangleIcon },
              { id: 'mentions', label: `멘션 (${mentions.length})`, icon: AtSymbolIcon }
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
        <div className="flex-1 h-[calc(90vh-300px)] overflow-hidden flex flex-col">
          {activeTab === 'comments' && (
            <>
              {/* 댓글 목록 */}
              <div className="flex-1 overflow-y-auto p-6">
                {comments.length > 0 ? (
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="group">
                        <div className="flex items-start space-x-3">
                          {/* 사용자 아바타 */}
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            {comment.author?.avatar ? (
                              <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            {/* 댓글 헤더 */}
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {comment.author?.name || '익명'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(comment.created_at)}
                              </span>
                              {comment.updated_at !== comment.created_at && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">(편집됨)</span>
                              )}
                            </div>

                            {/* 댓글 내용 */}
                            {editingComment === comment.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                  rows={3}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditComment(comment.id)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditContent('');
                                    }}
                                    className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            )}

                            {/* 댓글 반응 */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleReaction(comment.id, 'like')}
                                  className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs"
                                >
                                  <HandThumbUpIcon className="w-3 h-3" />
                                  <span>좋아요 {comment.likes || 0}</span>
                                </button>
                                <button
                                  onClick={() => toggleReaction(comment.id, 'heart')}
                                  className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs"
                                >
                                  <HeartIcon className="w-3 h-3" />
                                  <span>하트 {comment.hearts || 0}</span>
                                </button>
                              </div>

                              {/* 댓글 액션 */}
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingComment(comment.id);
                                    setEditContent(comment.content);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                  title="편집"
                                >
                                  <PencilIcon className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="삭제"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">아직 댓글이 없습니다.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">첫 번째 댓글을 작성해보세요!</p>
                  </div>
                )}
              </div>

              {/* 댓글 작성 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                          if (e.key === '@') {
                            setShowMentions(true);
                          }
                        }}
                        placeholder="댓글을 입력하세요... (@를 눌러 멘션)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        rows={3}
                      />
                      
                      {/* 멘션 드롭다운 */}
                      {showMentions && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">사용자 멘션</div>
                            {availableUsers.map(user => (
                              <button
                                key={user.id}
                                onClick={() => handleMention(user)}
                                className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center space-x-2"
                              >
                                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-3 h-3 text-gray-500" />
                                </div>
                                <div>
                                  <div className="text-sm text-gray-900 dark:text-white">{user.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowMentions(!showMentions)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="멘션"
                        >
                          <AtSymbolIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="이미지">
                          <PhotoIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="파일">
                          <PaperClipIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isSubmitting}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <PaperAirplaneIcon className="w-4 h-4" />
                        )}
                        <span>{isSubmitting ? '전송 중...' : '댓글 작성'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'activity' && (
            <div className="flex-1 overflow-y-auto p-6">
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{item.user?.name}</span>님이 {item.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">활동 기록이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mentions' && (
            <div className="flex-1 overflow-y-auto p-6">
              {mentions.length > 0 ? (
                <div className="space-y-4">
                  {mentions.map((mention) => (
                    <div key={mention.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                          <AtSymbolIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{mention.author?.name}</span>님이 나를 멘션했습니다
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {mention.content}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatTime(mention.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AtSymbolIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">멘션이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;