import { Request, Response, NextFunction } from 'express';
import * as attachmentsService from './attachments.service.js';

export async function listAttachmentsByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.patientId as string;

    const attachments = await attachmentsService.getAttachmentsByPatient(therapistId, patientId);
    res.status(200).json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const patientId = req.params.patientId as string;

    const attachment = await attachmentsService.createAttachment(therapistId, {
      ...req.body,
      patientId,
    });

    res.status(201).json({
      success: true,
      message: 'Documento registrado con éxito',
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const therapistId = req.user!.userId;
    const attachmentId = req.params.id as string;

    const result = await attachmentsService.deleteAttachment(therapistId, attachmentId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
