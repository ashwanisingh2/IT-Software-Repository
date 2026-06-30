import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const result = await authService.login(email, password, ip, userAgent);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw { status: 400, code: 'VALIDATION_ERROR', message: 'Refresh token required' };
    
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
        if (ttl > 0) {
          await redisClient.setEx(`blacklist:${decoded.jti}`, ttl, 'true');
        }
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (e: any) {
    next(e);
  }
};

export const setupMfa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) throw new CustomError('Unauthorized', 401);
    
    const { query } = require('../config/database');
    const emailRes = await query('SELECT email FROM users WHERE id = $1', [user.id]);
    
    const { mfaService } = require('../services/mfaService');
    const result = await mfaService.generateMfaSecret(user.id, emailRes.rows[0].email);
    
    res.json({ success: true, data: result });
  } catch (e: any) { next(e); }
};

export const verifyMfa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) throw new CustomError('Unauthorized', 401);
    const { token } = req.body;
    
    const { mfaService } = require('../services/mfaService');
    const verified = await mfaService.verifyMfaToken(user.id, token);
    
    if (!verified) throw new CustomError('Invalid MFA Token', 400);
    res.json({ success: true, message: 'MFA Enabled successfully' });
  } catch (e: any) { next(e); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw { status: 401, code: 'UNAUTHORIZED', message: 'Not logged in' };
    const user = await userRepository.findById(req.user.id);
    if (!user) throw { status: 404, code: 'NOT_FOUND', message: 'User not found' };
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
