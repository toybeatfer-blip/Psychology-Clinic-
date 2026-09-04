import {
  DEFAULT_USER,
  DEFAULT_CLINIC_SETTINGS,
} from './demoData';
import {
  Patient,
  Appointment,
  ClinicalNote,
  Attachment,
  ClinicSettings,
  User,
  RegisteredUserSummary,
  PsychometricTest,
  ClinicalEvaluation,
  InformedConsent,
} from '../types/index';
import { syncLocalWithCloud, deleteUserFromCloud, toggleUserSuspensionInCloud, registerOrUpdateUserInCloud, getDeterministicUserId } from './cloudSync';

export function getApiBaseUrl(): string {
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

export function hasCustomBackendConfigured(): boolean {
  return true;
}

function shouldUseLocalEngine(): boolean {
  return false;
}

// -------------------------------------------------------------
// Base de Datos Aislada por Terapeuta (Multi-Tenant Seguro)
// -------------------------------------------------------------
interface StoredUserAccount extends User {
  passwordHash?: string;
}

function getActiveUser(): User | null {
  try {
    const saved = localStorage.getItem('psychocare_user');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

function getActiveUserId(): string {
  const u = getActiveUser();
  return u?.id || 'default_user';
}

function isAdminActive(): boolean {
  const u = getActiveUser();
  return u?.role === 'ADMIN';
}

function getScopedKey(baseKey: string, specificUserId?: string): string {
  const userId = specificUserId || getActiveUserId();
  return `${baseKey}_${userId}`;
}

// Limpiador automático de datos ficticios / legacy mock heredados de pruebas previas
function sanitizeCollection<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item: any) => {
    if (!item || typeof item !== 'object') return false;
    // Filtrar IDs o nombres de prueba antiguos
    if (
      item.id === 'patient-1' ||
      item.id === 'patient-2' ||
      item.id === 'patient-3' ||
      item.id === 'patient-4' ||
      item.id === 'appt-1' ||
      item.id === 'appt-2' ||
      item.id === 'appt-3' ||
      item.id === 'appt-4' ||
      item.id === 'note-1' ||
      item.id === 'note-2' ||
      item.fullName === 'Sofía Ramírez Castro' ||
      item.fullName === 'Mateo Gómez Herrera' ||
      item.fullName === 'Valentina Torres Mendoza' ||
      item.fullName === 'Carlos Morales Benítez'
    ) {
      return false;
    }
    return true;
  });
}

export function purgeAllLegacyTestData(): void {
  try {
    const keysToClean = [
      'psychocare_db_patients',
      'psychocare_db_appointments',
      'psychocare_db_notes',
      'psychocare_db_attachments',
    ];

    keysToClean.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = sanitizeCollection(parsed);
          localStorage.setItem(k, JSON.stringify(cleaned));
        }
      }
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('psychocare_db_patients_') ||
          key.startsWith('psychocare_db_appointments_') ||
          key.startsWith('psychocare_db_notes_') ||
          key.startsWith('psychocare_db_attachments_'))
      ) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = sanitizeCollection(parsed);
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        }
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  purgeAllLegacyTestData();
}

function getLocalCollection<T>(key: string, defaultData: T[] = []): T[] {
  try {
    const saved = localStorage.getItem(key);
    let parsed: any[] = [];
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        parsed = JSON.parse(saved);
      } catch {}
    }

    if (!Array.isArray(parsed)) parsed = [];

    // Consolidar pacientes/citas/notas si están bajo llaves legadas o alternativas
    if (parsed.length === 0 && (key.startsWith('psychocare_db_patients_') || key.startsWith('psychocare_db_appointments_') || key.startsWith('psychocare_db_notes_'))) {
      const activeUser = getActiveUser();
      if (activeUser && activeUser.email) {
        const cleanEmail = activeUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const prefix = key.split('_')[2]; // 'patients' | 'appointments' | 'notes'
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`psychocare_db_${prefix}_`) && k !== key) {
            if (k.includes(cleanEmail) || k.includes('therapist-')) {
              try {
                const leg = JSON.parse(localStorage.getItem(k) || '[]');
                if (Array.isArray(leg) && leg.length > 0) {
                  parsed.push(...leg);
                }
              } catch {}
            }
          }
        }
      }
    }

    const sanitized = sanitizeCollection(parsed);
    if (sanitized.length > 0 && (!saved || sanitized.length !== parsed.length)) {
      localStorage.setItem(key, JSON.stringify(sanitized));
    }
    return (sanitized.length > 0 ? sanitized : defaultData) as T[];
  } catch {
    return defaultData;
  }
}

