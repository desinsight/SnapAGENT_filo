// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';

// 데이터베이스 설정
process.env.MONGODB_URI = 'mongodb://localhost:27017/accounting_test';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/accounting_test';

// JWT 설정
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// API 키 설정
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.CLAUDE_API_KEY = 'test-claude-api-key';
process.env.OCR_API_KEY = 'test-ocr-api-key';

// 국세청 API 설정
process.env.NTS_BASE_URL = 'https://test-api.hometax.go.kr';
process.env.NTS_API_KEY = 'test-nts-api-key';
process.env.NTS_SECRET_KEY = 'test-nts-secret-key';

// 4대보험 API 설정
process.env.SOCIAL_INSURANCE_BASE_URL = 'https://test-api.nps.or.kr';
process.env.SOCIAL_INSURANCE_API_KEY = 'test-social-insurance-api-key';
process.env.SOCIAL_INSURANCE_SECRET_KEY = 'test-social-insurance-secret-key';

// 로깅 설정
process.env.LOG_LEVEL = 'error';

// 파일 업로드 설정
process.env.UPLOAD_PATH = './uploads/test';
process.env.MAX_FILE_SIZE = '10485760'; // 10MB

// Redis 설정 (테스트용)
process.env.REDIS_URL = 'redis://localhost:6379/1';

// 이메일 설정 (테스트용)
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// 외부 서비스 URL (테스트용)
process.env.EXTERNAL_API_BASE_URL = 'https://test-api.example.com';

// 테스트 데이터베이스 초기화
process.env.TEST_DB_NAME = 'accounting_test';

// 테스트 모드 플래그
process.env.TEST_MODE = 'true';

// 모킹 설정
process.env.MOCK_EXTERNAL_APIS = 'true';

// 성능 테스트 설정
process.env.PERFORMANCE_TEST = 'false';

// 보안 테스트 설정
process.env.SECURITY_TEST = 'false';

// 통합 테스트 설정
process.env.INTEGRATION_TEST = 'false';

// 단위 테스트 설정
process.env.UNIT_TEST = 'true';

// 커버리지 설정
process.env.COVERAGE = 'true';

// 디버그 설정
process.env.DEBUG = 'false';

// 타임아웃 설정
process.env.TEST_TIMEOUT = '30000';

// 재시도 설정
process.env.TEST_RETRY_TIMES = '1';

// 병렬 처리 설정
process.env.TEST_PARALLEL = 'false';

// 캐시 설정
process.env.TEST_CACHE = 'true';

// 로그 설정
process.env.TEST_LOG_LEVEL = 'error';

// 파일 시스템 설정
process.env.TEST_TEMP_DIR = './temp/test';

// 네트워크 설정
process.env.TEST_NETWORK_TIMEOUT = '5000';

// 메모리 설정
process.env.TEST_MEMORY_LIMIT = '512';

// CPU 설정
process.env.TEST_CPU_LIMIT = '1';

// 디스크 설정
process.env.TEST_DISK_LIMIT = '1024';

// 네트워크 설정
process.env.TEST_NETWORK_LIMIT = '100';

// 프로세스 설정
process.env.TEST_PROCESS_LIMIT = '10';

// 파일 설정
process.env.TEST_FILE_LIMIT = '100';

// 소켓 설정
process.env.TEST_SOCKET_LIMIT = '100';

// 스레드 설정
process.env.TEST_THREAD_LIMIT = '10';

// 워커 설정
process.env.TEST_WORKER_LIMIT = '5';

// 큐 설정
process.env.TEST_QUEUE_LIMIT = '1000';

// 스택 설정
process.env.TEST_STACK_LIMIT = '1000';

// 힙 설정
process.env.TEST_HEAP_LIMIT = '1000';

// 가비지 컬렉션 설정
process.env.TEST_GC_INTERVAL = '1000';

// 프로파일링 설정
process.env.TEST_PROFILING = 'false';

// 트레이싱 설정
process.env.TEST_TRACING = 'false';

