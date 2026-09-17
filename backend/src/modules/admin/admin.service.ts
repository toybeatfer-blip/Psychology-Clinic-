import { prisma } from '../../config/db.js';
import * as cloudSyncService from '../cloud-sync/cloud-sync.service.js';

export async function getAllRegisteredUsers() {
  const masterState = await cloudSyncService.getMasterState();
  const deletedSet = new Set(masterState.deletedUserIds || []);
  const users = (masterState.users || []).filter((u) => u && !deletedSet.has(u.id));

  return users.map((u) => {
    const emailKey = (u.email || '').toLowerCase().trim();
    const emailPrefix = emailKey.split('@')[0];
    const sanitizedEmail = emailKey.replace(/[^a-z0-9]/g, '_');

    // Reunir datos de cualquier tenant asociado (por ID canónico o alias)
    const matchingTenants: any[] = [];
    if (masterState.tenants) {
      if (masterState.tenants[u.id]) {
        matchingTenants.push(masterState.tenants[u.id]);
      }
      Object.keys(masterState.tenants).forEach((k) => {
        if (k !== u.id) {
          const kLower = k.toLowerCase();
          if (
            (sanitizedEmail && kLower.includes(sanitizedEmail)) ||
            (emailPrefix && emailPrefix.length > 2 && kLower.includes(emailPrefix)) ||
            kLower === `therapist_${emailPrefix}` ||
            kLower === `therapist_${sanitizedEmail}` ||
            k.includes(u.id) ||
            u.id.includes(k)
          ) {
            matchingTenants.push(masterState.tenants[k]);
          }
        }
      });
    }

    // Fusionar pacientes, citas y notas
    const patientMap = new Map<string, any>();
    const apptMap = new Map<string, any>();
    const noteMap = new Map<string, any>();
    let resolvedClinicSettings = u.clinicSettings;

    matchingTenants.forEach((t) => {
      if (t.clinicSettings && !resolvedClinicSettings) resolvedClinicSettings = t.clinicSettings;
      (t.patients || []).forEach((p: any) => {
        if (!p || !p.id) return;
        const ex = patientMap.get(p.id);
        if (!ex) {
          patientMap.set(p.id, p);
        } else {
          const pTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
          const exTime = new Date(ex.updatedAt || ex.createdAt || 0).getTime();
          patientMap.set(p.id, pTime >= exTime ? { ...ex, ...p } : { ...p, ...ex });
        }
      });
      (t.appointments || []).forEach((a: any) => {
        if (!a || !a.id) return;
        const ex = apptMap.get(a.id);
        if (!ex) {
          apptMap.set(a.id, a);
        } else {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const exTime = new Date(ex.updatedAt || ex.createdAt || 0).getTime();
          apptMap.set(a.id, aTime >= exTime ? { ...ex, ...a } : { ...a, ...ex });
        }
      });
      (t.notes || []).forEach((n: any) => {
        if (!n || !n.id) return;
        const ex = noteMap.get(n.id);
        if (!ex) {
          noteMap.set(n.id, n);
        } else {
          const nTime = new Date(n.updatedAt || n.createdAt || 0).getTime();
          const exTime = new Date(ex.updatedAt || ex.createdAt || 0).getTime();
          noteMap.set(n.id, nTime >= exTime ? { ...ex, ...n } : { ...n, ...ex });
        }
      });
    });

    const pList = Array.from(patientMap.values());
    const aList = Array.from(apptMap.values());
    const nList = Array.from(noteMap.values());

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
      clinicSettings: resolvedClinicSettings,
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

export async function getCreatorContact() {
  const masterState = await cloudSyncService.getMasterState();
  return masterState.adminContact || {
    adminName: 'Fernando',
    email: 'toybeatfer@gmail.com',
    phoneWhatsApp: '+52 474 1539891',
    helpMessage: 'Para soporte técnico, alta de consultorios o dudas del sistema, comunícate directamente con el Creador.',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

export async function updateCreatorContact(contactData: {
  adminName?: string;
  email?: string;
  phoneWhatsApp?: string;
  helpMessage?: string;
}) {
  const masterState = await cloudSyncService.getMasterState();
  const current = masterState.adminContact || {
    adminName: 'Fernando',
    email: 'toybeatfer@gmail.com',
    phoneWhatsApp: '+52 474 1539891',
    helpMessage: 'Para soporte técnico, alta de consultorios o dudas del sistema, comunícate directamente con el Creador.',
    updatedAt: new Date().toISOString(),
  };

  const updatedContact = {
    ...current,
    adminName: contactData.adminName !== undefined ? contactData.adminName.trim() : current.adminName,
    email: contactData.email !== undefined ? contactData.email.trim() : current.email,
    phoneWhatsApp: contactData.phoneWhatsApp !== undefined ? contactData.phoneWhatsApp.trim() : current.phoneWhatsApp,
    helpMessage: contactData.helpMessage !== undefined ? contactData.helpMessage.trim() : current.helpMessage,
    updatedAt: new Date().toISOString(),
  };

  await cloudSyncService.updateAdminContactInState(updatedContact);

  return updatedContact;
}

