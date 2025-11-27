import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import type { PeriodoEstadistica, EstadisticasMeserosResponse } from '../types';
import { useApp } from '../context/appcontext';
import PageHeader from '../components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EstadisticasMeserosPage() {
  const { meseroActual } = useApp();
  const [period, setPeriod] = useState<PeriodoEstadistica>('day');
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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`; // YYYY-MM
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
    itemsDetalles?: Array<{ name: string; cantidad: number; ventas: number; cliente: string; ubicacion: string; pagado: boolean; mesero: string }>;
  };
  const [itemsData, setItemsData] = useState<ItemsStats | null>(null);
  type MonthDebugStats = {
    start: string;
    end: string;
    totalPedidos: number;
    ventasTotal: number;
    totalItemsUnidades: number;
  } | null;
  const [monthDebug, setMonthDebug] = useState<MonthDebugStats>(null);

  const promedioGlobal = useMemo(() => {
    if (!data) return 0;
    return data.totalPedidos > 0 ? data.ventasTotal / data.totalPedidos : 0;
  }, [data]);

  // Se removió la distribución porcentual por mesero

  async function fetchData(p: PeriodoEstadistica) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { period: p };
      if (p === 'day' && selectedDate) params.date = selectedDate;
      if (p === 'month' && selectedMonth) params.date = selectedMonth; // backend acepta YYYY-MM para mes
      const { data } = await axios.get<EstadisticasMeserosResponse>(`${API_URL}/api/pedidos/estadisticas/meseros`, { params });
      setData(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonthDebugCounts() {
    try {
      if (period !== 'month' || !selectedMonth) {
        setMonthDebug(null);
        return;
      }
      const { data } = await axios.get(`${API_URL}/api/pedidos/debug/mes`, { params: { date: selectedMonth } });
      setMonthDebug({
        start: new Date(data.start).toISOString(),
        end: new Date(data.end).toISOString(),
        totalPedidos: Number(data.totalPedidos || 0),
        ventasTotal: Number(data.ventasTotal || 0),
        totalItemsUnidades: Number(data.totalItemsUnidades || 0),
      });
    } catch (e) {
      setMonthDebug(null);
    }
  }

  useEffect(() => {
    fetchData(period);
  }, [period]);

  async function fetchItems() {
    try {
      const params: Record<string, string> = { period };
      if (period === 'day' && selectedDate) params.date = selectedDate;
      if (period === 'month' && selectedMonth) params.date = `${selectedMonth}-01`; // items endpoint usa date para día; fallback cubre mes
      if (selectedMeseroId) params.meseroId = selectedMeseroId;
      const { data } = await axios.get<ItemsStats>(`${API_URL}/api/pedidos/estadisticas/meseros/items`, { params });

      // Complementar con detalle por pedido para incluir cliente/ubicación/pago
      const detailParams: Record<string, string> = {};
      if (period === 'day' && selectedDate) detailParams.fecha = selectedDate;
      if (selectedMeseroId) detailParams.mesero = selectedMeseroId;
      let itemsDetalles: ItemsStats['itemsDetalles'] = [];
      try {
        const pedidosResp = await axios.get<any[]>(`${API_URL}/api/pedidos`, { params: detailParams });
        const pedidos = Array.isArray(pedidosResp.data) ? pedidosResp.data : [];
        for (const p of pedidos) {
          const items = Array.isArray(p?.items) ? p.items : [];
          for (const it of items) {
            const qty = Number(it?.quantity ?? 1);
            const price = Number(it?.price ?? 0);
            itemsDetalles.push({
              name: (it?.name ?? it?.nombre ?? 'Item') as string,
              cantidad: qty,
              ventas: price * qty,
              cliente: p?.identificationType === 'mesa' ? `Mesa ${p?.mesa}` : (p?.customerName || 'Sin nombre'),
              ubicacion: p?.customerLocation || 'Sin ubicación',
              pagado: !!p?.pagado,
              mesero: (typeof p?.mesero === 'object' && p?.mesero?.nombre) ? p.mesero.nombre : (p?.meseroNombre || 'Sin mesero'),
            });
          }
        }
      } catch (e) {
        // Si falla, mantenemos solo el agregado
      }
      setItemsData({ ...data, itemsDetalles });
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
    if (period === 'day') {
      return selectedDate ? [selectedDate] : [formatDateString(new Date())];
    }
    if (period === 'week') {
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
      const itemsDetalles: ItemsStats['itemsDetalles'] = [];

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

            // Construir detalle por pedido
            itemsDetalles.push({
              name: key,
              cantidad: qty,
              ventas: price * qty,
              cliente: p?.identificationType === 'mesa' ? `Mesa ${p?.mesa}` : (p?.customerName || 'Sin nombre'),
              ubicacion: p?.customerLocation || 'Sin ubicación',
              pagado: !!p?.pagado,
              mesero: (typeof p?.mesero === 'object' && p?.mesero?.nombre) ? p.mesero.nombre : (p?.meseroNombre || 'Sin mesero'),
            });
          }
        }
      }

      const items = Array.from(itemsMap.values()).sort((a, b) => b.ventas - a.ventas);

      let start: Date;
      let end: Date;
      if (period === 'day') {
        start = selectedDate ? new Date(selectedDate) : new Date();
        end = new Date(start);
        end.setDate(end.getDate() + 1);
      } else if (period === 'week') {
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
        period,
        start: start.toISOString(),
        end: end.toISOString(),
        meseroId: selectedMeseroId || null,
        totalPedidos,
        ventasTotal,
        unidadesTotal,
        items,
        itemsDetalles,
      });
    } catch (e) {
      setItemsData(null);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [period, selectedDate, selectedMeseroId]);

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
            onClick={() => setPeriod(opt.key)}
            className={`segmented-item ${period === opt.key ? 'active' : ''}`}
            aria-pressed={period === opt.key}
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

  function periodLabel(p: PeriodoEstadistica): string {
    if (p === 'day') return 'día';
    if (p === 'week') return 'semana';
    return 'mes';
  }

  function formatIsoDateShort(iso: string): string {
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return iso;
    }
  }

  // Genera fechas diarias YYYY-MM-DD entre [start, end) usando horario local
  function getDateStringsBetween(startIso: string, endIso: string): string[] {
    const start = new Date(startIso);
    const end = new Date(endIso);
    // Normalizar a 00:00 local
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const days: string[] = [];
    const cur = new Date(start);
    while (cur < end) {
      const y = cur.getFullYear();
      const m = `${cur.getMonth() + 1}`.padStart(2, '0');
      const d = `${cur.getDate()}`.padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  async function exportVentasMeserosCSV() {
    if (!data) return;
    const headers = ['Periodo', 'Inicio', 'Fin', 'Mesero', 'Usuario', 'Pedidos', 'Ventas', 'Promedio'];
    const startStr = formatIsoDateShort(data.start);
    const endStr = formatIsoDateShort(data.end);
    const periodStr = periodLabel(data.period);

    let rows: string[][] = [];

    // Fallback robusto para mensual: consolidar todo el mes desde /api/pedidos por día
    if (data.period === 'month') {
      try {
        // Usar el rango exacto del backend (data.start, data.end)
        const fechas = getDateStringsBetween(data.start, data.end);
        const porMesero = new Map<string, { nombre: string; usuario: string; pedidos: number; ventas: number }>();
        for (const fecha of fechas) {
          const params: Record<string, string> = { fecha };
          if (selectedMeseroId) params.mesero = selectedMeseroId;
          const resp = await axios.get<any[]>(`${API_URL}/api/pedidos`, { params });
          const pedidosDia = Array.isArray(resp.data) ? resp.data : [];
          for (const p of pedidosDia) {
            const key = (typeof p?.mesero === 'object' && p?.mesero?._id) ? String(p.mesero._id) : String(p?.mesero || 'sin_mesero');
            const nombre = (typeof p?.mesero === 'object' && p?.mesero?.nombre) ? p.mesero.nombre : (p?.meseroNombre || 'Sin mesero');
            const usuario = (typeof p?.mesero === 'object' && p?.mesero?.usuario) ? p.mesero.usuario : (p?.meseroUsuario || '');
            const prev = porMesero.get(key) || { nombre, usuario, pedidos: 0, ventas: 0 };
            prev.pedidos += 1;
            prev.ventas += Number(p?.total || 0);
            porMesero.set(key, prev);
          }
        }
        rows = Array.from(porMesero.entries())
          .map(([_, e]) => [
            periodStr,
            startStr,
            endStr,
            e.nombre,
            e.usuario,
            String(e.pedidos),
            String(e.ventas),
            String(e.pedidos > 0 ? (e.ventas / e.pedidos) : 0),
          ]);
      } catch (e) {
        // Si el fallback falla, usar los datos agregados disponibles
        rows = data.meseros
          .filter(m => !selectedMeseroId || m.meseroId === selectedMeseroId)
          .map(m => [
            periodStr,
            startStr,
            endStr,
            m.nombre,
            m.usuario,
            String(m.pedidos ?? 0),
            String(m.ventas ?? 0),
            String(m.promedio ?? 0),
          ]);
      }
    } else {
      // day|week: usar datos agregados del endpoint
      rows = data.meseros
        .filter(m => !selectedMeseroId || m.meseroId === selectedMeseroId)
        .map(m => [
          periodStr,
          startStr,
          endStr,
          m.nombre,
          m.usuario,
          String(m.pedidos ?? 0),
          String(m.ventas ?? 0),
          String(m.promedio ?? 0),
        ]);
    }

    const csv = [headers, ...rows]
      .map(r => r.map(field => {
        const v = String(field ?? '');
        // Escapar comas y comillas
        if (v.includes(',') || v.includes('"') || v.includes('\n')) {
          return '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    let filename = `ventas_meseros_${data.period}`;
    if (data.period === 'day') {
      const day = data.period === 'day' && selectedDate ? selectedDate : startStr;
      filename += `_${day}`;
    } else if (data.period === 'week') {
      filename += `_${startStr}_a_${endStr}`;
    } else {
      const month = startStr.slice(0, 7);
      filename += `_${month}`;
    }
    filename += '.csv';

    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <PageHeader
        title="📈 Ventas por mesero"
        subtitle="Estadísticas por periodo"
        right={meseroActual?.usuario === 'admin' ? (<span className="badge badge-info">Admin</span>) : undefined}
      />

      <PeriodSelector />

      {/* Filtros por fecha/mes y mesero */}
      <div className="flex gap-3 mb-4 items-center">
        {period === 'day' && (
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
        {period === 'month' && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>Mes:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
                Periodo: {data.period === 'day' ? 'Hoy' : data.period === 'week' ? 'Semana actual' : 'Mes actual'}
                {data.period === 'month' && monthDebug ? ` · Debug: pedidos=${monthDebug.totalPedidos} · items=${monthDebug.totalItemsUnidades}` : ''}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={exportVentasMeserosCSV}
                  aria-label="Descargar CSV de ventas por mesero"
                  disabled={loading || !data || (data?.meseros?.length ?? 0) === 0}
                  title={loading ? 'Cargando datos…' : ((data?.meseros?.length ?? 0) === 0 ? 'No hay datos para exportar' : 'Descargar CSV de ventas por mesero')}
                >
                  Descargar CSV
                </button>
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

          {/* Sección Top meseros removida por solicitud */}

          {/* Items vendidos por día y mesero (detalle por pedido) */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Items vendidos</div>
              <div className="card-subtitle">{period === 'day' && selectedDate ? `Fecha: ${selectedDate}` : (period === 'week' ? 'Semana actual' : 'Mes actual')}{selectedMeseroId ? ' · Filtrado por mesero' : ''}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="table table--wide">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-left">Mesero</th>
                    <th className="text-left">Cliente</th>
                    <th className="text-left hide-xs">Ubicación</th>
                    <th className="text-left">Pago</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {(itemsData?.itemsDetalles && itemsData.itemsDetalles.length > 0) ? itemsData.itemsDetalles.map((row, idx) => (
                    <tr key={`${row.name}-${idx}`}>
                      <td>{row.name}</td>
                      <td>{row.mesero}</td>
                      <td>{row.cliente}</td>
                      <td className="hide-xs">{row.ubicacion}</td>
                      <td className={row.pagado ? 'text-green-700' : 'text-red-700'}>{row.pagado ? 'Pagado' : 'No pagado'}</td>
                      <td className="text-right">{row.cantidad}</td>
                      <td className="text-right font-medium">{formatCurrency(row.ventas)}</td>
                    </tr>
                  )) : itemsData?.items?.map((it) => (
                    <tr key={it.name}>
                      <td>{it.name}</td>
                      <td colSpan={4}></td>
                      <td className="text-right">{it.cantidad}</td>
                      <td className="text-right font-medium">{formatCurrency(it.ventas)}</td>
                    </tr>
                  ))}
                  {(!itemsData || ((itemsData.itemsDetalles && itemsData.itemsDetalles.length === 0) && itemsData.items.length === 0)) && (
                    <tr>
                      <td className="px-4 py-4 text-center text-gray-500" colSpan={7}>No hay items para el filtro seleccionado.</td>
                    </tr>
                  )}
                </tbody>
                {itemsData && (itemsData.itemsDetalles?.length || itemsData.items.length) ? (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-right font-semibold">Totales</td>
                      <td className="text-right font-semibold">{itemsData.unidadesTotal}</td>
                      <td className="text-right font-semibold">{formatCurrency(itemsData.ventasTotal)}</td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>

          {/* Se removió la tabla detallada por mesero por redundancia */}

          {/* Se removió la distribución de ventas por mesero por redundancia con tablas */}
        </>
      )}
    </div>
  );
}
  useEffect(() => {
    fetchMonthDebugCounts();
  }, [period, selectedMonth]);