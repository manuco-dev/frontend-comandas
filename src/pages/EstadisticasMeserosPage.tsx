import React, { useEffect, useState } from 'react';
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

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);
  }

  function PeriodSelector() {
    return (
      <div className="flex gap-2 mb-4">
        {([
          { key: 'day', label: 'Diaria' },
          { key: 'week', label: 'Semanal' },
          { key: 'month', label: 'Mensual' },
        ] as { key: PeriodoEstadistica; label: string }[]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriodo(opt.key)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              periodo === opt.key ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <PageHeader
        title="📈 Ventas por mesero"
        subtitle="Estadísticas por periodo"
        right={meseroActual?.esAdmin ? (<span className="badge badge-info">Admin</span>) : undefined}
      />

      <PeriodSelector />

      {loading && <p className="text-gray-500">Cargando estadísticas…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            <span className="mr-4">Periodo: {periodo === 'day' ? 'Hoy' : periodo === 'week' ? 'Semana actual' : 'Mes actual'}</span>
            <span className="mr-4">Pedidos: <strong>{data.totalPedidos}</strong></span>
            <span>Ventas: <strong>{formatCurrency(data.ventasTotal)}</strong></span>
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
        </>
      )}
    </div>
  );
}