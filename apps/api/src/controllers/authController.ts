import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { AuditRepository } from '../repositories/auditRepository';

const authService = new AuthService();
const auditRepo = new AuditRepository();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      await auditRepo.log(result.user.id, 'LOGIN', 'auth', null, null, null, req.ip || null);
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: error.message } });
      } else {
        next(error);
      }
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      if (req.user) {
        await auditRepo.log(req.user.id, 'LOGOUT', 'auth', null, null, null, req.ip || null);
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: error.message } });
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: { user: req.user } });
    } catch (error) {
      next(error);
    }
  }
}

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});
