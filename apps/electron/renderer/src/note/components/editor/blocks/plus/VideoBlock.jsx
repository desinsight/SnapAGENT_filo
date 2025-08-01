/**
 * 동영상 블록 컴포넌트
 * 
 * @description 동영상을 삽입하고 편집할 수 있는 블록
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';

const VideoBlock = ({ 
  block, 
  onUpdate, 
  onFocus, 
  readOnly = false, 
  placeholder = "",
  isEditing,
  onEditingChange 
}) => {
  const [videoUrl, setVideoUrl] = useState(block.content || '');
  const [caption, setCaption] = useState(block.metadata?.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [videoWidth, setVideoWidth] = useState(600); // 기본값
  const [videoAlign, setVideoAlign] = useState('center'); // 기본값
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);
  const videoRef = useRef(null);
  const resizeRef = useRef(null);

  // 컴포넌트 마운트 시 메타데이터에서 크기 복원
  useEffect(() => {
    console.log('Video Block metadata:', block.metadata); // 디버깅용
    
    // 메타데이터에서 크기 복원
    if (block.metadata?.width && typeof block.metadata.width === 'number') {
      setVideoWidth(block.metadata.width);
      console.log('Restored video width:', block.metadata.width); // 디버깅용
    }
    
    // 메타데이터에서 정렬 복원
    if (block.metadata?.align && ['left', 'center', 'right'].includes(block.metadata.align)) {
      setVideoAlign(block.metadata.align);
      console.log('Restored video align:', block.metadata.align); // 디버깅용
    }
    
    // 메타데이터에서 캡션 복원
    if (block.metadata?.caption) {
      setCaption(block.metadata.caption);
    }
  }, [block.metadata?.width, block.metadata?.align, block.metadata?.caption]);

  // 유튜브, Vimeo, mp4 등 다양한 비디오 URL을 지원하는 함수
const getEmbedUrl = (url) => {
  // 유튜브
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // mp4
    if (url.match(/\.(mp4|webm|ogg|mov)$/)) return url;
  return null;
};

  // 동영상 URL 변경 처리
  const handleVideoUrlChange = (url) => {
    setVideoUrl(url);
    setIsError(false);
    setIsLoading(true);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: videoWidth,
      align: videoAlign
    };
    
    console.log('Saving video metadata:', updatedMetadata); // 디버깅용
    
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
      width: videoWidth,
      align: videoAlign
    };
    
    onUpdate({
      content: videoUrl,
      metadata: updatedMetadata
    });
  };

  // 동영상 크기 변경
  const handleSizeChange = (newWidth) => {
    console.log('Video size change:', newWidth); // 디버깅용
    setVideoWidth(newWidth);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: newWidth,
      align: videoAlign
    };
    
    console.log('Saving video size metadata:', updatedMetadata); // 디버깅용
    
    onUpdate({
      content: videoUrl,
      metadata: updatedMetadata
    });
  };

  // 동영상 정렬 변경
  const handleAlignChange = (newAlign) => {
    console.log('Video align change:', newAlign); // 디버깅용
    setVideoAlign(newAlign);
    
    const updatedMetadata = {
      ...block.metadata,
      caption,
      width: videoWidth,
      align: newAlign
    };
    
    onUpdate({
      content: videoUrl,
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
    const startWidth = videoWidth;
    let currentWidth = startWidth;
    
    const handleMouseMove = (e) => {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(1000, startWidth + deltaX));
      currentWidth = newWidth;
      setVideoWidth(newWidth);
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      
      // 최종 크기를 현재 상태에서 가져오기
      console.log('Final video resize width:', currentWidth);
      
      const updatedMetadata = {
        ...block.metadata,
        caption,
        width: currentWidth,
        align: videoAlign
      };
      
      console.log('Saving final video resize metadata:', updatedMetadata);
      
      // 즉시 업데이트
      onUpdate({
        content: videoUrl,
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
      
      // 파일을 Data URL로 변환
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        handleVideoUrlChange(dataUrl);
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
    if (videoUrl.trim()) {
      const embedUrl = getEmbedUrl(videoUrl.trim());
      if (!embedUrl) {
        setIsError(true);
      return;
      }
      handleVideoUrlChange(videoUrl.trim());
      setShowPopup(false);
    }
  };

  // 동영상 로드 성공
  const handleVideoLoad = () => {
    setIsLoading(false);
    setIsError(false);
  };

  // 동영상 로드 실패
  const handleVideoError = () => {
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

  // 동영상 제거
  const handleRemoveVideo = () => {
    setVideoUrl('');
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

  // 동영상 크게 보기
  const handleOpenVideoPopup = () => {
    setShowVideoPopup(true);
  };

  // 동영상 크게 보기 닫기
  const handleCloseVideoPopup = () => {
    setShowVideoPopup(false);
  };

  // 동영상 정렬별 클래스
  const getVideoAlignClass = () => {
    switch (videoAlign) {
      case 'left': return 'mr-auto ml-0';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto mr-0';
      default: return 'mx-auto';
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="video-block py-2" onClick={handleFocus}>
      {/* 심플한 동영상 블록 */}
      {!videoUrl && (
        <div 
          onClick={handleOpenPopup}
          className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-400 text-sm">동영상 추가</span>
        </div>
      )}

      {/* 동영상 표시 */}
      {videoUrl && (
        <div className="space-y-2">
          <div className={`relative group ${getVideoAlignClass()}`} style={{ width: videoWidth }}>
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
                  <p className="text-gray-500 text-sm mb-2">동영상을 불러올 수 없습니다</p>
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
            
            {/* 동영상 */}
            {!isError && embedUrl && (
              <div className="relative">
                {/* YouTube/Vimeo iframe */}
                {(embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com')) ? (
                  <iframe
                    ref={videoRef}
                    src={embedUrl}
                    title="동영상 미리보기"
                    className="w-full aspect-video rounded-lg border border-gray-200 dark:border-gray-700"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={handleVideoLoad}
                    onError={handleVideoError}
                  />
                ) : (
                  // mp4 등 직접 재생
                  <video
                    ref={videoRef}
                    src={embedUrl}
                    controls
                    className="w-full aspect-video rounded-lg border border-gray-200 dark:border-gray-700 bg-black"
                    onLoadedData={handleVideoLoad}
                    onError={handleVideoError}
                  />
                )}
                
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
            
            {/* 동영상 컨트롤 (호버 시 표시) */}
            {!readOnly && !isLoading && !isError && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1 bg-black bg-opacity-60 rounded-lg p-1">
                  <button
                    onClick={handleOpenVideoPopup}
                    className="p-1 text-white hover:text-blue-300 transition-colors"
                    title="크게 보기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
                    title="동영상 교체"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRemoveVideo}
                    className="p-1 text-white hover:text-red-300 transition-colors"
                    title="동영상 제거"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 동영상 설정 (설정 버튼 클릭 시에만 표시) */}
          {showSettings && !readOnly && !isLoading && !isError && videoUrl && (
            <div className="flex items-center justify-center space-x-4 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {/* 정렬 */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">정렬:</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleAlignChange('left')}
                    className={`p-1 rounded ${videoAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="왼쪽 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('center')}
                    className={`p-1 rounded ${videoAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    title="가운데 정렬"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAlignChange('right')}
                    className={`p-1 rounded ${videoAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
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
          <div className={`${getVideoAlignClass()}`} style={{ width: videoWidth }}>
            <input
              type="text"
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="동영상 캡션 (선택사항)"
              disabled={readOnly}
              className="w-full px-2 py-1 text-sm text-center border-none outline-none bg-transparent text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-colors"
            />
          </div>
        </div>
      )}

      {/* 동영상 추가 팝업 모달 */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePopup}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">동영상 추가</h3>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">동영상 URL</label>
                <div className="flex items-center space-x-2">
          <input
                    ref={urlInputRef}
            type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, MP4 URL을 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            disabled={readOnly}
          />
          <button
            type="submit"
                    disabled={!videoUrl.trim() || readOnly}
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
                  accept="video/*"
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

      {/* 동영상 크게 보기 팝업 */}
      {showVideoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseVideoPopup}>
          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={handleCloseVideoPopup}
                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          {(embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com')) ? (
            <iframe
              src={embedUrl}
                  title="동영상 크게 보기"
                  className="max-w-full max-h-full aspect-video rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={embedUrl}
              controls
                  className="max-w-full max-h-full aspect-video rounded-lg bg-black"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoBlock; 