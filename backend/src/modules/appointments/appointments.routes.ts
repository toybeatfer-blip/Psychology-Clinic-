import { Router } from 'express';
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateStatus,
  deleteAppointment,
} from './appointments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
} from './appointments.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', listAppointments);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', validate(updateAppointmentSchema), updateAppointment);
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);
router.delete('/:id', deleteAppointment);

export default router;
