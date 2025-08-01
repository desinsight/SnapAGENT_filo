import { logger } from '../utils/logger.js';

/**
 * AI 명령을 구조화된 실행 플랜으로 변환하는 고급 파서
 * @class AdvancedCommandParser
 */
export class AdvancedCommandParser {
  constructor() {
    // 파일 타입 매핑 (한글명, 영문명, 확장자, 별칭)
    this.fileTypeMapping = {
      // 문서
      '문서': { extensions: ['.doc', '.docx', '.pdf', '.txt', '.rtf'], aliases: ['document', 'doc', 'text'] },
      'PDF': { extensions: ['.pdf'], aliases: ['pdf', 'adobe', '포터블'] },
      '워드': { extensions: ['.doc', '.docx'], aliases: ['word', 'microsoft word', 'ms word'] },
      '엑셀': { extensions: ['.xls', '.xlsx', '.csv'], aliases: ['excel', 'spreadsheet', 'sheet'] },
      '파워포인트': { extensions: ['.ppt', '.pptx'], aliases: ['powerpoint', 'presentation', 'ppt'] },
      
      // 이미지
      '이미지': { extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'], aliases: ['image', 'photo', 'picture', 'img'] },
      '사진': { extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'], aliases: ['photo', 'picture', 'image'] },
      'JPG': { extensions: ['.jpg', '.jpeg'], aliases: ['jpeg', 'jpg'] },
      'PNG': { extensions: ['.png'], aliases: ['png'] },
      
      // 비디오
      '비디오': { extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'], aliases: ['video', 'movie', 'clip'] },
      '영상': { extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'], aliases: ['video', 'movie'] },
      'MP4': { extensions: ['.mp4'], aliases: ['mp4'] },
      
      // 오디오
      '음악': { extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'], aliases: ['music', 'audio', 'song'] },
      '오디오': { extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'], aliases: ['audio', 'sound'] },
      'MP3': { extensions: ['.mp3'], aliases: ['mp3'] },
      
      // 압축
      '압축': { extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'], aliases: ['archive', 'compressed', 'zip', 'rar'] },
      'ZIP': { extensions: ['.zip'], aliases: ['zip'] },
      'RAR': { extensions: ['.rar'], aliases: ['rar'] },
      
      // 코드
      '코드': { extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.php', '.rb', '.go', '.rs'], aliases: ['code', 'programming', 'script'] },
      '자바스크립트': { extensions: ['.js', '.jsx', '.ts', '.tsx'], aliases: ['javascript', 'js', 'typescript', 'ts'] },
      '파이썬': { extensions: ['.py', '.pyc', '.pyo'], aliases: ['python', 'py'] },
      'HTML': { extensions: ['.html', '.htm'], aliases: ['html', 'htm'] },
      'CSS': { extensions: ['.css'], aliases: ['css'] },
      
      // 3D/CAD
      '3D': { extensions: ['.obj', '.fbx', '.dae', '.3ds', '.max', '.blend', '.skp'], aliases: ['3d', 'three dimensional', 'model'] },
      'SKP': { extensions: ['.skp'], aliases: ['sketchup', 'skp'] },
      'OBJ': { extensions: ['.obj'], aliases: ['obj', 'wavefront'] },
      'FBX': { extensions: ['.fbx'], aliases: ['fbx', 'autodesk'] },
      
      // 기타
      '설정': { extensions: ['.json', '.xml', '.yaml', '.yml', '.ini', '.conf', '.config'], aliases: ['config', 'setting', 'configuration'] },
      '로그': { extensions: ['.log', '.txt'], aliases: ['log', 'logfile'] },
      '백업': { extensions: ['.bak', '.backup', '.old'], aliases: ['backup', 'bak'] }
    };

    // 검색 조건 매핑
    this.searchConditions = {
      '크기': ['size', '용량', '크기', 'volume', 'byte', 'kb', 'mb', 'gb'],
      '날짜': ['date', '날짜', '시간', 'time', 'created', 'modified', 'updated'],
      '이름': ['name', '이름', 'filename', 'title'],
      '내용': ['content', '내용', 'text', 'body', 'inside'],
      '태그': ['tag', '태그', 'label', 'category'],
      '중복': ['duplicate', '중복', 'same', 'identical', 'copy'],
      '빈': ['empty', '빈', 'null', 'zero'],
      '숨김': ['hidden', '숨김', 'system', 'dot'],
      '최근': ['recent', '최근', 'latest', 'new', '최신'],
      '오래된': ['old', '오래된', 'ancient', 'oldest']
    };

    // 액션 매핑
    this.actions = {
      '검색': ['search', 'find', 'look', '검색', '찾기', '찾아', '보여줘', '보여'],
      '정리': ['organize', 'clean', 'sort', '정리', '분류', '정돈', '정렬'],
      '삭제': ['delete', 'remove', 'trash', '삭제', '제거', '지우기', '버리기'],
      '이동': ['move', 'transfer', '이동', '옮기기', '바꾸기'],
      '복사': ['copy', 'duplicate', '복사', '카피', '복제'],
      '분석': ['analyze', 'analysis', '분석', '확인', '체크', '점검'],
      '백업': ['backup', 'save', '백업', '저장', '보관'],
      '압축': ['compress', 'zip', '압축', '묶기', '패킹'],
      '압축해제': ['extract', 'unzip', '압축해제', '풀기', '언패킹']
    };
  }

  /**
   * 자연어 명령을 구조화된 실행 플랜으로 파싱
   * @param {string} command - 사용자 명령
   * @param {Object} context - 현재 컨텍스트
   * @returns {Object} 구조화된 실행 플랜
   */
  parseCommand(command, context = {}) {
    try {
      const lowerCommand = command.toLowerCase();
      
      // 기본 플랜 구조
      const plan = {
        originalCommand: command,
        action: this.extractAction(lowerCommand),
        targets: this.extractTargets(lowerCommand),
        conditions: this.extractConditions(lowerCommand),
        options: this.extractOptions(lowerCommand, context),
        confidence: 0.5,
        needsConfirmation: false,
        suggestedQueries: [],
        executionSteps: []
      };

      // 신뢰도 계산
      plan.confidence = this.calculateConfidence(plan);
      
      // 확인 필요 여부 판단
      plan.needsConfirmation = this.needsConfirmation(plan);
      
      // 제안 쿼리 생성
      plan.suggestedQueries = this.generateSuggestedQueries(plan);
      
      // 실행 단계 생성
      plan.executionSteps = this.generateExecutionSteps(plan);
      
      logger.info('명령 파싱 완료:', { command, plan: JSON.stringify(plan, null, 2) });
      
      return plan;
    } catch (error) {
      logger.error('명령 파싱 실패:', error);
      return this.getFallbackPlan(command);
    }
  }

  /**
   * 액션 추출
   * @private
   */
  extractAction(command) {
    for (const [action, keywords] of Object.entries(this.actions)) {
      if (keywords.some(keyword => command.includes(keyword))) {
        return action;
      }
    }
    return '검색'; // 기본값
  }

  /**
   * 대상 추출
   * @private
   */
  extractTargets(command) {
    const targets = [];
    
    // 파일 타입 매핑에서 추출
    for (const [type, info] of Object.entries(this.fileTypeMapping)) {
      const allKeywords = [type, ...info.aliases];
      if (allKeywords.some(keyword => command.includes(keyword))) {
        targets.push({
          type: 'fileType',
          value: type,
          extensions: info.extensions,
          aliases: info.aliases
        });
      }
    }
    
    // 확장자 직접 추출
    const extensionPattern = /\.([a-zA-Z0-9]+)/g;
    const extensions = command.match(extensionPattern);
    if (extensions) {
      extensions.forEach(ext => {
        targets.push({
          type: 'extension',
          value: ext,
          extensions: [ext]
        });
      });
    }
    
    // 파일명 패턴 추출
    const filenamePattern = /["']([^"']+\.[a-zA-Z0-9]+)["']/g;
    const filenames = command.match(filenamePattern);
    if (filenames) {
      filenames.forEach(filename => {
        targets.push({
          type: 'filename',
          value: filename.replace(/["']/g, ''),
          exact: true
        });
      });
    }
    
    return targets;
  }

  /**
   * 조건 추출
   * @private
   */
  extractConditions(command) {
    const conditions = {};
    
    // 크기 조건
    const sizePattern = /(\d+)\s*(kb|mb|gb|byte|바이트)/i;
    const sizeMatch = command.match(sizePattern);
    if (sizeMatch) {
      conditions.size = {
        value: parseInt(sizeMatch[1]),
        unit: sizeMatch[2].toLowerCase(),
        operator: command.includes('이상') ? 'gte' : command.includes('이하') ? 'lte' : 'eq'
      };
    }
    
    // 날짜 조건
    const datePatterns = [
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /오늘|어제|내일/,
      /(\d+)일\s*전/,
      /(\d+)주\s*전/,
      /(\d+)개월\s*전/
    ];
    
    for (const pattern of datePatterns) {
      const match = command.match(pattern);
      if (match) {
        conditions.date = {
          pattern: match[0],
          type: this.getDateType(match[0])
        };
        break;
      }
    }
    
    // 기타 조건
    for (const [condition, keywords] of Object.entries(this.searchConditions)) {
      if (keywords.some(keyword => command.includes(keyword))) {
        conditions[condition] = true;
      }
    }
    
    return conditions;
  }

  /**
   * 옵션 추출
   * @private
   */
  extractOptions(command, context) {
    const options = {
      recursive: command.includes('재귀') || command.includes('하위') || command.includes('sub'),
      caseSensitive: command.includes('대소문자') || command.includes('case'),
      includeHidden: command.includes('숨김') || command.includes('hidden'),
      maxResults: this.extractNumber(command, '개', '개수', 'results'),
      sortBy: this.extractSortOption(command),
      ...context
    };
    
    return options;
  }

  /**
   * 신뢰도 계산
   * @private
   */
  calculateConfidence(plan) {
    let confidence = 0.3; // 기본값
    
    // 액션이 명확하면 +0.2
    if (plan.action !== '검색') confidence += 0.2;
    
    // 대상이 명확하면 +0.2
    if (plan.targets.length > 0) confidence += 0.2;
    
    // 조건이 구체적이면 +0.2
    if (Object.keys(plan.conditions).length > 0) confidence += 0.2;
    
    // 옵션이 구체적이면 +0.1
    if (Object.keys(plan.options).length > 3) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 확인 필요 여부 판단
   * @private
   */
  needsConfirmation(plan) {
    const dangerousActions = ['삭제', '이동', '복사'];
    const dangerousConditions = ['중복', '빈', '숨김'];
    
    return dangerousActions.includes(plan.action) || 
           Object.keys(plan.conditions).some(key => dangerousConditions.includes(key));
  }

  /**
   * 제안 쿼리 생성
   * @private
   */
  generateSuggestedQueries(plan) {
    const queries = [];
    
    // 기본 검색 쿼리
    if (plan.targets.length > 0) {
      const targetNames = plan.targets.map(t => t.value).join(' ');
      queries.push(`${targetNames} 파일 검색`);
    }
    
    // 조건별 쿼리
    if (plan.conditions.size) {
      queries.push(`${plan.conditions.size.value}${plan.conditions.size.unit} 이상 파일`);
    }
    
    if (plan.conditions.date) {
      queries.push(`${plan.conditions.date.pattern} 이후 파일`);
    }
    
    if (plan.conditions.중복) {
      queries.push('중복 파일 찾기');
    }
    
    return queries;
  }

  /**
   * 실행 단계 생성
   * @private
   */
  generateExecutionSteps(plan) {
    const steps = [];
    
    // 1단계: 검색 조건 구성
    steps.push({
      step: 1,
      action: 'search_prepare',
      description: '검색 조건 구성',
      parameters: {
        targets: plan.targets,
        conditions: plan.conditions,
        options: plan.options
      }
    });
    
    // 2단계: 검색 실행
    steps.push({
      step: 2,
      action: 'search_execute',
      description: '파일 검색 실행',
      parameters: {
        query: plan.suggestedQueries[0] || plan.originalCommand,
        options: plan.options
      }
    });
    
    // 3단계: 결과 처리
    if (plan.action !== '검색') {
      steps.push({
        step: 3,
        action: plan.action,
        description: `${plan.action} 작업 실행`,
        parameters: {
          action: plan.action,
          needsConfirmation: plan.needsConfirmation
        }
      });
    }
    
    return steps;
  }

  /**
   * 날짜 타입 판별
   * @private
   */
  getDateType(dateString) {
    if (dateString.includes('년')) return 'absolute';
    if (dateString.includes('전')) return 'relative';
    if (['오늘', '어제', '내일'].includes(dateString)) return 'relative';
    return 'unknown';
  }

  /**
   * 숫자 추출
   * @private
   */
  extractNumber(text, ...keywords) {
    for (const keyword of keywords) {
      const pattern = new RegExp(`(\\d+)\\s*${keyword}`, 'i');
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  /**
   * 정렬 옵션 추출
   * @private
   */
  extractSortOption(text) {
    if (text.includes('이름순') || text.includes('name')) return 'name';
    if (text.includes('크기순') || text.includes('size')) return 'size';
    if (text.includes('날짜순') || text.includes('date')) return 'date';
    if (text.includes('최신순') || text.includes('newest')) return 'date';
    if (text.includes('오래된순') || text.includes('oldest')) return 'date';
    return null;
  }

  /**
   * 폴백 플랜 생성
   * @private
   */
  getFallbackPlan(command) {
    return {
      originalCommand: command,
      action: '검색',
      targets: [],
      conditions: {},
      options: {},
      confidence: 0.1,
      needsConfirmation: false,
      suggestedQueries: [command],
      executionSteps: [
        {
          step: 1,
          action: 'search_execute',
          description: '기본 검색 실행',
          parameters: { query: command }
        }
      ]
    };
  }
} 