import { Request, Response, NextFunction } from 'express';
import { docService } from '../services/docService';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, category, search, tags } = req.query;
    const tagArray = tags ? (tags as string).split(',') : undefined;
    const result = await docService.getList({ category, search, tags: tagArray }, Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await docService.getById(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated' };
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userEmail = 'unknown';

    const result = await docService.create(req.body, req.user.id, userEmail, ip, userAgent);
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

    const result = await docService.update(req.params.id, req.body, req.user.id, userEmail, ip, userAgent);
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

    await docService.delete(req.params.id, req.user.id, userEmail, ip, userAgent);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
