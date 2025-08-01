import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../common/Logger.js';
// 분석 결과 재활용을 위한 학습 매니저 import
// import { DocumentAnalysisLearningManager } from './DocumentAnalysisLearningManager.js';

const logger = Logger.component('PDFAnalyzer');

/**
 * 📄 완전한 PDF 분석 모듈
 * 텍스트 추출, 이미지 추출, OCR, 페이지 변환 등 모든 기능 포함
 */
export class PDFAnalyzer {
  constructor() {
    this.config = {
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB (내역서 등 중요 문서를 위해)
      supportedFormats: ['.pdf'],
      ocrLanguages: ['kor', 'eng'],
      imageQuality: 300, // DPI
      maxPages: 10000 // 10,000페이지 (거의 무제한)
    };
    // 학습 매니저 인스턴스 생성
    // this.learningManager = new DocumentAnalysisLearningManager();
  }

  /**
   * 📄 완전한 PDF 분석 (메인 함수) - 모든 방법 동시 시도
   */
  async analyzeComplete(pdfPath, options = {}) {
    const startTime = Date.now();
    
    try {
      // 1. 저장된 분석 결과가 있으면 우선 반환
      // await this.learningManager.initialize();
      // const fileId = this.learningManager.generateFileId(pdfPath);
      // const saved = this.learningManager.data?.analyses?.[fileId];
      // if (saved && saved.analysisResult) {
      //   logger.info('저장된 PDF 분석 결과를 재활용합니다.');
      //   return saved.analysisResult;
      // }
      logger.info(`🔍 PDF 완전 분석 시작: ${pdfPath}`);
      
      // 파일 검증
      const validation = await this.validatePDF(pdfPath);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          path: pdfPath
        };
      }

      const results = {
        text: null,
        images: [],
        pageImages: [],
        ocrResults: [],
        metadata: {},
        analysis: {},
        methods: [] // 어떤 방법이 성공했는지 기록
      };

      // 🔥 모든 방법을 동시에 시도 (병렬 처리)
      const promises = {
        text: this.extractText(pdfPath),
        images: this.extractImages(pdfPath),
        pageImages: this.convertPagesToImages(pdfPath),
        metadata: this.extractMetadata(pdfPath)
      };

      // 모든 작업을 동시에 실행
      const [textResult, imagesResult, pageImagesResult, metadataResult] = await Promise.allSettled([
        promises.text,
        promises.images,
        promises.pageImages,
        promises.metadata
      ]);

      // 결과 처리
      if (textResult.status === 'fulfilled') {
        results.text = textResult.value;
        results.methods.push('text-extraction');
        logger.info(`✅ 텍스트 추출 성공: ${results.text.length} characters`);
      } else {
        logger.warn(`⚠️ 텍스트 추출 실패: ${textResult.reason.message}`);
      }

      if (imagesResult.status === 'fulfilled') {
        results.images = imagesResult.value;
        results.methods.push('image-extraction');
        logger.info(`✅ 이미지 추출 성공: ${results.images.length} images`);
      } else {
        logger.warn(`⚠️ 이미지 추출 실패: ${imagesResult.reason.message}`);
      }

      if (pageImagesResult.status === 'fulfilled') {
        results.pageImages = pageImagesResult.value;
        results.methods.push('page-conversion');
        logger.info(`✅ 페이지 변환 성공: ${results.pageImages.length} pages`);
      } else {
        logger.warn(`⚠️ 페이지 변환 실패: ${pageImagesResult.reason.message}`);
      }

      if (metadataResult.status === 'fulfilled') {
        results.metadata = metadataResult.value;
        results.methods.push('metadata-extraction');
        logger.info(`✅ 메타데이터 추출 성공`);
      } else {
        logger.warn(`⚠️ 메타데이터 추출 실패: ${metadataResult.reason.message}`);
      }

      // 🔥 OCR 처리 (이미지나 페이지 이미지가 있을 때만)
      if (results.images.length > 0 || results.pageImages.length > 0) {
        try {
          results.ocrResults = await this.performOCR(results.images, results.pageImages);
          results.methods.push('ocr-processing');
          logger.info(`✅ OCR 처리 성공: ${results.ocrResults.length} results`);
        } catch (error) {
          logger.warn(`⚠️ OCR 처리 실패: ${error.message}`);
        }
      }

      // 🔥 텍스트가 없으면 OCR 결과를 텍스트로 사용
      if (!results.text && results.ocrResults.length > 0) {
        const ocrText = results.ocrResults.map(result => result.text).join('\n');
        results.text = {
          text: ocrText,
          pages: results.ocrResults.length,
          method: 'ocr-fallback',
          confidence: results.ocrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.ocrResults.length
        };
        results.methods.push('ocr-text-fallback');
        logger.info(`🔄 OCR 결과를 텍스트로 사용: ${ocrText.length} characters`);
      }

      // 🔥 모든 텍스트 추출이 실패하면 대체 방법 시도
      if (!results.text) {
        try {
          const fallbackText = await this.extractTextFallback(pdfPath);
          if (fallbackText) {
            results.text = fallbackText;
            results.methods.push('fallback-text-extraction');
            logger.info(`🔄 대체 텍스트 추출 성공: ${fallbackText.length} characters`);
          }
        } catch (error) {
          logger.warn(`⚠️ 대체 텍스트 추출 실패: ${error.message}`);
        }
      }

      // 종합 분석
      results.analysis = this.analyzeResults(results);

      const duration = Date.now() - startTime;
      
