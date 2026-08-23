import { prisma } from '../../config/db.js';
import { CreatePatientInput, UpdatePatientInput } from './patients.schemas.js';

export async function getPatients(
  therapistId: string,
  options: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const { search, isActive, page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const where: any = {
    therapistId,
  };

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { fullName: { contains: term } },
      { email: { contains: term } },
      { phone: { contains: term } },
      { occupation: { contains: term } },
    ];
  }

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            appointments: true,
            clinicalNotes: true,
            attachments: true,
          },
        },
      },
    }),
  ]);

  return {
    data: patients,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPatientById(therapistId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      therapistId,
    },
    include: {
      appointments: {
        orderBy: { startDateTime: 'desc' },
        take: 10,
      },
      clinicalNotes: {
        orderBy: { sessionDate: 'desc' },
      },
      attachments: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!patient) {
    throw new Error('Paciente no encontrado o no tiene permisos para acceder a este registro.');
  }

  return patient;
}

export async function createPatient(therapistId: string, data: CreatePatientInput) {
  const birthDate = data.birthDate && data.birthDate !== '' ? new Date(data.birthDate) : null;

  const patient = await prisma.patient.create({
    data: {
      ...data,
      email: data.email && data.email.trim() !== '' ? data.email.trim().toLowerCase() : null,
      birthDate,
      therapistId,
    },
  });

  return patient;
}

export async function updatePatient(therapistId: string, patientId: string, data: UpdatePatientInput) {
  // Verificar propiedad
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, therapistId },
  });

  if (!existing) {
    throw new Error('Paciente no encontrado o no tiene permisos para modificar este registro.');
  }

  const birthDate = data.birthDate !== undefined
    ? (data.birthDate && data.birthDate !== '' ? new Date(data.birthDate) : null)
    : undefined;

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...data,
      email: data.email !== undefined
        ? (data.email && data.email.trim() !== '' ? data.email.trim().toLowerCase() : null)
        : undefined,
      birthDate,
    },
  });

  return updated;
}

export async function deletePatient(therapistId: string, patientId: string) {
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, therapistId },
  });

  if (!existing) {
    throw new Error('Paciente no encontrado o no tiene permisos para eliminar este registro.');
  }

  await prisma.patient.delete({
    where: { id: patientId },
  });

  return { message: 'Paciente eliminado correctamente' };
}
