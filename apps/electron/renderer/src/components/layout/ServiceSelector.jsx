import React from 'react';
import { services } from '../../services/serviceConfig.js';
import { getServiceGradient } from '../../constants/colors.js';

// 아이콘 매핑
const iconMap = {
  'HomeIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
    </svg>
  ),
  'FileIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  'ChatIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 4V10a2 2 0 012-2h2" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  ),
  'CalendarIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  'BellIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  'TaskIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  'NoteIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  'CloudIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  ),
  'SettingsIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  'DocumentTextIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'CompanyIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'PricingIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'AIIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  // iconMap에 TaxIcon 추가 (예시 SVG)
  'TaxIcon': () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </svg>
  ),
};

const ServiceSelector = ({ activeService, onServiceChange, activePanel, onPanelChange, onAIToggle, isAIOpen }) => {
  return (
    <div className="w-16 bg-slate-900 dark:bg-black flex flex-col items-center pt-4 h-full">
      {/* 서비스 섹션 */}
      <div className="flex flex-col items-center w-full space-y-2">
        {services.map((service) => {
          const IconComponent = iconMap[service.icon];
          const isActive = activeService === service.id && activePanel !== 'settings';
          return (
            <div key={service.id} className="relative group flex items-center justify-center w-full">
              <button
                onClick={() => onServiceChange(service.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
                  ${isActive
                    ? `bg-gradient-to-br ${service.color} shadow-lg hover:shadow-xl hover:scale-105`
                    : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
                `}
                title={service.description}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className={`z-10 flex items-center justify-center w-full h-full ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {IconComponent && <IconComponent />}
                </div>
              </button>
              {/* 툴팁 */}
              <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
                <div className="mb-0.5">{service.name}</div>
                <div className="text-xs text-gray-400">{service.description}</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
              </span>
              {/* 활성 인디케이터 */}
              {isActive && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
              )}
            </div>
          );
        })}
        
        {/* 구분선 */}
        <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-gray-600 to-transparent mt-2"></div>
        
        {/* 설정 아이콘 */}
        <div className="group relative">
          <button
            onClick={() => onPanelChange('settings')}
            className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
              ${activePanel === 'settings'
                ? `bg-gradient-to-br ${getServiceGradient('settings')} shadow-lg hover:shadow-xl hover:scale-105`
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
            `}
            title="설정"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className={`z-10 transition-colors ${activePanel === 'settings' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {iconMap['SettingsIcon'] && iconMap['SettingsIcon']()}
            </div>
          </button>
          {/* 툴팁 */}
          <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
            <div className="mb-0.5">Settings</div>
            <div className="text-xs text-gray-400">앱 설정</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
          </span>
          {/* 활성 인디케이터 */}
          {activePanel === 'settings' && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
          )}
        </div>
        
        {/* 알림 아이콘 */}
        <div className="group relative">
          <button
            onClick={() => onPanelChange('notifications')}
            className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
              ${activePanel === 'notifications'
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
            `}
            title="알림"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className={`z-10 transition-colors ${activePanel === 'notifications' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {iconMap['BellIcon'] && iconMap['BellIcon']()}
            </div>
          </button>
          {/* 툴팁 */}
          <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
            <div className="mb-0.5">알림</div>
            <div className="text-xs text-gray-400">알림 설정 및 메시지</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
          </span>
          {/* 활성 인디케이터 */}
          {activePanel === 'notifications' && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
          )}
        </div>
        
        {/* AI 아이콘 */}
        <div className="group relative mt-2">
          <button
            onClick={onAIToggle}
            className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
              ${isAIOpen
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
            `}
            title="AI 코파일럿"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className={`z-10 transition-colors ${isAIOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {iconMap['AIIcon'] && iconMap['AIIcon']()}
            </div>
          </button>
          {/* 툴팁 */}
          <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
            <div className="mb-0.5">AI 코파일럿</div>
            <div className="text-xs text-gray-400">AI 비서 (Ctrl+I)</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
          </span>
          {/* 활성 인디케이터 */}
          {isAIOpen && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="flex-1"></div>

      {/* 하단 아이콘들 */}
      <div className="flex flex-col items-center w-full space-y-2 pb-4">
        {/* 구분선 */}
        <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2"></div>
        
        {/* 회사 소개 아이콘 */}
        <div className="group relative">
          <button
            onClick={() => onPanelChange('company')}
            className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
              ${activePanel === 'company'
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
            `}
            title="회사 소개"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className={`z-10 transition-colors ${activePanel === 'company' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {iconMap['CompanyIcon'] && iconMap['CompanyIcon']()}
            </div>
          </button>
          {/* 툴팁 */}
          <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
            <div className="mb-0.5">회사 소개</div>
            <div className="text-xs text-gray-400">회사 정보 및 연락처</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
          </span>
          {/* 활성 인디케이터 */}
          {activePanel === 'company' && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
          )}
        </div>
        
        {/* 요금제 아이콘 */}
        <div className="group relative">
          <button
            onClick={() => onPanelChange('pricing')}
            className={`w-12 h-12 flex items-center justify-center rounded-[20px] hover:rounded-[16px] transition-all duration-300 cursor-pointer relative overflow-hidden group
              ${activePanel === 'pricing'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'}
            `}
            title="요금제"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className={`z-10 transition-colors ${activePanel === 'pricing' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {iconMap['PricingIcon'] && iconMap['PricingIcon']()}
            </div>
          </button>
          {/* 툴팁 */}
          <span className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
            <div className="mb-0.5">요금제</div>
            <div className="text-xs text-gray-400">구독 및 결제 정보</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-slate-900 border-b-6 border-b-transparent"></div>
          </span>
          {/* 활성 인디케이터 */}
          {activePanel === 'pricing' && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-glow"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceSelector;