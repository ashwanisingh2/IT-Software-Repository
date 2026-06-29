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
    const accessToken = authHeader?.split(' ')[1];
    const { refreshToken } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    if (accessToken) {
      await authService.logout(accessToken, refreshToken, ip, userAgent);
    }
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
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
