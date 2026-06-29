import { Router } from 'express';
import { list, getById, create, update, remove } from '../controllers/docController';
import { verifyAccessToken, optionalAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

router.get('/', optionalAuth, checkPermission('docs', 'read'), list);
router.get('/:id', optionalAuth, checkPermission('docs', 'read'), getById);

router.post('/', verifyAccessToken, checkPermission('docs', 'write'), create);
router.patch('/:id', verifyAccessToken, checkPermission('docs', 'write'), update);
router.delete('/:id', verifyAccessToken, checkPermission('docs', 'delete'), remove);

export default router;
