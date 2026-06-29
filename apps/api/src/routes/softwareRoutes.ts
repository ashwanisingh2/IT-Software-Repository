import { Router } from 'express';
import multer from 'multer';
import { list, getById, create, update, remove, download, getVersions } from '../controllers/softwareController';
import { verifyAccessToken, optionalAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { validateUpload } from '../middleware/fileValidation';
import { downloadLimiter } from '../middleware/rateLimiter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', optionalAuth, checkPermission('software', 'read'), list);
router.get('/:id', optionalAuth, checkPermission('software', 'read'), getById);
router.get('/:id/versions', optionalAuth, checkPermission('software', 'read'), getVersions);

// Requires deployer/admin/super_admin
router.post('/', verifyAccessToken, checkPermission('software', 'deploy'), upload.single('file'), validateUpload, create);
router.patch('/:id', verifyAccessToken, checkPermission('software', 'write'), update);
router.delete('/:id', verifyAccessToken, checkPermission('software', 'delete'), remove);

// Download is authenticated or optional based on requirements, assuming optional but rate limited
router.get('/:id/download', optionalAuth, checkPermission('software', 'read'), downloadLimiter, download);

export default router;