// 메트릭 설정
process.env.TEST_METRICS = 'false';

// 알림 설정
process.env.TEST_NOTIFICATIONS = 'false';

// 백업 설정
process.env.TEST_BACKUP = 'false';

// 복구 설정
process.env.TEST_RECOVERY = 'false';

// 마이그레이션 설정
process.env.TEST_MIGRATION = 'false';

// 시드 설정
process.env.TEST_SEED = 'false';

// 픽스처 설정
process.env.TEST_FIXTURES = 'false';

// 스냅샷 설정
process.env.TEST_SNAPSHOTS = 'false';

// 리포터 설정
process.env.TEST_REPORTER = 'default';

// 포맷터 설정
process.env.TEST_FORMATTER = 'default';

// 검증 설정
process.env.TEST_VALIDATION = 'true';

// 검사 설정
process.env.TEST_INSPECTION = 'false';

// 감사 설정
process.env.TEST_AUDIT = 'false';

// 모니터링 설정
process.env.TEST_MONITORING = 'false';

// 알림 설정
process.env.TEST_ALERTS = 'false';

// 로깅 설정
process.env.TEST_LOGGING = 'true';

// 추적 설정
process.env.TEST_TRACKING = 'false';

// 분석 설정
process.env.TEST_ANALYTICS = 'false';

// 리포팅 설정
process.env.TEST_REPORTING = 'false';

// 대시보드 설정
process.env.TEST_DASHBOARD = 'false';

// API 설정
process.env.TEST_API_VERSION = 'v1';

// 웹훅 설정
process.env.TEST_WEBHOOK_URL = 'https://test-webhook.example.com';

// 콜백 설정
process.env.TEST_CALLBACK_URL = 'https://test-callback.example.com';

// 리다이렉트 설정
process.env.TEST_REDIRECT_URL = 'https://test-redirect.example.com';

// CORS 설정
process.env.TEST_CORS_ORIGIN = 'http://localhost:3000';

// 세션 설정
process.env.TEST_SESSION_SECRET = 'test-session-secret';

// 쿠키 설정
process.env.TEST_COOKIE_SECRET = 'test-cookie-secret';

// 암호화 설정
process.env.TEST_ENCRYPTION_KEY = 'test-encryption-key';

// 해시 설정
process.env.TEST_HASH_SALT = 'test-hash-salt';

// 토큰 설정
process.env.TEST_TOKEN_SECRET = 'test-token-secret';

// 키 설정
process.env.TEST_KEY_SECRET = 'test-key-secret';

// 비밀 설정
process.env.TEST_SECRET_KEY = 'test-secret-key';

// 인증 설정
process.env.TEST_AUTH_SECRET = 'test-auth-secret';

// 권한 설정
process.env.TEST_PERMISSION_SECRET = 'test-permission-secret';

// 역할 설정
process.env.TEST_ROLE_SECRET = 'test-role-secret';

// 사용자 설정
process.env.TEST_USER_SECRET = 'test-user-secret';

// 조직 설정
process.env.TEST_ORGANIZATION_SECRET = 'test-organization-secret';

// 계정 설정
process.env.TEST_ACCOUNT_SECRET = 'test-account-secret';

// 거래 설정
process.env.TEST_TRANSACTION_SECRET = 'test-transaction-secret';

// 세무 설정
process.env.TEST_TAX_SECRET = 'test-tax-secret';

// 영수증 설정
process.env.TEST_RECEIPT_SECRET = 'test-receipt-secret';

// AI 설정
process.env.TEST_AI_SECRET = 'test-ai-secret';

// 외부 API 설정
process.env.TEST_EXTERNAL_API_SECRET = 'test-external-api-secret';

// 국세청 설정
process.env.TEST_NTS_SECRET = 'test-nts-secret';

// 4대보험 설정
process.env.TEST_SOCIAL_INSURANCE_SECRET = 'test-social-insurance-secret';

// OCR 설정
process.env.TEST_OCR_SECRET = 'test-ocr-secret';

// 파일 설정
process.env.TEST_FILE_SECRET = 'test-file-secret';

