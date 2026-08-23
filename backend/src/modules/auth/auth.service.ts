import { prisma } from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { RegisterInput, LoginInput } from './auth.schemas.js';

export async function registerTherapist(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      fullName: data.fullName,
      role: 'THERAPIST',
      profile: {
        create: {
          professionalId: data.professionalId,
          specialty: data.specialty,
          phone: data.phone,
        },
      },
    },
    include: {
      profile: true,
    },
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
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: {
      profile: true,
    },
  });

  if (!user) {
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      profile: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  return user;
}
