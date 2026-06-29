import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { auditRepository } from '../repositories/auditRepository';
import { userRepository } from '../repositories/userRepository';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dashboardService.getStats();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, userId, resourceType, action, from, to } = req.query;
    const result = await auditRepository.list(
      { 
        userId: userId as string, 
        resourceType: resourceType as string, 
        action: action as string, 
        from: from as string, 
        to: to as string 
      }, 
      Number(page) || 1, 
      Number(limit) || 20
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const result = await userRepository.list(Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userRepository.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userRepository.updateRole(req.params.id, req.body.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
