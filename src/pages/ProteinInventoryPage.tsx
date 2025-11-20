import { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

type ProteinStock = {
  _id: string;
  nombre: string;
  stock: number;
  puntoReorden: number;
  activo: boolean;
};

export default function ProteinInventoryPage() {
  const [proteinas, setProteinas] = useState<ProteinStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<{ nombre: string; stock: number; puntoReorden: number; activo: boolean }>({
    nombre: '',
    stock: 0,
    puntoReorden: 0,
    activo: true,
  });

  useEffect(() => {
    fetchProteinas();
  }, []);

  async function fetchProteinas() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ProteinStock[]>('/api/inventario/proteinas');
      setProteinas(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error cargando inventario');
    } finally {
      setLoading(false);
    }
  }

  async function crearProteina() {
    if (!form.nombre.trim()) return;
    try {
      const payload = {
        nombre: form.nombre.trim(),
        stock: Math.max(0, Number(form.stock) || 0),
        puntoReorden: Math.max(0, Number(form.puntoReorden) || 0),
        activo: !!form.activo,
      };
      const res = await axios.post<ProteinStock>('/api/inventario/proteinas', payload);
      setProteinas(prev => [res.data, ...prev]);
      setForm({ nombre: '', stock: 0, puntoReorden: 0, activo: true });
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error creando proteína');
    }
  }

  async function actualizarProteina(id: string, update: Partial<ProteinStock>) {
    try {
      const res = await axios.put<ProteinStock>(`/api/inventario/proteinas/${id}`, update);
      setProteinas(prev => prev.map(p => (p._id === id ? res.data : p)));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error actualizando proteína');
    }
  }

  async function ajustarStock(id: string, delta: number) {
    try {
      const res = await axios.post<ProteinStock>(`/api/inventario/proteinas/${id}/ajuste`, { delta });
      setProteinas(prev => prev.map(p => (p._id === id ? res.data : p)));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error ajustando stock');
    }
  }

  const filtered = proteinas.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));
  const reordenList = proteinas.filter(p => p.activo && p.puntoReorden > 0 && p.stock <= p.puntoReorden);

  return (
    <div>
      <PageHeader
        title="Inventario de Proteínas"
        subtitle="Crear, ajustar y administrar el stock de insumos proteicos"
      />

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">➕ Crear nueva proteína</h3>
          <p className="card-subtitle">El mesero no tiene acceso; solo administradores</p>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div>
            <label>Nombre</label>
            <input className="input" placeholder="Ej: Carnes, Aves, Cerdo, Pescado" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label>Stock inicial</label>
            <input type="number" className="input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
          </div>
          <div>
            <label>Punto de reorden</label>
            <input type="number" className="input" value={form.puntoReorden} onChange={e => setForm(f => ({ ...f, puntoReorden: Number(e.target.value) }))} />
          </div>
          <div>
            <label>Activo</label>
            <select className="input" value={form.activo ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, activo: e.target.value === 'true' }))}>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="btn" onClick={crearProteina}>Crear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">📦 Inventario actual</h3>
            <p className="card-subtitle">Busca, ajusta y activa/desactiva insumos</p>
          </div>
          <div>
            <input className="input" placeholder="Buscar por nombre" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          {reordenList.length > 0 && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Bases en punto de reorden</div>
              <div style={{ fontSize: '0.95rem' }}>{reordenList.map(p => p.nombre).join(', ')}</div>
            </div>
          )}
          {loading && <div>Cargando...</div>}
          {error && <div style={{ color: '#ef4444' }}>{error}</div>}
          {!loading && filtered.length === 0 && <div style={{ color: '#6b7280' }}>No hay proteínas aún</div>}
          {!loading && filtered.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Punto reorden</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id}>
                      <td>
                        <input className="input" value={p.nombre} onChange={e => setProteinas(prev => prev.map(x => (x._id === p._id ? { ...x, nombre: e.target.value } : x)))} onBlur={() => actualizarProteina(p._id, { nombre: p.nombre })} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {(p.activo && p.puntoReorden > 0 && p.stock <= p.puntoReorden) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309' }}>
                            <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, -1)}>-1</button>
                            <strong>{p.stock}</strong>
                            <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, +1)}>+1</button>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, background: '#FDE68A', border: '1px solid #F59E0B', fontSize: '0.8rem' }}>Reorden</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, -1)}>-1</button>
                            <strong>{p.stock}</strong>
                            <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, +1)}>+1</button>
                          </div>
                        )}
                      </td>
                      <td>
                        <input type="number" className="input" value={p.puntoReorden} onChange={e => setProteinas(prev => prev.map(x => (x._id === p._id ? { ...x, puntoReorden: Number(e.target.value) } : x)))} onBlur={() => actualizarProteina(p._id, { puntoReorden: p.puntoReorden })} />
                      </td>
                      <td>
                        <select className="input" value={p.activo ? 'true' : 'false'} onChange={e => actualizarProteina(p._id, { activo: e.target.value === 'true' })}>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, -5)}>-5</button>
                          <button className="btn btn-secondary" onClick={() => ajustarStock(p._id, +5)}>+5</button>
                          <CustomAdjust onApply={(delta) => ajustarStock(p._id, delta)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomAdjust({ onApply }: { onApply: (delta: number) => void }) {
  const [delta, setDelta] = useState<number>(0);
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input type="number" className="input" style={{ width: 100 }} value={delta} onChange={e => setDelta(Number(e.target.value))} />
      <button className="btn" onClick={() => onApply(delta)}>Ajustar</button>
    </div>
  );
}