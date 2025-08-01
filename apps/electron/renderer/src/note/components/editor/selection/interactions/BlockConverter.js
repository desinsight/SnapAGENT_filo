/**
 * 블록 타입 변환 시스템
 * 
 * @description 다양한 블록 타입 간의 스마트한 변환을 처리
 * - 텍스트 → 헤딩: 텍스트를 헤딩으로 변환
 * - 헤딩 → 텍스트: 헤딩을 일반 텍스트로 변환
 * - 리스트 타입 변환: 불릿 ↔ 번호 ↔ 체크리스트
 * - 텍스트 → 리스트: 텍스트를 리스트 아이템으로 변환
 * - 스마트 변환: 내용 분석을 통한 최적 타입 제안
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

// 변환 규칙 정의
export const CONVERSION_RULES = {
  // 텍스트를 헤딩으로 변환
  TEXT_TO_HEADING: {
    sourceTypes: ['text'],
    targetTypes: ['heading1', 'heading2', 'heading3'],
    strategy: 'preserve_content',
    description: '텍스트를 헤딩으로 변환'
  },
  
  // 헤딩을 텍스트로 변환
  HEADING_TO_TEXT: {
    sourceTypes: ['heading1', 'heading2', 'heading3'],
    targetTypes: ['text'],
    strategy: 'preserve_content',
    description: '헤딩을 텍스트로 변환'
  },
  
  // 헤딩 레벨 변환
  HEADING_TO_HEADING: {
    sourceTypes: ['heading1', 'heading2', 'heading3'],
    targetTypes: ['heading1', 'heading2', 'heading3'],
    strategy: 'preserve_content',
    description: '헤딩 레벨 변환'
  },
  
  // 텍스트를 리스트로 변환
  TEXT_TO_LIST: {
    sourceTypes: ['text'],
    targetTypes: ['bulletList', 'numberedList', 'checkList'],
    strategy: 'convert_to_list_item',
    description: '텍스트를 리스트로 변환'
  },
  
  // 리스트를 텍스트로 변환
  LIST_TO_TEXT: {
    sourceTypes: ['bulletList', 'numberedList', 'checkList'],
    targetTypes: ['text'],
    strategy: 'extract_list_content',
    description: '리스트를 텍스트로 변환'
  },
  
  // 리스트 타입 간 변환
  LIST_TO_LIST: {
    sourceTypes: ['bulletList', 'numberedList', 'checkList'],
    targetTypes: ['bulletList', 'numberedList', 'checkList'],
    strategy: 'convert_list_type',
    description: '리스트 타입 변환'
  },
  
  // 텍스트를 인용구로 변환
  TEXT_TO_QUOTE: {
    sourceTypes: ['text'],
    targetTypes: ['quote'],
    strategy: 'preserve_content',
    description: '텍스트를 인용구로 변환'
  },
  
  // 인용구를 텍스트로 변환
  QUOTE_TO_TEXT: {
    sourceTypes: ['quote'],
    targetTypes: ['text'],
    strategy: 'preserve_content',
    description: '인용구를 텍스트로 변환'
  },
  
  // 다중 블록을 컬럼으로 변환
  MULTI_TO_COLUMN: {
    sourceTypes: ['text', 'heading1', 'heading2', 'heading3', 'quote'],
    targetTypes: ['column'],
    strategy: 'create_column_layout',
    description: '여러 블록을 컬럼 레이아웃으로 변환'
  }
};

// 스마트 변환 제안 패턴
const SMART_CONVERSION_PATTERNS = [
  {
    pattern: /^#{1,3}\s+(.+)/,
    targetType: 'heading1',
    description: '마크다운 헤딩 패턴 감지'
  },
  {
    pattern: /^[-*+]\s+(.+)/m,
    targetType: 'bulletList',
    description: '불릿 리스트 패턴 감지'
  },
  {
    pattern: /^\d+\.\s+(.+)/m,
    targetType: 'numberedList',
    description: '번호 리스트 패턴 감지'
  },
  {
    pattern: /^- \[ \]\s+(.+)/m,
    targetType: 'checkList',
    description: '체크리스트 패턴 감지'
  },
  {
    pattern: /^>\s+(.+)/m,
    targetType: 'quote',
    description: '인용구 패턴 감지'
  }
];

/**
 * 블록 변환 클래스
 */
export class BlockConverter {
  constructor(config = {}) {
    this.config = {
      preserveFormatting: true,
      smartSuggestions: true,
      maxConvertItems: 100,
      debugMode: false,
      ...config
    };
    
    if (this.config.debugMode) {
      console.log('🔄 BlockConverter initialized');
    }
  }
  
