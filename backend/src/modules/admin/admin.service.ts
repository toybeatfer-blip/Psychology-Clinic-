import { prisma } from '../../config/db.js';

export async function getAllRegisteredUsers() {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      clinicSettings: true,
      _count: {
        select: {
          patients: true,
          appointments: true,
          clinicalNotes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    profile: u.profile,
    clinicSettings: u.clinicSettings,
    patientsCount: u._count?.patients || 0,
    appointmentsCount: u._count?.appointments || 0,
    notesCount: u._count?.clinicalNotes || 0,
  }));
}

export async function deleteUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  if (user.role === 'ADMIN' || user.email.toLowerCase() === 'fernando01') {
    throw new Error('No es posible eliminar la cuenta principal de Super Administrador.');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true, message: 'Usuario y consultorio eliminados permanentemente.' };
}

export async function purgeResidualTestData() {
  // Eliminar cualquier usuario legacy demo que pudiera existir
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['dr.carlos@psychocare.com', 'demo@psychocare.com'],
      },
    },
  });

  return { success: true, message: 'Datos residuales purgados exitosamente.' };
}