function saveLocalCollection<T>(key: string, data: T[]): void {
  try {
    const sanitized = sanitizeCollection(data);
    localStorage.setItem(key, JSON.stringify(sanitized));
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        syncLocalWithCloud();
      }, 50);
    }
  } catch {}
}

function handleMockRequest<T>(endpoint: string, method: string = 'GET', body?: any): T {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 1. Autenticación & Registro de Terapeutas
  if (clean.startsWith('auth/login') && body) {
    const identifier = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    // Verificación de Super Usuario / Creador del Sistema
    if (
      (identifier === 'fernando01' ||
        identifier === 'fernando' ||
        identifier === 'fernando01@psychocare.com' ||
        identifier.startsWith('fernando01@') ||
        identifier.startsWith('fernando@')) &&
      password === 'Bazzoka1313AS.'
    ) {
      const superAdminUser: User = {
        id: 'admin_fernando01',
        email: 'Fernando01',
        fullName: 'Fernando (Super Administrador)',
        role: 'ADMIN',
        profile: {
          id: 'profile_admin_01',
          userId: 'admin_fernando01',
          professionalId: 'ADMIN-MASTER-01',
          specialty: 'Administración Global del Sistema',
          phone: '',
          hourlyRate: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const token = `superadmin-jwt-token-${Date.now()}`;
      localStorage.setItem('psychocare_token', token);
      localStorage.setItem('psychocare_user', JSON.stringify(superAdminUser));
      return {
        success: true,
        data: { user: superAdminUser, token },
      } as T;
    }

    const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);
    const user = users.find((u) => (u?.email || '').toLowerCase() === identifier);

    if (!user) {
      throw new Error('No se encontró ningún consultorio registrado con este correo electrónico. Por favor regístrate como terapeuta.');
    }

    if (user.passwordHash && password && user.passwordHash !== password) {
      throw new Error('La contraseña ingresada es incorrecta.');
    }

    if (user.isSuspended || user.status === 'SUSPENDED') {
      throw new Error('⚠️ Su licencia o cuenta de consultorio ha sido suspendida por el Super Administrador.');
    }

    const token = `jwt-token-local-${Date.now()}`;
    localStorage.setItem('psychocare_token', token);
    localStorage.setItem('psychocare_user', JSON.stringify(user));
    return {
      success: true,
      data: { user, token },
    } as T;
  }

  if (clean.startsWith('auth/register') && body) {
    const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);
    const reqEmail = (body.email || '').trim().toLowerCase();
    const existing = users.find((u) => (u?.email || '').toLowerCase() === reqEmail);

    if (existing) {
      throw new Error('Ya existe un consultorio registrado con este correo electrónico.');
    }

    const newId = getDeterministicUserId(body.email || '');
    const newUser: StoredUserAccount = {
      id: newId,
      email: body.email || '',
      fullName: body.fullName || 'Terapeuta Registrado',
      passwordHash: body.password || 'password123',
      role: 'THERAPIST',
      createdAt: new Date().toISOString(),
      profile: {
        id: `profile_${reqEmail.replace(/[^a-z0-9]/g, '_')}`,
        userId: newId,
        professionalId: body.professionalId || '',
        specialty: body.specialty || 'Psicología Clínica',
        phone: body.phone || '',
        hourlyRate: 50,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    users.push(newUser);
    saveLocalCollection('psychocare_db_users', users);
    registerOrUpdateUserInCloud(newUser);

    // Inicializar colecciones limpias para el nuevo consultorio
    localStorage.setItem(getScopedKey('psychocare_db_patients', newId), JSON.stringify([]));
    localStorage.setItem(getScopedKey('psychocare_db_appointments', newId), JSON.stringify([]));
    localStorage.setItem(getScopedKey('psychocare_db_notes', newId), JSON.stringify([]));
    localStorage.setItem(getScopedKey('psychocare_db_attachments', newId), JSON.stringify([]));

    const token = `jwt-token-reg-${Date.now()}`;
    localStorage.setItem('psychocare_token', token);
    localStorage.setItem('psychocare_user', JSON.stringify(newUser));

    return {
      success: true,
      data: { user: newUser, token },
    } as T;
  }

  if (clean.startsWith('auth/forgot-password') && body) {
    const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);
    const emailToFind = (body.email || '').trim().toLowerCase();
    const user = users.find((u) => (u?.email || '').toLowerCase() === emailToFind);

    if (!user) {
      throw new Error('No se encontró ningún consultorio registrado con este correo electrónico.');
    }

    return {
      success: true,
      message: 'Cuenta de terapeuta verificada con éxito.',
      data: { email: user.email, fullName: user.fullName },
    } as T;
  }

  if (clean.startsWith('auth/reset-password') && body) {
    const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);
    const emailToFind = (body.email || '').trim().toLowerCase();
    const userIdx = users.findIndex((u) => (u?.email || '').toLowerCase() === emailToFind);

    if (userIdx === -1) {
      throw new Error('Cuenta de terapeuta no encontrada.');
    }

    users[userIdx].passwordHash = body.newPassword;
    saveLocalCollection('psychocare_db_users', users);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    } as T;
  }

  if (clean.startsWith('auth/me')) {
    const saved = localStorage.getItem('psychocare_user');
    const user = saved ? JSON.parse(saved) : DEFAULT_USER;
    return { success: true, data: user } as T;
  }

  // -------------------------------------------------------------
  // RUTAS DE SUPER ADMINISTRADOR: Gestión de Usuarios Registrados
  // -------------------------------------------------------------
  if (clean.startsWith('admin/users')) {
    const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);

    // DELETE /admin/users/:id
    const userDeleteMatch = clean.match(/^admin\/users\/([a-zA-Z0-9_-]+)$/);
    if (userDeleteMatch && method === 'DELETE') {
      const targetId = userDeleteMatch[1];
      deleteUserFromCloud(targetId);
      return { success: true, message: 'Usuario y consultorio eliminados permanentemente del sistema.' } as T;
    }

    // PUT /admin/users/:id/suspension
    const userSuspendMatch = clean.match(/^admin\/users\/([a-zA-Z0-9_-]+)\/suspension$/);
    if (userSuspendMatch && (method === 'PUT' || method === 'POST') && body) {
      const targetId = userSuspendMatch[1];
      const isSuspended = !!body.isSuspended;
      toggleUserSuspensionInCloud(targetId, isSuspended);
      return {
        success: true,
        message: isSuspended ? 'Licencia suspendida correctamente.' : 'Licencia reactivada con éxito.',
      } as T;
    }

    // GET /admin/users
    const summaries: RegisteredUserSummary[] = users.map((u) => {
      const canonicalId = u.id;
      const cleanEmail = (u.email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const pKey = `psychocare_db_patients_${canonicalId}`;
      const aKey = `psychocare_db_appointments_${canonicalId}`;
      const nKey = `psychocare_db_notes_${canonicalId}`;
      const sKey = `psychocare_clinic_settings_${canonicalId}`;

      // 1. Recolectar todos los pacientes del terapeuta de todas las llaves posibles
      const patientMap = new Map<string, Patient>();
      const rawCanonicalPatients = localStorage.getItem(pKey);
      if (rawCanonicalPatients) {
        try {
          const parsed = JSON.parse(rawCanonicalPatients);
          if (Array.isArray(parsed)) parsed.forEach((p) => p && p.id && patientMap.set(p.id, p));
        } catch {}
      }

      // Buscar llaves adicionales que pertenezcan a este terapeuta
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_patients_')) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extra = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extra)) {
                extra.forEach((p) => p && p.id && patientMap.set(p.id, p));
              }
            } catch {}
          }
        }
      }
      const pList = sanitizeCollection(Array.from(patientMap.values()));

      // 2. Recolectar citas del terapeuta
      const apptMap = new Map<string, Appointment>();
      const rawCanonicalAppts = localStorage.getItem(aKey);
      if (rawCanonicalAppts) {
        try {
          const parsed = JSON.parse(rawCanonicalAppts);
          if (Array.isArray(parsed)) parsed.forEach((a) => a && a.id && apptMap.set(a.id, a));
        } catch {}
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_appointments_')) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extra = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extra)) {
                extra.forEach((a) => a && a.id && apptMap.set(a.id, a));
              }
            } catch {}
          }
        }
      }
      const aList = sanitizeCollection(Array.from(apptMap.values()));

      // 3. Recolectar notas del terapeuta
      const noteMap = new Map<string, ClinicalNote>();
      const rawCanonicalNotes = localStorage.getItem(nKey);
      if (rawCanonicalNotes) {
        try {
          const parsed = JSON.parse(rawCanonicalNotes);
          if (Array.isArray(parsed)) parsed.forEach((n) => n && n.id && noteMap.set(n.id, n));
        } catch {}
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_db_notes_')) {
          if (k.includes(cleanEmail) || (canonicalId.startsWith('therapist-') && k.includes(canonicalId))) {
            try {
              const extra = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(extra)) {
                extra.forEach((n) => n && n.id && noteMap.set(n.id, n));
              }
            } catch {}
          }
        }
      }
      const nList = sanitizeCollection(Array.from(noteMap.values()));

      let clinicSett: ClinicSettings | null = null;
      try {
        const settRaw = localStorage.getItem(sKey);
        if (settRaw) clinicSett = JSON.parse(settRaw);
      } catch {}

      // Calcular última actividad en vivo del terapeuta
      let lastActivity = u.createdAt || new Date().toISOString();
      if (u.updatedAt && new Date(u.updatedAt).getTime() > new Date(lastActivity).getTime()) {
        lastActivity = u.updatedAt;
      }
      pList.forEach((p) => {
        if (p.updatedAt && new Date(p.updatedAt).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = p.updatedAt;
        } else if (p.createdAt && new Date(p.createdAt).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = p.createdAt;
        }
      });
      aList.forEach((a) => {
        if (a.updatedAt && new Date(a.updatedAt).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = a.updatedAt;
        } else if (a.startDateTime && new Date(a.startDateTime).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = a.startDateTime;
        }
      });
      nList.forEach((n) => {
        if (n.updatedAt && new Date(n.updatedAt).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = n.updatedAt;
        } else if (n.sessionDate && new Date(n.sessionDate).getTime() > new Date(lastActivity).getTime()) {
          lastActivity = n.sessionDate;
        }
      });

      return {
        id: canonicalId,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        status: u.status || (u.isSuspended ? 'SUSPENDED' : 'ACTIVE'),
        isSuspended: !!u.isSuspended,
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt,
        lastActivityAt: lastActivity,
        profile: u.profile,
        clinicSettings: clinicSett,
        patientsCount: pList.length,
        appointmentsCount: aList.length,
        notesCount: nList.length,
        patients: pList,
        appointments: aList,
        notes: nList,
      };
    });

    return {
      success: true,
      data: summaries,
    } as T;
  }

  if (clean.startsWith('admin/purge-test-data') && method === 'POST') {
    purgeAllLegacyTestData();
    return {
      success: true,
      message: 'Todos los datos de prueba residuales han sido purgados exitosamente.',
    } as T;
  }

  // -------------------------------------------------------------
  // 2. Personalización de Clínica Aislada por Usuario
  // -------------------------------------------------------------
  const currentUserId = getActiveUserId();
  const settingsKey = getScopedKey('psychocare_clinic_settings', currentUserId);

  if (clean.startsWith('clinic-settings')) {
    const saved = localStorage.getItem(settingsKey);
    let currentSettings: ClinicSettings = DEFAULT_CLINIC_SETTINGS;
    try {
      if (saved && saved !== 'undefined') currentSettings = JSON.parse(saved);
    } catch {}

    if (method === 'PUT' && body) {
      const updated = { ...currentSettings, ...body, userId: currentUserId, updatedAt: new Date().toISOString() };
      localStorage.setItem(settingsKey, JSON.stringify(updated));
      return { success: true, data: updated } as T;
    }
    if (method === 'DELETE') {
      localStorage.removeItem(settingsKey);
      return { success: true, message: 'Configuración de la clínica eliminada correctamente.' } as T;
    }
    return { success: true, data: currentSettings } as T;
  }

  // -------------------------------------------------------------
  // 3. Dashboard Aislado
  // -------------------------------------------------------------
  const patientsKey = getScopedKey('psychocare_db_patients', currentUserId);
  const appointmentsKey = getScopedKey('psychocare_db_appointments', currentUserId);
  const notesKey = getScopedKey('psychocare_db_notes', currentUserId);
  const attachmentsKey = getScopedKey('psychocare_db_attachments', currentUserId);

  if (clean.startsWith('dashboard')) {
    const patients = getLocalCollection<Patient>(patientsKey, []);
    const appointments = getLocalCollection<Appointment>(appointmentsKey, []);
    const notes = getLocalCollection<ClinicalNote>(notesKey, []);

    return {
      success: true,
      data: {
        metrics: {
          totalPatients: patients.length,
          activePatients: patients.filter((p) => p.isActive).length,
          todayAppointmentsCount: appointments.length,
          monthCompletedAppointments: appointments.filter((a) => a.status === 'COMPLETED').length,
        },
        todayAppointments: appointments,
        upcomingAppointments: appointments,
        recentNotes: notes,
        recentClinicalNotes: notes,
      },
    } as T;
  }

  // -------------------------------------------------------------
  // 4. Pacientes CRUD Aislados & Suite Clínica
  // -------------------------------------------------------------
  // POST /patients/:id/consent
  const consentMatch = clean.match(/^patients\/([a-zA-Z0-9_-]+)\/consent$/);
  if (consentMatch && method === 'POST' && body) {
    const targetId = consentMatch[1];
    localStorage.setItem(`psychocare_consent_${targetId}`, JSON.stringify(body));
    saveLocalCollection(`psychocare_consent_list_${targetId}`, [body]); // Dispara cloud sync
    return { success: true, data: body } as T;
  }

  // POST /patients/:id/psychometric-tests
  const testsMatch = clean.match(/^patients\/([a-zA-Z0-9_-]+)\/psychometric-tests$/);
  if (testsMatch && method === 'POST' && body) {
    const targetId = testsMatch[1];
    const testsKey = `psychocare_tests_${targetId}`;
    const tests = getLocalCollection<PsychometricTest>(testsKey, []);
    tests.unshift(body);
    saveLocalCollection(testsKey, tests);
    return { success: true, data: body } as T;
  }

  // DELETE /psychometric-tests/:id
  const deleteTestMatch = clean.match(/^psychometric-tests\/([a-zA-Z0-9_-]+)$/);
  if (deleteTestMatch && method === 'DELETE') {
    const testId = deleteTestMatch[1];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('psychocare_tests_')) {
          const list = getLocalCollection<PsychometricTest>(k, []);
          const filtered = list.filter((t) => t.id !== testId);
          if (filtered.length !== list.length) {
            saveLocalCollection(k, filtered);
          }
        }
      }
    }
    return { success: true, message: 'Test eliminado correctamente' } as T;
  }

  // POST /patients/:id/clinical-evaluation
  const evalMatch = clean.match(/^patients\/([a-zA-Z0-9_-]+)\/clinical-evaluation$/);
  if (evalMatch && method === 'POST' && body) {
    const targetId = evalMatch[1];
    localStorage.setItem(`psychocare_evaluation_${targetId}`, JSON.stringify(body));
    saveLocalCollection(`psychocare_evaluation_list_${targetId}`, [body]); // Dispara cloud sync
    return { success: true, data: body } as T;
  }

  if (clean.startsWith('patients')) {
    const patients = getLocalCollection<Patient>(patientsKey, []);

    // GET /patients/:id
    const idMatch = clean.match(/^patients\/([a-zA-Z0-9_-]+)$/);
    if (idMatch && method === 'GET') {
      const p = patients.find((item) => item.id === idMatch[1]);
      if (!p) {
        return { success: false, message: 'Paciente no encontrado' } as T;
      }
      const notes = getLocalCollection<ClinicalNote>(notesKey, []).filter((n) => n.patientId === p.id);
      const appts = getLocalCollection<Appointment>(appointmentsKey, []).filter((a) => a.patientId === p.id);
      const atts = getLocalCollection<Attachment>(attachmentsKey, []).filter((att) => att.patientId === p.id);

      const consentRaw = localStorage.getItem(`psychocare_consent_${p.id}`);
      const consent = consentRaw ? JSON.parse(consentRaw) : null;

      const evalRaw = localStorage.getItem(`psychocare_evaluation_${p.id}`);
      const clinicalEvaluation = evalRaw ? JSON.parse(evalRaw) : null;

      const psychometricTests = getLocalCollection<PsychometricTest>(`psychocare_tests_${p.id}`, []);

      return {
        success: true,
        data: {
          ...p,
          clinicalNotes: notes,
          appointments: appts,
          attachments: atts,
          consent,
          clinicalEvaluation,
          psychometricTests,
        },
      } as T;
    }

    // POST /patients
    if (clean.startsWith('patients') && !clean.includes('/') && method === 'POST' && body) {
      const newPatient: Patient = {
        ...body,
        id: `patient-${Date.now()}`,
        therapistId: currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      const currentList = getLocalCollection<Patient>(patientsKey, []);
      currentList.unshift(newPatient);
      saveLocalCollection(patientsKey, currentList);
      return { success: true, data: newPatient } as T;
    }

    // PUT /patients/:id
    if (idMatch && method === 'PUT' && body) {
      const currentList = getLocalCollection<Patient>(patientsKey, []);
      const idx = currentList.findIndex((item) => item.id === idMatch[1]);
      if (idx !== -1) {
        currentList[idx] = { ...currentList[idx], ...body, updatedAt: new Date().toISOString() };
        saveLocalCollection(patientsKey, currentList);
        return { success: true, data: currentList[idx] } as T;
      }
    }

    // DELETE /patients/:id
    if (idMatch && method === 'DELETE') {
      const currentList = getLocalCollection<Patient>(patientsKey, []);
      const filtered = currentList.filter((item) => item.id !== idMatch[1]);
      saveLocalCollection(patientsKey, filtered);
      return { success: true, message: 'Paciente eliminado correctamente' } as T;
    }

    // GET /patients (List con filtro de búsqueda)
    let filteredList = [...patients];
    if (clean.includes('search=')) {
      const searchParam = decodeURIComponent(clean.split('search=')[1].split('&')[0]).toLowerCase();
      filteredList = filteredList.filter(
        (p) =>
          p.fullName.toLowerCase().includes(searchParam) ||
          (p.email && p.email.toLowerCase().includes(searchParam)) ||
          (p.phone && p.phone.includes(searchParam))
      );
    }
    if (clean.includes('isActive=true')) {
      filteredList = filteredList.filter((p) => p.isActive);
    } else if (clean.includes('isActive=false')) {
      filteredList = filteredList.filter((p) => !p.isActive);
    }

    return {
      success: true,
      data: filteredList,
      pagination: { total: filteredList.length, page: 1, limit: 50, totalPages: 1 },
    } as T;
  }

  // -------------------------------------------------------------
  // 5. Citas CRUD Aisladas
  // -------------------------------------------------------------
  if (clean.startsWith('appointments')) {
    const appointments = getLocalCollection<Appointment>(appointmentsKey, []);
    const patients = getLocalCollection<Patient>(patientsKey, []);
    const apptIdMatch = clean.match(/^appointments\/([a-zA-Z0-9_-]+)$/);

    if (method === 'POST' && body) {
      const patient = patients.find((p) => p.id === body.patientId);
      const newAppt: Appointment = {
        ...body,
        id: `appt-${Date.now()}`,
        therapistId: currentUserId,
        patient,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const currentList = getLocalCollection<Appointment>(appointmentsKey, []);
      currentList.push(newAppt);
      saveLocalCollection(appointmentsKey, currentList);
      return { success: true, data: newAppt } as T;
    }

    if (apptIdMatch && method === 'PUT' && body) {
      const currentList = getLocalCollection<Appointment>(appointmentsKey, []);
      const idx = currentList.findIndex((a) => a.id === apptIdMatch[1]);
      if (idx !== -1) {
        currentList[idx] = { ...currentList[idx], ...body, updatedAt: new Date().toISOString() };
        saveLocalCollection(appointmentsKey, currentList);
        return { success: true, data: currentList[idx] } as T;
      }
    }

    if (apptIdMatch && method === 'DELETE') {
      const currentList = getLocalCollection<Appointment>(appointmentsKey, []);
      const filtered = currentList.filter((a) => a.id !== apptIdMatch[1]);
      saveLocalCollection(appointmentsKey, filtered);
      return { success: true, message: 'Cita eliminada correctamente' } as T;
    }

    return { success: true, data: appointments } as T;
  }

  // -------------------------------------------------------------
  // 6. Notas Clínicas CRUD Aisladas
  // -------------------------------------------------------------
  if (clean.includes('clinical-notes')) {
    const notes = getLocalCollection<ClinicalNote>(notesKey, []);
    const noteIdMatch = clean.match(/clinical-notes\/([a-zA-Z0-9_-]+)$/);

    if (method === 'POST' && body) {
      const newNote: ClinicalNote = {
        ...body,
        id: `note-${Date.now()}`,
        therapistId: currentUserId,
        sessionNumber: notes.length + 1,
        sessionDate: body.sessionDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const currentList = getLocalCollection<ClinicalNote>(notesKey, []);
      currentList.unshift(newNote);
      saveLocalCollection(notesKey, currentList);
      return { success: true, data: newNote } as T;
    }

    if (noteIdMatch && method === 'PUT' && body) {
      const currentList = getLocalCollection<ClinicalNote>(notesKey, []);
      const idx = currentList.findIndex((n) => n.id === noteIdMatch[1]);
      if (idx !== -1) {
        currentList[idx] = { ...currentList[idx], ...body, updatedAt: new Date().toISOString() };
        saveLocalCollection(notesKey, currentList);
        return { success: true, data: currentList[idx] } as T;
      }
    }

    if (noteIdMatch && method === 'DELETE') {
      const currentList = getLocalCollection<ClinicalNote>(notesKey, []);
      const filtered = currentList.filter((n) => n.id !== noteIdMatch[1]);
      saveLocalCollection(notesKey, filtered);
      return { success: true, message: 'Nota eliminada correctamente' } as T;
    }

    return { success: true, data: notes } as T;
  }

  // -------------------------------------------------------------
  // 7. Archivos Adjuntos CRUD Aislados
  // -------------------------------------------------------------
  if (clean.startsWith('attachments')) {
    const attachments = getLocalCollection<Attachment>(attachmentsKey, []);
    const attIdMatch = clean.match(/^attachments\/([a-zA-Z0-9_-]+)$/);

    if (method === 'POST' && body) {
      const newAtt: Attachment = {
        ...body,
        id: `att-${Date.now()}`,
        therapistId: currentUserId,
        uploadedAt: new Date().toISOString(),
      };
      const currentList = getLocalCollection<Attachment>(attachmentsKey, []);
      currentList.unshift(newAtt);
      saveLocalCollection(attachmentsKey, currentList);
      return { success: true, data: newAtt } as T;
    }

    if (attIdMatch && method === 'DELETE') {
      const currentList = getLocalCollection<Attachment>(attachmentsKey, []);
      const filtered = currentList.filter((att) => att.id !== attIdMatch[1]);
      saveLocalCollection(attachmentsKey, filtered);
      return { success: true, message: 'Archivo eliminado correctamente' } as T;
    }

    return { success: true, data: attachments } as T;
  }

  // -------------------------------------------------------------
  // 8. Perfil del Terapeuta
  // -------------------------------------------------------------
  if (clean.startsWith('profile')) {
    const user = getActiveUser() || DEFAULT_USER;

    if (clean.endsWith('/backup')) {
      const patients = getLocalCollection<Patient>(patientsKey, []);
      const appointments = getLocalCollection<Appointment>(appointmentsKey, []);
      const clinicalNotes = getLocalCollection<ClinicalNote>(notesKey, []);
      const attachments = getLocalCollection<Attachment>(attachmentsKey, []);
      const clinicSettings = localStorage.getItem(settingsKey)
        ? JSON.parse(localStorage.getItem(settingsKey)!)
        : DEFAULT_CLINIC_SETTINGS;

      return {
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          therapist: user,
          clinicSettings,
          patients,
          appointments,
          clinicalNotes,
          attachments,
        },
      } as T;
    }

    if (method === 'PUT' && body) {
      const now = new Date().toISOString();
      const updatedUser: User = {
        ...user,
        fullName: body.fullName || user.fullName,
        updatedAt: now,
        profile: {
          ...(user.profile || { id: `prof-${Date.now()}`, userId: user.id }),
          ...body,
          updatedAt: now,
        },
      };
      localStorage.setItem('psychocare_user', JSON.stringify(updatedUser));

      const users = getLocalCollection<StoredUserAccount>('psychocare_db_users', []);
      const idx = users.findIndex((u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedUser };
      } else {
        users.push(updatedUser);
      }
      saveLocalCollection('psychocare_db_users', users);

      return { success: true, data: updatedUser } as T;
    }

    return { success: true, data: user } as T;
  }

  return { success: true, data: null } as T;
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('psychocare_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${res.status}: ${res.statusText}`);
      }

      return res.json();
    } catch (networkError: any) {
      console.warn(`[Modo Local / Cache Activado] Fallback por: ${networkError.message}`);
      return handleMockRequest<T>(endpoint, 'GET');
    }
  },

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('psychocare_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      try {
        handleMockRequest<T>(endpoint, 'POST', body);
      } catch {}

      return result;
    } catch (networkError: any) {
      console.warn(`[Modo Local / Cache Activado] Fallback por: ${networkError.message}`);
      return handleMockRequest<T>(endpoint, 'POST', body);
    }
  },

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('psychocare_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      try {
        handleMockRequest<T>(endpoint, 'PUT', body);
      } catch {}

      return result;
    } catch (networkError: any) {
      console.warn(`[Modo Local / Cache Activado] Fallback por: ${networkError.message}`);
      return handleMockRequest<T>(endpoint, 'PUT', body);
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('psychocare_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      try {
        handleMockRequest<T>(endpoint, 'DELETE');
      } catch {}

      return result;
    } catch (networkError: any) {
      console.warn(`[Modo Local / Cache Activado] Fallback por: ${networkError.message}`);
      return handleMockRequest<T>(endpoint, 'DELETE');
    }
  },
};
