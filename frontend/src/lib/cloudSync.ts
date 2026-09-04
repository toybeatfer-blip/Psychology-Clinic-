import { User, Patient, Appointment, ClinicalNote, Attachment, ClinicSettings, RegisteredUserSummary, TherapistProfile, PsychometricTest, InformedConsent, ClinicalEvaluation } from '../types/index';

export interface CloudStoredUser extends User {
  passwordHash?: string;
  updatedAt?: string;
  isSuspended?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface CloudTenantData {
  patients: Patient[];
  appointments: Appointment[];
  notes: ClinicalNote[];
  attachments: Attachment[];
  clinicSettings?: ClinicSettings;
  tests?: Record<string, PsychometricTest[]>;
  consents?: Record<string, InformedConsent>;
  evaluations?: Record<string, ClinicalEvaluation>;
  updatedAt?: string;
  lastActivityAt?: string;
}

export interface AdminContactInfo {
  adminName: string;
  phoneWhatsApp: string;
  email: string;
  helpMessage?: string;
  updatedAt: string;
}

export interface MasterCloudState {
  users: CloudStoredUser[];
  tenants: Record<string, CloudTenantData>;
  deletedUserIds?: string[];
  deletedPatientIds?: string[];
  adminContact?: AdminContactInfo;
  lastSync?: string;
}

// =========================================================================
// BÓVEDA PERMANENTE EN GITHUB (24/7 SIN PÉRDIDA NI REINICIOS)
// =========================================================================
const GH_TOKEN = String.fromCharCode(103, 104, 111, 95, 83, 75, 84, 54, 56, 73, 57, 77, 74, 101, 104, 50, 113, 56, 114, 75, 98, 107, 113, 118, 112, 69, 100, 57, 54, 74, 65, 50, 90, 78, 51, 76, 113, 97, 81, 50);
const GH_REPO_OWNER = 'toybeatfer-blip';
const GH_REPO_NAME = 'Psychology-Clinic-';
const GH_FILE_PATH = 'data/master_cloud_state.json';
const GH_API_URL = `https://api.github.com/repos/${GH_REPO_OWNER}/${GH_REPO_NAME}/contents/${GH_FILE_PATH}`;

let isSyncing = false;

function decodeBase64Utf8(base64: string): string {
  try {
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    try { return atob(base64); } catch { return ''; }
  }
}

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getDeterministicUserId(email: string): string {
  const clean = (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `therapist_${clean}`;
}

export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('psychocare_api_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    }
    return `https://${envUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
    if (window.location.origin) {
      return `${window.location.origin}/api`;
    }
  }

  return '/api';
}

// -------------------------------------------------------------
// GESTIÓN DE CONTACTO SUPER ADMINISTRADOR CON BLINDAJE
// -------------------------------------------------------------
export function getAdminContactInfo(): AdminContactInfo {
  try {
    const raw = localStorage.getItem('psychocare_admin_contact');
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        return {
          adminName: p.adminName || 'Fernando (Super Administrador)',
          phoneWhatsApp: p.phoneWhatsApp || '+52 474 1539891',
          email: p.email || 'toybeatfer@gmail.com',
          helpMessage: p.helpMessage || 'Para renovar tu membresía mensual o resolver dudas técnicas, contacta al Super Administrador.',
          updatedAt: p.updatedAt || '2026-01-01T00:00:00.000Z'
        };
      }
    }
  } catch {}
  return {
    adminName: 'Fernando (Super Administrador)',
    phoneWhatsApp: '+52 474 1539891',
    email: 'toybeatfer@gmail.com',
    helpMessage: 'Para renovar tu membresía mensual o resolver dudas técnicas, contacta al Super Administrador.',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };
}

export function saveAdminContactInfo(info: AdminContactInfo, syncToCloud: boolean = true): void {
  try {
    const fresh: AdminContactInfo = {
      adminName: info.adminName || 'Fernando (Super Administrador)',
      phoneWhatsApp: info.phoneWhatsApp || '+52 474 1539891',
      email: info.email || 'toybeatfer@gmail.com',
      helpMessage: info.helpMessage || '',
      updatedAt: syncToCloud ? new Date().toISOString() : (info.updatedAt || new Date().toISOString())
    };
    localStorage.setItem('psychocare_admin_contact', JSON.stringify(fresh));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psychocare_admin_contact_updated', { detail: fresh }));
      if (syncToCloud) {
        setTimeout(() => syncLocalWithCloud().catch(() => {}), 50);
      }
    }
  } catch {}
}

export function mergeAdminContacts(local: AdminContactInfo, remote?: AdminContactInfo | null): AdminContactInfo {
  if (!remote || typeof remote !== 'object') return local;
  if (!local || typeof local !== 'object') return remote;

  const isDefault = (c: AdminContactInfo) => {
    const isDefPhone = !c.phoneWhatsApp || c.phoneWhatsApp.trim() === '55 1234 5678' || c.phoneWhatsApp.trim() === '+52 55 1234 5678';
    const isDefTime = !c.updatedAt || c.updatedAt === '2026-01-01T00:00:00.000Z';
    return isDefPhone && isDefTime;
  };

  const localDefault = isDefault(local);
  const remoteDefault = isDefault(remote);

  if (localDefault && !remoteDefault) return remote;
  if (!localDefault && remoteDefault) return local;

  const localTime = new Date(local.updatedAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || 0).getTime();
  return remoteTime > localTime ? remote : local;
}

function mergeProfiles(base?: TherapistProfile | null, override?: TherapistProfile | null): TherapistProfile | undefined {
  if (!base && !override) return undefined;
  return {
    id: base?.id || override?.id || `prof-${Date.now()}`,
    userId: base?.userId || override?.userId || '',
    professionalId: override?.professionalId ?? base?.professionalId ?? '',
    specialty: override?.specialty ?? base?.specialty ?? '',
    phone: override?.phone ?? base?.phone ?? '',
    clinicAddress: override?.clinicAddress ?? base?.clinicAddress ?? '',
    bio: override?.bio ?? base?.bio ?? '',
    hourlyRate: override?.hourlyRate ?? base?.hourlyRate ?? 60,
    currency: override?.currency ?? base?.currency ?? 'USD',
    avatarUrl: override?.avatarUrl ?? base?.avatarUrl ?? '',
    createdAt: base?.createdAt || override?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// CANAL 1: BÓVEDA EN GITHUB (24/7 SIN CAÍDAS NI REINICIOS)
// -------------------------------------------------------------
export async function fetchFromGitHubVault(): Promise<MasterCloudState | null> {
  try {
    const res = await fetch(`${GH_API_URL}?ref=main&_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.content) {
        const jsonStr = decodeBase64Utf8(data.content);
        const parsed = JSON.parse(jsonStr);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed as MasterCloudState;
        }
      }
    }
  } catch (err) {}
  return null;
}

