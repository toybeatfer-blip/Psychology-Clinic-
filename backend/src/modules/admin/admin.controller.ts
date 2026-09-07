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

export async function toggleSuspensionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const isSuspended = !!req.body?.isSuspended;
    const result = await adminService.toggleUserSuspension(id, isSuspended);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPublicContactHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const contact = await adminService.getCreatorContact();
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCreatorContactHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const contact = await adminService.getCreatorContact();
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCreatorContactHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Comprobar estrictamente que sea el Creador / Super Administrador (Fernando)
    const user = (req as any).user;
    const isSuperAdmin = user && (user.role === 'ADMIN' || (user.email || '').toLowerCase().startsWith('fernando'));
    
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido: Solamente el Creador / Super Administrador tiene autorización para modificar estos datos de contacto.',
      });
    }

    const { adminName, email, phoneWhatsApp, helpMessage } = req.body;
    const updated = await adminService.updateCreatorContact({
      adminName,
      email,
      phoneWhatsApp,
      helpMessage,
    });

    res.status(200).json({
      success: true,
      message: 'Datos de contacto del Creador actualizados y protegidos exitosamente.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

