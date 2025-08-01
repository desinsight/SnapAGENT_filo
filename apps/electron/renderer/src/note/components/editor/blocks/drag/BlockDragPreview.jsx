/**
 * 블록 드래그 미리보기 컴포넌트
 * 
 * @description 드래그 중인 블록들의 시각적 피드백을 제공하는 미리보기 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDragLayer } from 'react-dnd';

// RAF 스로틀링 유틸리티 (성능 최적화)
const rafThrottle = (func) => {
  let ticking = false;
  let lastArgs = null;
  
  return (...args) => {
    lastArgs = args;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(this, lastArgs);
        }
        ticking = false;
      });
      ticking = true;
    }
  };
};

// 성능 최적화를 위한 CSS 클래스
const PERFORMANCE_CLASSES = {
  gpuAccelerated: 'transform-gpu',
  willChange: 'will-change-transform',
  backfaceHidden: 'backface-hidden'
};

export const BlockDragPreview = () => {
  const {
    isDragging,
    item,
    currentOffset,
    initialOffset
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
    initialOffset: monitor.getInitialSourceClientOffset()
  }));

  const previewRef = useRef(null);

  // 블록 타입 라벨 (메모이제이션)
  const getBlockTypeLabel = useCallback((type) => {
    const typeLabels = {
      text: '텍스트',
      heading1: '제목 1',
      heading2: '제목 2',
      heading3: '제목 3',
      bulletList: '불릿 리스트',
      numberedList: '번호 리스트',
      checkList: '체크 리스트',
      quote: '인용구',
      code: '코드',
      image: '이미지',
      video: '비디오',
      audio: '오디오',
      file: '파일',
      table: '표',
      chart: '차트',
      timeline: '타임라인',
      board: '보드'
    };
    
    return typeLabels[type] || type;
  }, []);

  // 텍스트 추출 함수 (ProseMirror JSON 등 객체 지원)
  const extractText = (content) => {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object' && Array.isArray(content.content)) {
      // ProseMirror JSON 구조에서 텍스트 추출
      return content.content.map(node => node.text || extractText(node) || '').join('');
    }
    return '';
  };

  // 단일 블록 미리보기 (메모이제이션)
  const generateSingleBlockPreview = useCallback((block) => {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getBlockTypeLabel(block.type)}
          </span>
        </div>
        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {extractText(block.content) || '빈 블록'}
        </div>
      </div>
    );
  }, [getBlockTypeLabel]);

  // 다중 블록 미리보기 (메모이제이션)
  const generateMultipleBlocksPreview = useCallback((blocks) => {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {blocks.length}개 블록
          </span>
        </div>
        <div className="space-y-1">
          {blocks.slice(0, 3).map((block, index) => (
            <div key={index} className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {extractText(block.content) || '빈 블록'}
            </div>
          ))}
          {blocks.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{blocks.length - 3}개 더...
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // 병합 미리보기 (메모이제이션)
  const generateMergePreview = useCallback((blocks, targetType) => {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            병합 → {getBlockTypeLabel(targetType)}
          </span>
        </div>
        <div className="space-y-1">
          {blocks.slice(0, 3).map((block, index) => (
            <div key={index} className="text-sm text-gray-900 dark:text-gray-100 truncate flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
              {extractText(block.content) || '빈 블록'}
            </div>
          ))}
          {blocks.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{blocks.length - 3}개 더...
            </div>
          )}
        </div>
      </div>
    );
  }, [getBlockTypeLabel]);

  // 미리보기 콘텐츠 생성 (메모이제이션) - 성능 최적화
  const previewContent = useMemo(() => {
    if (!item || !isDragging) return null;
    
    switch (item.dragType) {
      case 'single':
        return generateSingleBlockPreview(item.block);
      case 'multiple':
        return generateMultipleBlocksPreview(item.blocks);
      case 'merge':
        return generateMergePreview(item.blocks, item.targetType);
      default:
        return null;
    }
  }, [item?.dragType, item?.block?.id, item?.blocks?.length, item?.targetType, isDragging, generateSingleBlockPreview, generateMultipleBlocksPreview, generateMergePreview]);

  // 드래그 힌트 텍스트 (메모이제이션) - 조건부 렌더링 전에 호출
  const dragHintText = useMemo(() => {
    return item?.dragType === 'merge' ? '병합하려면 여기에 드롭하세요' : '이동하려면 여기에 드롭하세요';
  }, [item?.dragType]);

  // 드래그 위치 스타일 계산
  const transformStyle = useMemo(() => {
    if (!currentOffset) return { opacity: 0 };
    
    return {
      opacity: 1,
      transform: `translate3d(${currentOffset.x}px, ${currentOffset.y}px, 0px)`,
      WebkitTransform: `translate3d(${currentOffset.x}px, ${currentOffset.y}px, 0px)`
    };
  }, [currentOffset?.x, currentOffset?.y]);

  // 드래그 중이 아니면 렌더링하지 않음
  if (!isDragging || !currentOffset || !previewContent) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
      <div
        ref={previewRef}
        className="absolute transform-gpu will-change-transform"
        style={{
          ...transformStyle,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint', // 최적화를 위한 containment
          pointerEvents: 'none' // 이벤트 차단으로 성능 향상
        }}
      >
        {/* 드래그 미리보기 */}
        <div className="opacity-90">
          {previewContent}
        </div>
        
        {/* 드래그 커서 */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        
        {/* 드래그 힌트 */}
        <div className="absolute top-full left-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
          {dragHintText}
        </div>
      </div>
      
      {/* 드래그 오버레이 */}
      <div className="absolute inset-0 bg-blue-500 bg-opacity-5 pointer-events-none" />
    </div>
  );
};

// 드래그 레이어 설정
export const DragLayer = ({ children }) => {
  return (
    <>
      {children}
      <BlockDragPreview />
    </>
  );
};

export default BlockDragPreview; 