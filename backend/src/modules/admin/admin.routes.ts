import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Ruta pública accesible sin autenticación para que el Login/Registro muestre el contacto del creador
router.get('/public-contact', adminController.getPublicContactHandler);

// Todas las rutas siguientes requieren autenticación
router.use(authenticate);

router.get('/users', adminController.getUsersHandler);
router.delete('/users/:id', adminController.deleteUserHandler);
router.put('/users/:id/suspension', adminController.toggleSuspensionHandler);
router.post('/purge-test-data', adminController.purgeDataHandler);

// Rutas de administración exclusivas para el Creador / Super Administrador (Fernando)
router.get('/creator-contact', adminController.getCreatorContactHandler);
router.put('/creator-contact', adminController.updateCreatorContactHandler);

export default router;

