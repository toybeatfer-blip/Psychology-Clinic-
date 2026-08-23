import { prisma } from '../../config/db.js';

export async function getDashboardMetrics(therapistId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalPatients,
    activePatients,
    todayAppointments,
    monthCompletedAppointments,
    upcomingAppointments,
    recentNotes,
  ] = await Promise.all([
    prisma.patient.count({ where: { therapistId } }),
    prisma.patient.count({ where: { therapistId, isActive: true } }),
    prisma.appointment.findMany({
      where: {
        therapistId,
        startDateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startDateTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        clinicalNote: {
          select: { id: true },
        },
      },
    }),
    prisma.appointment.count({
      where: {
        therapistId,
        status: 'COMPLETED',
        startDateTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        therapistId,
        startDateTime: {
          gte: now,
        },
      },
      orderBy: { startDateTime: 'asc' },
      take: 5,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    }),
    prisma.clinicalNote.findMany({
      where: { therapistId },
      orderBy: { sessionDate: 'desc' },
      take: 5,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
  ]);

  return {
    metrics: {
      totalPatients,
      activePatients,
      todayAppointmentsCount: todayAppointments.length,
      monthCompletedAppointments,
    },
    todayAppointments,
    upcomingAppointments,
    recentNotes,
  };
}
