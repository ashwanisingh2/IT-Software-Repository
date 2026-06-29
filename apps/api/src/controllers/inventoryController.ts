import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventoryService';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const result = await inventoryService.getEndpoints(Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const checkin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId } = req.params;
    const result = await inventoryService.checkin(machineId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId } = req.params;
    const result = await inventoryService.getById(machineId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUpdateSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId } = req.query;
    if (!machineId || typeof machineId !== 'string') {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'machineId query param required' };
    }
    const result = await inventoryService.getUpdateSummary(machineId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
