import { Router } from 'express';
import authRoutes from './authRoutes';
import softwareRoutes from './softwareRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/software', softwareRoutes);
// inventory, docs, admin routes would go here

export default router;
