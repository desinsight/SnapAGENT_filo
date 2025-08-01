import React, { useState, useEffect } from 'react';
import { colors } from '../constants/colors';

const FileAnalytics = ({ files, currentDirectory }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  useEffect(() => {
    if (files && files.length > 0) {
      calculateAnalytics();
    }
  }, [files, selectedTimeRange]);

  const calculateAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sort-filter/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files,
          targetDirectory: currentDirectory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('분석 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (type) => {
    const icons = {
      text: '📄',
      image: '🖼️',
      document: '📋',
      audio: '🎵',
      video: '🎬',
      binary: '⚙️'
    };
    return icons[type] || '📁';
  };

  const getSizeCategoryColor = (category) => {
    const colors = {
      tiny: '#e3f2fd',
      small: '#c8e6c9',
      medium: '#fff3e0',
      large: '#ffcdd2',
      huge: '#f3e5f5'
    };
    return colors[category] || '#f5f5f5';
  };

  const getAgeCategoryColor = (category) => {
    const colors = {
      today: '#4caf50',
      recent: '#8bc34a',
      month: '#ff9800',
      year: '#ff5722',
      old: '#9e9e9e'
    };
    return colors[category] || '#f5f5f5';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileTypeChart = () => {
    if (!analytics?.typeDistribution) return null;

    const totalFiles = analytics.totalFiles;
    const typeData = Object.entries(analytics.typeDistribution).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalFiles) * 100).toFixed(1)
    }));

    return (
      <div className="chart-section">
        <h4>📊 파일 타입별 분포</h4>
        <div className="chart-container">
          {typeData.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-bar">
                <div 
                  className="chart-fill"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: colors.primary
                  }}
                />
              </div>
              <div className="chart-label">
                <span className="chart-icon">{getFileTypeIcon(item.type)}</span>
                <span className="chart-text">{item.type}</span>
                <span className="chart-value">{item.count}개 ({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSizeChart = () => {
    if (!analytics?.sizeDistribution) return null;

    const totalFiles = analytics.totalFiles;
    const sizeData = Object.entries(analytics.sizeDistribution).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / totalFiles) * 100).toFixed(1)
    }));

    return (
      <div className="chart-section">
        <h4>📏 크기별 분포</h4>
        <div className="chart-container">
          {sizeData.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-bar">
                <div 
                  className="chart-fill"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: getSizeCategoryColor(item.category)
                  }}
                />
              </div>
              <div className="chart-label">
                <span className="chart-text">{item.category}</span>
                <span className="chart-value">{item.count}개 ({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgeChart = () => {
    if (!analytics?.ageDistribution) return null;

    const totalFiles = analytics.totalFiles;
    const ageData = Object.entries(analytics.ageDistribution).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / totalFiles) * 100).toFixed(1)
    }));

    return (
      <div className="chart-section">
        <h4>📅 수정일별 분포</h4>
        <div className="chart-container">
          {ageData.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-bar">
                <div 
                  className="chart-fill"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: getAgeCategoryColor(item.category)
                  }}
                />
              </div>
              <div className="chart-label">
                <span className="chart-text">{item.category}</span>
                <span className="chart-value">{item.count}개 ({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExtensionChart = () => {
    if (!analytics?.extensionDistribution) return null;

    const extensionData = Object.entries(analytics.extensionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ext, count]) => ({
        extension: ext,
        count,
        percentage: ((count / analytics.totalFiles) * 100).toFixed(1)
      }));

    return (
      <div className="chart-section">
        <h4>📁 확장자별 분포 (상위 10개)</h4>
        <div className="extension-grid">
          {extensionData.map((item, index) => (
            <div key={index} className="extension-item">
              <div className="extension-name">{item.extension}</div>
              <div className="extension-count">{item.count}개</div>
              <div className="extension-percentage">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => {
    if (!analytics) return null;

    return (
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📁</div>
          <div className="card-content">
            <div className="card-value">{analytics.totalFiles}</div>
            <div className="card-label">총 파일 수</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">💾</div>
          <div className="card-content">
            <div className="card-value">{formatFileSize(analytics.totalSize)}</div>
            <div className="card-label">총 크기</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{formatFileSize(analytics.averageSize)}</div>
            <div className="card-label">평균 크기</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{Object.keys(analytics.extensionDistribution || {}).length}</div>
            <div className="card-label">확장자 종류</div>
          </div>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!analytics) return null;

    const insights = [];

    // 가장 많은 파일 타입
    const topType = Object.entries(analytics.typeDistribution || {})
      .sort(([,a], [,b]) => b - a)[0];
    if (topType) {
      insights.push(`가장 많은 파일 타입은 ${topType[0]}입니다 (${topType[1]}개)`);
    }

    // 가장 큰 파일
    if (analytics.sizeRange) {
      insights.push(`가장 큰 파일은 ${formatFileSize(analytics.sizeRange.max)}입니다`);
    }

    // 최근 수정된 파일
    const recentFiles = analytics.ageDistribution?.today || 0;
    if (recentFiles > 0) {
      insights.push(`오늘 수정된 파일이 ${recentFiles}개 있습니다`);
    }

    // 대용량 파일
    const largeFiles = (analytics.sizeDistribution?.large || 0) + (analytics.sizeDistribution?.huge || 0);
    if (largeFiles > 0) {
      insights.push(`대용량 파일(100MB 이상)이 ${largeFiles}개 있습니다`);
    }

    return (
      <div className="insights-section">
        <h4>💡 파일 분석 인사이트</h4>
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className="insight-item">
              {insight}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="file-analytics">
        <div className="loading">분석 데이터를 로딩 중...</div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="file-analytics">
        <div className="no-data">분석할 파일이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="file-analytics">
      <div className="analytics-header">
        <h3>📊 파일 분석 대시보드</h3>
        <div className="time-range-selector">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>
      </div>

      {renderSummaryCards()}
      {renderFileTypeChart()}
      {renderSizeChart()}
      {renderAgeChart()}
      {renderExtensionChart()}
      {renderInsights()}

      <style jsx>{`
        .file-analytics {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .analytics-header h3 {
          margin: 0;
          color: ${colors.text};
        }

        .time-range-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .time-select {
          padding: 8px 12px;
          border: 1px solid ${colors.border};
          border-radius: 6px;
          font-size: 14px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-icon {
          font-size: 24px;
        }

        .card-content {
          flex: 1;
        }

        .card-value {
          font-size: 18px;
          font-weight: 600;
          color: ${colors.text};
        }

        .card-label {
          font-size: 12px;
          color: ${colors.textSecondary};
          margin-top: 4px;
        }

        .chart-section {
          margin-bottom: 24px;
        }

        .chart-section h4 {
          margin: 0 0 16px 0;
          color: ${colors.text};
        }

        .chart-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chart-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chart-bar {
          width: 200px;
          height: 20px;
          background: ${colors.backgroundLight};
          border-radius: 10px;
          overflow: hidden;
        }

        .chart-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .chart-label {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .chart-icon {
          font-size: 16px;
        }

        .chart-text {
          font-size: 14px;
          color: ${colors.text};
          min-width: 60px;
        }

        .chart-value {
          font-size: 12px;
          color: ${colors.textSecondary};
        }

        .extension-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .extension-item {
          background: ${colors.backgroundLight};
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }

        .extension-name {
          font-size: 16px;
          font-weight: 600;
          color: ${colors.text};
          margin-bottom: 4px;
        }

        .extension-count {
          font-size: 14px;
          color: ${colors.textSecondary};
        }

        .extension-percentage {
          font-size: 12px;
          color: ${colors.primary};
          margin-top: 4px;
        }

        .insights-section {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
        }

        .insights-section h4 {
          margin: 0 0 12px 0;
          color: ${colors.text};
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight-item {
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          font-size: 14px;
          color: ${colors.text};
          border-left: 3px solid ${colors.primary};
        }

        .loading, .no-data {
          text-align: center;
          padding: 40px;
          font-size: 16px;
          color: ${colors.textSecondary};
        }
      `}</style>
    </div>
  );
};

export default FileAnalytics; 