// 업로드 설정
process.env.TEST_UPLOAD_SECRET = 'test-upload-secret';

// 다운로드 설정
process.env.TEST_DOWNLOAD_SECRET = 'test-download-secret';

// 백업 설정
process.env.TEST_BACKUP_SECRET = 'test-backup-secret';

// 복구 설정
process.env.TEST_RECOVERY_SECRET = 'test-recovery-secret';

// 마이그레이션 설정
process.env.TEST_MIGRATION_SECRET = 'test-migration-secret';

// 시드 설정
process.env.TEST_SEED_SECRET = 'test-seed-secret';

// 픽스처 설정
process.env.TEST_FIXTURE_SECRET = 'test-fixture-secret';

// 스냅샷 설정
process.env.TEST_SNAPSHOT_SECRET = 'test-snapshot-secret';

// 리포터 설정
process.env.TEST_REPORTER_SECRET = 'test-reporter-secret';

// 포맷터 설정
process.env.TEST_FORMATTER_SECRET = 'test-formatter-secret';

// 검증 설정
process.env.TEST_VALIDATION_SECRET = 'test-validation-secret';

// 검사 설정
process.env.TEST_INSPECTION_SECRET = 'test-inspection-secret';

// 감사 설정
process.env.TEST_AUDIT_SECRET = 'test-audit-secret';

// 모니터링 설정
process.env.TEST_MONITORING_SECRET = 'test-monitoring-secret';

// 알림 설정
process.env.TEST_ALERT_SECRET = 'test-alert-secret';

// 로깅 설정
process.env.TEST_LOGGING_SECRET = 'test-logging-secret';

// 추적 설정
process.env.TEST_TRACKING_SECRET = 'test-tracking-secret';

// 분석 설정
process.env.TEST_ANALYTICS_SECRET = 'test-analytics-secret';

// 리포팅 설정
process.env.TEST_REPORTING_SECRET = 'test-reporting-secret';

// 대시보드 설정
process.env.TEST_DASHBOARD_SECRET = 'test-dashboard-secret';

// API 설정
process.env.TEST_API_SECRET = 'test-api-secret';

// 웹훅 설정
process.env.TEST_WEBHOOK_SECRET = 'test-webhook-secret';

// 콜백 설정
process.env.TEST_CALLBACK_SECRET = 'test-callback-secret';

// 리다이렉트 설정
process.env.TEST_REDIRECT_SECRET = 'test-redirect-secret';

// CORS 설정
process.env.TEST_CORS_SECRET = 'test-cors-secret';

// 세션 설정
process.env.TEST_SESSION_SECRET_KEY = 'test-session-secret-key';

// 쿠키 설정
process.env.TEST_COOKIE_SECRET_KEY = 'test-cookie-secret-key';

// 암호화 설정
process.env.TEST_ENCRYPTION_SECRET_KEY = 'test-encryption-secret-key';

// 해시 설정
process.env.TEST_HASH_SECRET_KEY = 'test-hash-secret-key';

// 토큰 설정
process.env.TEST_TOKEN_SECRET_KEY = 'test-token-secret-key';

// 키 설정
process.env.TEST_KEY_SECRET_KEY = 'test-key-secret-key';

// 비밀 설정
process.env.TEST_SECRET_SECRET_KEY = 'test-secret-secret-key';

// 인증 설정
process.env.TEST_AUTH_SECRET_KEY = 'test-auth-secret-key';

// 권한 설정
process.env.TEST_PERMISSION_SECRET_KEY = 'test-permission-secret-key';

// 역할 설정
process.env.TEST_ROLE_SECRET_KEY = 'test-role-secret-key';

// 사용자 설정
process.env.TEST_USER_SECRET_KEY = 'test-user-secret-key';

// 조직 설정
process.env.TEST_ORGANIZATION_SECRET_KEY = 'test-organization-secret-key';

// 계정 설정
process.env.TEST_ACCOUNT_SECRET_KEY = 'test-account-secret-key';

