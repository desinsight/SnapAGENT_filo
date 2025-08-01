import express from 'express';
import path from 'path';
import os from 'os';
import fileSortFilterService from '../services/fileSortFilterService.js';

const router = express.Router();

// 파일 정렬
router.post('/sort', async (req, res) => {
  try {
    const { files, sortCriteria, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '정렬할 파일 목록이 필요합니다.' });
    }

    if (!sortCriteria) {
      return res.status(400).json({ error: '정렬 기준이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const sortedFiles = await fileSortFilterService.sortFiles(files, sortCriteria, searchDirectory);
    
    res.json({
      originalCount: files.length,
      sortedCount: sortedFiles.length,
      sortCriteria,
      sortedFiles,
      sortTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('파일 정렬 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 필터링
router.post('/filter', async (req, res) => {
  try {
    const { files, filterCriteria } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '필터링할 파일 목록이 필요합니다.' });
    }

    if (!filterCriteria) {
      return res.status(400).json({ error: '필터 조건이 필요합니다.' });
    }

    const filteredFiles = await fileSortFilterService.filterFiles(files, filterCriteria);
    
    res.json({
      originalCount: files.length,
      filteredCount: filteredFiles.length,
      filterCriteria,
      filteredFiles,
      filterTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('파일 필터링 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정렬 및 필터링 동시 적용
router.post('/sort-filter', async (req, res) => {
  try {
    const { files, sortCriteria, filterCriteria, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '처리할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    // 먼저 필터링
    let processedFiles = files;
    if (filterCriteria) {
      processedFiles = await fileSortFilterService.filterFiles(files, filterCriteria);
    }
    
    // 그 다음 정렬
    if (sortCriteria) {
      processedFiles = await fileSortFilterService.sortFiles(processedFiles, sortCriteria, searchDirectory);
    }
    
    res.json({
      originalCount: files.length,
      processedCount: processedFiles.length,
      sortCriteria,
      filterCriteria,
      processedFiles,
      processTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('정렬 및 필터링 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정렬 추천
router.post('/sort-recommendations', async (req, res) => {
  try {
    const { files, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '분석할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const recommendations = await fileSortFilterService.getSortRecommendations(files, searchDirectory);
    
    res.json(recommendations);
  } catch (error) {
    console.error('정렬 추천 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 필터 추천
router.post('/filter-recommendations', async (req, res) => {
  try {
    const { files, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '분석할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const recommendations = await fileSortFilterService.getFilterRecommendations(files, searchDirectory);
    
    res.json(recommendations);
  } catch (error) {
    console.error('필터 추천 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 고급 정렬 옵션 가져오기
router.get('/sort-options', async (req, res) => {
  try {
    const { files, targetDirectory } = req.query;
    
    let fileList = [];
    if (files) {
      try {
        fileList = JSON.parse(files);
      } catch (error) {
        return res.status(400).json({ error: '잘못된 파일 목록 형식입니다.' });
      }
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const options = await fileSortFilterService.getAdvancedSortOptions(fileList, searchDirectory);
    
    res.json(options);
  } catch (error) {
    console.error('정렬 옵션 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 고급 필터 옵션 가져오기
router.get('/filter-options', async (req, res) => {
  try {
    const { files, targetDirectory } = req.query;
    
    let fileList = [];
    if (files) {
      try {
        fileList = JSON.parse(files);
      } catch (error) {
        return res.status(400).json({ error: '잘못된 파일 목록 형식입니다.' });
      }
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const options = await fileSortFilterService.getAdvancedFilterOptions(fileList, searchDirectory);
    
    res.json(options);
  } catch (error) {
    console.error('필터 옵션 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 중요도 계산
router.post('/importance', async (req, res) => {
  try {
    const { files, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '분석할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    const filesWithImportance = await Promise.all(
      files.map(async (file) => {
        try {
          const importance = await fileSortFilterService.calculateFileImportance(file, searchDirectory);
          return { ...file, importance };
        } catch (error) {
          return { ...file, importance: 0.5 };
        }
      })
    );
    
    // 중요도 순으로 정렬
    filesWithImportance.sort((a, b) => b.importance - a.importance);
    
    res.json({
      files: filesWithImportance,
      totalCount: filesWithImportance.length,
      averageImportance: filesWithImportance.reduce((sum, file) => sum + file.importance, 0) / filesWithImportance.length,
      analysisTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('파일 중요도 계산 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 추천 정렬
router.post('/ai-sort', async (req, res) => {
  try {
    const { files, targetDirectory, userContext } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '정렬할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    const sortedFiles = await fileSortFilterService.sortByAIRecommendation(files, searchDirectory);
    
    res.json({
      originalCount: files.length,
      sortedCount: sortedFiles.length,
      userContext,
      sortedFiles,
      sortTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI 추천 정렬 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 스마트 필터
router.post('/ai-filter', async (req, res) => {
  try {
    const { files, aiFilterCriteria } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '필터링할 파일 목록이 필요합니다.' });
    }

    if (!aiFilterCriteria) {
      return res.status(400).json({ error: 'AI 필터 조건이 필요합니다.' });
    }

    const filteredFiles = await fileSortFilterService.applyAIFilter(files, aiFilterCriteria);
    
    res.json({
      originalCount: files.length,
      filteredCount: filteredFiles.length,
      aiFilterCriteria,
      filteredFiles,
      filterTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI 스마트 필터 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정렬 및 필터링 통계
router.post('/statistics', async (req, res) => {
  try {
    const { files, targetDirectory } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '분석할 파일 목록이 필요합니다.' });
    }

    const searchDirectory = targetDirectory || path.join(os.homedir(), 'Documents');
    
    // 파일 타입별 통계
    const typeStats = {};
    const sizeStats = {};
    const ageStats = {};
    
    files.forEach(file => {
      const fileType = fileSortFilterService.getFileType(file.extension);
      const sizeCategory = fileSortFilterService.getSizeCategory(file.size);
      const ageCategory = fileSortFilterService.getAgeCategory(file.modifiedDate);
      
      typeStats[fileType] = (typeStats[fileType] || 0) + 1;
      sizeStats[sizeCategory] = (sizeStats[sizeCategory] || 0) + 1;
      ageStats[ageCategory] = (ageStats[ageCategory] || 0) + 1;
    });
    
    // 확장자별 통계
    const extensionStats = {};
    files.forEach(file => {
      extensionStats[file.extension] = (extensionStats[file.extension] || 0) + 1;
    });
    
    // 크기 통계
    const sizes = files.map(file => file.size);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const averageSize = totalSize / files.length;
    
    res.json({
      totalFiles: files.length,
      totalSize,
      averageSize,
      typeDistribution: typeStats,
      sizeDistribution: sizeStats,
      ageDistribution: ageStats,
      extensionDistribution: extensionStats,
      sizeRange: {
        min: Math.min(...sizes),
        max: Math.max(...sizes)
      },
      analysisTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('통계 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정렬 및 필터링 설정
router.get('/settings', (req, res) => {
  res.json({
    defaultSortMethod: 'name-asc',
    defaultFilterCriteria: {},
    enableAIRecommendations: true,
    enableImportanceCalculation: true,
    maxFilesForAnalysis: 1000,
    analysisTimeout: 30000, // 30초
    supportedSortMethods: [
      'name-asc', 'name-desc',
      'size-asc', 'size-desc',
      'date-asc', 'date-desc',
      'type-asc', 'type-desc',
      'importance-asc', 'importance-desc',
      'ai-recommended'
    ],
    supportedFilterTypes: [
      'fileType', 'sizeCategory', 'ageCategory',
      'extension', 'dateRange', 'sizeRange',
      'fileNameKeywords', 'aiFilter'
    ]
  });
});

// 정렬 및 필터링 설정 업데이트
router.put('/settings', (req, res) => {
  try {
    const { 
      defaultSortMethod, 
      defaultFilterCriteria, 
      enableAIRecommendations, 
      enableImportanceCalculation,
      maxFilesForAnalysis 
    } = req.body;
    
    // 실제로는 설정을 저장하는 로직이 필요
    const updatedSettings = {
      defaultSortMethod: defaultSortMethod || 'name-asc',
      defaultFilterCriteria: defaultFilterCriteria || {},
      enableAIRecommendations: enableAIRecommendations !== false,
      enableImportanceCalculation: enableImportanceCalculation !== false,
      maxFilesForAnalysis: maxFilesForAnalysis || 1000
    };
    
    res.json({
      message: '정렬 및 필터링 설정이 업데이트되었습니다.',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정렬 및 필터링 히스토리
router.get('/history', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // 실제로는 히스토리를 저장하는 로직이 필요
    const history = [
      {
        type: 'sort',
        criteria: 'name-asc',
        fileCount: 150,
        timestamp: new Date().toISOString()
      },
      {
        type: 'filter',
        criteria: { fileType: ['document'] },
        fileCount: 25,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ].slice(0, parseInt(limit));
    
    res.json({ history });
  } catch (error) {
    console.error('히스토리 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 