import { Request, Response, NextFunction } from 'express';
import { softwareService } from '../services/softwareService';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, category, status, search } = req.query;
    const result = await softwareService.getList({ category, status, search }, Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await softwareService.getById(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated' };
    const file = req.file;
    if (!file) throw { status: 400, code: 'INVALID_FILE', message: 'File is missing' };
    
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Note: userEmail should ideally be in req.user, but we can fetch it or just pass unknown if we don't query it.
    const userEmail = 'unknown'; // Simplified for now since req.user only has id, role, jti

    const result = await softwareService.create(req.body, file, req.user.id, userEmail, ip, userAgent);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated' };
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userEmail = 'unknown';

    const result = await softwareService.update(req.params.id, req.body, req.user.id, userEmail, ip, userAgent);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated' };
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userEmail = 'unknown';

    await softwareService.delete(req.params.id, req.user.id, userEmail, ip, userAgent);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const download = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated' };
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userEmail = 'unknown';

    const result = await softwareService.download(req.params.id, req.user.id, userEmail, ip, userAgent);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await softwareService.getVersions(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
