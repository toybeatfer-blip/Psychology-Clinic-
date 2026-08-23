import { z } from 'zod';

export const AppointmentStatusEnum = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const AppointmentModalityEnum = z.enum([
  'IN_PERSON',
  'ONLINE',
  'HOME_VISIT',
]);

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('ID de paciente inválido'),
    startDateTime: z.string().datetime('Fecha/hora de inicio inválida (formato ISO 8601)'),
    endDateTime: z.string().datetime('Fecha/hora de fin inválida (formato ISO 8601)'),
    modality: AppointmentModalityEnum.default('IN_PERSON'),
    status: AppointmentStatusEnum.default('SCHEDULED'),
    meetingUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    locationNotes: z.string().optional(),
    notes: z.string().optional(),
    price: z.number().nonnegative().optional(),
    isPaid: z.boolean().default(false),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    startDateTime: z.string().datetime().optional(),
    endDateTime: z.string().datetime().optional(),
    modality: AppointmentModalityEnum.optional(),
    status: AppointmentStatusEnum.optional(),
    meetingUrl: z.string().url().optional().or(z.literal('')),
    locationNotes: z.string().optional(),
    notes: z.string().optional(),
    price: z.number().nonnegative().optional(),
    isPaid: z.boolean().optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: AppointmentStatusEnum,
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
