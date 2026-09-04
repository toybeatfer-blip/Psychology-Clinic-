import { prisma } from '../../config/db.js';
import { CreatePatientInput, UpdatePatientInput } from './patients.schemas.js';
import * as cloudSyncService from '../cloud-sync/cloud-sync.service.js';

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

export async function savePatientConsent(therapistId: string, patientId: string, consent: any) {
  const masterState = await cloudSyncService.getMasterState();
  const tenant = masterState.tenants[therapistId] || {
    patients: [],
    appointments: [],
    notes: [],
    attachments: [],
  };

  const consents = tenant.consents || {};
  consents[patientId] = consent;

  tenant.consents = consents;
  tenant.updatedAt = new Date().toISOString();

  await cloudSyncService.mergeAndSaveState({
    tenants: {
      [therapistId]: tenant,
    },
  });

  return consent;
}

export async function savePsychometricTest(therapistId: string, patientId: string, test: any) {
  const masterState = await cloudSyncService.getMasterState();
  const tenant = masterState.tenants[therapistId] || {
    patients: [],
    appointments: [],
    notes: [],
    attachments: [],
  };

  const tests = tenant.tests || {};
  const currentTests = tests[patientId] || [];
  currentTests.unshift(test);
  tests[patientId] = currentTests;

  tenant.tests = tests;
  tenant.updatedAt = new Date().toISOString();

  await cloudSyncService.mergeAndSaveState({
    tenants: {
      [therapistId]: tenant,
    },
  });

  return test;
}

export async function saveClinicalEvaluation(therapistId: string, patientId: string, evaluation: any) {
  const masterState = await cloudSyncService.getMasterState();
  const tenant = masterState.tenants[therapistId] || {
    patients: [],
    appointments: [],
    notes: [],
    attachments: [],
  };

  const evaluations = tenant.evaluations || {};
  evaluations[patientId] = evaluation;

  tenant.evaluations = evaluations;
  tenant.updatedAt = new Date().toISOString();

  await cloudSyncService.mergeAndSaveState({
    tenants: {
      [therapistId]: tenant,
    },
  });

  return evaluation;
}
