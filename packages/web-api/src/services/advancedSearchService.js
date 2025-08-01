import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { callClaude } from './claudeService.js';

class AdvancedSearchService {
  constructor() {
    this.searchHistory = [];
    this.searchIndex = new Map();
  }

  async naturalLanguageSearch(query, targetDirectory) {
    try {
      // 자연어 쿼리를 구조화된 검색 조건으로 변환
      const searchConditions = await this.parseNaturalLanguageQuery(query);
      
      // 파일 시스템에서 검색 실행
      const results = await this.executeAdvancedSearch(searchConditions, targetDirectory);
      
      // 검색 결과에 AI 분석 추가
      const enhancedResults = await this.enhanceSearchResults(results, query);
      
      // 검색 히스토리에 추가
      this.addToSearchHistory(query, results.length);
      
      return {
        query,
        conditions: searchConditions,
        results: enhancedResults,
        totalCount: results.length,
        searchTime: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`자연어 검색 실패: ${error.message}`);
    }
  }

  async parseNaturalLanguageQuery(query) {
    try {
      const prompt = `다음 자연어 검색 쿼리를 파일 검색 조건으로 변환해주세요:

쿼리: "${query}"

다음 JSON 형식으로 응답해주세요:
{
  "fileName": "파일명 조건 (부분 일치, 대소문자 무시)",
  "extension": "확장자 조건",
  "sizeRange": {"min": 최소크기바이트, "max": 최대크기바이트},
  "dateRange": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
  "contentKeywords": ["내용 검색 키워드들"],
  "fileType": "파일 타입 (text, image, document, audio, video, binary)",
  "sizeCategory": "크기 카테고리 (tiny, small, medium, large, huge)",
  "ageCategory": "수정일 카테고리 (today, recent, month, year, old)"
}

조건이 없는 경우 null로 설정해주세요.`;

      const response = await callClaude(prompt);
      
      try {
        // JSON 응답 파싱
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('JSON 파싱 실패, 기본 조건 사용:', parseError);
      }

      // 기본 조건 반환
      return {
        fileName: query,
        extension: null,
        sizeRange: null,
        dateRange: null,
        contentKeywords: null,
        fileType: null,
        sizeCategory: null,
        ageCategory: null
      };
    } catch (error) {
      console.log('자연어 파싱 실패, 기본 조건 사용:', error);
      return {
        fileName: query,
        extension: null,
        sizeRange: null,
        dateRange: null,
        contentKeywords: null,
        fileType: null,
        sizeCategory: null,
        ageCategory: null
      };
    }
  }

  async executeAdvancedSearch(conditions, targetDirectory) {
    const results = [];
    
    try {
      await this.searchDirectory(targetDirectory, conditions, results);
    } catch (error) {
      console.log('검색 중 오류:', error);
    }

    return results;
  }

