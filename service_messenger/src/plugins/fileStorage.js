// 파일 저장소 연동 플러그인 예시
// 파일 첨부 시 외부 파일 서버/클라우드 연동 등 확장 가능

/**
 * 파일 저장소 연동 함수
 * @param {object} fileMeta - 파일 메타데이터(이름, 크기, 타입 등)
 * @param {Buffer} fileBuffer - 파일 데이터(옵션)
 */
module.exports = async function storeFile(fileMeta, fileBuffer) {
  // TODO: 외부 파일 서버/클라우드 연동(예: S3, 사내 파일 서버 등)
  console.log('[파일저장 플러그인] 파일 저장 요청:', fileMeta);
  // 예시: 저장 후 파일 ID/URL 반환
  return { fileId: 'mock-file-id', url: 'https://fileserver.example.com/mock-file-id' };
}; 