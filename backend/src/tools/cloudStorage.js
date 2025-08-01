import { Storage } from '@google-cloud/storage';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Dropbox } from 'dropbox';
import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

export class CloudStorage {
  constructor(options = {}) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'cloud-storage.log' })
      ]
    });

    this.providers = {
      gcp: options.gcp ? new Storage({
        projectId: options.gcp.projectId,
        keyFilename: options.gcp.keyFilename
      }) : null,
      aws: options.aws ? new S3Client({
        region: options.aws.region,
        credentials: {
          accessKeyId: options.aws.accessKeyId,
          secretAccessKey: options.aws.secretAccessKey
        }
      }) : null,
      dropbox: options.dropbox ? new Dropbox({
        accessToken: options.dropbox.accessToken
      }) : null
    };
  }

  async uploadToGCP(filePath, bucketName) {
    try {
      const bucket = this.providers.gcp.bucket(bucketName);
      const fileName = path.basename(filePath);
      await bucket.upload(filePath, {
        destination: fileName,
        metadata: {
          cacheControl: 'public, max-age=31536000'
        }
      });
      return `gs://${bucketName}/${fileName}`;
    } catch (error) {
      this.logger.error('GCP 업로드 실패:', error);
      throw error;
    }
  }

  async uploadToAWS(filePath, bucketName) {
    try {
      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      await this.providers.aws.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent
      }));
      return `s3://${bucketName}/${fileName}`;
    } catch (error) {
      this.logger.error('AWS 업로드 실패:', error);
      throw error;
    }
  }

  async uploadToDropbox(filePath) {
    try {
      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const response = await this.providers.dropbox.filesUpload({
        path: `/${fileName}`,
        contents: fileContent
      });
      return response.path_display;
    } catch (error) {
      this.logger.error('Dropbox 업로드 실패:', error);
      throw error;
    }
  }

  async downloadFromGCP(bucketName, fileName, destinationPath) {
    try {
      const bucket = this.providers.gcp.bucket(bucketName);
      const file = bucket.file(fileName);
      await file.download({ destination: destinationPath });
      return destinationPath;
    } catch (error) {
      this.logger.error('GCP 다운로드 실패:', error);
      throw error;
    }
  }

  async downloadFromAWS(bucketName, fileName, destinationPath) {
    try {
      const response = await this.providers.aws.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName
      }));
      const fileStream = response.Body;
      const writeStream = fs.createWriteStream(destinationPath);
      await new Promise((resolve, reject) => {
        fileStream.pipe(writeStream)
          .on('error', reject)
          .on('finish', resolve);
      });
      return destinationPath;
    } catch (error) {
      this.logger.error('AWS 다운로드 실패:', error);
      throw error;
    }
  }

  async downloadFromDropbox(filePath, destinationPath) {
    try {
      const response = await this.providers.dropbox.filesDownload({
        path: filePath
      });
      await fs.writeFile(destinationPath, response.fileBinary);
      return destinationPath;
    } catch (error) {
      this.logger.error('Dropbox 다운로드 실패:', error);
      throw error;
    }
  }

  async deleteFromGCP(bucketName, fileName) {
    try {
      const bucket = this.providers.gcp.bucket(bucketName);
      await bucket.file(fileName).delete();
      return true;
    } catch (error) {
      this.logger.error('GCP 삭제 실패:', error);
      throw error;
    }
  }

  async deleteFromAWS(bucketName, fileName) {
    try {
      await this.providers.aws.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName
      }));
      return true;
    } catch (error) {
      this.logger.error('AWS 삭제 실패:', error);
      throw error;
    }
  }

  async deleteFromDropbox(filePath) {
    try {
      await this.providers.dropbox.filesDelete({
        path: filePath
      });
      return true;
    } catch (error) {
      this.logger.error('Dropbox 삭제 실패:', error);
      throw error;
    }
  }

  async listFilesGCP(bucketName, prefix = '') {
    try {
      const [files] = await this.providers.gcp.bucket(bucketName).getFiles({
        prefix
      });
      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        updated: file.metadata.updated
      }));
    } catch (error) {
      this.logger.error('GCP 파일 목록 조회 실패:', error);
      throw error;
    }
  }

  async listFilesAWS(bucketName, prefix = '') {
    try {
      const response = await this.providers.aws.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix
      }));
      return response.Contents.map(file => ({
        name: file.Key,
        size: file.Size,
        updated: file.LastModified
      }));
    } catch (error) {
      this.logger.error('AWS 파일 목록 조회 실패:', error);
      throw error;
    }
  }

  async listFilesDropbox(folderPath = '') {
    try {
      const response = await this.providers.dropbox.filesListFolder({
        path: folderPath
      });
      return response.entries.map(entry => ({
        name: entry.name,
        size: entry.size,
        updated: entry.server_modified
      }));
    } catch (error) {
      this.logger.error('Dropbox 파일 목록 조회 실패:', error);
      throw error;
    }
  }

  async getFileMetadataGCP(bucketName, fileName) {
    try {
      const [metadata] = await this.providers.gcp.bucket(bucketName)
        .file(fileName)
        .getMetadata();
      return metadata;
    } catch (error) {
      this.logger.error('GCP 메타데이터 조회 실패:', error);
      throw error;
    }
  }

  async getFileMetadataAWS(bucketName, fileName) {
    try {
      const response = await this.providers.aws.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: fileName
      }));
      return response;
    } catch (error) {
      this.logger.error('AWS 메타데이터 조회 실패:', error);
      throw error;
    }
  }

  async getFileMetadataDropbox(filePath) {
    try {
      const response = await this.providers.dropbox.filesGetMetadata({
        path: filePath
      });
      return response;
    } catch (error) {
      this.logger.error('Dropbox 메타데이터 조회 실패:', error);
      throw error;
    }
  }

  // 메인 실행 메서드 - ToolExecutionManager에서 호출
  async executeTool(toolName, params = {}) {
    try {
      this.logger.info(`클라우드 스토리지 도구 실행: ${toolName}`, { params });
      
      switch (toolName) {
        case 'listFiles':
        case 'list_files':
          const { provider, bucketName, prefix, folderPath } = params;
          if (provider === 'gcp' || provider === 'google') {
            return await this.listFilesGCP(bucketName, prefix);
          } else if (provider === 'aws' || provider === 's3') {
            return await this.listFilesAWS(bucketName, prefix);
          } else if (provider === 'dropbox') {
            return await this.listFilesDropbox(folderPath);
          } else {
            throw new Error('지원하지 않는 클라우드 제공자입니다. gcp, aws, dropbox 중 선택하세요.');
          }
        
        case 'uploadFile':
        case 'upload_file':
          const { filePath, destination } = params;
          if (destination?.includes('s3://')) {
            const bucketName = destination.replace('s3://', '').split('/')[0];
            return await this.uploadToAWS(filePath, bucketName);
          } else if (destination?.includes('gs://')) {
            const bucketName = destination.replace('gs://', '').split('/')[0];
            return await this.uploadToGCP(filePath, bucketName);
          } else if (destination?.includes('dropbox://')) {
            return await this.uploadToDropbox(filePath);
          } else {
            throw new Error('지원하지 않는 업로드 대상입니다.');
          }
        
        case 'downloadFile':
        case 'download_file':
          const { source, localPath } = params;
          if (source?.includes('s3://')) {
            const [bucketName, fileName] = source.replace('s3://', '').split('/');
            return await this.downloadFromAWS(bucketName, fileName, localPath);
          } else if (source?.includes('gs://')) {
            const [bucketName, fileName] = source.replace('gs://', '').split('/');
            return await this.downloadFromGCP(bucketName, fileName, localPath);
          } else if (source?.includes('dropbox://')) {
            const filePath = source.replace('dropbox://', '');
            return await this.downloadFromDropbox(filePath, localPath);
          } else {
            throw new Error('지원하지 않는 다운로드 소스입니다.');
          }
        
        case 'deleteFile':
        case 'delete_file':
          const { filePath: deletePath, bucketName: deleteBucket } = params;
          if (deletePath?.includes('s3://')) {
            const [bucket, fileName] = deletePath.replace('s3://', '').split('/');
            return await this.deleteFromAWS(bucket, fileName);
          } else if (deletePath?.includes('gs://')) {
            const [bucket, fileName] = deletePath.replace('gs://', '').split('/');
            return await this.deleteFromGCP(bucket, fileName);
          } else if (deletePath?.includes('dropbox://')) {
            const path = deletePath.replace('dropbox://', '');
            return await this.deleteFromDropbox(path);
          } else {
            throw new Error('지원하지 않는 삭제 대상입니다.');
          }
        
        case 'getMetadata':
        case 'get_metadata':
          const { filePath: metaPath, bucketName: metaBucket } = params;
          if (metaPath?.includes('s3://')) {
            const [bucket, fileName] = metaPath.replace('s3://', '').split('/');
            return await this.getFileMetadataAWS(bucket, fileName);
          } else if (metaPath?.includes('gs://')) {
            const [bucket, fileName] = metaPath.replace('gs://', '').split('/');
            return await this.getFileMetadataGCP(bucket, fileName);
          } else if (metaPath?.includes('dropbox://')) {
            const path = metaPath.replace('dropbox://', '');
            return await this.getFileMetadataDropbox(path);
          } else {
            throw new Error('지원하지 않는 메타데이터 조회 대상입니다.');
          }
        
        default:
          throw new Error(`알 수 없는 클라우드 스토리지 도구: ${toolName}`);
      }
    } catch (error) {
      this.logger.error(`클라우드 스토리지 도구 실행 실패 (${toolName}):`, error);
      throw error;
    }
  }

  async cleanup() {
    // 리소스 정리 작업
    this.logger.info('클라우드 스토리지 도구 정리 완료');
  }
}

module.exports = CloudStorage; 