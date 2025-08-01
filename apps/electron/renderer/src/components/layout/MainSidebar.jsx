import React, { useState } from 'react';

// 아이콘 매핑
const iconMap = {
  'FileIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  'SearchIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  'BarChart3Icon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'AIIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  'ChatIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 4V10a2 2 0 012-2h2" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  ),
  'HistoryIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'PromptIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  'CalendarIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  'EventIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'ReminderIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  // 새로 추가된 서비스 아이콘들
  'ChatBubbleIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  'UserIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  'UserGroupIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'UsersIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  'PhotoIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'DocumentTextIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'DocumentDuplicateIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  'PencilIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  'IdentificationIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  'ShareIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  'CloudArrowDownIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  ),
  'StarIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  'ClockIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  // 누락된 서비스 아이콘들 추가
  'SyncIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  'StorageIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  'BackupIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  'NoteIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  'FolderIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  'InboxIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  'SettingsIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'TaskIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  'ProjectIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  'AnalyticsIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'BellIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  'CloudIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  'TaxIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </svg>
  ),
  'BookIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6.5V17M20 6.5A2.5 2.5 0 0017.5 4H6.5A2.5 2.5 0 004 6.5v13A2.5 2.5 0 006.5 22H20" />
    </svg>
  ),
  'ReceiptIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  ),
  'BookmarkIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const ChevronIcon = ({ collapsed }) => (
  <svg 
    className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MainSidebar = ({
  serviceName,
  serviceDescription,
  serviceIcon,
  panels = [],
  activePanel,
  onPanelChange,
  collapsed,
  onToggleCollapse,
  drives = [],
  favorites = [],
  recentFiles = [],
  currentPath,
  onNavigate,
  onNotification,
  children
}) => {
  const [expandedSections, setExpandedSections] = useState({
    drives: true,
    favorites: true,
    recent: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatPath = (path) => {
    if (!path) return '';
    const parts = path.split(/[\\\/]/);
    return parts[parts.length - 1] || parts[parts.length - 2] || path;
  };

  const ServiceIconComponent =
    serviceName === 'Notes' ? iconMap['PencilIcon'] : iconMap[serviceIcon];

  return (
    <div className={`
      bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-slate-700/50
      flex flex-col transition-all duration-300 ease-in-out shadow-xl
      ${collapsed ? 'w-20' : 'w-72'}
    `}>
      {/* 헤더 */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              {ServiceIconComponent && <ServiceIconComponent />}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{serviceName}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{serviceDescription}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            {/* 접힌 상태에서는 아이콘을 렌더링하지 않음 */}
            <div className="w-8 h-8" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
            title="사이드바 축소"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-3 right-2 p-1.5 rounded-md hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all duration-200"
            title="사이드바 확장"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {/* 네비게이션 패널 */}
      <div className={`flex-shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className="space-y-1.5">
          {panels.map((panel) => {
            const IconComponent = iconMap[panel.icon];
            const isActive = activePanel === panel.id;
            
            return (
              <button
                key={panel.id}
                onClick={() => onPanelChange(panel.id)}
                className={`
                  ${collapsed 
                    ? 'w-12 h-10 mx-auto flex items-center justify-center rounded-xl' 
                    : 'w-full flex items-center px-4 py-3 rounded-xl'
                  }
                  text-sm font-medium transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 transform scale-[1.02]' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:shadow-lg hover:scale-[1.01]'
                  }
                `}
                title={collapsed ? `${panel.label} (${panel.shortcut})` : panel.shortcut}
              >
                <div className={`${collapsed ? 'p-0' : 'p-1.5'} rounded-md ${isActive && !collapsed ? 'bg-white/20' : collapsed ? '' : 'bg-gray-100/50 dark:bg-slate-700/50'} transition-all duration-200`}>
                  {IconComponent && <IconComponent />}
                </div>
                {!collapsed && (
                  <>
                    <span className="ml-2.5 font-medium text-sm">{panel.label}</span>
                    <span className="ml-auto text-xs opacity-60 bg-gray-100/50 dark:bg-slate-700/50 px-2 py-0.5 rounded font-mono">
                      {panel.shortcut?.replace('Ctrl+', '⌘')}
                    </span>
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {panel.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* File Manager 전용 섹션들 (serviceName이 'File Manager'일 때만 표시) */}
      {serviceName === 'File Manager' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 드라이브 */}
            <div>
              <button
                onClick={() => toggleSection('drives')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>드라이브</span>
                <ChevronIcon collapsed={!expandedSections.drives} />
              </button>
              {expandedSections.drives && (
                <div className="space-y-1">
                  {drives.map((drive, index) => (
                    <button
                      key={index}
                      onClick={() => onNavigate(drive.path)}
                      className={`
                        w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200 group
                        ${currentPath === drive.path 
                          ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className={`p-1.5 rounded-md ${currentPath === drive.path ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gray-100/50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400'} transition-all duration-200`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <span className="ml-2.5 truncate text-sm">{drive.name}</span>
                      {currentPath === drive.path && (
                        <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 즐겨찾기 */}
            <div>
              <button
                onClick={() => toggleSection('favorites')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <span>즐겨찾기</span>
                <ChevronIcon collapsed={!expandedSections.favorites} />
              </button>
              {expandedSections.favorites && (
                <div className="space-y-1">
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-100/50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">즐겨찾기가 없습니다</p>
                      <p className="text-xs text-gray-400 mt-1">자주 사용하는 폴더를 추가하세요</p>
                    </div>
                  ) : (
                    <div 
                      className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar"
                    >
                      {favorites.map((favorite, index) => (
                        <button
                          key={index}
                          onClick={() => onNavigate(favorite.path)}
                          className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                        >
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm transition-all duration-200">
                            <StarIcon className="text-white" />
                          </div>
                          <span className="ml-2.5 truncate text-sm">{formatPath(favorite.path)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 최근 파일 */}
            <div>
              <button
                onClick={() => toggleSection('recent')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <span>최근 파일</span>
                <ChevronIcon collapsed={!expandedSections.recent} />
              </button>
              {expandedSections.recent && (
                <div className="space-y-1">
                  {recentFiles.length === 0 ? (
                    <div className="text-center py-6">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-gray-400">최근 파일이 없습니다</p>
                    </div>
                  ) : (
                    recentFiles.slice(0, 5).map((file, index) => (
                      <button
                        key={index}
                        onClick={() => onNavigate(file.path)}
                        className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                      >
                        <div className="p-1.5 rounded-md bg-gray-100/50 dark:bg-slate-700/50 group-hover:bg-gray-200/50 dark:group-hover:bg-slate-600/50 transition-all duration-200">
                          <ClockIcon className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="ml-2.5 truncate text-sm">{formatPath(file.path)}</span>
                        <span className="ml-auto text-xs opacity-50">
                          {new Date(file.modifiedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chatbot 서비스 전용 섹션들 */}
      {serviceName === 'Chatbot' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 최근 대화 */}
            <div>
              <button
                onClick={() => toggleSection('recentChats')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>최근 대화</span>
                <ChevronIcon collapsed={!expandedSections.recentChats} />
              </button>
              {expandedSections.recentChats && (
                <div className="space-y-1">
                  {[
                    'AI 코드 리뷰 요청', '프로젝트 아이디어 논의', '기술 문서 작성 도움', '디버깅 문제 해결', '개발 방향성 상담',
                    'React 컴포넌트 최적화', 'TypeScript 타입 정의', 'API 설계 논의', '데이터베이스 스키마', '배포 전략 수립',
                    '성능 최적화 방안', '보안 취약점 점검', '사용자 피드백 분석', '모니터링 시스템 구축', '백업 전략 수립'
                  ].map((chat, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-blue-100/50 dark:bg-blue-900/30 group-hover:bg-blue-200/50 dark:group-hover:bg-blue-800/40 transition-all duration-200">
                        {iconMap['HistoryIcon'] && React.createElement(iconMap['HistoryIcon'], { className: "text-blue-600 dark:text-blue-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{chat}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {new Date(Date.now() - index * 86400000).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 저장된 프롬프트 */}
            <div>
              <button
                onClick={() => toggleSection('savedPrompts')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>저장된 프롬프트</span>
                <ChevronIcon collapsed={!expandedSections.savedPrompts} />
              </button>
              {expandedSections.savedPrompts && (
                <div className="space-y-1">
                  {[
                    '코드 리뷰어', '문서 작성자', '기술 멘토', '디버거', '아키텍트',
                    '성능 분석가', '보안 전문가', 'UI/UX 디자이너', '데이터 분석가', 'DevOps 엔지니어',
                    '프로젝트 매니저', 'QA 테스터', '시스템 관리자', '네트워크 엔지니어', '데이터베이스 관리자'
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-purple-100/50 dark:bg-purple-900/30 group-hover:bg-purple-200/50 dark:group-hover:bg-purple-800/40 transition-all duration-200">
                        {iconMap['PromptIcon'] && React.createElement(iconMap['PromptIcon'], { className: "text-purple-600 dark:text-purple-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{prompt}</span>
                      <span className="ml-auto text-xs opacity-50">⭐</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar 서비스 전용 섹션들 */}
      {serviceName === 'Calendar' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 오늘 일정 */}
            <div>
              <button
                onClick={() => toggleSection('todayEvents')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>오늘 일정</span>
                <ChevronIcon collapsed={!expandedSections.todayEvents} />
              </button>
              {expandedSections.todayEvents && (
                <div className="space-y-1">
                  {[
                    '팀 미팅', '프로젝트 리뷰', '클라이언트 통화', '코드 리뷰', '개발자 회의',
                    '디자인 리뷰', 'QA 테스트', '배포 준비', '성능 모니터링', '보안 점검',
                    '사용자 피드백 수집', '문서 업데이트', '백업 확인', '시스템 점검', '업데이트 배포'
                  ].map((event, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-green-100/50 dark:bg-green-900/30 group-hover:bg-green-200/50 dark:group-hover:bg-green-800/40 transition-all duration-200">
                        {iconMap['EventIcon'] && React.createElement(iconMap['EventIcon'], { className: "text-green-600 dark:text-green-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{event}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {(9 + index)}:00
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 다가오는 이벤트 */}
            <div>
              <button
                onClick={() => toggleSection('upcomingEvents')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>다가오는 이벤트</span>
                <ChevronIcon collapsed={!expandedSections.upcomingEvents} />
              </button>
              {expandedSections.upcomingEvents && (
                <div className="space-y-1">
                  {[
                    '제품 런칭', '컨퍼런스 참가', '팀 빌딩', '기술 세미나', '프로젝트 마감',
                    '고객 만남', '투자자 미팅', '기술 발표', '워크샵', '연말 파티',
                    '새해 계획 수립', '예산 회의', '인사 평가', '교육 프로그램', '팀 리트리트'
                  ].map((event, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-orange-100/50 dark:bg-orange-900/30 group-hover:bg-orange-200/50 dark:group-hover:bg-orange-800/40 transition-all duration-200">
                        {iconMap['CalendarIcon'] && React.createElement(iconMap['CalendarIcon'], { className: "text-orange-600 dark:text-orange-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{event}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index + 2}일 후
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications 서비스 전용 섹션들 */}
      {serviceName === 'Notifications' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 읽지 않은 알림 */}
            <div>
              <button
                onClick={() => toggleSection('unreadNotifications')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>읽지 않은 알림</span>
                <ChevronIcon collapsed={!expandedSections.unreadNotifications} />
              </button>
              {expandedSections.unreadNotifications && (
                <div className="space-y-1">
                  {[
                    '새 메시지 도착', '파일 동기화 완료', '작업 마감일 임박', '시스템 업데이트', '보안 알림',
                    '백업 완료', '로그인 시도', '디스크 공간 부족', '네트워크 연결 오류', '메모리 사용량 높음',
                    'CPU 사용률 경고', '디스크 I/O 지연', '데이터베이스 연결 오류', 'API 응답 지연', 'SSL 인증서 만료'
                  ].map((notification, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-red-100/50 dark:bg-red-900/30 group-hover:bg-red-200/50 dark:group-hover:bg-red-800/40 transition-all duration-200">
                        {iconMap['ReminderIcon'] && React.createElement(iconMap['ReminderIcon'], { className: "text-red-600 dark:text-red-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{notification}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index + 1}분 전
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 알림 */}
            <div>
              <button
                onClick={() => toggleSection('recentNotifications')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>최근 알림</span>
                <ChevronIcon collapsed={!expandedSections.recentNotifications} />
              </button>
              {expandedSections.recentNotifications && (
                <div className="space-y-1">
                  {[
                    '백업 완료', '앱 업데이트', '새 기능 안내', '성능 리포트', '사용량 통계',
                    '로그 분석 완료', '보안 스캔 완료', '데이터 동기화', '캐시 정리', '임시 파일 삭제',
                    '업데이트 확인', '라이센스 갱신', '사용자 피드백', '오류 리포트', '성능 최적화'
                  ].map((notification, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-gray-100/50 dark:bg-gray-700/50 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-600/50 transition-all duration-200">
                        {iconMap['InboxIcon'] && React.createElement(iconMap['InboxIcon'], { className: "text-gray-600 dark:text-gray-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{notification}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index + 1}시간 전
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Manager 서비스 전용 섹션들 */}
      {serviceName === 'Task Manager' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 진행 중인 작업 */}
            <div>
              <button
                onClick={() => toggleSection('activeTasks')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>진행 중인 작업</span>
                <ChevronIcon collapsed={!expandedSections.activeTasks} />
              </button>
              {expandedSections.activeTasks && (
                <div className="space-y-1">
                  {[
                    'UI 리디자인', 'API 통합', '버그 수정', '테스트 작성', '문서 업데이트',
                    '데이터베이스 최적화', '성능 개선', '보안 강화', '모바일 반응형', '접근성 개선',
                    '국제화 지원', '다크 모드 구현', '오프라인 기능', '푸시 알림', '실시간 동기화'
                  ].map((task, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-yellow-100/50 dark:bg-yellow-900/30 group-hover:bg-yellow-200/50 dark:group-hover:bg-yellow-800/40 transition-all duration-200">
                        {iconMap['TaskIcon'] && React.createElement(iconMap['TaskIcon'], { className: "text-yellow-600 dark:text-yellow-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{task}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {75 - index * 15}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 프로젝트 */}
            <div>
              <button
                onClick={() => toggleSection('projects')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>프로젝트</span>
                <ChevronIcon collapsed={!expandedSections.projects} />
              </button>
              {expandedSections.projects && (
                <div className="space-y-1">
                  {['웹 애플리케이션', '모바일 앱', 'AI 시스템', '데이터 분석', '인프라 구축'].map((project, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-indigo-100/50 dark:bg-indigo-900/30 group-hover:bg-indigo-200/50 dark:group-hover:bg-indigo-800/40 transition-all duration-200">
                        {iconMap['ProjectIcon'] && React.createElement(iconMap['ProjectIcon'], { className: "text-indigo-600 dark:text-indigo-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{project}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index + 3}개
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes 서비스 전용 섹션들 */}
      {serviceName === 'Notes' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-4">
            {/* 빠른 통계 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">24</span>
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                    {iconMap['NoteIcon'] && React.createElement(iconMap['NoteIcon'], { className: "w-3 h-3 text-blue-600 dark:text-blue-400" })}
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">전체</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">5</span>
                  <div className="w-6 h-6 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center">
                    {iconMap['StarIcon'] && React.createElement(iconMap['StarIcon'], { className: "w-3 h-3 text-amber-600 dark:text-amber-400" })}
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">즐겨찾기</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">3</span>
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center">
                    {iconMap['ShareIcon'] && React.createElement(iconMap['ShareIcon'], { className: "w-3 h-3 text-green-600 dark:text-green-400" })}
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">공유됨</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">8</span>
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800/50 rounded-lg flex items-center justify-center">
                    {iconMap['ClockIcon'] && React.createElement(iconMap['ClockIcon'], { className: "w-3 h-3 text-purple-600 dark:text-purple-400" })}
                  </div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">최근</p>
              </div>
            </div>

            {/* 노트 폴더 */}
            <div>
              <button
                onClick={() => toggleSection('noteFolders')}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <span>폴더</span>
                <ChevronIcon collapsed={!expandedSections.noteFolders} />
              </button>
              {expandedSections.noteFolders && (
                <div className="space-y-1.5">
                  {[
                    { name: '개인', count: 12, color: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' }, 
                    { name: '업무', count: 8, color: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20' },
                    { name: '아이디어', count: 15, color: 'from-amber-500 to-amber-600', text: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-900/20' },
                    { name: '학습', count: 6, color: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20' },
                    { name: '아카이브', count: 3, color: 'from-gray-500 to-gray-600', text: 'text-gray-600', light: 'bg-gray-50 dark:bg-gray-900/20' }
                  ].map((folder, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-sm hover:scale-[1.01] ${folder.text} ${folder.light} border border-current/20`}
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${folder.color} flex items-center justify-center mr-3 shadow-sm`}>
                        {iconMap['FolderIcon'] && React.createElement(iconMap['FolderIcon'], { className: "w-3.5 h-3.5 text-white" })}
                      </div>
                      <span className="flex-1 text-left font-medium">{folder.name}</span>
                      <span className="text-xs font-semibold opacity-80">{folder.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 인기 태그 */}
            <div>
              <button
                onClick={() => toggleSection('popularTags')}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <span>인기 태그</span>
                <ChevronIcon collapsed={!expandedSections.popularTags} />
              </button>
              {expandedSections.popularTags && (
                <div className="flex flex-wrap gap-1.5">
                  {['React', 'JavaScript', '회의록', '아이디어', 'UI/UX', '개발', '학습', '프로젝트'].map((tag, index) => (
                    <button
                      key={index}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all duration-200"
                    >
                      <span>{tag}</span>
                      <span className="ml-1.5 opacity-60">{index + 2}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 노트 */}
            <div>
              <button
                onClick={() => toggleSection('recentNotes')}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <span>최근 노트</span>
                <ChevronIcon collapsed={!expandedSections.recentNotes} />
              </button>
              {expandedSections.recentNotes && (
                <div className="space-y-2">
                  {['프로젝트 미팅 노트', 'React 학습 정리', 'UI 개선 아이디어', '버그 추적 메모', '독서 요약'].map((note, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {note}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(Date.now() - index * 3600000).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          {index < 2 && (
                            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync 서비스 전용 섹션들 */}
      {serviceName === 'Cloud Sync' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 동기화 상태 */}
            <div>
              <button
                onClick={() => toggleSection('syncStatus')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>동기화 상태</span>
                <ChevronIcon collapsed={!expandedSections.syncStatus} />
              </button>
              {expandedSections.syncStatus && (
                <div className="space-y-1">
                  {[
                    '문서 폴더', '프로젝트 파일', '설정 백업', '미디어 파일', '데이터베이스',
                    '로그 파일', '템플릿 파일', '플러그인', '테마 파일', '언어 파일',
                    '업데이트 파일', '임시 파일', '캐시 파일', '백업 파일', '아카이브 파일'
                  ].map((item, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-cyan-100/50 dark:bg-cyan-900/30 group-hover:bg-cyan-200/50 dark:group-hover:bg-cyan-800/40 transition-all duration-200">
                        {iconMap['SyncIcon'] && React.createElement(iconMap['SyncIcon'], { className: "text-cyan-600 dark:text-cyan-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{item}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index === 0 ? '동기화 중' : '완료'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 클라우드 저장소 */}
            <div>
              <button
                onClick={() => toggleSection('cloudStorage')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>클라우드 저장소</span>
                <ChevronIcon collapsed={!expandedSections.cloudStorage} />
              </button>
              {expandedSections.cloudStorage && (
                <div className="space-y-1">
                  {[
                    'Google Drive', 'Dropbox', 'OneDrive', 'AWS S3', 'iCloud',
                    'Box', 'Mega', 'pCloud', 'Sync.com', 'Tresorit',
                    'Nextcloud', 'OwnCloud', 'Seafile', 'Synology', 'QNAP'
                  ].map((storage, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-blue-100/50 dark:bg-blue-900/30 group-hover:bg-blue-200/50 dark:group-hover:bg-blue-800/40 transition-all duration-200">
                        {iconMap['StorageIcon'] && React.createElement(iconMap['StorageIcon'], { className: "text-blue-600 dark:text-blue-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{storage}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index < 2 ? '연결됨' : '미연결'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messenger 서비스 전용 섹션들 */}
      {serviceName === 'Messenger' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 최근 대화 */}
            <div>
              <button
                onClick={() => toggleSection('recentChats')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>최근 대화</span>
                <ChevronIcon collapsed={!expandedSections.recentChats} />
              </button>
              {expandedSections.recentChats && (
                <div className="space-y-1">
                  {[
                    '김개발자', '박팀장', '개발팀 그룹', '이디자이너', '클라이언트',
                    '최디자이너', '정기획자', '마케팅팀', '운영팀', '고객지원팀',
                    '프로젝트A팀', '프로젝트B팀', '기술지원팀', '품질관리팀', '인사팀'
                  ].map((contact, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-green-100/50 dark:bg-green-900/30 group-hover:bg-green-200/50 dark:group-hover:bg-green-800/40 transition-all duration-200">
                        {iconMap['ChatBubbleIcon'] && React.createElement(iconMap['ChatBubbleIcon'], { className: "text-green-600 dark:text-green-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{contact}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {index === 0 ? '온라인' : '오프라인'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 즐겨찾기 */}
            <div>
              <button
                onClick={() => toggleSection('favoriteContacts')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>즐겨찾기</span>
                <ChevronIcon collapsed={!expandedSections.favoriteContacts} />
              </button>
              {expandedSections.favoriteContacts && (
                <div className="space-y-1">
                  {['최팀장', '이매니저', '김CTO', '박대표', '홍부장'].map((contact, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-yellow-100/50 dark:bg-yellow-900/30 group-hover:bg-yellow-200/50 dark:group-hover:bg-yellow-800/40 transition-all duration-200">
                        <StarIcon className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="ml-2.5 truncate text-sm">{contact}</span>
                      <span className="ml-auto text-xs opacity-50">⭐</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contacts 서비스 전용 섹션들 */}
      {serviceName === 'Contacts' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 최근 연락처 */}
            <div>
              <button
                onClick={() => toggleSection('recentContacts')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>최근 연락처</span>
                <ChevronIcon collapsed={!expandedSections.recentContacts} />
              </button>
              {expandedSections.recentContacts && (
                <div className="space-y-1">
                  {[
                    '김철수', '이영희', '박민수', '최지연', '정다은',
                    '한지민', '송혜교', '전지현', '김태희', '이영애',
                    '손예진', '김하늘', '정우성', '원빈', '장동건'
                  ].map((contact, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-purple-100/50 dark:bg-purple-900/30 group-hover:bg-purple-200/50 dark:group-hover:bg-purple-800/40 transition-all duration-200">
                        {iconMap['UserIcon'] && React.createElement(iconMap['UserIcon'], { className: "text-purple-600 dark:text-purple-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{contact}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {new Date(Date.now() - index * 86400000).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 그룹 */}
            <div>
              <button
                onClick={() => toggleSection('contactGroups')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>그룹</span>
                <ChevronIcon collapsed={!expandedSections.contactGroups} />
              </button>
              {expandedSections.contactGroups && (
                <div className="space-y-1">
                  {[
                    '개발팀', '디자인팀', '경영진', '클라이언트', '파트너',
                    '마케팅팀', '영업팀', '고객지원팀', '운영팀', '기술지원팀',
                    '품질관리팀', '인사팀', '재무팀', '법무팀', '보안팀'
                  ].map((group, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-indigo-100/50 dark:bg-indigo-900/30 group-hover:bg-indigo-200/50 dark:group-hover:bg-indigo-800/40 transition-all duration-200">
                        {iconMap['UserGroupIcon'] && React.createElement(iconMap['UserGroupIcon'], { className: "text-indigo-600 dark:text-indigo-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{group}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {(index + 1) * 3}명
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents 서비스 전용 섹션들 */}
      {serviceName === 'Documents' && !collapsed && (
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-6">
            {/* 최근 문서 */}
            <div>
              <button
                onClick={() => toggleSection('recentDocuments')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>최근 문서</span>
                <ChevronIcon collapsed={!expandedSections.recentDocuments} />
              </button>
              {expandedSections.recentDocuments && (
                <div className="space-y-1">
                  {[
                    '프로젝트 제안서', '기술 명세서', '사용자 매뉴얼', '회의록', 'API 문서',
                    '데이터베이스 설계서', '시스템 아키텍처', '보안 정책서', '운영 가이드', '테스트 계획서',
                    '배포 가이드', '모니터링 설정', '백업 정책', '재해 복구 계획', '라이센스 계약서'
                  ].map((doc, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-100/50 dark:bg-emerald-900/30 group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-800/40 transition-all duration-200">
                        {iconMap['DocumentTextIcon'] && React.createElement(iconMap['DocumentTextIcon'], { className: "text-emerald-600 dark:text-emerald-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{doc}</span>
                      <span className="ml-auto text-xs opacity-50">
                        {new Date(Date.now() - index * 86400000).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 문서 템플릿 */}
            <div>
              <button
                onClick={() => toggleSection('documentTemplates')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
              >
                <span>문서 템플릿</span>
                <ChevronIcon collapsed={!expandedSections.documentTemplates} />
              </button>
              {expandedSections.documentTemplates && (
                <div className="space-y-1">
                  {[
                    '계약서', '보고서', '프레젠테이션', '이력서', '견적서',
                    '제안서', '명세서', '매뉴얼', '가이드', '정책서',
                    '절차서', '체크리스트', '양식', '서식', '템플릿'
                  ].map((template, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-md bg-orange-100/50 dark:bg-orange-900/30 group-hover:bg-orange-200/50 dark:group-hover:bg-orange-800/40 transition-all duration-200">
                        {iconMap['DocumentDuplicateIcon'] && React.createElement(iconMap['DocumentDuplicateIcon'], { className: "text-orange-600 dark:text-orange-400" })}
                      </div>
                      <span className="ml-2.5 truncate text-sm">{template}</span>
                      <span className="ml-auto text-xs opacity-50">📄</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 축소된 상태일 때의 간단한 네비게이션 */}
      {collapsed && serviceName === 'File Manager' && (
        <div className="flex-1 p-2 space-y-2">
          {drives.slice(0, 3).map((drive, index) => (
            <button
              key={index}
              onClick={() => onNavigate(drive.path)}
              className="w-14 h-10 mx-auto flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 hover:shadow-sm transition-all duration-200 group relative"
              title={drive.name}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {drive.name}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 커스텀 children 영역 (서비스별 확장용) */}
      {!collapsed && children}
    </div>
  );
};

export default MainSidebar;