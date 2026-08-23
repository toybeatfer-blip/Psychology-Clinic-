import { Router } from 'express';
import { getProfile, updateProfile, exportBackup, restoreBackup } from './profile.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './profile.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', validate(updateProfileSchema), updateProfile);
router.get('/backup', exportBackup);
router.post('/restore', restoreBackup);

export default router;
