import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { callClaude } from './claudeService.js';

class FileSortFilterService {
  constructor() {
    this.sortOptions = {
      name: { asc: 'name-asc', desc: 'name-desc' },
      size: { asc: 'size-asc', desc: 'size-desc' },
      date: { asc: 'date-asc', desc: 'date-desc' },
      type: { asc: 'type-asc', desc: 'type-desc' },
      importance: { asc: 'importance-asc', desc: 'importance-desc' }
    };

    this.filterOptions = {
      fileType: ['text', 'image', 'document', 'audio', 'video', 'binary'],
      sizeCategory: ['tiny', 'small', 'medium', 'large', 'huge'],
      ageCategory: ['today', 'recent', 'month', 'year', 'old'],
      extension: [],
      dateRange: null,
      sizeRange: null
    };
  }

  async sortFiles(files, sortCriteria, targetDirectory) {
    try {
      let sortedFiles = [...files];

      // 다중 정렬 기준 처리
      if (Array.isArray(sortCriteria)) {
        for (const criteria of sortCriteria) {
          sortedFiles = await this.applySortCriteria(sortedFiles, criteria, targetDirectory);
        }
      } else {
        sortedFiles = await this.applySortCriteria(sortedFiles, sortCriteria, targetDirectory);
      }

      return sortedFiles;
    } catch (error) {
      throw new Error(`파일 정렬 실패: ${error.message}`);
    }
  }

  async applySortCriteria(files, criteria, targetDirectory) {
    switch (criteria) {
      case 'name-asc':
        return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
      
      case 'name-desc':
        return files.sort((a, b) => b.fileName.localeCompare(a.fileName));
      
      case 'size-asc':
        return files.sort((a, b) => a.size - b.size);
      
      case 'size-desc':
        return files.sort((a, b) => b.size - a.size);
      
      case 'date-asc':
        return files.sort((a, b) => a.modifiedDate - b.modifiedDate);
      
      case 'date-desc':
        return files.sort((a, b) => b.modifiedDate - a.modifiedDate);
      
      case 'type-asc':
        return files.sort((a, b) => a.extension.localeCompare(b.extension));
      
      case 'type-desc':
        return files.sort((a, b) => b.extension.localeCompare(a.extension));
      
      case 'importance-asc':
      case 'importance-desc':
        return await this.sortByImportance(files, criteria === 'importance-desc', targetDirectory);
      
      case 'ai-recommended':
        return await this.sortByAIRecommendation(files, targetDirectory);
      
      default:
        return files;
    }
  }

  async sortByImportance(files, descending = false, targetDirectory) {
    try {
      // AI를 사용하여 파일 중요도 계산
      const filesWithImportance = await Promise.all(
        files.map(async (file) => {
          try {
            const importance = await this.calculateFileImportance(file, targetDirectory);
            return { ...file, importance };
          } catch (error) {
            return { ...file, importance: 0.5 };
          }
        })
      );

      return filesWithImportance.sort((a, b) => {
        return descending ? b.importance - a.importance : a.importance - b.importance;
      });
    } catch (error) {
      console.log('중요도 정렬 실패:', error);
      return files;
    }
  }

  async calculateFileImportance(file, targetDirectory) {
    try {
      const prompt = `다음 파일의 중요도를 0.0~1.0 사이의 점수로 평가해주세요:

파일명: ${file.fileName}
파일 경로: ${file.filePath}
파일 크기: ${file.size} bytes
파일 타입: ${file.type}
확장자: ${file.extension}
수정일: ${file.modifiedDate}

다음 기준으로 중요도를 평가해주세요:
1. 파일명의 의미 (중요한 키워드 포함 여부)
2. 파일 크기 (적절한 크기인지)
3. 파일 타입 (문서, 코드, 이미지 등)
4. 수정일 (최근 수정된 파일인지)
5. 경로 위치 (중요한 폴더에 있는지)

점수만 숫자로 응답해주세요.`;

      const response = await callClaude(prompt);
      const score = parseFloat(response.trim());
      
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      return 0.5;
    }
  }

  async sortByAIRecommendation(files, targetDirectory) {
    try {
      const prompt = `다음 파일들을 사용자가 가장 유용하게 사용할 수 있는 순서로 정렬해주세요:

파일 목록:
${files.map((file, index) => `${index + 1}. ${file.fileName} (${file.type}, ${file.size} bytes)`).join('\n')}

사용자의 작업 효율성을 고려하여 가장 유용한 순서로 파일 번호만 나열해주세요.
예: 3, 1, 5, 2, 4`;

      const response = await callClaude(prompt);
      
      // 응답에서 숫자 추출
      const numbers = response.match(/\d+/g);
      if (numbers && numbers.length === files.length) {
        const sortedIndices = numbers.map(num => parseInt(num) - 1);
        return sortedIndices.map(index => files[index]);
      }
      
      return files;
    } catch (error) {
      console.log('AI 추천 정렬 실패:', error);
      return files;
    }
  }

