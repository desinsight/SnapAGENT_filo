import React, { useState, useEffect } from 'react';
import { colors } from '../constants/colors';

const FileSortFilter = ({ files, onSortedFiles, currentDirectory }) => {
  const [sortCriteria, setSortCriteria] = useState('name-asc');
  const [filterCriteria, setFilterCriteria] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortRecommendations, setSortRecommendations] = useState(null);
  const [filterRecommendations, setFilterRecommendations] = useState(null);
  const [sortOptions, setSortOptions] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    if (files && files.length > 0) {
      loadSortOptions();
      loadFilterOptions();
    }
  }, [files]);

  const loadSortOptions = async () => {
    try {
      const response = await fetch(`/api/sort-filter/sort-options?files=${encodeURIComponent(JSON.stringify(files))}&targetDirectory=${encodeURIComponent(currentDirectory)}`);
      if (response.ok) {
        const data = await response.json();
        setSortOptions(data);
      }
    } catch (error) {
      console.error('정렬 옵션 로딩 실패:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await fetch(`/api/sort-filter/filter-options?files=${encodeURIComponent(JSON.stringify(files))}&targetDirectory=${encodeURIComponent(currentDirectory)}`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('필터 옵션 로딩 실패:', error);
    }
  };

  const getSortRecommendations = async () => {
    try {
      const response = await fetch('/api/sort-filter/sort-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          targetDirectory: currentDirectory
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSortRecommendations(data);
      }
    } catch (error) {
      console.error('정렬 추천 로딩 실패:', error);
    }
  };

  const getFilterRecommendations = async () => {
    try {
      const response = await fetch('/api/sort-filter/filter-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          targetDirectory: currentDirectory
        })
      });
      if (response.ok) {
        const data = await response.json();
        setFilterRecommendations(data);
      }
    } catch (error) {
      console.error('필터 추천 로딩 실패:', error);
    }
  };

  const applySortAndFilter = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sort-filter/sort-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          sortCriteria: sortCriteria,
          filterCriteria: filterCriteria,
          targetDirectory: currentDirectory
        })
      });

      if (!response.ok) {
        throw new Error('정렬 및 필터링에 실패했습니다.');
      }

      const data = await response.json();
      if (onSortedFiles) {
        onSortedFiles(data.processedFiles);
      }
    } catch (error) {
      console.error('정렬 및 필터링 실패:', error);
      alert('정렬 및 필터링 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyAISort = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sort-filter/ai-sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          targetDirectory: currentDirectory,
          userContext: '사용자가 가장 유용하게 사용할 수 있는 순서로 정렬해주세요.'
        })
      });

      if (!response.ok) {
        throw new Error('AI 정렬에 실패했습니다.');
      }

      const data = await response.json();
      if (onSortedFiles) {
        onSortedFiles(data.sortedFiles);
      }
    } catch (error) {
      console.error('AI 정렬 실패:', error);
      alert('AI 정렬 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyAIFilter = async () => {
    if (!files || files.length === 0) return;

    const aiFilterCriteria = prompt('AI 필터 조건을 입력하세요 (예: "중요한 문서 파일들", "최근에 수정된 파일들")');
    if (!aiFilterCriteria) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sort-filter/ai-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          aiFilterCriteria: aiFilterCriteria
        })
      });

      if (!response.ok) {
        throw new Error('AI 필터에 실패했습니다.');
      }

      const data = await response.json();
      if (onSortedFiles) {
        onSortedFiles(data.filteredFiles);
      }
    } catch (error) {
      console.error('AI 필터 실패:', error);
      alert('AI 필터 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilterCriteria(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilterCriteria({});
  };

  const renderSortOptions = () => {
    return (
      <div className="sort-section">
        <h4>정렬 옵션</h4>
        
        <div className="sort-basic">
          <label>기본 정렬:</label>
          <select 
            value={sortCriteria} 
            onChange={(e) => setSortCriteria(e.target.value)}
            className="sort-select"
          >
            {sortOptions.basic?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showAdvancedOptions && (
          <>
            <div className="sort-advanced">
              <label>고급 정렬:</label>
              <select 
                value={sortCriteria} 
                onChange={(e) => setSortCriteria(e.target.value)}
                className="sort-select"
              >
                {sortOptions.advanced?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-multi">
              <label>다중 정렬:</label>
              <select 
                value={sortCriteria} 
                onChange={(e) => setSortCriteria(e.target.value)}
                className="sort-select"
              >
                {sortOptions.multi?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="sort-actions">
          <button onClick={applyAISort} className="ai-sort-button">
            🤖 AI 추천 정렬
          </button>
          <button onClick={getSortRecommendations} className="recommendation-button">
            💡 정렬 추천 받기
          </button>
        </div>

        {sortRecommendations && (
          <div className="recommendations">
            <h5>정렬 추천</h5>
            <p><strong>추천 방법:</strong> {sortRecommendations.recommendedMethod}</p>
            <p><strong>이유:</strong> {sortRecommendations.explanation}</p>
            <div className="alternative-sorts">
              <strong>대안:</strong>
              {sortRecommendations.alternatives.map((alt, index) => (
                <button 
                  key={index} 
                  onClick={() => setSortCriteria(alt)}
                  className="alternative-button"
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFilterOptions = () => {
    return (
      <div className="filter-section">
        <h4>필터 옵션</h4>
        
        <div className="filter-group">
          <label>파일 타입:</label>
          <div className="checkbox-group">
            {filterOptions.fileType?.map(option => (
              <label key={option.value} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filterCriteria.fileType?.includes(option.value) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('fileType', [...(filterCriteria.fileType || []), option.value]);
                    } else {
                      handleFilterChange('fileType', (filterCriteria.fileType || []).filter(t => t !== option.value));
                    }
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>크기 카테고리:</label>
          <div className="checkbox-group">
            {filterOptions.sizeCategory?.map(option => (
              <label key={option.value} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filterCriteria.sizeCategory?.includes(option.value) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('sizeCategory', [...(filterCriteria.sizeCategory || []), option.value]);
                    } else {
                      handleFilterChange('sizeCategory', (filterCriteria.sizeCategory || []).filter(c => c !== option.value));
                    }
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>수정일 카테고리:</label>
          <div className="checkbox-group">
            {filterOptions.ageCategory?.map(option => (
              <label key={option.value} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filterCriteria.ageCategory?.includes(option.value) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFilterChange('ageCategory', [...(filterCriteria.ageCategory || []), option.value]);
                    } else {
                      handleFilterChange('ageCategory', (filterCriteria.ageCategory || []).filter(c => c !== option.value));
                    }
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={applyAIFilter} className="ai-filter-button">
            🤖 AI 스마트 필터
          </button>
          <button onClick={getFilterRecommendations} className="recommendation-button">
            💡 필터 추천 받기
          </button>
          <button onClick={clearFilters} className="clear-filters-button">
            🗑️ 필터 초기화
          </button>
        </div>

        {filterRecommendations && (
          <div className="recommendations">
            <h5>필터 추천</h5>
            {filterRecommendations.recommendations?.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <h6>{rec.name}</h6>
                <p>{rec.description}</p>
                <button 
                  onClick={() => setFilterCriteria(rec.filters)}
                  className="apply-recommendation-button"
                >
                  적용하기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-sort-filter">
      <div className="sort-filter-header">
        <h3>파일 정렬 및 필터</h3>
        <button 
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="toggle-advanced-button"
        >
          {showAdvancedOptions ? '기본 옵션' : '고급 옵션'}
        </button>
      </div>

      <div className="sort-filter-content">
        {renderSortOptions()}
        {renderFilterOptions()}
      </div>

      <div className="sort-filter-actions">
        <button 
          onClick={applySortAndFilter} 
          disabled={loading || !files || files.length === 0}
          className="apply-button"
        >
          {loading ? '처리 중...' : '정렬 및 필터 적용'}
        </button>
        
        <div className="file-stats">
          <span>총 파일: {files?.length || 0}개</span>
          {files && files.length > 0 && (
            <span>크기: {formatTotalSize(files)}</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .file-sort-filter {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .sort-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .sort-filter-header h3 {
          margin: 0;
          color: ${colors.text};
        }

        .toggle-advanced-button {
          padding: 8px 16px;
          background: ${colors.secondary};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .sort-filter-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .sort-section, .filter-section {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
        }

        .sort-section h4, .filter-section h4 {
          margin: 0 0 16px 0;
          color: ${colors.text};
        }

        .sort-basic, .sort-advanced, .sort-multi {
          margin-bottom: 16px;
        }

        .sort-basic label, .sort-advanced label, .sort-multi label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: ${colors.text};
        }

        .sort-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid ${colors.border};
          border-radius: 6px;
          font-size: 14px;
        }

        .sort-actions, .filter-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .ai-sort-button, .ai-filter-button {
          padding: 8px 12px;
          background: ${colors.primary};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .recommendation-button {
          padding: 8px 12px;
          background: ${colors.secondary};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .clear-filters-button {
          padding: 8px 12px;
          background: ${colors.error};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
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
          gap: 8px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .recommendations {
          margin-top: 16px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid ${colors.border};
        }

        .recommendations h5 {
          margin: 0 0 8px 0;
          color: ${colors.primary};
          font-size: 14px;
        }

        .recommendations p {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: ${colors.textSecondary};
        }

        .alternative-sorts {
          margin-top: 8px;
        }

        .alternative-button {
          margin: 2px;
          padding: 4px 8px;
          background: ${colors.backgroundLight};
          border: 1px solid ${colors.border};
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .recommendation-item {
          margin-bottom: 12px;
          padding: 8px;
          background: ${colors.backgroundLight};
          border-radius: 4px;
        }

        .recommendation-item h6 {
          margin: 0 0 4px 0;
          color: ${colors.text};
          font-size: 13px;
        }

        .recommendation-item p {
          margin: 0 0 8px 0;
          font-size: 11px;
          color: ${colors.textSecondary};
        }

        .apply-recommendation-button {
          padding: 4px 8px;
          background: ${colors.primary};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .sort-filter-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid ${colors.border};
        }

        .apply-button {
          padding: 12px 24px;
          background: ${colors.primary};
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .apply-button:disabled {
          background: ${colors.textSecondary};
          cursor: not-allowed;
        }

        .file-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: ${colors.textSecondary};
        }
      `}</style>
    </div>
  );
};

const formatTotalSize = (files) => {
  const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
  if (totalBytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(totalBytes) / Math.log(k));
  return parseFloat((totalBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileSortFilter; 