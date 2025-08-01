import express from 'express';
import naturalLanguageProcessor from '../services/naturalLanguageProcessor.js';
import advancedSearchService from '../services/advancedSearchService.js';
import fileSortFilterService from '../services/fileSortFilterService.js';
import filePreviewService from '../services/filePreviewService.js';

const router = express.Router();

// 자연어 명령 처리
router.post('/process', async (req, res) => {
  try {
    const { command, context = {} } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: '명령어가 필요합니다.'
      });
    }

    console.log(`자연어 명령 처리: ${command}`);

    // 자연어 명령 처리
    const processedCommand = await naturalLanguageProcessor.processNaturalLanguageCommand(command, context);

    // 명령어 실행
    const result = await executeCommand(processedCommand);

    // 사용자 행동 학습
    await naturalLanguageProcessor.learnFromUserBehavior(command, result, req.body.feedback);

    res.json({
      success: true,
      data: {
        originalCommand: command,
        processedCommand,
        result,
        suggestions: processedCommand.suggestions
      }
    });
  } catch (error) {
    console.error('자연어 명령 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 복잡한 명령어 처리 (여러 명령어 체이닝)
router.post('/process-complex', async (req, res) => {
  try {
    const { commands, context = {} } = req.body;

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        error: '명령어 배열이 필요합니다.'
      });
    }

    console.log(`복잡한 명령어 처리: ${commands.length}개 명령어`);

    // 복잡한 명령어 분석
    const complexAnalysis = await naturalLanguageProcessor.processComplexCommand(commands);

    // 각 명령어 처리
    const results = [];
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const processedCommand = await naturalLanguageProcessor.processNaturalLanguageCommand(command, context);
      const result = await executeCommand(processedCommand);
      results.push({
        command,
        processedCommand,
        result
      });
    }

    res.json({
      success: true,
      data: {
        commands,
        complexAnalysis,
        results,
        summary: generateComplexCommandSummary(results)
      }
    });
  } catch (error) {
    console.error('복잡한 명령어 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 개인화된 제안 가져오기
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const suggestions = await naturalLanguageProcessor.getPersonalizedSuggestions(userId);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('개인화 제안 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 명령어 분석 통계
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await naturalLanguageProcessor.getCommandAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('명령어 분석 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 명령어 히스토리 가져오기
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, userId } = req.query;
    
    let history = naturalLanguageProcessor.commandHistory;
    
    if (userId) {
      history = history.filter(cmd => cmd.context?.userId === userId);
    }
    
    history = history.slice(-parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('명령어 히스토리 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 피드백 처리
router.post('/feedback', async (req, res) => {
  try {
    const { command, result, feedback } = req.body;

    if (!command || !feedback) {
      return res.status(400).json({
        success: false,
        error: '명령어와 피드백이 필요합니다.'
      });
    }

    const learningResult = await naturalLanguageProcessor.learnFromUserBehavior(command, result, feedback);

    res.json({
      success: true,
      data: learningResult
    });
  } catch (error) {
    console.error('사용자 피드백 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 명령어 실행 함수
async function executeCommand(processedCommand) {
  try {
    const { parsedCommand, executionPlan } = processedCommand;
    
    console.log(`명령어 실행: ${parsedCommand.primaryAction}`);

    switch (parsedCommand.primaryAction) {
      case 'search':
        return await executeSearch(parsedCommand);
        
      case 'sort':
        return await executeSort(parsedCommand);
        
      case 'filter':
        return await executeFilter(parsedCommand);
        
      case 'preview':
        return await executePreview(parsedCommand);
        
      case 'analyze':
        return await executeAnalyze(parsedCommand);
        
      case 'organize':
        return await executeOrganize(parsedCommand);
        
      default:
        return await executeSearch(parsedCommand);
    }
  } catch (error) {
    console.error('명령어 실행 오류:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// 검색 실행
async function executeSearch(parsedCommand) {
  try {
    const { criteria, options } = parsedCommand;
    
    if (criteria.search.keywords.length > 0) {
      // 자연어 검색
      const result = await advancedSearchService.naturalLanguageSearch({
        query: criteria.search.keywords.join(' '),
        filters: criteria.search.filters,
        options
      });
      
      return {
        success: true,
        action: 'search',
        data: result,
        metadata: {
          searchType: 'natural',
          keywords: criteria.search.keywords,
          filters: criteria.search.filters
        }
      };
    } else {
      // 고급 검색
      const result = await advancedSearchService.advancedSearch({
        filters: criteria.search.filters,
        options
      });
      
      return {
        success: true,
        action: 'search',
        data: result,
        metadata: {
          searchType: 'advanced',
          filters: criteria.search.filters
        }
      };
    }
  } catch (error) {
    throw new Error(`검색 실행 실패: ${error.message}`);
  }
}

// 정렬 실행
async function executeSort(parsedCommand) {
  try {
    const { criteria, options } = parsedCommand;
    
    const result = await fileSortFilterService.sortFiles({
      sortCriteria: criteria.sort,
      options
    });
    
    return {
      success: true,
      action: 'sort',
      data: result,
      metadata: {
        sortCriteria: criteria.sort
      }
    };
  } catch (error) {
    throw new Error(`정렬 실행 실패: ${error.message}`);
  }
}

// 필터 실행
async function executeFilter(parsedCommand) {
  try {
    const { criteria, options } = parsedCommand;
    
    const result = await fileSortFilterService.filterFiles({
      filterCriteria: criteria.filter,
      options
    });
    
    return {
      success: true,
      action: 'filter',
      data: result,
      metadata: {
        filterCriteria: criteria.filter
      }
    };
  } catch (error) {
    throw new Error(`필터 실행 실패: ${error.message}`);
  }
}

// 미리보기 실행
async function executePreview(parsedCommand) {
  try {
    const { targets, options } = parsedCommand;
    
    // 선택된 파일이 있는 경우
    if (targets.files && targets.files.length > 0) {
      const result = await filePreviewService.previewFile({
        filePath: targets.files[0],
        options
      });
      
      return {
        success: true,
        action: 'preview',
        data: result,
        metadata: {
          filePath: targets.files[0]
        }
      };
    } else {
      // 현재 디렉토리의 파일들 미리보기
      const result = await filePreviewService.previewDirectory({
        directoryPath: targets.directories?.[0] || '.',
        options
      });
      
      return {
        success: true,
        action: 'preview',
        data: result,
        metadata: {
          directoryPath: targets.directories?.[0] || '.'
        }
      };
    }
  } catch (error) {
    throw new Error(`미리보기 실행 실패: ${error.message}`);
  }
}

// 분석 실행
async function executeAnalyze(parsedCommand) {
  try {
    const { targets, options } = parsedCommand;
    
    const result = await fileSortFilterService.getFileStatistics({
      files: targets.files,
      directories: targets.directories,
      options
    });
    
    return {
      success: true,
      action: 'analyze',
      data: result,
      metadata: {
        analysisType: 'statistics',
        targets
      }
    };
  } catch (error) {
    throw new Error(`분석 실행 실패: ${error.message}`);
  }
}

// 정리 실행
async function executeOrganize(parsedCommand) {
  try {
    const { targets, criteria, options } = parsedCommand;
    
    // 기본적으로 파일 목록을 가져와서 정리 제안
    const result = await fileSortFilterService.organizeFiles({
      files: targets.files,
      directories: targets.directories,
      criteria: criteria.organize || {},
      options
    });
    
    return {
      success: true,
      action: 'organize',
      data: result,
      metadata: {
        organizeType: 'suggestion',
        targets
      }
    };
  } catch (error) {
    throw new Error(`정리 실행 실패: ${error.message}`);
  }
}

// 복잡한 명령어 요약 생성
function generateComplexCommandSummary(results) {
  try {
    const summary = {
      totalCommands: results.length,
      successfulCommands: results.filter(r => r.result.success).length,
      actions: {},
      totalFiles: 0,
      totalDirectories: 0
    };

    results.forEach(result => {
      const action = result.processedCommand.parsedCommand.primaryAction;
      summary.actions[action] = (summary.actions[action] || 0) + 1;
      
      if (result.result.data) {
        if (Array.isArray(result.result.data)) {
          summary.totalFiles += result.result.data.length;
        } else if (result.result.data.files) {
          summary.totalFiles += result.result.data.files.length;
        }
        if (result.result.data.directories) {
          summary.totalDirectories += result.result.data.directories.length;
        }
      }
    });

    summary.successRate = (summary.successfulCommands / summary.totalCommands) * 100;

    return summary;
  } catch (error) {
    console.error('복잡한 명령어 요약 생성 실패:', error);
    return {
      totalCommands: results.length,
      successfulCommands: 0,
      actions: {},
      totalFiles: 0,
      totalDirectories: 0,
      successRate: 0
    };
  }
}

export default router; 