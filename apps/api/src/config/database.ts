import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
});

dbPool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await dbPool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug('executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await dbPool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  return { client, query, release };
};

// Test connection
dbPool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Failed to connect to the database', err);
  } else {
    logger.info('Database connected successfully');
  }
});
