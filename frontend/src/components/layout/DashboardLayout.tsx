import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleToggleMenu = () => setMobileMenuOpen((prev) => !prev);
    const handleCloseMenu = () => setMobileMenuOpen(false);

    window.addEventListener('toggle-mobile-menu', handleToggleMenu);
    window.addEventListener('close-mobile-menu', handleCloseMenu);

    return () => {
      window.removeEventListener('toggle-mobile-menu', handleToggleMenu);
      window.removeEventListener('close-mobile-menu', handleCloseMenu);
    };
  }, []);

  // Prevenir scroll del fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Cargando consultorio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Backdrop oscuro para móviles con cierre al tocar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity cursor-pointer animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          title="Toca para salir del menú"
        />
      )}

      {/* Menú Lateral: Pinned en desktop + Drawer deslizable en móviles */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
