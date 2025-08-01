const naturalLanguageProcessor = require('./naturalLanguageProcessor');

class VoiceCommandProcessor {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voiceCommands = [];
    this.voiceSettings = {
      language: 'ko-KR',
      continuous: true,
      interimResults: false,
      maxAlternatives: 1
    };
  }

  // 음성 인식 초기화
  initializeSpeechRecognition() {
    try {
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new webkitSpeechRecognition();
        this.setupRecognitionHandlers();
        return true;
      } else if ('SpeechRecognition' in window) {
        this.recognition = new SpeechRecognition();
        this.setupRecognitionHandlers();
        return true;
      } else {
        console.error('음성 인식이 지원되지 않습니다.');
        return false;
      }
    } catch (error) {
      console.error('음성 인식 초기화 실패:', error);
      return false;
    }
  }

  // 음성 인식 핸들러 설정
  setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.continuous = this.voiceSettings.continuous;
    this.recognition.interimResults = this.voiceSettings.interimResults;
    this.recognition.lang = this.voiceSettings.language;
    this.recognition.maxAlternatives = this.voiceSettings.maxAlternatives;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('음성 인식 시작');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const confidence = event.results[event.results.length - 1][0].confidence;
      
      console.log(`음성 인식 결과: ${transcript} (신뢰도: ${confidence})`);
      
      this.processVoiceCommand(transcript, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('음성 인식 종료');
    };
  }

  // 음성 명령 처리
  async processVoiceCommand(transcript, confidence) {
    try {
      // 음성 명령 히스토리에 추가
      this.voiceCommands.push({
        transcript,
        confidence,
        timestamp: new Date().toISOString()
      });

      // 자연어 명령 처리
      const context = {
        voiceCommand: true,
        confidence,
        language: this.voiceSettings.language
      };

      const result = await naturalLanguageProcessor.processNaturalLanguageCommand(transcript, context);

      // 음성 피드백 제공
      this.provideVoiceFeedback(result);

      return result;
    } catch (error) {
      console.error('음성 명령 처리 실패:', error);
      this.speak('음성 명령을 처리하는 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 음성 피드백 제공
  provideVoiceFeedback(result) {
    try {
      const { processedCommand, confidence } = result;
      const action = processedCommand.parsedCommand.primaryAction;

      let feedback = '';

      if (confidence > 0.8) {
        feedback = `명령을 이해했습니다. ${this.getActionDescription(action)}을 실행합니다.`;
      } else if (confidence > 0.6) {
        feedback = `명령을 대략적으로 이해했습니다. ${this.getActionDescription(action)}을 시도합니다.`;
      } else {
        feedback = '명령을 정확히 이해하지 못했습니다. 다시 말씀해 주세요.';
      }

      this.speak(feedback);
    } catch (error) {
      console.error('음성 피드백 생성 실패:', error);
    }
  }

  // 액션별 설명 생성
  getActionDescription(action) {
    const descriptions = {
      search: '파일 검색',
      sort: '파일 정렬',
      filter: '파일 필터링',
      preview: '파일 미리보기',
      analyze: '파일 분석',
      organize: '파일 정리'
    };

    return descriptions[action] || '작업';
  }

  // 음성 합성 (TTS)
  speak(text, options = {}) {
    try {
      if (!this.synthesis) {
        console.warn('음성 합성이 지원되지 않습니다.');
        return;
      }

      // 기존 음성 중지
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 기본 설정
      utterance.lang = options.lang || 'ko-KR';
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // 한국어 음성 선택
      const voices = this.synthesis.getVoices();
      const koreanVoice = voices.find(voice => 
        voice.lang.includes('ko') || voice.lang.includes('KR')
      );
      
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      utterance.onstart = () => {
        console.log('음성 합성 시작:', text);
      };

      utterance.onend = () => {
        console.log('음성 합성 종료');
      };

      utterance.onerror = (event) => {
        console.error('음성 합성 오류:', event.error);
      };

      this.synthesis.speak(utterance);
    } catch (error) {
      console.error('음성 합성 실패:', error);
    }
  }

  // 음성 인식 시작
  startListening() {
    try {
      if (!this.recognition) {
        if (!this.initializeSpeechRecognition()) {
          throw new Error('음성 인식을 초기화할 수 없습니다.');
        }
      }

      if (!this.isListening) {
        this.recognition.start();
        this.speak('음성 명령을 말씀해 주세요.');
      }
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      throw error;
    }
  }

  // 음성 인식 중지
  stopListening() {
    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
        this.speak('음성 인식을 중지했습니다.');
      }
    } catch (error) {
      console.error('음성 인식 중지 실패:', error);
    }
  }

  // 음성 설정 업데이트
  updateVoiceSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    
    if (this.recognition) {
      this.setupRecognitionHandlers();
    }
  }

  // 음성 명령 히스토리 가져오기
  getVoiceCommandHistory(limit = 10) {
    return this.voiceCommands.slice(-limit);
  }

  // 음성 명령 통계
  getVoiceCommandStats() {
    const totalCommands = this.voiceCommands.length;
    const avgConfidence = this.voiceCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / totalCommands;
    
    const commandTypes = {};
    this.voiceCommands.forEach(cmd => {
      // 간단한 키워드 기반 분류
      const lowerTranscript = cmd.transcript.toLowerCase();
      if (lowerTranscript.includes('찾아') || lowerTranscript.includes('검색')) {
        commandTypes.search = (commandTypes.search || 0) + 1;
      } else if (lowerTranscript.includes('정렬') || lowerTranscript.includes('순서')) {
        commandTypes.sort = (commandTypes.sort || 0) + 1;
      } else if (lowerTranscript.includes('보여') || lowerTranscript.includes('미리보기')) {
        commandTypes.preview = (commandTypes.preview || 0) + 1;
      } else {
        commandTypes.other = (commandTypes.other || 0) + 1;
      }
    });

    return {
      totalCommands,
      averageConfidence: avgConfidence || 0,
      commandTypes,
      recentCommands: this.voiceCommands.slice(-5)
    };
  }

  // 음성 명령 학습
  learnFromVoiceCommand(transcript, result, userFeedback) {
    try {
      // 음성 명령 패턴 학습
      this.voiceCommands.push({
        transcript,
        result,
        feedback: userFeedback,
        timestamp: new Date().toISOString()
      });

      // 자연어 프로세서에 학습 데이터 전달
      return naturalLanguageProcessor.learnFromUserBehavior(transcript, result, userFeedback);
    } catch (error) {
      console.error('음성 명령 학습 실패:', error);
      return false;
    }
  }

  // 음성 명령 제안 생성
  generateVoiceSuggestions() {
    const suggestions = [
      '파일을 찾아줘',
      '큰 파일들만 보여줘',
      '최근 파일들을 정렬해줘',
      'PDF 파일들만 보여줘',
      '파일을 분석해줘',
      '중복 파일들을 찾아줘',
      '이름순으로 정렬해줘',
      '크기순으로 정렬해줘'
    ];

    return suggestions;
  }

  // 음성 명령 테스트
  testVoiceCommand(transcript) {
    return this.processVoiceCommand(transcript, 0.9);
  }

  // 음성 설정 가져오기
  getVoiceSettings() {
    return { ...this.voiceSettings };
  }

  // 음성 상태 확인
  getVoiceStatus() {
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition,
      synthesisSupported: !!this.synthesis,
      currentLanguage: this.voiceSettings.language
    };
  }
}

module.exports = new VoiceCommandProcessor(); 