// 거래 설정
process.env.TEST_TRANSACTION_SECRET_KEY = 'test-transaction-secret-key';

// 세무 설정
process.env.TEST_TAX_SECRET_KEY = 'test-tax-secret-key';

// 영수증 설정
process.env.TEST_RECEIPT_SECRET_KEY = 'test-receipt-secret-key';

// AI 설정
process.env.TEST_AI_SECRET_KEY = 'test-ai-secret-key';

// 외부 API 설정
process.env.TEST_EXTERNAL_API_SECRET_KEY = 'test-external-api-secret-key';

// 국세청 설정
process.env.TEST_NTS_SECRET_KEY = 'test-nts-secret-key';

// 4대보험 설정
process.env.TEST_SOCIAL_INSURANCE_SECRET_KEY = 'test-social-insurance-secret-key';

// OCR 설정
process.env.TEST_OCR_SECRET_KEY = 'test-ocr-secret-key';

// 파일 설정
process.env.TEST_FILE_SECRET_KEY = 'test-file-secret-key';

// 업로드 설정
process.env.TEST_UPLOAD_SECRET_KEY = 'test-upload-secret-key';

// 다운로드 설정
process.env.TEST_DOWNLOAD_SECRET_KEY = 'test-download-secret-key';

// 백업 설정
process.env.TEST_BACKUP_SECRET_KEY = 'test-backup-secret-key';

// 복구 설정
process.env.TEST_RECOVERY_SECRET_KEY = 'test-recovery-secret-key';

// 마이그레이션 설정
process.env.TEST_MIGRATION_SECRET_KEY = 'test-migration-secret-key';

// 시드 설정
process.env.TEST_SEED_SECRET_KEY = 'test-seed-secret-key';

// 픽스처 설정
process.env.TEST_FIXTURE_SECRET_KEY = 'test-fixture-secret-key';

// 스냅샷 설정
process.env.TEST_SNAPSHOT_SECRET_KEY = 'test-snapshot-secret-key';

// 리포터 설정
process.env.TEST_REPORTER_SECRET_KEY = 'test-reporter-secret-key';

// 포맷터 설정
process.env.TEST_FORMATTER_SECRET_KEY = 'test-formatter-secret-key';

// 검증 설정
process.env.TEST_VALIDATION_SECRET_KEY = 'test-validation-secret-key';

// 검사 설정
process.env.TEST_INSPECTION_SECRET_KEY = 'test-inspection-secret-key';

// 감사 설정
process.env.TEST_AUDIT_SECRET_KEY = 'test-audit-secret-key';

// 모니터링 설정
process.env.TEST_MONITORING_SECRET_KEY = 'test-monitoring-secret-key';

// 알림 설정
process.env.TEST_ALERT_SECRET_KEY = 'test-alert-secret-key';

// 로깅 설정
process.env.TEST_LOGGING_SECRET_KEY = 'test-logging-secret-key';

// 추적 설정
process.env.TEST_TRACKING_SECRET_KEY = 'test-tracking-secret-key';

// 분석 설정
process.env.TEST_ANALYTICS_SECRET_KEY = 'test-analytics-secret-key';

// 리포팅 설정
process.env.TEST_REPORTING_SECRET_KEY = 'test-reporting-secret-key';

// 대시보드 설정
process.env.TEST_DASHBOARD_SECRET_KEY = 'test-dashboard-secret-key';

// API 설정
process.env.TEST_API_SECRET_KEY = 'test-api-secret-key';

// 웹훅 설정
process.env.TEST_WEBHOOK_SECRET_KEY = 'test-webhook-secret-key';

// 콜백 설정
process.env.TEST_CALLBACK_SECRET_KEY = 'test-callback-secret-key';

// 리다이렉트 설정
process.env.TEST_REDIRECT_SECRET_KEY = 'test-redirect-secret-key';

// CORS 설정
process.env.TEST_CORS_SECRET_KEY = 'test-cors-secret-key';

console.log('테스트 환경 변수가 설정되었습니다.'); 