import React, { useState, useEffect } from 'react';
import { Patient } from '../types/index';
import { api } from '../lib/api';
import { Header } from '../components/layout/Header';
import { PatientCard } from '../components/patients/PatientCard';
import { PatientFormModal } from '../components/patients/PatientFormModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlus, Search, Users, Filter } from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all'); // all, active, inactive
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const fetchPatients = React.useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      let query = `/patients?limit=100`;
      if (search.trim() !== '') {
        query += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (filterActive === 'active') {
        query += `&isActive=true`;
      } else if (filterActive === 'inactive') {
        query += `&isActive=false`;
      }

      const res = await api.get<{ success: boolean; data: Patient[] }>(query);
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPatients(false);
    }, 250);

    const interval = setInterval(() => {
      fetchPatients(true);
    }, 6000);

    const handleFocus = () => {
      fetchPatients(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearTimeout(delayDebounce);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchPatients]);

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsModalOpen(true);
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${patient.fullName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await api.delete(`/patients/${patient.id}`);
      fetchPatients();
    } catch (error) {
      alert('Error al eliminar paciente');
    }
  };

  const handleNewPatient = () => {
    setPatientToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Gestión de Pacientes"
        subtitle="Expedientes clínicos individuales y directorio de consultorio"
        actions={
          <Button
            size="sm"
            onClick={handleNewPatient}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Nuevo Paciente
          </Button>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Buscar por nombre, teléfono, email u ocupación..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Estado:</span>
            </div>
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterActive === 'all' ? 'bg-white text-teal-700 shadow-xs font-bold' : ''
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterActive === 'active' ? 'bg-white text-teal-700 shadow-xs font-bold' : ''
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterActive === 'inactive' ? 'bg-white text-teal-700 shadow-xs font-bold' : ''
                }`}
              >
                Inactivos
              </button>
            </div>
          </div>
        </div>

        {/* Lista / Grid de Pacientes */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Cargando pacientes...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No se encontraron pacientes</h4>
            <p className="text-xs text-slate-500 mt-1">
              {search
                ? 'No hay registros que coincidan con la búsqueda actual.'
                : 'Aún no tienes pacientes registrados en tu consultorio.'}
            </p>
            <div className="mt-4">
              <Button size="sm" onClick={handleNewPatient} leftIcon={<UserPlus className="w-4 h-4" />}>
                Registrar Primer Paciente
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={handleEditPatient}
                onDelete={handleDeletePatient}
              />
            ))}
          </div>
        )}
      </div>

      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={patientToEdit}
        onSuccess={() => fetchPatients()}
      />
    </div>
  );
};
