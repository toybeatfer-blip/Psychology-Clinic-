import { Router } from 'express';
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  saveConsentHandler,
  savePsychometricTestHandler,
  saveClinicalEvaluationHandler,
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

// Suite Clínica
router.post('/:id/consent', saveConsentHandler);
router.post('/:id/psychometric-tests', savePsychometricTestHandler);
router.post('/:id/clinical-evaluation', saveClinicalEvaluationHandler);

export default router;
