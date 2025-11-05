import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import type { PeriodoEstadistica, EstadisticasMeserosResponse } from '../types';
import { useApp } from '../context/appcontext';
import PageHeader from '../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EstadisticasMeserosPage() {
  const { meseroActual } = useApp();
  const [periodo, setPeriodo] = useState<PeriodoEstadistica>('day');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EstadisticasMeserosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedMeseroId, setSelectedMeseroId] = useState<string>('');

  type ItemsStats = {
    period: string;
    start: string;
    end: string;
    meseroId: string | null;
    totalPedidos: number;
    ventasTotal: number;
    unidadesTotal: number;
    items: Array<{ name: string; cantidad: number; ventas: number }>;
  };
  const [itemsData, setItemsData] = useState<ItemsStats | null>(null);

  const promedioGlobal = useMemo(() => {
    if (!data) return 0;
    return data.totalPedidos > 0 ? data.ventasTotal / data.totalPedidos : 0;
  }, [data]);

  const topMeseros = useMemo(() => {
    if (!data) return [] as EstadisticasMeserosResponse['meseros'];
    return [...data.meseros].sort((a, b) => b.ventas - a.ventas).slice(0, 3);
  }, [data]);

  async function fetchData(p: PeriodoEstadistica) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<EstadisticasMeserosResponse>(`${API_URL}/api/pedidos/estadisticas/meseros`, { params: { period: p } });
      setData(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(periodo);
  }, [periodo]);

  async function fetchItems() {
    try {
      const params: Record<string, string> = { period: periodo };
      if (periodo === 'day' && selectedDate) params.date = selectedDate;
      if (selectedMeseroId) params.meseroId = selectedMeseroId;
      const { data } = await axios.get<ItemsStats>(`${API_URL}/api/pedidos/estadisticas/meseros/items`, { params });
      setItemsData(data);
    } catch (err: any) {
      // Fallback cuando la API remota no tenga la ruta (404) o falle
      if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') {
        await fetchItemsFallbackFromOrders();
      } else {
        setItemsData(null);
      }
    }
  }

  function formatDateString(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getPeriodDateStrings() {
    if (periodo === 'day') {
      return selectedDate ? [selectedDate] : [formatDateString(new Date())];
    }
    if (periodo === 'week') {
      const now = new Date();
      const day = now.getDay(); // 0 domingo, 1 lunes, ...
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(formatDateString(d));
      }
      return days;
    }
    // month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = end.getDate();
    const days: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      days.push(formatDateString(d));
    }
    return days;
  }

  async function fetchItemsFallbackFromOrders() {
    try {
      const dates = getPeriodDateStrings();
      const requests = dates.map((fecha) => {
        const params: Record<string, string> = { fecha };
        if (selectedMeseroId) params.mesero = selectedMeseroId;
        return axios.get<any[]>(`${API_URL}/api/pedidos`, { params }).then(r => ({ fecha, pedidos: r.data }))
          .catch(() => ({ fecha, pedidos: [] as any[] }));
      });

      const results = await Promise.all(requests);
      const itemsMap = new Map<string, { name: string; cantidad: number; ventas: number }>();
      let ventasTotal = 0;
      let unidadesTotal = 0;
      let totalPedidos = 0;

      for (const { pedidos } of results) {
        const list = Array.isArray(pedidos) ? pedidos : [];
        totalPedidos += list.length;
        for (const p of list) {
          ventasTotal += Number(p?.total || 0);
          const items = Array.isArray(p?.items) ? p.items : [];
          for (const it of items) {
            const key = (it?.name ?? it?.nombre ?? 'Item') as string;
            const qty = Number(it?.quantity ?? 1);
            const price = Number(it?.price ?? 0);
            const prev = itemsMap.get(key) || { name: key, cantidad: 0, ventas: 0 };
            prev.cantidad += qty;
            prev.ventas += price * qty;
            itemsMap.set(key, prev);
            unidadesTotal += qty;
          }
        }
      }

      const items = Array.from(itemsMap.values()).sort((a, b) => b.ventas - a.ventas);

      let start: Date;
      let end: Date;
      if (periodo === 'day') {
        start = selectedDate ? new Date(selectedDate) : new Date();
        end = new Date(start);
        end.setDate(end.getDate() + 1);
      } else if (periodo === 'week') {
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      } else {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      setItemsData({
        period: periodo,
        start: start.toISOString(),
        end: end.toISOString(),
        meseroId: selectedMeseroId || null,
        totalPedidos,
        ventasTotal,
        unidadesTotal,
        items,
      });
    } catch (e) {
      setItemsData(null);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [periodo, selectedDate, selectedMeseroId]);

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);
  }

  function PeriodSelector() {
    return (
      <div className="segmented mb-4" role="tablist" aria-label="Seleccionar periodo">
        {([
          { key: 'day', label: 'Diaria', icon: '📅' },
          { key: 'week', label: 'Semanal', icon: '🗓️' },
          { key: 'month', label: 'Mensual', icon: '📆' },
        ] as { key: PeriodoEstadistica; label: string; icon: string }[]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriodo(opt.key)}
            className={`segmented-item ${periodo === opt.key ? 'active' : ''}`}
            aria-pressed={periodo === opt.key}
            role="tab"
            title={opt.label}
          >
            <span aria-hidden="true">{opt.icon}</span>
            <span className="label">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader
        title="📈 Ventas por mesero"
        subtitle="Estadísticas por periodo"
        right={meseroActual?.usuario === 'admin' ? (<span className="badge badge-info">Admin</span>) : undefined}
      />

      <PeriodSelector />

      {/* Filtros por día y mesero */}
      <div className="flex gap-3 mb-4 items-center">
        {periodo === 'day' && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>Fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg"
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <span>Mesero:</span>
          <select
            value={selectedMeseroId}
            onChange={(e) => setSelectedMeseroId(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-lg bg-white"
          >
            <option value="">Todos</option>
            {data?.meseros.map((m) => (
              <option key={m.meseroId} value={m.meseroId}>{m.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-gray-500">Cargando estadísticas…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* Resumen en formato dashboard */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Panel de ventas</div>
              <div className="card-subtitle">
                Periodo: {periodo === 'day' ? 'Hoy' : periodo === 'week' ? 'Semana actual' : 'Mes actual'}
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{data.totalPedidos}</div>
                <div className="stat-label">Pedidos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(data.ventasTotal)}</div>
                <div className="stat-label">Ventas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(promedioGlobal)}</div>
                <div className="stat-label">Ticket promedio</div>
              </div>
            </div>
          </div>

          {/* Top meseros por ventas */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Top meseros</div>
              <div className="card-subtitle">Por ventas</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topMeseros.map((m) => (
                <div key={m.meseroId} className="order-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{m.nombre}</div>
                    <span className="badge badge-success">{formatCurrency(m.ventas)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: '#6b7280' }}>
                    <span>Pedidos: {m.pedidos}</span>
                    <span>Promedio: {formatCurrency(m.promedio)}</span>
                  </div>
                </div>
              ))}
              {topMeseros.length === 0 && (
                <div className="order-card">
                  <div style={{ color: '#6b7280' }}>No hay datos para el periodo seleccionado.</div>
                </div>
              )}
            </div>
          </div>

          {/* Items vendidos por día y mesero (opcional) */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Items vendidos</div>
              <div className="card-subtitle">{periodo === 'day' && selectedDate ? `Fecha: ${selectedDate}` : (periodo === 'week' ? 'Semana actual' : 'Mes actual')}{selectedMeseroId ? ' · Filtrado por mesero' : ''}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsData?.items?.map((it) => (
                    <tr key={it.name}>
                      <td>{it.name}</td>
                      <td className="text-right">{it.cantidad}</td>
                      <td className="text-right font-medium">{formatCurrency(it.ventas)}</td>
                    </tr>
                  ))}
                  {(!itemsData || itemsData.items.length === 0) && (
                    <tr>
                      <td className="px-4 py-4 text-center text-gray-500" colSpan={3}>No hay items para el filtro seleccionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle por mesero en tabla */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Detalle por mesero</div>
              <div className="card-subtitle">Pedidos y ventas por periodo</div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-left">Mesero</th>
                    <th className="text-right">Pedidos</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.meseros.map((m) => (
                    <tr key={m.meseroId}>
                      <td>{m.nombre}</td>
                      <td className="text-right">{m.pedidos}</td>
                      <td className="text-right font-medium">{formatCurrency(m.ventas)}</td>
                      <td className="text-right">{formatCurrency(m.promedio)}</td>
                    </tr>
                  ))}
                  {data.meseros.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-center text-gray-500" colSpan={4}>No hay datos para el periodo seleccionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}