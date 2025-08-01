import React, { useState, useRef, useEffect, useCallback } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';
import { motion, AnimatePresence } from 'framer-motion';

// Icon components
const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ReplyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const SendIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);


const SmileIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MoreHorizontalIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

const ChevronUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

export default function CommentBlock({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false,
  placeholder = "Add a comment...",
  isEditing,
  onEditingChange 
}) {
  const [comments, setComments] = useState(block?.data?.comments || []);
  const [newComment, setNewComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredComment, setHoveredComment] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [isThreadExpanded, setIsThreadExpanded] = useState({});
  const [selectedReaction, setSelectedReaction] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const emojis = ['👍', '❤️', '😊', '🎉', '🤔', '👏', '😂', '🙏'];

  useEffect(() => {
    if (onUpdate && JSON.stringify(comments) !== JSON.stringify(block?.data?.comments)) {
      onUpdate({ comments });
    }
  }, [comments]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const extractTextFromProseMirror = (proseMirrorData) => {
    if (!proseMirrorData) return '';
    if (typeof proseMirrorData === 'string') return proseMirrorData;
    
    const extractFromNode = (node) => {
      if (!node) return '';
      if (node.type === 'text') return node.text || '';
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractFromNode).join('');
      }
      return '';
    };
    
    if (proseMirrorData.content && Array.isArray(proseMirrorData.content)) {
      return proseMirrorData.content.map(extractFromNode).join('\n').trim();
    }
    
    return '';
  };

  const handleAddComment = useCallback(() => {
    // ProseMirror JSON에서 텍스트 추출
    const textContent = extractTextFromProseMirror(newComment);
    if (!textContent || !textContent.trim()) return;

    const newCommentObj = {
      id: generateId(),
      content: textContent,
      timestamp: new Date().toISOString(),
      author: 'Current User',
      avatar: null,
      reactions: {},
      replies: [],
      parentId: replyingTo
    };

    if (replyingTo) {
      setComments(prev => updateReplies(prev, replyingTo, newCommentObj));
      setReplyingTo(null);
    } else {
      setComments(prev => [...prev, newCommentObj]);
    }

    setNewComment(null);
  }, [newComment, replyingTo]);

  const updateReplies = (comments, parentId, newReply) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), newReply] };
      }
      if (comment.replies?.length > 0) {
        return { ...comment, replies: updateReplies(comment.replies, parentId, newReply) };
      }
      return comment;
    });
  };

  const handleDeleteComment = (commentId, parentId = null) => {
    if (parentId) {
      setComments(prev => deleteReply(prev, parentId, commentId));
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const deleteReply = (comments, parentId, replyId) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: comment.replies.filter(r => r.id !== replyId) };
      }
      if (comment.replies?.length > 0) {
        return { ...comment, replies: deleteReply(comment.replies, parentId, replyId) };
      }
      return comment;
    });
  };

  const handleReaction = (commentId, emoji) => {
    setComments(prev => toggleReaction(prev, commentId, emoji));
    setShowEmojiPicker(null);
  };

  const toggleReaction = (comments, commentId, emoji) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        const reactions = { ...comment.reactions };
        const currentUser = 'Current User';
        
        if (!reactions[emoji]) {
          reactions[emoji] = { count: 0, users: [] };
        }
        
        if (reactions[emoji].users.includes(currentUser)) {
          reactions[emoji].users = reactions[emoji].users.filter(u => u !== currentUser);
          reactions[emoji].count--;
          if (reactions[emoji].count === 0) delete reactions[emoji];
        } else {
          reactions[emoji].users.push(currentUser);
          reactions[emoji].count++;
        }
        
        return { ...comment, reactions };
      }
      if (comment.replies?.length > 0) {
        return { ...comment, replies: toggleReaction(comment.replies, commentId, emoji) };
      }
      return comment;
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const insertTextAtCursor = (text) => {
    // ProseMirror에 텍스트 삽입
    if (inputRef.current && inputRef.current.view) {
      const { view } = inputRef.current;
      const { state } = view;
      const { tr } = state;
      
      // 현재 선택 위치에 텍스트 삽입
      const insertPos = state.selection.from;
      tr.insertText(text, insertPos);
      view.dispatch(tr);
      view.focus();
    }
  };


  const handleInputEmojiSelect = (emoji) => {
    insertTextAtCursor(emoji);
    setShowInputEmojiPicker(false);
  };

  const CommentItem = React.memo(({ comment, depth = 0, parentId = null }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = isThreadExpanded[comment.id];
    const isHovered = hoveredComment === comment.id;

    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`${depth > 0 ? 'ml-12' : ''}`}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setHoveredComment(comment.id);
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredComment(null);
            setShowInputEmojiPicker(false);
          }, 100);
        }}
      >
        <div className="group relative">
          <div className="flex items-start space-x-3 py-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm font-medium text-gray-700">
                {comment.author.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(comment.timestamp)}
                </span>
              </div>
              
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                <div className={`flex items-center gap-1 transition-opacity duration-150 ${
                  isHovered && !readOnly ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <ReplyIcon className="w-3 h-3" />
                        Reply
                      </button>
                      
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <SmileIcon className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteComment(comment.id, parentId)}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                </div>
                
                {Object.entries(comment.reactions || {}).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji)}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all ${
                      data.users.includes('Current User')
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{data.count}</span>
                  </button>
                ))}
                
                {hasReplies && (
                  <button
                    onClick={() => setIsThreadExpanded(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
              
              {showEmojiPicker === comment.id && (
                <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(comment.id, emoji)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isExpanded && hasReplies && (
            <div className="overflow-hidden">
                {comment.replies.map(reply => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    depth={depth + 1} 
                    parentId={comment.id}
                  />
                ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  });

  return (
    <div 
      ref={containerRef}
      className="relative bg-white dark:bg-gray-900 rounded-lg transition-all duration-200"
      onClick={onFocus}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Comments {comments.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                {comments.length}
              </span>
            )}
          </h3>
          
          {comments.length > 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDownIcon className="w-3 h-3" />
                  Show
                </>
              ) : (
                <>
                  <ChevronUpIcon className="w-3 h-3" />
                  Hide
                </>
              )}
            </button>
          )}
        </div>
        
        {!isCollapsed && (
          <>
            <AnimatePresence>
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </AnimatePresence>
            
            {!readOnly && (
          <div className={`mt-4 ${replyingTo ? 'ml-12' : ''}`}>
            {replyingTo && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  Replying to comment...
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center text-sm font-medium text-gray-700">
                Y
              </div>
              
              <div className="flex-1 relative">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 min-h-[80px]">
                  <ProseMirrorTextEditor
                    ref={inputRef}
                    content={newComment}
                    onChange={setNewComment}
                    placeholder={placeholder}
                    onEnter={(e) => {
                      if (e.shiftKey) return false;
                      handleAddComment();
                      return true;
                    }}
                    className="text-sm"
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 relative">
                      <button 
                        onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="이모지 추가"
                      >
                        <SmileIcon className="w-4 h-4" />
                      </button>

                      {/* Input Emoji Picker */}
                      {showInputEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                          <div className="flex gap-1">
                            {emojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleInputEmojiSelect(emoji)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleAddComment}
                      disabled={!extractTextFromProseMirror(newComment)?.trim()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        extractTextFromProseMirror(newComment)?.trim()
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}