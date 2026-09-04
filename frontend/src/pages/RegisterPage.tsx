import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BrainCircuit, Lock, Mail, User, Award, Phone } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    professionalId: '',
    specialty: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        professionalId: formData.professionalId || undefined,
        specialty: formData.specialty || undefined,
        phone: formData.phone || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta de terapeuta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <BrainCircuit className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Crea tu Consultorio en PsychoCare
        </h2>
        <p className="mt-1 text-center text-sm text-teal-400 font-medium">
          Aislamiento garantizado y confidencialidad médica para tus pacientes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre Completo con Título *"
                  name="fullName"
                  required
                  placeholder="Ej. Dra. Mariana Valdez"
                  leftIcon={<User className="w-4 h-4" />}
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Cédula / Colegiado Profesional"
                name="professionalId"
                placeholder="Ej. PSI-928174"
                leftIcon={<Award className="w-4 h-4" />}
                value={formData.professionalId}
                onChange={handleChange}
              />

              <Input
                label="Teléfono de Contacto"
                name="phone"
                placeholder="+52 55 1234 5678"
                leftIcon={<Phone className="w-4 h-4" />}
                value={formData.phone}
                onChange={handleChange}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Especialidad / Enfoque Psicológico"
                  name="specialty"
                  placeholder="Ej. Psicología Clínica y TCC / Terapia Sistémica"
                  value={formData.specialty}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Correo Electrónico *"
                  type="email"
                  name="email"
                  required
                  placeholder="dra.valdez@psicologia.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Contraseña *"
                type="password"
                name="password"
                required
                placeholder="Mínimo 6 caracteres"
                leftIcon={<Lock className="w-4 h-4" />}
                value={formData.password}
                onChange={handleChange}
              />

              <Input
                label="Confirmar Contraseña *"
                type="password"
                name="confirmPassword"
                required
                placeholder="Repite tu contraseña"
                leftIcon={<Lock className="w-4 h-4" />}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Registrarme y Crear Consultorio
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>¿Ya tienes una cuenta registrada?</span>
            <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
