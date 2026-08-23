import { Router } from 'express';
import {
  listAttachmentsByPatient,
  createAttachment,
  deleteAttachment,
} from './attachments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createAttachmentSchema } from './attachments.schemas.js';

const router = Router();

router.use(authenticate);

// Direct attachment delete
router.delete('/:id', deleteAttachment);

export default router;

// Nested under /api/patients/:patientId/attachments
export const patientAttachmentsRouter = Router({ mergeParams: true });
patientAttachmentsRouter.use(authenticate);
patientAttachmentsRouter.get('/', listAttachmentsByPatient);
patientAttachmentsRouter.post('/', validate(createAttachmentSchema), createAttachment);
