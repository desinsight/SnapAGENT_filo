const naturalLanguageProcessor = require('./naturalLanguageProcessor');

class FuzzyCommandProcessor {
  constructor() {
    this.synonyms = new Map();
    this.slangs = new Map();
    this.abbreviations = new Map();
    this.typoPatterns = new Map();
    this.commandVariations = new Map();
    this.userCustomTerms = new Map();
    
    this.initializeDictionaries();
  }

  // 사전 초기화
  initializeDictionaries() {
    // 동의어 사전
    this.synonyms = new Map([
      // 검색 관련
      ['찾아', ['검색해', '보여줘', '가져와', '찾기', '검색', '보기', '가져오기']],
      ['검색', ['찾기', '검색해', '보여줘', '가져와', '찾아', '보기', '가져오기']],
      ['보여줘', ['보기', '가져와', '찾아', '검색해', '보여주기', '표시해']],
      
      // 정렬 관련
      ['정렬', ['순서', '정리', '배열', '나열', '정렬해', '순서대로', '정리해']],
      ['순서', ['정렬', '정리', '배열', '나열', '순서대로', '정렬해']],
      ['크기순', ['크기별', '용량순', '사이즈순', '크기대로', '용량별']],
      ['날짜순', ['날짜별', '시간순', '최신순', '오래된순', '날짜대로']],
      ['이름순', ['이름별', '알파벳순', '가나다순', '이름대로']],
      
      // 필터 관련
      ['필터', ['거르기', '선택', '고르기', '제외', '빼고', '만', '중에서']],
      ['거르기', ['필터', '선택', '고르기', '제외', '빼고', '만']],
      ['제외', ['빼고', '제외하고', '빼기', '제외해', '빼고']],
      
      // 파일 타입
      ['파일', ['문서', '파일들', '파일들', '문서들']],
      ['폴더', ['디렉토리', '경로', '폴더들', '디렉토리들']],
      ['PDF', ['pdf', '피디에프', '피디에프파일', 'pdf파일']],
      ['이미지', ['사진', '그림', '이미지들', '사진들', '그림들']],
      ['동영상', ['비디오', '영상', '동영상들', '비디오들', '영상들']],
      ['음악', ['노래', '음악파일', '노래들', '음악들']],
      
      // 크기 관련
      ['큰', ['대용량', '크고', '용량이큰', '사이즈가큰']],
      ['작은', ['소용량', '작고', '용량이작은', '사이즈가작은']],
      
      // 시간 관련
      ['최근', ['최신', '요즘', '최근에', '최신에']],
      ['오래된', ['구식', '오래된', '예전', '과거']],
      
      // 분석 관련
      ['분석', ['통계', '요약', '리포트', '인사이트', '패턴', '트렌드']],
      ['통계', ['분석', '요약', '리포트', '인사이트', '패턴']],
      
      // 미리보기 관련
      ['미리보기', ['보기', '열기', '확인', '보여줘', '내용', '요약']],
      ['보기', ['미리보기', '열기', '확인', '보여줘', '내용']]
    ]);

    // 은어/슬랭 사전
    this.slangs = new Map([
      ['뻘짓', ['불필요한', '쓸데없는', '헛된']],
      ['짱', ['최고', '가장', '제일', '최대']],
      ['쩔어', ['멋있어', '좋아', '훌륭해', '대단해']],
      ['헐', ['어?', '뭐?', '정말?', '진짜?']],
      ['ㅋㅋ', ['하하', '웃겨', '재밌어']],
      ['ㅠㅠ', ['슬퍼', '안타까워', '아쉬워']],
      ['ㄷㄷ', ['대단해', '놀라워', '어마해']],
      ['ㅇㅇ', ['응', '네', '맞아', '그래']],
      ['ㄴㄴ', ['아니', '아니야', '싫어', '안돼']],
      ['ㅅㄱ', ['수고', '고생', '잘했어']],
      ['ㅂㅂ', ['바이', '안녕', '잘가']],
      ['ㅎㅎ', ['하하', '웃겨', '재밌어']],
      ['ㅇㅈ', ['인정', '맞아', '그래', '동의']],
      ['ㄱㄷ', ['기다려', '잠깐', '잠시']],
      ['ㅈㅅ', ['죄송', '미안', '사과']],
      ['ㄹㅇ', ['레알', '진짜', '정말', '실제로']],
      ['ㅇㅋ', ['오케이', '알겠어', '네', '좋아']],
      ['ㄴㄱ', ['나가', '빠져', '떨어져']],
      ['ㅇㄹ', ['어려워', '힘들어', '복잡해']],
      ['ㄱㅅ', ['감사', '고마워', '땡큐']]
    ]);

    // 약어 사전
    this.abbreviations = new Map([
      ['doc', ['문서', '워드', '도큐먼트']],
      ['pdf', ['피디에프', '피디에프파일']],
      ['jpg', ['제이피지', '이미지', '사진']],
      ['png', ['피엔지', '이미지', '사진']],
      ['mp3', ['엠피쓰리', '음악', '노래']],
      ['mp4', ['엠피포', '동영상', '비디오']],
      ['avi', ['에이브이아이', '동영상', '비디오']],
      ['zip', ['집', '압축', '압축파일']],
      ['rar', ['알알', '압축', '압축파일']],
      ['exe', ['실행파일', '프로그램', '어플']],
      ['txt', ['텍스트', '문서', '텍스트파일']],
      ['xls', ['엑셀', '스프레드시트', '표']],
      ['ppt', ['파워포인트', '프레젠테이션', '슬라이드']],
      ['hwp', ['한글', '한글문서', '한글파일']],
      ['cad', ['캐드', '캐드파일', '도면']],
      ['dwg', ['드래프트', '도면', '캐드파일']],
      ['psd', ['포토샵', '이미지', '사진']],
      ['ai', ['일러스트', '벡터', '그래픽']],
      ['eps', ['포스트스크립트', '벡터', '그래픽']],
      ['skp', ['스케치업', 'sketchup', 'skp', '스케치업파일', '스케치업도면', '3d', 'cad', '3d모델', '3d파일', '3d도면', 'skp파일', 'skp도면']],
      ['dwg', ['드래프트', '도면', '캐드파일', 'dwg', '오토캐드', 'cad', 'dwg파일', 'dwg도면']],
      ['step', ['스텝', 'step', '스텝파일', '스텝도면', '3d', 'cad']],
      ['stl', ['stl', 'stl파일', 'stl도면', '3d프린터', '3d', 'cad']],
      ['3ds', ['3ds', '3ds파일', '3ds도면', '3d', 'cad']],
      ['obj', ['obj', 'obj파일', 'obj도면', '3d', 'cad']],
      ['fbx', ['fbx', 'fbx파일', 'fbx도면', '3d', 'cad']],
      ['max', ['max', 'max파일', 'max도면', '3d', 'cad']],
      ['blend', ['블렌더', 'blend', 'blend파일', 'blend도면', '3d', 'cad']]
    ]);

    // 명령어 변형 패턴
    this.commandVariations = new Map([
      // 검색 명령 변형
      ['찾아줘', ['찾아', '검색해줘', '보여줘', '가져와줘', '찾기', '검색', '보기']],
      ['검색해줘', ['찾아줘', '찾아', '보여줘', '가져와줘', '찾기', '검색', '보기']],
      ['보여줘', ['찾아줘', '검색해줘', '가져와줘', '찾기', '검색', '보기', '찾아']],
      
      // 정렬 명령 변형
      ['정렬해줘', ['정렬', '순서대로', '정리해줘', '배열해줘', '나열해줘']],
      ['순서대로', ['정렬해줘', '정렬', '정리해줘', '배열해줘', '나열해줘']],
      ['정리해줘', ['정렬해줘', '순서대로', '정렬', '배열해줘', '나열해줘']],
      
      // 필터 명령 변형
      ['필터해줘', ['필터', '거르기', '선택해줘', '고르기', '제외해줘']],
      ['거르기', ['필터해줘', '필터', '선택해줘', '고르기', '제외해줘']],
      ['선택해줘', ['필터해줘', '거르기', '필터', '고르기', '제외해줘']],
      
      // 분석 명령 변형
      ['분석해줘', ['분석', '통계', '요약해줘', '리포트', '인사이트']],
      ['통계', ['분석해줘', '분석', '요약해줘', '리포트', '인사이트']],
      ['요약해줘', ['분석해줘', '통계', '분석', '리포트', '인사이트']],
      
      // 미리보기 명령 변형
      ['미리보기', ['보기', '열기', '확인해줘', '보여줘', '내용']],
      ['보기', ['미리보기', '열기', '확인해줘', '보여줘', '내용']],
      ['열기', ['미리보기', '보기', '확인해줘', '보여줘', '내용']]
    ]);
  }

