import { Router } from 'express';
import { agentController } from '../controllers/agentController';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { requireMachineAuth } from '../middleware/machineAuth';

const router = Router();

// --- Admin routes (Requires JWT) ---
router.post('/enrollment-tokens', requireAuth, requirePermission('inventory', 'write'), agentController.createToken);
router.get('/enrollment-tokens', requireAuth, requirePermission('inventory', 'read'), agentController.listTokens);
router.delete('/enrollment-tokens/:id', requireAuth, requirePermission('inventory', 'write'), agentController.revokeToken);

// --- Public / Initial Enrollment routes (No JWT, uses token logic) ---
router.get('/download', agentController.downloadAgent);
router.post('/register', agentController.registerAgent);
router.post('/uninstall-script', requireAuth, requirePermission('inventory', 'write'), agentController.getUninstallScript);

// --- Machine authenticated routes (Uses Machine API Key) ---
router.get('/pending-deployments', requireMachineAuth, agentController.getPendingDeployments);
router.post('/deployment-result', requireMachineAuth, agentController.submitDeploymentResult);
router.post('/error-report', requireMachineAuth, agentController.reportError);

export default router;
