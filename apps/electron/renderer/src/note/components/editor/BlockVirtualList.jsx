/**
 * 블록 가상화 리스트 컴포넌트
 * 
 * @description 대량의 블록을 효율적으로 렌더링하기 위한 가상화 컴포넌트
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const ITEM_HEIGHT = 60; // 예상 블록 높이
const BUFFER_SIZE = 5; // 위아래 버퍼 아이템 수

export const BlockVirtualList = ({
  blocks,
  renderBlock,
  className = "",
  estimatedItemHeight = ITEM_HEIGHT,
  bufferSize = BUFFER_SIZE
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);

  // 컨테이너 높이 계산
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // 스크롤 이벤트 핸들러 (디바운싱)
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // 가상화 계산
  const virtualizationData = useMemo(() => {
    const totalHeight = blocks.length * estimatedItemHeight;
    const visibleCount = Math.ceil(containerHeight / estimatedItemHeight);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - bufferSize);
    const endIndex = Math.min(
      blocks.length - 1,
      Math.floor(scrollTop / estimatedItemHeight) + visibleCount + bufferSize
    );
    
    const visibleBlocks = blocks.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * estimatedItemHeight;
    
    return {
      totalHeight,
      startIndex,
      endIndex,
      visibleBlocks,
      offsetY
    };
  }, [blocks, scrollTop, containerHeight, estimatedItemHeight, bufferSize]);

  // 스크롤 위치로 이동
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      const targetScrollTop = index * estimatedItemHeight;
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [estimatedItemHeight]);

  // 블록 인덱스 찾기
  const findBlockIndex = useCallback((blockId) => {
    return blocks.findIndex(block => block.id === blockId);
  }, [blocks]);

  // 특정 블록으로 스크롤
  const scrollToBlock = useCallback((blockId) => {
    const index = findBlockIndex(blockId);
    if (index !== -1) {
      scrollToIndex(index);
    }
  }, [findBlockIndex, scrollToIndex]);

  return (
    <div
      ref={containerRef}
      className={`block-virtual-list ${className}`}
      style={{
        height: '100%',
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* 전체 높이를 위한 스페이서 */}
      <div style={{ height: virtualizationData.totalHeight }}>
        {/* 가시 영역 블록들 */}
        <div
          style={{
            position: 'absolute',
            top: virtualizationData.offsetY,
            left: 0,
            right: 0
          }}
        >
          {virtualizationData.visibleBlocks.map((block, index) => {
            const actualIndex = virtualizationData.startIndex + index;
            return (
              <div key={block.id} style={{ height: estimatedItemHeight }}>
                {renderBlock(block, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// PropTypes 정의
BlockVirtualList.propTypes = {
  blocks: PropTypes.array.isRequired,
  renderBlock: PropTypes.func.isRequired,
  className: PropTypes.string,
  estimatedItemHeight: PropTypes.number,
  bufferSize: PropTypes.number
};

export default BlockVirtualList; 