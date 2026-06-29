import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redisClient } from '../config/redis';
import { UserRole } from '@winrepo/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        jti: string;
      };
    }
  }
}

export const verifyAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: UserRole; jti: string };

    const isBlacklisted = await redisClient.exists(`blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token revoked' } });
    }

    req.user = { id: decoded.sub, role: decoded.role, jti: decoded.jti };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: UserRole; jti: string };
    
    const isBlacklisted = await redisClient.exists(`blacklist:${decoded.jti}`);
    if (!isBlacklisted) {
      req.user = { id: decoded.sub, role: decoded.role, jti: decoded.jti };
    }
    next();
  } catch (error) {
    // Optional auth ignores errors
    next();
  }
};
