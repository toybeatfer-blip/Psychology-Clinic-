import { z } from 'zod';

export const createClinicalNoteSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional().nullable(),
    sessionNumber: z.number().int().positive().optional(),
    sessionDate: z.string().datetime().optional(),
    reasonForSession: z.string().min(3, 'El motivo específico de la sesión es requerido'),
    behavioralObservations: z.string().optional(),
    diagnosisHypothesis: z.string().optional(),
    interventionsApplied: z.string().min(3, 'Las intervenciones aplicadas son requeridas'),
    treatmentPlanAndTasks: z.string().optional(),
    isConfidential: z.boolean().default(true),
  }),
});

export const updateClinicalNoteSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid().optional().nullable(),
    sessionNumber: z.number().int().positive().optional(),
    sessionDate: z.string().datetime().optional(),
    reasonForSession: z.string().min(3).optional(),
    behavioralObservations: z.string().optional(),
    diagnosisHypothesis: z.string().optional(),
    interventionsApplied: z.string().min(3).optional(),
    treatmentPlanAndTasks: z.string().optional(),
    isConfidential: z.boolean().optional(),
  }),
});

export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteSchema>['body'];
export type UpdateClinicalNoteInput = z.infer<typeof updateClinicalNoteSchema>['body'];
