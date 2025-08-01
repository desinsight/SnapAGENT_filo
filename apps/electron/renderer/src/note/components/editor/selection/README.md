# 하이브리드 선택 시스템 (Hybrid Selection System)

## 🎯 시스템 개요

노션 수준의 크로스 블록 텍스트 선택을 지원하는 하이브리드 시스템입니다.

### 하이브리드 방식의 핵심

```
블록 내부: ProseMirror가 텍스트 편집 담당 (안정성)
블록 간: Native Browser Selection 활용 (자연스러운 UX)
통합: SelectionManager가 두 방식을 조율
```

## 📁 파일 구조

```
selection/
├── README.md                    # 이 문서
├── SelectionManager.js          # 🎯 통합 선택 관리자
├── engines/
│   ├── ProseMirrorEngine.js     # ProseMirror 선택 엔진
│   ├── NativeEngine.js          # 네이티브 선택 엔진
│   └── HybridEngine.js          # 두 엔진 조율
├── types/
│   ├── BlockSelection.js        # 블록 선택 관리
│   ├── TextSelection.js         # 텍스트 선택 관리
│   └── DragSelection.js         # 드래그 선택 관리
├── adapters/
│   ├── BlockEditorAdapter.js    # BlockEditor 통합
│   └── ProseMirrorAdapter.js    # ProseMirror 통합
├── hooks/
│   ├── useSelection.js          # 선택 상태 훅
│   ├── useSelectionEvents.js    # 이벤트 처리 훅
│   └── useHybridSelection.js    # 하이브리드 선택 훅
├── utils/
│   ├── selectionUtils.js        # 유틸리티 함수들
│   ├── coordinateUtils.js       # 좌표 계산
│   └── rangeUtils.js            # 범위 계산
└── components/
    ├── SelectionRenderer.jsx    # 시각적 피드백
    └── SelectionOverlay.jsx     # 선택 오버레이
```

## 🔄 작동 원리

### 1. 하이브리드 엔진 전환

```javascript
// 선택 시작 시
if (isWithinSingleBlock) {
  → ProseMirrorEngine.handle()  // 안정적인 텍스트 편집
} else {
  → NativeEngine.handle()      // 자연스러운 크로스 블록 선택
}
```

### 2. 자동 엔진 감지

```javascript
SelectionManager.detectEngine(selectionRange) {
  const blocks = getBlocksInRange(range);
  return blocks.length > 1 ? 'native' : 'prosemirror';
}
```

### 3. 상태 동기화

```javascript
// ProseMirror 선택 → Native 선택으로 확장 시
ProseMirrorEngine.onSelectionExtend = (range) => {
  if (range.crossesBlocks) {
    HybridEngine.switchToNative(range);
  }
}
```

## 🎨 컴포넌트 역할 분담

### BlockEditor.jsx (순수 블록 관리)
```javascript
const BlockEditor = () => {
  // ❌ 선택 로직 없음
  // ✅ 블록 CRUD만
  
  const { selectedBlocks } = useSelection(); // 선택 결과만 사용
  
  return blocks.map(block => 
    <Block 
      isSelected={selectedBlocks.includes(block.id)}
      // 선택 이벤트는 selection 시스템이 자동 처리
    />
  );
};
```

### TextBlock.jsx (순수 텍스트 편집)
```javascript
const TextBlock = () => {
  // ❌ 선택 처리 로직 없음  
  // ✅ 텍스트 편집만
  
  return (
    <ProseMirrorTextEditor 
      // 선택 이벤트는 ProseMirrorAdapter가 자동 처리
    />
  );
};
```

### SelectionManager.js (모든 선택 로직)
```javascript
class SelectionManager {
  constructor() {
    this.proseMirrorEngine = new ProseMirrorEngine();
    this.nativeEngine = new NativeEngine();
    this.hybridEngine = new HybridEngine();
  }
  
  handleSelection(event) {
    const engine = this.detectEngine(event);
    return this[engine].handle(event);
  }
}
```

## 🔧 확장성 보장

### 1. 새 블록 타입 자동 지원
```javascript
// 새 블록 추가 시 추가 작업 없음
<CustomBlock /> // 선택 시스템이 자동으로 감지하고 처리
```

### 2. 플러그인 시스템
```javascript
SelectionManager.addPlugin({
  name: 'CodeBlockSelection',
  condition: (block) => block.type === 'code',
  handler: (selection) => { /* 코드 블록 특화 처리 */ }
});
```

### 3. 설정 가능한 동작
```javascript
const selectionConfig = {
  enableCrossBlock: true,
  enableDragSelection: true,
  visualFeedback: true,
  engines: ['prosemirror', 'native'] // 사용할 엔진 선택
};
```

## 🎯 사용법

### 기본 사용
```javascript
import { SelectionProvider, useSelection } from './selection';

function App() {
  return (
    <SelectionProvider>
      <BlockEditor />
    </SelectionProvider>
  );
}

function MyComponent() {
  const { 
    selectedBlocks, 
    selectedText, 
    selectBlock, 
    clearSelection 
  } = useSelection();
  
  // 선택 상태 사용
}
```

### 고급 사용
```javascript
import { useHybridSelection } from './selection/hooks';

function AdvancedEditor() {
  const {
    engine,           // 'prosemirror' | 'native' | 'hybrid'
    switchEngine,     // 엔진 강제 전환
    getSelectionInfo  // 상세 선택 정보
  } = useHybridSelection();
}
```

## 🔄 마이그레이션 가이드

기존 코드에서 새 시스템으로 전환하는 방법:

### Before (기존)
```javascript
// BlockEditor.jsx에 선택 로직 혼재
const [selectedBlocks, setSelectedBlocks] = useState([]);
const handleBlockSelect = (id) => { /* 복잡한 로직 */ };
```

### After (새 시스템)
```javascript
// 선택 로직 완전 분리
const { selectedBlocks, selectBlock } = useSelection();
// 그냥 사용만 하면 됨
```

## 🧪 테스트 전략

각 레이어별로 독립적인 테스트:

```javascript
// 엔진별 테스트
test('ProseMirrorEngine handles single block selection')
test('NativeEngine handles cross-block selection')
test('HybridEngine switches engines correctly')

// 통합 테스트  
test('SelectionManager coordinates engines')
test('Full user workflow: drag across multiple blocks')
```