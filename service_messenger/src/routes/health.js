// 헬스체크 라우터 (상태, 버전, 환경 등 추가 정보)
const express = require('express');
const router = express.Router();

// 빌드/배포 정보 (실제 운영시 자동화로 주입 가능)
const SERVICE_VERSION = process.env.npm_package_version || '0.1.0';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const NODE_ENV = process.env.NODE_ENV || 'development';

// GET /health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'service-messenger',
    version: SERVICE_VERSION,
    env: NODE_ENV,
    buildTime: BUILD_TIME,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 