  // 명령어 전처리 및 정규화
  async processCommand(command, context = {}) {
    try {
      console.log(`원본 명령어: ${command}`);

      // 1단계: 기본 정규화
      let normalizedCommand = this.normalizeCommand(command);
      console.log(`정규화 후: ${normalizedCommand}`);

      // 2단계: 오타 수정
      let correctedCommand = await this.correctTypos(normalizedCommand);
      console.log(`오타 수정 후: ${correctedCommand}`);

      // 3단계: 동의어/유사어 변환
      let synonymCommand = this.expandSynonyms(correctedCommand);
      console.log(`동의어 확장 후: ${synonymCommand}`);

      // 4단계: 은어/슬랭 변환
      let slangCommand = this.translateSlangs(synonymCommand);
      console.log(`은어 변환 후: ${slangCommand}`);

      // 5단계: 약어 확장
      let expandedCommand = this.expandAbbreviations(slangCommand);
      console.log(`약어 확장 후: ${expandedCommand}`);

      // 6단계: 사용자 정의 용어 처리
      let customCommand = this.processCustomTerms(expandedCommand, context);
      console.log(`사용자 정의 처리 후: ${customCommand}`);

      // 7단계: 명령어 변형 처리
      let finalCommand = this.processCommandVariations(customCommand);
      console.log(`최종 명령어: ${finalCommand}`);

      // 8단계: 신뢰도 계산
      const confidence = this.calculateConfidence(command, finalCommand);

      return {
        originalCommand: command,
        processedCommand: finalCommand,
        confidence,
        corrections: {
          typos: correctedCommand !== normalizedCommand,
          synonyms: synonymCommand !== correctedCommand,
          slangs: slangCommand !== synonymCommand,
          abbreviations: expandedCommand !== slangCommand,
          customTerms: customCommand !== expandedCommand,
          variations: finalCommand !== customCommand
        },
        suggestions: await this.generateSuggestions(finalCommand, context)
      };
    } catch (error) {
      console.error('명령어 처리 실패:', error);
      return {
        originalCommand: command,
        processedCommand: command,
        confidence: 0.5,
        corrections: {},
        suggestions: []
      };
    }
  }

