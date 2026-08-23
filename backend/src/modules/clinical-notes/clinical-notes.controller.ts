import { Request, Response, NextFunction } from 'express';
import * as clinicalNotesService from './clinical-notes.service.js';

export async function listNotesByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.patientId as string;

    const notes = await clinicalNotesService.getClinicalNotesByPatient(therapistId, patientId);
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

    const note = await clinicalNotesService.getClinicalNoteById(therapistId, noteId);
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

    const note = await clinicalNotesService.createClinicalNote(therapistId, {
      ...req.body,
      patientId,
    });

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

    const updated = await clinicalNotesService.updateClinicalNote(therapistId, noteId, req.body);
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

    const result = await clinicalNotesService.deleteClinicalNote(therapistId, noteId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
