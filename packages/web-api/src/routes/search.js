import express from 'express';
import path from 'path';
import os from 'os';
import advancedSearchService from '../services/advancedSearchService.js';

const router = express.Router();

// 기본 검색 (GET)
router.get('/', async (req, res) => {
  try {
    const { path: searchPath, query, fileTypes, caseSensitive, advanced } = req.query;
    
    console.log('📁 검색 요청:', { searchPath, query, fileTypes, caseSensitive, advanced });
    
    if (!query) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    const searchDirectory = searchPath || '/mnt/d';
    console.log('📁 검색 디렉토리:', searchDirectory);
    
    // 간단한 파일 검색 (advancedSearchService 우회)
    const simpleResults = await performSimpleFileSearch(searchDirectory, query, fileTypes);
    console.log('📁 간단 검색 결과:', simpleResults.length, '개 파일');
    
    res.json({
      success: true,
      data: simpleResults,
      source: 'web-api-simple',
      searchParams: { searchPath, query, fileTypes }
    });
  } catch (error) {
    console.error('기본 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 간단한 파일 검색 함수
async function performSimpleFileSearch(searchDir, query, fileTypes) {
  const results = [];
  
  try {
    const fs = await import('fs/promises');
    const items = await fs.readdir(searchDir, { withFileTypes: true });
    
    console.log(`📁 ${searchDir}에서 ${items.length}개 항목 발견`);
    
    for (const item of items) {
      try {
        const fullPath = path.join(searchDir, item.name);
        
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase().replace('.', '');
          const nameMatch = item.name.toLowerCase().includes(query.toLowerCase());
          const typeMatch = !fileTypes || fileTypes.split(',').includes(ext);
          
          if (nameMatch || typeMatch) {
            const stats = await fs.stat(fullPath);
            results.push({
              name: item.name,
              path: fullPath,
              size: stats.size,
              type: 'file',
              extension: ext,
              modified: stats.mtime,
              isDirectory: false
            });
          }
        }
      } catch (itemError) {
        console.warn(`📁 항목 처리 실패: ${item.name}`, itemError.message);
      }
    }
  } catch (error) {
    console.error(`📁 디렉토리 읽기 실패: ${searchDir}`, error.message);
  }
  
  return results;
}

// 자연어 검색
router.post('/natural', async (req, res) => {
  try {
    const { query, targetDirectory } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: '검색 쿼리가 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const results = await advancedSearchService.naturalLanguageSearch(query, searchDirectory);
    
    res.json(results);
  } catch (error) {
    console.error('자연어 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 고급 검색 (구조화된 조건)
router.post('/advanced', async (req, res) => {
  try {
    const { conditions, targetDirectory } = req.body;
    
    if (!conditions) {
      return res.status(400).json({ error: '검색 조건이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const results = await advancedSearchService.executeAdvancedSearch(conditions, searchDirectory);
    const enhancedResults = await advancedSearchService.enhanceSearchResults(results, JSON.stringify(conditions));
    
    res.json({
      conditions,
      results: enhancedResults,
      totalCount: results.length,
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('고급 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 유사 파일 탐지
router.post('/similar', async (req, res) => {
  try {
    const { targetFile, targetDirectory, similarityThreshold = 0.7 } = req.body;
    
    if (!targetFile) {
      return res.status(400).json({ error: '대상 파일이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const similarFiles = await advancedSearchService.findSimilarFiles(targetFile, searchDirectory, similarityThreshold);
    
    res.json({
      targetFile,
      similarFiles,
      totalCount: similarFiles.length,
      similarityThreshold,
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('유사 파일 탐지 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 중복 파일 탐지
router.post('/duplicates', async (req, res) => {
  try {
    const { targetDirectory, minSize = 1024 } = req.body;
    
    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    // 먼저 모든 파일을 가져옴
    const allFiles = [];
    await advancedSearchService.searchDirectory(searchDirectory, {}, allFiles);
    
    // 크기별로 그룹화
    const sizeGroups = {};
    allFiles.forEach(file => {
      if (file.size >= minSize) {
        if (!sizeGroups[file.size]) {
          sizeGroups[file.size] = [];
        }
        sizeGroups[file.size].push(file);
      }
    });
    
    // 같은 크기의 파일들 중에서 중복 가능성이 있는 것들 찾기
    const duplicateGroups = [];
    for (const [size, files] of Object.entries(sizeGroups)) {
      if (files.length > 1) {
        // 같은 크기의 파일들을 유사도로 분석
        const similarGroups = [];
        
        for (let i = 0; i < files.length; i++) {
          const group = [files[i]];
          
          for (let j = i + 1; j < files.length; j++) {
            const similarity = await advancedSearchService.calculateFileSimilarity(files[i].filePath, files[j].filePath);
            if (similarity > 0.9) { // 90% 이상 유사하면 중복으로 간주
              group.push(files[j]);
            }
          }
          
          if (group.length > 1) {
            similarGroups.push(group);
          }
        }
        
        if (similarGroups.length > 0) {
          duplicateGroups.push(...similarGroups);
        }
      }
    }
    
    res.json({
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.length, 0),
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('중복 파일 탐지 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 제안
router.get('/suggestions', async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    const suggestions = await advancedSearchService.getSearchSuggestions(query);
    
    res.json(suggestions);
  } catch (error) {
    console.error('검색 제안 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 통계
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await advancedSearchService.getSearchAnalytics();
    
    res.json(analytics);
  } catch (error) {
    console.error('검색 통계 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 히스토리
router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const history = advancedSearchService.searchHistory
      .slice(-parseInt(limit))
      .reverse();
    
    res.json({ history });
  } catch (error) {
    console.error('검색 히스토리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 히스토리 삭제
router.delete('/history', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (query) {
      // 특정 쿼리 삭제
      advancedSearchService.searchHistory = advancedSearchService.searchHistory.filter(
        item => item.query !== query
      );
    } else {
      // 전체 히스토리 삭제
      advancedSearchService.searchHistory = [];
    }
    
    res.json({ message: '검색 히스토리가 삭제되었습니다.' });
  } catch (error) {
    console.error('검색 히스토리 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 내용 검색
router.post('/content', async (req, res) => {
  try {
    const { keywords, targetDirectory, fileTypes = ['text'] } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: '검색 키워드가 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    // 텍스트 파일만 검색
    const conditions = {
      fileType: fileTypes,
      contentKeywords: keywords
    };
    
    const results = await advancedSearchService.executeAdvancedSearch(conditions, searchDirectory);
    const enhancedResults = await advancedSearchService.enhanceSearchResults(results, keywords.join(' '));
    
    res.json({
      keywords,
      results: enhancedResults,
      totalCount: results.length,
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('내용 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일명 패턴 검색
router.post('/pattern', async (req, res) => {
  try {
    const { pattern, targetDirectory, caseSensitive = false } = req.body;
    
    if (!pattern) {
      return res.status(400).json({ error: '검색 패턴이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    // 패턴을 정규식으로 변환
    let regexPattern;
    try {
      regexPattern = new RegExp(pattern, caseSensitive ? '' : 'i');
    } catch (error) {
      return res.status(400).json({ error: '잘못된 정규식 패턴입니다.' });
    }
    
    const allFiles = [];
    await advancedSearchService.searchDirectory(searchDirectory, {}, allFiles);
    
    const matchedFiles = allFiles.filter(file => regexPattern.test(file.fileName));
    const enhancedResults = await advancedSearchService.enhanceSearchResults(matchedFiles, pattern);
    
    res.json({
      pattern,
      results: enhancedResults,
      totalCount: matchedFiles.length,
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('패턴 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 결과 내보내기
router.post('/export', async (req, res) => {
  try {
    const { searchResults, format = 'json' } = req.body;
    
    if (!searchResults || !Array.isArray(searchResults)) {
      return res.status(400).json({ error: '검색 결과가 필요합니다.' });
    }

    let exportData;
    
    switch (format.toLowerCase()) {
      case 'csv':
        const csvHeaders = ['파일명', '경로', '크기', '수정일', '타입', '확장자'];
        const csvRows = searchResults.map(file => [
          file.fileName,
          file.filePath,
          file.size,
          file.modifiedDate,
          file.type,
          file.extension
        ]);
        
        exportData = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        break;
        
      case 'json':
      default:
        exportData = JSON.stringify(searchResults, null, 2);
        break;
    }
    
    res.json({
      format,
      data: exportData,
      count: searchResults.length,
      exportTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('검색 결과 내보내기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 검색 설정
router.get('/settings', (req, res) => {
  res.json({
    defaultSearchDirectory: path.join(os.homedir(), 'Documents'),
    supportedFileTypes: ['text', 'image', 'document', 'audio', 'video', 'binary'],
    maxSearchResults: 1000,
    searchTimeout: 30000, // 30초
    enableAIEnhancement: true,
    enableSearchHistory: true
  });
});

// 검색 설정 업데이트
router.put('/settings', (req, res) => {
  try {
    const { maxSearchResults, enableAIEnhancement, enableSearchHistory } = req.body;
    
    // 실제로는 설정을 저장하는 로직이 필요
    const updatedSettings = {
      maxSearchResults: maxSearchResults || 1000,
      enableAIEnhancement: enableAIEnhancement !== false,
      enableSearchHistory: enableSearchHistory !== false
    };
    
    res.json({
      message: '검색 설정이 업데이트되었습니다.',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('검색 설정 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 