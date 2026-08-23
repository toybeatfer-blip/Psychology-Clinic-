import React, { useState, useEffect } from 'react';
import { Appointment, Patient } from '../types/index.js';
import { api } from '../lib/api.js';
import { Header } from '../components/layout/Header.js';
import { CalendarView } from '../components/appointments/CalendarView.js';
import { AppointmentModal } from '../components/appointments/AppointmentModal.js';
import { Button } from '../components/ui/Button.js';
import { CalendarPlus } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [apptsRes, patientsRes] = await Promise.all([
        api.get<{ success: boolean; data: Appointment[] }>('/appointments'),
        api.get<{ success: boolean; data: Patient[] }>('/patients?limit=100'),
      ]);
      setAppointments(apptsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      console.error('Error al cargar agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleNewAppointment = (date?: Date) => {
    setSelectedAppointment(null);
    setSelectedDate(date || new Date());
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Agenda y Calendario de Citas"
        subtitle="Control interactivo de sesiones presenciales y virtuales"
        actions={
          <Button
            size="sm"
            onClick={() => handleNewAppointment()}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            Nueva Cita
          </Button>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Cargando agenda de citas...</p>
          </div>
        ) : (
          <CalendarView
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onNewAppointment={handleNewAppointment}
          />
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointmentToEdit={selectedAppointment}
        selectedDate={selectedDate}
        patients={patients}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
