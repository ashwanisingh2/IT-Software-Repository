import * as Minio from 'minio';
import logger from './logger';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin_secure'
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'winrepo-packages';

export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');
      logger.info(`MinIO bucket created: ${MINIO_BUCKET}`);
    } else {
      logger.info(`MinIO bucket already exists: ${MINIO_BUCKET}`);
    }
  } catch (error: any) {
    logger.error('MinIO initialization failed', { error: error.message });
    throw error;
  }
};

export const checkMinioConnection = async () => {
  try {
    await minioClient.bucketExists(MINIO_BUCKET);
    return true;
  } catch (error: any) {
    logger.error('MinIO connection failed', { error: error.message });
    return false;
  }
};
