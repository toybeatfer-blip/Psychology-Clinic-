import { z } from 'zod';

export const AttachmentTypeEnum = z.enum([
  'CONSENT_FORM',
  'PSYCHOMETRIC_TEST',
  'MEDICAL_REPORT',
  'IDENTIFICATION',
  'OTHER',
]);

export const createAttachmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    clinicalNoteId: z.string().uuid().optional().nullable(),
    fileName: z.string().min(1, 'El nombre de archivo es requerido'),
    fileUrl: z.string().url('URL del archivo no válida'),
    fileSize: z.number().int().nonnegative('El tamaño del archivo debe ser positivo'),
    mimeType: z.string().min(1, 'El tipo MIME es requerido'),
    type: AttachmentTypeEnum.default('OTHER'),
    description: z.string().optional(),
  }),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>['body'];
