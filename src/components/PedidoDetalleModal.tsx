import React from 'react';
import type { PedidoCocina } from '../services/cocinaService';

interface PedidoDetalleModalProps {
  pedido: PedidoCocina;
  onClose: () => void;
}

const PedidoDetalleModal: React.FC<PedidoDetalleModalProps> = ({ pedido, onClose }) => {
  const formatearMoneda = (valor: number) => `$${valor.toFixed(2)}`;

  const formatEstado = (estado: string) => {
    switch (estado) {
      case 'nuevo': return 'Nuevo';
      case 'aceptado': return 'Aceptado';
      case 'en_preparacion': return 'En preparación';
      case 'listo_para_entrega': return 'Listo para entrega';
      default: return estado;
    }
  };

  const obtenerCliente = (): string => {
    if (pedido.customerName && pedido.customerName.trim().length > 0) {
      return pedido.customerName;
    }
    if (pedido.clienteInfo && pedido.clienteInfo.trim().length > 0) {
      return pedido.clienteInfo;
    }
    if (pedido.identificationType === 'mesa' && typeof pedido.mesa === 'number') {
      return `Mesa ${pedido.mesa}`;
    }
    return 'Cliente desconocido';
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles del Pedido #{pedido._id.slice(-6).toUpperCase()}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body">
          <div className="pedido-meta">
            <div><strong>Cliente:</strong> {obtenerCliente()}</div>
            <div><strong>Estado:</strong> {formatEstado(pedido.estadoCocina)}</div>
            <div><strong>Prioridad:</strong> {pedido.prioridad}</div>
            <div><strong>Mesero:</strong> {typeof pedido.mesero === 'object' && pedido.mesero !== null
              ? pedido.mesero.nombre
              : (typeof pedido.mesero === 'string' && pedido.mesero.trim().length > 0
                ? pedido.mesero
                : 'No asignado')}</div>
            {pedido.customerLocation && (
              <div><strong>Ubicación:</strong> {pedido.customerLocation}</div>
            )}
            <div>
              <strong>Tomado:</strong> {new Date(pedido.timestamp).toLocaleDateString()} {new Date(pedido.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="items">
            <h3>Items</h3>
            {pedido.items.map((item, idx) => (
              <div key={idx} className="item-row">
                <span className="qty">{item.quantity}x</span>
                <span className="name">{item.name}</span>
                <span className="price">{formatearMoneda(item.price)}</span>
              </div>
            ))}
            <div className="total"><strong>Total:</strong> {formatearMoneda(pedido.total)}</div>
          </div>

          {pedido.observaciones && (
            <div className="observaciones">
              <h3>Observaciones del cliente</h3>
              <p>{pedido.observaciones}</p>
            </div>
          )}

          {pedido.notas_cocina && (
            <div className="notas">
              <h3>Notas de cocina</h3>
              <p>{pedido.notas_cocina}</p>
            </div>
          )}

          {pedido.tiemposEtapas && (
            <div className="tiempos">
              <h3>Tiempos</h3>
              {pedido.tiemposEtapas.tiempoHastaAceptacion !== undefined && (
                <div>Aceptación: {pedido.tiemposEtapas.tiempoHastaAceptacion} min</div>
              )}
              {pedido.tiemposEtapas.tiempoPreparacion !== undefined && (
                <div>Preparación: {pedido.tiemposEtapas.tiempoPreparacion} min</div>
              )}
              {pedido.tiemposEtapas.tiempoFinalizacion !== undefined && (
                <div>Finalización: {pedido.tiemposEtapas.tiempoFinalizacion} min</div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="primary" onClick={onClose}>Cerrar</button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
          }
          .modal-content {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 680px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
          }
          .modal-header h2 {
            margin: 0;
            font-size: 1.2rem;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
          }
          .modal-body {
            padding: 16px 20px;
          }
          .pedido-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 16px;
            margin-bottom: 12px;
          }
          .items h3, .observaciones h3, .notas h3, .tiempos h3 {
            margin: 12px 0 8px;
            font-size: 1rem;
          }
          .item-row {
            display: grid;
            grid-template-columns: 40px 1fr 80px;
            gap: 8px;
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .item-row:last-child { border-bottom: none; }
          .qty { font-weight: 700; color: #2196F3; }
          .name { font-weight: 500; }
          .price { text-align: right; font-weight: 700; color: #27ae60; }
          .total { text-align: right; margin-top: 8px; }
          .modal-actions {
            padding: 12px 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
          }
          .primary {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          @media (max-width: 520px) {
            .pedido-meta { grid-template-columns: 1fr; }
            .modal-content { max-width: 95vw; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PedidoDetalleModal;