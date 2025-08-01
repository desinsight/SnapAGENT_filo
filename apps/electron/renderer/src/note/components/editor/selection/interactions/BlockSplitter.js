/**
 * 블록 분할 시스템
 * 
 * @description 블록 내용을 여러 블록으로 나누는 고급 분할 기능
 * - 텍스트 분할: 커서 위치, 문단 단위, 문장 단위로 분할
 * - 리스트 분할: 아이템 단위로 개별 블록 생성
 * - 헤딩 분할: 계층 구조를 고려한 분할
 * - 스마트 분할: 내용 분석을 통한 최적 분할점 제안
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

// 분할 전략 정의
export const SPLIT_STRATEGIES = {
  // 커서 위치에서 분할
  CURSOR_POSITION: {
    name: 'cursor_position',
    description: '커서 위치에서 블록을 두 개로 분할',
    supportedTypes: ['text', 'heading1', 'heading2', 'heading3', 'quote']
  },
  
  // 문단 단위 분할
  PARAGRAPH_SPLIT: {
    name: 'paragraph_split',
    description: '문단(줄바꿈) 단위로 블록 분할',
    supportedTypes: ['text', 'quote']
  },
  
  // 문장 단위 분할
  SENTENCE_SPLIT: {
    name: 'sentence_split',
    description: '문장 단위로 블록 분할',
    supportedTypes: ['text', 'heading1', 'heading2', 'heading3', 'quote']
  },
  
  // 리스트 아이템 분할
  LIST_ITEM_SPLIT: {
    name: 'list_item_split',
    description: '리스트 아이템을 개별 블록으로 분할',
    supportedTypes: ['bulletList', 'numberedList', 'checkList']
  },
  
  // 단어 단위 분할
  WORD_SPLIT: {
    name: 'word_split',
    description: '단어 단위로 블록 분할',
    supportedTypes: ['text', 'heading1', 'heading2', 'heading3']
  },
  
  // 스마트 분할 (자동 분할점 감지)
  SMART_SPLIT: {
    name: 'smart_split',
    description: '내용 분석을 통한 최적 분할점 자동 감지',
    supportedTypes: ['text', 'quote']
  }
};

// 분할점 감지 패턴
const SPLIT_POINT_PATTERNS = [
  {
    pattern: /\n\n+/g,
    priority: 10,
    description: '빈 줄로 구분된 문단'
  },
  {
    pattern: /[.!?]\s+(?=[A-Z가-힣])/g,
    priority: 8,
    description: '문장 끝 감지'
  },
  {
    pattern: /[,;]\s+/g,
    priority: 5,
    description: '절 구분점'
  },
  {
    pattern: /\s+-\s+/g,
    priority: 7,
    description: '대시로 구분된 항목'
  },
  {
    pattern: /^\d+\.\s+/gm,
    priority: 9,
    description: '번호 목록 항목'
  }
];

/**
 * 블록 분할 클래스
 */
export class BlockSplitter {
  constructor(config = {}) {
    this.config = {
      maxSplitParts: 20,
      minPartLength: 1,
      preserveFormatting: true,
      smartSplitting: true,
      debugMode: false,
      ...config
    };
    
    if (this.config.debugMode) {
      console.log('✂️ BlockSplitter initialized');
    }
  }
  
