import React, { useState } from 'react';
import { Patient, Appointment, PaymentReceipt } from '../../types/index';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import { PaymentReceiptModal } from '../appointments/PaymentReceiptModal';
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

interface PatientPaymentsTabProps {
  patient: Patient;
  onUpdateAppointmentPayment?: (appointmentId: string, isPaid: boolean, amount?: number) => Promise<void>;
}

export const PatientPaymentsTab: React.FC<PatientPaymentsTabProps> = ({
  patient,
  onUpdateAppointmentPayment,
}) => {
  const appointments = patient.appointments || [];
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  const totalBilled = appointments.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const totalPaid = appointments
    .filter((a) => a.isPaid)
    .reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const totalPending = totalBilled - totalPaid;

  const handleOpenReceipt = (appt: Appointment) => {
    const receipt: PaymentReceipt = {
      id: `rec-${appt.id}`,
      receiptNumber: `REC-${appt.id.slice(-6).toUpperCase()}`,
      therapistId: appt.therapistId,
      patientId: patient.id,
      appointmentId: appt.id,
      issueDate: appt.startDateTime,
      concept: `Sesión de Psicoterapia (${appt.modality === 'ONLINE' ? 'Online' : 'Presencial'})`,
      amount: Number(appt.price) || 0,
      currency: 'USD',
      paymentMethod: appt.paymentMethod || 'TRANSFER',
      patientName: patient.fullName,
      createdAt: new Date().toISOString(),
    };
    setSelectedReceipt(receipt);
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen Financiero del Paciente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Facturado</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">${totalBilled.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{appointments.length} sesiones agendadas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Cobrado</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">${totalPaid.toFixed(2)}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Pagos acreditados</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Saldo Pendiente</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1">${totalPending.toFixed(2)}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Por liquidar</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Cobros por Sesión */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span>Historial de Sesiones & Cobros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay citas o cobros registrados para este paciente.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => {
                const isPaid = appt.isPaid || appt.paymentStatus === 'PAID';
                const price = Number(appt.price) || 0;

                return (
                  <div
                    key={appt.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          Sesión {appt.modality === 'ONLINE' ? 'Online' : 'Presencial'}
                        </span>
                        <Badge variant={isPaid ? 'success' : 'warning'} size="sm">
                          {isPaid ? '🟢 Pagado' : '🟡 Pendiente'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📅 {formatDate(appt.startDateTime)} • Estado de Cita: {appt.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">${price.toFixed(2)} USD</span>
                        <p className="text-[10px] text-slate-400">
                          {appt.paymentMethod ? `Vía ${appt.paymentMethod}` : 'Honorarios'}
                        </p>
                      </div>

                      {isPaid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReceipt(appt)}
                          leftIcon={<Receipt className="w-3.5 h-3.5 text-teal-600" />}
                        >
                          Ver Recibo
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal del Recibo */}
      {selectedReceipt && (
        <PaymentReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
          patient={patient}
        />
      )}
    </div>
  );
};
