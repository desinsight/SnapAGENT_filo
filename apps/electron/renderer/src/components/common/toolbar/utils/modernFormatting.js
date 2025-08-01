/**
 * 현대적인 텍스트 포맷팅 유틸리티
 * 
 * @description document.execCommand 대신 사용할 현대적인 포맷팅 함수들
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * 기존 스타일을 병합하는 유틸리티 함수
 * @param {Element} element - 대상 요소
 * @param {Object} newStyles - 새로운 스타일 객체
 */
const mergeStyles = (element, newStyles) => {
  // 기존 스타일 보존하면서 새로운 스타일 적용
  Object.entries(newStyles).forEach(([property, value]) => {
    if (value !== undefined && value !== null) {
      element.style.setProperty(property, value, 'important');
    }
  });
};

/**
 * 선택된 텍스트에 스타일을 적용하는 안전한 방법
 * @param {Range} range - 선택된 범위
 * @param {string} tagName - 적용할 태그명
 * @param {Object} styles - 적용할 스타일 객체
 * @returns {boolean} - 성공 여부
 */
export const applyStyleToRange = (range, tagName = 'span', styles = {}) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    // 선택된 범위의 내용을 복제하여 기존 구조 보존
    const clonedContents = range.cloneContents();
    
    // span 요소 생성
    const element = document.createElement(tagName);
    
    // 새로운 스타일만 적용 (기존 스타일은 보존)
    Object.entries(styles).forEach(([property, value]) => {
      if (value !== undefined && value !== null) {
        // CSS 속성명 변환
        let cssProperty = property;
        if (property === 'fontSize') cssProperty = 'font-size';
        if (property === 'fontFamily') cssProperty = 'font-family';
        if (property === 'fontWeight') cssProperty = 'font-weight';
        if (property === 'fontStyle') cssProperty = 'font-style';
        if (property === 'textAlign') cssProperty = 'text-align';
        if (property === 'backgroundColor') cssProperty = 'background-color';
        
        element.style.setProperty(cssProperty, value, 'important');
      }
    });
    
    // 복제된 내용을 span에 추가 (HTML 구조 보존)
    if (clonedContents.nodeType === Node.TEXT_NODE) {
      element.appendChild(clonedContents);
    } else {
      // DocumentFragment인 경우 자식들을 이동
      while (clonedContents.firstChild) {
        element.appendChild(clonedContents.firstChild);
      }
    }
    
    // 기존 콘텐츠 교체
    range.deleteContents();
    range.insertNode(element);
    
    return true;
  } catch (error) {
    console.error('Style application failed:', error);
    return false;
  }
};

/**
 * 볼드 스타일 적용
 * @param {Range} range - 선택된 범위
 * @returns {boolean} - 성공 여부
 */
export const applyBold = (range) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    const strong = document.createElement('strong');
    strong.textContent = selectedText;
    
    range.deleteContents();
    range.insertNode(strong);
    
    return true;
  } catch (error) {
    console.error('Bold application failed:', error);
    return false;
  }
};

/**
 * 이탤릭 스타일 적용
 * @param {Range} range - 선택된 범위
 * @returns {boolean} - 성공 여부
 */
export const applyItalic = (range) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    const em = document.createElement('em');
    em.textContent = selectedText;
    
    range.deleteContents();
    range.insertNode(em);
    
    return true;
  } catch (error) {
    console.error('Italic application failed:', error);
    return false;
  }
};

/**
 * 언더라인 스타일 적용
 * @param {Range} range - 선택된 범위
 * @returns {boolean} - 성공 여부
 */
export const applyUnderline = (range) => {
  return applyStyleToRange(range, 'span', { textDecoration: 'underline' });
};

/**
 * 취소선 스타일 적용
 * @param {Range} range - 선택된 범위
 * @returns {boolean} - 성공 여부
 */
export const applyStrikethrough = (range) => {
  return applyStyleToRange(range, 'span', { textDecoration: 'line-through' });
};

/**
 * 색상 적용
 * @param {Range} range - 선택된 범위
 * @param {string} color - 적용할 색상
 * @returns {boolean} - 성공 여부
 */
