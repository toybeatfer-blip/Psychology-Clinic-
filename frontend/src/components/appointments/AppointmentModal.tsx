import React, { useState, useEffect } from 'react';
import { Appointment, Patient, AppointmentModality, AppointmentStatus } from '../../types/index.js';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Textarea } from '../ui/Textarea.js';
import { Button } from '../ui/Button.js';
import { api } from '../../lib/api.js';
import { Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: Appointment | null;
  selectedDate?: Date | null;
  patients: Patient[];
  onSuccess: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointmentToEdit,
  selectedDate,
  patients,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientId: '',
    startDate: '',
    startTime: '10:00',
    endTime: '11:00',
    modality: 'IN_PERSON' as AppointmentModality,
    status: 'SCHEDULED' as AppointmentStatus,
    meetingUrl: '',
    locationNotes: '',
    notes: '',
    price: 60,
    isPaid: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentToEdit) {
      const start = new Date(appointmentToEdit.startDateTime);
      const end = new Date(appointmentToEdit.endDateTime);

      setFormData({
        patientId: appointmentToEdit.patientId,
        startDate: start.toISOString().substring(0, 10),
        startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        modality: appointmentToEdit.modality,
        status: appointmentToEdit.status,
        meetingUrl: appointmentToEdit.meetingUrl || '',
        locationNotes: appointmentToEdit.locationNotes || '',
        notes: appointmentToEdit.notes || '',
        price: appointmentToEdit.price ? Number(appointmentToEdit.price) : 60,
        isPaid: appointmentToEdit.isPaid,
      });
    } else {
      const targetDate = selectedDate || new Date();
      setFormData({
        patientId: patients.length > 0 ? patients[0].id : '',
        startDate: targetDate.toISOString().substring(0, 10),
        startTime: '10:00',
        endTime: '11:00',
        modality: 'IN_PERSON',
        status: 'SCHEDULED',
        meetingUrl: '',
        locationNotes: 'Consultorio Principal',
        notes: '',
        price: 60,
        isPaid: false,
      });
    }
    setError(null);
  }, [appointmentToEdit, selectedDate, isOpen, patients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`).toISOString();

      const payload = {
        patientId: formData.patientId,
        startDateTime,
        endDateTime,
        modality: formData.modality,
        status: formData.status,
        meetingUrl: formData.meetingUrl || undefined,
        locationNotes: formData.locationNotes || undefined,
        notes: formData.notes || undefined,
        price: Number(formData.price),
        isPaid: formData.isPaid,
      };

      if (appointmentToEdit) {
        await api.put(`/appointments/${appointmentToEdit.id}`, payload);
      } else {
        await api.post('/appointments', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointmentToEdit || !window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/appointments/${appointmentToEdit.id}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointmentToEdit ? 'Gestionar Cita Psicológica' : 'Agendar Nueva Cita'}
      description="Establece el horario, modalidad y estado de la sesión terapéutica."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Seleccionar Paciente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Paciente Asignado *
          </label>
          <select
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="" disabled>Selecciona un paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Input
              label="Fecha *"
              type="date"
              name="startDate"
              required
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Hora Inicio *"
            type="time"
            name="startTime"
            required
            value={formData.startTime}
            onChange={handleChange}
          />
          <Input
            label="Hora Fin *"
            type="time"
            name="endTime"
            required
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>

        {/* Modalidad y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Modalidad"
            name="modality"
            value={formData.modality}
            onChange={handleChange}
            options={[
              { value: 'IN_PERSON', label: '🏢 Presencial (Consultorio)' },
              { value: 'ONLINE', label: '💻 En Línea (Virtual)' },
              { value: 'HOME_VISIT', label: '🚗 Domiciliaria' },
            ]}
          />

          <Select
            label="Estado de la Cita"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'SCHEDULED', label: '📅 Programada' },
              { value: 'CONFIRMED', label: '✅ Confirmada' },
              { value: 'COMPLETED', label: '🎉 Realizada / Completada' },
              { value: 'CANCELLED', label: '❌ Cancelada' },
              { value: 'NO_SHOW', label: '⚠️ No asistió' },
            ]}
          />
        </div>

        {formData.modality === 'ONLINE' ? (
          <Input
            label="Enlace de la Videollamada (Zoom / Google Meet)"
            type="url"
            name="meetingUrl"
            placeholder="https://meet.google.com/xyz..."
            value={formData.meetingUrl}
            onChange={handleChange}
          />
        ) : (
          <Input
            label="Ubicación / Sala"
            name="locationNotes"
            placeholder="Ej. Consultorio 402, Sala B"
            value={formData.locationNotes}
            onChange={handleChange}
          />
        )}

        {/* Notas y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Honorarios ($)"
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
          />
          <div className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              id="isPaid"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <label htmlFor="isPaid" className="text-sm font-medium text-slate-700 cursor-pointer">
              ¿Honorarios Pagados?
            </label>
          </div>
        </div>

        <Textarea
          label="Notas previas o recordatorios"
          name="notes"
          rows={2}
          placeholder="Ej. Revisar tareas de respiración diafragmática al inicio."
          value={formData.notes}
          onChange={handleChange}
        />

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {appointmentToEdit && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Eliminar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/patients/${appointmentToEdit.patientId}`)}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Expediente
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" isLoading={loading}>
              {appointmentToEdit ? 'Actualizar Cita' : 'Crear Cita'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
