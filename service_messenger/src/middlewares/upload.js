// 파일 업로드 미들웨어 (multer 기반)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 파일 타입별 하위 디렉토리
    let subDir = 'general';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.includes('document') || file.mimetype.includes('pdf')) {
      subDir = 'documents';
    }
    
    const targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지: timestamp + originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  // 허용된 파일 타입
  const allowedMimeTypes = [
    // 이미지
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // 문서
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // 압축파일
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // 기타
    'application/json', 'application/xml'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`지원하지 않는 파일 타입입니다: ${file.mimetype}`), false);
  }
};

// 파일 크기 제한 (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 10 // 최대 10개 파일
};

// multer 인스턴스 생성
const upload = multer({
  storage,
  fileFilter,
  limits
});

// 단일 파일 업로드
const uploadSingle = upload.single('file');

// 다중 파일 업로드
const uploadMultiple = upload.array('files', 10);

// 파일 업로드 미들웨어 래퍼
const uploadMiddleware = (type = 'single') => {
  return (req, res, next) => {
    const uploadFunc = type === 'multiple' ? uploadMultiple : uploadSingle;
    
    uploadFunc(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // multer 에러 처리
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: { message: '파일 크기가 제한을 초과했습니다. (최대 10MB)' }
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: { message: '파일 개수가 제한을 초과했습니다. (최대 10개)' }
          });
        }
        return res.status(400).json({
          success: false,
          error: { message: '파일 업로드 중 오류가 발생했습니다.' }
        });
      } else if (err) {
        // 기타 에러 처리
        return res.status(400).json({
          success: false,
          error: { message: err.message }
        });
      }
      
      // 파일 정보를 req.body에 추가
      if (req.file) {
        req.body.attachments = [{
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        }];
      } else if (req.files) {
        req.body.attachments = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }));
      }
      
      next();
    });
  };
};

module.exports = {
  upload,
  uploadMiddleware,
  uploadSingle,
  uploadMultiple
}; 