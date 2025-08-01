import React, { useState, useEffect, useRef } from 'react';
import { BlockEditor } from '../../BlockEditor';

/**
 * PageBlock - 노션 스타일의 '새 페이지 추가' 블록 컴포넌트
 * props:
 *   - onCreatePage: (title: string, description?: string) => void (필수) - 새 페이지 생성 콜백
 *   - placeholder: string (선택) - 입력창 플레이스홀더
 */
const PageBlock = ({ block, placeholder = '새 페이지 제목 입력...' }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const titleInputRef = useRef(null);
  const onCreatePage = block?.metadata?.onCreatePage || (() => {});

  // ESC로 모달 닫기
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setTitle('');
        setBlocks([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  // 모달 열릴 때 title input 포커스
  useEffect(() => {
    if (modalOpen && titleInputRef.current) {
      // 더 긴 지연 시간으로 확실히 포커스 설정
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          // 커서를 끝으로 이동
          const length = titleInputRef.current.value.length;
          titleInputRef.current.setSelectionRange(length, length);
        }
      }, 200);
      
      // 배경의 다른 요소들이 포커스를 받지 않도록 방지
      const preventFocus = (e) => {
        if (!e.target.closest('[data-modal="true"]')) {
          e.preventDefault();
          if (titleInputRef.current) {
            titleInputRef.current.focus();
          }
        }
      };
      
      document.addEventListener('focusin', preventFocus);
      return () => document.removeEventListener('focusin', preventFocus);
    }
  }, [modalOpen]);

  // 모달 내부의 모든 키보드 이벤트 차단
  const handleModalKeyDown = (e) => {
    // ESC는 모달 닫기용으로 허용
    if (e.key === 'Escape') {
      setModalOpen(false);
      setTitle('');
      setBlocks([]);
      return;
    }
    
    // Ctrl+Enter는 새 페이지 생성용으로 허용
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      handleCreate();
      return;
    }
    
    // 다른 모든 키보드 이벤트는 모달 내부에서만 처리
    e.stopPropagation();
  };

  // 오버레이 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setModalOpen(false);
      setTitle('');
      setBlocks([]);
    }
  };

  // 모달 내부 클릭 시 이벤트 전파 방지
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleCreate = () => {
    if (title.trim()) {
      // 블록 내용을 텍스트로 변환
      const content = blocks.map(block => block.content).join('\n');
      onCreatePage(title.trim(), content.trim());
      setTitle('');
      setBlocks([]);
      setModalOpen(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    // 제목에서는 모든 키보드 이벤트를 기본 동작으로 허용
    e.stopPropagation();
  };

  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
  };


  return (
    <>
      <div
        style={{ padding: '6px 8px', border: '1px dashed #ccc', borderRadius: 4, background: '#fafbfc', margin: '2px 0', cursor: 'pointer' }}
        onClick={() => setModalOpen(true)}
      >
        <div style={{ color: '#888', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 14, marginRight: 6 }}>📝</span>
          <span style={{ fontSize: 13 }}>새 페이지 추가</span>
        </div>
      </div>
      {modalOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end'
          }}
          onClick={handleOverlayClick}
        >
          <div
            style={{
              background: '#fff', 
              width: '100vw', 
              maxWidth: '1000px', 
              height: '100vh',
              padding: '40px 60px', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideIn 0.3s ease-out',
              zIndex: 100000
            }}
            onClick={handleModalClick}
            onKeyDown={handleModalKeyDown}
            tabIndex={-1}
            data-modal="true"
          >
            <style>
              {`
                @keyframes slideIn {
                  from {
                    transform: translateX(100%);
                  }
                  to {
                    transform: translateX(0);
                  }
                }
              `}
            </style>
            {/* 상단 옵션들 */}
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              marginBottom: 40, 
              fontSize: 14, 
              color: '#999' 
            }}>
              <span style={{ cursor: 'pointer' }}>아이콘 추가</span>
              <span style={{ cursor: 'pointer' }}>커버 추가</span>
              <span style={{ cursor: 'pointer' }}>인증하기</span>
              <span style={{ cursor: 'pointer' }}>레이아웃 사용자 지정</span>
            </div>

            {/* 제목 입력 */}
            <div style={{ marginBottom: 32 }}>
              <textarea
                ref={titleInputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="제목 없음"
                rows={1}
                style={{ 
                  width: '100%', 
                  border: 'none', 
                  outline: 'none',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#37352f',
                  background: 'transparent',
                  marginBottom: '8px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  padding: '0',
                  margin: '0 0 8px 0',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '1.2'
                }}
                onInput={(e) => {
                  // 자동 높이 조정
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            </div>

            {/* 페이지 속성 */}
            <div style={{ 
              display: 'flex', 
              gap: 24, 
              marginBottom: 40, 
              fontSize: 14, 
              color: '#787774' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🕐</span>
                <span>{new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true 
                })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏷️</span>
                <span>비어 있음</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span>+</span>
                <span>속성 추가</span>
              </div>
            </div>

            {/* 블록 에디터 */}
            <div style={{ flex: 1, marginBottom: 40, position: 'relative' }}>
              <BlockEditor
                initialBlocks={blocks.length > 0 ? blocks : []}
                onChange={handleBlocksChange}
                onSelectionCleared={() => {
                  setSelectedBlocks([]);
                }}
                placeholder="페이지 내용을 입력하세요..."
                selectedBlocks={selectedBlocks}
                setSelectedBlocks={setSelectedBlocks}
              />
            </div>

            {/* 댓글 섹션 */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#37352f', 
                marginBottom: '12px' 
              }}>
                댓글
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '8px 12px', 
                border: '1px solid #e1e5e9', 
                borderRadius: 4,
                color: '#999',
                cursor: 'text'
              }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <span>댓글 추가</span>
              </div>
            </div>

            {/* 하단 안내 */}
            <div style={{ 
              fontSize: '14px', 
              color: '#999', 
              marginTop: '20px',
              padding: '16px 0',
              borderTop: '1px solid #f1f3f4'
            }}>
              Enter 키로 새 줄을 추가하거나, Ctrl+Enter로 새 페이지를 생성하세요
            </div>

            {/* 액션 버튼들 */}
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              display: 'flex', 
              gap: 8 
            }}>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setTitle('');
                  setBlocks([]);
                }}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  border: '1px solid #ddd', 
                  background: '#fff', 
                  color: '#555', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  border: 'none', 
                  background: title.trim() ? '#4f8cff' : '#ccc', 
                  color: '#fff', 
                  fontWeight: 600,
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
                disabled={!title.trim()}
              >
                생성
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

export default PageBlock; 