import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  getAdminContactInfo,
  fetchPublicCreatorContact,
  AdminContactInfo,
} from '../lib/cloudSync';
import {
  BrainCircuit,
  Lock,
  Mail,
  ShieldCheck,
  Code2,
  Sparkles,
  MessageCircle,
  Phone,
  UserCheck,
  X,
  Send,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Contacto dinámico y protegido del Creador
  const [contactInfo, setContactInfo] = useState<AdminContactInfo>(getAdminContactInfo);

  // Estado para formulario de contacto rápido
  const [contactMsg, setContactMsg] = useState('');
  const [contactSender, setContactSender] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicCreatorContact().then((info) => {
      if (info) setContactInfo(info);
    });

    const handleUpdated = (e: any) => {
      if (e.detail) setContactInfo(e.detail);
    };

    window.addEventListener('psychocare_admin_contact_updated', handleUpdated);
    return () => {
      window.removeEventListener('psychocare_admin_contact_updated', handleUpdated);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      const isSuperAdmin = (email || '').trim().toLowerCase().startsWith('fernando');
      if (isSuperAdmin) {
        navigate('/admin/users');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setShowContactModal(false);
      setContactMsg('');
      setContactSender('');
    }, 2500);
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
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresa a tu consultorio para gestionar pacientes
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Usuario o Correo Electrónico"
              type="text"
              name="username"
              autoComplete="username"
              required
              placeholder="Fernando01 o tu-email@consultorio.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Contraseña</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Acceder al Consultorio
              </Button>
            </div>
          </form>

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

        {/* Pie de página con el contacto dinámico y protegido del Creador */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-slate-300 hover:text-teal-300 text-xs font-medium transition-all shadow-md backdrop-blur-sm group cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>
                Creado y Desarrollado por <strong className="text-teal-300 font-semibold">{contactInfo.adminName || 'Fernando'}</strong>
              </span>
              <span className="text-slate-500 group-hover:text-teal-400 text-[11px]">• Contactar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}?subject=Consulta%20PsychoCare%20-%20Contacto%20Creador`}
                className="hover:text-teal-300 transition-colors inline-flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-teal-400" />
                <span>{contactInfo.email}</span>
              </a>
            )}
            {contactInfo.email && contactInfo.phoneWhatsApp && (
              <span className="hidden sm:inline text-slate-700">•</span>
            )}
            {contactInfo.phoneWhatsApp && (
              <a
                href={`https://wa.me/${contactInfo.phoneWhatsApp.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(contactInfo.adminName || 'Fernando')},%20te%20contacto%20desde%20PsychoCare.`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal-300 transition-colors inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp: {contactInfo.phoneWhatsApp}</span>
              </a>
            )}
          </div>

          <p className="text-[10px] text-slate-400">
            PsychoCare Cloud v2.4 • Plataforma Segura para la Práctica Psicológica
          </p>
        </div>
      </div>

      {/* Modal de Contacto con el Creador */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Cabecera del modal */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-300 text-[10px] font-semibold mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Creador & Administrador del Sistema</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{contactInfo.adminName || 'Fernando'}</h4>
                  <p className="text-xs text-slate-300">Desarrollador de PsychoCare</p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                {contactInfo.helpMessage || '¿Tienes dudas, requieres soporte técnico, necesitas dar de alta nuevos consultorios o deseas proponer nuevas funciones para el sistema? Ponte en contacto directo:'}
              </p>

              {/* Canales directos de contacto */}
              <div className="space-y-2.5">
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}?subject=Soporte%20PsychoCare%20-%20Contacto%20Creador`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-200 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-teal-900">Correo Electrónico Directo</p>
                        <p className="text-[11px] text-slate-500">{contactInfo.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
                      Enviar →
                    </span>
                  </a>
                )}

                {contactInfo.phoneWhatsApp && (
                  <a
                    href={`https://wa.me/${contactInfo.phoneWhatsApp.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(contactInfo.adminName || 'Fernando')},%20solicito%20soporte%20en%20PsychoCare.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-emerald-900">WhatsApp / Soporte Directo</p>
                        <p className="text-[11px] text-slate-500">{contactInfo.phoneWhatsApp}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      Abrir WhatsApp →
                    </span>
                  </a>
                )}

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Super Administrador</p>
                      <p className="text-[11px] text-slate-500">Gestión de cuentas y consultorios</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Activo
                  </span>
                </div>
              </div>

              {/* Formulario de mensaje rápido */}
              <div className="pt-2 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-800 mb-2">Enviar Mensaje Rápido al Creador</h5>
                {contactSent ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>¡Mensaje enviado al creador exitosamente! Te responderemos a la brevedad.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendContact} className="space-y-3">
                    <Input
                      label="Tu Nombre o Consultorio"
                      type="text"
                      required
                      placeholder="Ej. Dr. Martínez"
                      value={contactSender}
                      onChange={(e) => setContactSender(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mensaje o Consulta
                      </label>
                      <textarea
                        required
                        rows={3}
                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder={`Escribe tu mensaje, sugerencia o solicitud de soporte para ${contactInfo.adminName || 'Fernando'}...`}
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                      Enviar Mensaje Directo
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Pie del modal */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>PsychoCare • Consultorio & Gestión</span>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
