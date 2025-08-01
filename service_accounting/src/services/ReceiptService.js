const Receipt = require('../models/Receipt');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * 영수증 서비스 - AI 기반 영수증 인식, 자동 분류, 회계 연동
 * OCR, 이미지 처리, 자동 회계 분개를 담당
 */
class ReceiptService {
  /**
   * 영수증 업로드
   * @param {Object} receiptData - 영수증 데이터
   * @param {Array} files - 업로드된 파일들
   * @param {String} userId - 업로드자 ID
   * @returns {Promise<Object>} 생성된 영수증
   */
  async uploadReceipt(receiptData, files, userId) {
    try {
      logger.info('영수증 업로드 시작', {
        organizationId: receiptData.organizationId,
        userId,
        fileCount: files.length
      });

      // 영수증 생성
      const receipt = new Receipt({
        ...receiptData,
        createdBy: userId,
        lastModifiedBy: userId
      });

      // 이미지 파일 처리
      if (files && files.length > 0) {
        const processedImages = await this.processImages(files);
        receipt.images = processedImages;
        
        // 첫 번째 이미지를 주요 이미지로 설정
        if (receipt.images.length > 0) {
          receipt.images[0].isPrimary = true;
        }
      }

      const savedReceipt = await receipt.save();

      // AI 처리 시작 (비동기)
      this.processReceiptWithAI(savedReceipt._id);

      logger.info('영수증 업로드 완료', {
        receiptId: savedReceipt._id,
        receiptNumber: savedReceipt.receiptNumber
      });

      return savedReceipt;
    } catch (error) {
      logger.error('영수증 업로드 실패', {
        error: error.message,
        organizationId: receiptData.organizationId,
        userId
      });
      throw error;
    }
  }

  /**
   * AI 기반 영수증 처리
   * @param {String} receiptId - 영수증 ID
   * @returns {Promise<Object>} 처리된 영수증
   */
  async processReceiptWithAI(receiptId) {
    try {
      logger.info('AI 영수증 처리 시작', { receiptId });

      const receipt = await Receipt.findById(receiptId);
      if (!receipt) {
        throw new Error('영수증을 찾을 수 없습니다.');
      }

      // AI 처리 실행
      await receipt.processWithAI();

      // 자동 분류 실행
      await receipt.autoClassify();

      // 검증 실행
      receipt.validateReceipt();

      const processedReceipt = await receipt.save();

      logger.info('AI 영수증 처리 완료', {
        receiptId,
        confidence: processedReceipt.aiRecognition.confidence,
        isClassified: processedReceipt.autoClassification.isClassified
      });

      return processedReceipt;
    } catch (error) {
      logger.error('AI 영수증 처리 실패', {
        error: error.message,
        receiptId
      });
      throw error;
    }
  }

  /**
   * 영수증 수동 분류
   * @param {String} receiptId - 영수증 ID
   * @param {Object} classificationData - 분류 데이터
   * @param {String} userId - 분류자 ID
   * @returns {Promise<Object>} 분류된 영수증
   */
  async classifyReceipt(receiptId, classificationData, userId) {
    try {
      logger.info('영수증 수동 분류 시작', { receiptId, userId });

      const receipt = await Receipt.findById(receiptId);
      if (!receipt) {
        throw new Error('영수증을 찾을 수 없습니다.');
      }

      // 분류 데이터 업데이트
      Object.assign(receipt.autoClassification, {
        ...classificationData,
        isClassified: true,
        classifiedAt: new Date(),
        classificationMethod: 'Manual',
        confidence: 1.0
      });

      receipt.lastModifiedBy = userId;
      const classifiedReceipt = await receipt.save();

      logger.info('영수증 수동 분류 완료', { receiptId });

      return classifiedReceipt;
    } catch (error) {
      logger.error('영수증 수동 분류 실패', {
        error: error.message,
        receiptId,
        userId
      });
      throw error;
    }
  }

  /**
   * 영수증 검토
   * @param {String} receiptId - 영수증 ID
   * @param {Object} reviewData - 검토 데이터
   * @param {String} userId - 검토자 ID
   * @returns {Promise<Object>} 검토된 영수증
   */
  async reviewReceipt(receiptId, reviewData, userId) {
    try {
      logger.info('영수증 검토 시작', { receiptId, userId });

      const receipt = await Receipt.findById(receiptId);
      if (!receipt) {
        throw new Error('영수증을 찾을 수 없습니다.');
      }

      // 검토 데이터 업데이트
      Object.assign(receipt.review, {
        ...reviewData,
        isReviewed: true,
        reviewedAt: new Date(),
        reviewedBy: userId
      });

      receipt.lastModifiedBy = userId;
      const reviewedReceipt = await receipt.save();

      logger.info('영수증 검토 완료', {
        receiptId,
        reviewStatus: reviewedReceipt.review.reviewStatus
      });

      return reviewedReceipt;
    } catch (error) {
      logger.error('영수증 검토 실패', {
        error: error.message,
        receiptId,
        userId
      });
      throw error;
    }
  }

