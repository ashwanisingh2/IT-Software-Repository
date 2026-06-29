import { createClient } from 'redis';
import logger from './logger';

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const checkRedisConnection = async () => {
  try {
    await redisClient.ping();
    return true;
  } catch (error: any) {
    logger.error('Redis connection failed', { error: error.message });
    return false;
  }
};
