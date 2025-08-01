// plugins/index.js
// 플러그인 자동 로딩 및 관리 구조 샘플
// 신규 플러그인 추가 시 이 파일에서 자동으로 불러와서 서비스에 연결할 수 있도록 설계

const fs = require('fs');
const path = require('path');

const plugins = {};

// plugins 폴더 내 *.js 파일 자동 로딩 (README.md, index.js 제외)
fs.readdirSync(__dirname).forEach(file => {
  if (
    file.endsWith('.js') &&
    file !== 'index.js' &&
    file !== 'README.md'
  ) {
    const pluginName = path.basename(file, '.js');
    plugins[pluginName] = require('./' + file);
  }
});

// 플러그인 사용 예시:
// plugins['notification'].handleEvent(...)
// plugins['fileStorage'].init(...)

// 신규 플러그인 추가 시, 반드시 공통 인터페이스(README.md 참고) 구현 권장

module.exports = plugins; 