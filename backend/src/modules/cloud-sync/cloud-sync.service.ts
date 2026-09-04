import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db.js';

export interface CloudStoredUser {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile?: any;
  clinicSettings?: any;
}

export interface CloudTenantData {
  patients: any[];
  appointments: any[];
  notes: any[];
  attachments: any[];
  clinicSettings?: any;
  tests?: Record<string, any[]>;
  consents?: Record<string, any>;
  evaluations?: Record<string, any>;
  updatedAt?: string;
  lastActivityAt?: string;
}

export interface MasterCloudState {
  users: CloudStoredUser[];
  tenants: Record<string, CloudTenantData>;
  deletedUserIds: string[];
  lastSync: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.resolve(DATA_DIR, 'master_cloud_state.json');

// Estado en memoria para máximo rendimiento
let inMemoryState: MasterCloudState = {
  users: [],
  tenants: {},
  deletedUserIds: [],
  lastSync: new Date().toISOString(),
};

// Cargar estado inicial desde disco
function loadStateFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          inMemoryState = parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSyncBackend] Error al leer estado desde disco:', err);
  }
}

// Guardar estado en disco de forma asíncrona segura
function saveStateToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(inMemoryState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CloudSyncBackend] Error al guardar estado en disco:', err);
  }
}

loadStateFromDisk();

export async function getMasterState(): Promise<MasterCloudState> {
  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        profile: true,
        clinicSettings: true,
        patients: true,
        appointments: true,
        clinicalNotes: true,
        attachments: true,
      },
    });

    if (dbUsers && dbUsers.length > 0) {
      const userMap = new Map<string, CloudStoredUser>();
      const tenants: Record<string, CloudTenantData> = { ...inMemoryState.tenants };

      // Cargar usuarios en memoria primero
      (inMemoryState.users || []).forEach((u) => {
        if (u && u.email) userMap.set(u.email.toLowerCase(), u);
      });

      // Fusionar con usuarios de la base de datos Prisma
      dbUsers.forEach((u) => {
        const emailKey = u.email.toLowerCase();
        const existing = userMap.get(emailKey);

        const userData: CloudStoredUser = {
          id: existing?.id || u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          createdAt: existing?.createdAt || u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
          profile: u.profile ? {
            id: u.profile.id,
            userId: existing?.id || u.id,
            professionalId: u.profile.professionalId || '',
            specialty: u.profile.specialty || '',
            phone: u.profile.phone || '',
            clinicAddress: u.profile.clinicAddress || '',
            bio: u.profile.bio || '',
            hourlyRate: u.profile.hourlyRate ? Number(u.profile.hourlyRate) : 60,
            currency: u.profile.currency || 'USD',
            avatarUrl: u.profile.avatarUrl || '',
            createdAt: u.profile.createdAt.toISOString(),
            updatedAt: u.profile.updatedAt.toISOString(),
          } : existing?.profile,
          clinicSettings: u.clinicSettings ? {
            ...u.clinicSettings,
            createdAt: u.clinicSettings.createdAt.toISOString(),
            updatedAt: u.clinicSettings.updatedAt.toISOString(),
          } : existing?.clinicSettings,
        };

        userMap.set(emailKey, userData);

        // Fusionar pacientes de la base de datos Prisma
        const currentTenant = tenants[userData.id] || tenants[u.id] || {
          patients: [],
          appointments: [],
          notes: [],
          attachments: [],
        };

        const patientMap = new Map<string, any>();
        (currentTenant.patients || []).forEach((p: any) => p && p.id && patientMap.set(p.id, p));
        (u.patients || []).forEach((p: any) => {
          if (!p || !p.id) return;
          const ex = patientMap.get(p.id);
          patientMap.set(p.id, ex ? { ...p, ...ex, therapistId: userData.id } : { ...p, therapistId: userData.id });
        });

        const apptMap = new Map<string, any>();
        (currentTenant.appointments || []).forEach((a: any) => a && a.id && apptMap.set(a.id, a));
        (u.appointments || []).forEach((a: any) => {
          if (!a || !a.id) return;
          const ex = apptMap.get(a.id);
          apptMap.set(a.id, ex ? { ...a, ...ex, therapistId: userData.id } : { ...a, therapistId: userData.id });
        });

        const noteMap = new Map<string, any>();
        (currentTenant.notes || []).forEach((n: any) => n && n.id && noteMap.set(n.id, n));
        (u.clinicalNotes || []).forEach((n: any) => {
          if (!n || !n.id) return;
          const ex = noteMap.get(n.id);
          noteMap.set(n.id, ex ? { ...n, ...ex, therapistId: userData.id } : { ...n, therapistId: userData.id });
        });

        tenants[userData.id] = {
          ...currentTenant,
          patients: Array.from(patientMap.values()),
          appointments: Array.from(apptMap.values()),
          notes: Array.from(noteMap.values()),
          clinicSettings: userData.clinicSettings || currentTenant.clinicSettings,
          updatedAt: new Date().toISOString(),
        };
      });

      inMemoryState.users = Array.from(userMap.values());
      inMemoryState.tenants = tenants;
      inMemoryState.lastSync = new Date().toISOString();
      saveStateToDisk();
    }
  } catch (err) {
    console.warn('[CloudSyncBackend] Lectura desde Prisma no disponible, usando memoria/disco:', err);
  }

  return inMemoryState;
}

