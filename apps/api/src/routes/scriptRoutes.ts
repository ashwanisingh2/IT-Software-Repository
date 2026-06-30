import { Router } from 'express';
import { listScripts, createScript, executeScript } from '../controllers/scriptController';
import { verifyAccessToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

router.use(verifyAccessToken);

router.get('/', checkPermission('inventory', 'read'), listScripts);
router.post('/', checkPermission('inventory', 'write'), createScript);
router.post('/execute', checkPermission('inventory', 'write'), executeScript);

export default router;
