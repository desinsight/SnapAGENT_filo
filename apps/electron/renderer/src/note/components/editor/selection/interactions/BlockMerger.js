/**
 * 블록 병합 시스템
 * 
 * @description 다양한 블록 타입 간의 스마트한 병합을 처리
 * - 텍스트 → 리스트: 텍스트를 리스트 아이템으로 추가
 * - 리스트 → 리스트: 리스트 타입 변환 또는 아이템 병합
 * - 헤딩 → 헤딩: 레벨 통일 또는 내용 병합
 * - 스마트 병합: 자동으로 최적의 병합 방식 선택
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

// 전체 블록 타입 정의 (35개 타입)
const ALL_BLOCK_TYPES = [
  // 기본/텍스트 블록
  'text', 'heading1', 'heading2', 'heading3', 'quote', 'divider', 'code', 
  'bulletList', 'numberedList', 'checkList',
  
  // 미디어 블록  
  'image', 'video', 'audio', 'file', 'column', 'gallery',
  
  // 데이터/표 블록
  'table', 'chart', 'timeline', 'board', 'progressBar', 'rating',
  
  // 인터랙티브 블록
  'toggle', 'button', 'poll', 'comment', 'tag', 'alert',
  
  // 임베드/외부 블록
  'webEmbed', 'pdfEmbed', 'mermaid', 'math', 'customHTML', 'profile',
  
  // 페이지 블록
  'page'
];

// 통합 컨텐츠 이동 시스템 - 병합 규칙 정의
export const MERGE_RULES = {
  // === 텍스트 계열 병합 ===
  TEXT_TO_TEXT: {
    sourceTypes: ['text'],
    targetTypes: ['text'],
    strategy: 'content_concatenate',
    description: '텍스트 블록 내용 병합',
    priority: 10
  },
  
  TEXT_TO_LIST: {
    sourceTypes: ['text'],
    targetTypes: ['bulletList', 'numberedList', 'checkList'],
    strategy: 'append_as_item',
    description: '텍스트를 리스트 아이템으로 추가'
  },
  
  TEXT_TO_TOGGLE: {
    sourceTypes: ['text'],
    targetTypes: ['toggle'],
    strategy: 'wrap_in_toggle',
    description: '텍스트를 토글 블록으로 래핑'
  },
  
  TEXT_TO_CODE: {
    sourceTypes: ['text'],
    targetTypes: ['code'],
    strategy: 'wrap_in_code',
    description: '텍스트를 코드 블록으로 변환'
  },
  
  TEXT_TO_QUOTE: {
    sourceTypes: ['text'],
    targetTypes: ['quote'],
    strategy: 'wrap_in_quote',
    description: '텍스트를 인용구로 변환'
  },
  
  // === 리스트 계열 병합 ===
  LIST_TO_LIST: {
    sourceTypes: ['bulletList', 'numberedList', 'checkList'],
    targetTypes: ['bulletList', 'numberedList', 'checkList'],
    strategy: 'merge_items_or_convert',
    description: '리스트 아이템 병합 또는 타입 변환'
  },
  
  LIST_TO_TOGGLE: {
    sourceTypes: ['bulletList', 'numberedList', 'checkList'],
    targetTypes: ['toggle'],
    strategy: 'list_to_toggle',
    description: '리스트 아이템들을 토글 블록으로 변환'
  },
  
  LIST_TO_TEXT: {
    sourceTypes: ['bulletList', 'numberedList', 'checkList'],
    targetTypes: ['text'],
    strategy: 'extract_list_content',
    description: '리스트 내용을 텍스트로 추출'
  },
  
  // === 헤딩 계열 병합 ===
  HEADING_TO_HEADING: {
    sourceTypes: ['heading1', 'heading2', 'heading3'],
    targetTypes: ['heading1', 'heading2', 'heading3'],
    strategy: 'level_unify_or_merge',
    description: '헤딩 레벨 통일 또는 내용 병합'
  },
  
  HEADING_TO_TOGGLE: {
    sourceTypes: ['heading1', 'heading2', 'heading3'],
    targetTypes: ['toggle'],
    strategy: 'heading_to_toggle',
    description: '헤딩을 토글 제목으로 변환'
  },
  
  // === 토글 계열 병합 ===
  TOGGLE_TO_TOGGLE: {
    sourceTypes: ['toggle'],
    targetTypes: ['toggle'],
    strategy: 'merge_toggle_content',
    description: '토글 블록 내용 병합'
  },
  
  ANY_TO_TOGGLE: {
    sourceTypes: ALL_BLOCK_TYPES.filter(type => type !== 'toggle'),
    targetTypes: ['toggle'],
    strategy: 'wrap_in_toggle',
    description: '모든 블록을 토글로 래핑'
  },
  
  // === 코드 계열 병합 ===
  CODE_TO_CODE: {
    sourceTypes: ['code'],
    targetTypes: ['code'],
    strategy: 'merge_code_content',
    description: '코드 블록 내용 병합',
    priority: 10
  },
  
  // === 인용구 계열 병합 ===
  QUOTE_TO_QUOTE: {
    sourceTypes: ['quote'],
    targetTypes: ['quote'],
    strategy: 'content_concatenate',
    description: '인용구 블록 내용 병합',
    priority: 10
  },
  
  // === 미디어 계열 병합 ===
  IMAGE_TO_GALLERY: {
    sourceTypes: ['image'],
    targetTypes: ['gallery'],
    strategy: 'add_to_gallery',
    description: '이미지를 갤러리에 추가'
  },
  
  FILE_TO_FILE: {
    sourceTypes: ['file'],
    targetTypes: ['file'],
    strategy: 'merge_file_list',
    description: '파일 목록 병합'
  },
  
  // === 범용 병합 규칙 ===
  ANY_TO_TEXT: {
    sourceTypes: ALL_BLOCK_TYPES.filter(type => type !== 'text'),
    targetTypes: ['text'],
    strategy: 'extract_text_and_merge',
    description: '모든 블록의 텍스트 내용을 추출하여 병합'
  },
  
  ANY_TO_COLUMN: {
    sourceTypes: ALL_BLOCK_TYPES.filter(type => type !== 'column'),
    targetTypes: ['column'],
    strategy: 'add_to_column',
    description: '블록을 컬럼에 추가'
  },
  
  // === 컬럼 그룹 생성 ===
  MULTI_TO_COLUMN_GROUP: {
    sourceTypes: ALL_BLOCK_TYPES,
    targetTypes: ALL_BLOCK_TYPES,
    strategy: 'create_column_group',
    description: '선택된 블록들을 컬럼 그룹으로 변환',
    minSourceCount: 2
  },
  
  // === 최종 범용 규칙 (fallback) ===
  ANY_TO_ANY: {
    sourceTypes: ALL_BLOCK_TYPES,
    targetTypes: ALL_BLOCK_TYPES,
    strategy: 'universal_content_transfer',
    description: '범용 컨텐츠 이동 (내용 보존하며 타입 변환)',
    priority: -1 // 최저 우선순위 (다른 규칙이 없을 때만 사용)
  }
};

/**
 * 블록 병합 클래스
 */
