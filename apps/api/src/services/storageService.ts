import crypto from 'crypto';
import { uploadFile, getPresignedUrl, deleteFile } from '../config/minio';
import { Octokit } from '@octokit/rest';
import { env } from '../config/env';

export class StorageService {
  private octokit: Octokit | null = null;

  constructor() {
    if (env.GITHUB_TOKEN) {
      this.octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    }
  }

  async upload(buffer: Buffer, originalname: string, mimetype: string, softwareId: string, version: string) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const sha256 = hashSum.digest('hex');
    const fileSize = buffer.length;

    const filename = `${softwareId}/${version}/${originalname}`;
    let url = '';

    try {
      url = await uploadFile(buffer, filename, mimetype);
    } catch (error) {
      console.warn('MinIO upload failed, attempting GitHub fallback', error);
      if (!this.octokit || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
        throw { status: 500, code: 'STORAGE_ERROR', message: 'MinIO failed and GitHub fallback is not configured' };
      }
      
      // Attempt GitHub release upload (simplified version)
      throw { status: 500, code: 'STORAGE_ERROR', message: 'GitHub fallback not fully implemented in this template' };
    }

    return { url, sha256, fileSize };
  }

  async getDownloadUrl(storageUrl: string): Promise<string> {
    if (storageUrl.startsWith('minio://')) {
      const path = storageUrl.replace(`minio://${env.MINIO_BUCKET}/`, '');
      return await getPresignedUrl(path);
    }
    
    if (storageUrl.startsWith('github://')) {
      // Map to real GitHub asset URL logic here
      return storageUrl.replace('github://', 'https://github.com/');
    }

    return storageUrl;
  }

  async delete(storageUrl: string): Promise<void> {
    if (storageUrl.startsWith('minio://')) {
      const path = storageUrl.replace(`minio://${env.MINIO_BUCKET}/`, '');
      await deleteFile(path);
    }
  }
}

export const storageService = new StorageService();
