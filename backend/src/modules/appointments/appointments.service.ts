import { prisma } from '../../config/db.js';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.schemas.js';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;

export async function getAppointments(
  therapistId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
    status?: AppointmentStatus;
  } = {}
) {
  const where: any = {
    therapistId,
  };

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.startDateTime = {};
    if (filters.startDate) {
      where.startDateTime.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.startDateTime.lte = new Date(filters.endDate);
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startDateTime: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      clinicalNote: {
        select: {
          id: true,
          sessionNumber: true,
        },
      },
    },
  });

  return appointments;
}

export async function getAppointmentById(therapistId: string, appointmentId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      therapistId,
    },
    include: {
      patient: true,
      clinicalNote: true,
    },
  });

  if (!appointment) {
    throw new Error('Cita no encontrada o sin permisos.');
  }

  return appointment;
}

export async function createAppointment(therapistId: string, data: CreateAppointmentInput) {
  // Verificar que el paciente pertenezca a este terapeuta
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, therapistId },
  });

  if (!patient) {
    throw new Error('El paciente especificado no existe o no pertenece a tu consultorio.');
  }

  const startDateTime = new Date(data.startDateTime);
  const endDateTime = new Date(data.endDateTime);

  if (endDateTime <= startDateTime) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const appointment = await prisma.appointment.create({
    data: {
      therapistId,
      patientId: data.patientId,
      startDateTime,
      endDateTime,
      modality: data.modality,
      status: data.status,
      meetingUrl: data.meetingUrl || null,
      locationNotes: data.locationNotes || null,
      notes: data.notes || null,
      price: data.price !== undefined ? data.price : null,
      isPaid: data.isPaid,
    },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  return appointment;
}

export async function updateAppointment(
  therapistId: string,
  appointmentId: string,
  data: UpdateAppointmentInput
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, therapistId },
  });

  if (!existing) {
    throw new Error('Cita no encontrada o sin permisos para modificarla.');
  }

  if (data.patientId && data.patientId !== existing.patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, therapistId },
    });
    if (!patient) {
      throw new Error('El nuevo paciente especificado no existe o no pertenece a tu consultorio.');
    }
  }

  const startDateTime = data.startDateTime ? new Date(data.startDateTime) : existing.startDateTime;
  const endDateTime = data.endDateTime ? new Date(data.endDateTime) : existing.endDateTime;

  if (endDateTime <= startDateTime) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      patientId: data.patientId,
      startDateTime: data.startDateTime ? startDateTime : undefined,
      endDateTime: data.endDateTime ? endDateTime : undefined,
      modality: data.modality,
      status: data.status,
      meetingUrl: data.meetingUrl !== undefined ? (data.meetingUrl || null) : undefined,
      locationNotes: data.locationNotes,
      notes: data.notes,
      price: data.price !== undefined ? data.price : undefined,
      isPaid: data.isPaid,
    },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      clinicalNote: true,
    },
  });

  return updated;
}

export async function updateAppointmentStatus(
  therapistId: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, therapistId },
  });

  if (!existing) {
    throw new Error('Cita no encontrada o sin permisos.');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    include: {
      patient: true,
    },
  });

  return updated;
}

export async function deleteAppointment(therapistId: string, appointmentId: string) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, therapistId },
  });

  if (!existing) {
    throw new Error('Cita no encontrada o sin permisos.');
  }

  await prisma.appointment.delete({
    where: { id: appointmentId },
  });

  return { message: 'Cita eliminada correctamente' };
}
