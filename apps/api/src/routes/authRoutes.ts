import { Router } from 'express';
import { login, refresh, logout, getMe, setupMfa, verifyMfa } from '../controllers/authController';
import { verifyAccessToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', verifyAccessToken, logout);
router.get('/me', verifyAccessToken, getMe);
router.post('/mfa/setup', verifyAccessToken, setupMfa);
router.post('/mfa/verify', verifyAccessToken, verifyMfa);

export default router;
