/**
 * AI 기능 관리 훅
 * 
 * @description 노트의 AI 기능 (맞춤법 검사, 태그 추천, 요약 등)을 관리
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import * as api from '../utils/api';
import { AI_FEATURES } from '../constants/noteConfig';

export const useAI = () => {
  // AI 기능 상태
  const [loading, setLoading] = useState({
    spellCheck: false,
    tagRecommendation: false,
    summaryGeneration: false,
    noteAnalysis: false
  });
  
  const [results, setResults] = useState({
    spellCheck: null,
    tagRecommendation: null,
    summaryGeneration: null,
    noteAnalysis: null
  });
  
  const [error, setError] = useState(null);
  
  /**
   * 로딩 상태 업데이트
   */
  const setFeatureLoading = useCallback((feature, isLoading) => {
    setLoading(prev => ({ ...prev, [feature]: isLoading }));
  }, []);
  
  /**
   * 결과 상태 업데이트
   */
  const setFeatureResult = useCallback((feature, result) => {
    setResults(prev => ({ ...prev, [feature]: result }));
  }, []);
  
  /**
   * AI 맞춤법 검사
   * @param {string} text - 검사할 텍스트
   */
  const checkSpelling = useCallback(async (text) => {
    if (!text || text.trim().length === 0) return null;
    
    try {
      setFeatureLoading('spellCheck', true);
      setError(null);
      
      const response = await api.checkSpelling(text);
      setFeatureResult('spellCheck', response.data);
      
      return response.data;
      
    } catch (error) {
      setError(`맞춤법 검사 실패: ${error.message}`);
      console.error('맞춤법 검사 실패:', error);
      return null;
    } finally {
      setFeatureLoading('spellCheck', false);
    }
  }, [setFeatureLoading, setFeatureResult]);
  
  /**
   * AI 태그 추천
   * @param {string} content - 노트 내용
   */
  const recommendTags = useCallback(async (content) => {
    if (!content || content.trim().length === 0) return null;
    
    try {
      setFeatureLoading('tagRecommendation', true);
      setError(null);
      
      const response = await api.recommendTags(content);
      setFeatureResult('tagRecommendation', response.data);
      
      return response.data;
      
    } catch (error) {
      setError(`태그 추천 실패: ${error.message}`);
      console.error('태그 추천 실패:', error);
      return null;
    } finally {
      setFeatureLoading('tagRecommendation', false);
    }
  }, [setFeatureLoading, setFeatureResult]);
  
  /**
   * AI 요약 생성
   * @param {string} content - 노트 내용
   */
  const generateSummary = useCallback(async (content) => {
    if (!content || content.trim().length === 0) return null;
    
    try {
      setFeatureLoading('summaryGeneration', true);
      setError(null);
      
      const response = await api.generateSummary(content);
      setFeatureResult('summaryGeneration', response.data);
      
      return response.data;
      
    } catch (error) {
      setError(`요약 생성 실패: ${error.message}`);
      console.error('요약 생성 실패:', error);
      return null;
    } finally {
      setFeatureLoading('summaryGeneration', false);
    }
  }, [setFeatureLoading, setFeatureResult]);
  
  /**
   * AI 통합 노트 분석
   * @param {string} content - 노트 내용
   */
  const analyzeNote = useCallback(async (content) => {
    if (!content || content.trim().length === 0) return null;
    
    try {
      setFeatureLoading('noteAnalysis', true);
      setError(null);
      
      const response = await api.analyzeNote(content);
      
      // 각 기능별 결과를 저장
      if (response.data.spellCheck) {
        setFeatureResult('spellCheck', response.data.spellCheck);
      }
      if (response.data.tagRecommendation) {
        setFeatureResult('tagRecommendation', response.data.tagRecommendation);
      }
      if (response.data.summary) {
        setFeatureResult('summaryGeneration', response.data.summary);
      }
      
      setFeatureResult('noteAnalysis', response.data);
      
      return response.data;
      
    } catch (error) {
      setError(`노트 분석 실패: ${error.message}`);
      console.error('노트 분석 실패:', error);
      return null;
    } finally {
      setFeatureLoading('noteAnalysis', false);
    }
  }, [setFeatureLoading, setFeatureResult]);
  
  /**
   * AI 기능 결과 적용
   * @param {string} feature - 기능 타입
   * @param {*} data - 적용할 데이터
   */
  const applyAIResult = useCallback((feature, data) => {
    switch (feature) {
      case AI_FEATURES.SPELL_CHECK:
        // 맞춤법 교정 결과 적용
        if (data && data.correctedText) {
          return data.correctedText;
        }
        break;
        
      case AI_FEATURES.TAG_RECOMMENDATION:
        // 추천 태그 적용
        if (data && data.recommendedTags) {
          return data.recommendedTags;
        }
        break;
        
      case AI_FEATURES.SUMMARY_GENERATION:
        // 생성된 요약 적용
        if (data && data.summary) {
          return data.summary;
        }
        break;
        
      default:
        return data;
    }
    
    return null;
  }, []);
  
  /**
   * 특정 기능의 결과 클리어
   * @param {string} feature - 클리어할 기능
   */
  const clearResult = useCallback((feature) => {
    setFeatureResult(feature, null);
  }, [setFeatureResult]);
  
  /**
   * 모든 결과 클리어
   */
  const clearAllResults = useCallback(() => {
    setResults({
      spellCheck: null,
      tagRecommendation: null,
      summaryGeneration: null,
      noteAnalysis: null
    });
  }, []);
  
  /**
   * 에러 클리어
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * AI 기능 사용 가능 여부 확인
   * @param {string} feature - 확인할 기능
   */
  const isFeatureAvailable = useCallback((feature) => {
    // 실제로는 사용자 구독 상태나 API 키 존재 여부 등을 확인
    return true;
  }, []);
  
  /**
   * AI 기능의 현재 로딩 상태 확인
   */
  const isAnyLoading = Object.values(loading).some(isLoading => isLoading);
  
  return {
    // 상태
    loading,
    results,
    error,
    isAnyLoading,
    
    // AI 기능 함수
    checkSpelling,
    recommendTags,
    generateSummary,
    analyzeNote,
    
    // 유틸리티 함수
    applyAIResult,
    clearResult,
    clearAllResults,
    clearError,
    isFeatureAvailable,
    
    // 개별 결과 접근자
    spellCheckResult: results.spellCheck,
    tagRecommendationResult: results.tagRecommendation,
    summaryResult: results.summaryGeneration,
    analysisResult: results.noteAnalysis,
    
    // 개별 로딩 상태
    isSpellChecking: loading.spellCheck,
    isRecommendingTags: loading.tagRecommendation,
    isGeneratingSummary: loading.summaryGeneration,
    isAnalyzingNote: loading.noteAnalysis
  };
};