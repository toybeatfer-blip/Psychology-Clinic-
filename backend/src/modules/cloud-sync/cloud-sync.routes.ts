import { Router } from 'express';
import * as cloudSyncController from './cloud-sync.controller.js';

const router = Router();

router.get('/', cloudSyncController.getStateHandler);
router.post('/', cloudSyncController.syncStateHandler);
router.put('/', cloudSyncController.syncStateHandler);
router.delete('/user/:id', cloudSyncController.deleteUserHandler);
router.put('/user/:id/suspension', cloudSyncController.toggleSuspensionHandler);

export default router;
