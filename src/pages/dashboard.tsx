import React from 'react';
import { useApp } from '../context/appcontext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { getEstadisticas, pedidos, notificaciones } = useApp();
  const stats = getEstadisticas();

  return (
    <div className="container">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white', 
            margin: '0 0 0.5rem 0',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            📊 Dashboard
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            margin: 0,
            fontSize: '1.1rem'
          }}>
            Resumen general del sistema de comandas
          </p>
        </div>
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '0.9rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Quick Actions - Botones prominentes */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            🚀 Accesos Rápidos
          </h3>
          <p className="card-subtitle">Navega rápidamente a las secciones principales del sistema</p>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <Link 
            to="/" 
            className="btn btn-lg"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              padding: '1.5rem 2rem',
              fontSize: '1.2rem',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              minHeight: '80px'
            }}
          >
            <span style={{ fontSize: '2rem' }}>📊</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700' }}>Dashboard</div>
              <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Panel de control</div>
            </div>
          </Link>
          
          <Link 
            to="/mesero" 
            className="btn btn-lg"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              padding: '1.5rem 2rem',
              fontSize: '1.2rem',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              minHeight: '80px'
            }}
          >
            <span style={{ fontSize: '2rem' }}>👨‍💼</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700' }}>Área de Mesero</div>
              <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Gestión de pedidos</div>
            </div>
          </Link>
          
          <button 
            className="btn btn-lg"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              padding: '1.5rem 2rem',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #fa709a, #fee140)',
              minHeight: '80px',
              opacity: '0.7',
              cursor: 'not-allowed'
            }}
            disabled
          >
            <span style={{ fontSize: '2rem' }}>👨‍🍳</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700' }}>Cocina</div>
              <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Próximamente</div>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <div className="stat-value">{stats.pedidosHoy}</div>
              <div className="stat-label">Pedidos hoy</div>
            </div>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
            </div>
          </div>
          <div className="stat-change positive">+12% vs ayer</div>
        </div>

        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <div className="stat-value">${stats.ventasHoy.toLocaleString()}</div>
              <div className="stat-label">Ventas hoy</div>
            </div>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              background: 'linear-gradient(135deg, #34d399, #10b981)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
            </div>
          </div>
          <div className="stat-change positive">+8% vs ayer</div>
        </div>

        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <div className="stat-value">{stats.meserosActivos}</div>
              <div className="stat-label">Meseros activos</div>
            </div>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
            </div>
          </div>
          <div className="stat-change">En línea ahora</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Últimos pedidos</h3>
          <p className="card-subtitle">Los 10 pedidos más recientes</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidos.slice(0, 10).map(p => (
            <div key={p._id} className="order-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    background: p.estado === 'listo' ? 'linear-gradient(135deg, #34d399, #10b981)' : 
                               p.estado === 'preparando' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 
                               'linear-gradient(135deg, #60a5fa, #3b82f6)',
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700'
                  }}>
                    {p.estado === 'listo' ? '✅' : p.estado === 'preparando' ? '🍳' : '📝'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {p.identificationType === 'mesa' ? `Mesa ${p.mesa}` : p.customerName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {p.items.length} item{p.items.length !== 1 ? 's' : ''} • {typeof p.mesero === 'object' && p.mesero !== null ? p.mesero.nombre : p.mesero}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${
                    p.estado === 'listo' ? 'badge-success' : 
                    p.estado === 'preparando' ? 'badge-warning' : 
                    'badge-info'
                  }`}>
                    {p.estado}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>
                      ${p.total.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(p.timestamp).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {pedidos.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#6b7280' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No hay pedidos aún
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Los pedidos aparecerán aquí cuando se creen
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notificaciones.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔔 Notificaciones</h3>
            <p className="card-subtitle">Alertas y actualizaciones del sistema</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notificaciones.slice(0, 5).map((notif, index) => (
              <div key={index} className="alert alert-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>ℹ️</span>
                  <span>{notif}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}