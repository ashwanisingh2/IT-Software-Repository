import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/userRepository';
import { redisClient } from '../config/redis';
import { AuthResponse, UserRole } from '@winrepo/shared';
import logger from '../config/logger';

const userRepository = new UserRepository();
const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

export class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = uuidv4();
    await redisClient.setEx(`refresh_token:${refreshToken}`, REFRESH_EXPIRES_IN, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      accessToken,
      refreshToken
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await redisClient.del(`refresh_token:${refreshToken}`);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const userId = await redisClient.get(`refresh_token:${refreshToken}`);
    if (!userId) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Revoke old refresh token and generate a new one (Rotation)
    await redisClient.del(`refresh_token:${refreshToken}`);

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const newRefreshToken = uuidv4();
    await redisClient.setEx(`refresh_token:${newRefreshToken}`, REFRESH_EXPIRES_IN, user.id);

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async setupInitialAdmin(): Promise<void> {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@winrepo.local';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'changeme123';
    
    const existingUser = await userRepository.findByEmail(adminEmail);
    if (!existingUser) {
      const hash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await userRepository.create(adminEmail, hash, UserRole.SUPER_ADMIN);
      logger.info(`Initial super_admin created: ${adminEmail}`);
    }
  }
}
