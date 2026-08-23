import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const data = await dashboardService.getDashboardMetrics(therapistId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
