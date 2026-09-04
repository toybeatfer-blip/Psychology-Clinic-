import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrainCircuit, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in PsychoCare:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('psychocare_token');
      localStorage.removeItem('psychocare_user');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/login';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-6 border border-teal-500/30">
            <BrainCircuit className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">PsychoCare Consultorio</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Ocurrió un detalle al cargar la vista. Puedes reiniciar la sesión o recargar la página para continuar.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Home className="w-4 h-4" />
              Ir a Pantalla Principal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
