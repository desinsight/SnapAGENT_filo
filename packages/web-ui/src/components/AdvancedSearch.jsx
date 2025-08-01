import React, { useState, useEffect } from 'react';
import { colors } from '../constants/colors';

const AdvancedSearch = ({ onSearchResults, currentDirectory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('natural'); // natural, advanced, similar, duplicates
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ historySuggestions: [], aiSuggestions: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    fileType: [],
    sizeCategory: [],
    ageCategory: [],
    extension: [],
    dateRange: { start: '', end: '' },
    sizeRange: { min: '', max: '' }
  });

  useEffect(() => {
    if (searchQuery.length > 2) {
      loadSuggestions();
    } else {
      setSuggestions({ historySuggestions: [], aiSuggestions: [] });
    }
  }, [searchQuery]);

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('검색 제안 로딩 실패:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let response;
      
      switch (searchType) {
        case 'natural':
          response = await fetch('/api/search/natural', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              targetDirectory: currentDirectory
            })
          });
          break;
          
        case 'advanced':
          response = await fetch('/api/search/advanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conditions: advancedFilters,
              targetDirectory: currentDirectory
            })
          });
          break;
          
        case 'similar':
          response = await fetch('/api/search/similar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetFile: searchQuery,
              targetDirectory: currentDirectory,
              similarityThreshold: 0.7
            })
          });
          break;
          
        case 'duplicates':
          response = await fetch('/api/search/duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetDirectory: currentDirectory,
              minSize: 1024
            })
          });
          break;
          
        default:
          throw new Error('지원하지 않는 검색 타입입니다.');
      }

      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setSearchResults(data.results || data.similarFiles || data.duplicateGroups || []);
      
      if (onSearchResults) {
        onSearchResults(data.results || data.similarFiles || data.duplicateGroups || []);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleFilterChange = (filterType, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setAdvancedFilters({
      fileType: [],
      sizeCategory: [],
      ageCategory: [],
      extension: [],
      dateRange: { start: '', end: '' },
      sizeRange: { min: '', max: '' }
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const renderSearchInput = () => {
    return (
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={
              searchType === 'natural' ? "자연어로 검색하세요 (예: '지난주에 받은 PDF 파일')" :
              searchType === 'advanced' ? "고급 검색 조건을 설정하세요" :
              searchType === 'similar' ? "유사한 파일을 찾을 대상 파일 경로를 입력하세요" :
              "중복 파일을 찾을 디렉토리를 선택하세요"
            }
            className="search-input"
          />
          <button 
            onClick={performSearch} 
            disabled={loading || !searchQuery.trim()}
            className="search-button"
          >
            {loading ? '검색 중...' : '🔍'}
          </button>
        </div>

        {showSuggestions && (suggestions.historySuggestions.length > 0 || suggestions.aiSuggestions.length > 0) && (
          <div className="suggestions-dropdown">
            {suggestions.historySuggestions.length > 0 && (
              <div className="suggestion-section">
                <h4>최근 검색</h4>
                {suggestions.historySuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            {suggestions.aiSuggestions.length > 0 && (
              <div className="suggestion-section">
                <h4>AI 추천</h4>
                {suggestions.aiSuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAdvancedFilters = () => {
    if (searchType !== 'advanced') return null;

    return (
      <div className="advanced-filters">
        <h4>고급 필터</h4>
        
        <div className="filter-group">
          <label>파일 타입:</label>
          <div className="checkbox-group">
            {['text', 'image', 'document', 'audio', 'video', 'binary'].map(type => (
              <label key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={advancedFilters.fileType.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('fileType', [...advancedFilters.fileType, type]);
                    } else {
                      handleFilterChange('fileType', advancedFilters.fileType.filter(t => t !== type));
                    }
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>크기 카테고리:</label>
          <div className="checkbox-group">
            {['tiny', 'small', 'medium', 'large', 'huge'].map(category => (
              <label key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={advancedFilters.sizeCategory.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('sizeCategory', [...advancedFilters.sizeCategory, category]);
                    } else {
                      handleFilterChange('sizeCategory', advancedFilters.sizeCategory.filter(c => c !== category));
                    }
                  }}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>수정일 카테고리:</label>
          <div className="checkbox-group">
            {['today', 'recent', 'month', 'year', 'old'].map(category => (
              <label key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={advancedFilters.ageCategory.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('ageCategory', [...advancedFilters.ageCategory, category]);
                    } else {
                      handleFilterChange('ageCategory', advancedFilters.ageCategory.filter(c => c !== category));
                    }
                  }}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>날짜 범위:</label>
          <div className="date-range">
            <input
              type="date"
              value={advancedFilters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', { ...advancedFilters.dateRange, start: e.target.value })}
              placeholder="시작일"
            />
            <span>~</span>
            <input
              type="date"
              value={advancedFilters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', { ...advancedFilters.dateRange, end: e.target.value })}
              placeholder="종료일"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>크기 범위 (바이트):</label>
          <div className="size-range">
            <input
              type="number"
              value={advancedFilters.sizeRange.min}
              onChange={(e) => handleFilterChange('sizeRange', { ...advancedFilters.sizeRange, min: e.target.value })}
              placeholder="최소 크기"
            />
            <span>~</span>
            <input
              type="number"
              value={advancedFilters.sizeRange.max}
              onChange={(e) => handleFilterChange('sizeRange', { ...advancedFilters.sizeRange, max: e.target.value })}
              placeholder="최대 크기"
            />
          </div>
        </div>

        <button onClick={clearFilters} className="clear-filters-button">
          필터 초기화
        </button>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <div className="search-results">
        <h4>검색 결과 ({searchResults.length}개)</h4>
        
        <div className="results-list">
          {searchResults.map((result, index) => (
            <div key={index} className="result-item">
              <div className="result-info">
                <div className="result-name">{result.fileName || result.name}</div>
                <div className="result-path">{result.filePath || result.path}</div>
                {result.size && (
                  <div className="result-size">{formatFileSize(result.size)}</div>
                )}
                {result.modifiedDate && (
                  <div className="result-date">{formatDate(result.modifiedDate)}</div>
                )}
                {result.relevanceScore && (
                  <div className="result-relevance">
                    관련도: {(result.relevanceScore * 100).toFixed(1)}%
                  </div>
                )}
                {result.similarity && (
                  <div className="result-similarity">
                    유사도: {(result.similarity * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              
              {result.aiInsight && (
                <div className="result-insight">
                  <strong>AI 인사이트:</strong> {result.aiInsight}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="advanced-search">
      <div className="search-type-selector">
        <button 
          className={`type-button ${searchType === 'natural' ? 'active' : ''}`}
          onClick={() => setSearchType('natural')}
        >
          자연어 검색
        </button>
        <button 
          className={`type-button ${searchType === 'advanced' ? 'active' : ''}`}
          onClick={() => setSearchType('advanced')}
        >
          고급 검색
        </button>
        <button 
          className={`type-button ${searchType === 'similar' ? 'active' : ''}`}
          onClick={() => setSearchType('similar')}
        >
          유사 파일
        </button>
        <button 
          className={`type-button ${searchType === 'duplicates' ? 'active' : ''}`}
          onClick={() => setSearchType('duplicates')}
        >
          중복 파일
        </button>
      </div>

      {renderSearchInput()}
      {renderAdvancedFilters()}
      {renderSearchResults()}

      <style jsx>{`
        .advanced-search {
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-type-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .type-button {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid ${colors.border};
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .type-button.active {
          background: ${colors.primary};
          color: white;
          border-color: ${colors.primary};
        }

        .type-button:hover {
          background: ${colors.hover};
        }

        .search-input-container {
          position: relative;
          margin-bottom: 20px;
        }

        .search-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid ${colors.border};
          border-radius: 8px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: ${colors.primary};
        }

        .search-button {
          padding: 12px 16px;
          background: ${colors.primary};
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .search-button:disabled {
          background: ${colors.textSecondary};
          cursor: not-allowed;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid ${colors.border};
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }

        .suggestion-section {
          padding: 12px;
          border-bottom: 1px solid ${colors.border};
        }

        .suggestion-section:last-child {
          border-bottom: none;
        }

        .suggestion-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: ${colors.textSecondary};
        }

        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
        }

        .suggestion-item:hover {
          background: ${colors.hover};
        }

        .advanced-filters {
          background: ${colors.backgroundLight};
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .advanced-filters h4 {
          margin: 0 0 16px 0;
          color: ${colors.text};
        }

        .filter-group {
          margin-bottom: 16px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: ${colors.text};
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .date-range, .size-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-range input, .size-range input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid ${colors.border};
          border-radius: 4px;
          font-size: 14px;
        }

        .clear-filters-button {
          padding: 8px 16px;
          background: ${colors.error};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .search-results {
          margin-top: 20px;
        }

        .search-results h4 {
          margin: 0 0 16px 0;
          color: ${colors.text};
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-item {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
          border: 1px solid ${colors.border};
        }

        .result-info {
          display: grid;
          grid-template-columns: 2fr 3fr 1fr 1fr 1fr;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
        }

        .result-name {
          font-weight: 600;
          color: ${colors.text};
        }

        .result-path {
          font-size: 12px;
          color: ${colors.textSecondary};
          word-break: break-all;
        }

        .result-size, .result-date, .result-relevance, .result-similarity {
          font-size: 12px;
          color: ${colors.textSecondary};
          text-align: center;
        }

        .result-insight {
          font-size: 12px;
          color: ${colors.textSecondary};
          background: white;
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default AdvancedSearch; 