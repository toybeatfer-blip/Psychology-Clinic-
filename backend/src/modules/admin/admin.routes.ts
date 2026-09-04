import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de administración requieren autenticación
router.use(authenticate);

router.get('/users', adminController.getUsersHandler);
router.delete('/users/:id', adminController.deleteUserHandler);
router.put('/users/:id/suspension', adminController.toggleSuspensionHandler);
router.post('/purge-test-data', adminController.purgeDataHandler);

export default router;
