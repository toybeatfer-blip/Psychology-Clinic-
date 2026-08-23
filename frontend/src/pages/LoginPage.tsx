import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { BrainCircuit, Lock, Mail, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('dr.carlos@psychocare.com');
    setPassword('password123');
    setLoading(true);
    setError(null);
    try {
      await login('dr.carlos@psychocare.com', 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la cuenta de demostración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <BrainCircuit className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          PsychoCare
        </h2>
        <p className="mt-1 text-center text-sm text-teal-400 font-medium">
          Software de Gestión Integral para Psicólogos y Clínicas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Iniciar Sesión</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa a tu consultorio para gestionar pacientes y expedientes
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo Electrónico"
              type="email"
              required
              placeholder="dr.carlos@consultorio.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Contraseña"
              type="password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Acceder al Consultorio
              </Button>
            </div>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-teal-200/60"
            >
              <span>Acceder con Cuenta de Demostración</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>¿No tienes una cuenta aún?</span>
            <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
              Registrarme como Terapeuta
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encriptación de datos grado médico / confidencial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
