// upload.js
// 파일 업로드 미들웨어 - 캘린더 앱 첨부파일 처리

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 커스텀 에러 클래스 정의
class UploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UploadError';
    this.statusCode = statusCode;
  }
}

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads');

/**
 * 업로드 디렉토리 생성 및 확인
 */
const ensureUploadDirectory = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('업로드 디렉토리가 생성되었습니다:', uploadDir);
    }
  } catch (error) {
    console.error('업로드 디렉토리 생성 오류:', error);
    throw new UploadError('업로드 디렉토리를 생성할 수 없습니다', 500);
  }
};

// 디렉토리 생성
ensureUploadDirectory();

/**
 * 허용된 파일 타입 정의
 */
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentation: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

/**
 * 허용된 파일 확장자 정의
 */
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.txt',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.zip', '.rar', '.7z'
];

/**
 * 파일 타입 검증
 * @param {string} mimetype - 파일 MIME 타입
 * @returns {boolean} 허용된 파일 타입 여부
 */
const isValidFileType = (mimetype) => {
  try {
    if (!mimetype || typeof mimetype !== 'string') {
      return false;
    }
    
    const allowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
    return allowedTypes.includes(mimetype.toLowerCase());
  } catch (error) {
    console.error('파일 타입 검증 오류:', error);
    return false;
  }
};

/**
 * 파일 확장자 검증
 * @param {string} filename - 파일명
 * @returns {boolean} 허용된 확장자 여부
 */
const isValidFileExtension = (filename) => {
  try {
    if (!filename || typeof filename !== 'string') {
      return false;
    }
    
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  } catch (error) {
    console.error('파일 확장자 검증 오류:', error);
    return false;
  }
};

/**
 * 안전한 파일명 생성
 * @param {string} originalname - 원본 파일명
 * @returns {string} 안전한 파일명
 */
const generateSafeFilename = (originalname) => {
  try {
    if (!originalname || typeof originalname !== 'string') {
      throw new Error('유효하지 않은 파일명입니다');
    }
    
    const ext = path.extname(originalname).toLowerCase();
    const nameWithoutExt = path.basename(originalname, ext);
    
    // 특수문자 제거 및 안전한 문자로 변환
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9가-힣]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50); // 최대 50자로 제한
    
    const uniqueId = uuidv4().replace(/-/g, '');
    const timestamp = Date.now();
    
    return `${timestamp}_${uniqueId}_${safeName}${ext}`;
  } catch (error) {
    console.error('안전한 파일명 생성 오류:', error);
    const uniqueId = uuidv4().replace(/-/g, '');
    const timestamp = Date.now();
    return `${timestamp}_${uniqueId}_file`;
  }
};

/**
 * 파일 크기 검증
 * @param {number} fileSize - 파일 크기 (bytes)
 * @param {number} maxSize - 최대 허용 크기 (bytes)
 * @returns {boolean} 허용된 크기 여부
 */
const isValidFileSize = (fileSize, maxSize) => {
  try {
    if (typeof fileSize !== 'number' || fileSize < 0) {
      return false;
    }
    
    if (typeof maxSize !== 'number' || maxSize <= 0) {
      return false;
    }
    
    return fileSize <= maxSize;
  } catch (error) {
    console.error('파일 크기 검증 오류:', error);
    return false;
  }
};

/**
 * 파일 필터링 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} file - 업로드된 파일 객체
 * @param {Function} cb - 콜백 함수
 */
