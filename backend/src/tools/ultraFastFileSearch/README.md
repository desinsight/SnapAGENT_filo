# ultraFastFileSearch

초고속 파일 검색 백엔드 모듈

## 주요 특징
- 이름, 확장자, 날짜 등 다양한 조건으로 초고속 검색
- 인덱싱 기반: 처음 한 번 전체 훑고, 이후 변경 감지로 인덱스 자동 갱신(확장 예정)
- RESTful API 제공
- 대용량(수십~수백만 개 파일)도 ms~1초 내 검색

## 폴더 구조
```
index.js         // 메인 엔트리포인트(API)
indexer.js       // 인덱싱 및 인덱스 관리
searchEngine.js  // 초고속 검색 알고리즘
utils.js         // 유틸 함수
```

## API 사용법

### 1. 인덱싱
- 경로 전체를 인덱싱(한 번만 필요)
- `POST /tools/ultra-fast-search/index`
- body: `{ "rootDir": "C:/검색할/폴더" }`

### 2. 검색
- 인덱싱된 데이터에서 초고속 검색
- `GET /tools/ultra-fast-search?name=xxx&ext=pdf&from=2023-01-01&to=2023-12-31`
- 쿼리: name(이름), ext(확장자), from/to(수정일 범위)

## 참고
- 인덱스는 메모리 기반(추후 파일/DB 저장 확장 가능)
- 변경 감지(Watch) 기능은 추후 추가 예정 