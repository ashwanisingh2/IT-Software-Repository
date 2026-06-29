import { Request, Response, NextFunction } from 'express';
import { SoftwareService } from '../services/softwareService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { AuditRepository } from '../repositories/auditRepository';

const softwareService = new SoftwareService();
const auditRepo = new AuditRepository();

export class SoftwareController {
  
  async getSoftwareList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await softwareService.getSoftwareList(page, pageSize, search, category);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSoftware(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await softwareService.getSoftware(id);
      if (!data) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Software not found' } });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
      }

      const result = await softwareService.uploadSoftware(req.body, req.file, req.user!.id);
      
      if (!result) {
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload software' } });
      }

      await auditRepo.log(req.user!.id, 'UPLOAD_SOFTWARE', 'software', result.id, null, result, req.ip || null);

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const url = await softwareService.getDownloadUrl(id, undefined, req.user?.id, req.ip || undefined);
      res.json({ success: true, data: { url } });
    } catch (error: any) {
      if (error.message === 'Software not found') {
         res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
      } else {
        next(error);
      }
    }
  }
}

export const getSoftwareListSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const uploadSoftwareSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    vendor: z.string().optional(),
    category: z.string().optional(),
  }),
});
