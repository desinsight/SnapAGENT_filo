import React, { useState } from 'react';
import { 
  XMarkIcon,
  EyeIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const FilePreview = ({ file, onClose, onAIAnalysis }) => {
  const [activeTab, setActiveTab] = useState('preview');

  const getPreviewContent = () => {
    const ext = file.extension?.toLowerCase();
    
    // 이미지 파일
    if (/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(file.name)) {
      return (
        <img 
          src={`file://${file.path}`} 
          alt={file.name}
          className="max-w-full max-h-full object-contain"
        />
      );
    }
    
    // 비디오 파일
    if (/\.(mp4|avi|mkv|mov|wmv|webm)$/i.test(file.name)) {
      return (
        <video 
          src={`file://${file.path}`}
          controls
          className="max-w-full max-h-full"
        >
          비디오를 재생할 수 없습니다.
        </video>
      );
    }
    
    // 오디오 파일
    if (/\.(mp3|wav|flac|aac|ogg|wma|m4a)$/i.test(file.name)) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">🎵</div>
          <audio 
            src={`file://${file.path}`}
            controls
            className="w-full max-w-md"
          >
            오디오를 재생할 수 없습니다.
          </audio>
        </div>
      );
    }
    
    // PDF 파일
    if (/\.pdf$/i.test(file.name)) {
      return (
        <iframe
          src={`file://${file.path}`}
          className="w-full h-full"
          title={file.name}
        />
      );
    }
    
    // 텍스트 파일
    if (/\.(txt|md|json|xml|csv|log)$/i.test(file.name)) {
      return (
        <div className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 h-full overflow-auto">
          <p className="text-gray-500 mb-2">텍스트 파일 미리보기</p>
          <div className="whitespace-pre-wrap">
            {/* 실제 구현에서는 파일 내용을 읽어와야 함 */}
            파일 내용을 불러오는 중...
          </div>
        </div>
      );
    }
    
    // 코드 파일
    if (/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html)$/i.test(file.name)) {
      return (
        <div className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 h-full overflow-auto">
          <p className="text-gray-500 mb-2">코드 파일 미리보기</p>
          <div className="whitespace-pre-wrap">
            {/* 실제 구현에서는 파일 내용을 읽어와야 함 */}
            코드 내용을 불러오는 중...
          </div>
        </div>
      );
    }
    
    // 기본 파일 정보
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg font-medium">{file.name}</p>
        <p className="text-sm">미리보기를 사용할 수 없습니다</p>
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold truncate">{file.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* 탭 */}
        <div className="flex mt-3 space-x-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'preview' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            미리보기
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'info' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            정보
          </button>
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' ? (
          <div className="h-full flex items-center justify-center p-4">
            {getPreviewContent()}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* 파일 정보 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">파일 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">크기:</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">수정일:</span>
                  <span>{formatDate(file.modifiedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">생성일:</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">확장자:</span>
                  <span>{file.extension || '없음'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">경로:</span>
                  <span className="text-xs break-all">{file.path}</span>
                </div>
              </div>
            </div>

            {/* 메타데이터 */}
            {file.metadata && (
              <div>
                <h4 className="text-sm font-semibold mb-2">메타데이터</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(file.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAIAnalysis(file)}
            className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            AI 분석
          </button>
          <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            다운로드
          </button>
          <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
            <ShareIcon className="w-4 h-4 mr-1" />
            공유
          </button>
          <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
            <PencilIcon className="w-4 h-4 mr-1" />
            편집
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;