  /**
   * 영수증 회계 전표 생성
   * @param {String} receiptId - 영수증 ID
   * @param {String} userId - 처리자 ID
   * @returns {Promise<Object>} 생성된 전표
   */
  async createTransactionFromReceipt(receiptId, userId) {
    try {
      logger.info('영수증 전표 생성 시작', { receiptId, userId });

      const receipt = await Receipt.findById(receiptId);
      if (!receipt) {
        throw new Error('영수증을 찾을 수 없습니다.');
      }

      // 분류 완료 확인
      if (!receipt.autoClassification.isClassified) {
        throw new Error('분류되지 않은 영수증은 전표를 생성할 수 없습니다.');
      }

      // 전표 생성
      const transaction = await receipt.createTransaction();

      logger.info('영수증 전표 생성 완료', {
        receiptId,
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber
      });

      return transaction;
    } catch (error) {
      logger.error('영수증 전표 생성 실패', {
        error: error.message,
        receiptId,
        userId
      });
      throw error;
    }
  }

  /**
   * 영수증 일괄 처리
   * @param {Array} receiptIds - 영수증 ID 목록
   * @param {String} userId - 처리자 ID
   * @returns {Promise<Object>} 처리 결과
   */
  async batchProcessReceipts(receiptIds, userId) {
    try {
      logger.info('영수증 일괄 처리 시작', {
        receiptCount: receiptIds.length,
        userId
      });

      const results = {
        processed: 0,
        failed: 0,
        errors: []
      };

      for (const receiptId of receiptIds) {
        try {
          await this.processReceiptWithAI(receiptId);
          results.processed++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            receiptId,
            error: error.message
          });
        }
      }

      logger.info('영수증 일괄 처리 완료', {
        processed: results.processed,
        failed: results.failed
      });