  // 기본 정규화
  normalizeCommand(command) {
    return command
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // 연속 공백을 하나로
      .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
      .trim();
  }

  // 오타 수정
  async correctTypos(command) {
    try {
      // 간단한 오타 패턴 매칭
      let corrected = command;
      
      // 일반적인 오타 패턴
      const commonTypos = {
        '찾아줘': '찾아줘',
        '검색해줘': '검색해줘',
        '보여줘': '보여줘',
        '정렬해줘': '정렬해줘',
        '필터해줘': '필터해줘',
        '분석해줘': '분석해줘',
        '미리보기': '미리보기',
        'pdf': 'PDF',
        'jpg': 'JPG',
        'mp3': 'MP3',
        'mp4': 'MP4',
        'zip': 'ZIP',
        'rar': 'RAR',
        'exe': 'EXE',
        'txt': 'TXT',
        'xls': 'XLS',
        'ppt': 'PPT',
        'hwp': 'HWP',
        'cad': 'CAD',
        'psd': 'PSD',
        'ai': 'AI'
      };

      for (const [typo, correction] of Object.entries(commonTypos)) {
        const regex = new RegExp(`\\b${typo}\\b`, 'gi');
        corrected = corrected.replace(regex, correction);
      }

      // 레벤슈타인 거리 기반 오타 수정
      const words = corrected.split(' ');
      const correctedWords = words.map(word => this.correctWord(word));
      
      return correctedWords.join(' ');
    } catch (error) {
      console.error('오타 수정 실패:', error);
      return command;
    }
  }

  // 단어별 오타 수정
  correctWord(word) {
    // 사전에 있는 단어는 그대로 반환
    if (this.isValidWord(word)) {
      return word;
    }

    // 유사한 단어 찾기
    const suggestions = this.findSimilarWords(word);
    if (suggestions.length > 0) {
      return suggestions[0]; // 가장 유사한 단어 반환
    }

    return word; // 수정할 수 없으면 원본 반환
  }

  // 유사한 단어 찾기
  findSimilarWords(word) {
    const suggestions = [];
    const maxDistance = Math.min(3, Math.floor(word.length / 3)); // 단어 길이에 따른 최대 거리

    // 동의어 사전에서 검색
    for (const [key, synonyms] of this.synonyms.entries()) {
      const distance = this.levenshteinDistance(word, key);
      if (distance <= maxDistance) {
        suggestions.push({ word: key, distance, type: 'synonym' });
      }
      
      for (const synonym of synonyms) {
        const distance = this.levenshteinDistance(word, synonym);
        if (distance <= maxDistance) {
          suggestions.push({ word: synonym, distance, type: 'synonym' });
        }
      }
    }

    // 명령어 변형에서 검색
    for (const [key, variations] of this.commandVariations.entries()) {
      const distance = this.levenshteinDistance(word, key);
      if (distance <= maxDistance) {
        suggestions.push({ word: key, distance, type: 'variation' });
      }
      
      for (const variation of variations) {
        const distance = this.levenshteinDistance(word, variation);
        if (distance <= maxDistance) {
          suggestions.push({ word: variation, distance, type: 'variation' });
        }
      }
    }

    // 거리순으로 정렬
    suggestions.sort((a, b) => a.distance - b.distance);
    
    return suggestions.map(s => s.word);
  }

