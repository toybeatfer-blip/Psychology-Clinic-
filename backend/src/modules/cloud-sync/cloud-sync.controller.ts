import { Request, Response, NextFunction } from 'express';
import * as cloudSyncService from './cloud-sync.service.js';

export async function getStateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const state = await cloudSyncService.getMasterState();
    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    next(error);
  }
}

export async function syncStateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const incomingData = req.body?.data || req.body || {};
    const updatedState = await cloudSyncService.mergeAndSaveState(incomingData);
    res.status(200).json({
      success: true,
      data: updatedState,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.id);
    const updatedState = await cloudSyncService.deleteUserFromMasterState(userId);
    res.status(200).json({
      success: true,
      data: updatedState,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSuspensionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.id);
    const isSuspended = !!req.body?.isSuspended;
    const updatedState = await cloudSyncService.toggleUserSuspension(userId, isSuspended);
    res.status(200).json({
      success: true,
      data: updatedState,
    });
  } catch (error) {
    next(error);
  }
}
