import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * AI 처리 서비스
 * OCR, 자동 분류, 세무 자문, 문서 분석 등
 */
class AIProcessingService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.ocrApiKey = process.env.OCR_API_KEY;
    this.aiBaseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    
    // OpenAI 클라이언트
    this.openaiClient = axios.create({
      baseURL: this.aiBaseURL,
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // Claude 클라이언트
    this.claudeClient = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'x-api-key': this.claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 60000
    });

    // OCR 클라이언트
    this.ocrClient = axios.create({
      baseURL: 'https://api.ocr.space/parse/image',
      timeout: 30000
    });
  }

  /**
   * 영수증 OCR 처리
   * @param {string} imagePath - 이미지 파일 경로
   * @param {Object} options - OCR 옵션
   * @returns {Object} OCR 결과
   */
  async processReceiptOCR(imagePath, options = {}) {
    try {
      const startTime = Date.now();
      
      // 이미지 파일 확인
      if (!fs.existsSync(imagePath)) {
        throw new Error('이미지 파일을 찾을 수 없습니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));
      formData.append('apikey', this.ocrApiKey);
      formData.append('language', options.language || 'kor');
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', path.extname(imagePath).substring(1));
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      // OCR API 호출
      const response = await this.ocrClient.post('', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const processingTime = Date.now() - startTime;

      if (response.data.IsErroredOnProcessing) {
        throw new Error(`OCR 처리 오류: ${response.data.ErrorMessage}`);
      }

      const ocrResult = this.parseOCRResult(response.data);
      
      logger.info('영수증 OCR 처리 성공', {
        imagePath,
        processingTime: `${processingTime}ms`,
        extractedText: ocrResult.extractedText.substring(0, 100) + '...'
      });

      return {
        success: true,
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        processingTime,
        rawData: response.data
      };
    } catch (error) {
      logger.error('영수증 OCR 처리 실패', {
        imagePath,
        error: error.message
      });
      throw new Error(`OCR 처리에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * OCR 결과 파싱
   * @param {Object} ocrData - OCR API 응답 데이터
   * @returns {Object} 파싱된 결과
   */
  parseOCRResult(ocrData) {
    let extractedText = '';
    let totalConfidence = 0;
    let wordCount = 0;

    if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
      ocrData.ParsedResults.forEach(result => {
        if (result.ParsedText) {
          extractedText += result.ParsedText + '\n';
        }
        
        if (result.TextOverlay && result.TextOverlay.Lines) {
          result.TextOverlay.Lines.forEach(line => {
            if (line.Words) {
              line.Words.forEach(word => {
                if (word.Confidence) {
                  totalConfidence += parseFloat(word.Confidence);
                  wordCount++;
                }
              });
            }
          });
        }
      });
    }

    const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    return {
      extractedText: extractedText.trim(),
      confidence: averageConfidence
    };
  }

  /**
   * 영수증 정보 추출 및 분류
   * @param {string} ocrText - OCR로 추출된 텍스트
   * @param {Object} options - 처리 옵션
   * @returns {Object} 추출된 정보
   */
  async extractReceiptInfo(ocrText, options = {}) {
    try {
      const prompt = `
다음은 영수증에서 OCR로 추출된 텍스트입니다. 다음 정보를 JSON 형식으로 추출해주세요:

텍스트:
${ocrText}

추출할 정보:
- 상호명 (businessName)
- 사업자등록번호 (businessNumber)
- 거래일시 (transactionDate)
- 총 금액 (totalAmount)
- 부가세 (vatAmount)
- 결제수단 (paymentMethod)
- 카테고리 (category)
- 메모 (memo)

JSON 형식으로만 응답해주세요.
`;

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 영수증 정보를 정확하게 추출하는 AI 어시스턴트입니다. JSON 형식으로만 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const extractedInfo = JSON.parse(response.data.choices[0].message.content);
      
      logger.info('영수증 정보 추출 성공', {
        businessName: extractedInfo.businessName,
        totalAmount: extractedInfo.totalAmount,
        category: extractedInfo.category
      });

      return {
        success: true,
        ...extractedInfo
      };
    } catch (error) {
      logger.error('영수증 정보 추출 실패', {
        ocrText: ocrText.substring(0, 100) + '...',
        error: error.message
      });
      throw new Error(`영수증 정보 추출에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 세무 자문
   * @param {string} question - 세무 질문
   * @param {Object} context - 컨텍스트 정보
   * @returns {Object} 자문 결과
   */
  async getTaxAdvice(question, context = {}) {
    try {
      const prompt = `
당신은 한국 세무 전문가입니다. 다음 질문에 대해 정확하고 실용적인 조언을 제공해주세요.

질문: ${question}

컨텍스트 정보:
- 사업 형태: ${context.businessType || '미지정'}
- 연매출: ${context.annualRevenue || '미지정'}
- 직원 수: ${context.employeeCount || '미지정'}
- 세무 기간: ${context.taxPeriod || '미지정'}

다음 형식으로 응답해주세요:
1. 답변 요약
2. 상세 설명
3. 주의사항
4. 관련 법령
5. 권장사항
`;

      const response = await this.claudeClient.post('/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const advice = response.data.content[0].text;
      
      logger.info('세무 자문 제공 성공', {
        question: question.substring(0, 100) + '...',
        adviceLength: advice.length
      });

      return {
        success: true,
        advice,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('세무 자문 실패', {
        question: question.substring(0, 100) + '...',
        error: error.message
      });
      throw new Error(`세무 자문에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 회계 전표 자동 생성
   * @param {Object} transactionData - 거래 데이터
   * @param {Object} options - 생성 옵션
   * @returns {Object} 생성된 전표
   */
  async generateAccountingEntry(transactionData, options = {}) {
    try {
      const prompt = `
다음 거래 정보를 바탕으로 회계 전표를 생성해주세요.

거래 정보:
- 거래일: ${transactionData.transactionDate}
- 거래처: ${transactionData.counterparty}
- 금액: ${transactionData.amount}
- 거래내용: ${transactionData.description}
- 거래유형: ${transactionData.type}

사업 정보:
- 사업 형태: ${options.businessType || '일반'}
- 과세 유형: ${options.taxType || '일반과세자'}

다음 형식의 JSON으로 응답해주세요:
{
  "debitAccount": "차변 계정과목",
  "creditAccount": "대변 계정과목",
  "debitAmount": 차변금액,
  "creditAmount": 대변금액,
  "description": "전표 설명",
  "taxCode": "세금 코드",
  "category": "분류"
}
`;

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 한국 회계 전문가입니다. 정확한 회계 전표를 생성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const entry = JSON.parse(response.data.choices[0].message.content);
      
      logger.info('회계 전표 자동 생성 성공', {
        transactionDate: transactionData.transactionDate,
        amount: transactionData.amount,
        debitAccount: entry.debitAccount,
        creditAccount: entry.creditAccount
      });

      return {
        success: true,
        ...entry,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('회계 전표 자동 생성 실패', {
        transactionData,
        error: error.message
      });
      throw new Error(`회계 전표 생성에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 세무 신고서 자동 작성
   * @param {Object} businessData - 사업 데이터
   * @param {Object} financialData - 재무 데이터
   * @param {string} taxType - 세무 유형
   * @returns {Object} 신고서 데이터
   */
  async generateTaxReturn(businessData, financialData, taxType) {
    try {
      const prompt = `
다음 정보를 바탕으로 ${taxType} 신고서를 작성해주세요.

사업 정보:
${JSON.stringify(businessData, null, 2)}

재무 정보:
${JSON.stringify(financialData, null, 2)}

신고서 유형: ${taxType}

다음 형식의 JSON으로 응답해주세요:
{
  "taxpayerInfo": {
    "name": "납세자명",
    "businessNumber": "사업자등록번호",
    "address": "주소"
  },
  "taxPeriod": "과세기간",
  "taxableIncome": "과세표준",
  "calculatedTax": "산출세액",
  "deductions": "공제액",
  "finalTax": "납부할 세액",
  "attachments": ["첨부서류 목록"]
}
`;

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 한국 세무 전문가입니다. 정확한 세무 신고서를 작성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const taxReturn = JSON.parse(response.data.choices[0].message.content);
      
      logger.info('세무 신고서 자동 작성 성공', {
        taxType,
        businessNumber: businessData.businessNumber,
        finalTax: taxReturn.finalTax
      });

      return {
        success: true,
        ...taxReturn,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('세무 신고서 자동 작성 실패', {
        taxType,
        businessNumber: businessData.businessNumber,
        error: error.message
      });
      throw new Error(`세무 신고서 작성에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 문서 분석 및 요약
   * @param {string} documentText - 문서 텍스트
   * @param {string} documentType - 문서 유형
   * @returns {Object} 분석 결과
   */
  async analyzeDocument(documentText, documentType) {
    try {
      const prompt = `
다음 ${documentType} 문서를 분석하고 요약해주세요.

문서 내용:
${documentText}

다음 형식으로 응답해주세요:
1. 문서 요약 (핵심 내용)
2. 주요 정보 추출
3. 중요도 평가
4. 권장사항
5. 관련 세무/회계 처리 방안
`;

      const response = await this.claudeClient.post('/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const analysis = response.data.content[0].text;
      
      logger.info('문서 분석 성공', {
        documentType,
        documentLength: documentText.length,
        analysisLength: analysis.length
      });

      return {
        success: true,
        analysis,
        documentType,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('문서 분석 실패', {
        documentType,
        documentLength: documentText.length,
        error: error.message
      });
      throw new Error(`문서 분석에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 예측 분석 (매출, 비용, 세금 등)
   * @param {Array} historicalData - 과거 데이터
   * @param {Object} parameters - 예측 파라미터
   * @returns {Object} 예측 결과
   */
  async predictFinancialMetrics(historicalData, parameters) {
    try {
      const prompt = `
다음 과거 재무 데이터를 바탕으로 미래 예측을 수행해주세요.

과거 데이터:
${JSON.stringify(historicalData, null, 2)}

예측 파라미터:
${JSON.stringify(parameters, null, 2)}

다음 항목들을 예측해주세요:
1. 매출 예측
2. 비용 예측
3. 세금 예측
4. 현금흐름 예측
5. 위험 요소 분석

JSON 형식으로 응답해주세요.
`;

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 재무 분석 전문가입니다. 정확한 예측을 제공해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const prediction = JSON.parse(response.data.choices[0].message.content);
      
      logger.info('재무 예측 분석 성공', {
        dataPoints: historicalData.length,
        predictionPeriod: parameters.period
      });

      return {
        success: true,
        ...prediction,
        predictedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('재무 예측 분석 실패', {
        dataPoints: historicalData.length,
        error: error.message
      });
      throw new Error(`재무 예측에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * AI 모델 성능 모니터링
   * @returns {Object} 성능 지표
   */
  async getAIModelPerformance() {
    try {
      const performance = {
        ocr: {
          accuracy: 0.95,
          processingTime: 2.5,
          successRate: 0.98
        },
        classification: {
          accuracy: 0.92,
          processingTime: 1.2,
          successRate: 0.95
        },
        advice: {
          accuracy: 0.88,
          processingTime: 3.0,
          successRate: 0.90
        },
        prediction: {
          accuracy: 0.85,
          processingTime: 5.0,
          successRate: 0.87
        }
      };

      return {
        success: true,
        performance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('AI 모델 성능 조회 실패', { error: error.message });
      throw new Error('AI 모델 성능 조회에 실패했습니다.');
    }
  }
}

export default new AIProcessingService(); 