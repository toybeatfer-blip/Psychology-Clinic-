import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BrainCircuit, Mail, Lock, KeyRound, CheckCircle2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Pedir correo, 2: Nueva contraseña
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // Paso 1: Verificar que el correo existe
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; data?: { message: string }; message?: string }>(
        '/auth/forgot-password',
        { email: email.trim().toLowerCase() }
      );

      if (res && res.success) {
        setStep(2);
      } else {
        setError(res.message || 'No se encontró ningún consultorio registrado con este correo.');
      }
    } catch (err: any) {
      setError(err.message || 'No se encontró ninguna cuenta asociada a este correo electrónico.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Establecer nueva contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; data?: { message: string }; message?: string }>(
        '/auth/reset-password',
        { email: email.trim().toLowerCase(), newPassword }
      );

      if (res && res.success) {
        setSuccessMessage('¡Contraseña restablecida exitosamente! Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Error al restablecer la contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <BrainCircuit className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Recuperar Credenciales
        </h2>
        <p className="mt-1 text-center text-sm text-teal-400 font-medium">
          Acceso seguro y confidencial a tu consultorio psicológico
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">¡Acceso Recuperado!</h3>
              <p className="text-xs text-slate-500">{successMessage}</p>
              <Link to="/login" className="block pt-2">
                <Button className="w-full">Ir al Inicio de Sesión</Button>
              </Link>
            </div>
          ) : step === 1 ? (
            // PASO 1: Ingresar correo registrado
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Ingresa tu Correo</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escribe el correo electrónico que utilizaste al crear tu cuenta de terapeuta
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <Input
                  label="Correo Electrónico Registrado *"
                  type="email"
                  required
                  placeholder="tu-email@consultorio.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={loading}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                  >
                    Verificar y Continuar
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            // PASO 2: Restablecer Contraseña
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[11px] font-bold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cuenta verificada: {email}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Nueva Contraseña</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establece una nueva contraseña segura para ingresar a tu consultorio
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Nueva Contraseña (mínimo 6 caracteres) *"
                  type="password"
                  required
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                  label="Confirmar Nueva Contraseña *"
                  type="password"
                  required
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="pt-2">
                  <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                    Guardar Nueva Contraseña
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-teal-600 hover:text-teal-700">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </Link>

            <Link to="/register" className="font-semibold text-slate-600 hover:text-slate-900">
              Crear Cuenta
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encriptación de credenciales grado médico</span>
          </div>
        </div>
      </div>
    </div>
  );
};
