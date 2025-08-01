import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const PERMISSION_HELP = `\n[해결법]\n- 윈도우: 폴더/파일 우클릭 → 속성 → 보안 → 권한 편집 → '모든 권한' 허용\n- 리눅스/맥: 터미널에서 'chmod 777 /경로' 입력\n- 관리자에게 문의하세요.\n`;

async function checkFileAccessWithHelp(filePath, mode = constants.R_OK | constants.W_OK) {
    try {
        await fs.access(filePath, mode);
        return true;
    } catch (e) {
        logger.error(`권한 부족: ${filePath} (${e.code})`);
        throw new Error(`권한이 부족해 작업할 수 없습니다. ${PERMISSION_HELP}`);
    }
}

export class FileSystemManager {
    constructor(options = {}) {
        this.storageType = options.storageType || 'local'; // 'local' | 's3'
        this.s3 = null;
        if (this.storageType === 's3') {
            this.s3 = new S3Client({
                region: options.s3Region,
                credentials: {
                    accessKeyId: options.s3AccessKey,
                    secretAccessKey: options.s3SecretKey
                }
            });
            this.s3Bucket = options.s3Bucket;
        }
        this.metadataFile = path.join(process.cwd(), 'data', 'metadata.json');
        this.metadata = new Map();
        if (this.storageType === 'local') {
            this.initialize();
        }
    }

