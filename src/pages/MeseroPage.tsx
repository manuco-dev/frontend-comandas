import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/appcontext';
import { getSocket } from '../services/socket';
import type { MenuItem, Pedido } from '../types';
import MeseroLogin from '../components/MeseroLogin';
import RestaurantMenu from '../components/RestaurantMenu';
import { useResponsive } from '../hooks/useResponsive';

type ViewMode = 'menu' | 'orders';

export default function MeseroPage() {
  const { pedidos, meseroActual, crearPedido } = useApp();
  const [currentView, setCurrentView] = useState<ViewMode>('menu');
  const { isMobile, isTablet, width } = useResponsive();

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

  // Función para obtener el estilo del estado
  const getEstadoStyle = (estado: string, estadoCocina?: string) => {
    // Usar estadoCocina si está disponible, sino usar estado general
    const estadoActual = estadoCocina || estado;
    
    switch (estadoActual) {
      case 'pendiente':
      case 'nuevo':
        return {
          background: '#fef3c7',
          color: '#92400e',
          icon: '🆕'
        };
      case 'aceptado':
        return {
          background: '#dbeafe',
          color: '#1e40af',
          icon: '✅'
        };
      case 'preparando':
      case 'en_preparacion':
        return {
          background: '#fed7aa',
          color: '#c2410c',
          icon: '👨‍🍳'
        };
      case 'listo':
      case 'listo_para_entrega':
        return {
          background: '#d1fae5',
          color: '#065f46',
          icon: '🍽️'
        };
      case 'entregado':
        return {
          background: '#e0e7ff',
          color: '#3730a3',
          icon: '✨'
        };
      default:
        return {
          background: '#f3f4f6',
          color: '#374151',
          icon: '❓'
        };
    }
  };

  // Función para obtener el texto del estado
  const getEstadoText = (estado: string, estadoCocina?: string) => {
    const estadoActual = estadoCocina || estado;
    
    switch (estadoActual) {
      case 'pendiente':
      case 'nuevo':
        return 'Nuevo';
      case 'aceptado':
        return 'Aceptado';
      case 'preparando':
      case 'en_preparacion':
        return 'Preparando';
      case 'listo':
      case 'listo_para_entrega':
        return 'Listo';
      case 'entregado':
        return 'Entregado';
      default:
        return estadoActual;
    }
  };

  const handleCreateOrder = async (orderData: {
    customerName: string;
    customerLocation: string;
    observations: string;
    menuItem: MenuItem;
  }) => {
    console.log('🔍 DEBUG - meseroActual:', meseroActual);
    console.log('🔍 DEBUG - meseroActual._id:', meseroActual?._id);
    console.log('🔍 DEBUG - meseroActual completo:', JSON.stringify(meseroActual, null, 2));
    
    if (!meseroActual) {
      alert('Debe iniciar sesión');
      return;
    }

    const pedido = {
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
      padding: isMobile ? '0.5rem' : '1rem'
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
        gap: isMobile ? '0.75rem' : '1rem'
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

      {currentView === 'orders' && (
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
            {pedidosMesero.map(p => (
              <div
                key={p._id}
                style={{
                  background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                  border: '1px solid #cbd5e1',
                  borderRadius: isMobile ? '12px' : '16px',
                  padding: isMobile ? '1rem' : '1.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  marginBottom: '1rem',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '0.75rem' : '0'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: isMobile ? '1.125rem' : '1.25rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      Pedido #{p._id.slice(-6)}
                    </h4>
                    <p style={{
                      color: '#6b7280',
                      margin: 0,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>
                        {p.mesa ? `Mesa ${p.mesa}` : p.customerName}
                        {p.customerLocation && ` • ${p.customerLocation}`}
                      </span>
                      <span style={{ color: '#9ca3af' }}>•</span>
                      <span style={{ 
                        fontSize: isMobile ? '0.6875rem' : '0.75rem',
                        color: '#9ca3af'
                      }}>
                        {(() => {
                          const now = new Date();
                          const pedidoTime = new Date(p.timestamp);
                          const diffMinutes = Math.floor((now.getTime() - pedidoTime.getTime()) / (1000 * 60));
                          
                          if (diffMinutes < 1) return 'Hace menos de 1 min';
                          if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
                          
                          const diffHours = Math.floor(diffMinutes / 60);
                          const remainingMinutes = diffMinutes % 60;
                          
                          if (diffHours < 24) {
                            return remainingMinutes > 0 
                              ? `Hace ${diffHours}h ${remainingMinutes}m`
                              : `Hace ${diffHours}h`;
                          }
                          
                          return pedidoTime.toLocaleDateString();
                        })()}
                      </span>
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '1rem',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignSelf: isMobile ? 'stretch' : 'auto'
                  }}>
                    {(() => {
                      const estadoStyle = getEstadoStyle(p.estado, (p as any).estadoCocina);
                      const estadoText = getEstadoText(p.estado, (p as any).estadoCocina);
                      
                      return (
                        <span style={{
                          padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: '600',
                          background: estadoStyle.background,
                          color: estadoStyle.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          border: `1px solid ${estadoStyle.color}20`,
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          <span>{estadoStyle.icon}</span>
                          {estadoText}
                        </span>
                      );
                    })()}
                    
                    <div style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '700',
                      color: '#059669',
                      textAlign: isMobile ? 'center' : 'left',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      ${p.total.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  background: 'white',
                  borderRadius: isMobile ? '8px' : '12px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  marginBottom: '1rem'
                }}>
                  <h5 style={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🍽️ Artículos del Pedido:
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {p.items.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        padding: isMobile ? '0.375rem' : '0.5rem',
                        background: '#f9fafb',
                        borderRadius: isMobile ? '6px' : '8px',
                        border: '1px solid #e5e7eb',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '0.5rem' : '0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '0.5rem' : '0.75rem',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          <span style={{
                            background: '#3b82f6',
                            color: 'white',
                            borderRadius: '50%',
                            width: isMobile ? '20px' : '24px',
                            height: isMobile ? '20px' : '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '0.6875rem' : '0.75rem',
                            fontWeight: '600'
                          }}>
                            {item.quantity}
                          </span>
                          <span style={{
                            color: '#374151',
                            fontWeight: '500',
                            fontSize: isMobile ? '0.75rem' : '0.875rem'
                          }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '0.375rem' : '0.5rem',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: isMobile ? 'space-between' : 'flex-end'
                        }}>
                          <span style={{
                            color: '#6b7280',
                            fontSize: isMobile ? '0.6875rem' : '0.75rem'
                          }}>
                            ${item.price.toLocaleString()} c/u
                          </span>
                          <span style={{
                            color: '#059669',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.75rem' : '0.875rem'
                          }}>
                            ${(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Subtotal y Total */}
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '1rem'
                      }}>
                        Total del Pedido:
                      </span>
                      <span style={{
                        color: '#059669',
                        fontWeight: '700',
                        fontSize: '1.25rem'
                      }}>
                        ${p.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Información adicional del pedido */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Información de identificación */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#0369a1',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      📍 Identificación
                    </div>
                    <div style={{
                      color: '#1e40af',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      {p.identificationType === 'mesa' 
                        ? `Mesa ${p.mesa}` 
                        : `Cliente: ${p.customerName}`
                      }
                    </div>
                    {p.customerLocation && (
                      <div style={{
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        marginTop: '0.25rem'
                      }}>
                        📍 {p.customerLocation}
                      </div>
                    )}
                  </div>

                  {/* Prioridad */}
                  {(p as any).prioridad && (p as any).prioridad !== 'normal' && (
                    <div style={{
                      background: (p as any).prioridad === 'urgente' ? '#fef2f2' :
                                 (p as any).prioridad === 'alta' ? '#fff7ed' : '#f0fdf4',
                      border: `1px solid ${(p as any).prioridad === 'urgente' ? '#fecaca' :
                                          (p as any).prioridad === 'alta' ? '#fed7aa' : '#bbf7d0'}`,
                      borderRadius: '8px',
                      padding: '0.75rem'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: (p as any).prioridad === 'urgente' ? '#dc2626' :
                               (p as any).prioridad === 'alta' ? '#ea580c' : '#16a34a',
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {(p as any).prioridad === 'urgente' ? '🚨 Urgente' :
                         (p as any).prioridad === 'alta' ? '⚡ Alta Prioridad' : '📈 Prioridad'}
                      </div>
                      <div style={{
                        color: (p as any).prioridad === 'urgente' ? '#dc2626' :
                               (p as any).prioridad === 'alta' ? '#ea580c' : '#16a34a',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        textTransform: 'capitalize'
                      }}>
                        {(p as any).prioridad}
                      </div>
                    </div>
                  )}

                  {/* Tiempos de procesamiento */}
                  <div style={{
                    background: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '8px',
                    padding: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#a16207',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      ⏱️ Tiempo Transcurrido
                    </div>
                    <div style={{
                      color: '#a16207',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      {(() => {
                        const now = new Date();
                        const pedidoTime = new Date(p.timestamp);
                        const diffMinutes = Math.floor((now.getTime() - pedidoTime.getTime()) / (1000 * 60));
                        
                        if (diffMinutes < 1) return 'Menos de 1 minuto';
                        if (diffMinutes < 60) return `${diffMinutes} minutos`;
                        
                        const diffHours = Math.floor(diffMinutes / 60);
                        const remainingMinutes = diffMinutes % 60;
                        
                        if (diffHours < 24) {
                          return remainingMinutes > 0 
                            ? `${diffHours}h ${remainingMinutes}m`
                            : `${diffHours} horas`;
                        }
                        
                        return pedidoTime.toLocaleDateString();
                      })()}
                    </div>
                    <div style={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      marginTop: '0.25rem'
                    }}>
                      Creado: {new Date(p.timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Notas de cocina */}
                {(p as any).notas_cocina && (
                  <div style={{
                    background: '#f0f4ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#4338ca',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      👨‍🍳 Notas de Cocina
                    </div>
                    <div style={{
                      color: '#4338ca',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {(p as any).notas_cocina}
                    </div>
                  </div>
                )}

                {p.observaciones && (
                  <div style={{
                    background: '#fef7cd',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#92400e',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      📝 Observaciones del Cliente
                    </div>
                    <div style={{
                      color: '#92400e',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {p.observaciones}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {pedidosMesero.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h4 style={{ marginBottom: '0.5rem' }}>No tienes pedidos activos</h4>
                <p>Los pedidos que crees aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}