  /**
   * 블록 변환 실행
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {string} targetType - 타겟 타입
   * @param {Object} options - 변환 옵션
   * @returns {Object} 변환 결과
   */
  async convert(sourceBlocks, targetType, options = {}) {
    try {
      if (this.config.debugMode) {
        console.log('🎯 Converting blocks:', { sourceBlocks, targetType });
      }
      
      // 변환 규칙 찾기
      const rule = this.findConversionRule(sourceBlocks, targetType);
      if (!rule) {
        return {
          success: false,
          error: 'No compatible conversion rule found',
          sourceTypes: sourceBlocks.map(b => b.type),
          targetType
        };
      }
      
      // 전략에 따른 변환 실행
      let result;
      switch (rule.strategy) {
        case 'preserve_content':
          result = await this.preserveContentConversion(sourceBlocks, targetType, options);
          break;
          
        case 'convert_to_list_item':
          result = await this.convertToListItem(sourceBlocks, targetType, options);
          break;
          
        case 'extract_list_content':
          result = await this.extractListContent(sourceBlocks, targetType, options);
          break;
          
        case 'convert_list_type':
          result = await this.convertListType(sourceBlocks, targetType, options);
          break;
          
        case 'create_column_layout':
          result = await this.createColumnLayout(sourceBlocks, options);
          break;
          
        default:
          throw new Error(`Unknown conversion strategy: ${rule.strategy}`);
      }
      
      return {
        success: true,
        strategy: rule.strategy,
        rule: rule.description,
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
   * 내용 보존 변환 (텍스트 ↔ 헤딩, 헤딩 ↔ 헤딩 등)
   */
  async preserveContentConversion(sourceBlocks, targetType, options) {
    const changes = [];
    
    sourceBlocks.forEach(sourceBlock => {
      const convertedContent = this.extractTextContent(sourceBlock);
      
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldType: sourceBlock.type,
        newType: targetType,
        oldContent: sourceBlock.content,
        newContent: convertedContent,
        contentData: this.createContentData(targetType, convertedContent)
      });
    });
    
    return {
      data: {
        blocksConverted: sourceBlocks.length,
        conversions: sourceBlocks.map(block => ({
          from: block.type,
          to: targetType
        }))
      },
      changes
    };
  }
  
  /**
   * 텍스트를 리스트 아이템으로 변환
   */
  async convertToListItem(sourceBlocks, targetType, options) {
    const changes = [];
    
    sourceBlocks.forEach(sourceBlock => {
      const textContent = this.extractTextContent(sourceBlock);
      const listContent = this.createListContent(targetType, [textContent]);
      
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldType: sourceBlock.type,
        newType: targetType,
        oldContent: sourceBlock.content,
        newContent: listContent,
        contentData: this.createContentData(targetType, listContent),
        metadata: {
          ...sourceBlock.metadata,
          items: [{
            id: 'item-0',
            content: textContent,
            checked: targetType === 'checkList' ? false : undefined
          }]
        }
      });
    });
    
