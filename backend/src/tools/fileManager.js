/**
 * 사용 가능한 드라이브 목록을 반환합니다.
 * @returns {Promise<Array<{name: string, path: string, type: string, freeSpace: number, totalSpace: number}>>}
 */
async listDrives() {
  try {
    const drives = [];
    const { stdout } = await exec('wmic logicaldisk get deviceid,drivetype,size,freespace');
    const lines = stdout.trim().split('\n').slice(1);

    for (const line of lines) {
      const [deviceId, driveType, size, freeSpace] = line.trim().split(/\s+/);
      if (deviceId) {
        const type = this.getDriveType(driveType);
        drives.push({
          name: deviceId,
          path: `${deviceId}\\`,
          type,
          freeSpace: parseInt(freeSpace) || 0,
          totalSpace: parseInt(size) || 0
        });
      }
    }

    return drives;
  } catch (error) {
    logger.error('드라이브 목록 조회 실패:', error);
    throw new Error('드라이브 목록을 조회할 수 없습니다.');
  }
}

/**
 * 드라이브 타입을 문자열로 변환합니다.
 * @param {string} type - 드라이브 타입 코드
 * @returns {string} 드라이브 타입 문자열
 */
getDriveType(type) {
  const types = {
    '0': '알 수 없음',
    '1': '없음',
    '2': '이동식 디스크',
    '3': '고정 디스크',
    '4': '네트워크 드라이브',
    '5': 'CD-ROM',
    '6': 'RAM 디스크'
  };
  return types[type] || '알 수 없음';
} 