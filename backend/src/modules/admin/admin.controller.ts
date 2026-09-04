import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';

export async function getUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await adminService.getAllRegisteredUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const result = await adminService.deleteUserById(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function purgeDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.purgeResidualTestData();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
