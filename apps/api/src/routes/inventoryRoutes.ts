import { Router } from 'express';
import { list, checkin, getById, getUpdateSummary } from '../controllers/inventoryController';
import { verifyAccessToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { endpointCheckinSchema } from '../schemas';

const router = Router();

// Endpoints reporting in (usually API key or specialized token, using standard for now)
router.post('/checkin/:machineId', validate(endpointCheckinSchema), checkin);

router.get('/', verifyAccessToken, checkPermission('inventory', 'read'), list);
router.get('/updates', verifyAccessToken, checkPermission('inventory', 'read'), getUpdateSummary);
router.get('/:machineId', verifyAccessToken, checkPermission('inventory', 'read'), getById);

export default router;
