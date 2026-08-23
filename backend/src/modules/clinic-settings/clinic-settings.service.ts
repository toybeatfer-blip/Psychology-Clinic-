import { prisma } from '../../config/db.js';
import { UpdateClinicSettingsInput } from './clinic-settings.schemas.js';

export async function getClinicSettings(userId: string) {
  let settings = await prisma.clinicSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    // Si aún no tiene configuración creada, devolver/crear la configuración inicial
    settings = await prisma.clinicSettings.create({
      data: {
        userId,
        clinicName: 'PsychoCare Consultorio',
        tagline: 'Centro de Psicología y Bienestar Emocional',
        primaryColor: '#0d9488',
        secondaryColor: '#0f766e',
        phone: '+52 55 1234 5678',
        email: 'contacto@psychocare.com',
        address: 'Av. Insurgentes Sur 1450, Consultorio 402, CDMX',
        receiptFooter: 'Este documento contiene información clínica confidencial amparada por el secreto profesional médico.',
        appointmentNotice: 'Por favor notificar cancelaciones o reprogramaciones con al menos 24 horas de anticipación.',
      },
    });
  }

  return settings;
}

export async function updateClinicSettings(userId: string, data: UpdateClinicSettingsInput) {
  const settings = await prisma.clinicSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: {
      ...data,
    },
  });

  return settings;
}
