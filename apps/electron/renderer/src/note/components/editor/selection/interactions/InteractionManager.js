/**
 * 블록 상호작용 관리자
 * 
 * @description 모든 블록 간 상호작용을 조율하는 핵심 클래스
 * - 병합(Merge): 텍스트 → 리스트, 리스트 타입 변환 등
 * - 분할(Split): 블록 내용을 여러 블록으로 나누기
 * - 변환(Convert): 블록 타입 변경
 * - 재배치(Rearrange): 블록 순서 변경
 * 
 * @author AI Assistant  
 * @version 1.0.0
 */

import { nanoid } from 'nanoid';
import { BlockMerger } from './BlockMerger';
import { BlockConverter } from './BlockConverter';
import { BlockSplitter } from './BlockSplitter';

// 상호작용 타입 정의
export const INTERACTION_TYPES = {
  MERGE: 'merge',
  SPLIT: 'split', 
  CONVERT: 'convert',
  REARRANGE: 'rearrange',
  GROUP: 'group',
  UNGROUP: 'ungroup'
};

// 상호작용 결과 타입
export const INTERACTION_RESULTS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled'
};

/**
 * 블록 상호작용 관리자 클래스
 */
export class InteractionManager {
  constructor(config = {}) {
    this.config = {
      enableAnimations: true,
      debugMode: false,
      maxHistorySize: 50,
      ...config
    };
    
    // 서브 시스템 초기화
    this.merger = new BlockMerger(this.config);
    this.converter = new BlockConverter(this.config);
    this.splitter = new BlockSplitter(this.config);
    
    // 상호작용 히스토리
    this.history = [];
    
    // 이벤트 리스너들
    this.listeners = new Map();
    
    if (this.config.debugMode) {
      console.log('🎯 InteractionManager initialized');
    }
  }
  
  /**
   * 블록 상호작용 실행
   * @param {Object} interaction - 상호작용 정의
   * @param {string} interaction.type - 상호작용 타입
   * @param {Array} interaction.sourceBlocks - 소스 블록들
   * @param {Object} interaction.targetBlock - 타겟 블록
   * @param {Object} interaction.options - 추가 옵션들
   * @returns {Promise<Object>} 실행 결과
   */
  async executeInteraction(interaction) {
    const startTime = Date.now();
    const interactionId = nanoid();
    
    try {
      if (this.config.debugMode) {
        console.log('🚀 Executing interaction:', interaction);
      }
      
      // 상호작용 전 검증
      const validation = this.validateInteraction(interaction);
      if (!validation.isValid) {
        return {
          id: interactionId,
          type: interaction.type,
          result: INTERACTION_RESULTS.FAILED,
          error: validation.error,
          duration: Date.now() - startTime
        };
      }
      
      // 적절한 핸들러로 라우팅
      let result;
      switch (interaction.type) {
        case INTERACTION_TYPES.MERGE:
          console.log('🎯 InteractionManager: MERGE 실행 중...');
          result = await this.merger.merge(
            interaction.sourceBlocks,
            interaction.targetBlock,
            interaction.options
          );
          console.log('🔄 InteractionManager: merger.merge 결과:', result);
          break;
          
        case INTERACTION_TYPES.SPLIT:
          result = await this.splitter.split(
            interaction.sourceBlocks[0], // 분할은 단일 블록 대상
            interaction.options
          );
          break;
          
        case INTERACTION_TYPES.CONVERT:
          result = await this.converter.convert(
            interaction.sourceBlocks,
            interaction.options.targetType,
            interaction.options
          );
          break;
          
        case INTERACTION_TYPES.GROUP:
          result = await this.createGroup(
            interaction.sourceBlocks,
            interaction.options
          );
          break;
          
        case INTERACTION_TYPES.UNGROUP:
          result = await this.disbandGroup(
            interaction.sourceBlocks,
            interaction.options
          );
          break;
          
        default:
          throw new Error(`Unknown interaction type: ${interaction.type}`);
      }
      
      // 결과 처리
      const processedResult = {
        id: interactionId,
        type: interaction.type,
        result: result.success ? INTERACTION_RESULTS.SUCCESS : INTERACTION_RESULTS.FAILED,
        data: result.data,
        changes: result.changes,
        duration: Date.now() - startTime
      };
      
      console.log('🎊 InteractionManager: 최종 처리된 결과:', processedResult);
      
      // 히스토리에 추가
      this.addToHistory(processedResult);
      
      // 이벤트 발생
      this.emit('interaction:completed', processedResult);
      
      return processedResult;
      
    } catch (error) {
      const errorResult = {
        id: interactionId,
        type: interaction.type,
        result: INTERACTION_RESULTS.FAILED,
        error: error.message,
        duration: Date.now() - startTime
      };
      
      this.emit('interaction:error', errorResult);
      return errorResult;
    }
  }
  
