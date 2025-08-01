import React, { useState, useRef, useEffect } from 'react';
import ProseMirrorTextEditor from '../../prosemirror/ProseMirrorTextEditor';
import { motion, AnimatePresence } from 'framer-motion';

// Ultra minimal icons
const DescriptionIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const RangeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12,5 19,12 12,19"/>
  </svg>
);

const BellIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  </svg>
);

const DotIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="6"/>
  </svg>
);

// Subtle priority system for thin design
const PRIORITY_CONFIG = {
  none: { 
    bg: 'transparent', 
    border: '#f1f5f9', 
    accent: '#e2e8f0',
    text: '#64748b'
  },
  low: { 
    bg: 'transparent', 
    border: '#e0f2fe', 
    accent: '#0ea5e9',
    text: '#0284c7'
  },
  medium: { 
    bg: 'transparent', 
    border: '#fef3c7', 
    accent: '#f59e0b',
    text: '#d97706'
  },
  high: { 
    bg: 'transparent', 
    border: '#fecaca', 
    accent: '#ef4444',
    text: '#dc2626'
  }
};

const DATE_TYPES = {
  single: 'Due',
  range: 'Range',
  reminder: 'Alert'
};

export default function ReminderBlock({ 
  block, 
  onUpdate, 
  onFocus, 
  onDelete,
  readOnly = false,
  isEditing,
  onEditingChange 
}) {
  const [content, setContent] = useState(block?.content || null);
  const [title, setTitle] = useState(block?.metadata?.title || '');
  const [isCompleted, setIsCompleted] = useState(block?.metadata?.completed || false);
  const [dueDate, setDueDate] = useState(block?.metadata?.dueDate || '');
  const [startDate, setStartDate] = useState(block?.metadata?.startDate || '');
  const [endDate, setEndDate] = useState(block?.metadata?.endDate || '');
  const [reminderDate, setReminderDate] = useState(block?.metadata?.reminderDate || '');
  const [dateType, setDateType] = useState(block?.metadata?.dateType || 'single');
  const [priority, setPriority] = useState(block?.metadata?.priority || 'none');
  const [showEditor, setShowEditor] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Extract text content
  const extractText = (proseMirrorData) => {
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
      return proseMirrorData.content.map(extractFromNode).join(' ').trim();
    }
    return '';
  };

  const textContent = extractText(content);
  const hasContent = textContent.length > 0;

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ 
        metadata: { 
          ...block?.metadata, 
          title,
          completed: isCompleted,
          dueDate, 
          startDate,
          endDate,
          reminderDate,
          dateType,
          priority 
        }, 
        content 
      });
    }
  }, [content, title, isCompleted, dueDate, startDate, endDate, reminderDate, dateType, priority]);

  const handleContentChange = (json) => {
    setContent(json);
  };

  const toggleComplete = () => {
    setIsCompleted(!isCompleted);
  };

  const cyclePriority = () => {
    const priorities = ['none', 'low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    setPriority(priorities[nextIndex]);
  };

  // Enhanced date formatting with full date display
  const formatDateAdvanced = (date) => {
    if (!date) return null;
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = dateObj - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Helper function to format time
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    // Real-time expressions
    if (Math.abs(diffMinutes) < 5) return `Now`;
    if (diffMinutes > 0 && diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 0 && diffMinutes > -60) return `${Math.abs(diffMinutes)}m ago`;
    
    // Hour expressions
    if (diffHours > 0 && diffHours < 24) {
      return `${diffHours}h`;
    }
    if (diffHours < 0 && diffHours > -24) return `${Math.abs(diffHours)}h ago`;
    
    // Day expressions with time
    if (diffDays === 0) return `Today ${formatTime(dateObj)}`;
    if (diffDays === 1) return `Tomorrow ${formatTime(dateObj)}`;
    if (diffDays === -1) return `Yesterday`;
    
    // Always show full date with year and time for other dates
    const year = dateObj.getFullYear();
    const currentYear = now.getFullYear();
    
    if (year === currentYear) {
      // Same year: show month, day, time
      const dateStr = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${dateStr} ${formatTime(dateObj)}`;
    } else {
      // Different year: show month, day, year, time
      const dateStr = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      return `${dateStr} ${formatTime(dateObj)}`;
    }
  };

  const getDateDisplay = () => {
    switch (dateType) {
      case 'single':
        return dueDate ? formatDateAdvanced(dueDate) : null;
      case 'range':
        if (startDate && endDate) {
          const start = formatDateAdvanced(startDate);
          const end = formatDateAdvanced(endDate);
          return `${start} → ${end}`;
        }
        return startDate ? formatDateAdvanced(startDate) : null;
      case 'reminder':
        return reminderDate ? formatDateAdvanced(reminderDate) : null;
      default:
        return null;
    }
  };

  const getDateIcon = () => {
    switch (dateType) {
      case 'range': return <RangeIcon />;
      case 'reminder': return <BellIcon />;
      default: return <CalendarIcon />;
    }
  };

  const priorityStyle = PRIORITY_CONFIG[priority];
  const dateDisplay = getDateDisplay();

  return (
    <div className="group mb-1" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div
        initial={{ opacity: 0, y: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={`relative border-l-2 transition-all duration-200 ${
          isCompleted ? 'opacity-50' : 'opacity-100'
        }`}
        style={{
          backgroundColor: priorityStyle.bg,
          borderLeftColor: priorityStyle.accent,
          height: '32px'
        }}
      >
        <div className="flex items-center h-full pl-3 pr-2">
          {/* Status indicator - minimal dot */}
          <motion.button
            onClick={toggleComplete}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            className={`w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0 ${
              isCompleted 
                ? 'bg-green-500' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />

          {/* Title input - directly editable */}
          <div className="flex-1 min-w-0 ml-3 flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add reminder title"
                className={`w-full bg-transparent outline-none text-sm font-normal ${
                  isCompleted 
                    ? 'line-through text-gray-400' 
                    : 'text-gray-700'
                } placeholder-gray-400`}
                readOnly={readOnly || isCompleted}
              />
            </div>
            
            {/* Date display - minimal badge */}
            {dateDisplay && (
              <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-gray-50 rounded-md border">
                {getDateIcon()}
                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  {dateDisplay}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons - ultra minimal */}
          <AnimatePresence>
            {(isHovered || showEditor || showDatePicker) && !readOnly && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-1 ml-2"
              >
                {/* Description button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditor(!showEditor)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    showEditor 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <DescriptionIcon />
                </motion.button>

                {/* Date button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    showDatePicker 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {getDateIcon()}
                </motion.button>

                {/* Priority dot */}
                <motion.button
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.7 }}
                  onClick={cyclePriority}
                  className="transition-all duration-200"
                  style={{ color: priorityStyle.accent }}
                >
                  <DotIcon />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Description panel - minimal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 ml-5"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2 font-medium">Description</div>
              <ProseMirrorTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Add description or notes..."
                readOnly={readOnly || isCompleted}
                blockId={`reminder-${block?.id}`}
                blockType="reminder"
                className="outline-none text-sm leading-relaxed text-gray-900"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date picker panel - minimal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 ml-5"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              {/* Date type selector - compact */}
              <div className="flex gap-1 mb-3">
                {Object.entries(DATE_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setDateType(key)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      dateType === key 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Date inputs - compact */}
              <div className="space-y-2">
                {dateType === 'single' && (
                  <div>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {dateType === 'range' && (
                  <>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </>
                )}

                {dateType === 'reminder' && (
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="flex justify-between mt-3">
                <button
                  onClick={() => {
                    setDueDate('');
                    setStartDate('');
                    setEndDate('');
                    setReminderDate('');
                    setShowDatePicker(false);
                  }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}