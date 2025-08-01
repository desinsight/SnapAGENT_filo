import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * 4대보험 관리공단 연동 서비스
 * 국민연금, 건강보험, 고용보험, 산재보험 관리
 */
class SocialInsuranceService {
  constructor() {
    this.baseURL = process.env.SOCIAL_INSURANCE_BASE_URL || 'https://api.nps.or.kr';
    this.apiKey = process.env.SOCIAL_INSURANCE_API_KEY;
    this.secretKey = process.env.SOCIAL_INSURANCE_SECRET_KEY;
    
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
        logger.info('4대보험 API 요청', {
          method: config.method,
          url: config.url,
          data: config.data ? JSON.stringify(config.data).substring(0, 200) + '...' : null
        });
        return config;
      },
      (error) => {
        logger.error('4대보험 API 요청 오류', { error: error.message });
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        logger.info('4대보험 API 응답', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('4대보험 API 응답 오류', {
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
        businessNumber: credentials.businessNumber
      });

      return response.data.token;
    } catch (error) {
      logger.error('4대보험 인증 토큰 생성 실패', {
        userId: credentials.userId,
        error: error.message
      });
      throw new Error('4대보험 인증에 실패했습니다.');
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
   * 국민연금 보험료 계산
   * @param {Object} pensionData - 국민연금 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 계산 결과
   */
  async calculatePensionInsurance(pensionData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/pension/calculate', pensionData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('국민연금 보험료 계산 성공', {
        businessNumber: pensionData.businessNumber,
        period: pensionData.period,
        totalAmount: response.data.totalAmount
      });

      return {
        success: true,
        businessNumber: pensionData.businessNumber,
        period: pensionData.period,
        employeeCount: response.data.employeeCount,
        totalWages: response.data.totalWages,
        employerContribution: response.data.employerContribution,
        employeeContribution: response.data.employeeContribution,
        totalAmount: response.data.totalAmount,
        calculationDate: response.data.calculationDate
      };
    } catch (error) {
      logger.error('국민연금 보험료 계산 실패', {
        businessNumber: pensionData.businessNumber,
        period: pensionData.period,
        error: error.message
      });
      throw new Error('국민연금 보험료 계산에 실패했습니다.');
    }
  }

  /**
   * 건강보험 보험료 계산
   * @param {Object} healthData - 건강보험 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 계산 결과
   */
  async calculateHealthInsurance(healthData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/health/calculate', healthData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('건강보험 보험료 계산 성공', {
        businessNumber: healthData.businessNumber,
        period: healthData.period,
        totalAmount: response.data.totalAmount
      });

      return {
        success: true,
        businessNumber: healthData.businessNumber,
        period: healthData.period,
        employeeCount: response.data.employeeCount,
        totalWages: response.data.totalWages,
        employerContribution: response.data.employerContribution,
        employeeContribution: response.data.employeeContribution,
        longTermCareInsurance: response.data.longTermCareInsurance,
        totalAmount: response.data.totalAmount,
        calculationDate: response.data.calculationDate
      };
    } catch (error) {
      logger.error('건강보험 보험료 계산 실패', {
        businessNumber: healthData.businessNumber,
        period: healthData.period,
        error: error.message
      });
      throw new Error('건강보험 보험료 계산에 실패했습니다.');
    }
  }

  /**
   * 고용보험 보험료 계산
   * @param {Object} employmentData - 고용보험 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 계산 결과
   */
  async calculateEmploymentInsurance(employmentData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/employment/calculate', employmentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('고용보험 보험료 계산 성공', {
        businessNumber: employmentData.businessNumber,
        period: employmentData.period,
        totalAmount: response.data.totalAmount
      });

      return {
        success: true,
        businessNumber: employmentData.businessNumber,
        period: employmentData.period,
        employeeCount: response.data.employeeCount,
        totalWages: response.data.totalWages,
        employerContribution: response.data.employerContribution,
        employeeContribution: response.data.employeeContribution,
        totalAmount: response.data.totalAmount,
        calculationDate: response.data.calculationDate
      };
    } catch (error) {
      logger.error('고용보험 보험료 계산 실패', {
        businessNumber: employmentData.businessNumber,
        period: employmentData.period,
        error: error.message
      });
      throw new Error('고용보험 보험료 계산에 실패했습니다.');
    }
  }

  /**
   * 산재보험 보험료 계산
   * @param {Object} industrialData - 산재보험 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 계산 결과
   */
  async calculateIndustrialInsurance(industrialData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/industrial/calculate', industrialData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('산재보험 보험료 계산 성공', {
        businessNumber: industrialData.businessNumber,
        period: industrialData.period,
        totalAmount: response.data.totalAmount
      });

      return {
        success: true,
        businessNumber: industrialData.businessNumber,
        period: industrialData.period,
        employeeCount: response.data.employeeCount,
        totalWages: response.data.totalWages,
        riskRate: response.data.riskRate,
        employerContribution: response.data.employerContribution,
        totalAmount: response.data.totalAmount,
        calculationDate: response.data.calculationDate
      };
    } catch (error) {
      logger.error('산재보험 보험료 계산 실패', {
        businessNumber: industrialData.businessNumber,
        period: industrialData.period,
        error: error.message
      });
      throw new Error('산재보험 보험료 계산에 실패했습니다.');
    }
  }

  /**
   * 4대보험 통합 계산
   * @param {Object} insuranceData - 4대보험 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 통합 계산 결과
   */
  async calculateAllInsurance(insuranceData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/insurance/calculate-all', insuranceData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('4대보험 통합 계산 성공', {
        businessNumber: insuranceData.businessNumber,
        period: insuranceData.period,
        totalAmount: response.data.totalAmount
      });

      return {
        success: true,
        businessNumber: insuranceData.businessNumber,
        period: insuranceData.period,
        employeeCount: response.data.employeeCount,
        totalWages: response.data.totalWages,
        pension: response.data.pension,
        health: response.data.health,
        employment: response.data.employment,
        industrial: response.data.industrial,
        totalAmount: response.data.totalAmount,
        calculationDate: response.data.calculationDate
      };
    } catch (error) {
      logger.error('4대보험 통합 계산 실패', {
        businessNumber: insuranceData.businessNumber,
        period: insuranceData.period,
        error: error.message
      });
      throw new Error('4대보험 통합 계산에 실패했습니다.');
    }
  }

  /**
   * 보험료 납부
   * @param {Object} paymentData - 납부 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 납부 결과
   */
  async makeInsurancePayment(paymentData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/insurance/payment', paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('4대보험료 납부 성공', {
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
      logger.error('4대보험료 납부 실패', {
        amount: paymentData.amount,
        businessNumber: paymentData.businessNumber,
        error: error.message
      });
      throw new Error('4대보험료 납부에 실패했습니다.');
    }
  }

  /**
   * 보험료 납부 내역 조회
   * @param {string} businessNumber - 사업자등록번호
   * @param {string} period - 조회 기간
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 납부 내역
   */
  async getPaymentHistory(businessNumber, period, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.get(`/api/insurance/payment-history/${businessNumber}`, {
        params: { period },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('보험료 납부 내역 조회 실패', {
        businessNumber,
        period,
        error: error.message
      });
      throw new Error('보험료 납부 내역 조회에 실패했습니다.');
    }
  }

  /**
   * 직원 등록
   * @param {Object} employeeData - 직원 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 등록 결과
   */
  async registerEmployee(employeeData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post('/api/employee/register', employeeData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('직원 등록 성공', {
        employeeId: response.data.employeeId,
        name: employeeData.name,
        businessNumber: employeeData.businessNumber
      });

      return {
        success: true,
        employeeId: response.data.employeeId,
        registrationDate: response.data.registrationDate
      };
    } catch (error) {
      logger.error('직원 등록 실패', {
        name: employeeData.name,
        businessNumber: employeeData.businessNumber,
        error: error.message
      });
      throw new Error('직원 등록에 실패했습니다.');
    }
  }

  /**
   * 직원 정보 수정
   * @param {string} employeeId - 직원 ID
   * @param {Object} updateData - 수정 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 수정 결과
   */
  async updateEmployee(employeeId, updateData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.put(`/api/employee/${employeeId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('직원 정보 수정 성공', {
        employeeId,
        updatedFields: Object.keys(updateData)
      });

      return {
        success: true,
        employeeId,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      logger.error('직원 정보 수정 실패', {
        employeeId,
        error: error.message
      });
      throw new Error('직원 정보 수정에 실패했습니다.');
    }
  }

  /**
   * 직원 퇴직 처리
   * @param {string} employeeId - 직원 ID
   * @param {Object} retirementData - 퇴직 데이터
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 퇴직 처리 결과
   */
  async retireEmployee(employeeId, retirementData, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.post(`/api/employee/${employeeId}/retire`, retirementData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.info('직원 퇴직 처리 성공', {
        employeeId,
        retirementDate: retirementData.retirementDate
      });

      return {
        success: true,
        employeeId,
        retirementDate: response.data.retirementDate,
        finalPayment: response.data.finalPayment
      };
    } catch (error) {
      logger.error('직원 퇴직 처리 실패', {
        employeeId,
        error: error.message
      });
      throw new Error('직원 퇴직 처리에 실패했습니다.');
    }
  }

  /**
   * 직원 목록 조회
   * @param {string} businessNumber - 사업자등록번호
   * @param {Object} credentials - 인증 정보
   * @returns {Array} 직원 목록
   */
  async getEmployeeList(businessNumber, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.get(`/api/employee/list/${businessNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.employees;
    } catch (error) {
      logger.error('직원 목록 조회 실패', {
        businessNumber,
        error: error.message
      });
      throw new Error('직원 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 보험료 납부 예정일 조회
   * @param {string} businessNumber - 사업자등록번호
   * @param {string} period - 조회 기간
   * @param {Object} credentials - 인증 정보
   * @returns {Object} 납부 예정 정보
   */
  async getPaymentDueDate(businessNumber, period, credentials) {
    try {
      const token = await this.generateAuthToken(credentials);
      
      const response = await this.client.get(`/api/insurance/payment-due/${businessNumber}`, {
        params: { period },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('보험료 납부 예정일 조회 실패', {
        businessNumber,
        period,
        error: error.message
      });
      throw new Error('보험료 납부 예정일 조회에 실패했습니다.');
    }
  }
}

export default new SocialInsuranceService(); 