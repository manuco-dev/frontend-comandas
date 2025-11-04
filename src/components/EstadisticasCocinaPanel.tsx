import type { EstadisticasCocina } from '../services/cocinaService';

interface EstadisticasCocinaPanelProps {
  estadisticas: EstadisticasCocina;
}

function EstadisticasCocinaPanel({ estadisticas }: EstadisticasCocinaPanelProps) {
  const formatearTiempo = (minutos: number): string => {
    if (minutos < 60) {
      return `${Math.round(minutos)}m`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}m`;
  };

  const formatearMoneda = (cantidad: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      padding: '1.5rem'
    }}>
      {/* Resumen del día */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📊</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Resumen del Día
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total de pedidos:</span>
            <strong>{estadisticas.pedidosDelDia}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pedidos por hora:</span>
            <strong>{estadisticas.pedidosPorHora.toFixed(1)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ingresos totales:</span>
            <strong>{formatearMoneda(estadisticas.ingresosTotales)}</strong>
          </div>
        </div>
      </div>

      {/* Estados de pedidos */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📋</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
            Estados Actuales
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#92400e', fontWeight: '500' }}>🆕 Nuevos</span>
            <span style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {estadisticas.pedidosNuevos}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: '#dbeafe',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#1e40af', fontWeight: '500' }}>✅ Aceptados</span>
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {estadisticas.pedidosAceptados}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: '#fef2f2',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#dc2626', fontWeight: '500' }}>🔥 En Preparación</span>
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {estadisticas.pedidosEnPreparacion}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#16a34a', fontWeight: '500' }}>🎉 Listos</span>
            <span style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {estadisticas.pedidosListos}
            </span>
          </div>
        </div>
      </div>

      {/* Tiempos promedio */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>⏱️</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
            Tiempos Promedio
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ color: '#475569', fontWeight: '500' }}>Aceptación</span>
            <span style={{
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              {formatearTiempo(estadisticas.tiempoPromedioAceptacion)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ color: '#475569', fontWeight: '500' }}>Preparación</span>
            <span style={{
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              {formatearTiempo(estadisticas.tiempoPromedioPreparacion)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <span style={{ color: '#1e40af', fontWeight: '600' }}>Total</span>
            <span style={{
              color: '#1e40af',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              {formatearTiempo(estadisticas.tiempoPromedioTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Eficiencia */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>🎯</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Eficiencia
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tasa de completado:</span>
            <strong>{estadisticas.tasaCompletado.toFixed(1)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pedidos completados:</span>
            <strong>{estadisticas.pedidosCompletados}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ingreso promedio:</span>
            <strong>{formatearMoneda(estadisticas.ingresoPromedioPorPedido)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstadisticasCocinaPanel;