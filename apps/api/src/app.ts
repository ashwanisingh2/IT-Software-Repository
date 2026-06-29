import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { checkDbConnection } from './config/database';
import { checkRedisConnection } from './config/redis';
import { checkMinioConnection } from './config/minio';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  const redisStatus = await checkRedisConnection();
  const minioStatus = await checkMinioConnection();

  const isHealthy = dbStatus && redisStatus && minioStatus;

  if (isHealthy) {
    res.status(200).json({ status: 'ok', services: { db: 'ok', redis: 'ok', minio: 'ok' } });
  } else {
    res.status(503).json({ status: 'error', services: { db: dbStatus ? 'ok' : 'error', redis: redisStatus ? 'ok' : 'error', minio: minioStatus ? 'ok' : 'error' } });
  }
});

app.use('/api', routes);
app.use(errorHandler);

export default app;
