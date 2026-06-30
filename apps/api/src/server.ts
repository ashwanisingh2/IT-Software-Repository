import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { dbPool } from './config/database';
import { redisClient } from './config/redis';
import { minioClient, BUCKET_NAME } from './config/minio';

const PORT = env.API_PORT || 4000;

const startServer = async () => {
  try {
    // Wait for DB
    await dbPool.query('SELECT 1');
    logger.info('Database ready');

    // Wait for Redis
    await redisClient.ping();
    logger.info('Redis ready');

    // Wait for MinIO (it's initialized in config, just verify we can list buckets)
    await minioClient.listBuckets();
    logger.info(`MinIO ready, using bucket: ${BUCKET_NAME}`);

    const server = app.listen(PORT, () => {
      logger.info(`🚀 WinRepo API Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Stale endpoint detection cron (runs every hour)
    setInterval(async () => {
      try {
        const res = await dbPool.query(`
          UPDATE endpoints 
          SET status = 'stale' 
          WHERE last_checkin < NOW() - INTERVAL '12 hours' AND status = 'active'
        `);
        if (res.rowCount && res.rowCount > 0) {
          logger.info(`Marked ${res.rowCount} endpoints as stale.`);
        }
      } catch (err) {
        logger.error('Error running stale endpoint detection:', err);
      }
    }, 60 * 60 * 1000);

    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        await dbPool.end();
        await redisClient.quit();
        logger.info('Closed all connections. Exiting process.');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
