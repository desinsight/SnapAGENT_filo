/**
 * 마크다운 포맷 변환 유틸리티
 * 
 * @description 선택된 텍스트를 마크다운 형식으로 변환하는 함수들
 * @author AI Assistant
 * @version 1.0.0
 */

// 마크다운 포맷 적용 함수
export const applyMarkdownFormat = (cmd, value, range) => {
  // 매개변수 검증
  if (!cmd || typeof cmd !== 'string') {
    console.error('applyMarkdownFormat: Invalid command provided:', cmd);
    return false;
  }
  
  if (!range || typeof range.toString !== 'function') {
    console.error('applyMarkdownFormat: Invalid range provided:', range);
    return false;
  }
  
  try {
    const selectedText = range.toString();
    let formattedText = selectedText;
    
    switch (cmd) {
    case 'h1':
      formattedText = `# ${selectedText}`;
      break;
    case 'h2':
      formattedText = `## ${selectedText}`;
      break;
    case 'h3':
      formattedText = `### ${selectedText}`;
      break;
    case 'bulletList':
      formattedText = `- ${selectedText}`;
      break;
    case 'numberedList':
      formattedText = `1. ${selectedText}`;
      break;
    case 'quote':
      formattedText = `> ${selectedText}`;
      break;
    case 'code':
      formattedText = `\`${selectedText}\``;
      break;
    case 'codeBlock':
      formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
      break;
    case 'divider':
      formattedText = `---`;
      break;
    case 'uppercase':
      formattedText = selectedText.toUpperCase();
      break;
    case 'lowercase':
      formattedText = selectedText.toLowerCase();
      break;
    case 'capitalize':
      formattedText = selectedText.replace(/\b\w/g, l => l.toUpperCase());
      break;
    case 'superscript':
      formattedText = `<sup>${selectedText}</sup>`;
      break;
    case 'subscript':
      formattedText = `<sub>${selectedText}</sub>`;
      break;
    default:
      console.warn('applyMarkdownFormat: Unknown command:', cmd);
      return false;
  }
  
  // 선택된 텍스트를 포맷팅된 텍스트로 교체
  if (formattedText !== selectedText) {
    try {
      range.deleteContents();
      const textNode = document.createTextNode(formattedText);
      range.insertNode(textNode);
      return true;
    } catch (error) {
      console.error('applyMarkdownFormat: Error replacing text:', error);
      return false;
    }
  }
  
  return true;
  } catch (error) {
    console.error('applyMarkdownFormat: Error applying format:', error);
    return false;
  }
};

/**
 * 마크다운 포맷 제거 함수
 * @param {string} text - 마크다운 포맷이 적용된 텍스트
 * @returns {string} - 마크다운 포맷이 제거된 텍스트
 */
export const removeMarkdownFormat = (text) => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  try {
    return text
      .replace(/^#+\s+/, '') // 헤더 제거
      .replace(/^-\s+/, '') // 배어리스트 제거
      .replace(/^\d+\.\s+/, '') // 숫자리스트 제거
      .replace(/^>\s+/, '') // 인용문 제거
      .replace(/^```\n?|\n?```$/g, '') // 코드블럭 제거
      .replace(/^`|`$/g, '') // 인라인 코드 제거
      .replace(/^---$/g, ''); // 구분선 제거
  } catch (error) {
    console.error('removeMarkdownFormat: Error removing format:', error);
    return text;
  }
};