import { prisma } from '../../config/db.js';
import * as cloudSyncService from '../cloud-sync/cloud-sync.service.js';

export async function getAllRegisteredUsers() {
  const masterState = await cloudSyncService.getMasterState();
  const deletedSet = new Set(masterState.deletedUserIds || []);
  const users = (masterState.users || []).filter((u) => u && !deletedSet.has(u.id));

  return users.map((u) => {
    const tenant = masterState.tenants[u.id] || { patients: [], appointments: [], notes: [] };
    const pList = tenant.patients || [];
    const aList = tenant.appointments || [];
    const nList = tenant.notes || [];

    // Calcular fecha de última actividad en vivo
    let lastActivity = u.createdAt || new Date().toISOString();
    if (u.updatedAt && new Date(u.updatedAt).getTime() > new Date(lastActivity).getTime()) {
      lastActivity = u.updatedAt;
    }
    pList.forEach((p: any) => {
      if (p.updatedAt && new Date(p.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = p.updatedAt;
      }
    });
    aList.forEach((a: any) => {
      if (a.updatedAt && new Date(a.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = a.updatedAt;
      }
    });
    nList.forEach((n: any) => {
      if (n.updatedAt && new Date(n.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = n.updatedAt;
      }
    });

    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      status: u.status || (u.isSuspended ? 'SUSPENDED' : 'ACTIVE'),
      isSuspended: !!u.isSuspended,
      createdAt: u.createdAt || new Date().toISOString(),
      updatedAt: u.updatedAt,
      lastActivityAt: lastActivity,
      profile: u.profile,
      clinicSettings: tenant.clinicSettings || u.clinicSettings,
      patientsCount: pList.length,
      appointmentsCount: aList.length,
      notesCount: nList.length,
      patients: pList,
      appointments: aList,
      notes: nList,
    };
  });
}

export async function deleteUserById(userId: string) {
  if (userId === 'admin_fernando01') {
    throw new Error('No es posible eliminar la cuenta principal de Super Administrador.');
  }

  await cloudSyncService.deleteUserFromMasterState(userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (user && user.role !== 'ADMIN') {
      await prisma.user.delete({
        where: { id: userId },
      });
    }
  } catch {}

  return { success: true, message: 'Usuario y consultorio eliminados permanentemente.' };
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
  await cloudSyncService.toggleUserSuspension(userId, isSuspended);
  return {
    success: true,
    message: isSuspended ? 'Licencia suspendida exitosamente.' : 'Licencia reactivada con éxito.',
  };
}

export async function purgeResidualTestData() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['dr.carlos@psychocare.com', 'demo@psychocare.com'],
      },
    },
  }).catch(() => {});

  return { success: true, message: 'Datos residuales purgados exitosamente.' };
}
