import { prisma } from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { RegisterInput, LoginInput } from './auth.schemas.js';
import * as cloudSyncService from '../cloud-sync/cloud-sync.service.js';

export async function registerTherapist(data: RegisterInput) {
  const reqEmail = data.email.trim().toLowerCase();
  const masterState = await cloudSyncService.getMasterState();

  const existingInMaster = (masterState.users || []).some(
    (u) => (u.email || '').toLowerCase() === reqEmail
  );

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { email: reqEmail },
      ],
    },
  }).catch(() => null);

  if (existingUser || existingInMaster) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const passwordHash = await hashPassword(data.password);

  let user: any;
  try {
    user = await prisma.user.create({
      data: {
        email: reqEmail,
        passwordHash,
        fullName: data.fullName,
        role: 'THERAPIST',
        profile: {
          create: {
            professionalId: data.professionalId || '',
            specialty: data.specialty || 'Psicología Clínica',
            phone: data.phone || '',
            hourlyRate: 50,
            currency: 'USD',
          },
        },
        clinicSettings: {
          create: {
            clinicName: `Consultorio ${data.fullName}`,
            tagline: 'Centro de Psicoterapia y Bienestar Emocional',
            primaryColor: '#0d9488',
            secondaryColor: '#0f766e',
            themeMode: 'light',
            sidebarStyle: 'dark',
            phone: data.phone || '',
            email: reqEmail,
          },
        },
      },
      include: {
        profile: true,
        clinicSettings: true,
      },
    });
  } catch (err) {
    user = {
      id: `therapist_${reqEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: reqEmail,
      fullName: data.fullName,
      role: 'THERAPIST',
      passwordHash: data.password,
      profile: {
        id: `prof_${Date.now()}`,
        professionalId: data.professionalId || '',
        specialty: data.specialty || 'Psicología Clínica',
        phone: data.phone || '',
        hourlyRate: 50,
        currency: 'USD',
      },
      clinicSettings: {
        clinicName: `Consultorio ${data.fullName}`,
        tagline: 'Centro de Psicoterapia y Bienestar Emocional',
        primaryColor: '#0d9488',
        secondaryColor: '#0f766e',
        themeMode: 'light',
        sidebarStyle: 'dark',
        phone: data.phone || '',
        email: reqEmail,
      },
    };
  }

  // Registrar en el estado cloud maestro inmediatamente
  await cloudSyncService.mergeAndSaveState({
    users: [
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        passwordHash: data.password,
        profile: user.profile,
        clinicSettings: user.clinicSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profile: user.profile,
    },
    token,
  };
}

export async function loginTherapist(data: LoginInput) {
  const inputEmail = data.email.trim();
  const lower = inputEmail.toLowerCase();

  // 1. Verificación Maestra de Super Administrador (Fernando01)
  if (
    (lower === 'fernando01' ||
      lower === 'fernando' ||
      lower === 'fernando01@psychocare.com' ||
      lower.startsWith('fernando01@') ||
      lower.startsWith('fernando@')) &&
    data.password === 'Bazzoka1313AS.'
  ) {
    const adminUser = {
      id: 'admin_fernando01',
      email: 'Fernando01',
      fullName: 'Fernando (Super Administrador)',
      role: 'ADMIN' as const,
      profile: {
        id: 'prof_admin_01',
        userId: 'admin_fernando01',
        professionalId: 'ADMIN-MASTER-01',
        specialty: 'Administración Global del Sistema',
        phone: '',
        hourlyRate: 0,
        currency: 'USD',
      },
    };

    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      fullName: adminUser.fullName,
    });

    return {
      user: adminUser,
      token,
    };
  }

  // 2. Buscar en base de datos Prisma
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: inputEmail },
        { email: lower },
        { email: inputEmail.toUpperCase() },
      ],
    },
    include: {
      profile: true,
      clinicSettings: true,
    },
  }).catch(() => null);

  // 3. Si no se encuentra en Prisma, consultar estado maestro central en disco/memoria
  if (!user) {
    const masterState = await cloudSyncService.getMasterState();
    const storedUser = (masterState.users || []).find(
      (u) => (u.email || '').toLowerCase() === lower
    );

    if (storedUser) {
      if (storedUser.isSuspended || storedUser.status === 'SUSPENDED') {
        throw new Error('⚠️ Su licencia o cuenta de consultorio ha sido suspendida por el Super Administrador.');
      }

      if (storedUser.passwordHash && data.password) {
        let match = false;
        if (storedUser.passwordHash === data.password) {
          match = true;
        } else {
          match = await comparePassword(data.password, storedUser.passwordHash).catch(() => false);
        }
        if (!match) {
          throw new Error('Credenciales inválidas (correo o contraseña incorrectos).');
        }
      }

      const token = generateToken({
        userId: storedUser.id,
        email: storedUser.email,
        role: storedUser.role || 'THERAPIST',
        fullName: storedUser.fullName,
      });

      return {
        user: {
          id: storedUser.id,
          email: storedUser.email,
          fullName: storedUser.fullName,
          role: storedUser.role || 'THERAPIST',
          profile: storedUser.profile,
        },
        token,
      };
    }

    throw new Error('Credenciales inválidas (correo o contraseña incorrectos).');
  }

  const isValidPassword = await comparePassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Credenciales inválidas (correo o contraseña incorrectos).');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profile: user.profile,
    },
    token,
  };
}

export async function getMe(userId: string) {
  if (userId === 'admin_fernando01') {
    return {
      id: 'admin_fernando01',
      email: 'Fernando01',
      fullName: 'Fernando (Super Administrador)',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      profile: {
        id: 'prof_admin_01',
        userId: 'admin_fernando01',
        professionalId: 'ADMIN-MASTER-01',
        specialty: 'Administración Global del Sistema',
        phone: '',
        hourlyRate: 0,
        currency: 'USD',
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      profile: true,
      clinicSettings: true,
    },
  }).catch(() => null);

  if (user) return user;

  const masterState = await cloudSyncService.getMasterState();
  const storedUser = (masterState.users || []).find((u) => u.id === userId);
  if (storedUser) {
    return {
      id: storedUser.id,
      email: storedUser.email,
      fullName: storedUser.fullName,
      role: storedUser.role || 'THERAPIST',
      createdAt: storedUser.createdAt || new Date().toISOString(),
      profile: storedUser.profile,
      clinicSettings: storedUser.clinicSettings,
    };
  }

  throw new Error('Usuario no encontrado.');
}
