// 모듈 패널 컴포넌트
import React, { useState } from 'react';

const ModulePanel = ({
  isOpen,
  onClose,
  modules = [],
  activeModules = [],
  onToggleModule,
  onConfigureModule,
  onInstallModule,
  onShowAdvanced
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'available'
  const [category, setCategory] = useState('all'); // 'all', 'business', 'education', 'healthcare'

  // 모듈 필터링
  const filteredModules = modules.filter(module => {
    const statusFilter = 
      filter === 'active' ? activeModules.includes(module.id) :
      filter === 'available' ? !activeModules.includes(module.id) :
      true;
    
    const categoryFilter = category === 'all' || module.category === category;
    
    return statusFilter && categoryFilter;
  });

  // 카테고리별 모듈 그룹화
  const groupedModules = filteredModules.reduce((groups, module) => {
    const key = module.category;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(module);
    return groups;
  }, {});

  // 카테고리 정보
  const getCategoryInfo = (category) => {
    const categoryMap = {
      business: { name: '비즈니스' },
      education: { name: '교육' },
      healthcare: { name: '헬스케어' },
      personal: { name: '개인' },
      integration: { name: '연동' }
    };
    return categoryMap[category] || { name: category };
  };

  // 모듈 상태 배지
  const getStatusBadge = (module) => {
    const isActive = activeModules.includes(module.id);
    const isInstalled = module.installed;
    
    if (isActive) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">활성</span>;
    } else if (isInstalled) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">비활성</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">설치 가능</span>;
    }
  };

  // 모듈 액션 버튼
  const getActionButton = (module) => {
    const isActive = activeModules.includes(module.id);
    const isInstalled = module.installed;
    
    if (!isInstalled) {
      return (
        <button
          onClick={() => onInstallModule(module.id)}
          className="px-3 py-1 bg-gray-800 text-white text-sm hover:bg-gray-900"
        >
          설치
        </button>
      );
    } else if (isActive) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => onConfigureModule(module.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm hover:bg-gray-700"
          >
            설정
          </button>
          <button
            onClick={() => onToggleModule(module.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm hover:bg-gray-700"
          >
            비활성화
          </button>
        </div>
      );
    } else {
      return (
        <button
          onClick={() => onToggleModule(module.id)}
          className="px-3 py-1 bg-gray-800 text-white text-sm hover:bg-gray-900"
        >
          활성화
        </button>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl mx-4 h-[80vh] flex flex-col border border-gray-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-medium text-gray-900">모듈 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              캘린더 기능을 확장할 수 있는 모듈을 관리합니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onShowAdvanced && (
              <button
                onClick={onShowAdvanced}
                className="px-3 py-1.5 text-sm bg-gray-800 text-white hover:bg-gray-900"
                title="모듈 분석 & 평가"
              >
                고급 분석
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 필터 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">상태</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="all">전체</option>
                <option value="active">활성 모듈</option>
                <option value="available">사용 가능</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="all">전체</option>
                <option value="business">비즈니스</option>
                <option value="education">교육</option>
                <option value="healthcare">헬스케어</option>
                <option value="personal">개인</option>
                <option value="integration">연동</option>
              </select>
            </div>
            <div className="flex-1"></div>
            <div className="text-sm text-gray-600">
              활성 모듈: {activeModules.length} / {modules.filter(m => m.installed).length}
            </div>
          </div>
        </div>

        {/* 모듈 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedModules).length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-medium text-gray-900 mb-2">사용 가능한 모듈이 없습니다</p>
              <p className="text-gray-500">필터 설정을 변경해보세요</p>
            </div>
          ) : (
            Object.entries(groupedModules).map(([categoryKey, modules]) => {
              const categoryInfo = getCategoryInfo(categoryKey);
              
              return (
                <div key={categoryKey} className="mb-8">
                  <div className="flex items-center mb-4 px-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{categoryInfo.name}</h3>
                    <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                    <span className="text-xs text-gray-500">
                      {modules.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="bg-white border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm mr-3">
                              {module.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{module.name}</h4>
                              <p className="text-xs text-gray-500">v{module.version}</p>
                            </div>
                          </div>
                          {getStatusBadge(module)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {module.description}
                        </p>
                        
                        {/* 기능 목록 */}
                        {module.features && module.features.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-700 mb-1">주요 기능:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {module.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                  {feature}
                                </li>
                              ))}
                              {module.features.length > 3 && (
                                <li className="text-gray-600">
                                  +{module.features.length - 3}개 더...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {/* 메타 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>개발자: {module.developer}</span>
                          {module.rating && (
                            <div className="flex items-center">
                              <span className="text-gray-500">★</span>
                              <span className="ml-1">{module.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 액션 버튼 */}
                        <div className="flex justify-end">
                          {getActionButton(module)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              총 {modules.length}개 모듈 / 설치됨: {modules.filter(m => m.installed).length} / 활성: {activeModules.length}
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-800">
                모듈 스토어 방문
              </button>
              <button className="text-gray-600 hover:text-gray-800">
                개발자 가이드
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 기본 모듈 데이터 (개발용)
export const defaultModules = [
  {
    id: 'business-meetings',
    name: '비즈니스 미팅',
    version: '1.2.0',
    category: 'business',
    description: '화상회의 연동, 회의실 예약, 참석자 관리 등 비즈니스 미팅에 특화된 기능을 제공합니다.',
    features: [
      'Zoom/Teams 연동',
      '회의실 자동 예약',
      '참석자 자동 초대',
      '회의록 템플릿',
      '반복 미팅 설정'
    ],
    developer: 'Calendar Pro',
    rating: 4.8,
    installed: true
  },
  {
    id: 'education-schedule',
    name: '교육 스케줄러',
    version: '2.1.0',
    category: 'education',
    description: '수업 시간표, 과제 관리, 시험 일정 등 교육 기관에서 필요한 일정 관리 기능을 제공합니다.',
    features: [
      '시간표 자동 생성',
      '과제 마감일 관리',
      '시험 일정 알림',
      '성적 관리 연동',
      '학부모 알림'
    ],
    developer: 'EduTech Solutions',
    rating: 4.6,
    installed: false
  },
  {
    id: 'healthcare-appointments',
    name: '의료 예약 관리',
    version: '1.5.0',
    category: 'healthcare',
    description: '환자 예약, 진료 일정, 처방전 관리 등 의료진을 위한 전문적인 일정 관리 시스템입니다.',
    features: [
      '환자 예약 시스템',
      '진료 기록 연동',
      '처방전 알림',
      '응급 상황 대응',
      'EMR 시스템 연동'
    ],
    developer: 'MedCal Inc.',
    rating: 4.9,
    installed: true
  },
  {
    id: 'personal-fitness',
    name: '개인 피트니스',
    version: '1.0.5',
    category: 'personal',
    description: '운동 계획, 식단 관리, 건강 목표 추적 등 개인 건강 관리를 위한 캘린더 모듈입니다.',
    features: [
      '운동 계획 수립',
      '식단 일정 관리',
      '건강 목표 추적',
      '웨어러블 연동',
      '진행상황 리포트'
    ],
    developer: 'FitLife Apps',
    rating: 4.3,
    installed: false
  },
  {
    id: 'integration-google',
    name: 'Google 워크스페이스',
    version: '3.0.0',
    category: 'integration',
    description: 'Google Calendar, Gmail, Drive 등 Google 서비스와의 완벽한 동기화를 제공합니다.',
    features: [
      'Google Calendar 동기화',
      'Gmail 일정 자동 추출',
      'Drive 파일 연결',
      'Meet 회의 생성',
      '실시간 동기화'
    ],
    developer: 'Google LLC',
    rating: 4.7,
    installed: true
  }
];

export default ModulePanel;