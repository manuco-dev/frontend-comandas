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
  const [acompanamientoInput, setAcompanamientoInput] = useState('');
  const [acompanamientoGeneralInput, setAcompanamientoGeneralInput] = useState('');
  const [acompanamientosGenerales, setAcompanamientosGenerales] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('acompanamientosGenerales');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'Platos Principales',
    proteina: 'Aves',
    tipoPlato: '',
    acompanamientos: [],
    bebida: '',
    disponible: true,
    tiempoPreparacion: 15,
  });

  useEffect(() => {
    try {
      localStorage.setItem('acompanamientosGenerales', JSON.stringify(acompanamientosGenerales));
    } catch {}
  }, [acompanamientosGenerales]);

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

  async function createItem() {
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio || 0),
        categoria: formData.categoria || 'Platos Principales',
        proteina,
        tipoPlato: (formData.tipoPlato || '').trim(),
        acompanamientos: formData.acompanamientos || [],
        bebida: (formData.bebida || '').trim(),
        disponible: formData.disponible ?? true,
        imagen: formData.imagen || '',
        ingredientes: formData.ingredientes || [],
        alergenos: formData.alergenos || [],
        tiempoPreparacion: formData.tiempoPreparacion || 15,
      };
      await axios.post<MenuItem>('/api/menu', payload);
      setShowForm(false);
      setFormData({ nombre: '', descripcion: '', precio: 0, categoria: 'Platos Principales', proteina, tipoPlato: '', acompanamientos: acompanamientosGenerales.slice(), bebida: '', disponible: true, tiempoPreparacion: 15 });
      setFormStep(1);
      setAcompanamientoInput('');
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
            <button
              className="btn"
              onClick={() => {
                setShowForm(true);
                setFormStep(1);
                setFormData({ nombre: '', descripcion: '', precio: 0, categoria: 'Platos Principales', proteina, tipoPlato: '', acompanamientos: acompanamientosGenerales.slice(), bebida: '', disponible: true, tiempoPreparacion: 15 });
                setAcompanamientoInput('');
              }}
            >
              ➕ Nuevo Plato
            </button>
          </div>
        )}
      />

      {/* Tabs de proteína */}
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

      {/* Acompañamientos generales (se aplican por defecto a cada nuevo plato) */}
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

      {/* Se removió el listado de platos y la búsqueda/filtros según solicitud */}

      {/* Formulario de creación con pasos: 1) Proteína, 2) Detalles + acompañantes + bebida */}
      {showForm && (
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
                  <div style={{ gridColumn: '1 / -1', marginBottom: '0.25rem', color: '#6b7280' }}>
                    Sugeridos: {acompanamientosGenerales.length ? acompanamientosGenerales.join(', ') : '—'}
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
                    <label>Descripción</label>
                    <textarea className="input" value={formData.descripcion || ''} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} />
                  </div>
                  <div>
                    <label>Categoría</label>
                    <select className="input" value={formData.categoria || 'Platos Principales'} onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}>
                      <option>Entradas</option>
                      <option>Platos Principales</option>
                      <option>Postres</option>
                      <option>Bebidas</option>
                      <option>Especiales</option>
                    </select>
                  </div>
                  <div>
                    <label>Tipo de plato</label>
                    <input className="input" value={formData.tipoPlato || ''} onChange={(e) => setFormData(prev => ({ ...prev, tipoPlato: e.target.value }))} placeholder="Ej: Pechuga asada, Pechuga gratinada" />
                  </div>

                  {/* Acompañamientos */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Acompañamientos</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        className="input"
                        placeholder="Ej: Papas a la francesa"
                        value={acompanamientoInput}
                        onChange={(e) => setAcompanamientoInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && acompanamientoInput.trim()) {
                            setFormData(prev => ({ ...prev, acompanamientos: [...(prev.acompanamientos || []), acompanamientoInput.trim()] }));
                            setAcompanamientoInput('');
                          }
                        }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          if (acompanamientoInput.trim()) {
                            setFormData(prev => ({ ...prev, acompanamientos: [...(prev.acompanamientos || []), acompanamientoInput.trim()] }));
                            setAcompanamientoInput('');
                          }
                        }}
                      >
                        Agregar
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(formData.acompanamientos || []).map((acomp, idx) => (
                        <span key={idx} className="tag">
                          {acomp}
                          <button
                            className="tag-close"
                            onClick={() => setFormData(prev => ({ ...prev, acompanamientos: (prev.acompanamientos || []).filter(a => a !== acomp) }))}
                            aria-label={`Eliminar ${acomp}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(formData.acompanamientos || []).length === 0 && (
                        <span style={{ color: '#6b7280' }}>Sin acompañamientos aún</span>
                      )}
                    </div>
                  </div>

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