  /**
   * 블록 분할 실행
   * @param {Object} sourceBlock - 분할할 소스 블록
   * @param {Object} options - 분할 옵션
   * @returns {Object} 분할 결과
   */
  async split(sourceBlock, options = {}) {
    try {
      if (this.config.debugMode) {
        console.log('✂️ Splitting block:', sourceBlock);
      }
      
      // 분할 전략 결정
      const strategy = this.determineStrategy(sourceBlock, options);
      if (!this.isStrategySupportedForType(strategy, sourceBlock.type)) {
        return {
          success: false,
          error: `Strategy '${strategy}' not supported for block type '${sourceBlock.type}'`
        };
      }
      
      // 전략에 따른 분할 실행
      let result;
      switch (strategy) {
        case 'cursor_position':
          result = await this.splitAtCursor(sourceBlock, options);
          break;
          
        case 'paragraph_split':
          result = await this.splitByParagraph(sourceBlock, options);
          break;
          
        case 'sentence_split':
          result = await this.splitBySentence(sourceBlock, options);
          break;
          
        case 'list_item_split':
          result = await this.splitListItems(sourceBlock, options);
          break;
          
        case 'word_split':
          result = await this.splitByWord(sourceBlock, options);
          break;
          
        case 'smart_split':
          result = await this.smartSplit(sourceBlock, options);
          break;
          
        default:
          throw new Error(`Unknown split strategy: ${strategy}`);
      }
      
      return {
        success: true,
        strategy,
        ...result
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 커서 위치에서 분할
   */
  async splitAtCursor(sourceBlock, options) {
    const cursorPosition = options.cursorPosition || 0;
    const content = this.extractTextContent(sourceBlock);
    
    if (cursorPosition <= 0 || cursorPosition >= content.length) {
      return {
        success: false,
        error: 'Invalid cursor position for split'
      };
    }
    
    const beforeCursor = content.substring(0, cursorPosition).trim();
    const afterCursor = content.substring(cursorPosition).trim();
    
    const changes = [];
    const newBlocks = [];
    
    // 첫 번째 부분으로 원본 블록 업데이트
    if (beforeCursor) {
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldContent: sourceBlock.content,
        newContent: beforeCursor,
        contentData: this.createContentData(sourceBlock.type, beforeCursor)
      });
    } else {
      // 첫 번째 부분이 비어있으면 원본 블록 삭제
      changes.push({
        action: 'delete',
        blockId: sourceBlock.id
      });
    }
    
    // 두 번째 부분으로 새 블록 생성
    if (afterCursor) {
      const newBlockId = `block_${Date.now()}_1`;
      const newBlock = {
        id: newBlockId,
        type: sourceBlock.type,
        content: afterCursor,
        metadata: { ...sourceBlock.metadata }
      };
      
      newBlocks.push(newBlock);
      changes.push({
        action: 'insert',
        blockId: newBlockId,
        afterBlockId: sourceBlock.id,
        block: newBlock
      });
    }
    
    return {
      data: {
        splitAt: cursorPosition,
        partsCreated: beforeCursor && afterCursor ? 2 : 1,
        originalLength: content.length
      },
      changes,
      newBlocks
    };
  }
  
  /**
   * 문단 단위 분할
   */
  async splitByParagraph(sourceBlock, options) {
    const content = this.extractTextContent(sourceBlock);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    if (paragraphs.length <= 1) {
      return {
        success: false,
        error: 'No paragraph breaks found for splitting'
      };
    }
    
    return this.createMultipleSplitBlocks(sourceBlock, paragraphs, 'paragraph');
  }
  
  /**
   * 문장 단위 분할
   */
  async splitBySentence(sourceBlock, options) {
    const content = this.extractTextContent(sourceBlock);
    const sentences = this.splitIntoSentences(content);
    
    if (sentences.length <= 1) {
      return {
        success: false,
        error: 'No sentence breaks found for splitting'
      };
    }
    
    return this.createMultipleSplitBlocks(sourceBlock, sentences, 'sentence');
  }
  
  /**
   * 리스트 아이템 분할
   */
  async splitListItems(sourceBlock, options) {
    const items = this.parseListItems(sourceBlock);
    
    if (items.length <= 1) {
      return {
        success: false,
        error: 'List has only one item, cannot split'
      };
    }
    
    const changes = [];
    const newBlocks = [];
    
    // 첫 번째 아이템으로 원본 블록 업데이트
    const firstItem = items[0];
    changes.push({
      action: 'update',
      blockId: sourceBlock.id,
      oldContent: sourceBlock.content,
      newContent: firstItem.content,
      contentData: this.createContentData('text', firstItem.content),
      oldType: sourceBlock.type,
      newType: 'text'
    });
    
    // 나머지 아이템들을 개별 텍스트 블록으로 생성
    items.slice(1).forEach((item, index) => {
      const newBlockId = `block_${Date.now()}_${index + 1}`;
      const newBlock = {
        id: newBlockId,
        type: 'text',
        content: item.content,
        metadata: {}
      };
      
      newBlocks.push(newBlock);
      changes.push({
        action: 'insert',
        blockId: newBlockId,
        afterBlockId: index === 0 ? sourceBlock.id : `block_${Date.now()}_${index}`,
        block: newBlock
      });
    });
    
    return {
      data: {
        itemsSplit: items.length,
        originalType: sourceBlock.type,
        newType: 'text'
      },
      changes,
      newBlocks
    };
  }
  
  /**
   * 단어 단위 분할
   */
  async splitByWord(sourceBlock, options) {
    const content = this.extractTextContent(sourceBlock);
    const words = content.split(/\s+/).filter(word => word.trim());
    const wordsPerBlock = options.wordsPerBlock || 5;
    
    if (words.length <= wordsPerBlock) {
      return {
        success: false,
        error: `Not enough words to split (minimum ${wordsPerBlock + 1} words needed)`
      };
    }
    
    const chunks = [];
    for (let i = 0; i < words.length; i += wordsPerBlock) {
      chunks.push(words.slice(i, i + wordsPerBlock).join(' '));
    }
    
    return this.createMultipleSplitBlocks(sourceBlock, chunks, 'word');
  }
  
  /**
   * 스마트 분할 (자동 분할점 감지)
   */
  async smartSplit(sourceBlock, options) {
    const content = this.extractTextContent(sourceBlock);
    const splitPoints = this.findSmartSplitPoints(content);
    
    if (splitPoints.length === 0) {
      return {
        success: false,
        error: 'No suitable split points found'
      };
    }
    
    // 분할점을 기준으로 내용 분할
    const parts = [];
    let lastIndex = 0;
    
    splitPoints.forEach(point => {
      if (point.index > lastIndex) {
        const part = content.substring(lastIndex, point.index).trim();
        if (part) parts.push(part);
        lastIndex = point.index;
      }
    });
    
    // 마지막 부분 추가
    const lastPart = content.substring(lastIndex).trim();
    if (lastPart) parts.push(lastPart);
    
    if (parts.length <= 1) {
      return {
        success: false,
        error: 'Smart split resulted in single part'
      };
    }
    
    return this.createMultipleSplitBlocks(sourceBlock, parts, 'smart');
  }
  
  /**
   * 분할 가능성 검증
   */
  validateSplit(sourceBlock, options) {
    if (!sourceBlock) {
      return { isValid: false, error: 'Source block is required for split operation' };
    }
    
    const strategy = this.determineStrategy(sourceBlock, options);
    if (!this.isStrategySupportedForType(strategy, sourceBlock.type)) {
      return { 
        isValid: false, 
        error: `Strategy '${strategy}' not supported for block type '${sourceBlock.type}'`
      };
    }
    
    const content = this.extractTextContent(sourceBlock);
    if (content.length < this.config.minPartLength * 2) {
      return {
        isValid: false,
        error: 'Block content too short to split meaningfully'
      };
    }
    
    return { isValid: true, strategy };
  }
  
  /**
   * 분할 제안 생성
   * @param {Object} sourceBlock - 분석할 블록
   * @returns {Array} 분할 제안 목록
   */
  suggestSplits(sourceBlock) {
    const content = this.extractTextContent(sourceBlock);
    const suggestions = [];
    
    // 문단 분할 제안
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      suggestions.push({
        strategy: 'paragraph_split',
        partsCount: paragraphs.length,
        confidence: 0.9,
        description: `${paragraphs.length}개 문단으로 분할`
      });
    }
    
    // 문장 분할 제안
    const sentences = this.splitIntoSentences(content);
    if (sentences.length > 1) {
      suggestions.push({
        strategy: 'sentence_split',
        partsCount: sentences.length,
        confidence: 0.8,
        description: `${sentences.length}개 문장으로 분할`
      });
    }
    
    // 리스트 분할 제안 (리스트 타입만)
    if (['bulletList', 'numberedList', 'checkList'].includes(sourceBlock.type)) {
      const items = this.parseListItems(sourceBlock);
      if (items.length > 1) {
        suggestions.push({
          strategy: 'list_item_split',
          partsCount: items.length,
          confidence: 0.95,
          description: `${items.length}개 아이템을 개별 블록으로 분할`
        });
      }
    }
    
    // 스마트 분할 제안
    if (this.config.smartSplitting) {
      const splitPoints = this.findSmartSplitPoints(content);
      if (splitPoints.length > 0) {
        suggestions.push({
          strategy: 'smart_split',
          partsCount: splitPoints.length + 1,
          confidence: 0.7,
          description: '내용 분석을 통한 최적 분할'
        });
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  // ===== 유틸리티 메서드들 =====
  
  /**
   * 분할 전략 결정
   */
  determineStrategy(sourceBlock, options) {
    if (options.strategy) {
      return options.strategy;
    }
    
    // 블록 타입에 따른 기본 전략
    const defaultStrategies = {
      text: 'smart_split',
      heading1: 'sentence_split',
      heading2: 'sentence_split',
      heading3: 'sentence_split',
      quote: 'paragraph_split',
      bulletList: 'list_item_split',
      numberedList: 'list_item_split',
      checkList: 'list_item_split'
    };
    
    return defaultStrategies[sourceBlock.type] || 'cursor_position';
  }
  
  /**
   * 전략이 블록 타입을 지원하는지 확인
   */
  isStrategySupportedForType(strategy, blockType) {
    const strategyConfig = Object.values(SPLIT_STRATEGIES).find(s => s.name === strategy);
    return strategyConfig?.supportedTypes.includes(blockType) || false;
  }
  
  /**
   * 여러 블록으로 분할하는 공통 로직
   */
  async createMultipleSplitBlocks(sourceBlock, parts, splitType) {
    if (parts.length > this.config.maxSplitParts) {
      parts = parts.slice(0, this.config.maxSplitParts);
    }
    
    const changes = [];
    const newBlocks = [];
    
    // 첫 번째 부분으로 원본 블록 업데이트
    const firstPart = parts[0].trim();
    if (firstPart) {
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldContent: sourceBlock.content,
        newContent: firstPart,
        contentData: this.createContentData(sourceBlock.type, firstPart)
      });
    }
    
    // 나머지 부분들을 새 블록으로 생성
    parts.slice(1).forEach((part, index) => {
      const trimmedPart = part.trim();
      if (trimmedPart.length >= this.config.minPartLength) {
        const newBlockId = `block_${Date.now()}_${index + 1}`;
        const newBlock = {
          id: newBlockId,
          type: sourceBlock.type,
          content: trimmedPart,
          metadata: { ...sourceBlock.metadata }
        };
        
        newBlocks.push(newBlock);
        changes.push({
          action: 'insert',
          blockId: newBlockId,
          afterBlockId: index === 0 ? sourceBlock.id : `block_${Date.now()}_${index}`,
          block: newBlock
        });
      }
    });
    
    return {
      data: {
        splitType,
        partsCreated: 1 + newBlocks.length,
        originalLength: this.extractTextContent(sourceBlock).length
      },
      changes,
      newBlocks
    };
  }
  
  /**
   * 스마트 분할점 찾기
   */
  findSmartSplitPoints(content) {
    const splitPoints = [];
    
    SPLIT_POINT_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        splitPoints.push({
          index: match.index + match[0].length,
          priority: pattern.priority,
          type: pattern.description
        });
      }
    });
    
    // 우선순위와 위치로 정렬
    return splitPoints
      .sort((a, b) => b.priority - a.priority || a.index - b.index)
      .filter((point, index, arr) => {
        // 너무 가까운 분할점 제거
        return index === 0 || point.index - arr[index - 1].index > 10;
      });
  }
  
  /**
   * 텍스트를 문장으로 분할
   */
  splitIntoSentences(text) {
    return text
      .split(/[.!?]+\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }
  
  /**
   * 텍스트 내용 추출
   */
  extractTextContent(block) {
    if (typeof block.content === 'string') {
      return block.content;
    }
    
    if (typeof block.content === 'object' && block.content?.content) {
      return this.extractFromProseMirrorJSON(block.content);
    }
    
    return '';
  }
  
  /**
   * ProseMirror JSON에서 텍스트 추출
   */
  extractFromProseMirrorJSON(jsonContent) {
    if (!jsonContent.content) return '';
    
    let text = '';
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'text') {
          text += node.text || '';
        } else if (node.content) {
          traverse(node.content);
        }
      });
    };
    
    traverse(jsonContent.content);
    return text;
  }
  
  /**
   * 리스트 아이템 파싱
   */
  parseListItems(block) {
    if (block.metadata?.items) {
      return block.metadata.items;
    }
    
    const content = this.extractTextContent(block);
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => ({
      id: `item-${index}`,
      content: line.replace(/^[\d\-\*\+•☐☑]\s*/, '').trim(),
      checked: line.includes('☑') ? true : line.includes('☐') ? false : undefined
    }));
  }
  
  /**
   * 콘텐츠 데이터 생성
   */
  createContentData(blockType, content) {
    return {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: content
        }]
      }]
    };
  }
}

export default BlockSplitter;