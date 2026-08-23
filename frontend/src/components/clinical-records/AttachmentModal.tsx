import React, { useState } from 'react';
import { Attachment, AttachmentType } from '../../types/index.js';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Textarea } from '../ui/Textarea.js';
import { Button } from '../ui/Button.js';
import { api } from '../../lib/api.js';
import { UploadCloud } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: (savedAttachment: Attachment) => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileSize: 150000,
    mimeType: 'application/pdf',
    type: 'CONSENT_FORM' as AttachmentType,
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; data: Attachment }>(
        `/patients/${patientId}/attachments`,
        {
          ...formData,
          fileSize: Number(formData.fileSize),
        }
      );
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el archivo adjunto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjuntar Documento al Expediente"
      description="Registra un informe, consentimiento firmado o test psicométrico (PDF)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Nombre del Archivo / Título *"
          name="fileName"
          required
          placeholder="Ej. Consentimiento_Informado_Firmado.pdf"
          value={formData.fileName}
          onChange={handleChange}
        />

        <Select
          label="Tipo de Documento *"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={[
            { value: 'CONSENT_FORM', label: '📄 Consentimiento Informado' },
            { value: 'PSYCHOMETRIC_TEST', label: '🧠 Test Psicométrico / Evaluación' },
            { value: 'MEDICAL_REPORT', label: '🏥 Informe Médico / Psiquiátrico' },
            { value: 'IDENTIFICATION', label: '🪪 Documento de Identificación' },
            { value: 'OTHER', label: '📁 Otro Documento' },
          ]}
        />

        <Input
          label="URL del Archivo (PDF o Almacenamiento en la Nube) *"
          type="url"
          name="fileUrl"
          required
          placeholder="https://.../documento.pdf"
          value={formData.fileUrl}
          onChange={handleChange}
          helperText="Enlace seguro a S3, Supabase Storage, Drive o Cloudinary"
        />

        <Textarea
          label="Descripción o Notas del Documento"
          name="description"
          rows={2}
          placeholder="Ej. Resultados de la escala de Beck con puntaje de 24 puntos..."
          value={formData.description}
          onChange={handleChange}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading} leftIcon={<UploadCloud className="w-4 h-4" />}>
            Guardar Adjunto
          </Button>
        </div>
      </form>
    </Modal>
  );
};