const fileFilter = (req, file, cb) => {
  try {
    // 파일 타입 검증
    if (!isValidFileType(file.mimetype)) {
      return cb(new UploadError(`지원하지 않는 파일 타입입니다: ${file.mimetype}`, 400), false);
    }
    
    // 파일 확장자 검증
    if (!isValidFileExtension(file.originalname)) {
      return cb(new UploadError(`지원하지 않는 파일 확장자입니다: ${path.extname(file.originalname)}`, 400), false);
    }
    
    // 파일 크기 검증 (기본 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size && !isValidFileSize(file.size, maxSize)) {
      return cb(new UploadError(`파일 크기가 너무 큽니다. 최대 ${maxSize / (1024 * 1024)}MB까지 허용됩니다.`, 400), false);
    }
    
    // 파일 정보 로깅
    console.log(`파일 업로드 시도: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
    
    cb(null, true);
  } catch (error) {
    console.error('파일 필터링 오류:', error);
    cb(new UploadError('파일 검증 중 오류가 발생했습니다', 500), false);
  }
};

/**
 * 디스크 스토리지 설정
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // 업로드 디렉토리 재확인
      ensureUploadDirectory();
      cb(null, uploadDir);
    } catch (error) {
      console.error('업로드 디렉토리 설정 오류:', error);
      cb(new UploadError('업로드 디렉토리를 설정할 수 없습니다', 500));
    }
  },
  filename: (req, file, cb) => {
    try {
      const safeFilename = generateSafeFilename(file.originalname);
      console.log(`파일명 생성: ${file.originalname} -> ${safeFilename}`);
      cb(null, safeFilename);
    } catch (error) {
      console.error('파일명 생성 오류:', error);
      cb(new UploadError('파일명을 생성할 수 없습니다', 500));
    }
  }
});

/**
 * 메모리 스토리지 설정 (작은 파일용)
 */
const memoryStorage = multer.memoryStorage();

/**
 * 기본 업로드 설정
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // 최대 5개 파일
    fieldNameSize: 50, // 필드명 최대 길이
    fieldSize: 1024 * 1024, // 필드값 최대 크기 (1MB)
    fields: 10 // 최대 필드 수
  }
});

/**
 * 메모리 업로드 설정 (작은 파일용)
 */
const memoryUpload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1,
    fieldNameSize: 50,
    fieldSize: 1024 * 1024,
    fields: 10
  }
});

/**
 * 단일 파일 업로드 미들웨어
 */
const singleUpload = upload.single('file');

/**
 * 다중 파일 업로드 미들웨어
 */
const multipleUpload = upload.array('files', 5);

/**
 * 필드별 파일 업로드 미들웨어
 */
const fieldsUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 3 },
  { name: 'attachment', maxCount: 5 }
]);

/**
 * 메모리 업로드 미들웨어 (작은 파일용)
 */
const memorySingleUpload = memoryUpload.single('file');

/**
 * 업로드 에러 핸들링 미들웨어
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express 다음 미들웨어 함수
 */
const handleUploadError = (error, req, res, next) => {
  try {
    if (error instanceof multer.MulterError) {
      let message = '파일 업로드 중 오류가 발생했습니다';
      let statusCode = 400;
      
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = '파일 크기가 너무 큽니다';
          break;
        case 'LIMIT_FILE_COUNT':
          message = '업로드할 수 있는 파일 수를 초과했습니다';
          break;
        case 'LIMIT_FIELD_COUNT':
          message = '업로드할 수 있는 필드 수를 초과했습니다';
          break;
        case 'LIMIT_FIELD_SIZE':
          message = '필드 크기가 너무 큽니다';
          break;
        case 'LIMIT_FIELD_NAME_SIZE':
          message = '필드명이 너무 깁니다';
          break;
        default:
          message = '파일 업로드 중 알 수 없는 오류가 발생했습니다';
          statusCode = 500;
      }
      
      return res.status(statusCode).json({
        success: false,
        message,
        code: 'UPLOAD_ERROR',
        details: { code: error.code }
      });
    }
    
    if (error instanceof UploadError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'UPLOAD_ERROR'
      });
    }
    
    // 기타 에러는 다음 미들웨어로 전달
    next(error);
  } catch (handlerError) {
    console.error('업로드 에러 핸들링 오류:', handlerError);
    res.status(500).json({
      success: false,
      message: '파일 업로드 처리 중 오류가 발생했습니다',
      code: 'UPLOAD_ERROR'
    });
  }
};

/**
 * 업로드된 파일 정보 정리 함수
 * @param {Object} file - 업로드된 파일 객체
 * @returns {Object} 정리된 파일 정보
 */
const sanitizeFileInfo = (file) => {
  try {
    if (!file) {
      return null;
    }
    
    return {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('파일 정보 정리 오류:', error);
    return null;
  }
};

module.exports = {
  upload,
  memoryUpload,
  singleUpload,
  multipleUpload,
  fieldsUpload,
  memorySingleUpload,
  handleUploadError,
  sanitizeFileInfo,
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
  isValidFileType,
  isValidFileExtension,
  isValidFileSize,
  generateSafeFilename
}; 