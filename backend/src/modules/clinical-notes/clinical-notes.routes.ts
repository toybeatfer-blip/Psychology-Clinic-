import { Router } from 'express';
import {
  listNotesByPatient,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from './clinical-notes.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createClinicalNoteSchema,
  updateClinicalNoteSchema,
} from './clinical-notes.schemas.js';

const router = Router();

router.use(authenticate);

// Rutas directas de notas clínicas
router.get('/:id', getNote);
router.put('/:id', validate(updateClinicalNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;

// Router anidado para pacientes /api/patients/:patientId/clinical-notes
export const patientNotesRouter = Router({ mergeParams: true });
patientNotesRouter.use(authenticate);
patientNotesRouter.get('/', listNotesByPatient);
patientNotesRouter.post('/', validate(createClinicalNoteSchema), createNote);
