/**
 * 파일 블록 컴포넌트
 * 
 * @description 파일을 삽입하고 편집할 수 있는 블록
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';

const FileBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange 
}) => {
  const [fileInfo, setFileInfo] = useState(block.metadata || null);
  const [caption, setCaption] = useState(block.metadata?.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [fileWidth, setFileWidth] = useState(500); // 기본값
  const [fileAlign, setFileAlign] = useState('center'); // 기본값
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);
  const resizeRef = useRef(null);

  // 컴포넌트 마운트 시 메타데이터에서 크기 복원
  useEffect(() => {
    console.log('File Block metadata:', block.metadata); // 디버깅용
    
    // 파일 정보 복원
    if (block.metadata && (block.metadata.name || block.metadata.url)) {
      setFileInfo(block.metadata);
      console.log('Restored file info:', block.metadata); // 디버깅용
    }
    
    // 메타데이터에서 크기 복원
    if (block.metadata?.width && typeof block.metadata.width === 'number') {
      setFileWidth(block.metadata.width);
      console.log('Restored file width:', block.metadata.width); // 디버깅용
    }
    
    // 메타데이터에서 정렬 복원
    if (block.metadata?.align && ['left', 'center', 'right'].includes(block.metadata.align)) {
      setFileAlign(block.metadata.align);
      console.log('Restored file align:', block.metadata.align); // 디버깅용
    }
    
    // 메타데이터에서 캡션 복원
    if (block.metadata?.caption) {
      setCaption(block.metadata.caption);
    }
  }, [block.metadata]);

  // 파일 크기 포맷팅
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (fileName) => {
    // fileName이 없거나 문자열이 아닌 경우 기본 아이콘 반환
    if (!fileName || typeof fileName !== 'string') {
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'ppt':
      case 'pptx':
        return (
          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'txt':
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'zip':
      case 'rar':
      case '7z':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // 파일 정보 변경 처리
  const handleFileInfoChange = (info) => {
    setFileInfo(info);
    setIsError(false);
    setIsLoading(false);
    
    const updatedMetadata = {
      ...block.metadata,
      ...info,
      caption,
      width: fileWidth,
      align: fileAlign
    };
    
    console.log('Saving file metadata:', updatedMetadata); // 디버깅용
    
    onUpdate({ 
      content: info.url,
      metadata: updatedMetadata
    });
  };

  // 캡션 변경 처리
  const handleCaptionChange = (newCaption) => {
    setCaption(newCaption);
    const updatedMetadata = {
      ...block.metadata,
      ...fileInfo,
      caption: newCaption,
      width: fileWidth,
      align: fileAlign
    };
    
    onUpdate({
      content: fileInfo?.url || '',
      metadata: updatedMetadata
    });
  };

  // 파일 크기 변경
  const handleSizeChange = (newWidth) => {
    console.log('File size change:', newWidth); // 디버깅용
    setFileWidth(newWidth);
    
    const updatedMetadata = {
      ...block.metadata,
      ...fileInfo,
      caption,
      width: newWidth,
      align: fileAlign
    };
    
    console.log('Saving file size metadata:', updatedMetadata); // 디버깅용
    
    onUpdate({
      content: fileInfo?.url || '',
      metadata: updatedMetadata
    });
  };

  // 파일 정렬 변경
  const handleAlignChange = (newAlign) => {
    console.log('File align change:', newAlign); // 디버깅용
    setFileAlign(newAlign);
    
    const updatedMetadata = {
      ...block.metadata,
      ...fileInfo,
      caption,
      width: fileWidth,
      align: newAlign
    };
    
    onUpdate({
      content: fileInfo?.url || '',
      metadata: updatedMetadata
    });
  };

  // 리사이즈 시작
  const handleResizeStart = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = fileWidth;
    let currentWidth = startWidth;
    
    const handleMouseMove = (e) => {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(800, startWidth + deltaX));
      currentWidth = newWidth;
      setFileWidth(newWidth);
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      
      // 최종 크기를 현재 상태에서 가져오기
      console.log('Final file resize width:', currentWidth);
      
      const updatedMetadata = {
        ...block.metadata,
        ...fileInfo,
        caption,
        width: currentWidth,
        align: fileAlign
      };
      
      console.log('Saving final file resize metadata:', updatedMetadata);
      
      // 즉시 업데이트
      onUpdate({
        content: fileInfo?.url || '',
        metadata: updatedMetadata,
        forceUpdate: true
      });
      
      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleMouseMove, { passive: false });
      document.removeEventListener('mouseup', handleMouseUp, { passive: false });
      document.removeEventListener('selectstart', preventSelection);
    };
    
    // 드래그 중 텍스트 선택 방지
    const preventSelection = (e) => e.preventDefault();
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.addEventListener('selectstart', preventSelection);
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      
      const url = URL.createObjectURL(file);
      const info = { name: file.name, size: file.size, url };
      handleFileInfoChange(info);
      setShowPopup(false);
      
      // 로딩 완료
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // 포커스 처리
  const handleFocus = () => {
    if (!readOnly) {
      onFocus();
      if (onEditingChange) {
        onEditingChange(true);
      }
    }
  };

  // 파일 제거
  const handleRemoveFile = () => {
    setFileInfo(null);
    setCaption('');
    setIsError(false);
    setIsLoading(false);
    onUpdate({ content: '', metadata: null });
  };

  // 팝업 열기
  const handleOpenPopup = () => {
    if (!readOnly) {
      setShowPopup(true);
    }
  };

  // 팝업 닫기
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // 파일 정렬별 클래스
  const getFileAlignClass = () => {
    switch (fileAlign) {
      case 'left': return 'mr-auto ml-0';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto mr-0';
      default: return 'mx-auto';
    }
  };

  return (
    <div className="file-block py-2" onClick={handleFocus}>
      {/* 심플한 파일 블록 */}
      {(!fileInfo || !fileInfo.name || !fileInfo.url) && (
        <div 
          onClick={handleOpenPopup}
          className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-400 text-sm">파일 추가</span>
        </div>
      )}

      {/* 파일 표시 */}
      {fileInfo && fileInfo.name && fileInfo.url && (
        <div className="space-y-2">
          <div className={`relative group ${getFileAlignClass()}`} style={{ width: fileWidth }}>
            {/* 로딩 표시 */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-80 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            
            {/* 에러 표시 */}
            {isError && (
              <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm mb-2">파일을 불러올 수 없습니다</p>
                  <button
                    onClick={handleOpenPopup}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                    disabled={readOnly}
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
            
            {/* 파일 */}
            {!isError && (
              <div className="relative">
                <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(fileInfo.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {fileInfo.name || '알 수 없는 파일'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {fileInfo.size ? formatBytes(fileInfo.size) : '크기 정보 없음'}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {/* 빈 공간 - 다운로드 버튼은 호버 컨트롤로 이동 */}
                  </div>
                </div>
                
                {/* 리사이즈 핸들 (우하단 코너) */}
                {!readOnly && !isLoading && !isError && (
                  <div
                    ref={resizeRef}
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ cursor: isResizing ? 'se-resize' : 'se-resize' }}
                  >
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22ZM22 14H20V12H22V14Z"/>
                    </svg>
                  </div>
                )}
              </div>
            )}
            
            {/* 파일 컨트롤 (호버 시 표시) */}
            {!readOnly && !isLoading && !isError && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1 bg-black bg-opacity-60 rounded-lg p-1">
                  <a
                    href={fileInfo.url}
                    download={fileInfo.name}
                    className="p-1 text-white hover:text-green-300 transition-colors"
                    title="다운로드"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                  <button
                    onClick={handleOpenPopup}
                    className="p-1 text-white hover:text-blue-300 transition-colors"
                    title="파일 교체"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1 transition-colors ${showSettings ? 'text-blue-300 bg-white bg-opacity-20' : 'text-white hover:text-blue-300'}`}
                    title="설정"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 text-white hover:text-red-300 transition-colors"
                    title="파일 제거"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 파일 설정 (설정 버튼 클릭 시에만 표시) */}
          {showSettings && !readOnly && !isLoading && !isError && fileInfo && (
            <div className="flex items-center justify-center space-x-4 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {/* 정렬 */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">정렬:</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleAlignChange('left')}
                    className={`p-1 rounded ${fileAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="왼쪽 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('center')}
                    className={`p-1 rounded ${fileAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="가운데 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('right')}
                    className={`p-1 rounded ${fileAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="오른쪽 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 캡션 */}
          <div className={`${getFileAlignClass()}`} style={{ width: fileWidth }}>
            <input
              type="text"
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="파일 캡션 (선택사항)"
              disabled={readOnly}
              className="w-full px-2 py-1 text-sm text-center border-none outline-none bg-transparent text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-colors"
            />
          </div>
        </div>
      )}

      {/* 파일 추가 팝업 모달 */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePopup}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">파일 추가</h3>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">파일 업로드</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={readOnly}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={readOnly}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  파일 선택
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBlock; 