  async searchDirectory(dirPath, conditions, results) {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        try {
          const stats = await fs.stat(fullPath);
          
          if (stats.isDirectory()) {
            // 재귀적으로 하위 디렉토리 검색
            await this.searchDirectory(fullPath, conditions, results);
          } else {
            // 파일 검색 조건 확인
            if (await this.matchesSearchConditions(fullPath, stats, conditions)) {
              results.push({
                fileName: item,
                filePath: fullPath,
                size: stats.size,
                modifiedDate: stats.mtime,
                createdDate: stats.birthtime,
                extension: path.extname(item),
                type: this.getFileType(path.extname(item))
              });
            }
          }
        } catch (error) {
          // 개별 파일/폴더 접근 오류는 무시하고 계속 진행
          console.log(`파일 접근 오류: ${fullPath}`, error.message);
        }
      }
    } catch (error) {
      console.log(`디렉토리 읽기 오류: ${dirPath}`, error.message);
    }
  }

  async matchesSearchConditions(filePath, stats, conditions) {
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    // 파일명 조건 확인
    if (conditions.fileName && !fileName.toLowerCase().includes(conditions.fileName.toLowerCase())) {
      return false;
    }
    
    // 확장자 조건 확인
    if (conditions.extension && !extension.includes(conditions.extension.toLowerCase())) {
      return false;
    }
    
    // 크기 조건 확인
    if (conditions.sizeRange) {
      if (conditions.sizeRange.min && stats.size < conditions.sizeRange.min) {
        return false;
      }
      if (conditions.sizeRange.max && stats.size > conditions.sizeRange.max) {
        return false;
      }
    }
    
    // 날짜 조건 확인
    if (conditions.dateRange) {
      const modifiedDate = stats.mtime.toISOString().split('T')[0];
      if (conditions.dateRange.start && modifiedDate < conditions.dateRange.start) {
        return false;
      }
      if (conditions.dateRange.end && modifiedDate > conditions.dateRange.end) {
        return false;
      }
    }
    
    // 파일 타입 조건 확인
    if (conditions.fileType && this.getFileType(extension) !== conditions.fileType) {
      return false;
    }
    
    // 크기 카테고리 조건 확인
    if (conditions.sizeCategory) {
      const actualSizeCategory = this.getSizeCategory(stats.size);
      if (actualSizeCategory !== conditions.sizeCategory) {
        return false;
      }
    }
    
    // 수정일 카테고리 조건 확인
    if (conditions.ageCategory) {
      const actualAgeCategory = this.getAgeCategory(stats.mtime);
      if (actualAgeCategory !== conditions.ageCategory) {
        return false;
      }
    }
    
    // 내용 키워드 검색 (텍스트 파일만)
    if (conditions.contentKeywords && this.isTextFile(extension)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const hasAllKeywords = conditions.contentKeywords.every(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasAllKeywords) {
          return false;
        }
      } catch (error) {
        // 내용 읽기 실패 시 해당 조건은 무시
        console.log(`내용 검색 실패: ${filePath}`, error.message);
      }
    }
    
    return true;
  }

  getFileType(extension) {
    const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.csv', '.log'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv'];
    
    if (textExtensions.includes(extension)) return 'text';
    if (imageExtensions.includes(extension)) return 'image';
    if (documentExtensions.includes(extension)) return 'document';
    if (audioExtensions.includes(extension)) return 'audio';
    if (videoExtensions.includes(extension)) return 'video';
    return 'binary';
  }

  isTextFile(extension) {
    const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.csv', '.log'];
    return textExtensions.includes(extension);
  }

  getSizeCategory(size) {
    if (size < 1024) return 'tiny';
    if (size < 1024 * 1024) return 'small';
    if (size < 10 * 1024 * 1024) return 'medium';
    if (size < 100 * 1024 * 1024) return 'large';
    return 'huge';
  }

  getAgeCategory(modifiedDate) {
    const now = new Date();
    const modifiedDays = Math.floor((now - modifiedDate) / (1000 * 60 * 60 * 24));
    
    if (modifiedDays < 1) return 'today';
    if (modifiedDays < 7) return 'recent';
    if (modifiedDays < 30) return 'month';
    if (modifiedDays < 365) return 'year';
    return 'old';
  }

  async enhanceSearchResults(results, originalQuery) {
    try {
      // 검색 결과에 AI 분석 추가
      const enhancedResults = await Promise.all(
        results.slice(0, 10).map(async (result) => {
          try {
            const relevanceScore = await this.calculateRelevanceScore(result, originalQuery);
            return {
              ...result,
              relevanceScore,
              aiInsight: await this.generateAIInsight(result, originalQuery)
            };
          } catch (error) {
            return {
              ...result,
              relevanceScore: 0.5,
              aiInsight: 'AI 분석을 수행할 수 없습니다.'
            };
          }
        })
      );

      // 관련도 점수로 정렬
      enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return enhancedResults;
    } catch (error) {
      console.log('검색 결과 강화 실패:', error);
      return results;
    }
  }

  async calculateRelevanceScore(file, query) {
    try {
      const prompt = `다음 파일이 검색 쿼리와 얼마나 관련이 있는지 0.0~1.0 사이의 점수로 평가해주세요:

파일명: ${file.fileName}
파일 경로: ${file.filePath}
파일 크기: ${file.size} bytes
파일 타입: ${file.type}
검색 쿼리: "${query}"

관련성을 고려하여 점수를 매겨주세요. 파일명, 경로, 타입, 크기 등을 종합적으로 고려하세요.
점수만 숫자로 응답해주세요.`;

      const response = await callClaude(prompt);
      const score = parseFloat(response.trim());
      
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      return 0.5;
    }
  }

  async generateAIInsight(file, query) {
    try {
      const prompt = `다음 파일에 대한 간단한 인사이트를 제공해주세요:

파일명: ${file.fileName}
파일 경로: ${file.filePath}
파일 크기: ${file.size} bytes
파일 타입: ${file.type}
검색 쿼리: "${query}"

이 파일이 검색 쿼리와 어떤 관련이 있는지, 어떤 용도로 사용될 수 있는지 간단히 설명해주세요.
2-3줄로 친근하게 답변해주세요.`;

      const response = await callClaude(prompt);
      return response;
    } catch (error) {
      return 'AI 인사이트를 생성할 수 없습니다.';
    }
  }

  async findSimilarFiles(targetFile, targetDirectory, similarityThreshold = 0.7) {
    try {
      const targetStats = await fs.stat(targetFile);
      const targetExt = path.extname(targetFile).toLowerCase();
      const similarFiles = [];

      // 같은 확장자와 비슷한 크기의 파일들 찾기
      await this.searchDirectory(targetDirectory, {
        extension: targetExt,
        sizeRange: {
          min: targetStats.size * 0.5,
          max: targetStats.size * 2.0
        }
      }, similarFiles);

      // AI를 사용한 유사도 분석
      const enhancedSimilarFiles = await Promise.all(
        similarFiles.slice(0, 20).map(async (file) => {
          try {
            const similarity = await this.calculateFileSimilarity(targetFile, file.filePath);
            return {
              ...file,
              similarity,
              isSimilar: similarity >= similarityThreshold
            };
          } catch (error) {
            return {
              ...file,
              similarity: 0,
              isSimilar: false
            };
          }
        })
      );

      return enhancedSimilarFiles
        .filter(file => file.isSimilar)
        .sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      throw new Error(`유사 파일 탐지 실패: ${error.message}`);
    }
  }

  async calculateFileSimilarity(file1, file2) {
    try {
      const ext1 = path.extname(file1).toLowerCase();
      const ext2 = path.extname(file2).toLowerCase();

      // 확장자가 다르면 유사도 낮음
      if (ext1 !== ext2) return 0.1;

      // 텍스트 파일인 경우 내용 비교
      if (this.isTextFile(ext1)) {
        return await this.calculateTextSimilarity(file1, file2);
      }

      // 바이너리 파일인 경우 크기와 이름 기반 유사도
      return await this.calculateBinarySimilarity(file1, file2);
    } catch (error) {
      return 0;
    }
  }

  async calculateTextSimilarity(file1, file2) {
    try {
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');

      const words1 = content1.toLowerCase().split(/\s+/);
      const words2 = content2.toLowerCase().split(/\s+/);

      const uniqueWords1 = [...new Set(words1)];
      const uniqueWords2 = [...new Set(words2)];

      const intersection = uniqueWords1.filter(word => uniqueWords2.includes(word));
      const union = [...new Set([...uniqueWords1, ...uniqueWords2])];

      return intersection.length / union.length;
    } catch (error) {
      return 0;
    }
  }

  async calculateBinarySimilarity(file1, file2) {
    try {
      const stats1 = await fs.stat(file1);
      const stats2 = await fs.stat(file2);

      const name1 = path.basename(file1, path.extname(file1));
      const name2 = path.basename(file2, path.extname(file2));

      // 크기 유사도
      const sizeSimilarity = 1 - Math.abs(stats1.size - stats2.size) / Math.max(stats1.size, stats2.size);

      // 이름 유사도 (간단한 문자열 유사도)
      const nameSimilarity = this.calculateStringSimilarity(name1, name2);

      return (sizeSimilarity + nameSimilarity) / 2;
    } catch (error) {
      return 0;
    }
  }

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  addToSearchHistory(query, resultCount) {
    this.searchHistory.push({
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });

    // 최근 100개만 유지
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }
  }

  async getSearchSuggestions(partialQuery) {
    try {
      // 검색 히스토리에서 유사한 쿼리 찾기
      const similarQueries = this.searchHistory
        .filter(item => item.query.toLowerCase().includes(partialQuery.toLowerCase()))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(item => item.query);

      // AI 기반 검색 추천
      const aiSuggestions = await this.generateAISearchSuggestions(partialQuery);

      return {
        historySuggestions: similarQueries,
        aiSuggestions: aiSuggestions
      };
    } catch (error) {
      return {
        historySuggestions: [],
        aiSuggestions: []
      };
    }
  }

  async generateAISearchSuggestions(partialQuery) {
    try {
      const prompt = `다음 부분 검색 쿼리에 대한 검색 제안을 생성해주세요:

부분 쿼리: "${partialQuery}"

파일 검색과 관련된 5개의 유용한 검색 제안을 생성해주세요.
각 제안은 자연어로 작성하고, 파일명, 확장자, 크기, 날짜, 내용 등을 포함할 수 있습니다.

예시:
- "지난주에 수정된 PDF 파일"
- "크기가 10MB 이상인 이미지 파일"
- "JavaScript 코드 파일 중 'function' 포함된 것"

5개의 제안만 간단히 나열해주세요.`;

      const response = await callClaude(prompt);
      return response.split('\n').filter(line => line.trim()).slice(0, 5);
    } catch (error) {
      return [];
    }
  }

  async getSearchAnalytics() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentSearches = this.searchHistory.filter(
      item => new Date(item.timestamp) >= lastWeek
    );

    const popularQueries = this.searchHistory
      .reduce((acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
      }, {});

    const topQueries = Object.entries(popularQueries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      totalSearches: this.searchHistory.length,
      recentSearches: recentSearches.length,
      topQueries,
      averageResults: this.searchHistory.length > 0 
        ? this.searchHistory.reduce((sum, item) => sum + item.resultCount, 0) / this.searchHistory.length 
        : 0
    };
  }
}

export default new AdvancedSearchService(); 