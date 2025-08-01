/**
 * 포맷 처리 훅 (ProseMirror 텍스트 포맷팅)
 * 
 * @description ProseMirror 기반의 텍스트 포맷팅 로직
 * @author AI Assistant
 * @version 2.0.0
 */

import { useCallback } from 'react';
import { 
  isValidColor, 
  validateFontSize, 
  validateFontFamily, 
  isValidUrl, 
  escapeHtml,
  isValidCssValue 
} from '../utils/inputValidator';

export const useFormatHandler = (selection, onFormatChange, addRecentColor) => {
  // ProseMirror 텍스트 포맷팅 적용
  const applyProseMirrorFormat = useCallback((cmd, value = null) => {
    // 현재 포커스된 블록의 핸들러를 찾기
    const currentBlockId = window.currentProseMirrorBlock;
    let formatHandler = null;
    
    if (currentBlockId && window.proseMirrorFormats && window.proseMirrorFormats[currentBlockId]) {
      formatHandler = window.proseMirrorFormats[currentBlockId];
      console.log('Using format handler for block:', currentBlockId);
    } else if (window.proseMirrorFormats && window.proseMirrorFormats['default']) {
      formatHandler = window.proseMirrorFormats['default'];
      console.log('Using default format handler');
    } else if (window.applyProseMirrorFormat) {
      // 기존 방식 폴백
      formatHandler = window.applyProseMirrorFormat;
      console.log('Using legacy format handler');
    }
    
    if (!formatHandler) {
      console.warn('No ProseMirror format handler available');
      return;
    }

    try {
      console.log('Applying ProseMirror text format:', cmd, value);
      formatHandler(cmd, value);
      onFormatChange?.(cmd, value);
    } catch (error) {
      console.error('Error applying ProseMirror text format:', error);
    }
  }, [onFormatChange]);

  // 포맷 적용 (텍스트 포맷팅만)
  const applyFormat = useCallback((cmd, value = null) => {
    // 기본 검증
    if (!cmd || typeof cmd !== 'string') {
      console.error('Invalid command provided:', cmd);
      return;
    }

    if (!selection) {
      console.warn('No selection available');
      return;
    }

    // 입력값 검증
    if (value !== null) {
      switch (cmd) {
        case 'color':
        case 'backgroundColor':
          if (!isValidColor(value)) {
            console.warn(`Invalid color value: ${value}`);
            return;
          }
          break;
        case 'fontSize':
          const validSize = validateFontSize(value);
          if (!validSize) {
            console.warn(`Invalid font size: ${value}`);
            return;
          }
          value = validSize;
          break;
        case 'fontFamily':
          const validFont = validateFontFamily(value);
          if (!validFont) {
            console.warn(`Invalid font family: ${value}`);
            return;
          }
          value = validFont;
          break;
        case 'link':
          if (value && !isValidUrl(value)) {
            console.warn(`Invalid URL: ${value}`);
            return;
          }
          break;
      }
    }

    // 색상 관련 명령어일 때 최근 색상에 추가
    if ((cmd === 'color' || cmd === 'backgroundColor') && value && addRecentColor) {
      try {
        addRecentColor(value);
      } catch (error) {
        console.error('Error adding recent color:', error);
      }
    }

    // 텍스트 포맷팅 명령어들만 처리
    const textFormatCommands = [
      'bold', 'italic', 'underline', 'strike', 'code', 'link',
      'color', 'backgroundColor', 'fontSize', 'fontFamily',
      'alignLeft', 'alignCenter', 'alignRight'
    ];

    if (textFormatCommands.includes(cmd)) {
      // 텍스트 포맷팅 적용
      applyProseMirrorFormat(cmd, value);
    } else {
      console.warn('Unknown text format command:', cmd);
    }
  }, [selection, onFormatChange, addRecentColor, applyProseMirrorFormat]);

  return { applyFormat };
}; 