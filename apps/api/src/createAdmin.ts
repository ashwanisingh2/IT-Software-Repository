import { AuthService } from './services/authService';
import { dbPool } from './config/database';
import { redisClient } from './config/redis';

async function run() {
  try {
    const authService = new AuthService();
    process.env.INITIAL_ADMIN_EMAIL = 'rs170311@gmail.com';
    process.env.INITIAL_ADMIN_PASSWORD = 'password123';
    
    // Attempt to connect to the DB
    await dbPool.query('SELECT 1');
    
    await authService.setupInitialAdmin();
    console.log('Admin created successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await dbPool.end();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}
run();
