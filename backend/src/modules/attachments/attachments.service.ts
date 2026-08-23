import { prisma } from '../../config/db.js';
import { CreateAttachmentInput } from './attachments.schemas.js';

export async function getAttachmentsByPatient(therapistId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, therapistId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  const attachments = await prisma.attachment.findMany({
    where: {
      patientId,
      therapistId,
    },
    orderBy: { uploadedAt: 'desc' },
    include: {
      clinicalNote: {
        select: {
          id: true,
          sessionNumber: true,
          sessionDate: true,
        },
      },
    },
  });

  return attachments;
}

export async function createAttachment(
  therapistId: string,
  data: CreateAttachmentInput & { patientId: string }
) {
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, therapistId },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o sin permisos.');
  }

  if (data.clinicalNoteId) {
    const note = await prisma.clinicalNote.findFirst({
      where: { id: data.clinicalNoteId, therapistId, patientId: data.patientId },
    });
    if (!note) {
      throw new Error('La nota clínica indicada no pertenece a este paciente.');
    }
  }

  const attachment = await prisma.attachment.create({
    data: {
      therapistId,
      patientId: data.patientId,
      clinicalNoteId: data.clinicalNoteId || null,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      type: data.type,
      description: data.description || null,
    },
  });

  return attachment;
}

export async function deleteAttachment(therapistId: string, attachmentId: string) {
  const existing = await prisma.attachment.findFirst({
    where: { id: attachmentId, therapistId },
  });

  if (!existing) {
    throw new Error('Archivo no encontrado o sin permisos.');
  }

  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  return { message: 'Archivo eliminado correctamente' };
}
