import { Request, Response, NextFunction } from 'express';
import * as profileService from './profile.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await profileService.getProfile(userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updated = await profileService.updateProfile(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Perfil actualizado con éxito',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const backup = await profileService.exportTherapistBackup(userId);
    res.status(200).json({
      success: true,
      data: backup,
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await profileService.restoreTherapistBackup(userId, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
