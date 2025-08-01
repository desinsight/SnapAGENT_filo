/**
 * 💼 Payroll Routes
 * 
 * 급여 관리 API 라우터
 * 급여 계산, 4대보험, 연말정산 등의 기능
 * 
 * @author Web MCP Server Team
 * @version 1.0.0
 */

import express from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { requirePermission } from '../middlewares/auth.js';
import { logPayrollRequest } from '../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /api/payroll/calculate:
 *   post:
 *     summary: 급여 계산
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - period
 *               - baseSalary
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: 직원 ID
 *               period:
 *                 type: string
 *                 description: 급여 기간 (YYYY-MM)
 *               baseSalary:
 *                 type: number
 *                 description: 기본급
 *               allowances:
 *                 type: object
 *                 description: 수당 정보
 *               deductions:
 *                 type: object
 *                 description: 공제 정보
 *     responses:
 *       201:
 *         description: 급여 계산 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/calculate',
  requirePermission(['payroll:calculate']),
  asyncHandler(async (req, res) => {
    const { employeeId, period, baseSalary, allowances = {}, deductions = {} } = req.body;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, employeeId, period);
    
    // TODO: 급여 계산 로직 구현
    const payroll = {
      id: `payroll_${Date.now()}`,
      employeeId,
      period,
      baseSalary,
      allowances,
      deductions,
      grossSalary: baseSalary + Object.values(allowances).reduce((sum, val) => sum + val, 0),
      netSalary: 0, // 계산 후 설정
      insurance: {
        nationalPension: 0,
        healthInsurance: 0,
        employmentInsurance: 0,
        industrialAccidentInsurance: 0
      },
      incomeTax: 0,
      localIncomeTax: 0,
      status: 'calculated',
      calculatedBy: userId,
      calculatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      data: payroll,
      message: '급여가 성공적으로 계산되었습니다.'
    });
  })
);

