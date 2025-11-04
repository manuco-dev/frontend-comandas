const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import type { Mesero } from '../types';

export interface PedidoCocina {
  _id: string;
  identificationType: 'mesa' | 'nombre';
  mesa?: number;
  customerName?: string;
  customerLocation: string;
  observaciones: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  estado: 'pendiente' | 'aceptado' | 'preparando' | 'listo' | 'entregado';
  estadoCocina: 'nuevo' | 'aceptado' | 'en_preparacion' | 'listo_para_entrega';
  mesero: string | Mesero;
  timestamp: string;
  tiempoAceptado?: string;
  tiempoPreparacion?: string;
  tiempoListo?: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  notas_cocina: string;
  
  // Campos calculados
  tiempoTranscurrido: number;
  tiemposEtapas: {
    tiempoHastaAceptacion?: number;
    tiempoPreparacion?: number;
    tiempoFinalizacion?: number;
  };
  colorPrioridad: string;
  clienteInfo: string;
}

export interface EstadisticasCocina {
  pedidosDelDia: number;
  pedidosPorHora: number;
  pedidosNuevos: number;
  pedidosAceptados: number;
  pedidosEnPreparacion: number;
  pedidosListos: number;
  ingresosTotales: number;
  ingresoPromedioPorPedido: number;
  tasaCompletado: number;
  pedidosCompletados: number;
  tiempoPromedioAceptacion: number;
  tiempoPromedioPreparacion: number;
  tiempoPromedioTotal: number;
  pedidosPorPrioridad: {
    urgente: number;
    alta: number;
    normal: number;
    baja: number;
  };
}

class CocinaService {
  // Obtener todos los pedidos para cocina
  async obtenerPedidos(filtros?: {
    estado?: string;
    prioridad?: string;
    mesero?: string;
  }): Promise<PedidoCocina[]> {
    try {
      const params = new URLSearchParams();
      
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.prioridad) params.append('prioridad', filtros.prioridad);
      if (filtros?.mesero) params.append('mesero', filtros.mesero);
      
      const url = `${API_BASE_URL}/api/cocina/pedidos${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener pedidos de cocina:', error);
      throw error;
    }
  }

  // Obtener pedidos por estado específico
  async obtenerPedidosPorEstado(estado: string): Promise<PedidoCocina[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${estado}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error al obtener pedidos con estado ${estado}:`, error);
      throw error;
    }
  }

  // Aceptar un pedido
  async aceptarPedido(pedidoId: string): Promise<PedidoCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${pedidoId}/aceptar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al aceptar pedido:', error);
      throw error;
    }
  }

  // Cambiar pedido a preparación
  async iniciarPreparacion(pedidoId: string): Promise<PedidoCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${pedidoId}/preparar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al iniciar preparación:', error);
      throw error;
    }
  }

  // Marcar pedido como listo
  async marcarComoListo(pedidoId: string): Promise<PedidoCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${pedidoId}/listo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al marcar pedido como listo:', error);
      throw error;
    }
  }

  // Cambiar prioridad de un pedido
  async cambiarPrioridad(pedidoId: string, prioridad: 'baja' | 'normal' | 'alta' | 'urgente'): Promise<PedidoCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${pedidoId}/prioridad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prioridad }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar prioridad:', error);
      throw error;
    }
  }

  // Añadir notas de cocina
  async añadirNotas(pedidoId: string, notas: string): Promise<PedidoCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${pedidoId}/notas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notas_cocina: notas }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al añadir notas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de cocina
  async obtenerEstadisticas(): Promise<EstadisticasCocina> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cocina/estadisticas`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Obtener pedidos nuevos (para notificaciones)
  async obtenerPedidosNuevos(): Promise<PedidoCocina[]> {
    return this.obtenerPedidosPorEstado('nuevo');
  }

  // Obtener pedidos en preparación
  async obtenerPedidosEnPreparacion(): Promise<PedidoCocina[]> {
    return this.obtenerPedidosPorEstado('en_preparacion');
  }

  // Obtener pedidos listos para entrega
  async obtenerPedidosListos(): Promise<PedidoCocina[]> {
    return this.obtenerPedidosPorEstado('listo_para_entrega');
  }
}

export const cocinaService = new CocinaService();
export default cocinaService;

// Tipos ya están exportados como interfaces arriba