export async function mergeAndSaveState(incoming: Partial<MasterCloudState>): Promise<MasterCloudState> {
  const deletedSet = new Set([...(inMemoryState.deletedUserIds || []), ...(incoming.deletedUserIds || [])]);

  // 1. Fusionar Usuarios garantizando que el ID y fecha de registro NUNCA se alteren
  const userMap = new Map<string, CloudStoredUser>();
  const emailToIdMap = new Map<string, string>();

  // Usuarios existentes en el servidor
  (inMemoryState.users || []).forEach((u) => {
    if (u && u.email && !deletedSet.has(u.id)) {
      const emailKey = u.email.toLowerCase();
      userMap.set(emailKey, u);
      emailToIdMap.set(emailKey, u.id);
    }
  });

  // Usuarios entrantes de los clientes
  (incoming.users || []).forEach((u) => {
    if (!u || !u.email || deletedSet.has(u.id)) return;
    const emailKey = u.email.toLowerCase();
    const existing = userMap.get(emailKey);

    if (!existing) {
      userMap.set(emailKey, u);
      emailToIdMap.set(emailKey, u.id);
    } else {
      // PRESERVAR ID Y FECHA DE CREACIÓN ORIGINALES PARA SIEMPRE
      const originalId = existing.id || u.id;
      let earliestCreatedAt = existing.createdAt || u.createdAt || new Date().toISOString();
      if (existing.createdAt && u.createdAt) {
        earliestCreatedAt = new Date(existing.createdAt).getTime() <= new Date(u.createdAt).getTime()
          ? existing.createdAt
          : u.createdAt;
      }

      userMap.set(emailKey, {
        ...existing,
        ...u,
        id: originalId,
        createdAt: earliestCreatedAt,
        updatedAt: new Date().toISOString(),
        profile: {
          ...(existing.profile || {}),
          ...(u.profile || {}),
          userId: originalId,
          createdAt: existing.profile?.createdAt || u.profile?.createdAt || earliestCreatedAt,
          updatedAt: new Date().toISOString(),
        },
      });
      emailToIdMap.set(emailKey, originalId);
    }
  });

  const mergedUsers = Array.from(userMap.values());

  // 2. Fusionar Datos de Consultorios (Tenants)
  const existingTenants = inMemoryState.tenants || {};
  const incomingTenants = incoming.tenants || {};
  const mergedTenants: Record<string, CloudTenantData> = {};

  mergedUsers.forEach((u) => {
    const canonicalId = u.id;
    const emailKey = u.email.toLowerCase();

    // Reunir datos de cualquier tenant previo asociado a este usuario
    const relatedTenants: CloudTenantData[] = [];
    if (existingTenants[canonicalId]) relatedTenants.push(existingTenants[canonicalId]);
    if (incomingTenants[canonicalId]) relatedTenants.push(incomingTenants[canonicalId]);

    // Buscar si existen datos bajo llaves alternativas
    Object.keys(existingTenants).forEach((k) => {
      if (k !== canonicalId && (k.includes(emailKey.replace(/[^a-z0-9]/g, '_')) || k.startsWith('therapist-'))) {
        const t = existingTenants[k];
        if (t && (t.patients?.length || t.appointments?.length || t.notes?.length)) {
          relatedTenants.push(t);
        }
      }
    });
    Object.keys(incomingTenants).forEach((k) => {
      if (k !== canonicalId && (k.includes(emailKey.replace(/[^a-z0-9]/g, '_')) || k.startsWith('therapist-'))) {
        const t = incomingTenants[k];
        if (t && (t.patients?.length || t.appointments?.length || t.notes?.length)) {
          relatedTenants.push(t);
        }
      }
    });

    // Fusionar Pacientes
    const patientMap = new Map<string, any>();
    relatedTenants.forEach((t) => {
      (t.patients || []).forEach((p: any) => {
        if (!p || !p.id) return;
        const exP = patientMap.get(p.id);
        patientMap.set(p.id, exP ? { ...exP, ...p, therapistId: canonicalId } : { ...p, therapistId: canonicalId });
      });
    });
    const finalPatients = Array.from(patientMap.values());

    // Fusionar Citas
    const apptMap = new Map<string, any>();
    relatedTenants.forEach((t) => {
      (t.appointments || []).forEach((a: any) => {
        if (!a || !a.id) return;
        const exA = apptMap.get(a.id);
        apptMap.set(a.id, exA ? { ...exA, ...a, therapistId: canonicalId } : { ...a, therapistId: canonicalId });
      });
    });
    const finalAppointments = Array.from(apptMap.values());

    // Fusionar Notas
    const noteMap = new Map<string, any>();
    relatedTenants.forEach((t) => {
      (t.notes || []).forEach((n: any) => {
        if (!n || !n.id) return;
        const exN = noteMap.get(n.id);
        noteMap.set(n.id, exN ? { ...exN, ...n, therapistId: canonicalId } : { ...n, therapistId: canonicalId });
      });
    });
    const finalNotes = Array.from(noteMap.values());

    // Fusionar Archivos
    const attMap = new Map<string, any>();
    relatedTenants.forEach((t) => {
      (t.attachments || []).forEach((att: any) => {
        if (!att || !att.id) return;
        const exAtt = attMap.get(att.id);
        attMap.set(att.id, exAtt ? { ...exAtt, ...att, therapistId: canonicalId } : { ...att, therapistId: canonicalId });
      });
    });
    const finalAttachments = Array.from(attMap.values());

    // Configuración de la Clínica
    let finalClinicSettings: any = undefined;
    relatedTenants.forEach((t) => {
      if (t.clinicSettings) {
        finalClinicSettings = { ...(finalClinicSettings || {}), ...t.clinicSettings, userId: canonicalId };
      }
    });

    // Tests, Consents, Evaluations
    const finalTests: Record<string, any[]> = {};
    const finalConsents: Record<string, any> = {};
    const finalEvaluations: Record<string, any> = {};

    relatedTenants.forEach((t) => {
      if (t.tests) Object.assign(finalTests, t.tests);
      if (t.consents) Object.assign(finalConsents, t.consents);
      if (t.evaluations) Object.assign(finalEvaluations, t.evaluations);
    });

    // Calcular marca de última actividad en vivo
    let lastActivity = u.createdAt || new Date().toISOString();
    finalPatients.forEach((p) => {
      if (p.updatedAt && new Date(p.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = p.updatedAt;
      }
    });
    finalAppointments.forEach((a) => {
      if (a.updatedAt && new Date(a.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = a.updatedAt;
      }
    });
    finalNotes.forEach((n) => {
      if (n.updatedAt && new Date(n.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = n.updatedAt;
      }
    });

    mergedTenants[canonicalId] = {
      patients: finalPatients,
      appointments: finalAppointments,
      notes: finalNotes,
      attachments: finalAttachments,
      clinicSettings: finalClinicSettings,
      tests: finalTests,
      consents: finalConsents,
      evaluations: finalEvaluations,
      updatedAt: new Date().toISOString(),
      lastActivityAt: lastActivity,
    };
  });

  inMemoryState = {
    users: mergedUsers,
    tenants: mergedTenants,
    deletedUserIds: Array.from(deletedSet),
    lastSync: new Date().toISOString(),
  };

  saveStateToDisk();

  // 3. Persistir en base de datos PostgreSQL / SQLite mediante Prisma de forma asíncrona segura
  try {
    for (const u of mergedUsers) {
      if (!u || !u.email || u.email.toLowerCase() === 'fernando01') continue;

      const dbUser = await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {
          fullName: u.fullName || 'Terapeuta',
          role: u.role || 'THERAPIST',
        },
        create: {
          id: u.id,
          email: u.email.toLowerCase(),
          fullName: u.fullName || 'Terapeuta',
          passwordHash: u.passwordHash || 'password123',
          role: u.role || 'THERAPIST',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        },
      });

      if (u.profile) {
        await prisma.therapistProfile.upsert({
          where: { userId: dbUser.id },
          update: {
            professionalId: u.profile.professionalId || '',
            specialty: u.profile.specialty || '',
            phone: u.profile.phone || '',
            clinicAddress: u.profile.clinicAddress || '',
            bio: u.profile.bio || '',
            hourlyRate: u.profile.hourlyRate ? Number(u.profile.hourlyRate) : 60,
            currency: u.profile.currency || 'USD',
            avatarUrl: u.profile.avatarUrl || '',
          },
          create: {
            userId: dbUser.id,
            professionalId: u.profile.professionalId || '',
            specialty: u.profile.specialty || '',
            phone: u.profile.phone || '',
            clinicAddress: u.profile.clinicAddress || '',
            bio: u.profile.bio || '',
            hourlyRate: u.profile.hourlyRate ? Number(u.profile.hourlyRate) : 60,
            currency: u.profile.currency || 'USD',
            avatarUrl: u.profile.avatarUrl || '',
          },
        }).catch(() => {});
      }

      const tenantData = mergedTenants[u.id] || mergedTenants[dbUser.id];
      if (tenantData && Array.isArray(tenantData.patients)) {
        for (const p of tenantData.patients) {
          if (!p || !p.id || !p.fullName) continue;
          await prisma.patient.upsert({
            where: { id: p.id },
            update: {
              fullName: p.fullName,
              email: p.email || null,
              phone: p.phone || '',
              birthDate: p.birthDate ? new Date(p.birthDate) : null,
              gender: p.gender || null,
              occupation: p.occupation || null,
              maritalStatus: p.maritalStatus || null,
              address: p.address || null,
              emergencyName: p.emergencyName || null,
              emergencyPhone: p.emergencyPhone || null,
              emergencyRelation: p.emergencyRelation || null,
              initialReason: p.initialReason || 'Consulta General',
              clinicalBackground: p.clinicalBackground || null,
              currentMedication: p.currentMedication || null,
              isActive: p.isActive !== false,
            },
            create: {
              id: p.id,
              therapistId: dbUser.id,
              fullName: p.fullName,
              email: p.email || null,
              phone: p.phone || '',
              birthDate: p.birthDate ? new Date(p.birthDate) : null,
              gender: p.gender || null,
              occupation: p.occupation || null,
              maritalStatus: p.maritalStatus || null,
              address: p.address || null,
              emergencyName: p.emergencyName || null,
              emergencyPhone: p.emergencyPhone || null,
              emergencyRelation: p.emergencyRelation || null,
              initialReason: p.initialReason || 'Consulta General',
              clinicalBackground: p.clinicalBackground || null,
              currentMedication: p.currentMedication || null,
              isActive: p.isActive !== false,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            },
          }).catch(() => {});
        }
      }
    }
  } catch (dbErr) {
    console.warn('[CloudSyncBackend] Error persistiendo en Prisma:', dbErr);
  }

  return inMemoryState;
}

export async function deleteUserFromMasterState(userId: string): Promise<MasterCloudState> {
  inMemoryState.deletedUserIds = Array.from(new Set([...inMemoryState.deletedUserIds, userId]));
  inMemoryState.users = inMemoryState.users.filter((u) => u.id !== userId);
  delete inMemoryState.tenants[userId];
  inMemoryState.lastSync = new Date().toISOString();
  saveStateToDisk();

  try {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  } catch {}

  return inMemoryState;
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean): Promise<MasterCloudState> {
  const targetStatus = isSuspended ? 'SUSPENDED' : 'ACTIVE';
  inMemoryState.users = inMemoryState.users.map((u) => {
    if (u.id === userId) {
      return {
        ...u,
        isSuspended,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      };
    }
    return u;
  });
  inMemoryState.lastSync = new Date().toISOString();
  saveStateToDisk();
  return inMemoryState;
}
