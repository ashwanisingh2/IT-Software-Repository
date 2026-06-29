import * as Minio from 'minio';
import { env } from './env';
import { logger } from './logger';

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const BUCKET_NAME = env.MINIO_BUCKET;

// Initialize bucket
minioClient.bucketExists(BUCKET_NAME).then((exists) => {
  if (!exists) {
    minioClient.makeBucket(BUCKET_NAME, 'us-east-1').then(() => {
      logger.info(`Bucket ${BUCKET_NAME} created successfully`);
    }).catch((err) => {
      logger.error('Error creating bucket', err);
    });
  } else {
    logger.info(`Bucket ${BUCKET_NAME} already exists`);
  }
}).catch((err) => {
  logger.error('Error checking bucket existence', err);
});

export const uploadFile = async (buffer: Buffer, filename: string, mimetype: string): Promise<string> => {
  await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
    'Content-Type': mimetype,
  });
  return `minio://${BUCKET_NAME}/${filename}`;
};

export const getPresignedUrl = async (filename: string, expirySeconds = 3600): Promise<string> => {
  // If the file is requested by the browser, it needs a valid URL pointing to the proxy/load balancer
  // Here we use MINIO_ENDPOINT which is typically just 'minio' internally, but for presigned URLs
  // requested by clients, we might need a public endpoint if available.
  // For simplicity, we just return the presigned URL.
  return await minioClient.presignedGetObject(BUCKET_NAME, filename, expirySeconds);
};

export const deleteFile = async (filename: string): Promise<void> => {
  await minioClient.removeObject(BUCKET_NAME, filename);
};
