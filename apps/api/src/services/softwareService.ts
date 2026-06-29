import { SoftwareRepository } from '../repositories/softwareRepository';
import { MinioService } from './minioService';
import { redisClient } from '../config/redis';
import crypto from 'crypto';
import fs from 'fs';
import logger from '../config/logger';

const softwareRepository = new SoftwareRepository();
const minioService = new MinioService();
const CACHE_KEY = 'software:list';

export class SoftwareService {
  
  async getSoftwareList(page: number, pageSize: number, search?: string, category?: string) {
    const cacheKey = `${CACHE_KEY}:${page}:${pageSize}:${search || ''}:${category || ''}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await softwareRepository.findAll(page, pageSize, search, category);
    await redisClient.setEx(cacheKey, 300, JSON.stringify(data)); // 5 minutes cache
    return data;
  }

  async getSoftware(id: string) {
    const software = await softwareRepository.findById(id);
    if (!software) return null;
    const versions = await softwareRepository.getVersions(id);
    return { ...software, versions };
  }

  private async invalidateCache() {
    const keys = await redisClient.keys(`${CACHE_KEY}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  async uploadSoftware(data: any, file: Express.Multer.File, userId: string) {
    // 1. Calculate SHA256
    const fileBuffer = fs.readFileSync(file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const sha256 = hashSum.digest('hex');

    // 2. Check if software exists
    let software = await softwareRepository.findByName(data.name);
    
    let softwareId = software ? software.id : null;
    const isNew = !software;

    // 3. Upload to MinIO
    // Format: {name}/{version}/{original_filename}
    const objectName = `${data.name}/${data.version}/${file.originalname}`;
    await minioService.uploadFile(objectName, file.path, file.mimetype);

    // 4. Save to DB
    if (isNew) {
      software = await softwareRepository.create({
        name: data.name,
        vendor: data.vendor,
        category: data.category,
        version: data.version,
        latest_version: data.version,
        sha256: sha256,
        file_size: file.size,
        storage_url: objectName,
        created_by: userId
      });
      softwareId = software.id;
    } else {
      // It's an update. We trigger addVersion which will trigger update_latest_version
      await softwareRepository.addVersion(softwareId!, data.version, sha256, file.size, objectName, userId);
    }

    // 5. Cleanup temp file
    fs.unlinkSync(file.path);

    // 6. Invalidate cache
    await this.invalidateCache();

    return software;
  }

  async getDownloadUrl(softwareId: string, endpointId?: string, userId?: string, ipAddress?: string) {
    const software = await softwareRepository.findById(softwareId);
    if (!software) {
      throw new Error('Software not found');
    }

    // Log download (triggers increment)
    await softwareRepository.logDownload(softwareId, endpointId, userId, ipAddress);

    // Generate 1-hour presigned URL
    return await minioService.getPresignedUrl(software.storage_url, 3600);
  }
}
