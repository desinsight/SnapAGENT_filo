export const config = {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxSearchResults: 10000,
  maxSearchDepth: 30,
  backupDir: './backups',
  defaultCompressPath: './compressed',
  search: {
    historySize: 100,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    supportedMediaFormats: ['mp3', 'mp4', 'avi', 'mkv', 'wav', 'flac'],
    maxMetadataSize: 1024 * 1024,
    defaultSortBy: 'name',
    defaultSortOrder: 'asc'
  }
}; 