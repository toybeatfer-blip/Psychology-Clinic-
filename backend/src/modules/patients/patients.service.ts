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
    isAdmin?: boolean;
    therapistFilter?: string;
  } = {}
) {
  const { search, isActive, page = 1, limit = 50, isAdmin, therapistFilter } = options;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (!isAdmin) {
    where.therapistId = therapistId;
  } else if (therapistFilter && therapistFilter !== 'ALL') {
    where.therapistId = therapistFilter;
  }

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
        therapist: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
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

  const masterState = await cloudSyncService.getMasterState();
  const userMap = new Map<string, { fullName: string; email: string }>();
  (masterState.users || []).forEach((u) => {
    if (u && u.id) userMap.set(u.id, { fullName: u.fullName, email: u.email });
  });

  const patientMap = new Map<string, any>();

  // 1. Cargar pacientes de tenants cloud
  if (masterState.tenants) {
    Object.entries(masterState.tenants).forEach(([tKey, tenant]) => {
      if (!isAdmin && tKey !== therapistId && !tKey.includes(therapistId)) {
        return;
      }
      if (isAdmin && therapistFilter && therapistFilter !== 'ALL' && tKey !== therapistFilter && !tKey.includes(therapistFilter)) {
        return;
      }
      (tenant.patients || []).forEach((p: any) => {
        if (!p || !p.id) return;
        const therapistInfo = userMap.get(p.therapistId) || userMap.get(tKey);
        patientMap.set(p.id, {
          ...p,
          therapistName: therapistInfo?.fullName || undefined,
          therapistEmail: therapistInfo?.email || undefined,
          _count: {
            appointments: (tenant.appointments || []).filter((a: any) => a.patientId === p.id).length,
            clinicalNotes: (tenant.notes || []).filter((n: any) => n.patientId === p.id).length,
            attachments: (tenant.attachments || []).filter((att: any) => att.patientId === p.id).length,
          },
        });
      });
    });
  }

  // 2. Fusionar pacientes de Prisma (tienen prioridad)
  patients.forEach((p: any) => {
    patientMap.set(p.id, {
      ...p,
      therapistName: p.therapist?.fullName || undefined,
      therapistEmail: p.therapist?.email || undefined,
    });
  });

  let allPatients = Array.from(patientMap.values());

  if (typeof isActive === 'boolean') {
    allPatients = allPatients.filter((p) => (p.isActive ?? true) === isActive);
  }
  if (search && search.trim() !== '') {
    const s = search.trim().toLowerCase();
    allPatients = allPatients.filter(
      (p) =>
        (p.fullName && p.fullName.toLowerCase().includes(s)) ||
        (p.email && p.email.toLowerCase().includes(s)) ||
        (p.phone && p.phone.toLowerCase().includes(s)) ||
        (p.occupation && p.occupation.toLowerCase().includes(s))
    );
  }

  const effectiveTotal = Math.max(total, allPatients.length);
  const pagedPatients = allPatients.slice(skip, skip + limit);

  return {
    data: pagedPatients,
    pagination: {
      total: effectiveTotal,
      page,
      limit,
      totalPages: Math.ceil(effectiveTotal / limit) || 1,
    },
  };
}

export async function getPatientById(therapistId: string, patientId: string, isAdmin: boolean = false) {
  const where: any = { id: patientId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const patient = await prisma.patient.findFirst({
    where,
    include: {
      therapist: {
        select: { id: true, fullName: true, email: true },
      },
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
    const masterState = await cloudSyncService.getMasterState();
    let foundPatient: any = null;
    let foundTenant: any = null;

    if (masterState.tenants) {
      for (const [tKey, tenant] of Object.entries(masterState.tenants)) {
        if (!isAdmin && tKey !== therapistId && !tKey.includes(therapistId)) continue;
        const p = (tenant.patients || []).find((x: any) => x && x.id === patientId);
        if (p) {
          foundPatient = p;
          foundTenant = tenant;
          break;
        }
      }
    }

    if (foundPatient) {
      const u = (masterState.users || []).find((usr) => usr.id === foundPatient.therapistId);
      return {
        ...foundPatient,
        therapistName: u?.fullName || undefined,
        therapistEmail: u?.email || undefined,
        appointments: (foundTenant.appointments || []).filter((a: any) => a.patientId === patientId),
        clinicalNotes: (foundTenant.notes || []).filter((n: any) => n.patientId === patientId),
        attachments: (foundTenant.attachments || []).filter((att: any) => att.patientId === patientId),
      };
    }

    throw new Error('Paciente no encontrado o no tiene permisos para acceder a este registro.');
  }

  return {
    ...patient,
    therapistName: (patient as any).therapist?.fullName || undefined,
    therapistEmail: (patient as any).therapist?.email || undefined,
  };
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

export async function updatePatient(therapistId: string, patientId: string, data: UpdatePatientInput, isAdmin: boolean = false) {
  const where: any = { id: patientId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const existing = await prisma.patient.findFirst({ where });

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

export async function deletePatient(therapistId: string, patientId: string, isAdmin: boolean = false) {
  const where: any = { id: patientId };
  if (!isAdmin) {
    where.therapistId = therapistId;
  }

  const existing = await prisma.patient.findFirst({ where });

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
