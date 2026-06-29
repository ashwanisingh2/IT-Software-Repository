import { Router } from 'express';
import { AuthController, loginSchema, refreshSchema } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();
const authController = new AuthController();

router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
