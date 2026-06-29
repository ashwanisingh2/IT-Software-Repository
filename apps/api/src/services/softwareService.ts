import { softwareRepository } from '../repositories/softwareRepository';
import { storageService } from './storageService';
import { auditRepository } from '../repositories/auditRepository';
import { getCache, setCache, redisClient } from '../config/redis';
import crypto from 'crypto';
import { SoftwareCategory, SoftwareStatus } from '@winrepo/shared';

export class SoftwareService {
  async getList(filters: any, page: number, limit: number) {
    const hash = crypto.createHash('md5').update(JSON.stringify({ filters, page, limit })).digest('hex');
    const cacheKey = `software:list:${hash}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const result = await softwareRepository.list(filters, page, limit);
    await setCache(cacheKey, result, 300); // 5 mins
    return result;
  }

  async getById(id: string) {
    const cacheKey = `software:${id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const result = await softwareRepository.findById(id);
    if (!result) throw { status: 404, code: 'NOT_FOUND', message: 'Software not found' };

    await setCache(cacheKey, result, 600); // 10 mins
    return result;
  }

  async create(data: { name: string; vendor: string; description?: string; category: SoftwareCategory; version: string; releaseNotes?: string }, file: Express.Multer.File, userId: string, userEmail: string, ip: string, userAgent: string) {
    const existing = await softwareRepository.findByName(data.name);
    if (existing) throw { status: 409, code: 'CONFLICT', message: 'Software already exists' };

    const { url, sha256, fileSize } = await storageService.upload(file.buffer, file.originalname, file.mimetype, 'temp', data.version);

    // Create software entry with temp URL
    const software = await softwareRepository.create({
      ...data,
      sha256,
      fileSize,
      storageUrl: url,
      createdBy: userId,
    });

    // Add version
    await softwareRepository.addVersion(software.id, {
      version: data.version,
      sha256,
      fileSize,
      storageUrl: url,
      releaseNotes: data.releaseNotes
    });

    await this.invalidateListCache();

    await auditRepository.log({
      userId, userEmail, action: 'software.create', resourceType: 'software', resourceId: software.id,
      oldValue: null, newValue: software as any, ipAddress: ip, userAgent
    });

    return software;
  }

  async update(id: string, data: Partial<{ name: string; vendor: string; description: string; category: SoftwareCategory; status: SoftwareStatus }>, userId: string, userEmail: string, ip: string, userAgent: string) {
    const oldVal = await softwareRepository.findById(id);
    if (!oldVal) throw { status: 404, code: 'NOT_FOUND', message: 'Software not found' };

    const updated = await softwareRepository.update(id, data);
    
    await redisClient.del(`software:${id}`);
    await this.invalidateListCache();

    await auditRepository.log({
      userId, userEmail, action: 'software.update', resourceType: 'software', resourceId: id,
      oldValue: oldVal as any, newValue: updated as any, ipAddress: ip, userAgent
    });

    return updated;
  }

  async delete(id: string, userId: string, userEmail: string, ip: string, userAgent: string) {
    await softwareRepository.softDelete(id);
    await redisClient.del(`software:${id}`);
    await this.invalidateListCache();

    await auditRepository.log({
      userId, userEmail, action: 'software.delete', resourceType: 'software', resourceId: id,
      oldValue: null, newValue: null, ipAddress: ip, userAgent
    });
  }

  async download(id: string, userId: string, userEmail: string, ip: string, userAgent: string) {
    const software = await this.getById(id);
    
    // Non-blocking download count increment
    softwareRepository.incrementDownload(id).catch(() => {});

    const downloadUrl = await storageService.getDownloadUrl(software.storageUrl);

    await auditRepository.log({
      userId, userEmail, action: 'software.download', resourceType: 'software', resourceId: id,
      oldValue: null, newValue: { version: software.latestVersion }, ipAddress: ip, userAgent
    });

    return { downloadUrl, sha256: software.sha256, filename: software.storageUrl.split('/').pop() };
  }

  async getVersions(id: string) {
    return await softwareRepository.getVersions(id);
  }

  private async invalidateListCache() {
    const keys = await redisClient.keys('software:list:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}

export const softwareService = new SoftwareService();
