import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../common/Logger.js';

const logger = Logger.component('WordAnalyzer');

/**
 * 📝 Word 문서(.doc, .docx) 완전 분석기
 * Microsoft Word 파일을 분석하여 텍스트, 구조, 메타데이터를 추출
 */
export class WordAnalyzer {
  constructor() {
    this.supportedFormats = ['.doc', '.docx'];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
  }

  /**
   * 📝 Word 문서 완전 분석
   */
  async analyzeComplete(filePath) {
    const startTime = Date.now();
    
    try {
      logger.info(`🔍 [Word 분석] 시작: ${filePath}`);
      
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // 파일 크기 체크
      if (stats.size > this.maxFileSize) {
        throw new Error(`파일이 너무 큽니다 (${(stats.size / 1024 / 1024).toFixed(2)}MB > 100MB)`);
      }
      
      // 기본 정보 추출
      const basicInfo = this.extractBasicInfo(filePath, stats);
      
      // 파일 형식별 분석
      let result;
      if (ext === '.docx') {
        result = await this.analyzeDocxFile(buffer, filePath);
      } else if (ext === '.doc') {
        result = await this.analyzeDocFile(buffer, filePath);
      } else {
        throw new Error('지원하지 않는 Word 형식입니다');
      }
      
      const analysisDuration = Date.now() - startTime;
      
      return {
        success: true,
        path: filePath,
        basicInfo,
        ...result,
        analysis: {
          ...result.analysis,
          duration: analysisDuration
        }
      };
      
    } catch (error) {
      logger.error(`❌ [Word 분석] 오류: ${error.message}`);
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  /**
   * 📋 기본 정보 추출
   */
  extractBasicInfo(filePath, stats) {
    return {
      fileName: path.basename(filePath),
      fileSize: stats.size,
      fileSizeFormatted: this.formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      format: path.extname(filePath).toLowerCase() === '.docx' ? 'Word 2007+' : 'Word 97-2003'
    };
  }

  /**
   * 📝 DOCX 파일 분석 (Office Open XML)
   */
  async analyzeDocxFile(buffer, filePath) {
    try {
      logger.info(`🔍 [Word 분석] DOCX 파일 분석 시작`);
      
      // 방법 1: mammoth 라이브러리 사용
      try {
        const result = await this.extractWithMammoth(buffer, filePath);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ mammoth 라이브러리 실패: ${error.message}`);
      }
      
      // 방법 2: ZIP 기반 분석
      try {
        const result = await this.extractWithZipAnalysis(buffer, filePath);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ ZIP 분석 실패: ${error.message}`);
      }
      
      // 방법 3: 폴백
      return this.extractFallback(buffer, filePath, 'docx');
      
    } catch (error) {
      throw new Error(`DOCX 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📝 DOC 파일 분석 (이진 형식)
   */
  async analyzeDocFile(buffer, filePath) {
    try {
      logger.info(`🔍 [Word 분석] DOC 파일 분석 시작`);
      
      // 방법 1: mammoth 라이브러리 사용
      try {
        const result = await this.extractWithMammoth(buffer, filePath);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ mammoth 라이브러리 실패: ${error.message}`);
      }
      
      // 방법 2: 바이너리 분석
      try {
        const result = await this.extractWithBinaryAnalysis(buffer, filePath);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ 바이너리 분석 실패: ${error.message}`);
      }
      
      // 방법 3: 폴백
      return this.extractFallback(buffer, filePath, 'doc');
      
    } catch (error) {
      throw new Error(`DOC 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔧 mammoth 라이브러리 사용
   */
  async extractWithMammoth(buffer, filePath) {
    try {
      // mammoth 라이브러리 동적 로드
      const mammoth = await import('mammoth');
      const result = await mammoth.default.extractRawText({ buffer });
      
      const text = result.value;
      const messages = result.messages || [];
      
      // 문서 구조 분석
      const structure = this.analyzeDocumentStructure(text);
      
      // 메타데이터 추출
      const metadata = await this.extractMetadataWithMammoth(buffer);
      
      // 텍스트 분석
      const textAnalysis = this.analyzeTextContent(text);
      
      return {
        success: true,
        content: text,
        structure: {
          paragraphs: structure.paragraphs,
          sentences: structure.sentences,
          words: structure.words,
          characters: text.length,
          hasHeaders: structure.hasHeaders,
          hasLists: structure.hasLists,
          hasTables: structure.hasTables,
          hasImages: structure.hasImages,
          sections: structure.sections,
          headings: structure.headings
        },
        metadata: {
          title: metadata.title || path.basename(filePath, path.extname(filePath)),
          author: metadata.author || '',
          subject: metadata.subject || '',
          created: metadata.created || null,
          modified: metadata.modified || null,
          keywords: metadata.keywords || [],
          category: metadata.category || '',
          comments: metadata.comments || '',
          hasMacros: metadata.hasMacros || false,
          hasEmbeddedObjects: metadata.hasEmbeddedObjects || false,
          documentProperties: metadata
        },
        analysis: {
          language: this.detectLanguage(text),
          readability: this.calculateReadability(text),
          sentiment: this.analyzeSentiment(text),
          keywords: this.extractKeywords(text),
          statistics: {
            paragraphs: structure.paragraphs,
            sentences: structure.sentences,
            words: structure.words,
            characters: text.length,
            avgWordsPerSentence: structure.avgWordsPerSentence,
            avgSentencesPerParagraph: structure.avgSentencesPerParagraph
          },
          structure: structure,
          warnings: messages.map(msg => msg.message),
          confidence: 0.9,
          extractionMethod: 'mammoth'
        }
      };
    } catch (error) {
      throw new Error(`mammoth 라이브러리 실패: ${error.message}`);
    }
  }

  /**
   * 📦 ZIP 기반 DOCX 분석
   */
  async extractWithZipAnalysis(buffer, filePath) {
    try {
      // adm-zip 라이브러리 사용
      const AdmZip = await import('adm-zip');
      const zip = new AdmZip.default(buffer);
      
      // 문서 XML 파일들 찾기
      const documentEntry = zip.getEntry('word/document.xml');
      if (!documentEntry) {
        throw new Error('문서 XML을 찾을 수 없습니다');
      }
      
      const documentXml = documentEntry.getData().toString('utf8');
      const text = this.extractTextFromDocumentXml(documentXml);
      
      // 스타일 정보 추출
      const stylesEntry = zip.getEntry('word/styles.xml');
      const styles = stylesEntry ? this.extractStylesFromXml(stylesEntry.getData().toString('utf8')) : {};
      
      // 문서 속성 추출
      const coreEntry = zip.getEntry('docProps/core.xml');
      const metadata = coreEntry ? this.extractMetadataFromCoreXml(coreEntry.getData().toString('utf8')) : {};
      
      // 문서 구조 분석
      const structure = this.analyzeDocumentStructure(text);
      
      return {
        success: true,
        content: text,
        structure: {
          paragraphs: structure.paragraphs,
          sentences: structure.sentences,
          words: structure.words,
          characters: text.length,
          hasHeaders: structure.hasHeaders,
          hasLists: structure.hasLists,
          hasTables: structure.hasTables,
          hasImages: structure.hasImages,
          sections: structure.sections,
          headings: structure.headings
        },
        metadata: {
          title: metadata.title || path.basename(filePath, path.extname(filePath)),
          author: metadata.author || '',
          subject: metadata.subject || '',
          created: metadata.created || null,
          modified: metadata.modified || null,
          keywords: metadata.keywords || [],
          category: metadata.category || '',
          comments: metadata.comments || '',
          hasMacros: this.hasMacrosInZip(zip),
          hasEmbeddedObjects: this.hasEmbeddedObjectsInZip(zip),
          documentProperties: metadata,
          styles: styles
        },
        analysis: {
          language: this.detectLanguage(text),
          readability: this.calculateReadability(text),
          sentiment: this.analyzeSentiment(text),
          keywords: this.extractKeywords(text),
          statistics: {
            paragraphs: structure.paragraphs,
            sentences: structure.sentences,
            words: structure.words,
            characters: text.length,
            avgWordsPerSentence: structure.avgWordsPerSentence,
            avgSentencesPerParagraph: structure.avgSentencesPerParagraph
          },
          structure: structure,
          warnings: [],
          confidence: 0.7,
          extractionMethod: 'zip-analysis'
        }
      };
      
    } catch (error) {
      throw new Error(`ZIP 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 바이너리 분석으로 DOC 텍스트 추출
   */
  async extractWithBinaryAnalysis(buffer, filePath) {
    try {
      let textContent = '';
      
      // DOC 파일의 텍스트 블록 패턴 찾기
      const textPatterns = [
        /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g, // 한글 유니코드
        /[가-힣]+/g, // 한글 완성형
        /[A-Za-z0-9\s]+/g // 영문 및 숫자
      ];
      
      // 바이너리에서 텍스트 블록 찾기
      const textBlocks = this.findTextBlocks(buffer);
      
      for (const block of textBlocks) {
        const text = buffer.slice(block.offset, block.offset + block.length).toString('utf8');
        
        // 텍스트 패턴 확인
        for (const pattern of textPatterns) {
          const matches = text.match(pattern);
          if (matches && matches.length > 0) {
            textContent += matches.join(' ') + '\n';
          }
        }
      }
      
      // 문서 구조 분석
      const structure = this.analyzeDocumentStructure(textContent);
      
      return {
        success: true,
        content: textContent.trim(),
        structure: {
          paragraphs: structure.paragraphs,
          sentences: structure.sentences,
          words: structure.words,
          characters: textContent.length,
          hasHeaders: structure.hasHeaders,
          hasLists: structure.hasLists,
          hasTables: structure.hasTables,
          hasImages: structure.hasImages,
          sections: structure.sections,
          headings: structure.headings
        },
        metadata: {
          title: path.basename(filePath, '.doc'),
          author: '',
          subject: '',
          created: null,
          modified: null,
          keywords: [],
          category: '',
          comments: '',
          hasMacros: false,
          hasEmbeddedObjects: false,
          documentProperties: {}
        },
        analysis: {
          language: this.detectLanguage(textContent),
          readability: this.calculateReadability(textContent),
          sentiment: this.analyzeSentiment(textContent),
          keywords: this.extractKeywords(textContent),
          statistics: {
            paragraphs: structure.paragraphs,
            sentences: structure.sentences,
            words: structure.words,
            characters: textContent.length,
            avgWordsPerSentence: structure.avgWordsPerSentence,
            avgSentencesPerParagraph: structure.avgSentencesPerParagraph
          },
          structure: structure,
          warnings: [],
          confidence: textContent.length > 0 ? 0.5 : 0.2,
          extractionMethod: 'binary-analysis'
        }
      };
      
    } catch (error) {
      throw new Error(`바이너리 분석 실패: ${error.message}`);
    }
  }

  /**
   * 📄 폴백 텍스트 추출
   */
  extractFallback(buffer, filePath, format) {
    const fileName = path.basename(filePath, `.${format}`);
    const fileSize = buffer.length;
    
    const content = `Word 문서: ${fileName}\n\n파일 크기: ${this.formatSize(fileSize)}\n형식: ${format.toUpperCase()}\n\n이 Word 문서의 내용을 추출할 수 없습니다.\nWord 뷰어나 변환 도구를 사용하여 텍스트로 변환 후 분석하세요.`;
    
    return {
      success: true,
      content: content,
      structure: {
        paragraphs: 1,
        sentences: 3,
        words: 20,
        characters: content.length,
        hasHeaders: false,
        hasLists: false,
        hasTables: false,
        hasImages: false,
        sections: [],
        headings: []
      },
      metadata: {
        title: fileName,
        author: '',
        subject: '',
        created: null,
        modified: null,
        keywords: [],
        category: '',
        comments: '',
        hasMacros: false,
        hasEmbeddedObjects: false,
        documentProperties: {}
      },
      analysis: {
        language: 'ko',
        readability: { score: 0, level: 'unknown' },
        sentiment: { score: 0, label: 'neutral' },
        keywords: [],
        statistics: {
          paragraphs: 1,
          sentences: 3,
          words: 20,
          characters: content.length,
          avgWordsPerSentence: 6.7,
          avgSentencesPerParagraph: 3
        },
        structure: {},
        warnings: ['폴백 모드로 실행됨'],
        confidence: 0.1,
        extractionMethod: 'fallback'
      }
    };
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 🔍 텍스트 블록 찾기
   */
  findTextBlocks(buffer) {
    const blocks = [];
    
    try {
      // Word 파일의 텍스트 블록 시그니처 패턴
      const textSignatures = [
        Buffer.from([0x54, 0x45, 0x58, 0x54]), // TEXT
        Buffer.from([0x50, 0x41, 0x52, 0x41]), // PARA
        Buffer.from([0x43, 0x48, 0x50, 0x58])  // CHPX
      ];
      
      for (let i = 0; i < buffer.length - 4; i++) {
        for (const signature of textSignatures) {
          if (buffer.slice(i, i + 4).equals(signature)) {
            // 블록 크기 추출 (다음 4바이트)
            const size = buffer.readUInt32LE(i + 4);
            blocks.push({
              offset: i,
              length: size,
              type: signature.toString('utf8')
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.warn(`텍스트 블록 찾기 실패: ${error.message}`);
    }
    
    return blocks;
  }

  /**
   * 📄 문서 XML에서 텍스트 추출
   */
  extractTextFromDocumentXml(xmlContent) {
    try {
      // 간단한 XML 파싱으로 텍스트 추출
      const textMatches = xmlContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        return textMatches.map(match => {
          const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
          return textMatch ? textMatch[1] : '';
        }).join(' ');
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 🎨 스타일 정보 추출
   */
  extractStylesFromXml(xmlContent) {
    try {
      const styles = {
        headings: [],
        paragraphs: [],
        characters: []
      };
      
      // 헤딩 스타일 찾기
      const headingMatches = xmlContent.match(/<w:style[^>]*w:type="paragraph"[^>]*>[\s\S]*?<w:name[^>]*w:val="([^"]*)"[^>]*>[\s\S]*?<\/w:style>/g);
      if (headingMatches) {
        headingMatches.forEach(match => {
          const nameMatch = match.match(/<w:name[^>]*w:val="([^"]*)"[^>]*>/);
          if (nameMatch && /heading/i.test(nameMatch[1])) {
            styles.headings.push(nameMatch[1]);
          }
        });
      }
      
      return styles;
    } catch (error) {
      return { headings: [], paragraphs: [], characters: [] };
    }
  }

  /**
   * 📋 메타데이터 추출 (mammoth)
   */
  async extractMetadataWithMammoth(buffer) {
    try {
      const mammoth = await import('mammoth');
      const metadata = await mammoth.default.extractRawText({ 
        buffer,
        includeDefaultStyleMap: false,
        includeEmbeddedStyleMap: false
      });
      
      return {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        keywords: [],
        category: '',
        comments: ''
      };
    } catch (error) {
      return {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        keywords: [],
        category: '',
        comments: ''
      };
    }
  }

  /**
   * 📋 코어 XML에서 메타데이터 추출
   */
  extractMetadataFromCoreXml(xmlContent) {
    try {
      const metadata = {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        keywords: [],
        category: '',
        comments: ''
      };
      
      const titleMatch = xmlContent.match(/<dc:title>([^<]+)<\/dc:title>/);
      if (titleMatch) metadata.title = titleMatch[1];
      
      const authorMatch = xmlContent.match(/<dc:creator>([^<]+)<\/dc:creator>/);
      if (authorMatch) metadata.author = authorMatch[1];
      
      const subjectMatch = xmlContent.match(/<dc:subject>([^<]+)<\/dc:subject>/);
      if (subjectMatch) metadata.subject = subjectMatch[1];
      
      const createdMatch = xmlContent.match(/<dcterms:created[^>]*>([^<]+)<\/dcterms:created>/);
      if (createdMatch) metadata.created = new Date(createdMatch[1]);
      
      const modifiedMatch = xmlContent.match(/<dcterms:modified[^>]*>([^<]+)<\/dcterms:modified>/);
      if (modifiedMatch) metadata.modified = new Date(modifiedMatch[1]);
      
      return metadata;
    } catch (error) {
      return {
        title: '',
        author: '',
        subject: '',
        created: null,
        modified: null,
        keywords: [],
        category: '',
        comments: ''
      };
    }
  }

  /**
   * 📄 문서 구조 분석
   */
  analyzeDocumentStructure(text) {
    try {
      const structure = {
        paragraphs: 0,
        sentences: 0,
        words: 0,
        hasHeaders: false,
        hasLists: false,
        hasTables: false,
        hasImages: false,
        sections: [],
        headings: [],
        avgWordsPerSentence: 0,
        avgSentencesPerParagraph: 0
      };
      
      // 문단 수 (빈 줄로 구분)
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      structure.paragraphs = paragraphs.length;
      
      // 문장 수 (간단한 패턴)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      structure.sentences = sentences.length;
      
      // 단어 수
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      structure.words = words.length;
      
      // 헤더 존재 여부 (숫자나 특수 패턴으로 시작하는 문단)
      structure.hasHeaders = paragraphs.some(p => 
        /^[0-9]+\.\s|^[A-Z][A-Z\s]+$|^제\s*\d+장|^Chapter\s*\d+/i.test(p.trim())
      );
      
      // 리스트 존재 여부
      structure.hasLists = text.includes('•') || text.includes('- ') || 
                          /\n\s*[0-9]+\.\s/.test(text) || /\n\s*[a-z]\.\s/.test(text);
      
      // 표 존재 여부
      structure.hasTables = text.includes('[표]') || text.includes('[Table]') ||
                           /\|\s*[^|]+\s*\|/.test(text) || /\t/.test(text);
      
      // 이미지 존재 여부
      structure.hasImages = text.includes('[이미지]') || text.includes('[Image]');
      
      // 섹션 및 헤딩 추출
      structure.sections = this.extractSections(paragraphs);
      structure.headings = this.extractHeadings(paragraphs);
      
      // 평균 계산
      structure.avgWordsPerSentence = structure.sentences > 0 ? 
        Math.round((structure.words / structure.sentences) * 100) / 100 : 0;
      structure.avgSentencesPerParagraph = structure.paragraphs > 0 ? 
        Math.round((structure.sentences / structure.paragraphs) * 100) / 100 : 0;
      
      return structure;
    } catch (error) {
      return {
        paragraphs: 0,
        sentences: 0,
        words: 0,
        hasHeaders: false,
        hasLists: false,
        hasTables: false,
        hasImages: false,
        sections: [],
        headings: [],
        avgWordsPerSentence: 0,
        avgSentencesPerParagraph: 0
      };
    }
  }

  /**
   * 📋 섹션 추출
   */
  extractSections(paragraphs) {
    const sections = [];
    let currentSection = { title: '', content: [] };
    
    paragraphs.forEach(paragraph => {
      // 섹션 시작 패턴 확인
      if (/^[0-9]+\.\s|^[A-Z][A-Z\s]+$|^제\s*\d+장|^Chapter\s*\d+/i.test(paragraph.trim())) {
        if (currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { title: paragraph.trim(), content: [] };
      } else {
        currentSection.content.push(paragraph.trim());
      }
    });
    
    if (currentSection.title) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * 📋 헤딩 추출
   */
  extractHeadings(paragraphs) {
    return paragraphs
      .filter(p => /^[0-9]+\.\s|^[A-Z][A-Z\s]+$|^제\s*\d+장|^Chapter\s*\d+/i.test(p.trim()))
      .map(p => p.trim());
  }

  /**
   * 🌍 언어 감지
   */
  detectLanguage(text) {
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (koreanChars > englishChars) return 'ko';
    if (englishChars > koreanChars) return 'en';
    return 'unknown';
  }

  /**
   * 📖 가독성 계산
   */
  calculateReadability(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      const syllables = this.countSyllables(text);
      
      if (sentences.length === 0 || words.length === 0) {
        return { score: 0, level: 'unknown' };
      }
      
      // Flesch Reading Ease 공식
      const fleschScore = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
      
      let level = 'unknown';
      if (fleschScore >= 90) level = 'very_easy';
      else if (fleschScore >= 80) level = 'easy';
      else if (fleschScore >= 70) level = 'fairly_easy';
      else if (fleschScore >= 60) level = 'standard';
      else if (fleschScore >= 50) level = 'fairly_difficult';
      else if (fleschScore >= 30) level = 'difficult';
      else level = 'very_difficult';
      
      return {
        score: Math.round(fleschScore * 100) / 100,
        level: level,
        sentences: sentences.length,
        words: words.length,
        syllables: syllables
      };
    } catch (error) {
      return { score: 0, level: 'unknown' };
    }
  }

  /**
   * 😊 감정 분석
   */
  analyzeSentiment(text) {
    try {
      // 간단한 감정 분석 (한국어 기준)
      const positiveWords = ['좋다', '훌륭하다', '멋지다', '행복하다', '기쁘다', '성공하다', '완벽하다'];
      const negativeWords = ['나쁘다', '끔찍하다', '슬프다', '화나다', '실패하다', '어렵다', '힘들다'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });
      
      const total = positiveCount + negativeCount;
      let score = 0;
      let label = 'neutral';
      
      if (total > 0) {
        score = (positiveCount - negativeCount) / total;
        if (score > 0.1) label = 'positive';
        else if (score < -0.1) label = 'negative';
        else label = 'neutral';
      }
      
      return {
        score: Math.round(score * 100) / 100,
        label: label,
        positive: positiveCount,
        negative: negativeCount,
        total: total
      };
    } catch (error) {
      return { score: 0, label: 'neutral' };
    }
  }

  /**
   * 🔑 키워드 추출
   */
  extractKeywords(text) {
    try {
      // 간단한 키워드 추출 (한국어 기준)
      const words = text.toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);
      
      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      // 빈도순으로 정렬하여 상위 키워드 추출
      const sortedWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      return sortedWords;
    } catch (error) {
      return [];
    }
  }

  /**
   * 📊 음절 수 계산
   */
  countSyllables(text) {
    try {
      // 간단한 음절 수 계산 (한국어 기준)
      const koreanSyllables = (text.match(/[가-힣]/g) || []).length;
      const englishWords = text.match(/[a-zA-Z]+/g) || [];
      const englishSyllables = englishWords.reduce((total, word) => {
        return total + Math.max(1, Math.floor(word.length / 3));
      }, 0);
      
      return koreanSyllables + englishSyllables;
    } catch (error) {
      return 0;
    }
  }

  // ===== ZIP 객체 확인 메서드들 =====

  /**
   * 🔧 ZIP에서 매크로 존재 확인
   */
  hasMacrosInZip(zip) {
    const macroEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/vbaProject.bin') || 
      entry.entryName.includes('/macros/')
    );
    return macroEntries.length > 0;
  }

  /**
   * 📎 ZIP에서 임베디드 객체 존재 확인
   */
  hasEmbeddedObjectsInZip(zip) {
    const objectEntries = zip.getEntries().filter(entry => 
      entry.entryName.includes('/embeddings/') || 
      entry.entryName.includes('/media/')
    );
    return objectEntries.length > 0;
  }

  /**
   * 📏 파일 크기 포맷팅
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 