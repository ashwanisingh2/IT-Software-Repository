import { Router } from 'express';
import { list, checkin, getById, getUpdateSummary, getInstalledSoftware, queueDeployment, decommission } from '../controllers/inventoryController';
import { verifyAccessToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { endpointCheckinSchema } from '../schemas';
import { requireMachineAuth } from '../middleware/machineAuth';

const router = Router();

// Endpoints reporting in using machine API key
router.post('/endpoints/:machineId/checkin', requireMachineAuth, validate(endpointCheckinSchema), checkin);

router.get('/endpoints', verifyAccessToken, checkPermission('inventory', 'read'), list);
router.get('/endpoints/:machineId', verifyAccessToken, checkPermission('inventory', 'read'), getById);
router.delete('/endpoints/:id', verifyAccessToken, checkPermission('inventory', 'write'), decommission);

router.get('/endpoints/:machineId/software', verifyAccessToken, checkPermission('inventory', 'read'), getInstalledSoftware);
router.post('/endpoints/:machineId/deploy', verifyAccessToken, checkPermission('software', 'deploy'), queueDeployment);
router.get('/updates', verifyAccessToken, checkPermission('inventory', 'read'), getUpdateSummary);

export default router;
