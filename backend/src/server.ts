import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { prisma } from './config/db.js';
import bcrypt from 'bcrypt';

async function ensureSuperAdminAndCleanData() {
  try {
    // 1. Limpiar cuentas demo / legacy ficticias de pruebas
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['dr.carlos@psychocare.com', 'demo@psychocare.com'],
        },
      },
    });

    // 2. Asegurar existencia de la cuenta de Super Administrador (Fernando01)
    const superAdminEmail = 'fernando01';
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'Fernando01' },
          { email: 'fernando01' },
          { email: 'fernando01@psychocare.com' },
        ],
      },
    });

    const passwordHash = await bcrypt.hash('Bazzoka1313AS.', 10);

    if (!existingSuperAdmin) {
      console.log('👑 Creando cuenta de Super Administrador (Fernando01)...');
      await prisma.user.create({
        data: {
          email: 'Fernando01',
          passwordHash,
          fullName: 'Fernando (Super Administrador)',
          role: 'ADMIN',
          profile: {
            create: {
              professionalId: 'ADMIN-MASTER-01',
              specialty: 'Administración Global del Sistema',
              phone: '',
              hourlyRate: 0,
              currency: 'USD',
            },
          },
          clinicSettings: {
            create: {
              clinicName: 'PsychoCare Master',
              tagline: 'Centro de Psicoterapia y Salud Emocional',
              primaryColor: '#0d9488',
              secondaryColor: '#0f766e',
              themeMode: 'light',
              sidebarStyle: 'dark',
            },
          },
        },
      });
      console.log('✅ Super Administrador creado exitosamente en la base de datos central.');
    } else {
      // Actualizar contraseña y rol por seguridad
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          passwordHash,
          role: 'ADMIN',
        },
      });
      console.log('✅ Super Administrador verificado y activo en la base de datos central.');
    }
  } catch (error) {
    console.error('⚠️ Nota al verificar cuenta de Super Administrador:', error);
  }
}

const app = createApp();

app.listen(ENV.PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor PsychoClinic API iniciado`);
  console.log(`📡 Puerto: http://localhost:${ENV.PORT}`);
  console.log(`🩺 Entorno: ${ENV.NODE_ENV}`);
  console.log(`=========================================`);

  await ensureSuperAdminAndCleanData();
});
