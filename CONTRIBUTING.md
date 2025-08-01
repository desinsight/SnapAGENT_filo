# 기여 가이드 (Contributing Guide)

## 🎯 기여 방법

Web MCP Server 프로젝트에 기여하고 싶으시다면 감사합니다! 이 문서는 기여 과정을 안내합니다.

## 📋 기여 전 체크리스트

- [ ] Node.js 18.0.0 이상 설치
- [ ] Git 최신 버전 설치
- [ ] 프로젝트 README.md 읽기
- [ ] 기존 이슈 확인

## 🚀 개발 환경 설정

### 1. 저장소 포크 및 클론

```bash
# GitHub에서 저장소 포크
# 그 후 로컬에 클론
git clone https://github.com/YOUR_USERNAME/web-mcp-server.git
cd web-mcp-server
```

### 2. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 워크스페이스 의존성 설치
npm run install:workspaces
```

### 3. 개발 서버 실행

```bash
# Electron 앱 개발
npm run dev:electron

# 웹 버전 개발
npm run dev:web

# 백엔드 개발
npm run dev:backend

# 전체 개발 환경
npm run dev:all
```

## 🔄 기여 워크플로우

### 1. 이슈 생성 또는 확인

- 새로운 기능: "Feature Request" 라벨로 이슈 생성
- 버그 수정: "Bug" 라벨로 이슈 생성
- 기존 이슈 확인 후 작업 시작

### 2. 브랜치 생성

```bash
# 메인 브랜치에서 최신 상태로 업데이트
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/your-feature-name
# 또는
git checkout -b fix/your-bug-fix
```

### 3. 개발 및 테스트

```bash
# 개발 중 테스트 실행
npm run test

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format
```

### 4. 커밋 메시지 작성

커밋 메시지는 다음 형식을 따릅니다:

```
type(scope): description

[optional body]

[optional footer]
```

**타입 예시:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

**예시:**
```
feat(electron): add file drag and drop functionality

- Implement drag and drop for file upload
- Add visual feedback during drag operation
- Support multiple file selection

Closes #123
```

### 5. 푸시 및 Pull Request 생성

```bash
# 변경사항 푸시
git push origin feature/your-feature-name
```

GitHub에서 Pull Request를 생성하고 다음을 포함하세요:

- **제목**: 명확하고 간결한 설명
- **설명**: 변경사항 상세 설명
- **관련 이슈**: `Closes #123` 또는 `Fixes #123`
- **체크리스트**: 완료된 작업들

## 📝 코딩 스타일 가이드

### JavaScript/TypeScript

- **ESLint** 규칙 준수
- **Prettier** 포맷팅 사용
- 함수형 프로그래밍 선호
- 명확한 변수명 사용

### React 컴포넌트

```jsx
// 함수형 컴포넌트 사용
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialState);
  
  // useEffect로 사이드 이펙트 처리
  useEffect(() => {
    // 로직
  }, [dependencies]);
  
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### CSS/Styling

- **Tailwind CSS** 사용
- 컴포넌트별 스타일 모듈화
- 반응형 디자인 고려

## 🧪 테스트 가이드

### 테스트 작성 원칙

- 각 기능에 대한 단위 테스트 작성
- 통합 테스트로 컴포넌트 간 상호작용 검증
- E2E 테스트로 사용자 시나리오 검증

### 테스트 실행

```bash
# 전체 테스트
npm run test

# 특정 테스트
npm run test:electron
npm run test:web
npm run test:backend

# 테스트 커버리지
npm run test:coverage
```

## 🔍 코드 리뷰 프로세스

### 리뷰어 체크리스트

- [ ] 코드가 요구사항을 충족하는가?
- [ ] 테스트가 적절히 작성되었는가?
- [ ] 문서가 업데이트되었는가?
- [ ] 성능에 영향을 주지 않는가?
- [ ] 보안 문제가 없는가?

### 리뷰어 코멘트 작성

- **건설적이고 존중하는 톤** 사용
- **구체적인 개선 제안** 제공
- **긍정적인 피드백** 포함

## 🚀 배포 프로세스

### 릴리스 준비

1. **버전 업데이트**
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

2. **CHANGELOG 업데이트**
   - 주요 변경사항 기록
   - 새로운 기능 설명
   - 버그 수정 목록

3. **빌드 및 테스트**
   ```bash
   npm run build
   npm run test
   ```

### 배포

- **main 브랜치**에 머지 시 자동 배포
- **태그** 생성으로 릴리스 버전 관리

## 🆘 도움이 필요하신가요?

- **이슈 생성**: 버그 리포트 또는 기능 요청
- **토론**: GitHub Discussions 활용
- **문서**: Wiki 페이지 참조

## 📄 라이선스

기여하시는 모든 코드는 프로젝트의 MIT 라이선스 하에 배포됩니다.

---

**감사합니다!** 🎉

Web MCP Server 프로젝트에 기여해주셔서 감사합니다. 여러분의 기여가 프로젝트를 더욱 훌륭하게 만들어줍니다. 