export const applyColor = (range, color) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    // 선택된 범위 내의 모든 요소에 색상 적용
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    let applied = false;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.setProperty('color', color, 'important');
        applied = true;
      }
    }
    
    // 요소가 없는 경우 (텍스트 노드만 있는 경우) span으로 감싸기
    if (!applied) {
      const span = document.createElement('span');
      span.style.setProperty('color', color, 'important');
      
      const clonedContents = range.cloneContents();
      if (clonedContents.nodeType === Node.TEXT_NODE) {
        span.appendChild(clonedContents);
      } else {
        while (clonedContents.firstChild) {
          span.appendChild(clonedContents.firstChild);
        }
      }
      
      range.deleteContents();
      range.insertNode(span);
      applied = true;
    }
    
    return applied;
  } catch (error) {
    console.error('Color application failed:', error);
    return false;
  }
};

/**
 * 배경색 적용
 * @param {Range} range - 선택된 범위
 * @param {string} backgroundColor - 적용할 배경색
 * @returns {boolean} - 성공 여부
 */
export const applyBackgroundColor = (range, backgroundColor) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    // 선택된 범위 내의 모든 요소에 배경색 적용
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    let applied = false;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.setProperty('background-color', backgroundColor, 'important');
        applied = true;
      }
    }
    
    // 요소가 없는 경우 (텍스트 노드만 있는 경우) span으로 감싸기
    if (!applied) {
      const span = document.createElement('span');
      span.style.setProperty('background-color', backgroundColor, 'important');
      
      const clonedContents = range.cloneContents();
      if (clonedContents.nodeType === Node.TEXT_NODE) {
        span.appendChild(clonedContents);
      } else {
        while (clonedContents.firstChild) {
          span.appendChild(clonedContents.firstChild);
        }
      }
      
      range.deleteContents();
      range.insertNode(span);
      applied = true;
    }
    
    return applied;
  } catch (error) {
    console.error('Background color application failed:', error);
    return false;
  }
};

/**
 * 폰트 크기 적용
 * @param {Range} range - 선택된 범위
 * @param {string} fontSize - 적용할 폰트 크기
 * @returns {boolean} - 성공 여부
 */
export const applyFontSize = (range, fontSize) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    // 선택된 범위 내의 모든 요소에 폰트 크기 적용
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    let applied = false;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.setProperty('font-size', fontSize, 'important');
        applied = true;
      }
    }
    
    // 요소가 없는 경우 (텍스트 노드만 있는 경우) span으로 감싸기
    if (!applied) {
      const span = document.createElement('span');
      span.style.setProperty('font-size', fontSize, 'important');
      
      const clonedContents = range.cloneContents();
      if (clonedContents.nodeType === Node.TEXT_NODE) {
        span.appendChild(clonedContents);
      } else {
        while (clonedContents.firstChild) {
          span.appendChild(clonedContents.firstChild);
        }
      }
      
      range.deleteContents();
      range.insertNode(span);
      applied = true;
    }
    
    return applied;
  } catch (error) {
    console.error('Font size application failed:', error);
    return false;
  }
};

/**
 * 폰트 패밀리 적용
 * @param {Range} range - 선택된 범위
 * @param {string} fontFamily - 적용할 폰트 패밀리
 * @returns {boolean} - 성공 여부
 */
export const applyFontFamily = (range, fontFamily) => {
  if (!range || range.collapsed) return false;
  
  try {
    const selectedText = range.toString();
    if (!selectedText) return false;
    
    // 선택된 범위 내의 모든 요소에 폰트 패밀리 적용
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    let applied = false;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.setProperty('font-family', fontFamily, 'important');
        applied = true;
      }
    }
    
    // 요소가 없는 경우 (텍스트 노드만 있는 경우) span으로 감싸기
    if (!applied) {
      const span = document.createElement('span');
      span.style.setProperty('font-family', fontFamily, 'important');
      
      const clonedContents = range.cloneContents();
      if (clonedContents.nodeType === Node.TEXT_NODE) {
        span.appendChild(clonedContents);
      } else {
        while (clonedContents.firstChild) {
          span.appendChild(clonedContents.firstChild);
        }
      }
      
      range.deleteContents();
      range.insertNode(span);
      applied = true;
    }
    
    return applied;
  } catch (error) {
    console.error('Font family application failed:', error);
    return false;
  }
};

