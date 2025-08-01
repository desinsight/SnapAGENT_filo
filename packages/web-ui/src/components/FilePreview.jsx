import React, { useState, useEffect } from 'react';
import { colors } from '../constants/colors';

const FilePreview = ({ file, onClose }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (file) {
      loadFilePreview();
    }
  }, [file]);

  const loadFilePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/preview/file/${encodeURIComponent(file.path)}`);
      if (!response.ok) {
        throw new Error('파일 미리보기를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('ko-KR');
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

  const renderTextPreview = () => {
    if (!preview?.preview?.content) return <div>텍스트 내용을 불러올 수 없습니다.</div>;
    
    return (
      <div className="text-preview">
        <div className="text-content">
          <pre>{preview.preview.content}</pre>
        </div>
        <div className="text-stats">
          <span>총 {preview.preview.totalLines}줄</span>
          <span>총 {preview.preview.totalCharacters}자</span>
          {preview.preview.hasMore && <span>더 많은 내용이 있습니다</span>}
        </div>
      </div>
    );
  };

  const renderImagePreview = () => {
    return (
      <div className="image-preview">
        <div className="image-info">
          <p>이미지 파일: {preview?.preview?.format}</p>
          <p>크기: {formatFileSize(preview?.preview?.size || 0)}</p>
          {preview?.preview?.dimensions && <p>해상도: {preview.preview.dimensions}</p>}
        </div>
        <div className="image-placeholder">
          <div className="image-icon">🖼️</div>
          <p>이미지 미리보기</p>
        </div>
      </div>
    );
  };

  const renderDocumentPreview = () => {
    return (
      <div className="document-preview">
        <div className="document-info">
          <p>문서 형식: {preview?.preview?.format}</p>
          <p>크기: {formatFileSize(preview?.preview?.size || 0)}</p>
          {preview?.preview?.pages && <p>페이지: {preview.preview.pages}</p>}
        </div>
        <div className="document-placeholder">
          <div className="document-icon">📋</div>
          <p>문서 미리보기</p>
        </div>
      </div>
    );
  };

  const renderBinaryPreview = () => {
    return (
      <div className="binary-preview">
        <div className="binary-info">
          <p>파일 서명: {preview?.preview?.fileSignature}</p>
          <p>실행 파일: {preview?.preview?.isExecutable ? '예' : '아니오'}</p>
        </div>
        <div className="hex-preview">
          <h4>HEX 미리보기 (처음 256바이트)</h4>
          <pre className="hex-content">
            {preview?.preview?.hexPreview?.match(/.{1,32}/g)?.map((line, i) => (
              <div key={i} className="hex-line">
                <span className="hex-offset">{(i * 16).toString(16).padStart(8, '0')}: </span>
                <span className="hex-data">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    if (!preview) return null;

    switch (preview.type) {
      case 'text':
        return renderTextPreview();
      case 'image':
        return renderImagePreview();
      case 'document':
        return renderDocumentPreview();
      case 'audio':
      case 'video':
        return (
          <div className="media-preview">
            <div className="media-icon">{preview.type === 'audio' ? '🎵' : '🎬'}</div>
            <p>{preview.type === 'audio' ? '오디오' : '비디오'} 파일 미리보기</p>
          </div>
        );
      default:
        return renderBinaryPreview();
    }
  };

  const renderAIAnalysis = () => {
    if (!preview?.aiSummary) {
      return <div>AI 분석을 수행할 수 없습니다.</div>;
    }

    return (
      <div className="ai-analysis">
        <div className="ai-summary">
          <h4>🤖 AI 분석 결과</h4>
          <div className="ai-content">
            {preview.aiSummary.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    if (!preview?.metadata) return null;

    const metadata = preview.metadata;
    
    return (
      <div className="metadata">
        <h4>📊 파일 정보</h4>
        <div className="metadata-grid">
          <div className="metadata-item">
            <label>파일명:</label>
            <span>{metadata.fileName}</span>
          </div>
          <div className="metadata-item">
            <label>경로:</label>
            <span className="file-path">{metadata.filePath}</span>
          </div>
          <div className="metadata-item">
            <label>크기:</label>
            <span>{metadata.sizeFormatted}</span>
          </div>
          <div className="metadata-item">
            <label>수정일:</label>
            <span>{formatDate(metadata.modifiedDate)}</span>
          </div>
          <div className="metadata-item">
            <label>생성일:</label>
            <span>{formatDate(metadata.createdDate)}</span>
          </div>
          <div className="metadata-item">
            <label>확장자:</label>
            <span>{metadata.extension}</span>
          </div>
          <div className="metadata-item">
            <label>크기 카테고리:</label>
            <span>{metadata.sizeCategory}</span>
          </div>
          <div className="metadata-item">
            <label>수정일 카테고리:</label>
            <span>{metadata.ageCategory}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="file-preview-overlay">
        <div className="file-preview-modal">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-preview-overlay">
        <div className="file-preview-modal">
          <div className="error">오류: {error}</div>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-header">
          <div className="file-info">
            <span className="file-icon">{getFileTypeIcon(preview?.type)}</span>
            <span className="file-name">{preview?.fileName}</span>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="file-preview-tabs">
          <button 
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            미리보기
          </button>
          <button 
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI 분석
          </button>
          <button 
            className={`tab ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            파일 정보
          </button>
        </div>

        <div className="file-preview-content">
          {activeTab === 'preview' && renderPreviewContent()}
          {activeTab === 'ai' && renderAIAnalysis()}
          {activeTab === 'metadata' && renderMetadata()}
        </div>
      </div>

      <style jsx>{`
        .file-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .file-preview-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .file-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid ${colors.border};
          background: ${colors.background};
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          font-size: 24px;
        }

        .file-name {
          font-size: 18px;
          font-weight: 600;
          color: ${colors.text};
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: ${colors.textSecondary};
          padding: 4px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: ${colors.hover};
        }

        .file-preview-tabs {
          display: flex;
          border-bottom: 1px solid ${colors.border};
          background: ${colors.backgroundLight};
        }

        .tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: ${colors.textSecondary};
          transition: all 0.2s;
        }

        .tab.active {
          color: ${colors.primary};
          border-bottom: 2px solid ${colors.primary};
          background: white;
        }

        .tab:hover {
          background: ${colors.hover};
        }

        .file-preview-content {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .text-preview {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .text-content {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .text-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .text-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: ${colors.textSecondary};
        }

        .image-preview, .document-preview, .media-preview {
          text-align: center;
          padding: 40px;
        }

        .image-placeholder, .document-placeholder {
          border: 2px dashed ${colors.border};
          border-radius: 12px;
          padding: 40px;
          margin: 20px 0;
        }

        .image-icon, .document-icon, .media-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .binary-preview {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .hex-preview {
          background: ${colors.backgroundLight};
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .hex-content {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
        }

        .hex-line {
          display: flex;
          margin-bottom: 4px;
        }

        .hex-offset {
          color: ${colors.textSecondary};
          width: 80px;
          flex-shrink: 0;
        }

        .hex-data {
          color: ${colors.text};
        }

        .ai-analysis {
          background: ${colors.backgroundLight};
          padding: 20px;
          border-radius: 8px;
        }

        .ai-summary h4 {
          margin: 0 0 16px 0;
          color: ${colors.primary};
        }

        .ai-content p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }

        .metadata {
          background: ${colors.backgroundLight};
          padding: 20px;
          border-radius: 8px;
        }

        .metadata h4 {
          margin: 0 0 16px 0;
          color: ${colors.text};
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 12px;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
        }

        .metadata-item label {
          font-size: 12px;
          color: ${colors.textSecondary};
          margin-bottom: 4px;
        }

        .metadata-item span {
          font-size: 14px;
          color: ${colors.text};
        }

        .file-path {
          word-break: break-all;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 16px;
        }

        .error {
          color: ${colors.error};
        }
      `}</style>
    </div>
  );
};

export default FilePreview; 