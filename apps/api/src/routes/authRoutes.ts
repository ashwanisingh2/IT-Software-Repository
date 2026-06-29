import { Router } from 'express';
import { login, refresh, logout, getMe } from '../controllers/authController';
import { verifyAccessToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', verifyAccessToken, getMe);

export default router;
