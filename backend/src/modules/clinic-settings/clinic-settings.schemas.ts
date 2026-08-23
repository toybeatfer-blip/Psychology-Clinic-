import { z } from 'zod';

export const updateClinicSettingsSchema = z.object({
  body: z.object({
    clinicName: z.string().min(2, 'El nombre de la clínica debe tener al menos 2 caracteres'),
    tagline: z.string().optional().or(z.literal('')),
    logoUrl: z.string().optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color primario hexadecimal inválido').default('#0d9488'),
    secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color secundario hexadecimal inválido').optional(),
    themeMode: z.enum(['light', 'dark', 'system']).default('light'),
    sidebarStyle: z.enum(['dark', 'brand', 'light']).default('dark'),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Correo de contacto inválido').optional().or(z.literal('')),
    website: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    taxId: z.string().optional().or(z.literal('')),
    receiptFooter: z.string().optional().or(z.literal('')),
    appointmentNotice: z.string().optional().or(z.literal('')),
  }),
});

export type UpdateClinicSettingsInput = z.infer<typeof updateClinicSettingsSchema>['body'];
