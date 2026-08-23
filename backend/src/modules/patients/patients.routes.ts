import { Router } from 'express';
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from './patients.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createPatientSchema, updatePatientSchema } from './patients.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', listPatients);
router.post('/', validate(createPatientSchema), createPatient);
router.get('/:id', getPatient);
router.put('/:id', validate(updatePatientSchema), updatePatient);
router.delete('/:id', deletePatient);

export default router;
