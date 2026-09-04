import React, { useState, useEffect } from 'react';
import { Appointment, Patient, AppointmentModality, AppointmentStatus, PaymentMethod } from '../../types/index';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Trash2, ExternalLink, Video, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openWhatsAppReminder } from '../../lib/whatsapp';

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
    paymentMethod: 'TRANSFER' as PaymentMethod,
    meetingUrl: '',
    locationNotes: '',
    notes: '',
    price: 60,
    isPaid: false,
  });

  const selectedPatient = patients.find((p) => p.id === formData.patientId) || appointmentToEdit?.patient;
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
        paymentMethod: (appointmentToEdit.paymentMethod as PaymentMethod) || 'TRANSFER',
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
        paymentMethod: 'TRANSFER',
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

  const handleGenerateMeeting = () => {
    const randomRoom = `psychocare-${Math.random().toString(36).substring(2, 9)}`;
    const jitsiUrl = `https://meet.jit.si/${randomRoom}`;
    setFormData((prev) => ({ ...prev, meetingUrl: jitsiUrl }));
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
        meetingUrl: formData.meetingUrl || null,
        locationNotes: formData.locationNotes || null,
        notes: formData.notes || null,
        price: Number(formData.price),
        isPaid: formData.isPaid,
        paymentStatus: formData.isPaid ? 'PAID' : 'PENDING',
        paymentMethod: formData.paymentMethod,
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
    if (!appointmentToEdit) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) return;

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
      description="Establece el horario, modalidad, enlace de teleconsulta y estado de cobro."
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
              { value: 'ONLINE', label: '💻 En Línea (Teleconsulta)' },
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

        {/* Teleconsulta / Videollamada */}
        {formData.modality === 'ONLINE' ? (
          <div className="space-y-1.5 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Enlace de Teleconsulta (Google Meet / Zoom / Jitsi)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateMeeting}
                className="text-[11px] text-indigo-700 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                Generar Sala Segura
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                type="url"
                name="meetingUrl"
                placeholder="https://meet.google.com/xyz... o https://meet.jit.si/..."
                value={formData.meetingUrl}
                onChange={handleChange}
              />
              {formData.meetingUrl && (
                <a
                  href={formData.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Iniciar</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <Input
            label="Ubicación / Sala"
            name="locationNotes"
            placeholder="Ej. Consultorio 402, Sala B"
            value={formData.locationNotes}
            onChange={handleChange}
          />
        )}

        {/* Honorarios y Cobranza */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Honorarios ($)"
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
          />

          <Select
            label="Método de Pago"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={[
              { value: 'TRANSFER', label: '💳 Transferencia / SPEI' },
              { value: 'CASH', label: '💵 Efectivo' },
              { value: 'CARD', label: '💳 Tarjeta Débito/Crédito' },
              { value: 'INSURANCE', label: '🛡️ Seguro Médico' },
              { value: 'OTHER', label: 'Otro' },
            ]}
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isPaid"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="isPaid" className="text-xs font-bold text-slate-700 cursor-pointer">
              ¿Honorarios Pagados?
            </label>
          </div>
        </div>

        <Textarea
          label="Notas previas o recordatorios"
          name="notes"
          rows={2}
          placeholder="Temas pendientes a revisar o acuerdos de la sesión anterior..."
          value={formData.notes}
          onChange={handleChange}
        />

        {/* Acciones del Modal */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {appointmentToEdit ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={loading}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar
              </Button>

              {selectedPatient && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openWhatsAppReminder(selectedPatient, appointmentToEdit)}
                  leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                >
                  WhatsApp
                </Button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              {appointmentToEdit ? 'Guardar Cambios' : 'Crear Cita'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