  // 레벤슈타인 거리 계산
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
            matrix[i - 1][j - 1] + 1, // 치환
            matrix[i][j - 1] + 1,     // 삽입
            matrix[i - 1][j] + 1      // 삭제
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // 유효한 단어인지 확인
  isValidWord(word) {
    // 동의어 사전에 있는지 확인
    if (this.synonyms.has(word)) {
      return true;
    }

    // 명령어 변형에 있는지 확인
    if (this.commandVariations.has(word)) {
      return true;
    }

    // 약어 사전에 있는지 확인
    if (this.abbreviations.has(word.toLowerCase())) {
      return true;
    }

    // 일반적인 파일 확장자나 명령어인지 확인
    const commonWords = [
      '파일', '폴더', '디렉토리', '문서', '이미지', '사진', '동영상', '음악', '노래',
      '최근', '오래된', '큰', '작은', '최신', '구식', '최고', '최대', '최소',
      '찾아', '검색', '보여줘', '정렬', '필터', '분석', '미리보기', '보기', '열기'
    ];

    return commonWords.includes(word);
  }

  // 동의어 확장
  expandSynonyms(command) {
    let expanded = command;
    const words = expanded.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (this.synonyms.has(word)) {
        // 동의어 중에서 컨텍스트에 맞는 것을 선택
        const synonyms = this.synonyms.get(word);
        const contextSynonyms = this.selectContextualSynonym(word, synonyms, words, i);
        if (contextSynonyms) {
          words[i] = contextSynonyms;
        }
      }
    }

