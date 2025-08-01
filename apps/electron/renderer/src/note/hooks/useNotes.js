/**
 * 노트 데이터 관리 훅 (리팩터링)
 */
import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';
import { DEFAULT_SETTINGS } from '../constants/noteConfig';
import { syncNoteUpdate, syncNoteDelete, syncNoteCreate } from '../utils/stateSync';

export const useNotes = () => {
  // 노트 데이터 상태
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [error, setError] = useState(null);
  // 로딩 상태를 객체로 분리
  const [loading, setLoading] = useState({ main: false, more: false, search: false });
  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: DEFAULT_SETTINGS.pageSize
  });
  // 필터 및 정렬 상태
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    tags: [],
    favorites: false,
    recent: false
  });
  const [sortBy, setSortBy] = useState(DEFAULT_SETTINGS.sortBy);
  const [viewMode, setViewMode] = useState(DEFAULT_SETTINGS.viewMode);

  // 중복 호출 방지 플래그
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 요청 취소를 위한 AbortController
  const [abortController, setAbortController] = useState(null);

  /** 노트 목록 로드 */
  const loadNotes = useCallback(async (params = {}, append = false) => {
    if (isLoadingNotes) {
      console.log('🚫 loadNotes: 이미 로딩 중이므로 요청 무시');
      return;
    }
    
    // 이전 요청이 있다면 취소
    if (abortController) {
      console.log('🚫 이전 요청 취소');
      abortController.abort();
    }
    
    // 새로운 AbortController 생성
    const controller = new AbortController();
    setAbortController(controller);
    
    console.log('🔄 loadNotes 시작:', { params, append, isLoadingNotes });
    setIsLoadingNotes(true);
    setLoading(l => ({ ...l, main: true }));
    setError(null);
    
    try {
      const queryParams = {
        page: append ? pagination.currentPage + 1 : 1,
        limit: pagination.pageSize,
        sort: sortBy,
        ...params
      };
      if (filters.category && filters.category !== 'all') queryParams.category = filters.category;
      if (filters.tags && filters.tags.length > 0) queryParams.tags = filters.tags.join(',');
      if (filters.favorites) queryParams.isFavorite = true;
      if (filters.recent) queryParams.recent = true;
      if (filters.search) queryParams.search = filters.search;
      
      console.log('📡 API 요청 파라미터:', queryParams);
      const response = await api.getNotes(queryParams, controller.signal);
      console.log('✅ API 응답 받음:', response);
      
      if (append) {
        setNotes(prev => [...prev, ...(response.data || [])]);
        setPagination(prev => ({
          ...prev,
          currentPage: prev.currentPage + 1,
          totalPages: response.totalPages || 1,
          totalCount: response.totalCount || 0
        }));
      } else {
        setNotes(response.data || []);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: response.totalPages || 1,
          totalCount: response.totalCount || 0
        }));
      }
      console.log('✅ 노트 상태 업데이트 완료');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 요청이 취소됨');
        return;
      }
      console.error('❌ loadNotes 실패:', error);
      setError(error.message);
    } finally {
      console.log('🏁 loadNotes 완료');
      setLoading(l => ({ ...l, main: false }));
      setIsLoadingNotes(false);
      setAbortController(null);
    }
  }, [pagination.pageSize, sortBy, isLoadingNotes, abortController]);

  /** 노트 검색 */
  const searchNotes = useCallback(async (query, options = {}) => {
    if (isSearching) return;
    setIsSearching(true);
    setLoading(l => ({ ...l, search: true }));
    setError(null);
    try {
      const response = await api.searchNotes(query, {
        limit: pagination.pageSize,
        ...options
      });
      setNotes(response.data || []);
    } catch (error) {
      setError(error.message);
      console.error('노트 검색 실패:', error);
    } finally {
      setLoading(l => ({ ...l, search: false }));
      setIsSearching(false);
    }
  }, [pagination.pageSize, isSearching]);

  /** 새 노트 생성 */
  const createNote = useCallback(async (noteData) => {
    setLoading(l => ({ ...l, main: true }));
    setError(null);
    try {
      const response = await api.createNote(noteData);
      setNotes(prev => [response.data, ...prev]);
      syncNoteCreate(response.data);
      return response.data;
    } catch (error) {
      setError(error.message);
      console.error('노트 생성 실패:', error);
      throw error;
    } finally {
      setLoading(l => ({ ...l, main: false }));
    }
  }, []);

  /** 노트 업데이트 */
  const updateNote = useCallback(async (noteId, updateData) => {
    setLoading(l => ({ ...l, main: true }));
    setError(null);
    try {
      const response = await api.updateNote(noteId, updateData);
      setNotes(prev => prev.map(note => note._id === noteId ? response.data : note));
      if (selectedNote?._id === noteId) setSelectedNote(response.data);
      syncNoteUpdate(response.data, updateData);
      return response.data;
    } catch (error) {
      setError(error.message);
      console.error('노트 업데이트 실패:', error);
      throw error;
    } finally {
      setLoading(l => ({ ...l, main: false }));
    }
  }, [selectedNote]);

  /** 노트 삭제 */
  const deleteNote = useCallback(async (noteId, permanent = false) => {
    setLoading(l => ({ ...l, main: true }));
    setError(null);
    try {
      const noteToDelete = notes.find(note => note._id === noteId);
      await api.deleteNote(noteId, permanent);
      setNotes(prev => prev.filter(note => note._id !== noteId));
      if (selectedNote?._id === noteId) setSelectedNote(null);
      if (noteToDelete) syncNoteDelete(noteToDelete);
    } catch (error) {
      setError(error.message);
      console.error('노트 삭제 실패:', error);
      throw error;
    } finally {
      setLoading(l => ({ ...l, main: false }));
    }
  }, [selectedNote, notes]);

  /** 노트 선택 */
  const selectNote = useCallback(async (noteId) => {
    if (!noteId) {
      setSelectedNote(null);
      return;
    }
    setLoading(l => ({ ...l, main: true }));
    setError(null);
    try {
      const response = await api.getNote(noteId);
      setSelectedNote(response.data);
    } catch (error) {
      setError(error.message);
      console.error('노트 선택 실패:', error);
    } finally {
      setLoading(l => ({ ...l, main: false }));
    }
  }, []);

  /** 필터 업데이트 */
  const updateFilters = useCallback((newFilters) => {
    console.log('🔧 updateFilters 호출:', newFilters);
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      console.log('🔧 필터 업데이트:', { prev, newFilters, updated });
      return updated;
    });
    
    // 필터 변경 시 노트 다시 로드 (디바운싱 시간 증가)
    setTimeout(() => {
      if (!isLoadingNotes) {
        console.log('🔄 필터 변경으로 인한 노트 재로드');
        loadNotes({}, false);
      } else {
        console.log('🚫 필터 변경 요청 무시 - 이미 로딩 중');
      }
    }, 500); // 300ms → 500ms로 증가
  }, [loadNotes, isLoadingNotes]);

  /** 페이지 변경 */
  const changePage = useCallback((page) => {
    console.log('📄 페이지 변경:', page);
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  /** 무한 스크롤용 더 많은 노트 로드 */
  const loadMoreNotes = useCallback(async () => {
    if (isLoadingMore || loading.more) return;
    setIsLoadingMore(true);
    setLoading(l => ({ ...l, more: true }));
    setError(null);
    try {
      const queryParams = {
        page: pagination.currentPage + 1,
        limit: pagination.pageSize,
        sort: sortBy
      };
      if (filters.category && filters.category !== 'all') queryParams.category = filters.category;
      if (filters.tags && filters.tags.length > 0) queryParams.tags = filters.tags.join(',');
      if (filters.favorites) queryParams.isFavorite = true;
      if (filters.recent) queryParams.recent = true;
      if (filters.search) queryParams.search = filters.search;
      const response = await api.getNotes(queryParams);
      setNotes(prev => [...prev, ...(response.data || [])]);
      setPagination(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0
      }));
    } catch (error) {
      setError(error.message);
      console.error('더 많은 노트 로드 실패:', error);
    } finally {
      setLoading(l => ({ ...l, more: false }));
      setIsLoadingMore(false);
    }
  }, [pagination.currentPage, pagination.totalPages, pagination.pageSize, sortBy, filters, isLoadingMore, loading.more]);

  /** 정렬 변경 */
  const changeSortBy = useCallback((newSortBy) => {
    console.log('🔄 정렬 변경:', newSortBy);
    setSortBy(newSortBy);
    
    // 정렬 변경 시 노트 다시 로드 (디바운싱 시간 증가)
    setTimeout(() => {
      if (!isLoadingNotes) {
        console.log('🔄 정렬 변경으로 인한 노트 재로드');
        loadNotes({}, false);
      } else {
        console.log('🚫 정렬 변경 요청 무시 - 이미 로딩 중');
      }
    }, 500); // 300ms → 500ms로 증가
  }, [loadNotes, isLoadingNotes]);

  /** 뷰 모드 변경 */
  const changeViewMode = useCallback((newViewMode) => {
    setViewMode(newViewMode);
  }, []);

  // 초기 로드만 수행
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line
  }, []);

  // 필터나 정렬 변경 시 useEffect 제거 - 개별 함수에서 처리

  return {
    notes,
    setNotes,
    selectedNote,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    viewMode,
    loadNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    updateFilters,
    changePage,
    changeSortBy,
    changeViewMode,
    loadMoreNotes,
    refreshNotes: loadNotes,
    clearError: () => setError(null),
    hasMoreNotes: pagination.currentPage < pagination.totalPages
  };
};