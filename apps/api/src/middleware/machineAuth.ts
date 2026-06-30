import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { endpointRepository } from '../repositories/endpointRepository';
import { CustomError } from './errorHandler';

export const requireMachineAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machineId = req.headers['x-machine-id'] as string;
    const machineKey = req.headers['x-machine-key'] as string;

    if (!machineId || !machineKey) {
      throw new CustomError('Missing machine credentials', 401);
    }

    const endpoint = await endpointRepository.findByMachineId(machineId);
    if (!endpoint || !endpoint.apiKeyHash) {
      throw new CustomError('Invalid machine credentials', 401);
    }

    if (endpoint.status === 'decommissioned') {
      throw new CustomError('Machine is decommissioned', 403);
    }

    const isValid = await bcrypt.compare(machineKey, endpoint.apiKeyHash);
    if (!isValid) {
      throw new CustomError('Invalid machine credentials', 401);
    }

    // Attach machineId to request for downstream handlers
    (req as any).machineId = machineId;
    next();
  } catch (error) {
    next(error);
  }
};
