export class KoreanTextAnalyzer {
  extractKeywords(content, limit = 10) {
    // 실제 구현 대신, 임시로 content에서 단어를 공백 기준으로 잘라 limit만큼 반환
    if (!content) return [];
    return content.split(/\s+/).slice(0, limit);
  }
} 