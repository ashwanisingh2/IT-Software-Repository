import { Router } from 'express';
import { getStats, getAuditLogs, listUsers, createUser, updateUserRole } from '../controllers/adminController';
import { verifyAccessToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// All admin routes require super_admin or admin roles, enforced via RBAC permissions
router.use(verifyAccessToken);

router.get('/stats', checkPermission('inventory', 'read'), getStats);
router.get('/audit', checkPermission('audit', 'read'), getAuditLogs);

router.get('/users', checkPermission('users', 'read'), listUsers);
router.post('/users', checkPermission('users', 'write'), createUser);
router.patch('/users/:id/role', checkPermission('users', 'write'), updateUserRole);

export default router;
