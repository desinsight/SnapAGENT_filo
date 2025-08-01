// 이벤트 템플릿 관리 패널
import React, { useState, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../../constants/calendarConfig';

const EventTemplatePanel = ({
  isOpen,
  onClose,
  templates = [],
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
  categories = []
}) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'create', 'manage'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // 새 템플릿 생성 폼 상태
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'business',
    title: '',
    duration: 60,
    location: '',
    description_template: '',
    notification_settings: {
      email: { enabled: true, timing: [15] },
      push: { enabled: true, timing: [10] },
      sms: { enabled: false, timing: [5] }
    },
    attendees_template: [],
    custom_fields: [],
    tags: []
  });

  // 템플릿 필터링
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // 카테고리별 템플릿 그룹화
  const templatesByCategory = filteredTemplates.reduce((groups, template) => {
    const category = template.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {});

  // 템플릿 사용하기
  const handleUseTemplate = (template) => {
    onUseTemplate?.(template);
    onClose();
  };

  // 새 템플릿 저장
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) return;
    
    const templateData = {
      ...newTemplate,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString(),
      usage_count: 0,
      is_default: false
    };
    
    onCreateTemplate?.(templateData);
    setNewTemplate({
      name: '',
      description: '',
      category: 'business',
      title: '',
      duration: 60,
      location: '',
      description_template: '',
      notification_settings: {
        email: { enabled: true, timing: [15] },
        push: { enabled: true, timing: [10] },
        sms: { enabled: false, timing: [5] }
      },
      attendees_template: [],
      custom_fields: [],
      tags: []
    });
    setActiveTab('browse');
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (templateId) => {
    onDeleteTemplate?.(templateId);
    setShowDeleteConfirm(null);
  };

  // 카테고리 정보
  const getCategoryInfo = (category) => {
    const categoryMap = {
      business: { name: '비즈니스', icon: '💼', color: 'blue' },
      meeting: { name: '회의', icon: '🤝', color: 'green' },
      education: { name: '교육', icon: '🎓', color: 'purple' },
      healthcare: { name: '헬스케어', icon: '🏥', color: 'red' },
      personal: { name: '개인', icon: '👤', color: 'gray' },
      social: { name: '소셜', icon: '🎉', color: 'pink' },
      travel: { name: '여행', icon: '✈️', color: 'cyan' },
      custom: { name: '커스텀', icon: '⚙️', color: 'orange' }
    };
    return categoryMap[category] || { name: category, icon: '📋', color: 'gray' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">이벤트 템플릿</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              자주 사용하는 이벤트를 템플릿으로 저장하고 재사용하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            템플릿 찾아보기
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            새 템플릿 만들기
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            내 템플릿 관리
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'browse' && (
            <div className="h-full flex flex-col">
              {/* 검색 및 필터 */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="템플릿 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 카테고리</option>
                    <option value="business">비즈니스</option>
                    <option value="meeting">회의</option>
                    <option value="education">교육</option>
                    <option value="healthcare">헬스케어</option>
                    <option value="personal">개인</option>
                    <option value="social">소셜</option>
                    <option value="travel">여행</option>
                    <option value="custom">커스텀</option>
                  </select>
                </div>
              </div>

              {/* 템플릿 목록 */}
              <div className="flex-1 overflow-y-auto p-6">
                {Object.keys(templatesByCategory).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">템플릿이 없습니다</p>
                    <p className="text-sm text-gray-500">새 템플릿을 만들어보세요</p>
                  </div>
                ) : (
                  Object.entries(templatesByCategory).map(([category, categoryTemplates]) => {
                    const categoryInfo = getCategoryInfo(category);
                    
                    return (
                      <div key={category} className="mb-8">
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-2">{categoryInfo.icon}</span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {categoryInfo.name}
                          </h3>
                          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            {categoryTemplates.length}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    {template.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                              
                              {/* 템플릿 정보 */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {template.duration}분
                                </div>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  사용횟수: {template.usage_count || 0}
                                </div>
                              </div>

                              {/* 태그 */}
                              {template.tags && template.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {template.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {template.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                      +{template.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 액션 버튼 */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUseTemplate(template)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  사용하기
                                </button>
                                <button
                                  onClick={() => setSelectedTemplate(template)}
                                  className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                >
                                  미리보기
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* 기본 정보 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        템플릿 이름 *
                      </label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 주간 팀 미팅"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        카테고리
                      </label>
                      <select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="business">비즈니스</option>
                        <option value="meeting">회의</option>
                        <option value="education">교육</option>
                        <option value="healthcare">헬스케어</option>
                        <option value="personal">개인</option>
                        <option value="social">소셜</option>
                        <option value="travel">여행</option>
                        <option value="custom">커스텀</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      설명
                    </label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이 템플릿에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>

                {/* 이벤트 기본값 */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">이벤트 기본값</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        기본 제목
                      </label>
                      <input
                        type="text"
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 주간 팀 미팅"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        기본 시간 (분)
                      </label>
                      <input
                        type="number"
                        value={newTemplate.duration}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="5"
                        step="5"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      기본 위치
                    </label>
                    <input
                      type="text"
                      value={newTemplate.location}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 회의실 A, Zoom 링크 등"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      기본 설명 템플릿
                    </label>
                    <textarea
                      value={newTemplate.description_template}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description_template: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이벤트 설명 템플릿을 입력하세요"
                    />
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!newTemplate.name.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    템플릿 저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {templates.filter(t => !t.is_default).map((template) => (
                  <div key={template.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>카테고리: {getCategoryInfo(template.category).name}</span>
                          <span>사용횟수: {template.usage_count || 0}</span>
                          <span>생성일: {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          사용
                        </button>
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(template.id)}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {templates.filter(t => !t.is_default).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">사용자 정의 템플릿이 없습니다</p>
                    <p className="text-sm text-gray-500">새 템플릿을 만들어보세요</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">템플릿 삭제</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTemplatePanel;