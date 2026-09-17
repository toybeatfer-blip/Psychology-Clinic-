import { prisma } from '../../config/db.js';
import { CreateClinicalNoteInput, UpdateClinicalNoteInput } from './clinical-notes.schemas.js';

export async function getClinicalNotesByPatient(therapistId: string, patientId: string, isAdmin?: boolean) {
  // Verificar acceso al paciente
  const patientWhere: any = { id: patientId };
  if (!isAdmin) {
    patientWhere.therapistId = therapistId;
  }
  const patient = await prisma.patient.findFirst({
    where: patientWhere,
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  const notesWhere: any = { patientId };
  if (!isAdmin) {
    notesWhere.therapistId = therapistId;
  }

  const notes = await prisma.clinicalNote.findMany({
    where: notesWhere,
    orderBy: { sessionDate: 'desc' },
    include: {
      appointment: {
        select: {
          id: true,
          startDateTime: true,
          modality: true,
          status: true,
        },
      },
      attachments: true,
    },
  });

  return notes;
}

export async function getClinicalNoteById(therapistId: string, noteId: string, isAdmin?: boolean) {
  const where: any = { id: noteId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const note = await prisma.clinicalNote.findFirst({
    where,
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
        },
      },
      appointment: true,
      attachments: true,
    },
  });

  if (!note) {
    throw new Error('Nota clínica no encontrada o sin permisos.');
  }

  return note;
}

export async function createClinicalNote(
  therapistId: string,
  data: CreateClinicalNoteInput & { patientId: string },
  isAdmin?: boolean
) {
  const patientWhere: any = { id: data.patientId };
  if (!isAdmin) {
    patientWhere.therapistId = therapistId;
  }
  const patient = await prisma.patient.findFirst({
    where: patientWhere,
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  const effectiveTherapistId = isAdmin ? (patient.therapistId || therapistId) : therapistId;

  // Calcular sessionNumber si no se proporcionó
  let sessionNumber = data.sessionNumber;
  if (!sessionNumber) {
    const count = await prisma.clinicalNote.count({
      where: { patientId: data.patientId, therapistId: effectiveTherapistId },
    });
    sessionNumber = count + 1;
  }

  const sessionDate = data.sessionDate ? new Date(data.sessionDate) : new Date();

  // Si hay appointmentId, verificar que exista y pertenezca al paciente/terapeuta
  if (data.appointmentId) {
    const apptWhere: any = { id: data.appointmentId, patientId: data.patientId };
    if (!isAdmin) {
      apptWhere.therapistId = therapistId;
    }
    const appointment = await prisma.appointment.findFirst({
      where: apptWhere,
    });
    if (!appointment) {
      throw new Error('La cita vinculada no es válida para este paciente.');
    }
  }

  const note = await prisma.clinicalNote.create({
    data: {
      therapistId: effectiveTherapistId,
      patientId: data.patientId,
      appointmentId: data.appointmentId || null,
      sessionNumber,
      sessionDate,
      reasonForSession: data.reasonForSession,
      behavioralObservations: data.behavioralObservations || null,
      diagnosisHypothesis: data.diagnosisHypothesis || null,
      interventionsApplied: data.interventionsApplied,
      treatmentPlanAndTasks: data.treatmentPlanAndTasks || null,
      isConfidential: data.isConfidential,
    },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
        },
      },
      appointment: true,
      attachments: true,
    },
  });

  // Opcional: Si está vinculado a una cita y estaba pendiente, marcar la cita como COMPLETED
  if (data.appointmentId) {
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'COMPLETED' },
    }).catch(() => {});
  }

  return note;
}

export async function updateClinicalNote(
  therapistId: string,
  noteId: string,
  data: UpdateClinicalNoteInput,
  isAdmin?: boolean
) {
  const where: any = { id: noteId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const existing = await prisma.clinicalNote.findFirst({
    where,
  });

  if (!existing) {
    throw new Error('Nota clínica no encontrada o sin permisos.');
  }

  const sessionDate = data.sessionDate ? new Date(data.sessionDate) : existing.sessionDate;

  const updated = await prisma.clinicalNote.update({
    where: { id: noteId },
    data: {
      appointmentId: data.appointmentId !== undefined ? data.appointmentId : existing.appointmentId,
      sessionNumber: data.sessionNumber !== undefined ? data.sessionNumber : existing.sessionNumber,
      sessionDate,
      reasonForSession: data.reasonForSession,
      behavioralObservations: data.behavioralObservations,
      diagnosisHypothesis: data.diagnosisHypothesis,
      interventionsApplied: data.interventionsApplied,
      treatmentPlanAndTasks: data.treatmentPlanAndTasks,
      isConfidential: data.isConfidential,
    },
    include: {
      patient: true,
      appointment: true,
      attachments: true,
    },
  });

  return updated;
}

export async function deleteClinicalNote(therapistId: string, noteId: string, isAdmin?: boolean) {
  const where: any = { id: noteId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const existing = await prisma.clinicalNote.findFirst({
    where,
  });

  if (!existing) {
    throw new Error('Nota clínica no encontrada o sin permisos.');
  }

  await prisma.clinicalNote.delete({
    where: { id: noteId },
  });

  return { message: 'Nota clínica eliminada correctamente' };
}