    return {
      data: {
        blocksConverted: sourceBlocks.length,
        listType: targetType,
        itemsCreated: sourceBlocks.length
      },
      changes
    };
  }
  
  /**
   * 리스트 내용을 텍스트로 추출
   */
  async extractListContent(sourceBlocks, targetType, options) {
    const changes = [];
    const separator = options.separator || '\n';
    
    sourceBlocks.forEach(sourceBlock => {
      const items = this.parseListItems(sourceBlock);
      const textContent = items.map(item => item.content).join(separator);
      
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldType: sourceBlock.type,
        newType: targetType,
        oldContent: sourceBlock.content,
        newContent: textContent,
        contentData: this.createContentData(targetType, textContent),
        metadata: this.cleanMetadata(sourceBlock.metadata)
      });
    });
    
    return {
      data: {
        blocksConverted: sourceBlocks.length,
        itemsExtracted: sourceBlocks.reduce((total, block) => 
          total + this.parseListItems(block).length, 0)
      },
      changes
    };
  }
  
  /**
   * 리스트 타입 변환 (불릿 ↔ 번호 ↔ 체크리스트)
   */
  async convertListType(sourceBlocks, targetType, options) {
    const changes = [];
    
    sourceBlocks.forEach(sourceBlock => {
      const items = this.parseListItems(sourceBlock);
      const convertedItems = items.map(item => ({
        ...item,
        checked: targetType === 'checkList' ? (item.checked ?? false) : undefined
      }));
      
      const listContent = this.createListContent(targetType, convertedItems.map(item => item.content));
      
      changes.push({
        action: 'update',
        blockId: sourceBlock.id,
        oldType: sourceBlock.type,
        newType: targetType,
        oldContent: sourceBlock.content,
        newContent: listContent,
        contentData: this.createContentData(targetType, listContent),
        metadata: {
          ...sourceBlock.metadata,
          items: convertedItems
        }
      });
    });
    
    return {
      data: {
        blocksConverted: sourceBlocks.length,
        fromType: sourceBlocks[0]?.type,
        toType: targetType,
        itemsConverted: sourceBlocks.reduce((total, block) => 
          total + this.parseListItems(block).length, 0)
      },
      changes
    };
  }
  
  /**
   * 컬럼 레이아웃 생성
   */
  async createColumnLayout(sourceBlocks, options) {
    const groupId = `column_group_${Date.now()}`;
    const changes = [];
    
    sourceBlocks.forEach((block, index) => {
      changes.push({
        action: 'update',
        blockId: block.id,
        oldMetadata: block.metadata || {},
        newMetadata: {
          ...block.metadata,
          isColumnBlock: true,
          columnIndex: index,
          totalColumns: sourceBlocks.length,
          groupId: groupId
        }
      });
    });
    
    return {
      data: {
        groupId,
        columnCount: sourceBlocks.length,
        layoutType: 'column'
      },
      changes
    };
  }
  
  /**
   * 스마트 변환 제안
   * @param {Object} block - 분석할 블록
   * @returns {Array} 제안된 변환 목록
   */
  suggestConversions(block) {
    if (!this.config.smartSuggestions) {
      return [];
    }
    
    const content = this.extractTextContent(block);
    const suggestions = [];
    
    // 패턴 기반 제안
    SMART_CONVERSION_PATTERNS.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        suggestions.push({
          targetType: pattern.targetType,
          confidence: 0.9,
          reason: pattern.description,
          preview: this.generateConversionPreview(block, pattern.targetType)
        });
      }
    });
    
    // 기본 변환 옵션
    const defaultSuggestions = this.getDefaultConversions(block.type);
    suggestions.push(...defaultSuggestions);
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 변환 가능성 검증
   */
  validateConvert(sourceBlocks, targetType) {
    if (!targetType) {
      return { isValid: false, error: 'Target type is required for conversion' };
    }
    
    if (sourceBlocks.length > this.config.maxConvertItems) {
      return { 
        isValid: false, 
        error: `Too many blocks to convert (max: ${this.config.maxConvertItems})` 
      };
    }
    
    const rule = this.findConversionRule(sourceBlocks, targetType);
    if (!rule) {
      return { 
        isValid: false, 
        error: 'No compatible conversion rule found',
        sourceTypes: sourceBlocks.map(b => b.type),
        targetType
      };
    }
    
    return { isValid: true, rule: rule.description };
  }
  
  // ===== 유틸리티 메서드들 =====
  
  /**
   * 변환 규칙 찾기
   */
  findConversionRule(sourceBlocks, targetType) {
    const sourceTypes = sourceBlocks.map(block => block.type);
    
    for (const rule of Object.values(CONVERSION_RULES)) {
      const sourceCompatible = sourceTypes.every(type => rule.sourceTypes.includes(type));
      const targetCompatible = rule.targetTypes.includes(targetType);
      
      if (sourceCompatible && targetCompatible) {
        return rule;
      }
    }
    
    return null;
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
   * 리스트 내용 생성
   */
  createListContent(listType, items) {
    const markers = {
      bulletList: '•',
      numberedList: (index) => `${index + 1}.`,
      checkList: '☐'
    };
    
    const marker = markers[listType];
    
    return items.map((item, index) => {
      const markerText = typeof marker === 'function' ? marker(index) : marker;
      return `${markerText} ${item}`;
    }).join('\n');
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
  
  /**
   * 메타데이터 정리
   */
  cleanMetadata(metadata) {
    if (!metadata) return {};
    
    const { items, listType, ...cleanedMetadata } = metadata;
    return cleanedMetadata;
  }
  
  /**
   * 기본 변환 옵션 가져오기
   */
  getDefaultConversions(blockType) {
    const conversions = {
      text: [
        { targetType: 'heading1', confidence: 0.7, reason: '제목으로 변환' },
        { targetType: 'bulletList', confidence: 0.6, reason: '불릿 리스트로 변환' },
        { targetType: 'quote', confidence: 0.5, reason: '인용구로 변환' }
      ],
      heading1: [
        { targetType: 'text', confidence: 0.8, reason: '일반 텍스트로 변환' },
        { targetType: 'heading2', confidence: 0.7, reason: 'H2로 변환' }
      ],
      bulletList: [
        { targetType: 'numberedList', confidence: 0.8, reason: '번호 리스트로 변환' },
        { targetType: 'checkList', confidence: 0.7, reason: '체크리스트로 변환' }
      ]
    };
    
    return conversions[blockType] || [];
  }
  
  /**
   * 변환 미리보기 생성
   */
  generateConversionPreview(block, targetType) {
    const content = this.extractTextContent(block);
    
    switch (targetType) {
      case 'heading1':
        return `# ${content}`;
      case 'bulletList':
        return `• ${content}`;
      case 'numberedList':
        return `1. ${content}`;
      case 'checkList':
        return `☐ ${content}`;
      case 'quote':
        return `> ${content}`;
      default:
        return content;
    }
  }
}

export default BlockConverter;