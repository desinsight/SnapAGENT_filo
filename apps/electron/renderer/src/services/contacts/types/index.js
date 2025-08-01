/**
 * Contacts Service Types
 * 
 * 이 폴더에는 연락처 서비스 전용 타입 정의들이 포함됩니다:
 */

// JavaScript에서는 JSDoc 주석으로 타입 정의 제공
/**
 * @typedef {Object} Contact
 * @property {string} id - 연락처 고유 ID
 * @property {string} firstName - 이름
 * @property {string} lastName - 성
 * @property {string} fullName - 전체 이름
 * @property {string} email - 이메일 주소
 * @property {string} phone - 전화번호
 * @property {string} mobile - 휴대폰 번호
 * @property {string} company - 회사명
 * @property {string} jobTitle - 직책
 * @property {Address} address - 주소
 * @property {string} avatar - 프로필 이미지 URL
 * @property {string[]} groups - 소속 그룹 목록
 * @property {boolean} isFavorite - 즐겨찾기 여부
 * @property {Date} createdAt - 생성 시간
 * @property {Date} lastContacted - 마지막 연락 시간
 */

/**
 * @typedef {Object} Address
 * @property {string} street - 도로명
 * @property {string} city - 도시
 * @property {string} state - 주/도
 * @property {string} zipCode - 우편번호
 * @property {string} country - 국가
 */

/**
 * @typedef {Object} ContactGroup
 * @property {string} id - 그룹 ID
 * @property {string} name - 그룹명
 * @property {string} description - 그룹 설명
 * @property {string} color - 그룹 색상
 * @property {number} contactCount - 연락처 수
 * @property {Date} createdAt - 생성 시간
 */