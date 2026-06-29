import { minioClient, MINIO_BUCKET } from '../config/minio';
import logger from '../config/logger';
import * as Minio from 'minio';

// Create a separate client for generating presigned URLs that the external browser can resolve.
// Presigned URLs are calculated locally, so we configure this client with the public endpoint
// (e.g. localhost) to ensure the generated S3 signature matches the Host header the browser will send.
const externalMinioClient = new Minio.Client({
  endPoint: process.env.MINIO_PUBLIC_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin_secure',
  region: 'us-east-1'
});

export class MinioService {
  async uploadFile(objectName: string, filePath: string, mimeType: string): Promise<string> {
    try {
      await minioClient.fPutObject(MINIO_BUCKET, objectName, filePath, {
        'Content-Type': mimeType,
      });
      return objectName;
    } catch (error: any) {
      logger.error('Failed to upload file to MinIO', { error: error.message, objectName });
      throw error;
    }
  }

  async getPresignedUrl(objectName: string, expiryInSeconds: number = 3600): Promise<string> {
    try {
      // Use the external client to generate the URL with correct host and signature
      return await externalMinioClient.presignedGetObject(MINIO_BUCKET, objectName, expiryInSeconds);
    } catch (error: any) {
      logger.error('Failed to generate presigned URL', { error: error.message, objectName });
      throw error;
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(MINIO_BUCKET, objectName);
    } catch (error: any) {
      logger.error('Failed to delete file from MinIO', { error: error.message, objectName });
      throw error;
    }
  }
}
