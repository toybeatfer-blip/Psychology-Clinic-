import { Request, Response, NextFunction } from 'express';
import * as clinicSettingsService from './clinic-settings.service.js';

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const settings = await clinicSettingsService.getClinicSettings(userId);
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updated = await clinicSettingsService.updateClinicSettings(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Configuración de la clínica actualizada con éxito',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