    return words.join(' ');
  }

  // 컨텍스트에 맞는 동의어 선택
  selectContextualSynonym(word, synonyms, allWords, wordIndex) {
    // 간단한 컨텍스트 기반 선택
    const context = allWords.join(' ');
    
    for (const synonym of synonyms) {
      if (context.includes(synonym)) {
        return synonym; // 이미 사용된 동의어가 있으면 그것을 선택
      }
    }

    // 기본 동의어 반환
    return synonyms[0];
  }

  // 은어/슬랭 변환
  translateSlangs(command) {
    let translated = command;
    
    for (const [slang, translations] of this.slangs.entries()) {
      const regex = new RegExp(`\\b${slang}\\b`, 'gi');
      if (regex.test(translated)) {
        translated = translated.replace(regex, translations[0]); // 첫 번째 번역 사용
      }
    }

    return translated;
  }

  // 약어 확장
  expandAbbreviations(command) {
    let expanded = command;
    
    for (const [abbr, expansions] of this.abbreviations.entries()) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(expanded)) {
        expanded = expanded.replace(regex, expansions[0]); // 첫 번째 확장 사용
      }
    }

    return expanded;
  }

  // 사용자 정의 용어 처리
  processCustomTerms(command, context) {
    let processed = command;
    
    // 사용자별 커스텀 용어 처리
    if (context.userId && this.userCustomTerms.has(context.userId)) {
      const userTerms = this.userCustomTerms.get(context.userId);
      
      for (const [customTerm, standardTerm] of userTerms.entries()) {
        const regex = new RegExp(`\\b${customTerm}\\b`, 'gi');
        if (regex.test(processed)) {
          processed = processed.replace(regex, standardTerm);
        }
      }
    }

    return processed;
  }

  // 명령어 변형 처리
  processCommandVariations(command) {
    let processed = command;
    const words = processed.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (this.commandVariations.has(word)) {
        // 변형 중에서 가장 적절한 것을 선택
        const variations = this.commandVariations.get(word);
        const bestVariation = this.selectBestVariation(word, variations, words, i);
        if (bestVariation) {
          words[i] = bestVariation;
        }
      }
    }

    return words.join(' ');
  }

  // 최적의 변형 선택
  selectBestVariation(word, variations, allWords, wordIndex) {
    // 컨텍스트 기반 선택
    const context = allWords.join(' ');
    
    for (const variation of variations) {
      if (context.includes(variation)) {
        return variation; // 이미 사용된 변형이 있으면 그것을 선택
      }
    }

    // 기본 변형 반환
    return variations[0];
  }

  // 신뢰도 계산
  calculateConfidence(originalCommand, processedCommand) {
    let confidence = 1.0;

    // 오타 수정이 많을수록 신뢰도 감소
    const originalWords = originalCommand.split(' ');
    const processedWords = processedCommand.split(' ');
    
    let corrections = 0;
    for (let i = 0; i < Math.min(originalWords.length, processedWords.length); i++) {
      if (originalWords[i] !== processedWords[i]) {
        corrections++;
      }
    }

    confidence -= (corrections / originalWords.length) * 0.3;

    // 은어/슬랭 사용 시 신뢰도 감소
    for (const [slang] of this.slangs.entries()) {
      if (originalCommand.includes(slang)) {
        confidence -= 0.1;
        break;
      }
    }

    // 약어 사용 시 신뢰도 감소
    for (const [abbr] of this.abbreviations.entries()) {
      if (originalCommand.toLowerCase().includes(abbr)) {
        confidence -= 0.05;
        break;
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // 제안 생성
  async generateSuggestions(command, context) {
    const suggestions = [];

    // 유사한 명령어 제안
    const similarCommands = this.findSimilarCommands(command);
    suggestions.push(...similarCommands);

    // 개선된 명령어 제안
    const improvedCommands = this.generateImprovedCommands(command);
    suggestions.push(...improvedCommands);

    // 컨텍스트 기반 제안
    const contextualSuggestions = this.generateContextualSuggestions(command, context);
    suggestions.push(...contextualSuggestions);

    return suggestions.slice(0, 5); // 최대 5개 제안
  }

  // 유사한 명령어 찾기
  findSimilarCommands(command) {
    const suggestions = [];
    const words = command.split(' ');

    for (const word of words) {
      if (this.synonyms.has(word)) {
        const synonyms = this.synonyms.get(word);
        for (const synonym of synonyms.slice(0, 2)) { // 최대 2개 동의어
          const suggestion = command.replace(word, synonym);
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  // 개선된 명령어 생성
  generateImprovedCommands(command) {
    const suggestions = [];

    // 더 구체적인 명령어 제안
    if (command.includes('파일')) {
      suggestions.push(command.replace('파일', 'PDF 파일'));
      suggestions.push(command.replace('파일', '이미지 파일'));
      suggestions.push(command.replace('파일', '문서 파일'));
    }

    if (command.includes('정렬')) {
      suggestions.push(command + ' 크기순으로');
      suggestions.push(command + ' 날짜순으로');
      suggestions.push(command + ' 이름순으로');
    }

    if (command.includes('검색')) {
      suggestions.push(command + ' 최근 파일만');
      suggestions.push(command + ' 큰 파일만');
      suggestions.push(command + ' 특정 폴더에서');
    }

    return suggestions;
  }

  // 컨텍스트 기반 제안
  generateContextualSuggestions(command, context) {
    const suggestions = [];

    // 현재 디렉토리 기반 제안
    if (context.currentDirectory) {
      suggestions.push(`${command} 현재 폴더에서`);
    }

    // 선택된 파일 기반 제안
    if (context.selectedFiles && context.selectedFiles.length > 0) {
      suggestions.push(`${command} 선택된 파일들에 대해`);
    }

    // 최근 작업 기반 제안
    if (context.recentActions && context.recentActions.length > 0) {
      const lastAction = context.recentActions[context.recentActions.length - 1];
      suggestions.push(`${command} ${lastAction}와 함께`);
    }

    return suggestions;
  }

  // 사용자 정의 용어 추가
  addCustomTerm(userId, customTerm, standardTerm) {
    if (!this.userCustomTerms.has(userId)) {
      this.userCustomTerms.set(userId, new Map());
    }
    
    this.userCustomTerms.get(userId).set(customTerm, standardTerm);
  }

  // 사용자 정의 용어 제거
  removeCustomTerm(userId, customTerm) {
    if (this.userCustomTerms.has(userId)) {
      this.userCustomTerms.get(userId).delete(customTerm);
    }
  }

  // 통계 가져오기
  getStats() {
    return {
      synonyms: this.synonyms.size,
      slangs: this.slangs.size,
      abbreviations: this.abbreviations.size,
      commandVariations: this.commandVariations.size,
      userCustomTerms: Array.from(this.userCustomTerms.values()).reduce((sum, terms) => sum + terms.size, 0)
    };
  }
}

module.exports = new FuzzyCommandProcessor(); 