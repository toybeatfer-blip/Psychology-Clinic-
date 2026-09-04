import { User, Patient, Appointment, ClinicalNote, Attachment, ClinicSettings } from '../types/index';

export const DEFAULT_USER: User = {
  id: 'therapist-admin-001',
  email: 'terapeuta@psychocare.com',
  fullName: 'Terapeuta Titular',
  role: 'THERAPIST',
  profile: {
    id: 'profile-001',
    userId: 'therapist-admin-001',
    professionalId: '',
    specialty: 'Psicología Clínica',
    phone: '',
    clinicAddress: '',
    bio: '',
    hourlyRate: 50,
    currency: 'USD',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  id: 'clinic-settings-001',
  userId: 'therapist-admin-001',
  clinicName: 'Consultorio Psicológico',
  tagline: 'Atención Clínica y Psicoterapia Especializada',
  logoUrl: '',
  primaryColor: '#0d9488',
  secondaryColor: '#0f766e',
  themeMode: 'light',
  sidebarStyle: 'dark',
  phone: '',
  email: '',
  website: '',
  address: '',
  taxId: '',
  receiptFooter: 'Este documento contiene información clínica confidencial amparada bajo secreto profesional.',
  appointmentNotice: 'Por favor notificar cancelaciones o reprogramaciones con al menos 24 horas de anticipación.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_NOTES: ClinicalNote[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_ATTACHMENTS: Attachment[] = [];
