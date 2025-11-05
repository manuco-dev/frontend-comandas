import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/appcontext';
import PageHeader from '../components/PageHeader';
import { getAuditLogs, type AuditLog } from '../services/auditService';

type RolFiltro = 'todos' | 'admin' | 'mesero';

export default function AuditoriaPage() {
  const { token } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rol, setRol] = useState<RolFiltro>('todos');
  const [accion, setAccion] = useState<string>('');
  const [limit, setLimit] = useState<number>(100);
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (rol !== 'todos') params.rol = rol;
      if (accion.trim()) params.accion = accion.trim();
      if (limit) params.limit = limit;
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      const data = await getAuditLogs({ ...params, token });
      setLogs(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error cargando auditoría');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => logs.map(l => ({
    id: l._id,
    fecha: new Date(l.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
    actor: l.actorNombre ? `${l.actorNombre} (${l.actorUsuario || ''})` : (l.actorUsuario || '—'),
    rol: l.actorEsAdmin ? 'Admin' : 'Mesero',
    accion: l.action,
    descripcion: l.description || '',
    objetivo: l.targetModel && l.targetId ? `${l.targetModel}#${l.targetId}` : (l.targetModel || '—'),
    metadata: l.metadata ? Object.keys(l.metadata).join(', ') : ''
  })), [logs]);

  return (
    <div className="container">
      <PageHeader title="📝 Auditoría" subtitle="Registro de acciones de usuarios" right={
        <button className="btn btn-primary" onClick={fetchLogs} disabled={loading}>
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      } />

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">Filtros</h3>
          <p className="card-subtitle">Refina la búsqueda de eventos</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div>
            <label className="form-label">Rol</label>
            <select className="form-input" value={rol} onChange={e => setRol(e.target.value as RolFiltro)}>
              <option value="todos">Todos</option>
              <option value="admin">Admin</option>
              <option value="mesero">Mesero</option>
            </select>
          </div>
          <div>
            <label className="form-label">Acción</label>
            <input className="form-input" value={accion} onChange={e => setAccion(e.target.value)} placeholder="p.ej. usuario_creado" />
          </div>
          <div>
            <label className="form-label">Límite</label>
            <input type="number" min={1} max={500} className="form-input" value={limit} onChange={e => setLimit(Number(e.target.value) || 100)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Desde</label>
              <input type="datetime-local" className="form-input" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Hasta</label>
              <input type="datetime-local" className="form-input" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Eventos</h3>
          <p className="card-subtitle">Últimas actividades registradas</p>
        </div>
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Objetivo</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td>{r.actor}</td>
                  <td>{r.rol}</td>
                  <td>{r.accion}</td>
                  <td>{r.descripcion}</td>
                  <td>{r.objetivo}</td>
                  <td>{r.metadata}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}