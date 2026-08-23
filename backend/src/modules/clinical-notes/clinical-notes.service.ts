import { prisma } from '../../config/db.js';
import { CreateClinicalNoteInput, UpdateClinicalNoteInput } from './clinical-notes.schemas.js';

export async function getClinicalNotesByPatient(therapistId: string, patientId: string) {
  // Verificar acceso al paciente
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, therapistId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  const notes = await prisma.clinicalNote.findMany({
    where: {
      patientId,
      therapistId,
    },
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

export async function getClinicalNoteById(therapistId: string, noteId: string) {
  const note = await prisma.clinicalNote.findFirst({
    where: {
      id: noteId,
      therapistId,
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

  if (!note) {
    throw new Error('Nota clínica no encontrada o sin permisos.');
  }

  return note;
}

export async function createClinicalNote(
  therapistId: string,
  data: CreateClinicalNoteInput & { patientId: string }
) {
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, therapistId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  // Calcular sessionNumber si no se proporcionó
  let sessionNumber = data.sessionNumber;
  if (!sessionNumber) {
    const count = await prisma.clinicalNote.count({
      where: { patientId: data.patientId, therapistId },
    });
    sessionNumber = count + 1;
  }

  const sessionDate = data.sessionDate ? new Date(data.sessionDate) : new Date();

  // Si hay appointmentId, verificar que exista y pertenezca al paciente/terapeuta
  if (data.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, therapistId, patientId: data.patientId },
    });
    if (!appointment) {
      throw new Error('La cita vinculada no es válida para este paciente.');
    }
  }

  const note = await prisma.clinicalNote.create({
    data: {
      therapistId,
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
  data: UpdateClinicalNoteInput
) {
  const existing = await prisma.clinicalNote.findFirst({
    where: { id: noteId, therapistId },
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

export async function deleteClinicalNote(therapistId: string, noteId: string) {
  const existing = await prisma.clinicalNote.findFirst({
    where: { id: noteId, therapistId },
  });

  if (!existing) {
    throw new Error('Nota clínica no encontrada o sin permisos.');
  }

  await prisma.clinicalNote.delete({
    where: { id: noteId },
  });

  return { message: 'Nota clínica eliminada correctamente' };
}
