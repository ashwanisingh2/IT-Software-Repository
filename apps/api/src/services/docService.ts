import { docRepository } from '../repositories/docRepository';
import { auditRepository } from '../repositories/auditRepository';
import { DocCategory } from '@winrepo/shared';

export class DocService {
  async getList(filters: any, page: number, limit: number) {
    return await docRepository.list(filters, page, limit);
  }

  async getById(id: string) {
    const doc = await docRepository.findById(id);
    if (!doc) throw { status: 404, code: 'NOT_FOUND', message: 'Document not found' };
    return doc;
  }

  async create(data: { title: string; content: string; category: DocCategory; tags: string[] }, userId: string, userEmail: string, ip: string, userAgent: string) {
    const doc = await docRepository.create({ ...data, createdBy: userId });
    
    await auditRepository.log({
      userId, userEmail, action: 'doc.create', resourceType: 'doc', resourceId: doc.id,
      oldValue: null, newValue: doc as any, ipAddress: ip, userAgent
    });
    
    return doc;
  }

  async update(id: string, data: Partial<{ title: string; content: string; category: DocCategory; tags: string[] }>, userId: string, userEmail: string, ip: string, userAgent: string) {
    const oldVal = await this.getById(id);
    const updated = await docRepository.update(id, data);
    
    await auditRepository.log({
      userId, userEmail, action: 'doc.update', resourceType: 'doc', resourceId: id,
      oldValue: oldVal as any, newValue: updated as any, ipAddress: ip, userAgent
    });
    
    return updated;
  }

  async delete(id: string, userId: string, userEmail: string, ip: string, userAgent: string) {
    await docRepository.softDelete(id);
    
    await auditRepository.log({
      userId, userEmail, action: 'doc.delete', resourceType: 'doc', resourceId: id,
      oldValue: null, newValue: null, ipAddress: ip, userAgent
    });
  }
}

export const docService = new DocService();
