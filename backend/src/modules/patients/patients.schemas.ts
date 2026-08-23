import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'El nombre completo es obligatorio'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().min(6, 'El teléfono es obligatorio'),
    birthDate: z.string().optional().or(z.literal('')),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    initialReason: z.string().min(3, 'El motivo inicial de consulta es obligatorio'),
    clinicalBackground: z.string().optional(),
    currentMedication: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(6).optional(),
    birthDate: z.string().optional().or(z.literal('')),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    initialReason: z.string().optional(),
    clinicalBackground: z.string().optional(),
    currentMedication: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];
