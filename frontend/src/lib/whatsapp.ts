import { Appointment } from '../types/index';
import { formatDate, formatTime } from './utils';

export function cleanPhoneNumber(phone: string, defaultCountryCode: string = '52'): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10 && defaultCountryCode) {
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  return cleaned;
}

export function isAppointmentInNext24to48Hours(appointmentDateTime: string | Date): boolean {
  const apptTime = new Date(appointmentDateTime).getTime();
  const now = new Date().getTime();
  const diffHours = (apptTime - now) / (1000 * 60 * 60);

  return diffHours >= 0 && diffHours <= 48;
}

export function generateWhatsAppReminderText(
  patient: { fullName?: string; phone?: string | null } | null | undefined,
  appointment: Appointment,
  clinicName: string = 'Consultorio Psicológico',
  therapistName?: string
): string {
  const patientName = patient?.fullName || 'estimado(a) paciente';
  const dateFormatted = formatDate(appointment.startDateTime);
  const timeFormatted = formatTime(appointment.startDateTime);

  const modalityText =
    appointment.modality === 'ONLINE'
      ? 'Sesión Online por Videollamada'
      : appointment.modality === 'HOME_VISIT'
      ? 'Visita Domiciliaria'
      : 'Sesión Presencial en Consultorio';

  const locationDetail =
    appointment.modality === 'ONLINE' && appointment.meetingUrl
      ? `\n🔗 Enlace de conexión: ${appointment.meetingUrl}`
      : appointment.locationNotes
      ? `\n📍 Ubicación: ${appointment.locationNotes}`
      : '';

  const professionalSign = therapistName ? `\n👨‍⚕️ ${therapistName} | ${clinicName}` : `\n🏥 ${clinicName}`;

  return `👋 Hola *${patientName}*, te recordamos tu cita de psicoterapia programada para el día *${dateFormatted}* a las *${timeFormatted}* (${modalityText}).${locationDetail}

Por favor confirma tu asistencia respondiendo a este mensaje. En caso de requerir reprogramar, avísanos con anticipación. ¡Te esperamos!

${professionalSign}`;
}

export function createWhatsAppReminderLink(
  patient: { fullName?: string; phone?: string | null } | null | undefined,
  appointment: Appointment,
  clinicName: string = 'Consultorio Psicológico',
  therapistName?: string
): string | null {
  const phone = patient?.phone;
  if (!phone) return null;

  const cleanedPhone = cleanPhoneNumber(phone);
  if (!cleanedPhone) return null;

  const message = generateWhatsAppReminderText(patient, appointment, clinicName, therapistName);
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppReminder(
  patient: { fullName?: string; phone?: string | null } | null | undefined,
  appointment: Appointment,
  clinicName: string = 'Consultorio Psicológico',
  therapistName?: string
): boolean {
  const link = createWhatsAppReminderLink(patient, appointment, clinicName, therapistName);
  if (!link) return false;

  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
}
