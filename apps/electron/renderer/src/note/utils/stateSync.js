/**
 * 노트 상태 동기화 유틸리티
 * 
 * @description 개인노트, 공유노트, 즐겨찾기 간의 상태 동기화를 관리
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 노트 타입 확인
 */
export const getNoteType = (note) => {
  if (note.isShared || note.type === 'shared') {
    return 'shared';
  }
  return 'personal';
};

/**
 * 즐겨찾기 상태 통합 확인
 */
export const isNoteFavorite = (note) => {
  return note.isFavorite || note.isBookmarked || false;
};

/**
 * 노트 상태 업데이트 시 다른 컴포넌트에 알림
 */
export const notifyStateChange = (eventType, noteData) => {
  const event = new CustomEvent('noteStateChange', {
    detail: {
      type: eventType,
      note: noteData,
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(event);
};

/**
 * 상태 변경 이벤트 리스너 등록
 */
export const addStateChangeListener = (callback) => {
  const handler = (event) => {
    callback(event.detail);
  };
  
  window.addEventListener('noteStateChange', handler);
  
  // 클린업 함수 반환
  return () => {
    window.removeEventListener('noteStateChange', handler);
  };
};

/**
 * 즐겨찾기 상태 동기화
 */
export const syncFavoriteState = (note, isFavorite) => {
  const noteType = getNoteType(note);
  
  // 상태 변경 알림
  notifyStateChange('favoriteToggle', {
    ...note,
    isFavorite,
    isBookmarked: isFavorite,
    type: noteType
  });
};

/**
 * 노트 업데이트 상태 동기화
 */
export const syncNoteUpdate = (note, updates) => {
  const noteType = getNoteType(note);
  
  // 상태 변경 알림
  notifyStateChange('noteUpdate', {
    ...note,
    ...updates,
    type: noteType
  });
};

/**
 * 노트 삭제 상태 동기화
 */
export const syncNoteDelete = (note) => {
  const noteType = getNoteType(note);
  
  // 상태 변경 알림
  notifyStateChange('noteDelete', {
    ...note,
    type: noteType
  });
};

/**
 * 노트 생성 상태 동기화
 */
export const syncNoteCreate = (note) => {
  const noteType = getNoteType(note);
  
  // 상태 변경 알림
  notifyStateChange('noteCreate', {
    ...note,
    type: noteType
  });
}; 