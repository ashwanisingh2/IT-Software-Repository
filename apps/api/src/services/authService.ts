import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { redisClient } from '../config/redis';
import { userRepository } from '../repositories/userRepository';
import { auditRepository } from '../repositories/auditRepository';
import { User, UserRole } from '@winrepo/shared';

export class AuthService {
  async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const jti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, jti },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, jti: refreshJti },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any }
    );

    // Store refresh token in Redis (7 days = 604800 seconds)
    await redisClient.setex(`refresh:${refreshJti}`, 604800, user.id);

    await auditRepository.log({
      userId: user.id,
      userEmail: user.email,
      action: 'auth.login',
      resourceType: 'auth',
      resourceId: undefined,
      oldValue: null,
      newValue: null,
      ipAddress: ip,
      userAgent: userAgent
    });

    const { password_hash, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
      
      const userId = await redisClient.get(`refresh:${decoded.jti}`);
      if (!userId || userId !== decoded.sub) {
        throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid or revoked refresh token' };
      }

      await redisClient.del(`refresh:${decoded.jti}`);

      const user = await userRepository.findById(userId);
      if (!user) throw { status: 401, code: 'UNAUTHORIZED', message: 'User not found' };

      const newJti = uuidv4();
      const newRefreshJti = uuidv4();

      const newAccessToken = jwt.sign(
        { sub: user.id, role: user.role, jti: newJti },
        env.JWT_ACCESS_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRY as any }
      );

      const newRefreshToken = jwt.sign(
        { sub: user.id, jti: newRefreshJti },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRY as any }
      );

      await redisClient.setex(`refresh:${newRefreshJti}`, 604800, user.id);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err: any) {
      if (err.status) throw err;
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' };
    }
  }

  async logout(accessToken: string, refreshToken?: string, ip?: string, userAgent?: string) {
    try {
      const decodedAccess = jwt.decode(accessToken) as { jti: string; exp: number; sub: string; email: string };
      if (decodedAccess && decodedAccess.jti) {
        const expiresIn = Math.max(0, decodedAccess.exp - Math.floor(Date.now() / 1000));
        if (expiresIn > 0) {
          await redisClient.setex(`blacklist:${decodedAccess.jti}`, expiresIn, 'revoked');
        }

        await auditRepository.log({
          userId: decodedAccess.sub,
          userEmail: decodedAccess.email || 'unknown',
          action: 'auth.logout',
          resourceType: 'auth',
          resourceId: undefined,
          oldValue: null,
          newValue: null,
          ipAddress: ip || 'unknown',
          userAgent: userAgent || 'unknown'
        });
      }

      if (refreshToken) {
        const decodedRefresh = jwt.decode(refreshToken) as { jti: string };
        if (decodedRefresh && decodedRefresh.jti) {
          await redisClient.del(`refresh:${decodedRefresh.jti}`);
        }
      }
    } catch (error) {
      // Ignore errors on logout decode
    }
  }
}

export const authService = new AuthService();
