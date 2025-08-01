import { promises as fs } from 'fs';
import path from 'path';
import { callClaude } from './claudeService.js';

class NaturalLanguageProcessor {
  constructor() {
    this.commandHistory = [];
    this.userPreferences = {};
    this.contextMemory = [];
    this.commandPatterns = {
      search: [
        '찾아', '검색', '보여줘', '가져와', '찾기', '검색해', '보여줘', '가져와줘',
        '어디에', '어디서', '무엇이', '어떤', '몇 개', '얼마나'
      ],
      sort: [
        '정렬', '순서', '정리', '배열', '나열', '정렬해', '순서대로', '크기순', '날짜순', '이름순'
      ],
      filter: [
        '필터', '거르기', '선택', '고르기', '제외', '빼고', '만', '중에서', '중에'
      ],
      preview: [
        '미리보기', '보기', '열기', '확인', '보여줘', '내용', '요약', '분석'
      ],
      organize: [
        '정리', '분류', '그룹', '폴더', '이동', '복사', '삭제', '백업'
      ],
      analyze: [
        '분석', '통계', '요약', '리포트', '인사이트', '패턴', '트렌드'
      ]
    };
  }

  async processNaturalLanguageCommand(command, context = {}) {
    try {
      // 명령어 히스토리에 추가
      this.addToCommandHistory(command, context);

      // 컨텍스트 분석
      const enhancedContext = await this.analyzeContext(command, context);

      // 명령어 파싱 및 구조화
      const parsedCommand = await this.parseCommand(command, enhancedContext);

      // 명령어 검증 및 최적화
      const validatedCommand = await this.validateAndOptimizeCommand(parsedCommand);

      // 실행 계획 생성
      const executionPlan = await this.createExecutionPlan(validatedCommand);

      return {
        originalCommand: command,
        parsedCommand: validatedCommand,
        executionPlan,
        context: enhancedContext,
        confidence: validatedCommand.confidence,
        suggestions: await this.generateSuggestions(command, validatedCommand)
      };
    } catch (error) {
      throw new Error(`자연어 명령 처리 실패: ${error.message}`);
    }
  }

  async analyzeContext(command, context) {
    try {
      const prompt = `다음 명령어와 컨텍스트를 분석하여 사용자의 의도를 파악해주세요:

명령어: "${command}"

현재 컨텍스트:
- 현재 디렉토리: ${context.currentDirectory || '알 수 없음'}
- 선택된 파일: ${context.selectedFiles?.length || 0}개
- 최근 작업: ${context.recentActions?.slice(-3).join(', ') || '없음'}
- 사용자 선호도: ${JSON.stringify(context.userPreferences || {})}

다음 JSON 형식으로 분석해주세요:
{
  "userIntent": "사용자의 주요 의도 (search, organize, analyze 등)",
  "urgency": "긴급도 (low, medium, high)",
  "complexity": "복잡도 (simple, moderate, complex)",
  "contextualHints": ["컨텍스트에서 추출한 힌트들"],
  "assumptions": ["명령어에서 추정되는 가정들"],
  "missingInfo": ["부족한 정보들"],
  "confidence": 0.0-1.0
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return { ...context, ...JSON.parse(jsonMatch[0]) };
        }
      } catch (parseError) {
        console.log('컨텍스트 분석 JSON 파싱 실패:', parseError);
      }

      return {
        ...context,
        userIntent: this.detectIntent(command),
        urgency: 'medium',
        complexity: 'simple',
        confidence: 0.7
      };
    } catch (error) {
      console.log('컨텍스트 분석 실패:', error);
      return context;
    }
  }

  async parseCommand(command, context) {
    try {
      const prompt = `다음 자연어 명령어를 구조화된 명령어로 변환해주세요:

명령어: "${command}"
컨텍스트: ${JSON.stringify(context, null, 2)}

다음 JSON 형식으로 변환해주세요:
{
  "primaryAction": "주요 액션 (search, sort, filter, preview, organize, analyze)",
  "secondaryActions": ["보조 액션들"],
  "targets": {
    "files": ["대상 파일 조건들"],
    "directories": ["대상 디렉토리들"],
    "patterns": ["파일 패턴들"]
  },
  "criteria": {
    "search": {
      "keywords": ["검색 키워드들"],
      "filters": {
        "fileType": ["파일 타입들"],
        "sizeRange": {"min": 최소크기, "max": 최대크기},
        "dateRange": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
        "content": ["내용 검색 조건들"]
      }
    },
    "sort": {
      "primary": "주요 정렬 기준",
      "secondary": "보조 정렬 기준",
      "direction": "asc/desc"
    },
    "filter": {
      "include": ["포함할 조건들"],
      "exclude": ["제외할 조건들"]
    }
  },
  "options": {
    "recursive": true/false,
    "caseSensitive": true/false,
    "useAI": true/false,
    "limit": 최대결과수
  },
  "confidence": 0.0-1.0
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('명령어 파싱 JSON 파싱 실패:', parseError);
      }

      // 기본 파싱
      return this.basicParseCommand(command);
    } catch (error) {
      console.log('명령어 파싱 실패:', error);
      return this.basicParseCommand(command);
    }
  }

  basicParseCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    // 기본 액션 감지
    let primaryAction = 'search';
    if (this.commandPatterns.sort.some(pattern => lowerCommand.includes(pattern))) {
      primaryAction = 'sort';
    } else if (this.commandPatterns.filter.some(pattern => lowerCommand.includes(pattern))) {
      primaryAction = 'filter';
    } else if (this.commandPatterns.preview.some(pattern => lowerCommand.includes(pattern))) {
      primaryAction = 'preview';
    } else if (this.commandPatterns.organize.some(pattern => lowerCommand.includes(pattern))) {
      primaryAction = 'organize';
    } else if (this.commandPatterns.analyze.some(pattern => lowerCommand.includes(pattern))) {
      primaryAction = 'analyze';
    }

    // 키워드 추출
    const keywords = command.match(/["""]([^"""]+)["""]|(\S+)/g)?.map(k => k.replace(/["""]/g, '')) || [];

    return {
      primaryAction,
      secondaryActions: [],
      targets: {
        files: [],
        directories: [],
        patterns: []
      },
      criteria: {
        search: {
          keywords,
          filters: {}
        },
        sort: {
          primary: 'name',
          secondary: null,
          direction: 'asc'
        },
        filter: {
          include: [],
          exclude: []
        }
      },
      options: {
        recursive: false,
        caseSensitive: false,
        useAI: true,
        limit: 100
      },
      confidence: 0.6
    };
  }

  detectIntent(command) {
    const lowerCommand = command.toLowerCase();
    
    if (this.commandPatterns.search.some(pattern => lowerCommand.includes(pattern))) {
      return 'search';
    } else if (this.commandPatterns.sort.some(pattern => lowerCommand.includes(pattern))) {
      return 'sort';
    } else if (this.commandPatterns.filter.some(pattern => lowerCommand.includes(pattern))) {
      return 'filter';
    } else if (this.commandPatterns.preview.some(pattern => lowerCommand.includes(pattern))) {
      return 'preview';
    } else if (this.commandPatterns.organize.some(pattern => lowerCommand.includes(pattern))) {
      return 'organize';
    } else if (this.commandPatterns.analyze.some(pattern => lowerCommand.includes(pattern))) {
      return 'analyze';
    }
    
    return 'search';
  }

  async validateAndOptimizeCommand(parsedCommand) {
    try {
      const prompt = `다음 파싱된 명령어를 검증하고 최적화해주세요:

파싱된 명령어: ${JSON.stringify(parsedCommand, null, 2)}

다음 기준으로 검증하고 최적화해주세요:
1. 필수 필드가 누락되었는지 확인
2. 값의 타입과 범위가 올바른지 확인
3. 사용자 선호도에 맞게 최적화
4. 성능을 고려한 옵션 조정

최적화된 명령어를 JSON 형식으로 반환해주세요.`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const optimized = JSON.parse(jsonMatch[0]);
          return { ...parsedCommand, ...optimized };
        }
      } catch (parseError) {
        console.log('명령어 최적화 JSON 파싱 실패:', parseError);
      }

      return parsedCommand;
    } catch (error) {
      console.log('명령어 검증 및 최적화 실패:', error);
      return parsedCommand;
    }
  }

  async createExecutionPlan(validatedCommand) {
    try {
      const prompt = `다음 검증된 명령어에 대한 실행 계획을 생성해주세요:

명령어: ${JSON.stringify(validatedCommand, null, 2)}

다음 JSON 형식으로 실행 계획을 생성해주세요:
{
  "steps": [
    {
      "step": 1,
      "action": "액션명",
      "description": "단계 설명",
      "api": "사용할 API 엔드포인트",
      "parameters": "API 파라미터",
      "estimatedTime": "예상 소요 시간",
      "dependencies": ["의존하는 단계들"]
    }
  ],
  "totalEstimatedTime": "총 예상 시간",
  "parallelSteps": ["병렬 실행 가능한 단계들"],
  "errorHandling": {
    "fallbackActions": ["오류 시 대체 액션들"],
    "retryStrategy": "재시도 전략"
  }
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('실행 계획 JSON 파싱 실패:', parseError);
      }

      // 기본 실행 계획
      return this.createBasicExecutionPlan(validatedCommand);
    } catch (error) {
      console.log('실행 계획 생성 실패:', error);
      return this.createBasicExecutionPlan(validatedCommand);
    }
  }

  createBasicExecutionPlan(command) {
    const steps = [];
    
    switch (command.primaryAction) {
      case 'search':
        steps.push({
          step: 1,
          action: '검색 실행',
          description: '자연어 검색 또는 고급 검색 실행',
          api: command.criteria.search.keywords.length > 0 ? '/api/search/natural' : '/api/search/advanced',
          parameters: command.criteria.search,
          estimatedTime: '2-5초',
          dependencies: []
        });
        break;
        
      case 'sort':
        steps.push({
          step: 1,
          action: '파일 목록 가져오기',
          description: '현재 디렉토리의 파일 목록 가져오기',
          api: '/api/files',
          parameters: { path: 'current_directory' },
          estimatedTime: '1-2초',
          dependencies: []
        });
        steps.push({
          step: 2,
          action: '정렬 적용',
          description: '파일 목록에 정렬 기준 적용',
          api: '/api/sort-filter/sort',
          parameters: command.criteria.sort,
          estimatedTime: '1초',
          dependencies: [1]
        });
        break;
        
      case 'filter':
        steps.push({
          step: 1,
          action: '필터 적용',
          description: '파일 목록에 필터 조건 적용',
          api: '/api/sort-filter/filter',
          parameters: command.criteria.filter,
          estimatedTime: '1-2초',
          dependencies: []
        });
        break;
        
      case 'preview':
        steps.push({
          step: 1,
          action: '파일 미리보기',
          description: '선택된 파일의 미리보기 및 AI 분석',
          api: '/api/preview/file',
          parameters: { filePath: 'selected_file' },
          estimatedTime: '3-8초',
          dependencies: []
        });
        break;
        
      case 'analyze':
        steps.push({
          step: 1,
          action: '파일 분석',
          description: '파일 통계 및 인사이트 생성',
          api: '/api/sort-filter/statistics',
          parameters: { files: 'all_files' },
          estimatedTime: '2-5초',
          dependencies: []
        });
        break;
    }

    return {
      steps,
      totalEstimatedTime: steps.reduce((total, step) => {
        const time = parseInt(step.estimatedTime.match(/\d+/)[0]);
        return total + time;
      }, 0) + '초',
      parallelSteps: [],
      errorHandling: {
        fallbackActions: ['기본 검색', '이름순 정렬', '전체 파일 표시'],
        retryStrategy: '3회 재시도 후 대체 액션 실행'
      }
    };
  }

  async generateSuggestions(originalCommand, parsedCommand) {
    try {
      const prompt = `다음 명령어에 대한 개선 제안을 생성해주세요:

원본 명령어: "${originalCommand}"
파싱된 명령어: ${JSON.stringify(parsedCommand, null, 2)}

다음 관점에서 제안을 생성해주세요:
1. 더 정확한 검색을 위한 키워드 제안
2. 유사한 명령어 패턴
3. 자주 사용되는 조합
4. 성능 최적화 제안

JSON 형식으로 반환해주세요:
{
  "keywordSuggestions": ["키워드 제안들"],
  "similarCommands": ["유사한 명령어들"],
  "commonPatterns": ["자주 사용되는 패턴들"],
  "optimizationTips": ["최적화 팁들"]
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('제안 생성 JSON 파싱 실패:', parseError);
      }

      return {
        keywordSuggestions: [],
        similarCommands: [],
        commonPatterns: [],
        optimizationTips: []
      };
    } catch (error) {
      console.log('제안 생성 실패:', error);
      return {
        keywordSuggestions: [],
        similarCommands: [],
        commonPatterns: [],
        optimizationTips: []
      };
    }
  }

  async processComplexCommand(commands) {
    try {
      const prompt = `다음 복잡한 명령어들을 분석하고 실행 순서를 결정해주세요:

명령어들: ${JSON.stringify(commands, null, 2)}

다음 JSON 형식으로 분석해주세요:
{
  "executionOrder": [실행 순서],
  "dependencies": {
    "step": ["의존하는 단계들"]
  },
  "parallelExecution": [병렬 실행 가능한 단계들],
  "optimization": "최적화 제안"
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('복잡한 명령어 처리 JSON 파싱 실패:', parseError);
      }

      return {
        executionOrder: commands.map((_, index) => index + 1),
        dependencies: {},
        parallelExecution: [],
        optimization: '순차 실행'
      };
    } catch (error) {
      console.log('복잡한 명령어 처리 실패:', error);
      return {
        executionOrder: commands.map((_, index) => index + 1),
        dependencies: {},
        parallelExecution: [],
        optimization: '순차 실행'
      };
    }
  }

  async learnFromUserBehavior(command, result, userFeedback) {
    try {
      // 사용자 행동 학습
      this.commandHistory.push({
        command,
        result,
        feedback: userFeedback,
        timestamp: new Date().toISOString()
      });

      // 선호도 업데이트
      if (userFeedback && userFeedback.rating > 3) {
        this.updateUserPreferences(command, result);
      }

      // 컨텍스트 메모리 업데이트
      this.updateContextMemory(command, result);

      return {
        learned: true,
        preferencesUpdated: true,
        contextUpdated: true
      };
    } catch (error) {
      console.log('사용자 행동 학습 실패:', error);
      return {
        learned: false,
        preferencesUpdated: false,
        contextUpdated: false
      };
    }
  }

  updateUserPreferences(command, result) {
    // 사용자 선호도 업데이트 로직
    const intent = this.detectIntent(command);
    if (!this.userPreferences[intent]) {
      this.userPreferences[intent] = {};
    }
    
    // 결과 패턴 학습
    if (result.success) {
      this.userPreferences[intent].successfulPatterns = 
        this.userPreferences[intent].successfulPatterns || [];
      this.userPreferences[intent].successfulPatterns.push(command);
    }
  }

  updateContextMemory(command, result) {
    // 컨텍스트 메모리 업데이트
    this.contextMemory.push({
      command,
      result,
      timestamp: new Date().toISOString()
    });

    // 메모리 크기 제한
    if (this.contextMemory.length > 100) {
      this.contextMemory = this.contextMemory.slice(-50);
    }
  }

  addToCommandHistory(command, context) {
    this.commandHistory.push({
      command,
      context,
      timestamp: new Date().toISOString()
    });

    // 히스토리 크기 제한
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-500);
    }
  }

  async getPersonalizedSuggestions(userId) {
    try {
      const userHistory = this.commandHistory.filter(cmd => 
        cmd.context?.userId === userId
      );

      if (userHistory.length === 0) {
        return this.getDefaultSuggestions();
      }

      const prompt = `다음 사용자의 명령어 히스토리를 분석하여 개인화된 제안을 생성해주세요:

사용자 히스토리: ${JSON.stringify(userHistory.slice(-20), null, 2)}
사용자 선호도: ${JSON.stringify(this.userPreferences, null, 2)}

다음 JSON 형식으로 개인화된 제안을 생성해주세요:
{
  "frequentCommands": ["자주 사용하는 명령어들"],
  "suggestedCommands": ["추천 명령어들"],
  "shortcuts": ["단축 명령어들"],
  "tips": ["개인화된 팁들"]
}`;

      const response = await callClaude(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('개인화 제안 JSON 파싱 실패:', parseError);
      }

      return this.getDefaultSuggestions();
    } catch (error) {
      console.log('개인화 제안 생성 실패:', error);
      return this.getDefaultSuggestions();
    }
  }

  getDefaultSuggestions() {
    return {
      frequentCommands: [
        '최근에 수정된 파일들 보여줘',
        '큰 파일들 찾아줘',
        'PDF 파일들만 보여줘',
        '이름순으로 정렬해줘'
      ],
      suggestedCommands: [
        '중복 파일 찾아줘',
        '파일 분석해줘',
        '유사한 파일들 보여줘',
        'AI로 파일 요약해줘'
      ],
      shortcuts: [
        '최근 파일',
        '큰 파일',
        'PDF만',
        '이름순'
      ],
      tips: [
        '자연어로 검색하면 더 정확한 결과를 얻을 수 있습니다',
        '파일 타입과 크기를 함께 지정하면 검색이 더 빠릅니다',
        'AI 분석을 사용하면 파일 내용을 이해할 수 있습니다'
      ]
    };
  }

  async getCommandAnalytics() {
    try {
      const analytics = {
        totalCommands: this.commandHistory.length,
        commandTypes: {},
        successRate: 0,
        averageConfidence: 0,
        popularCommands: [],
        userSatisfaction: 0
      };

      // 명령어 타입별 통계
      this.commandHistory.forEach(cmd => {
        const intent = this.detectIntent(cmd.command);
        analytics.commandTypes[intent] = (analytics.commandTypes[intent] || 0) + 1;
      });

      // 성공률 계산
      const successfulCommands = this.commandHistory.filter(cmd => 
        cmd.result?.success
      ).length;
      analytics.successRate = (successfulCommands / analytics.totalCommands) * 100;

      // 인기 명령어
      const commandCounts = {};
      this.commandHistory.forEach(cmd => {
        commandCounts[cmd.command] = (commandCounts[cmd.command] || 0) + 1;
      });
      analytics.popularCommands = Object.entries(commandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([command, count]) => ({ command, count }));

      return analytics;
    } catch (error) {
      console.log('명령어 분석 실패:', error);
      return {
        totalCommands: 0,
        commandTypes: {},
        successRate: 0,
        averageConfidence: 0,
        popularCommands: [],
        userSatisfaction: 0
      };
    }
  }
}

export default new NaturalLanguageProcessor(); 