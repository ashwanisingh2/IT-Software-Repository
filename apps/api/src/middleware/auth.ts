import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import type { Role } from '@winrepo/shared';
export interface AuthUser { id: string; role: Role; email: string }
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}
export function requireRole(...roles: Role[]) { return (req: Request, res: Response, next: NextFunction) => roles.includes(req.user!.role) ? next() : res.status(403).json({ error: 'Forbidden' }); }
