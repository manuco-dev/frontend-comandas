// Tipos básicos para el sistema de comandas

export interface PedidoItem {
  name: string;
  price: number;
  quantity: number;
}

export type EstadoPedido = 'pendiente' | 'aceptado' | 'preparando' | 'listo' | 'entregado';

export type EstadoCocina = 'nuevo' | 'aceptado' | 'en_preparacion' | 'listo_para_entrega';

export interface MenuItem {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  proteina?: 'Carnes' | 'Aves' | 'Cerdo' | 'Pescado';
  tipoPlato?: string;
  acompanamientos?: string[];
  bebida?: string;
  disponible: boolean;
  imagen?: string;
  ingredientes?: string[];
  alergenos?: string[];
  tiempoPreparacion?: number;
}

export interface Pedido {
  _id: string;
  identificationType: 'mesa' | 'nombre';
  mesa?: number;
  customerName?: string;
  customerLocation: string;
  observaciones: string;
  items: PedidoItem[];
  total: number;
  estado: EstadoPedido;
  estadoCocina?: EstadoCocina;
  mesero: string | Mesero;
  timestamp: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
  notas_cocina?: string;
}

export interface PedidoCocina extends Omit<Pedido, 'mesero'> {
  mesero: Mesero;
  estadoCocina: 'nuevo' | 'aceptado' | 'en_preparacion' | 'listo_para_entrega';
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  tiempoTranscurrido: number;
  tiemposEtapas: Record<string, number>;
  colorPrioridad: string;
  clienteInfo: string;
  notas_cocina?: string;
}

export interface Mesero {
  _id: string;
  nombre: string;
  identificacion: string;
  usuario: string;
  activo: boolean;
  esAdmin?: boolean;
  turno?: 'mañana' | 'tarde' | 'noche' | 'completo';
  telefono?: string;
  email?: string;
  salario?: number;
}

export interface Estadisticas {
  pedidosHoy: number;
  ventasHoy: number;
  meserosActivos: number;
}

export type PeriodoEstadistica = 'day' | 'week' | 'month';

export interface EstadisticasMeserosResponse {
  period: PeriodoEstadistica;
  start: string;
  end: string;
  totalPedidos: number;
  ventasTotal: number;
  meseros: Array<{
    meseroId: string;
    nombre: string;
    usuario: string;
    pedidos: number;
    ventas: number;
    promedio: number;
  }>;
}