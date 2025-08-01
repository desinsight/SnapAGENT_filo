/**
 * 스마트 태그/카테고리 추천 서비스
 * - AI/ML 기반 노트 내용 자동 태그 추천
 * - 유사/연관 태그, 인기 태그 통계 제공
 *
 * @author Your Team
 * @version 1.0.0
 */

import logger from '../../utils/logger.js';
import { KoreanTextAnalyzer } from '../../utils/koreanUtils.js';

export class SmartTagService {
  constructor() {
    this.textAnalyzer = new KoreanTextAnalyzer();
    this.tagDatabase = new Map(); // 태그 데이터베이스
    this.tagUsageStats = new Map(); // 태그 사용 통계
    this.tagRelationships = new Map(); // 태그 간 관계
    this.initializeTagDatabase();
  }

  /**
   * 태그 데이터베이스 초기화
   */
  initializeTagDatabase() {
    // 기본 태그들
    const baseTags = [
      '회의', '프로젝트', '업무', '개인', '학습', '아이디어', '계획', '리뷰',
      '문서', '보고서', '프레젠테이션', '코드', '디자인', '마케팅', '영업',
      '고객', '제품', '서비스', '개발', '테스트', '배포', '유지보수',
      '회계', '인사', '법무', '구매', '물류', '품질', '보안'
    ];

    baseTags.forEach(tag => {
      this.tagDatabase.set(tag, {
        id: tag,
        name: tag,
        category: this.categorizeTag(tag),
        usageCount: 0,
        lastUsed: null,
        relatedTags: [],
        synonyms: this.getTagSynonyms(tag)
      });
    });
  }

  /**
   * 태그 카테고리 분류
   */
  categorizeTag(tag) {
    const categories = {
      '업무': ['회의', '프로젝트', '업무', '보고서', '문서'],
      '개발': ['코드', '개발', '테스트', '배포', '유지보수'],
      '기획': ['계획', '아이디어', '프레젠테이션', '디자인'],
      '관리': ['인사', '회계', '법무', '구매', '물류'],
      '학습': ['학습', '리뷰', '연구', '교육'],
      '개인': ['개인', '일기', '메모', '할일']
    };

    for (const [category, tags] of Object.entries(categories)) {
      if (tags.includes(tag)) return category;
    }
    return '기타';
  }

  /**
   * 태그 동의어/유사어
   */
  getTagSynonyms(tag) {
    const synonyms = {
      '회의': ['미팅', '컨퍼런스', '브리핑'],
      '프로젝트': ['과제', '작업', '일'],
      '업무': ['일', '업무', '과업'],
      '학습': ['공부', '연구', '교육'],
      '아이디어': ['발상', '구상', '계획'],
      '계획': ['일정', '스케줄', '로드맵'],
      '보고서': ['리포트', '문서', '자료'],
      '코드': ['프로그램', '소스', '개발']
    };
    return synonyms[tag] || [];
  }

