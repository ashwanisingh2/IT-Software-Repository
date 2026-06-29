import { Pool } from 'pg';
import logger from './logger';

export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

dbPool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
  process.exit(-1);
});

export const checkDbConnection = async () => {
  try {
    const client = await dbPool.connect();
    client.release();
    return true;
  } catch (error: any) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
};
