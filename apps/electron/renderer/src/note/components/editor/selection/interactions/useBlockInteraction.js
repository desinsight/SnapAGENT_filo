/**
 * 블록 상호작용 훅
 * 
 * @description React 훅을 통한 블록 상호작용 시스템 사용
 * - 병합, 변환, 분할 등의 블록 상호작용 제공
 * - 상태 관리와 이벤트 처리를 간편하게 사용할 수 있는 인터페이스
 * - 실시간 상호작용 피드백과 오류 처리
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { InteractionManager, INTERACTION_TYPES, INTERACTION_RESULTS } from './InteractionManager';

/**
 * 블록 상호작용 훅
 * @param {Object} config - 설정 옵션
 * @returns {Object} 상호작용 인터페이스
 */
export const useBlockInteraction = (config = {}) => {
  const managerRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  
  // InteractionManager 초기화
  useEffect(() => {
    managerRef.current = new InteractionManager({
      debugMode: false,
      enableAnimations: true,
      maxHistorySize: 50,
      ...config
    });
    
    // 이벤트 리스너 등록
    const manager = managerRef.current;
    
    manager.on('interaction:completed', (result) => {
      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 49)]);
      setError(null);
    });
    
    manager.on('interaction:error', (errorResult) => {
      setError(errorResult.error);
      setLastResult(errorResult);
    });
    
    return () => {
      manager.destroy();
    };
  }, []);
  
  /**
   * 블록 병합 실행
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {Object} targetBlock - 타겟 블록
   * @param {Object} options - 병합 옵션
   * @returns {Promise<Object>} 병합 결과
   */
  const mergeBlocks = useCallback(async (sourceBlocks, targetBlock, options = {}) => {
    if (!managerRef.current) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await managerRef.current.executeInteraction({
        type: INTERACTION_TYPES.MERGE,
        sourceBlocks,
        targetBlock,
        options
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 블록 변환 실행
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {string} targetType - 타겟 타입
   * @param {Object} options - 변환 옵션
   * @returns {Promise<Object>} 변환 결과
   */
  const convertBlocks = useCallback(async (sourceBlocks, targetType, options = {}) => {
    if (!managerRef.current) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await managerRef.current.executeInteraction({
        type: INTERACTION_TYPES.CONVERT,
        sourceBlocks,
        options: { ...options, targetType }
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 블록 분할 실행
   * @param {Object} sourceBlock - 소스 블록
   * @param {Object} options - 분할 옵션
   * @returns {Promise<Object>} 분할 결과
   */
  const splitBlock = useCallback(async (sourceBlock, options = {}) => {
    if (!managerRef.current) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await managerRef.current.executeInteraction({
        type: INTERACTION_TYPES.SPLIT,
        sourceBlocks: [sourceBlock],
        options
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 블록 그룹 생성
   * @param {Array} blocks - 그룹화할 블록들
   * @param {Object} options - 그룹 옵션
   * @returns {Promise<Object>} 그룹 생성 결과
   */
  const createGroup = useCallback(async (blocks, options = {}) => {
    if (!managerRef.current) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await managerRef.current.executeInteraction({
        type: INTERACTION_TYPES.GROUP,
        sourceBlocks: blocks,
        options
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 블록 그룹 해제
   * @param {Array} blocks - 그룹 해제할 블록들
   * @param {Object} options - 해제 옵션
   * @returns {Promise<Object>} 그룹 해제 결과
   */
  const ungroupBlocks = useCallback(async (blocks, options = {}) => {
    if (!managerRef.current) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await managerRef.current.executeInteraction({
        type: INTERACTION_TYPES.UNGROUP,
        sourceBlocks: blocks,
        options
      });
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 상호작용 가능성 검증
   * @param {string} interactionType - 상호작용 타입
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {Object} targetBlock - 타겟 블록 (선택사항)
   * @param {Object} options - 추가 옵션들
   * @returns {Object} 검증 결과
   */
  const validateInteraction = useCallback((interactionType, sourceBlocks, targetBlock = null, options = {}) => {
    if (!managerRef.current) return { isValid: false, error: 'Manager not initialized' };
    
    const interaction = {
      type: interactionType,
      sourceBlocks,
      targetBlock,
      options
    };
    
    return managerRef.current.validateInteraction(interaction);
  }, []);
  
  /**
   * 병합 가능성 확인
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {Object} targetBlock - 타겟 블록
   * @returns {Object} 검증 결과
   */
  const canMerge = useCallback((sourceBlocks, targetBlock) => {
    return validateInteraction(INTERACTION_TYPES.MERGE, sourceBlocks, targetBlock);
  }, [validateInteraction]);
  
  /**
   * 변환 가능성 확인
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {string} targetType - 타겟 타입
   * @returns {Object} 검증 결과
   */
  const canConvert = useCallback((sourceBlocks, targetType) => {
    return validateInteraction(INTERACTION_TYPES.CONVERT, sourceBlocks, null, { targetType });
  }, [validateInteraction]);
  
  /**
   * 분할 가능성 확인
   * @param {Object} sourceBlock - 소스 블록
   * @param {Object} options - 분할 옵션
   * @returns {Object} 검증 결과
   */
  const canSplit = useCallback((sourceBlock, options = {}) => {
    return validateInteraction(INTERACTION_TYPES.SPLIT, [sourceBlock], null, options);
  }, [validateInteraction]);
  
  /**
   * 병합 제안 가져오기
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {Object} targetBlock - 타겟 블록
   * @returns {Object} 병합 제안
   */
  const getMergeSuggestions = useCallback((sourceBlocks, targetBlock) => {
    if (!managerRef.current) return null;
    
    const rule = managerRef.current.merger.findMergeRule(sourceBlocks, targetBlock);
    if (!rule) return null;
    
    return {
      strategy: rule.strategy,
      description: rule.description,
      preview: `${sourceBlocks.length}개 블록을 ${targetBlock.type}에 ${rule.description}`
    };
  }, []);
  
  /**
   * 변환 제안 가져오기
   * @param {Array} sourceBlocks - 소스 블록들
   * @returns {Array} 변환 제안 목록
   */
  const getConversionSuggestions = useCallback((sourceBlocks) => {
    if (!managerRef.current || sourceBlocks.length === 0) return [];
    
    // 첫 번째 블록을 기준으로 제안 생성
    const firstBlock = sourceBlocks[0];
    return managerRef.current.converter.suggestConversions(firstBlock);
  }, []);
  
  /**
   * 분할 제안 가져오기
   * @param {Object} sourceBlock - 소스 블록
   * @returns {Array} 분할 제안 목록
   */
  const getSplitSuggestions = useCallback((sourceBlock) => {
    if (!managerRef.current) return [];
    
    return managerRef.current.splitter.suggestSplits(sourceBlock);
  }, []);
  
  /**
   * 히스토리 조회
   * @param {Object} filters - 필터 조건
   * @returns {Array} 필터된 히스토리
   */
  const getHistory = useCallback((filters = {}) => {
    if (!managerRef.current) return [];
    
    return managerRef.current.getHistory(filters);
  }, []);
  
  /**
   * 통계 조회
   * @returns {Object} 상호작용 통계
   */
  const getStats = useCallback(() => {
    if (!managerRef.current) return {};
    
    return managerRef.current.getStats();
  }, []);
  
  /**
   * 오류 상태 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * 마지막 결과 초기화
   */
  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);
  
  /**
   * 히스토리 초기화
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  // 반환 인터페이스
  return {
    // 상태
    isProcessing,
    lastResult,
    error,
    history,
    
    // 메인 액션들
    mergeBlocks,
    convertBlocks,
    splitBlock,
    createGroup,
    ungroupBlocks,
    
    // 검증 함수들
    validateInteraction,
    canMerge,
    canConvert,
    canSplit,
    
    // 제안 함수들
    getMergeSuggestions,
    getConversionSuggestions,
    getSplitSuggestions,
    
    // 유틸리티 함수들
    getHistory,
    getStats,
    clearError,
    clearLastResult,
    clearHistory,
    
    // 상수들
    INTERACTION_TYPES,
    INTERACTION_RESULTS
  };
};

/**
 * 간단한 병합 훅
 * @param {Function} onMergeComplete - 병합 완료 콜백
 * @returns {Object} 병합 인터페이스
 */
export const useBlockMerge = (onMergeComplete) => {
  const { mergeBlocks, canMerge, getMergeSuggestions, isProcessing, error } = useBlockInteraction();
  
  const handleMerge = useCallback(async (sourceBlocks, targetBlock, options = {}) => {
    const result = await mergeBlocks(sourceBlocks, targetBlock, options);
    
    if (result?.result === INTERACTION_RESULTS.SUCCESS && onMergeComplete) {
      onMergeComplete(result);
    }
    
    return result;
  }, [mergeBlocks, onMergeComplete]);
  
  return {
    mergeBlocks: handleMerge,
    canMerge,
    getMergeSuggestions,
    isProcessing,
    error
  };
};

/**
 * 간단한 변환 훅
 * @param {Function} onConvertComplete - 변환 완료 콜백
 * @returns {Object} 변환 인터페이스
 */
export const useBlockConvert = (onConvertComplete) => {
  const { convertBlocks, canConvert, getConversionSuggestions, isProcessing, error } = useBlockInteraction();
  
  const handleConvert = useCallback(async (sourceBlocks, targetType, options = {}) => {
    const result = await convertBlocks(sourceBlocks, targetType, options);
    
    if (result?.result === INTERACTION_RESULTS.SUCCESS && onConvertComplete) {
      onConvertComplete(result);
    }
    
    return result;
  }, [convertBlocks, onConvertComplete]);
  
  return {
    convertBlocks: handleConvert,
    canConvert,
    getConversionSuggestions,
    isProcessing,
    error
  };
};

/**
 * 간단한 분할 훅
 * @param {Function} onSplitComplete - 분할 완료 콜백
 * @returns {Object} 분할 인터페이스
 */
export const useBlockSplit = (onSplitComplete) => {
  const { splitBlock, canSplit, getSplitSuggestions, isProcessing, error } = useBlockInteraction();
  
  const handleSplit = useCallback(async (sourceBlock, options = {}) => {
    const result = await splitBlock(sourceBlock, options);
    
    if (result?.result === INTERACTION_RESULTS.SUCCESS && onSplitComplete) {
      onSplitComplete(result);
    }
    
    return result;
  }, [splitBlock, onSplitComplete]);
  
  return {
    splitBlock: handleSplit,
    canSplit,
    getSplitSuggestions,
    isProcessing,
    error
  };
};

export default useBlockInteraction;