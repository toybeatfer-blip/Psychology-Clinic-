import React, { useState, useEffect } from 'react';
import { Patient } from '../../types/index';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
  onSuccess: (savedPatient: Patient) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  patientToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'Femenino',
    occupation: '',
    maritalStatus: 'Soltero(a)',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    initialReason: '',
    clinicalBackground: '',
    currentMedication: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        fullName: patientToEdit.fullName || '',
        email: patientToEdit.email || '',
        phone: patientToEdit.phone || '',
        birthDate: patientToEdit.birthDate ? patientToEdit.birthDate.substring(0, 10) : '',
        gender: patientToEdit.gender || 'Femenino',
        occupation: patientToEdit.occupation || '',
        maritalStatus: patientToEdit.maritalStatus || 'Soltero(a)',
        address: patientToEdit.address || '',
        emergencyName: patientToEdit.emergencyName || '',
        emergencyPhone: patientToEdit.emergencyPhone || '',
        emergencyRelation: patientToEdit.emergencyRelation || '',
        initialReason: patientToEdit.initialReason || '',
        clinicalBackground: patientToEdit.clinicalBackground || '',
        currentMedication: patientToEdit.currentMedication || '',
        isActive: patientToEdit.isActive ?? true,
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'Femenino',
        occupation: '',
        maritalStatus: 'Soltero(a)',
        address: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelation: '',
        initialReason: '',
        clinicalBackground: '',
        currentMedication: '',
        isActive: true,
      });
    }
    setError(null);
  }, [patientToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      if (patientToEdit) {
        const res = await api.put<{ success: boolean; data: Patient }>(
          `/patients/${patientToEdit.id}`,
          formData
        );
        onSuccess(res.data);
      } else {
        const res = await api.post<{ success: boolean; data: Patient }>(
          '/patients',
          formData
        );
        onSuccess(res.data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientToEdit ? 'Editar Datos del Paciente' : 'Registrar Nuevo Paciente'}
      description="Completa la ficha de identificación y antecedentes clínicos iniciales."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Sección 1: Datos Personales */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1.5">
            1. Ficha de Identificación
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nombre Completo *"
                name="fullName"
                required
                placeholder="Ej. Valeria Gómez Sánchez"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <Input
              label="Teléfono Móvil *"
              name="phone"
              required
              placeholder="Ej. +52 55 1234 5678"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Fecha de Nacimiento"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
            <Select
              label="Género"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'Femenino', label: 'Femenino' },
                { value: 'Masculino', label: 'Masculino' },
                { value: 'No binario', label: 'No binario' },
                { value: 'Otro', label: 'Otro' },
                { value: 'Prefiero no decir', label: 'Prefiero no decir' },
              ]}
            />
            <Input
              label="Ocupación / Profesión"
              name="occupation"
              placeholder="Ej. Diseñadora Gráfica"
              value={formData.occupation}
              onChange={handleChange}
            />
            <Select
              label="Estado Civil"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              options={[
                { value: 'Soltero(a)', label: 'Soltero(a)' },
                { value: 'Casado(a)', label: 'Casado(a)' },
                { value: 'Unión Libre', label: 'Unión Libre' },
                { value: 'Divorciado(a)', label: 'Divorciado(a)' },
                { value: 'Viudo(a)', label: 'Viudo(a)' },
              ]}
            />
            <div className="md:col-span-2">
              <Input
                label="Dirección / Domicilio"
                name="address"
                placeholder="Calle, número, colonia, ciudad"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Contacto de Emergencia */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
            2. Contacto de Emergencia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Nombre del Contacto"
              name="emergencyName"
              placeholder="Ej. María Sánchez"
              value={formData.emergencyName}
              onChange={handleChange}
            />
            <Input
              label="Teléfono de Emergencia"
              name="emergencyPhone"
              placeholder="Ej. +52 55 8765 4321"
              value={formData.emergencyPhone}
              onChange={handleChange}
            />
            <Input
              label="Parentesco / Relación"
              name="emergencyRelation"
              placeholder="Ej. Madre / Cónyuge"
              value={formData.emergencyRelation}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Sección 3: Datos Clínicos Iniciales */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
            3. Información Clínica Inicial
          </h4>
          <div className="space-y-4">
            <Textarea
              label="Motivo Inicial de Consulta *"
              name="initialReason"
              required
              rows={3}
              placeholder="¿Qué expresa el paciente como detonante para iniciar psicoterapia?"
              value={formData.initialReason}
              onChange={handleChange}
            />
            <Textarea
              label="Antecedentes Médicos / Psiquiátricos"
              name="clinicalBackground"
              rows={2}
              placeholder="Enfermedades crónicas, tratamientos previos, alergias..."
              value={formData.clinicalBackground}
              onChange={handleChange}
            />
            <Input
              label="Medicación Actual"
              name="currentMedication"
              placeholder="Ej. Ninguna o Escitalopram 10mg"
              value={formData.currentMedication}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading}>
            {patientToEdit ? 'Guardar Cambios' : 'Registrar Paciente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
