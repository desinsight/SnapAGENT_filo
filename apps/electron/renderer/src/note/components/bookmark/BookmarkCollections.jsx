/**
 * 즐겨찾기 컬렉션 컴포넌트
 * 
 * @description 즐겨찾기를 그룹화하여 관리하는 컬렉션 기능
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';

const BookmarkCollections = ({
  collections,
  selectedCollection,
  onSelectCollection,
  onCreate,
  onUpdate,
  onDelete,
  loading
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'bookmark'
  });

  // 사용 가능한 아이콘 목록
  const availableIcons = [
    { id: 'bookmark', name: '북마크', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: 'folder', name: '폴더', icon: 'M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' },
    { id: 'heart', name: '하트', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { id: 'tag', name: '태그', icon: 'M7 7a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2V7zM4 12a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z' },
    { id: 'lightning', name: '번개', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'fire', name: '불꽃', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' }
  ];

  // 사용 가능한 색상 목록
  const availableColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  /**
   * 컬렉션 생성 핸들러
   */
  const handleCreateCollection = useCallback(async () => {
    if (!newCollection.name.trim()) {
      alert('컬렉션 이름을 입력하세요.');
      return;
    }

    try {
      await onCreate(newCollection);
      setNewCollection({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'bookmark'
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('컬렉션 생성 실패:', error);
    }
  }, [newCollection, onCreate]);

  /**
   * 컬렉션 수정 핸들러
   */
  const handleUpdateCollection = useCallback(async (collectionId, updates) => {
    try {
      await onUpdate(collectionId, updates);
      setEditingCollection(null);
    } catch (error) {
      console.error('컬렉션 수정 실패:', error);
    }
  }, [onUpdate]);

  /**
   * 컬렉션 삭제 핸들러
   */
  const handleDeleteCollection = useCallback(async (collectionId) => {
    try {
      await onDelete(collectionId);
    } catch (error) {
      console.error('컬렉션 삭제 실패:', error);
    }
  }, [onDelete]);

  /**
   * 아이콘 렌더링
   */
  const renderIcon = (iconId, className = "w-4 h-4") => {
    const iconData = availableIcons.find(icon => icon.id === iconId);
    if (!iconData) return null;

    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d={iconData.icon} />
      </svg>
    );
  };

  /**
   * 컬렉션 생성 폼 렌더링
   */
  const renderCreateForm = () => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">새 컬렉션 만들기</h4>
      
      <div className="space-y-3">
        {/* 컬렉션 이름 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            이름
          </label>
          <input
            type="text"
            value={newCollection.name}
            onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
            placeholder="컬렉션 이름"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            설명 (선택)
          </label>
          <textarea
            value={newCollection.description}
            onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
            placeholder="컬렉션 설명"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 아이콘 선택 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            아이콘
          </label>
          <div className="flex space-x-2">
            {availableIcons.map(icon => (
              <button
                key={icon.id}
                onClick={() => setNewCollection(prev => ({ ...prev, icon: icon.id }))}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  newCollection.icon === icon.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={icon.name}
              >
                {renderIcon(icon.id)}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 선택 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            색상
          </label>
          <div className="flex space-x-2">
            {availableColors.map(color => (
              <button
                key={color}
                onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  newCollection.color === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleCreateCollection}
            disabled={!newCollection.name.trim()}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            생성
          </button>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setNewCollection({ name: '', description: '', color: '#3B82F6', icon: 'bookmark' });
            }}
            className="flex-1 px-3 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">컬렉션</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>새 컬렉션</span>
        </button>
      </div>

      {/* 컬렉션 생성 폼 */}
      {showCreateForm && renderCreateForm()}

      {/* 컬렉션 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              컬렉션이 없습니다
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              새 컬렉션을 만들어 즐겨찾기를 정리해보세요.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {collections.map((collection) => (
              <div
                key={collection._id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCollection?._id === collection._id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSelectCollection(collection)}
              >
                {/* 컬렉션 정보 */}
                <div className="flex items-center space-x-3">
                  {/* 아이콘 */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: collection.color }}
                  >
                    {renderIcon(collection.icon, "w-4 h-4")}
                  </div>

                  {/* 이름 및 설명 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {collection.name}
                    </h4>
                    {collection.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {collection.description}
                      </p>
                    )}
                  </div>

                  {/* 노트 개수 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.notes?.length || 0}개
                    </span>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCollection(collection);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(collection._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* 기본 컬렉션 표시 */}
                {collection.isDefault && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      기본
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCollections;