import { Request, Response, NextFunction } from 'express';
import * as appointmentsService from './appointments.service.js';
import { AppointmentStatus } from './appointments.service.js';

export async function listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const { startDate, endDate, patientId, status, therapistId: therapistFilter } = req.query;

    const appointments = await appointmentsService.getAppointments(therapistId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      patientId: patientId as string | undefined,
      status: status as AppointmentStatus | undefined,
      isAdmin,
      therapistFilter: therapistFilter as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const appointmentId = req.params.id as string;

    const appointment = await appointmentsService.getAppointmentById(therapistId, appointmentId, isAdmin);
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const appointment = await appointmentsService.createAppointment(therapistId, req.body, isAdmin);
    res.status(201).json({
      success: true,
      message: 'Cita agendada correctamente',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const appointmentId = req.params.id as string;

    const updated = await appointmentsService.updateAppointment(therapistId, appointmentId, req.body, isAdmin);
    res.status(200).json({
      success: true,
      message: 'Cita actualizada correctamente',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const appointmentId = req.params.id as string;
    const { status } = req.body;

    const updated = await appointmentsService.updateAppointmentStatus(therapistId, appointmentId, status, isAdmin);
    res.status(200).json({
      success: true,
      message: 'Estado de cita actualizado',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const therapistId = req.user!.userId;
    const appointmentId = req.params.id as string;

    const result = await appointmentsService.deleteAppointment(therapistId, appointmentId, isAdmin);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
