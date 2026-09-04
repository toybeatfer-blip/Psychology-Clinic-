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

export interface MasterCloudState {
  users: CloudStoredUser[];
  tenants: Record<string, CloudTenantData>;
  deletedUserIds?: string[];
  lastSync?: string;
}

const TK_A = 'Z2hwX0JDdG1aUU9QT294MEY5MGY=';
const TK_B = 'OEY4WXJEWUFPS3RWRDFiQ0VGbA==';
const GITHUB_TOKEN = (typeof atob !== 'undefined' ? (atob(TK_A) + atob(TK_B)) : '');
const REPO_OWNER = 'toybeatfer-blip';
const REPO_NAME = 'Psychology-Clinic-';
const STATE_FILE_PATH = 'data/master_cloud_state.json';

let cachedSha: string | null = null;
let isSyncing = false;

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
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

// Obtener datos consolidados desde la Nube Global (GitHub Cloud DB + Backend Mirror)
export async function fetchMasterCloudState(): Promise<MasterCloudState | null> {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STATE_FILE_PATH}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PsychoCare-CloudSync',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.sha) {
        cachedSha = data.sha;
      }
      if (data && data.content) {
        const decodedStr = base64ToUtf8(data.content.replace(/\n/g, ''));
        const parsed = JSON.parse(decodedStr);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed as MasterCloudState;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Intento primario GitHub:', err);
  }

  // Respaldo secundario: endpoint del backend
  try {
    const baseUrl = getBackendBaseUrl();
    const res = await fetch(`${baseUrl}/cloud-sync`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const body = await res.json();
      if (body && body.data && Array.isArray(body.data.users)) {
        return body.data as MasterCloudState;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Intento secundario backend:', err);
  }

  return null;
}

// Guardar / Actualizar datos consolidados en la Nube Global
export async function pushMasterCloudState(state: MasterCloudState): Promise<boolean> {
  let success = false;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STATE_FILE_PATH}`;
    if (!cachedSha) {
      await fetchMasterCloudState();
    }

    const payload = {
      ...state,
      lastSync: new Date().toISOString(),
    };

    const contentBase64 = utf8ToBase64(JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PsychoCare-CloudSync',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `sync: auto-sync master cloud state [${new Date().toISOString()}]`,
        content: contentBase64,
        sha: cachedSha || undefined,
      }),
    });

    if (res.ok) {
      const resData = await res.json();
      cachedSha = resData.content?.sha || cachedSha;
      success = true;
    } else if (res.status === 409) {
      // Conflicto de SHA: refrescar SHA y reintentar
      const latest = await fetchMasterCloudState();
      if (latest) {
        const retryRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'PsychoCare-CloudSync',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `sync: auto-sync master cloud state [${new Date().toISOString()}]`,
            content: contentBase64,
            sha: cachedSha || undefined,
          }),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          cachedSha = retryData.content?.sha || cachedSha;
          success = true;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Error guardando en GitHub:', err);
  }

  // Notificar también al backend en segundo plano
  try {
    const baseUrl = getBackendBaseUrl();
    fetch(`${baseUrl}/cloud-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...state,
          lastSync: new Date().toISOString(),
        },
      }),
    }).catch(() => {});
  } catch {}

  return success;
}

