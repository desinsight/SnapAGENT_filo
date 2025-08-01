# Web API 개발 가이드 (ES 모듈 환경)

이 문서는 web-api(Express 서버)에서 기능 추가/고도화/유지보수 시 모듈/환경 문제를 최소화하고, 오직 비즈니스 로직 개발에 집중할 수 있도록 작성된 가이드입니다.

---

## 1. ES 모듈(ECMAScript Module) 환경 원칙
- 반드시 `import`/`export`만 사용하세요. (require/module.exports 금지)
- `package.json`에 `"type": "module"`이 명시되어 있습니다.
- Node.js 내장 모듈도 모두 import로 사용해야 합니다.
  - 예시: `import { promises as fs } from 'fs';`
  - 예시: `import path from 'path';`

## 2. 서비스/라우터/유틸 파일 작성 규칙
- 클래스/객체/함수는 반드시 `export default` 또는 `export`로 내보내세요.
- 다른 파일에서 사용할 때는 `import ... from ...` 또는 `import { ... } from ...`으로 불러오세요.
- 예시:
  ```js
  // 서비스 파일
  class MyService { ... }
  export default new MyService();

  // 라우터 파일
  import express from 'express';
  const router = express.Router();
  // ...
  export default router;
  ```

## 3. CommonJS 코드 사용 금지
- `const ... = require('...')` → ❌
- `module.exports = ...` → ❌
- 반드시 import/export만 사용

## 4. Node.js 내장 모듈 import 예시
- `import { promises as fs } from 'fs';`
- `import path from 'path';`
- `import os from 'os';`

## 5. 외부 라이브러리 import 예시
- `import axios from 'axios';`
- `import jwt from 'jsonwebtoken';`

## 6. 기능 추가/고도화 시 체크리스트
- [ ] 새 파일/모듈 작성 시 반드시 import/export 사용
- [ ] 기존 코드 복붙 시 require/module.exports가 남아있지 않은지 확인
- [ ] 서비스/라우터/유틸 모두 export default 또는 export로 내보내기
- [ ] Node.js 내장 모듈도 import로만 사용
- [ ] 에러 발생 시 "require is not defined" 또는 "does not provide an export named 'default'" 메시지에 주의

## 7. 기타 권장 사항
- 기능 개발에만 집중할 수 있도록, 모듈/환경 문제는 이 가이드에 따라 한 번만 확실히 정리
- 코드 리뷰 시 require/module.exports 사용 여부 반드시 체크
- 문제가 생기면 README 가이드대로 import/export 구조를 재점검

---

이 가이드만 따르면, web-api 개발 시 모듈/환경 문제 없이 오직 기능 개발에만 집중할 수 있습니다! 