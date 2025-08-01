import { logger } from '../utils/logger.js';

/**
 * 자연어 처리 엔진
 * AI API 없이 규칙 기반 + 패턴 매칭으로 자연어 명령 분석
 * @class NaturalLanguageProcessor
 */
export class NaturalLanguageProcessor {
  constructor() {
    // 명령 패턴 정의 - 미친 수준으로 확장
    this.patterns = {
      search: {
        keywords: ['찾아', '검색', '찾기', '어디', '위치', 'find', 'search', 'locate', '찾아줘', '찾아봐', '찾자', '어디있어', '어디있지', '보여줘', '나타내', '발견', '탐색', '수색', '파악', '조사', '확인', '살펴', '둘러', '훑어', '어딜까', '있을까', '있나', '있지', '있는데', '나와', '보여', '나오는', '소재', '발견해', '찾아내', '드러내', '드러남', '어디인지', '어딜지', '어느곳', '어떤곳', '뭐있나', '또있나', '들어있나', '들어있어', '있을거야', '있으거버', '있어야되는데', '있어야되잖아', '이있어', '잘있어', '나타나', '나타나는', '나와는', '보이는', '보이는거', '보이나', '보이지', '안보여', '안보이네', '못찾겠어', '못찾겠다', '못찾겠네', '찾을래', '찾고싶어', '찾고있어', '찾아보자', '알아봐', '확인해봐', '살펴봐', '둘러봐줘', '훑어봐', '찾아보세요', '살펴보세요', '알아보세요', '찾아주세요', '나와주세요', '보여주세요', '포함', '포함된', '포함하는', '들어간', '들어있는', '내포된', '담긴', '담고있는', '속에있는', '안에있는', '가진', '이름에', '제목에', '파일명에', '폴더명에', '디렉토리명에', '경로에', '패스에'],
        patterns: [
          /(.+?)(?:을|를|이|가)?\s*(?:찾아|검색|찾기)/,
          /(.+?)(?:이|가)?\s*어디/,
          /(?:find|search|locate)\s+(.+)/i,
          /(.+?)(?:을|를)?\s*(?:보여줘|나타내|발견)/,
          /(.+?)(?:이|가)?\s*(?:있나|있지|있어)/,
          /(.+?)(?:을|를)?\s*(?:찾아줘|찾아봐|찾아내)/,
          /어디(?:에|에서)?\s*(.+?)(?:이|가)?\s*(?:있|나와)/,
          /(?:있나|있지|\s나와)\s*(.+?)/,
          /(.+?)\s*(?:소재|위치|자리|장소).*어디/,
          // 이름 포함 검색 패턴
          /(.+?)(?:이|가|을|를)?\s*(?:포함|포함된|포함하는)\s*(?:파일|폴더|디렉토리)/,
          /(.+?)(?:이|가|을|를)?\s*(?:들어간|들어있는|내포된|담긴|담고있는)\s*(?:파일|폴더)/,
          /(?:이름|제목|파일명|폴더명|디렉토리명)(?:이|에|에서)?\s*(.+?)(?:이|가|을|를)?\s*(?:포함|들어간|있는)/,
          /(.+?)(?:이|가|을|를)?\s*(?:이름|제목|파일명|폴더명)(?:에|으로)?\s*(?:포함|들어간|있는)/,
          /(.+?)(?:이|가)?\s*(?:속에|안에|내부에)\s*(?:있는|들어있는)\s*(?:파일|폴더)/,
          /(?:파일|폴더|디렉토리)\s*(?:이름|제목)(?:이|에|에서)?\s*(.+?)(?:포함|들어간)/,
          // 영어 패턴
          /(?:files?|folders?|directories)\s*(?:with|containing|including|named|called)\s*(.+)/i,
          /(?:containing|including|with|named)\s*(.+?)\s*(?:in\s*(?:name|title|filename))?/i,
          /(.+?)\s*(?:in\s*(?:file|folder|directory)\s*(?:name|title))/i
        ],
        extractor: this.extractSearchParams.bind(this)
      },
      
      organize: {
        keywords: ['정리', '분류', '정돈', '구성', 'organize', 'sort', 'arrange', '정렬', '배치', '배열', '체계화', '조직화', '그룹화', '카테고리', '그룹', '모아', '묶어', '나눠', '구분', '분리', '치워', '줄세워', '순서', '계층', '폴더별', '타입별', '날짜별', '크기별', '이름별', '색깔별', '유형별', '확장자별', '상태별', '중요도별', '사용빈도별', '접근빈도별', '작업별', '프로젝트별', '클라이언트별', '부서별', '팀별', '역할별', '기능별', '목적별', '사용자별', '권한별', '보안별', '공개별', '비공개별', '중요별', '우선도별', '마감일별', '진행상황별', '완료별', '대기별', '보류별', '승인별', '반려별', '검토별', '확인별', '수정별', '삭제별', '생성별', '업데이트별', '백업별', '복원별', '아카이브별', '임시별', '영구별', '참조별', '참고별', '입력별', '출력별', '소스별', '결과별', '단계별', '버전별', '릴리즈별', '빌드별', '테스트별', '디버그별', '로그별', '캐시별', '설정별', '환경별', '개발별', '운영별', '프로덕션별', '스테이징별', '테스트별', '레이블별', '태그별', '주석별', '코멘트별', '노트별', '메모별', '할일별', '오늘별', '이번주별', '이번달별', '올해별', '작년별', '내년별', '계절별', '월별', '요일별', '시간별', '분별', '초별', '매일별', '매주별', '매달별', '매년별', '매번별', '여러번별', '한번별', '두번별', '여러개별', '한개별', '두개별', '몇개별', '많은별', '적은별', '단일별', '복수별', '기본별', '고급별', '초급별', '중급별', '전문별', '일반별', '특별별', '예외별', '일반적별', '특수별', '경우별', '상황별', '조건별', '기준별', '기준점별', '참조점별'],
        patterns: [
          /(.+?)(?:을|를)?\s*(?:정리|분류|정돈)/,
          /(?:organize|sort|arrange)\s+(.+)/i,
          /(.+?)(?:을|를)?\s*(?:체계화|조직화|그룹화)/,
          /(.+?)(?:을|를)?\s*(?:모아|묶어|나눠|구분)/,
          /(.+?)(?:을|를)?\s*(?:체계|구조).*만들/,
          /(.+?)(?:을|를)?\s*(?:카테고리|그룹).*만들/,
          /(.+?)(?:을|를)?\s*(?:폴더|디렉토리).*(?:만들|생성)/,
          /(.*?)(?:별로|\s별)\s*(?:정리|분류|정돈)/,
          /(.+?)(?:에서|에)\s*(?:질서|순서).*(?:맞춰|제대로)/,
          /(.+?)(?:을|를)?\s*(?:치워|정돈|\s줄세워)/
        ],
        extractor: this.extractOrganizeParams.bind(this)
      },
      
      analyze: {
        keywords: ['분석', '파악', '조사', '확인', 'analyze', 'check', 'inspect'],
        patterns: [
          /(.+?)(?:을|를|이|가)?\s*(?:분석|파악|조사|확인)/,
          /(?:analyze|check|inspect)\s+(.+)/i
        ],
        extractor: this.extractAnalyzeParams.bind(this)
      },
      
      clean: {
        keywords: ['삭제', '제거', '정리', '청소', '중복', 'delete', 'remove', 'clean', 'duplicate'],
        patterns: [
          /(?:중복|중복된)\s*(.+?)(?:을|를)?\s*(?:삭제|제거|정리)/,
          /(.+?)(?:을|를)?\s*(?:삭제|제거|청소)/,
          /(?:delete|remove|clean)\s+(?:duplicate\s+)?(.+)/i
        ],
        extractor: this.extractCleanParams.bind(this)
      },
      
      recommend: {
        keywords: ['추천', '제안', '제시', '권장', 'recommend', 'suggest'],
        patterns: [
          /(.+?)(?:을|를|에 대한|에 대해)?\s*(?:추천|제안|제시)/,
          /(?:recommend|suggest)\s+(.+)/i
        ],
        extractor: this.extractRecommendParams.bind(this)
      }
    };
    
    // 미친 수준의 파일 타입 매핑 - 대폭 확장
    this.fileTypeMap = {
      // 이미지 차레
      '이미지': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tga', 'psd', 'ai', 'eps', 'raw', 'cr2', 'nef', 'arw', 'dng', 'ico', 'cur'],
      '사진': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'raw', 'cr2', 'nef', 'arw', 'dng', 'tiff'],
      '그림': ['jpg', 'png', 'gif', 'svg', 'bmp', 'webp', 'ai', 'eps', 'psd'],
      '사진파일': ['jpg', 'jpeg', 'png', 'raw', 'cr2', 'nef', 'arw', 'dng'],
      '이미지파일': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff'],
      '그래픽': ['jpg', 'png', 'gif', 'svg', 'ai', 'eps', 'psd'],
      '아이콘': ['ico', 'png', 'svg'],
      '로고': ['svg', 'ai', 'eps', 'png'],
      '따샨': ['png', 'gif'],
      '배경화면': ['jpg', 'png', 'bmp'],
      '원본': ['psd', 'ai', 'eps'],
      '원본파일': ['psd', 'ai', 'eps', 'raw'],
      '디자인': ['psd', 'ai', 'eps', 'svg'],
      '작업물': ['psd', 'ai', 'eps'],
      '스크린샷': ['png', 'jpg'],
      '캐처': ['png', 'jpg'],
      '바탕화면': ['jpg', 'png', 'bmp'],
      '월페이퍼': ['jpg', 'png', 'bmp'],
      
      // 동영상 차례
      '동영상': ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'm4v', 'webm', 'ogv', '3gp', 'ts', 'mts', 'm2ts', 'vob', 'rm', 'rmvb', 'asf', 'divx', 'xvid'],
      '비디오': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'm4v', 'webm'],
      '영상': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'm4v'],
      '동영상파일': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'm4v', 'webm'],
      '비디오파일': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'],
      '영화': ['mp4', 'mkv', 'avi', 'mov'],
      '드라마': ['mp4', 'mkv', 'avi'],
      '예능': ['mp4', 'mkv', 'avi', 'ts'],
      '다큐멘터리': ['mp4', 'mkv', 'avi'],
      '애니메이션': ['mp4', 'mkv', 'avi', 'gif'],
      '영상강의': ['mp4', 'mkv', 'avi'],
      '강의': ['mp4', 'mkv', 'avi'],
      '튜토리얼': ['mp4', 'mkv', 'avi'],
      '데모': ['mp4', 'mkv', 'avi'],
      '회의록화': ['mp4', 'mkv', 'avi'],
      
      // 음악 차례
      '음악': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'ape', 'ac3', 'dts', 'aiff', 'au', 'ra', 'mka'],
      '오디오': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'],
      '음성': ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
      '음악파일': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
      '오디오파일': ['mp3', 'wav', 'flac', 'aac', 'ogg'],
      '노래': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
      '음성파일': ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
      '녹음': ['wav', 'mp3', 'aac', 'm4a'],
      '녹음파일': ['wav', 'mp3', 'aac', 'm4a'],
      '드럼': ['wav', 'aiff'],
      '비트': ['wav', 'aiff'],
      '인스트루멘트': ['wav', 'aiff', 'mp3'],
      '효과음': ['wav', 'mp3', 'aac'],
      '효과': ['wav', 'mp3', 'aac'],
      '사운드': ['wav', 'mp3', 'aac'],
      '사운드이펙트': ['wav', 'mp3'],
      '게임음악': ['ogg', 'wav', 'mp3'],
      '배경음악': ['mp3', 'ogg', 'wav'],
      '비지엠': ['mp3', 'wav'],
      '주제곡': ['mp3', 'wav'],
      '인트로': ['mp3', 'wav'],
      '아웃트로': ['mp3', 'wav'],
      
      // 문서 차례
      '문서': ['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'hwp', 'pages', 'gdoc'],
      'PDF': ['pdf'],
      '피디에프': ['pdf'],
      '워드': ['doc', 'docx'],
      '마이크로소프트워드': ['doc', 'docx'],
      '한글': ['hwp', 'hml'],
      '한글문서': ['hwp', 'hml'],
      '텍스트': ['txt', 'rtf', 'md', 'text'],
      '텍스트파일': ['txt', 'rtf', 'md'],
      '메모': ['txt', 'md'],
      '메모장': ['txt', 'md'],
      '노트': ['txt', 'md', 'onenote'],
      '노트북': ['txt', 'md', 'onenote'],
      '일기': ['txt', 'md'],
      '저널': ['txt', 'md'],
      '기록': ['txt', 'md', 'doc'],
      '리포트': ['doc', 'docx', 'pdf'],
      '보고서': ['doc', 'docx', 'pdf'],
      '제안서': ['doc', 'docx', 'pdf'],
      '기획서': ['doc', 'docx', 'pdf'],
      '명세서': ['doc', 'docx', 'pdf'],
      '계약서': ['doc', 'docx', 'pdf'],
      '매뉴얼': ['doc', 'docx', 'pdf'],
      '사용설명서': ['doc', 'docx', 'pdf'],
      '가이드': ['doc', 'docx', 'pdf'],
      '효예': ['doc', 'docx', 'pdf'],
      '양식': ['doc', 'docx', 'pdf'],
      '서식': ['doc', 'docx', 'pdf'],
      '템플릿': ['doc', 'docx'],
      '서류': ['doc', 'docx', 'pdf'],
      '공문': ['doc', 'docx', 'pdf'],
      '업무': ['doc', 'docx', 'pdf'],
      '업무문서': ['doc', 'docx', 'pdf'],
      '회사문서': ['doc', 'docx', 'pdf'],
      '내부문서': ['doc', 'docx'],
      '외부문서': ['pdf'],
      '공지': ['doc', 'docx', 'pdf'],
      '공지사항': ['doc', 'docx', 'pdf'],
      '안내': ['doc', 'docx', 'pdf'],
      '안내서': ['doc', 'docx', 'pdf'],
      '설명': ['doc', 'docx', 'pdf'],
      '설명서': ['doc', 'docx', 'pdf'],
      '알림': ['doc', 'docx', 'pdf'],
      '알림장': ['doc', 'docx', 'pdf'],
      '통지': ['doc', 'docx', 'pdf'],
      '통지서': ['doc', 'docx', 'pdf'],
      '공고': ['doc', 'docx', 'pdf'],
      '공고문': ['doc', 'docx', 'pdf'],
      
      // 스프레드시트 차례
      '엑셀': ['xls', 'xlsx', 'csv'],
      '스프레드시트': ['xls', 'xlsx', 'csv', 'ods'],
      '엑셀파일': ['xls', 'xlsx'],
      '비비': ['csv'],
      '표': ['xls', 'xlsx', 'csv'],
      '데이터': ['csv', 'xlsx', 'xls'],
      '데이터파일': ['csv', 'xlsx', 'xls'],
      '통계': ['xlsx', 'xls'],
      '통계자료': ['xlsx', 'xls'],
      '계산': ['xlsx', 'xls'],
      '계산서': ['xlsx', 'xls'],
      '가계부': ['xlsx', 'xls'],
      '결산': ['xlsx', 'xls'],
      '결산서': ['xlsx', 'xls'],
      '예산': ['xlsx', 'xls'],
      '예산서': ['xlsx', 'xls'],
      '리스트': ['xlsx', 'xls', 'csv'],
      '목록': ['xlsx', 'xls', 'csv'],
      '명단': ['xlsx', 'xls', 'csv'],
      '데이터베이스': ['xlsx', 'xls', 'csv'],
      '데이터베이스파일': ['xlsx', 'xls', 'csv'],
      '연락처': ['xlsx', 'xls', 'csv'],
      '주소록': ['xlsx', 'xls', 'csv'],
      '전화번호': ['xlsx', 'xls', 'csv'],
      '전화번호부': ['xlsx', 'xls', 'csv'],
      '주소': ['xlsx', 'xls', 'csv'],
      '주소부': ['xlsx', 'xls', 'csv'],
      '날짜': ['xlsx', 'xls'],
      '시간': ['xlsx', 'xls'],
      '시간표': ['xlsx', 'xls'],
      '시간상': ['xlsx', 'xls'],
      '일정': ['xlsx', 'xls'],
      '일정표': ['xlsx', 'xls'],
      '캘린더': ['xlsx', 'xls'],
      '스케줄': ['xlsx', 'xls'],
      '스케줄링': ['xlsx', 'xls'],
      '계획': ['xlsx', 'xls'],
      '계획표': ['xlsx', 'xls'],
      '계획서': ['xlsx', 'xls'],
      '예정': ['xlsx', 'xls'],
      '예정표': ['xlsx', 'xls'],
      '예정서': ['xlsx', 'xls'],
      
      // 프레젠테이션 차례
      '파워포인트': ['ppt', 'pptx'],
      '프레젠테이션': ['ppt', 'pptx', 'odp'],
      '파포': ['ppt', 'pptx'],
      '프레젠테이션파일': ['ppt', 'pptx'],
      '슬라이드': ['ppt', 'pptx'],
      '슬라이드쇼': ['ppt', 'pptx'],
      '발표': ['ppt', 'pptx'],
      '발표자료': ['ppt', 'pptx'],
      '발표파일': ['ppt', 'pptx'],
      '기획안': ['ppt', 'pptx'],
      '제안': ['ppt', 'pptx'],
      '제안자료': ['ppt', 'pptx'],
      '데모': ['ppt', 'pptx'],
      '소개': ['ppt', 'pptx'],
      '소개자료': ['ppt', 'pptx'],
      '설명': ['ppt', 'pptx'],
      '설명자료': ['ppt', 'pptx'],
      '전달': ['ppt', 'pptx'],
      '전달사항': ['ppt', 'pptx'],
      '공유': ['ppt', 'pptx'],
      '공유자료': ['ppt', 'pptx'],
      '리뷰': ['ppt', 'pptx'],
      '리뷰자료': ['ppt', 'pptx'],
      '수정': ['ppt', 'pptx'],
      '수정자료': ['ppt', 'pptx'],
      '업데이트': ['ppt', 'pptx'],
      '업데이트자료': ['ppt', 'pptx'],
      '버전': ['ppt', 'pptx'],
      '버전별': ['ppt', 'pptx'],
      '초안': ['ppt', 'pptx'],
      '초안자료': ['ppt', 'pptx'],
      '진행': ['ppt', 'pptx'],
      '진행상황': ['ppt', 'pptx'],
      '체크': ['ppt', 'pptx'],
      '체크리스트': ['ppt', 'pptx'],
      '체크포인트': ['ppt', 'pptx'],
      '대응': ['ppt', 'pptx'],
      '대응방안': ['ppt', 'pptx'],
      '개선': ['ppt', 'pptx'],
      '개선사항': ['ppt', 'pptx'],
      '개선방안': ['ppt', 'pptx'],
      
      // 코드 차례
      '코드': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'kt', 'swift', 'dart', 'scala'],
      '소스': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'],
      '소스코드': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'],
      '프로그램': ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'],
      '스크립트': ['js', 'py', 'sh', 'bat', 'ps1'],
      '스크립트파일': ['js', 'py', 'sh', 'bat', 'ps1'],
      '웹': ['html', 'htm', 'css', 'js', 'php'],
      '웹파일': ['html', 'htm', 'css', 'js', 'php'],
      '웹사이트': ['html', 'htm', 'css', 'js'],
      '홍페이지': ['html', 'htm'],
      '웹페이지': ['html', 'htm'],
      '사이트': ['html', 'htm', 'css', 'js'],
      '파이썬': ['py'],
      '자바': ['java'],
      '자바스크립트': ['js'],
      '타입스크립트': ['ts'],
      '씨플플': ['cpp'],
      '씨언어': ['c'],
      '씨샤프': ['cs'],
      '비주얼베이직': ['vb'],
      '피에치피': ['php'],
      '루비': ['rb'],
      '고랭': ['go'],
      '러스트': ['rs'],
      '코틀린': ['kt'],
      '스위프트': ['swift'],
      '다트': ['dart'],
      '스칼라': ['scala'],
      '라이브러리': ['js', 'py', 'java', 'cpp'],
      '프레임워크': ['js', 'py', 'java'],
      '엠지연': ['html'],
      '시에스에스': ['css'],
      '마크다운': ['md'],
      '문서마크업': ['md'],
      '제이씨에스': ['js'],
      '티에스': ['ts'],
      '엑스엠엘': ['xml'],
      '제이슨': ['json'],
      '온에이엠엘': ['yaml', 'yml'],
      '설정': ['ini', 'cfg', 'conf', 'config', 'json', 'xml', 'yaml', 'yml'],
      '설정파일': ['ini', 'cfg', 'conf', 'config', 'json', 'xml', 'yaml', 'yml'],
      '환경설정': ['env', 'ini', 'cfg', 'config'],
      '환경변수': ['env'],
      '도트이븐브': ['env'],
      '컨피그': ['ini', 'cfg', 'conf', 'config'],
      '컨피그파일': ['ini', 'cfg', 'conf', 'config'],
      '도트컨피그': ['ini', 'cfg', 'conf', 'config'],
      '시스템설정': ['ini', 'cfg', 'conf', 'config'],
      '앱설정': ['ini', 'cfg', 'conf', 'config', 'json'],
      '프로그램설정': ['ini', 'cfg', 'conf', 'config'],
      '소프트웨어설정': ['ini', 'cfg', 'conf', 'config'],
      '게임설정': ['ini', 'cfg', 'conf', 'config'],
      '브라우저설정': ['ini', 'cfg', 'conf', 'config'],
      '보안설정': ['ini', 'cfg', 'conf', 'config'],
      '네트워크설정': ['ini', 'cfg', 'conf', 'config'],
      '서버설정': ['ini', 'cfg', 'conf', 'config'],
      '데이터베이스설정': ['ini', 'cfg', 'conf', 'config'],
      
      // 압축 차례
      '압축': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lzma', 'cab', 'iso', 'dmg'],
      '압축파일': ['zip', 'rar', '7z', 'tar', 'gz'],
      '아카이브': ['zip', 'rar', '7z', 'tar'],
      '아카이브파일': ['zip', 'rar', '7z', 'tar'],
      '집': ['zip'],
      '러': ['rar'],
      '세븐집': ['7z'],
      '타르': ['tar'],
      '기집': ['gz'],
      '비짐투': ['bz2'],
      '엑스지': ['xz'],
      '엘지마': ['lzma'],
      '캐브': ['cab'],
      '아이에스오': ['iso'],
      '디엠지': ['dmg'],
      '시디': ['iso'],
      '디브디': ['iso'],
      '이미지파일': ['iso', 'dmg'],
      '설치파일': ['msi', 'exe', 'pkg', 'deb', 'rpm'],
      '인스톨러': ['msi', 'exe', 'pkg'],
      '인스톨러파일': ['msi', 'exe', 'pkg'],
      '인스톨리': ['msi', 'exe', 'pkg'],
      '인스톨리파일': ['msi', 'exe', 'pkg'],
      '플호': ['deb'],
      '레드햄': ['rpm'],
      '엠에스아이': ['msi'],
      '이엑스이': ['exe'],
      '픽키지': ['pkg'],
      '데브': ['deb'],
      '아르피엠': ['rpm'],
      '실행파일': ['exe', 'msi', 'app', 'deb', 'rpm'],
      '애플리케이션': ['exe', 'msi', 'app'],
      '앱': ['exe', 'msi', 'app'],
      '프로그램파일': ['exe', 'msi', 'app'],
      '소프트웨어': ['exe', 'msi', 'app'],
      '게임': ['exe'],
      '게임파일': ['exe'],
      '비디오게임': ['exe'],
      '모바일게임': ['apk', 'ipa'],
      '안드로이드게임': ['apk'],
      '아이폰게임': ['ipa'],
      '오고리지나이게임': ['exe'],
      '스트림게임': ['exe'],
      '이픽게임': ['exe'],
      '블리자드게임': ['exe'],
      '마인크래프트': ['exe', 'jar'],
      '마크': ['exe', 'jar'],
      '마인크래프트게임': ['exe', 'jar'],
      '자르': ['jar'],
      '자바애플리케이션': ['jar'],
      '자바앱': ['jar'],
      '자바프로그램': ['jar'],
      '자바소프트웨어': ['jar'],
      '자바게임': ['jar'],
      '자바파일': ['jar', 'java', 'class'],
      '클래스': ['class'],
      '클래스파일': ['class'],
      '바이트코드': ['class'],
      '컴파일': ['class', 'exe'],
      '컴파일파일': ['class', 'exe'],
      '빌드': ['exe', 'jar', 'war', 'ear'],
      '빌드파일': ['exe', 'jar', 'war', 'ear'],
      '릴리즈': ['exe', 'jar', 'war', 'ear'],
      '릴리즈파일': ['exe', 'jar', 'war', 'ear'],
      '배포': ['exe', 'jar', 'war', 'ear'],
      '배포파일': ['exe', 'jar', 'war', 'ear'],
      '워': ['war'],
      '워파일': ['war'],
      '이어': ['ear'],
      '이어파일': ['ear'],
      '웹애플리케이션': ['war'],
      '웹앱': ['war'],
      '웹애플리케이션파일': ['war'],
      '웹앱파일': ['war'],
      '애플리케이션서버': ['war', 'ear'],
      '웹서버': ['war'],
      '서버애플리케이션': ['war', 'ear'],
      '서버앱': ['war', 'ear'],
      '서버파일': ['war', 'ear'],
      '엔터프라이즈': ['ear'],
      '엔터프라이즈애플리케이션': ['ear'],
      '엔터프라이즈앱': ['ear'],
      '엔터프라이즈파일': ['ear']
    };
    
    // 시간 표현 매핑
    this.timeExpressions = {
      '오늘': () => new Date().setHours(0, 0, 0, 0),
      '어제': () => new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0),
      '이번주': () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        return new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
      },
      '지난주': () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day - 7;
        return new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
      },
      '이번달': () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      },
      '지난달': () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      }
    };
    
    // 크기 표현 매핑
    this.sizeExpressions = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      '메가': 1024 * 1024,
      '기가': 1024 * 1024 * 1024
    };
  }

  /**
   * 초기화
   */
  async initialize() {
    logger.info('자연어 처리 엔진 초기화');
    // 필요시 추가 초기화 로직
  }

  /**
   * 자연어 명령 분석
   * @param {string} command - 사용자 명령
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 분석된 의도
   */
  async analyze(command, context = {}) {
    try {
      // 명령어 정규화
      const normalizedCommand = this.normalizeCommand(command);
      
      // 의도 파악
      const intent = this.detectIntent(normalizedCommand);
      
      // 매개변수 추출
      const params = await this.extractParameters(normalizedCommand, intent, context);
      
      // 의도 보강
      const enrichedIntent = await this.enrichIntent(intent, params, context);
      
      logger.info('자연어 분석 완료:', { command, intent: enrichedIntent });
      
      return enrichedIntent;
      
    } catch (error) {
      logger.error('자연어 분석 실패:', error);
      
      // 기본 검색으로 폴백
      return {
        action: 'SEARCH',
        query: command,
        confidence: 0.3,
        original: command,
        error: error.message
      };
    }
  }

  /**
   * 명령어 정규화
   * @private
   */
  normalizeCommand(command) {
    return command
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[~!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]+/g, ' ');
  }

  /**
   * 의도 파악
   * @private
   */
  detectIntent(command) {
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [action, config] of Object.entries(this.patterns)) {
      // 키워드 매칭 점수
      const keywordScore = config.keywords.reduce((score, keyword) => {
        if (command.includes(keyword)) {
          return score + (keyword.length / command.length);
        }
        return score;
      }, 0);
      
      // 패턴 매칭 점수
      const patternScore = config.patterns.reduce((score, pattern) => {
        const match = command.match(pattern);
        if (match) {
          return Math.max(score, match[0].length / command.length);
        }
        return score;
      }, 0);
      
      const totalScore = keywordScore + patternScore * 2; // 패턴 매칭에 더 높은 가중치
      
      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = {
          action: action.toUpperCase(),
          confidence: Math.min(totalScore, 1),
          matched: true
        };
      }
    }
    
    // 매칭 실패 시 기본값
    if (!bestMatch || highestScore < 0.3) {
      return {
        action: 'SEARCH',
        confidence: 0.5,
        matched: false
      };
    }
    
    return bestMatch;
  }

  /**
   * 매개변수 추출
   * @private
   */
  async extractParameters(command, intent, context) {
    const actionKey = intent.action.toLowerCase();
    const actionConfig = this.patterns[actionKey];
    
    console.log('🔍 extractParameters:', { action: intent.action, actionKey, hasConfig: !!actionConfig, hasExtractor: !!(actionConfig?.extractor) });
    
    if (actionConfig && actionConfig.extractor) {
      const params = await actionConfig.extractor(command, context);
      console.log('✅ 매개변수 추출 완료:', params);
      return params;
    }
    
    // 기본 매개변수 추출
    console.log('⚠️ 기본 매개변수 사용');
    return {
      query: command,
      nameQuery: command,
      searchInName: true,
      context: context
    };
  }

  /**
   * 검색 매개변수 추출
   * @private
   */
  extractSearchParams(command, context) {
    const params = {
      query: '',
      fileTypes: [],
      dateRange: null,
      sizeRange: null,
      location: context.currentPath || null,
      searchContent: false,
      searchInName: true, // 기본적으로 파일명 검색 활성화
      nameQuery: ''       // 파일명에서 검색할 키워드
    };
    
    // 파일 타입 추출
    for (const [typeName, extensions] of Object.entries(this.fileTypeMap)) {
      if (command.includes(typeName)) {
        params.fileTypes.push(...extensions);
        command = command.replace(typeName, '');
      }
    }
    
    // 날짜 범위 추출
    for (const [timeExpr, getTime] of Object.entries(this.timeExpressions)) {
      if (command.includes(timeExpr)) {
        params.dateRange = {
          from: getTime(),
          to: Date.now()
        };
        command = command.replace(timeExpr, '');
      }
    }
    
    // 크기 범위 추출
    const sizeMatch = command.match(/(\d+)\s*(KB|MB|GB|메가|기가)/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      const unit = this.sizeExpressions[sizeMatch[2]] || 1;
      params.sizeRange = {
        min: size * unit * 0.8,
        max: size * unit * 1.2
      };
      command = command.replace(sizeMatch[0], '');
    }
    
    // 내용 검색 여부
    if (command.includes('내용') || command.includes('content')) {
      params.searchContent = true;
      command = command.replace(/내용|content/gi, '');
    }
    
    // 이름 포함 검색 패턴 처리
    let nameSearchProcessed = false;
    
    // 한국어 이름 포함 패턴들
    const namePatterns = [
      /(.+?)(?:이|가|을|를)?\s*(?:포함|포함된|포함하는)\s*(?:파일|폴더|디렉토리)/,
      /(.+?)(?:이|가|을|를)?\s*(?:들어간|들어있는|내포된|담긴|담고있는)\s*(?:파일|폴더)/,
      /(?:이름|제목|파일명|폴더명|디렉토리명)(?:이|에|에서)?\s*(.+?)(?:이|가|을|를)?\s*(?:포함|들어간|있는)/,
      /(.+?)(?:이|가|을|를)?\s*(?:이름|제목|파일명|폴더명)(?:에|으로)?\s*(?:포함|들어간|있는)/,
      /(.+?)(?:이|가)?\s*(?:속에|안에|내부에)\s*(?:있는|들어있는)\s*(?:파일|폴더)/,
      /(?:파일|폴더|디렉토리)\s*(?:이름|제목)(?:이|에|에서)?\s*(.+?)(?:포함|들어간)/,
      // 영어 패턴들
      /(?:files?|folders?|directories)\s*(?:with|containing|including|named|called)\s*(.+)/i,
      /(?:containing|including|with|named)\s*(.+?)\s*(?:in\s*(?:name|title|filename))?/i,
      /(.+?)\s*(?:in\s*(?:file|folder|directory)\s*(?:name|title))/i
    ];
    
    for (const pattern of namePatterns) {
      const match = command.match(pattern);
      if (match) {
        params.nameQuery = match[1].trim();
        params.searchInName = true;
        nameSearchProcessed = true;
        command = command.replace(match[0], '');
        break;
      }
    }
    
    // 일반적인 검색어 처리
    if (!nameSearchProcessed) {
      // 특별한 패턴이 없으면 전체 명령어를 이름 검색 키워드로 사용
      const cleanQuery = command
        .replace(/을|를|이|가|에서|에|찾아|검색|찾기|보여줘|나타내|발견|어디|있나|있지|있어|find|search|locate|show|display/gi, '')
        .replace(/파일|폴더|디렉토리|file|folder|directory/gi, '')
        .trim();
      
      if (cleanQuery) {
        params.nameQuery = cleanQuery;
      }
    }
    
    // 최종 쿼리 설정
    params.query = params.nameQuery || command
      .replace(/을|를|이|가|에서|에|찾아|검색|찾기|find|search|locate/gi, '')
      .trim();
    
    return params;
  }

  /**
   * 정리 매개변수 추출
   * @private
   */
  extractOrganizeParams(command, context) {
    const params = {
      targetPath: context.currentPath || null,
      categories: [],
      preserveOriginal: false,
      depth: 3,
      customRules: []
    };
    
    // 타겟 추출
    if (command.includes('폴더') || command.includes('디렉토리')) {
      params.targetPath = context.currentPath;
    }
    
    // 카테고리 추출
    if (command.includes('종류별') || command.includes('타입별')) {
      params.categories.push('fileType');
    }
    if (command.includes('날짜별') || command.includes('시간별')) {
      params.categories.push('date');
    }
    if (command.includes('크기별')) {
      params.categories.push('size');
    }
    if (command.includes('이름별')) {
      params.categories.push('name');
    }
    
    // 기본 카테고리
    if (params.categories.length === 0) {
      params.categories = ['fileType', 'date'];
    }
    
    // 원본 보존 여부
    if (command.includes('복사') || command.includes('원본')) {
      params.preserveOriginal = true;
    }
    
    return params;
  }

  /**
   * 분석 매개변수 추출
   * @private
   */
  extractAnalyzeParams(command, context) {
    const params = {
      targetPath: context.currentPath || null,
      analysisType: [],
      includeSubfolders: true,
      generateReport: false
    };
    
    // 분석 타입 추출
    if (command.includes('크기') || command.includes('용량')) {
      params.analysisType.push('size');
    }
    if (command.includes('중복')) {
      params.analysisType.push('duplicate');
    }
    if (command.includes('구조') || command.includes('구성')) {
      params.analysisType.push('structure');
    }
    if (command.includes('통계')) {
      params.analysisType.push('statistics');
    }
    
    // 기본 분석 타입
    if (params.analysisType.length === 0) {
      params.analysisType = ['size', 'structure', 'statistics'];
    }
    
    // 보고서 생성 여부
    if (command.includes('보고서') || command.includes('리포트')) {
      params.generateReport = true;
    }
    
    return params;
  }

  /**
   * 정리 매개변수 추출
   * @private
   */
  extractCleanParams(command, context) {
    const params = {
      targetPath: context.currentPath || null,
      cleanType: [],
      safeMode: true,
      preview: true
    };
    
    // 정리 타입 추출
    if (command.includes('중복')) {
      params.cleanType.push('duplicate');
    }
    if (command.includes('임시') || command.includes('temp')) {
      params.cleanType.push('temporary');
    }
    if (command.includes('캐시') || command.includes('cache')) {
      params.cleanType.push('cache');
    }
    if (command.includes('오래된') || command.includes('old')) {
      params.cleanType.push('old');
    }
    
    // 안전 모드
    if (command.includes('강제') || command.includes('force')) {
      params.safeMode = false;
    }
    
    // 미리보기
    if (command.includes('바로') || command.includes('즉시')) {
      params.preview = false;
    }
    
    return params;
  }

  /**
   * 추천 매개변수 추출
   * @private
   */
  extractRecommendParams(command, context) {
    const params = {
      recommendationType: 'general',
      basedOn: [],
      limit: 10
    };
    
    // 추천 타입 추출
    if (command.includes('비슷한') || command.includes('유사')) {
      params.recommendationType = 'similar';
    }
    if (command.includes('관련')) {
      params.recommendationType = 'related';
    }
    if (command.includes('인기')) {
      params.recommendationType = 'popular';
    }
    
    // 기준 추출
    if (command.includes('최근')) {
      params.basedOn.push('recent');
    }
    if (command.includes('자주')) {
      params.basedOn.push('frequent');
    }
    
    return params;
  }

  /**
   * 의도 보강
   * @private
   */
  async enrichIntent(intent, params, context) {
    const enriched = {
      ...intent,
      ...params,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        locale: context.locale || 'ko-KR',
        timezone: context.timezone || 'Asia/Seoul'
      }
    };
    
    // 스마트 기본값 설정
    if (enriched.action === 'SEARCH' && !enriched.query) {
      enriched.query = '*';
      enriched.recentFiles = true;
    }
    
    // 컨텍스트 기반 보강
    if (context.previousCommands) {
      enriched.relatedCommands = this.findRelatedCommands(
        enriched,
        context.previousCommands
      );
    }
    
    return enriched;
  }

  /**
   * 관련 명령 찾기
   * @private
   */
  findRelatedCommands(currentIntent, previousCommands) {
    return previousCommands
      .filter(cmd => {
        // 같은 액션이거나 유사한 쿼리를 가진 명령 찾기
        return cmd.action === currentIntent.action ||
               (cmd.query && currentIntent.query && 
                this.calculateSimilarity(cmd.query, currentIntent.query) > 0.5);
      })
      .slice(-5); // 최근 5개만
  }

  /**
   * 문자열 유사도 계산
   * @private
   */
  calculateSimilarity(str1, str2) {
    const tokens1 = str1.toLowerCase().split(/\s+/);
    const tokens2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = tokens1.filter(token => tokens2.includes(token));
    const union = [...new Set([...tokens1, ...tokens2])];
    
    return intersection.length / union.length;
  }
}

export default NaturalLanguageProcessor;