  /**
   * 상호작용 가능성 검증
   * @param {Object} interaction - 검증할 상호작용
   * @returns {Object} 검증 결과
   */
  validateInteraction(interaction) {
    // 필수 필드 검증
    if (!interaction.type) {
      return { isValid: false, error: 'Interaction type is required' };
    }
    
    if (!interaction.sourceBlocks || !Array.isArray(interaction.sourceBlocks)) {
      return { isValid: false, error: 'Source blocks must be an array' };
    }
    
    if (interaction.sourceBlocks.length === 0) {
      return { isValid: false, error: 'At least one source block is required' };
    }
    
    // 타입별 특화 검증
    switch (interaction.type) {
      case INTERACTION_TYPES.MERGE:
        return this.merger.validateMerge(interaction.sourceBlocks, interaction.targetBlock);
        
      case INTERACTION_TYPES.SPLIT:
        return this.splitter.validateSplit(interaction.sourceBlocks[0], interaction.options);
        
      case INTERACTION_TYPES.CONVERT:
        return this.converter.validateConvert(
          interaction.sourceBlocks,
          interaction.options?.targetType
        );
        
      default:
        return { isValid: true };
    }
  }
  
  /**
   * 블록 그룹 생성
   * @param {Array} blocks - 그룹화할 블록들
   * @param {Object} options - 그룹 옵션
   * @returns {Object} 그룹 생성 결과
   */
  async createGroup(blocks, options = {}) {
    const groupId = nanoid();
    const groupType = options.groupType || 'column';
    
    const changes = blocks.map((block, index) => ({
      blockId: block.id,
      oldMetadata: { ...block.metadata },
      newMetadata: {
        ...block.metadata,
        isGrouped: true,
        groupId: groupId,
        groupType: groupType,
        groupIndex: index,
        totalInGroup: blocks.length
      }
    }));
    
    return {
      success: true,
      data: {
        groupId,
        groupType,
        memberCount: blocks.length
      },
      changes
    };
  }
  
  /**
   * 블록 그룹 해제
   * @param {Array} blocks - 그룹 해제할 블록들
   * @param {Object} options - 해제 옵션
   * @returns {Object} 그룹 해제 결과
   */
  async disbandGroup(blocks, options = {}) {
    const changes = blocks.map(block => {
      const { isGrouped, groupId, groupType, groupIndex, totalInGroup, ...restMetadata } = block.metadata || {};
      
      return {
        blockId: block.id,
        oldMetadata: { ...block.metadata },
        newMetadata: restMetadata
      };
    });
    
    return {
      success: true,
      data: {
        ungroupedBlocks: blocks.length
      },
      changes
    };
  }
  
  /**
   * 히스토리에 상호작용 추가
   * @param {Object} result - 상호작용 결과
   */
  addToHistory(result) {
    this.history.unshift(result);
    
    // 히스토리 크기 제한
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(0, this.config.maxHistorySize);
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }
  
  /**
   * 상호작용 히스토리 조회
   * @param {Object} filters - 필터 조건
   * @returns {Array} 필터된 히스토리
   */
  getHistory(filters = {}) {
    let filtered = [...this.history];
    
    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    if (filters.result) {
      filtered = filtered.filter(item => item.result === filters.result);
    }
    
    if (filters.since) {
      const since = new Date(filters.since);
      filtered = filtered.filter(item => new Date(item.timestamp) >= since);
    }
    
    return filtered;
  }
  
  /**
   * 통계 조회
   * @returns {Object} 상호작용 통계
   */
  getStats() {
    const total = this.history.length;
    const byType = {};
    const byResult = {};
    
    this.history.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byResult[item.result] = (byResult[item.result] || 0) + 1;
    });
    
    return {
      total,
      byType,
      byResult,
      averageDuration: total > 0 
        ? this.history.reduce((sum, item) => sum + item.duration, 0) / total 
        : 0
    };
  }
  
  /**
   * 매니저 정리
   */
  destroy() {
    this.listeners.clear();
    this.history = [];
    
    if (this.config.debugMode) {
      console.log('🧹 InteractionManager destroyed');
    }
  }
}

export default InteractionManager;