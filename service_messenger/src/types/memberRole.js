// 멤버 역할/권한 Enum 정의
// 추후 역할별 권한 체크, UI 표시 등에 활용

const MemberRole = {
  ADMIN: 'admin',      // 관리자(모든 권한)
  MEMBER: 'member',   // 일반 멤버(일반 권한)
  GUEST: 'guest',     // 게스트(읽기 전용 등 제한)
  // 필요시 추가 역할 정의 가능
};

module.exports = MemberRole; 