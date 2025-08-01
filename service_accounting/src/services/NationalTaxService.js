import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * 국세청 전자세금신고 시스템 연동 서비스
 * 부가세, 소득세, 법인세 신고서 제출 및 조회
 */
class NationalTaxService {
  constructor() {
    this.baseURL = process.env.NTS_BASE_URL || 'https://www.hometax.go.kr';
    this.apiKey = process.env.NTS_API_KEY;
    this.secretKey = process.env.NTS_SECRET_KEY;
    this.certificatePath = process.env.NTS_CERTIFICATE_PATH;
    
    // API 클라이언트 설정
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Accounting-Service/1.0.0'
      }
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        logger.info('국세청 API 요청', {
          method: config.method,
          url: config.url,
          data: config.data ? JSON.stringify(config.data).substring(0, 200) + '...' : null
        });
        return config;
      },
      (error) => {
        logger.error('국세청 API 요청 오류', { error: error.message });
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        logger.info('국세청 API 응답', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('국세청 API 응답 오류', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 인증 토큰 생성
   * @param {Object} credentials - 인증 정보
   * @returns {string} 인증 토큰
   */
  async generateAuthToken(credentials) {
    try {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(timestamp, credentials.password);
      
      const response = await this.client.post('/api/auth/token', {
        userId: credentials.userId,
        password: signature,
        timestamp,
        certificate: credentials.certificate
      });

      return response.data.token;
    } catch (error) {
      logger.error('국세청 인증 토큰 생성 실패', {
        userId: credentials.userId,
        error: error.message
      });
      throw new Error('국세청 인증에 실패했습니다.');
    }
  }

  /**
   * 디지털 서명 생성
   * @param {string} timestamp - 타임스탬프
   * @param {string} data - 서명할 데이터
   * @returns {string} 서명
   */
  generateSignature(timestamp, data) {
    const message = `${timestamp}:${data}`;
    return crypto.createHmac('sha256', this.secretKey).update(message).digest('hex');
  }

  /**
   * 부가가치세 신고서 제출
   * @param {Object} vatData - 부가세 신고 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 제출 결과
   */
  async submitVatReturn(vatData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const vatForm = this.formatVatForm(vatData);
      
      const response = await this.client.post('/api/vat/submit', vatForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('부가가치세 신고서 제출 성공', {
        submissionId: response.data.submissionId,
        period: vatData.period,
        organizationId: vatData.organizationId
      });

      return {
        success: true,
        submissionId: response.data.submissionId,
        receiptNumber: response.data.receiptNumber,
        submissionDate: response.data.submissionDate,
        status: 'submitted'
      };
    } catch (error) {
      logger.error('부가가치세 신고서 제출 실패', {
        period: vatData.period,
        organizationId: vatData.organizationId,
        error: error.message
      });
      throw new Error('부가가치세 신고서 제출에 실패했습니다.');
    }
  }

  /**
   * 종합소득세 신고서 제출
   * @param {Object} incomeData - 소득세 신고 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 제출 결과
   */
  async submitIncomeTaxReturn(incomeData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const incomeForm = this.formatIncomeTaxForm(incomeData);
      
      const response = await this.client.post('/api/income/submit', incomeForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('종합소득세 신고서 제출 성공', {
        submissionId: response.data.submissionId,
        year: incomeData.year,
        taxpayerId: incomeData.taxpayerId
      });

      return {
        success: true,
        submissionId: response.data.submissionId,
        receiptNumber: response.data.receiptNumber,
        submissionDate: response.data.submissionDate,
        status: 'submitted'
      };
    } catch (error) {
      logger.error('종합소득세 신고서 제출 실패', {
        year: incomeData.year,
        taxpayerId: incomeData.taxpayerId,
        error: error.message
      });
      throw new Error('종합소득세 신고서 제출에 실패했습니다.');
    }
  }

  /**
   * 법인세 신고서 제출
   * @param {Object} corporateData - 법인세 신고 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 제출 결과
   */
  async submitCorporateTaxReturn(corporateData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const corporateForm = this.formatCorporateTaxForm(corporateData);
      
      const response = await this.client.post('/api/corporate/submit', corporateForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('법인세 신고서 제출 성공', {
        submissionId: response.data.submissionId,
        year: corporateData.year,
        corporateId: corporateData.corporateId
      });

      return {
        success: true,
        submissionId: response.data.submissionId,
        receiptNumber: response.data.receiptNumber,
        submissionDate: response.data.submissionDate,
        status: 'submitted'
      };
    } catch (error) {
      logger.error('법인세 신고서 제출 실패', {
        year: corporateData.year,
        corporateId: corporateData.corporateId,
        error: error.message
      });
      throw new Error('법인세 신고서 제출에 실패했습니다.');
    }
  }

  /**
   * 원천세 신고서 제출
   * @param {Object} withholdingData - 원천세 신고 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 제출 결과
   */
  async submitWithholdingTaxReturn(withholdingData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const withholdingForm = this.formatWithholdingTaxForm(withholdingData);
      
      const response = await this.client.post('/api/withholding/submit', withholdingForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('원천세 신고서 제출 성공', {
        submissionId: response.data.submissionId,
        period: withholdingData.period,
        type: withholdingData.type
      });

      return {
        success: true,
        submissionId: response.data.submissionId,
        receiptNumber: response.data.receiptNumber,
        submissionDate: response.data.submissionDate,
        status: 'submitted'
      };
    } catch (error) {
      logger.error('원천세 신고서 제출 실패', {
        period: withholdingData.period,
        type: withholdingData.type,
        error: error.message
      });
      throw new Error('원천세 신고서 제출에 실패했습니다.');
    }
  }

  /**
   * 신고서 상태 조회
   * @param {string} submissionId - 제출 ID
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 신고서 상태
   */
  async getSubmissionStatus(submissionId, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.get(`/api/submission/status/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        submissionId,
        status: response.data.status,
        message: response.data.message,
        lastUpdated: response.data.lastUpdated
      };
    } catch (error) {
      logger.error('신고서 상태 조회 실패', {
        submissionId,
        error: error.message
      });
      throw new Error('신고서 상태 조회에 실패했습니다.');
    }
  }

  /**
   * 신고서 수정
   * @param {string} submissionId - 제출 ID
   * @param {Object} updatedData - 수정된 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 수정 결과
   */
  async updateSubmission(submissionId, updatedData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.put(`/api/submission/${submissionId}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('신고서 수정 성공', {
        submissionId,
        status: response.data.status
      });

      return {
        success: true,
        submissionId,
        status: response.data.status,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      logger.error('신고서 수정 실패', {
        submissionId,
        error: error.message
      });
      throw new Error('신고서 수정에 실패했습니다.');
    }
  }

  /**
   * 신고서 취소
   * @param {string} submissionId - 제출 ID
   * @param {string} reason - 취소 사유
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 취소 결과
   */
  async cancelSubmission(submissionId, reason, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post(`/api/submission/${submissionId}/cancel`, {
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('신고서 취소 성공', {
        submissionId,
        reason
      });

      return {
        success: true,
        submissionId,
        status: 'cancelled',
        cancelledAt: response.data.cancelledAt
      };
    } catch (error) {
      logger.error('신고서 취소 실패', {
        submissionId,
        reason,
        error: error.message
      });
      throw new Error('신고서 취소에 실패했습니다.');
    }
  }

  /**
   * 부가가치세 신고서 형식 변환
   * @param {Object} vatData - 부가세 데이터
   * @returns {Object} 국세청 형식
   */
  formatVatForm(vatData) {
    return {
      period: vatData.period,
      businessNumber: vatData.businessNumber,
      businessName: vatData.businessName,
      representativeName: vatData.representativeName,
      totalSales: vatData.totalSales,
      totalPurchases: vatData.totalPurchases,
      vatOnSales: vatData.vatOnSales,
      vatOnPurchases: vatData.vatOnPurchases,
      vatPayable: vatData.vatPayable,
      attachments: vatData.attachments || []
    };
  }

  /**
   * 종합소득세 신고서 형식 변환
   * @param {Object} incomeData - 소득세 데이터
   * @returns {Object} 국세청 형식
   */
  formatIncomeTaxForm(incomeData) {
    return {
      year: incomeData.year,
      taxpayerId: incomeData.taxpayerId,
      taxpayerName: incomeData.taxpayerName,
      totalIncome: incomeData.totalIncome,
      totalDeductions: incomeData.totalDeductions,
      taxableIncome: incomeData.taxableIncome,
      calculatedTax: incomeData.calculatedTax,
      taxCredits: incomeData.taxCredits,
      finalTax: incomeData.finalTax,
      attachments: incomeData.attachments || []
    };
  }

  /**
   * 법인세 신고서 형식 변환
   * @param {Object} corporateData - 법인세 데이터
   * @returns {Object} 국세청 형식
   */
  formatCorporateTaxForm(corporateData) {
    return {
      year: corporateData.year,
      corporateId: corporateData.corporateId,
      corporateName: corporateData.corporateName,
      representativeName: corporateData.representativeName,
      totalRevenue: corporateData.totalRevenue,
      totalExpenses: corporateData.totalExpenses,
      taxableIncome: corporateData.taxableIncome,
      calculatedTax: corporateData.calculatedTax,
      taxCredits: corporateData.taxCredits,
      finalTax: corporateData.finalTax,
      attachments: corporateData.attachments || []
    };
  }

  /**
   * 원천세 신고서 형식 변환
   * @param {Object} withholdingData - 원천세 데이터
   * @returns {Object} 국세청 형식
   */
  formatWithholdingTaxForm(withholdingData) {
    return {
      period: withholdingData.period,
      type: withholdingData.type,
      businessNumber: withholdingData.businessNumber,
      businessName: withholdingData.businessName,
      totalAmount: withholdingData.totalAmount,
      withholdingRate: withholdingData.withholdingRate,
      withholdingAmount: withholdingData.withholdingAmount,
      attachments: withholdingData.attachments || []
    };
  }

  /**
   * 세금 납부 정보 조회
   * @param {string} businessNumber - 사업자등록번호
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 납부 정보
   */
  async getPaymentInfo(businessNumber, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.get(`/api/payment/info/${businessNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('납부 정보 조회 실패', {
        businessNumber,
        error: error.message
      });
      throw new Error('납부 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 세금 납부
   * @param {Object} paymentData - 납부 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 납부 결과
   */
  async makePayment(paymentData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/payment/make', paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('세금 납부 성공', {
        paymentId: response.data.paymentId,
        amount: paymentData.amount,
        businessNumber: paymentData.businessNumber
      });

      return {
        success: true,
        paymentId: response.data.paymentId,
        receiptNumber: response.data.receiptNumber,
        paymentDate: response.data.paymentDate,
        status: 'completed'
      };
    } catch (error) {
      logger.error('세금 납부 실패', {
        amount: paymentData.amount,
        businessNumber: paymentData.businessNumber,
        error: error.message
      });
      throw new Error('세금 납부에 실패했습니다.');
    }
  }
}

export default new NationalTaxService(); 