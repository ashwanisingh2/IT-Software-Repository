import { Router } from 'express';
import { agentController } from '../controllers/agentController';
import { verifyAccessToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { requireMachineAuth } from '../middleware/machineAuth';

const router = Router();

// --- Admin routes (Requires JWT) ---
router.post('/enrollment-tokens', verifyAccessToken, checkPermission('inventory', 'write'), agentController.createToken);
router.get('/enrollment-tokens', verifyAccessToken, checkPermission('inventory', 'read'), agentController.listTokens);
router.delete('/enrollment-tokens/:id', verifyAccessToken, checkPermission('inventory', 'write'), agentController.revokeToken);

// --- Public / Initial Enrollment routes (No JWT, uses token logic) ---
router.get('/download', agentController.downloadAgent);
router.post('/register', agentController.registerAgent);
router.post('/uninstall-script', verifyAccessToken, checkPermission('inventory', 'write'), agentController.getUninstallScript);

// --- Machine authenticated routes (Uses Machine API Key) ---
router.get('/pending-deployments', requireMachineAuth, agentController.getPendingDeployments);
router.post('/deployment-result', requireMachineAuth, agentController.submitDeploymentResult);
router.post('/error-report', requireMachineAuth, agentController.reportError);
router.post('/patch-report', requireMachineAuth, agentController.reportPatchStatus);
router.get('/pending-scripts', requireMachineAuth, agentController.getPendingScripts);
router.post('/script-result', requireMachineAuth, agentController.submitScriptResult);
router.get('/pending-policies', requireMachineAuth, agentController.getPendingPolicies);
router.post('/security-report', requireMachineAuth, agentController.reportSecurityStatus);
router.get('/install', agentController.getInstallScript);

export default router;
