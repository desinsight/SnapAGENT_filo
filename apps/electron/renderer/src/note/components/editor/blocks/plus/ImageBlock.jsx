/**
 * 이미지 블록 컴포넌트
 * 
 * @description 이미지를 삽입하고 편집할 수 있는 블록
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';

export const ImageBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange 
}) => {
  const [imageUrl, setImageUrl] = useState(block.content || '');
  const [caption, setCaption] = useState(block.metadata?.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showCropPopup, setShowCropPopup] = useState(false);
  const [imageWidth, setImageWidth] = useState(400); // 기본값
  const [imageAlign, setImageAlign] = useState('center'); // 기본값
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cropData, setCropData] = useState(null);
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);
  const imageRef = useRef(null);
  const resizeRef = useRef(null);

  // 컴포넌트 마운트 시 메타데이터에서 크기 복원
  useEffect(() => {
    console.log('Block metadata:', block.metadata); // 디버깅용
    console.log('Block content:', block.content); // 디버깅용
    
    // block.content에서 이미지 URL 복원
    if (block.content && block.content !== imageUrl) {
      setImageUrl(block.content);
      console.log('Restored imageUrl from content:', block.content); // 디버깅용
    }
    
    // 메타데이터에서 크기 복원
    if (block.metadata?.width && typeof block.metadata.width === 'number') {
      setImageWidth(block.metadata.width);
      console.log('Restored width:', block.metadata.width); // 디버깅용
    }
    
    // 메타데이터에서 정렬 복원
    if (block.metadata?.align && ['left', 'center', 'right'].includes(block.metadata.align)) {
      setImageAlign(block.metadata.align);
      console.log('Restored align:', block.metadata.align); // 디버깅용
    }
    
    // 메타데이터에서 캡션 복원
    if (block.metadata?.caption) {
      setCaption(block.metadata.caption);
    }
  }, [block.content, block.metadata?.width, block.metadata?.align, block.metadata?.caption, imageUrl]);

  // 이미지 URL 변경 처리
  const handleImageUrlChange = (url) => {
    setImageUrl(url);
    setIsError(false);
    setIsLoading(true);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: imageWidth,
      align: imageAlign
    };
    
    console.log('Saving metadata:', updatedMetadata); // 디버깅용
    
    onUpdate({ 
      content: url,
      metadata: updatedMetadata
    });
  };

  // 캡션 변경 처리
  const handleCaptionChange = (newCaption) => {
    setCaption(newCaption);
    const updatedMetadata = {
      ...block.metadata,
      caption: newCaption,
      width: imageWidth,
      align: imageAlign
    };
    
    onUpdate({
      content: imageUrl,
      metadata: updatedMetadata
    });
  };

  // 이미지 크기 변경
  const handleSizeChange = (newWidth) => {
    console.log('Size change:', newWidth); // 디버깅용
    setImageWidth(newWidth);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: newWidth,
      align: imageAlign
    };
    
    console.log('Saving size metadata:', updatedMetadata); // 디버깅용
    
    onUpdate({
      content: imageUrl,
      metadata: updatedMetadata
    });
  };

  // 이미지 정렬 변경
  const handleAlignChange = (newAlign) => {
    console.log('Align change:', newAlign); // 디버깅용
    setImageAlign(newAlign);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: imageWidth,
      align: newAlign
    };
    
    onUpdate({
      content: imageUrl,
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
    const startWidth = imageWidth;
    let currentWidth = startWidth;
    
    const handleMouseMove = (e) => {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
      currentWidth = newWidth;
      setImageWidth(newWidth);
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      
      // 최종 크기를 현재 상태에서 가져오기
      console.log('Final resize width:', currentWidth);
      
      const updatedMetadata = {
        ...block.metadata,
        caption,
        width: currentWidth,
        align: imageAlign
      };
      
      console.log('Saving final resize metadata:', updatedMetadata);
      
      // 즉시 업데이트
      onUpdate({
        content: imageUrl,
        metadata: updatedMetadata,
        forceUpdate: true
      });
      
      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
      
      // 파일을 Data URL로 변환
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        handleImageUrlChange(dataUrl);
        setShowPopup(false);
      };
      reader.onerror = () => {
        setIsError(true);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // URL 입력 확인
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      handleImageUrlChange(imageUrl.trim());
      setShowPopup(false);
    }
  };

  // 이미지 로드 성공
  const handleImageLoad = () => {
    setIsLoading(false);
    setIsError(false);
  };

  // 이미지 로드 실패
  const handleImageError = () => {
    setIsLoading(false);
    setIsError(true);
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

  // 이미지 제거
  const handleRemoveImage = () => {
    setImageUrl('');
    setCaption('');
    setIsError(false);
    onUpdate({ content: '', metadata: { caption: '' } });
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

  // 이미지 크게 보기
  const handleOpenImagePopup = () => {
    setShowImagePopup(true);
  };

  // 이미지 크게 보기 닫기
  const handleCloseImagePopup = () => {
    setShowImagePopup(false);
  };

  // 이미지 자르기 팝업 열기
  const handleOpenCropPopup = () => {
    setShowCropPopup(true);
  };

  // 이미지 자르기 팝업 닫기
  const handleCloseCropPopup = () => {
    setShowCropPopup(false);
  };

  // 이미지 자르기 적용
  const handleCropApply = () => {
    // 여기에 실제 이미지 자르기 로직 구현
    // Canvas API를 사용하여 이미지 자르기
    if (cropData && imageRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;
      
      canvas.width = cropData.width;
      canvas.height = cropData.height;
      
      ctx.drawImage(
        img,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, cropData.width, cropData.height
      );
      
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      handleImageUrlChange(croppedDataUrl);
      setShowCropPopup(false);
    }
  };

  // 이미지 정렬별 클래스
  const getImageAlignClass = () => {
    switch (imageAlign) {
      case 'left': return 'mr-auto ml-0';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto mr-0';
      default: return 'mx-auto';
    }
  };

  return (
    <div className="image-block py-2" onClick={handleFocus}>
      {/* 심플한 이미지 블록 */}
      {!imageUrl && (
        <div 
          onClick={handleOpenPopup}
          className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-400 text-sm">이미지 추가</span>
        </div>
      )}

      {/* 이미지 표시 */}
      {imageUrl && (
        <div className="space-y-2">
          <div className={`relative group ${getImageAlignClass()}`} style={{ width: imageWidth }}>
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
                  <p className="text-gray-500 text-sm mb-2">이미지를 불러올 수 없습니다</p>
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
            
            {/* 이미지 */}
            {!isError && (
              <div className="relative">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={caption || '이미지'}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="w-full h-auto rounded-lg"
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
                
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
            
            {/* 이미지 컨트롤 (호버 시 표시) */}
            {!readOnly && !isLoading && !isError && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1 bg-black bg-opacity-60 rounded-lg p-1">
                  <button
                    onClick={handleOpenImagePopup}
                    className="p-1 text-white hover:text-blue-300 transition-colors"
                    title="크게 보기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleOpenCropPopup}
                    className="p-1 text-white hover:text-green-300 transition-colors"
                    title="이미지 자르기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
                    onClick={handleOpenPopup}
                    className="p-1 text-white hover:text-blue-300 transition-colors"
                    title="이미지 교체"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="p-1 text-white hover:text-red-300 transition-colors"
                    title="이미지 제거"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 이미지 설정 (설정 버튼 클릭 시에만 표시) */}
          {showSettings && !readOnly && !isLoading && !isError && imageUrl && (
            <div className="flex items-center justify-center space-x-4 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {/* 정렬 */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">정렬:</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleAlignChange('left')}
                    className={`p-1 rounded ${imageAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="왼쪽 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('center')}
                    className={`p-1 rounded ${imageAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="가운데 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('right')}
                    className={`p-1 rounded ${imageAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
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
          <div className={`${getImageAlignClass()}`} style={{ width: imageWidth }}>
            <input
              type="text"
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="이미지 캡션 (선택사항)"
              disabled={readOnly}
              className="w-full px-2 py-1 text-sm text-center border-none outline-none bg-transparent text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-colors"
            />
          </div>
        </div>
      )}

      {/* 이미지 추가 팝업 모달 */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePopup}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">이미지 추가</h3>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이미지 URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="이미지 URL을 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    disabled={readOnly}
                  />
                  <button
                    type="submit"
                    disabled={!imageUrl.trim() || readOnly}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    추가
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                <span className="px-4 text-gray-500 text-sm">또는</span>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">파일 업로드</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={readOnly}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={readOnly}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  파일 선택
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 이미지 크게 보기 팝업 */}
      {showImagePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseImagePopup}>
          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={handleCloseImagePopup}
                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={imageUrl}
                alt={caption || '이미지'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 이미지 자르기 팝업 */}
      {showCropPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseCropPopup}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">이미지 자르기</h3>
              <button
                onClick={handleCloseCropPopup}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  이미지 자르기 기능은 개발 중입니다. 곧 사용할 수 있습니다.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCloseCropPopup}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCropApply}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    disabled
                  >
                    자르기 적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};