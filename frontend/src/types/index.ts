export type Role = 'THERAPIST' | 'ADMIN' | 'ASSISTANT';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type AppointmentModality = 'IN_PERSON' | 'ONLINE' | 'HOME_VISIT';

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'WAIVED';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'INSURANCE' | 'OTHER';

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
  consentTextTemplate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status?: 'ACTIVE' | 'SUSPENDED';
  isSuspended?: boolean;
  suspendedReason?: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: TherapistProfile | null;
}

// -------------------------------------------------------------
// Evaluaciones Clínicas, Anamnesis y Diagnóstico DSM-5 / CIE-11
// -------------------------------------------------------------
export interface MentalStateExam {
  appearance?: string; // Apariencia, higiene y conducta
  consciousness?: string; // Nivel de conciencia
  orientation?: string; // Tiempo, espacio, persona
  affectMood?: string; // Estado de ánimo y afectividad
  speechLanguage?: string; // Fluidez, tono y coherencia
  thoughtProcess?: string; // Curso y contenido del pensamiento
  perception?: string; // Sensopercepción
  judgmentInsight?: string; // Juicio de realidad e insight
  riskAssessment?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'; // Nivel de riesgo
}

export interface ClinicalEvaluation {
  id: string;
  patientId: string;
  therapistId: string;
  evaluationDate: string;
  reasonForConsultationDetailed?: string;
  symptomOnsetDuration?: string;
  familyHistoryGenogram?: string;
  personalHistory?: string;
  mentalStateExam?: MentalStateExam;
  dsm5Code?: string;
  dsm5Diagnosis?: string;
  diagnosticNotes?: string;
  treatmentObjectives?: string;
  theoreticalApproach?: string; // TCC, Sistémico, Psicoanalítico, Humanista, Integrativo
  updatedAt: string;
}

// -------------------------------------------------------------
// Consentimiento Informado & Firma Digital
// -------------------------------------------------------------
export interface InformedConsent {
  id: string;
  patientId: string;
  therapistId: string;
  patientName: string;
  tutorName?: string | null;
  identificationNumber?: string | null;
  signedAt: string;
  signatureDataUrl: string; // Base64 de la firma manuscrita
  clausesAccepted: boolean;
  telehealthAccepted: boolean;
  emergencyContactAccepted: boolean;
  customNotes?: string | null;
  status: 'SIGNED' | 'PENDING';
}

// -------------------------------------------------------------
// Tests Psicométricos Auto-Calificables
// -------------------------------------------------------------
export type PsychometricScaleType = 'PHQ9' | 'GAD7' | 'ROSENBERG' | 'SUICIDE_RISK' | 'CUSTOM';

export interface PsychometricTest {
  id: string;
  therapistId: string;
  patientId: string;
  scaleType: PsychometricScaleType;
  scaleName: string;
  appliedDate: string;
  answers: Record<string | number, number>;
  totalScore: number;
  maxScore: number;
  severity: string; // Ej: "Depresión Moderada", "Ansiedad Severa"
  severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo';
  clinicalInterpretation: string;
  recommendations?: string | null;
  notes?: string | null;
  createdAt: string;
}

// -------------------------------------------------------------
// Control de Pagos y Recibos de Honorarios
// -------------------------------------------------------------
export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  therapistId: string;
  patientId: string;
  appointmentId?: string | null;
  issueDate: string;
  concept: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  patientName: string;
  patientTaxId?: string | null;
  createdAt: string;
}

// -------------------------------------------------------------
// Paciente Integral (Expediente Clínico Completo)
// -------------------------------------------------------------
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
  clinicalEvaluation?: ClinicalEvaluation | null;
  consent?: InformedConsent | null;
  psychometricTests?: PsychometricTest[];
  receipts?: PaymentReceipt[];
}

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  startDateTime: string;
  endDateTime: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  meetingUrl?: string | null; // Enlace directo a Google Meet, Zoom o sala de teleconsulta
  locationNotes?: string | null;
  notes?: string | null;
  price?: number | string | null;
  isPaid: boolean;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  receiptNumber?: string | null;
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
    monthlyIncome?: number;
    pendingPaymentsCount?: number;
  };
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  recentNotes: ClinicalNote[];
}

export interface RegisteredUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status?: 'ACTIVE' | 'SUSPENDED';
  isSuspended?: boolean;
  suspendedReason?: string;
  createdAt: string;
  updatedAt?: string;
  lastActivityAt?: string;
  profile?: TherapistProfile | null;
  clinicSettings?: ClinicSettings | null;
  patientsCount: number;
  appointmentsCount: number;
  notesCount: number;
  patients?: Patient[];
  appointments?: Appointment[];
  notes?: ClinicalNote[];
}
