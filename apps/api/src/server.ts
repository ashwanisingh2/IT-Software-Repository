import app from './app';
import logger from './config/logger';
import { connectRedis } from './config/redis';
import { initMinio } from './config/minio';
import { AuthService } from './services/authService';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectRedis();
    await initMinio();

    // Setup initial super_admin if needed
    const authService = new AuthService();
    await authService.setupInitialAdmin();

    app.listen(PORT, () => {
      logger.info(`API Server running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
