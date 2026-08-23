import express, { Express } from 'express';
import cors from 'cors';
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

export function createApp(): Express {
  const app = express();

  // Middlewares globales
  app.use(
    cors({
      origin: [ENV.CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
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

  // Manejador global de errores
  app.use(errorHandler);

  return app;
}
