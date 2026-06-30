import { Router } from 'express';
import authRoutes from './authRoutes';
import softwareRoutes from './softwareRoutes';
import inventoryRoutes from './inventoryRoutes';
import adminRoutes from './adminRoutes';
import docRoutes from './docRoutes';
import agentRoutes from './agent';
import remoteRoutes from './remote';
import scriptRoutes from './scriptRoutes';

const router = Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

router.use('/auth', authRoutes);
router.use('/software', softwareRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/admin', adminRoutes);
router.use('/docs', docRoutes);
router.use('/agent', agentRoutes);
router.use('/remote', remoteRoutes);
router.use('/scripts', scriptRoutes);

export default router;
