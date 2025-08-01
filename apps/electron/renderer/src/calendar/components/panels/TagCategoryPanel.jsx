import React, { useState, useEffect } from 'react';

const TagCategoryPanel = ({
  isOpen,
  onClose,
  tags = [],
  categories = [],
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBulkTagOperation,
  tagStats = {},
  categoryStats = {}
}) => {
  const [activeTab, setActiveTab] = useState('tags');
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6366f1', description: '', icon: '' });
  const [editingTag, setEditingTag] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  const categoryIcons = [
    { value: 'briefcase', name: '비즈니스' },
    { value: 'heart', name: '개인' },
    { value: 'users', name: '팀' },
    { value: 'calendar', name: '일정' },
    { value: 'star', name: '중요' },
    { value: 'home', name: '가정' },
    { value: 'graduation-cap', name: '교육' },
    { value: 'dumbbell', name: '건강' },
    { value: 'plane', name: '여행' },
    { value: 'shopping-cart', name: '쇼핑' }
  ];

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;
    
    try {
      await onCreateTag(newTag);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
    } catch (error) {
      console.error('태그 생성 실패:', error);
    }
  };

  const handleUpdateTag = async (tagId, updatedData) => {
    try {
      await onUpdateTag(tagId, updatedData);
      setEditingTag(null);
    } catch (error) {
      console.error('태그 수정 실패:', error);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('이 태그를 삭제하시겠습니까? 관련된 이벤트에서도 제거됩니다.')) return;
    
    try {
      await onDeleteTag(tagId);
    } catch (error) {
      console.error('태그 삭제 실패:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      await onCreateCategory(newCategory);
      setNewCategory({ name: '', color: '#6366f1', description: '', icon: '' });
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
    }
  };

  const handleUpdateCategory = async (categoryId, updatedData) => {
    try {
      await onUpdateCategory(categoryId, updatedData);
      setEditingCategory(null);
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('이 카테고리를 삭제하시겠습니까? 관련된 이벤트는 "기타" 카테고리로 변경됩니다.')) return;
    
    try {
      await onDeleteCategory(categoryId);
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
    }
  };

  const handleBulkDeleteTags = async () => {
    if (selectedTags.size === 0) return;
    if (!window.confirm(`선택한 ${selectedTags.size}개 태그를 삭제하시겠습니까?`)) return;
    
    try {
      await onBulkTagOperation('delete', Array.from(selectedTags));
      setSelectedTags(new Set());
    } catch (error) {
      console.error('태그 일괄 삭제 실패:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">태그 & 카테고리 관리</h2>
              <p className="text-blue-100 mt-1">이벤트 분류를 체계적으로 관리하세요</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'tags' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              태그 관리
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-sm">
                {tags.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'categories' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              카테고리 관리
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-sm">
                {categories.length}
              </span>
            </button>
          </div>
        </div>

        {/* 검색 및 액션 바 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={activeTab === 'tags' ? '태그 검색...' : '카테고리 검색...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {activeTab === 'tags' && selectedTags.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedTags.size}개 선택됨</span>
                <button
                  onClick={handleBulkDeleteTags}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  일괄 삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {/* 태그 관리 탭 */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              {/* 새 태그 생성 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">새 태그 생성</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">태그명</label>
                    <input
                      type="text"
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                      placeholder="태그명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="flex gap-2">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewTag({ ...newTag, color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newTag.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <input
                      type="text"
                      value={newTag.description}
                      onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                      placeholder="태그 설명 (선택사항)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTag.name.trim()}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  태그 생성
                </button>
              </div>

              {/* 태그 목록 */}
              <div className="space-y-3">
                {filteredTags.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">생성된 태그가 없습니다</p>
                  </div>
                ) : (
                  filteredTags.map(tag => (
                    <div key={tag.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedTags);
                              if (e.target.checked) {
                                newSelected.add(tag.id);
                              } else {
                                newSelected.delete(tag.id);
                              }
                              setSelectedTags(newSelected);
                            }}
                            className="w-4 h-4"
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">#{tag.name}</h4>
                            {tag.description && (
                              <p className="text-sm text-gray-600">{tag.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500">
                            {tagStats[tag.id] || 0}개 이벤트
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingTag(tag)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 카테고리 관리 탭 */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* 새 카테고리 생성 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-3">새 카테고리 생성</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="카테고리명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <select
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">아이콘 선택</option>
                      {categoryIcons.map(icon => (
                        <option key={icon.value} value={icon.value}>
                          {icon.label} {icon.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="flex gap-2">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewCategory({ ...newCategory, color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newCategory.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <input
                      type="text"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="카테고리 설명"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                  카테고리 생성
                </button>
              </div>

              {/* 카테고리 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">생성된 카테고리가 없습니다</p>
                  </div>
                ) : (
                  filteredCategories.map(category => (
                    <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {categoryIcons.find(icon => icon.value === category.icon)?.label || '📁'}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {categoryStats[category.id] || 0}개 이벤트
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 편집 모달들 */}
        {editingTag && (
          <EditTagModal
            tag={editingTag}
            predefinedColors={predefinedColors}
            onUpdate={handleUpdateTag}
            onClose={() => setEditingTag(null)}
          />
        )}

        {editingCategory && (
          <EditCategoryModal
            category={editingCategory}
            predefinedColors={predefinedColors}
            categoryIcons={categoryIcons}
            onUpdate={handleUpdateCategory}
            onClose={() => setEditingCategory(null)}
          />
        )}
      </div>
    </div>
  );
};

// 태그 편집 모달
const EditTagModal = ({ tag, predefinedColors, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: tag.name,
    color: tag.color,
    description: tag.description || ''
  });

  const handleSubmit = () => {
    onUpdate(tag.id, formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">태그 편집</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">태그명</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
              <div className="flex gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 카테고리 편집 모달
const EditCategoryModal = ({ category, predefinedColors, categoryIcons, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    color: category.color,
    description: category.description || '',
    icon: category.icon || ''
  });

  const handleSubmit = () => {
    onUpdate(category.id, formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">카테고리 편집</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">아이콘 선택</option>
                {categoryIcons.map(icon => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label} {icon.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
              <div className="flex gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagCategoryPanel;