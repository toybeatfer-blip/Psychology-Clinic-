import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Correo electrónico no válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    fullName: z.string().min(2, 'El nombre completo es requerido'),
    professionalId: z.string().optional(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Correo electrónico no válido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
