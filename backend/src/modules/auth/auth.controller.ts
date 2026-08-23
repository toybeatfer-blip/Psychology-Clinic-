import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerTherapist(req.body);
    res.status(201).json({
      success: true,
      message: 'Terapeuta registrado con éxito',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginTherapist(req.body);
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getMe(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
