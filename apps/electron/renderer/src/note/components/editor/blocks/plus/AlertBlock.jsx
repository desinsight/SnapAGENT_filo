import React, { useState, useRef, useEffect } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';
import { motion, AnimatePresence } from 'framer-motion';

// Icon components
const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DuplicateIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);


const LinkIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ALERT_TYPES = [
  { 
    type: 'info', 
    label: '정보', 
    icon: InfoIcon,
    colors: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-500 dark:text-blue-400'
    }
  },
  { 
    type: 'success', 
    label: '성공', 
    icon: CheckCircleIcon,
    colors: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800/50',
      text: 'text-green-700 dark:text-green-300',
      icon: 'text-green-500 dark:text-green-400'
    }
  },
  { 
    type: 'warning', 
    label: '경고', 
    icon: ExclamationTriangleIcon,
    colors: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-500 dark:text-amber-400'
    }
  },
  { 
    type: 'error', 
    label: '오류', 
    icon: XCircleIcon,
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-500 dark:text-red-400'
    }
  }
];

export default function AlertBlock({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "알림 메시지를 작성하세요...",
  isEditing,
  onEditingChange 
}) {
  const [type, setType] = useState(block?.metadata?.type || 'info');
  const [content, setContent] = useState(block?.content || null);
  const [isHovered, setIsHovered] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(block?.metadata?.collapsed || false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const currentAlertType = ALERT_TYPES.find(t => t.type === type) || ALERT_TYPES[0];
  const IconComponent = currentAlertType.icon;

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ 
        metadata: { ...block?.metadata, type, collapsed: isCollapsed }, 
        content 
      });
    }
  }, [type, content, isCollapsed]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleContentChange = (json) => {
    setContent(json);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setShowTypeSelector(false);
  };

  const handleDuplicate = () => {
    if (onUpdate) {
      // 복제 기능 - 부모 컴포넌트에서 처리해야 할 수도 있음
      console.log('Duplicate alert block');
    }
    setShowSettings(false);
  };


  const handleCopyLink = () => {
    // 링크 복사 기능
    const blockId = block?.id || 'alert-block';
    navigator.clipboard.writeText(`#${blockId}`);
    console.log('Copied link to clipboard');
    setShowSettings(false);
  };

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

  const hasContent = extractTextFromProseMirror(content)?.trim();

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative rounded-lg border transition-all duration-200 ${currentAlertType.colors.bg} ${currentAlertType.colors.border}`}
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHovered(false);
          setShowTypeSelector(false);
          setShowSettings(false);
        }, 150);
      }}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 pb-1">
        <div className="flex items-center gap-2">
          <div className={`flex-shrink-0 ${currentAlertType.colors.icon}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          
          <div className="relative">
            {!readOnly && showTypeSelector ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-0 left-0 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[140px]"
              >
                {ALERT_TYPES.map((alertType) => {
                  const TypeIcon = alertType.icon;
                  return (
                    <button
                      key={alertType.type}
                      onClick={() => handleTypeChange(alertType.type)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        type === alertType.type ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <TypeIcon className={`w-4 h-4 ${alertType.colors.icon}`} />
                      <span className="text-gray-700 dark:text-gray-300">{alertType.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <button
                onClick={() => !readOnly && setShowTypeSelector(true)}
                disabled={readOnly}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  !readOnly ? 'hover:bg-white/50 dark:hover:bg-gray-800/50' : ''
                } ${currentAlertType.colors.text}`}
              >
                <span>{currentAlertType.label}</span>
                {!readOnly && <ChevronDownIcon className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center gap-1 transition-opacity duration-150 ${
          isHovered && !readOnly ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
              title="Settings"
            >
              <CogIcon className="w-3.5 h-3.5" />
            </button>

            {/* Settings Menu */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[160px]"
                >
                  <div className="py-1">
                    <button
                      onClick={handleDuplicate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <DuplicateIcon className="w-4 h-4" />
                      복제
                    </button>
                    
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      링크 복사
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2">
              <div className={`rounded-md bg-white/50 dark:bg-gray-800/30 p-2 min-h-[40px] ${
                !hasContent && !isEditing ? 'border-2 border-dashed border-gray-300 dark:border-gray-600' : ''
              }`}>
                <ProseMirrorTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={placeholder}
                  readOnly={readOnly}
                  blockId={`alert-${block?.id}`}
                  blockType="alert"
                  className={`outline-none text-sm leading-relaxed ${currentAlertType.colors.text}`}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Footer info when empty */}
              {!hasContent && !isEditing && !readOnly && (
                <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  클릭하여 {currentAlertType.label} 메시지를 작성하세요
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview */}
      {isCollapsed && hasContent && (
        <div className="px-3 pb-2">
          <div className={`text-sm ${currentAlertType.colors.text} line-clamp-2 opacity-70`}>
            {extractTextFromProseMirror(content)}
          </div>
        </div>
      )}
    </motion.div>
  );
}