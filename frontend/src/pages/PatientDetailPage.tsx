import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Patient, ClinicalNote, Attachment, Appointment } from '../types/index.js';
import { api } from '../lib/api.js';
import { Header } from '../components/layout/Header.js';
import { Tabs } from '../components/ui/Tabs.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { SessionNoteTimeline } from '../components/clinical-records/SessionNoteTimeline.js';
import { SessionNoteModal } from '../components/clinical-records/SessionNoteModal.js';
import { AttachmentModal } from '../components/clinical-records/AttachmentModal.js';
import { PatientFormModal } from '../components/patients/PatientFormModal.js';
import { AppointmentModal } from '../components/appointments/AppointmentModal.js';
import { calculateAge, formatDate, formatTime, formatFileSize } from '../lib/utils.js';
import {
  ArrowLeft,
  Plus,
  FileText,
  Paperclip,
  Calendar,
  User,
  Phone,
  Mail,
  HeartHandshake,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Trash2,
  Edit3,
  Download,
} from 'lucide-react';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes'); // notes, info, appointments, attachments

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ClinicalNote | null>(null);

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const fetchPatientDetail = async () => {
    if (!id) return;
    try {
      const res = await api.get<{ success: boolean; data: Patient }>(`/patients/${id}`);
      setPatient(res.data);
    } catch (error) {
      console.error('Error al cargar expediente del paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetail();
  }, [id]);

  const handleCreateNote = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: ClinicalNote) => {
    setNoteToEdit(note);
    setIsNoteModalOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta nota clínica?')) return;
    try {
      await api.delete(`/clinical-notes/${noteId}`);
      fetchPatientDetail();
    } catch (error) {
      alert('Error al eliminar la nota');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('¿Deseas eliminar este archivo adjunto?')) return;
    try {
      await api.delete(`/attachments/${attachmentId}`);
      fetchPatientDetail();
    } catch (error) {
      alert('Error al eliminar el archivo');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Cargando expediente clínico...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Paciente no encontrado</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">El registro no existe o no pertenece a tu consultorio.</p>
        <Link to="/patients">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver a Pacientes
          </Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    {
      id: 'notes',
      label: 'Notas de Evolución',
      icon: <FileText className="w-4 h-4" />,
      badge: patient.clinicalNotes?.length || 0,
    },
    {
      id: 'info',
      label: 'Ficha & Antecedentes',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'appointments',
      label: 'Historial de Citas',
      icon: <Calendar className="w-4 h-4" />,
      badge: patient.appointments?.length || 0,
    },
    {
      id: 'attachments',
      label: 'Documentos & Tests',
      icon: <Paperclip className="w-4 h-4" />,
      badge: patient.attachments?.length || 0,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={`Expediente: ${patient.fullName}`}
        subtitle="Historial clínico confidencial y evolución psicoterapéutica"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/patients">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Pacientes
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleCreateNote}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nueva Nota
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Resumen del Paciente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{patient.fullName}</h2>
                <Badge variant={patient.isActive ? 'success' : 'neutral'}>
                  {patient.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                <span>{patient.occupation || 'Sin ocupación especificada'}</span>
                <span>• {calculateAge(patient.birthDate)}</span>
                <span>• {patient.maritalStatus || 'Estado civil N/A'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 mt-2">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPatientModalOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Editar Ficha
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAppointmentModalOpen(true)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Agendar Cita
            </Button>
          </div>
        </div>

        {/* Pestañas de Navegación del Expediente */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: Notas de Sesión / Evolución Clínica */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Notas de Evolución Psicoterapéutica
                </h3>
                <p className="text-xs text-slate-500">
                  Cronología de intervenciones, objetivos y tareas inter-sesión
                </p>
              </div>
              <Button size="sm" onClick={handleCreateNote} leftIcon={<Plus className="w-4 h-4" />}>
                Añadir Nota de Sesión
              </Button>
            </div>

            <SessionNoteTimeline
              notes={patient.clinicalNotes || []}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        )}

        {/* Tab 2: Ficha y Antecedentes */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Motivo de Consulta y Antecedentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                    Motivo Inicial de Consulta
                  </h5>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {patient.initialReason}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Antecedentes Médicos / Psiquiátricos
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {patient.clinicalBackground || 'Sin antecedentes médicos relevantes reportados.'}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Medicación Actual
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {patient.currentMedication || 'Ninguna medicación psicofarmacológica reportada.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos Demográficos y de Emergencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Fecha de Nacimiento</span>
                    <span className="font-bold text-slate-800">{formatDate(patient.birthDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Género</span>
                    <span className="font-bold text-slate-800">{patient.gender || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Dirección / Domicilio</span>
                    <span className="font-bold text-slate-800">{patient.address || 'No registrado'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 mb-2">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                    Contacto en Caso de Emergencia
                  </h5>
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{patient.emergencyName || 'No especificado'}</p>
                    <p className="text-slate-600">
                      Relación: <span className="font-semibold">{patient.emergencyRelation || 'N/A'}</span>
                    </p>
                    <p className="text-slate-600">
                      Teléfono: <span className="font-semibold">{patient.emergencyPhone || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Historial de Citas */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Citas del Paciente</h3>
              <Button
                size="sm"
                onClick={() => setIsAppointmentModalOpen(true)}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Agendar Nueva Cita
              </Button>
            </div>

            <Card>
              <CardContent className="p-0 divide-y divide-slate-100">
                {!patient.appointments || patient.appointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Sin historial de citas</p>
                  </div>
                ) : (
                  patient.appointments.map((appt) => (
                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="text-sm font-bold text-slate-800">
                          {formatDate(appt.startDateTime)} a las {formatTime(appt.startDateTime)}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Modalidad: {appt.modality === 'ONLINE' ? 'Virtual (Online)' : 'Presencial'}
                          {appt.locationNotes && ` • ${appt.locationNotes}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          appt.status === 'COMPLETED'
                            ? 'success'
                            : appt.status === 'CONFIRMED'
                            ? 'info'
                            : appt.status === 'CANCELLED'
                            ? 'danger'
                            : 'primary'
                        }
                      >
                        {appt.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Documentos y Archivos Adjuntos */}
        {activeTab === 'attachments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Documentos Clínicos & Tests</h3>
                <p className="text-xs text-slate-500">
                  Consentimientos informados, escalas psicológicas y evaluaciones psicométricas
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAttachmentModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Adjuntar Documento
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!patient.attachments || patient.attachments.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Paperclip className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">Sin documentos adjuntos</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Puedes adjuntar consentimientos informados en PDF, resultados de tests (Beck, Hamilton, etc.).
                  </p>
                  <Button size="sm" onClick={() => setIsAttachmentModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Subir Primer Documento
                  </Button>
                </div>
              ) : (
                patient.attachments.map((file) => (
                  <Card key={file.id} className="hover:border-teal-300 transition-all flex flex-col justify-between">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-rose-100">
                          PDF
                        </div>
                        <Badge variant="secondary" size="sm">
                          {file.type === 'CONSENT_FORM'
                            ? 'Consentimiento'
                            : file.type === 'PSYCHOMETRIC_TEST'
                            ? 'Test Psicométrico'
                            : file.type === 'MEDICAL_REPORT'
                            ? 'Informe Médico'
                            : 'Documento'}
                        </Badge>
                      </div>

                      <h5 className="font-bold text-sm text-slate-800 line-clamp-1" title={file.fileName}>
                        {file.fileName}
                      </h5>
                      {file.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{file.description}</p>
                      )}

                      <p className="text-[11px] text-slate-400 mt-2">
                        {formatDate(file.uploadedAt)} • {formatFileSize(file.fileSize)}
                      </p>
                    </CardContent>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver PDF
                      </a>

                      <button
                        onClick={() => handleDeleteAttachment(file.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <SessionNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        patientId={patient.id}
        noteToEdit={noteToEdit}
        appointments={patient.appointments || []}
        onSuccess={() => fetchPatientDetail()}
      />

      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        patientId={patient.id}
        onSuccess={() => fetchPatientDetail()}
      />

      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patientToEdit={patient}
        onSuccess={() => fetchPatientDetail()}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patients={[patient]}
        onSuccess={() => fetchPatientDetail()}
      />
    </div>
  );
};
