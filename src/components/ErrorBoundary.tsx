import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registra el error
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    // Recargar la página
    window.location.reload();
  };

  handleReset = () => {
    // Resetear el estado del error
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Renderizar UI de error personalizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚨 Algo salió mal</h2>
            <p>Ha ocurrido un error inesperado en la aplicación.</p>
            
            <div className="error-actions">
              <button onClick={this.handleReset} className="retry-btn">
                🔄 Intentar de nuevo
              </button>
              <button onClick={this.handleReload} className="reload-btn">
                🔃 Recargar página
              </button>
            </div>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Detalles del error (desarrollo)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              padding: 20px;
            }

            .error-content {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }

            .error-content h2 {
              color: #d32f2f;
              margin-bottom: 16px;
              font-size: 24px;
            }

            .error-content p {
              color: #666;
              margin-bottom: 24px;
              font-size: 16px;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 20px;
            }

            .retry-btn, .reload-btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              transition: background 0.3s ease;
            }

            .retry-btn {
              background: #4CAF50;
              color: white;
            }

            .retry-btn:hover {
              background: #45a049;
            }

            .reload-btn {
              background: #2196F3;
              color: white;
            }

            .reload-btn:hover {
              background: #1976D2;
            }

            .error-details {
              text-align: left;
              margin-top: 20px;
              padding: 16px;
              background: #f5f5f5;
              border-radius: 8px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              margin-bottom: 8px;
            }

            .error-stack {
              background: #1e1e1e;
              color: #f8f8f2;
              padding: 16px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
              line-height: 1.4;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;