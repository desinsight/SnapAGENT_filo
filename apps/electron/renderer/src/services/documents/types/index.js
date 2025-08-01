/**
 * Documents Service Types
 * 
 * 이 폴더에는 전자문서 서비스 전용 타입 정의들이 포함됩니다:
 */

// JavaScript에서는 JSDoc 주석으로 타입 정의 제공
/**
 * @typedef {Object} Document
 * @property {string} id - 문서 고유 ID
 * @property {string} title - 문서 제목
 * @property {string} content - 문서 내용
 * @property {'draft'|'review'|'approved'|'signed'} status - 문서 상태
 * @property {'pdf'|'docx'|'txt'|'html'} format - 문서 형식
 * @property {string} templateId - 사용된 템플릿 ID
 * @property {string} authorId - 작성자 ID
 * @property {string[]} collaborators - 협업자 목록
 * @property {DocumentVersion[]} versions - 버전 히스토리
 * @property {Signature[]} signatures - 전자서명 목록
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 * @property {Date} signedAt - 서명 시간
 */

/**
 * @typedef {Object} DocumentTemplate
 * @property {string} id - 템플릿 ID
 * @property {string} name - 템플릿명
 * @property {string} description - 템플릿 설명
 * @property {string} content - 템플릿 내용
 * @property {'contract'|'letter'|'report'|'form'} category - 템플릿 카테고리
 * @property {string[]} fields - 입력 필드 목록
 * @property {Date} createdAt - 생성 시간
 */

/**
 * @typedef {Object} DocumentVersion
 * @property {string} id - 버전 ID
 * @property {number} version - 버전 번호
 * @property {string} content - 버전별 내용
 * @property {string} comment - 변경 사항 설명
 * @property {string} authorId - 수정자 ID
 * @property {Date} createdAt - 생성 시간
 */

/**
 * @typedef {Object} Signature
 * @property {string} id - 서명 ID
 * @property {string} signerId - 서명자 ID
 * @property {string} signerName - 서명자 이름
 * @property {string} signatureData - 서명 데이터
 * @property {Date} signedAt - 서명 시간
 * @property {string} ipAddress - 서명 시 IP 주소
 * @property {boolean} isValid - 서명 유효성
 */