import { useEffect, useState } from 'react';
import axios from 'axios';
import type { MenuItem } from '../types';
import PageHeader from '../components/PageHeader';

const PROTEINAS = ['Carnes', 'Aves', 'Cerdo', 'Pescado'] as const;

type Proteina = typeof PROTEINAS[number];

export default function MenuManagementPage() {
  const [proteina, setProteina] = useState<Proteina>('Aves');
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [acompanamientoGeneralInput, setAcompanamientoGeneralInput] = useState('');
  const [activeTab, setActiveTab] = useState<'acomps' | 'nuevo' | 'listado' | 'editar'>('acomps');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSearch, setItemsSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  // Subida de imagen se gestiona exclusivamente en la sección "Imágenes de Platos"
  const [acompanamientosGenerales, setAcompanamientosGenerales] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'Platos Principales',
    proteina: 'Aves',
    acompanamientos: [],
    bebida: '',
    disponible: true,
    tiempoPreparacion: 15,
  });

  // Eliminado almacenamiento local: los acompañamientos generales solo provienen de la API

  // Cargar acompañamientos generales desde API al montar
  useEffect(() => {
    async function loadGeneralAcomps() {
      try {
        const { data } = await axios.get('/api/menu/acompanamientos-generales');
        const list = Array.isArray(data?.acompanamientos) ? data.acompanamientos : [];
        if (list.length > 0) {
          setAcompanamientosGenerales(list);
        }
      } catch (err) {
        // Silencioso: si no existe en backend, seguimos con localStorage
      }
    }
    loadGeneralAcomps();
  }, []);

  // Cargar listado de platos
  async function loadItems() {
    setItemsLoading(true);
    try {
      const { data } = await axios.get<MenuItem[]>('/api/menu');
      setItems(data);
    } catch (e) {
      // noop
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'listado' || activeTab === 'editar') {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function createItem() {
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio || 0),
        categoria: formData.categoria || 'Platos Principales',
        proteina,
        acompanamientos: formData.acompanamientos || [],
        bebida: (formData.bebida || '').trim(),
        disponible: formData.disponible ?? true,
        // La imagen se gestiona desde la sección "Imágenes de Platos"
        ingredientes: formData.ingredientes || [],
        alergenos: formData.alergenos || [],
        tiempoPreparacion: formData.tiempoPreparacion || 15,
      };
      await axios.post<MenuItem>('/api/menu', payload);
      setShowForm(false);
      setFormData({ nombre: '', descripcion: '', precio: 0, categoria: 'Platos Principales', proteina, acompanamientos: [], bebida: '', disponible: true, tiempoPreparacion: 15 });
      setFormStep(1);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error creando el item');
    }
  }

  return (
    <div>
      <PageHeader
        title="Gestión de Menú"
        subtitle="Organiza los platos por tipo de proteína y presentación"
        right={(
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" onClick={() => setActiveTab('acomps')}>⚙️ Acompañamientos</button>
            <button
              className="btn"
              onClick={() => {
                setActiveTab('nuevo');
                setShowForm(true);
                setFormStep(1);
                setFormData({ nombre: '', descripcion: '', precio: 0, categoria: 'Platos Principales', proteina, acompanamientos: [], bebida: '', disponible: true, tiempoPreparacion: 15 });
              }}
            >
              ➕ Nuevo Plato
            </button>
            <button className="btn" onClick={() => setActiveTab('listado')}>🗂️ Listado y eliminar</button>
            <button className="btn" onClick={() => setActiveTab('editar')}>✏️ Editar plato</button>
          </div>
        )}
      />

      {/* Tabs de proteína para secciones que lo usan */}
      {(activeTab === 'nuevo' || activeTab === 'listado' || activeTab === 'editar') && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {PROTEINAS.map(p => (
            <button
              key={p}
              className="btn"
              onClick={() => setProteina(p)}
              style={{
                background: proteina === p ? 'linear-gradient(135deg, #667eea, #764ba2)' : undefined
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'acomps' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <h3 className="card-title">Acompañamientos generales</h3>
            <p className="card-subtitle">Se propondrán automáticamente al crear cada plato</p>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                className="input"
                placeholder="Ej: Arroz, Ensalada, Papas a la francesa"
                value={acompanamientoGeneralInput}
                onChange={(e) => setAcompanamientoGeneralInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && acompanamientoGeneralInput.trim()) {
                    setAcompanamientosGenerales(prev => [...prev, acompanamientoGeneralInput.trim()]);
                    setAcompanamientoGeneralInput('');
                  }
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (acompanamientoGeneralInput.trim()) {
                    setAcompanamientosGenerales(prev => [...prev, acompanamientoGeneralInput.trim()]);
                    setAcompanamientoGeneralInput('');
                  }
                }}
              >
                Agregar
              </button>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  const confirmClear = window.confirm('¿Vaciar la lista de acompañamientos generales?');
                  if (!confirmClear) return;
                  try {
                    const payload = { acompanamientos: [] };
                    const { data } = await axios.put('/api/menu/acompanamientos-generales', payload, { baseURL: '' });
                    const list = Array.isArray(data?.acompanamientos) ? data.acompanamientos : [];
                    setAcompanamientosGenerales(list);
                  } catch (err) {
                    console.error('Error al vaciar acompañamientos generales', err);
                    alert('Error al vaciar acompañamientos generales');
                  }
                }}
              >
                Vaciar lista
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const payload = { acompanamientos: acompanamientosGenerales };
                    const { data } = await axios.put('/api/menu/acompanamientos-generales', payload);
                    const list = Array.isArray(data?.acompanamientos) ? data.acompanamientos : [];
                    setAcompanamientosGenerales(list);
                  } catch (err) {
                    alert('Error guardando acompañamientos generales');
                  }
                }}
              >
                Guardar cambios
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {acompanamientosGenerales.map((acomp, idx) => (
                <span key={idx} className="tag">
                  {acomp}
                  <button
                    className="tag-close"
                    onClick={() => setAcompanamientosGenerales(prev => prev.filter(a => a !== acomp))}
                    aria-label={`Eliminar ${acomp}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {acompanamientosGenerales.length === 0 && (
                <span style={{ color: '#6b7280' }}>Sin acompañamientos generales aún</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listado y eliminar */}
      {activeTab === 'listado' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Listado de platos</h3>
            <p className="card-subtitle">Busca, filtra por proteína y elimina si es necesario</p>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                className="input"
                placeholder="Buscar por nombre o descripción..."
                value={itemsSearch}
                onChange={(e) => setItemsSearch(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={loadItems} disabled={itemsLoading}>
                {itemsLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {items
                .filter(it => proteina === 'Carnes' || proteina === 'Aves' || proteina === 'Cerdo' || proteina === 'Pescado' ? (it.proteina ? it.proteina === proteina : true) : true)
                .filter(it => it.nombre.toLowerCase().includes(itemsSearch.toLowerCase()) || (it.descripcion || '').toLowerCase().includes(itemsSearch.toLowerCase()))
                .slice()
                .sort((a, b) => {
                  const da = (a as any)?.createdAt ? new Date((a as any).createdAt).getTime() : (a as any)?.fechaCreacion ? new Date((a as any).fechaCreacion).getTime() : 0;
                  const db = (b as any)?.createdAt ? new Date((b as any).createdAt).getTime() : (b as any)?.fechaCreacion ? new Date((b as any).fechaCreacion).getTime() : 0;
                  return db - da; // más reciente primero
                })
                .map(it => (
                  <div key={it._id} className="card" style={{ border: '1px solid #e5e7eb' }}>
                    <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{it.nombre}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{it.categoria}{it.proteina ? ` · ${it.proteina}` : ''}</div>
                        <div style={{ color: '#10b981', fontWeight: 700 }}>${it.precio.toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => { setEditingItem(it); setActiveTab('editar'); setEditForm(it); }}>Editar</button>
                        <button className="btn btn-secondary" onClick={async () => {
                          if (!confirm(`¿Eliminar "${it.nombre}"?`)) return;
                          try {
                            await axios.delete(`/api/menu/${it._id}`);
                            setItems(prev => prev.filter(x => x._id !== it._id));
                          } catch (e: any) {
                            alert(e?.response?.data?.error || 'Error eliminando plato');
                          }
                        }}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {items.length === 0 && !itemsLoading && (
              <div style={{ color: '#6b7280' }}>No hay platos cargados</div>
            )}
          </div>
        </div>
      )}

      {/* Edición */}
      {activeTab === 'editar' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Editar plato</h3>
            <p className="card-subtitle">Selecciona un plato y actualiza sus datos</p>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {/* Selector de plato */}
            <div>
              <label>Plato</label>
              <select
                className="input"
                value={editingItem?._id || ''}
                onChange={(e) => {
                  const it = items.find(x => x._id === e.target.value) || null;
                  setEditingItem(it);
                  if (it) setEditForm(it);
                }}
              >
                <option value="">Selecciona un plato…</option>
                {items.map(it => (
                  <option key={it._id} value={it._id}>{it.nombre} · {it.categoria}{it.proteina ? ` · ${it.proteina}` : ''}</option>
                ))}
              </select>
            </div>

            {editingItem && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label>Nombre</label>
                  <input className="input" value={editForm.nombre || ''} onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))} />
                </div>
                <div>
                  <label>Precio</label>
                  <input className="input" type="number" value={Number(editForm.precio || 0)} onChange={(e) => setEditForm(prev => ({ ...prev, precio: Number(e.target.value) }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción (opcional)</label>
                  <textarea className="input" value={editForm.descripcion || ''} onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))} />
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Úsala para ingredientes, presentación o notas del plato. Opcional.
                  </div>
                </div>
                <div>
                  <label>Categoría</label>
                  <select className="input" value={editForm.categoria || 'Platos Principales'} onChange={(e) => setEditForm(prev => ({ ...prev, categoria: e.target.value }))}>
                    <option>Entradas</option>
                    <option>Platos Principales</option>
                    <option>Postres</option>
                    <option>Bebidas</option>
                    <option>Especiales</option>
                  </select>
                </div>
                <div>
                  <label>Proteína</label>
                  <select className="input" value={editForm.proteina || ''} onChange={(e) => setEditForm(prev => ({ ...prev, proteina: e.target.value as Proteina }))}>
                    <option value="">(ninguna)</option>
                    {PROTEINAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label>Tipo de plato</label>
                  <input className="input" value={editForm.tipoPlato || ''} onChange={(e) => setEditForm(prev => ({ ...prev, tipoPlato: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Bebida</label>
                  <input className="input" value={editForm.bebida || ''} onChange={(e) => setEditForm(prev => ({ ...prev, bebida: e.target.value }))} />
                </div>
                <div>
                  <label>Tiempo de preparación (min)</label>
                  <input className="input" type="number" value={Number(editForm.tiempoPreparacion || 15)} onChange={(e) => setEditForm(prev => ({ ...prev, tiempoPreparacion: Number(e.target.value) }))} />
                </div>
                <div>
                  <label>Disponible</label>
                  <select className="input" value={editForm.disponible ? 'true' : 'false'} onChange={(e) => setEditForm(prev => ({ ...prev, disponible: e.target.value === 'true' }))}>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => { setEditingItem(null); setEditForm({}); }}>Limpiar</button>
            <button
              className="btn"
              disabled={!editingItem}
              onClick={async () => {
                if (!editingItem) return;
                try {
                  const payload = {
                    nombre: editForm.nombre,
                    descripcion: editForm.descripcion,
                    precio: Number(editForm.precio || 0),
                    categoria: editForm.categoria || 'Platos Principales',
                    proteina: editForm.proteina,
                    tipoPlato: (editForm.tipoPlato || '').trim(),
                    acompanamientos: editForm.acompanamientos || [],
                    bebida: (editForm.bebida || '').trim(),
                    disponible: editForm.disponible ?? true,
                    ingredientes: editForm.ingredientes || [],
                    alergenos: editForm.alergenos || [],
                    tiempoPreparacion: editForm.tiempoPreparacion || 15,
                  };
                  const { data } = await axios.put(`/api/menu/${editingItem._id}`, payload);
                  // actualizar listado
                  setItems(prev => prev.map(it => it._id === editingItem._id ? data : it));
                  alert('Plato actualizado correctamente');
                } catch (err: any) {
                  alert(err?.response?.data?.error || 'Error actualizando el item');
                }
              }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Formulario de creación con pasos: 1) Proteína, 2) Detalles + acompañantes + bebida */}
      {activeTab === 'nuevo' && showForm && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Nuevo plato ({proteina})</h3>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cerrar</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              {formStep === 1 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Paso 1: Selecciona la proteína</h3>
                    <p className="card-subtitle">Elige la proteína principal del plato</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {PROTEINAS.map(p => (
                      <button
                        key={p}
                        className="btn"
                        onClick={() => setProteina(p)}
                        style={{ background: proteina === p ? 'linear-gradient(135deg, #667eea, #764ba2)' : undefined }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button className="btn" onClick={() => setFormStep(2)}>Continuar</button>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ gridColumn: '1 / -1', opacity: 0.8 }}>
                    Proteína seleccionada: <strong>{proteina}</strong>
                  </div>
                  <div>
                    <label>Nombre</label>
                    <input className="input" value={formData.nombre || ''} onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))} />
                  </div>
                  <div>
                    <label>Precio</label>
                    <input className="input" type="number" value={formData.precio as number} onChange={(e) => setFormData(prev => ({ ...prev, precio: Number(e.target.value) }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción (opcional)</label>
                    <textarea className="input" value={formData.descripcion || ''} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} />
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Úsala para ingredientes, presentación o notas del plato. Opcional.
                    </div>
                  </div>
                  <div>
                    <label>Categoría</label>
                    <select className="input" value={formData.categoria || 'Platos Principales'} onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}>
                      <option>Entradas</option>
                      <option>Platos Principales</option>
                      <option>Bebidas</option>
                      <option>Especiales</option>
                    </select>
                  </div>
                  {/* Campo "Tipo de plato" eliminado según nueva lógica */}

                  {/* Sección de acompañamientos removida: se gestiona en “⚙️ Acompañamientos” */}

                  {/* Bebida */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Bebida</label>
                    <input
                      className="input"
                      placeholder="Ej: Gaseosa, Jugo natural"
                      value={formData.bebida || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bebida: e.target.value }))}
                    />
                  </div>


                  <div>
                    <label>Tiempo de preparación (min)</label>
                    <input className="input" type="number" value={formData.tiempoPreparacion as number} onChange={(e) => setFormData(prev => ({ ...prev, tiempoPreparacion: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label>Disponible</label>
                    <select className="input" value={formData.disponible ? 'true' : 'false'} onChange={(e) => setFormData(prev => ({ ...prev, disponible: e.target.value === 'true' }))}>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              {formStep === 2 ? (
                <button className="btn" onClick={createItem}>Crear</button>
              ) : (
                <button className="btn" onClick={() => setFormStep(2)}>Continuar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}