# 플러그인 구조 및 확장성 가이드

// 이 파일은 service_messenger의 플러그인 구조와 확장성 설계 가이드입니다.
//
// - 각 플러그인은 src/plugins/ 하위에 파일로 추가하며, 외부 서비스 연동/확장 기능을 담당합니다.
// - 플러그인은 반드시 export function 또는 module.exports로 외부에 명확히 노출해야 하며,
//   플러그인별로 공통 인터페이스(예: init, handleEvent, getMetadata 등)를 구현할 수 있습니다.
// - 예시: notification.js, fileStorage.js 등
// - 신규 플러그인 추가 시, plugins/index.js에서 자동 로딩 구조로 확장 가능하도록 설계 권장
// - 플러그인 간 의존성 최소화, 서비스별 분리 원칙 준수
// - MCP 및 타 서비스 연동 시, 이벤트 기반/REST API/메시지 큐 등 다양한 방식 지원 가능
//
// 샘플 플러그인 인터페이스 예시:
// module.exports = {
//   init: async (config) => { ... },
//   handleEvent: async (event, data) => { ... },
//   getMetadata: () => ({ name: '플러그인명', version: '1.0.0' })
// };
//
// 플러그인 개발 시, 반드시 주석 및 사용법을 명확히 남겨주세요.

## 목적
- 서비스 내 새로운 기능(알림, 외부 연동 등)을 플러그인 형태로 쉽게 추가/제거/확장할 수 있도록 설계
- MCP 및 타 서비스와의 연동, 사내 정책 변화 등에 유연하게 대응

## 플러그인 예시
- 알림 플러그인 (예: 메시지/댓글 발생 시 외부 알림 서비스 호출)
- 외부 파일 저장소 연동 (예: 파일 첨부 시 별도 파일 서버/클라우드 연동)
- 감사/로깅 플러그인 (중요 이벤트 발생 시 별도 로깅)
- 사내 봇/자동화 플러그인 (예: 특정 키워드 감지 시 자동 응답)

## 구조 예시

```
plugins/
  notification.js      # 알림 플러그인 예시
  fileStorage.js       # 파일 저장소 연동 예시
  ...
```

## 적용 방식
- 서비스 주요 로직에서 플러그인 훅(hook) 호출
- 플러그인 함수는 비동기/동기 모두 지원
- 필요시 config 등으로 활성/비활성 관리

## 예시 코드
```js
// plugins/notification.js
module.exports = async function notify(event, data) {
  // TODO: 외부 알림 서비스 연동
  console.log(`[알림] 이벤트: ${event}`, data);
};

// 서비스 내 사용 예시
const notify = require('../plugins/notification');
notify('message_sent', { roomId, message });
```

---

> ⚠️ 플러그인 구조는 서비스 확장/유지보수/AI 협업에 매우 중요하므로, 모든 주요 이벤트/연동 포인트에 hook을 남길 것! 