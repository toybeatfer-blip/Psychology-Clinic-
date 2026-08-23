import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Database, ShieldCheck, CheckCircle2, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div>
        {title && <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold"
            title="Todas las modificaciones, notas y nuevos pacientes se graban inmediatamente en la base de datos persistente en disco (dev.db)."
          >
            <Database className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span className="hidden sm:inline">Guardado Automático Activo</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <Link
            to="/settings"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Configuración de la Clínica"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
