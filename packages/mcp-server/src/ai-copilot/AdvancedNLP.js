import { logger } from '../utils/logger.js';

/**
 * 고급 자연어 처리 엔진
 * 다중 언어 지원, 컨텍스트 분석, 의도 추론 등 고급 NLP 기능
 */
export class AdvancedNLP {
  constructor() {
    this.languages = {
      ko: 'korean',
      en: 'english', 
      ja: 'japanese',
      zh: 'chinese'
    };
    
    // 다단계 의도 분석 패턴 - 미친 수준으로 확장
    this.intentPatterns = {
      // 파일 관리 의도 - 대폭 확장
      FILE_MANAGEMENT: {
        search: {
          ko: ['찾아', '검색', '어디', '있는', '파일', '찾기', '탐색', '찾아줘', '찾아봐', '찾자', '어디있어', '어디있지', '뭐있나', '보여줘', '나타내', '발견', '위치', '장소', '어디야', '찾을래', '찾고싶어', '찾고있어', '찾아보자', '알아봐', '확인해봐', '찾아내', '발굴', '추적', '탐지', '수색', '뒤져', '훑어', '살펴', '둘러봐'],
          en: ['find', 'search', 'locate', 'where', 'look for', 'show me', 'display', 'reveal', 'discover', 'identify', 'spot', 'hunt', 'seek', 'browse', 'explore', 'scan', 'detect', 'track', 'investigate', 'examine', 'dig', 'uncover'],
          patterns: [/(\w+)\s*(파일|파일들|문서|문서들).*찾/gi, /find.*(\w+).*file/gi, /(어디|어떤곳|어느곳).*있/gi, /(찾|검색|탐색).*해/gi, /(보여|나타내).*줘/gi]
        organize: {
          ko: ['정리', '분류', '정돈', '깔끔', '체계', '구조화', '조직화', '정렬', '배치', '배열', '가지런히', '차곡차곡', '순서대로', '체계적으로', '깔끔하게', '단정하게', '정리정돈', '분류해', '카테고리', '그룹', '묶어', '모아', '합쳐', '나눠', '구분해', '분리해', '정돈해', '치워', '줄세워', '순서', '계층', '폴더별', '타입별', '날짜별', '크기별'],
          en: ['organize', 'sort', 'arrange', 'tidy', 'structure', 'categorize', 'classify', 'group', 'order', 'systematize', 'streamline', 'reorganize', 'rearrange', 'compile', 'assemble', 'coordinate', 'marshal', 'align', 'sequence', 'rank', 'grade', 'separate', 'divide', 'segment'],
          patterns: [/(정리|분류|정돈).*해/gi, /organize|sort.*files/gi, /(체계|구조).*만들/gi, /(순서|배치).*해/gi, /(묶어|모아|그룹).*줘/gi]
        },
        clean: {
          ko: ['청소', '정리', '삭제', '지워', '치워', '비워', '깨끗', '없애', '제거', '쓸어', '버려', '폐기', '소거', '말소', '털어', '정소', '대청소', '깨끗이', '말끔히', '시원하게', '싹', '다', '모두', '전부', '완전히', '깔끔히', '정리해', '지워줘', '치워줘', '없애줘', '제거해', '정소해', '청소해', '비워줘', '정리정돈', '단정히'],
          en: ['clean', 'delete', 'remove', 'clear', 'purge', 'eliminate', 'erase', 'wipe', 'sweep', 'flush', 'dispose', 'discard', 'expunge', 'obliterate', 'annihilate', 'exterminate', 'abolish', 'destroy', 'liquidate', 'empty', 'void', 'cleanse', 'sanitize'],
          patterns: [/(삭제|지워|치워|청소).*해/gi, /(clean|delete|remove).*files/gi, /(없애|제거|버려).*줘/gi, /(비워|말소|소거).*해/gi]
        },
        analyze: {
          ko: ['분석', '확인', '조사', '살펴', '파악', '알아', '검토'],
          en: ['analyze', 'check', 'examine', 'review', 'inspect'],
          patterns: [/(분석|확인|조사).*해/gi, /(analyze|check|examine)/gi]
        }
      },
      
      // 고급 작업 의도
      ADVANCED_OPERATIONS: {
        backup: {
          ko: ['백업', '복사', '저장', '보관', '복제'],
          en: ['backup', 'copy', 'save', 'archive', 'duplicate'],
          patterns: [/백업.*해/gi, /backup.*files/gi]
        },
        optimize: {
          ko: ['최적화', '압축', '개선', '효율', '속도'],
          en: ['optimize', 'compress', 'improve', 'efficiency', 'speed'],
          patterns: [/최적화.*해/gi, /optimize/gi]
        },
        sync: {
          ko: ['동기화', '싱크', '맞춰', '일치', '연동'],
          en: ['sync', 'synchronize', 'match', 'align'],
          patterns: [/동기화.*해/gi, /sync/gi]
        }
      },
      
      // 추상적 표현 해석 - 미친 다양성으로 확장
      ABSTRACT_EXPRESSIONS: {
        temporal: {
          ko: ['최근', '오래된', '예전', '새로운', '어제', '오늘', '이번주', '지난주', '방금', '금방', '조금전', '얼마전', '아까', '이전', '과거', '옛날', '작년', '올해', '내일', '모레', '다음주', '다음달', '며칠전', '몇주전', '몇달전', '몇년전', '한시간전', '하루전', '일주일전', '한달전', '신규', '신선한', '따끈따끈한', '막', '딱', '갓', '방금전', '지금막', '이제막', '금금', '요즘', '근래', '당분간', '잠시', '잠깐', '순간', '찰나', '즉시', '바로', '곧바로', '직후', '이후', '그후', '훗날', '후에', '나중에', '언젠가', 'someday'],
          en: ['recent', 'old', 'new', 'yesterday', 'today', 'this week', 'last week', 'just now', 'moments ago', 'earlier', 'before', 'previous', 'former', 'past', 'ancient', 'vintage', 'legacy', 'historic', 'contemporary', 'current', 'modern', 'fresh', 'brand new', 'newly', 'lately', 'recently', 'soon', 'upcoming', 'future', 'next', 'tomorrow', 'later', 'eventually', 'subsequently'],
          patterns: [/(최근|오래된|예전|새로운).*파일/gi, /(recent|old|new).*files/gi, /(방금|금방|조금전|얼마전).*만든/gi, /(어제|오늘|이번주).*수정/gi, /(신규|신선|따끈).*파일/gi]
        },
        similarity: {
          ko: ['비슷한', '같은', '유사한', '닮은', '관련된', '흡사한', '비슷비슷한', '엇비슷한', '거의같은', '똑같은', '일치하는', '동일한', '상응하는', '대응하는', '해당하는', '맞는', '알맞은', '적절한', '적합한', '어울리는', '매칭되는', '관계있는', '연관된', '연결된', '연계된', '결부된', '묶인', '얽힌', '관련있는', '해당되는', '속하는', '포함된', '들어있는', '포함하는', '담긴', '든', '있는'],
          en: ['similar', 'same', 'like', 'related', 'alike', 'identical', 'equivalent', 'comparable', 'corresponding', 'matching', 'parallel', 'analogous', 'resembling', 'akin', 'kindred', 'affiliated', 'associated', 'connected', 'linked', 'tied', 'bound', 'coupled', 'joined', 'united', 'related to', 'pertaining to', 'concerning', 'regarding', 'about'],
          patterns: [/(비슷한|같은|유사한).*파일/gi, /(similar|same|like).*files/gi, /(관련|연관|연결).*된/gi, /(흡사|동일|일치).*한/gi, /(매칭|대응|상응).*하는/gi]
        },
        quality: {
          ko: ['중요한', '불필요한', '쓸모없는', '필수', '핵심', '소중한', '귀중한', '가치있는', '값진', '보배로운', '대단한', '훌륭한', '멋진', '좋은', '우수한', '뛰어난', '탁월한', '완벽한', '최고의', '최상의', '일급의', '고급의', '프리미엄', '특급', '특별한', '독특한', '특이한', '희귀한', '레어한', '흔치않은', '보기드문', '쓸데없는', '무용한', '헛된', '쓰잘데없는', '소용없는', '필요없는', '불요불급한', '잉여의', '여분의', '과도한', '낭비적인', '효율적인', '실용적인', '유용한', '도움되는', '쓸모있는', '활용도높은'],
          en: ['important', 'unnecessary', 'useless', 'essential', 'key', 'crucial', 'vital', 'critical', 'significant', 'valuable', 'precious', 'worthless', 'redundant', 'obsolete', 'outdated', 'deprecated', 'legacy', 'archived', 'backup', 'temporary', 'draft', 'final', 'official', 'confidential', 'private', 'public', 'shared', 'personal', 'work', 'business', 'project', 'urgent', 'priority', 'high-priority', 'low-priority'],
          patterns: [/(중요한|불필요한|쓸모없는).*파일/gi, /(important|unnecessary|useless).*files/gi, /(소중|귀중|가치).*있는/gi, /(쓸데없|무용|헛된).*는/gi, /(필수|핵심|중요).*한/gi]
        },
        
        // 미친 수준의 다양한 표현 추가
        conversational: {
          ko: ['있지', '있는데', '있나', '어디있어', '나와', '보여줘', '들어있나', '있을까', '이있어', '없나', '안보여', '못찾겠어', '어떠해', '어떻게', '좋아', '그래', '증말', '진짜', '완전', '빨리', '당장', '좋음', '어서', '되나', '가능해', '할수있어', '될까', '명령', '해줘', '시작', '가자', '하자', '하도록', '하게', '하려고', '하고싶어', '필요해', '원해', '바라', '기대해', '예상해', '생각해', '추측해', '짐작해'],
          en: ['yeah', 'ok', 'okay', 'sure', 'right', 'exactly', 'absolutely', 'definitely', 'certainly', 'of course', 'naturally', 'obviously', 'clearly', 'indeed', 'quite', 'really', 'truly', 'actually', 'basically', 'simply', 'just', 'only', 'maybe', 'perhaps', 'possibly', 'probably', 'likely', 'hopefully', 'apparently', 'seemingly'],
          patterns: [/(있지|있나|어디).*(있|나)/gi, /(보여|나와).*(줘|라)/gi, /(좋아|그래).*(해|될)/gi]
        },
        
        size_expressions: {
          ko: ['큰', '작은', '거대한', '비대한', '처다다', '엄청난', '엄청큰', '엄청작은', '대형', '소형', '중형', '미니', '맥시', '수퍼', '하이퍼', '메가', '기가', '테라', '페타', '엑사', '제타', '요타', '롭타', '헬라', '브로또'],
          en: ['big', 'large', 'huge', 'massive', 'enormous', 'gigantic', 'tiny', 'small', 'mini', 'micro', 'nano', 'pico', 'mega', 'giga', 'tera', 'peta', 'exa', 'zetta', 'yotta'],
          patterns: [/(큰|작은|거대).*파일/gi, /(미니|맥시|수퍼).*파일/gi]
        },
        
        emotion_context: {
          ko: ['짜증', '성가시게', '짜증나게', '옆나게', '진짜', '우연히', '혹시', '혹시나', '몇날임', '마미', '미치게', '미친', '완전히', '대박', '점뿜', '엄청', '허거', '대단한', '감동', '놀랍', '충격', '최고', '최상', '최강', '기가', '죽이는', '살인적', '제발', '버렸어', '딸어', '얼어', '어처', '도대체', '대체'],
          en: ['damn', 'holy', 'wow', 'amazing', 'incredible', 'awesome', 'fantastic', 'wonderful', 'brilliant', 'excellent', 'outstanding', 'remarkable', 'extraordinary', 'phenomenal', 'spectacular', 'magnificent', 'marvelous', 'fabulous', 'terrific', 'superb'],
          patterns: [/(짜증|성가|진짜).*(나게|나다|나)/gi, /(미친|엄청|대박).*(수준|정도)/gi]
        }
      }
    };
    
    // 컨텍스트 가중치
    this.contextWeights = {
      fileExtension: 0.3,
      fileSize: 0.2,
      modificationTime: 0.25,
      fileName: 0.25
    };
    
    this.initializeNLP();
  }

  async initializeNLP() {
    logger.info('고급 자연어 처리 엔진 초기화 중...');
    
    // 사용자 패턴 히스토리 로드
    this.userPatterns = await this.loadUserPatterns();
    
    // 도메인 특화 지식 로드
    this.domainKnowledge = await this.loadDomainKnowledge();
    
    logger.info('고급 NLP 엔진 초기화 완료');
  }

  /**
   * 고급 의도 분석 - 다층 분석으로 정확도 극대화
   */
  async analyzeIntent(text, context = {}) {
    try {
      const analysisResult = {
        primaryIntent: null,
        secondaryIntents: [],
        confidence: 0,
        language: 'ko',
        entities: [],
        abstractConcepts: [],
        temporalReferences: [],
        contextualClues: []
      };

      // 1단계: 언어 감지
      analysisResult.language = this.detectLanguage(text);
      
      // 2단계: 개체명 인식 (파일명, 경로, 확장자 등)
      analysisResult.entities = this.extractEntities(text);
      
      // 3단계: 추상적 개념 추출
      analysisResult.abstractConcepts = this.extractAbstractConcepts(text);
      
      // 4단계: 시간 참조 분석
      analysisResult.temporalReferences = this.extractTemporalReferences(text);
      
      // 5단계: 다층 의도 분석
      const intentAnalysis = await this.performMultiLayerIntentAnalysis(text, context);
      analysisResult.primaryIntent = intentAnalysis.primary;
      analysisResult.secondaryIntents = intentAnalysis.secondary;
      analysisResult.confidence = intentAnalysis.confidence;
      
      // 6단계: 컨텍스트 기반 보정
      await this.applyContextualCorrection(analysisResult, context);
      
      // 7단계: 사용자 패턴 기반 개인화
      await this.applyPersonalization(analysisResult, context.userId);
      
      return analysisResult;
      
    } catch (error) {
      logger.error('의도 분석 실패:', error);
      return this.getFallbackAnalysis(text);
    }
  }

  /**
   * 언어 감지 - 다중 언어 지원
   */
  detectLanguage(text) {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    const japaneseRegex = /[ひらがなカタカナ一-龯]/;
    const chineseRegex = /[\u4e00-\u9fff]/;
    
    if (koreanRegex.test(text)) return 'ko';
    if (japaneseRegex.test(text)) return 'ja';
    if (chineseRegex.test(text)) return 'zh';
    return 'en';
  }

  /**
   * 미친 수준 고급 개체명 인식 - 대폭 확장
   */
  extractEntities(text) {
    const entities = [];
    
    // 한국어 자연어 테크닉 추가
    const koreanTechTerms = [
      '프로그램', '애플리케이션', '앱', '소프트웨어', '설치파일', '실행파일',
      '문서파일', '이미지파일', '음악파일', '동영상파일', '압축파일',
      '백업파일', '임시파일', '시스템파일', '로그파일', '캐시파일',
      '설정파일', '환경설정', '데이터베이스', '데이터', '소스코드',
      '코드파일', '스크립트', '라이브러리', '프레임워크', '플러그인'
    ];
    
    // 한국어 파일 타입 매칭
    const koreanFileTypeMap = {
      '이미지': ['jpg', 'png', 'gif', 'bmp', 'svg', 'webp', 'jpeg'],
      '사진': ['jpg', 'jpeg', 'png', 'raw', 'tiff'],
      '그림': ['jpg', 'png', 'gif', 'svg', 'bmp', 'webp'],
      '동영상': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'm4v'],
      '비디오': ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
      '영상': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'],
      '음악': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
      '오디오': ['mp3', 'wav', 'flac', 'aac', 'ogg'],
      '음성': ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
      '문서': ['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'hwp'],
      '텍스트': ['txt', 'rtf', 'md', 'text'],
      '워드': ['doc', 'docx'],
      '한글': ['hwp', 'hml'],
      '피디에프': ['pdf'],
      '엑셀': ['xls', 'xlsx', 'csv'],
      '스프레드시트': ['xls', 'xlsx', 'csv', 'ods'],
      '파워포인트': ['ppt', 'pptx'],
      '프레젠테이션': ['ppt', 'pptx', 'odp'],
      '압축': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
      '아카이브': ['zip', 'rar', '7z', 'tar'],
      '코드': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs'],
      '소스': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'],
      '스크립트': ['js', 'py', 'sh', 'bat', 'ps1'],
      '실행파일': ['exe', 'msi', 'app', 'deb', 'rpm'],
      '설치파일': ['msi', 'exe', 'pkg', 'deb', 'rpm'],
      '설정파일': ['ini', 'cfg', 'conf', 'config', 'json', 'xml', 'yaml', 'yml'],
      '데이터베이스': ['db', 'sqlite', 'mdb', 'accdb', 'sql'],
      '다운로드': ['*'], // 모든 파일
      '인터넷': ['html', 'htm', 'css', 'js', 'php'],
      '웹': ['html', 'htm', 'css', 'js', 'php', 'asp'],
      '백업': ['bak', 'backup', 'old', 'orig'],
      '임시': ['tmp', 'temp', 'cache'],
      '로그': ['log', 'txt'],
      '캐시': ['cache', 'tmp'],
      '시스템': ['sys', 'dll', 'ini']
    };
    
    // 파일 경로 추출
    const pathPatterns = [
      /[A-Z]:\\[^\s<>:"|?*]+/gi,  // Windows 경로
      /\/[^\s<>:"|?*]+/gi,        // Unix 경로
      /\.\/[^\s<>:"|?*]+/gi,      // 상대 경로
      /~\/[^\s<>:"|?*]+/gi        // 홈 디렉토리 경로
    ];
    
    pathPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: 'file_path',
            value: match.trim(),
            confidence: 0.9
          });
        });
      }
    });
    
    // 파일 확장자 추출
    const extensionPattern = /\.([a-zA-Z0-9]+)/g;
    let match;
    while ((match = extensionPattern.exec(text)) !== null) {
      entities.push({
        type: 'file_extension',
        value: match[1].toLowerCase(),
        confidence: 0.85
      });
    }
    
    // 파일 크기 표현 추출
    const sizePattern = /(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB|바이트|킬로|메가|기가|테라)/gi;
    while ((match = sizePattern.exec(text)) !== null) {
      entities.push({
        type: 'file_size',
        value: { amount: parseFloat(match[1]), unit: match[2] },
        confidence: 0.8
      });
    }
    
    return entities;
  }

  /**
   * 추상적 개념 추출 및 해석
   */
  extractAbstractConcepts(text) {
    const concepts = [];
    const lang = this.detectLanguage(text);
    
    Object.entries(this.intentPatterns.ABSTRACT_EXPRESSIONS).forEach(([category, data]) => {
      const keywords = data[lang] || data.en;
      
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          concepts.push({
            category,
            keyword,
            confidence: this.calculateKeywordConfidence(text, keyword)
          });
        }
      });
      
      // 패턴 매칭
      if (data.patterns) {
        data.patterns.forEach(pattern => {
          const matches = text.match(pattern);
          if (matches) {
            concepts.push({
              category,
              pattern: pattern.source,
              matches: matches,
              confidence: 0.7
            });
          }
        });
      }
    });
    
    return concepts;
  }

  /**
   * 시간 참조 분석
   */
  extractTemporalReferences(text) {
    const temporal = [];
    
    // 상대적 시간 표현
    const relativeTimePatterns = {
      ko: {
        recent: ['최근', '요즘', '근래', '얼마전'],
        past: ['예전', '옛날', '과거', '지난', '이전'],
        specific: ['오늘', '어제', '모레', '이번주', '지난주', '다음주']
      },
      en: {
        recent: ['recent', 'lately', 'recently', 'just now'],
        past: ['old', 'previous', 'former', 'past', 'before'],
        specific: ['today', 'yesterday', 'tomorrow', 'this week', 'last week', 'next week']
      }
    };
    
    const lang = this.detectLanguage(text);
    const patterns = relativeTimePatterns[lang] || relativeTimePatterns.en;
    
    Object.entries(patterns).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          temporal.push({
            type,
            keyword,
            timeframe: this.interpretTimeframe(keyword, type),
            confidence: 0.8
          });
        }
      });
    });
    
    // 절대적 시간 표현 (날짜, 시간)
    const datePattern = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      temporal.push({
        type: 'absolute_date',
        value: new Date(match[1], match[2] - 1, match[3]),
        confidence: 0.95
      });
    }
    
    return temporal;
  }

  /**
   * 다층 의도 분석
   */
  async performMultiLayerIntentAnalysis(text, context) {
    const intentions = [];
    
    // Layer 1: 키워드 기반 분석
    const keywordAnalysis = this.analyzeByKeywords(text);
    intentions.push(...keywordAnalysis);
    
    // Layer 2: 패턴 기반 분석
    const patternAnalysis = this.analyzeByPatterns(text);
    intentions.push(...patternAnalysis);
    
    // Layer 3: 컨텍스트 기반 분석
    const contextAnalysis = this.analyzeByContext(text, context);
    intentions.push(...contextAnalysis);
    
    // Layer 4: 의미론적 분석 (단어 임베딩 기반)
    const semanticAnalysis = await this.performSemanticAnalysis(text);
    intentions.push(...semanticAnalysis);
    
    // 의도 통합 및 순위 결정
    return this.consolidateIntentions(intentions);
  }

  /**
   * 키워드 기반 분석
   */
  analyzeByKeywords(text) {
    const results = [];
    const lang = this.detectLanguage(text);
    
    Object.entries(this.intentPatterns.FILE_MANAGEMENT).forEach(([intent, data]) => {
      const keywords = data[lang] || data.en;
      let score = 0;
      let matchedKeywords = [];
      
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score += this.calculateKeywordWeight(keyword);
          matchedKeywords.push(keyword);
        }
      });
      
      if (score > 0) {
        results.push({
          intent,
          score,
          evidence: matchedKeywords,
          method: 'keyword',
          confidence: Math.min(score / 2, 1.0)
        });
      }
    });
    
    return results;
  }

  /**
   * 패턴 기반 분석
   */
  analyzeByPatterns(text) {
    const results = [];
    
    Object.entries(this.intentPatterns.FILE_MANAGEMENT).forEach(([intent, data]) => {
      if (data.patterns) {
        data.patterns.forEach(pattern => {
          const matches = text.match(pattern);
          if (matches) {
            results.push({
              intent,
              score: 1.5, // 패턴 매칭은 높은 가중치
              evidence: matches,
              method: 'pattern',
              confidence: 0.85
            });
          }
        });
      }
    });
    
    return results;
  }

  /**
   * 컨텍스트 기반 분석
   */
  analyzeByContext(text, context) {
    const results = [];
    
    // 현재 디렉토리 컨텍스트
    if (context.currentPath) {
      if (text.includes('여기') || text.includes('현재') || text.includes('here') || text.includes('current')) {
        results.push({
          intent: 'analyze',
          score: 1.0,
          evidence: ['context_path'],
          method: 'context',
          confidence: 0.7
        });
      }
    }
    
    // 선택된 파일 컨텍스트
    if (context.selectedFiles && context.selectedFiles.length > 0) {
      if (text.includes('선택') || text.includes('이것') || text.includes('these') || text.includes('selected')) {
        results.push({
          intent: 'organize',
          score: 1.2,
          evidence: ['selected_files'],
          method: 'context',
          confidence: 0.8
        });
      }
    }
    
    // 시간 컨텍스트
    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour <= 6) {
      // 야간 시간대에는 정리/청소 작업 선호도 증가
      if (text.includes('정리') || text.includes('clean')) {
        results.push({
          intent: 'clean',
          score: 0.3,
          evidence: ['time_context'],
          method: 'context',
          confidence: 0.5
        });
      }
    }
    
    return results;
  }

  /**
   * 의미론적 분석 (간소화된 버전)
   */
  async performSemanticAnalysis(text) {
    const results = [];
    
    // 동의어 및 유사어 분석
    const synonymGroups = {
      search: ['찾다', '검색', '탐색', '발견', 'find', 'search', 'locate', 'discover'],
      organize: ['정리', '분류', '정돈', '배치', 'organize', 'sort', 'arrange', 'categorize'],
      delete: ['삭제', '제거', '지우기', '폐기', 'delete', 'remove', 'eliminate', 'discard']
    };
    
    Object.entries(synonymGroups).forEach(([intent, synonyms]) => {
      let semanticScore = 0;
      let matchedSynonyms = [];
      
      synonyms.forEach(synonym => {
        if (text.toLowerCase().includes(synonym.toLowerCase())) {
          semanticScore += 0.8;
          matchedSynonyms.push(synonym);
        }
      });
      
      if (semanticScore > 0) {
        results.push({
          intent,
          score: semanticScore,
          evidence: matchedSynonyms,
          method: 'semantic',
          confidence: 0.75
        });
      }
    });
    
    return results;
  }

  /**
   * 의도 통합 및 순위 결정
   */
  consolidateIntentions(intentions) {
    const intentMap = new Map();
    
    // 같은 의도의 점수들을 통합
    intentions.forEach(item => {
      if (intentMap.has(item.intent)) {
        const existing = intentMap.get(item.intent);
        existing.score += item.score;
        existing.evidence.push(...item.evidence);
        existing.methods.push(item.method);
        existing.confidence = Math.max(existing.confidence, item.confidence);
      } else {
        intentMap.set(item.intent, {
          ...item,
          methods: [item.method],
          evidence: Array.isArray(item.evidence) ? item.evidence : [item.evidence]
        });
      }
    });
    
    // 점수 순으로 정렬
    const sortedIntentions = Array.from(intentMap.values())
      .sort((a, b) => b.score - a.score);
    
    return {
      primary: sortedIntentions[0] || null,
      secondary: sortedIntentions.slice(1, 3),
      confidence: sortedIntentions[0]?.confidence || 0
    };
  }

  /**
   * 컨텍스트 기반 보정
   */
  async applyContextualCorrection(analysisResult, context) {
    // 파일 시스템 상태 기반 보정
    if (context.fileSystemState) {
      // 디스크 용량이 부족하면 정리 작업 우선순위 증가
      if (context.fileSystemState.freeSpace < 0.1) {
        if (analysisResult.primaryIntent?.intent === 'analyze') {
          analysisResult.primaryIntent.intent = 'clean';
          analysisResult.primaryIntent.confidence += 0.2;
        }
      }
    }
    
    // 시간 기반 보정
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // 업무 시간에는 작업 효율성 관련 의도 증가
      if (analysisResult.primaryIntent?.intent === 'search') {
        analysisResult.primaryIntent.confidence += 0.1;
      }
    }
  }

  /**
   * 사용자 패턴 기반 개인화
   */
  async applyPersonalization(analysisResult, userId) {
    if (!userId || !this.userPatterns[userId]) return;
    
    const userProfile = this.userPatterns[userId];
    
    // 사용자의 선호 작업 타입 반영
    if (userProfile.preferredOperations) {
      const preferredOp = userProfile.preferredOperations[0];
      if (analysisResult.primaryIntent?.intent === preferredOp) {
        analysisResult.primaryIntent.confidence += 0.15;
      }
    }
    
    // 사용자의 작업 시간 패턴 반영
    const currentHour = new Date().getHours();
    if (userProfile.activeHours && userProfile.activeHours.includes(currentHour)) {
      analysisResult.confidence += 0.1;
    }
  }

  /**
   * 유틸리티 메서드들
   */
  calculateKeywordWeight(keyword) {
    // 키워드 길이와 특이성에 따른 가중치
    const baseWeight = 0.5;
    const lengthBonus = Math.min(keyword.length * 0.1, 0.3);
    return baseWeight + lengthBonus;
  }

  calculateKeywordConfidence(text, keyword) {
    const occurrences = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    return Math.min(0.5 + (occurrences * 0.2), 1.0);
  }

  interpretTimeframe(keyword, type) {
    const now = new Date();
    const timeframes = {
      '최근': { days: -7 },
      'recent': { days: -7 },
      '예전': { days: -30 },
      'old': { days: -30 },
      '오늘': { days: 0 },
      'today': { days: 0 },
      '어제': { days: -1 },
      'yesterday': { days: -1 }
    };
    
    const frame = timeframes[keyword];
    if (frame) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + frame.days);
      return targetDate;
    }
    
    return null;
  }

  async loadUserPatterns() {
    // 실제 구현에서는 데이터베이스나 파일에서 로드
    return {};
  }

  async loadDomainKnowledge() {
    // 파일 관리 도메인 특화 지식
    return {
      fileTypes: {
        'documents': ['.doc', '.docx', '.pdf', '.txt', '.rtf'],
        'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
        'videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv'],
        'audio': ['.mp3', '.wav', '.flac', '.aac'],
        'code': ['.js', '.py', '.java', '.cpp', '.html', '.css']
      },
      commonOperations: {
        'backup': ['중요', '프로젝트', '문서'],
        'clean': ['임시', '캐시', '로그', '중복'],
        'organize': ['프로젝트', '카테고리', '타입']
      }
    };
  }

  getFallbackAnalysis(text) {
    return {
      primaryIntent: {
        intent: 'search',
        confidence: 0.3,
        method: 'fallback'
      },
      secondaryIntents: [],
      confidence: 0.3,
      language: this.detectLanguage(text),
      entities: [],
      abstractConcepts: [],
      temporalReferences: [],
      contextualClues: []
    };
  }
}

export default AdvancedNLP;