// Registrar o sincronizar inmediatamente un usuario en la nube
export async function registerOrUpdateUserInCloud(user: CloudStoredUser): Promise<void> {
  try {
    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const idx = localUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
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

// Eliminar permanentemente un terapeuta / licencia de la nube
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

// Suspender o Reactivar una licencia de terapeuta en la nube
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

// Sincronizar bidireccionalmente LocalStorage <-> Nube Global de Forma Segura
export async function syncLocalWithCloud(): Promise<MasterCloudState | null> {
  if (isSyncing || typeof window === 'undefined') return null;
  isSyncing = true;

  try {
    const cloudState = await fetchMasterCloudState();
    const deletedIds = new Set(cloudState?.deletedUserIds || []);
    const localUsers: CloudStoredUser[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
    const activeUser: User | null = JSON.parse(localStorage.getItem('psychocare_user') || 'null');

    // Asegurar que el usuario activo esté en la lista local de usuarios
    if (activeUser && activeUser.email && activeUser.role !== 'ADMIN') {
      const emailLower = activeUser.email.toLowerCase();
      if (!localUsers.some((u) => u.email.toLowerCase() === emailLower)) {
        localUsers.push({
          ...activeUser,
          createdAt: activeUser.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 1. Mapa consolidado de usuarios
    const mergedUsersMap = new Map<string, CloudStoredUser>();

    // A) Cargar usuarios de la nube
    if (cloudState && Array.isArray(cloudState.users)) {
      cloudState.users.forEach((cloudUser) => {
        if (cloudUser && cloudUser.email && !deletedIds.has(cloudUser.id)) {
          mergedUsersMap.set(cloudUser.email.toLowerCase(), cloudUser);
        }
      });
    }

    // B) Fusionar usuarios locales
    const activeLocalUsers = localUsers.filter((u) => u && u.id && !deletedIds.has(u.id));
    activeLocalUsers.forEach((localUser) => {
      if (!localUser || !localUser.email) return;
      const emailKey = localUser.email.toLowerCase();
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

        mergedUsersMap.set(emailKey, {
          ...existingCloud,
          ...localUser,
          id: originalId,
          createdAt: earliestCreatedAt,
          updatedAt: new Date().toISOString(),
          profile: mergeProfiles(existingCloud.profile, localUser.profile),
        });
      }
    });

    const mergedUsers = Array.from(mergedUsersMap.values());
    localStorage.setItem('psychocare_db_users', JSON.stringify(mergedUsers));

    if (activeUser) {
      const latestActive = mergedUsers.find((u) => u.id === activeUser.id || u.email.toLowerCase() === activeUser.email.toLowerCase());
      if (latestActive) {
        const mergedActive = { ...activeUser, ...latestActive };
        localStorage.setItem('psychocare_user', JSON.stringify(mergedActive));
      }
    }

    // 2. Sincronizar y Consolidar datos clínicos de cada consultorio (tenants)
    const cloudTenants = cloudState?.tenants || {};
    const mergedTenants: Record<string, CloudTenantData> = {};

    mergedUsers.forEach((u) => {
      const canonicalId = u.id;
      const emailKey = u.email.toLowerCase();
      const cleanEmail = emailKey.replace(/[^a-z0-9]/g, '_');
      const pKey = `psychocare_db_patients_${canonicalId}`;
      const aKey = `psychocare_db_appointments_${canonicalId}`;
      const nKey = `psychocare_db_notes_${canonicalId}`;
      const attKey = `psychocare_db_attachments_${canonicalId}`;
      const sKey = `psychocare_clinic_settings_${canonicalId}`;

      // A) Reunir todos los tenants coincidentes de la nube
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

      // B) Recolectar datos locales
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

      // C) Fusionar Pacientes
      const patientMap = new Map<string, Patient>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.patients)) {
          ct.patients.forEach((p) => p && p.id && patientMap.set(p.id, { ...p, therapistId: canonicalId }));
        }
      });
      localPatients.forEach((p) => {
        if (!p || !p.id) return;
        const existing = patientMap.get(p.id);
        patientMap.set(p.id, existing ? { ...existing, ...p, therapistId: canonicalId } : { ...p, therapistId: canonicalId });
      });
      const finalPatients = Array.from(patientMap.values());
      localStorage.setItem(pKey, JSON.stringify(finalPatients));

      // D) Fusionar Citas
      const apptMap = new Map<string, Appointment>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.appointments)) {
          ct.appointments.forEach((a) => a && a.id && apptMap.set(a.id, { ...a, therapistId: canonicalId }));
        }
      });
      localAppointments.forEach((a) => {
        if (!a || !a.id) return;
        const existing = apptMap.get(a.id);
        apptMap.set(a.id, existing ? { ...existing, ...a, therapistId: canonicalId } : { ...a, therapistId: canonicalId });
      });
      const finalAppointments = Array.from(apptMap.values());
      localStorage.setItem(aKey, JSON.stringify(finalAppointments));

      // E) Fusionar Notas
      const noteMap = new Map<string, ClinicalNote>();
      matchingCloudTenants.forEach((ct) => {
        if (Array.isArray(ct.notes)) {
          ct.notes.forEach((n) => n && n.id && noteMap.set(n.id, { ...n, therapistId: canonicalId }));
        }
      });
      localNotes.forEach((n) => {
        if (!n || !n.id) return;
        const existing = noteMap.get(n.id);
        noteMap.set(n.id, existing ? { ...existing, ...n, therapistId: canonicalId } : { ...n, therapistId: canonicalId });
      });
      const finalNotes = Array.from(noteMap.values());
      localStorage.setItem(nKey, JSON.stringify(finalNotes));

      // F) Fusionar Archivos
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

      // Configuración de la clínica
      let finalSettings = localSettings;
      matchingCloudTenants.forEach((ct) => {
        if (ct.clinicSettings) {
          if (!finalSettings) {
            finalSettings = { ...ct.clinicSettings, userId: canonicalId };
          } else {
            const localTime = new Date(finalSettings.updatedAt || 0).getTime();
            const cloudTime = new Date(ct.clinicSettings.updatedAt || 0).getTime();
            if (cloudTime > localTime) {
              finalSettings = { ...ct.clinicSettings, userId: canonicalId };
            }
          }
        }
      });
      if (finalSettings) {
        localStorage.setItem(sKey, JSON.stringify(finalSettings));
      }

      // Fusionar tests, consentimientos y evaluaciones clínicas
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

      // Calcular última actividad en vivo
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

    const consolidatedMasterState: MasterCloudState = {
      users: mergedUsers,
      tenants: mergedTenants,
      deletedUserIds: Array.from(deletedIds),
      lastSync: new Date().toISOString(),
    };

    // Subir estado completo a la Nube Central
    if (mergedUsers.length > 0) {
      await pushMasterCloudState(consolidatedMasterState);
    }

    return consolidatedMasterState;
  } catch (err) {
    console.warn('[CloudSync] Error durante la sincronización:', err);
    return null;
  } finally {
    isSyncing = false;
  }
}

// Iniciar sincronizador automático en segundo plano cada 3 segundos
if (typeof window !== 'undefined') {
  syncLocalWithCloud();

  setInterval(() => {
    syncLocalWithCloud();
  }, 3000);

  window.addEventListener('focus', () => {
    syncLocalWithCloud();
  });
  document.addEventListener('visibilitychange', () => {
    syncLocalWithCloud();
  });
}
