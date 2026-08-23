import { Request, Response, NextFunction } from 'express';
import * as patientsService from './patients.service.js';

export async function listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await patientsService.getPatients(therapistId, {
      search,
      isActive,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.id as string;

    const patient = await patientsService.getPatientById(therapistId, patientId);
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patient = await patientsService.createPatient(therapistId, req.body);
    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.id as string;

    const patient = await patientsService.updatePatient(therapistId, patientId, req.body);
    res.status(200).json({
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.id as string;

    const result = await patientsService.deletePatient(therapistId, patientId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
