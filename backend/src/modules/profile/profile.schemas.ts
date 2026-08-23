import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    professionalId: z.string().optional(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    clinicAddress: z.string().optional(),
    bio: z.string().optional(),
    hourlyRate: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    avatarUrl: z.string().url('URL de avatar inválida').optional().or(z.literal('')),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
