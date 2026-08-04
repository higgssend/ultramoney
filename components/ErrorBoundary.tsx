import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    (this as any).setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 rounded-lg border border-red-200 m-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" />
            ¡Error de Renderizado!
          </h2>
          <p className="mb-4">Ha ocurrido un error inesperado al cargar esta pantalla.</p>
          <pre className="bg-red-900 text-red-50 p-4 rounded text-sm overflow-auto mb-4">
            {this.state.error?.toString()}
          </pre>
          <details className="text-sm">
            <summary className="cursor-pointer font-bold mb-2">Ver Detalles Técnicos (Component Stack)</summary>
            <pre className="bg-white text-red-900 p-4 rounded border border-red-200 overflow-auto">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
