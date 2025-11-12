import React, { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import axios from 'axios';
import { getSocket } from '../services/socket';
import type { Pedido, MenuItem, Mesero, EstadoPedido, Estadisticas } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Asegurar baseURL global para todas las llamadas axios (incluido AdminPanel)
axios.defaults.baseURL = API_URL;

type SessionInfo = {
  expiresAt: string;
  expiresIn: number;
  duration: string;
};

type AppState = {
  pedidos: Pedido[];
  menu: MenuItem[];
  meseros: Mesero[];
  meseroActual?: Mesero;
  token?: string;
  sessionInfo?: SessionInfo;
  notificaciones: string[];
};

type AppAction =
  | { type: 'SET_PEDIDOS'; payload: Pedido[] }
  | { type: 'ADD_NOTIFICACION'; payload: string }
  | { type: 'SET_MENU'; payload: MenuItem[] }
  | { type: 'SET_MESEROS'; payload: Mesero[] }
  | { type: 'SET_MESERO_ACTUAL'; payload?: Mesero }
  | { type: 'SET_TOKEN'; payload?: string }
  | { type: 'SET_SESSION_INFO'; payload?: SessionInfo };

const initialState: AppState = {
  pedidos: [],
  menu: [],
  meseros: [],
  meseroActual: localStorage.getItem('meseroActual') ? JSON.parse(localStorage.getItem('meseroActual')!) : undefined,
  token: localStorage.getItem('token') || undefined,
  sessionInfo: localStorage.getItem('sessionInfo') ? JSON.parse(localStorage.getItem('sessionInfo')!) : undefined,
  notificaciones: [],
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PEDIDOS':
      return { ...state, pedidos: action.payload };
    case 'ADD_NOTIFICACION':
      return { ...state, notificaciones: [action.payload, ...state.notificaciones].slice(0, 5) };
    case 'SET_MENU':
      return { ...state, menu: action.payload };
    case 'SET_MESEROS':
      return { ...state, meseros: action.payload };
    case 'SET_MESERO_ACTUAL':
      if (action.payload) {
        localStorage.setItem('meseroActual', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('meseroActual');
      }
      return { ...state, meseroActual: action.payload };
    case 'SET_TOKEN':
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('sessionInfo');
        localStorage.removeItem('meseroActual');
      }
      return { ...state, token: action.payload };
    case 'SET_SESSION_INFO':
      if (action.payload) {
        localStorage.setItem('sessionInfo', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('sessionInfo');
      }
      return { ...state, sessionInfo: action.payload };
    default:
      return state;
  }
}

type AppContextType = AppState & {
  fetchInicial: () => Promise<void>;
  fetchMenu: () => Promise<void>;
  crearPedido: (pedido: Omit<Pedido, '_id' | 'timestamp' | 'estado'>) => Promise<void>;
  cambiarEstadoPedido: (pedidoId: string, nuevoEstado: EstadoPedido) => Promise<void>;
  eliminarPedido: (pedidoId: string) => Promise<void>;
  loginMesero: (usuario: string, password: string) => Promise<boolean>;
  logout: () => void;
  getEstadisticas: () => Estadisticas;
  checkSessionExpiry: () => boolean;
  getRemainingTime: () => number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Función para verificar si la sesión ha expirado
  const checkSessionExpiry = useCallback((): boolean => {
    if (!state.sessionInfo) return false;
    const now = new Date();
    const expiresAt = new Date(state.sessionInfo.expiresAt);
    return now >= expiresAt;
  }, [state.sessionInfo]);

  // Función para obtener el tiempo restante de la sesión en milisegundos
  const getRemainingTime = useCallback((): number => {
    if (!state.sessionInfo) return 0;
    const now = new Date();
    const expiresAt = new Date(state.sessionInfo.expiresAt);
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }, [state.sessionInfo]);

  // Función de logout
  const logout = useCallback(() => {
    dispatch({ type: 'SET_MESERO_ACTUAL', payload: undefined });
    dispatch({ type: 'SET_TOKEN', payload: undefined });
    dispatch({ type: 'SET_SESSION_INFO', payload: undefined });
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'ADD_NOTIFICACION', payload: 'Sesión cerrada' });
  }, []);

  // Efecto para verificar la expiración de la sesión
  useEffect(() => {
    if (!state.token || !state.sessionInfo) return;

    const checkInterval = setInterval(() => {
      if (checkSessionExpiry()) {
        dispatch({ type: 'ADD_NOTIFICACION', payload: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' });
        logout();
      }
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(checkInterval);
  }, [state.token, state.sessionInfo, checkSessionExpiry, logout]);

  // Efecto para verificar la sesión al inicializar la aplicación
  useEffect(() => {
    // Si hay token y sessionInfo pero la sesión ha expirado, hacer logout
    if (state.token && state.sessionInfo && checkSessionExpiry()) {
      dispatch({ type: 'ADD_NOTIFICACION', payload: 'Tu sesión anterior ha expirado. Por favor, inicia sesión nuevamente.' });
      logout();
    }
  }, []); // Solo ejecutar una vez al montar el componente

  useEffect(() => {
    // Configurar token si existe
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    }

    // Interceptor para manejar respuestas de token expirado
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
          dispatch({ type: 'ADD_NOTIFICACION', payload: error.response.data.message || 'Tu sesión ha expirado' });
          logout();
        }
        return Promise.reject(error);
      }
    );
    
    const socket = getSocket();
    socket.on('pedidos-actualizados', async () => {
      await fetchPedidos();
    });
    socket.on('nuevo-pedido-notificacion', (pedido: Pedido) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: `Nuevo pedido #${pedido._id}` });
      // sonido
      try { new Audio('/notify.mp3').play(); } catch {}
    });
    socket.on('estado-pedido-cambiado', ({ pedidoId, nuevoEstado }: { pedidoId: string; nuevoEstado: EstadoPedido }) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: `Pedido ${pedidoId} → ${nuevoEstado}` });
    });
    fetchInicial();
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
      socket.off('pedidos-actualizados');
      socket.off('nuevo-pedido-notificacion');
      socket.off('estado-pedido-cambiado');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout]);

  async function fetchPedidos() {
    const { data } = await axios.get<Pedido[]>(`${API_URL}/api/pedidos`);
    dispatch({ type: 'SET_PEDIDOS', payload: data });
  }

  async function fetchMenu() {
    const { data } = await axios.get<MenuItem[]>(`${API_URL}/api/menu`);
    dispatch({ type: 'SET_MENU', payload: data });
  }

  async function fetchMeseros() {
    const { data } = await axios.get<Mesero[]>(`${API_URL}/api/meseros/activos`);
    dispatch({ type: 'SET_MESEROS', payload: data });
  }

  async function fetchInicial() {
    await Promise.all([fetchPedidos(), fetchMenu(), fetchMeseros()]);
  }

  async function crearPedido(pedidoParcial: Omit<Pedido, '_id' | 'timestamp' | 'estado'>) {
    const pedidoCompleto = {
      ...pedidoParcial,
      mesero: state.meseroActual?._id || pedidoParcial.mesero
    };
    
    const socket = getSocket();
    socket.emit('nuevo-pedido', pedidoCompleto);
  }

  async function cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido) {
    const socket = getSocket();
    socket.emit('cambiar-estado-pedido', { pedidoId, nuevoEstado });
  }

  async function eliminarPedido(pedidoId: string) {
    const socket = getSocket();
    socket.emit('eliminar-pedido', pedidoId);
  }

  async function loginMesero(usuario: string, password: string) {
    try {
      const { data } = await axios.post(`${API_URL}/api/meseros/login`, { usuario, password });
      
      dispatch({ type: 'SET_TOKEN', payload: data.token });
      dispatch({ type: 'SET_MESERO_ACTUAL', payload: data.mesero });
      
      // Guardar información de sesión si está disponible
      if (data.session) {
        dispatch({ type: 'SET_SESSION_INFO', payload: data.session });
      }
      
      // Configurar axios para usar el token en futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      dispatch({ type: 'ADD_NOTIFICACION', payload: `Bienvenido ${data.mesero.nombre}! Sesión válida por ${data.session?.duration || '2 horas'}` });
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  function getEstadisticas(): Estadisticas {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const pedidosHoy = state.pedidos.filter(p => new Date(p.timestamp) >= inicio);
    const ventasHoy = pedidosHoy.reduce((sum, p) => sum + (p.total || 0), 0);
    const meserosActivos = state.meseros.filter(m => m.activo).length;
    return { pedidosHoy: pedidosHoy.length, ventasHoy, meserosActivos };
  }

  const value = useMemo<AppContextType>(() => ({
    ...state,
    fetchInicial,
    fetchMenu,
    crearPedido,
    cambiarEstadoPedido,
    eliminarPedido,
    loginMesero,
    logout,
    getEstadisticas,
    checkSessionExpiry,
    getRemainingTime,
  }), [state, logout, checkSessionExpiry, getRemainingTime]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}