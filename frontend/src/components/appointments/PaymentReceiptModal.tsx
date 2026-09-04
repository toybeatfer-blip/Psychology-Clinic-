import React from 'react';
import { PaymentReceipt, Patient } from '../../types/index';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import {
  Printer,
  MessageSquare,
  Share2,
  X,
  Receipt,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt;
  patient: Patient;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  patient,
}) => {
  const { settings } = useClinic();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('52') && cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }

    const message = `🧾 *Comprobante de Pago de Honorarios - ${settings?.clinicName || 'PsychoCare'}*\n\n` +
      `Estimado/a *${patient.fullName}*:\n` +
      `Confirmamos el pago recibido por sus servicios psicológicos.\n\n` +
      `📋 *Recibo N°:* ${receipt.receiptNumber}\n` +
      `📅 *Fecha:* ${formatDate(receipt.issueDate)}\n` +
      `🩺 *Concepto:* ${receipt.concept}\n` +
      `💰 *Monto:* $${receipt.amount} ${receipt.currency}\n` +
      `💳 *Forma de Pago:* ${receipt.paymentMethod}\n` +
      `👨‍⚕️ *Terapeuta:* ${user?.fullName || ''}\n\n` +
      `¡Muchas gracias por su confianza!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold">Recibo de Honorarios Profesionales</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Imprimible del Recibo */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-white print:p-0">
          {/* Encabezado del Consultorio */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {settings?.clinicName || 'PsychoCare Consultorio'}
              </h2>
              <p className="text-xs text-slate-500">{settings?.tagline || 'Servicios Psicológicos Clínicos'}</p>
              {settings?.address && (
                <p className="text-[11px] text-slate-400 mt-0.5">{settings.address}</p>
              )}
              {settings?.phone && (
                <p className="text-[11px] text-slate-400">Tel: {settings.phone}</p>
              )}
              {settings?.taxId && (
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">RFC / ID Fiscal: {settings.taxId}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black rounded-lg">
                RECIBO
              </span>
              <p className="text-xs font-black text-slate-900 mt-1">{receipt.receiptNumber}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Fecha: {formatDate(receipt.issueDate)}</p>
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Recibí de</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{patient.fullName}</p>
              {patient.phone && <p className="text-slate-500 mt-0.5">Tel: {patient.phone}</p>}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Terapeuta</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.fullName}</p>
              {user?.profile?.professionalId && (
                <p className="text-slate-500 mt-0.5">Céd. Prof: {user.profile.professionalId}</p>
              )}
            </div>
          </div>

          {/* Detalle del Pago */}
          <div className="space-y-3">
            <div className="border-b border-slate-200 pb-2 flex justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Concepto del Servicio</span>
              <span>Importe</span>
            </div>

            <div className="flex justify-between items-center py-2 text-sm">
              <div>
                <p className="font-bold text-slate-900">{receipt.concept}</p>
                <p className="text-xs text-slate-400">Forma de Pago: {receipt.paymentMethod}</p>
              </div>
              <span className="text-base font-black text-slate-900">
                ${receipt.amount.toFixed(2)} {receipt.currency}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-700 text-sm">Total Pagado:</span>
              <span className="text-xl font-black text-teal-700">
                ${receipt.amount.toFixed(2)} {receipt.currency}
              </span>
            </div>
          </div>

          {/* Sello de Pago y Pie Legal */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pago Verificado y Acreditado</span>
            </div>
            <p className="text-[10px] italic max-w-xs text-right">
              {settings?.receiptFooter || 'Comprobante de honorarios profesionales emitido con fines de control.'}
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
              leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
            >
              Enviar WhatsApp
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Imprimir Recibo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