    async initialize() {
        try {
            await fs.mkdir(path.dirname(this.metadataFile), { recursive: true });
            try {
                const data = await fs.readFile(this.metadataFile, 'utf-8');
                this.metadata = new Map(Object.entries(JSON.parse(data)));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await this.saveMetadata();
                } else {
                    throw error;
                }
            }
        } catch (error) {
            logger.error('파일 시스템 관리자 초기화 실패:', error);
            throw error;
        }
    }

    async saveMetadata() {
        if (this.storageType !== 'local') return;
        try {
            const data = JSON.stringify(Object.fromEntries(this.metadata), null, 2);
            await checkFileAccessWithHelp(this.metadataFile, constants.W_OK);
            await fs.writeFile(this.metadataFile, data, 'utf-8');
        } catch (error) {
            logger.error('메타데이터 저장 실패:', error);
            throw error;
        }
    }

    mapHostPath(inputPath) {
        // Windows 네이티브 환경에서는 경로를 그대로 사용
        return path.normalize(inputPath);
    }

    async listFiles(directory) {
        if (this.storageType === 'local') {
            try {
                console.log('🔍 [FileSystem] listFiles 호출:', { directory });
                
                const mappedPath = this.mapHostPath(directory);
                const normalizedPath = path.normalize(mappedPath);
                
                console.log('📍 [FileSystem] 경로 처리:', { 
                    original: directory, 
                    mapped: mappedPath, 
                    normalized: normalizedPath 
                });
                
                await checkFileAccessWithHelp(normalizedPath, constants.R_OK);
                const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
                const files = [];
                const dirs = [];

                for (const entry of entries) {
                    const fullPath = path.join(normalizedPath, entry.name);
                    await checkFileAccessWithHelp(fullPath, constants.R_OK);
                    const stats = await fs.stat(fullPath);
                    const metadata = this.metadata.get(fullPath) || {};

                    const item = {
                        name: entry.name,
                        path: fullPath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        isDirectory: entry.isDirectory(),
                        metadata: metadata
                    };

                    if (entry.isDirectory()) {
                        dirs.push(item);
                    } else {
                        files.push(item);
                    }
                }

                const result = {
                    directories: dirs.sort((a, b) => a.name.localeCompare(b.name)),
                    files: files.sort((a, b) => a.name.localeCompare(b.name))
                };
                
                console.log('✅ [FileSystem] listFiles 완료:', { 
                    path: normalizedPath, 
                    directoriesCount: result.directories.length,
                    filesCount: result.files.length 
                });
                
                return result;
            } catch (error) {
                logger.error('파일 목록 조회 실패:', error);
                throw error;
            }
        } else if (this.storageType === 's3') {
            try {
                const command = new ListObjectsV2Command({
                    Bucket: this.s3Bucket,
                    Prefix: directory.replace(/^\/+/,'')
                });
                const data = await this.s3.send(command);
                const files = (data.Contents || []).map(obj => ({
                    name: path.basename(obj.Key),
                    path: obj.Key,
                    size: obj.Size,
                    isDirectory: false
                }));
                return { directories: [], files };
            } catch (error) {
                logger.error('S3 파일 목록 조회 실패:', error);
                throw error;
            }
        }
    }

    async readFile(filePath) {
        if (this.storageType === 'local') {
            try {
                const mappedPath = this.mapHostPath(filePath);
                const normalizedPath = path.normalize(mappedPath);
                await checkFileAccessWithHelp(normalizedPath, constants.R_OK);
                const content = await fs.readFile(normalizedPath, 'utf-8');
                const metadata = this.metadata.get(normalizedPath) || {};
                return { content, metadata };
            } catch (error) {
                logger.error('파일 읽기 실패:', error);
                throw error;
            }
        } else if (this.storageType === 's3') {
            try {
                const command = new GetObjectCommand({
                    Bucket: this.s3Bucket,
                    Key: filePath.replace(/^\/+/,'')
                });
                const data = await this.s3.send(command);
                const streamToString = (stream) =>
                    new Promise((resolve, reject) => {
                        const chunks = [];
                        stream.on('data', (chunk) => chunks.push(chunk));
                        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
                        stream.on('error', reject);
                    });
                const content = await streamToString(data.Body);
                return { content, metadata: {} };
            } catch (error) {
                logger.error('S3 파일 읽기 실패:', error);
                throw error;
            }
        }
    }

    async createFile(filePath, content) {
        if (this.storageType === 'local') {
            try {
                const mappedPath = this.mapHostPath(filePath);
                const normalizedPath = path.normalize(mappedPath);
                await checkFileAccessWithHelp(path.dirname(normalizedPath), constants.W_OK);
                await fs.mkdir(path.dirname(normalizedPath), { recursive: true });
                await fs.writeFile(normalizedPath, content, 'utf-8');
                logger.info(`파일 생성됨: ${normalizedPath}`);
                return normalizedPath;
            } catch (error) {
                logger.error('파일 생성 실패:', error);
                throw error;
            }
        } else if (this.storageType === 's3') {
            // S3용 구현 필요
        }
    }

    async updateFile(filePath, content) {
        if (this.storageType === 'local') {
            try {
                const mappedPath = this.mapHostPath(filePath);
                const normalizedPath = path.normalize(mappedPath);
                await checkFileAccessWithHelp(normalizedPath, constants.W_OK);
                await fs.writeFile(normalizedPath, content, 'utf-8');
                logger.info(`파일 업데이트됨: ${normalizedPath}`);
                return normalizedPath;
            } catch (error) {
                logger.error('파일 업데이트 실패:', error);
                throw error;
            }
        } else if (this.storageType === 's3') {
            // S3용 구현 필요
        }
    }

    async deleteFile(filePath) {
        if (this.storageType === 'local') {
            try {
                const mappedPath = this.mapHostPath(filePath);
                const normalizedPath = path.normalize(mappedPath);
                await checkFileAccessWithHelp(normalizedPath, constants.W_OK);
                await fs.unlink(normalizedPath);
                this.metadata.delete(normalizedPath);
                await this.saveMetadata();
                logger.info(`파일 삭제됨: ${normalizedPath}`);
            } catch (error) {
                logger.error('파일 삭제 실패:', error);
                throw error;
            }
        } else if (this.storageType === 's3') {
            // S3용 구현 필요
        }
    }

    async moveFile(source, destination) {
        try {
            const mappedSource = this.mapHostPath(source);
            const mappedDestination = this.mapHostPath(destination);
            const normalizedSource = path.normalize(mappedSource);
            const normalizedDestination = path.normalize(mappedDestination);
            await fs.mkdir(path.dirname(normalizedDestination), { recursive: true });
            await fs.rename(normalizedSource, normalizedDestination);

            // 메타데이터 이동
            const metadata = this.metadata.get(normalizedSource);
            if (metadata) {
                this.metadata.delete(normalizedSource);
                this.metadata.set(normalizedDestination, metadata);
                await this.saveMetadata();
            }

            logger.info(`파일 이동됨: ${normalizedSource} -> ${normalizedDestination}`);
            return normalizedDestination;
        } catch (error) {
            logger.error('파일 이동 실패:', error);
            throw error;
        }
    }

    async copyFile(source, destination) {
        try {
            const mappedSource = this.mapHostPath(source);
            const mappedDestination = this.mapHostPath(destination);
            const normalizedSource = path.normalize(mappedSource);
            const normalizedDestination = path.normalize(mappedDestination);
            await fs.mkdir(path.dirname(normalizedDestination), { recursive: true });
            await fs.copyFile(normalizedSource, normalizedDestination);

            // 메타데이터 복사
            const metadata = this.metadata.get(normalizedSource);
            if (metadata) {
                this.metadata.set(normalizedDestination, { ...metadata });
                await this.saveMetadata();
            }

            logger.info(`파일 복사됨: ${normalizedSource} -> ${normalizedDestination}`);
            return normalizedDestination;
        } catch (error) {
            logger.error('파일 복사 실패:', error);
            throw error;
        }
    }

    async updateMetadata(filePath, metadata) {
        try {
            const normalizedPath = path.normalize(filePath);
            const currentMetadata = this.metadata.get(normalizedPath) || {};
            this.metadata.set(normalizedPath, { ...currentMetadata, ...metadata });
            await this.saveMetadata();
            logger.info(`메타데이터 업데이트됨: ${normalizedPath}`);
            return this.metadata.get(normalizedPath);
        } catch (error) {
            logger.error('메타데이터 업데이트 실패:', error);
            throw error;
        }
    }

    async getMetadata(filePath) {
        try {
            const normalizedPath = path.normalize(filePath);
            return this.metadata.get(normalizedPath) || {};
        } catch (error) {
            logger.error('메타데이터 조회 실패:', error);
            throw error;
        }
    }

    async organizeFiles(source, destination) {
        try {
            const normalizedSource = path.normalize(source);
            const normalizedDestination = path.normalize(destination);
            const { files } = await this.listFiles(normalizedSource);

            for (const file of files) {
                const extension = path.extname(file.name).toLowerCase().slice(1);
                const targetDir = path.join(normalizedDestination, extension || 'no-extension');
                await fs.mkdir(targetDir, { recursive: true });
                await this.moveFile(file.path, path.join(targetDir, file.name));
            }

            logger.info(`파일 정리 완료: ${normalizedSource} -> ${normalizedDestination}`);
        } catch (error) {
            logger.error('파일 정리 실패:', error);
            throw error;
        }
    }

    async listDrives() {
        try {
            const drives = [];
            if (process.platform === 'win32' || process.env.DOCKERIZED) {
                // Docker 컨테이너에서 /host-c, /host-d 등 마운트된 경로 자동 탐색
                const driveLetters = ['C', 'D', 'E', 'F', 'G'];
                for (const letter of driveLetters) {
                    const mountPath = `/host-${letter.toLowerCase()}`;
                    try {
                        await fs.access(mountPath);
                        drives.push({
                            name: `${letter}:`,
                            path: `${letter}:/`,
                            type: '고정 디스크',
                            freeSpace: 0,
                            totalSpace: 0
                        });
                    } catch (e) {
                        // 마운트 안 된 드라이브는 무시
                    }
                }
            } else {
                // 리눅스/맥 등에서는 루트만 반환
                drives.push({
                    name: '/',
                    path: '/',
                    type: '고정 디스크',
                    freeSpace: 0,
                    totalSpace: 0
                });
            }
            return drives;
        } catch (error) {
            logger.error('드라이브 목록 조회 실패:', error);
            throw error;
        }
    }
} 