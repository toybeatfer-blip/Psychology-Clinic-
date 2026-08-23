import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  BrainCircuit,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useClinic } from '../../context/ClinicContext.js';
import { cn } from '../../lib/utils.js';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useClinic();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pacientes & Expedientes', href: '/patients', icon: Users },
    { name: 'Agenda & Citas', href: '/calendar', icon: Calendar },
    { name: 'Mi Perfil Profesional', href: '/profile', icon: UserCheck },
    { name: 'Configuración Clínica', href: '/settings', icon: Settings },
  ];

  const sidebarStyle = settings.sidebarStyle || 'dark';

  const getSidebarContainerClass = () => {
    switch (sidebarStyle) {
      case 'brand':
        return 'text-white border-r border-black/10';
      case 'light':
        return 'bg-white text-slate-700 border-r border-slate-200';
      case 'dark':
      default:
        return 'bg-slate-900 text-slate-300 border-r border-slate-800';
    }
  };

  const getBrandHeaderClass = () => {
    switch (sidebarStyle) {
      case 'brand':
        return 'border-b border-white/20 bg-black/10';
      case 'light':
        return 'border-b border-slate-100 bg-slate-50/70';
      case 'dark':
      default:
        return 'border-b border-slate-800/80 bg-slate-950/20';
    }
  };

  const getNavLinkClass = (isActive: boolean) => {
    if (sidebarStyle === 'brand') {
      return isActive
        ? 'bg-white text-slate-900 shadow-md font-bold'
        : 'text-white/80 hover:text-white hover:bg-white/15';
    }
    if (sidebarStyle === 'light') {
      return isActive
        ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-slate-900 shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50';
    }
    // dark
    return isActive
      ? 'bg-teal-600 text-white shadow-sm font-semibold'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/70';
  };

  return (
    <aside
      className={cn(
        'w-64 flex flex-col flex-shrink-0 h-screen sticky top-0 transition-colors duration-200 shadow-sm',
        getSidebarContainerClass()
      )}
      style={sidebarStyle === 'brand' ? { backgroundColor: settings.primaryColor } : {}}
    >
      {/* Brand Header */}
      <div className={cn('p-5 flex items-center gap-3', getBrandHeaderClass())}>
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt={settings.clinicName}
            className="w-10 h-10 rounded-xl object-cover bg-white p-1 shadow-sm border border-slate-200"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-xs flex-shrink-0"
            style={{
              backgroundColor: sidebarStyle === 'brand' ? 'rgba(255,255,255,0.2)' : settings.primaryColor,
            }}
          >
            <BrainCircuit className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              'text-sm font-bold tracking-tight truncate',
              sidebarStyle === 'light' ? 'text-slate-900' : 'text-white'
            )}
          >
            {settings?.clinicName || 'PsychoCare'}
          </h1>
          <p
            className={cn(
              'text-[11px] font-medium truncate',
              sidebarStyle === 'brand'
                ? 'text-white/80'
                : sidebarStyle === 'light'
                ? 'text-slate-500'
                : 'text-teal-400'
            )}
          >
            {settings?.tagline || 'Gestión Clínica'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p
          className={cn(
            'px-3 text-[11px] font-semibold uppercase tracking-wider mb-3',
            sidebarStyle === 'brand'
              ? 'text-white/60'
              : sidebarStyle === 'light'
              ? 'text-slate-400'
              : 'text-slate-500'
          )}
        >
          Menú Principal
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  getNavLinkClass(isActive)
                )
              }
              style={
                sidebarStyle === 'dark'
                  ? undefined
                  : undefined
              }
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Therapist Profile Footer */}
      <div
        className={cn(
          'p-4 border-t',
          sidebarStyle === 'brand'
            ? 'border-white/20 bg-black/10'
            : sidebarStyle === 'light'
            ? 'border-slate-100 bg-slate-50'
            : 'border-slate-800 bg-slate-950/40'
        )}
      >
        <div className="flex items-center gap-3 mb-3 px-2">
          <div
            className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-xs"
            style={{ backgroundColor: settings.primaryColor }}
          >
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium truncate',
                sidebarStyle === 'light' ? 'text-slate-900' : 'text-white'
              )}
            >
              {user?.fullName}
            </p>
            <p
              className={cn(
                'text-xs truncate',
                sidebarStyle === 'brand'
                  ? 'text-white/70'
                  : sidebarStyle === 'light'
                  ? 'text-slate-500'
                  : 'text-slate-400'
              )}
            >
              {user?.profile?.specialty || 'Psicólogo Clínico'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
            sidebarStyle === 'brand'
              ? 'text-white/80 hover:text-white hover:bg-black/20'
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'
          )}
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