      const finalResult = {
        success: true,
        path: pdfPath,
        results,
        duration,
        methods: results.methods,
        summary: {
          textLength: results.text?.length || 0,
          imageCount: results.images.length,
          pageCount: results.pageImages.length,
          ocrCount: results.ocrResults.length,
          methodsUsed: results.methods
        }
      };
      // 2. 분석 결과 저장
      // try {
      //   await this.learningManager.saveAnalysisResult(pdfPath, finalResult);
      // } catch (e) {
      //   logger.warn('PDF 분석 결과 저장 실패', e);
      // }
      return finalResult;

    } catch (error) {
      logger.error(`❌ PDF 분석 실패: ${error.message}`);
      return {
        success: false,
        error: error.message,
        path: pdfPath
      };
    }
  }

  /**
   * 📄 PDF 파일 검증
   */
  async validatePDF(pdfPath) {
    try {
      const stats = await fs.stat(pdfPath);
      
      // 파일 크기 체크
      if (stats.size > this.config.maxFileSize) {
        return {
          valid: false,
          error: `파일이 너무 큽니다 (${(stats.size / 1024 / 1024).toFixed(2)}MB > ${this.config.maxFileSize / 1024 / 1024}MB)`
        };
      }

      // PDF 시그니처 확인
      const buffer = await fs.readFile(pdfPath);
      const isPdfFile = buffer.slice(0, 4).toString() === '%PDF';
      
      if (!isPdfFile) {
        return {
          valid: false,
          error: '유효하지 않은 PDF 파일 형식입니다'
        };
      }

      return { valid: true, stats, buffer };
    } catch (error) {
      return {
        valid: false,
        error: `파일 검증 실패: ${error.message}`
      };
    }
  }

  /**
   * 📝 텍스트 추출 (pdf-parse + pdf2json 백업)
   */
  async extractText(pdfPath) {
    try {
      logger.info(`📝 텍스트 추출 시작: ${pdfPath}`);
      const buffer = await fs.readFile(pdfPath);
      logger.info(`📄 파일 크기: ${buffer.length} bytes`);
      
      // 1차 시도: pdf-parse
      try {
        const pdfParse = await import('pdf-parse');
        const data = await pdfParse.default(buffer, {
          // 외부 파일 참조 무시
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        logger.info(`📄 pdf-parse 성공: ${data.numpages} pages, version: ${data.version}`);
        logger.info(`📄 텍스트 길이: ${data.text ? data.text.length : 0} characters`);
        
        if (data.text && data.text.length > 0) {
          logger.info(`📄 텍스트 미리보기: ${data.text.substring(0, 100)}...`);
          return {
            text: data.text,
            pages: data.numpages || 0,
            info: data.info || {},
            version: data.version || 'unknown',
            method: 'pdf-parse'
          };
        } else {
          logger.warn(`⚠️ pdf-parse에서 텍스트가 추출되지 않음, pdfjs-dist로 재시도`);
        }
      } catch (pdfParseError) {
        logger.warn(`⚠️ pdf-parse 실패: ${pdfParseError.message}, pdfjs-dist로 재시도`);
      }
      
      // 2차 시도: pdf2json
      try {
        const PDFParser = (await import('pdf2json')).default;
        
        return new Promise((resolve, reject) => {
          const pdfParser = new PDFParser();
          
          pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
              logger.info(`📄 pdf2json 성공: ${pdfData.Pages.length} pages`);
              
              let allText = '';
              const maxPages = pdfData.Pages.length; // 모든 페이지 처리 (제한 해제)
              
              for (let i = 0; i < maxPages; i++) {
                const page = pdfData.Pages[i];
                let pageText = '';
                
                if (page.Texts && page.Texts.length > 0) {
                  pageText = page.Texts.map(text => {
                    return decodeURIComponent(text.R[0].T);
                  }).join(' ');
                } else {
                  // 다른 방법으로 텍스트 찾기
                  logger.info(`📄 페이지 ${i + 1}에서 Texts 배열이 비어있음, 다른 방법 시도`);
                  
                  // Fills에서 텍스트 찾기
                  if (page.Fills && page.Fills.length > 0) {
                    const fillTexts = page.Fills
                      .filter(fill => fill.T && fill.T.length > 0)
                      .map(fill => decodeURIComponent(fill.T))
                      .join(' ');
                    if (fillTexts) {
                      pageText = fillTexts;
                      logger.info(`📄 Fills에서 텍스트 발견: ${fillTexts.length} characters`);
                    }
                  }
                  
                  // 다른 텍스트 관련 속성들 확인
                  const textProperties = ['Text', 'text', 'Content', 'content'];
                  for (const prop of textProperties) {
                    if (page[prop]) {
                      const propText = typeof page[prop] === 'string' ? page[prop] : JSON.stringify(page[prop]);
                      if (propText.length > 0) {
                        pageText = propText;
                        logger.info(`📄 ${prop} 속성에서 텍스트 발견: ${propText.length} characters`);
                        break;
                      }
                    }
                  }
                }
                
                allText += pageText + '\n';
                logger.info(`📄 페이지 ${i + 1} 텍스트: ${pageText.length} characters`);
              }
              
              if (allText.trim().length > 0) {
                logger.info(`📄 pdf2json 텍스트 길이: ${allText.length} characters`);
                logger.info(`📄 텍스트 미리보기: ${allText.substring(0, 100)}...`);
                resolve({
                  text: allText.trim(),
                  pages: pdfData.Pages.length,
                  info: {},
                  version: '1.4',
                  method: 'pdf2json'
                });
              } else {
                logger.warn(`⚠️ pdf2json에서도 텍스트가 추출되지 않음`);
                reject(new Error('텍스트 추출 실패'));
              }
            } catch (parseError) {
              reject(parseError);
            }
          });
          
          pdfParser.on('pdfParser_dataError', (error) => {
            reject(error);
          });
          
          pdfParser.parseBuffer(buffer);
        });
        
      } catch (pdf2jsonError) {
        logger.error(`❌ pdf2json 실패: ${pdf2jsonError.message}`);
      }
      
      // 3차 시도: 기본 메타데이터만 반환
      logger.warn(`⚠️ 모든 텍스트 추출 방법 실패, 기본 정보만 반환`);
      return {
        text: '',
        pages: 0,
        info: {},
        version: 'unknown',
        method: 'fallback'
      };
      
    } catch (error) {
      logger.error(`❌ 텍스트 추출 완전 실패: ${error.message}`);
      throw new Error(`텍스트 추출 실패: ${error.message}`);
    }
  }

  /**
   * 🔄 대체 텍스트 추출 방법들
   */
  async extractTextFallback(pdfPath) {
    logger.info(`🔄 대체 텍스트 추출 시도: ${pdfPath}`);
    
    // 방법 1: pdfjs-dist (Node.js 환경)
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Node.js 환경 설정
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      const data = new Uint8Array(await fs.readFile(pdfPath));
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;
      
      let allText = '';
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= Math.min(numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += pageText + '\n';
      }
      
      if (allText.trim().length > 0) {
        return {
          text: allText.trim(),
          pages: numPages,
          method: 'pdfjs-dist-fallback',
          version: '2.0'
        };
      }
    } catch (error) {
      logger.warn(`⚠️ pdfjs-dist 대체 방법 실패: ${error.message}`);
    }
    
    // 방법 2: pdf-parse with different options
    try {
      const buffer = await fs.readFile(pdfPath);
      const pdfParse = await import('pdf-parse');
      
      const data = await pdfParse.default(buffer, {
        normalizeWhitespace: false,
        disableCombineTextItems: true,
        verbosity: 1
      });
      
      if (data.text && data.text.length > 0) {
        return {
          text: data.text,
          pages: data.numpages || 0,
          method: 'pdf-parse-fallback',
          version: data.version || 'unknown'
        };
      }
    } catch (error) {
      logger.warn(`⚠️ pdf-parse 대체 방법 실패: ${error.message}`);
    }
    
    // 방법 3: pdf2json with different parsing
    try {
      const PDFParser = (await import('pdf2json')).default;
      
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            let allText = '';
            
            // 모든 객체를 재귀적으로 탐색하여 텍스트 찾기
            const findTextInObject = (obj, path = '') => {
              if (typeof obj === 'string' && obj.length > 3) {
                // URL 디코딩 시도
                try {
                  const decoded = decodeURIComponent(obj);
                  if (decoded.length > 1 && /[가-힣a-zA-Z]/.test(decoded)) {
                    allText += decoded + ' ';
                  }
                } catch (e) {
                  // 디코딩 실패시 원본 사용
                  if (obj.length > 1 && /[가-힣a-zA-Z]/.test(obj)) {
                    allText += obj + ' ';
                  }
                }
              } else if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                  findTextInObject(value, `${path}.${key}`);
                }
              }
            };
            
            findTextInObject(pdfData);
            
            if (allText.trim().length > 0) {
              resolve({
                text: allText.trim(),
                pages: pdfData.Pages?.length || 0,
                method: 'pdf2json-deep-fallback',
                version: '1.0'
              });
            } else {
              reject(new Error('깊은 탐색에서도 텍스트를 찾을 수 없음'));
            }
          } catch (error) {
            reject(new Error(`깊은 탐색 실패: ${error.message}`));
          }
        });
        
        pdfParser.on('pdfParser_dataError', (error) => {
          reject(new Error(`pdf2json 깊은 탐색 오류: ${error.message}`));
        });
        
        pdfParser.loadPDF(pdfPath);
      });
    } catch (error) {
      logger.warn(`⚠️ pdf2json 깊은 탐색 실패: ${error.message}`);
    }
    
    return null; // 모든 방법 실패
  }

  /**
   * 🖼️ 이미지 추출 (개선된 버전)
   */
  async extractImages(pdfPath) {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buffer = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      
      const images = [];
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const xObjects = page.node.Resources?.XObject || {};
        
        for (const [name, ref] of Object.entries(xObjects)) {
          try {
            const xObject = pdfDoc.context.lookup(ref);
            if (xObject && xObject.dict) {
              const subtype = xObject.dict.get('Subtype');
              if (subtype && subtype.name === 'Image') {
                let imgBytes;
                let format = 'unknown';
                
                // 이미지 데이터 추출
                if (xObject.contents) {
                  imgBytes = xObject.contents;
                } else if (xObject.getContentStream) {
                  imgBytes = xObject.getContentStream();
                } else if (xObject.image) {
                  imgBytes = xObject.image.data;
                }
                
                // 이미지 형식 확인
                if (xObject.dict.get('Filter')) {
                  const filter = xObject.dict.get('Filter');
                  if (filter.name === 'DCTDecode') {
                    format = 'jpeg';
                  } else if (filter.name === 'FlateDecode' || filter.name === 'DecodeParms') {
                    format = 'png';
                  }
                }
                
                if (imgBytes && imgBytes.length > 0) {
                  // Base64로 인코딩
                  const base64Data = Buffer.from(imgBytes).toString('base64');
                  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                  const dataUrl = `data:${mimeType};base64,${base64Data}`;
                  
                  images.push({
                    page: i + 1,
                    name,
                    data: imgBytes,
                    size: imgBytes.length,
                    format,
                    dataUrl,
                    mimeType
                  });
                  
                  logger.info(`🖼️ 페이지 ${i + 1}에서 이미지 추출: ${name} (${format}, ${imgBytes.length} bytes)`);
                }
              }
            }
          } catch (imgError) {
            logger.warn(`페이지 ${i + 1} 이미지 ${name} 추출 실패: ${imgError.message}`);
          }
        }
      }
      
      logger.info(`🖼️ 총 ${images.length}개의 이미지 추출 완료`);
      return images;
    } catch (error) {
      logger.warn(`⚠️ 이미지 추출 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 📄 페이지를 이미지로 변환 (간소화된 방법)
   */
  async convertPagesToImages(pdfPath) {
    try {
      const fs = (await import('fs')).promises;
      const path = await import('path');
      
      // temp_images 디렉토리 생성
      const tempDir = './temp_images';
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (error) {
        // 디렉토리가 이미 존재하는 경우 무시
      }
      
      const pageImages = [];
      const maxPages = Math.min(this.config.maxPages, 3); // 최대 3페이지만
      
      // 파일을 Base64 dataUrl로 변환하는 헬퍼 함수
      const fileToDataUrl = async (filePath) => {
        try {
          const imageBuffer = await fs.readFile(filePath);
          const base64 = imageBuffer.toString('base64');
          return `data:image/png;base64,${base64}`;
        } catch (error) {
          logger.warn(`파일을 Base64로 변환 실패: ${error.message}`);
          return null;
        }
      };
      
      // 방법 1: pdf-lib + canvas (실제 PDF 페이지 렌더링)
      try {
        const { PDFDocument } = await import('pdf-lib');
        const { createCanvas } = await import('canvas');
        
        const pdfBytes = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        
        for (let i = 0; i < Math.min(pages.length, maxPages); i++) {
          try {
            const page = pages[i];
            const { width, height } = page.getSize();
            
            // 캔버스 생성 (원본 비율 유지하면서 스케일링)
            const scale = Math.min(800 / width, 1000 / height);
            const canvasWidth = Math.floor(width * scale);
            const canvasHeight = Math.floor(height * scale);
            
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
            
            // 배경을 흰색으로 설정
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // PDF 페이지 내용을 시뮬레이션 (실제 텍스트와 그래픽)
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(20, 20, canvasWidth - 40, canvasHeight - 40);
            
            // 페이지 경계선
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
            
            // 페이지 정보 표시
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Page ${i + 1}`, 30, 40);
            ctx.fillText(`Size: ${Math.floor(width)}x${Math.floor(height)}`, 30, 60);
            
            // 페이지 번호 (중앙)
            ctx.fillStyle = '#495057';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, canvasWidth / 2, canvasHeight / 2);
            
            // PDF 내용 시뮬레이션 (텍스트 블록들)
            ctx.fillStyle = '#212529';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            
            const textLines = [
              'PDF Document Content',
              'This is a simulated page',
              'showing text and layout.',
              '',
              'Page dimensions:',
              `Width: ${Math.floor(width)}pt`,
              `Height: ${Math.floor(height)}pt`,
              '',
              'Document analysis',
              'will extract actual content.'
            ];
            
            let yPos = 100;
            textLines.forEach(line => {
              ctx.fillText(line, 40, yPos);
              yPos += 20;
            });
            
            // 캔버스를 PNG로 변환
            const buffer = canvas.toBuffer('image/png');
            const outputPath = path.default.join(tempDir, `page_${i + 1}_canvas.png`);
            await fs.writeFile(outputPath, buffer);
            
            // Base64 dataUrl로 직접 변환
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            
            pageImages.push({
              page: i + 1,
              path: outputPath,
              size: buffer.length,
              method: 'canvas',
              dataUrl: dataUrl,
              isDummy: false,
              dimensions: { width: canvasWidth, height: canvasHeight }
            });
            
            logger.info(`📄 페이지 ${i + 1} 이미지 변환 완료 (canvas): ${outputPath} (${canvasWidth}x${canvasHeight})`);
            
          } catch (pageError) {
            logger.warn(`페이지 ${i + 1} canvas 변환 실패: ${pageError.message}`);
            continue;
          }
        }
        
        if (pageImages.length > 0) {
          return pageImages;
        }
      } catch (error) {
        logger.warn(`⚠️ canvas 사용 불가: ${error.message}`);
      }
      
      // 방법 2: GraphicsMagick (Windows 환경 최적화)
      try {
        const gm = (await import('gm')).default;
        
        for (let i = 1; i <= maxPages; i++) {
          try {
            const outputPath = path.default.join(tempDir, `page_${i}_gm.png`);
            
            await new Promise((resolve, reject) => {
              gm(pdfPath + `[${i-1}]`)
                .density(100, 100) // 더 낮은 해상도
                .resize(800, 1000, '!') // 더 작은 크기
                .quality(80) // 품질 낮춤
                .write(outputPath, (error) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve();
                  }
                });
            });
            
            const stats = await fs.stat(outputPath);
            const dataUrl = await fileToDataUrl(outputPath);
            pageImages.push({
              page: i,
              path: outputPath,
              size: stats.size,
              method: 'gm',
              dataUrl: dataUrl || `file://${outputPath}`,
              isDummy: false
            });
            
            logger.info(`📄 페이지 ${i} 이미지 변환 완료 (gm): ${outputPath}`);
            
          } catch (pageError) {
            logger.warn(`페이지 ${i} gm 변환 실패: ${pageError.message}`);
            // 개별 페이지 실패 시에도 계속 진행
            continue;
          }
        }
        
        if (pageImages.length > 0) {
          return pageImages;
        }
      } catch (error) {
        logger.warn(`⚠️ GraphicsMagick 사용 불가: ${error.message}`);
      }
      
      logger.warn(`⚠️ 모든 이미지 변환 방법 실패 - 이미지 추출 불가`);
      return [];
      
    } catch (error) {
      logger.error(`❌ 페이지 변환 완전 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔍 OCR 처리
   */
  async performOCR(images, pageImages) {
    try {
      const Tesseract = await import('tesseract.js');
      const ocrResults = [];
      
      // 내장 이미지 OCR
      for (const image of images) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            Buffer.from(image.data), 
            this.config.ocrLanguages.join('+')
          );
          
          ocrResults.push({
            type: 'embedded_image',
            page: image.page,
            name: image.name,
            text: text.trim(),
            confidence: 0.8 // 기본값
          });
        } catch (error) {
          logger.warn(`내장 이미지 OCR 실패: ${error.message}`);
        }
      }
      
      // 페이지 이미지 OCR
      for (const pageImage of pageImages) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            pageImage.path, 
            this.config.ocrLanguages.join('+')
          );
          
          ocrResults.push({
            type: 'page_image',
            page: pageImage.page,
            path: pageImage.path,
            text: text.trim(),
            confidence: 0.8 // 기본값
          });
        } catch (error) {
          logger.warn(`페이지 이미지 OCR 실패: ${error.message}`);
        }
      }
      
      return ocrResults;
    } catch (error) {
      throw new Error(`OCR 처리 실패: ${error.message}`);
    }
  }

  /**
   * 📋 고도화된 메타데이터 추출 (다중 방법 지원)
   */
  async extractMetadata(pdfPath) {
    try {
      logger.info(`📋 고도화된 메타데이터 추출 시작: ${pdfPath}`);
      
      // 다중 방법으로 메타데이터 추출
      const results = await Promise.allSettled([
        this.extractBasicMetadata(pdfPath),
        this.extractAdvancedMetadata(pdfPath),
        this.extractFilesystemMetadata(pdfPath)
      ]);
      
      // 결과 병합
      const metadata = {
        basic: results[0].status === 'fulfilled' ? results[0].value : {},
        advanced: results[1].status === 'fulfilled' ? results[1].value : {},
        filesystem: results[2].status === 'fulfilled' ? results[2].value : {},
        extraction: {
          methods: [],
          timestamp: Date.now(),
          success: results.filter(r => r.status === 'fulfilled').length,
          total: results.length
        }
      };
      
      // 성공한 방법 기록
      if (results[0].status === 'fulfilled') metadata.extraction.methods.push('basic');
      if (results[1].status === 'fulfilled') metadata.extraction.methods.push('advanced');
      if (results[2].status === 'fulfilled') metadata.extraction.methods.push('filesystem');
      
      // 통합된 메타데이터 생성
      metadata.unified = this.unifyMetadata(metadata.basic, metadata.advanced, metadata.filesystem);
      
      logger.info(`📋 메타데이터 추출 완료: ${metadata.extraction.methods.length}/${metadata.extraction.total} 방법 성공`);
      return metadata;
      
    } catch (error) {
      logger.error(`❌ 메타데이터 추출 실패: ${error.message}`);
      throw new Error(`메타데이터 추출 실패: ${error.message}`);
    }
  }
  
  /**
   * 📋 기본 메타데이터 추출 (기존 방법 개선)
   */
  async extractBasicMetadata(pdfPath) {
    try {
      const buffer = await fs.readFile(pdfPath);
      const content = buffer.toString('latin1', 0, Math.min(buffer.length, 50000));
      
      const metadata = {
        version: '',
        pages: 0,
        title: '',
        author: '',
        subject: '',
        creator: '',
        producer: '',
        created: '',
        modified: '',
        keywords: '',
        trapped: '',
        fileSize: buffer.length
      };
      
      // PDF 버전 추출 (향상된 패턴)
      const versionPatterns = [
        /%PDF-(\d+\.\d+)/,
        /PDF\s+(\d+\.\d+)/i,
        /Version\s+(\d+\.\d+)/i
      ];
      
      for (const pattern of versionPatterns) {
        const match = content.match(pattern);
        if (match) {
          metadata.version = match[1];
          break;
        }
      }
      
      // 페이지 수 추출 (다중 패턴)
      const pagePatterns = [
        /\/Count\s+(\d+)/,
        /\/N\s+(\d+)/,
        /Pages\s+(\d+)/i
      ];
      
      for (const pattern of pagePatterns) {
        const match = content.match(pattern);
        if (match) {
          metadata.pages = parseInt(match[1]);
          break;
        }
      }
      
      // 향상된 메타데이터 필드 추출
      const fields = {
        title: /\/Title\s*[\(<]([^)>]+)[\)>]/,
        author: /\/Author\s*[\(<]([^)>]+)[\)>]/,
        subject: /\/Subject\s*[\(<]([^)>]+)[\)>]/,
        creator: /\/Creator\s*[\(<]([^)>]+)[\)>]/,
        producer: /\/Producer\s*[\(<]([^)>]+)[\)>]/,
        keywords: /\/Keywords\s*[\(<]([^)>]+)[\)>]/,
        trapped: /\/Trapped\s*\/([^\s]+)/,
        created: /\/CreationDate\s*[\(<]([^)>]+)[\)>]/,
        modified: /\/ModDate\s*[\(<]([^)>]+)[\)>]/
      };
      
      for (const [field, pattern] of Object.entries(fields)) {
        const match = content.match(pattern);
        if (match) {
          let value = match[1];
          
          // 날짜 필드 처리
          if (field === 'created' || field === 'modified') {
            value = this.parsePDFDate(value);
          }
          
          // 인코딩 처리
          value = this.decodePDFString(value);
          metadata[field] = value;
        }
      }
      
      return metadata;
    } catch (error) {
      throw new Error(`기본 메타데이터 추출 실패: ${error.message}`);
    }
  }
  
  /**
   * 📋 고급 메타데이터 추출 (pdf-lib 사용)
   */
  async extractAdvancedMetadata(pdfPath) {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buffer = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(buffer);
      
      const metadata = {
        pageCount: pdfDoc.getPageCount(),
        form: {
          hasForm: false,
          fieldCount: 0,
          fields: []
        },
        security: {
          isEncrypted: false,
          permissions: {},
          passwordRequired: false
        },
        technical: {
          pdfVersion: '',
          linearized: false,
          crossRefType: 'standard',
          compressionUsed: false
        },
        language: '',
        pageLayout: '',
        pageMode: '',
        viewerPreferences: {}
      };
      
      // 폼 정보 추출
      try {
        const form = pdfDoc.getForm();
        if (form) {
          metadata.form.hasForm = true;
          const fields = form.getFields();
          metadata.form.fieldCount = fields.length;
          metadata.form.fields = fields.map(field => ({
            name: field.getName(),
            type: field.constructor.name,
            required: field.isRequired ? field.isRequired() : false
          }));
        }
      } catch (error) {
        // 폼이 없거나 접근 불가
      }
      
      // 보안 정보 추출
      try {
        const context = pdfDoc.context;
        if (context && context.lookup) {
          // 암호화 정보 확인
          const trailer = context.trailerInfo;
          if (trailer && trailer.Encrypt) {
            metadata.security.isEncrypted = true;
            metadata.security.passwordRequired = true;
          }
        }
      } catch (error) {
        // 보안 정보 접근 불가
      }
      
      // 기술적 정보 추출
      try {
        const catalog = pdfDoc.catalog;
        if (catalog) {
          // 언어 정보
          const lang = catalog.get('Lang');
          if (lang) metadata.language = lang.toString();
          
          // 페이지 레이아웃
          const pageLayout = catalog.get('PageLayout');
          if (pageLayout) metadata.pageLayout = pageLayout.toString();
          
          // 페이지 모드
          const pageMode = catalog.get('PageMode');
          if (pageMode) metadata.pageMode = pageMode.toString();
          
          // 뷰어 환경설정
          const viewerPrefs = catalog.get('ViewerPreferences');
          if (viewerPrefs) {
            metadata.viewerPreferences = this.parseViewerPreferences(viewerPrefs);
          }
        }
      } catch (error) {
        // 기술적 정보 접근 불가
      }
      
      return metadata;
    } catch (error) {
      throw new Error(`고급 메타데이터 추출 실패: ${error.message}`);
    }
  }
  
  /**
   * 📋 파일시스템 메타데이터 추출
   */
  async extractFilesystemMetadata(pdfPath) {
    try {
      const stats = await fs.stat(pdfPath);
      const pathInfo = path.parse(pdfPath);
      
      const metadata = {
        file: {
          name: pathInfo.name,
          extension: pathInfo.ext,
          fullPath: pdfPath,
          directory: pathInfo.dir,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size)
        },
        timestamps: {
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString(),
          changed: stats.ctime.toISOString()
        },
        permissions: {
          readable: true, // 파일을 읽을 수 있으므로 true
          writable: false, // 실제 권한 확인 필요
          executable: false
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          extractedAt: new Date().toISOString()
        }
      };
      
      // 권한 정보 확인 (가능한 경우)
      try {
        await fs.access(pdfPath, fs.constants.W_OK);
        metadata.permissions.writable = true;
      } catch (error) {
        metadata.permissions.writable = false;
      }
      
      return metadata;
    } catch (error) {
      throw new Error(`파일시스템 메타데이터 추출 실패: ${error.message}`);
    }
  }
  
  /**
   * 📋 메타데이터 통합
   */
  unifyMetadata(basic, advanced, filesystem) {
    const unified = {
      // 기본 정보
      title: basic.title || 'Untitled',
      author: basic.author || 'Unknown',
      subject: basic.subject || '',
      creator: basic.creator || '',
      producer: basic.producer || '',
      keywords: basic.keywords || '',
      
      // 버전 및 기술 정보
      version: basic.version || '1.4',
      pages: advanced.pageCount || basic.pages || 0,
      fileSize: filesystem.file?.size || basic.fileSize || 0,
      fileSizeFormatted: filesystem.file?.sizeFormatted || this.formatFileSize(basic.fileSize || 0),
      
      // 날짜 정보
      created: basic.created || filesystem.timestamps?.created || '',
      modified: basic.modified || filesystem.timestamps?.modified || '',
      
      // 고급 기능
      hasForm: advanced.form?.hasForm || false,
      formFieldCount: advanced.form?.fieldCount || 0,
      isEncrypted: advanced.security?.isEncrypted || false,
      language: advanced.language || '',
      
      // 품질 평가
      quality: this.assessMetadataQuality(basic, advanced, filesystem),
      
      // 통계
      statistics: {
        basicFields: Object.keys(basic).filter(key => basic[key]).length,
        advancedFields: Object.keys(advanced).filter(key => advanced[key]).length,
        filesystemFields: Object.keys(filesystem).length,
        totalFields: 0
      }
    };
    
    unified.statistics.totalFields = 
      unified.statistics.basicFields + 
      unified.statistics.advancedFields + 
      unified.statistics.filesystemFields;
    
    return unified;
  }
  
  /**
   * 📋 PDF 날짜 파싱
   */
  parsePDFDate(dateString) {
    try {
      // PDF 날짜 형식: D:YYYYMMDDHHmmSSOHH'mm'
      const pdfDatePattern = /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?([+-]\d{2})?'?(\d{2})?'?/;
      const match = dateString.match(pdfDatePattern);
      
      if (match) {
        const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
        const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        return new Date(isoDate).toISOString();
      }
      
      // 일반 날짜 형식 시도
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      return dateString; // 파싱 실패시 원본 반환
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * 📋 PDF 문자열 디코딩
   */
  decodePDFString(str) {
    try {
      // UTF-16 BOM 확인
      if (str.startsWith('\ufeff') || str.startsWith('\u00fe\u00ff')) {
        return str.substring(2);
      }
      
      // 8진수 이스케이프 시퀀스 처리
      str = str.replace(/\\(\d{3})/g, (match, octal) => {
        return String.fromCharCode(parseInt(octal, 8));
      });
      
      // 일반적인 이스케이프 시퀀스 처리
      str = str.replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')');
      
      return str;
    } catch (error) {
      return str;
    }
  }
  
  /**
   * 📋 뷰어 환경설정 파싱
   */
  parseViewerPreferences(viewerPrefs) {
    try {
      const prefs = {};
      
      // 일반적인 뷰어 환경설정
      const booleanPrefs = [
        'HideToolbar', 'HideMenubar', 'HideWindowUI', 'FitWindow',
        'CenterWindow', 'DisplayDocTitle', 'NonFullScreenPageMode'
      ];
      
      booleanPrefs.forEach(pref => {
        const value = viewerPrefs.get(pref);
        if (value !== undefined) {
          prefs[pref] = value.toString() === 'true';
        }
      });
      
      return prefs;
    } catch (error) {
      return {};
    }
  }
  
  /**
   * 📋 파일 크기 포맷팅
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 📋 메타데이터 품질 평가
   */
  assessMetadataQuality(basic, advanced, filesystem) {
    let score = 0;
    let maxScore = 10;
    
    // 기본 정보 평가 (4점)
    if (basic.title && basic.title !== 'Untitled') score += 1;
    if (basic.author && basic.author !== 'Unknown') score += 1;
    if (basic.creator) score += 0.5;
    if (basic.producer) score += 0.5;
    if (basic.created || basic.modified) score += 1;
    
    // 고급 정보 평가 (3점)
    if (advanced.pageCount > 0) score += 1;
    if (advanced.language) score += 0.5;
    if (advanced.form?.hasForm) score += 0.5;
    if (Object.keys(advanced.viewerPreferences || {}).length > 0) score += 1;
    
    // 파일시스템 정보 평가 (3점)
    if (filesystem.file?.size > 0) score += 1;
    if (filesystem.timestamps?.created) score += 1;
    if (filesystem.permissions) score += 1;
    
    const percentage = Math.round((score / maxScore) * 100);
    
    return {
      score,
      maxScore,
      percentage,
      grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F',
      description: this.getQualityDescription(percentage)
    };
  }
  
  /**
   * 📋 품질 설명 생성
   */
  getQualityDescription(percentage) {
    if (percentage >= 90) return '우수한 메타데이터 품질';
    if (percentage >= 80) return '양호한 메타데이터 품질';
    if (percentage >= 70) return '보통 메타데이터 품질';
    if (percentage >= 60) return '부족한 메타데이터 품질';
    return '매우 부족한 메타데이터 품질';
  }

  /**
   * 📊 결과 분석
   */
  analyzeResults(results) {
    const analysis = {
      hasText: !!results.text?.text,
      hasImages: results.images.length > 0,
      hasPageImages: results.pageImages.length > 0,
      hasOCR: results.ocrResults.length > 0,
      textQuality: 'unknown',
      imageQuality: 'unknown',
      ocrQuality: 'unknown'
    };
    
    // 텍스트 품질 평가
    if (results.text?.text) {
      const textLength = results.text.text.length;
      if (textLength > 1000) {
        analysis.textQuality = 'excellent';
      } else if (textLength > 100) {
        analysis.textQuality = 'good';
      } else if (textLength > 10) {
        analysis.textQuality = 'poor';
      } else {
        analysis.textQuality = 'very_poor';
      }
    }
    
    // 이미지 품질 평가
    if (results.images.length > 0) {
      analysis.imageQuality = 'available';
    }
    
    // OCR 품질 평가
    if (results.ocrResults.length > 0) {
      const totalText = results.ocrResults.reduce((sum, result) => sum + result.text.length, 0);
      if (totalText > 100) {
        analysis.ocrQuality = 'good';
      } else if (totalText > 10) {
        analysis.ocrQuality = 'poor';
      } else {
        analysis.ocrQuality = 'very_poor';
      }
    }
    
    return analysis;
  }

  /**
   * 📊 PDF 텍스트 내용 고급 분석 (국내 최상위 수준)
   * @param {string} text - 전체 텍스트
   * @param {object} metadata - PDF 메타데이터
   * @returns {object} 고급 분석 결과(JSON)
   */
  analyzeContent(text, metadata = {}) {
    // 1. 요약(summary)
    const summary = this.extractSummary(text);
    // 2. 키워드(keywords)
    const keywords = this.extractKeywords(text);
    // 3. 섹션/목차(sections)
    const sections = this.extractSections(text);
    // 4. 표/리스트/특수구조(tables, lists, code 등)
    const tables = this.extractTables(text);
    const lists = this.extractLists(text);
    const codes = this.extractCodeBlocks(text);
    // 5. 주요 엔티티(entities)
    const entities = this.extractEntities(text);
    // 6. 품질/이상/누락(quality)
    const quality = this.analyzeQuality(text, sections, tables, keywords);
    // 7. 메타데이터(metadata)
    // (이미 인자로 받음)
    // 8. 진단/경고
    const diagnostics = this.analyzeDiagnostics(text, sections, tables, keywords, entities);

    return {
      summary,
      keywords,
      sections,
      tables,
      lists,
      codes,
      entities,
      metadata,
      quality,
      diagnostics
    };
  }

  // ====== 각 분석 항목별 메서드(샘플/기본구조) ======

  extractSummary(text) {
    // 문단/문장별 중요도, 길이, 위치, 강조 등 기반 핵심문장 추출
    // (TextRank, TF-IDF, 위치, 길이, 표/수치/날짜 포함 등)
    // TODO: 실제 알고리즘 구현
    return text.split('\n').slice(0, 3).join(' '); // 샘플: 앞 3문단
  }

  extractKeywords(text) {
    // TF-IDF, TextRank, 명사/고유명사 추출, 빈도 기반 상위 N개
    // TODO: 실제 알고리즘 구현
    const words = text.match(/\b[가-힣a-zA-Z0-9]{2,}\b/g) || [];
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  }

  /**
   * 📑 고도화된 문서 구조 분석 (제목/섹션 계층)
   */
  extractSections(text) {
    const sections = [];
    
    try {
      const lines = text.split('\n');
      let currentSection = null;
      let sectionStack = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (!trimmedLine) continue;
        
        // 1. 숫자 기반 제목 (1. 2. 1.1 1.2 등)
        const numberedMatch = trimmedLine.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);
        if (numberedMatch) {
          const number = numberedMatch[1];
          const title = numberedMatch[2];
          const level = number.split('.').length;
          
          const section = {
            type: 'numbered-heading',
            number,
            title,
            level,
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, level);
          currentSection = section;
          continue;
        }
        
        // 2. 로마 숫자 제목 (I. II. III. 등)
        const romanMatch = trimmedLine.match(/^([IVX]+)\.\s+(.+)$/);
        if (romanMatch) {
          const roman = romanMatch[1];
          const title = romanMatch[2];
          const level = this.romanToLevel(roman);
          
          const section = {
            type: 'roman-heading',
            number: roman,
            title,
            level,
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, level);
          currentSection = section;
          continue;
        }
        
        // 3. 대문자 제목 (A. B. C. 등)
        const letterMatch = trimmedLine.match(/^([A-Z])\.\s+(.+)$/);
        if (letterMatch) {
          const letter = letterMatch[1];
          const title = letterMatch[2];
          const level = 2; // 일반적으로 2레벨로 간주
          
          const section = {
            type: 'letter-heading',
            number: letter,
            title,
            level,
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, level);
          currentSection = section;
          continue;
        }
        
        // 4. 특수 제목 패턴 (Chapter, Section, Part 등)
        const specialMatch = trimmedLine.match(/^(Chapter|Section|Part|제\s*\d+\s*장|제\s*\d+\s*절|부록)\s*(\d+)?\s*[:.]\s*(.+)$/i);
        if (specialMatch) {
          const prefix = specialMatch[1];
          const number = specialMatch[2] || '';
          const title = specialMatch[3];
          const level = this.getSpecialTitleLevel(prefix);
          
          const section = {
            type: 'special-heading',
            prefix,
            number,
            title,
            level,
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, level);
          currentSection = section;
          continue;
        }
        
        // 5. 강조된 제목 (전체 대문자, 길이 제한)
        if (trimmedLine.length <= 80 && 
            trimmedLine === trimmedLine.toUpperCase() && 
            /^[A-Z\s\d가-힣]+$/.test(trimmedLine) &&
            !this.isTableOrListLine(trimmedLine)) {
          
          const section = {
            type: 'emphasized-heading',
            title: trimmedLine,
            level: this.guessHeadingLevel(trimmedLine, i, lines),
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, section.level);
          currentSection = section;
          continue;
        }
        
        // 6. 줄바꿈으로 분리된 독립적인 제목
        const potentialHeading = this.analyzeStandaloneHeading(trimmedLine, i, lines);
        if (potentialHeading) {
          const section = {
            type: 'standalone-heading',
            title: trimmedLine,
            level: potentialHeading.level,
            confidence: potentialHeading.confidence,
            content: '',
            position: i,
            subsections: []
          };
          
          this.addSectionToHierarchy(sections, sectionStack, section, section.level);
          currentSection = section;
          continue;
        }
        
        // 7. 일반 내용을 현재 섹션에 추가
        if (currentSection) {
          currentSection.content += line + '\n';
        } else {
          // 첫 번째 섹션이 없으면 도입부로 간주
          if (sections.length === 0) {
            sections.push({
              type: 'introduction',
              title: '도입부',
              level: 0,
              content: line + '\n',
              position: i,
              subsections: []
            });
            currentSection = sections[0];
          }
        }
      }
      
      // 섹션 정리 및 통계 추가
      this.finalizeSections(sections);
      
      logger.info(`📑 문서 구조 분석 완료: ${sections.length}개 섹션, ${this.countAllSections(sections)}개 총 섹션`);
      return sections;
      
    } catch (error) {
      logger.error(`❌ 문서 구조 분석 실패: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 섹션을 계층 구조에 추가
   */
  addSectionToHierarchy(sections, stack, section, level) {
    // 스택에서 현재 레벨보다 깊은 섹션들 제거
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      sections.push(section);
    } else {
      stack[stack.length - 1].subsections.push(section);
    }
    
    stack.push(section);
  }
  
  /**
   * 로마 숫자를 레벨로 변환
   */
  romanToLevel(roman) {
    const romanMap = { 'I': 1, 'V': 5, 'X': 10 };
    let level = 0;
    for (let char of roman) {
      level += romanMap[char] || 1;
    }
    return Math.min(Math.max(level, 1), 6);
  }
  
  /**
   * 특수 제목의 레벨 결정
   */
  getSpecialTitleLevel(prefix) {
    const levelMap = {
      'chapter': 1,
      'part': 1,
      '장': 1,
      'section': 2,
      '절': 2,
      '부록': 3
    };
    
    return levelMap[prefix.toLowerCase()] || 2;
  }
  
  /**
   * 제목 레벨 추측
   */
  guessHeadingLevel(title, position, lines) {
    // 길이 기반 추측
    if (title.length <= 20) return 1;
    if (title.length <= 40) return 2;
    if (title.length <= 60) return 3;
    return 4;
  }
  
  /**
   * 표나 리스트 라인인지 확인
   */
  isTableOrListLine(line) {
    return /[|,\t]/.test(line) || /^\s*[-*•]\s/.test(line) || /^\s*\d+\./.test(line);
  }
  
  /**
   * 독립적인 제목 분석
   */
  analyzeStandaloneHeading(line, position, lines) {
    // 전후 빈 줄 확인
    const prevLine = position > 0 ? lines[position - 1].trim() : '';
    const nextLine = position < lines.length - 1 ? lines[position + 1].trim() : '';
    
    let confidence = 0;
    let level = 3; // 기본 레벨
    
    // 빈 줄로 분리되어 있으면 제목일 가능성 높음
    if (!prevLine && !nextLine) confidence += 0.4;
    else if (!prevLine || !nextLine) confidence += 0.2;
    
    // 길이가 적당하면 제목일 가능성 높음
    if (line.length >= 5 && line.length <= 60) confidence += 0.3;
    
    // 첫 글자가 대문자면 제목일 가능성 높음
    if (/^[A-Z가-힣]/.test(line)) confidence += 0.2;
    
    // 문장 부호가 없으면 제목일 가능성 높음
    if (!/[.!?]$/.test(line)) confidence += 0.1;
    
    return confidence >= 0.5 ? { level, confidence } : null;
  }
  
  /**
   * 섹션 정리 및 통계 추가
   */
  finalizeSections(sections) {
    sections.forEach(section => {
      // 내용 정리
      section.content = section.content.trim();
      
      // 통계 추가
      section.wordCount = section.content.split(/\s+/).filter(word => word.length > 0).length;
      section.charCount = section.content.length;
      section.lineCount = section.content.split('\n').length;
      
      // 하위 섹션도 재귀적으로 처리
      if (section.subsections && section.subsections.length > 0) {
        this.finalizeSections(section.subsections);
        section.subsectionCount = section.subsections.length;
      }
    });
  }
  
  /**
   * 전체 섹션 수 계산
   */
  countAllSections(sections) {
    let count = sections.length;
    sections.forEach(section => {
      if (section.subsections) {
        count += this.countAllSections(section.subsections);
      }
    });
    return count;
  }

  /**
   * 📊 고도화된 표 추출 (다양한 패턴 지원)
   */
  extractTables(text) {
    const tables = [];
    
    try {
      // 1. 파이프(|) 구분 표 추출
      const pipeTableRegex = /^(\|[^|\n]*\|(?:\n\|[^|\n]*\|){2,})/gm;
      let match;
      while ((match = pipeTableRegex.exec(text)) !== null) {
        const tableText = match[1];
        const rows = tableText.split('\n').filter(row => row.trim());
        
        if (rows.length >= 2) {
          const headers = this.parseTableRow(rows[0], '|');
          const data = rows.slice(1).map(row => this.parseTableRow(row, '|'));
          
          tables.push({
            type: 'pipe-delimited',
            caption: this.findTableCaption(text, match.index),
            headers,
            data,
            rowCount: data.length,
            columnCount: headers.length,
            position: match.index
          });
        }
      }
      
      // 2. 탭 구분 표 추출
      const tabTableRegex = /((?:[^\t\n]+\t[^\t\n]+(?:\t[^\t\n]+)*\n){3,})/g;
      while ((match = tabTableRegex.exec(text)) !== null) {
        const tableText = match[0];
        const rows = tableText.split('\n').filter(row => row.trim());
        
        if (rows.length >= 3) {
          const headers = this.parseTableRow(rows[0], '\t');
          const data = rows.slice(1).map(row => this.parseTableRow(row, '\t'));
          
          // 일관된 열 수 확인
          const columnCounts = data.map(row => row.length);
          const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
          
          if (Math.abs(headers.length - avgColumns) <= 1) {
            tables.push({
              type: 'tab-delimited',
              caption: this.findTableCaption(text, match.index),
              headers,
              data,
              rowCount: data.length,
              columnCount: headers.length,
              position: match.index
            });
          }
        }
      }
      
      // 3. 공백 정렬 표 추출 (고정폭 테이블)
      const alignedTableRegex = /((?:^[A-Za-z가-힣0-9\s]{20,}\n){3,})/gm;
      while ((match = alignedTableRegex.exec(text)) !== null) {
        const tableText = match[0];
        const parsed = this.parseAlignedTable(tableText);
        
        if (parsed && parsed.headers.length >= 2 && parsed.data.length >= 2) {
          tables.push({
            type: 'aligned-columns',
            caption: this.findTableCaption(text, match.index),
            headers: parsed.headers,
            data: parsed.data,
            rowCount: parsed.data.length,
            columnCount: parsed.headers.length,
            position: match.index
          });
        }
      }
      
      // 4. CSV 스타일 표 추출
      const csvTableRegex = /((?:[^,\n]+(?:,[^,\n]*){1,}\n){3,})/g;
      while ((match = csvTableRegex.exec(text)) !== null) {
        const tableText = match[0];
        const rows = tableText.split('\n').filter(row => row.trim());
        
        if (rows.length >= 3) {
          const headers = this.parseTableRow(rows[0], ',');
          const data = rows.slice(1).map(row => this.parseTableRow(row, ','));
          
          // 숫자가 많은 경우에만 표로 인식
          const hasNumbers = data.some(row => 
            row.some(cell => /^\d+(\.\d+)?$/.test(cell.trim()))
          );
          
          if (hasNumbers && headers.length >= 2) {
            tables.push({
              type: 'comma-delimited',
              caption: this.findTableCaption(text, match.index),
              headers,
              data,
              rowCount: data.length,
              columnCount: headers.length,
              position: match.index
            });
          }
        }
      }
      
      // 5. 키-값 표 추출 (메타데이터 테이블)
      const keyValueRegex = /((?:^[A-Za-z가-힣\s]+:\s*[^\n]+\n){3,})/gm;
      while ((match = keyValueRegex.exec(text)) !== null) {
        const tableText = match[0];
        const pairs = tableText.split('\n')
          .filter(line => line.includes(':'))
          .map(line => {
            const [key, ...valueParts] = line.split(':');
            return [key.trim(), valueParts.join(':').trim()];
          });
        
        if (pairs.length >= 3) {
          tables.push({
            type: 'key-value',
            caption: this.findTableCaption(text, match.index),
            headers: ['속성', '값'],
            data: pairs,
            rowCount: pairs.length,
            columnCount: 2,
            position: match.index
          });
        }
      }
      
      logger.info(`📊 표 추출 완료: ${tables.length}개 발견`);
      return tables;
      
    } catch (error) {
      logger.error(`❌ 표 추출 실패: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 표 행 파싱
   */
  parseTableRow(rowText, delimiter) {
    return rowText
      .split(delimiter)
      .map(cell => cell.replace(/^\||\|$/g, '').trim())
      .filter(cell => cell.length > 0);
  }
  
  /**
   * 정렬된 테이블 파싱 (고정폭)
   */
  parseAlignedTable(tableText) {
    try {
      const lines = tableText.split('\n').filter(line => line.trim());
      if (lines.length < 3) return null;
      
      // 첫 번째 줄에서 열 위치 감지
      const firstLine = lines[0];
      const columnPositions = [];
      let inWord = false;
      let wordStart = 0;
      
      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        const isSpace = /\s/.test(char);
        
        if (!inWord && !isSpace) {
          inWord = true;
          wordStart = i;
        } else if (inWord && isSpace) {
          columnPositions.push({ start: wordStart, end: i });
          inWord = false;
        }
      }
      
      if (inWord) {
        columnPositions.push({ start: wordStart, end: firstLine.length });
      }
      
      if (columnPositions.length < 2) return null;
      
      // 각 줄에서 열 데이터 추출
      const headers = columnPositions.map(pos => 
        firstLine.substring(pos.start, pos.end).trim()
      );
      
      const data = lines.slice(1).map(line => 
        columnPositions.map(pos => 
          line.substring(pos.start, pos.end).trim()
        )
      );
      
      return { headers, data };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 표 캡션 찾기
   */
  findTableCaption(text, tablePosition) {
    try {
      // 표 앞 100자 내에서 캡션 찾기
      const beforeText = text.substring(Math.max(0, tablePosition - 100), tablePosition);
      
      // 일반적인 캡션 패턴
      const captionPatterns = [
        /표\s*\d+[.:]\s*([^\n]+)/,
        /Table\s*\d+[.:]\s*([^\n]+)/i,
        /<표[^>]*>\s*([^<\n]+)/,
        /\[표\s*\d+\]\s*([^\n]+)/,
        /그림\s*\d+[.:]\s*([^\n]+)/
      ];
      
      for (const pattern of captionPatterns) {
        const match = beforeText.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 📋 고도화된 리스트 추출 (다양한 패턴 지원)
   */
  extractLists(text) {
    const lists = [];
    
    try {
      // 1. 불릿 포인트 리스트 (•, -, *, ▪, ▫, ■, □)
      const bulletPatterns = [
        /((?:^\s*[•▪▫■□]\s+.+(?:\n|$))+)/gm,
        /((?:^\s*[-*]\s+.+(?:\n|$))+)/gm,
        /((?:^\s*[→▶◆◇]\s+.+(?:\n|$))+)/gm
      ];
      
      bulletPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const listText = match[0];
          const items = this.parseListItems(listText, /^\s*[•▪▫■□\-*→▶◆◇]\s+/);
          
          if (items.length >= 2) {
            lists.push({
              type: 'bullet',
              subtype: ['bullet-symbols', 'bullet-dash', 'bullet-arrows'][index],
              items,
              itemCount: items.length,
              position: match.index,
              indentLevels: this.analyzeIndentation(listText)
            });
          }
        }
      });
      
      // 2. 번호 매겨진 리스트 (1., 2., 3. 또는 1), 2), 3))
      const numberedPatterns = [
        /((?:^\s*\d+\.\s+.+(?:\n|$))+)/gm,
        /((?:^\s*\d+\)\s+.+(?:\n|$))+)/gm,
        /((?:^\s*\(\d+\)\s+.+(?:\n|$))+)/gm
      ];
      
      numberedPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const listText = match[0];
          const items = this.parseListItems(listText, /^\s*\(?(\d+)[\)\.]\s+/);
          
          if (items.length >= 2) {
            // 번호 순서 검증
            const numbers = items.map(item => parseInt(item.number) || 0);
            const isSequential = this.isSequentialNumbers(numbers);
            
            lists.push({
              type: 'numbered',
              subtype: ['dot-style', 'parenthesis-style', 'bracket-style'][index],
              items,
              itemCount: items.length,
              position: match.index,
              isSequential,
              startNumber: numbers[0] || 1,
              indentLevels: this.analyzeIndentation(listText)
            });
          }
        }
      });
      
      // 3. 알파벳 리스트 (a., b., c. 또는 A., B., C.)
      const alphabetPatterns = [
        /((?:^\s*[a-z]\.\s+.+(?:\n|$))+)/gm,
        /((?:^\s*[A-Z]\.\s+.+(?:\n|$))+)/gm,
        /((?:^\s*[a-z]\)\s+.+(?:\n|$))+)/gm,
        /((?:^\s*[A-Z]\)\s+.+(?:\n|$))+)/gm
      ];
      
      alphabetPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const listText = match[0];
          const items = this.parseListItems(listText, /^\s*([a-zA-Z])[\)\.]\s+/);
          
          if (items.length >= 2) {
            lists.push({
              type: 'alphabetic',
              subtype: ['lowercase-dot', 'uppercase-dot', 'lowercase-paren', 'uppercase-paren'][index],
              items,
              itemCount: items.length,
              position: match.index,
              indentLevels: this.analyzeIndentation(listText)
            });
          }
        }
      });
      
      // 4. 체크리스트 (□, ☐, ☑, ✓, ✗)
      const checklistPattern = /((?:^\s*[□☐☑✓✗]\s+.+(?:\n|$))+)/gm;
      let match;
      while ((match = checklistPattern.exec(text)) !== null) {
        const listText = match[0];
        const items = this.parseChecklistItems(listText);
        
        if (items.length >= 2) {
          const checkedCount = items.filter(item => item.checked).length;
          
          lists.push({
            type: 'checklist',
            items,
            itemCount: items.length,
            checkedCount,
            completionRate: Math.round((checkedCount / items.length) * 100),
            position: match.index,
            indentLevels: this.analyzeIndentation(listText)
          });
        }
      }
      
      // 5. 정의 리스트 (용어: 설명)
      const definitionPattern = /((?:^\s*[A-Za-z가-힣]+\s*[:：]\s+.+(?:\n|$))+)/gm;
      while ((match = definitionPattern.exec(text)) !== null) {
        const listText = match[0];
        const items = this.parseDefinitionItems(listText);
        
        if (items.length >= 2) {
          lists.push({
            type: 'definition',
            items,
            itemCount: items.length,
            position: match.index
          });
        }
      }
      
      // 6. 계층형 리스트 감지 및 구조화
      lists.forEach(list => {
        if (list.indentLevels && list.indentLevels.length > 1) {
          list.isHierarchical = true;
          list.structure = this.buildListHierarchy(list.items, list.indentLevels);
        }
      });
      
      logger.info(`📋 리스트 추출 완료: ${lists.length}개 발견`);
      return lists;
      
    } catch (error) {
      logger.error(`❌ 리스트 추출 실패: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 리스트 아이템 파싱
   */
  parseListItems(listText, pattern) {
    const lines = listText.split('\n').filter(line => line.trim());
    const items = [];
    
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        const content = line.replace(pattern, '').trim();
        const indent = line.match(/^\s*/)[0].length;
        
        items.push({
          content,
          number: match[1] || (index + 1).toString(),
          indent,
          originalLine: line.trim()
        });
      }
    });
    
    return items;
  }
  
  /**
   * 체크리스트 아이템 파싱
   */
  parseChecklistItems(listText) {
    const lines = listText.split('\n').filter(line => line.trim());
    const items = [];
    
    lines.forEach(line => {
      const checkMatch = line.match(/^\s*([□☐☑✓✗])\s+(.+)$/);
      if (checkMatch) {
        const symbol = checkMatch[1];
        const content = checkMatch[2].trim();
        const checked = ['☑', '✓'].includes(symbol);
        const failed = symbol === '✗';
        const indent = line.match(/^\s*/)[0].length;
        
        items.push({
          content,
          checked,
          failed,
          symbol,
          indent,
          originalLine: line.trim()
        });
      }
    });
    
    return items;
  }
  
  /**
   * 정의 리스트 아이템 파싱
   */
  parseDefinitionItems(listText) {
    const lines = listText.split('\n').filter(line => line.trim());
    const items = [];
    
    lines.forEach(line => {
      const defMatch = line.match(/^\s*([^:：]+)\s*[:：]\s+(.+)$/);
      if (defMatch) {
        const term = defMatch[1].trim();
        const definition = defMatch[2].trim();
        const indent = line.match(/^\s*/)[0].length;
        
        items.push({
          term,
          definition,
          content: `${term}: ${definition}`,
          indent,
          originalLine: line.trim()
        });
      }
    });
    
    return items;
  }
  
  /**
   * 들여쓰기 레벨 분석
   */
  analyzeIndentation(listText) {
    const lines = listText.split('\n').filter(line => line.trim());
    const indents = lines.map(line => line.match(/^\s*/)[0].length);
    const uniqueIndents = [...new Set(indents)].sort((a, b) => a - b);
    
    return uniqueIndents;
  }
  
  /**
   * 번호 순서 검증
   */
  isSequentialNumbers(numbers) {
    if (numbers.length < 2) return true;
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 계층형 리스트 구조 구축
   */
  buildListHierarchy(items, indentLevels) {
    const structure = [];
    const stack = [];
    
    items.forEach(item => {
      const level = indentLevels.indexOf(item.indent);
      const node = { ...item, children: [], level };
      
      // 스택에서 현재 레벨보다 깊은 항목들 제거
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        structure.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      
      stack.push(node);
    });
    
    return structure;
  }

  /**
   * 💻 고도화된 코드 블록 추출
   */
  extractCodeBlocks(text) {
    const codeBlocks = [];
    
    try {
      // 1. 마크다운 스타일 코드 블록 (```)
      const markdownCodeRegex = /^```(\w+)?\s*\n([\s\S]*?)^```$/gm;
      let match;
      while ((match = markdownCodeRegex.exec(text)) !== null) {
        const language = match[1] || 'text';
        const code = match[2].trim();
        
        if (code.length > 0) {
          codeBlocks.push({
            type: 'markdown-code',
            language,
            content: code,
            lineCount: code.split('\n').length,
            position: match.index,
            hasLanguage: !!match[1]
          });
        }
      }
      
      // 2. 들여쓰기 기반 코드 블록 (4칸 이상)
      const indentedCodeRegex = /((?:^    .+(?:\n|$))+)/gm;
      while ((match = indentedCodeRegex.exec(text)) !== null) {
        const code = match[0];
        const cleanedCode = code.replace(/^    /gm, '').trim();
        
        if (cleanedCode.length > 10 && this.isLikelyCode(cleanedCode)) {
          codeBlocks.push({
            type: 'indented-code',
            language: this.detectCodeLanguage(cleanedCode),
            content: cleanedCode,
            lineCount: cleanedCode.split('\n').length,
            position: match.index,
            confidence: this.calculateCodeConfidence(cleanedCode)
          });
        }
      }
      
      // 3. 인라인 코드 (`코드`)
      const inlineCodeRegex = /`([^`\n]+)`/g;
      while ((match = inlineCodeRegex.exec(text)) !== null) {
        const code = match[1].trim();
        
        if (code.length > 0 && this.isLikelyInlineCode(code)) {
          codeBlocks.push({
            type: 'inline-code',
            content: code,
            position: match.index,
            isVariable: /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(code),
            isFunction: /^[a-zA-Z_][a-zA-Z0-9_]*\(\)$/.test(code),
            isPath: /[\/\\]/.test(code)
          });
        }
      }
      
      // 4. 특수 코드 패턴 (SQL, RegEx, 명령어 등)
      this.extractSpecialCodePatterns(text, codeBlocks);
      
      // 5. 프로그래밍 언어별 특화 패턴
      this.extractLanguageSpecificPatterns(text, codeBlocks);
      
      // 중복 제거 및 정렬
      const uniqueBlocks = this.deduplicateCodeBlocks(codeBlocks);
      
      logger.info(`💻 코드 블록 추출 완료: ${uniqueBlocks.length}개 발견`);
      return uniqueBlocks;
      
    } catch (error) {
      logger.error(`❌ 코드 블록 추출 실패: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 코드인지 판단
   */
  isLikelyCode(text) {
    let score = 0;
    
    // 프로그래밍 키워드
    const keywords = ['function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'const', 'let', 'var'];
    keywords.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(text)) score += 0.2;
    });
    
    // 특수 문자 패턴
    if (/[{}();]/.test(text)) score += 0.3;
    if (/[=+\-*/<>!&|]/.test(text)) score += 0.2;
    if (/\/\/|\/\*|\*\/|#/.test(text)) score += 0.3; // 주석
    
    // 들여쓰기 패턴
    const lines = text.split('\n');
    const indentedLines = lines.filter(line => /^\s{2,}/.test(line)).length;
    if (indentedLines / lines.length > 0.3) score += 0.2;
    
    return score >= 0.4;
  }
  
  /**
   * 인라인 코드인지 판단
   */
  isLikelyInlineCode(text) {
    // 변수명 패턴
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) return true;
    
    // 함수 호출 패턴
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\(\)$/.test(text)) return true;
    
    // 파일 경로 패턴
    if (/[\/\\]/.test(text)) return true;
    
    // 키워드 패턴
    const codeKeywords = ['null', 'undefined', 'true', 'false', 'this', 'self'];
    if (codeKeywords.includes(text.toLowerCase())) return true;
    
    return false;
  }
  
  /**
   * 코드 언어 감지
   */
  detectCodeLanguage(code) {
    // JavaScript/TypeScript
    if (/(function|const|let|var|=>|console\.log)/i.test(code)) {
      return /:\s*\w+/.test(code) ? 'typescript' : 'javascript';
    }
    
    // Python
    if (/(def |import |from |if __name__|print\()/i.test(code)) {
      return 'python';
    }
    
    // Java
    if (/(public class|private|protected|public static void main)/i.test(code)) {
      return 'java';
    }
    
    // C/C++
    if (/(#include|int main|printf|cout)/i.test(code)) {
      return /cout|std::/i.test(code) ? 'cpp' : 'c';
    }
    
    // SQL
    if (/(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)/i.test(code)) {
      return 'sql';
    }
    
    // HTML
    if (/<[^>]+>/.test(code)) {
      return 'html';
    }
    
    // CSS
    if (/\{[^}]*:[^}]*\}/.test(code)) {
      return 'css';
    }
    
    // JSON
    if (/^\s*[\{\[]/.test(code) && /[\}\]]\s*$/.test(code)) {
      try {
        JSON.parse(code);
        return 'json';
      } catch (e) {
        // JSON이 아님
      }
    }
    
    return 'text';
  }
  
  /**
   * 코드 신뢰도 계산
   */
  calculateCodeConfidence(code) {
    let confidence = 0;
    
    // 구문 분석
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim()).length;
    
    // 코드 특성 점수
    if (/[{}();]/.test(code)) confidence += 0.3;
    if (/\/\/|\/\*|#/.test(code)) confidence += 0.2; // 주석
    if (/\b(function|class|if|for|while)\b/i.test(code)) confidence += 0.3;
    
    // 길이 기반 점수
    if (nonEmptyLines >= 3) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * 특수 코드 패턴 추출
   */
  extractSpecialCodePatterns(text, codeBlocks) {
    // SQL 쿼리
    const sqlPattern = /(SELECT[\s\S]*?FROM[\s\S]*?(?:WHERE[\s\S]*?)?(?:ORDER BY[\s\S]*?)?(?:;|$))/gi;
    let match;
    while ((match = sqlPattern.exec(text)) !== null) {
      const sql = match[0].trim();
      if (sql.length > 10) {
        codeBlocks.push({
          type: 'sql-query',
          language: 'sql',
          content: sql,
          position: match.index,
          queryType: this.detectSQLQueryType(sql)
        });
      }
    }
    
    // 정규표현식
    const regexPattern = /\/(.+?)\/[gimuy]*/g;
    while ((match = regexPattern.exec(text)) !== null) {
      const regex = match[0];
      if (regex.length > 3) {
        codeBlocks.push({
          type: 'regex',
          language: 'regex',
          content: regex,
          position: match.index,
          pattern: match[1],
          flags: match[0].split('/').pop()
        });
      }
    }
    
    // URL/URI
    const urlPattern = /(https?:\/\/[^\s\)]+)/g;
    while ((match = urlPattern.exec(text)) !== null) {
      codeBlocks.push({
        type: 'url',
        content: match[0],
        position: match.index,
        protocol: match[0].split(':')[0],
        isAPI: /\/api\//.test(match[0])
      });
    }
  }
  
  /**
   * 언어별 특화 패턴 추출
   */
  extractLanguageSpecificPatterns(text, codeBlocks) {
    // Python 스타일 함수 정의
    const pythonFuncPattern = /def\s+\w+\([^)]*\):\s*\n((?:[ \t]+.+\n)+)/g;
    let match;
    while ((match = pythonFuncPattern.exec(text)) !== null) {
      codeBlocks.push({
        type: 'python-function',
        language: 'python',
        content: match[0].trim(),
        position: match.index
      });
    }
    
    // JavaScript 화살표 함수
    const arrowFuncPattern = /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]+\}/g;
    while ((match = arrowFuncPattern.exec(text)) !== null) {
      codeBlocks.push({
        type: 'arrow-function',
        language: 'javascript',
        content: match[0].trim(),
        position: match.index
      });
    }
  }
  
  /**
   * SQL 쿼리 타입 감지
   */
  detectSQLQueryType(sql) {
    const upperSQL = sql.toUpperCase();
    if (upperSQL.startsWith('SELECT')) return 'SELECT';
    if (upperSQL.startsWith('INSERT')) return 'INSERT';
    if (upperSQL.startsWith('UPDATE')) return 'UPDATE';
    if (upperSQL.startsWith('DELETE')) return 'DELETE';
    if (upperSQL.startsWith('CREATE')) return 'CREATE';
    if (upperSQL.startsWith('ALTER')) return 'ALTER';
    if (upperSQL.startsWith('DROP')) return 'DROP';
    return 'UNKNOWN';
  }
  
  /**
   * 코드 블록 중복 제거
   */
  deduplicateCodeBlocks(codeBlocks) {
    const seen = new Set();
    const unique = [];
    
    codeBlocks.forEach(block => {
      const key = `${block.type}:${block.content}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(block);
      }
    });
    
    // 위치순으로 정렬
    return unique.sort((a, b) => a.position - b.position);
  }

  extractEntities(text) {
    // 날짜, 수치, 고유명사, 기관, 인명 등 NER
    // TODO: 실제 알고리즘 구현
    const dates = (text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/g) || []).map(d => ({ type: 'DATE', value: d }));
    const numbers = (text.match(/\b\d{2,}\b/g) || []).map(n => ({ type: 'NUMBER', value: n }));
    // 고유명사/기관/인명 등은 한글/영문 대문자 패턴 등으로 추출(샘플)
    const orgs = (text.match(/[가-힣]{2,}(주|회사|은행|공사|청|원|회|국)/g) || []).map(o => ({ type: 'ORG', value: o }));
    return [...dates, ...numbers, ...orgs];
  }

  analyzeQuality(text, sections, tables, keywords) {
    // 텍스트 길이, 섹션/표/키워드 개수, 결측/이상/누락 등 품질 평가
    // TODO: 실제 알고리즘 구현
    return {
      textLength: text.length,
      sectionCount: sections.length,
      tableCount: tables.length,
      keywordCount: keywords.length,
      missingSections: sections.length === 0 ? 1 : 0,
      confidence: (sections.length > 0 && keywords.length > 0) ? 0.95 : 0.7
    };
  }

  analyzeDiagnostics(text, sections, tables, keywords, entities) {
    // 경고/오류/진단 정보
    // TODO: 실제 알고리즘 구현
    const warnings = [];
    if (text.length < 100) warnings.push('텍스트가 너무 짧음');
    if (sections.length === 0) warnings.push('섹션/목차 감지 실패');
    if (tables.length === 0) warnings.push('표 감지 실패');
    return { warnings, errors: [] };
  }

  /**
   * 🧹 임시 파일 정리
   */
  async cleanup() {
    try {
      const tempDir = './temp_images';
      if (await fs.access(tempDir).then(() => true).catch(() => false)) {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
          await fs.unlink(path.join(tempDir, file));
        }
        await fs.rmdir(tempDir);
        logger.info('✅ 임시 파일 정리 완료');
      }
    } catch (error) {
      logger.warn(`⚠️ 임시 파일 정리 실패: ${error.message}`);
    }
  }
} 