/**
 * 공용노트 관리 훅
 * 
 * @description 공용노트 상태 관리 및 API 호출을 담당하는 커스텀 훅
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { VIEW_MODES } from '../constants/noteConfig';
import { 
  MOCK_SHARED_NOTES, 
  generateSharedNotePaginationResponse, 
  generateSharedNoteSearchResponse,
  USE_SHARED_NOTE_MOCK_DATA 
} from '../utils/sharedNoteMockData';

/**
 * 공용노트 관리 훅
 */
export const useSharedNotes = () => {
  // 기본 상태
  const [sharedNotes, setSharedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // 필터 및 정렬 상태
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    visibility: 'all',
    myNotes: false,
    isCollaborating: false
  });
  
  const [sortBy, setSortBy] = useState('updated_desc');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);

  /**
   * 공용노트 목록 로드
   */
  const loadSharedNotes = useCallback(async (page = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_SHARED_NOTE_MOCK_DATA) {
        // 목업 데이터 사용
        await new Promise(resolve => setTimeout(resolve, 300)); // 로딩 시뮬레이션
        
        // 필터링 적용
        let filteredNotes = [...MOCK_SHARED_NOTES];
        
        // 검색 필터
        if (filters.search) {
          filteredNotes = filteredNotes.filter(note =>
            note.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            note.content.toLowerCase().includes(filters.search.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
          );
        }
        
        // 카테고리 필터
        if (filters.category !== 'all') {
          filteredNotes = filteredNotes.filter(note => note.category === filters.category);
        }
        
        // 가시성 필터
        if (filters.visibility !== 'all') {
          filteredNotes = filteredNotes.filter(note => note.visibility === filters.visibility);
        }
        
        // 내 노트 필터
        if (filters.myNotes) {
          filteredNotes = filteredNotes.filter(note => note.ownerId === 'user-1'); // 임시로 user-1을 현재 사용자로 가정
        }
        
        // 협업 중 필터
        if (filters.isCollaborating) {
          filteredNotes = filteredNotes.filter(note => note.isCollaborating);
        }
        
        // 정렬 적용
        filteredNotes.sort((a, b) => {
          switch (sortBy) {
            case 'title_asc':
              return a.title.localeCompare(b.title);
            case 'title_desc':
              return b.title.localeCompare(a.title);
            case 'created_asc':
              return new Date(a.createdAt) - new Date(b.createdAt);
            case 'created_desc':
              return new Date(b.createdAt) - new Date(a.createdAt);
            case 'updated_asc':
              return new Date(a.updatedAt) - new Date(b.updatedAt);
            case 'updated_desc':
            default:
              return new Date(b.updatedAt) - new Date(a.updatedAt);
          }
        });
        
        const response = generateSharedNotePaginationResponse(filteredNotes, page, pagination.pageSize);
        
        if (reset) {
          setSharedNotes(response.data);
        } else {
          setSharedNotes(prev => [...prev, ...response.data]);
        }
        
        setPagination(response.pagination);
        setHasMoreNotes(response.pagination.hasNextPage);
        
      } else {
        // 실제 API 호출
        const response = await fetch(`/api/shared-notes?page=${page}&limit=${pagination.pageSize}&sort=${sortBy}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('공용노트 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        if (reset) {
          setSharedNotes(data.data);
        } else {
          setSharedNotes(prev => [...prev, ...data.data]);
        }
        
        setPagination(data.pagination);
        setHasMoreNotes(data.pagination.hasNextPage);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, pagination.pageSize]);

  /**
   * 공용노트 검색
   */
  const searchSharedNotes = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = generateSharedNoteSearchResponse(MOCK_SHARED_NOTES, query, 1, pagination.pageSize);
        setSharedNotes(response.data);
        setPagination(response.pagination);
        setHasMoreNotes(response.pagination.hasNextPage);
        
      } else {
        const response = await fetch(`/api/shared-notes/search?q=${encodeURIComponent(query)}&page=1&limit=${pagination.pageSize}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('공용노트 검색에 실패했습니다.');
        }
        
        const data = await response.json();
        setSharedNotes(data.data);
        setPagination(data.pagination);
        setHasMoreNotes(data.pagination.hasNextPage);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  /**
   * 새 공용노트 생성
   */
  const createSharedNote = useCallback(async (noteData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newNote = {
          _id: `shared-note-${Date.now()}`,
          id: `shared-note-${Date.now()}`,
          title: noteData.title,
          content: noteData.content,
          summary: noteData.summary || '',
          category: noteData.category || 'work',
          tags: noteData.tags || [],
          isShared: true,
          visibility: noteData.visibility || 'shared',
          owner: {
            id: 'user-1',
            name: '김철수',
            email: 'kimcs@company.com'
          },
          ownerId: 'user-1',
          collaborators: [],
          isCollaborating: false,
          activeCollaborators: [],
          lastActivity: new Date().toISOString(),
          viewCount: 0,
          editCount: 0,
          commentCount: 0,
          shareCount: 0,
          permissions: {
            canEdit: true,
            canComment: true,
            canShare: true,
            canDelete: true
          },
          collaborationHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          attachments: [],
          comments: [],
          notifications: {
            onEdit: true,
            onComment: true,
            onShare: false,
            onMention: true
          }
        };
        
        MOCK_SHARED_NOTES.unshift(newNote);
        setSharedNotes(prev => [newNote, ...prev]);
        return newNote;
        
      } else {
        const response = await fetch('/api/shared-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });
        
        if (!response.ok) {
          throw new Error('공용노트 생성에 실패했습니다.');
        }
        
        const newNote = await response.json();
        setSharedNotes(prev => [newNote, ...prev]);
        return newNote;
      }
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 공용노트 수정
   */
  const updateSharedNote = useCallback(async (noteId, noteData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const noteIndex = MOCK_SHARED_NOTES.findIndex(note => note._id === noteId);
        if (noteIndex !== -1) {
          const updatedNote = {
            ...MOCK_SHARED_NOTES[noteIndex],
            ...noteData,
            updatedAt: new Date().toISOString()
          };
          
          MOCK_SHARED_NOTES[noteIndex] = updatedNote;
          setSharedNotes(prev => prev.map(note => 
            note._id === noteId ? updatedNote : note
          ));
          
          return updatedNote;
        }
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });
        
        if (!response.ok) {
          throw new Error('공용노트 수정에 실패했습니다.');
        }
        
        const updatedNote = await response.json();
        setSharedNotes(prev => prev.map(note => 
          note._id === noteId ? updatedNote : note
        ));
        
        return updatedNote;
      }
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 공용노트 삭제
   */
  const deleteSharedNote = useCallback(async (noteId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_SHARED_NOTE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const noteIndex = MOCK_SHARED_NOTES.findIndex(note => note._id === noteId);
        if (noteIndex !== -1) {
          MOCK_SHARED_NOTES.splice(noteIndex, 1);
          setSharedNotes(prev => prev.filter(note => note._id !== noteId));
          
          if (selectedNote && selectedNote._id === noteId) {
            setSelectedNote(null);
          }
        }
        
      } else {
        const response = await fetch(`/api/shared-notes/${noteId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('공용노트 삭제에 실패했습니다.');
        }
        
        setSharedNotes(prev => prev.filter(note => note._id !== noteId));
        
        if (selectedNote && selectedNote._id === noteId) {
          setSelectedNote(null);
        }
      }
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedNote]);

  /**
   * 노트 선택
   */
  const selectNote = useCallback((noteId) => {
    const note = sharedNotes.find(note => note._id === noteId);
    setSelectedNote(note || null);
  }, [sharedNotes]);

  /**
   * 필터 업데이트
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * 페이지 변경
   */
  const changePage = useCallback((newPage) => {
    loadSharedNotes(newPage, true);
  }, [loadSharedNotes]);

  /**
   * 정렬 변경
   */
  const changeSortBy = useCallback((newSortBy) => {
    setSortBy(newSortBy);
  }, []);

  /**
   * 뷰 모드 변경
   */
  const changeViewMode = useCallback((newViewMode) => {
    setViewMode(newViewMode);
  }, []);

  /**
   * 더 많은 노트 로드 (무한 스크롤)
   */
  const loadMoreNotes = useCallback(() => {
    if (hasMoreNotes && !loading) {
      loadSharedNotes(pagination.currentPage + 1, false);
    }
  }, [hasMoreNotes, loading, pagination.currentPage, loadSharedNotes]);

  /**
   * 노트 목록 새로고침
   */
  const refreshNotes = useCallback(() => {
    loadSharedNotes(1, true);
  }, [loadSharedNotes]);

  /**
   * 에러 클리어
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 초기 로드 및 필터/정렬 변경 시 자동 새로고침
  useEffect(() => {
    loadSharedNotes(1, true);
  }, [filters, sortBy]);

  return {
    // 상태
    sharedNotes,
    selectedNote,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    viewMode,
    hasMoreNotes,
    
    // 액션
    loadSharedNotes,
    searchSharedNotes,
    createSharedNote,
    updateSharedNote,
    deleteSharedNote,
    selectNote,
    updateFilters,
    changePage,
    changeSortBy,
    changeViewMode,
    loadMoreNotes,
    refreshNotes,
    clearError
  };
};