import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Must be logged in' } });
    }

    try {
      const { role } = req.user;
      const cacheKey = `permission:${role}:${resource}:${action}`;
      
      let hasPermission = await getCache<boolean>(cacheKey);

      if (hasPermission === null) {
        const result = await query(
          'SELECT 1 FROM role_permissions WHERE role = $1 AND resource = $2 AND action = $3',
          [role, resource, action]
        );
        hasPermission = (result.rowCount ?? 0) > 0;
        await setCache(cacheKey, hasPermission, 300); // 5 mins
      }

      if (!hasPermission) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