  /**
   * AI 기반 태그 추천
   */
  async recommendTags(content, existingTags = [], maxRecommendations = 10) {
    try {
      const recommendations = [];

      // 1. 키워드 기반 태그 추천
      const keywordTags = await this.recommendByKeywords(content, existingTags);
      recommendations.push(...keywordTags);

      // 2. 유사 태그 추천
      const similarTags = await this.recommendSimilarTags(existingTags);
      recommendations.push(...similarTags);

      // 3. 인기 태그 추천
      const popularTags = await this.recommendPopularTags(existingTags);
      recommendations.push(...popularTags);

      // 4. 카테고리 기반 태그 추천
      const categoryTags = await this.recommendByCategory(content, existingTags);
      recommendations.push(...categoryTags);

      // 5. 컨텍스트 기반 태그 추천
      const contextTags = await this.recommendByContext(content, existingTags);
      recommendations.push(...contextTags);

      // 중복 제거 및 정렬
      const uniqueRecommendations = this.removeDuplicateRecommendations(recommendations);
      const sortedRecommendations = uniqueRecommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxRecommendations);

      return sortedRecommendations;
    } catch (error) {
      logger.error('태그 추천 실패:', error);
      return [];
    }
  }

  /**
   * 키워드 기반 태그 추천
   */
  async recommendByKeywords(content, existingTags) {
    const keywords = this.textAnalyzer.extractKeywords(content, 15);
    const recommendations = [];

    keywords.forEach(keyword => {
      // 직접 매칭
      if (this.tagDatabase.has(keyword) && !existingTags.includes(keyword)) {
        recommendations.push({
          tag: keyword,
          type: 'keyword',
          confidence: 0.9,
          reason: '콘텐츠에서 직접 추출된 키워드'
        });
      }

      // 동의어 매칭
      for (const [tag, tagData] of this.tagDatabase.entries()) {
        if (tagData.synonyms.includes(keyword) && !existingTags.includes(tag)) {
          recommendations.push({
            tag: tag,
            type: 'synonym',
            confidence: 0.8,
            reason: `키워드 "${keyword}"의 동의어`
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * 유사 태그 추천
   */
  async recommendSimilarTags(existingTags) {
    const recommendations = [];

    existingTags.forEach(existingTag => {
      const tagData = this.tagDatabase.get(existingTag);
      if (tagData && tagData.relatedTags) {
        tagData.relatedTags.forEach(relatedTag => {
          if (!existingTags.includes(relatedTag)) {
            recommendations.push({
              tag: relatedTag,
              type: 'related',
              confidence: 0.7,
              reason: `"${existingTag}"와 관련된 태그`
            });
          }
        });
      }
    });

    return recommendations;
  }

  /**
   * 인기 태그 추천
   */
  async recommendPopularTags(existingTags) {
    const recommendations = [];

    // 사용 빈도 순으로 정렬
    const sortedTags = Array.from(this.tagUsageStats.entries())
      .sort(([,a], [,b]) => b.usageCount - a.usageCount)
      .slice(0, 20);

    sortedTags.forEach(([tag, stats]) => {
      if (!existingTags.includes(tag)) {
        recommendations.push({
          tag: tag,
          type: 'popular',
          confidence: Math.min(0.6 + (stats.usageCount / 100), 0.8),
          reason: `인기 태그 (${stats.usageCount}회 사용)`
        });
      }
    });

    return recommendations;
  }

  /**
   * 카테고리 기반 태그 추천
   */
  async recommendByCategory(content, existingTags) {
    const recommendations = [];
    const contentCategory = this.detectContentCategory(content);

    for (const [tag, tagData] of this.tagDatabase.entries()) {
      if (tagData.category === contentCategory && !existingTags.includes(tag)) {
        recommendations.push({
          tag: tag,
          type: 'category',
          confidence: 0.7,
          reason: `${contentCategory} 카테고리 태그`
        });
      }
    }

    return recommendations;
  }

  /**
   * 콘텐츠 카테고리 감지
   */
  detectContentCategory(content) {
    const categoryKeywords = {
      '업무': ['회의', '프로젝트', '업무', '보고서', '문서', '미팅'],
      '개발': ['코드', '개발', '테스트', '배포', '프로그램', '소스'],
      '기획': ['계획', '아이디어', '프레젠테이션', '디자인', '구상'],
      '관리': ['인사', '회계', '법무', '구매', '물류', '관리'],
      '학습': ['학습', '공부', '연구', '교육', '리뷰'],
      '개인': ['개인', '일기', '메모', '할일', '일정']
    };

    const scores = {};
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      scores[category] = keywords.filter(keyword => 
        content.includes(keyword)
      ).length;
    }

    const maxScore = Math.max(...Object.values(scores));
    const detectedCategory = Object.keys(scores).find(category => 
      scores[category] === maxScore
    );

    return detectedCategory || '기타';
  }

  /**
   * 컨텍스트 기반 태그 추천
   */
  async recommendByContext(content, existingTags) {
    const recommendations = [];

    // 시간 관련 컨텍스트
    if (content.includes('오늘') || content.includes('내일') || content.includes('이번주')) {
      if (!existingTags.includes('일정')) {
        recommendations.push({
          tag: '일정',
          type: 'context',
          confidence: 0.8,
          reason: '시간 관련 내용 감지'
        });
      }
    }

    // 회의 관련 컨텍스트
    if (content.includes('회의') || content.includes('미팅') || content.includes('브리핑')) {
      if (!existingTags.includes('회의')) {
        recommendations.push({
          tag: '회의',
          type: 'context',
          confidence: 0.9,
          reason: '회의 관련 내용 감지'
        });
      }
    }

    // 프로젝트 관련 컨텍스트
    if (content.includes('프로젝트') || content.includes('과제') || content.includes('작업')) {
      if (!existingTags.includes('프로젝트')) {
        recommendations.push({
          tag: '프로젝트',
          type: 'context',
          confidence: 0.9,
          reason: '프로젝트 관련 내용 감지'
        });
      }
    }

    return recommendations;
  }

  /**
   * 태그 사용 통계 업데이트
   */
  updateTagUsage(tag) {
    if (!this.tagUsageStats.has(tag)) {
      this.tagUsageStats.set(tag, {
        usageCount: 0,
        lastUsed: null,
        firstUsed: new Date()
      });
    }

    const stats = this.tagUsageStats.get(tag);
    stats.usageCount += 1;
    stats.lastUsed = new Date();
  }

  /**
   * 태그 관계 업데이트
   */
  updateTagRelationships(tags) {
    tags.forEach(tag1 => {
      tags.forEach(tag2 => {
        if (tag1 !== tag2) {
          if (!this.tagRelationships.has(tag1)) {
            this.tagRelationships.set(tag1, new Map());
          }
          
          const relationships = this.tagRelationships.get(tag1);
          relationships.set(tag2, (relationships.get(tag2) || 0) + 1);
        }
      });
    });
  }

  /**
   * 인기 태그 통계 조회
   */
  getPopularTags(limit = 20) {
    return Array.from(this.tagUsageStats.entries())
      .sort(([,a], [,b]) => b.usageCount - a.usageCount)
      .slice(0, limit)
      .map(([tag, stats]) => ({
        tag,
        usageCount: stats.usageCount,
        lastUsed: stats.lastUsed
      }));
  }

  /**
   * 태그 관련성 분석
   */
  getRelatedTags(tag, limit = 10) {
    const relationships = this.tagRelationships.get(tag);
    if (!relationships) return [];

    return Array.from(relationships.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([relatedTag, strength]) => ({
        tag: relatedTag,
        strength
      }));
  }

  /**
   * 중복 추천 제거
   */
  removeDuplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.tag)) {
        return false;
      }
      seen.add(rec.tag);
      return true;
    });
  }

  /**
   * 태그 검색 (자동완성)
   */
  searchTags(query, limit = 10) {
    const results = [];
    
    for (const [tag, tagData] of this.tagDatabase.entries()) {
      if (tag.includes(query) || tagData.synonyms.some(synonym => synonym.includes(query))) {
        results.push({
          tag,
          category: tagData.category,
          usageCount: this.tagUsageStats.get(tag)?.usageCount || 0
        });
      }
    }

    return results
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
}

export default SmartTagService; 