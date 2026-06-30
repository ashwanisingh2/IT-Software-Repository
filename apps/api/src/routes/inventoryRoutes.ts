import { Router } from 'express';
import { list, checkin, getById, getUpdateSummary, getInstalledSoftware, queueDeployment, decommission } from '../controllers/inventoryController';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { endpointCheckinSchema } from '../schemas';
import { requireMachineAuth } from '../middleware/machineAuth';

const router = Router();

// Endpoints reporting in using machine API key
router.post('/endpoints/:machineId/checkin', requireMachineAuth, validate(endpointCheckinSchema), checkin);

router.get('/endpoints', requireAuth, requirePermission('inventory', 'read'), list);
router.get('/endpoints/:machineId', requireAuth, requirePermission('inventory', 'read'), getById);
router.delete('/endpoints/:id', requireAuth, requirePermission('inventory', 'write'), decommission);

router.get('/endpoints/:machineId/software', requireAuth, requirePermission('inventory', 'read'), getInstalledSoftware);
router.post('/endpoints/:machineId/deploy', requireAuth, requirePermission('software', 'deploy'), queueDeployment);
router.get('/updates', requireAuth, requirePermission('inventory', 'read'), getUpdateSummary);

export default router;