export class BlockMerger {
  constructor(config = {}) {
    this.config = {
      preserveFormatting: true,
      smartMerging: true,
      maxMergeItems: 50,
      debugMode: false,
      ...config
    };
    
    if (this.config.debugMode) {
      console.log('🔗 BlockMerger initialized');
    }
  }
  
  /**
   * 블록 병합 실행
   * @param {Array} sourceBlocks - 소스 블록들
   * @param {Object} targetBlock - 타겟 블록
   * @param {Object} options - 병합 옵션
   * @returns {Object} 병합 결과
   */
  async merge(sourceBlocks, targetBlock, options = {}) {
    try {
      console.log('🔗 BlockMerger.merge 시작:', { sourceBlocks, targetBlock, options });
      
      // 병합 규칙 찾기
      const rule = this.findMergeRule(sourceBlocks, targetBlock);
      console.log('📋 찾은 병합 규칙:', rule);
      
      if (!rule) {
        const error = {
          success: false,
          error: 'No compatible merge rule found',
          sourceTypes: sourceBlocks.map(b => b.type),
          targetType: targetBlock.type
        };
        console.log('❌ 병합 규칙 없음:', error);
        return error;
      }
      
      if (this.config.debugMode) {
        console.log('🎯 Using merge rule:', rule.description);
      }
      
      // 전략에 따른 병합 실행 (통합 컨텐츠 이동 시스템)
      let result;
      switch (rule.strategy) {
        // === 기존 전략들 ===
        case 'append_as_item':
          result = await this.appendAsListItem(sourceBlocks, targetBlock, options);
          break;
          
        case 'merge_items_or_convert':
          result = await this.mergeListItems(sourceBlocks, targetBlock, options);
          break;
          
        case 'level_unify_or_merge':
          result = await this.unifyHeadingLevel(sourceBlocks, targetBlock, options);
          break;
          
        case 'content_concatenate':
          result = await this.concatenateContent(sourceBlocks, targetBlock, options);
          break;
          
        case 'extract_text_and_merge':
          result = await this.extractAndMergeText(sourceBlocks, targetBlock, options);
          break;
          
        case 'create_column_group':
          result = await this.createColumnGroup(sourceBlocks, targetBlock, options);
          break;
          
        // === 새로운 통합 전략들 ===
        case 'wrap_in_toggle':
          result = await this.wrapInToggle(sourceBlocks, targetBlock, options);
          break;
          
        case 'wrap_in_code':
          result = await this.wrapInCode(sourceBlocks, targetBlock, options);
          break;
          
        case 'wrap_in_quote':
          result = await this.wrapInQuote(sourceBlocks, targetBlock, options);
          break;
          
        case 'list_to_toggle':
          result = await this.listToToggle(sourceBlocks, targetBlock, options);
          break;
          
        case 'extract_list_content':
          result = await this.extractListContent(sourceBlocks, targetBlock, options);
          break;
          
        case 'heading_to_toggle':
          result = await this.headingToToggle(sourceBlocks, targetBlock, options);
          break;
          
        case 'merge_toggle_content':
          result = await this.mergeToggleContent(sourceBlocks, targetBlock, options);
          break;
          
        case 'merge_code_content':
          result = await this.mergeCodeContent(sourceBlocks, targetBlock, options);
          break;
          
        case 'add_to_gallery':
          result = await this.addToGallery(sourceBlocks, targetBlock, options);
          break;
          
        case 'merge_file_list':
          result = await this.mergeFileList(sourceBlocks, targetBlock, options);
          break;
          
        case 'add_to_column':
          result = await this.addToColumn(sourceBlocks, targetBlock, options);
          break;
          
        case 'universal_content_transfer':
          result = await this.universalContentTransfer(sourceBlocks, targetBlock, options);
          break;
          
        default:
          throw new Error(`Unknown merge strategy: ${rule.strategy}`);
      }
      
      const finalResult = {
        success: true,
        strategy: rule.strategy,
        rule: rule.description,
        ...result
      };
      
      console.log('✅ BlockMerger.merge 성공:', finalResult);
      return finalResult;
      
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message
      };
      console.log('❌ BlockMerger.merge 실패:', errorResult);
      return errorResult;
    }
  }
  
  /**
   * 텍스트를 리스트 아이템으로 추가
   */
  async appendAsListItem(sourceBlocks, targetBlock, options) {
    const changes = [];
    const newItems = [];
    
    // 타겟 리스트의 기존 아이템들 파싱
    let existingItems = this.parseListItems(targetBlock.content);
    let currentIndex = existingItems.length;
    
    // 소스 텍스트들을 리스트 아이템으로 변환
    sourceBlocks.forEach(sourceBlock => {
      const itemContent = this.extractTextContent(sourceBlock);
      if (itemContent.trim()) {
        currentIndex++;
        const newItem = this.createListItem(targetBlock.type, itemContent, currentIndex);
        existingItems.push(newItem);
        newItems.push(newItem);
        
        // 소스 블록 삭제 변경사항 기록
        changes.push({
          action: 'delete',
          blockId: sourceBlock.id
        });
      }
    });
    
    // 타겟 블록 업데이트
    const updatedContent = this.formatListContent(targetBlock.type, existingItems);
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldContent: targetBlock.content,
      newContent: updatedContent,
      contentData: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: updatedContent
          }]
        }]
      }
    });
    
    return {
      data: {
        itemsAdded: newItems.length,
        totalItems: existingItems.length,
        newItems
      },
      changes
    };
  }
  
  /**
   * 리스트 아이템 병합 또는 타입 변환
   */
  async mergeListItems(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 같은 타입이면 아이템 병합, 다른 타입이면 변환
    const isSameType = sourceBlocks.every(block => block.type === targetBlock.type);
    
    if (isSameType) {
      // 아이템 병합
      return this.appendAsListItem(sourceBlocks, targetBlock, options);
    } else {
      // 타입 변환 후 병합
      const convertedBlocks = sourceBlocks.map(block => ({
        ...block,
        type: targetBlock.type,
        content: this.convertListItemContent(block.content, block.type, targetBlock.type)
      }));
      
      return this.appendAsListItem(convertedBlocks, targetBlock, options);
    }
  }
  
  /**
   * 헤딩 레벨 통일 또는 내용 병합
   */
  async unifyHeadingLevel(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    if (options.strategy === 'unify_level') {
      // 소스 블록들을 타겟과 같은 레벨로 변환
      sourceBlocks.forEach(sourceBlock => {
        changes.push({
          action: 'update',
          blockId: sourceBlock.id,
          oldType: sourceBlock.type,
          newType: targetBlock.type
        });
      });
      
      return { data: { levelUnified: true }, changes };
    } else {
      // 내용 병합 (기본)
      return this.concatenateContent(sourceBlocks, targetBlock, options);
    }
  }
  
  /**
   * 텍스트 내용 연결
   */
  async concatenateContent(sourceBlocks, targetBlock, options) {
    const separator = options.separator || ' ';
    const changes = [];
    
    // 모든 내용 추출
    const contents = [
      this.extractTextContent(targetBlock),
      ...sourceBlocks.map(block => this.extractTextContent(block))
    ].filter(content => content.trim());
    
    const mergedContent = contents.join(separator);
    
    // 타겟 블록 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldContent: targetBlock.content,
      newContent: mergedContent,
      contentData: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: mergedContent
          }]
        }]
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        mergedContent,
        originalLength: targetBlock.content?.length || 0,
        newLength: mergedContent.length,
        blocksMerged: sourceBlocks.length
      },
      changes
    };
  }
  
  /**
   * 텍스트 추출 후 병합
   */
  async extractAndMergeText(sourceBlocks, targetBlock, options) {
    // 모든 블록에서 텍스트 추출
    const extractedTexts = sourceBlocks.map(block => this.extractTextContent(block));
    
    // 임시 텍스트 블록 생성
    const textBlocks = extractedTexts.map((text, index) => ({
      id: `temp_${index}`,
      type: 'text',
      content: text
    }));
    
    // 텍스트 병합 실행
    return this.concatenateContent(textBlocks, targetBlock, options);
  }
  
  /**
   * 컬럼 그룹 생성
   */
  async createColumnGroup(sourceBlocks, targetBlock, options) {
    const allBlocks = [targetBlock, ...sourceBlocks];
    const groupId = `column_group_${Date.now()}`;
    const changes = [];
    
    // 각 블록을 컬럼으로 변환
    allBlocks.forEach((block, index) => {
      changes.push({
        action: 'update',
        blockId: block.id,
        oldMetadata: block.metadata || {},
        newMetadata: {
          ...block.metadata,
          isColumnBlock: true,
          columnIndex: index,
          totalColumns: allBlocks.length,
          groupId: groupId
        }
      });
    });
    
    return {
      data: {
        groupId,
        columnCount: allBlocks.length,
        groupType: 'column'
      },
      changes
    };
  }
  
  /**
   * 병합 규칙 찾기 (통합 컨텐츠 이동 시스템)
   */
  findMergeRule(sourceBlocks, targetBlock) {
    const sourceTypes = sourceBlocks.map(block => block.type);
    const targetType = targetBlock.type;
    
    if (this.config.debugMode) {
      console.log('🔍 findMergeRule 실행:', { sourceTypes, targetType });
    }
    
    // 규칙들을 우선순위순으로 정렬
    const sortedRules = Object.entries(MERGE_RULES).map(([name, rule]) => ({
      name,
      ...rule,
      priority: rule.priority || 0
    })).sort((a, b) => b.priority - a.priority);
    
    // 특수 조건 확인 (minSourceCount 등)
    for (const rule of sortedRules) {
      // 최소 소스 블록 수 확인
      if (rule.minSourceCount && sourceBlocks.length < rule.minSourceCount) {
        continue;
      }
      
      // 소스 타입 호환성 확인
      const sourceCompatible = this.checkSourceCompatibility(sourceTypes, rule.sourceTypes);
      if (!sourceCompatible) {
        continue;
      }
      
      // 타겟 타입 호환성 확인  
      const targetCompatible = this.checkTargetCompatibility(targetType, rule.targetTypes);
      if (!targetCompatible) {
        continue;
      }
      
      // 특수 조건들 확인
      const specialConditions = this.checkSpecialConditions(rule, sourceBlocks, targetBlock);
      if (!specialConditions) {
        continue;  
      }
      
      if (this.config.debugMode) {
        console.log(`✅ ${rule.name}: 병합 규칙 찾음!`);
      }
      return rule;
    }
    
    if (this.config.debugMode) {
      console.log('❌ 호환 가능한 병합 규칙을 찾을 수 없음');
    }
    return null;
  }
  
  /**
   * 소스 타입 호환성 확인
   */
  checkSourceCompatibility(sourceTypes, ruleSourceTypes) {
    // 모든 타입 허용 (ANY_TO_ANY 규칙용)
    if (ruleSourceTypes.length === ALL_BLOCK_TYPES.length) {
      return true;
    }
    
    // 모든 소스 타입이 규칙에 포함되는지 확인
    return sourceTypes.every(type => ruleSourceTypes.includes(type));
  }
  
  /**
   * 타겟 타입 호환성 확인
   */
  checkTargetCompatibility(targetType, ruleTargetTypes) {
    // 모든 타입 허용 (ANY_TO_ANY 규칙용)
    if (ruleTargetTypes.length === ALL_BLOCK_TYPES.length) {
      return true;
    }
    
    return ruleTargetTypes.includes(targetType);
  }
  
  /**
   * 특수 조건 확인
   */
  checkSpecialConditions(rule, sourceBlocks, targetBlock) {
    // 컬럼 그룹 생성의 경우 소스와 타겟이 같은 타입이면 제외
    if (rule.name === 'MULTI_TO_COLUMN_GROUP') {
      const allSameType = sourceBlocks.every(block => block.type === targetBlock.type) &&
                         sourceBlocks.length === 1;
      if (allSameType) {
        return false;
      }
    }
    
    // ANY_TO_ANY 규칙은 다른 더 구체적인 규칙이 없을 때만 사용하지만,
    // 구체적인 같은 타입 규칙이 없는 경우에는 허용
    if (rule.name === 'ANY_TO_ANY') {
      // 같은 타입끼리는 구체적 규칙이 있는지 확인
      if (sourceBlocks.length === 1 && sourceBlocks[0].type === targetBlock.type) {
        const sourceType = sourceBlocks[0].type;
        const targetType = targetBlock.type;
        
        // 구체적인 같은 타입 규칙이 있는지 확인
        const hasSpecificRule = Object.values(MERGE_RULES).some(otherRule => 
          otherRule.name !== 'ANY_TO_ANY' &&
          otherRule.sourceTypes.includes(sourceType) && 
          otherRule.targetTypes.includes(targetType)
        );
        
        // 구체적인 규칙이 있으면 ANY_TO_ANY는 사용하지 않음
        if (hasSpecificRule) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 병합 가능성 검증
   */
  validateMerge(sourceBlocks, targetBlock) {
    if (!targetBlock) {
      return { isValid: false, error: 'Target block is required for merge operation' };
    }
    
    if (sourceBlocks.length > this.config.maxMergeItems) {
      return { 
        isValid: false, 
        error: `Too many blocks to merge (max: ${this.config.maxMergeItems})` 
      };
    }
    
    const rule = this.findMergeRule(sourceBlocks, targetBlock);
    if (!rule) {
      return { 
        isValid: false, 
        error: 'No compatible merge rule found',
        sourceTypes: sourceBlocks.map(b => b.type),
        targetType: targetBlock.type
      };
    }
    
    return { isValid: true, rule: rule.description };
  }
  
  // ===== 유틸리티 메서드들 =====
  
  /**
   * 블록에서 텍스트 내용 추출
   */
  extractTextContent(block) {
    if (typeof block.content === 'string') {
      return block.content;
    }
    
    if (typeof block.content === 'object' && block.content?.content) {
      // ProseMirror JSON 형태
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
  parseListItems(content) {
    if (typeof content !== 'string') return [];
    
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      index: index + 1,
      content: line.replace(/^[\d\-\*\+•]\s*/, '').trim()
    }));
  }
  
  /**
   * 리스트 아이템 생성
   */
  createListItem(listType, content, index) {
    const markers = {
      bulletList: '•',
      numberedList: `${index}.`,
      checkList: '☐'
    };
    
    return {
      index,
      content,
      marker: markers[listType] || '•'
    };
  }
  
  /**
   * 리스트 내용 포맷팅
   */
  formatListContent(listType, items) {
    return items.map(item => `${item.marker} ${item.content}`).join('\n');
  }
  
  /**
   * 리스트 아이템 내용 변환
   */
  convertListItemContent(content, fromType, toType) {
    // 기존 마커 제거 후 새 마커 적용
    const cleanContent = content.replace(/^[\d\-\*\+•☐☑]\s*/, '');
    return cleanContent;
  }
  
  // ===== 새로운 통합 컨텐츠 이동 전략들 =====
  
  /**
   * 블록을 토글로 래핑
   */
  async wrapInToggle(sourceBlocks, targetBlock, options) {
    const changes = [];
    const toggleTitle = options.title || this.extractTextContent(sourceBlocks[0]) || 'Toggle';
    
    // 토글 내용 구성
    const toggleContent = sourceBlocks.map(block => ({
      type: block.type,
      content: block.content,
      metadata: block.metadata
    }));
    
    // 타겟 블록을 토글로 변환
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldType: targetBlock.type,
      newType: 'toggle',
      oldContent: targetBlock.content,
      newContent: toggleTitle,
      contentData: this.createContentData('toggle', toggleTitle),
      metadata: {
        ...targetBlock.metadata,
        isExpanded: true,
        toggleContent: toggleContent
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        toggleTitle,
        itemsWrapped: sourceBlocks.length,
        newType: 'toggle'
      },
      changes
    };
  }
  
  /**
   * 블록을 코드로 래핑
   */
  async wrapInCode(sourceBlocks, targetBlock, options) {
    const changes = [];
    const language = options.language || 'javascript';
    
    // 모든 소스 블록의 내용을 추출하여 코드로 결합
    const codeContent = sourceBlocks
      .map(block => this.extractTextContent(block))
      .join('\n');
    
    // 타겟 블록을 코드 블록으로 변환
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldType: targetBlock.type,
      newType: 'code',
      oldContent: targetBlock.content,
      newContent: codeContent,
      contentData: this.createContentData('code', codeContent),
      metadata: {
        ...targetBlock.metadata,
        language: language,
        showLineNumbers: options.showLineNumbers !== false
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        language,
        linesCount: codeContent.split('\n').length,
        itemsWrapped: sourceBlocks.length
      },
      changes
    };
  }
  
  /**
   * 블록을 인용구로 래핑
   */
  async wrapInQuote(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 모든 소스 블록의 내용을 추출하여 인용구로 결합
    const quoteContent = sourceBlocks
      .map(block => this.extractTextContent(block))
      .join('\n\n');
    
    // 타겟 블록을 인용구로 변환
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldType: targetBlock.type,
      newType: 'quote',
      oldContent: targetBlock.content,
      newContent: quoteContent,
      contentData: this.createContentData('quote', quoteContent),
      metadata: {
        ...targetBlock.metadata,
        author: options.author || null,
        source: options.source || null
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        quoteLength: quoteContent.length,
        itemsWrapped: sourceBlocks.length
      },
      changes
    };
  }
  
  /**
   * 리스트를 토글로 변환
   */
  async listToToggle(sourceBlocks, targetBlock, options) {
    const changes = [];
    const sourceBlock = sourceBlocks[0];
    const items = this.parseListItems(sourceBlock);
    
    // 첫 번째 아이템을 토글 제목으로, 나머지를 내용으로
    const toggleTitle = items[0]?.content || 'Toggle';
    const toggleItems = items.slice(1).map(item => ({
      type: 'text',
      content: item.content
    }));
    
    // 타겟 블록을 토글로 변환
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldType: targetBlock.type,
      newType: 'toggle',
      oldContent: targetBlock.content,
      newContent: toggleTitle,
      contentData: this.createContentData('toggle', toggleTitle),
      metadata: {
        ...targetBlock.metadata,
        isExpanded: false,
        toggleContent: toggleItems
      }
    });
    
    // 소스 블록 삭제
    changes.push({
      action: 'delete',
      blockId: sourceBlock.id
    });
    
    return {
      data: {
        toggleTitle,
        itemsConverted: items.length,
        originalListType: sourceBlock.type
      },
      changes
    };
  }
  
  /**
   * 리스트 내용을 텍스트로 추출
   */
  async extractListContent(sourceBlocks, targetBlock, options) {
    return this.concatenateContent(sourceBlocks, targetBlock, {
      ...options,
      separator: options.separator || '\n'
    });
  }
  
  /**
   * 헤딩을 토글로 변환
   */
  async headingToToggle(sourceBlocks, targetBlock, options) {
    const changes = [];
    const headingContent = this.extractTextContent(sourceBlocks[0]);
    
    // 타겟 블록을 토글로 변환
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldType: targetBlock.type,
      newType: 'toggle',
      oldContent: targetBlock.content,
      newContent: headingContent,
      contentData: this.createContentData('toggle', headingContent),
      metadata: {
        ...targetBlock.metadata,
        isExpanded: false,
        toggleContent: [],
        originalHeadingLevel: sourceBlocks[0].type
      }
    });
    
    // 소스 블록 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        toggleTitle: headingContent,
        originalType: sourceBlocks[0].type
      },
      changes
    };
  }
  
  /**
   * 토글 내용 병합
   */
  async mergeToggleContent(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 기존 토글 내용 가져오기
    const existingContent = targetBlock.metadata?.toggleContent || [];
    
    // 소스 토글들의 내용 추출
    const newContent = [];
    sourceBlocks.forEach(sourceBlock => {
      if (sourceBlock.metadata?.toggleContent) {
        newContent.push(...sourceBlock.metadata.toggleContent);
      } else {
        // 일반 블록이면 그대로 추가
        newContent.push({
          type: sourceBlock.type,
          content: sourceBlock.content,
          metadata: sourceBlock.metadata
        });
      }
    });
    
    // 타겟 토글 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldMetadata: targetBlock.metadata,
      newMetadata: {
        ...targetBlock.metadata,
        toggleContent: [...existingContent, ...newContent]
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        itemsAdded: newContent.length,
        totalItems: existingContent.length + newContent.length
      },
      changes
    };
  }
  
  /**
   * 코드 내용 병합
   */
  async mergeCodeContent(sourceBlocks, targetBlock, options) {
    const separator = options.separator || '\n\n';
    const targetContent = this.extractTextContent(targetBlock);
    const sourceContents = sourceBlocks.map(block => this.extractTextContent(block));
    
    const mergedCode = [targetContent, ...sourceContents]
      .filter(content => content.trim())
      .join(separator);
    
    const changes = [{
      action: 'update',
      blockId: targetBlock.id,
      oldContent: targetBlock.content,
      newContent: mergedCode,
      contentData: this.createContentData('code', mergedCode)
    }];
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        mergedLength: mergedCode.length,
        linesCount: mergedCode.split('\n').length
      },
      changes
    };
  }
  
  /**
   * 이미지를 갤러리에 추가
   */
  async addToGallery(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 기존 갤러리 이미지들
    const existingImages = targetBlock.metadata?.images || [];
    
    // 소스 이미지들 추가
    const newImages = sourceBlocks.map(block => ({
      id: block.id,
      src: block.metadata?.src || block.content,
      alt: block.metadata?.alt || '',
      caption: block.metadata?.caption || ''
    }));
    
    // 타겟 갤러리 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldMetadata: targetBlock.metadata,
      newMetadata: {
        ...targetBlock.metadata,
        images: [...existingImages, ...newImages]
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',  
        blockId: block.id
      });
    });
    
    return {
      data: {
        imagesAdded: newImages.length,
        totalImages: existingImages.length + newImages.length
      },
      changes
    };
  }
  
  /**
   * 파일 목록 병합
   */
  async mergeFileList(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 기존 파일 목록
    const existingFiles = targetBlock.metadata?.files || [];
    
    // 소스 파일들 추가
    const newFiles = sourceBlocks.map(block => ({
      id: block.id,
      name: block.metadata?.fileName || block.content,
      size: block.metadata?.fileSize || 0,
      type: block.metadata?.fileType || 'unknown',
      url: block.metadata?.fileUrl || ''
    }));
    
    // 타겟 파일 블록 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldMetadata: targetBlock.metadata,
      newMetadata: {
        ...targetBlock.metadata,
        files: [...existingFiles, ...newFiles]
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        filesAdded: newFiles.length,
        totalFiles: existingFiles.length + newFiles.length
      },
      changes
    };
  }
  
  /**
   * 블록을 컬럼에 추가
   */
  async addToColumn(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 기존 컬럼 내용
    const existingContent = targetBlock.metadata?.columnContent || [];
    
    // 소스 블록들을 컬럼 내용으로 추가
    const newContent = sourceBlocks.map(block => ({
      type: block.type,
      content: block.content,
      metadata: block.metadata
    }));
    
    // 타겟 컬럼 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldMetadata: targetBlock.metadata,
      newMetadata: {
        ...targetBlock.metadata,
        columnContent: [...existingContent, ...newContent]
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });  
    
    return {
      data: {
        itemsAdded: newContent.length,
        totalItems: existingContent.length + newContent.length
      },
      changes
    };
  }
  
  /**
   * 범용 컨텐츠 이동 (최종 fallback)
   */
  async universalContentTransfer(sourceBlocks, targetBlock, options) {
    const changes = [];
    
    // 소스 블록들의 내용을 추출
    const sourceContent = sourceBlocks
      .map(block => this.extractTextContent(block))
      .filter(content => content.trim())
      .join('\n\n');
    
    if (!sourceContent) {
      return {
        success: false,
        error: 'No transferable content found'
      };
    }
    
    // 타겟 블록 타입에 맞게 내용 변환
    const convertedContent = this.adaptContentToBlockType(sourceContent, targetBlock.type);
    const targetContent = this.extractTextContent(targetBlock);
    const finalContent = targetContent ? `${targetContent}\n\n${convertedContent}` : convertedContent;
    
    // 타겟 블록 업데이트
    changes.push({
      action: 'update',
      blockId: targetBlock.id,
      oldContent: targetBlock.content,
      newContent: finalContent,
      contentData: this.createContentData(targetBlock.type, finalContent),
      metadata: {
        ...targetBlock.metadata,
        transferredFrom: sourceBlocks.map(b => b.type)
      }
    });
    
    // 소스 블록들 삭제
    sourceBlocks.forEach(block => {
      changes.push({
        action: 'delete',
        blockId: block.id
      });
    });
    
    return {
      data: {
        transferredContent: sourceContent,
        targetType: targetBlock.type,
        sourceTypes: sourceBlocks.map(b => b.type)
      },
      changes
    };
  }
  
  /**
   * 내용을 블록 타입에 맞게 적응
   */
  adaptContentToBlockType(content, blockType) {
    switch (blockType) {
      case 'bulletList':
        return content.split('\n').map(line => `• ${line.trim()}`).join('\n');
      case 'numberedList':  
        return content.split('\n').map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
      case 'checkList':
        return content.split('\n').map(line => `☐ ${line.trim()}`).join('\n');
      case 'code':
        return content; // 코드는 그대로
      case 'quote':
        return content.split('\n').map(line => `> ${line}`).join('\n');
      default:
        return content; // 기본적으로는 그대로
    }
  }

  /**
   * 콘텐츠 데이터 생성 (ProseMirror 형식)
   */
  createContentData(blockType, content) {
    return {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: content || ''
        }]
      }]
    };
  }
}

export default BlockMerger;