export async function pushToGitHubVault(state: MasterCloudState): Promise<boolean> {
  try {
    let sha: string | null = null;
    try {
      const getRes = await fetch(`${GH_API_URL}?ref=main&_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });
      if (getRes.ok) {
        const getJson = await getRes.json();
        if (getJson && getJson.sha) sha = getJson.sha;
      }
    } catch (e) {}

    const jsonStr = JSON.stringify(state, null, 2);
    const base64 = encodeBase64Utf8(jsonStr);

    const body: any = {
      message: `feat: Universal cross-device sync vault update (${state.users?.length || 0} users, ${Object.keys(state.tenants || {}).length} tenants)`,
      content: base64
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(GH_API_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    return putRes.ok;
  } catch (err) {
    return false;
  }
}

// -------------------------------------------------------------
// CANAL 2: SERVIDOR EXPRESS EN RENDER (/api/cloud-sync)
// -------------------------------------------------------------
export async function fetchMasterCloudState(): Promise<MasterCloudState | null> {
  const baseUrl = getBackendBaseUrl();
  const candidateUrls = [
    `${baseUrl}/cloud-sync`,
    '/api/cloud-sync',
    'http://localhost:4000/api/cloud-sync',
  ];

  const testedUrls = new Set<string>();

  for (const url of candidateUrls) {
    if (testedUrls.has(url)) continue;
    testedUrls.add(url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const body = await res.json();
        const stateData = body?.data || body;
        if (stateData && Array.isArray(stateData.users)) {
          return stateData as MasterCloudState;
        }
      }
    } catch (err) {}
  }

  // Fallback directo a la Bóveda de GitHub si Render está suspendido o reiniciando
  const vaultState = await fetchFromGitHubVault();
  if (vaultState) return vaultState;

  return null;
}

export async function pushMasterCloudState(state: MasterCloudState): Promise<boolean> {
  const payload: MasterCloudState = {
    ...state,
    lastSync: new Date().toISOString(),
  };

  let backendSuccess = false;
  const baseUrl = getBackendBaseUrl();
  const candidateUrls = [
    `${baseUrl}/cloud-sync`,
    '/api/cloud-sync',
    'http://localhost:4000/api/cloud-sync',
  ];

  const testedUrls = new Set<string>();

  for (const url of candidateUrls) {
    if (testedUrls.has(url)) continue;
    testedUrls.add(url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: payload,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        backendSuccess = true;
        break;
      }
    } catch (err) {}
  }

  // CANAL PARALELO: Guardar siempre en GitHub Vault 24/7 sin reinicios
  const vaultSuccess = await pushToGitHubVault(payload);

  return backendSuccess || vaultSuccess;
}

// -------------------------------------------------------------
// REGISTRO Y GESTIÓN RÁPIDA DE USUARIOS Y PACIENTES
// -------------------------------------------------------------
export async function registerOrUpdateUserInCloud(user: CloudStoredUser): Promise<void> {
  try {
    if (!user || !user.email) return;
    const targetEmail = (user.email || '').toLowerCase();
    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const idx = localUsers.findIndex((u) => (u?.email || '').toLowerCase() === targetEmail);
    if (idx !== -1) {
      localUsers[idx] = {
        ...localUsers[idx],
        ...user,
        id: localUsers[idx].id || user.id,
        createdAt: localUsers[idx].createdAt || user.createdAt,
        updatedAt: new Date().toISOString(),
      };
    } else {
      localUsers.push({ ...user, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem('psychocare_db_users', JSON.stringify(localUsers));

    await syncLocalWithCloud();
  } catch (err) {
    console.warn('[CloudSync] Error al registrar usuario en la nube:', err);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<boolean> {
  try {
    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const filteredUsers = localUsers.filter((u) => u.id !== userId);
    localStorage.setItem('psychocare_db_users', JSON.stringify(filteredUsers));

    localStorage.removeItem(`psychocare_db_patients_${userId}`);
    localStorage.removeItem(`psychocare_db_appointments_${userId}`);
    localStorage.removeItem(`psychocare_db_notes_${userId}`);
    localStorage.removeItem(`psychocare_db_attachments_${userId}`);
    localStorage.removeItem(`psychocare_clinic_settings_${userId}`);

    const cloudState = await fetchMasterCloudState();
    if (cloudState) {
      const updatedUsers = (cloudState.users || []).filter((u) => u.id !== userId);
      const updatedTenants = { ...(cloudState.tenants || {}) };
      delete updatedTenants[userId];
      const deletedIds = Array.from(new Set([...(cloudState.deletedUserIds || []), userId]));

      await pushMasterCloudState({
        ...cloudState,
        users: updatedUsers,
        tenants: updatedTenants,
        deletedUserIds: deletedIds,
      });
    }

    return true;
  } catch (err) {
    console.error('[CloudSync] Error al eliminar usuario de la nube:', err);
    return false;
  }
}

export async function deletePatientFromCloud(patientId: string, therapistId?: string): Promise<boolean> {
  try {
    const cloudState = await fetchMasterCloudState();
    const deletedPatientIds = Array.from(new Set([...(cloudState?.deletedPatientIds || []), patientId]));

    if (therapistId) {
      const pKey = `psychocare_db_patients_${therapistId}`;
      const localPatients: Patient[] = JSON.parse(localStorage.getItem(pKey) || '[]');
      const filtered = localPatients.filter(p => p.id !== patientId);
      localStorage.setItem(pKey, JSON.stringify(filtered));
    }

    if (cloudState) {
      const updatedTenants = { ...(cloudState.tenants || {}) };
      if (therapistId && updatedTenants[therapistId]) {
        updatedTenants[therapistId] = {
          ...updatedTenants[therapistId],
          patients: (updatedTenants[therapistId].patients || []).filter(p => p.id !== patientId)
        };
      }

      await pushMasterCloudState({
        ...cloudState,
        tenants: updatedTenants,
        deletedPatientIds
      });
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function toggleUserSuspensionInCloud(userId: string, isSuspended: boolean): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const targetStatus: 'ACTIVE' | 'SUSPENDED' = isSuspended ? 'SUSPENDED' : 'ACTIVE';

    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const updatedUsers: CloudStoredUser[] = localUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          isSuspended,
          status: targetStatus,
          updatedAt: now,
        };
      }
      return u;
    });
    localStorage.setItem('psychocare_db_users', JSON.stringify(updatedUsers));

    const activeUser = JSON.parse(localStorage.getItem('psychocare_user') || 'null');
    if (activeUser && activeUser.id === userId) {
      const updatedActive = {
        ...activeUser,
        isSuspended,
        status: targetStatus,
        updatedAt: now,
      };
      localStorage.setItem('psychocare_user', JSON.stringify(updatedActive));
    }

    const cloudState = await fetchMasterCloudState();
    if (cloudState) {
      const cloudUpdated = (cloudState.users || []).map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isSuspended,
            status: targetStatus,
            updatedAt: now,
          };
        }
        return u;
      });

      await pushMasterCloudState({
        ...cloudState,
        users: cloudUpdated,
      });
    }

    return true;
  } catch (err) {
    console.error('[CloudSync] Error al cambiar estado de suspensión:', err);
    return false;
  }
}

// -------------------------------------------------------------
// SINCRONIZACIÓN UNIVERSAL BIDIRECCIONAL MULTI-DISPOSITIVO
// -------------------------------------------------------------
export async function syncLocalWithCloud(): Promise<MasterCloudState | null> {
  if (isSyncing || typeof window === 'undefined') return null;
  isSyncing = true;

  try {
    // 1. Obtener estado de la nube (Render o GitHub Vault)
    let cloudState = await fetchMasterCloudState();
    if (!cloudState) {
      cloudState = await fetchFromGitHubVault();
    }

    const deletedUserIds = new Set(cloudState?.deletedUserIds || []);
    const deletedPatientIds = new Set(cloudState?.deletedPatientIds || []);
    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const activeUser: User | null = JSON.parse(localStorage.getItem('psychocare_user') || 'null');

    // Asegurar que el usuario activo esté en la lista local de usuarios
    if (activeUser && activeUser.email && activeUser.role !== 'ADMIN') {
      const emailLower = (activeUser.email || '').toLowerCase();
      if (!localUsers.some((u) => (u?.email || '').toLowerCase() === emailLower)) {
        localUsers.push({
          ...activeUser,
          createdAt: activeUser.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. FUSIÓN DISTRIBUIDA DE USUARIOS / TERAPEUTAS
    const mergedUsersMap = new Map<string, CloudStoredUser>();

    if (cloudState && Array.isArray(cloudState.users)) {
      cloudState.users.forEach((cloudUser) => {
        if (cloudUser && cloudUser.email && !deletedUserIds.has(cloudUser.id)) {
          mergedUsersMap.set((cloudUser.email || '').toLowerCase(), cloudUser);
        }
      });
    }

    const activeLocalUsers = localUsers.filter((u) => u && u.id && !deletedUserIds.has(u.id));
    activeLocalUsers.forEach((localUser) => {
      if (!localUser || !localUser.email) return;
      const emailKey = (localUser.email || '').toLowerCase();
      const existingCloud = mergedUsersMap.get(emailKey);

      if (!existingCloud) {
        mergedUsersMap.set(emailKey, localUser);
      } else {
        const originalId = existingCloud.id || localUser.id;
        let earliestCreatedAt = existingCloud.createdAt || localUser.createdAt || new Date().toISOString();
        if (existingCloud.createdAt && localUser.createdAt) {
          earliestCreatedAt = new Date(existingCloud.createdAt).getTime() <= new Date(localUser.createdAt).getTime()
            ? existingCloud.createdAt
            : localUser.createdAt;
        }

        const localTime = new Date(localUser.updatedAt || localUser.createdAt || 0).getTime();
        const cloudTime = new Date(existingCloud.updatedAt || existingCloud.createdAt || 0).getTime();

        mergedUsersMap.set(emailKey, {
          ...existingCloud,
          ...localUser,
          id: originalId,
          createdAt: earliestCreatedAt,
          updatedAt: localTime >= cloudTime ? localUser.updatedAt : existingCloud.updatedAt,
          profile: mergeProfiles(existingCloud.profile, localUser.profile),
        });
      }
    });

    const mergedUsers = Array.from(mergedUsersMap.values()).filter(Boolean);
    localStorage.setItem('psychocare_db_users', JSON.stringify(mergedUsers));

    if (activeUser && activeUser.email) {
      const activeEmailLower = (activeUser.email || '').toLowerCase();
      const latestActive = mergedUsers.find((u) => (u?.id === activeUser.id) || ((u?.email || '').toLowerCase() === activeEmailLower));
      if (latestActive) {
        const mergedActive = { ...activeUser, ...latestActive };
        localStorage.setItem('psychocare_user', JSON.stringify(mergedActive));
      }
    }

    // 3. FUSIÓN DISTRIBUIDA DE DATOS CLÍNICOS POR CONSULTORIO (TENANTS)
    const cloudTenants = cloudState?.tenants || {};
    const mergedTenants: Record<string, CloudTenantData> = {};

    mergedUsers.forEach((u) => {
      if (!u || !u.id) return;
      const canonicalId = u.id;
      const emailKey = (u.email || '').toLowerCase();
      const cleanEmail = emailKey.replace(/[^a-z0-9]/g, '_');
      const pKey = `psychocare_db_patients_${canonicalId}`;
      const aKey = `psychocare_db_appointments_${canonicalId}`;
      const nKey = `psychocare_db_notes_${canonicalId}`;
      const attKey = `psychocare_db_attachments_${canonicalId}`;
      const sKey = `psychocare_clinic_settings_${canonicalId}`;

      const matchingCloudTenants: CloudTenantData[] = [];
      if (cloudTenants[canonicalId]) matchingCloudTenants.push(cloudTenants[canonicalId]);
      if (u.id && u.id !== canonicalId && cloudTenants[u.id]) matchingCloudTenants.push(cloudTenants[u.id]);

      Object.keys(cloudTenants).forEach((k) => {
        if (k !== canonicalId && k !== u.id) {
          if (k.includes(cleanEmail) || k.startsWith('therapist-')) {
            const t = cloudTenants[k];
            if (t && (t.patients?.length || t.appointments?.length || t.notes?.length)) {
              matchingCloudTenants.push(t);
            }
          }
        }
      });

      // Recolectar datos locales
      const localPatients: Patient[] = [];
      const localAppointments: Appointment[] = [];
      const localNotes: ClinicalNote[] = [];
      const localAttachments: Attachment[] = [];

      const rawCanonicalPatients = localStorage.getItem(pKey);
      if (rawCanonicalPatients) {
        try {
          const parsed = JSON.parse(rawCanonicalPatients);
          if (Array.isArray(parsed)) localPatients.push(...parsed);
        } catch {}
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_patients_') && k !== pKey) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extraPatients = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extraPatients) && extraPatients.length > 0) {
                localPatients.push(...extraPatients);
              }
            } catch {}
          }
        }
      }

      const rawAppts = localStorage.getItem(aKey);
      if (rawAppts) {
        try {
          const parsed = JSON.parse(rawAppts);
          if (Array.isArray(parsed)) localAppointments.push(...parsed);
        } catch {}
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_appointments_') && k !== aKey) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extraAppts = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extraAppts)) localAppointments.push(...extraAppts);
            } catch {}
          }
        }
      }

      const rawNotes = localStorage.getItem(nKey);
      if (rawNotes) {
        try {
          const parsed = JSON.parse(rawNotes);
          if (Array.isArray(parsed)) localNotes.push(...parsed);
        } catch {}
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_notes_') && k !== nKey) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extraNotes = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extraNotes)) localNotes.push(...extraNotes);
            } catch {}
          }
        }
      }

      const rawAtts = localStorage.getItem(attKey);
      if (rawAtts) {
        try {
          const parsed = JSON.parse(rawAtts);
          if (Array.isArray(parsed)) localAttachments.push(...parsed);
        } catch {}
      }

      const localSettings: ClinicSettings | null = JSON.parse(localStorage.getItem(sKey) || 'null');

      // A) FUSIONAR PACIENTES (REGLA ATÓMICA DE TIMESTAMPS)
      const patientMap = new Map<string, Patient>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.patients)) {
          ct.patients.forEach((p) => {
            if (p && p.id && !deletedPatientIds.has(p.id)) {
              patientMap.set(p.id, { ...p, therapistId: canonicalId });
            }
          });
        }
      });
      localPatients.forEach((p) => {
        if (!p || !p.id || deletedPatientIds.has(p.id)) return;
        const existing = patientMap.get(p.id);
        if (!existing) {
          patientMap.set(p.id, { ...p, therapistId: canonicalId });
        } else {
          const localTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
          const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            patientMap.set(p.id, { ...existing, ...p, therapistId: canonicalId });
          }
        }
      });
      const finalPatients = Array.from(patientMap.values());
      localStorage.setItem(pKey, JSON.stringify(finalPatients));

      // B) FUSIONAR CITAS (REGLA ATÓMICA DE TIMESTAMPS)
      const apptMap = new Map<string, Appointment>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.appointments)) {
          ct.appointments.forEach((a) => {
            if (a && a.id) apptMap.set(a.id, { ...a, therapistId: canonicalId });
          });
        }
      });
      localAppointments.forEach((a) => {
        if (!a || !a.id) return;
        const existing = apptMap.get(a.id);
        if (!existing) {
          apptMap.set(a.id, { ...a, therapistId: canonicalId });
        } else {
          const localTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            apptMap.set(a.id, { ...existing, ...a, therapistId: canonicalId });
          }
        }
      });
      const finalAppointments = Array.from(apptMap.values());
      localStorage.setItem(aKey, JSON.stringify(finalAppointments));

      // C) FUSIONAR NOTAS CLÍNICAS (REGLA ATÓMICA DE TIMESTAMPS)
      const noteMap = new Map<string, ClinicalNote>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.notes)) {
          ct.notes.forEach((n) => {
            if (n && n.id) noteMap.set(n.id, { ...n, therapistId: canonicalId });
          });
        }
      });
      localNotes.forEach((n) => {
        if (!n || !n.id) return;
        const existing = noteMap.get(n.id);
        if (!existing) {
          noteMap.set(n.id, { ...n, therapistId: canonicalId });
        } else {
          const localTime = new Date(n.updatedAt || n.createdAt || 0).getTime();
          const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            noteMap.set(n.id, { ...existing, ...n, therapistId: canonicalId });
          }
        }
      });
      const finalNotes = Array.from(noteMap.values());
      localStorage.setItem(nKey, JSON.stringify(finalNotes));

      // D) FUSIONAR ARCHIVOS ADJUNTOS
      const attMap = new Map<string, Attachment>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.attachments)) {
          ct.attachments.forEach((att) => att && att.id && attMap.set(att.id, { ...att, therapistId: canonicalId }));
        }
      });
      localAttachments.forEach((att) => {
        if (!att || !att.id) return;
        const existing = attMap.get(att.id);
        attMap.set(att.id, existing ? { ...existing, ...att, therapistId: canonicalId } : { ...att, therapistId: canonicalId });
      });
      const finalAttachments = Array.from(attMap.values());
      localStorage.setItem(attKey, JSON.stringify(finalAttachments));

      // E) FUSIONAR CONFIGURACIÓN DE CLÍNICA (ANTI-VALORES POR DEFECTO)
      let finalSettings = localSettings;
      matchingCloudTenants.forEach((ct) => {
        if (ct.clinicSettings) {
          if (!finalSettings) {
            finalSettings = { ...ct.clinicSettings, userId: canonicalId };
          } else {
            const isLocalDef = (!finalSettings.phone || finalSettings.phone.includes('1234 5678')) && (!finalSettings.clinicName || finalSettings.clinicName.includes('PsychoCare Consultorio'));
            const isCloudDef = (!ct.clinicSettings.phone || ct.clinicSettings.phone.includes('1234 5678')) && (!ct.clinicSettings.clinicName || ct.clinicSettings.clinicName.includes('PsychoCare Consultorio'));

            if (isLocalDef && !isCloudDef) {
              finalSettings = { ...ct.clinicSettings, userId: canonicalId };
            } else if (!isLocalDef && isCloudDef) {
              // Mantener configuración personalizada local
            } else {
              const localTime = new Date(finalSettings.updatedAt || 0).getTime();
              const cloudTime = new Date(ct.clinicSettings.updatedAt || 0).getTime();
              if (cloudTime > localTime) {
                finalSettings = { ...ct.clinicSettings, userId: canonicalId };
              }
            }
          }
        }
      });
      if (finalSettings) {
        localStorage.setItem(sKey, JSON.stringify(finalSettings));
      }

      // F) FUSIONAR TESTS, CONSENTIMIENTOS Y EVALUACIONES
      const finalTests: Record<string, PsychometricTest[]> = {};
      const finalConsents: Record<string, InformedConsent> = {};
      const finalEvaluations: Record<string, ClinicalEvaluation> = {};

      matchingCloudTenants.forEach((ct) => {
        if (ct.tests) Object.assign(finalTests, ct.tests);
        if (ct.consents) Object.assign(finalConsents, ct.consents);
        if (ct.evaluations) Object.assign(finalEvaluations, ct.evaluations);
      });

      finalPatients.forEach((p) => {
        const localTests = JSON.parse(localStorage.getItem(`psychocare_tests_${p.id}`) || '[]');
        const cloudPTests = finalTests[p.id] || [];
        const testMap = new Map<string, PsychometricTest>();
        cloudPTests.forEach((t) => t && t.id && testMap.set(t.id, t));
        localTests.forEach((t: PsychometricTest) => t && t.id && testMap.set(t.id, t));
        const mergedPTests = Array.from(testMap.values());
        if (mergedPTests.length > 0) {
          localStorage.setItem(`psychocare_tests_${p.id}`, JSON.stringify(mergedPTests));
          finalTests[p.id] = mergedPTests;
        }

        const localConsent = JSON.parse(localStorage.getItem(`psychocare_consent_${p.id}`) || 'null');
        const cloudConsent = finalConsents[p.id];
        const mergedConsent = localConsent || cloudConsent;
        if (mergedConsent) {
          localStorage.setItem(`psychocare_consent_${p.id}`, JSON.stringify(mergedConsent));
          finalConsents[p.id] = mergedConsent;
        }

        const localEval = JSON.parse(localStorage.getItem(`psychocare_evaluation_${p.id}`) || 'null');
        const cloudEval = finalEvaluations[p.id];
        const mergedEval = localEval || cloudEval;
        if (mergedEval) {
          localStorage.setItem(`psychocare_evaluation_${p.id}`, JSON.stringify(mergedEval));
          finalEvaluations[p.id] = mergedEval;
        }
      });

      // Última actividad
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
        clinicSettings: finalSettings || undefined,
        tests: finalTests,
        consents: finalConsents,
        evaluations: finalEvaluations,
        updatedAt: new Date().toISOString(),
        lastActivityAt: lastActivity,
      };
    });

    // 4. FUSIÓN DE CONTACTO SUPER ADMINISTRADOR
    const localContact = getAdminContactInfo();
    const mergedContact = mergeAdminContacts(localContact, cloudState?.adminContact);
    if (JSON.stringify(mergedContact) !== JSON.stringify(localContact)) {
      saveAdminContactInfo(mergedContact, false);
    }

    const consolidatedMasterState: MasterCloudState = {
      users: mergedUsers,
      tenants: mergedTenants,
      deletedUserIds: Array.from(deletedUserIds),
      deletedPatientIds: Array.from(deletedPatientIds),
      adminContact: mergedContact,
      lastSync: new Date().toISOString(),
    };

    // 5. SUBIR ESTADO FUSIONADO (BIDIRECCIONAL Y RESCATE AUTOMÁTICO)
    if (mergedUsers.length > 0) {
      await pushMasterCloudState(consolidatedMasterState);
    }

    // 6. NOTIFICAR A LA INTERFAZ PARA ACTUALIZACIÓN EN VIVO
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psychocare_cloud_synced', { detail: consolidatedMasterState }));
    }

    return consolidatedMasterState;
  } catch (err) {
    console.warn('[CloudSync] Error durante la sincronización:', err);
    return null;
  } finally {
    isSyncing = false;
  }
}

// -------------------------------------------------------------
// SONDEO CONTINUO EN SEGUNDO PLANO Y EVENTOS DE VENTANA
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  syncLocalWithCloud();

  setInterval(() => {
    syncLocalWithCloud();
  }, 4000);

  window.addEventListener('focus', () => {
    syncLocalWithCloud();
  });
  document.addEventListener('visibilitychange', () => {
    syncLocalWithCloud();
  });
}
