import { Router } from 'express';
import multer from 'multer';
import { SoftwareController, getSoftwareListSchema, uploadSoftwareSchema } from '../controllers/softwareController';
import { validate } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@winrepo/shared';
import { generalLimiter } from '../middleware/rateLimit';

const router = Router();
const softwareController = new SoftwareController();
const upload = multer({ dest: 'uploads/' });

router.use(generalLimiter);

router.get('/', validate(getSoftwareListSchema), softwareController.getSoftwareList.bind(softwareController));
router.get('/:id', softwareController.getSoftware.bind(softwareController));
router.post('/', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEPLOYER]), upload.single('file'), validate(uploadSoftwareSchema), softwareController.upload.bind(softwareController));
router.get('/:id/download', softwareController.download.bind(softwareController));

export default router;
