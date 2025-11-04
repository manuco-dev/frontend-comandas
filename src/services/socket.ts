import { io, Socket } from 'socket.io-client';
import type { PedidoCocina } from './cocinaService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Eventos específicos de cocina
export interface CocinaSocketEvents {
  nuevoPedido: (pedido: PedidoCocina) => void;
  pedidoActualizado: (pedido: PedidoCocina) => void;
  pedidoCancelado: (pedidoId: string) => void;
  estadisticasActualizadas: (estadisticas: any) => void;
}

export function subscribeToKitchenEvents(callbacks: Partial<CocinaSocketEvents>) {
  const socketInstance = getSocket();
  
  if (callbacks.nuevoPedido) {
    socketInstance.on('nuevoPedido', callbacks.nuevoPedido);
  }
  
  if (callbacks.pedidoActualizado) {
    socketInstance.on('pedidoActualizado', callbacks.pedidoActualizado);
  }
  
  if (callbacks.pedidoCancelado) {
    socketInstance.on('pedidoCancelado', callbacks.pedidoCancelado);
  }
  
  if (callbacks.estadisticasActualizadas) {
    socketInstance.on('estadisticasActualizadas', callbacks.estadisticasActualizadas);
  }
}

export function unsubscribeFromKitchenEvents() {
  const socketInstance = getSocket();
  
  socketInstance.off('nuevoPedido');
  socketInstance.off('pedidoActualizado');
  socketInstance.off('pedidoCancelado');
  socketInstance.off('estadisticasActualizadas');
}

export function joinKitchenRoom() {
  const socketInstance = getSocket();
  socketInstance.emit('joinKitchen');
}

export function leaveKitchenRoom() {
  const socketInstance = getSocket();
  socketInstance.emit('leaveKitchen');
}