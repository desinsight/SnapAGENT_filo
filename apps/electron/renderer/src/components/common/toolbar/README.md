# NotionLikeToolbar - 빈 곳 클릭 시 선택 해제 기능

이 가이드는 NotionLikeToolbar 컴포넌트의 빈 곳 클릭 시 선택 해제 기능에 대해 설명합니다.

## 기능 개요

빈 곳 클릭 시 선택 해제 기능은 다음과 같은 동작을 제공합니다:

1. **외부 클릭 시 선택 해제**: 편집 가능한 요소 외부를 클릭하면 현재 텍스트 선택이 해제됩니다.
2. **ESC 키로 선택 해제**: ESC 키를 누르면 현재 텍스트 선택이 해제됩니다.
3. **툴바 자동 숨김**: 선택이 해제되면 툴바가 자동으로 숨겨집니다.
4. **다양한 에디터 지원**: Quill, contenteditable, textarea, input 요소 모두 지원합니다.

## 사용법

### 기본 사용법

```jsx
import NotionLikeToolbar from './components/common/NotionLikeToolbar';

function MyEditor() {
  const [selection, setSelection] = useState(null);

  return (
    <div>
      <NotionLikeToolbar
        selection={selection}
        onFormatChange={handleFormatChange}
        // 빈 곳 클릭 시 선택 해제 기능이 기본적으로 활성화됩니다
      />
      <div contentEditable onSelect={handleTextSelect}>
        편집 가능한 텍스트
      </div>
    </div>
  );
}
```

### 고급 사용법

```jsx
import NotionLikeToolbar from './components/common/NotionLikeToolbar';

function MyEditor() {
  const [selection, setSelection] = useState(null);

  const handleSelectionCleared = (trigger, selectionState) => {
    console.log('선택이 해제되었습니다:', trigger, selectionState);
    setSelection(null);
  };

  return (
    <div>
      <NotionLikeToolbar
        selection={selection}
        onFormatChange={handleFormatChange}
        enableGlobalSelectionClearer={true}
        onSelectionCleared={handleSelectionCleared}
      />
      <div contentEditable onSelect={handleTextSelect}>
        편집 가능한 텍스트
      </div>
    </div>
  );
}
```

### 선택 해제 기능 비활성화

```jsx
<NotionLikeToolbar
  selection={selection}
  onFormatChange={handleFormatChange}
  enableGlobalSelectionClearer={false}
/>
```

## Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enableGlobalSelectionClearer` | `boolean` | `true` | 전역 선택 해제 기능 활성화 여부 |
| `onSelectionCleared` | `function` | `null` | 선택 해제 시 호출되는 콜백 함수 |

### onSelectionCleared 콜백 함수

```jsx
function handleSelectionCleared(trigger, selectionState) {
  // trigger: 'click' | 'escape' | 'manual'
  // selectionState: {
  //   hasSelection: boolean,
  //   selectionType: 'native' | 'quill' | 'contenteditable' | 'input',
  //   selectedText: string,
  //   element: HTMLElement,
  //   range: Range | Object
  // }
}
```

## 제외 요소

다음 요소들은 클릭해도 선택이 해제되지 않습니다:

- `.notion-toolbar` - 툴바 자체
- `.ql-toolbar` - Quill 툴바
- `.toolbar-menu` - 툴바 메뉴
- `[data-toolbar]` - 툴바 관련 요소
- `[contenteditable="true"]` - 편집 가능한 요소
- `textarea` - 텍스트 영역
- `input[type="text"]` - 텍스트 입력 필드
- `input[type="search"]` - 검색 입력 필드
- `input[type="url"]` - URL 입력 필드
- `input[type="tel"]` - 전화번호 입력 필드
- `input[type="email"]` - 이메일 입력 필드
- `input[type="password"]` - 비밀번호 입력 필드

## 커스텀 제외 요소

직접 `useGlobalSelectionClearer` 훅을 사용하여 커스텀 제외 요소를 설정할 수 있습니다:

```jsx
import { useGlobalSelectionClearer } from './toolbar/hooks/useGlobalSelectionClearer';

function MyComponent() {
  const { clearSelection } = useGlobalSelectionClearer({
    enabled: true,
    excludeSelectors: [
      '.my-custom-toolbar',
      '.my-popup-menu',
      '.my-editor-area'
    ],
    onSelectionCleared: (trigger, selectionState) => {
      console.log('Selection cleared:', trigger, selectionState);
    }
  });

  return <div>My content</div>;
}
```

## 수동 선택 해제

필요에 따라 프로그래밍적으로 선택을 해제할 수 있습니다:

```jsx
import { clearTextSelection } from './toolbar/utils/selectionUtils';

function MyComponent() {
  const handleButtonClick = () => {
    clearTextSelection({
      clearQuillSelection: true,
      clearNativeSelection: true,
      onSelectionCleared: () => {
        console.log('Selection manually cleared');
      }
    });
  };

  return (
    <button onClick={handleButtonClick}>
      선택 해제
    </button>
  );
}
```

## 선택 상태 확인

현재 선택 상태를 확인할 수 있습니다:

```jsx
import { getSelectionState } from './toolbar/utils/selectionUtils';

function MyComponent() {
  const checkSelection = () => {
    const state = getSelectionState();
    console.log('Current selection:', state);
  };

  return (
    <button onClick={checkSelection}>
      선택 상태 확인
    </button>
  );
}
```

## 주의사항

1. **성능**: 전역 이벤트 리스너를 사용하므로 필요하지 않은 경우 비활성화하세요.
2. **충돌 방지**: 다른 라이브러리와의 이벤트 충돌을 피하기 위해 제외 요소를 적절히 설정하세요.
3. **접근성**: 키보드 사용자를 위해 ESC 키로도 선택 해제가 가능합니다.

## 디버깅

디버그 모드를 활성화하여 선택 해제 동작을 확인할 수 있습니다:

```jsx
const { clearSelection } = useGlobalSelectionClearer({
  debug: true,
  onSelectionCleared: (trigger, selectionState) => {
    console.log('Debug: Selection cleared by', trigger);
  }
});
```