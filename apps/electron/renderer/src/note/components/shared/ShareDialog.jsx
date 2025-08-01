/**
 * 공유 다이얼로그 컴포넌트
 * 
 * @description 노트 공유 설정을 위한 다이얼로그 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';

const ShareDialog = ({
  isOpen = false,
  onClose,
  note,
  onShare
}) => {
  const [shareSettings, setShareSettings] = useState({
    visibility: 'shared',
    requireAuth: true,
    allowComments: true,
    allowDownload: false,
    expireDate: '',
    password: '',
    usePassword: false
  });

  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // 노트 정보가 변경될 때 초기화
  useEffect(() => {
    if (note) {
      setShareSettings({
        visibility: note.visibility || 'shared',
        requireAuth: true,
        allowComments: true,
        allowDownload: false,
        expireDate: '',
        password: '',
        usePassword: false
      });
      
      // 기존 공유 URL이 있다면 설정
      if (note.shareUrl) {
        setShareUrl(note.shareUrl);
      }
    }
  }, [note]);

  /**
   * 공유 설정 업데이트
   */
  const updateSetting = useCallback((key, value) => {
    setShareSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * 공유 URL 생성
   */
  const generateShareUrl = useCallback(async () => {
    if (!note) return;
    
    try {
      setSharing(true);
      
      const shareData = {
        noteId: note._id,
        visibility: shareSettings.visibility,
        requireAuth: shareSettings.requireAuth,
        allowComments: shareSettings.allowComments,
        allowDownload: shareSettings.allowDownload,
        expireDate: shareSettings.expireDate || null,
        password: shareSettings.usePassword ? shareSettings.password : null
      };
      
      const result = await onShare(note._id, shareData);
      
      if (result && result.shareUrl) {
        setShareUrl(result.shareUrl);
      }
      
    } catch (error) {
      console.error('공유 URL 생성 실패:', error);
    } finally {
      setSharing(false);
    }
  }, [note, shareSettings, onShare]);

  /**
   * URL 복사
   */
  const copyUrl = useCallback(async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('URL 복사 실패:', error);
    }
  }, [shareUrl]);

  /**
   * 소셜 공유
   */
  const shareToSocial = useCallback((platform) => {
    if (!shareUrl || !note) return;
    
    const title = encodeURIComponent(note.title);
    const url = encodeURIComponent(shareUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${title}`,
      email: `mailto:?subject=${title}&body=${title}%0A%0A${url}`
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  }, [shareUrl, note]);

  /**
   * 다이얼로그 닫기
   */
  const handleClose = useCallback(() => {
    setCopied(false);
    setShareUrl('');
    onClose();
  }, [onClose]);

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            노트 공유
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-6 py-4 space-y-6">
          {/* 노트 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {note.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {note.summary || note.content}
            </p>
          </div>

          {/* 공유 설정 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">공유 설정</h4>
            
            {/* 공개 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                공개 범위
              </label>
              <select
                value={shareSettings.visibility}
                onChange={(e) => updateSetting('visibility', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="private">나만 보기</option>
                <option value="shared">링크가 있는 사람</option>
                <option value="public">모든 사람</option>
              </select>
            </div>

            {/* 권한 설정 */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.requireAuth}
                  onChange={(e) => updateSetting('requireAuth', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">로그인 필요</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.allowComments}
                  onChange={(e) => updateSetting('allowComments', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">댓글 허용</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.allowDownload}
                  onChange={(e) => updateSetting('allowDownload', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">다운로드 허용</span>
              </label>
            </div>

            {/* 만료일 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                만료일 (선택사항)
              </label>
              <input
                type="datetime-local"
                value={shareSettings.expireDate}
                onChange={(e) => updateSetting('expireDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 비밀번호 설정 */}
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={shareSettings.usePassword}
                  onChange={(e) => updateSetting('usePassword', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호 보호</span>
              </label>
              
              {shareSettings.usePassword && (
                <input
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) => updateSetting('password', e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* 공유 URL */}
          {shareUrl ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">공유 링크</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                />
                <button
                  onClick={copyUrl}
                  className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                    copied
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              
              {/* 소셜 공유 버튼 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">공유하기:</span>
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                  title="트위터로 공유"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                  title="페이스북으로 공유"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="p-2 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                  title="링크드인으로 공유"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => shareToSocial('email')}
                  className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  title="이메일로 공유"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={generateShareUrl}
                disabled={sharing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {sharing ? '생성 중...' : '공유 링크 생성'}
              </button>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;