  async filterFiles(files, filterCriteria) {
    try {
      let filteredFiles = [...files];

      // 파일 타입 필터
      if (filterCriteria.fileType && filterCriteria.fileType.length > 0) {
        filteredFiles = filteredFiles.filter(file => 
          filterCriteria.fileType.includes(this.getFileType(file.extension))
        );
      }

      // 크기 카테고리 필터
      if (filterCriteria.sizeCategory && filterCriteria.sizeCategory.length > 0) {
        filteredFiles = filteredFiles.filter(file => 
          filterCriteria.sizeCategory.includes(this.getSizeCategory(file.size))
        );
      }

      // 수정일 카테고리 필터
      if (filterCriteria.ageCategory && filterCriteria.ageCategory.length > 0) {
        filteredFiles = filteredFiles.filter(file => 
          filterCriteria.ageCategory.includes(this.getAgeCategory(file.modifiedDate))
        );
      }

      // 확장자 필터
      if (filterCriteria.extension && filterCriteria.extension.length > 0) {
        filteredFiles = filteredFiles.filter(file => 
          filterCriteria.extension.some(ext => 
            file.extension.toLowerCase().includes(ext.toLowerCase())
          )
        );
      }

      // 날짜 범위 필터
      if (filterCriteria.dateRange) {
        filteredFiles = filteredFiles.filter(file => {
          const fileDate = file.modifiedDate.toISOString().split('T')[0];
          if (filterCriteria.dateRange.start && fileDate < filterCriteria.dateRange.start) {
            return false;
          }
          if (filterCriteria.dateRange.end && fileDate > filterCriteria.dateRange.end) {
            return false;
          }
          return true;
        });
      }

      // 크기 범위 필터
      if (filterCriteria.sizeRange) {
        filteredFiles = filteredFiles.filter(file => {
          if (filterCriteria.sizeRange.min && file.size < filterCriteria.sizeRange.min) {
            return false;
          }
          if (filterCriteria.sizeRange.max && file.size > filterCriteria.sizeRange.max) {
            return false;
          }
          return true;
        });
      }

      // 파일명 키워드 필터
      if (filterCriteria.fileNameKeywords && filterCriteria.fileNameKeywords.length > 0) {
        filteredFiles = filteredFiles.filter(file => 
          filterCriteria.fileNameKeywords.every(keyword => 
            file.fileName.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }

      // AI 기반 스마트 필터
      if (filterCriteria.aiFilter) {
        filteredFiles = await this.applyAIFilter(filteredFiles, filterCriteria.aiFilter);
      }

      return filteredFiles;
    } catch (error) {
      throw new Error(`파일 필터링 실패: ${error.message}`);
    }
  }

  async applyAIFilter(files, aiFilterCriteria) {
    try {
      const prompt = `다음 파일들 중에서 "${aiFilterCriteria}" 조건에 맞는 파일들을 선택해주세요:

파일 목록:
${files.map((file, index) => `${index + 1}. ${file.fileName} (${file.type}, ${file.size} bytes, ${file.extension})`).join('\n')}

조건에 맞는 파일의 번호만 나열해주세요. 예: 1, 3, 5`;

      const response = await callClaude(prompt);
      
      // 응답에서 숫자 추출
      const numbers = response.match(/\d+/g);
      if (numbers) {
        const selectedIndices = numbers.map(num => parseInt(num) - 1);
        return selectedIndices
          .filter(index => index >= 0 && index < files.length)
          .map(index => files[index]);
      }
      
      return files;
    } catch (error) {
      console.log('AI 필터 적용 실패:', error);
      return files;
    }
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

  async getSortRecommendations(files, targetDirectory) {
    try {
      const prompt = `다음 파일들을 분석하여 가장 유용한 정렬 방법을 추천해주세요:

파일 목록:
${files.map((file, index) => `${index + 1}. ${file.fileName} (${file.type}, ${file.size} bytes, ${file.extension})`).join('\n')}

다음 중에서 가장 적합한 정렬 방법을 선택해주세요:
1. 이름순 (name-asc/desc)
2. 크기순 (size-asc/desc)
3. 날짜순 (date-asc/desc)
4. 타입순 (type-asc/desc)
5. 중요도순 (importance-asc/desc)
6. AI 추천순 (ai-recommended)

선택한 정렬 방법과 그 이유를 간단히 설명해주세요.`;

      const response = await callClaude(prompt);
      
      // 응답에서 정렬 방법 추출
      const sortMethods = ['name-asc', 'name-desc', 'size-asc', 'size-desc', 'date-asc', 'date-desc', 'type-asc', 'type-desc', 'importance-asc', 'importance-desc', 'ai-recommended'];
      const recommendedMethod = sortMethods.find(method => response.includes(method)) || 'name-asc';
      
      return {
        recommendedMethod,
        explanation: response,
        alternatives: sortMethods.filter(method => method !== recommendedMethod).slice(0, 3)
      };
    } catch (error) {
      return {
        recommendedMethod: 'name-asc',
        explanation: '기본 정렬 방법을 사용합니다.',
        alternatives: ['size-desc', 'date-desc', 'type-asc']
      };
    }
  }

  async getFilterRecommendations(files, targetDirectory) {
    try {
      const fileTypes = [...new Set(files.map(file => this.getFileType(file.extension)))];
      const sizeCategories = [...new Set(files.map(file => this.getSizeCategory(file.size)))];
      const ageCategories = [...new Set(files.map(file => this.getAgeCategory(file.modifiedDate)))];
      const extensions = [...new Set(files.map(file => file.extension))];

      const prompt = `다음 파일들을 분석하여 유용한 필터 옵션을 추천해주세요:

파일 통계:
- 총 파일 수: ${files.length}
- 파일 타입: ${fileTypes.join(', ')}
- 크기 카테고리: ${sizeCategories.join(', ')}
- 수정일 카테고리: ${ageCategories.join(', ')}
- 주요 확장자: ${extensions.slice(0, 10).join(', ')}

사용자가 파일을 효율적으로 찾을 수 있도록 유용한 필터 조합을 3개 추천해주세요.
각 조합에 대한 설명도 함께 제공해주세요.`;

      const response = await callClaude(prompt);
      
      return {
        recommendations: [
          {
            name: '최근 문서',
            filters: { fileType: ['document'], ageCategory: ['recent', 'today'] },
            description: '최근에 수정된 문서 파일들'
          },
          {
            name: '대용량 파일',
            filters: { sizeCategory: ['large', 'huge'] },
            description: '크기가 큰 파일들'
          },
          {
            name: '코드 파일',
            filters: { fileType: ['text'], extension: ['.js', '.py', '.java', '.cpp'] },
            description: '프로그래밍 코드 파일들'
          }
        ],
        explanation: response
      };
    } catch (error) {
      return {
        recommendations: [],
        explanation: '필터 추천을 생성할 수 없습니다.'
      };
    }
  }

  async getAdvancedSortOptions(files, targetDirectory) {
    const options = {
      basic: [
        { value: 'name-asc', label: '이름 (오름차순)' },
        { value: 'name-desc', label: '이름 (내림차순)' },
        { value: 'size-asc', label: '크기 (오름차순)' },
        { value: 'size-desc', label: '크기 (내림차순)' },
        { value: 'date-asc', label: '날짜 (오름차순)' },
        { value: 'date-desc', label: '날짜 (내림차순)' },
        { value: 'type-asc', label: '타입 (오름차순)' },
        { value: 'type-desc', label: '타입 (내림차순)' }
      ],
      advanced: [
        { value: 'importance-asc', label: '중요도 (낮음→높음)' },
        { value: 'importance-desc', label: '중요도 (높음→낮음)' },
        { value: 'ai-recommended', label: 'AI 추천 순서' }
      ],
      multi: [
        { value: ['date-desc', 'size-desc'], label: '최근 수정 + 큰 파일 우선' },
        { value: ['type-asc', 'name-asc'], label: '타입별 + 이름순' },
        { value: ['importance-desc', 'date-desc'], label: '중요도 + 최근 수정' }
      ]
    };

    return options;
  }

  async getAdvancedFilterOptions(files, targetDirectory) {
    const fileTypes = [...new Set(files.map(file => this.getFileType(file.extension)))];
    const sizeCategories = [...new Set(files.map(file => this.getSizeCategory(file.size)))];
    const ageCategories = [...new Set(files.map(file => this.getAgeCategory(file.modifiedDate)))];
    const extensions = [...new Set(files.map(file => file.extension))];

    const options = {
      fileType: fileTypes.map(type => ({ value: type, label: this.getFileTypeLabel(type) })),
      sizeCategory: sizeCategories.map(category => ({ value: category, label: this.getSizeCategoryLabel(category) })),
      ageCategory: ageCategories.map(category => ({ value: category, label: this.getAgeCategoryLabel(category) })),
      extension: extensions.slice(0, 20).map(ext => ({ value: ext, label: ext })),
      custom: [
        { value: 'ai-filter', label: 'AI 스마트 필터' },
        { value: 'keyword-filter', label: '키워드 필터' },
        { value: 'date-range', label: '날짜 범위' },
        { value: 'size-range', label: '크기 범위' }
      ]
    };

    return options;
  }

  getFileTypeLabel(type) {
    const labels = {
      text: '텍스트 파일',
      image: '이미지 파일',
      document: '문서 파일',
      audio: '오디오 파일',
      video: '비디오 파일',
      binary: '바이너리 파일'
    };
    return labels[type] || type;
  }

  getSizeCategoryLabel(category) {
    const labels = {
      tiny: '매우 작음 (< 1KB)',
      small: '작음 (< 1MB)',
      medium: '보통 (< 10MB)',
      large: '큼 (< 100MB)',
      huge: '매우 큼 (≥ 100MB)'
    };
    return labels[category] || category;
  }

  getAgeCategoryLabel(category) {
    const labels = {
      today: '오늘',
      recent: '최근 (1주일)',
      month: '이번 달',
      year: '올해',
      old: '오래됨 (1년 이상)'
    };
    return labels[category] || category;
  }
}

export default new FileSortFilterService(); 