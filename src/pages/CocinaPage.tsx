import React, { useState, useEffect, useCallback } from 'react';
import { cocinaService } from '../services/cocinaService';
import type { PedidoCocina } from '../services/cocinaService';
import { subscribeToKitchenEvents, unsubscribeFromKitchenEvents, joinKitchenRoom, leaveKitchenRoom } from '../services/socket';
import PedidoCocinaCard from '../components/PedidoCocinaCard';
import { soundNotifications } from '../utils/soundNotifications';
import PedidoDetalleModal from '../components/PedidoDetalleModal';

type VistaActual = 'todos' | 'nuevos' | 'listos';
type FiltroEstado = 'todos' | 'nuevo' | 'aceptado' | 'en_preparacion' | 'listo_para_entrega';
type FiltroPrioridad = 'todos' | 'urgente' | 'alta' | 'normal' | 'baja';

const CocinaPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([]);
  const [vistaActual, setVistaActual] = useState<VistaActual>('todos');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundNotifications.isEnabledState());
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoCocina | null>(null);

  // Ordenar por más recientes primero (timestamp descendente) usando fecha
  const sortByRecent = useCallback((list: PedidoCocina[]) => {
    return [...list].sort((a, b) => {
      const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta; // descendente: más reciente primero
    });
  }, []);

  // Cargar pedidos
  const cargarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let pedidosData: PedidoCocina[];
      
      if (vistaActual === 'todos') {
        const filtros: any = {};
        if (filtroEstado !== 'todos') filtros.estado = filtroEstado;
        if (filtroPrioridad !== 'todos') filtros.prioridad = filtroPrioridad;
        pedidosData = await cocinaService.obtenerPedidos(filtros);
      } else if (vistaActual === 'nuevos') {
        pedidosData = await cocinaService.obtenerPedidosNuevos();
      } else if (vistaActual === 'listos') {
        pedidosData = await cocinaService.obtenerPedidosListos();
      } else {
        pedidosData = [];
      }

      // Aplicar orden por más recientes
      setPedidos(sortByRecent(pedidosData));
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [vistaActual, filtroEstado, filtroPrioridad]);

  // Efecto para cargar datos iniciales y configurar notificaciones
  useEffect(() => {
    cargarPedidos();
    
    // Unirse a la sala de cocina
    joinKitchenRoom();
    
    // Configurar eventos de socket
    subscribeToKitchenEvents({
      nuevoPedido: (pedido: PedidoCocina) => {
        console.log('🆕 Nuevo pedido recibido:', pedido);
        
        // Validar que el pedido sea válido antes de agregarlo
        if (!pedido || !pedido._id) {
          console.error('Pedido inválido recibido:', pedido);
          return;
        }
        
        // Insertar y mantener orden por más recientes
        setPedidos(prevPedidos => sortByRecent([pedido, ...prevPedidos]));
        
        // Reproducir sonido de notificación
        // Mostrar notificación visual
        mostrarNotificacion(`Nuevo pedido #${pedido._id.slice(-6).toUpperCase()}`, 'nuevo', pedido.prioridad);
      },
      
      pedidoActualizado: (pedido: PedidoCocina) => {
        console.log('🔄 Pedido actualizado:', pedido);
        
        // Validar que el pedido sea válido antes de actualizarlo
        if (!pedido || !pedido._id) {
          console.error('Pedido actualizado inválido recibido:', pedido);
          return;
        }
        
        // Actualizar y reordenar por más recientes
        setPedidos(prevPedidos => {
          const updated = prevPedidos.map(p => p._id === pedido._id ? pedido : p);
          return sortByRecent(updated);
        });
      },
      
      pedidoCancelado: (pedidoId: string) => {
        console.log('❌ Pedido cancelado:', pedidoId);
        setPedidos(prevPedidos => 
          prevPedidos.filter(p => p._id !== pedidoId)
        );
        mostrarNotificacion(`Pedido #${pedidoId.slice(-6).toUpperCase()} cancelado`, 'cancelado');
      },
      
    });
    
    // Cleanup al desmontar
    return () => {
      unsubscribeFromKitchenEvents();
      leaveKitchenRoom();
    };
  }, [cargarPedidos]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      cargarPedidos();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [cargarPedidos, autoRefresh]);

  // Efecto para recargar pedidos cuando cambien los filtros o vista
  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Funciones de control de sonido
  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    soundNotifications.setEnabled(newSoundState);
  };

  const testSound = async () => {
    await soundNotifications.testSound();
  };

  const mostrarNotificacion = async (mensaje: string, tipo: 'nuevo' | 'cancelado', prioridad?: string) => {
    // Reproducir sonido según el tipo y prioridad
    if (soundEnabled) {
      try {
        if (tipo === 'nuevo') {
          if (prioridad === 'urgente') {
            await soundNotifications.playUrgentOrderSound();
          } else {
            await soundNotifications.playNewOrderSound();
          }
        } else if (tipo === 'cancelado') {
          await soundNotifications.playErrorSound();
        }
      } catch (error) {
        console.log('No se pudo reproducir el sonido de notificación:', error);
      }
    }

    // Crear notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Panel de Cocina', {
        body: mensaje,
        icon: tipo === 'nuevo' ? '🆕' : '❌',
        tag: 'cocina-notification'
      });
    }
    
    // También mostrar notificación visual en la interfaz
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${tipo}`;
    notificationElement.textContent = mensaje;
    notificationElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'nuevo' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notificationElement);
    
    // Remover después de 5 segundos
    setTimeout(() => {
      notificationElement.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notificationElement)) {
          document.body.removeChild(notificationElement);
        }
      }, 300);
    }, 5000);
  };

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Manejar acciones de pedidos
  // Acción de "Aceptar" ya no se utiliza; la aceptación se encadena al iniciar preparación

  const handleIniciarPreparacion = async (pedidoId: string) => {
    try {
      // Si el pedido está en estado 'nuevo', primero aceptar y luego iniciar preparación
      const pedidoActual = pedidos.find(p => p._id === pedidoId);
      if (pedidoActual?.estadoCocina === 'nuevo') {
        await cocinaService.aceptarPedido(pedidoId);
      }
      await cocinaService.iniciarPreparacion(pedidoId);
      // Los WebSockets manejan la actualización automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar preparación');
    }
  };

  const handleMarcarListo = async (pedidoId: string) => {
    try {
      await cocinaService.marcarComoListo(pedidoId);
      
      // Reproducir sonido de éxito
      if (soundEnabled) {
        await soundNotifications.playOrderCompletedSound();
      }
      // Los WebSockets manejan la actualización automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como listo');
      // Reproducir sonido de error
      if (soundEnabled) {
        await soundNotifications.playErrorSound();
      }
    }
  };

  const handleCambiarPrioridad = async (pedidoId: string, prioridad: 'baja' | 'normal' | 'alta' | 'urgente') => {
    try {
      await cocinaService.cambiarPrioridad(pedidoId, prioridad);
      // Los WebSockets manejan la actualización automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar prioridad');
    }
  };

  const handleAñadirNotas = async (pedidoId: string, notas: string) => {
    try {
      await cocinaService.añadirNotas(pedidoId, notas);
      // Los WebSockets manejan la actualización automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir notas');
    }
  };

  // Obtener contadores para los botones
  const contadores = {
    nuevos: pedidos.filter(p => p.estadoCocina === 'nuevo').length,
    listos: pedidos.filter(p => p.estadoCocina === 'listo_para_entrega').length,
  };

  return (
    <div className="cocina-page">
      <div className="cocina-header">
        <div className="header-top">
          <h1>🍳 Panel de Cocina</h1>
          <div className="header-controls">
            <div className="auto-refresh">
              <label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-actualizar
              </label>
            </div>
            <div className="sound-controls">
              <label>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={toggleSound}
                />
                🔊 Sonidos
              </label>
              <button 
                onClick={testSound}
                className="test-sound-btn"
                disabled={!soundEnabled}
                title="Probar sonido"
              >
                🎵
              </button>
            </div>
            <button 
              onClick={() => { cargarPedidos(); }}
              className="refresh-btn"
              disabled={loading}
            >
              🔄 Actualizar
            </button>
            <div className="ultima-actualizacion">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Navegación por vistas */}
        <div className="vista-navigation">
          
          <button
            className={`nav-btn ${vistaActual === 'todos' ? 'active' : ''}`}
            onClick={() => setVistaActual('todos')}
          >
            📋 Todos ({pedidos.length})
          </button>
          <button
            className={`nav-btn ${vistaActual === 'nuevos' ? 'active' : ''} ${contadores.nuevos > 0 ? 'has-items' : ''}`}
            onClick={() => setVistaActual('nuevos')}
          >
            🆕 Nuevos ({contadores.nuevos})
          </button>
          
          <button
            className={`nav-btn ${vistaActual === 'listos' ? 'active' : ''} ${contadores.listos > 0 ? 'has-items' : ''}`}
            onClick={() => setVistaActual('listos')}
          >
            🍽️ Listos ({contadores.listos})
          </button>
          
        </div>

        {/* Filtros (solo para vista "todos") */}
        {vistaActual === 'todos' && (
          <div className="filtros">
            <div className="filtro-grupo">
              <label>Estado:</label>
              <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              >
                <option value="todos">Todos</option>
                <option value="nuevo">Nuevos</option>
                <option value="aceptado">Aceptados</option>
                <option value="en_preparacion">En Preparación</option>
                <option value="listo_para_entrega">Listos</option>
              </select>
            </div>
            <div className="filtro-grupo">
              <label>Prioridad:</label>
              <select 
                value={filtroPrioridad} 
                onChange={(e) => setFiltroPrioridad(e.target.value as FiltroPrioridad)}
              >
                <option value="todos">Todas</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="alta">🟡 Alta</option>
                <option value="normal">🔵 Normal</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="cocina-content">
        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando pedidos...</p>
          </div>
        ) : (
          <div className="pedidos-grid">
            {pedidos.length === 0 ? (
              <div className="no-pedidos">
                <p>No hay pedidos en esta vista</p>
              </div>
            ) : (
              pedidos
                .filter(pedido => pedido && pedido._id) // Filtrar pedidos inválidos
              .map((pedido) => (
                <PedidoCocinaCard
                  key={pedido._id}
                  pedido={pedido}
                  onIniciarPreparacion={handleIniciarPreparacion}
                  onMarcarListo={handleMarcarListo}
                  onCambiarPrioridad={handleCambiarPrioridad}
                  onAñadirNotas={handleAñadirNotas}
                  onVerDetalle={(p) => setPedidoSeleccionado(p)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .cocina-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .cocina-header {
          background: white;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-top h1 {
          margin: 0;
          color: #333;
          font-size: 2rem;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .auto-refresh label {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .sound-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sound-controls label {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .test-sound-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s ease;
        }

        .test-sound-btn:hover:not(:disabled) {
          background: #1976D2;
        }

        .test-sound-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .refresh-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-btn:hover {
          background: #45a049;
        }

        .refresh-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .ultima-actualizacion {
          font-size: 12px;
          color: #666;
        }

        .vista-navigation {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .nav-btn {
          background: #f5f5f5;
          border: 2px solid #ddd;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background: #e9e9e9;
        }

        .nav-btn.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .nav-btn.has-items {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
          100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .filtros {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .filtro-grupo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filtro-grupo label {
          font-weight: 500;
          color: #333;
        }

        .filtro-grupo select {
          padding: 5px 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .cocina-content {
          min-height: 400px;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-message button {
          background: none;
          border: none;
          color: #c62828;
          cursor: pointer;
          font-size: 18px;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pedidos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .no-pedidos {
          text-align: center;
          padding: 50px;
          color: white;
          font-size: 18px;
        }

        /* Estilos para las columnas - Optimizado para computador/tablet */
        .columnas-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100vh - 280px);
          min-height: 500px;
          padding: 15px;
        }

        .columna {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 2px solid transparent;
        }

        .columna:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .columna-header {
          padding: 15px 20px;
          border-bottom: 2px solid #f0f0f0;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          position: relative;
          overflow: hidden;
        }

        .columna-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .columna-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .columna.nuevos {
          border-color: #2196F3;
        }

        .columna.nuevos .columna-header {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        }

        .columna.nuevos .columna-header::before {
          background: linear-gradient(90deg, #2196F3 0%, #1976D2 100%);
        }

        .columna.preparacion {
          border-color: #ff9800;
        }

        .columna.preparacion .columna-header {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        }

        .columna.preparacion .columna-header::before {
          background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
        }

        .columna.listos {
          border-color: #4caf50;
        }

        .columna.listos .columna-header {
          background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        }

        .columna.listos .columna-header::before {
          background: linear-gradient(90deg, #4caf50 0%, #388e3c 100%);
        }

        .columna-content {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%);
        }

        .columna-content::-webkit-scrollbar {
          width: 6px;
        }

        .columna-content::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }

        .columna-content::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }

        .columna-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.5);
        }

        .columna-vacia {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #7f8c8d;
          font-style: italic;
          text-align: center;
          font-size: 0.9rem;
          background: rgba(0,0,0,0.02);
          border-radius: 10px;
          border: 2px dashed rgba(0,0,0,0.1);
        }

        .columna-vacia::before {
          content: '📋';
          font-size: 1.8rem;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        /* Ajustes para las tarjetas en columnas */
        .columnas-container .pedido-card {
          margin-bottom: 0;
          transform: scale(1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .columnas-container .pedido-card:hover {
          transform: scale(1.01);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
        }

        @media (max-width: 768px) {
          .cocina-page {
            padding: 10px;
          }
          
          .header-top {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }
          
          .header-controls {
            justify-content: center;
          }
          
          .vista-navigation {
            justify-content: center;
          }
          
          .filtros {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .pedidos-grid {
            grid-template-columns: 1fr;
          }
          
          .columnas-container {
            grid-template-columns: 1fr;
            height: auto;
            gap: 15px;
          }
          
          .columna {
            max-height: 400px;
          }
          
          .vista-navigation {
            flex-wrap: wrap;
          }
        }
      `}</style>

      {pedidoSeleccionado && (
        <PedidoDetalleModal
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default CocinaPage;