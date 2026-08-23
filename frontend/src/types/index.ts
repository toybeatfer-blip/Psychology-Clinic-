export type Role = 'THERAPIST' | 'ADMIN' | 'ASSISTANT';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type AppointmentModality = 'IN_PERSON' | 'ONLINE' | 'HOME_VISIT';

export type AttachmentType =
  | 'CONSENT_FORM'
  | 'PSYCHOMETRIC_TEST'
  | 'MEDICAL_REPORT'
  | 'IDENTIFICATION'
  | 'OTHER';

export interface TherapistProfile {
  id: string;
  userId: string;
  professionalId?: string | null;
  specialty?: string | null;
  phone?: string | null;
  clinicAddress?: string | null;
  bio?: string | null;
  hourlyRate?: number | string | null;
  currency?: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicSettings {
  id: string;
  userId: string;
  clinicName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
  themeMode?: 'light' | 'dark' | 'system';
  sidebarStyle?: 'dark' | 'brand' | 'light';
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  taxId?: string | null;
  receiptFooter?: string | null;
  appointmentNotice?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt?: string;
  profile?: TherapistProfile | null;
}

export interface Patient {
  id: string;
  therapistId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  address?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  initialReason: string;
  clinicalBackground?: string | null;
  currentMedication?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments?: number;
    clinicalNotes?: number;
    attachments?: number;
  };
  appointments?: Appointment[];
  clinicalNotes?: ClinicalNote[];
  attachments?: Attachment[];
}

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  startDateTime: string;
  endDateTime: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  meetingUrl?: string | null;
  locationNotes?: string | null;
  notes?: string | null;
  price?: number | string | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
  };
  clinicalNote?: {
    id: string;
    sessionNumber?: number;
  } | null;
}

export interface ClinicalNote {
  id: string;
  therapistId: string;
  patientId: string;
  appointmentId?: string | null;
  sessionNumber?: number | null;
  sessionDate: string;
  reasonForSession: string;
  behavioralObservations?: string | null;
  diagnosisHypothesis?: string | null;
  interventionsApplied: string;
  treatmentPlanAndTasks?: string | null;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    fullName: string;
  };
  appointment?: Appointment | null;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  therapistId: string;
  patientId: string;
  clinicalNoteId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type: AttachmentType;
  description?: string | null;
  uploadedAt: string;
  clinicalNote?: {
    id: string;
    sessionNumber?: number | null;
    sessionDate?: string;
  } | null;
}

export interface DashboardData {
  metrics: {
    totalPatients: number;
    activePatients: number;
    todayAppointmentsCount: number;
    monthCompletedAppointments: number;
  };
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  recentNotes: ClinicalNote[];
}
