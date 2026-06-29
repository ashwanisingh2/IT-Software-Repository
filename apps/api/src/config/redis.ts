import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', err);
});

export const setCache = async (key: string, value: any, ttlSeconds?: number) => {
  if (ttlSeconds) {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } else {
    await redisClient.set(key, JSON.stringify(value));
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redisClient.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};
