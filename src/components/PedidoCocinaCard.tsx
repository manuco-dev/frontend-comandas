import React, { useState } from 'react';
import type { PedidoCocina } from '../services/cocinaService';

interface PedidoCocinaCardProps {
  pedido: PedidoCocina;
  onAceptar: (pedidoId: string) => void;
  onIniciarPreparacion: (pedidoId: string) => void;
  onMarcarListo: (pedidoId: string) => void;
  onCambiarPrioridad: (pedidoId: string, prioridad: 'baja' | 'normal' | 'alta' | 'urgente') => void;
  onAñadirNotas: (pedidoId: string, notas: string) => void;
}

const PedidoCocinaCard: React.FC<PedidoCocinaCardProps> = ({
  pedido,
  onAceptar,
  onIniciarPreparacion,
  onMarcarListo,
  onCambiarPrioridad,
  onAñadirNotas
}) => {
  // Validación temprana para evitar errores
  if (!pedido || typeof pedido !== 'object') {
    console.error('PedidoCocinaCard: pedido es null, undefined o no es un objeto:', pedido);
    return (
      <div className="pedido-card error">
        <p>Error: Datos del pedido no válidos</p>
      </div>
    );
  }

  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [nuevasNotas, setNuevasNotas] = useState(pedido.notas_cocina || '');
  const [mostrarCambioPrioridad, setMostrarCambioPrioridad] = useState(false);

  const formatearTiempo = (minutos: number): string => {
    if (minutos < 60) {
      return `${minutos}m`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const obtenerIconoEstado = (estado: string): string => {
    switch (estado) {
      case 'nuevo': return '🆕';
      case 'aceptado': return '✅';
      case 'en_preparacion': return '👨‍🍳';
      case 'listo_para_entrega': return '🍽️';
      default: return '❓';
    }
  };

  const obtenerColorEstado = (estado: string): string => {
    switch (estado) {
      case 'nuevo': return '#2196F3';
      case 'aceptado': return '#4CAF50';
      case 'en_preparacion': return '#FF9800';
      case 'listo_para_entrega': return '#9C27B0';
      default: return '#757575';
    }
  };

  const obtenerIconoPrioridad = (prioridad: string): string => {
    switch (prioridad) {
      case 'urgente': return '🔴';
      case 'alta': return '🟡';
      case 'normal': return '🔵';
      case 'baja': return '🟢';
      default: return '🔵';
    }
  };

  const handleGuardarNotas = () => {
    if (nuevasNotas !== pedido.notas_cocina) {
      onAñadirNotas(pedido._id, nuevasNotas);
    }
    setMostrarNotas(false);
  };

  const handleCambiarPrioridad = (nuevaPrioridad: 'baja' | 'normal' | 'alta' | 'urgente') => {
    onCambiarPrioridad(pedido._id, nuevaPrioridad);
    setMostrarCambioPrioridad(false);
  };

  const puedeAceptar = pedido.estadoCocina === 'nuevo';
  const puedeIniciarPreparacion = pedido.estadoCocina === 'aceptado';
  const puedeMarcarListo = pedido.estadoCocina === 'en_preparacion';

  return (
    <div className="pedido-cocina-card">
      {/* Header de la tarjeta */}
      <div className="card-header">
        <div className="pedido-info">
          <div className="pedido-numero">
            Pedido #{pedido._id.slice(-6).toUpperCase()}
          </div>
          <div className="cliente-info">
            {pedido.clienteInfo}
            {pedido.customerLocation && (
              <span className="ubicacion"> - {pedido.customerLocation}</span>
            )}
          </div>
        </div>
        <div className="tiempo-transcurrido">
          ⏱️ {formatearTiempo(pedido.tiempoTranscurrido)}
        </div>
      </div>

      {/* Estado y prioridad */}
      <div className="estado-prioridad">
        <div 
          className="estado-badge"
          style={{ backgroundColor: obtenerColorEstado(pedido.estadoCocina) }}
        >
          {obtenerIconoEstado(pedido.estadoCocina)} {pedido.estadoCocina.replace('_', ' ').toUpperCase()}
        </div>
        <div className="prioridad-container">
          <div 
            className="prioridad-badge"
            onClick={() => setMostrarCambioPrioridad(!mostrarCambioPrioridad)}
            style={{ cursor: 'pointer' }}
          >
            {obtenerIconoPrioridad(pedido.prioridad)} {pedido.prioridad.toUpperCase()}
          </div>
          {mostrarCambioPrioridad && (
            <div className="prioridad-dropdown">
              <button onClick={() => handleCambiarPrioridad('urgente')}>🔴 Urgente</button>
              <button onClick={() => handleCambiarPrioridad('alta')}>🟡 Alta</button>
              <button onClick={() => handleCambiarPrioridad('normal')}>🔵 Normal</button>
              <button onClick={() => handleCambiarPrioridad('baja')}>🟢 Baja</button>
            </div>
          )}
        </div>
      </div>

      {/* Items del pedido */}
      <div className="items-pedido">
        <h4>📋 Items:</h4>
        {pedido.items.map((item, index) => (
          <div key={index} className="item">
            <span className="item-cantidad">{item.quantity}x</span>
            <span className="item-nombre">{item.name}</span>
            <span className="item-precio">${item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="total">
          <strong>Total: ${pedido.total.toFixed(2)}</strong>
        </div>
      </div>

      {/* Observaciones del cliente */}
      {pedido.observaciones && (
        <div className="observaciones">
          <h4>💬 Observaciones del cliente:</h4>
          <p>{pedido.observaciones}</p>
        </div>
      )}

      {/* Notas de cocina */}
      <div className="notas-cocina">
        <div className="notas-header">
          <h4>📝 Notas de cocina:</h4>
          <button 
            className="toggle-notas"
            onClick={() => setMostrarNotas(!mostrarNotas)}
          >
            {mostrarNotas ? '▼' : '▶'}
          </button>
        </div>
        {mostrarNotas && (
          <div className="notas-content">
            <textarea
              value={nuevasNotas}
              onChange={(e) => setNuevasNotas(e.target.value)}
              placeholder="Añadir notas de cocina..."
              rows={3}
            />
            <div className="notas-actions">
              <button onClick={handleGuardarNotas} className="guardar-btn">
                💾 Guardar
              </button>
              <button 
                onClick={() => {
                  setNuevasNotas(pedido.notas_cocina || '');
                  setMostrarNotas(false);
                }}
                className="cancelar-btn"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
        {pedido.notas_cocina && !mostrarNotas && (
          <p className="notas-preview">{pedido.notas_cocina}</p>
        )}
      </div>

      {/* Información del mesero y hora/fecha de toma del pedido */}
      <div className="mesero-info">
        <span>👨‍💼 Mesero: {pedido.mesero?.nombre || 'No asignado'}</span>
        <span>
          🕐 Tomado: {new Date(pedido.timestamp).toLocaleDateString()} {new Date(pedido.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Tiempos de etapas */}
      {pedido.tiemposEtapas && Object.keys(pedido.tiemposEtapas).length > 0 && (
        <div className="tiempos-etapas">
          <h4>⏰ Tiempos:</h4>
          {pedido.tiemposEtapas.tiempoHastaAceptacion !== undefined && (
            <span>Aceptación: {formatearTiempo(pedido.tiemposEtapas.tiempoHastaAceptacion)}</span>
          )}
          {pedido.tiemposEtapas.tiempoPreparacion !== undefined && (
            <span>Preparación: {formatearTiempo(pedido.tiemposEtapas.tiempoPreparacion)}</span>
          )}
          {pedido.tiemposEtapas.tiempoFinalizacion !== undefined && (
            <span>Finalización: {formatearTiempo(pedido.tiemposEtapas.tiempoFinalizacion)}</span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="acciones">
        {puedeAceptar && (
          <button 
            className="accion-btn aceptar"
            onClick={() => onAceptar(pedido._id)}
          >
            ✅ Aceptar Pedido
          </button>
        )}
        {puedeIniciarPreparacion && (
          <button 
            className="accion-btn preparar"
            onClick={() => onIniciarPreparacion(pedido._id)}
          >
            👨‍🍳 Iniciar Preparación
          </button>
        )}
        {puedeMarcarListo && (
          <button 
            className="accion-btn listo"
            onClick={() => onMarcarListo(pedido._id)}
          >
            🍽️ Marcar como Listo
          </button>
        )}
      </div>

      <style jsx>{`
        .pedido-cocina-card {
          background: white;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
          border-left: 4px solid ${pedido.colorPrioridad};
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          min-height: 240px;
          position: relative;
          overflow: hidden;
        }

        .pedido-cocina-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${pedido.colorPrioridad}, rgba(255,255,255,0.3));
        }

        .pedido-cocina-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .pedido-numero {
          font-weight: 700;
          font-size: 1.1rem;
          color: #2c3e50;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .cliente-info {
          font-size: 0.95rem;
          color: #34495e;
          margin-top: 4px;
          font-weight: 500;
        }

        .ubicacion {
          font-style: italic;
          color: #7f8c8d;
        }

        .tiempo-transcurrido {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        .estado-prioridad {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          gap: 10px;
        }

        .estado-badge {
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .prioridad-container {
          position: relative;
        }

        .prioridad-badge {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          border: 1px solid #dee2e6;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
        }

        .prioridad-badge:hover {
          background: linear-gradient(135deg, #e9ecef, #dee2e6);
          transform: translateY(-1px);
        }

        .prioridad-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 130px;
          overflow: hidden;
        }

        .prioridad-dropdown button {
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .prioridad-dropdown button:hover {
          background: #f8f9fa;
        }

        .items-pedido {
          margin-bottom: 15px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .items-pedido h4 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #2c3e50;
          font-weight: 600;
        }

        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #e9ecef;
          font-size: 0.9rem;
        }

        .item:last-child {
          border-bottom: none;
        }

        .item-cantidad {
          font-weight: bold;
          color: #2196F3;
          min-width: 35px;
          font-size: 0.95rem;
        }

        .item-nombre {
          flex: 1;
          margin: 0 12px;
          font-weight: 500;
          color: #2c3e50;
        }

        .item-precio {
          font-weight: bold;
          color: #27ae60;
          font-size: 0.95rem;
        }

        .total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 2px solid #3498db;
          text-align: right;
          font-size: 1.1rem;
          color: #2c3e50;
          font-weight: 700;
        }

        .observaciones {
          margin-bottom: 15px;
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #f39c12;
        }

        .observaciones h4 {
          margin: 0 0 8px 0;
          font-size: 0.95rem;
          color: #2c3e50;
          font-weight: 600;
        }

        .observaciones p {
          margin: 0;
          font-size: 0.9rem;
          color: #5d4e37;
          font-style: italic;
          line-height: 1.3;
        }

        .notas-cocina {
          margin-bottom: 15px;
        }

        .notas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .notas-header h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #2c3e50;
          font-weight: 600;
        }

        .toggle-notas {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          color: #3498db;
          font-weight: 500;
        }

        .notas-content textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.9rem;
          min-height: 60px;
        }

        .notas-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .guardar-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.3s ease;
        }

        .guardar-btn:hover {
          background: #229954;
        }

        .cancelar-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.3s ease;
        }

        .cancelar-btn:hover {
          background: #c0392b;
        }

        .notas-preview {
          font-size: 0.9rem;
          color: #5d6d7e;
          font-style: italic;
          margin: 0;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .mesero-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #5d6d7e;
          margin-bottom: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .tiempos-etapas {
          margin-bottom: 15px;
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #2196f3;
        }

        .tiempos-etapas h4 {
          margin: 0 0 8px 0;
          font-size: 0.95rem;
          color: #2c3e50;
          font-weight: 600;
        }

        .tiempos-etapas span {
          display: inline-block;
          margin-right: 15px;
          font-size: 0.8rem;
          color: #1565c0;
          font-weight: bold;
          background: rgba(255,255,255,0.7);
          padding: 3px 8px;
          border-radius: 12px;
          margin-bottom: 4px;
        }

        .acciones {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .accion-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          min-width: 100px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .accion-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .aceptar {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
        }

        .aceptar:hover {
          background: linear-gradient(135deg, #229954, #27ae60);
        }

        .preparar {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
        }

        .preparar:hover {
          background: linear-gradient(135deg, #d68910, #d35400);
        }

        .listo {
          background: linear-gradient(135deg, #8e44ad, #9b59b6);
          color: white;
        }

        .listo:hover {
          background: linear-gradient(135deg, #7d3c98, #8e44ad);
        }

        @media (max-width: 480px) {
          .pedido-cocina-card {
            padding: 15px;
            min-height: auto;
          }
          
          .card-header {
            flex-direction: column;
            gap: 8px;
          }
          
          .estado-prioridad {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }
          
          .mesero-info {
            flex-direction: column;
            gap: 4px;
          }
          
          .acciones {
            flex-direction: column;
          }
          
          .accion-btn {
            min-width: auto;
          }

          .pedido-numero {
            font-size: 1rem;
          }

          .cliente-info {
            font-size: 0.9rem;
          }

          .tiempo-transcurrido {
            font-size: 0.8rem;
            padding: 5px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default PedidoCocinaCard;