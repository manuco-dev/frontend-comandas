import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/appcontext';
import { getSocket } from '../services/socket';
import type { MenuItem, Pedido } from '../types';
import MeseroLogin from '../components/MeseroLogin';
import RestaurantMenu from '../components/RestaurantMenu';
import { useResponsive } from '../hooks/useResponsive';

type ViewMode = 'menu' | 'orders';

export default function MeseroPage() {
  const { pedidos, meseroActual, crearPedido, fetchMenu, marcarPagoPedido } = useApp();
  const [currentView, setCurrentView] = useState<ViewMode>('menu');
  const { isMobile } = useResponsive();

  // Configurar WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const socket = getSocket();
    
    // Escuchar actualizaciones de pedidos
    const handlePedidoActualizado = (pedidoActualizado: Pedido) => {
      console.log('🔄 Pedido actualizado en tiempo real:', pedidoActualizado);
      // El contexto ya maneja la actualización automáticamente
    };

    const handleNuevoPedido = (nuevoPedido: Pedido) => {
      console.log('🆕 Nuevo pedido recibido:', nuevoPedido);
      // El contexto ya maneja la actualización automáticamente
    };

    socket.on('pedidoActualizado', handlePedidoActualizado);
    socket.on('nuevoPedido', handleNuevoPedido);
    socket.on('pedidos-actualizados', () => {
      console.log('📋 Lista de pedidos actualizada');
    });

    return () => {
      socket.off('pedidoActualizado', handlePedidoActualizado);
      socket.off('nuevoPedido', handleNuevoPedido);
      socket.off('pedidos-actualizados');
    };
  }, []);

  // Cargar/actualizar el menú cuando el mesero entra a la vista de menú
  useEffect(() => {
    if (currentView === 'menu') {
      fetchMenu().catch(() => {});
    }
  }, [currentView, fetchMenu]);

  // Eliminadas funciones de estado no utilizadas tras simplificar tarjetas de pedidos

  const handleCreateOrder = async (orderData: {
    customerName: string;
    customerLocation: string;
    observations: string;
    pagado: boolean;
    menuItem: MenuItem;
  }) => {
    console.log('🔍 DEBUG - meseroActual:', meseroActual);
    console.log('🔍 DEBUG - meseroActual._id:', meseroActual?._id);
    console.log('🔍 DEBUG - meseroActual completo:', JSON.stringify(meseroActual, null, 2));
    
    if (!meseroActual) {
      alert('Debe iniciar sesión');
      return;
    }

    const pedido: Omit<Pedido, '_id' | 'timestamp' | 'estado'> = {
      identificationType: 'nombre',
      customerName: orderData.customerName,
      customerLocation: orderData.customerLocation,
      observaciones: orderData.observations,
      items: [{
        name: orderData.menuItem.nombre,
        price: orderData.menuItem.precio,
        quantity: 1
      }],
      total: orderData.menuItem.precio,
      mesero: meseroActual._id,
      pagado: !!orderData.pagado,
    };
    
    console.log('🔍 DEBUG - pedido completo:', JSON.stringify(pedido, null, 2));
    console.log('🔍 DEBUG - mesero field:', pedido.mesero);
    console.log('🔍 DEBUG - tipo de mesero field:', typeof pedido.mesero);
    
    try {
      await crearPedido(pedido);
      setCurrentView('orders');
      alert('¡Pedido creado exitosamente!');
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      alert('Error al crear el pedido. Intente nuevamente.');
    }
  };

  const pedidosMesero = useMemo(() => {
    return pedidos.filter(p => {
      // Manejar tanto el caso donde mesero es un objeto como cuando es un string (ObjectId)
      const meseroId = typeof p.mesero === 'object' && p.mesero !== null ? p.mesero._id : p.mesero;
      return meseroId === meseroActual?._id;
    });
  }, [pedidos, meseroActual]);

  // Métricas tipo dashboard para el mesero
  const pedidosHoyMesero = useMemo(() => {
    const today = new Date();
    return pedidosMesero.filter(p => {
      const d = new Date(p.timestamp);
      return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
    });
  }, [pedidosMesero]);

  const ventasHoyMesero = useMemo(() => {
    return pedidosHoyMesero.reduce((sum, p) => sum + (p.total || 0), 0);
  }, [pedidosHoyMesero]);

  const pedidosActivosMesero = useMemo(() => {
    return pedidosMesero.filter(p => p.estado !== 'entregado').length;
  }, [pedidosMesero]);

  // Si no hay mesero logueado, mostrar login
  if (!meseroActual) {
    return <MeseroLogin />;
  }

  // Si no hay mesero logueado, mostrar login
  if (!meseroActual) {
    return <MeseroLogin />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '0.5rem' : '1rem',
      paddingBottom: isMobile ? '4.5rem' : '1rem'
    }}>
      {/* Header con navegación */}
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '15px' : '20px',
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        marginBottom: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: isMobile ? '0.75rem' : '1rem',
        position: isMobile ? 'sticky' : 'static',
        top: isMobile ? '0.5rem' : undefined,
        zIndex: isMobile ? 20 : undefined,
        backdropFilter: isMobile ? 'saturate(180%) blur(4px)' : undefined
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            👨‍💼 Área de Mesero
          </h2>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}>
            Bienvenido, <strong>{meseroActual.nombre}</strong>
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          alignItems: 'center',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          <button
            onClick={() => setCurrentView('menu')}
            style={{
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: currentView === 'menu'
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f8fafc',
              color: currentView === 'menu' ? 'white' : '#64748b',
              flex: isMobile ? '1' : 'none'
            }}
          >
            🍽️ Menú
          </button>
          
          <button
            onClick={() => setCurrentView('orders')}
            style={{
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: currentView === 'orders'
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f8fafc',
              color: currentView === 'orders' ? 'white' : '#64748b',
              flex: isMobile ? '1' : 'none'
            }}
          >
            📋 Mis Pedidos
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('meseroActual');
              window.location.reload();
            }}
            style={{
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#ef4444',
              color: 'white',
              flex: isMobile ? '1' : 'none'
            }}
          >
            🚪 Salir
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {currentView === 'menu' && (
        <RestaurantMenu
          onCreateOrder={handleCreateOrder}
        />
      )}

      {currentView === 'orders' && (<>
        <div className="container">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Panel de ventas</div>
              <div className="card-subtitle">Resumen de hoy</div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{pedidosHoyMesero.length}</div>
                <div className="stat-label">Pedidos hoy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${ventasHoyMesero.toLocaleString()}</div>
                <div className="stat-label">Ventas hoy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{pedidosActivosMesero}</div>
                <div className="stat-label">Pedidos activos</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: isMobile ? '15px' : '20px',
          padding: isMobile ? '1rem' : '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          margin: '1rem 0'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '1.875rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Mis Pedidos Activos
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {pedidosHoyMesero.map(p => (
              <div
                key={p._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: isMobile ? '12px' : '14px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  gap: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1f2937' }}>
                      {p.identificationType === 'mesa' ? `Mesa ${p.mesa}` : (p.customerName || 'Cliente')}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {p.customerLocation || 'Sin ubicación'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: isMobile ? '1.125rem' : '1.25rem' }}>
                    ${p.total.toLocaleString()}
                  </div>
                </div>

                {p.observaciones && (
                  <div style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '0.95rem' }}>
                    <strong>Observaciones:</strong> {p.observaciones}
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '0.95rem' }}>
                  <strong>Plato(s):</strong> {p.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={!!p.pagado}
                    onChange={(e) => marcarPagoPedido(p._id, e.target.checked)}
                    style={{ width: isMobile ? '22px' : '18px', height: isMobile ? '22px' : '18px' }}
                  />
                  {p.pagado ? 'Pagado' : 'No pagado'}
                </label>
              </div>
            ))}
            
            {pedidosHoyMesero.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h4 style={{ marginBottom: '0.5rem' }}>No tienes pedidos hoy</h4>
                <p>Los pedidos de hoy aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </>)}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'saturate(180%) blur(6px)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          boxShadow: '0 -8px 20px rgba(0,0,0,0.1)',
          padding: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 50
        }}>
          <button
            onClick={() => setCurrentView('menu')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: currentView === 'menu'
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f8fafc',
              color: currentView === 'menu' ? 'white' : '#374151'
            }}
          >
            🍽️ Menú
          </button>
          <button
            onClick={() => setCurrentView('orders')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: currentView === 'orders'
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f8fafc',
              color: currentView === 'orders' ? 'white' : '#374151'
            }}
          >
            📋 Pedidos
          </button>
          {currentView === 'orders' && (
            <button
              onClick={() => setCurrentView('menu')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                background: '#10b981',
                color: 'white'
              }}
            >
              ➕ Nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}