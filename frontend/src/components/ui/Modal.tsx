import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4">
      {/* Backdrop con tap-to-close para móviles */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative bg-white rounded-2xl sm:rounded-3xl text-left shadow-2xl transition-all w-full my-auto border border-slate-100 flex flex-col max-h-[94vh] z-10 overflow-hidden',
          maxWidths[maxWidth]
        )}
      >
        {/* Sticky Header con botón de cerrar táctil */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer touch-manipulation flex-shrink-0"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
};
