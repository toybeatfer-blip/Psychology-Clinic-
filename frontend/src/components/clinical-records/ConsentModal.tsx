import React, { useState, useRef, useEffect } from 'react';
import { Patient, InformedConsent, ClinicSettings } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import {
  FileCheck,
  PenTool,
  RotateCcw,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSaveConsent: (consent: InformedConsent) => Promise<void>;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSaveConsent,
}) => {
  const { user } = useAuth();
  const { settings } = useClinic();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [tutorName, setTutorName] = useState(patient.consent?.tutorName || '');
  const [identificationNumber, setIdentificationNumber] = useState(
    patient.consent?.identificationNumber || ''
  );
  const [clausesAccepted, setClausesAccepted] = useState(
    patient.consent?.clausesAccepted ?? true
  );
  const [telehealthAccepted, setTelehealthAccepted] = useState(
    patient.consent?.telehealthAccepted ?? true
  );
  const [emergencyAccepted, setEmergencyAccepted] = useState(
    patient.consent?.emergencyContactAccepted ?? true
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingConsent = patient.consent;

  // Inicializar Canvas para la Firma
  useEffect(() => {
    if (isOpen && !existingConsent?.signatureDataUrl) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }, 100);
    }
  }, [isOpen, existingConsent]);

  if (!isOpen) return null;

  // Lógica de Dibujo de Firma (Ratón y Pantallas Táctiles)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = async () => {
    if (!clausesAccepted) {
      setError('Es obligatorio aceptar las cláusulas del consentimiento informado.');
      return;
    }

    let signatureUrl = existingConsent?.signatureDataUrl || '';

    if (!existingConsent?.signatureDataUrl) {
      if (!hasSignature || !canvasRef.current) {
        setError('El paciente o tutor legal debe firmar en el recuadro digital.');
        return;
      }
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    setSaving(true);
    setError(null);

    const consentData: InformedConsent = {
      id: existingConsent?.id || `consent-${Date.now()}`,
      patientId: patient.id,
      therapistId: user?.id || 'therapist',
      patientName: patient.fullName,
      tutorName: tutorName.trim() || undefined,
      identificationNumber: identificationNumber.trim() || undefined,
      signedAt: existingConsent?.signedAt || new Date().toISOString(),
      signatureDataUrl: signatureUrl,
      clausesAccepted,
      telehealthAccepted,
      emergencyContactAccepted: emergencyAccepted,
      status: 'SIGNED',
    };

    try {
      await onSaveConsent(consentData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el consentimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Consentimiento Informado de Psicoterapia</span>
                {existingConsent && (
                  <Badge variant="success" size="sm">
                    Firmado ✓
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                Expediente Clínico: <span className="text-teal-300 font-semibold">{patient.fullName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Imprimible y Desplazable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Encabezado Institucional del Consultorio */}
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-900">
                {settings?.clinicName || 'Consultorio de Psicología Clínica'}
              </h4>
              <p className="text-xs text-slate-500">{settings?.tagline || 'Atención en Salud Mental y Bienestar Emocional'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Terapeuta Responsable: {user?.fullName} {user?.profile?.professionalId ? `• Céd. Prof: ${user.profile.professionalId}` : ''}
              </p>
            </div>
            {settings?.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
            )}
          </div>

          {/* Declaración y Cláusulas Ético-Legales */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 leading-relaxed text-slate-600">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              Términos del Servicio y Confidencialidad
            </h5>
            <p>
              Por medio del presente documento, yo, <strong>{patient.fullName}</strong>, manifiesto haber sido informado/a de manera clara sobre las características del proceso terapéutico, sus objetivos, métodos y honorarios.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong>Secreto Profesional y Confidencialidad:</strong> Toda la información compartida durante las sesiones es estrictamente confidencial y amparada por el secreto profesional médico/psicológico.
              </li>
              <li>
                <strong>Excepciones a la Confidencialidad:</strong> La confidencialidad podrá levantarse únicamente en caso de riesgo inminente grave para la vida o integridad del paciente o de terceros, o por mandato judicial explícito.
              </li>
              <li>
                <strong>Política de Cancelaciones:</strong> Las citas deberán cancelarse o reprogramarse con al menos 24 horas de anticipación para evitar el cobro de la sesión.
              </li>
              <li>
                <strong>Modalidad y Telepsicología:</strong> Acepto la modalidad acordada (Presencial u Online) y me comprometo a contar con un espacio privado y seguro.
              </li>
            </ul>
          </div>

          {/* Datos del Paciente o Tutor Legal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Documento de Identificación (DNI / INE / Cédula)
              </label>
              <Input
                placeholder="Ej: 12345678-A"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                disabled={!!existingConsent}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de Padre / Madre / Tutor (si es menor de edad)
              </label>
              <Input
                placeholder="Dejar en blanco si es paciente adulto"
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                disabled={!!existingConsent}
              />
            </div>
          </div>

          {/* Casillas de Aceptación */}
          <div className="space-y-2.5 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clausesAccepted}
                onChange={(e) => setClausesAccepted(e.target.checked)}
                disabled={!!existingConsent}
                className="mt-1 h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700">
                <strong>He leído y acepto</strong> los términos del tratamiento, políticas de confidencialidad y honorarios.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={telehealthAccepted}
                onChange={(e) => setTelehealthAccepted(e.target.checked)}
                disabled={!!existingConsent}
                className="mt-1 h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700">
                Autorizo la atención psicológica mediante <strong>Teleconsulta / Sesiones Online</strong> cuando sea requerido.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyAccepted}
                onChange={(e) => setEmergencyAccepted(e.target.checked)}
                disabled={!!existingConsent}
                className="mt-1 h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700">
                Autorizo contactar a mi contacto de emergencia ({patient.emergencyName || 'familiar designado'}) en situaciones de crisis extrema.
              </span>
            </label>
          </div>

          {/* Recuadro de Firma Manuscrita / Digital */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-teal-600" />
                <span>Firma Manuscrita Digital del Paciente o Tutor</span>
              </label>
              {!existingConsent && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar trazo</span>
                </button>
              )}
            </div>

            {existingConsent?.signatureDataUrl ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                <img
                  src={existingConsent.signatureDataUrl}
                  alt="Firma del Paciente"
                  className="max-h-28 object-contain"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  ✓ Firmado digitalmente el {formatDate(existingConsent.signedAt)} por {existingConsent.tutorName || existingConsent.patientName}
                </p>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-white transition-colors overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 touch-none cursor-crosshair"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 font-medium">
                    Firme aquí con el dedo (celular/tablet) o con el ratón
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {existingConsent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              >
                Imprimir Documento
              </Button>
            )}

            {!existingConsent && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Guardar y Firmar Consentimiento
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
