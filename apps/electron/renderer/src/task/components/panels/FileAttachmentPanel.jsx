import React, { useState, useRef, useCallback } from 'react';
import {
  XMarkIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const FileAttachmentPanel = ({ 
  isOpen, 
  onClose, 
  task,
  onFilesUpdate,
  attachments = [],
  onUploadFile,
  onDeleteFile,
  onDownloadFile,
  onPreviewFile,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, size, type, date
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  // 파일 타입별 아이콘 가져오기
  const getFileIcon = (fileName, mimeType) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-blue-500" />;
    } else if (mimeType?.startsWith('video/')) {
      return <FilmIcon className="w-5 h-5 text-purple-500" />;
    } else if (mimeType === 'application/pdf') {
      return <DocumentTextIcon className="w-5 h-5 text-red-500" />;
    } else if (mimeType?.includes('word') || extension === 'docx') {
      return <DocumentIcon className="w-5 h-5 text-blue-600" />;
    } else if (mimeType?.includes('excel') || extension === 'xlsx') {
      return <PresentationChartBarIcon className="w-5 h-5 text-green-600" />;
    } else if (mimeType?.includes('powerpoint') || extension === 'pptx') {
      return <PresentationChartBarIcon className="w-5 h-5 text-orange-600" />;
    } else {
      return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 유효성 검사
  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > maxFileSize) {
      errors.push(`파일 크기가 ${formatFileSize(maxFileSize)}를 초과합니다.`);
    }
    
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isAllowed) {
        errors.push('지원되지 않는 파일 형식입니다.');
      }
    }
    
    return errors;
  };

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const errors = validateFile(file);
      if (errors.length > 0) {
        console.error(`파일 ${file.name} 업로드 실패:`, errors);
        continue;
      }
      
      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { progress: 0, status: 'uploading' }
      }));
      
      try {
        // 실제 구현에서는 API 호출로 대체
        await new Promise((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              resolve();
            }
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { progress, status: 'uploading' }
            }));
          }, 100);
        });
        
        const uploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // 임시 URL (실제로는 서버 URL)
          task_id: task.id,
          uploaded_at: new Date().toISOString(),
          uploaded_by: {
            id: 'current-user',
            name: '현재 사용자',
            avatar: null
          }
        };
        
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { progress: 100, status: 'completed' }
        }));
        
        onUploadFile?.(uploadedFile);
        
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { progress: 0, status: 'error' }
        }));
      }
    }
    
    setUploading(false);
    
    // 업로드 진행률 초기화 (3초 후)
    setTimeout(() => {
      setUploadProgress({});
    }, 3000);
  }, [task?.id, onUploadFile, maxFileSize, allowedTypes]);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    handleFileUpload(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  // 파일 삭제
  const handleDeleteFile = useCallback(async (fileId) => {
    if (window.confirm('이 파일을 삭제하시겠습니까?')) {
      try {
        await onDeleteFile?.(fileId);
      } catch (error) {
        console.error('파일 삭제 실패:', error);
      }
    }
  }, [onDeleteFile]);

  // 파일 다운로드
  const handleDownloadFile = useCallback(async (file) => {
    try {
      await onDownloadFile?.(file);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
    }
  }, [onDownloadFile]);

  // 파일 미리보기
  const handlePreviewFile = useCallback((file) => {
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  // 파일 필터링 및 정렬
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = [...attachments];
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'date':
          aValue = new Date(a.uploaded_at);
          bValue = new Date(b.uploaded_at);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [attachments, searchQuery, sortBy, sortOrder]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <PaperClipIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">파일 첨부</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {task?.title} - {attachments.length}개 파일
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 업로드 영역 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div
            ref={dropzoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <CloudArrowUpIcon className="w-6 h-6 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  파일을 드래그하여 업로드하거나
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  파일 선택
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>최대 파일 크기: {formatFileSize(maxFileSize)}</p>
                <p>지원 형식: 이미지, PDF, 문서, 스프레드시트</p>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 업로드 진행률 */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">업로드 진행률</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileId, { progress, status }]) => (
                <div key={fileId} className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status === 'completed' ? 'bg-green-500' : 
                        status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                    {Math.round(progress)}%
                  </span>
                  {status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                  {status === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
                  {status === 'uploading' && <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 및 정렬 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="파일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">이름순</option>
              <option value="size">크기순</option>
              <option value="type">형식순</option>
              <option value="date">날짜순</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAndSortedFiles.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredAndSortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(file.name, file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.uploaded_by?.name} • {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.type.startsWith('image/') && (
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="미리보기"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="다운로드"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAndSortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center justify-center mb-3">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          {getFileIcon(file.name, file.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.type.startsWith('image/') && (
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="미리보기"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="다운로드"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <FolderIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? '검색 결과가 없습니다.' : '첨부된 파일이 없습니다.'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                파일을 드래그하여 업로드하세요.
              </p>
            </div>
          )}
        </div>

        {/* 이미지 미리보기 모달 */}
        {showPreview && previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                <p className="font-medium">{previewFile.name}</p>
                <p className="text-sm opacity-75">{formatFileSize(previewFile.size)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileAttachmentPanel;