import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import patientsRoutes from './modules/patients/patients.routes.js';
import appointmentsRoutes from './modules/appointments/appointments.routes.js';
import clinicalNotesRoutes, { patientNotesRouter } from './modules/clinical-notes/clinical-notes.routes.js';
import attachmentsRoutes, { patientAttachmentsRouter } from './modules/attachments/attachments.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import clinicSettingsRoutes from './modules/clinic-settings/clinic-settings.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import cloudSyncRoutes from './modules/cloud-sync/cloud-sync.routes.js';

export function createApp(): Express {
  const app = express();

  // Middlewares globales
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones desde cualquier origen (Render, localhost, dominios personalizados)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Ruta de salud / Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Endpoints principales de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/clinic-settings', clinicSettingsRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/patients/:patientId/clinical-notes', patientNotesRouter);
  app.use('/api/patients/:patientId/attachments', patientAttachmentsRouter);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/clinical-notes', clinicalNotesRoutes);
  app.use('/api/attachments', attachmentsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/cloud-sync', cloudSyncRoutes);

  // Servir frontend compilado en producción si existe
  const possiblePaths = [
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(__dirname, '../../frontend/dist'),
  ];

  for (const staticPath of possiblePaths) {
    if (fs.existsSync(staticPath)) {
      app.use(express.static(staticPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return next();
        }
        res.sendFile(path.join(staticPath, 'index.html'));
      });
      break;
    }
  }

  // Manejador global de errores
  app.use(errorHandler);

  return app;
}