/**
 * @swagger
 * /api/payroll/employees:
 *   get:
 *     summary: 직원 목록 조회
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: 부서
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, retired]
 *         description: 직원 상태
 *     responses:
 *       200:
 *         description: 직원 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/employees',
  requirePermission(['payroll:read']),
  asyncHandler(async (req, res) => {
    const { department, status } = req.query;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, 'list_employees');
    
    // TODO: 직원 목록 조회 로직 구현
    const employees = [
      {
        id: 'emp_1',
        name: '홍길동',
        employeeNumber: 'EMP001',
        department: '개발팀',
        position: '개발자',
        baseSalary: 4000000,
        status: 'active',
        hireDate: '2023-01-01'
      }
    ];
    
    res.json({
      success: true,
      data: employees,
      message: '직원 목록을 성공적으로 조회했습니다.'
    });
  })
);

/**
 * @swagger
 * /api/payroll/employees/{id}:
 *   get:
 *     summary: 직원 상세 정보 조회
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 직원 ID
 *     responses:
 *       200:
 *         description: 직원 상세 정보 조회 성공
 *       404:
 *         description: 직원을 찾을 수 없음
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/employees/:id',
  requirePermission(['payroll:read']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, id);
    
    // TODO: 직원 상세 정보 조회 로직 구현
    const employee = {
      id,
      name: '홍길동',
      employeeNumber: 'EMP001',
      department: '개발팀',
      position: '개발자',
      baseSalary: 4000000,
      status: 'active',
      hireDate: '2023-01-01',
      personalInfo: {
        residentNumber: '123456-1234567',
        address: '서울시 강남구',
        phone: '010-1234-5678',
        email: 'hong@company.com'
      },
      bankInfo: {
        bankName: '신한은행',
        accountNumber: '123-456-789012'
      }
    };
    
    res.json({
      success: true,
      data: employee,
      message: '직원 정보를 성공적으로 조회했습니다.'
    });
  })
);

/**
 * @swagger
 * /api/payroll/insurance:
 *   post:
 *     summary: 4대보험 계산
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - period
 *               - grossSalary
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: 직원 ID
 *               period:
 *                 type: string
 *                 description: 계산 기간 (YYYY-MM)
 *               grossSalary:
 *                 type: number
 *                 description: 총급여
 *     responses:
 *       201:
 *         description: 4대보험 계산 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/insurance',
  requirePermission(['payroll:calculate']),
  asyncHandler(async (req, res) => {
    const { employeeId, period, grossSalary } = req.body;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, employeeId, period);
    
    // TODO: 4대보험 계산 로직 구현
    const insurance = {
      id: `insurance_${Date.now()}`,
      employeeId,
      period,
      grossSalary,
      nationalPension: {
        employee: Math.round(grossSalary * 0.045),
        employer: Math.round(grossSalary * 0.045),
        total: Math.round(grossSalary * 0.09)
      },
      healthInsurance: {
        employee: Math.round(grossSalary * 0.0343),
        employer: Math.round(grossSalary * 0.0343),
        total: Math.round(grossSalary * 0.0686)
      },
      employmentInsurance: {
        employee: Math.round(grossSalary * 0.008),
        employer: Math.round(grossSalary * 0.008),
        total: Math.round(grossSalary * 0.016)
      },
      industrialAccidentInsurance: {
        employee: 0,
        employer: Math.round(grossSalary * 0.008),
        total: Math.round(grossSalary * 0.008)
      },
      calculatedBy: userId,
      calculatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      data: insurance,
      message: '4대보험이 성공적으로 계산되었습니다.'
    });
  })
);

/**
 * @swagger
 * /api/payroll/year-end:
 *   post:
 *     summary: 연말정산 계산
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - year
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: 직원 ID
 *               year:
 *                 type: string
 *                 description: 정산 연도
 *               incomeDetails:
 *                 type: object
 *                 description: 소득 상세 정보
 *               deductionDetails:
 *                 type: object
 *                 description: 공제 상세 정보
 *     responses:
 *       201:
 *         description: 연말정산 계산 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.post('/year-end',
  requirePermission(['payroll:calculate']),
  asyncHandler(async (req, res) => {
    const { employeeId, year, incomeDetails = {}, deductionDetails = {} } = req.body;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, employeeId, year);
    
    // TODO: 연말정산 계산 로직 구현
    const yearEndSettlement = {
      id: `year_end_${Date.now()}`,
      employeeId,
      year,
      incomeDetails,
      deductionDetails,
      totalIncome: 50000000,
      totalDeductions: 15000000,
      taxableIncome: 35000000,
      calculatedTax: 3500000,
      taxCredits: 500000,
      finalTax: 3000000,
      refundAmount: 0,
      status: 'calculated',
      calculatedBy: userId,
      calculatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      data: yearEndSettlement,
      message: '연말정산이 성공적으로 계산되었습니다.'
    });
  })
);

/**
 * @swagger
 * /api/payroll/reports:
 *   get:
 *     summary: 급여 보고서 목록 조회
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 급여 기간 (YYYY-MM)
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: 직원 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [calculated, paid, cancelled]
 *         description: 급여 상태
 *     responses:
 *       200:
 *         description: 급여 보고서 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.get('/reports',
  requirePermission(['payroll:read']),
  asyncHandler(async (req, res) => {
    const { period, employeeId, status } = req.query;
    const userId = req.user.id;
    
    // 요청 로깅
    logPayrollRequest(req, 'list_reports');
    
    // TODO: 급여 보고서 목록 조회 로직 구현
    const reports = [
      {
        id: 'payroll_1',
        employeeId: 'emp_1',
        employeeName: '홍길동',
        period: '2024-01',
        grossSalary: 4500000,
        netSalary: 3500000,
        status: 'paid',
        paidAt: new Date('2024-01-25')
      }
    ];
    
    res.json({
      success: true,
      data: reports,
      message: '급여 보고서 목록을 성공적으로 조회했습니다.'
    });
  })
);

export default router; 