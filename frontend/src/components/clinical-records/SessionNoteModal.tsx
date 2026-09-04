import React, { useState, useEffect } from 'react';
import { ClinicalNote, Appointment } from '../../types/index';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Shield, Brain, Sparkles, ClipboardList, CheckSquare, Save } from 'lucide-react';

interface SessionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  noteToEdit?: ClinicalNote | null;
  appointments?: Appointment[];
  onSuccess: (savedNote: ClinicalNote) => void;
}

export const SessionNoteModal: React.FC<SessionNoteModalProps> = ({
  isOpen,
  onClose,
  patientId,
  noteToEdit,
  appointments = [],
  onSuccess,
}) => {
  const draftKey = `psychocare_note_draft_${patientId}`;

  const [formData, setFormData] = useState({
    sessionNumber: 1,
    sessionDate: '',
    appointmentId: '',
    reasonForSession: '',
    behavioralObservations: '',
    diagnosisHypothesis: '',
    interventionsApplied: '',
    treatmentPlanAndTasks: '',
    isConfidential: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setFormData({
        sessionNumber: noteToEdit.sessionNumber || 1,
        sessionDate: noteToEdit.sessionDate ? noteToEdit.sessionDate.substring(0, 10) : '',
        appointmentId: noteToEdit.appointmentId || '',
        reasonForSession: noteToEdit.reasonForSession || '',
        behavioralObservations: noteToEdit.behavioralObservations || '',
        diagnosisHypothesis: noteToEdit.diagnosisHypothesis || '',
        interventionsApplied: noteToEdit.interventionsApplied || '',
        treatmentPlanAndTasks: noteToEdit.treatmentPlanAndTasks || '',
        isConfidential: noteToEdit.isConfidential ?? true,
      });
      setDraftRestored(false);
    } else {
      // Comprobar si hay un borrador guardado en localStorage
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && isOpen) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          setDraftRestored(true);
        } catch {
          resetToDefault();
        }
      } else {
        resetToDefault();
      }
    }
    setError(null);
  }, [noteToEdit, isOpen, patientId]);

  const resetToDefault = () => {
    setFormData({
      sessionNumber: 1,
      sessionDate: new Date().toISOString().substring(0, 10),
      appointmentId: '',
      reasonForSession: '',
      behavioralObservations: '',
      diagnosisHypothesis: '',
      interventionsApplied: '',
      treatmentPlanAndTasks: '',
      isConfidential: true,
    });
    setDraftRestored(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updated = {
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    };
    setFormData(updated);

    // Auto-guardar borrador en tiempo real si es una nueva nota
    if (!noteToEdit) {
      localStorage.setItem(draftKey, JSON.stringify(updated));
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    resetToDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        sessionNumber: Number(formData.sessionNumber) || undefined,
        sessionDate: formData.sessionDate ? new Date(formData.sessionDate).toISOString() : new Date().toISOString(),
        appointmentId: formData.appointmentId ? formData.appointmentId : null,
      };

      if (noteToEdit) {
        const res = await api.put<{ success: boolean; data: ClinicalNote }>(
          `/clinical-notes/${noteToEdit.id}`,
          payload
        );
        onSuccess(res.data);
      } else {
        const res = await api.post<{ success: boolean; data: ClinicalNote }>(
          `/patients/${patientId}/clinical-notes`,
          payload
        );
        // Limpiar borrador temporal guardado en disco
        localStorage.removeItem(draftKey);
        onSuccess(res.data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la nota clínica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? 'Editar Nota de Evolución Clínica' : 'Nueva Nota de Evolución Psicológica'}
      description="Registro estructurado con estándares clínicos y guardado automático permanente."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {draftRestored && !noteToEdit && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Save className="w-4 h-4 text-amber-600" />
              Se ha restaurado automáticamente tu borrador en curso de la sesión anterior.
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-amber-700 underline font-bold hover:text-amber-900 ml-2"
            >
              Descartar borrador
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Encabezado de Sesión */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
          <Input
            label="N° de Sesión"
            type="number"
            name="sessionNumber"
            min="1"
            value={formData.sessionNumber}
            onChange={handleChange}
          />
          <Input
            label="Fecha de la Sesión *"
            type="date"
            name="sessionDate"
            required
            value={formData.sessionDate}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Cita Vinculada (Opcional)
            </label>
            <select
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleChange}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sin cita vinculada</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.startDateTime.substring(0, 10)} - {a.modality}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Motivo específico de la sesión */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            1. Motivo Específico de la Sesión / Temas Abordados *
          </label>
          <Textarea
            name="reasonForSession"
            required
            rows={2}
            placeholder="Ej. Revisión de eventos estresores de la semana laboral, detonantes de ansiedad..."
            value={formData.reasonForSession}
            onChange={handleChange}
          />
        </div>

        {/* 2. Observaciones Conductuales */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <Brain className="w-4 h-4 text-indigo-600" />
            2. Observaciones Conductuales, Afecto y Estado de Ánimo
          </label>
          <Textarea
            name="behavioralObservations"
            rows={2}
            placeholder="Ej. Contacto visual, postura corporal, reactividad emocional, insight, coherencia del discurso..."
            value={formData.behavioralObservations}
            onChange={handleChange}
          />
        </div>

        {/* 3. Hipótesis Diagnóstica / Conceptualización */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-600" />
            3. Diagnóstico / Hipótesis de Trabajo (DSM-5 / CIE-11)
          </label>
          <Textarea
            name="diagnosisHypothesis"
            rows={2}
            placeholder="Ej. Mantenimiento del patrón de evitación experiencial; esquema cognitivo de autoexigencia..."
            value={formData.diagnosisHypothesis}
            onChange={handleChange}
          />
        </div>

        {/* 4. Intervenciones Aplicadas */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            4. Intervenciones y Técnicas Psicológicas Aplicadas *
          </label>
          <Textarea
            name="interventionsApplied"
            required
            rows={3}
            placeholder="Ej. Reestructuración cognitiva, técnica de la flecha descendente, psicoeducación, desensibilización..."
            value={formData.interventionsApplied}
            onChange={handleChange}
          />
        </div>

        {/* 5. Plan Terapéutico y Tareas */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <ClipboardList className="w-4 h-4 text-sky-600" />
            5. Plan de Tratamiento y Tareas Inter-sesión
          </label>
          <Textarea
            name="treatmentPlanAndTasks"
            rows={2}
            placeholder="Ej. 1. Autorregistro de pensamientos catastróficos. 2. Técnica de respiración diafragmática..."
            value={formData.treatmentPlanAndTasks}
            onChange={handleChange}
          />
        </div>

        {/* Confidencialidad y Botones */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              name="isConfidential"
              checked={formData.isConfidential}
              onChange={handleChange}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span>Nota de estricta confidencialidad médica / psicológica</span>
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              {noteToEdit ? 'Guardar Cambios' : 'Registrar en Base de Datos'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