      return results;
    } catch (error) {
      logger.error('영수증 일괄 처리 실패', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 영수증 일괄 전표 생성
   * @param {Array} receiptIds - 영수증 ID 목록
   * @param {String} userId - 처리자 ID
   * @returns {Promise<Object>} 처리 결과
   */
  async batchCreateTransactions(receiptIds, userId) {
    try {
      logger.info('영수증 일괄 전표 생성 시작', {
        receiptCount: receiptIds.length,
        userId
      });

      const results = {
        created: 0,
        failed: 0,
        errors: []
      };

      for (const receiptId of receiptIds) {
        try {
          await this.createTransactionFromReceipt(receiptId, userId);
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            receiptId,
            error: error.message
          });
        }
      }

      logger.info('영수증 일괄 전표 생성 완료', {
        created: results.created,
        failed: results.failed
      });

      return results;
    } catch (error) {
      logger.error('영수증 일괄 전표 생성 실패', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 영수증 조회
   * @param {String} organizationId - 조직 ID
   * @param {Object} filters - 필터 조건
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 영수증 목록 및 페이징 정보
   */
  async getReceipts(organizationId, filters = {}, options = {}) {
    try {
      const {
        startDate,
        endDate,
        status,
        isProcessed,
        isClassified,
        isPosted,
        page = 1,
        limit = 20,
        sortBy = 'transaction.transactionDate',
        sortOrder = 'desc'
      } = options;

      // 쿼리 조건 구성
      const query = { organizationId };

      if (startDate && endDate) {
        query['transaction.transactionDate'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      if (status) {
        query.status = status;
      }

      if (isProcessed !== undefined) {
        query['aiRecognition.isProcessed'] = isProcessed;
      }

      if (isClassified !== undefined) {
        query['autoClassification.isClassified'] = isClassified;
      }

      if (isPosted !== undefined) {
        query['accounting.isPosted'] = isPosted;
      }

      // 정렬 조건
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 페이징
      const skip = (page - 1) * limit;

      // 영수증 조회
      const receipts = await Receipt.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email');

      // 전체 개수 조회
      const total = await Receipt.countDocuments(query);

      logger.info('영수증 조회 완료', {
        organizationId,
        count: receipts.length,
        total
      });

      return {
        receipts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('영수증 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 미처리 영수증 조회
   * @param {String} organizationId - 조직 ID
   * @returns {Promise<Array>} 미처리 영수증 목록
   */
  async getUnprocessedReceipts(organizationId) {
    try {
      logger.info('미처리 영수증 조회 시작', { organizationId });

      const unprocessedReceipts = await Receipt.findUnprocessed(organizationId);

      logger.info('미처리 영수증 조회 완료', {
        organizationId,
        count: unprocessedReceipts.length
      });

      return unprocessedReceipts;
    } catch (error) {
      logger.error('미처리 영수증 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 미분류 영수증 조회
   * @param {String} organizationId - 조직 ID
   * @returns {Promise<Array>} 미분류 영수증 목록
   */
  async getUnclassifiedReceipts(organizationId) {
    try {
      logger.info('미분류 영수증 조회 시작', { organizationId });

      const unclassifiedReceipts = await Receipt.findUnclassified(organizationId);

      logger.info('미분류 영수증 조회 완료', {
        organizationId,
        count: unclassifiedReceipts.length
      });

      return unclassifiedReceipts;
    } catch (error) {
      logger.error('미분류 영수증 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 미전표 영수증 조회
   * @param {String} organizationId - 조직 ID
   * @returns {Promise<Array>} 미전표 영수증 목록
   */
  async getUnpostedReceipts(organizationId) {
    try {
      logger.info('미전표 영수증 조회 시작', { organizationId });

      const unpostedReceipts = await Receipt.findUnposted(organizationId);

      logger.info('미전표 영수증 조회 완료', {
        organizationId,
        count: unpostedReceipts.length
      });

      return unpostedReceipts;
    } catch (error) {
      logger.error('미전표 영수증 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 영수증 통계 조회
   * @param {String} organizationId - 조직 ID
   * @param {Date} startDate - 시작일
   * @param {Date} endDate - 종료일
   * @returns {Promise<Object>} 영수증 통계
   */
  async getReceiptStats(organizationId, startDate, endDate) {
    try {
      logger.info('영수증 통계 조회 시작', {
        organizationId,
        startDate,
        endDate
      });

      // 전체 영수증 수
      const totalReceipts = await Receipt.countDocuments({
        organizationId,
        'transaction.transactionDate': { $gte: startDate, $lte: endDate }
      });

      // AI 처리 완료 수
      const processedReceipts = await Receipt.countDocuments({
        organizationId,
        'transaction.transactionDate': { $gte: startDate, $lte: endDate },
        'aiRecognition.isProcessed': true
      });

      // 분류 완료 수
      const classifiedReceipts = await Receipt.countDocuments({
        organizationId,
        'transaction.transactionDate': { $gte: startDate, $lte: endDate },
        'autoClassification.isClassified': true
      });

      // 전표 생성 완료 수
      const postedReceipts = await Receipt.countDocuments({
        organizationId,
        'transaction.transactionDate': { $gte: startDate, $lte: endDate },
        'accounting.isPosted': true
      });

      // 총 금액
      const receipts = await Receipt.find({
        organizationId,
        'transaction.transactionDate': { $gte: startDate, $lte: endDate }
      });

      const totalAmount = receipts.reduce((sum, receipt) => {
        return sum + (receipt.transaction.totalAmount || 0);
      }, 0);

      const stats = {
        totalReceipts,
        processedReceipts,
        classifiedReceipts,
        postedReceipts,
        totalAmount,
        processingRate: totalReceipts > 0 ? (processedReceipts / totalReceipts) * 100 : 0,
        classificationRate: totalReceipts > 0 ? (classifiedReceipts / totalReceipts) * 100 : 0,
        postingRate: totalReceipts > 0 ? (postedReceipts / totalReceipts) * 100 : 0
      };

      logger.info('영수증 통계 조회 완료', {
        organizationId,
        totalReceipts,
        totalAmount
      });

      return stats;
    } catch (error) {
      logger.error('영수증 통계 조회 실패', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 이미지 파일 처리
   * @param {Array} files - 업로드된 파일들
   * @returns {Promise<Array>} 처리된 이미지 정보
   */
  async processImages(files) {
    try {
      const processedImages = [];

      for (const file of files) {
        // 파일 유효성 검증
        if (!file.mimetype.startsWith('image/')) {
          throw new Error('이미지 파일만 업로드 가능합니다.');
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
        }

        // 파일명 생성
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        
        // 실제 구현에서는 파일을 스토리지에 업로드
        const imageUrl = `/uploads/receipts/${filename}`;
        const thumbnailUrl = `/uploads/receipts/thumbnails/${filename}`;

        processedImages.push({
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: imageUrl,
          thumbnailUrl,
          uploadedAt: new Date(),
          ocrProcessed: false
        });
      }

      return processedImages;
    } catch (error) {
      logger.error('이미지 파일 처리 실패', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ReceiptService(); 