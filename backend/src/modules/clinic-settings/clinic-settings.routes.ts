import { Router } from 'express';
import { getSettings, updateSettings } from './clinic-settings.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateClinicSettingsSchema } from './clinic-settings.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', validate(updateClinicSettingsSchema), updateSettings);

export default router;
