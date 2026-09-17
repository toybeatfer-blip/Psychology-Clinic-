import { Request, Response, NextFunction } from 'express';
import * as clinicalNotesService from './clinical-notes.service.js';

export async function listNotesByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.patientId as string;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const notes = await clinicalNotesService.getClinicalNotesByPatient(therapistId, patientId, isAdmin);
    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const noteId = req.params.id as string;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const note = await clinicalNotesService.getClinicalNoteById(therapistId, noteId, isAdmin);
    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.patientId as string;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const note = await clinicalNotesService.createClinicalNote(therapistId, {
      ...req.body,
      patientId,
    }, isAdmin);

    res.status(201).json({
      success: true,
      message: 'Nota clínica registrada correctamente',
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const noteId = req.params.id as string;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const updated = await clinicalNotesService.updateClinicalNote(therapistId, noteId, req.body, isAdmin);
    res.status(200).json({
      success: true,
      message: 'Nota clínica actualizada correctamente',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const noteId = req.params.id as string;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const result = await clinicalNotesService.deleteClinicalNote(therapistId, noteId, isAdmin);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
