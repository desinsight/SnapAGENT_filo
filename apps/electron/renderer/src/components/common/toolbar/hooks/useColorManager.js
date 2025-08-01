/**
 * 색상 관리 훅
 * 
 * @description 최근 색상 저장/관리 로직
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

export const useColorManager = () => {
  // 로컬 스토리지에서 최근 색상과 즐겨찾기 로드
  const [recentColors, setRecentColors] = useState(() => {
    try {
      const stored = localStorage.getItem('toolbar-recent-colors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 최근 색상 추가 함수
  const addRecentColor = useCallback((color) => {
    if (!color || typeof color !== 'string') {
      console.warn('useColorManager: Invalid color provided:', color);
      return;
    }
    
    try {
      const newRecentColors = [color, ...recentColors.filter(c => c !== color)].slice(0, 10);
      setRecentColors(newRecentColors);
      localStorage.setItem('toolbar-recent-colors', JSON.stringify(newRecentColors));
    } catch (error) {
      console.error('useColorManager: Error saving recent colors:', error);
    }
  }, [recentColors]);

  return {
    recentColors,
    addRecentColor
  };
};