/**
 * 텍스트 정렬 적용
 * @param {Range} range - 선택된 범위
 * @param {string} alignment - 정렬 방식 (left, center, right)
 * @returns {boolean} - 성공 여부
 */
export const applyTextAlign = (range, alignment) => {
  try {
    // 선택된 텍스트의 부모 블록 요소 찾기
    const commonAncestor = range.commonAncestorContainer;
    let blockElement = commonAncestor.nodeType === Node.TEXT_NODE 
      ? commonAncestor.parentElement 
      : commonAncestor;
    
    // 가장 가까운 블록 레벨 요소 찾기 (contenteditable div)
    while (blockElement && !blockElement.hasAttribute('contenteditable')) {
      blockElement = blockElement.parentElement;
    }
    
    if (blockElement) {
      blockElement.style.textAlign = alignment;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Text alignment failed:', error);
    return false;
  }
};

/**
 * 코드 블록 적용
 * @param {Range} range - 선택된 범위
 * @returns {boolean} - 성공 여부
 */
export const applyCode = (range) => {
  return applyStyleToRange(range, 'code', { 
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '0.875em'
  });
};

/**
 * 링크 적용
 * @param {Range} range - 선택된 범위
 * @param {string} url - 링크 URL
 * @returns {boolean} - 성공 여부
 */
export const applyLink = (range, url) => {
  try {
    const selectedText = range.toString();
    if (!selectedText || !url) return false;
    
    const link = document.createElement('a');
    link.href = url;
    link.textContent = selectedText;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    range.deleteContents();
    range.insertNode(link);
    
    return true;
  } catch (error) {
    console.error('Link application failed:', error);
    return false;
  }
};

/**
 * 요소가 블록 레벨 요소인지 확인
 * @param {Element} element - 확인할 요소
 * @returns {boolean} - 블록 레벨 요소인지 여부
 */
const isBlockElement = (element) => {
  const blockElements = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DETAILS', 'DIALOG', 'DD', 'DIV',
    'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2',
    'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL',
    'P', 'PRE', 'SECTION', 'TABLE', 'UL'
  ];
  
  return blockElements.includes(element.tagName);
};

/**
 * Selection API를 사용한 안전한 포맷팅
 * @param {string} command - 포맷팅 명령
 * @param {string} value - 적용할 값
 * @returns {boolean} - 성공 여부
 */
export const applySafeFormatting = (command, value = null) => {
  console.log('applySafeFormatting called with:', command, value);
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    console.log('No selection available');
    return false;
  }
  
  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    console.log('Selection is collapsed');
    return false;
  }
  
  console.log('Selected text:', range.toString());
  console.log('Range:', range);
  
  let result = false;
  
  switch (command) {
    case 'bold':
      result = applyBold(range);
      break;
    case 'italic':
      result = applyItalic(range);
      break;
    case 'underline':
      result = applyUnderline(range);
      break;
    case 'strikethrough':
      result = applyStrikethrough(range);
      break;
    case 'code':
      result = applyCode(range);
      break;
    case 'color':
      result = applyColor(range, value);
      break;
    case 'backgroundColor':
      console.log('Applying backgroundColor:', value);
      result = applyBackgroundColor(range, value);
      console.log('Background color result:', result);
      break;
    case 'fontSize':
      result = applyFontSize(range, value);
      break;
    case 'fontFamily':
      result = applyFontFamily(range, value);
      break;
    case 'alignLeft':
      result = applyTextAlign(range, 'left');
      break;
    case 'alignCenter':
      result = applyTextAlign(range, 'center');
      break;
    case 'alignRight':
      result = applyTextAlign(range, 'right');
      break;
    case 'link':
      result = applyLink(range, value);
      break;
    default:
      console.log('Unknown command:', command);
      return false;
  }
  
  return result;
};