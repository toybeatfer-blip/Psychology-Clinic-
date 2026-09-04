import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Patient,
  ClinicalNote,
  Attachment,
  Appointment,
  InformedConsent,
  PsychometricTest,
  ClinicalEvaluation,
} from '../types/index';
import { api } from '../lib/api';
import { Header } from '../components/layout/Header';
import { Tabs } from '../components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SessionNoteTimeline } from '../components/clinical-records/SessionNoteTimeline';
import { SessionNoteModal } from '../components/clinical-records/SessionNoteModal';
import { AttachmentModal } from '../components/clinical-records/AttachmentModal';
import { PatientFormModal } from '../components/patients/PatientFormModal';
import { AppointmentModal } from '../components/appointments/AppointmentModal';
import { ConsentModal } from '../components/clinical-records/ConsentModal';
import { PsychometricTestModal } from '../components/clinical-records/PsychometricTestModal';
import { PsychometricTestsTab } from '../components/clinical-records/PsychometricTestsTab';
import { ClinicalEvaluationTab } from '../components/patients/ClinicalEvaluationTab';
import { PatientPaymentsTab } from '../components/patients/PatientPaymentsTab';
import { calculateAge, formatDate, formatTime, formatFileSize } from '../lib/utils';
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
  Brain,
  BrainCircuit,
  ShieldCheck,
  CreditCard,
  Video,
  PenTool,
  CheckCircle2,
} from 'lucide-react';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ClinicalNote | null>(null);

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

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

  const handleSaveConsent = async (consent: InformedConsent) => {
    if (!id) return;
    await api.post(`/patients/${id}/consent`, consent);
    fetchPatientDetail();
  };

  const handleSaveTest = async (test: PsychometricTest) => {
    if (!id) return;
    await api.post(`/patients/${id}/psychometric-tests`, test);
    fetchPatientDetail();
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('¿Deseas eliminar esta evaluación psicométrica?')) return;
    await api.delete(`/psychometric-tests/${testId}`);
    fetchPatientDetail();
  };

  const handleSaveEvaluation = async (evaluation: ClinicalEvaluation) => {
    if (!id) return;
    await api.post(`/patients/${id}/clinical-evaluation`, evaluation);
    fetchPatientDetail();
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
      id: 'evaluation',
      label: 'Anamnesis & DSM-5',
      icon: <Brain className="w-4 h-4" />,
    },
    {
      id: 'tests',
      label: 'Tests Psicométricos',
      icon: <BrainCircuit className="w-4 h-4" />,
      badge: patient.psychometricTests?.length || 0,
    },
    {
      id: 'consent',
      label: 'Consentimiento & Firma',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: patient.consent?.status === 'SIGNED' ? '✓' : undefined,
    },
    {
      id: 'payments',
      label: 'Pagos & Recibos',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'appointments',
      label: 'Historial de Citas',
      icon: <Calendar className="w-4 h-4" />,
      badge: patient.appointments?.length || 0,
    },
    {
      id: 'attachments',
      label: 'Documentos',
      icon: <Paperclip className="w-4 h-4" />,
      badge: patient.attachments?.length || 0,
    },
    {
      id: 'info',
      label: 'Ficha General',
      icon: <User className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={patient.fullName}
        subtitle="Expediente Psicológico Integral y Confidencial"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/patients">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Volver
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNote}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nueva Nota
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Tarjeta Resumen del Paciente */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs shrink-0">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{patient.fullName}</h2>
                <Badge variant={patient.isActive ? 'success' : 'neutral'}>
                  {patient.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                {patient.consent?.status === 'SIGNED' && (
                  <Badge variant="success" size="sm">
                    Consentimiento Firmado ✓
                  </Badge>
                )}
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

          <div className="flex items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 w-full lg:w-auto justify-end">
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

        {/* Tab 2: Anamnesis Inicial & Diagnóstico DSM-5 */}
        {activeTab === 'evaluation' && (
          <ClinicalEvaluationTab
            patient={patient}
            onSaveEvaluation={handleSaveEvaluation}
          />
        )}

        {/* Tab 3: Batería Psicométrica */}
        {activeTab === 'tests' && (
          <PsychometricTestsTab
            patient={patient}
            onOpenTestModal={() => setIsTestModalOpen(true)}
            onDeleteTest={handleDeleteTest}
          />
        )}

        {/* Tab 4: Consentimiento Informado & Firma Digital */}
        {activeTab === 'consent' && (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>Consentimiento Informado de Psicoterapia</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Respaldo ético-legal con firma digital en pantalla
                </p>
              </div>

              <Button
                variant={patient.consent ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setIsConsentModalOpen(true)}
                leftIcon={patient.consent ? <FileCheck className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
              >
                {patient.consent ? 'Ver / Imprimir Consentimiento' : 'Firmar Consentimiento'}
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {patient.consent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">Consentimiento Firmado y Válido</h4>
                        <p className="text-xs text-emerald-700">
                          Firmado el {formatDate(patient.consent.signedAt)} por{' '}
                          {patient.consent.tutorName || patient.consent.patientName}
                          {patient.consent.identificationNumber ? ` (ID: ${patient.consent.identificationNumber})` : ''}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConsentModalOpen(true)}
                    >
                      Abrir Documento
                    </Button>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Firma Registrada</p>
                    <img
                      src={patient.consent.signatureDataUrl}
                      alt="Firma Manuscrita"
                      className="max-h-24 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Sin Consentimiento Informado Firmado</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Es una buena práctica clínica y ético-legal recabar la firma del paciente o tutor antes de iniciar el tratamiento.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsConsentModalOpen(true)}
                    leftIcon={<PenTool className="w-4 h-4" />}
                  >
                    Firmar en Pantalla Ahora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 5: Pagos & Recibos de Honorarios */}
        {activeTab === 'payments' && (
          <PatientPaymentsTab patient={patient} />
        )}

        {/* Tab 6: Historial de Citas */}
        {activeTab === 'appointments' && (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Historial de Sesiones</CardTitle>
                <p className="text-xs text-slate-500">Citas programadas, realizadas y teleconsultas</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAppointmentModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Agendar Cita
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(patient.appointments || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Sin citas agendadas para este paciente.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(patient.appointments || []).map((appt) => (
                    <div
                      key={appt.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {appt.modality === 'ONLINE' ? '💻 Sesión Online' : '🏢 Presencial'}
                          </span>
                          <Badge
                            variant={
                              appt.status === 'COMPLETED'
                                ? 'success'
                                : appt.status === 'CONFIRMED'
                                ? 'primary'
                                : appt.status === 'CANCELLED'
                                ? 'danger'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {appt.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          📅 {formatDate(appt.startDateTime)} • ⏰ {formatTime(appt.startDateTime)} - {formatTime(appt.endDateTime)}
                        </p>
                        {appt.notes && <p className="text-xs text-slate-600 italic">"{appt.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {appt.meetingUrl && appt.modality === 'ONLINE' && (
                          <a
                            href={appt.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Iniciar Teleconsulta</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 7: Documentos y Adjuntos */}
        {activeTab === 'attachments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Documentos Clínicos y Archivos</h3>
                <p className="text-xs text-slate-500">Pruebas, informes médicos y consentimientos en PDF</p>
              </div>
              <Button size="sm" onClick={() => setIsAttachmentModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Subir Archivo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(patient.attachments || []).map((att) => (
                <Card key={att.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm truncate" title={att.fileName}>
                        {att.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {formatFileSize(att.fileSize)} • {formatDate(att.uploadedAt)}
                      </p>
                    </div>

                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-1.5 text-center text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                    >
                      Descargar / Ver
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 8: Ficha General y Antecedentes */}
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
                    {patient.clinicalBackground || 'Sin antecedentes médicos reportados.'}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Medicación Actual
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {patient.currentMedication || 'Sin medicación psicofarmacológica actual.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto de Emergencia & Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contacto de Emergencia Designado
                  </h5>
                  <p className="text-sm font-bold text-slate-800">
                    {patient.emergencyName || 'No especificado'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Tel: {patient.emergencyPhone || 'N/A'} • Relación: {patient.emergencyRelation || 'N/A'}
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-2">
                  <p>📍 Dirección: {patient.address || 'No registrada'}</p>
                  <p>📅 Registrado en el sistema: {formatDate(patient.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modales */}
      {isNoteModalOpen && (
        <SessionNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          patientId={patient.id}
          noteToEdit={noteToEdit}
          onSuccess={fetchPatientDetail}
        />
      )}

      {isPatientModalOpen && (
        <PatientFormModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          patientToEdit={patient}
          onSuccess={fetchPatientDetail}
        />
      )}

      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          patients={[patient]}
          onSuccess={fetchPatientDetail}
        />
      )}

      {isAttachmentModalOpen && (
        <AttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => setIsAttachmentModalOpen(false)}
          patientId={patient.id}
          onSuccess={fetchPatientDetail}
        />
      )}

      {isConsentModalOpen && (
        <ConsentModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          patient={patient}
          onSaveConsent={handleSaveConsent}
        />
      )}

      {isTestModalOpen && (
        <PsychometricTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          patientId={patient.id}
          patientName={patient.fullName}
          onSaveTest={handleSaveTest}
        />
      )}
    </div>
  );
};
