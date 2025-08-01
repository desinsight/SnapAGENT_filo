import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiCalendar, FiFile, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FILE_EXTENSIONS } from '../constants/fileExtensions.jsx';
import DriveSelector from './DriveSelector.jsx';

/**
 * SearchFilters - 파일 검색 필터 컴포넌트
 * 
 * 기능:
 * - 파일명 검색
 * - 확장자 필터링
 * - 날짜 범위 검색
 * - 검색 히스토리 (추후 구현)
 * 
 * @param {Object} props
 * @param {Object} props.searchParams - 현재 검색 파라미터
 * @param {Function} props.onUpdateParams - 검색 파라미터 업데이트 함수
 * @param {Function} props.onSearch - 검색 실행 함수
 * @param {Function} props.onClear - 검색 초기화 함수
 * @param {boolean} props.isSearching - 검색 진행 중 여부
 * @param {boolean} props.isIndexReady - 인덱스 준비 여부
 */
const SearchFilters = ({
  searchParams,
  onUpdateParams,
  onSearch,
  onClear,
  isSearching,
  isIndexReady
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customExtension, setCustomExtension] = useState('');
  
  // 일반적인 파일 확장자 카테고리
  const extensionCategories = {
    documents: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h']
  };

  // 파일명 변경 처리
  const handleNameChange = (e) => {
    onUpdateParams({ name: e.target.value });
  };

  // 확장자 변경 처리
  const handleExtensionChange = (ext) => {
    onUpdateParams({ ext });
    setCustomExtension('');
  };

  // 커스텀 확장자 적용
  const handleCustomExtension = () => {
    if (customExtension) {
      onUpdateParams({ ext: customExtension.replace('.', '') });
    }
  };

  // 날짜 변경 처리
  const handleDateChange = (field, value) => {
    onUpdateParams({ [field]: value });
  };

  // 드라이브 선택 처리
  const handleDriveSelect = (drive) => {
    onUpdateParams({ drive });
  };

  // 빠른 날짜 필터
  const applyQuickDateFilter = (days) => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    onUpdateParams({ from, to });
  };

  // 검색 실행 (Enter 키)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSearching && isIndexReady) {
      onSearch();
    }
  };

  // 필터 활성화 여부 확인
  const hasActiveFilters = searchParams.name || searchParams.ext || searchParams.from || searchParams.to || searchParams.drive;

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800 flex items-center">
          <FiFilter className="w-5 h-5 mr-2 text-gray-600" />
          검색 필터
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <FiX className="w-4 h-4 mr-1" />
            초기화
          </button>
        )}
      </div>

      {/* 파일명 검색 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          파일명
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchParams.name || ''}
            onChange={handleNameChange}
            onKeyPress={handleKeyPress}
            placeholder="검색할 파일명을 입력하세요"
            className="w-full px-10 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white text-gray-900"
          />
          <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          {searchParams.name && (
            <button
              onClick={() => onUpdateParams({ name: '' })}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 드라이브 선택 */}
      <DriveSelector
        selectedDrive={searchParams.drive || ''}
        onDriveSelect={handleDriveSelect}
        className="mb-4"
      />

      {/* 확장자 필터 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center">
          <FiFile className="w-4 h-4 mr-1" />
          파일 확장자
        </label>
        
        {/* 빠른 선택 버튼 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(extensionCategories).slice(0, 4).map(([category, extensions]) => (
            <button
              key={category}
              onClick={() => setShowAdvanced(true)}
              className="px-3 py-1 text-xs font-medium rounded-full
                       bg-gray-100 hover:bg-gray-200 text-gray-700
                       transition-colors duration-200 capitalize"
            >
              {category}
            </button>
          ))}
        </div>

        {/* 확장자 입력/선택 */}
        <div className="flex space-x-2">
          <select
            value={searchParams.ext || ''}
            onChange={(e) => handleExtensionChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white text-gray-900"
          >
            <option value="">모든 확장자</option>
            {Object.entries(extensionCategories).map(([category, exts]) => (
              <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                {exts.map(ext => (
                  <option key={ext} value={ext}>.{ext}</option>
                ))}
              </optgroup>
            ))}
          </select>
          
          {/* 커스텀 확장자 입력 */}
          <input
            type="text"
            value={customExtension}
            onChange={(e) => setCustomExtension(e.target.value)}
            onBlur={handleCustomExtension}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomExtension()}
            placeholder="직접 입력"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white text-gray-900"
          />
        </div>
      </div>

      {/* 고급 필터 토글 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900
                 flex items-center justify-center space-x-1 transition-colors duration-200"
      >
        <span>고급 필터</span>
        {showAdvanced ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
      </button>

      {/* 고급 필터 - 날짜 범위 */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FiCalendar className="w-4 h-4 mr-1" />
              수정 날짜
            </label>
            
            {/* 빠른 날짜 선택 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => applyQuickDateFilter(1)}
                className="px-3 py-1 text-xs font-medium rounded-full
                         bg-gray-100 hover:bg-gray-200 text-gray-700
                         transition-colors duration-200"
              >
                오늘
              </button>
              <button
                onClick={() => applyQuickDateFilter(7)}
                className="px-3 py-1 text-xs font-medium rounded-full
                         bg-gray-100 hover:bg-gray-200 text-gray-700
                         transition-colors duration-200"
              >
                최근 7일
              </button>
              <button
                onClick={() => applyQuickDateFilter(30)}
                className="px-3 py-1 text-xs font-medium rounded-full
                         bg-gray-100 hover:bg-gray-200 text-gray-700
                         transition-colors duration-200"
              >
                최근 30일
              </button>
              <button
                onClick={() => applyQuickDateFilter(365)}
                className="px-3 py-1 text-xs font-medium rounded-full
                         bg-gray-100 hover:bg-gray-200 text-gray-700
                         transition-colors duration-200"
              >
                최근 1년
              </button>
            </div>

            {/* 날짜 범위 입력 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">시작일</label>
                <input
                  type="date"
                  value={searchParams.from || ''}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">종료일</label>
                <input
                  type="date"
                  value={searchParams.to || ''}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-white text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 버튼 */}
      <div className="pt-4">
        <button
          onClick={onSearch}
          disabled={!isIndexReady || isSearching || !hasActiveFilters}
          className={`w-full px-4 py-3 rounded-md font-medium transition-all duration-200
                     flex items-center justify-center space-x-2
                     ${isIndexReady && !isSearching && hasActiveFilters
                       ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                       : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          <FiSearch className="w-5 h-5" />
          <span>{isSearching ? '검색 중...' : '검색 시작'}</span>
        </button>
      </div>

      {/* 검색 팁 */}
      {!isIndexReady && (
        <div className="bg-yellow-50 rounded-md p-3 text-sm">
          <p className="text-yellow-700">
            검색을 시작하려면 먼저 디렉토리를 인덱싱해주세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;