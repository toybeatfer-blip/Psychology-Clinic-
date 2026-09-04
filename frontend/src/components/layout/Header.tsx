import React from 'react';
import { Database, CheckCircle2, Settings, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { logout, user } = useAuth();

  const handleToggleMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-menu'));
  };

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar tu sesión? Todos tus datos y cambios están guardados de forma segura.')) {
      logout();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Botón de Menú Móvil (Hamburguesa) */}
        <button
          type="button"
          onClick={handleToggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer touch-manipulation flex-shrink-0"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          {title && <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
        {actions && <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">{actions}</div>}

        <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] sm:text-xs font-semibold"
            title="Todas las modificaciones se graban inmediatamente."
          >
            <Database className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span className="hidden lg:inline">Guardado Automático</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <Link
            to="/settings"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors touch-manipulation"
            title="Configuración de la Clínica"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Botón de Cerrar Sesión en Header */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 transition-colors cursor-pointer touch-manipulation"
            title="Cerrar sesión de forma segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
